import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../theme';

export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  ...props 
}) => {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];
  
  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? COLORS.surface : COLORS.primary} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  // Variants
  primary: { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  success: { backgroundColor: COLORS.success },
  warning: { backgroundColor: COLORS.warning },
  error: { backgroundColor: COLORS.error },
  // Sizes
  small: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
  medium: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
  large: { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl },
  // Text styles
  text: { fontWeight: '600' },
  primaryText: { color: COLORS.surface },
  secondaryText: { color: COLORS.primary },
  successText: { color: COLORS.surface },
  warningText: { color: COLORS.surface },
  errorText: { color: COLORS.surface },
  smallText: { fontSize: 14 },
  mediumText: { fontSize: 16 },
  largeText: { fontSize: 18 },
  disabled: { opacity: 0.6 },
});
