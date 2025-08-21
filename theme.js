// theme.js
export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',

  // Backgrounds
  background: '#F2F2F7',
  surface: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.4)',

  // Text
  textPrimary: '#1C1C1E',
  textSecondary: '#3C3C43',
  textTertiary: '#8E8E93',

  // Borders
  border: '#C6C6C8',
  borderLight: '#E5E5EA',

  // Status
  online: '#30D158',
  offline: '#8E8E93',

  // Gradients
  primaryGradient: ['#007AFF', '#5856D6'],
  successGradient: ['#34C759', '#30D158'],
};

export const TYPOGRAPHY = {
  // Headers
  h1: { fontSize: 32, fontWeight: '700', lineHeight: 38 },
  h2: { fontSize: 28, fontWeight: '600', lineHeight: 34 },
  h3: { fontSize: 24, fontWeight: '600', lineHeight: 30 },
  h4: { fontSize: 20, fontWeight: '600', lineHeight: 26 },

  // Body
  body1: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  body2: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },

  // Buttons
  button: { fontSize: 16, fontWeight: '600', lineHeight: 20 },
  buttonSmall: { fontSize: 14, fontWeight: '600', lineHeight: 18 },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
};
