import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  Alert, TextInput, FlatList, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/common/Card';
import { COLORS, TYPOGRAPHY, SPACING } from '../theme';
import { auth, db } from '../firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, setDoc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StatCard = ({ icon, label, value, color, onPress }) => ( 
  <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.8} disabled={!onPress}>
    <LinearGradient colors={[color, `${color}DD`]} style={styles.statGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={styles.statIconContainer}>
        <Ionicons name={icon} size={24} color={COLORS.surface} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  </TouchableOpacity> 
);

const ScheduleItem = ({ time, subject, room }) => ( 
  <View style={styles.scheduleItem}>
    <View style={styles.scheduleTime}>
      <Text style={styles.scheduleTimeText}>{time}</Text>
    </View>
    <View style={styles.scheduleDetails}>
      <Text style={styles.scheduleSubject}>{subject}</Text>
      <Text style={styles.scheduleRoom}>{room}</Text>
    </View>
  </View> 
);

const DeadlineItem = ({ title, dueDate }) => ( 
  <View style={styles.deadlineItem}>
    <View style={styles.deadlineIcon}>
      <Ionicons name="time-outline" size={20} color={COLORS.warning} />
    </View>
    <View style={styles.deadlineContent}>
      <Text style={styles.deadlineTitle}>{title}</Text>
      <Text style={styles.deadlineDue}>Due: {dueDate}</Text>
    </View>
  </View> 
);

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState('User');
  const [gpa, setGpa] = useState('N/A');
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [attendance, setAttendance] = useState({ overall: 'N/A', subjects: {} });
  const [currentLecture, setCurrentLecture] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      checkForCurrentLecture();
    }, 10000);
    return () => clearInterval(interval);
  }, [todaysClasses]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const timetableDocRef = doc(db, 'timetables', currentUser.uid);
    const attendanceDocRef = doc(db, 'attendance', currentUser.uid);

    const unsubUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserName(userData.name || 'User');
            setTasks(userData.tasks || []);
            if (userData.grades && userData.grades.length > 0) {
                const validGrades = userData.grades.filter(g => g.sgpa && !isNaN(parseFloat(g.sgpa)));
                if (validGrades.length > 0) {
                    const totalSgpa = validGrades.reduce((sum, g) => sum + parseFloat(g.sgpa), 0);
                    setGpa((totalSgpa / validGrades.length).toFixed(2));
                } else { setGpa('N/A'); }
            } else { setGpa('N/A'); }
        }
    });
    const unsubTimetable = onSnapshot(timetableDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const today = dayNames[new Date().getDay()];
            const fullSchedule = docSnap.data().schedule || [];
            setTodaysClasses(fullSchedule.filter(item => item.day === today).sort((a, b) => a.time.localeCompare(b.time)));
        }
    });
    const unsubAttendance = onSnapshot(attendanceDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data().subjects || {};
            let totalAttended = 0;
            let totalClasses = 0;
            Object.values(data).forEach(sub => {
                totalAttended += sub.attended;
                totalClasses += sub.total;
            });
            const overallPercentage = totalClasses > 0 ? ((totalAttended / totalClasses) * 100).toFixed(1) + '%' : 'N/A';
            setAttendance({ overall: overallPercentage, subjects: data });
        }
    });

    return () => { unsubUser(); unsubTimetable(); unsubAttendance(); };
  }, []);

  const checkForCurrentLecture = async () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    for (const lecture of todaysClasses) {
      const [startTime, endTime] = lecture.time.split(' - ');
      if (currentTime >= startTime && currentTime <= endTime) {
        const lastPrompted = await AsyncStorage.getItem(`prompted_${lecture.subject}_${startTime}`);
        const todayStr = now.toISOString().split('T')[0];
        if (lastPrompted !== todayStr) {
          setCurrentLecture(lecture);
          setShowAttendanceModal(true);
          await AsyncStorage.setItem(`prompted_${lecture.subject}_${startTime}`, todayStr);
        }
        return;
      }
    }
  };

  const handleMarkAttendance = async (attended) => {
    if (!currentLecture || !auth.currentUser) return;
    
    const subject = currentLecture.subject;
    const attendanceDocRef = doc(db, 'attendance', auth.currentUser.uid);
    
    const docSnap = await getDoc(attendanceDocRef);
    const subjects = docSnap.exists() ? docSnap.data().subjects : {};
    
    const currentAttended = subjects[subject]?.attended || 0;
    const currentTotal = subjects[subject]?.total || 0;

    const newAttended = attended ? currentAttended + 1 : currentAttended;
    const newTotal = currentTotal + 1;

    await setDoc(attendanceDocRef, {
        subjects: { ...subjects, [subject]: { attended: newAttended, total: newTotal } }
    }, { merge: true });

    setShowAttendanceModal(false);
    setCurrentLecture(null);

    if ((newAttended / newTotal) < 0.75) {
      Alert.alert(
        'Attendance Warning',
        `Your attendance for ${subject} is now below 75%! (${((newAttended / newTotal) * 100).toFixed(1)}%)`
      );
    }
  };
  
  const handleAddTask = async () => { 
    if (newTask.trim() === '' || !auth.currentUser) return; 
    const userDocRef = doc(db, 'users', auth.currentUser.uid); 
    const taskToAdd = { id: Date.now().toString(), text: newTask, completed: false }; 
    await updateDoc(userDocRef, { tasks: arrayUnion(taskToAdd) }); 
    setNewTask(''); 
  };

  const handleToggleTask = async (taskToToggle) => { 
    if (!auth.currentUser) return; 
    const userDocRef = doc(db, 'users', auth.currentUser.uid); 
    await updateDoc(userDocRef, { tasks: arrayRemove(taskToToggle) }); 
    await updateDoc(userDocRef, { tasks: arrayUnion({ ...taskToToggle, completed: !taskToToggle.completed }) }); 
  };

  const handleDeleteTask = async (taskToDelete) => { 
    if (!auth.currentUser) return; 
    const userDocRef = doc(db, 'users', auth.currentUser.uid); 
    await updateDoc(userDocRef, { tasks: arrayRemove(taskToDelete) }); 
  };

  const getGreeting = () => { 
    const hour = new Date().getHours(); 
    if (hour < 12) return "Good Morning"; 
    if (hour < 18) return "Good Afternoon"; 
    return "Good Evening"; 
  };
  
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const renderListHeader = () => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <StatCard 
            icon="trending-up-outline" 
            label="Attendance" 
            value={attendance.overall} 
            color={COLORS.success} 
        />
        <StatCard 
            icon="school-outline" 
            label="GPA" 
            value={gpa} 
            color={COLORS.primary} 
            onPress={() => navigation.navigate('Profile')} 
        />
      </View>

      <Card style={styles.scheduleCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Study')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.scheduleItems}>
          {todaysClasses.length > 0 ? (
            todaysClasses.map((item, index) => (
              <ScheduleItem key={index} time={item.time} subject={item.subject} room={item.room} />
            ))
          ) : (
            <Text style={styles.emptyListText}>No classes scheduled for today. Enjoy!</Text>
          )}
        </View>
      </Card>

      <Card style={styles.deadlinesCard}>
        <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
        <DeadlineItem title="Physics Assignment 2" dueDate="Tomorrow" />
        <DeadlineItem title="Math Quiz" dueDate="3 days" />
      </Card>

      <Card style={styles.goalsCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>Weekly Goals</Text>
          <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        
        <View style={styles.progressStats}>
          <Text style={styles.progressText}>{completedTasks} of {totalTasks} tasks completed</Text>
        </View>

        <View style={styles.addTaskContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons name="add-circle-outline" size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
            <TextInput 
              style={styles.taskInput} 
              placeholder="Add a new goal..." 
              placeholderTextColor={COLORS.textTertiary}
              value={newTask} 
              onChangeText={setNewTask} 
              onSubmitEditing={handleAddTask}
              multiline={false}
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
            <Ionicons name="arrow-forward" size={20} color={COLORS.surface} />
          </TouchableOpacity>
        </View>
      </Card>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Modal
        transparent={true}
        visible={showAttendanceModal}
        animationType="fade"
        onRequestClose={() => setShowAttendanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <Text style={styles.modalTitle}>Attendance Check</Text>
            <Text style={styles.modalText}>
              Are you currently in the <Text style={{fontWeight: 'bold'}}>{currentLecture?.subject}</Text> lecture? ({currentLecture?.time})
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.presentButton]} onPress={() => handleMarkAttendance(true)}>
                <Text style={styles.buttonText}>Yes, I'm Here</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.absentButton]} onPress={() => handleMarkAttendance(false)}>
                <Text style={styles.buttonText}>No, I'm Absent</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </Modal>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderListHeader}
        renderItem={({ item }) => (
          <View style={styles.taskItemContainer}>
            <View style={styles.taskItem}>
              <TouchableOpacity onPress={() => handleToggleTask(item)} style={styles.taskCheckbox}>
                <View style={[styles.checkbox, item.completed && styles.checkboxCompleted]}>
                  {item.completed && <Ionicons name="checkmark" size={16} color={COLORS.surface} />}
                </View>
                <Text style={[styles.taskText, item.completed && styles.taskTextCompleted]}>{item.text}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteTask(item)} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          totalTasks === 0 ? (
            <View style={styles.emptyTasksContainer}>
              <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.textTertiary} />
              <Text style={styles.emptyTasksText}>No goals yet</Text>
              <Text style={styles.emptyTasksSubtext}>Add your first weekly goal above to get started!</Text>
            </View>
          ) : null
        }
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: SPACING.md, 
    backgroundColor: 'transparent' 
  },
  greeting: { ...TYPOGRAPHY.body2, color: COLORS.textTertiary },
  userName: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, marginTop: 2 },
  notificationButton: { position: 'relative', padding: SPACING.sm },
  notificationBadge: { 
    position: 'absolute', 
    top: 8, 
    right: 8, 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: COLORS.error 
  },
  scrollView: { flex: 1, paddingHorizontal: SPACING.lg },
  statsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: SPACING.lg, 
    marginBottom: SPACING.lg 
  },
  statCard: { flex: 1, marginHorizontal: SPACING.xs / 2, height: 120 },
  statGradient: { 
    flex: 1, 
    borderRadius: 16, 
    padding: SPACING.md, 
    justifyContent: 'space-between' 
  },
  statIconContainer: { alignSelf: 'flex-end' },
  statValue: { ...TYPOGRAPHY.h2, color: COLORS.surface, fontWeight: '700' },
  statLabel: { ...TYPOGRAPHY.body2, color: COLORS.surface, opacity: 0.9 },
  sectionTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary, marginBottom: SPACING.md },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: SPACING.md 
  },
  viewAllText: { ...TYPOGRAPHY.body2, color: COLORS.primary, fontWeight: '600' },
  scheduleCard: { marginBottom: SPACING.lg },
  scheduleItems: { gap: SPACING.sm },
  scheduleItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: SPACING.sm 
  },
  scheduleTime: { width: 80 },
  scheduleTimeText: { ...TYPOGRAPHY.body2, color: COLORS.primary, fontWeight: '600' },
  scheduleDetails: { flex: 1, paddingHorizontal: SPACING.md },
  scheduleSubject: { ...TYPOGRAPHY.body1, color: COLORS.textPrimary, fontWeight: '600' },
  scheduleRoom: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, marginTop: 2 },
  deadlinesCard: { marginBottom: SPACING.lg },
  deadlineItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: SPACING.sm, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.borderLight 
  },
  deadlineIcon: { marginRight: SPACING.sm },
  deadlineContent: { flex: 1 },
  deadlineTitle: { ...TYPOGRAPHY.body1, color: COLORS.textPrimary, fontWeight: '500' },
  deadlineDue: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, marginTop: 2 },
  goalsCard: { marginBottom: SPACING.lg },
  progressPercentage: { 
    ...TYPOGRAPHY.h4, 
    color: COLORS.primary, 
    fontWeight: '700' 
  },
  progressBarContainer: { 
    height: 12, 
    backgroundColor: COLORS.borderLight, 
    borderRadius: 6, 
    overflow: 'hidden', 
    marginBottom: SPACING.sm 
  },
  progressBar: { 
    height: '100%', 
    backgroundColor: COLORS.success, 
    borderRadius: 6,
    minWidth: 8
  },
  progressStats: { marginBottom: SPACING.md },
  progressText: { 
    ...TYPOGRAPHY.body2, 
    color: COLORS.textSecondary, 
    textAlign: 'center' 
  },
  addTaskContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginTop: SPACING.sm
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm,
  },
  inputIcon: { marginRight: SPACING.xs },
  taskInput: { 
    flex: 1,
    paddingVertical: SPACING.md, 
    ...TYPOGRAPHY.body1,
    color: COLORS.textPrimary
  },
  addButton: { 
    backgroundColor: COLORS.primary, 
    borderRadius: 12, 
    padding: SPACING.md, 
    justifyContent: 'center', 
    alignItems: 'center',
    minWidth: 48
  },
  taskItemContainer: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm
  },
  taskItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight
  },
  taskCheckbox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm
  },
  checkboxCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success
  },
  taskText: { 
    ...TYPOGRAPHY.body1, 
    color: COLORS.textPrimary, 
    flex: 1
  },
  taskTextCompleted: { 
    textDecorationLine: 'line-through', 
    color: COLORS.textTertiary 
  },
  deleteButton: {
    padding: SPACING.xs,
    borderRadius: 8
  },
  emptyListText: { 
    textAlign: 'center', 
    color: COLORS.textTertiary, 
    marginVertical: SPACING.md 
  },
  emptyTasksContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginHorizontal: SPACING.lg
  },
  emptyTasksText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs
  },
  emptyTasksSubtext: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textTertiary,
    textAlign: 'center'
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: SPACING.lg 
  },
  modalContent: { width: '100%', padding: SPACING.lg },
  modalTitle: { ...TYPOGRAPHY.h3, textAlign: 'center', marginBottom: SPACING.sm },
  modalText: { 
    ...TYPOGRAPHY.body1, 
    textAlign: 'center', 
    color: COLORS.textSecondary, 
    marginBottom: SPACING.xl, 
    lineHeight: 22 
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { 
    flex: 1, 
    paddingVertical: SPACING.md, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  presentButton: { backgroundColor: COLORS.success, marginRight: SPACING.sm },
  absentButton: { backgroundColor: COLORS.error, marginLeft: SPACING.sm },
  buttonText: { ...TYPOGRAPHY.button, color: COLORS.surface },
});