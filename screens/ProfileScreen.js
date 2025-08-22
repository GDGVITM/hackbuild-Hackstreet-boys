import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  Button, 
  Platform, 
  Switch, 
  SafeAreaView, 
  ScrollView, 
  TextInput 
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';

// A helper function to initialize the grades array
const initializeGrades = () => Array.from({ length: 8 }, (_, i) => ({ semester: i + 1, sgpa: '' }));

export default function ProfileScreen() {
  const [userData, setUserData] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [isShared, setIsShared] = useState(false);
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [grades, setGrades] = useState(initializeGrades()); // State for SGPA values
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      const docRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        if (data.photoURL) setImageUri(data.photoURL);
        if (data.isSharedInCommunity) setIsShared(data.isSharedInCommunity);
        if (data.linkedin) setLinkedin(data.linkedin);
        if (data.github) setGithub(data.github);
        
        // Fetch grades or initialize if they don't exist
        if (data.grades && data.grades.length > 0) {
          const fetchedGrades = initializeGrades();
          data.grades.forEach(grade => {
            fetchedGrades[grade.semester - 1] = grade;
          });
          setGrades(fetchedGrades);
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

  const handleSgpaChange = (text, index) => {
    // Only allow numbers and one decimal point
    if (/^\d*\.?\d*$/.test(text)) {
        const newGrades = [...grades];
        newGrades[index].sgpa = text;
        setGrades(newGrades);
    }
  };

  const handleSaveGrades = async () => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      // Filter out semesters with no SGPA entered
      const gradesToSave = grades.filter(g => g.sgpa.trim() !== '');
      await setDoc(userDocRef, { grades: gradesToSave }, { merge: true });
      Alert.alert('Success', 'Your grades have been saved.');
    } catch (error) {
      Alert.alert('Error', 'Could not save your grades.');
    }
  };

  // --- (Other functions like pickImage, uploadImage, handleSaveDetails, etc. remain the same) ---
  const pickImage = async () => { /* ... existing code ... */ };
  const uploadImage = async (uri) => { /* ... existing code ... */ };
  const handleSaveDetails = async () => { /* ... existing code ... */ };
  const handleShareProfileToggle = async (value) => { /* ... existing code ... */ };
  const handleLogout = () => { signOut(auth).catch(error => Alert.alert('Logout Error', error.message)); };


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.container}>
            <TouchableOpacity onPress={pickImage}>
                <Image
                source={imageUri ? { uri: imageUri } : require('../assets/default-avatar.png')}
                style={styles.avatar}
                />
            </TouchableOpacity>
            <Text style={styles.name}>{userData ? userData.name : 'Loading...'}</Text>
            <Text style={styles.email}>{userData ? userData.email : ''}</Text>
            
            {/* Grades Card - NEW */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Semester Grades (SGPA)</Text>
                <View style={styles.gradesGrid}>
                  {grades.map((item, index) => (
                    <View key={index} style={styles.gradeInputContainer}>
                      <Text style={styles.gradeLabel}>Sem {item.semester}</Text>
                      <TextInput
                        style={styles.gradeInput}
                        placeholder="0.0"
                        value={String(item.sgpa)}
                        onChangeText={(text) => handleSgpaChange(text, index)}
                        keyboardType="numeric"
                        maxLength={4}
                      />
                    </View>
                  ))}
                </View>
                <Button title="Save Grades" onPress={handleSaveGrades} />
            </View>

            {/* Social Links Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Social Links</Text>
                <TextInput style={styles.input} placeholder="LinkedIn Profile URL" value={linkedin} onChangeText={setLinkedin} />
                <TextInput style={styles.input} placeholder="GitHub Profile URL" value={github} onChangeText={setGithub} />
                <Button title="Save Details" onPress={handleSaveDetails} />
            </View>

            {/* Community Settings Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Community Settings</Text>
                <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>Share Profile in Community</Text>
                    <Switch
                        onValueChange={handleShareProfileToggle}
                        value={isShared}
                    />
                </View>
            </View>

            <View style={styles.logoutButtonContainer}>
                <Button title="Logout" onPress={handleLogout} color="#ff3b30" />
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
    container: { flex: 1, alignItems: 'center', padding: 20 },
    avatar: { width: 120, height: 120, borderRadius: 60, marginTop: 20, backgroundColor: '#ccc' },
    name: { fontSize: 24, fontWeight: 'bold', marginTop: 15 },
    email: { fontSize: 16, color: '#8e8e93', marginBottom: 20 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 15, fontSize: 16 },
    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    switchLabel: { fontSize: 16 },
    logoutButtonContainer: { marginTop: 20, width: '100%' },
    // New Styles for Grades
    gradesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    gradeInputContainer: {
        width: '22%', // Adjust width to fit 4 items per row with some spacing
        marginBottom: 15,
        alignItems: 'center',
    },
    gradeLabel: {
        fontSize: 14,
        color: '#8e8e93',
        marginBottom: 5,
    },
    gradeInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        width: '100%',
        textAlign: 'center',
        fontSize: 16,
    },
});