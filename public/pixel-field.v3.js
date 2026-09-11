(() => {
  // Select-style flowing glyph field: dense arrow cells + drifting metaballs + curl noise.
  // Intentionally high motion so it reads live at a glance (prefers-reduced-motion respected).
  const ARROWS = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  const GLYPHS = ['.', '·', ':', '+', '×', '※', '✦', '░', '▒', '/', '\\', '|', '-', '†', 'x'];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  // Cheap value noise (hash) — enough for organic blobs without a lib.
  function hash2(x, y) {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
  function smoothNoise(x, y) {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0;
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);
    const a = hash2(x0, y0);
    const b = hash2(x0 + 1, y0);
    const c = hash2(x0, y0 + 1);
    const d = hash2(x0 + 1, y0 + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y) {
    let a = 0, amp = 0.55, f = 1;
    for (let i = 0; i < 4; i++) {
      a += amp * smoothNoise(x * f, y * f);
      amp *= 0.5;
      f *= 2.05;
    }
    return a;
  }

  function boot(canvas) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const palette = {
      bg: cssVar('--cream-0', '#f8f3ef'),
      dim: cssVar('--cream-2', '#e8e0d8'),
      g0: cssVar('--green-light', '#95e6b8'),
      g1: cssVar('--green', '#3ecf8e'),
      g2: cssVar('--green-deep', '#00482f'),
      ink: cssVar('--ink', '#001a10'),
    };
    const fills = [palette.dim, palette.g0, palette.g1, palette.g2, palette.ink];

    let W = 0, H = 0, CW = 10, CH = 12, cols = 0, rows = 0;
    let raf = 0, t0 = performance.now();
    let blobs = [];
    let pointer = { x: -9999, y: -9999, active: false };
    let phase = 0;

    function resize() {
      const parent = canvas.parentElement;
      const rect = parent ? parent.getBoundingClientRect() : canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.floor(rect.width || parent?.clientWidth || 1));
      H = Math.max(1, Math.floor(rect.height || parent?.clientHeight || canvas.clientHeight || 1));
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const scale = Math.max(0.7, Math.min(1.15, W / 1088));
      CW = Math.max(8, Math.round(9 * scale));
      CH = Math.max(10, Math.round(11 * scale));
      cols = Math.ceil(W / CW) + 1;
      rows = Math.ceil(H / CH) + 1;
      blobs = [
        { x: 0.18 * W, y: 0.45 * H, r: 0.38 * H, vx: 38, vy: -22, pulse: 1.1 },
        { x: 0.42 * W, y: 0.55 * H, r: 0.48 * H, vx: -28, vy: 18, pulse: 0.9 },
        { x: 0.68 * W, y: 0.4 * H, r: 0.42 * H, vx: 22, vy: 26, pulse: 1.25 },
        { x: 0.88 * W, y: 0.6 * H, r: 0.32 * H, vx: -36, vy: -14, pulse: 0.85 },
        { x: 0.55 * W, y: 0.25 * H, r: 0.28 * H, vx: 16, vy: 32, pulse: 1.4 },
      ];
    }

    function field(x, y, t) {
      // Curl-ish flow from fbm gradients + blob orbits
      const nx = x / Math.max(1, W);
      const ny = y / Math.max(1, H);
      const n = fbm(nx * 3.2 + t * 0.00035, ny * 2.4 - t * 0.00028);
      const n2 = fbm(nx * 2.1 - t * 0.00022 + 9.1, ny * 3.0 + t * 0.00031 + 4.2);
      let sx = (n - 0.5) * 2.2;
      let sy = (n2 - 0.5) * 2.2;
      let density = Math.pow(Math.max(0, n * 0.55 + n2 * 0.45 - 0.22), 1.15);

      for (const b of blobs) {
        const dx = x - b.x;
        const dy = y - b.y;
        const rr = b.r * (0.85 + 0.2 * Math.sin(t * 0.0018 * b.pulse + b.x * 0.01));
        const d2 = dx * dx + dy * dy;
        const d = Math.sqrt(d2) + 1;
        const fall = Math.max(0, 1 - d / rr);
        const soft = fall * fall * (3 - 2 * fall);
        density += soft * 0.95;
        // tangential swirl
        sx += (-dy / d) * soft * 1.8;
        sy += (dx / d) * soft * 1.8;
      }

      if (pointer.active) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 1;
        const pr = Math.min(W, H) * 0.28;
        const soft = Math.max(0, 1 - d / pr);
        density += soft * 0.55;
        sx += (dx / d) * soft * 2.4;
        sy += (dy / d) * soft * 2.4;
      }

      // left rail bias like Select
      if (nx < 0.22) density += 0.35 * (1 - nx / 0.22);

      return { density: Math.min(1.35, density), ang: Math.atan2(sy, sx) };
    }

    function step(now) {
      const t = now - t0;
      phase = t;
      const dt = 0.016;

      for (const b of blobs) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < -b.r * 0.3 || b.x > W + b.r * 0.3) b.vx *= -1;
        if (b.y < -b.r * 0.3 || b.y > H + b.r * 0.3) b.vy *= -1;
        // slight wander
        b.vx += Math.sin(t * 0.0011 + b.pulse) * 0.35;
        b.vy += Math.cos(t * 0.0009 + b.pulse * 2) * 0.35;
        const speed = Math.hypot(b.vx, b.vy);
        const max = 48;
        if (speed > max) {
          b.vx = (b.vx / speed) * max;
          b.vy = (b.vy / speed) * max;
        }
      }

      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, W, H);

      const fontSize = Math.max(8, Math.round(CH * 0.82));
      ctx.font = `600 ${fontSize}px ui-monospace, "IBM Plex Mono", "Geist Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const tick = Math.floor(t / 90);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * CW + CW / 2;
          const y = r * CH + CH / 2;
          const { density: lvl, ang } = field(x, y, t);

          if (lvl < 0.08) {
            if ((c + r + tick) % 7 === 0) {
              ctx.fillStyle = palette.dim;
              ctx.globalAlpha = 0.55;
              ctx.fillText('·', x, y);
              ctx.globalAlpha = 1;
            }
            continue;
          }

          const ai = ((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8;
          // High density → directional arrows that rotate with the field every frame
          // Mid → mixed glyphs that cycle fast so motion is obvious
          let ch;
          if (lvl > 0.38) {
            ch = ARROWS[ai];
          } else if (lvl > 0.22) {
            ch = ARROWS[ai];
            if ((c + r + tick) % 4 === 0) ch = GLYPHS[(c * 17 + r * 11 + tick) % GLYPHS.length];
          } else {
            ch = GLYPHS[(c * 13 + r * 7 + tick) % GLYPHS.length];
          }

          const fi = Math.min(fills.length - 1, Math.floor(lvl * fills.length));
          ctx.fillStyle = fills[fi];
          ctx.globalAlpha = Math.min(1, 0.45 + 0.55 * Math.min(1, lvl));
          ctx.fillText(ch, x, y);
          ctx.globalAlpha = 1;
        }
      }

      // travelling signal bar (Select-ish scan)
      if (!reduce) {
        const sweepX = ((t * 0.12) % (W + 120)) - 60;
        const grad = ctx.createLinearGradient(sweepX - 40, 0, sweepX + 40, 0);
        grad.addColorStop(0, 'rgba(62,207,142,0)');
        grad.addColorStop(0.5, 'rgba(62,207,142,0.12)');
        grad.addColorStop(1, 'rgba(62,207,142,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      if (!reduce) raf = requestAnimationFrame(step);
    }

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) step(performance.now());
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const host = canvas.parentElement || canvas;
    const onMove = (e) => {
      const rect = host.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    };
    host.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', onLeave, { passive: true });

    if (reduce) {
      step(performance.now());
    } else {
      raf = requestAnimationFrame(step);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('load', init);
})();
