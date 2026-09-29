/* ============================================================
   STUDIO RHÔDANIEN — script.js
   Loader · Transitions · Reveal · Word-reveal · Parallax
   Magnétique · Compteurs · Header · Vidéo hero · Menu mobile
   ============================================================ */
(() => {
  'use strict';

  const isMobile = () => window.innerWidth < 768;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. LOADER (index uniquement) ---------- */
  function initLoader() {
    const loader = document.getElementById('loaderScreen');
    if (!loader) return Promise.resolve();
    document.body.classList.add('loader-active');
    return new Promise(resolve => {
      let done = false;
      const exit = () => {
        if (done) return; done = true;
        loader.classList.add('exit');
        setTimeout(() => { loader.remove(); document.body.classList.remove('loader-active'); resolve(); }, 800);
      };
      setTimeout(exit, reduceMotion ? 200 : 2500);
      ['click', 'wheel', 'touchmove', 'keydown'].forEach(ev => document.addEventListener(ev, exit, { once: true, passive: true }));
    });
  }

  /* ---------- 2. TRANSITIONS DE PAGE ---------- */
  function initPageTransitions() {
    const overlay = document.createElement('div');
    overlay.className = 'page-transition';
    document.body.appendChild(overlay);

    // Retour arrière (bfcache) : on remet l'overlay hors écran
    window.addEventListener('pageshow', e => { if (e.persisted) { overlay.className = 'page-transition'; document.body.classList.remove('transitioning'); } });

    document.addEventListener('click', e => {
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (a.target === '_blank' || a.hasAttribute('download') || e.metaKey || e.ctrlKey) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;

      e.preventDefault();
      document.body.classList.add('transitioning');
      overlay.classList.add('enter');
      setTimeout(() => { location.href = a.href; }, reduceMotion ? 0 : 500);
    });
  }

  /* ---------- 3. SCROLL REVEAL + STAGGER ---------- */
  function initReveal() {
    const targets = document.querySelectorAll('.reveal, .value, h2:not(.hero h2), .lead:not(.hero .lead), .step, .quote, .work, .stat');
    targets.forEach(el => el.classList.add('reveal'));

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        // Stagger : index dans son parent parmi les frères .reveal
        const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
        const idx = siblings.indexOf(el);
        el.style.transitionDelay = `${Math.min(idx, 8) * 100}ms`;
        el.classList.add('is-visible');
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    targets.forEach(el => io.observe(el));
  }

  /* ---------- 4. WORD REVEAL (H1) ---------- */
  function splitWords(h1) {
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const outer = document.createElement('span'); outer.className = 'word-reveal';
            const inner = document.createElement('span'); inner.textContent = part;
            outer.appendChild(inner); frag.appendChild(outer);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(h1);
    h1.querySelectorAll('.word-reveal > span').forEach((s, i) => { s.style.transitionDelay = `${i * 80}ms`; });
  }
  function initWordReveal() {
    document.querySelectorAll('h1').forEach(splitWords);
  }
  function playWordReveal() {
    document.querySelectorAll('h1').forEach(h1 => h1.classList.add('words-in'));
  }

  /* ---------- 5. PARALLAX HERO ---------- */
  function initParallax() {
    const media = document.querySelector('.hero-media');
    if (!media || isMobile() || reduceMotion) return;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      if (y < window.innerHeight * 1.2) media.style.transform = `translate3d(0, ${y * 0.4}px, 0)`;
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
  }

  /* ---------- 6. HOVER MAGNÉTIQUE ---------- */
  function initMagnetic() {
    if (isMobile() || reduceMotion || !window.matchMedia('(hover: hover)').matches) return;
    const RADIUS = 80, MAX = 15;
    document.querySelectorAll('.btn, .work-link').forEach(el => {
      let raf = null;
      const parent = el.closest('.work') || el;
      parent.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = e.clientX - cx, dy = e.clientY - cy;
        const d = Math.hypot(dx, dy);
        const limit = RADIUS + Math.max(r.width, r.height) / 2;
        if (d > limit) { el.style.transform = ''; return; }
        const f = Math.min(1, (limit - d) / limit) * MAX;
        const tx = (dx / d || 0) * f, ty = (dy / d || 0) * f;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => { el.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)`; });
      });
      parent.addEventListener('mouseleave', () => { cancelAnimationFrame(raf); el.style.transform = ''; });
    });
  }

  /* ---------- 7. COMPTEURS ---------- */
  function initCounters() {
    const nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        const decimals = (el.dataset.count.split('.')[1] || '').length;
        const dur = reduceMotion ? 1 : 1500;
        const start = performance.now();
        const tick = now => {
          const p = Math.min(1, (now - start) / dur);
          el.textContent = prefix + (target * easeOut(p)).toFixed(decimals) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    nums.forEach(n => { n.textContent = (n.dataset.prefix || '') + '0' + (n.dataset.suffix || ''); io.observe(n); });
  }

  /* ---------- 8. HEADER AU SCROLL + LIEN ACTIF ---------- */
  function initHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const current = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === current || (current === 'index.html' && (href === '/' || href === 'index.html'))) a.classList.add('active');
    });
  }

  /* ---------- 9. MENU MOBILE ---------- */
  function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open);
    });
    document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('nav-open')));
  }

  /* ---------- 10. CARROUSEL VIDÉO HERO ---------- */
  function initHeroVideo() {
    const video = document.getElementById('videoHero');
    if (!video) return;
    const sources = ['assets/videos/video1.mp4', 'assets/videos/video2.mp4', 'assets/videos/video3.mp4'];
    let i = 0;
    const play = () => { video.src = sources[i]; video.play().catch(() => {}); };
    video.addEventListener('ended', () => {
      video.classList.add('fade-out');
      setTimeout(() => { i = (i + 1) % sources.length; play(); video.classList.remove('fade-out'); }, 800);
    });
    video.addEventListener('error', () => { i = (i + 1) % sources.length; if (i !== 0) play(); });
    play();
  }

  /* ---------- 11. FORMULAIRE (validation basique) ---------- */
  function initForms() {
    document.querySelectorAll('form[data-validate]').forEach(form => {
      form.addEventListener('submit', e => {
        const email = form.querySelector('[type=email]');
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
          e.preventDefault(); email.focus(); email.setCustomValidity('Adresse email invalide'); email.reportValidity();
        }
      });
    });
  }

  /* ---------- INIT ---------- */
  document.addEventListener('DOMContentLoaded', async () => {
    initWordReveal();
    initHeader();
    initMobileNav();
    initPageTransitions();
    initHeroVideo();
    initForms();

    await initLoader();          // attend la fin du loader (ou résout immédiatement)
    playWordReveal();            // le H1 s'écrit juste après le loader
    initReveal();
    initCounters();
    initParallax();
    initMagnetic();
  });
})();
