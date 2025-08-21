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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../theme';

const { width } = Dimensions.get('window');
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

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

export default function StudyScreen() {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(getCurrentDay());
  const currentUser = auth.currentUser;

  function getCurrentDay() {
    const today = new Date().getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return daysOfWeek.includes(dayNames[today]) ? dayNames[today] : 'Monday';
  }

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
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

    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permission Required", "Camera access is needed to scan the timetable.");
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      });

      if (result.canceled) return;

      const asset = result.assets && result.assets[0];
      if (!asset || !asset.base64) {
        Alert.alert("Image Error", "Failed to get image data.");
        return;
      }

      setLoading(true);
      await auth.currentUser.getIdToken(true);

      const performOcr = httpsCallable(functions, 'performOcr');
      const response = await performOcr({ image: asset.base64 });
      
      const { annotations } = response.data;
      if (!annotations || annotations.length === 0) {
        Alert.alert("No Text Found", "The OCR couldn't detect any text.");
        setLoading(false);
        return;
      }
      
      const parsedSchedule = parseTimetableWithCoordinates(annotations);
      if (parsedSchedule.length === 0) {
        Alert.alert("Parsing Failed", "Could not find any valid classes from the image's text.");
      } else {
        await handleSaveSchedule(parsedSchedule);
      }
      
    } catch (error) {
      console.error("An error occurred:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async (dataToSave) => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, 'timetables', currentUser.uid);
      await setDoc(docRef, { schedule: dataToSave });
      Alert.alert("Success", `Timetable updated with ${dataToSave.length} classes!`);
    } catch (error) {
      Alert.alert("Error", "Failed to save timetable.");
    }
  };

  const parseTimetableWithCoordinates = (ocrData) => {
    const finalSchedule = [];
    const timeSlots = {
      '08:30': '08:30 - 09:35', '09:35': '09:35 - 10:40', '11:00': '11:00 - 12:05',
      '12:05': '12:05 - 13:10', '13:10': '13:10 - 14:15', '14:15': '14:15 - 15:20',
    };
    const timeLabels = Object.keys(timeSlots);
    const days = ocrData.filter((d) => daysOfWeek.includes(d.label));
    const times = ocrData.filter((d) => timeLabels.includes(d.label));
    const potentialSubjects = ocrData.filter((d) =>
        d.label.length >= 2 && d.label.length <= 4 &&
        !daysOfWeek.includes(d.label) && !timeLabels.includes(d.label) &&
        !d.label.includes(":") && !d.label.includes("(")
    );
    
    potentialSubjects.forEach((subject) => {
        const subjectYCenter = (subject.box_2d[1] + subject.box_2d[3]) / 2;
        const subjectXCenter = (subject.box_2d[0] + subject.box_2d[2]) / 2;
        
        let matchingTime = null;
        if (times.length > 0) {
            matchingTime = times.reduce((prev, curr) => {
                const prevYCenter = (prev.box_2d[1] + prev.box_2d[3]) / 2;
                const currYCenter = (curr.box_2d[1] + curr.box_2d[3]) / 2;
                return (Math.abs(currYCenter - subjectYCenter) < Math.abs(prevYCenter - subjectYCenter) ? curr : prev);
            });
        }
        
        let matchingDay = null;
        if (days.length > 0) {
            matchingDay = days.reduce((prev, curr) => {
                const prevXCenter = (prev.box_2d[0] + prev.box_2d[2]) / 2;
                const currXCenter = (curr.box_2d[0] + curr.box_2d[2]) / 2;
                return (Math.abs(currXCenter - subjectXCenter) < Math.abs(prevXCenter - subjectXCenter) ? curr : prev);
            });
        }
        
        if (matchingDay && matchingTime) {
            finalSchedule.push({
                day: matchingDay.label,
                time: timeSlots[matchingTime.label],
                subject: subject.label,
                room: 'N/A',
            });
        }
    });
    return Array.from(new Set(finalSchedule.map(JSON.stringify))).map(JSON.parse);
  };

  const getCurrentTimeSlot = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return currentTime;
  };

  const isActiveClass = (timeSlot) => {
    const [startTime] = timeSlot.split(' - ');
    const currentTime = getCurrentTimeSlot();
    return startTime <= currentTime && currentTime < timeSlot.split(' - ')[1];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <LinearGradient
        colors={COLORS.primaryGradient}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Timetable</Text>
            <Text style={styles.headerSubtitle}>Stay organized with your schedule</Text>
          </View>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleScanTimetable}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Day Tabs */}
      <View style={styles.dayTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {daysOfWeek.map((day) => (
            <DayTab
              key={day}
              day={day}
              isSelected={selectedDay === day}
              onPress={() => setSelectedDay(day)}
              hasClasses={schedule[day] && schedule[day].length > 0}
            />
          ))}
        </ScrollView>
      </View>

      {/* Schedule Content */}
      <ScrollView style={styles.scheduleContainer} showsVerticalScrollIndicator={false}>
        {loading && !schedule ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading your schedule...</Text>
          </View>
        ) : (
          <View style={styles.scheduleContent}>
            {schedule[selectedDay] && schedule[selectedDay].length > 0 ? (
              <>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>{selectedDay}</Text>
                  <Text style={styles.classCount}>
                    {schedule[selectedDay].length} {schedule[selectedDay].length === 1 ? 'class' : 'classes'}
                  </Text>
                </View>
                <View style={styles.timeSlots}>
                  {schedule[selectedDay].map((item, index) => (
                    <TimeSlotCard
                      key={index}
                      time={item.time}
                      subject={item.subject}
                      room={item.room}
                      isActive={selectedDay === getCurrentDay() && isActiveClass(item.time)}
                    />
                  ))}
                </View>
              </>
            ) : (
              <Card style={styles.emptyStateCard}>
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={64} color={COLORS.textTertiary} />
                  <Text style={styles.emptyStateTitle}>No Classes Today</Text>
                  <Text style={styles.emptyStateText}>
                    {Object.keys(schedule).length === 0
                      ? 'Scan your timetable to get started'
                      : `No classes scheduled for ${selectedDay}`}
                  </Text>
                  {Object.keys(schedule).length === 0 && (
                    <Button
                      title="Scan Timetable"
                      onPress={handleScanTimetable}
                      style={styles.emptyStateButton}
                      size="small"
                    />
                  )}
                </View>
              </Card>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    paddingBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.surface,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.surface,
    opacity: 0.9,
    marginTop: 4,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  dayTabs: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dayTab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.xs,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 60,
  },
  selectedDayTab: {
    backgroundColor: COLORS.primary,
  },
  dayTabText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  selectedDayTabText: {
    color: COLORS.surface,
  },
  dayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.success,
    marginTop: 4,
  },
  scheduleContainer: {
    flex: 1,
  },
  scheduleContent: {
    padding: SPACING.lg,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  dayTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  classCount: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textTertiary,
  },
  timeSlots: {
    gap: SPACING.md,
  },
  timeSlot: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  activeTimeSlot: {
    borderLeftColor: COLORS.success,
    backgroundColor: `${COLORS.success}10`,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  timeText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '600',
  },
  activeTimeText: {
    color: COLORS.success,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  subjectText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  activeSubjectText: {
    color: COLORS.success,
  },
  roomText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textTertiary,
  },
  activeRoomText: {
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.xxl,
  },
  loadingText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textTertiary,
    marginTop: SPACING.md,
  },
  emptyStateCard: {
    marginTop: SPACING.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyStateButton: {
    marginTop: SPACING.lg,
  },
});