# Vyom — React + Rive integration

Sample learning-platform shell (chat rail + content canvas) with the Vyom
character wired to `vyomCanvas.riv` through Rive data binding.

```bash
npm install
npm run dev
```

## How the character is wired

| Rive concept | Value |
| --- | --- |
| Artboard | resolved from `artboardCandidates`: `VyomCanvas` → `MasterCanvas` |
| State machine | `Canvas` |
| ViewModel | `MasterCanvas` (28 properties) |

One Rive canvas is fixed over the entire viewport (`src/vyom/VyomStage.tsx`)
rather than one canvas per region. That is what allows Vyom to travel between
the chat window and the content canvas as a single continuous animation instead
of a hand-off between two players. The layer is `pointer-events: none`, so the
UI underneath stays interactive.

The artboard uses `Fit.Layout`, which **resizes the artboard to the canvas**
instead of scaling it into the canvas. At `layoutScaleFactor: 1` this makes one
artboard unit equal one CSS pixel, so DOM coordinates can be handed to Rive
without conversion.

## The teaching room

`shell__frame` hosts the platform: a port of the **Byjus AI Teaching Room**
prototype (`Byjus AI Teaching Room (1).html`). The prototype is a bundled page —
a 22MB asset manifest plus a template in a custom `{{ }}` / `sc-if` language
driven by a `DCLogic` class — so the port is a rebuild in React.

It is not a re-drawing, though. `scripts/extract-prototype.mjs` unpacks the
bundle into real files:

```bash
node scripts/extract-prototype.mjs "Byjus AI Teaching Room (1).html"
```

That writes the prototype's assets to `public/room/` (Tabler icon fonts, the
Byjus logo, the Spark mascot, the lesson video) and its stylesheets verbatim to
`src/room/prototype.css`, rewriting every UUID reference to the file it now
lives at. Gzipped entries are inflated, and each file's type is sniffed from its
bytes rather than trusted from the manifest, which mislabels at least one asset. `src/room/prototype.template.html` is
kept as the markup the JSX is ported against. **Do not hand-edit either output —
re-run the script.**

The components then carry the prototype's own inline styles, pasted in
unchanged via the `css()` helper in `src/room/css.ts`:

```tsx
<div style={css('flex:1;display:flex;padding:4px 18px 18px;min-height:0')}>
```

Retyping those as camelCased object literals is where a "1:1" port quietly
stops being 1:1 — one dropped declaration and the box is wrong. Parsing the
string at runtime keeps the source of truth identical to the prototype's.

The prototype already contained six `<vyom-rive>` mount points and an `_arcHop`
helper for flying a `__live_vyom__` between them, so it was authored expecting
exactly this integration. Those mounts map onto the two slots the .riv exposes:

| Where | Slot | ViewModel |
| --- | --- | --- |
| Learning canvas — horizontal centre, vertical top | `learn` | `learnWindowX` / `learnWindowY` |
| Chat interface — bottom left (`#dockSlot`) | `chat` | `chatposX` / `chatposY` |

`xref` / `yref` are the ViewModel's own reference point, not inputs. They are
listed in `INTERNAL_PROPERTIES` (`src/vyom/config.ts`), so they are never
written and never appear in the test panel.

Several states are **booleans**, not triggers — `listening`, `thinking`,
`isSpeaking`, `isTyping`, `wait`. They are held for as long as they apply and
released on the next step, via `setFlag` rather than `fire`. Steps can declare
them in `journey.ts`:

```ts
{ id: 'video', slot: 'chat', flags: { wait: true }, ... }
```

Each step in `src/room/journey.ts` names the slot it wants and the trigger to
play once Vyom arrives, so the character choreography is data, not control flow:

```ts
{ id: 'lo1', slot: 'chat', cue: 'correct', milestone: true, ... }
```

Milestones (`intro`, `lo1`, `lo2`, `outro`) fire `celebration`, pay out XP and
an orb, and pop their node on the progress track. Chat interactions drive
`listening` on focus, `thinking` on send and `speaking` on reply.

## Positions come from the DOM

`ccX/ccY` and `chatX/chatY` are never hardcoded. A zero-size marker is placed
with ordinary CSS, and its measured centre is written into the matching
ViewModel numbers:

```tsx
<VyomAnchor slot="canvas" x="50%" y="18%" />   // ContentCanvas.tsx
<VyomAnchor slot="chat"   x="12%" y="calc(100% - 84px)" />  // ChatWindow.tsx
```

Because the coordinates are *measured* rather than computed, responsiveness
comes free — percentages, `clamp()`, grid placement and container queries all
work, and a `ResizeObserver` re-syncs on any layout change. Writes are
coalesced into one animation frame and de-duplicated, so a burst of resize
callbacks costs a single pass.

## Adding inputs without touching existing wiring

This was the main design constraint, and it is handled in three places:

**New position slot** — one entry in `STAGE_SLOTS` (`src/vyom/config.ts`) plus
an anchor in the JSX. Nothing else changes:

```ts
toolbar: {
  id: 'toolbar', label: 'Toolbar',
  xProperty: 'toolbarX', yProperty: 'toolbarY',
  enterTrigger: 'movetoToolbar',
},
```

**New trigger / boolean / number** — nothing at all. Controls are generated
from `viewModel.properties`, i.e. from the `.riv` file itself. Add a property in
Rive, republish, and it appears in the panel with the right control type.
`PROPERTY_META` only decides which heading it sits under; an unlisted property
still works and lands in *Unsorted*.

**New consumer code** — `useVyomTrigger('celebration')`, `useVyomBoolean('tracking')`
and `useVyomAnchor('canvas')` are name-addressed. A missing name warns to the
console instead of throwing.

`VyomBinder` (`src/vyom/binder.ts`) caches property lookups so nothing
re-resolves per frame.

## What the port leaves out

Behaviour, not design: speech-synthesis narration, the skip-quiz branch, the
flag/audio/settings dropdown menus (their buttons are present), the celebration
overlay's confetti canvases, and the fly-to-widget reward particles. The lesson
video is the prototype's real asset and does play.

The explore step is a multiple-choice question rather than the prototype's
parallelogram applet. The applet is not in the bundle: the manifest entry that
looks like it (`598a30d6…`, declared `text/plain`) is actually a Rive file, and
the prototype loads the applet from `window.__APPLET_SRCDOC`, which lives in one
of the JS bundles the extractor skips. The MCQ uses a question from the
prototype's own bank (`SKIPQ`) and its option styling from `_skipOptionRows`,
and answering fires `correct` / `wrong`.

One visual caveat that is **not** fixable on this side: the prototype sized each
Vyom mount with an `art-scale` attribute (92px on the board, 48px in the dock).
This .riv renders the character at a fixed size and exposes no scale property on
the ViewModel, so Vyom draws larger than the mounts reserve. Adding a scale
number to `VyomAnimationStates` would let the mounts match the prototype exactly.

## Layout

```
src/room/          the ported teaching room
  journey.ts       the 8 steps: copy, slot and Vyom cue per step
  TeachingRoom.tsx room shell, step choreography, reward payouts
  ChatPanel.tsx    chat rail, Vyom's dock seat, morphing composer
  NavRow.tsx       progress track with milestone nodes
  boards/          intro / teach / applet / video screens
  room.css         palette, type scale and motion from the prototype
src/vyom/          integration layer — reusable, knows nothing about the lesson UI
  config.ts        artboard/state-machine/ViewModel names, slot registry, display metadata
  binder.ts        cached, name-addressed facade over the ViewModelInstance
  VyomProvider.tsx owns useRive, binds the ViewModel, runs the anchor sync loop
  VyomStage.tsx    the full-viewport canvas layer
  VyomAnchor.tsx   CSS-positioned marker that feeds a slot's coordinates
  hooks.ts         useVyom / useVyomAnchor / useVyomTrigger / useVyomBoolean / useVyomStage
  controls/        auto-generated testing panel
src/components/    the sample product UI (AppShell, ChatWindow, ContentCanvas)
```

## Artboard selection

`RIVE_CONFIG.artboardCandidates` is a priority list, resolved against the
artboards the file actually contains:

```ts
artboardCandidates: ['VyomCanvas', 'VyomStage'],
```

The file is loaded first (`useRiveFile`), its artboards are enumerated, and the
first candidate that exists is used — `useRive` reads its parameters only once,
at init, so the name has to be settled before the instance is created. If no
candidate matches, it falls back to the file's default artboard and warns with
the list of names that *are* in the file, instead of rendering a blank canvas.

The panel header shows which artboard is live.

## Two runtime hazards this integration works around

Both fail *silently* — the call returns cleanly and the animation just never
plays — so they are worth knowing about before extending the wiring.

**1. Never hold on to a trigger property.** A cached `ViewModelInstanceTrigger`
stops reaching the state machine after the first advance:

```ts
const t = vmi.trigger('movetoCanvas');
t.trigger();   // works
t.trigger();   // returns fine, does nothing
```

`VyomBinder` caches numbers, booleans, strings and enums (they are unaffected,
and the coordinate writes need it) but re-resolves triggers on every fire.

**2. Never write a number and fire a trigger in the same tick.** The write wins
and the trigger is swallowed:

```ts
binder.setNumber('ccX', x);
binder.fire('movetoCanvas');   // lost
```

`applySlot` therefore syncs the coordinates, then fires on the next animation
frame. This is why moving between slots works at all — writing ccX/ccY and
firing `movetoCanvas` together is exactly the failing pattern.

A third, milder one: the state machine ignores triggers until its entry
transition settles, and this runtime emits no `advance` or `statechange` events
to wait on, so the initial placement is retried on the `ENTRANCE_RETRIES_MS`
ladder until it lands. Any real navigation cancels the remaining attempts.

## The opening appearance

The artboard starts Vyom in the chat dock, so placing him on the content canvas
is a move — and an uncovered one reads as a slide across the room on every page
load. The provider hides that twice over: `disappear` through the artboard, and
the stage layer held at `opacity: 0`. He is revealed `MOVE_TRAVEL_MS` after the
move trigger is *actually dispatched* — timed from the dispatch rather than from
page load, so a slow boot, a backgrounded tab or a swallowed early attempt all
push the reveal out with it instead of uncovering a slide in progress.

`MOVE_TRAVEL_MS` (`src/vyom/VyomProvider.tsx`) is the one number to tune: it is
the artboard's slot-to-slot travel length. Raise it if Vyom is still moving when
he becomes visible. The root fix is artboard-side — if the default state placed
him on the canvas, or the state machine reported its state, none of this
scaffolding would be needed.

## Notes on the current .riv

Two things worth knowing, both on the Rive side rather than the React side:

- The file now contains **two** artboards, `VyomStage` and `VyomCanvas`, and the
  candidate list resolves to `VyomCanvas` automatically.
- On the `VyomStage` artboard, `ccX/ccY` drive only Vyom's gaze — the body never
  translates and the move triggers do nothing. `VyomCanvas` is the artboard with
  the travel animation, which is why it is first in the candidate list.

In dev, `window.__vyom.rive.contents` lists the file's artboards, animations and
state machines — the quickest way to check a name against the file.
