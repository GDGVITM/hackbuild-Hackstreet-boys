// screens/CommunityScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function CommunityScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Community</Text>
    </SafeAreaView>
  );
}

// Add this entire block
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});