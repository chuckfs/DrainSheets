export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function computeRowReorder<T extends { id: string; position: number }>(
  siblings: T[],
  rowId: string,
  targetPosition: number,
): T[] {
  if (siblings.length === 0) {
    return [];
  }

  const clampedTarget = clamp(targetPosition, 0, siblings.length - 1);
  const reordered = [...siblings];
  const fromIndex = reordered.findIndex((row) => row.id === rowId);

  if (fromIndex < 0) {
    throw new Error("Row not found");
  }

  const [moved] = reordered.splice(fromIndex, 1);
  if (!moved) {
    throw new Error("Row not found");
  }

  reordered.splice(clampedTarget, 0, moved);

  return reordered.map((row, index) => ({
    ...row,
    position: index,
  }));
}

export function getRowPositionUpdates<T extends { id: string; position: number }>(
  before: T[],
  after: T[],
): Array<{ id: string; position: number }> {
  const beforePositions = new Map(before.map((row) => [row.id, row.position]));
  const updates: Array<{ id: string; position: number }> = [];

  for (const row of after) {
    if (beforePositions.get(row.id) !== row.position) {
      updates.push({ id: row.id, position: row.position });
    }
  }

  return updates;
}
