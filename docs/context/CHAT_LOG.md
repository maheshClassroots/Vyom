# Chat log — onboarding, launch and control panels (3–6 Nov 2026)

A chronological digest of the working session: what was asked, what was found, what was decided. It is a
summary, not a verbatim transcript (the raw transcript lives in Claude Code's local session store). Commits:
`60c9f8e` (onboarding + trigger line), `13a7d53` (control panels), both on `design-pages`, pushed.

## Setup
1. Looked over the repo: the nested app repo `Vyom/Vyom`, the Lottie folders, the memory notes.
2. Listed npm scripts; started the dev server (port moved 5173 → 5174, later 5173).
3. Cloned `hithesh-classroots/Byjus-AI-Product-Flow` into `Tut/Vyom`; switched back to `Vyom/Vyom`.

## Onboarding layout and cast
4. **Placements/dialogue per a reference frame**: Vyom left, question in a bubble at his right; Spark at the
   right end of that row, her line in a bubble above her with a tail. Found the dialogue text already matched.
5. Name-step bubble split in two lines (greeting violet / question) — later superseded (item 22).
6. **Sizes**: first both −15% — a CSS `scale` on the stages, which turned out to resize the canvas (Vyom stayed
   full size and was pushed ~70 px off). Replaced with the riv `scale` property. Vyom 80; Spark 85 → 72 (−15%
   again on request).
7. Bubbles lost their stroke and shadow.
8. Vyom "misplaced" → traced to the stage-scale bug above (the earlier "verified" had only read the CSS value).

## Launch piece
9. Identified the launch Lottie: `public/onboarding/launch/with-spark.json` (copy of `With Spark/data.json`).
10. User updated the Lottie: Spark now appears at frame 31 from the comp centre → `SPARK_START` updated.
11. Spark layered **below** Vyom during the launch (removed the CSS lift of her stage).
12. At Start Spark now **scales down with her own `scale` value while walking into Vyom** (replaced the CSS
    stage shrink); her scale is restored after she flies out; the cast no longer pops her to 100 first.

## Trigger sequencing (Vyom artboard)
13. Request: fire each trigger only after `actionPlaying` is false. Built `triggerWhenIdle` (one queue), routed
    the provider, home page, module-complete, transition `present`, cast and launch expansion through it; the
    launch **collapse is forced** (he stays "busy" while expanded).
14. Found the first pivot after `appear` was swallowed (`vyomVisible` lags the flag) → wait for `vyomVisible`,
    re-send gestures that raise no flag (`expectRise`).
15. Found the **look-down of `pointDown` is lost if sent within ~250 ms of the previous animation**; measured
    durations and pupil movement → 500 ms quiet period (`QUIET_AFTER_BUSY_MS`). Applied to the dev-panel
    trigger buttons (queued badge, re-send) and the sequencer; added `TRIGGERS_WITHOUT_BUSY`.
16. Panel polish: `scale` slider range 20–150, `exapndCollapse` listed.

## Onboarding start (intro, walk, typing)
17. Intro: Vyom appears alone in the middle, greeting chip slides down out of him, he walks to his place, the
    name UI fades in **after he lands** (shell posts `vyomLanded`; fallback timer), chip shows only the
    question (frame reference supplied by the user).
18. Name step: `isTyping` + `typingPos` 3 instead of point-down, then **no pivot** before it.
19. Chip animation: scale + position + opacity, anchored at its top edge nearest Vyom, mirrored on exit.

## Files, git, panels
20. Told the user which riv Vyom uses (`public/characters/vyom.riv`); they updated it twice; checked the new
    file's properties and timings (celebrate now 2.27 s).
21. Committed and pushed `60c9f8e`.
22. **Control panels**: Slots section replaced by a Positioning group (Learning Canvas, Chat Window, Responsive
    ref position) with notes; scale description; Rive internals reduced to `actualPosX/Y` + `actionPlaying`
    (with its note); Spark gets `sparkPosition` and its Responsive ref position block. Committed and pushed
    `13a7d53`.
23. This context saved to `docs/context/` plus a short `CLAUDE.md`.

## Decisions worth remembering
- Size is the riv `scale` property, never CSS or layout scale.
- Anything that fires a Vyom trigger goes through `triggerWhenIdle`; flags/numbers that must follow an
  animation go through `writeInLine`.
- The page owns what is shown; the shell owns where the characters stand and tells the page when they have
  landed.
- Evidence over claims: measure with ViewModel logs, report what was and was not checked.
