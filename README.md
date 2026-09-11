# Select26 — event landing template

Cream-paper conference landing page built with **Astro 5 SSG** and hand CSS. Distinctive recreation of a curated talks-day layout (Select26 feel): sticky nav, hero typography, speaker grid with CSS initials, value props, tickets CTA, and sponsors.

**Catalog id:** `select26`  
**Demo:** https://select26.little.website/  
**Repo:** https://github.com/Little-Devs/template-select26

## Stack

- Astro 5 (static output)
- Hand CSS design tokens (`src/styles/global.css`)
- System font stacks approximating Inter + Manrope + IBM Plex Mono (no remote font host)
- Cloudflare Pages `public/_headers` (Steve security bar)

## Quick start

```bash
# Node 18.20+ / 20 / 22 recommended (scaffold used Node 22)
npm install
npm run dev      # http://localhost:4321
npm run build    # writes dist/
npm run preview  # serve dist/
```

## Customize

1. **Tokens** — edit `:root` in `src/styles/global.css` (`--cream-*`, `--ink*`, `--green*`, fonts).
2. **Copy / speakers** — `src/components/*.astro` (especially `Speakers.astro`, `Hero.astro`, `Tickets.astro`).
3. **Contact** — Tickets button uses `mailto:sales@little.cloud` (no checkout).
4. Read `AGENTS.md` and `PROMPT.md` before agent-driven edits.

## Sections

1. 3-col header — wordmark / copy+date / Apply via Luma  
2. Full-bleed pixel-art canvas  
3. Speakers — 6-col dithered CSS initials + TBA  
4. Value props — three columns on cream  
5. Agenda — Main Stage / Build Stage tabs + schedule table  
6. Tickets CTA over animated pixel canvas (mailto demo)  
7. Monochrome CSS photo mosaic  
8. Sponsors — bordered logo cards + Announcing soon  
9. Footer — wordmark, hosted-by, links, Luma CTA, pixel rail  

## Project layout

```
public/_headers
public/favicon.svg
src/styles/global.css
src/layouts/BaseLayout.astro
src/components/   # Header, Wordmark, PixelCanvas, Hero, Speakers,
                  # ValueProps, Agenda, Tickets, Mosaic, Sponsors, Footer
src/pages/index.astro
template.json
AGENTS.md
PROMPT.md
LICENSE
```

## Accessibility & motion

- Skip link to `#main`
- Visible `:focus-visible` rings
- `prefers-reduced-motion` disables non-essential transitions
- Responsive targets: 375 / 768 / 1280

## License

MIT © Little-Devs / Little Cloud OÜ
