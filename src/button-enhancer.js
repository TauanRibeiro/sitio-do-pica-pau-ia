// Enhanced button functionality and accessibility improvements
document.addEventListener('DOMContentLoaded', () => {
  // Fix any broken links or buttons
  fixButtonFunctionality();
  
  // Add advanced interaction effects
  addButtonInteractions();
  
  // Apply grid layout to feature buttons
  applyGridLayout();
  
  // Add accessibility enhancements
  enhanceAccessibility();
  
  // Initialize button attention effects
  initButtonAttention();
});

// Fix button routing and prevent default when needed
function fixButtonFunctionality() {
  // Find any buttons with game links and ensure they trigger the difficulty modal
  const gameButtons = document.querySelectorAll('a[href="/game"], a[href="#game"]');
  gameButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // Try to find and trigger the main game button
      const mainGameBtn = document.querySelector('.btn-primary, [aria-label="Jogar agora"], button:contains("JOGAR AGORA")');
      if (mainGameBtn) {
        mainGameBtn.click();
      }
    });
  });
  
  // Ensure all header buttons have proper functionality
  const headerButtons = document.querySelectorAll('header button');
  headerButtons.forEach(btn => {
    if (!btn.getAttribute('aria-label')) {
      btn.setAttribute('aria-label', btn.textContent.trim() || 'Botão');
    }
    
    // Make sure the button has a click handler
    if (btn.getAttribute('onClick') === null && !btn.hasAttribute('disabled')) {
      btn.addEventListener('click', () => {
        console.log('Button clicked:', btn.getAttribute('aria-label'));
      });
    }
  });
}

// Add interactive effects to buttons
function addButtonInteractions() {
  const allButtons = document.querySelectorAll('button, .button');
  
  allButtons.forEach(btn => {
    // Add ripple effect to buttons
    btn.addEventListener('click', function(e) {
      const x = e.clientX - this.getBoundingClientRect().left;
      const y = e.clientY - this.getBoundingClientRect().top;
      
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position: absolute;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 50%;
        pointer-events: none;
        width: 100px;
        height: 100px;
        top: ${y - 50}px;
        left: ${x - 50}px;
        transform: scale(0);
        animation: ripple 0.6s linear;
      `;
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
    
    // Add hover sound effects by triggering classes
    btn.addEventListener('mouseenter', () => {
      btn.classList.add('btn-hover');
      setTimeout(() => btn.classList.remove('btn-hover'), 300);
    });
    
    // Add focus handling
    btn.addEventListener('focus', () => {
      btn.classList.add('btn-focus');
    });
    
    btn.addEventListener('blur', () => {
      btn.classList.remove('btn-focus');
    });
  });
  
  // Add keyframe animation for ripple effect if not already in stylesheet
  if (!document.getElementById('rippleStyle')) {
    const style = document.createElement('style');
    style.id = 'rippleStyle';
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Apply grid layout to feature buttons for better symmetry
function applyGridLayout() {
  const featureButtonsContainer = document.querySelector('.mt-8.flex.flex-wrap.justify-center.gap-3');
  
  if (featureButtonsContainer) {
    // Add our custom class for grid layout
    featureButtonsContainer.classList.add('feature-buttons');
    
    // Make sure buttons are evenly sized
    const buttons = featureButtonsContainer.querySelectorAll('button');
    buttons.forEach(btn => {
      // Add consistent width/height and styles
      btn.style.minWidth = '180px';
      btn.style.minHeight = '48px';
    });
  }
  
  // Make primary action button stand out
  const primaryButton = document.querySelector('.group.relative.px-12.py-6.rounded-3xl');
  if (primaryButton) {
    primaryButton.classList.add('btn-primary', 'btn-main-action');
  }
}

// Enhance accessibility
function enhanceAccessibility() {
  // Add proper roles and labels
  document.querySelectorAll('button').forEach(btn => {
    // Ensure all buttons have an accessible name
    if (!btn.getAttribute('aria-label') && !btn.textContent.trim()) {
      btn.setAttribute('aria-label', 'Botão');
    }
    
    // Add proper roles to buttons that function as links
    if (btn.classList.contains('tab-btn') || btn.hasAttribute('href')) {
      btn.setAttribute('role', 'link');
    }
  });
  
  // Add keyboard navigation for feature buttons
  const featureButtons = document.querySelectorAll('.feature-buttons button');
  featureButtons.forEach((btn, index) => {
    btn.setAttribute('tabindex', '0');
    
    btn.addEventListener('keydown', (e) => {
      // Handle arrow key navigation
      if (e.key === 'ArrowRight' && index < featureButtons.length - 1) {
        featureButtons[index + 1].focus();
      }
      if (e.key === 'ArrowLeft' && index > 0) {
        featureButtons[index - 1].focus();
      }
    });
  });
}

// Initialize attention-grabbing effects for key buttons
function initButtonAttention() {
  // Find the main action button
  const mainButton = document.querySelector('.btn-main-action') || 
                     document.querySelector('button[class*="green"]') ||
                     document.querySelector('button:contains("JOGAR")');
  
  if (mainButton) {
    mainButton.classList.add('animate-attention');
    
    // Remove animation when user has seen it
    setTimeout(() => {
      mainButton.classList.remove('animate-attention');
    }, 10000); // Remove after 10 seconds
    
    // Remove animation when clicked
    mainButton.addEventListener('click', () => {
      mainButton.classList.remove('animate-attention');
    });
  }
}