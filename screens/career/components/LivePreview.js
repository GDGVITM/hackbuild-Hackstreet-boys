// screens/career/components/LivePreview.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const LivePreview = ({ resume, themeColor }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Live Preview</Text>
    <View style={styles.resume}>
      {/* Left Column */}
      <View style={[styles.leftColumn, { backgroundColor: themeColor }]}>
        <Text style={[styles.name, styles.textLight]}>{resume.personalInfo.name || 'Your Name'}</Text>
        <Text style={[styles.jobTitle, styles.textLight]}>{resume.personalInfo.title || 'Job Title'}</Text>
        <Text style={[styles.contact, styles.textLight]}>{resume.personalInfo.email}</Text>
        <Text style={[styles.contact, styles.textLight]}>{resume.personalInfo.phone}</Text>
      </View>
      {/* Right Column */}
      <View style={styles.rightColumn}>
        <Text style={[styles.sectionHeader, { color: themeColor, borderBottomColor: themeColor }]}>EXPERIENCE</Text>
        {resume.workExperience.map((exp, i) => (
          <Text key={i} style={styles.itemTitle}>{exp.company}</Text>
        ))}
        <Text style={[styles.sectionHeader, { color: themeColor, borderBottomColor: themeColor }]}>EDUCATION</Text>
        {resume.education.map((edu, i) => (
          <Text key={i} style={styles.itemTitle}>{edu.school}</Text>
        ))}
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  resume: { flexDirection: 'row', backgroundColor: '#fff', minHeight: 400, borderWidth: 1, borderColor: '#eee' },
  leftColumn: { width: '35%', padding: 10 },
  rightColumn: { width: '65%', padding: 10 },
  textLight: { color: '#fff' },
  name: { fontSize: 22, fontWeight: 'bold' },
  jobTitle: { fontSize: 14, opacity: 0.9, marginBottom: 20 },
  contact: { fontSize: 12 },
  sectionHeader: { fontSize: 14, fontWeight: 'bold', borderBottomWidth: 2, paddingBottom: 2, marginBottom: 8 },
  itemTitle: { fontSize: 12, fontWeight: 'bold' },
});

export default LivePreview;