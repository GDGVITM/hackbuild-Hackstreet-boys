// screens/career/ResumeBuilder.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { doc, setDoc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../../theme';

import PersonalInfoForm from './components/PersonalInfoForm';
import DynamicSection from './components/DynamicSection';
import ThemePicker from './components/ThemePicker'; // Keep this component
import { createProfessionalTemplate } from './templates/ProfessionalTemplate'; // Use the new template

// NEW data structure
const initialResumeState = {
    resumeTitle: 'Untitled Resume', // <-- NEW FIELD
    personalInfo: { name: '', title: '', email: '', phone: '', address: '', link: '' },
    workExperience: [],
    education: [],
    projects: [],
    skills: { technical: '', soft: '' },
};

export default function ResumeBuilder({ route, navigation }) {

    const resumeId = route.params?.resumeId;

    const [resume, setResume] = useState(initialResumeState);
    const [themeColor, setThemeColor] = useState('#007BFF'); // Default to a professional blue
    const [previewVisible, setPreviewVisible] = useState(false);
    const currentUser = auth.currentUser;

    useEffect(() => {
        // If there's a resumeId, we are EDITING. Fetch that specific resume.
        if (resumeId && currentUser) {
            const docRef = doc(db, 'users', currentUser.uid, 'resumes', resumeId);
            getDoc(docRef).then(docSnap => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setResume(data.resumeData || initialResumeState);
                    setThemeColor(data.themeColor || '#007BFF');
                } else {
                    console.log("No such document to edit!");
                }
            });
        } else {
            console.log("Creating a new resume.");
            // Otherwise, we are CREATING a new one. Start fresh.
            setResume(initialResumeState);
            setThemeColor('#007BFF');
        }
    }, [resumeId, currentUser]);

    const handleUpdate = (section, value) => setResume(prev => ({ ...prev, [section]: value }));

    const addSectionItem = (section) => {
        const newItem = { points: [''] }; // All dynamic items will have points
        if (section === 'workExperience') {
            Object.assign(newItem, { company: '', role: '', period: '' });
        } else if (section === 'education') {
            Object.assign(newItem, { institution: '', degree: '', period: '' });
        } else { // Projects
            Object.assign(newItem, { name: '', period: '' });
        }
        setResume(prev => ({ ...prev, [section]: [...prev[section], newItem] }));
    };

    const removeSectionItem = (section, index) => {
        setResume(prev => ({ ...prev, [section]: prev[section].filter((_, i) => i !== index) }));
    };

    const handleSaveResume = async () => {
        console.log("Save button pressed."); // --- DEBUG LOG 1 ---
        if (!currentUser) return Alert.alert("Error", "You must be logged in.");

        if (!resume.resumeTitle || resume.resumeTitle.trim() === '') {
            console.warn("Save failed: Resume title is empty.");
            return Alert.alert("Title Required", "Please give your resume a title before saving.");
        }

        console.log("User is logged in. Resume title is valid. Preparing data to save..."); // --- DEBUG LOG 2 ---

        const dataToSave = {
            resumeData: resume,
            themeColor: themeColor,
            createdAt: new Date(), // To order them by date
            resumeTitle: resume.resumeTitle,
        };

        try {
            if (resumeId) {
                console.log("Attempting to UPDATE document with ID:", resumeId); // --- DEBUG LOG 3 (Edit) ---
                // We are EDITING, so we update the existing document
                const docRef = doc(db, 'users', currentUser.uid, 'resumes', resumeId);
                await setDoc(docRef, dataToSave, { merge: true });
                Alert.alert("Success", "Your resume has been updated!");
            } else {
                console.log("Attempting to CREATE a new document.");
                // We are CREATING, so we add a new document
                const collectionRef = collection(db, 'users', currentUser.uid, 'resumes');
                await addDoc(collectionRef, dataToSave);
                Alert.alert("Success", "Your resume has been saved!");
            }
            console.log("Save successful! Navigating back.");
            navigation.goBack(); // Go back to the list after saving
        } catch (error) {
            Alert.alert("Error", "Could not save resume.");
            console.error(error);
        }
    };

    const handleExportPdf = async () => {
        const html = createProfessionalTemplate(resume, themeColor);
        try {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { dialogTitle: 'Export your resume' });
        } catch (error) { Alert.alert("Error", "Could not export PDF."); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.builderHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Ionicons name="arrow-back-outline" size={28} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Resume Builder</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView contentContainerStyle={styles.formContainer}>
                {/* --- THIS IS THE NEW SECTION THAT GIVES YOU THE OPTION TO CHANGE THE TITLE --- */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resume Title</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Software Engineer Resume"
                        value={resume.resumeTitle}
                        onChangeText={(text) => setResume(prev => ({ ...prev, resumeTitle: text }))}
                    />
                </View>
                <ThemePicker selectedColor={themeColor} onSelectColor={setThemeColor} />
                <PersonalInfoForm data={resume.personalInfo} onUpdate={(field, value) => handleUpdate('personalInfo', { ...resume.personalInfo, [field]: value })} />
                <DynamicSection title="Work Experience" data={resume.workExperience} onUpdate={(value) => handleUpdate('workExperience', value)} onAdd={() => addSectionItem('workExperience')} onRemove={(index) => removeSectionItem('workExperience', index)} fields={[{ key: 'role', placeholder: 'Role / Title' }, { key: 'company', placeholder: 'Company' }, { key: 'period', placeholder: 'e.g., May 2023 - Present' }]} />
                <DynamicSection title="Education" data={resume.education} onUpdate={(value) => handleUpdate('education', value)} onAdd={() => addSectionItem('education')} onRemove={(index) => removeSectionItem('education', index)} fields={[{ key: 'institution', placeholder: 'Institution' }, { key: 'degree', placeholder: 'Degree' }, { key: 'period', placeholder: 'e.g., Sep 2019 - May 2023' }]} />
                <DynamicSection title="Projects" data={resume.projects} onUpdate={(value) => handleUpdate('projects', value)} onAdd={() => addSectionItem('projects')} onRemove={(index) => removeSectionItem('projects', index)} fields={[{ key: 'name', placeholder: 'Project Name' }, { key: 'period', placeholder: 'e.g., Spring 2023' }]} />
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Skills</Text>
                    <TextInput style={[styles.input, styles.multiline]} placeholder="Technical Skills (e.g., React, Node.js, SQL)" value={resume.skills.technical} onChangeText={(text) => handleUpdate('skills', { ...resume.skills, technical: text })} multiline />
                    <TextInput style={[styles.input, styles.multiline]} placeholder="Soft Skills (e.g., Teamwork, Communication)" value={resume.skills.soft} onChangeText={(text) => handleUpdate('skills', { ...resume.skills, soft: text })} multiline />
                </View>
            </ScrollView>
            <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={handleSaveResume}><Ionicons name="save-outline" size={24} color="white" /><Text style={styles.actionButtonText}>Save</Text></TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleExportPdf}><Ionicons name="download-outline" size={24} color="white" /><Text style={styles.actionButtonText}>Export</Text></TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    builderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, backgroundColor: COLORS.surface },
    backButton: { padding: SPACING.xs },
    title: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary },
    formContainer: { padding: SPACING.lg, paddingBottom: 100 },
    section: { marginBottom: SPACING.lg },
    sectionTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary, marginBottom: SPACING.md },
    input: { backgroundColor: COLORS.surface, padding: SPACING.sm, borderRadius: 8, borderWidth: 1, borderColor: COLORS.borderLight, fontSize: 16, marginTop: SPACING.sm },
    multiline: { height: 100, textAlignVertical: 'top' },
    actionButtons: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', padding: SPACING.md, backgroundColor: '#f8f8f8', borderTopWidth: 1, borderColor: '#ddd' },
    actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, borderRadius: 8 },
    actionButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: SPACING.sm },
});