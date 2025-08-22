import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Card } from '../components/common/Card';
import { COLORS, TYPOGRAPHY, SPACING } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const SubjectAttendanceCard = ({ subject, attended, total }) => {
  const percentage = total > 0 ? (attended / total) * 100 : 0;
  const isLow = percentage < 75;

  return (
    <Card style={styles.card}>
      <View style={styles.cardContent}>
        <View>
          <Text style={styles.subjectTitle}>{subject}</Text>
          <Text style={styles.subjectStats}>{`${attended} / ${total} classes attended`}</Text>
        </View>
        <View style={[styles.percentageContainer, isLow && styles.lowPercentageContainer]}>
          <Text style={[styles.percentageText, isLow && styles.lowPercentageText]}>
            {percentage.toFixed(1)}%
          </Text>
        </View>
      </View>
      {isLow && (
        <View style={styles.warningMessage}>
          <Ionicons name="warning-outline" size={16} color={COLORS.error} />
          <Text style={styles.warningText}>Your attendance is below 75%</Text>
        </View>
      )}
    </Card>
  );
};

export default function AttendanceScreen() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const attendanceDocRef = doc(db, 'attendance', currentUser.uid);
    const unsubscribe = onSnapshot(attendanceDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().subjects || {};
        const formattedData = Object.keys(data).map(key => ({
          subject: key,
          ...data[key],
        }));
        setAttendanceData(formattedData);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance Tracker</Text>
      </View>
      <FlatList
        data={attendanceData}
        keyExtractor={(item) => item.subject}
        renderItem={({ item }) => <SubjectAttendanceCard {...item} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No attendance data found.</Text>
            <Text style={styles.emptySubText}>Attend a class to get started!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  headerTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, textAlign: 'center' },
  listContainer: { padding: SPACING.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...TYPOGRAPHY.h4, color: COLORS.textTertiary },
  emptySubText: { ...TYPOGRAPHY.body1, color: COLORS.textTertiary, marginTop: SPACING.sm },
  card: { marginBottom: SPACING.md },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subjectTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  subjectStats: { ...TYPOGRAPHY.body2, color: COLORS.textSecondary },
  percentageContainer: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 16, backgroundColor: `${COLORS.success}20` },
  lowPercentageContainer: { backgroundColor: `${COLORS.error}20` },
  percentageText: { ...TYPOGRAPHY.h4, color: COLORS.success, fontWeight: '700' },
  lowPercentageText: { color: COLORS.error },
  warningMessage: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md, backgroundColor: `${COLORS.error}10`, padding: SPACING.sm, borderRadius: 8 },
  warningText: { ...TYPOGRAPHY.body2, color: COLORS.error, marginLeft: SPACING.sm },
});
