// screens/career/components/ThemePicker.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const colorOptions = ['#4A90E2', '#34495E', '#2E7D32', '#6A1B9A']; // Blue, Navy, Green, Purple

const ThemePicker = ({ selectedColor, onSelectColor }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Theme Color</Text>
    <View style={styles.swatchContainer}>
      {colorOptions.map((color) => (
        <TouchableOpacity
          key={color}
          style={[styles.swatch, { backgroundColor: color }, selectedColor === color && styles.selectedSwatch]}
          onPress={() => onSelectColor(color)}
        />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  swatchContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  selectedSwatch: { borderColor: '#fff', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2 },
});

export default ThemePicker;