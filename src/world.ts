export const MAP_CELL = 128;
export const WORLD = {
  width: 6656,
  height: 5376,
  shore: 192,
  deep: 64,
  lake: { x: 5312, y: 3904, rx: 470, ry: 330 },
};
export const NUCLEAR_ZONE = { x: 5660, y: 770, rx: 620, ry: 500 };
export const STORY_WORLD = { width: 1920, height: 1440 };
export const STORY_LOBBY = { x: 960, y: 720, radius: 560 };

export const DISTRICTS = [
  { name: "CENTRO VELHO", x: 320, y: 320, w: 2496, h: 1984 },
  { name: "BAIRRO DA ESTAÇÃO", x: 320, y: 2688, w: 2496, h: 2304 },
  { name: "JARDINS DO LESTE", x: 3072, y: 2496, w: 3200, h: 2496 },
  { name: "ZONA INDUSTRIAL", x: 3264, y: 320, w: 2880, h: 1728 },
] as const;

export interface HousePlan {
  id: string;
  x: number;
  y: number;
  k: 0 | 1 | 2;
  locked?: boolean;
  interior: "family" | "kitchen" | "workshop";
}
const row = (prefix: string, y: number, xs: number[], offset = 0): HousePlan[] =>
  xs.map((x, i) => ({
    id: `${prefix}-${i + 1}`,
    x,
    y,
    k: ((i + offset) % 3) as 0 | 1 | 2,
    locked: (i + offset) % 5 === 4,
    interior: (["family", "kitchen", "workshop"] as const)[(i + offset) % 3],
  }));

/** Casas têm posição, modelo, interior e regra de porta definidos no mapa. */
export const HOUSES: HousePlan[] = [
  ...row("centro-norte", 650, [520, 1030, 1540, 2050, 2560]),
  ...row("centro-meio", 1240, [520, 1030, 1540, 2050, 2560], 1),
  ...row("centro-sul", 1900, [520, 1030, 1540, 2050, 2560], 2),
  ...row("estacao-norte", 2910, [520, 1030, 1540, 2050, 2560], 1),
  ...row("estacao-meio", 3650, [520, 1030, 1540, 2050, 2560], 2),
  ...row("estacao-sul", 4670, [520, 1030, 1540, 2050, 2560]),
  ...row("jardins-norte", 2860, [3370, 3880, 4390, 4900, 5920], 2),
  ...row("jardins-meio", 3650, [3370, 3880, 4390, 4900, 5920]),
  ...row("jardins-sul", 4670, [3370, 3880, 4390, 4900, 5410, 5920], 1),
];

/** Vias contínuas em uma grade de 128 px: cada trecho é conhecido antes do jogo. */
export const ROADS = [
  { x: 3264, y: 2368, w: 5888, h: 128 },
  { x: 2944, y: 2688, w: 128, h: 4736 },
  { x: 1536, y: 960, w: 2560, h: 128 },
  { x: 1536, y: 1600, w: 2560, h: 128 },
  { x: 1536, y: 2560, w: 2560, h: 128 },
  { x: 1536, y: 3328, w: 2560, h: 128 },
  { x: 1536, y: 4352, w: 2560, h: 128 },
  { x: 768, y: 2656, w: 128, h: 4672 },
  { x: 1280, y: 2656, w: 128, h: 4672 },
  { x: 1792, y: 2656, w: 128, h: 4672 },
  { x: 2304, y: 2656, w: 128, h: 4672 },
  { x: 4096, y: 960, w: 1792, h: 128 },
  { x: 4864, y: 1600, w: 3328, h: 128 },
  { x: 4608, y: 2560, w: 3072, h: 128 },
  { x: 4608, y: 3328, w: 3072, h: 128 },
  { x: 4608, y: 4352, w: 3072, h: 128 },
  { x: 3584, y: 2688, w: 128, h: 4736 },
  { x: 4096, y: 2688, w: 128, h: 4736 },
  { x: 4608, y: 2688, w: 128, h: 4736 },
  { x: 5120, y: 2432, w: 128, h: 4224 },
  { x: 6144, y: 2688, w: 128, h: 4736 },
] as const;

export const TREE_SITES = Array.from({ length: 72 }, (_, i) => {
  const belts = [
    { x: 300, y: 520, dx: 0, dy: 61 },
    { x: 6370, y: 420, dx: 0, dy: 63 },
    { x: 3180, y: 2600, dx: 87, dy: 0 },
  ];
  const b = belts[i % belts.length], n = Math.floor(i / belts.length);
  return { id: `tree-${i}`, x: b.x + b.dx * n, y: b.y + b.dy * n, kind: i % 8 };
}).filter((p) => p.x < WORLD.width - 220 && p.y < WORLD.height - 220);
export const CAR_SITES = [
  { x: 1510, y: 955, red: true }, { x: 2310, y: 1595, red: false },
  { x: 1010, y: 2555, red: false }, { x: 1800, y: 3325, red: true },
  { x: 3575, y: 2365, red: false }, { x: 4610, y: 3325, red: true },
  { x: 5130, y: 4350, red: false }, { x: 6140, y: 2555, red: false },
] as const;

export type MapCell = "ocean" | "beach" | "grass" | "road" | "urban" | "industrial" | "lake";
export function cellAt(col: number, rowIndex: number): MapCell {
  const x = col * MAP_CELL + MAP_CELL / 2, y = rowIndex * MAP_CELL + MAP_CELL / 2;
  if (isDeepOcean(x, y)) return "ocean";
  if (isOcean(x, y)) return "beach";
  if (isLake(x, y)) return "lake";
  if (onRoad(x, y)) return "road";
  const district = DISTRICTS.find((d) => x >= d.x && x <= d.x + d.w && y >= d.y && y <= d.y + d.h);
  if (district?.name === "ZONA INDUSTRIAL") return "industrial";
  return district ? "urban" : "grass";
}
export const MAP_BLUEPRINT: MapCell[][] = Array.from(
  { length: WORLD.height / MAP_CELL },
  (_, rowIndex) => Array.from({ length: WORLD.width / MAP_CELL }, (_, col) => cellAt(col, rowIndex)),
);

export const ISOMETRIC_BUILDINGS = [
  { x: 3520, y: 1340, a: 0, f: 18, r: 1 },
  { x: 3910, y: 1340, a: 1, f: 20, r: 3 },
  { x: 4300, y: 1340, a: 2, f: 27, r: 5 },
] as const;
export function isOcean(x: number, y: number) {
  return x < WORLD.shore || y < WORLD.shore || x > WORLD.width - WORLD.shore || y > WORLD.height - WORLD.shore;
}
export function isDeepOcean(x: number, y: number) {
  return x < WORLD.deep || y < WORLD.deep || x > WORLD.width - WORLD.deep || y > WORLD.height - WORLD.deep;
}
export function isLake(x: number, y: number) {
  const l = WORLD.lake;
  return ((x - l.x) / l.rx) ** 2 + ((y - l.y) / l.ry) ** 2 < 1;
}
export function isRadioactive(x: number, y: number) {
  return ((x - NUCLEAR_ZONE.x) / NUCLEAR_ZONE.rx) ** 2 + ((y - NUCLEAR_ZONE.y) / NUCLEAR_ZONE.ry) ** 2 < 1;
}
export function onRoad(x: number, y: number, padding = 0) {
  return ROADS.some((r) => Math.abs(x - r.x) < r.w / 2 + padding && Math.abs(y - r.y) < r.h / 2 + padding);
}
export function directionRow(angle: number) {
  return ((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8;
}
export const ROOM = { cx: WORLD.width + 720, cy: 407, w: 360, h: 260, scale: 0.49 };
export function roomPoint(x: number, y: number) {
  return { x: ROOM.cx + (x - 3960) * ROOM.scale, y: ROOM.cy + (y - 407) * ROOM.scale };
}
