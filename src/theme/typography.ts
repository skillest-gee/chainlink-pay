/**
 * Professional Typography System
 * Consistent typography across the application
 */

export const typography = {
  // Headings
  heading: {
    hero: {
      fontSize: { base: '3xl', md: '4xl', lg: '5xl' },
      fontWeight: 'bold',
      lineHeight: 'tight',
      letterSpacing: '-0.02em',
    },
    h1: {
      fontSize: { base: '2xl', md: '3xl', lg: '4xl' },
      fontWeight: 'bold',
      lineHeight: 'tight',
      letterSpacing: '-0.01em',
    },
    h2: {
      fontSize: { base: 'xl', md: '2xl', lg: '3xl' },
      fontWeight: 'bold',
      lineHeight: 'tight',
    },
    h3: {
      fontSize: { base: 'lg', md: 'xl', lg: '2xl' },
      fontWeight: 'semibold',
      lineHeight: 'normal',
    },
    h4: {
      fontSize: { base: 'md', md: 'lg', lg: 'xl' },
      fontWeight: 'semibold',
      lineHeight: 'normal',
    },
  },
  
  // Body Text
  body: {
    large: {
      fontSize: { base: 'lg', md: 'xl' },
      fontWeight: 'normal',
      lineHeight: 'relaxed',
    },
    base: {
      fontSize: { base: 'md', md: 'lg' },
      fontWeight: 'normal',
      lineHeight: 'normal',
    },
    small: {
      fontSize: { base: 'sm', md: 'md' },
      fontWeight: 'normal',
      lineHeight: 'normal',
    },
    caption: {
      fontSize: { base: 'xs', md: 'sm' },
      fontWeight: 'medium',
      lineHeight: 'normal',
    },
  },
  
  // Special Text
  gradient: {
    primary: {
      bg: 'linear-gradient(135deg, #00d4ff 0%, #ffffff 100%)',
      bgClip: 'text',
      fontWeight: 'bold',
    },
    secondary: {
      bg: 'linear-gradient(135deg, #ff6b35 0%, #ffaa00 100%)',
      bgClip: 'text',
      fontWeight: 'bold',
    },
    accent: {
      bg: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
      bgClip: 'text',
      fontWeight: 'bold',
    },
  },
  
  // Button Text
  button: {
    primary: {
      fontSize: { base: 'md', md: 'lg' },
      fontWeight: 'semibold',
      letterSpacing: '0.01em',
    },
    secondary: {
      fontSize: { base: 'sm', md: 'md' },
      fontWeight: 'medium',
      letterSpacing: '0.01em',
    },
    small: {
      fontSize: { base: 'xs', md: 'sm' },
      fontWeight: 'medium',
      letterSpacing: '0.01em',
    },
  },
  
  // Code Text
  code: {
    fontSize: { base: 'sm', md: 'md' },
    fontFamily: 'JetBrains Mono, Consolas, monospace',
    fontWeight: 'normal',
    lineHeight: 'normal',
  },
  
  // Label Text
  label: {
    fontSize: { base: 'sm', md: 'md' },
    fontWeight: 'medium',
    letterSpacing: '0.01em',
  },
};

// Utility functions for typography
export const getTypography = (variant: keyof typeof typography) => typography[variant];

export const createGradientText = (gradient: string, text: string) => ({
  background: gradient,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 'bold',
});

export const createTextShadow = (color: string, blur = '2px') => 
  `0 0 ${blur} ${color}`;
