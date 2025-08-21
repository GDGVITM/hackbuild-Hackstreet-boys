// screens/StudyScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { auth, db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

// Mock data to simulate what your friend's OCR will produce
const mockOcrData = [
  { day: 'Monday', time: '09:00 - 10:00', subject: 'Physics', room: '101' },
  { day: 'Monday', time: '11:00 - 12:00', subject: 'Math Lab', room: 'Lab A' },
  { day: 'Tuesday', time: '10:00 - 11:30', subject: 'History', room: '204' },
  { day: 'Wednesday', time: '09:00 - 10:00', subject: 'Physics', room: '101' },
  { day: 'Wednesday', time: '01:00 - 02:30', subject: 'Chemistry', room: '302' },
  { day: 'Friday', time: '10:00 - 11:30', subject: 'Literature', room: '201' },
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function StudyScreen() {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  // Get today's name to highlight it
  const todayIndex = new Date().getDay();
  const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][todayIndex];

  // Fetch timetable from Firebase in real-time
  useEffect(() => {
    if (!currentUser) return;

    const docRef = doc(db, 'timetables', currentUser.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().schedule || [];
        // Group classes by day and sort them by time
        const groupedSchedule = data.reduce((acc, item) => {
          (acc[item.day] = acc[item.day] || []).push(item);
          return acc;
        }, {});

        // Sort classes within each day
        for (const day in groupedSchedule) {
            groupedSchedule[day].sort((a, b) => a.time.localeCompare(b.time));
        }

        setSchedule(groupedSchedule);
      } else {
        setSchedule({}); // No schedule found
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching timetable: ", error);
      Alert.alert("Error", "Could not fetch timetable.");
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [currentUser]);

  // Function to save timetable data to Firebase
  const handleSaveSchedule = async (dataToSave) => {
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to save a schedule.");
      return;
    }
    try {
      const docRef = doc(db, 'timetables', currentUser.uid);
      await setDoc(docRef, { schedule: dataToSave });
      Alert.alert("Success", "Timetable saved!");
    } catch (error) {
      console.error("Error saving timetable: ", error);
      Alert.alert("Error", "Failed to save timetable.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Timetable</Text>
        <TouchableOpacity 
          style={styles.scanButton} 
          onPress={() => handleSaveSchedule(mockOcrData)}
        >
          <Ionicons name="camera-outline" size={20} color="#fff" />
          <Text style={styles.scanButtonText}>Scan New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scheduleContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
        ) : (
          daysOfWeek.map(day => {
            const dayClasses = schedule[day] || [];
            const isToday = day === todayName;

            return (
              <View key={day} style={styles.daySection}>
                <Text style={[styles.dayHeader, isToday && styles.todayHeader]}>
                  {day}
                </Text>
                {dayClasses.length > 0 ? (
                  dayClasses.map((item, index) => (
                    <View key={index} style={styles.classCard}>
                      <Text style={styles.classTime}>{item.time}</Text>
                      <Text style={styles.classSubject}>{item.subject}</Text>
                      <Text style={styles.classRoom}>Room: {item.room}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.noClassesCard}>
                    <Text style={styles.noClassesText}>No classes scheduled.</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scheduleContainer: {
    flex: 1,
  },
  daySection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  dayHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#3c3c43',
  },
  todayHeader: {
    color: '#007AFF', // Highlight color for the current day
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  classTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  classSubject: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 5,
  },
  classRoom: {
    fontSize: 16,
    color: '#8e8e93',
  },
  noClassesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  noClassesText: {
    fontSize: 16,
    color: '#8e8e93',
  },
});
