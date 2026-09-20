import {
  readFileSync,
  writeFileSync,
  copyFileSync,
  readdirSync,
} from "node:fs";
const file = "output/audio-sources/guns/sounds/cz.wav",
  b = readFileSync(file);
let at = 12,
  fmt,
  data;
while (at + 8 < b.length) {
  const id = b.toString("ascii", at, at + 4),
    n = b.readUInt32LE(at + 4);
  if (id === "fmt ") fmt = b.subarray(at + 8, at + 8 + n);
  if (id === "data") data = b.subarray(at + 8, at + 8 + n);
  at += 8 + n + (n % 2);
}
const channels = fmt.readUInt16LE(2),
  rate = fmt.readUInt32LE(4),
  bits = fmt.readUInt16LE(14);
console.log({
  channels,
  rate,
  bits,
  seconds: data.length / ((rate * channels * bits) / 8),
});
if (bits !== 16) throw Error("Expected PCM16");
let peak = 0,
  start = 0;
const frame = channels * 2;
for (let i = 0; i < data.length; i += frame) {
  const a = Math.abs(data.readInt16LE(i));
  if (a > peak) {
    peak = a;
    start = i;
  }
}
const begin = Math.max(0, start - Math.floor(rate * 0.055) * frame),
  end = Math.min(data.length, begin + Math.floor(rate * 0.65) * frame),
  clip = Buffer.from(data.subarray(begin, end));
for (let i = 0; i < clip.length; i += 2) {
  const fade = Math.min(
    1,
    i / (rate * 0.005 * frame),
    (clip.length - i) / (rate * 0.035 * frame),
  );
  clip.writeInt16LE(Math.round(clip.readInt16LE(i) * fade * 0.8), i);
}
const out = Buffer.alloc(44 + clip.length);
out.write("RIFF");
out.writeUInt32LE(36 + clip.length, 4);
out.write("WAVEfmt ", 8);
out.writeUInt32LE(16, 16);
fmt.copy(out, 20, 0, 16);
out.write("data", 36);
out.writeUInt32LE(clip.length, 40);
clip.copy(out, 44);
writeFileSync("public/audio/recorded/shot-real.wav", out);
for (const f of readdirSync("output/audio-sources/steps"))
  copyFileSync(`output/audio-sources/steps/${f}`, `public/audio/recorded/${f}`);
