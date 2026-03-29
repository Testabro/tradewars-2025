import React, { useRef } from 'react';
import { useAudioManager } from '../hooks/useAudioManager.js';
import { getButtonStyle } from '../styles/designSystem.js';
import { createRippleEffect, createParticleEffect } from '../utils/animations.js';

export default function Button({ 
  onClick, 
  children, 
  disabled = false, 
  variant = 'primary', 
  size = 'md',
  soundEffect = 'BUTTON_CLICK',
  className = '',
  showParticles = false,
  ...props 
}) {
  const { playSound } = useAudioManager();
  const buttonRef = useRef(null);

  const handleClick = (e) => {
    if (!disabled && onClick) {
      // Create ripple effect
      if (buttonRef.current) {
        createRippleEffect(buttonRef.current, e);
      }

      // Create particle effect for special buttons
      if (showParticles && buttonRef.current) {
        createParticleEffect(buttonRef.current, {
          count: 15,
          colors: variant === 'success' ? ['#00ff00', '#00ffff'] : 
                  variant === 'danger' ? ['#ff0000', '#ff6600'] :
                  ['#00ffff', '#ff00ff', '#ffff00']
        });
      }

      // Play sound effect
      if (soundEffect) {
        playSound(soundEffect);
      }
      onClick(e);
    }
  };

  const buttonStyle = getButtonStyle(variant, size);

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled}
      className={`neon-button ${className}`}
      style={buttonStyle}
      tabIndex={0}
      aria-label={typeof children === 'string' ? children : 'Button'}
      {...props}
    >
      <span className="button-content">
        <span className="button-arrow">{'>'}</span>
        <span className="button-text">{children}</span>
      </span>
      
      {/* Hover effect overlay */}
      <div className="button-overlay"></div>
      
      <style>{`
        .neon-button {
          position: relative;
          overflow: hidden;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.05em;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          transform: perspective(1px) translateZ(0);
          backface-visibility: hidden;
        }
        
        .neon-button:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
        
        .neon-button:active:not(:disabled) {
          transform: translateY(0px);
          transition: all 0.1s ease;
        }
        
        .neon-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          filter: grayscale(0.5);
        }
        
        .button-content {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
        }
        
        .button-arrow {
          margin-right: 0.5rem;
          font-weight: bold;
          transition: transform 0.3s ease;
        }
        
        .neon-button:hover:not(:disabled) .button-arrow {
          transform: translateX(2px);
        }
        
        .button-text {
          flex: 1;
          text-align: center;
        }
        
        .button-overlay {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: left 0.5s ease;
          z-index: 1;
        }
        
        .neon-button:hover:not(:disabled) .button-overlay {
          left: 100%;
        }
        
        /* Pulse animation for important buttons */
        .neon-button.pulse {
          animation: buttonPulse 2s infinite;
        }
        
        @keyframes buttonPulse {
          0%, 100% {
            box-shadow: ${buttonStyle.boxShadow};
          }
          50% {
            box-shadow: ${buttonStyle.boxShadow}, 0 0 30px rgba(0, 255, 247, 0.6);
          }
        }
        
        /* Focus styles for accessibility */
        .neon-button:focus {
          outline: none;
          box-shadow: ${buttonStyle.boxShadow}, 0 0 0 3px rgba(0, 255, 247, 0.3);
        }
        
        /* Mobile optimizations */
        @media (max-width: 640px) {
          .neon-button {
            font-size: 0.9rem;
            padding: 0.6rem 1rem;
          }
          
          .button-arrow {
            margin-right: 0.3rem;
          }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .neon-button {
            border: 2px solid currentColor;
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .neon-button,
          .button-arrow,
          .button-overlay {
            transition: none;
          }
          
          .neon-button.pulse {
            animation: none;
          }
        }
      `}</style>
    </button>
  );
}
