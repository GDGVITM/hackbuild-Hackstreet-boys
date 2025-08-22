import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../theme';

// --- IMPORTANT: Add your Google Cloud Vision API Key here ---
const GOOGLE_CLOUD_VISION_API_KEY = 'AIzaSyD5mp7MVxsCpfO_lalbon-aECRdAapdWlI';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// --- Existing Timetable Components (No Changes) ---
const TimeSlotCard = ({ time, subject, room, isActive }) => (
  <View style={[styles.timeSlot, isActive && styles.activeTimeSlot]}>
    <View style={styles.timeSlotHeader}>
      <Text style={[styles.timeText, isActive && styles.activeTimeText]}>{time}</Text>
      {isActive && <View style={styles.liveIndicator} />}
    </View>
    <Text style={[styles.subjectText, isActive && styles.activeSubjectText]}>{subject}</Text>
    <Text style={[styles.roomText, isActive && styles.activeRoomText]}>Room: {room}</Text>
  </View>
);

const DayTab = ({ day, isSelected, onPress, hasClasses }) => (
  <TouchableOpacity
    style={[styles.dayTab, isSelected && styles.selectedDayTab]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={[styles.dayTabText, isSelected && styles.selectedDayTabText]}>
      {day.slice(0, 3)}
    </Text>
    {hasClasses && <View style={styles.dayIndicator} />}
  </TouchableOpacity>
);

// --- QuizCard Component ---
const QuizCard = ({ quiz, onStart }) => (
    <Card style={styles.quizCard}>
        <View style={styles.quizIconContainer}>
            <Ionicons name={quiz.icon} size={28} color={COLORS.primary} />
        </View>
        <View style={styles.quizDetails}>
            <Text style={styles.quizTitle}>{quiz.title}</Text>
            <Text style={styles.quizSubject}>{quiz.subject}</Text>
            <View style={styles.quizMeta}>
                <Text style={styles.quizMetaText}>{quiz.questions} Questions</Text>
                <Text style={styles.quizMetaText}>•</Text>
                <Text style={styles.quizMetaText}>{quiz.timeLimit}</Text>
            </View>
        </View>
        <TouchableOpacity style={styles.startQuizButton} onPress={() => onStart(quiz)}>
            <Ionicons name="play-circle-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
    </Card>
);

// --- CourseCard Component ---
const CourseCard = ({ course }) => (
  <Card style={styles.courseCard}>
    <Image source={{ uri: course.image }} style={styles.courseImage} />
    <View style={styles.courseInfo}>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <Text style={styles.courseInstructor}>By {course.instructor}</Text>
        <View style={styles.courseMeta}>
            <View style={styles.courseMetaItem}>
                <Ionicons name="time-outline" size={14} color={COLORS.textTertiary} />
                <Text style={styles.courseMetaText}>{course.duration}</Text>
            </View>
            <View style={styles.courseMetaItem}>
                <Ionicons name="star-outline" size={14} color={COLORS.textTertiary} />
                <Text style={styles.courseMetaText}>{course.rating} ({course.students} students)</Text>
            </View>
        </View>
    </View>
  </Card>
);


export default function StudyScreen() {
  const navigation = useNavigation();
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(getCurrentDay());
  const [isConfirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [editableTimetableText, setEditableTimetableText] = useState('');
  const [selectedTab, setSelectedTab] = useState('timetable');
  const currentUser = auth.currentUser;

  // --- Mock Data ---
  const mockQuizzes = [
    { id: 1, title: 'Calculus I Basics', subject: 'Mathematics', questions: 5, timeLimit: '10 mins', icon: 'calculator-outline' },
    { id: 2, title: 'Data Structures Intro', subject: 'Computer Science', questions: 5, timeLimit: '10 mins', icon: 'code-slash-outline' },
    { id: 3, title: 'Laws of Motion', subject: 'Physics', questions: 5, timeLimit: '10 mins', icon: 'flame-outline' },
    { id: 4, title: 'Periodic Table Basics', subject: 'Chemistry', questions: 5, timeLimit: '10 mins', icon: 'flask-outline' },
  ];

  const mockCourses = [
    { id: 1, title: 'Introduction to Python', instructor: 'Dr. Alan Grant', duration: '6 Weeks', rating: 4.8, students: '1.2k', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400' },
    { id: 2, title: 'Advanced React Native', instructor: 'Dr. Ellie Sattler', duration: '8 Weeks', rating: 4.9, students: '850', image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400' },
    { id: 3, title: 'Machine Learning A-Z', instructor: 'Dr. Ian Malcolm', duration: '12 Weeks', rating: 4.7, students: '2.5k', image: 'https://images.unsplash.com/photo-1507146426996-321341aa1ac5?w=400' },
  ];

  // --- Existing Functions (No Changes) ---
  function getCurrentDay() {
    const today = new Date().getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return daysOfWeek.includes(dayNames[today]) ? dayNames[today] : 'Monday';
  }

  useEffect(() => {
    if (!currentUser) {
        setLoading(false);
        return;
    };

    const docRef = doc(db, 'timetables', currentUser.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().schedule || [];
        const groupedSchedule = data.reduce((acc, item) => {
          (acc[item.day] = acc[item.day] || []).push(item);
          return acc;
        }, {});
        
        for (const day in groupedSchedule) {
          groupedSchedule[day].sort((a, b) => a.time.localeCompare(b.time));
        }
        setSchedule(groupedSchedule);
      } else {
        setSchedule({});
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching timetable: ", error);
      Alert.alert("Error", "Could not fetch timetable.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleScanTimetable = async () => {
    if (!auth.currentUser) {
      Alert.alert("Authentication Error", "You are not logged in.");
      return;
    }
    if (GOOGLE_CLOUD_VISION_API_KEY === 'YOUR_GOOGLE_CLOUD_VISION_API_KEY') {
        Alert.alert("API Key Missing", "Please add your Google Cloud Vision API key to the code.");
        return;
    }

    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permission Required", "Camera access is needed to scan the timetable.");
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 1, base64: true });
      if (result.canceled) return;

      const asset = result.assets && result.assets[0];
      if (!asset || !asset.base64) {
        Alert.alert("Image Error", "Failed to get image data.");
        return;
      }
      setLoading(true);

      const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`;
      
      const body = {
        requests: [
          {
            image: { content: asset.base64 },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
          },
        ],
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const resultData = await response.json();

      const responseDetails = resultData.responses && resultData.responses[0];
      if (responseDetails && responseDetails.fullTextAnnotation) {
        const rawText = responseDetails.fullTextAnnotation.text;
        setEditableTimetableText(rawText);
        setConfirmationModalVisible(true);
      } else {
        console.error("Google Vision API Error Response:", JSON.stringify(resultData, null, 2));
        const errorMessage = responseDetails?.error?.message || "The OCR couldn't detect any text in the image.";
        Alert.alert("API Error", errorMessage);
      }
      
    } catch (error) {
      console.error("An error occurred during scanning:", error);
      Alert.alert("Error", `An unexpected error occurred: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async (dataToSave) => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const docRef = doc(db, 'timetables', currentUser.uid);
      await setDoc(docRef, { schedule: dataToSave });
      Alert.alert("Success", `Timetable updated with ${dataToSave.length} classes!`);
    } catch (error) {
      console.error("Error saving schedule: ", error);
      Alert.alert("Error", "Failed to save the new timetable.");
    } finally {
        setLoading(false);
    }
  };

  const handleConfirmSchedule = async () => {
    const parsedSchedule = parseTimetableFromText(editableTimetableText);

    if (parsedSchedule.length > 0) {
      await handleSaveSchedule(parsedSchedule);
      setConfirmationModalVisible(false);
      setEditableTimetableText('');
    } else {
      Alert.alert("Parsing Failed", "Could not find any valid classes in the text. Please check the format in the text box and try again.");
    }
  };

  const handleCancelConfirmation = () => {
    setConfirmationModalVisible(false);
    setEditableTimetableText('');
  };

  const parseTimetableFromText = (text) => {
    const lines = text.split('\n').filter(line => line.trim() !== '' && line.toLowerCase() !== 'time');
    const finalSchedule = [];
    const timeRegex = /(\d{2}:\d{2}-\d{2}:\d{2})/;
    const detectedDays = lines.filter(line => daysOfWeek.includes(line.trim()));
    if (detectedDays.length === 0) {
        console.error("Parser Error: No days found in the text.");
        return [];
    }
    const timeSlotIndexes = [];
    lines.forEach((line, index) => {
        if (timeRegex.test(line)) {
            timeSlotIndexes.push({ time: line.trim(), index: index });
        }
    });

    if (timeSlotIndexes.length === 0) {
        console.error("Parser Error: No time slots found in the text.");
        return [];
    }
    timeSlotIndexes.forEach((timeSlotInfo, i) => {
        const startIndex = timeSlotInfo.index + 1;
        const endIndex = (i + 1 < timeSlotIndexes.length) ? timeSlotIndexes[i+1].index : lines.length;
        
        const subjects = lines.slice(startIndex, endIndex)
                              .filter(line => !daysOfWeek.includes(line.trim()) && line.trim().toLowerCase() !== 'lunch');

        subjects.forEach((subject, subjectIndex) => {
            if (subjectIndex < detectedDays.length) {
                const day = detectedDays[subjectIndex];
                finalSchedule.push({
                    day: day,
                    time: timeSlotInfo.time,
                    subject: subject.trim(),
                    room: 'N/A',
                });
            }
        });
    });

    return finalSchedule;
  };


  const getCurrentTimeSlot = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const isActiveClass = (timeSlot) => {
    const [startTime, endTime] = timeSlot.split('-');
    const currentTime = getCurrentTimeSlot();
    return startTime <= currentTime && currentTime < endTime;
  };
  
  const handleStartQuiz = (quiz) => {
    navigation.navigate('Quiz', { quiz: quiz });
  };

  // --- TabButton Component ---
  const TabButton = ({ tab, title, icon }) => (
    <TouchableOpacity
      style={[styles.mainTabButton, selectedTab === tab && styles.activeTabButton]}
      onPress={() => setSelectedTab(tab)}
      activeOpacity={0.8}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={selectedTab === tab ? COLORS.primary : COLORS.textTertiary} 
      />
      <Text style={[styles.mainTabText, selectedTab === tab && styles.activeTabText]}>{title}</Text>
    </TouchableOpacity>
  );

  // --- renderContent Function to handle tabs ---
  const renderContent = () => {
    switch (selectedTab) {
      case 'quiz':
        return (
          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Practice Quizzes</Text>
            <View style={styles.listContainer}>
                {mockQuizzes.map(quiz => (
                    <QuizCard key={quiz.id} quiz={quiz} onStart={handleStartQuiz} />
                ))}
            </View>
          </ScrollView>
        );
      case 'courses':
        return (
          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Recommended Courses</Text>
            <View style={styles.listContainer}>
                {mockCourses.map(course => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </View>
          </ScrollView>
        );
      case 'timetable':
      default:
        return (
          <>
            <View style={styles.dayTabs}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: SPACING.sm}}>
                {daysOfWeek.map((day) => (
                  <DayTab key={day} day={day} isSelected={selectedDay === day} onPress={() => setSelectedDay(day)} hasClasses={schedule[day] && schedule[day].length > 0} />
                ))}
              </ScrollView>
            </View>

            <ScrollView style={styles.scheduleContainer} showsVerticalScrollIndicator={false}>
              {loading ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /><Text style={styles.loadingText}>Loading your schedule...</Text></View>
              ) : (
                <View style={styles.scheduleContent}>
                  {schedule[selectedDay] && schedule[selectedDay].length > 0 ? (
                    <>
                      <View style={styles.dayHeader}><Text style={styles.dayTitle}>{selectedDay}</Text><Text style={styles.classCount}>{schedule[selectedDay].length} {schedule[selectedDay].length === 1 ? 'class' : 'classes'}</Text></View>
                      <View style={styles.timeSlots}>
                        {schedule[selectedDay].map((item, index) => (
                          <TimeSlotCard key={index} time={item.time} subject={item.subject} room={item.room} isActive={selectedDay === getCurrentDay() && isActiveClass(item.time)} />
                        ))}
                      </View>
                    </>
                  ) : (
                    <Card style={styles.emptyStateCard}>
                      <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={64} color={COLORS.textTertiary} />
                        <Text style={styles.emptyStateTitle}>No Classes Yet</Text>
                        <Text style={styles.emptyStateText}>Tap the camera to scan your schedule.</Text>
                      </View>
                    </Card>
                  )}
                </View>
              )}
            </ScrollView>
          </>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Modal
        transparent={true}
        animationType="fade"
        visible={isConfirmationModalVisible}
        onRequestClose={handleCancelConfirmation}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Review & Edit Timetable</Text>
            <Text style={styles.modalSubtitle}>Correct any errors in the text below before saving.</Text>
            
            <ScrollView style={{ flex: 1 }}>
                <TextInput
                  style={styles.textInput}
                  multiline={true}
                  value={editableTimetableText}
                  onChangeText={setEditableTimetableText}
                  autoCapitalize="words"
                />
            </ScrollView>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleCancelConfirmation}>
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleConfirmSchedule}>
                <Text style={styles.modalButtonText}>Confirm & Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <LinearGradient colors={COLORS.primaryGradient} style={styles.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Study Hub</Text>
            <Text style={styles.headerSubtitle}>Plan, practice, and learn</Text>
          </View>
          <TouchableOpacity style={styles.scanButton} onPress={handleScanTimetable} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.primary} /> : <Ionicons name="camera-outline" size={24} color={COLORS.primary} />}
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* --- Main Tabs --- */}
      <View style={styles.mainTabsContainer}>
        <TabButton tab="timetable" title="Timetable" icon="calendar-outline" />
        <TabButton tab="quiz" title="Quizzes" icon="clipboard-outline" />
        <TabButton tab="courses" title="Courses" icon="book-outline" />
      </View>

      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  headerGradient: { paddingBottom: SPACING.xxl, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: Platform.OS === 'android' ? SPACING.xl : SPACING.lg },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.surface, fontWeight: '700' },
  headerSubtitle: { ...TYPOGRAPHY.body2, color: COLORS.surface, opacity: 0.9, marginTop: 4 },
  scanButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium },
  mainTabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: 16,
    padding: SPACING.xs,
    ...SHADOWS.medium,
    marginTop: -SPACING.xl,
    zIndex: 10,
  },
  mainTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.xs,
  },
  activeTabButton: {
    backgroundColor: `${COLORS.primary}1A`,
  },
  mainTabText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.primary,
  },
  dayTabs: { backgroundColor: COLORS.surface, paddingVertical: SPACING.md, marginTop: SPACING.lg, marginHorizontal: SPACING.md, borderRadius: 20, ...SHADOWS.small },
  dayTab: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, marginHorizontal: SPACING.xs, borderRadius: 20, alignItems: 'center', minWidth: 60 },
  selectedDayTab: { backgroundColor: COLORS.primary },
  dayTabText: { ...TYPOGRAPHY.body2, color: COLORS.textSecondary, fontWeight: '600' },
  selectedDayTabText: { color: COLORS.surface },
  dayIndicator: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.primary, marginTop: 4 },
  contentContainer: {
    flex: 1,
    padding: SPACING.lg,
    paddingTop: SPACING.md,
  },
  listContainer: {
    gap: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  scheduleContainer: { flex: 1 },
  scheduleContent: { padding: SPACING.lg, paddingTop: 0 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  dayTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary },
  classCount: { ...TYPOGRAPHY.body2, color: COLORS.textTertiary },
  timeSlots: { gap: SPACING.md },
  timeSlot: { backgroundColor: COLORS.surface, borderRadius: 16, padding: SPACING.lg, borderLeftWidth: 4, borderLeftColor: COLORS.borderLight, ...SHADOWS.small },
  activeTimeSlot: { borderLeftColor: COLORS.success, backgroundColor: `${COLORS.success}1A` },
  timeSlotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  timeText: { ...TYPOGRAPHY.body2, color: COLORS.primary, fontWeight: '600' },
  activeTimeText: { color: COLORS.success },
  liveIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  subjectText: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  activeSubjectText: { color: COLORS.textPrimary, fontWeight: '700' },
  roomText: { ...TYPOGRAPHY.body2, color: COLORS.textTertiary },
  activeRoomText: { color: COLORS.textSecondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: SPACING.xxl * 2 },
  loadingText: { ...TYPOGRAPHY.body1, color: COLORS.textTertiary, marginTop: SPACING.md },
  emptyStateCard: { marginTop: SPACING.xl },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xl, paddingHorizontal: SPACING.lg },
  emptyStateTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  emptyStateText: { ...TYPOGRAPHY.body1, color: COLORS.textTertiary, textAlign: 'center', lineHeight: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.lg,
    ...SHADOWS.large,
    flexGrow: 1,
    display: 'flex', 
    flexDirection: 'column',
  },
  modalTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  modalSubtitle: { ...TYPOGRAPHY.body2, color: COLORS.textTertiary, textAlign: 'center', marginBottom: SPACING.lg },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    ...TYPOGRAPHY.body1,
    color: COLORS.textPrimary,
    minHeight: 200,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  modalButton: { flex: 1, paddingVertical: SPACING.md, borderRadius: 12, alignItems: 'center' },
  confirmButton: { backgroundColor: COLORS.primary },
  cancelButton: { backgroundColor: COLORS.borderLight },
  modalButtonText: { ...TYPOGRAPHY.body1, color: COLORS.surface, fontWeight: '700' },
  cancelButtonText: { color: COLORS.textSecondary },
  quizCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  quizIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}1A`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizDetails: {
    flex: 1,
  },
  quizTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
  },
  quizSubject: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  quizMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  quizMetaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
  startQuizButton: {
    padding: SPACING.sm,
  },
  courseCard: {
    padding: 0,
    overflow: 'hidden',
  },
  courseImage: {
    width: '100%',
    height: 150,
  },
  courseInfo: {
    padding: SPACING.md,
  },
  courseTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  courseInstructor: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  courseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  courseMetaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
});