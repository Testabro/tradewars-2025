// Unified Design System for Trade Wars 2025
export const DESIGN_SYSTEM = {
  // Color Palette
  colors: {
    // Primary Neon Colors
    neonCyan: '#00fff7',
    neonPink: '#ff3cff',
    neonPurple: '#a259ff',
    neonGreen: '#39ff14',
    neonYellow: '#ffe600',
    neonBlue: '#0080ff',
    
    // Background Colors
    darkSpace: '#0a0a0f',
    deepPurple: '#12002a',
    midPurple: '#2a0a4d',
    lightPurple: '#3a1c71',
    
    // Status Colors
    success: '#39ff14',
    warning: '#ffe600',
    error: '#ff3366',
    info: '#00fff7',
    
    // Neutral Colors
    white: '#ffffff',
    lightGray: '#e5e7eb',
    gray: '#9ca3af',
    darkGray: '#374151',
    black: '#000000'
  },

  // Typography
  fonts: {
    primary: "'Orbitron', 'Share Tech Mono', 'Consolas', monospace",
    mono: "'Share Tech Mono', 'Consolas', monospace",
    system: "system-ui, -apple-system, sans-serif"
  },

  // Spacing Scale (8px base unit for consistency)
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '5rem',   // 80px
    '5xl': '6rem',   // 96px
  },

  // Professional spacing for components
  componentSpacing: {
    cardPadding: '1.5rem',      // 24px - comfortable card padding
    sectionGap: '2rem',         // 32px - space between major sections
    elementGap: '1rem',         // 16px - space between related elements
    tightGap: '0.75rem',        // 12px - space between closely related items
    buttonPadding: '0.75rem 1.5rem', // 12px 24px - comfortable button padding
    inputPadding: '0.875rem 1rem',   // 14px 16px - input field padding
  },

  // Border Radius
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px'
  },

  // Shadows and Glows
  effects: {
    neonGlow: {
      cyan: '0 0 20px rgba(0, 255, 247, 0.5), 0 0 40px rgba(0, 255, 247, 0.3)',
      pink: '0 0 20px rgba(255, 60, 255, 0.5), 0 0 40px rgba(255, 60, 255, 0.3)',
      purple: '0 0 20px rgba(162, 89, 255, 0.5), 0 0 40px rgba(162, 89, 255, 0.3)',
      green: '0 0 20px rgba(57, 255, 20, 0.5), 0 0 40px rgba(57, 255, 20, 0.3)',
      yellow: '0 0 20px rgba(255, 230, 0, 0.5), 0 0 40px rgba(255, 230, 0, 0.3)'
    },
    innerGlow: 'inset 0 0 20px rgba(255, 255, 255, 0.1)',
    softShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #12002a 0%, #2a0a4d 40%, #3a1c71 70%, #00fff7 100%)',
    secondary: 'linear-gradient(90deg, #181c24 0%, #232a36 100%)',
    accent: 'linear-gradient(135deg, #4c1d95 0%, #1e3a8a 50%, #4c1d95 100%)',
    success: 'linear-gradient(135deg, #39ff14 0%, #00ff88 100%)',
    warning: 'linear-gradient(135deg, #ffe600 0%, #ff8800 100%)',
    error: 'linear-gradient(135deg, #ff3366 0%, #cc0033 100%)'
  },

  // Animation Durations
  animations: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '750ms'
  },

  // Component Variants
  components: {
    button: {
      primary: {
        background: 'linear-gradient(135deg, #a259ff 0%, #00fff7 100%)',
        border: '2px solid #00fff7',
        color: '#ffffff',
        shadow: '0 0 20px rgba(0, 255, 247, 0.5)',
        padding: '0.875rem 1.75rem',
        fontSize: '0.95rem',
        minHeight: '2.75rem'
      },
      secondary: {
        background: 'linear-gradient(135deg, #2a0a4d 0%, #3a1c71 100%)',
        border: '2px solid #a259ff',
        color: '#a259ff',
        shadow: '0 0 15px rgba(162, 89, 255, 0.3)',
        padding: '0.75rem 1.5rem',
        fontSize: '0.9rem',
        minHeight: '2.5rem'
      },
      success: {
        background: 'linear-gradient(135deg, #39ff14 0%, #00ff88 100%)',
        border: '2px solid #39ff14',
        color: '#000000',
        shadow: '0 0 20px rgba(57, 255, 20, 0.5)',
        padding: '0.875rem 1.75rem',
        fontSize: '0.95rem',
        minHeight: '2.75rem'
      },
      warning: {
        background: 'linear-gradient(135deg, #ffe600 0%, #ff8800 100%)',
        border: '2px solid #ffe600',
        color: '#000000',
        shadow: '0 0 20px rgba(255, 230, 0, 0.5)',
        padding: '0.875rem 1.75rem',
        fontSize: '0.95rem',
        minHeight: '2.75rem'
      },
      danger: {
        background: 'linear-gradient(135deg, #ff3366 0%, #cc0033 100%)',
        border: '2px solid #ff3366',
        color: '#ffffff',
        shadow: '0 0 20px rgba(255, 51, 102, 0.5)',
        padding: '0.875rem 1.75rem',
        fontSize: '0.95rem',
        minHeight: '2.75rem'
      }
    },
    panel: {
      primary: {
        background: 'linear-gradient(135deg, #12002a 0%, #2a0a4d 40%, #3a1c71 70%, #00fff7 100%)',
        border: '2px solid #00fff7',
        shadow: '0 0 32px 8px rgba(0, 255, 247, 0.3)'
      },
      secondary: {
        background: 'linear-gradient(90deg, #181c24 0%, #232a36 100%)',
        border: '2px solid #a259ff',
        shadow: '0 0 20px rgba(162, 89, 255, 0.3)'
      }
    }
  }
};

// Utility functions for consistent styling
export const getButtonStyle = (variant = 'primary', size = 'md') => {
  const baseStyle = {
    fontFamily: DESIGN_SYSTEM.fonts.primary,
    letterSpacing: '0.04em',
    fontWeight: '600',
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    transition: `all ${DESIGN_SYSTEM.animations.normal} ease`,
    cursor: 'pointer',
    outline: 'none',
    position: 'relative',
    overflow: 'hidden'
  };

  const sizeStyles = {
    sm: {
      padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
      fontSize: '0.875rem'
    },
    md: {
      padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md}`,
      fontSize: '1rem'
    },
    lg: {
      padding: `${DESIGN_SYSTEM.spacing.md} ${DESIGN_SYSTEM.spacing.lg}`,
      fontSize: '1.125rem'
    }
  };

  const variantStyle = DESIGN_SYSTEM.components.button[variant] || DESIGN_SYSTEM.components.button.primary;

  return {
    ...baseStyle,
    ...sizeStyles[size],
    background: variantStyle.background,
    border: variantStyle.border,
    color: variantStyle.color,
    boxShadow: variantStyle.shadow
  };
};

export const getPanelStyle = (variant = 'primary') => {
  const baseStyle = {
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    padding: DESIGN_SYSTEM.spacing.lg,
    fontFamily: DESIGN_SYSTEM.fonts.primary,
    letterSpacing: '0.04em'
  };

  const variantStyle = DESIGN_SYSTEM.components.panel[variant] || DESIGN_SYSTEM.components.panel.primary;

  return {
    ...baseStyle,
    background: variantStyle.background,
    border: variantStyle.border,
    boxShadow: variantStyle.shadow
  };
};
