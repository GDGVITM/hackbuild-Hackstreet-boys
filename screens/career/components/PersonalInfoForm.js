import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

const PersonalInfoForm = ({ data, onUpdate }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Personal Info</Text>
    <TextInput style={styles.input} placeholder="Full Name" value={data.name} onChangeText={(text) => onUpdate('name', text)} />
    <TextInput style={styles.input} placeholder="Email Address" value={data.email} onChangeText={(text) => onUpdate('email', text)} keyboardType="email-address" />
    <TextInput style={styles.input} placeholder="Phone Number" value={data.phone} onChangeText={(text) => onUpdate('phone', text)} keyboardType="phone-pad" />
    <TextInput style={styles.input} placeholder="Address (e.g., City, Country)" value={data.address} onChangeText={(text) => onUpdate('address', text)} />
    <TextInput style={styles.input} placeholder="Link (e.g., LinkedIn, GitHub)" value={data.link} onChangeText={(text) => onUpdate('link', text)} />
  </View>
);

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  input: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', fontSize: 16, marginBottom: 10 },
});

export default PersonalInfoForm;