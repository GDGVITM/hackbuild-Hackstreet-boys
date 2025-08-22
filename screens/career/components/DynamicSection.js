// screens/career/components/DynamicSection.js
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../theme'; // Adjust path if needed

const DynamicSection = ({ title, data, onUpdate, onAdd, onRemove, fields }) => {
  const handleUpdate = (index, field, value) => {
    const updatedData = [...data];
    updatedData[index][field] = value;
    onUpdate(updatedData);
  };

  const handlePointUpdate = (itemIndex, pointIndex, value) => {
    const updatedData = [...data];
    updatedData[itemIndex].points[pointIndex] = value;
    onUpdate(updatedData);
  };

  const addPoint = (itemIndex) => {
    const updatedData = [...data];
    if (!updatedData[itemIndex].points) {
      updatedData[itemIndex].points = [];
    }
    updatedData[itemIndex].points.push('');
    onUpdate(updatedData);
  };

  const removePoint = (itemIndex, pointIndex) => {
    const updatedData = [...data];
    updatedData[itemIndex].points.splice(pointIndex, 1);
    onUpdate(updatedData);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.map((item, index) => (
        <View key={index} style={styles.entry}>
          <TouchableOpacity onPress={() => onRemove(index)} style={styles.removeButton}>
            <Ionicons name="trash-bin-outline" size={22} color="#ff3b30" />
          </TouchableOpacity>
          {fields.map((field) => (
            <TextInput
              key={field.key}
              style={styles.input}
              placeholder={field.placeholder}
              value={item[field.key]}
              onChangeText={(text) => handleUpdate(index, field.key, text)}
            />
          ))}
          {/* Bullet Points Section */}
          <Text style={styles.pointsTitle}>Key Achievements / Bullet Points</Text>
          {item.points && item.points.map((point, pIndex) => (
            <View key={pIndex} style={styles.pointContainer}>
              <TextInput
                style={styles.pointInput}
                placeholder={`Point ${pIndex + 1}`}
                value={point}
                onChangeText={(text) => handlePointUpdate(index, pIndex, text)}
                multiline
              />
              <TouchableOpacity onPress={() => removePoint(index, pIndex)}>
                <Ionicons name="remove-circle-outline" size={22} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={() => addPoint(index)} style={styles.addPointButton}>
            <Text style={styles.addPointButtonText}>+ Add Point</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity onPress={onAdd} style={styles.addButton}>
        <Ionicons name="add-circle-outline" size={22} color="white" />
        <Text style={styles.addButtonText}>Add {title}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: SPACING.lg },
  sectionTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary, marginBottom: SPACING.md },
  entry: { backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: 8, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.borderLight },
  input: { backgroundColor: '#f9f9f9', padding: SPACING.sm, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', fontSize: 16, marginBottom: SPACING.sm },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: 8 },
  addButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: SPACING.sm },
  removeButton: { position: 'absolute', top: 10, right: 10, padding: 5 },
  pointsTitle: { fontWeight: 'bold', marginTop: SPACING.sm, marginBottom: SPACING.xs },
  pointContainer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  pointInput: { flex: 1, backgroundColor: '#f9f9f9', padding: SPACING.sm, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', fontSize: 14, marginVertical: SPACING.xs },
  addPointButton: { paddingVertical: SPACING.xs, alignItems: 'center', borderRadius: 5, backgroundColor: '#eef', marginTop: SPACING.sm },
  addPointButtonText: { color: COLORS.primary, fontWeight: '600' }
});

export default DynamicSection;