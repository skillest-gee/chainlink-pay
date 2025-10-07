/**
 * Accessibility Hook
 * Provides keyboard navigation, screen reader support, and ARIA attributes
 */

import { useEffect, useCallback, useRef } from 'react';

export interface AccessibilityOptions {
  enableKeyboardNavigation?: boolean;
  enableScreenReader?: boolean;
  enableHighContrast?: boolean;
  enableReducedMotion?: boolean;
  announceChanges?: boolean;
}

export function useAccessibility(options: AccessibilityOptions = {}) {
  const {
    enableKeyboardNavigation = true,
    enableScreenReader = true,
    enableHighContrast = false,
    enableReducedMotion = false,
    announceChanges = true
  } = options;

  const announcementRef = useRef<HTMLDivElement | null>(null);

  // Create live region for screen reader announcements
  useEffect(() => {
    if (enableScreenReader && announceChanges) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
      announcementRef.current = liveRegion;

      return () => {
        if (announcementRef.current) {
          document.body.removeChild(announcementRef.current);
        }
      };
    }
  }, [enableScreenReader, announceChanges]);

  // Announce changes to screen readers
  const announce = useCallback((message: string) => {
    if (enableScreenReader && announceChanges && announcementRef.current) {
      announcementRef.current.textContent = message;
    }
  }, [enableScreenReader, announceChanges]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent, onEnter?: () => void, onEscape?: () => void) => {
    if (!enableKeyboardNavigation) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        onEnter?.();
        break;
      case 'Escape':
        event.preventDefault();
        onEscape?.();
        break;
      case 'Tab':
        // Ensure focus is visible
        document.body.classList.add('keyboard-navigation');
        break;
    }
  }, [enableKeyboardNavigation]);

  // Remove keyboard navigation class on mouse use
  const handleMouseDown = useCallback(() => {
    document.body.classList.remove('keyboard-navigation');
  }, []);

  // Set up global event listeners
  useEffect(() => {
    if (enableKeyboardNavigation) {
      document.addEventListener('keydown', handleKeyDown as EventListener);
      document.addEventListener('mousedown', handleMouseDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown as EventListener);
        document.removeEventListener('mousedown', handleMouseDown);
      };
    }
  }, [enableKeyboardNavigation, handleKeyDown, handleMouseDown]);

  // Apply accessibility styles
  useEffect(() => {
    const style = document.createElement('style');
    
    let css = '';
    
    if (enableHighContrast) {
      css += `
        * {
          filter: contrast(150%) brightness(120%);
        }
      `;
    }
    
    if (enableReducedMotion) {
      css += `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
    }
    
    css += `
      .keyboard-navigation *:focus {
        outline: 2px solid #00d4ff !important;
        outline-offset: 2px !important;
      }
      
      .keyboard-navigation *:focus:not(:focus-visible) {
        outline: none !important;
      }
      
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
    `;
    
    style.textContent = css;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [enableHighContrast, enableReducedMotion]);

  // Generate ARIA attributes
  const getAriaAttributes = useCallback((options: {
    label?: string;
    describedBy?: string;
    expanded?: boolean;
    selected?: boolean;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    live?: 'polite' | 'assertive' | 'off';
  }) => {
    const attributes: Record<string, string | boolean> = {};
    
    if (options.label) attributes['aria-label'] = options.label;
    if (options.describedBy) attributes['aria-describedby'] = options.describedBy;
    if (options.expanded !== undefined) attributes['aria-expanded'] = options.expanded;
    if (options.selected !== undefined) attributes['aria-selected'] = options.selected;
    if (options.disabled !== undefined) attributes['aria-disabled'] = options.disabled;
    if (options.required !== undefined) attributes['aria-required'] = options.required;
    if (options.invalid !== undefined) attributes['aria-invalid'] = options.invalid;
    if (options.live) attributes['aria-live'] = options.live;
    
    return attributes;
  }, []);

  // Generate accessible button props
  const getButtonProps = useCallback((options: {
    label: string;
    description?: string;
    disabled?: boolean;
    loading?: boolean;
    pressed?: boolean;
  }) => {
    return {
      ...getAriaAttributes({
        label: options.loading ? `${options.label} (Loading)` : options.label,
        describedBy: options.description,
        disabled: options.disabled || options.loading,
        expanded: options.pressed
      }),
      role: 'button',
      tabIndex: options.disabled || options.loading ? -1 : 0
    };
  }, [getAriaAttributes]);

  // Generate accessible input props
  const getInputProps = useCallback((options: {
    label: string;
    description?: string;
    required?: boolean;
    invalid?: boolean;
    value?: string;
  }) => {
    return {
      ...getAriaAttributes({
        label: options.label,
        describedBy: options.description,
        required: options.required,
        invalid: options.invalid
      }),
      role: 'textbox',
      'aria-valuenow': options.value,
      'aria-valuetext': options.value
    };
  }, [getAriaAttributes]);

  return {
    announce,
    getAriaAttributes,
    getButtonProps,
    getInputProps,
    handleKeyDown
  };
}

// Screen reader only text component
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

export default useAccessibility;