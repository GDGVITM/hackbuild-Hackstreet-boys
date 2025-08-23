import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Button,
  Switch,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '../firebase';
import { doc, setDoc, onSnapshot, collection, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// --- IMPORTANT: Add your Google Cloud Vision API Key here ---
const GOOGLE_CLOUD_VISION_API_KEY = 'AIzaSyD5mp7MVxsCpfO_lalbon-aECRdAapdWlI';

const initializeGrades = () =>
  Array.from({ length: 8 }, (_, i) => ({
    semester: i + 1,
    sgpa: '',
    marksheetUrl: null,
  }));

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [isShared, setIsShared] = useState(false);
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [grades, setGrades] = useState(initializeGrades());
  const [quizHistory, setQuizHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [isGradesExpanded, setIsGradesExpanded] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        if (data.photoURL) setImageUri(data.photoURL);
        if (data.isSharedInCommunity) setIsShared(data.isSharedInCommunity);
        if (data.linkedin) setLinkedin(data.linkedin);
        if (data.github) setGithub(data.github);
        if (data.grades && data.grades.length > 0) {
          const fetchedGrades = initializeGrades();
          data.grades.forEach((grade) => {
            if (grade.semester >= 1 && grade.semester <= 8) {
              fetchedGrades[grade.semester - 1] = {
                ...initializeGrades()[grade.semester - 1],
                ...grade,
              };
            }
          });
          setGrades(fetchedGrades);
        }
      }
    });

    const historyCollectionRef = collection(
      db,
      'users',
      currentUser.uid,
      'quizAttempts'
    );
    const qHistory = query(
      historyCollectionRef,
      orderBy('timestamp', 'desc'),
      limit(3)
    );
    const unsubscribeHistory = onSnapshot(qHistory, (querySnapshot) => {
      const history = [];
      querySnapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() });
      });
      setQuizHistory(history);
      setLoadingHistory(false);
    });

    return () => {
      unsubscribeUser();
      unsubscribeHistory();
    };
  }, [currentUser]);

  // ✅ Permission handler
  const requestPermission = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your gallery.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ fixed
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const source = result.assets[0].uri;
      setImageUri(source);
      await uploadImage(source);
    }
  };

  const uploadImage = async (uri) => {
    if (!currentUser) return;
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `users/${currentUser.uid}/profile.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, { photoURL: downloadURL }, { merge: true });
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error) {
      Alert.alert('Upload Error', 'Could not upload your profile picture.');
      console.error('Error uploading image: ', error);
    }
  };

  const handleSaveDetails = async () => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(
        userDocRef,
        {
          linkedin: linkedin,
          github: github,
        },
        { merge: true }
      );
      Alert.alert('Success', 'Your details have been saved.');
    } catch (error) {
      Alert.alert('Error', 'Could not save your details.');
    }
  };

  const handleShareProfileToggle = async (value) => {
    if (!currentUser || !userData) {
      Alert.alert('Error', 'User data not loaded yet.');
      return;
    }
    setIsShared(value);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const communityDocRef = doc(db, 'communityContacts', currentUser.uid);
      await setDoc(userDocRef, { isSharedInCommunity: value }, { merge: true });
      if (value) {
        await setDoc(communityDocRef, {
          name: userData.name,
          photoURL: userData.photoURL || null,
          linkedin: userData.linkedin || '',
          github: userData.github || '',
        });
      } else {
        await deleteDoc(communityDocRef);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not update sharing preference.');
      setIsShared(!value);
    }
  };

  const handleLogout = () => {
    signOut(auth).catch((error) =>
      Alert.alert('Logout Error', error.message)
    );
  };

  const handleSgpaChange = (text, index) => {
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
      const gradesToSave = grades.filter(
        (g) => String(g.sgpa).trim() !== '' || g.marksheetUrl
      );
      await setDoc(userDocRef, { grades: gradesToSave }, { merge: true });
      Alert.alert('Success', 'Your grades have been saved.');
    } catch (error) {
      Alert.alert('Error', 'Could not save your grades.');
    }
  };

  const parseSgpaFromText = (text) => {
    const sgpaRegex = /(?:SGPI|SGPA)\s*:?\s*(\d{1,2}(?:\.\d{1,2})?)/i;
    const match = text.match(sgpaRegex);
    return match && match[1] ? match[1] : null;
  };

  const handleParseAndSaveSGPA = async (index) => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ fixed
      quality: 1,
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets && result.assets[0];
    if (!asset || !asset.base64 || !asset.uri) {
      Alert.alert('Image Error', 'Failed to get image data.');
      return;
    }

    setUploadingIndex(index);
    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const semesterNumber = index + 1;
      const docRef = ref(
        storage,
        `users/${currentUser.uid}/educationalDocuments/semester_${semesterNumber}_marksheet.jpg`
      );
      await uploadBytes(docRef, blob);
      const downloadURL = await getDownloadURL(docRef);

      const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`;
      const body = {
        requests: [
          {
            image: { content: asset.base64 },
            features: [{ type: 'TEXT_DETECTION' }],
          },
        ],
      };
      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const resultData = await apiResponse.json();
      const detectedText =
        resultData.responses?.[0]?.fullTextAnnotation?.text;

      const newGrades = [...grades];
      newGrades[index].marksheetUrl = downloadURL;

      if (detectedText) {
        const sgpa = parseSgpaFromText(detectedText);
        if (sgpa) {
          newGrades[index].sgpa = sgpa;
          Alert.alert(
            'Success!',
            `SGPA of ${sgpa} found. Document uploaded and saved.`
          );
        } else {
          Alert.alert(
            'Document Saved',
            "Couldn't find an SGPA, but your document was uploaded."
          );
        }
      } else {
        Alert.alert(
          'Document Saved',
          'Could not detect text, but the document was saved.'
        );
      }

      setGrades(newGrades);
      const userDocRef = doc(db, 'users', currentUser.uid);
      const gradesToSave = newGrades.filter(
        (g) => String(g.sgpa).trim() !== '' || g.marksheetUrl
      );
      await setDoc(userDocRef, { grades: gradesToSave }, { merge: true });
    } catch (error) {
      console.error('OCR/Upload Error:', error);
      Alert.alert('Error', `An unexpected error occurred: ${error.message}`);
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.container}>
          <TouchableOpacity onPress={pickImage}>
            <Image
              source={
                imageUri
                  ? { uri: imageUri }
                  : require('../assets/default-avatar.png')
              }
              style={styles.avatar}
            />
          </TouchableOpacity>
          <Text style={styles.name}>
            {userData ? userData.name : 'Loading...'}
          </Text>
          <Text style={styles.email}>
            {userData ? userData.email : ''}
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Recent Quiz Attempts</Text>
            {loadingHistory ? (
              <ActivityIndicator color="#007AFF" />
            ) : quizHistory.length > 0 ? (
              quizHistory.map((attempt) => (
                <View key={attempt.id} style={styles.historyItem}>
                  <View style={styles.historyDetails}>
                    <Text style={styles.historyTitle}>
                      {attempt.quizTitle}
                    </Text>
                    <Text style={styles.historyDate}>
                      {attempt.timestamp
                        ? new Date(
                            attempt.timestamp.toDate()
                          ).toLocaleDateString()
                        : 'No date'}
                    </Text>
                  </View>
                  <Text style={styles.historyScore}>
                    {attempt.score}/{attempt.totalQuestions}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noHistoryText}>
                No quiz attempts recorded yet.
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Educational Documents</Text>
            <Text style={styles.cardSubtitle}>
              Upload marksheets via the grade section below.
            </Text>
            <View style={{ marginTop: 15 }}>
              <Button
                title="View My Documents"
                onPress={() => navigation.navigate('Documents')}
              />
            </View>
          </View>

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => setIsGradesExpanded(!isGradesExpanded)}
              activeOpacity={0.7}
            >
              <Text style={styles.cardHeaderTitle}>Semester Grades (SGPA)</Text>
              <Ionicons
                name={isGradesExpanded ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#8e8e93"
              />
            </TouchableOpacity>

            {isGradesExpanded && (
              <View style={styles.gradesContainer}>
                {grades.map((item, index) => (
                  <View key={index} style={styles.gradeRow}>
                    <Text style={styles.gradeLabel}>
                      Semester {item.semester}
                    </Text>
                    <View style={styles.gradeInputWrapper}>
                      <TextInput
                        style={styles.gradeInput}
                        placeholder="-"
                        value={String(item.sgpa)}
                        onChangeText={(text) =>
                          handleSgpaChange(text, index)
                        }
                        keyboardType="numeric"
                        maxLength={4}
                      />
                      <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={() => handleParseAndSaveSGPA(index)}
                        disabled={uploadingIndex !== null}
                      >
                        {uploadingIndex === index ? (
                          <ActivityIndicator size="small" color="#007AFF" />
                        ) : item.marksheetUrl ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color="#34C759"
                          />
                        ) : (
                          <Ionicons
                            name="camera-outline"
                            size={24}
                            color="#007AFF"
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <View style={{ marginTop: 15 }}>
                  <Button title="Save Grades" onPress={handleSaveGrades} />
                </View>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Social Links</Text>
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

          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Community Settings</Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>
                Share Profile in Community
              </Text>
              <Switch
                onValueChange={handleShareProfileToggle}
                value={isShared}
              />
            </View>
          </View>

          <View style={styles.logoutButtonContainer}>
            <Button
              title="Logout"
              onPress={handleLogout}
              color="#ff3b30"
            />
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
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardHeaderTitle: {
        fontSize: 18, 
        fontWeight: 'bold', 
        marginBottom: 5,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#8e8e93',
    },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 15, fontSize: 16 },
    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    switchLabel: { fontSize: 16 },
    logoutButtonContainer: { marginTop: 20, width: '100%' },
    gradesContainer: {
        marginTop: 15,
    },
    gradeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f2f5',
    },
    gradeLabel: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    gradeInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
    },
    gradeInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 8,
        width: 70,
        textAlign: 'center',
        fontSize: 16,
        marginRight: 10,
    },
    uploadButton: {
        padding: 5,
        width: 34,
        alignItems: 'center',
    },
    historyItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: '#f0f2f5',
    },
    historyDetails: {
      flex: 1,
    },
    historyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
    },
    historyDate: {
      fontSize: 12,
      color: '#8e8e93',
      marginTop: 2,
    },
    historyScore: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#007AFF',
    },
    noHistoryText: {
      fontSize: 14,
      color: '#8e8e93',
      textAlign: 'center',
      paddingVertical: 10,
    },
});
