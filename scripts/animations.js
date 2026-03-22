/* =============================================
   Nurons — Cyberpunk GSAP Animations & Main Logic
   ============================================= */

(function () {
  'use strict';

  // Register GSAP plugins
  gsap.registerPlugin(ScrollTrigger);

  // ── Glitch Text Scramble Function ── 
  // We apply this effect on hover to our system headers
  const monoHeaders = document.querySelectorAll('.section-label');
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";

  monoHeaders.forEach((header) => {
      const originalText = header.innerText;
      
      header.addEventListener('mouseover', () => {
          let iterations = 0;
          const interval = setInterval(() => {
              header.innerText = originalText.split("")
                  .map((letter, index) => {
                      if (index < iterations) return originalText[index];
                      return letters[Math.floor(Math.random() * letters.length)];
                  })
                  .join("");
              
              if (iterations >= originalText.length) clearInterval(interval);
              iterations += 1 / 3;
          }, 30);
      });
  });

  // ── Section Reveals ──
  const revealSections = document.querySelectorAll('.section');

  revealSections.forEach((section) => {
    const title = section.querySelector('.section-title');
    const subtitle = section.querySelector('.section-subtitle');
    const label = section.querySelector('.section-label');
    const els = [label, title, subtitle].filter(Boolean);

    gsap.from(els, {
      y: 30,
      opacity: 0,
      rotateX: -15,
      filter: 'blur(10px)',
      duration: 1,
      stagger: 0.2,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });
  });

  // ── Glass Panel Elements ──
  const panels = document.querySelectorAll('.glass-panel');
  if (panels.length > 0) {
    gsap.from(panels, {
      y: 50,
      opacity: 0,
      scale: 0.98,
      duration: 0.8,
      stagger: 0.1,
      ease: 'back.out(1.5)',
      scrollTrigger: {
        trigger: panels[0].parentElement,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });
  }

  // ── Stat Counters Animation Fix ──
  const statNumbers = document.querySelectorAll('.stat-number');
  statNumbers.forEach((stat) => {
    const endValue = parseFloat(stat.getAttribute('data-count')) || 0;
    const suffix = stat.getAttribute('data-suffix') || '';
    
    let obj = { value: 0 };

    gsap.to(obj, {
      value: endValue,
      duration: 2.5,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: stat,
        start: 'top 90%',
        toggleActions: 'play none none none',
      },
      onUpdate: function () {
        stat.textContent = Math.floor(obj.value) + suffix;
        stat.style.textShadow = `0 0 ${Math.random()*30}px var(--color-cyan)`;
      }
    });
  });

  // ── Navbar Cyber Effect ──
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
      if(window.scrollY > 50) {
          navbar.classList.add('scrolled');
      } else {
          navbar.classList.remove('scrolled');
      }
  }, { passive: true });

  // ── Contact Form Mock ──
  const form = document.getElementById('contact-form');
  const btn = document.getElementById('submit-btn');
  const status = document.getElementById('form-status');

  if(form && btn) {
      form.addEventListener('submit', (e) => {
          e.preventDefault();
          btn.textContent = 'EXECUTING PROTOCOL...';
          btn.style.opacity = '0.5';
          
          setTimeout(() => {
              btn.textContent = 'TRANSMIT DATA.';
              btn.style.opacity = '1';
              status.style.display = 'block';
              status.textContent = '> DATA TRANSMISSION SUCCESSFUL.';
              form.reset();
              setTimeout(() => status.style.display = 'none', 4000);
          }, 2000);
      });
  }
})();
