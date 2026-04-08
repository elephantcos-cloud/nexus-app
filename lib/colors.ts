export const Colors = {
  primary: '#6C63FF',
  primaryDark: '#5A52D5',
  primaryLight: '#8B85FF',
  secondary: '#FF6584',
  accent: '#43E97B',
  
  // Light theme
  light: {
    background: '#FFFFFF',
    surface: '#F8F9FA',
    card: '#FFFFFF',
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    icon: '#374151',
    tabBar: '#FFFFFF',
    header: '#FFFFFF',
    input: '#F3F4F6',
    bubble: '#F3F4F6',
    bubbleOwn: '#6C63FF',
    bubbleText: '#1A1A2E',
    bubbleTextOwn: '#FFFFFF',
    like: '#EF4444',
    online: '#10B981',
  },

  // Dark theme
  dark: {
    background: '#0F0F1A',
    surface: '#1A1A2E',
    card: '#1E1E32',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#2D2D4A',
    icon: '#D1D5DB',
    tabBar: '#1A1A2E',
    header: '#1A1A2E',
    input: '#2D2D4A',
    bubble: '#2D2D4A',
    bubbleOwn: '#6C63FF',
    bubbleText: '#F9FAFB',
    bubbleTextOwn: '#FFFFFF',
    like: '#EF4444',
    online: '#10B981',
  },
};

export type ColorScheme = typeof Colors.light;
