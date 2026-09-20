import { WORLD, ROADS, isOcean, isLake } from "./world.ts";
export const ROAD_TILE = 128;
export interface RoadTile {
  x: number;
  y: number;
  key: string;
  connections: number;
}
export function roadTouchesWater(x: number, y: number, size = ROAD_TILE) {
  const half = size / 2,
    l = WORLD.lake;
  if (isOcean(x - half, y - half) || isOcean(x + half, y + half)) return true;
  const closestX = Math.max(x - half, Math.min(x + half, l.x)),
    closestY = Math.max(y - half, Math.min(y + half, l.y));
  return isLake(closestX, closestY);
}
export function buildRoadTiles(): RoadTile[] {
  const cells = new Map<string, { x: number; y: number }>();
  for (let y = ROAD_TILE / 2; y < WORLD.height; y += ROAD_TILE)
    for (let x = ROAD_TILE / 2; x < WORLD.width; x += ROAD_TILE) {
      if (
        !roadTouchesWater(x, y) &&
        ROADS.some(
          (r) => Math.abs(x - r.x) < r.w / 2 && Math.abs(y - r.y) < r.h / 2,
        )
      )
        cells.set(x + "," + y, { x, y });
    }
  return [...cells.values()].map(({ x, y }) => {
    const n = cells.has(x + "," + (y - ROAD_TILE)),
      e = cells.has(x + ROAD_TILE + "," + y),
      s = cells.has(x + "," + (y + ROAD_TILE)),
      w = cells.has(x - ROAD_TILE + "," + y),
      connections = +n + 2 * +e + 4 * +s + 8 * +w;
    const branches = +n + +e + +s + +w;
    const key =
      branches === 3
        ? "roadT" + connections
        : (
            {
              3: "roadNE",
              6: "roadSE",
              9: "roadNW",
              12: "roadSW",
              5: "roadNS",
              10: "roadEW",
            } as Record<number, string>
          )[connections] ||
          (n || s
            ? e || w
              ? "roadNEWS"
              : "roadNS"
            : e || w
              ? "roadEW"
              : "roadPLAZA");
    return { x, y, key, connections };
  });
}
