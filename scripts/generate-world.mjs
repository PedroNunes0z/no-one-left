import { writeFileSync, mkdirSync } from "node:fs";
import "./expand-world.mjs";
let seed = 48159;
const rand = () =>
  (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
// Original, loopable piano and bowed-string-inspired score. No downloaded audio.
const rate = 22050;
function wav(name, seconds, fn) {
  const n = Math.floor(rate * seconds),
    b = Buffer.alloc(44 + n * 2);
  b.write("RIFF");
  b.writeUInt32LE(36 + n * 2, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++)
    b.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, fn(i / rate))) * 32767),
      44 + i * 2,
    );
  writeFileSync(`public/audio/${name}.wav`, b);
}
mkdirSync("public/audio", { recursive: true });
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
const notes = [57, 64, 69, 72, 55, 62, 67, 71, 53, 60, 65, 69, 52, 59, 64, 67];
wav("score", 32, (t) => {
  const ix = Math.floor(t / 2) % 16,
    age = t % 2,
    f = hz(notes[ix]);
  const piano =
    Math.exp(-age * 2.5) *
    (Math.sin(2 * Math.PI * f * age) +
      0.3 * Math.sin(2 * Math.PI * f * 2 * age) +
      0.1 * Math.sin(2 * Math.PI * f * 3 * age)) *
    0.17;
  const root = hz([45, 43, 41, 40][Math.floor(t / 8)]);
  const envelope = Math.sin((Math.PI * (t % 8)) / 8) ** 2;
  let string = 0;
  for (let h = 1; h <= 5; h++)
    string +=
      Math.sin(2 * Math.PI * root * h * t + Math.sin(t * 5) * 0.025 * h) / h;
  return piano + string * 0.055 * envelope;
});
wav(
  "shot",
  0.22,
  (t) =>
    (rand() * 2 - 1) * Math.exp(-t * 35) * 0.6 +
    Math.sin(t * 480) * Math.exp(-t * 25) * 0.25,
);
wav("step", 0.12, (t) => (rand() * 2 - 1) * Math.exp(-t * 45) * 0.12);
wav(
  "growl",
  0.8,
  (t) =>
    (Math.sin(t * 2 * Math.PI * (65 + Math.sin(t * 14) * 12)) * 0.2 +
      (rand() * 2 - 1) * 0.06) *
    Math.sin((Math.PI * t) / 0.8),
);
wav(
  "door",
  0.8,
  (t) =>
    (Math.sin(t * 2 * Math.PI * (190 + Math.sin(t * 19) * 70)) * 0.16 +
      (rand() * 2 - 1) * 0.04) *
    Math.sin((Math.PI * t) / 0.8),
);
wav(
  "pickup",
  0.28,
  (t) =>
    Math.sin(t * 2 * Math.PI * (t < 0.13 ? 660 : 880)) *
    Math.exp(-t * 12) *
    0.2,
);
wav("hit", 0.25, (t) => (rand() * 2 - 1) * Math.exp(-t * 18) * 0.3);
wav(
  "wind",
  8,
  (t) =>
    ((rand() * 2 - 1) * 0.015 + Math.sin(t * 27) * 0.007) *
    (0.5 + 0.5 * Math.sin((Math.PI * t) / 8) ** 2),
);
console.log("Tiled world and 8 original audio files generated.");
