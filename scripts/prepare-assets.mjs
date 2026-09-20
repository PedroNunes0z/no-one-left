import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}
const inventory = walk("assets").map((path) => {
  const entry = {
    path: path.replaceAll("\\", "/"),
    bytes: readFileSync(path).length,
  };
  if (path.endsWith(".png")) {
    const data = readFileSync(path);
    entry.width = data.readUInt32BE(16);
    entry.height = data.readUInt32BE(20);
  }
  return entry;
});
mkdirSync("public", { recursive: true });
writeFileSync(
  "public/asset-inventory.json",
  JSON.stringify(inventory, null, 2),
);
console.log(`Catalogued ${inventory.length} supplied assets.`);
