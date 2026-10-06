export type SurfaceTint = 'home' | 'room';

interface SurfaceProps {
  /** Which palette the surface is showing. Changing it cross-fades. */
  tint: SurfaceTint;
  /** Follows Vyom's `isDarkMode`, same as the room's own chrome used to. */
  dark?: boolean;
}

/**
 * The painted surface both screens sit on.
 *
 * The screens used to paint their own backgrounds, which meant the background
 * went out with the page every time one replaced the other — the whole screen
 * blinked, and a transition that is meant to read as *contents changing* read
 * as the app restarting. The surface is now its own thing, mounted once and
 * never faded: the pages are transparent and only their contents come and go
 * on top of it.
 *
 * It also carries the only cue that says the room has finished loading. Both
 * palettes are deliberately close relations — the same dot lattice, the same
 * soft vertical wash — so the change reads as the same surface warming from
 * blue to violet rather than as a different screen. It is slower than the
 * content fade and starts before it, so the colour settles first and the room
 * then appears on a surface that has already become the room's.
 *
 * Two stacked layers rather than one that changes colour: a gradient cannot be
 * transitioned, but the opacity of the layer on top of it can.
 */
export function Surface({ tint, dark = false }: SurfaceProps) {
  return (
    <div className="surface" aria-hidden="true" data-dark={dark}>
      <div className="surface__layer surface__layer--home" />
      <div className="surface__layer surface__layer--room" data-on={tint === 'room'} />
    </div>
  );
}
