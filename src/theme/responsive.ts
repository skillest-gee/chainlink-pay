/**
 * Responsive Design System
 * Mobile-first responsive utilities
 */

export const responsive = {
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Container sizes
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Spacing scale
  spacing: {
    xs: { base: '0.25rem', sm: '0.5rem' },
    sm: { base: '0.5rem', sm: '0.75rem' },
    md: { base: '1rem', sm: '1.25rem' },
    lg: { base: '1.5rem', sm: '2rem' },
    xl: { base: '2rem', sm: '3rem' },
    '2xl': { base: '3rem', sm: '4rem' },
    '3xl': { base: '4rem', sm: '6rem' },
  },
  
  // Font sizes
  fontSize: {
    xs: { base: '0.75rem', sm: '0.875rem' },
    sm: { base: '0.875rem', sm: '1rem' },
    md: { base: '1rem', sm: '1.125rem' },
    lg: { base: '1.125rem', sm: '1.25rem' },
    xl: { base: '1.25rem', sm: '1.5rem' },
    '2xl': { base: '1.5rem', sm: '1.875rem' },
    '3xl': { base: '1.875rem', sm: '2.25rem' },
    '4xl': { base: '2.25rem', sm: '3rem' },
    '5xl': { base: '3rem', sm: '4rem' },
  },
  
  // Padding
  padding: {
    xs: { base: '0.5rem', sm: '0.75rem' },
    sm: { base: '0.75rem', sm: '1rem' },
    md: { base: '1rem', sm: '1.5rem' },
    lg: { base: '1.5rem', sm: '2rem' },
    xl: { base: '2rem', sm: '3rem' },
    '2xl': { base: '3rem', sm: '4rem' },
  },
  
  // Margin
  margin: {
    xs: { base: '0.5rem', sm: '0.75rem' },
    sm: { base: '0.75rem', sm: '1rem' },
    md: { base: '1rem', sm: '1.5rem' },
    lg: { base: '1.5rem', sm: '2rem' },
    xl: { base: '2rem', sm: '3rem' },
    '2xl': { base: '3rem', sm: '4rem' },
  },
  
  // Grid columns
  grid: {
    auto: { base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
    '2-cols': { base: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)' },
    '3-cols': { base: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
    '4-cols': { base: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
  },
  
  // Flex direction
  flexDirection: {
    row: { base: 'column', sm: 'row' },
    column: { base: 'column', sm: 'column' },
  },
  
  // Display
  display: {
    block: { base: 'block', sm: 'block' },
    flex: { base: 'flex', sm: 'flex' },
    grid: { base: 'grid', sm: 'grid' },
    none: { base: 'none', sm: 'block' },
  },
  
  // Width
  width: {
    full: { base: '100%', sm: '100%' },
    auto: { base: 'auto', sm: 'auto' },
    fit: { base: 'fit-content', sm: 'fit-content' },
  },
  
  // Height
  height: {
    full: { base: '100%', sm: '100%' },
    auto: { base: 'auto', sm: 'auto' },
    screen: { base: '100vh', sm: '100vh' },
  },
};

// Utility functions
export const getResponsiveValue = (values: any) => {
  if (typeof values === 'object' && values !== null) {
    return values;
  }
  return { base: values, sm: values, md: values, lg: values, xl: values };
};

export const createResponsiveProps = (props: Record<string, any>) => {
  const responsiveProps: Record<string, any> = {};
  
  Object.entries(props).forEach(([key, value]) => {
    responsiveProps[key] = getResponsiveValue(value);
  });
  
  return responsiveProps;
};

// Common responsive patterns
export const responsivePatterns = {
  // Card layout
  card: {
    padding: { base: '1rem', sm: '1.5rem', md: '2rem' },
    margin: { base: '0.5rem', sm: '1rem' },
    borderRadius: { base: '1rem', sm: '1.5rem' },
  },
  
  // Button layout
  button: {
    padding: { base: '0.75rem 1.5rem', sm: '1rem 2rem' },
    fontSize: { base: '0.875rem', sm: '1rem' },
    borderRadius: { base: '0.75rem', sm: '1rem' },
  },
  
  // Container layout
  container: {
    padding: { base: '1rem', sm: '1.5rem', md: '2rem' },
    maxWidth: { base: '100%', sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
  },
  
  // Grid layout
  grid: {
    gap: { base: '1rem', sm: '1.5rem', md: '2rem' },
    columns: { base: 1, sm: 2, md: 3, lg: 4 },
  },
};
