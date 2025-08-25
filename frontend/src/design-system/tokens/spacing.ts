/**
 * @fileoverview Spacing tokens for the TaaskMaaster design system
 * @description Defines the complete spacing and sizing system for consistent layout and component spacing
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

/**
 * @description Base spacing unit (4px)
 */
export const baseSpacing = 4;

/**
 * @description Spacing scale based on 4px grid system
 */
export const spacing = {
  0: '0px',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  7: '1.75rem',   // 28px
  8: '2rem',      // 32px
  9: '2.25rem',   // 36px
  10: '2.5rem',   // 40px
  11: '2.75rem',  // 44px
  12: '3rem',     // 48px
  14: '3.5rem',   // 56px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  28: '7rem',     // 112px
  32: '8rem',     // 128px
  36: '9rem',     // 144px
  40: '10rem',    // 160px
  44: '11rem',    // 176px
  48: '12rem',    // 192px
  52: '13rem',    // 208px
  56: '14rem',    // 224px
  60: '15rem',    // 240px
  64: '16rem',    // 256px
  72: '18rem',    // 288px
  80: '20rem',    // 320px
  96: '24rem',    // 384px
} as const;

/**
 * @description Sizing scale for width, height, and other dimensions
 */
export const sizing = {
  // Fixed sizes
  none: 'none',
  auto: 'auto',
  min: 'min-content',
  max: 'max-content',
  fit: 'fit-content',
  
  // Percentage sizes
  '1/2': '50%',
  '1/3': '33.333333%',
  '2/3': '66.666667%',
  '1/4': '25%',
  '2/4': '50%',
  '3/4': '75%',
  '1/5': '20%',
  '2/5': '40%',
  '3/5': '60%',
  '4/5': '80%',
  '1/6': '16.666667%',
  '2/6': '33.333333%',
  '3/6': '50%',
  '4/6': '66.666667%',
  '5/6': '83.333333%',
  '1/12': '8.333333%',
  '2/12': '16.666667%',
  '3/12': '25%',
  '4/12': '33.333333%',
  '5/12': '41.666667%',
  '6/12': '50%',
  '7/12': '58.333333%',
  '8/12': '66.666667%',
  '9/12': '75%',
  '10/12': '83.333333%',
  '11/12': '91.666667%',
  
  // Viewport sizes
  screen: '100vw',
  'screen-sm': '640px',
  'screen-md': '768px',
  'screen-lg': '1024px',
  'screen-xl': '1280px',
  'screen-2xl': '1536px',
  
  // Full sizes
  full: '100%',
  'full-screen': '100vh',
} as const;

/**
 * @description Border radius scale
 */
export const borderRadius = {
  none: '0px',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',   // Fully rounded
} as const;

/**
 * @description Shadow scale for depth and elevation
 */
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
} as const;

/**
 * @description Z-index scale for layering
 */
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

/**
 * @description Layout-specific spacing tokens
 */
export const layout = {
  // Container spacing
  container: {
    padding: spacing[4],
    maxWidth: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
  
  // Section spacing
  section: {
    padding: {
      sm: `${spacing[8]} ${spacing[4]}`,
      md: `${spacing[12]} ${spacing[6]}`,
      lg: `${spacing[16]} ${spacing[8]}`,
      xl: `${spacing[20]} ${spacing[10]}`,
    },
  },
  
  // Component spacing
  component: {
    padding: {
      xs: spacing[2],
      sm: spacing[3],
      md: spacing[4],
      lg: spacing[6],
      xl: spacing[8],
    },
    margin: {
      xs: spacing[2],
      sm: spacing[3],
      md: spacing[4],
      lg: spacing[6],
      xl: spacing[8],
    },
    gap: {
      xs: spacing[2],
      sm: spacing[3],
      md: spacing[4],
      lg: spacing[6],
      xl: spacing[8],
    },
  },
  
  // Form spacing
  form: {
    field: {
      padding: spacing[3],
      margin: spacing[2],
      gap: spacing[2],
    },
    group: {
      gap: spacing[4],
      margin: spacing[4],
    },
  },
  
  // Navigation spacing
  navigation: {
    item: {
      padding: spacing[3],
      gap: spacing[2],
    },
    group: {
      gap: spacing[2],
      padding: spacing[2],
    },
  },
} as const;

/**
 * @description Complete spacing system export
 */
export const spacingTokens = {
  baseSpacing,
  spacing,
  sizing,
  borderRadius,
  shadows,
  zIndex,
  layout,
} as const;

export type SpacingToken = typeof spacingTokens;
export type Spacing = typeof spacing;
export type Sizing = typeof sizing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type ZIndex = typeof zIndex;
export type Layout = typeof layout;
