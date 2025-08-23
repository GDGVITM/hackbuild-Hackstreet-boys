// screens/career/GuidanceScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// --- These paths are now correct for the new folder structure ---
import { GEMINI_API_KEY, RAPIDAPI_KEY } from '../../config/apiKeys';
import { normalizeSkills, matchJobs, getSkillGap } from '../../career/skillsCatalog.js';
import { getAIAdvice } from '../../services/ai';
import { getJobProvider } from '../../services/jobSearch';

// Re-using theme from the app for consistency
const COLORS = {
  primary: '#007AFF',
  surface: '#FFFFFF',
  background: '#F2F2F7',
  textPrimary: '#1C1C1E',
  textSecondary: '#636366',
  textTertiary: '#8E8E93',
  borderLight: '#E5E5EA',
  error: '#FF3B30',
  warning: '#FF9500',
};
const SPACING = { xs: 4, sm: 8, md: 16, lg: 24 };

const CACHE_KEY = 'CAREER_GUIDANCE_CACHE';
const jobProvider = getJobProvider();

export default function GuidanceScreen({ navigation }) {
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState('');
  const [targetJob, setTargetJob] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isJobsLoading, setIsJobsLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const [aiAdvice, setAiAdvice] = useState('');
  const [jobMatches, setJobMatches] = useState([]);
  const [skillGap, setSkillGap] = useState(null);
  const [jobOpenings, setJobOpenings] = useState([]);

  useEffect(() => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "PASTE_YOUR_GEMINI_API_KEY_HERE" || !RAPIDAPI_KEY || RAPIDAPI_KEY === "PASTE_YOUR_RAPIDAPI_KEY_HERE") {
      setIsOfflineMode(true);
    }

    // Load last session from cache
    const loadCache = async () => {
      try {
        const cachedData = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { inputs, results } = JSON.parse(cachedData);
          setSkills(inputs.skills || '');
          setLocation(inputs.location || '');
          setTargetJob(inputs.targetJob || '');
          setAiAdvice(results.aiAdvice || '');
          setJobMatches(results.jobMatches || []);
          setSkillGap(results.skillGap || null);
          setJobOpenings(results.jobOpenings || []);
        }
      } catch (e) {
        console.error("Failed to load cache", e);
      }
    };
    loadCache();
  }, []);

  // Save to cache whenever results change
  useEffect(() => {
    const saveCache = async () => {
      const cache = {
        inputs: { skills, location, targetJob },
        results: { aiAdvice, jobMatches, skillGap, jobOpenings },
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    };
    saveCache();
  }, [aiAdvice, jobMatches, skillGap, jobOpenings, skills, location, targetJob]);


  const handleGetSuggestions = useCallback(async () => {
    if (!skills.trim()) {
      Alert.alert('Missing Skills', 'Please enter at least one skill.');
      return;
    }
    setIsLoading(true);
    setAiAdvice('');
    setJobMatches([]);
    setJobOpenings([]);
    setSkillGap(null);

    const userSkills = normalizeSkills(skills.split(','));
    const matches = matchJobs(userSkills);
    setJobMatches(matches);

    const advice = await getAIAdvice({ userSkills, matches, location, targetJob });
    setAiAdvice(advice);
    setIsLoading(false);
  }, [skills, location, targetJob]);

  const handleFindJobs = useCallback(async (jobTitle) => {
    if (!jobTitle) {
      Alert.alert('No Job Selected', 'Please select a job title first or get suggestions.');
      return;
    }
    setIsJobsLoading(true);
    setJobOpenings([]);
    const openings = await jobProvider.search(jobTitle, location);
    setJobOpenings(openings);
    setIsJobsLoading(false);
  }, [location]);

  const handleCheckGap = useCallback(() => {
    if (!targetJob.trim()) {
      Alert.alert('Missing Target Job', 'Please enter a target job title.');
      return;
    }
    if (!skills.trim()) {
      Alert.alert('Missing Skills', 'Please enter your current skills.');
      return;
    }
    const userSkills = normalizeSkills(skills.split(','));
    const gap = getSkillGap(userSkills, targetJob);

    if (!gap) {
      Alert.alert('Job Not Found', `The target job "${targetJob}" was not found in our catalog. Please try a different title.`);
      setSkillGap(null);
    } else {
      setSkillGap(gap);
    }
  }, [targetJob, skills]);


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Career Guidance</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {isOfflineMode && (
        <View style={styles.offlineBanner}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.offlineText}>Running in Offline Demo Mode</Text>
        </View>
      )}

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.card}>
          <Text style={styles.label}>Your Skills (comma-separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Python, React, SQL"
            value={skills}
            onChangeText={setSkills}
          />

          <Text style={styles.label}>Your Location (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Mumbai or Remote"
            value={location}
            onChangeText={setLocation}
          />
           <TouchableOpacity style={styles.button} onPress={handleGetSuggestions} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Get Suggestions</Text>}
          </TouchableOpacity>
        </View>

        {aiAdvice ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>AI-Powered Advice</Text>
            <Text style={styles.bodyText}>{aiAdvice}</Text>
          </View>
        ) : null}

        {jobMatches.length > 0 ? (
           <View style={styles.card}>
            <Text style={styles.sectionTitle}>Top Role Matches</Text>
            <Text style={styles.bodyText}>Click a role to find live job openings.</Text>
            <View style={styles.chipContainer}>
              {jobMatches.slice(0, 5).map(({ job, score }) => (
                <TouchableOpacity key={job} style={styles.chip} onPress={() => handleFindJobs(job)}>
                  <Text style={styles.chipText}>{job} ({Math.round(score * 100)}%)</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {isJobsLoading ? <ActivityIndicator size="large" style={{ marginVertical: 20 }}/> : null}

        {jobOpenings.length > 0 ? (
          <View style={styles.card}>
             <Text style={styles.sectionTitle}>Live Job Openings</Text>
             {jobOpenings.map(job => (
               <View key={job.id} style={styles.jobCard}>
                  <View>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.jobCompany}>{job.company} - {job.location}</Text>
                  </View>
                  <TouchableOpacity style={styles.applyButton} onPress={() => Linking.openURL(job.applyUrl)}>
                    <Text style={styles.applyButtonText}>Apply</Text>
                  </TouchableOpacity>
               </View>
             ))}
          </View>
        ) : null}

         <View style={styles.card}>
            <Text style={styles.sectionTitle}>Check Skill Gap</Text>
            <Text style={styles.label}>Target Job Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Data Scientist"
              value={targetJob}
              onChangeText={setTargetJob}
            />
            <TouchableOpacity style={styles.button} onPress={handleCheckGap}>
              <Text style={styles.buttonText}>Check Skill Gap</Text>
            </TouchableOpacity>
        </View>

        {skillGap ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Skill Gap for "{targetJob}"</Text>
            <Text style={styles.subtleLabel}>Skills to Learn Next:</Text>
            <View style={styles.chipContainer}>
              {skillGap.missing.length > 0 ? skillGap.missing.map(skill => (
                <View key={skill} style={[styles.chip, styles.chipMissing]}>
                  <Text style={[styles.chipText, styles.chipTextMissing]}>{skill}</Text>
                </View>
              )) : <Text>No skill gaps found!</Text>}
            </View>
            <Text style={styles.subtleLabel}>Required Skills:</Text>
            <View style={styles.chipContainer}>
              {skillGap.required.map(skill => (
                <View key={skill} style={[styles.chip, styles.chipRequired]}>
                  <Text style={styles.chipText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: { padding: SPACING.xs },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
  container: { flex: 1, padding: SPACING.md },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warning + '30',
    padding: SPACING.sm,
    justifyContent: 'center',
  },
  offlineText: { color: COLORS.textSecondary, fontSize: 12 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  subtleLabel: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
    marginBottom: SPACING.md,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  bodyText: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22, marginBottom: SPACING.md },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.xs },
  chip: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '50',
  },
  chipText: { color: COLORS.primary, fontWeight: '500' },
  chipMissing: { backgroundColor: COLORS.error + '20', borderColor: COLORS.error + '50' },
  chipTextMissing: { color: COLORS.error },
  chipRequired: { backgroundColor: COLORS.background },
  jobCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  jobTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  jobCompany: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  applyButtonText: { color: '#fff', fontWeight: '500' },
});
