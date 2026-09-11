(() => {
  const ARROWS = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  const GLYPHS = ['.', '·', ':', '+', '×', '░', '▒', '▓', '→', '←', '↑', '↓'];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function boot(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const palette = {
      bg: cssVar('--cream-0', '#f8f3ef'),
      dim: cssVar('--cream-2', '#f4ece6'),
      g0: cssVar('--green-light', '#94e6b7'),
      g1: cssVar('--green', '#3ecf8e'),
      g2: cssVar('--green-deep', '#00482f'),
      ink: cssVar('--ink', '#0b0e0d'),
    };
    const fills = [palette.g0, palette.g1, palette.g2, palette.ink];

    let W = 0, H = 0, CW = 14, CH = 18, cols = 0, rows = 0;
    let raf = 0, t0 = performance.now();
    let vortices = [];

    function resize() {
      const parent = canvas.parentElement;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.floor(rect.width));
      H = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const scale = Math.max(0.85, Math.min(1.25, W / 1088));
      CW = Math.round(14 * scale);
      CH = Math.round(18 * scale);
      cols = Math.ceil(W / CW) + 1;
      rows = Math.ceil(H / CH) + 1;
      vortices = Array.from({ length: 3 }, (_, i) => ({
        x: (0.2 + 0.3 * i) * W,
        y: (0.35 + 0.15 * (i % 2)) * H,
        vx: (i % 2 ? 1 : -1) * (18 + 6 * i),
        vy: (i % 2 ? -1 : 1) * (10 + 4 * i),
        r: 80 + 40 * i,
      }));
    }

    function levelAt(x, y, t) {
      let L = 0;
      for (const v of vortices) {
        const dx = x - v.x;
        const dy = y - v.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 1;
        L += Math.max(0, 1 - d / v.r) * (0.55 + 0.45 * Math.sin(t * 0.0015 + d * 0.02));
        // swirl influence for arrow direction
        v._lx = -dy / d;
        v._ly = dx / d;
      }
      // left bar density like Select hero
      const bar = x < W * 0.28 ? 0.35 : 0;
      return Math.min(1, L + bar);
    }

    function dirAt(x, y) {
      let sx = 0, sy = 0;
      for (const v of vortices) {
        const dx = x - v.x;
        const dy = y - v.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 1;
        const w = Math.max(0, 1 - d / (v.r * 1.4));
        sx += (-dy / d) * w;
        sy += (dx / d) * w;
      }
      return Math.atan2(sy, sx);
    }

    function step(now) {
      const t = now - t0;
      for (const v of vortices) {
        v.x += v.vx * 0.016;
        v.y += v.vy * 0.016;
        if (v.x < -40 || v.x > W + 40) v.vx *= -1;
        if (v.y < -40 || v.y > H + 40) v.vy *= -1;
      }

      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, W, H);

      ctx.font = `500 ${Math.round(CH * 0.72)}px ui-monospace, "IBM Plex Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * CW + CW / 2;
          const y = r * CH + CH / 2;
          const lvl = levelAt(x, y, t);
          if (lvl < 0.08) {
            if ((c + r) % 7 === 0) {
              ctx.fillStyle = palette.dim;
              ctx.globalAlpha = 0.55;
              ctx.fillText('·', x, y);
              ctx.globalAlpha = 1;
            }
            continue;
          }
          const ang = dirAt(x, y);
          const ai = ((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8;
          const ch = lvl > 0.55 ? ARROWS[ai] : GLYPHS[(c * 13 + r * 7 + Math.floor(t / 180)) % GLYPHS.length];
          const fi = Math.min(fills.length - 1, Math.floor(lvl * fills.length));
          ctx.fillStyle = fills[fi];
          ctx.globalAlpha = 0.45 + 0.55 * lvl;
          ctx.fillText(ch, x, y);
          ctx.globalAlpha = 1;
        }
      }

      if (!reduce) raf = requestAnimationFrame(step);
    }

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) step(performance.now());
    });
    ro.observe(canvas.parentElement);

    if (reduce) {
      step(performance.now());
    } else {
      raf = requestAnimationFrame(step);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }

  function init() {
    document.querySelectorAll('[data-pixel-canvas]').forEach((el) => {
      const canvas = el.querySelector('canvas');
      if (canvas && !canvas.dataset.booted) {
        canvas.dataset.booted = '1';
        boot(canvas);
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
