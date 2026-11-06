# Vyom prototype — project context

What a new session needs to know that the code and git history do not say. Written
6 Nov 2026 from the working sessions of 3–6 Nov. Verify any file or name here
before relying on it; this is a snapshot.

## Layout and how to run

```
Tut/Vyom/                      (not a git repo)
  Vyom/                        the app — a git repo, branch `design-pages`, remote maheshClassroots/Vyom
  Byjus-AI-Product-Flow/       clone of hithesh-classroots/Byjus-AI-Product-Flow: the hosted design
                               mockups (*.dc.html) that `npm run import:design` imports from
  vyom-onboarding-launchwithspark/   the launch package in use: Lottie + sparkstatemachine.riv + connector
  with spark/  without spark/  earlier Lottie exports (no longer used by the app)
  .claude/launch.json          `vyom-dev` = `npm --prefix Vyom run dev`, port 5173 (autoPort)
```

- Vite + React + TypeScript. Scripts: `dev`, `build` (`tsc -b && vite build`), `lint` (oxlint),
  `preview`, `import:design`.
- One full-viewport Rive canvas per character (`VyomStage`, `SparkStage`), `Fit.Layout`, so one artboard
  unit is one CSS pixel. Positions are written as CSS pixels.
- Onboarding opens on first run (`localStorage.vyomOnboarded` unset) or with `?onboarding`.
  Setting `vyomOnboarded=1` skips it (the home page then shows Vyom in its hero).

## Where things live

| Thing | File |
| --- | --- |
| Vyom riv, Spark riv | `public/characters/vyom.riv`, `public/characters/spark.riv` (the copy in `Byjus-AI-Product-Flow/` is NOT what runs) |
| Vyom / Spark config, property groups, notes shown in the panels | `src/vyom/config.ts`, `src/spark/config.ts` |
| Trigger sequencing (the shared line) | `src/vyom/sequencing.ts` — `triggerWhenIdle`, `writeInLine`, `driveStep`, `QUIET_AFTER_BUSY_MS` |
| Onboarding page (hosted mockup, patched) | `public/design/onboarding/Onboarding.dc.html` |
| Patches that reproduce the page edits on re-import | `scripts/design/onboarding-patches.mjs` (**mirror every page edit here**) |
| Characters over the onboarding page | `src/onboarding/OnboardingCast.tsx` |
| Launch after "Start my first class" | `src/onboarding/OnboardingLaunch.tsx`, `launch.css`; driven from `src/transition/useHomeToRoom.ts` (`launchFromOnboarding`) |
| Launch Lottie + its Spark | `public/onboarding/launch/vyom-onboarding.json` and `sparkstatemachine.riv`, with the connector `src/onboarding/vyom-rive-lottie.js` — copies of `Tut/Vyom/vyom-onboarding-launchwithspark/` (`lottie/`, `rive/`, `web/`); copy again after the package changes |
| Module-complete screen | `src/room/ModuleComplete.tsx`, `complete.css` |
| Dev panels | `src/vyom/controls/VyomDevPanel.tsx`, `src/spark/controls/SparkDevPanel.tsx`, shared `PositionGroup.tsx`, `PropertyControl.tsx` |

## Rive facts (measured, not assumed)

- Vyom ViewModel `VyomControls`, 48 properties, artboard `VyomCanvas`. Spark ViewModel
  `SparkAnimationControls`.
- Both have a numeric **`scale`** (percentage, 100 = normal). The app uses it for size: Vyom 80, Spark 72
  during onboarding. `layoutScaleFactor` and CSS `scale` on the stages do **not** work (they resize the
  canvas, not the character).
- **`actionPlaying`** is the busy flag. It does not rise for `moveToPoint`, `scaleSmall`, `scaleFull`,
  `isTyping` (a looping pose). `appear`/`disappear`: the flag falls ~10 ms before `vyomVisible` follows.
- **The artboard keeps settling after `actionPlaying` falls.** A trigger sent in the next ~250 ms is chained
  onto the last animation (`pointDown` after `pivot` plays 1.67 s with no look-down) or swallowed
  (`pointDown` 200 ms after `pointDown`). From ~400 ms it plays clean (`pointDown` alone = 1.19 s with the
  look-down; pupils drop). So every app trigger waits for idle **and** 500 ms quiet.
- Durations from idle: pivot 0.95 s, pointDown 1.19, acknowledge 1.49, correct 1.19, wrong 2.51,
  pointUp 2.01, pointLeft 3.01, pointRight 1.67, present 0.69, celebrate 2.27, walk (`moveToPoint`) ~1.0 s.
- `typingPos` rests at 1; the name step uses 3. `isTyping` must be switched off by hand.
- `moveToPoint` walks from `refPos` to `learnWindow`; the artboard sets `refPos` on arrival (the cast uses
  that to detect landing). Writing `refPos` + `learnWindow` together sets him down instantly.
- Spark: `sparkPosition` = where she lands on `flyIn` / goes on `moveToPoint`; `positionXRef/YRef` = live
  position. Her chat position is her start point for `flyIn` (set to Vyom's centre to emerge from him).
- `AUTO_DRIVE_ENABLED` is `false`: the provider's own cues (room step cues, `setFlag`) are off, so new code
  writes to `viewModelInstance` directly or via the shared line.

## Onboarding flow as built

1. Sign-up page (any method, e.g. "Continue with Google").
2. **Intro** (page `intro` state, `INTRO_MS = 3500`): only Vyom, appearing in the middle; his chip
   "Hi, I am Vyom. Your tutor." slides down out of him (1.5 s in, leaves at 3.0 s).
3. The page moves Vyom's box to his place; the cast sees a >80 px jump of a box that has come to rest and
   **walks** him with `moveToPoint`. On arrival the shell posts `onboarding-cue {vyomLanded}`; the page then
   fades in the question chip ("What should we call you?"), field, Continue and dots (fallback timer if the
   shell never answers). Messages: page → shell `onboarding-state {step, sparkle, sparkIntro, answered,
   intro}`; shell → page `onboarding-cue {sparkLanded | vyomLanded}`.
4. Name step: **no pivot, no point-down** — he goes straight into the typing pose (`isTyping`,
   `typingPos` 3), released when the student continues. Board, grade and chapter steps: pivot, then
   point-down at each question.
5. Grade step Submit: Spark flies in from Vyom's centre to the right end of the question row (bubble above
   her); Vyom looks at her.
6. Start: both walk to the centre (Spark's `scale` runs 72 → 0 over 1 s, so she is gone into him on arrival,
   drawn beneath him); Vyom expands, and 0.5 s later the package Lottie plays with `sparkstatemachine.riv`
   live on a canvas over it (placed on the Lottie's `Spark` placeholder each frame by the package's
   connector, cues from its markers; she grows out of the comp centre at frame 31), he collapses 1 s before
   its end, the room starts. The app's own Spark's scale returns to 100 after her fly-out.

## Working agreements with the user

- Directs by storyboard frames and short corrections; wants changes **verified in the running app** and
  evidence, not claims. Keep the survey UI and tokens (`src/tokens.css`) as they are.
- **Commit or push only when asked** ("commit this", "push it").
- Mirror every hosted-page edit into `onboarding-patches.mjs`.
- When a request is ambiguous (e.g. "reduce size by 20%": from normal or from now?), say which reading was
  taken.

## Tooling gotchas

- The browser pane's screenshots **lag** the page by seconds, and a hidden pane stops animation frames.
  Verify timing by logging ViewModel state/trigger writes from `javascript_tool` (patch `vmi.trigger` with a
  Proxy and sample `actionPlaying` every 10–50 ms) instead of relying on screenshots.
- `navigate` to the URL the tab is already on does not reload; use `location.reload()`.
- After deleting/renaming a module, Vite's partial hot reload can leave Vyom invisible (`vyomVisible`
  false, `refPos` 0,0): do a full reload before judging.
- macOS `sed` needs `sed -i ''`; the Rive MCP server was disconnected for much of the work.
- `git config user.email` is unset in this repo; commits so far reuse the author of `HEAD`
  (`maheshClassroots <mahesh@Mahesha.local>`).

## Not verified / open

- Launch hand-off into the teaching room after the latest Lottie and Spark changes was watched only up to
  the Lottie's end; the room settle was not re-checked.
- Mobile-number / OTP sign-up paths and Back from the name step reach the intro logic the same way but were
  not exercised.
- Home page and room cues routed through `triggerWhenIdle` (HomePage, TeachingRoom, ModuleComplete) were not
  re-tested in the browser; the provider's opening entrance (`appear`, first move) is not routed through it.
- The latest `vyom.riv` (saved 5 Nov, 18:14) was committed without re-running the timing probes against it.
