// screens/career/GuidanceScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase'; // Correct path
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../../theme';

// A reusable component for displaying a section of the guidance
const GuidanceSection = ({ title, data, renderItem }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {data && data.length > 0 ? (
      data.map(renderItem)
    ) : (
      <Text style={styles.itemText}>No suggestions available.</Text>
    )}
  </View>
);

export default function GuidanceScreen({ route, navigation }) {
  const { skills } = route.params;
  const [guidance, setGuidance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getGuidance = async () => {
      if (!skills) {
        Alert.alert("Error", "No skills were provided to analyze.");
        setLoading(false);
        return;
      }

      try {
        // --- THIS IS THE FIX ---
        // The name here MUST EXACTLY match the name in your backend file.
        const getCareerGuidanceCallable = httpsCallable(functions, 'getCareerGuidance');

        console.log("Calling 'getCareerGuidance' function with skills:", skills);
        const result = await getCareerGuidanceCallable({ skills });

        setGuidance(result.data);
      } catch (error) {
        console.error("Error fetching career guidance:", error);
        Alert.alert("Error", "Could not fetch AI-powered guidance. Please check the function name and logs.");
      } finally {
        setLoading(false);
      }
    };

    getGuidance();
  }, [skills]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Analyzing your skills...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Career Guidance</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <GuidanceSection
          title="Your Strongest Skills"
          data={guidance?.strongest_skills}
          renderItem={(item, index) => <Text key={index} style={styles.itemText}>• {item}</Text>}
        />
        <GuidanceSection
          title="Recommended Skill Gaps to Fill"
          data={guidance?.skill_gaps}
          renderItem={(item, index) => <Text key={index} style={styles.itemText}>• {item}</Text>}
        />
        <GuidanceSection
          title="Suggested Job Roles"
          data={guidance?.suggested_roles}
          renderItem={(item, index) => <Text key={index} style={styles.itemText}>• {item}</Text>}
        />
        <GuidanceSection
          title="Project Ideas to Build Your Portfolio"
          data={guidance?.project_ideas}
          renderItem={(item, index) => (
            <View key={index} style={styles.projectItem}>
              <Text style={styles.projectTitle}>• {item.title}</Text>
              <Text style={styles.projectDescription}>{item.description}</Text>
            </View>
          )}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, marginTop: SPACING.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, backgroundColor: COLORS.surface },
  backButton: { padding: SPACING.xs },
  title: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary },
  contentContainer: { padding: SPACING.lg },
  section: { backgroundColor: COLORS.surface, padding: SPACING.lg, borderRadius: 8, marginBottom: SPACING.lg },
  sectionTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary, marginBottom: SPACING.md },
  itemText: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, marginBottom: SPACING.xs, lineHeight: 22 },
  projectItem: { marginBottom: SPACING.md },
  projectTitle: { ...TYPOGRAPHY.body1, fontWeight: 'bold', color: COLORS.textPrimary },
  projectDescription: { ...TYPOGRAPHY.body2, color: COLORS.textSecondary, marginLeft: 10 },
});