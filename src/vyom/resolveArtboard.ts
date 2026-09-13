import type { RiveFile } from '@rive-app/react-canvas';

/** Every artboard name in the file, in file order. */
export function listArtboards(file: RiveFile): string[] {
  const names: string[] = [];
  try {
    const instance = file.getInstance();
    for (let index = 0; index < instance.artboardCount(); index += 1) {
      const artboard = instance.artboardByIndex(index);
      names.push(artboard.name);
      // artboardByIndex hands back a WASM-backed instance; release it.
      artboard.delete?.();
    }
  } catch (error) {
    console.warn('[vyom] could not enumerate artboards', error);
  }
  return names;
}

/**
 * Picks the first candidate that exists in the file.
 *
 * Returns `null` when no candidate matches, which tells the runtime to fall
 * back to the file's default artboard rather than failing to load.
 */
export function resolveArtboard(file: RiveFile, candidates: readonly string[]) {
  const available = listArtboards(file);
  const match = candidates.find((name) => available.includes(name)) ?? null;

  if (!match && candidates.length > 0) {
    console.warn(
      `[vyom] none of [${candidates.join(', ')}] exist in the .riv file. ` +
        `Available artboards: [${available.join(', ')}]. Using the default artboard.`,
    );
  }

  return { name: match, available };
}

/** Every state machine on one artboard, in file order. */
export function listStateMachines(file: RiveFile, artboardName: string | null): string[] {
  const names: string[] = [];
  try {
    const instance = file.getInstance();
    const artboard = artboardName
      ? instance.artboardByName(artboardName)
      : instance.artboardByIndex(0);
    if (!artboard) return names;
    for (let index = 0; index < artboard.stateMachineCount(); index += 1) {
      names.push(artboard.stateMachineByIndex(index).name);
    }
    artboard.delete?.();
  } catch (error) {
    console.warn('[vyom] could not enumerate state machines', artboardName, error);
  }
  return names;
}

/**
 * Picks the first state machine the artboard actually has.
 *
 * Same contract as `resolveArtboard`: a name that is absent degrades to a
 * console warning rather than a silent failure. Naming a state machine that is
 * not there leaves the artboard parked on frame zero, which looks identical to
 * a broken file, so this is worth checking rather than asserting.
 */
export function resolveStateMachine(
  file: RiveFile,
  artboardName: string | null,
  candidates: readonly string[],
) {
  const available = listStateMachines(file, artboardName);
  const match = candidates.find((name) => available.includes(name)) ?? null;

  if (!match && candidates.length > 0) {
    console.warn(
      `[vyom] none of [${candidates.join(', ')}] are state machines on ` +
        `"${artboardName ?? '(default artboard)'}". Available: [${available.join(', ')}].`,
    );
  }

  return { name: match, available };
}
