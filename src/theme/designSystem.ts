/**
 * Professional Design System for ChainLinkPay
 * Comprehensive design tokens and component styles
 */

export const designTokens = {
  // Color Palette
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#00d4ff', // Main brand color
      600: '#0099cc',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    
    // Secondary Colors
    secondary: {
      50: '#fef7ff',
      100: '#fce7ff',
      200: '#f8d4fe',
      300: '#f2b5fc',
      400: '#e879f9',
      500: '#d946ef',
      600: '#c026d3',
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
    },
    
    // Accent Colors
    accent: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#ff6b35', // Orange accent
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    
    // Success Colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#00ff88',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    
    // Error Colors
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ff4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    
    // Warning Colors
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#ffaa00',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    
    // Neutral Colors
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
    },
    
    // Dark Theme Colors
    dark: {
      bg: {
        primary: '#0a0a0a',
        secondary: '#111111',
        tertiary: '#1a1a1a',
        card: '#1e1e1e',
        hover: '#2a2a2a',
      },
      text: {
        primary: '#ffffff',
        secondary: '#a0a0a0',
        tertiary: '#666666',
        accent: '#00d4ff',
      },
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      primary: 'Inter, system-ui, sans-serif',
      mono: 'JetBrains Mono, Consolas, monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Spacing
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
  },
  
  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px rgba(0, 212, 255, 0.3)',
    glowStrong: '0 0 40px rgba(0, 212, 255, 0.4)',
  },
  
  // Transitions
  transitions: {
    fast: '0.15s ease-in-out',
    normal: '0.2s ease-in-out',
    slow: '0.3s ease-in-out',
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Component Styles
export const componentStyles = {
  // Button Styles
  button: {
    primary: {
      bg: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
      color: 'white',
      border: 'none',
      borderRadius: 'xl',
      fontWeight: 'semibold',
      transition: 'all 0.2s ease',
      _hover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0, 212, 255, 0.3)',
      },
      _active: {
        transform: 'translateY(0)',
      },
    },
    secondary: {
      bg: 'transparent',
      color: '#00d4ff',
      border: '2px solid',
      borderColor: '#00d4ff',
      borderRadius: 'xl',
      fontWeight: 'semibold',
      transition: 'all 0.2s ease',
      _hover: {
        bg: 'rgba(0, 212, 255, 0.1)',
        borderColor: '#0099cc',
        transform: 'translateY(-2px)',
      },
    },
    ghost: {
      bg: 'transparent',
      color: '#a0a0a0',
      border: 'none',
      borderRadius: 'lg',
      fontWeight: 'medium',
      transition: 'all 0.2s ease',
      _hover: {
        color: '#00d4ff',
        bg: 'rgba(0, 212, 255, 0.1)',
      },
    },
  },
  
  // Card Styles
  card: {
    base: {
      bg: 'rgba(30, 30, 30, 0.9)',
      backdropFilter: 'blur(20px)',
      borderRadius: '2xl',
      border: '1px solid',
      borderColor: 'rgba(0, 212, 255, 0.3)',
      shadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
      transition: 'all 0.3s ease',
      _hover: {
        borderColor: 'rgba(0, 212, 255, 0.5)',
        boxShadow: '0 25px 80px rgba(0, 212, 255, 0.2)',
      },
    },
    glass: {
      bg: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      borderRadius: 'xl',
      border: '1px solid',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    },
  },
  
  // Input Styles
  input: {
    base: {
      bg: 'rgba(30, 30, 30, 0.8)',
      border: '2px solid',
      borderColor: 'rgba(0, 212, 255, 0.3)',
      borderRadius: 'xl',
      color: 'white',
      transition: 'all 0.2s ease',
      _hover: {
        borderColor: 'rgba(0, 212, 255, 0.5)',
      },
      _focus: {
        borderColor: '#00d4ff',
        boxShadow: '0 0 0 3px rgba(0, 212, 255, 0.1)',
      },
    },
  },
  
  // Navigation Styles
  nav: {
    item: {
      color: '#ffffff',
      fontWeight: '600',
      px: '4',
      py: '2',
      borderRadius: 'xl',
      bg: 'rgba(0, 212, 255, 0.1)',
      border: '1px solid',
      borderColor: 'rgba(0, 212, 255, 0.3)',
      transition: 'all 0.3s ease',
      _hover: {
        bg: 'rgba(0, 212, 255, 0.2)',
        borderColor: 'rgba(0, 212, 255, 0.5)',
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0, 212, 255, 0.3)',
      },
    },
  },
};

// Utility Functions
export const getResponsiveValue = (values: any) => ({
  base: values.base || values.sm || values.md || values.lg || values.xl,
  sm: values.sm || values.md || values.lg || values.xl,
  md: values.md || values.lg || values.xl,
  lg: values.lg || values.xl,
  xl: values.xl,
});

export const createGradient = (from: string, to: string, direction = '135deg') => 
  `linear-gradient(${direction}, ${from} 0%, ${to} 100%)`;

export const createGlow = (color: string, intensity = 0.3) => 
  `0 0 20px rgba(${color}, ${intensity})`;
