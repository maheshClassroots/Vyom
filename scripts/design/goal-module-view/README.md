# Goal Page: the chapter drill-in in the Chapter Journey's module language

The later package's Goal Page draws its chapter drill-in (`.cd-modeview`)
with the earlier pod style: a painted planet, a corner badge, a plain label.
The app wants it to read like the Chapter Journey's module path — Rive module
nodes from `moduleicon.riv`, the flat lavender cards, and Spark riding the
thread — so the importer applies these on the way in:

- `module-card.css` — the module-card block of the Chapter Journey's
  stylesheet, appended to the Goal Page's `<style>`.
- `pods.from.html` → `pods.html` — the chapter view's module-pod template,
  replaced with the Chapter Journey's (Rive node, card, pill, progress bar).
- `step-art.from.html` → a Rive module node — the goal thread's own step
  pods lose their painted planet, corner badges and pulse ring; their card
  takes the `mc-card` class and keeps the goal's content.
- One pod size (92px, the node's own) for every module on the goal thread,
  so the cards sit at one offset and the hit areas match.
- A tap on a thread module no longer opens the lesson (the active card's
  Start button does). It drives the icons and Spark instead: tapping the
  module Spark stands at puts `sparkAtActive` down; tapping any module that
  is not completed makes it the active one and walks Spark to it, where
  `sparkAtActive` goes up.
- `progress-card.from.html` → `progress-card.html` + `progress-card.css` —
  the progress card is rebuilt as a pill with the goal-path illustration
  (`GoalPath.riv`, driven by `../vendor/goal-path-rive.js`) rising at its
  right end. Closed: the eyebrow, a round toggle and the count. Open: the
  chapter rows fold out above the count (the grid-track trick, so the height
  eases), the eyebrow crossfades to "Chapter view", the toggle turns, and the
  rows keep clear of the flag that hoists at 100%. The count pops when it
  changes and turns green with "All topics covered" at the summit. The card
  is pinned to the page's bottom-right at every width. The page's chapter
  counts read from `window.__goalProgress` and re-render on
  `window.__goalRerender()`, which the app's "Progress demo" button drives
  through `postMessage` for a demo climb from zero to the summit; a count
  that goes down replays the reveal, since the artboard only climbs.
- The thread runs to the page's foot and fades out there, which also stops
  the progress card, pinned inside the thread's masked scroller, being cut
  at its edge. Vyom keeps the package's place beside the composer.
- The module fields that template reads (`mcLabel`, `mcState`, `mcType`, …)
  are added to the Goal Page's `buildModules` — see `goal-patches.mjs`.
- `../vendor/module-icon-rive.js` and `../vendor/spark-journey.js` — the two
  Rive helpers, which the later package does not ship; copied in and loaded
  after `vyom-rive.js`.

All three snippets are taken verbatim from the imported pages, so a change in
either package shows up as a failed exact-match on the next import rather
than a silent drift.
