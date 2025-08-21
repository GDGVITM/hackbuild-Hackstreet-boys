import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Alert, TouchableOpacity, Button, Platform, Switch, SafeAreaView, ScrollView, TextInput } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const [userData, setUserData] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [isShared, setIsShared] = useState(false);
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
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
      }
    };
    fetchUserData();
  }, [currentUser]);

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Sorry, we need camera roll permissions to make this work!');
            return;
        }
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      uploadImage(uri);
    }
  };

  const uploadImage = async (uri) => {
    setImageUri(uri);
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

  const handleSaveDetails = async () => {
    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      await setDoc(userDocRef, { linkedin, github }, { merge: true });
      // If profile is already shared, update the community contact card too
      if (isShared) {
        const communityDocRef = doc(db, 'communityContacts', currentUser.uid);
        await setDoc(communityDocRef, { linkedin, github }, { merge: true });
      }
      Alert.alert('Success', 'Your details have been saved.');
    } catch (error) {
      Alert.alert('Error', 'Could not save your details.');
    }
  };

  const handleShareProfileToggle = async (value) => {
    setIsShared(value);
    const userDocRef = doc(db, 'users', currentUser.uid);
    const communityDocRef = doc(db, 'communityContacts', currentUser.uid);
    try {
      if (value) {
        await setDoc(communityDocRef, {
          name: userData.name,
          email: userData.email,
          photoURL: imageUri || null,
          linkedin: linkedin || null,
          github: github || null,
        });
        await setDoc(userDocRef, { isSharedInCommunity: true }, { merge: true });
        Alert.alert("Profile Shared", "Your contact info is now visible to the community.");
      } else {
        await deleteDoc(communityDocRef);
        await setDoc(userDocRef, { isSharedInCommunity: false }, { merge: true });
        Alert.alert("Profile Hidden", "Your contact info is no longer shared.");
      }
    } catch (error) {
      Alert.alert("Error", "Could not update your sharing preference.");
      setIsShared(!value);
    }
  };

  const handleLogout = () => {
    signOut(auth).catch(error => Alert.alert('Logout Error', error.message));
  };

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
            
            {/* Social Links Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Social Links</Text>
                <TextInput
                    style={styles.input}
                    placeholder="LinkedIn Profile URL"
                    value={linkedin}
                    onChangeText={setLinkedin}
                />
                <TextInput
                    style={styles.input}
                    placeholder="GitHub Profile URL"
                    value={github}
                    onChangeText={setGithub}
                />
                <Button title="Save Details" onPress={handleSaveDetails} />
            </View>

            {/* Community Settings Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Community Settings</Text>
                <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>Share Profile in Community</Text>
                    <Switch
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={isShared ? "#007AFF" : "#f4f3f4"}
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
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 15,
        fontSize: 16,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    switchLabel: {
        fontSize: 16,
    },
    logoutButtonContainer: {
        marginTop: 20,
        width: '100%',
    },
});
