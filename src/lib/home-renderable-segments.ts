const HOME_TODAY_SECTION_IDS = new Set(['market', 'your-pause']);

export type HomeRenderableSegment =
  | { type: 'plain'; id: string }
  | { type: 'todayBlock'; ids: string[] };

/**
 * When Market and Your pause are **consecutive** in the saved order, group them under "Today".
 * Other ids (including `goal-why` and `journey-pulse`) are plain segments unless they sit in a
 * contiguous run with only those two ids — normalization keeps `market` and `your-pause` adjacent.
 */
export function buildHomeRenderableSegments(orderedIds: string[]): HomeRenderableSegment[] {
  const todayInOrder = orderedIds.filter((id) => HOME_TODAY_SECTION_IDS.has(id));
  const result: HomeRenderableSegment[] = [];
  let i = 0;
  while (i < orderedIds.length) {
    const id = orderedIds[i];
    if (!HOME_TODAY_SECTION_IDS.has(id)) {
      result.push({ type: 'plain', id });
      i++;
      continue;
    }
    const chunk: string[] = [];
    while (i < orderedIds.length && HOME_TODAY_SECTION_IDS.has(orderedIds[i])) {
      chunk.push(orderedIds[i]);
      i++;
    }
    if (chunk.length === todayInOrder.length) {
      result.push({ type: 'todayBlock', ids: chunk });
    } else {
      for (const cid of chunk) {
        result.push({ type: 'plain', id: cid });
      }
    }
  }
  return result;
}
