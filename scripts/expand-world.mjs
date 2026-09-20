import { writeFileSync } from "node:fs";
import {
  WORLD,
  HOUSES,
  ROADS,
  isLake,
  isOcean,
  isSwamp,
} from "../src/world.ts";
const W = WORLD.width / 32,
  H = WORLD.height / 32,
  T = 32;
let seed = 48159;
const rand = () =>
    (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296,
  gid = (x, y) => y * 40 + x + 1;
const data = [];
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const variation = rand();
    data.push(gid(3 + Math.floor(variation * 2), 10 + Math.floor(rand() * 2)));
  }
const buildings = [];
const objects = buildings.map(([x, y, w, h], i) => ({
  id: i + 1,
  name: "ruin",
  type: "ruin",
  x: x * T,
  y: y * T,
  width: w * T,
  height: h * T,
}));
for (const [i, s] of [
  { id: "ash", x: 1168, y: 880 },
  { id: "station", x: 2544, y: 624 },
  { id: "signal", x: 688, y: 2080 },
].entries())
  objects.push({
    id: 20 + i,
    name: s.id,
    type: "shelter",
    x: s.x,
    y: s.y,
    width: 0,
    height: 0,
  });
let count = 0;
for (let i = 0; i < 470; i++) {
  const x = 180 + rand() * (WORLD.width - 360),
    y = 180 + rand() * (WORLD.height - 360);
  if (
    isLake(x, y) ||
    isOcean(x, y) ||
    isSwamp(x, y) ||
    ROADS.some(
      (r) =>
        Math.abs(x - r.x) < r.w / 2 + 100 && Math.abs(y - r.y) < r.h / 2 + 80,
    ) ||
    buildings.some(
      ([bx, by, w, h]) =>
        x > bx * T - 70 &&
        x < (bx + w) * T + 70 &&
        y > by * T - 100 &&
        y < (by + h) * T + 80,
    ) ||
    HOUSES.some((h) => Math.abs(x - h.x) < 200 && Math.abs(y - h.y) < 370) ||
    objects.some(
      (o) => o.type === "shelter" && Math.hypot(o.x - x, o.y - y) < 180,
    )
  )
    continue;
  objects.push({
    id: 100 + i,
    name: String(count++ % 12),
    type: "tree",
    x: Math.round(x),
    y: Math.round(y),
    width: 0,
    height: 0,
  });
}
for (let i = 0; i < 6; i++)
  objects.push({
    id: 700 + i,
    name: String(i % 2),
    type: "car",
    x: i < 3 ? 1475 : 3825,
    y: i < 3 ? 450 + i * 680 : 760 + (i - 3) * 1180,
    width: 0,
    height: 0,
  });
for (let i = 0; i < 150; i++)
  objects.push({
    id: 800 + i,
    name: String(i % 3),
    type: "rubble",
    x: Math.round(180 + rand() * (WORLD.width - 360)),
    y: Math.round(180 + rand() * (WORLD.height - 360)),
    width: 0,
    height: 0,
  });
writeFileSync(
  "public/maps/wasteland.json",
  JSON.stringify({
    compressionlevel: -1,
    height: H,
    width: W,
    infinite: false,
    orientation: "orthogonal",
    renderorder: "right-down",
    tiledversion: "1.11.0",
    tileheight: T,
    tilewidth: T,
    type: "map",
    version: "1.10",
    nextlayerid: 3,
    nextobjectid: 1000,
    layers: [
      {
        id: 1,
        name: "Ground",
        type: "tilelayer",
        width: W,
        height: H,
        x: 0,
        y: 0,
        opacity: 1,
        visible: true,
        data,
      },
      {
        id: 2,
        name: "World",
        type: "objectgroup",
        x: 0,
        y: 0,
        opacity: 1,
        visible: true,
        draworder: "topdown",
        objects,
      },
    ],
    tilesets: [
      {
        firstgid: 1,
        name: "Wasteland",
        image: "../../assets/Map/32x32.png",
        imagewidth: 1280,
        imageheight: 832,
        margin: 0,
        spacing: 0,
        tilewidth: T,
        tileheight: T,
        tilecount: 1040,
        columns: 40,
      },
    ],
  }),
);
console.log(
  `Expanded island ${W} x ${H} tiles, ${count} trees, 6 cars, ${buildings.length} ruins.`,
);
