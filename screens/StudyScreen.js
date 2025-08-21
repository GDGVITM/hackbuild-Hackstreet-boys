import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { auth, db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function StudyScreen() {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(false);
  const currentUser = auth.currentUser;

  const todayIndex = new Date().getDay();
  const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][todayIndex];

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

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

  const handleSaveSchedule = async (dataToSave) => {
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to save a schedule.");
      return;
    }
    try {
      const docRef = doc(db, 'timetables', currentUser.uid);
      await setDoc(docRef, { schedule: dataToSave });
      Alert.alert("Success", `Timetable updated with ${dataToSave.length} classes!`);
    } catch (error) {
      console.error("Error saving timetable: ", error);
      Alert.alert("Error", "Failed to save timetable.");
    }
  };

  const handleScanTimetable = async () => {
    if (!auth.currentUser) {
      Alert.alert("Authentication Error", "You are not logged in. Please restart the app or log in again.");
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

      console.log("Image Picker Result:", JSON.stringify(result, null, 2));

      if (result.canceled) {
        console.log("User cancelled image picker.");
        return;
      }

      const asset = result.assets && result.assets[0];
      if (!asset || !asset.base64) {
        Alert.alert(
          "Image Error",
          "Failed to get image data after taking the photo. This might be a device memory issue. Please try again.",
        );
        return;
      }

      setLoading(true);

      // --- ADDED TOKEN REFRESH ---
      // This forces the app to get a fresh authentication token before making the call.
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
      console.error("An error occurred in handleScanTimetable:", error);
      if (error.code === 'unauthenticated') {
        Alert.alert("Authentication Error", "You must be logged in to use this feature. Please try logging in again.");
      } else {
        Alert.alert("An Unexpected Error Occurred", error.message);
      }
    } finally {
      setLoading(false);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Timetable</Text>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScanTimetable}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name="camera-outline" size={20} color="#fff" />}
          <Text style={styles.scanButtonText}>Scan New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scheduleContainer}>
        {loading && !schedule ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
        ) : (
          Object.keys(schedule).length > 0 ? daysOfWeek.map((day) => {
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e5ea' },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  scanButton: { flexDirection: 'row', backgroundColor: '#007AFF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignItems: 'center', minWidth: 120, justifyContent: 'center' },
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
