/**
 * @fileoverview Color tokens for the TaaskMaaster design system
 * @description Defines the complete color palette including primary, secondary, accent, neutral, and semantic colors
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

/**
 * @description Primary color palette - Blue gradient theme
 */
export const primary = {
  50: '#EFF6FF',
  100: '#DBEAFE',
  200: '#BFDBFE',
  300: '#93C5FD',
  400: '#60A5FA',
  500: '#3B82F6', // Main primary color
  600: '#2563EB',
  700: '#1D4ED8', // Darker primary
  800: '#1E40AF',
  900: '#1E3A8A',
  950: '#172554',
} as const;

/**
 * @description Secondary color palette - Green theme for success states
 */
export const secondary = {
  50: '#ECFDF5',
  100: '#D1FAE5',
  200: '#A7F3D0',
  300: '#6EE7B7',
  400: '#34D399',
  500: '#10B981', // Main secondary color
  600: '#059669',
  700: '#047857',
  800: '#065F46',
  900: '#064E3B',
  950: '#022C22',
} as const;

/**
 * @description Accent color palette - Orange theme for gamification
 */
export const accent = {
  50: '#FFFBEB',
  100: '#FEF3C7',
  200: '#FDE68A',
  300: '#FCD34D',
  400: '#FBBF24',
  500: '#F59E0B', // Main accent color
  600: '#D97706',
  700: '#B45309',
  800: '#92400E',
  900: '#78350F',
  950: '#451A03',
} as const;

/**
 * @description Neutral color palette - Gray scale
 */
export const neutral = {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827', // Darkest neutral
  950: '#030712',
} as const;

/**
 * @description Semantic color palette for UI feedback
 */
export const semantic = {
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Success color
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Warning color
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444', // Error color
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Info color
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
} as const;

/**
 * @description Color tokens for light mode
 */
export const light = {
  background: {
    primary: neutral[50],
    secondary: neutral[100],
    tertiary: neutral[200],
    card: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  text: {
    primary: neutral[900],
    secondary: neutral[700],
    tertiary: neutral[500],
    inverse: neutral[50],
    disabled: neutral[400],
  },
  border: {
    primary: neutral[200],
    secondary: neutral[300],
    focus: primary[500],
    error: semantic.error[500],
  },
} as const;

/**
 * @description Color tokens for dark mode
 */
export const dark = {
  background: {
    primary: neutral[900],
    secondary: neutral[800],
    tertiary: neutral[700],
    card: neutral[800],
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  text: {
    primary: neutral[50],
    secondary: neutral[300],
    tertiary: neutral[400],
    inverse: neutral[900],
    disabled: neutral[600],
  },
  border: {
    primary: neutral[700],
    secondary: neutral[600],
    focus: primary[400],
    error: semantic.error[400],
  },
} as const;

/**
 * @description Complete color system export
 */
export const colors = {
  primary,
  secondary,
  accent,
  neutral,
  semantic,
  light,
  dark,
} as const;

export type ColorToken = typeof colors;
export type PrimaryColor = typeof primary;
export type SecondaryColor = typeof secondary;
export type AccentColor = typeof accent;
export type NeutralColor = typeof neutral;
export type SemanticColor = typeof semantic;
