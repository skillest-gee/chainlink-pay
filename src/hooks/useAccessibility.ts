/**
 * Accessibility Hook for ChainLinkPay
 * Provides accessibility features and keyboard navigation
 */

import { useEffect, useState, useCallback } from 'react';

export interface AccessibilityState {
  isKeyboardNavigation: boolean;
  isHighContrast: boolean;
  isReducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  screenReader: boolean;
}

export function useAccessibility() {
  const [state, setState] = useState<AccessibilityState>({
    isKeyboardNavigation: false,
    isHighContrast: false,
    isReducedMotion: false,
    fontSize: 'medium',
    screenReader: false,
  });

  // Detect keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setState(prev => ({ ...prev, isKeyboardNavigation: true }));
      }
    };

    const handleMouseDown = () => {
      setState(prev => ({ ...prev, isKeyboardNavigation: false }));
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Detect high contrast mode
  useEffect(() => {
    const checkHighContrast = () => {
      const isHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      setState(prev => ({ ...prev, isHighContrast }));
    };

    checkHighContrast();
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    mediaQuery.addEventListener('change', checkHighContrast);

    return () => mediaQuery.removeEventListener('change', checkHighContrast);
  }, []);

  // Detect reduced motion preference
  useEffect(() => {
    const checkReducedMotion = () => {
      const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setState(prev => ({ ...prev, isReducedMotion }));
    };

    checkReducedMotion();
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', checkReducedMotion);

    return () => mediaQuery.removeEventListener('change', checkReducedMotion);
  }, []);

  // Detect screen reader
  useEffect(() => {
    const checkScreenReader = () => {
      const hasScreenReader = 
        'speechSynthesis' in window ||
        'speechRecognition' in window ||
        navigator.userAgent.includes('NVDA') ||
        navigator.userAgent.includes('JAWS') ||
        navigator.userAgent.includes('VoiceOver');
      
      setState(prev => ({ ...prev, screenReader: hasScreenReader }));
    };

    checkScreenReader();
  }, []);

  // Set font size
  const setFontSize = useCallback((size: 'small' | 'medium' | 'large') => {
    setState(prev => ({ ...prev, fontSize: size }));
    
    // Apply font size to document
    const root = document.documentElement;
    root.style.fontSize = size === 'small' ? '14px' : size === 'large' ? '18px' : '16px';
  }, []);

  // Get accessibility classes
  const getAccessibilityClasses = useCallback(() => {
    const classes = [];
    
    if (state.isKeyboardNavigation) classes.push('keyboard-navigation');
    if (state.isHighContrast) classes.push('high-contrast');
    if (state.isReducedMotion) classes.push('reduced-motion');
    if (state.screenReader) classes.push('screen-reader');
    
    return classes.join(' ');
  }, [state]);

  // Get accessibility styles
  const getAccessibilityStyles = useCallback(() => {
    const styles: React.CSSProperties = {};
    
    if (state.isReducedMotion) {
      styles.transition = 'none';
      styles.animation = 'none';
    }
    
    if (state.isHighContrast) {
      styles.filter = 'contrast(150%)';
    }
    
    return styles;
  }, [state]);

  return {
    ...state,
    setFontSize,
    getAccessibilityClasses,
    getAccessibilityStyles,
  };
}
