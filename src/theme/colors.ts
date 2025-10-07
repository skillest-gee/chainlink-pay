/**
 * Professional Color System
 * 3 Major Colors: Primary Blue, Neutral Gray, Accent Green
 */

export const colors = {
  // Primary Colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main primary
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Neutral Colors (Main background/text)
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a', // Dark background
  },
  
  // Accent Colors (Success/CTA)
  accent: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Main accent
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Semantic Colors
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Background Colors
  background: {
    primary: '#0a0a0a',    // Main dark background
    secondary: '#171717',  // Card backgrounds
    tertiary: '#262626',   // Input backgrounds
    overlay: 'rgba(0, 0, 0, 0.8)', // Modal overlays
  },
  
  // Text Colors
  text: {
    primary: '#ffffff',    // Main text
    secondary: '#a3a3a3',  // Secondary text
    muted: '#737373',     // Muted text
    inverse: '#0a0a0a',   // Text on light backgrounds
  },
  
  // Border Colors
  border: {
    primary: 'rgba(255, 255, 255, 0.1)',
    secondary: 'rgba(255, 255, 255, 0.05)',
    accent: 'rgba(34, 197, 94, 0.3)',
    focus: '#22c55e',
  }
};

export default colors;
