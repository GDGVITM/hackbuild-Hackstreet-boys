import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SHADOWS, SPACING } from '../../theme';

export const Card = ({ children, style, shadow = 'medium', ...props }) => (
  <View style={[styles.card, SHADOWS[shadow], style]} {...props}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
  },
});