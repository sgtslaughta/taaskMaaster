/**
 * @fileoverview Typography tokens for the TaaskMaaster design system
 * @description Defines the complete typography system with Inter font family, weights, sizes, and spacing
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

/**
 * @description Font family definitions
 */
export const fontFamily = {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
} as const;

/**
 * @description Font weight definitions
 */
export const fontWeight = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400, // Regular body text
  medium: 500,
  semibold: 600, // Headings
  bold: 700, // Bold headings
  extrabold: 800,
  black: 900,
} as const;

/**
 * @description Font size scale (12px, 14px, 16px, 18px, 20px, 24px, 30px, 36px, 48px)
 */
export const fontSize = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  '5xl': '3rem',     // 48px
  '6xl': '3.75rem',  // 60px
  '7xl': '4.5rem',   // 72px
  '8xl': '6rem',     // 96px
  '9xl': '8rem',     // 128px
} as const;

/**
 * @description Line height definitions
 */
export const lineHeight = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

/**
 * @description Letter spacing definitions
 */
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

/**
 * @description Typography scale for different text styles
 */
export const typography = {
  display: {
    large: {
      fontSize: fontSize['5xl'],
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.bold,
      letterSpacing: letterSpacing.tight,
    },
    medium: {
      fontSize: fontSize['4xl'],
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.bold,
      letterSpacing: letterSpacing.tight,
    },
    small: {
      fontSize: fontSize['3xl'],
      lineHeight: lineHeight.snug,
      fontWeight: fontWeight.bold,
      letterSpacing: letterSpacing.tight,
    },
  },
  heading: {
    h1: {
      fontSize: fontSize['4xl'],
      lineHeight: lineHeight.tight,
      fontWeight: fontWeight.bold,
      letterSpacing: letterSpacing.tight,
    },
    h2: {
      fontSize: fontSize['3xl'],
      lineHeight: lineHeight.snug,
      fontWeight: fontWeight.semibold,
      letterSpacing: letterSpacing.tight,
    },
    h3: {
      fontSize: fontSize['2xl'],
      lineHeight: lineHeight.snug,
      fontWeight: fontWeight.semibold,
      letterSpacing: letterSpacing.normal,
    },
    h4: {
      fontSize: fontSize.xl,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.semibold,
      letterSpacing: letterSpacing.normal,
    },
    h5: {
      fontSize: fontSize.lg,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.normal,
    },
    h6: {
      fontSize: fontSize.base,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.normal,
    },
  },
  body: {
    large: {
      fontSize: fontSize.lg,
      lineHeight: lineHeight.relaxed,
      fontWeight: fontWeight.normal,
      letterSpacing: letterSpacing.normal,
    },
    medium: {
      fontSize: fontSize.base,
      lineHeight: lineHeight.relaxed,
      fontWeight: fontWeight.normal,
      letterSpacing: letterSpacing.normal,
    },
    small: {
      fontSize: fontSize.sm,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.normal,
      letterSpacing: letterSpacing.normal,
    },
    xs: {
      fontSize: fontSize.xs,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.normal,
      letterSpacing: letterSpacing.normal,
    },
  },
  label: {
    large: {
      fontSize: fontSize.base,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.normal,
    },
    medium: {
      fontSize: fontSize.sm,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.normal,
    },
    small: {
      fontSize: fontSize.xs,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.medium,
      letterSpacing: letterSpacing.wide,
    },
  },
  caption: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.normal,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  code: {
    inline: {
      fontSize: fontSize.sm,
      lineHeight: lineHeight.normal,
      fontWeight: fontWeight.normal,
      fontFamily: fontFamily.mono,
    },
    block: {
      fontSize: fontSize.sm,
      lineHeight: lineHeight.relaxed,
      fontWeight: fontWeight.normal,
      fontFamily: fontFamily.mono,
    },
  },
} as const;

/**
 * @description Typography tokens for different contexts
 */
export const textStyles = {
  // Display text for hero sections
  display: typography.display,
  
  // Heading styles for page titles and sections
  heading: typography.heading,
  
  // Body text for content
  body: typography.body,
  
  // Label text for form elements and UI labels
  label: typography.label,
  
  // Caption text for small helper text
  caption: typography.caption,
  
  // Code text for technical content
  code: typography.code,
} as const;

/**
 * @description Complete typography system export
 */
export const typographyTokens = {
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
  typography,
  textStyles,
} as const;

export type TypographyToken = typeof typographyTokens;
export type FontFamily = typeof fontFamily;
export type FontWeight = typeof fontWeight;
export type FontSize = typeof fontSize;
export type LineHeight = typeof lineHeight;
export type LetterSpacing = typeof letterSpacing;
export type Typography = typeof typography;
export type TextStyles = typeof textStyles;
