(() => {
  const ARROWS = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  const GLYPHS = ['.', '·', ':', '+', '×', '░', '▒', '▓', '→', '←', '↑', '↓', '※', '✦'];
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
      g0: cssVar('--green-light', '#95e6b8'),
      g1: cssVar('--green', '#3ecf8e'),
      g2: cssVar('--green-deep', '#00482f'),
      ink: cssVar('--ink', '#001a10'),
    };
    const fills = [palette.g0, palette.g1, palette.g2, palette.ink];

    let W = 0, H = 0, CW = 12, CH = 16, cols = 0, rows = 0;
    let raf = 0, t0 = performance.now();
    let vortices = [];

    function resize() {
      const parent = canvas.parentElement;
      const rect = parent ? parent.getBoundingClientRect() : canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.floor(rect.width || parent?.clientWidth || 1));
      H = Math.max(
        1,
        Math.floor(rect.height || parent?.clientHeight || canvas.clientHeight || 1)
      );
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const scale = Math.max(0.75, Math.min(1.2, W / 1088));
      // denser glyphs
      CW = Math.round(11 * scale);
      CH = Math.round(14 * scale);
      cols = Math.ceil(W / CW) + 1;
      rows = Math.ceil(H / CH) + 1;
      // 4 vortices, faster velocities
      vortices = Array.from({ length: 4 }, (_, i) => ({
        x: (0.15 + 0.22 * i) * W,
        y: (0.25 + 0.18 * (i % 3)) * H,
        vx: (i % 2 ? 1 : -1) * (42 + 14 * i),
        vy: (i % 2 ? -1 : 1) * (28 + 10 * i),
        r: 110 + 55 * i,
      }));
    }

    function levelAt(x, y, t) {
      let L = 0;
      for (const v of vortices) {
        const dx = x - v.x;
        const dy = y - v.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 1;
        L += Math.max(0, 1 - d / v.r) * (0.65 + 0.5 * Math.sin(t * 0.0028 + d * 0.025));
      }
      const bar = x < W * 0.28 ? 0.4 : 0;
      return Math.min(1, L + bar);
    }

    function dirAt(x, y) {
      let sx = 0, sy = 0;
      for (const v of vortices) {
        const dx = x - v.x;
        const dy = y - v.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 1;
        const w = Math.max(0, 1 - d / (v.r * 1.5));
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
        if (v.x < -60 || v.x > W + 60) v.vx *= -1;
        if (v.y < -60 || v.y > H + 60) v.vy *= -1;
      }

      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, W, H);

      ctx.font = `600 ${Math.round(CH * 0.78)}px ui-monospace, "IBM Plex Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * CW + CW / 2;
          const y = r * CH + CH / 2;
          const lvl = levelAt(x, y, t);
          if (lvl < 0.06) {
            if ((c + r) % 5 === 0) {
              ctx.fillStyle = palette.dim;
              ctx.globalAlpha = 0.7;
              ctx.fillText('·', x, y);
              ctx.globalAlpha = 1;
            }
            continue;
          }
          const ang = dirAt(x, y);
          const ai = ((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8;
          const ch =
            lvl > 0.45
              ? ARROWS[ai]
              : GLYPHS[(c * 13 + r * 7 + Math.floor(t / 120)) % GLYPHS.length];
          const fi = Math.min(fills.length - 1, Math.floor(lvl * fills.length));
          ctx.fillStyle = fills[fi];
          // higher alpha + green contrast
          ctx.globalAlpha = 0.62 + 0.38 * lvl;
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
    if (canvas.parentElement) ro.observe(canvas.parentElement);

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

  // boot on DOMContentLoaded + load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('load', init);
})();
