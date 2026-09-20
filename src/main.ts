import Phaser from "phaser";
import { UI } from "./ui";
import { SurvivalScene } from "./game";
import "./style.css";
const ui = new UI();
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#252d22",
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: "arcade",
    arcade: { debug: false, gravity: { x: 0, y: 0 } },
  },
  scene: [new SurvivalScene(ui)],
  input: { activePointers: 4 },
});
if (import.meta.env.DEV) Object.assign(window, { __NOL: { game, ui } });
