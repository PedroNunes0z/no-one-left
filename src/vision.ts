export interface SightBlock {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
export function rayDistance(
  x: number,
  y: number,
  angle: number,
  max: number,
  blocks: SightBlock[],
) {
  const dx = Math.cos(angle),
    dy = Math.sin(angle);
  let nearest = max;
  for (const b of blocks) {
    const tx1 = Math.abs(dx) < 1e-8 ? -Infinity : (b.left - x) / dx,
      tx2 = Math.abs(dx) < 1e-8 ? Infinity : (b.right - x) / dx,
      ty1 = Math.abs(dy) < 1e-8 ? -Infinity : (b.top - y) / dy,
      ty2 = Math.abs(dy) < 1e-8 ? Infinity : (b.bottom - y) / dy;
    if (
      (Math.abs(dx) < 1e-8 && (x < b.left || x > b.right)) ||
      (Math.abs(dy) < 1e-8 && (y < b.top || y > b.bottom))
    )
      continue;
    const entry = Math.max(Math.min(tx1, tx2), Math.min(ty1, ty2)),
      exit = Math.min(Math.max(tx1, tx2), Math.max(ty1, ty2));
    if (exit >= Math.max(0, entry) && entry > 2)
      nearest = Math.min(nearest, entry);
  }
  return nearest;
}
export function sightRange(
  angle: number,
  facing: number,
  distance: number,
  awareness = 78,
) {
  const diff = Math.atan2(Math.sin(angle - facing), Math.cos(angle - facing));
  return Math.abs(diff) <= Math.PI * 0.34 ? distance : awareness;
}
export function visiblePoint(
  x: number,
  y: number,
  px: number,
  py: number,
  facing: number,
  distance: number,
  blocks: SightBlock[],
) {
  const a = Math.atan2(y - py, x - px),
    d = Math.hypot(x - px, y - py);
  return (
    d <= rayDistance(px, py, a, sightRange(a, facing, distance), blocks) + 2
  );
}
export function sightPolygon(
  x: number,
  y: number,
  facing: number,
  distance: number,
  blocks: SightBlock[],
) {
  const angles = [];
  for (let i = 0; i < 160; i++) angles.push(-Math.PI + (i * Math.PI * 2) / 160);
  for (const edge of [facing - Math.PI * 0.34, facing + Math.PI * 0.34])
    angles.push(
      Math.atan2(Math.sin(edge), Math.cos(edge)),
      Math.atan2(Math.sin(edge + 0.0001), Math.cos(edge + 0.0001)),
      Math.atan2(Math.sin(edge - 0.0001), Math.cos(edge - 0.0001)),
    );
  angles.sort((a, b) => a - b);
  return angles.map((a) => {
    const d = rayDistance(x, y, a, sightRange(a, facing, distance), blocks);
    return { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d };
  });
}
