# AGENTS.md

**Security and reliability are paramount.** Prefer a correct, boring change over a clever one. Do not invent backends, credentials, tracking, or third-party services.

## Template

- **Name:** `Select26`
- **Catalog id:** `select26`
- **Repository:** `https://github.com/Little-Devs/template-select26`
- **Demo:** `https://select26.little.website/`
- **Stack:** `Astro 5 (SSG)` · `Hand CSS (design tokens)` · `None (static HTML)`
- **Catalog:** https://github.com/Little-Devs/web-templates (`templates.json`)
- **MCP:** https://mcp.little.website (`get_template`, `get_agent_docs`)

## Agent / LLM setup

1. Read `README.md`, `template.json`, this file, and `PROMPT.md`.
2. Discover tokens and components from the repo — do not restyle from memory.
3. Keep the existing stack, file layout, and build commands unless the task explicitly changes them.
4. Work in small, reviewable diffs. Match local naming, comments, and formatting.
5. Verify the change the way a user would (`npm run dev` / `npm run build`, plus the relevant route).
6. Never commit secrets, `.env` files, API keys, or machine-local paths.

This document is harness-agnostic. It applies in Cursor, Claude, Codex, Cloudflare Agents, or any other runner.

## Security and reliability

Treat every change as production-bound.

- No secrets in source, docs, or client bundles.
- No new analytics, pixels, CDNs, or third-party scripts without an explicit request.
- Forms stay static (typically `mailto:`) unless the template already has a backend.
- Sanitize any user-controlled string that reaches HTML, URLs, or attributes.
- Preserve HTTPS, existing CSP / security headers, and dependency pins.
- Do not weaken auth, CORS, or cookie settings if they exist.
- Prefer existing dependencies. New packages need a reason and a lockfile update.
- Respect `prefers-reduced-motion`. Do not ship layout shift or broken empty/error states.
- If unsure whether a change is safe, stop and ask — do not guess.

## Design tokens and style guides

Use the template’s tokens. Do not introduce a parallel palette or type scale.

Typical sources (use what this repo actually has):

- `template.json` → `aesthetic.colors`, `aesthetic.fonts`, `sections`
- CSS custom properties (often `src/styles/`, `variables.css`, or `:root`)
- Tailwind / shadcn theme files when that is the stack

Rules:

- Change brand colour, type, or spacing by editing tokens — not one-off hex in components.
- Keep contrast WCAG AA. Do not flatten hierarchy or drop focus styles.
- Reuse existing layout primitives (grid, section wrappers, buttons, forms).
- Section on/off and light-custom (logo, colours, fonts, copy) are the default customization path.
- Do not add Google Fonts (or any new font host) if the template self-hosts type.

Fill in this template’s tokens when you copy the skeleton:

| Token | Value | Notes |
|-------|-------|-------|
| `--green` | `#3ECF8E` | Brand green |
| `--green-deep` | `#00482f` | Deep green |
| `--cream-0` / `--bg` | `#f8f3ef` | Cream paper |
| Display / body / mono | Manrope / Inter / IBM Plex Mono | System stacks; mono approximates Departure Mono |
| Content max | `1088px` | `--max` in `src/styles/global.css` |

## How agents should work

- Follow `PROMPT.md` for the reproduction task. Keep placeholders brief and concrete.
- Preserve information architecture unless the prompt says to add/remove a section.
- Swap demo copy, logo, and contact details; do not rewrite the product into a different business.
- Keep performance: no new hero videos, unoptimized images, or unused JS.
- Mobile, tablet, and desktop must all keep working.
- If the catalog or MCP metadata is wrong, say so — do not “fix” `templates.json` from a template repo.

## Out of scope

Leave these alone unless the user explicitly asks and the template already supports them:

- New frameworks, meta-frameworks, or CSS libraries
- Databases, auth, payments, CMS, or serverless backends
- Catalog edits, git submodules, or `web-templates` repo changes
- Production DNS, Cloudflare, or `*.little.website` deploys
- Tracking, A/B, chat widgets, or marketing pixels
- License changes (templates ship MIT)

## Contacts

- **Devs / template questions:** [devs@little.cloud](mailto:devs@little.cloud)
- **Platform (catalog, MCP, mcp.little.website):** Oppy
- **Security:** Steve

If a change could leak data, weaken a form, or add a third-party script, stop and ask Steve before shipping.
