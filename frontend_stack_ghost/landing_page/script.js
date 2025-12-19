document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  const subheadline = document.querySelector('.subheadline');
  if (subheadline) {
    requestAnimationFrame(() => subheadline.classList.add('visible'));
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  document.querySelectorAll('.fade-in-up, .scale-in').forEach((el) => scrollObserver.observe(el));

  // Create particles
  function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 15 + 's';
      particle.style.animationDuration = (10 + Math.random() * 10) + 's';
      container.appendChild(particle);
    }
  }
  createParticles();

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('.count-up').forEach((el) => counterObserver.observe(el));

  function animateCount(el) {
    const target = parseFloat(el.dataset.target || '0');
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    const decimals = target % 1 !== 0 ? 1 : 0;

    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const value = target * easeOutQuad(progress);
      el.textContent = value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  function easeOutQuad(t) {
    return t * (2 - t);
  }

  const glowButtons = document.querySelectorAll('[data-glow]');
  glowButtons.forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      btn.style.setProperty('--x', `${x}%`);
      btn.style.setProperty('--y', `${y}%`);
    });
  });

  const tilt = document.querySelector('.tilt-card .card-img');
  if (tilt) {
    const container = tilt.closest('.tilt-card');
    container.addEventListener('pointermove', (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      tilt.style.transform = `translateY(-6px) rotateX(${y * -6}deg) rotateY(${x * 6}deg)`;
    });
    container.addEventListener('pointerleave', () => {
      tilt.style.transform = '';
    });
  }

  const terminalText = document.getElementById('terminal-text');
  const text = 'Ghost_Stack';
  let charIndex = 0;
  let deleting = false;
  let isPaused = false;

  function typeLoop() {
    if (!terminalText || isPaused) return;

    if (!deleting && charIndex <= text.length) {
      terminalText.textContent = text.slice(0, charIndex);
      charIndex += 1;
      
      if (charIndex > text.length) {
        // Finished typing, wait 2 seconds then start deleting
        isPaused = true;
        setTimeout(() => {
          deleting = true;
          isPaused = false;
          typeLoop();
        }, 2000);
        return;
      }
    } else if (deleting && charIndex >= 0) {
      terminalText.textContent = text.slice(0, charIndex);
      charIndex -= 1;
      
      if (charIndex < 0) {
        // Finished deleting, wait 2 seconds then start typing again
        isPaused = true;
        deleting = false;
        charIndex = 0;
        setTimeout(() => {
          isPaused = false;
          typeLoop();
        }, 2000);
        return;
      }
    }

    const speed = deleting ? 40 : 120;
    setTimeout(typeLoop, speed);
  }
  
  // Start the animation
  typeLoop();
});

