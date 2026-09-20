import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
const crc = (b) => {
  let c = 0xffffffff;
  for (const x of b) {
    c ^= x;
    for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const t = Buffer.from(type),
    b = Buffer.alloc(data.length + 12);
  b.writeUInt32BE(data.length);
  t.copy(b, 4);
  data.copy(b, 8);
  b.writeUInt32BE(crc(Buffer.concat([t, data])), 8 + data.length);
  return b;
};
mkdirSync("public/roads", { recursive: true });
for (const name of readdirSync("assets/Map/Roads").filter((n) =>
  n.endsWith(".tga"),
)) {
  const b = readFileSync("assets/Map/Roads/" + name),
    w = b.readUInt16LE(12),
    h = b.readUInt16LE(14),
    depth = b[16],
    type = b[2];
  if (type !== 2 || depth !== 24 || b[1])
    throw Error("Unsupported TGA " + name);
  const scan = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    const sourceY = b[17] & 32 ? y : h - 1 - y;
    for (let x = 0; x < w; x++) {
      const from = 18 + b[0] + (sourceY * w + x) * 3,
        to = y * (w * 3 + 1) + 1 + x * 3;
      scan[to] = b[from + 2];
      scan[to + 1] = b[from + 1];
      scan[to + 2] = b[from];
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(w);
  header.writeUInt32BE(h, 4);
  header[8] = 8;
  header[9] = 2;
  writeFileSync(
    "public/roads/" + name.replace(".tga", ".png"),
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", header),
      chunk("IDAT", deflateSync(scan)),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
  console.log(name, w, h);
}
