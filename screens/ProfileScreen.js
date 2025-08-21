import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Alert, TouchableOpacity, Button, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const [userData, setUserData] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [language, setLanguage] = useState('en'); // default English
  const [mockScores, setMockScores] = useState({
    Math: 85,
    Physics: 78,
    Chemistry: 92,
  });

  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      const docRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        if (data.photoURL) {
          setImageUri(data.photoURL);
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

  const pickImage = async () => {
    // *** ADDED PERMISSION REQUEST ***
    // No permissions needed for web. For mobile, we need to ask.
    if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Sorry, we need camera roll permissions to make this work!');
            return;
        }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      uploadImage(uri);
    }
  };

  const uploadImage = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `profilePictures/${currentUser.uid}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, { photoURL: downloadURL }, { merge: true });

      Alert.alert('Success', 'Profile picture updated!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleLogout = () => {
    signOut(auth).catch(error => Alert.alert('Logout Error', error.message));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage}>
        <Image
          source={imageUri ? { uri: imageUri } : require('../assets/default-avatar.png')}
          style={styles.avatar}
        />
        <Text style={{ textAlign: 'center', marginTop: 5 }}>Tap to change photo</Text>
      </TouchableOpacity>

      <Text style={styles.name}>{userData ? userData.name : 'Loading...'}</Text>

      <View style={styles.scores}>
        <Text style={styles.sectionTitle}>Test Scores</Text>
        {Object.keys(mockScores).map((subject) => (
          <Text key={subject}>
            {subject}: {mockScores[subject]}
          </Text>
        ))}
      </View>

      <View style={styles.language}>
        <Text style={styles.sectionTitle}>Select Language</Text>
        <Picker
          selectedValue={language}
          onValueChange={(itemValue) => setLanguage(itemValue)}
          style={{ height: 50, width: 200 }}
        >
          <Picker.Item label="English" value="en" />
          <Picker.Item label="Hindi" value="hi" />
          <Picker.Item label="Spanish" value="es" />
        </Picker>
      </View>

      <View style={styles.logoutButtonContainer}>
        <Button title="Logout" onPress={handleLogout} color="#ff3b30" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginTop: 20, backgroundColor: '#ccc' },
  name: { fontSize: 24, marginVertical: 15 },
  scores: { marginTop: 30, width: '100%', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  language: { marginTop: 30, alignItems: 'center' },
  logoutButtonContainer: {
    marginTop: 'auto',
    marginBottom: 20,
    width: '80%',
  },
});
