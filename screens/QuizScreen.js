import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../theme';

// Mock data for the quizzes. In a real app, this would come from a backend.
const quizData = {
  'Mathematics': [
    { question: 'What is the value of π (pi) to two decimal places?', options: ['3.12', '3.14', '3.16', '3.18'], answer: '3.14' },
    { question: 'What is 5 squared?', options: ['10', '15', '20', '25'], answer: '25' },
    { question: 'What is the square root of 81?', options: ['7', '8', '9', '10'], answer: '9' },
    { question: 'Solve for x: 2x + 5 = 15', options: ['3', '4', '5', '6'], answer: '5' },
    { question: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], answer: '6' },
  ],
  'Computer Science': [
    { question: 'What does "CPU" stand for?', options: ['Central Process Unit', 'Computer Personal Unit', 'Central Processing Unit', 'Central Processor Unit'], answer: 'Central Processing Unit' },
    { question: 'Which data structure uses LIFO (Last-In, First-Out)?', options: ['Queue', 'Stack', 'Array', 'Linked List'], answer: 'Stack' },
    { question: 'What is the binary equivalent of the decimal number 10?', options: ['1010', '1100', '1001', '1110'], answer: '1010' },
    { question: 'In object-oriented programming, what is inheritance?', options: ['Objects sharing data', 'A class acquiring properties of another class', 'Data hiding', 'Function overloading'], answer: 'A class acquiring properties of another class' },
    { question: 'Which of the following is not a programming language?', options: ['Python', 'Java', 'HTML', 'C++'], answer: 'HTML' },
  ],
  'Physics': [
    { question: 'What is the unit of electric current?', options: ['Volt', 'Watt', 'Ampere', 'Ohm'], answer: 'Ampere' },
    { question: 'Which law states that for every action, there is an equal and opposite reaction?', options: ['Newton\'s First Law', 'Newton\'s Second Law', 'Newton\'s Third Law', 'Law of Gravitation'], answer: 'Newton\'s Third Law' },
    { question: 'What is the formula for calculating speed?', options: ['Distance / Time', 'Time / Distance', 'Distance * Time', 'Force / Mass'], answer: 'Distance / Time' },
    { question: 'What phenomenon causes a rainbow?', options: ['Reflection', 'Refraction', 'Dispersion', 'Diffraction'], answer: 'Dispersion' },
    { question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], answer: 'Mars' },
  ],
  'Chemistry': [
    { question: 'What is the chemical symbol for Gold?', options: ['Ag', 'Au', 'Gd', 'Go'], answer: 'Au' },
    { question: 'What is the most abundant gas in Earth\'s atmosphere?', options: ['Oxygen', 'Hydrogen', 'Nitrogen', 'Carbon Dioxide'], answer: 'Nitrogen' },
    { question: 'What is the pH of pure water?', options: ['6', '7', '8', '9'], answer: '7' },
    { question: 'What is H2O more commonly known as?', options: ['Salt', 'Sugar', 'Vinegar', 'Water'], answer: 'Water' },
    { question: 'Which element is essential for respiration?', options: ['Carbon', 'Oxygen', 'Nitrogen', 'Hydrogen'], answer: 'Oxygen' },
  ]
};


export default function QuizScreen({ route, navigation }) {
  const { quiz } = route.params;
  const questions = quizData[quiz.subject] || [];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});

  if (questions.length === 0) {
    Alert.alert("Quiz Not Found", "Sorry, questions for this subject are not available yet.", [
      { text: "OK", onPress: () => navigation.goBack() }
    ]);
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}><Text>No questions found.</Text></View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedOption = selectedAnswers[currentQuestionIndex];

  const handleSelectOption = (option) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: option,
    });
  };

  const handleSubmitQuiz = () => {
    let finalScore = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.answer) {
        finalScore++;
      }
    });

    navigation.replace('QuizResult', {
      score: finalScore,
      totalQuestions: questions.length,
      quiz: quiz,
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{quiz.title}</Text>
        <Text style={styles.progressText}>{`${currentQuestionIndex + 1}/${questions.length}`}</Text>
      </View>

      <View style={styles.container}>
        <Card style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </Card>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.optionButton, selectedOption === option && styles.selectedOption]}
              onPress={() => handleSelectOption(option)}
            >
              <Text style={[styles.optionText, selectedOption === option && styles.selectedOptionText]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button 
          title={currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'} 
          onPress={handleNextQuestion}
          disabled={!selectedOption}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary },
  progressText: { ...TYPOGRAPHY.body2, color: COLORS.textTertiary },
  container: { flex: 1, padding: SPACING.lg, justifyContent: 'space-between' },
  questionCard: { padding: SPACING.xl, alignItems: 'center' },
  questionText: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary, textAlign: 'center', lineHeight: 28 },
  optionsContainer: { flex: 1, justifyContent: 'center', gap: SPACING.md },
  optionButton: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  selectedOption: {
    backgroundColor: `${COLORS.primary}2A`,
    borderColor: COLORS.primary,
  },
  optionText: { ...TYPOGRAPHY.body1, color: COLORS.textPrimary, textAlign: 'center', fontWeight: '600' },
  selectedOptionText: { color: COLORS.primary },
});