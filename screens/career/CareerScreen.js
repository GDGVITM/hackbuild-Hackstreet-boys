import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// CORRECTED PATHS: Ensure these point to your components at the root
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../theme';

// Import the builder screen to be shown when clicked
import ResumeBuilder from './ResumeBuilder';

const { width } = Dimensions.get('window');

// --- Your existing components (JobCard, ResourceCard, etc.) remain unchanged ---
const JobCard = ({ job, onApply }) => (
  <Card style={styles.jobCard}>
    <View style={styles.jobHeader}>
      <View style={styles.companyLogo}>
        <Text style={styles.companyInitial}>{job.company.charAt(0)}</Text>
      </View>
      <View style={styles.jobBadge}>
        <Text style={styles.jobBadgeText}>{job.type}</Text>
      </View>
    </View>
    <Text style={styles.jobTitle}>{job.title}</Text>
    <Text style={styles.jobCompany}>{job.company}</Text>
    <View style={styles.jobDetails}>
      <View style={styles.jobDetailItem}>
        <Ionicons name="location-outline" size={14} color={COLORS.textTertiary} />
        <Text style={styles.jobDetailText}>{job.location}</Text>
      </View>
      <View style={styles.jobDetailItem}>
        <Ionicons name="cash-outline" size={14} color={COLORS.textTertiary} />
        <Text style={styles.jobDetailText}>{job.salary}</Text>
      </View>
    </View>
    <View style={styles.jobSkills}>
      {job.skills.map((skill, index) => (
        <View key={index} style={styles.skillTag}>
          <Text style={styles.skillText}>{skill}</Text>
        </View>
      ))}
    </View>
    <Button
      title="Apply Now"
      onPress={() => onApply(job)}
      size="small"
      style={styles.applyButton}
    />
  </Card>
);

const ResourceCard = ({ resource, onPress }) => (
  <TouchableOpacity style={styles.resourceCard} onPress={onPress} activeOpacity={0.8}>
    <LinearGradient
      colors={resource.gradient}
      style={styles.resourceGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.resourceIcon}>
        <Ionicons name={resource.icon} size={24} color={COLORS.surface} />
      </View>
      <Text style={styles.resourceTitle}>{resource.title}</Text>
      <Text style={styles.resourceDescription}>{resource.description}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const EventCard = ({ event }) => (
    <Card style={styles.eventCard}>
        <View style={styles.eventDate}><Text style={styles.eventMonth}>{event.month}</Text><Text style={styles.eventDay}>{event.day}</Text></View>
        <View style={styles.eventDetails}><Text style={styles.eventTitle}>{event.title}</Text><Text style={styles.eventDescription}>{event.description}</Text></View>
    </Card>
);


export default function CareerScreen({ navigation }) {
  // --- KEY CHANGE 1: A state to control what is visible ---
  // It starts as 'main', so your original screen shows first.
  // const [view, setView] = useState('main');

  const [selectedTab, setSelectedTab] = useState('resources');

  // --- NO CHANGE to your data ---
  const mockJobs = [ { id: 1, title: 'Software Engineer Intern', company: 'Google', location: 'Remote', salary: '$5000/month', type: 'Internship', skills: ['Python', 'JavaScript', 'React'], }, ];
  const events = [ { id: 1, title: 'Tech Career Fair', description: 'Meet recruiters', month: 'AUG', day: '25', time: '10:00 AM', attendees: 150, }];

  // --- KEY CHANGE 2: The 'Resume Builder' resource now has an 'action' ---
  const resources = [
    {
      id: 1,
      title: 'Resume Builder',
      description: 'Create professional resumes',
      icon: 'document-text-outline',
      gradient: [COLORS.primary, COLORS.secondary],
      // This now points to the screen name defined in App.js's CareerStack
      screen: 'ResumeBuilder',
    },
    {
      id: 2,
      title: 'My Resumes',
      description: 'View and edit saved resumes',
      icon: 'folder-open-outline',
      gradient: ['#6D5BBA', '#8D6E63'],
      screen: 'PreviousResumes', // Navigates to the list of saved resumes
    },
    { id: 3, title: 'Interview Prep', description: 'Practice coding interviews', icon: 'chatbubbles-outline', gradient: [COLORS.success, '#30D158'], url: 'https://leetcode.com' },
    { id: 4, title: 'Skill Assessment', description: 'Test your technical skills', icon: 'trophy-outline', gradient: [COLORS.warning, '#FF9500'], url: 'https://hackerrank.com' },
    { id: 5, title: 'Career Guidance', description: 'Get personalized advice', icon: 'compass-outline', gradient: [COLORS.error, '#FF3B30'], url: 'https://glassdoor.com' },
  ];

  const handleApplyJob = (job) => Alert.alert('Apply for Job', `Would you like to apply for ${job.title} at ${job.company}?`);

  const handleResourcePress = (resource) => {
    // The handler now correctly uses the navigation prop
    if (resource.screen) {
      navigation.navigate(resource.screen);
    } else if (resource.url) {
      Linking.openURL(resource.url);
    }
  };

  // --- NO CHANGE to your TabButton or renderContent functions ---
  const TabButton = ({ tab, title, icon, count }) => ( <TouchableOpacity style={[styles.tabButton, selectedTab === tab && styles.activeTabButton]} onPress={() => setSelectedTab(tab)}><Ionicons name={icon} size={20} color={selectedTab === tab ? COLORS.primary : COLORS.textTertiary} /><Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>{title}</Text>{count && (<View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{count}</Text></View>)}</TouchableOpacity> );
  const renderContent = () => { /* ... your existing switch statement ... */ };

  // --- KEY CHANGE 3: The conditional render logic ---
  // If the 'view' state is 'builder', it shows the builder.
  // The 'onBack' prop allows the builder to set the state back to 'main'.
  // if (view === 'builder') {
  //   return <ResumeBuilder onBack={() => setView('main')} />;
  // }

  // Otherwise, it returns your beautiful original screen.
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={[COLORS.warning, '#FF9500']} style={styles.headerGradient}>
        <View style={styles.header}>
            <View><Text style={styles.headerTitle}>Career Center</Text><Text style={styles.headerSubtitle}>Build your future career</Text></View>
            <TouchableOpacity style={styles.headerButton}><Ionicons name="search-outline" size={24} color={COLORS.surface} /></TouchableOpacity>
        </View>
      </LinearGradient>
      <Card style={styles.statsCard}><View style={styles.statsContainer}><View style={styles.statItem}><Text style={styles.statValue}>12</Text><Text style={styles.statLabel}>Applied</Text></View><View style={styles.statDivider} /><View style={styles.statItem}><Text style={styles.statValue}>3</Text><Text style={styles.statLabel}>Interviews</Text></View><View style={styles.statDivider} /><View style={styles.statItem}><Text style={styles.statValue}>1</Text><Text style={styles.statLabel}>Offers</Text></View></View></Card>
      <View style={styles.tabsContainer}><TabButton tab="jobs" title="Jobs" icon="briefcase-outline" count={mockJobs.length} /><TabButton tab="resources" title="Resources" icon="library-outline" /><TabButton tab="events" title="Events" icon="calendar-outline" count={events.length} /></View>
      
      {/* Your existing renderContent logic is perfect */}
      {selectedTab === 'resources' ? <ScrollView style={styles.tabContent}><Text style={styles.sectionTitle}>Career Resources</Text><View style={styles.resourcesGrid}>{resources.map((r) => <ResourceCard key={r.id} resource={r} onPress={() => handleResourcePress(r)}/>)}</View></ScrollView> : <View />}
      {selectedTab === 'jobs' ? <ScrollView style={styles.tabContent}><Text style={styles.sectionTitle}>Job Opportunities</Text>{mockJobs.map((j) => <JobCard key={j.id} job={j} onApply={handleApplyJob}/>)}</ScrollView> : <View />}
      {selectedTab === 'events' ? <ScrollView style={styles.tabContent}><Text style={styles.sectionTitle}>Upcoming Events</Text>{events.map((e) => <EventCard key={e.id} event={e}/>)}</ScrollView> : <View />}

    </SafeAreaView>
  );
}

// --- Your existing styles from the original file ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  headerGradient: { paddingBottom: SPACING.lg, },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.surface, fontWeight: '700', },
  headerSubtitle: { ...TYPOGRAPHY.body2, color: COLORS.surface, opacity: 0.9, marginTop: 4, },
  headerButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', },
  statsCard: { marginHorizontal: SPACING.lg, marginTop: -SPACING.lg, marginBottom: SPACING.lg, zIndex: 1, },
  statsContainer: { flexDirection: 'row', alignItems: 'center', },
  statItem: { flex: 1, alignItems: 'center', },
  statValue: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, fontWeight: '700', },
  statLabel: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, marginTop: 4, },
  statDivider: { width: 1, height: 40, backgroundColor: COLORS.borderLight, },
  tabsContainer: { flexDirection: 'row', backgroundColor: COLORS.surface, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, ...SHADOWS.small, },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm, borderRadius: 8, gap: SPACING.xs, position: 'relative', },
  activeTabButton: { backgroundColor: `${COLORS.primary}15`, },
  tabText: { ...TYPOGRAPHY.body2, color: COLORS.textTertiary, fontWeight: '600', },
  activeTabText: { color: COLORS.primary, },
  tabBadge: { backgroundColor: COLORS.error, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 4, },
  tabBadgeText: { ...TYPOGRAPHY.caption, color: COLORS.surface, fontSize: 10, fontWeight: '700', },
  tabContent: { flex: 1, padding: SPACING.lg, },
  sectionTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, marginBottom: SPACING.lg, },
  jobsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg, },
  filterButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${COLORS.primary}15`, justifyContent: 'center', alignItems: 'center', },
  jobsContainer: { gap: SPACING.md, },
  jobCard: { padding: SPACING.lg, },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, },
  companyLogo: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', },
  companyInitial: { ...TYPOGRAPHY.h4, color: COLORS.surface, fontWeight: '700', },
  jobBadge: { backgroundColor: COLORS.success, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: 12, },
  jobBadgeText: { ...TYPOGRAPHY.caption, color: COLORS.surface, fontWeight: '700', },
  jobTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary, marginBottom: SPACING.xs, },
  jobCompany: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, marginBottom: SPACING.md, },
  jobDetails: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md, },
  jobDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 4, },
  jobDetailText: { ...TYPOGRAPHY.body2, color: COLORS.textTertiary, },
  jobSkills: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.md, },
  skillTag: { backgroundColor: COLORS.background, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: 12, },
  skillText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, fontWeight: '600', },
  applyButton: { marginTop: SPACING.sm, },
  resourcesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, },
  resourceCard: { width: (width - SPACING.lg * 3) / 2, height: 140, borderRadius: 16, overflow: 'hidden', },
  resourceGradient: { flex: 1, padding: SPACING.md, justifyContent: 'space-between', },
  resourceIcon: { alignSelf: 'flex-end', },
  resourceTitle: { ...TYPOGRAPHY.h4, color: COLORS.surface, fontWeight: '700', marginBottom: 4, },
  resourceDescription: { ...TYPOGRAPHY.body2, color: COLORS.surface, opacity: 0.9, },
  eventsContainer: { gap: SPACING.md, },
  eventCard: { flexDirection: 'row', padding: SPACING.lg, },
  eventDate: { width: 60, alignItems: 'center', marginRight: SPACING.md, },
  eventMonth: { ...TYPOGRAPHY.caption, color: COLORS.primary, fontWeight: '700', },
  eventDay: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, fontWeight: '700', },
  eventDetails: { flex: 1, },
  eventTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary, marginBottom: SPACING.xs, },
  eventDescription: { ...TYPOGRAPHY.body2, color: COLORS.textSecondary, marginBottom: SPACING.sm, lineHeight: 18, },
  eventMeta: { flexDirection: 'row', gap: SPACING.md, },
  eventMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, },
  eventMetaText: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, },
});