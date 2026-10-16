# Mantine Design System

A design system reconstructed from the open-source **Mantine** React component library, for generating well-branded Mantine-style interfaces, prototypes, and assets.

## Source

This system was built by reading the Mantine source code directly:

- **GitHub:** https://github.com/mantinedev/mantine — the canonical source. Tokens here are lifted verbatim from `packages/@mantine/core/src/core/MantineProvider/default-theme.ts` and `default-colors.ts`; component behavior mirrors the real CSS modules (`Button.module.css`, `Input.module.css`, the variant-color resolver, etc.).
- **Docs / live demos:** https://mantine.dev and https://ui.mantine.dev

Readers with access should explore the repo further — the real package has hundreds of components, hooks, and edge cases this kit summarizes. This kit captures the foundations and the most-used primitives faithfully, not the entire API surface.

## What Mantine is

Mantine is a full-featured React UI library (120+ components, 70+ hooks) focused on **developer experience and a clean, neutral, professional default look**. It is not a heavily-branded product — it's a toolkit. Its visual identity is therefore *restrained and systemic*: a 10-step color scale per hue, soft layered shadows, generous radii, the native system font stack, and a single bright-blue primary. The brand color is **blue (#228be6)**; the mascot/logo is a rounded blue badge with a stylized "branch" glyph.

---

## Content fundamentals

How Mantine writes copy (from its docs and demo content):

- **Voice:** clear, technical, friendly-but-not-cute. It explains, it doesn't sell. Documentation-grade plain English.
- **Person:** addresses the developer as **"you"** ("you can use…", "set the `variant` prop"). Describes the library as Mantine or "the component."
- **Casing:** **Sentence case everywhere** — headings, buttons, labels ("Get started", "New project", not "Get Started"). Component and prop names are code-cased (`TextInput`, `leftSection`).
- **Buttons / CTAs:** short imperative verbs — "Book now", "Save changes", "Get started", "View all".
- **Tone:** confident, minimal, never hype-y. No exclamation marks in product UI; sparse emoji (a single 👋 in a welcome header at most — emoji are *not* part of the brand system).
- **Labels:** uppercase micro-labels for stat/section eyebrows (e.g. "REVENUE", "ACTIVE PROJECTS") with letter-spacing — a recurring Mantine dashboard pattern.
- **Vibe:** a capable tool that gets out of your way. Neutral grays, one assertive accent, lots of whitespace.

---

## Visual foundations

**Color.** Every hue is a 10-shade scale, index `0` (lightest) → `9` (darkest). Primary is **blue**; the filled/solid value is **shade 6** (`#228be6`) in light mode, hover is shade 7. "Light" variants are the primary at ~10% alpha. Neutral UI (borders, surfaces, dimmed text) comes from the **gray** scale; `dark` is a separate near-black scale used for dark-mode surfaces. Semantic: error = `red-6`, success = `teal-8`, links = `blue-6`. 14 accent hues available (red, pink, grape, violet, indigo, blue, cyan, teal, green, lime, yellow, orange + gray + dark). Color usage is **disciplined**: one primary accent per screen, gray for everything structural.

**Type.** The **native system font stack** (`-apple-system, Segoe UI, Roboto…`) for both body and headings — no webfont is downloaded. Monospace stack for code. Headings are weight **700**; body weights are 400 (regular) / 600 (medium) / 700 (bold). Body sizes: xs 12 · sm 14 · **md 16 (base)** · lg 18 · xl 20. Heading scale: h1 34 → h6 14, line-heights tightening from 1.3 at h1.

**Spacing.** Scale: xs 10 · sm 12 · **md 16** · lg 20 · xl 32 (px). Generous, breathable. Layout gutters typically `xl`.

**Radius.** xs 2 · sm 4 · **md 8 (default)** · lg 16 · xl 32. Most surfaces use `md`; badges and avatars go pill/circle (`xl`/100%). Inputs default to `sm`.

**Shadows.** Soft, **layered, very low-opacity black** (never colored, never harsh). Five steps xs→xl, each combining a tight 1–3px ambient shadow with a larger diffuse one. Cards typically pair `withBorder` + `shadow="sm"`. Elevation is subtle — Mantine leans on **1px gray borders** more than shadow for separation.

**Borders.** 1px, `gray-3`/`gray-4` in light mode (`dark-4` in dark mode). Borders do a lot of the structural work — table rows, card edges, navbar/header dividers are all hairline gray.

**Backgrounds.** Flat. Body is white (`gray-0` for app canvas behind cards). **No gradients** in the default look (a `gradient` variant exists for buttons/badges — blue→cyan at 45° — but it's opt-in and rare). No textures, no illustrations baked into chrome, no full-bleed hero imagery in the component system itself.

**Hover / press.** Hover = a small step darker for filled (shade 6→7) or a faint tint for light/subtle variants; default/neutral surfaces go to `gray-0`. Transitions are quick (`100–150ms ease`), opacity/background only — **no scale, bounce, or translate** on hover. Buttons have a subtle blurred overlay on the loading state. Disabled = gray bg + gray text, `not-allowed` cursor.

**Animation.** Minimal and functional. Fades and color transitions in the 100–150ms range. No decorative motion, no spring physics in the core look. `respectReducedMotion` is a first-class theme flag.

**Transparency / blur.** Used sparingly — "light" variant backgrounds are alpha tints of the hue (~10–15%); overlays/modals dim with a translucent scrim. No frosted-glass aesthetic by default.

**Focus.** Visible focus ring (`focusRing: 'auto'`) — a 2px outline in the primary color on keyboard focus; inputs shift their border to the primary color on focus.

**Cards.** White surface, `md` radius, 1px `gray-3` border, optional soft `sm` shadow, `md`/`lg` padding. `Card.Section` allows full-bleed regions (images, headers) that ignore the padding.

**Dark mode** is a first-class scheme: surfaces use the `dark` scale (body = `dark-7`, cards = `dark-6`), text = `dark-0`, borders = `dark-4`. Toggle via `[data-mantine-color-scheme="dark"]` on a wrapper (the semantic token overrides are wired in `tokens/semantic.css`).

---

## Iconography

Mantine's docs, demos, and ecosystem standardize on **[Tabler Icons](https://tabler.io/icons)** (`@tabler/icons-react`). Characteristics:

- **Outline / stroke** style, **1.5px stroke weight**, drawn on a **24×24 grid**, rounded line caps and joins. Clean, geometric, consistent.
- Used at 16–20px inside buttons/inputs, ~18–22px standalone. Pass `size` to the React component: `<IconSearch size={16} />`.
- There is **no custom Mantine icon font** — Tabler *is* the icon system.
- **Emoji** are not part of the icon system (an occasional 👋 in welcome copy is the exception, not a pattern). Unicode glyphs are not used as icons.

**In this kit**, Tabler is loaded from CDN as a webfont for cards and UI kits: `<link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.24.0/dist/tabler-icons.min.css">`, then `<i class="ti ti-search"></i>`. In production React, use `@tabler/icons-react`. This is the real Mantine icon set, so it is not a substitution.

**Logo** assets live in `assets/`: `mantine-logo-icon.svg` (the rounded blue badge, taken from `@mantinex/mantine-logo`) and `mantine-wordmark.svg` (badge + "mantine" wordmark). The badge background is `blue-5` (#339af0) with a white glyph.

---

## Index / manifest

**Root**
- `styles.css` — global entry point (import this one file). `@import`s all tokens.
- `tokens/` — `colors.css` (14 hue scales + primary aliases), `semantic.css` (light + dark semantic vars), `typography.css`, `spacing.css` (spacing/radius/shadow/breakpoints/z-index), `base.css` (reset + element defaults).
- `assets/` — `mantine-logo-icon.svg`, `mantine-wordmark.svg`.
- `SKILL.md` — Agent-Skills-compatible entry point.

**Components** (`components/<group>/` — React primitives, namespace `MantineDesignSystem_bdb301`)
- `buttons/` — **Button**, **ActionIcon**
- `inputs/` — **TextInput**, **Checkbox**, **Switch**, **Radio**
- `data-display/` — **Paper**, **Card** (+ `Card.Section`), **Badge**, **Avatar**
- `feedback/` — **Alert**
- `navigation/` — **Tabs** (+ `Tabs.List` / `Tabs.Tab` / `Tabs.Panel`)

Each has a `.jsx` implementation, a `.d.ts` props contract, a `.prompt.md` usage note, and a `@dsCard` demo HTML.

**UI kits** (`ui_kits/`)
- `dashboard/` — a full Mantine **AppShell admin dashboard** (sidebar navbar + header + stats + projects table + activity feed + settings form). Interactive nav switching. `index.html` is the entry; views are split into `Navbar.jsx`, `Header.jsx`, `DashboardView.jsx`, `SettingsView.jsx`.

**Guidelines** (`guidelines/`) — foundation specimen cards: color (primary, neutral, semantic, accents), type (headings, body, families), spacing (scale, radius, shadow), brand (logo, logo-on-dark, iconography).

---

## Using the components

In `@dsCard` / kit HTML, load the compiled bundle and read components off the namespace:

```html
<link rel="stylesheet" href="styles.css" />
<script src="_ds_bundle.js"></script>
<script type="text/babel">
  const { Button, Card, Badge, TextInput } = window.MantineDesignSystem_bdb301;
</script>
```

In production React, this kit maps 1:1 onto the real `@mantine/core` package — install it and import from there.
