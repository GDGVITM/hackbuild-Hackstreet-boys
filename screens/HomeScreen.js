import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Alert, // Make sure Alert is imported
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/common/Card';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../theme';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const StatCard = ({ icon, label, value, color, onPress }) => (
  // The TouchableOpacity is kept for future use, but the onPress is now safe
  <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.8}>
    <LinearGradient
      colors={[color, `${color}DD`]}
      style={styles.statGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.statIconContainer}>
        <Ionicons name={icon} size={24} color={COLORS.surface} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState('User');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserName(userDoc.data().name);
        }
      }
    };
    fetchUserData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // A safe handler for features not yet implemented
  const handleComingSoon = () => {
    Alert.alert("Feature Coming Soon!", "This screen has not been created yet.");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
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

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="trending-up-outline"
            label="Attendance"
            value="85%"
            color={COLORS.success}
            onPress={handleComingSoon} // Safely handles the press
          />
          <StatCard
            icon="school-outline"
            label="GPA"
            value="7.8"
            color={COLORS.primary}
            onPress={handleComingSoon} // Safely handles the press
          />
        </View>

        {/* The "Quick Actions" card has been REMOVED */}

        {/* Today's Schedule */}
        <Card style={styles.scheduleCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Study')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.scheduleItems}>
            <ScheduleItem time="9:00 AM" subject="Physics" room="Lab 201" />
            <ScheduleItem time="11:00 AM" subject="Math Lab" room="Room 105" />
            <ScheduleItem time="2:00 PM" subject="History" room="Hall A" />
          </View>
        </Card>

        {/* Upcoming Deadlines */}
        <Card style={styles.deadlinesCard}>
          <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
          <DeadlineItem
            title="Physics Assignment 2"
            dueDate="Tomorrow"
            priority="high"
          />
          <DeadlineItem
            title="Math Quiz"
            dueDate="3 days"
            priority="medium"
          />
        </Card>

        {/* Progress Tracker */}
        <Card style={styles.progressCard}>
          <Text style={styles.sectionTitle}>Weekly Goals</Text>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Study Hours</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: '75%' }]} />
            </View>
            <Text style={styles.progressText}>15/20 hours</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- (Other components and styles remain the same) ---
const ScheduleItem = ({ time, subject, room }) => (
  <View style={styles.scheduleItem}><Text>{/* ... */}</Text></View>
);
const DeadlineItem = ({ title, dueDate, priority }) => (
  <View style={styles.deadlineItem}><Text>{/* ... */}</Text></View>
);
const styles = StyleSheet.create({
  /* ... existing styles ... */
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.surface, ...SHADOWS.small },
  greeting: { ...TYPOGRAPHY.body2, color: COLORS.textTertiary },
  userName: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, marginTop: 2 },
  notificationButton: { position: 'relative', padding: SPACING.sm },
  notificationBadge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error },
  scrollView: { flex: 1, paddingHorizontal: SPACING.lg },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.lg, marginBottom: SPACING.lg },
  statCard: { flex: 1, marginHorizontal: SPACING.xs / 2, height: 120 },
  statGradient: { flex: 1, borderRadius: 16, padding: SPACING.md, justifyContent: 'space-between' },
  statIconContainer: { alignSelf: 'flex-end' },
  statValue: { ...TYPOGRAPHY.h2, color: COLORS.surface, fontWeight: '700' },
  statLabel: { ...TYPOGRAPHY.body2, color: COLORS.surface, opacity: 0.9 },
  sectionTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary, marginBottom: SPACING.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  viewAllText: { ...TYPOGRAPHY.body2, color: COLORS.primary, fontWeight: '600' },
  scheduleCard: { marginBottom: SPACING.lg },
  scheduleItems: { gap: SPACING.sm },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm },
  deadlinesCard: { marginBottom: SPACING.lg },
  deadlineItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  progressCard: { marginBottom: SPACING.xl },
  progressItem: { marginBottom: SPACING.md },
  progressLabel: { ...TYPOGRAPHY.body1, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  progressBarContainer: { height: 8, backgroundColor: COLORS.borderLight, borderRadius: 4, overflow: 'hidden', marginBottom: SPACING.xs },
  progressBar: { height: '100%', backgroundColor: COLORS.success, borderRadius: 4 },
  progressText: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, textAlign: 'right' },
}); 