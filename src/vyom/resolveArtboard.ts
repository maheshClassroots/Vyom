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
