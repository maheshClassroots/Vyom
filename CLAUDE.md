# Vyom prototype

Read `docs/context/PROJECT_CONTEXT.md` first: layout, where things live, the measured Rive facts, the
onboarding flow, working agreements and tooling gotchas. `docs/context/CHAT_LOG.md` is the digest of the
3–6 Nov sessions.

Short version:
- Character size is each riv's `scale` property (percentage). Not CSS, not `layoutScaleFactor`.
- Fire Vyom triggers through `triggerWhenIdle` (`src/vyom/sequencing.ts`): it waits for `actionPlaying` to be
  false and quiet for 500 ms, or animations lose parts (`pointDown` loses its look-down).
- Onboarding page edits must be mirrored in `scripts/design/onboarding-patches.mjs`.
- Commit or push only when asked. Verify changes in the running app; log ViewModel state rather than
  trusting screenshots (they lag).
