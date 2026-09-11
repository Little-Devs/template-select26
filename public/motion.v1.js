(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  // Soft scroll reveals for major sections / cards
  const targets = document.querySelectorAll(
    '.section, .speaker-card, .sponsor-row, .agenda-row, .hero-meta, .tickets, [data-reveal]'
  );
  targets.forEach((el, i) => {
    el.classList.add('motion-reveal');
    el.style.setProperty('--reveal-delay', `${Math.min(i * 40, 280)}ms`);
  });

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('motion-reveal--in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  );
  targets.forEach((el) => io.observe(el));

  // Subtle hover lift on speaker cards
  document.querySelectorAll('.speaker-card').forEach((card) => {
    card.classList.add('motion-hover');
  });
})();
