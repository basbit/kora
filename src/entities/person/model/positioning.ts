import type { NodePosition } from "./types";

export function computeInitialPosition(
  positions: Record<string, NodePosition>,
  parentId?: string,
): NodePosition {
  const ids = Object.keys(positions);
  if (ids.length === 0) return { x: 0, y: 600 };
  if (parentId && positions[parentId]) {
    const p = positions[parentId];
    return { x: p.x, y: Math.max(0, p.y - 140) };
  }
  const xs = Object.values(positions).map((p) => p.x);
  const maxX = xs.length ? Math.max(...xs) : 0;
  return { x: maxX + 160, y: 600 };
}
