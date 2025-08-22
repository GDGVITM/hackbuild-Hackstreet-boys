import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { COLORS, TYPOGRAPHY, SPACING } from '../theme';

export default function QuizResultScreen({ route, navigation }) {
  const { score, totalQuestions, quiz } = route.params;
  const currentUser = auth.currentUser;
  const percentage = Math.round((score / totalQuestions) * 100);

  useEffect(() => {
    const saveScoreToFirestore = async () => {
      if (!currentUser) {
        console.log("No user found, skipping score save.");
        return;
      }
      try {
        const userQuizAttemptsRef = collection(db, 'users', currentUser.uid, 'quizAttempts');
        await addDoc(userQuizAttemptsRef, {
          quizTitle: quiz.title,
          quizSubject: quiz.subject,
          score: score,
          totalQuestions: totalQuestions,
          timestamp: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error saving quiz score: ", error);
        Alert.alert("Error", "There was an issue saving your score.");
      }
    };

    saveScoreToFirestore();
  }, [currentUser, quiz, score, totalQuestions]);

  const getFeedback = () => {
    if (percentage > 80) return { message: "Excellent Work!", icon: "trophy", color: COLORS.success };
    if (percentage > 60) return { message: "Good Job!", icon: "school", color: COLORS.primary };
    if (percentage > 40) return { message: "Keep Practicing!", icon: "book", color: COLORS.warning };
    return { message: "Needs Improvement", icon: "fitness", color: COLORS.danger };
  };

  const feedback = getFeedback();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Card style={styles.resultCard}>
          <Ionicons name={feedback.icon} size={80} color={feedback.color} />
          <Text style={styles.feedbackText}>{feedback.message}</Text>
          <Text style={styles.scoreText}>You Scored</Text>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreTotal}>/ {totalQuestions}</Text>
          </View>
          <Text style={styles.quizTitle}>in "{quiz.title}"</Text>
        </Card>
        <Button 
          title="Back to Study Hub" 
          onPress={() => navigation.pop(2)} // Pop both result and quiz screens
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  resultCard: {
    width: '100%',
    alignItems: 'center',
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  feedbackText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  scoreText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textTertiary,
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: SPACING.md,
  },
  scoreValue: {
    fontSize: 72,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  scoreTotal: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textTertiary,
    marginLeft: SPACING.xs,
  },
  quizTitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
});