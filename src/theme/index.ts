import { createSystem, defaultConfig } from '@chakra-ui/react'

const config = {
  ...defaultConfig,
  theme: {
    ...defaultConfig.theme,
    tokens: {
      ...defaultConfig.theme.tokens,
      colors: {
        ...defaultConfig.theme.tokens.colors,
        // Dark theme colors
        bg: {
          primary: { value: '#0a0a0a' },
          secondary: { value: '#111111' },
          tertiary: { value: '#1a1a1a' },
          card: { value: '#1e1e1e' },
          hover: { value: '#2a2a2a' }
        },
        text: {
          primary: { value: '#ffffff' },
          secondary: { value: '#a0a0a0' },
          tertiary: { value: '#666666' },
          accent: { value: '#00d4ff' }
        },
        brand: {
          primary: { value: '#00d4ff' },
          secondary: { value: '#0099cc' },
          accent: { value: '#ff6b35' },
          success: { value: '#00ff88' },
          warning: { value: '#ffaa00' },
          error: { value: '#ff4444' }
        },
        gradient: {
          primary: { value: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)' },
          secondary: { value: 'linear-gradient(135deg, #ff6b35 0%, #ffaa00 100%)' },
          dark: { value: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)' }
        }
      }
    }
  }
}

export const system = createSystem(config)
