import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AssignmentsScreen() { // Renamed from HomeScreen
  return (
    <View style={styles.container}>
      <Text>Assignments</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container:{ flex:1, justifyContent:'center', alignItems:'center' } });