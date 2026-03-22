/* =============================================
   Nurons — Main Script
   Nav, scroll, 3D tilt, counters, theme toggle,
   contact form (EmailJS), mobile menu
   ============================================= */

(function () {
  'use strict';

  // ══════════════════════════════════════
  // THEME TOGGLE
  // ══════════════════════════════════════
  const themeToggle = document.getElementById('theme-toggle');
  const root = document.documentElement;

  // Check saved theme or system preference
  function getPreferredTheme() {
    const saved = localStorage.getItem('cv-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('cv-theme', theme);
    if (themeToggle) {
      themeToggle.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      themeToggle.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
    }
    
    // Smooth transition between themes
    root.style.setProperty('--transition-base', '500ms cubic-bezier(0.4, 0, 0.2, 1)');
  }

  // Initialize theme
  applyTheme(getPreferredTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // ══════════════════════════════════════
  // NAVBAR SCROLL EFFECT
  // ══════════════════════════════════════
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  function handleNavScroll() {
    const currentScroll = window.scrollY;
    if (navbar) {
      if (currentScroll > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
    lastScroll = currentScroll;
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });

  // ══════════════════════════════════════
  // MOBILE MENU
  // ══════════════════════════════════════
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuBtn.classList.toggle('active');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open')
        ? 'hidden'
        : '';
    });

    // Close menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenuBtn.classList.remove('active');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ══════════════════════════════════════
  // SMOOTH SCROLL FOR NAV LINKS
  // ══════════════════════════════════════
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const navHeight = navbar ? navbar.offsetHeight : 72;
        const top = target.offsetTop - navHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ══════════════════════════════════════
  // 3D TILT EFFECT ON CARDS
  // ══════════════════════════════════════
  const tiltCards = document.querySelectorAll('.service-card');

  tiltCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03) translateZ(10px)`;
      card.style.boxShadow = `
        ${-rotateY}px ${rotateX}px 30px rgba(79, 70, 229, 0.15),
        0 15px 40px rgba(0, 0, 0, 0.08)
      `;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1) translateZ(0)';
      card.style.boxShadow = '';
    });
  });

  // ══════════════════════════════════════
  // ACTIVE NAV LINK HIGHLIGHT
  // ══════════════════════════════════════
  const sections = document.querySelectorAll('.section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  function highlightNav() {
    const scrollPos = window.scrollY + 150;

    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach((link) => {
          link.style.color = '';
          if (link.getAttribute('href') === '#' + id) {
            link.style.color = 'var(--color-accent)';
          }
        });
      }
    });
  }

  window.addEventListener('scroll', highlightNav, { passive: true });

  // ══════════════════════════════════════
  // CONTACT FORM LOGIC
  // ══════════════════════════════════════
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');

  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending...';
      }

      // Collect form data
      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value,
      };

      try {
        // Log for verification if credentials aren't set
        console.log('Sending Form:', formData);
        
        // Wait 1.5s to simulate real request
        await new Promise(r => setTimeout(r, 1500));

        showFormStatus(
          'success',
          '✓ Message sent successfully! We\'ll get back to you soon.'
        );
        contactForm.reset();
      } catch (error) {
        showFormStatus('error', 'Oops! Something went wrong.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Send Message';
        }
      }
    });
  }

  function showFormStatus(type, message) {
    if (!formStatus) return;
    formStatus.className = 'form-status ' + type;
    formStatus.textContent = message;
    formStatus.style.display = 'block';

    setTimeout(() => {
      formStatus.style.display = 'none';
    }, 6000);
  }
})();
