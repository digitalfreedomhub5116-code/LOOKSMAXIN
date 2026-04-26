/**
 * Lynx AI — Global Design System
 * "Dark Studio" aesthetic: high-contrast, futuristic, glassmorphism
 */

export const Colors = {
  // ─── Core Backgrounds ───
  background: '#050A1F',        // Midnight blue - infinite depth
  backgroundAlt: '#0A1128',     // Slightly lighter variant
  surface: 'rgba(15, 23, 52, 0.65)',  // Glass panel fill
  surfaceLight: 'rgba(25, 35, 70, 0.55)', // Elevated glass surface

  // ─── Accent Palette ───
  primary: '#8ea1bc',           // Frosty Lynx Blue - main accent
  primaryGlow: 'rgba(142, 161, 188, 0.35)', // Glow variant
  primaryMuted: 'rgba(142, 161, 188, 0.15)', // Very subtle tint

  secondary: '#7B2CBF',         // Neon Purple - AI / special modules
  secondaryGlow: 'rgba(123, 44, 191, 0.40)',

  accent: '#5CE1E6',            // Cyan spark - for highlights & success
  accentGlow: 'rgba(92, 225, 230, 0.30)',

  warning: '#F59E0B',           // Amber
  error: '#EF4444',             // Red
  success: '#22C55E',           // Green

  // ─── Text ───
  textPrimary: '#FFFFFF',
  textSecondary: '#D0D6E0',     // Icy grey
  textMuted: '#7A8BA8',         // Dimmed labels
  textDisabled: '#3E4A66',

  // ─── Borders & Dividers ───
  border: 'rgba(142, 161, 188, 0.30)',  // 30% Lynx Blue
  borderSubtle: 'rgba(142, 161, 188, 0.12)',
  borderActive: 'rgba(142, 161, 188, 0.60)',

  // ─── Tab Bar ───
  tabBarBackground: 'rgba(5, 10, 31, 0.92)',
  tabBarBorder: 'rgba(142, 161, 188, 0.15)',
  tabInactive: '#4A5670',
  tabActive: '#8ea1bc',
} as const;

export const Gradients = {
  // Hero gradient for welcome/splash
  heroBackground: ['#050A1F', '#0A1128', '#0E1A3A'],
  // Glass card gradient
  glassCard: ['rgba(15, 23, 52, 0.80)', 'rgba(10, 17, 40, 0.60)'],
  // Primary accent gradient (buttons, rings)
  primaryAccent: ['#8ea1bc', '#6B8AAE', '#5A7A9E'],
  // AI/Special gradient
  aiGlow: ['#7B2CBF', '#5B21B6', '#3B0F7A'],
  // Center tab button gradient
  centerTab: ['#8ea1bc', '#7B2CBF'],
  // Shimmer / scan line
  scanLine: ['transparent', 'rgba(142, 161, 188, 0.25)', 'transparent'],
} as const;

export const Typography = {
  fontFamily: {
    regular: 'SpaceMono',    // Will swap to Inter when loaded
    bold: 'SpaceMono',
  },
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 22,
    '2xl': 28,
    '3xl': 34,
    '4xl': 42,
    hero: 56,
  },
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 56,
  '5xl': 72,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export const Glass = {
  // Standard glass panel
  panel: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
  },
  // Elevated glass card
  card: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
  },
  // Subtle input field
  input: {
    backgroundColor: 'rgba(10, 17, 40, 0.80)',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.md,
  },
} as const;

import { Platform } from 'react-native';

export const Shadows = {
  glow: Platform.select({
    web: { boxShadow: '0 0 16px rgba(142, 161, 188, 0.4)' },
    default: {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
  }),
  glowPurple: Platform.select({
    web: { boxShadow: '0 0 16px rgba(123, 44, 191, 0.4)' },
    default: {
      shadowColor: Colors.secondary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
  }),
  subtle: Platform.select({
    web: { boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)' },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
  }),
} as const;
