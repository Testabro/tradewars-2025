// Animation utility functions and configurations

export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  EXTRA_SLOW: 800
};

export const EASING = {
  EASE_OUT: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  EASE_IN_OUT: 'cubic-bezier(0.42, 0, 0.58, 1)',
  BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  ELASTIC: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
};

// Create floating particles effect
export const createParticleEffect = (element, options = {}) => {
  const {
    count = 20,
    colors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff00'],
    duration = 2000,
    spread = 100
  } = options;

  const particles = [];
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle-effect';
    particle.style.cssText = `
      position: fixed;
      width: 4px;
      height: 4px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      left: ${centerX}px;
      top: ${centerY}px;
      box-shadow: 0 0 6px currentColor;
    `;

    document.body.appendChild(particle);
    particles.push(particle);

    const angle = (Math.PI * 2 * i) / count;
    const velocity = 50 + Math.random() * spread;
    const endX = centerX + Math.cos(angle) * velocity;
    const endY = centerY + Math.sin(angle) * velocity;

    particle.animate([
      { 
        transform: 'translate(0, 0) scale(0)',
        opacity: 1
      },
      { 
        transform: `translate(${endX - centerX}px, ${endY - centerY}px) scale(1)`,
        opacity: 0.8
      },
      { 
        transform: `translate(${endX - centerX}px, ${endY - centerY + 50}px) scale(0)`,
        opacity: 0
      }
    ], {
      duration: duration,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }).onfinish = () => {
      particle.remove();
    };
  }

  return particles;
};

// Create screen shake effect
export const createScreenShake = (intensity = 10, duration = 500) => {
  const element = document.body;
  const originalTransform = element.style.transform;

  const shake = () => {
    const x = (Math.random() - 0.5) * intensity;
    const y = (Math.random() - 0.5) * intensity;
    element.style.transform = `translate(${x}px, ${y}px)`;
  };

  const interval = setInterval(shake, 50);
  
  setTimeout(() => {
    clearInterval(interval);
    element.style.transform = originalTransform;
  }, duration);
};

// Create ripple effect
export const createRippleEffect = (element, event) => {
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  const ripple = document.createElement('div');
  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
    border-radius: 50%;
    transform: scale(0);
    pointer-events: none;
    z-index: 1;
  `;

  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);

  ripple.animate([
    { transform: 'scale(0)', opacity: 1 },
    { transform: 'scale(1)', opacity: 0 }
  ], {
    duration: 600,
    easing: 'ease-out'
  }).onfinish = () => {
    ripple.remove();
  };
};

// Create floating text effect
export const createFloatingText = (element, text, options = {}) => {
  const {
    color = '#00ffff',
    fontSize = '16px',
    duration = 2000,
    distance = 50
  } = options;

  const rect = element.getBoundingClientRect();
  const floatingText = document.createElement('div');
  
  floatingText.textContent = text;
  floatingText.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.top}px;
    color: ${color};
    font-size: ${fontSize};
    font-weight: bold;
    font-family: monospace;
    pointer-events: none;
    z-index: 9999;
    text-shadow: 0 0 10px currentColor;
    transform: translateX(-50%);
  `;

  document.body.appendChild(floatingText);

  floatingText.animate([
    { 
      transform: 'translateX(-50%) translateY(0) scale(0.5)',
      opacity: 0
    },
    { 
      transform: 'translateX(-50%) translateY(0) scale(1.2)',
      opacity: 1,
      offset: 0.2
    },
    { 
      transform: 'translateX(-50%) translateY(0) scale(1)',
      opacity: 1,
      offset: 0.4
    },
    { 
      transform: `translateX(-50%) translateY(-${distance}px) scale(0.8)`,
      opacity: 0
    }
  ], {
    duration: duration,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  }).onfinish = () => {
    floatingText.remove();
  };
};

// Create pulsing glow effect
export const createPulsingGlow = (element, color = '#00ffff', duration = 1000) => {
  const originalBoxShadow = element.style.boxShadow;
  
  const animation = element.animate([
    { boxShadow: `0 0 5px ${color}` },
    { boxShadow: `0 0 20px ${color}, 0 0 30px ${color}` },
    { boxShadow: `0 0 5px ${color}` }
  ], {
    duration: duration,
    iterations: 3,
    easing: 'ease-in-out'
  });

  animation.onfinish = () => {
    element.style.boxShadow = originalBoxShadow;
  };

  return animation;
};

// Create typewriter effect
export const createTypewriterEffect = (element, text, speed = 50) => {
  element.textContent = '';
  let i = 0;
  
  const typeInterval = setInterval(() => {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
    } else {
      clearInterval(typeInterval);
    }
  }, speed);

  return typeInterval;
};

// Create matrix rain effect for backgrounds
export const createMatrixRain = (container, options = {}) => {
  const {
    characters = '01',
    fontSize = 14,
    color = '#00ff00',
    speed = 50,
    density = 0.02
  } = options;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
    opacity: 0.1;
  `;

  container.style.position = 'relative';
  container.appendChild(canvas);

  const resizeCanvas = () => {
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const columns = Math.floor(canvas.width / fontSize);
  const drops = Array(columns).fill(0);

  const draw = () => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = color;
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
      if (Math.random() < density) {
        const text = characters[Math.floor(Math.random() * characters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }
  };

  const interval = setInterval(draw, speed);
  
  return () => {
    clearInterval(interval);
    canvas.remove();
    window.removeEventListener('resize', resizeCanvas);
  };
};
