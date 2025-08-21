// screens/HomeScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar } from 'react-native';

// Reusable Card Component
const InfoCard = ({ title, children }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    {children}
  </View>
);

// Reusable Stat Component for the top cards
const Stat = ({ label, value }) => (
    <View style={styles.stat}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Dashboard</Text>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
            <Stat label="Attendance" value="85%" />
            <Stat label="GPA" value="7.8" />
        </View>

        {/* Today's Schedule Card */}
        <InfoCard title="Today's Schedule">
          <Text style={styles.scheduleItem}>9:00 AM - 10:00 AM: Physics</Text>
          <Text style={styles.scheduleItem}>11:00 AM - 12:00 PM: Math Lab</Text>
          <Text style={styles.scheduleItem}>2:00 PM - 3:30 PM: History</Text>
        </InfoCard>

        {/* Upcoming Deadlines Card */}
        <InfoCard title="Upcoming Deadlines">
          <Text style={styles.deadlineItem}>Physics Assignment 2 - Due Tomorrow</Text>
          <Text style={styles.deadlineItem}>Math Quiz - Due in 3 days</Text>
        </InfoCard>

        {/* Progress Tracker Card */}
        <InfoCard title="Weekly Goals">
            <Text style={styles.progressLabel}>75% Complete</Text>
            <View style={styles.progressBarBackground}>
                <View style={styles.progressBarFill} />
            </View>
        </InfoCard>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    paddingTop: StatusBar.currentHeight || 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 20,
    color: '#1c1c1e',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  stat: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 16,
    color: '#8e8e93',
    marginTop: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1c1c1e',
  },
  scheduleItem: {
    fontSize: 16,
    marginBottom: 8,
    color: '#3c3c43',
  },
  deadlineItem: {
    fontSize: 16,
    marginBottom: 8,
    color: '#3c3c43',
  },
  progressLabel: {
    fontSize: 16,
    textAlign: 'right',
    color: '#8e8e93',
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#e5e5ea',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    width: '75%',
    backgroundColor: '#34c759', // A positive green color
    borderRadius: 5,
  },
});
