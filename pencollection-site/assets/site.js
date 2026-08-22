// ===== Pen Collection — shared site behaviour =====
document.addEventListener('DOMContentLoaded', function () {

  // Footer year
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // ---- Transparent-to-solid nav on scroll ----
  var nav = document.querySelector('header.site-nav');
  var scrollThreshold = 80;
  function updateNav() {
    if (!nav) return;
    var menuOpen = document.getElementById('mobile-menu') &&
      document.getElementById('mobile-menu').classList.contains('open');
    if (window.scrollY > scrollThreshold || menuOpen) {
      nav.classList.add('solid');
    } else {
      nav.classList.remove('solid');
    }
  }
  if (nav) {
    updateNav();
    window.addEventListener('scroll', updateNav, { passive: true });
  }

  // ---- Nav floating contact icon (Call / WhatsApp dropdown) ----
  var navContact = document.getElementById('nav-contact');
  var navContactToggle = document.getElementById('nav-contact-toggle');
  if (navContact && navContactToggle) {
    function closeContactMenu() {
      navContact.classList.remove('open');
      navContactToggle.setAttribute('aria-expanded', 'false');
    }
    navContactToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = !navContact.classList.contains('open');
      navContact.classList.toggle('open', willOpen);
      navContactToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!navContact.contains(e.target)) closeContactMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeContactMenu();
    });
  }

  // ---- Mobile menu toggle ----
  var navToggle = document.getElementById('nav-toggle');
  var mobileMenu = document.getElementById('mobile-menu');
  if (navToggle && mobileMenu) {
    function closeMenu() {
      mobileMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      updateNav();
    }
    function toggleMenu() {
      var willOpen = !mobileMenu.classList.contains('open');
      mobileMenu.classList.toggle('open', willOpen);
      navToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      document.body.style.overflow = willOpen ? 'hidden' : '';
      if (navContact) navContact.classList.remove('open');
      updateNav();
    }
    navToggle.addEventListener('click', toggleMenu);
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) closeMenu();
    });
  }

  // ---- Scroll to top ----
  var scrollTopBtn = document.getElementById('scroll-top');
  if (scrollTopBtn) {
    var scrollTopThreshold = 500;
    function updateScrollTopBtn() {
      if (window.scrollY > scrollTopThreshold) {
        scrollTopBtn.classList.add('show');
      } else {
        scrollTopBtn.classList.remove('show');
      }
    }
    updateScrollTopBtn();
    window.addEventListener('scroll', updateScrollTopBtn, { passive: true });
    scrollTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---- Scroll reveal (fade-up, staggered) ----
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      var groups = {};
      revealEls.forEach(function (el) {
        var group = el.getAttribute('data-reveal-group') || 'default';
        groups[group] = groups[group] || [];
        groups[group].push(el);
      });
      Object.keys(groups).forEach(function (g) {
        groups[g].forEach(function (el, i) {
          el.style.transitionDelay = (i % 6) * 90 + 'ms';
        });
      });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('in-view'); });
    }
  }

  // ---- Cookie consent ----
  var COOKIE_KEY = 'pc_cookie_consent';
  var banner = document.getElementById('cookie-banner');
  if (banner) {
    var stored = null;
    try { stored = localStorage.getItem(COOKIE_KEY); } catch (e) { /* storage unavailable */ }
    if (!stored) {
      banner.classList.add('show');
    }
    var accept = document.getElementById('cookie-accept');
    var decline = document.getElementById('cookie-decline');
    function closeBanner(value) {
      try { localStorage.setItem(COOKIE_KEY, value); } catch (e) { /* ignore */ }
      banner.classList.remove('show');
    }
    if (accept) accept.addEventListener('click', function () { closeBanner('accepted'); });
    if (decline) decline.addEventListener('click', function () { closeBanner('declined'); });
  }

  // ---- Contact form ----
  var form = document.getElementById('contact-form');
  if (form) {
    var status = document.getElementById('form-status');

    function setError(fieldId, message) {
      var field = document.getElementById(fieldId).closest('.field');
      field.classList.add('has-error');
      field.querySelector('.error-msg').textContent = message;
    }
    function clearError(fieldId) {
      var field = document.getElementById(fieldId).closest('.field');
      field.classList.remove('has-error');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('cf-name');
      var phone = document.getElementById('cf-phone');
      var message = document.getElementById('cf-message');
      var valid = true;

      [name.id, phone.id, message.id].forEach(clearError);

      if (!name.value.trim()) {
        setError(name.id, 'Please tell us your name.');
        valid = false;
      }
      var phoneDigits = phone.value.replace(/[^0-9+]/g, '');
      if (!phoneDigits || phoneDigits.replace(/\D/g, '').length < 10) {
        setError(phone.id, 'Please enter a valid phone number (with country/area code).');
        valid = false;
      }
      if (!message.value.trim() || message.value.trim().length < 5) {
        setError(message.id, 'Let us know what you\'re looking for — a few words is fine.');
        valid = false;
      }

      if (!valid) {
        if (status) {
          status.textContent = 'Please fix the highlighted field(s) above.';
          status.style.color = 'var(--error)';
          status.classList.add('show');
        }
        return;
      }

      if (status) {
        status.textContent = 'Sending you to WhatsApp…';
        status.style.color = 'var(--success)';
        status.classList.add('show');
      }

      var text = 'Hello Pen Collection, my name is ' + name.value.trim() +
        '. ' + message.value.trim() + ' (Phone: ' + phone.value.trim() + ')';
      var waUrl = 'https://wa.me/2348930790672?text=' + encodeURIComponent(text);

      window.open(waUrl, '_blank', 'noopener');
      window.location.href = 'thank-you.html';
    });
  }
});
