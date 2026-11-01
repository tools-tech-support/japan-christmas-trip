(() => {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;
  let current = 0;

  const progressFill = document.getElementById('progressFill');
  const statusCount = document.getElementById('statusCount');
  const statusLabel = document.getElementById('statusLabel');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const gridBtn = document.getElementById('gridBtn');
  const gridDrawer = document.getElementById('gridDrawer');
  const closeGridBtn = document.getElementById('closeGridBtn');
  const sorterCards = document.getElementById('sorterCards');
  const snowBtn = document.getElementById('snowBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const statusPill = document.getElementById('statusPill');

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function buildSorter() {
    if (!sorterCards) return;
    sorterCards.innerHTML = '';
    slides.forEach((slide, idx) => {
      const title = slide.dataset.title || `Slide ${idx + 1}`;
      const sub = slide.dataset.sub || '';
      const thumb = slide.dataset.thumb || 'images/cover_fuji_winter.jpg';

      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'sorter-item' + (idx === current ? ' current' : '');
      card.setAttribute('aria-label', `Go to slide ${idx + 1}: ${title}`);
      card.innerHTML = `
        <img src="${thumb}" alt="" loading="lazy" />
        <div class="sorter-item-meta">
          <span class="sorter-num">${pad(idx + 1)} ${sub ? '· ' + sub : ''}</span>
          <div class="sorter-title">${title}</div>
        </div>
      `;
      card.addEventListener('click', () => {
        goToSlide(idx);
        toggleGrid(false);
      });
      sorterCards.appendChild(card);
    });
  }

  function goToSlide(targetIdx) {
    const nextIdx = Math.max(0, Math.min(total - 1, targetIdx));
    if (nextIdx === current && slides[current].classList.contains('active')) {
      updateChrome();
      return;
    }

    const prevSlideEl = slides[current];
    slides.forEach((s) => s.classList.remove('prev-exit'));
    if (prevSlideEl && prevSlideEl !== slides[nextIdx]) {
      prevSlideEl.classList.remove('active');
      prevSlideEl.classList.add('prev-exit');
    }

    current = nextIdx;
    slides[current].classList.add('active');
    slides[current].scrollTop = 0;

    updateChrome();
    try {
      history.replaceState(null, '', `#slide-${current + 1}`);
    } catch (_) {}
  }

  function updateChrome() {
    if (progressFill) {
      progressFill.style.width = `${((current + 1) / total) * 100}%`;
    }
    if (statusCount) {
      statusCount.textContent = `${pad(current + 1)} / ${pad(total)}`;
    }
    if (statusLabel) {
      statusLabel.textContent = slides[current].dataset.title || '';
    }
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === total - 1;

    if (sorterCards) {
      Array.from(sorterCards.children).forEach((el, i) => {
        el.classList.toggle('current', i === current);
      });
    }
  }

  function toggleGrid(force) {
    if (!gridDrawer) return;
    const willOpen = typeof force === 'boolean' ? force : !gridDrawer.classList.contains('open');
    gridDrawer.classList.toggle('open', willOpen);
    if (gridBtn) gridBtn.classList.toggle('active-toggle', willOpen);
  }

  function toggleSnow() {
    const off = document.body.classList.toggle('snow-off');
    if (snowBtn) snowBtn.classList.toggle('active-toggle', !off);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  document.addEventListener('fullscreenchange', () => {
    const isFs = Boolean(document.fullscreenElement);
    document.body.classList.toggle('is-fullscreen', isFs);
    if (fullscreenBtn) fullscreenBtn.classList.toggle('active-toggle', isFs);
  });

  // Expose jump helper for interactive map nodes & CTA buttons
  window.jumpToSlide = (oneBasedIndex) => {
    goToSlide(oneBasedIndex - 1);
  };

  prevBtn?.addEventListener('click', () => goToSlide(current - 1));
  nextBtn?.addEventListener('click', () => goToSlide(current + 1));
  gridBtn?.addEventListener('click', () => toggleGrid());
  statusPill?.addEventListener('click', () => toggleGrid());
  closeGridBtn?.addEventListener('click', () => toggleGrid(false));
  snowBtn?.addEventListener('click', toggleSnow);
  fullscreenBtn?.addEventListener('click', toggleFullscreen);

  // Keyboard Navigation
  document.addEventListener('keydown', (e) => {
    if (gridDrawer?.classList.contains('open')) {
      if (e.key === 'Escape' || e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        toggleGrid(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
      case ' ':
        e.preventDefault();
        goToSlide(current + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        goToSlide(current - 1);
        break;
      case 'Home':
        e.preventDefault();
        goToSlide(0);
        break;
      case 'End':
        e.preventDefault();
        goToSlide(total - 1);
        break;
      case 'g':
      case 'G':
        e.preventDefault();
        toggleGrid();
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 's':
      case 'S':
        e.preventDefault();
        toggleSnow();
        break;
    }
  });

  // Touch Swipe Navigation
  let touchStartX = 0;
  let touchStartY = 0;
  const stage = document.querySelector('.deck-stage');
  stage?.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  stage?.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) goToSlide(current + 1);
      else goToSlide(current - 1);
    }
  }, { passive: true });

  // Subtle Winter Lookbook Snowfall Canvas
  const canvas = document.getElementById('snowCanvas');
  if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const ctx = canvas.getContext('2d');
    let flakes = [];
    let w = 0;
    let h = 0;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      w = canvas.width = Math.max(rect.width, 640);
      h = canvas.height = Math.max(rect.height, 360);
    }

    function initFlakes() {
      resize();
      flakes = Array.from({ length: 52 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2.1 + 0.7,
        vy: Math.random() * 0.45 + 0.22,
        vx: (Math.random() - 0.5) * 0.28,
        alpha: Math.random() * 0.45 + 0.18
      }));
    }

    function drawSnow() {
      if (!document.body.classList.contains('snow-off')) {
        ctx.clearRect(0, 0, w, h);
        const isSnowTheme = slides[current]?.classList.contains('theme-snow');
        for (const f of flakes) {
          f.y += f.vy;
          f.x += f.vx + Math.sin(f.y * 0.012) * 0.18;
          if (f.y > h + 6) { f.y = -6; f.x = Math.random() * w; }
          if (f.x > w + 6) f.x = -6;
          if (f.x < -6) f.x = w + 6;

          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fillStyle = isSnowTheme
            ? `rgba(180, 148, 60, ${f.alpha * 0.55})`
            : `rgba(255, 255, 255, ${f.alpha})`;
          ctx.fill();
        }
      }
      requestAnimationFrame(drawSnow);
    }

    window.addEventListener('resize', resize);
    initFlakes();
    requestAnimationFrame(drawSnow);
  }

  // Initial Slide from URL Hash + Hashchange Deep-Linking
  buildSorter();
  function syncFromHash() {
    const m = window.location.hash.match(/^#slide-(\d+)$/);
    if (m) {
      const idx = Math.max(0, Math.min(total - 1, parseInt(m[1], 10) - 1));
      if (idx !== current || !slides[current].classList.contains('active')) {
        goToSlide(idx);
      }
    }
  }
  const match = window.location.hash.match(/^#slide-(\d+)$/);
  const initialIdx = match ? Math.max(0, Math.min(total - 1, parseInt(match[1], 10) - 1)) : 0;
  slides[0].classList.remove('active');
  goToSlide(initialIdx);
  window.addEventListener('hashchange', syncFromHash);
})();
