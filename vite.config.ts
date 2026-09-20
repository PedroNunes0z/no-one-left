import { defineConfig } from "vite";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, join } from "node:path";

const ASSET_SOURCES = [
  "src/assets.ts",
  "src/supplies.ts",
  "src/ui.ts",
  "src/game.ts",
];
const ACTOR_FOLDERS = [
  "assets/Character",
  "assets/NormalZombie/Zombie Man",
  "assets/NormalZombie/Wild Zombie",
  "assets/NormalZombie/Zombie Woman",
  ...[1, 2, 3, 4].map((n) => `assets/NormalZombie/Zombie_${n}`),
];

function filesBelow(folder: string): string[] {
  if (!existsSync(folder)) return [];
  return readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

/** Copy runtime dependencies without publishing the complete source asset packs. */
function runtimeAssets() {
  const files = new Set<string>();
  const literal = /["'`]([^"'`\n]+\.(?:png|jpg|jpeg|webp|wav|mp3|ogg))["'`]/gi;
  for (const source of ASSET_SOURCES) {
    const text = readFileSync(source, "utf8");
    for (const match of text.matchAll(literal)) {
      const value = match[1];
      if (value.includes("${")) continue;
      if (value.startsWith("assets/")) {
        if (!existsSync(value))
          throw new Error(`Runtime asset referenced by ${source} is missing: ${value}`);
        files.add(value);
      }
      const suppliedSound = join("assets/Sounds", value);
      if (existsSync(suppliedSound)) files.add(suppliedSound);
    }
  }
  for (const folder of ACTOR_FOLDERS) {
    if (!existsSync(folder)) throw new Error(`Actor asset folder is missing: ${folder}`);
    for (const file of filesBelow(folder))
      if (file.toLowerCase().endsWith(".png")) files.add(file);
  }
  for (let tree = 1; tree <= 8; tree++)
    for (let frame = 0; frame < 4; frame++)
      files.add(
        `assets/Map/Trees/trees-greenland/tree${tree}/tree${tree}_${String(frame).padStart(2, "0")}.png`,
      );
  for (let scene = 1; scene <= 4; scene++)
    files.add(
      `assets/MenuBG/PNG/Postapocalypce${scene}/Pale/postapocalypse${scene}.png`,
    );
  for (const file of files)
    if (!existsSync(file)) throw new Error(`Runtime asset is missing: ${file}`);
  return [...files];
}

export default defineConfig({
  plugins: [
    {
      name: "copy-game-assets",
      closeBundle() {
        for (const source of runtimeAssets()) {
          const target = join("dist", source);
          mkdirSync(dirname(target), { recursive: true });
          cpSync(source, target);
        }
      },
    },
  ],
  build: { chunkSizeWarningLimit: 1600 },
});
