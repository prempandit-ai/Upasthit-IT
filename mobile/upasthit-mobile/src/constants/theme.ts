/**
 * Upasthit Design System – White + Navy theme
 *
 * Semantic colour tokens for light (white/navy) and dark modes.
 * Import `Navy` for brand-specific colours that are always navy.
 */

import '@/global.css';

import { Platform } from 'react-native';

// ─── Semantic theme tokens (light / dark) ────────────────────────────────────

export const Colors = {
  light: {
    /** Primary body text */
    text: '#0F172A',
    /** Page / screen background */
    background: '#FFFFFF',
    /** Card / elevated surface background */
    backgroundElement: '#F8FAFC',
    /** Input border, dividers, selected state */
    backgroundSelected: '#D8DEE9',
    /** Secondary / muted text */
    textSecondary: '#64748B',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// ─── Navy brand palette (theme-independent) ──────────────────────────────────

/** Use these wherever you need navy regardless of light/dark mode. */
export const Navy = {
  /** Primary navy – headings, primary buttons */
  primary: '#0A1F44',
  /** Secondary navy – pressed state, links */
  secondary: '#123A6D',
  /** White – button text on navy, reversed text */
  white: '#FFFFFF',
  /** Input focus ring */
  focusBorder: '#0A1F44',
  /** Success green */
  success: '#16A34A',
  /** Error red */
  error: '#DC2626',
  /** Light amber for status badges */
  pending: '#D97706',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

// ─── Spacing scale ────────────────────────────────────────────────────────────

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
