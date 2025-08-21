import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, 
  TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform 
} from 'react-native';
import { auth, db, functions } from '../firebase'; 
import { httpsCallable } from 'firebase/functions';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Days of the week
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function StudyScreen() {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  const todayIndex = new Date().getDay();
  const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][todayIndex];

  // Fetch timetable from Firebase (No changes here)
  useEffect(() => {
    if (!currentUser) return;
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

  // Save timetable to Firebase (No changes here)
  const handleSaveSchedule = async (dataToSave) => {
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to save a schedule.");
      return;
    }
    try {
      const docRef = doc(db, 'timetables', currentUser.uid);
      await setDoc(docRef, { schedule: dataToSave });
      Alert.alert("Success", "Timetable updated!");
    } catch (error) {
      console.error("Error saving timetable: ", error);
      Alert.alert("Error", "Failed to save timetable.");
    }
  };

  // --- NEW, SMARTER SCAN AND PARSE FUNCTION ---
  const handleScanTimetable = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permission required", "Camera access is needed.");
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true, 
      });

      if (result.cancelled || !result.base64) return;
      
      setLoading(true);

      // 1. Call the cloud function to get the raw text
      const performOcr = httpsCallable(functions, 'performOcr');
      const response = await performOcr({ image: result.base64 });
      const { text } = response.data;
      
      // This is a great debugging tool to see what the OCR returns
      console.log("--- Raw OCR Text --- \n", text);

      if (!text) {
          Alert.alert("No Text Found", "The OCR couldn't detect any text in the image.");
          setLoading(false);
          return;
      }
      
      // 2. A more robust parsing logic for the grid timetable
      const parsedSchedule = parseGridTimetable(text);

      if (parsedSchedule.length === 0) {
          Alert.alert("Parsing Failed", "Could not recognize the timetable structure. Please try again with a clearer picture.");
      } else {
          await handleSaveSchedule(parsedSchedule);
      }
      
    } catch (error) {
      console.error("Error scanning timetable: ", error);
      Alert.alert("Error", `Failed to scan timetable. ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // --- HELPER FUNCTION TO PARSE THE GRID ---
  const parseGridTimetable = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const schedule = [];

    // Define the time slots from your timetable
    const timeSlots = {
      '08:30': '08:30 - 09:35',
      '09:35': '09:35 - 10:40',
      '11:00': '11:00 - 12:05',
      '12:05': '12:05 - 13:10', // Simplified for Y1/Y2 lunch, adjust if needed
      '13:10': '13:10 - 14:15',
      '14:15': '14:15 - 15:20',
      '12:45': '12:45 - 13:50', // Special Friday slots
      '13:50': '13:50 - 14:55',
    };

    let dayHeaders = [];
    
    // Find the line with the days of the week to map columns
    const headerLineIndex = lines.findIndex(line => daysOfWeek.some(day => line.includes(day)));
    if (headerLineIndex !== -1) {
        // Find which days are present in the header line
        dayHeaders = daysOfWeek.filter(day => lines[headerLineIndex].includes(day));
    } else {
        return []; // Cannot proceed without day headers
    }
    
    lines.forEach(line => {
        const words = line.split(/\s+/);
        const time = words[0]; // Assume the first word is the time

        if (timeSlots[time]) {
            const subjects = words.slice(1);
            subjects.forEach((subject, index) => {
                // Check if the subject is not a known break/lunch item
                const isClass = !['Break', 'Lunch', 'Activities'].some(b => subject.toLowerCase().includes(b.toLowerCase()));
                if (isClass && index < dayHeaders.length) {
                    schedule.push({
                        day: dayHeaders[index],
                        time: timeSlots[time],
                        subject: subject,
                        room: 'N/A', // Room info isn't in this timetable format
                    });
                }
            });
        } else {
             // Handle special cases on Friday
            if (line.includes('A4')) schedule.push({ day: 'Friday', time: timeSlots['12:45'], subject: 'A4', room: 'N/A' });
            if (line.includes('B4')) schedule.push({ day: 'Friday', time: timeSlots['13:50'], subject: 'B4', room: 'N/A' });
        }
    });

    return schedule;
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Timetable</Text>
        <TouchableOpacity 
          style={styles.scanButton} 
          onPress={handleScanTimetable}
          disabled={loading}
        >
          <Ionicons name="camera-outline" size={20} color="#fff" />
          <Text style={styles.scanButtonText}>Scan New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scheduleContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
        ) : (
          Object.keys(schedule).length > 0 ? daysOfWeek.map(day => {
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
          : (
            <View style={styles.noClassesCard}><Text style={styles.noClassesText}>No timetable found. Scan one to get started!</Text></View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e5ea' },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  scanButton: { flexDirection: 'row', backgroundColor: '#007AFF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  scanButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  scheduleContainer: { flex: 1 },
  daySection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  dayHeader: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#3c3c43' },
  todayHeader: { color: '#007AFF' },
  classCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  classTime: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  classSubject: { fontSize: 20, fontWeight: '600', marginVertical: 5 },
  classRoom: { fontSize: 16, color: '#8e8e93' },
  noClassesCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center', margin: 20 },
  noClassesText: { fontSize: 16, color: '#8e8e93' },
});