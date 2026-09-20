import { mkdirSync, writeFileSync } from "node:fs";
const pages = [
  ["guns", "gunshot-sounds"],
  ["reload", "gun-reload-sounds"],
  ["night", "crickets-ambient-noise-loopable"],
  ["steps", "different-steps-on-wood-stone-leaves-gravel-and-mud"],
  ["door-real", "iron-door"],
  ["score-dark", "dungeon-ambience"],
  ["score-ruins", "factory-ambiance"],
];
mkdirSync("output/audio-sources", { recursive: true });
mkdirSync("public/audio/recorded", { recursive: true });
for (const [key, slug] of pages) {
  const page = `https://opengameart.org/content/${slug}`;
  const html = await fetch(page).then((r) => r.text());
  writeFileSync(`output/audio-sources/${key}.html`, html);
  const links = [
    ...html.matchAll(
      /href="([^"]*\/sites\/default\/files\/[^"?]+\.(?:zip|wav|mp3|ogg))"/gi,
    ),
  ].map((m) => m[1].replaceAll("&amp;", "&"));
  const unique = [...new Set(links)];
  for (let n = 0; n < unique.length; n++) {
    const url = unique[n];
    const ext = url.split(".").at(-1),
      name = `${key}${n ? "_" + n : ""}.${ext}`;
    const r = await fetch(url);
    if (!r.ok) throw Error(`${url} ${r.status}`);
    writeFileSync(
      `public/audio/recorded/${name}`,
      Buffer.from(await r.arrayBuffer()),
    );
    console.log(key, name, url);
  }
}
