// screens/career/PreviousResumes.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { collection, onSnapshot, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../../theme';

export default function PreviousResumes({ navigation }) {
  const [resumes, setResumes] = useState([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;
    const resumesRef = collection(db, 'users', currentUser.uid, 'resumes');
    const q = query(resumesRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const resumesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResumes(resumesList);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleEdit = (resumeId) => {
    navigation.navigate('ResumeBuilder', { resumeId: resumeId });
  };

  const handleDelete = (resumeId) => {
    Alert.alert("Delete Resume", "Are you sure you want to delete this resume?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive",
          onPress: async () => {
            if (!currentUser) return;
            const docRef = doc(db, 'users', currentUser.uid, 'resumes', resumeId);
            await deleteDoc(docRef);
          },
        },
      ]
    );
  };

  // This function gets the skills and navigates to the GuidanceScreen
  const handleGetGuidance = (item) => {
    const skills = item.resumeData?.skills?.technical;
    if (skills && skills.trim() !== '') {
      navigation.navigate('GuidanceScreen', { skills });
    } else {
      Alert.alert("No Skills Found", "Please edit this resume and add some technical skills to get AI guidance.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.resumeItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.resumeName} numberOfLines={1}>{item.resumeTitle || 'Untitled Resume'}</Text>
        <Text style={styles.resumeDate}>
          {item.createdAt ? `Last saved: ${item.createdAt.toDate().toLocaleDateString()}` : ''}
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        {/* --- THIS IS THE NEW BUTTON --- */}
        <TouchableOpacity style={styles.iconButton} onPress={() => handleGetGuidance(item)}>
          <Ionicons name="sparkles-outline" size={24} color={COLORS.warning} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => handleEdit(item.id)}>
          <Ionicons name="create-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>My Resumes</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ResumeBuilder')} style={styles.addButton}>
            <Ionicons name="add" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={resumes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>You haven't saved any resumes yet. Press '+' to create one.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, backgroundColor: COLORS.surface },
  backButton: { padding: SPACING.xs },
  addButton: { padding: SPACING.xs },
  title: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary },
  listContainer: { padding: SPACING.lg },
  resumeItem: { backgroundColor: COLORS.surface, padding: SPACING.lg, borderRadius: 8, marginBottom: SPACING.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resumeName: { ...TYPOGRAPHY.h4, marginBottom: SPACING.xs },
  resumeDate: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary },
  buttonContainer: { flexDirection: 'row' },
  iconButton: { marginLeft: SPACING.md, padding: SPACING.xs },
  emptyText: { textAlign: 'center', marginTop: 50, ...TYPOGRAPHY.body1, color: COLORS.textTertiary },
});