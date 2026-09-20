import { defineConfig } from "vite";
import { cpSync, existsSync } from "node:fs";

export default defineConfig({
  plugins: [
    {
      name: "copy-game-assets",
      closeBundle() {
        if (existsSync("assets"))
          cpSync("assets", "dist/assets", {
            recursive: true,
            filter: (source) => !/\.(zip|psd|aseprite|pdf|gif)$/i.test(source),
          });
      },
    },
  ],
  build: { chunkSizeWarningLimit: 1600 },
});
