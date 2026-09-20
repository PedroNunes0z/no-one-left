import Phaser from "phaser";
import { buildRoadTiles, ROAD_TILE } from "./roads";
import { WEAPONS, weaponId, isWeapon } from "./weapons";
import { AudioDirector, projectileCue, spatialGain, type ProjectileAudioEvent } from "./audio";
import { sightPolygon, visiblePoint, type SightBlock } from "./vision";
import { NUTRITION } from "./supplies";
import { LocalSession, type Action } from "./session";
import {
  WORLD,
  HOUSES,
  ROADS,
  DISTRICTS,
  ISOMETRIC_BUILDINGS,
  NUCLEAR_ZONE,
  STORY_WORLD,
  STORY_LOBBY,
  MAP_BLUEPRINT,
  MAP_CELL,
  TREE_SITES,
  CAR_SITES,
  isRadioactive,
  onRoad,
  isOcean,
  isDeepOcean,
  isLake,
  directionRow,
  ROOM,
  roomPoint,
} from "./world";
import {
  addItem,
  reconcileGrid,
  emptyInventory,
  ITEM_PHYSICS,
  type DroppedItem,
} from "./model";
import { assetUrl, loadAssets, createAnimations, STORY_MUSIC } from "./assets";
import { UI, type Settings } from "./ui";
import {
  newGame,
  writeSave,
  randomGenerator,
  updateSurvival,
  isNight,
  consume,
  craft,
  rest,
  repairRadio,
  clamp,
  ITEMS,
  SHELTERS,
  type SaveData,
  type ItemId,
  type RecipeId,
} from "./model";
interface ZombieInfo {
  stepAt?: number;
  diedAt: number;
  maxHp: number;
  targetX: number;
  targetY: number;
  wanderAt: number;
  attackUntil: number;
  bar: Phaser.GameObjects.Graphics;
  id: string;
  kind:
    | "walker"
    | "runner"
    | "lurker"
    | "shambler1"
    | "shambler2"
    | "shambler3"
    | "shambler4";
  hp: number;
  speed: number;
  damage: number;
  lastAttack: number;
  homeX: number;
  homeY: number;
  alertUntil: number;
}
interface Loot {
  id: string;
  x: number;
  y: number;
  item: ItemId;
  count: number;
  sprite: Phaser.GameObjects.Image;
  durability: number;
  shelter?: string;
}
type Body = Phaser.Physics.Arcade.Body;
export class SurvivalScene extends Phaser.Scene {
  ui: UI;
  session!: LocalSession;
  wave = 0;
  sequence = 0;
  facing = 2;
  aiming = false;
  crouching = false;
  cursorReleased = false;
  selectedSlot = 0;
  containerId = "";
  blocking = false;
  shootingUntil = 0;
  smokeUntil = 0;
  houseImages: Phaser.GameObjects.Image[] = [];
  fruitTrees: { id: string; x: number; y: number; item: ItemId }[] = [];
  visionMask = document.createElement("canvas");
  visionBlend = document.createElement("canvas");
  visionFresh = document.createElement("canvas");
  visionView?: { x: number; y: number; width: number; height: number };
  visionCanvas!: Phaser.Textures.CanvasTexture;
  visionOverlay!: Phaser.GameObjects.Image;
  tracers!: Phaser.GameObjects.Graphics;
  lastVision = -10;
  sightBlocks: SightBlock[] = [];
  containers: {
    id: string;
    x: number;
    y: number;
    name: string;
    shelter?: string;
  }[] = [];
  reticle!: Phaser.GameObjects.Graphics;
  aimX = 0;
  aimY = 0;
  musicKey = "menu-music";
  musicOverride = "";
  nightSound?: Phaser.Sound.BaseSound;
  lastAmbience = 0;
  lastHorror = -90;
  lastWaveWarning = -10;
  state: SaveData = newGame();
  gameMode: "survival" | "story" = "survival";
  storyBorderShown = false;
  storyMusic?: Phaser.Sound.BaseSound;
  storyMusicKey = "";
  radiationSound?: Phaser.Sound.BaseSound;
  heartbeatSound?: Phaser.Sound.BaseSound;
  playing = false;
  paused = true;
  finished = false;
  player!: Phaser.Physics.Arcade.Sprite;
  zombies!: Phaser.Physics.Arcade.Group;
  obstacles!: Phaser.Physics.Arcade.StaticGroup;
  roomWalls!: Phaser.Physics.Arcade.StaticGroup;
  bullets!: Phaser.Physics.Arcade.Group;
  loot: Loot[] = [];
  occluders: Phaser.GameObjects.Image[] = [];
  roomVisuals: Phaser.GameObjects.GameObject[] = [];
  campsDrawn = 0;
  currentShelter = "";
  currentHouse = "";
  houseDoors: { id: string; x: number; y: number }[] = [];
  exterior = { x: 1568, y: 1330 };
  nearbyCamp = false;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  touchKeys = new Set<string>();
  lastShot = -10;
  lastMelee = -10;
  lastStep = 0;
  lastGrowl = 0;
  lastSave = 0;
  lastPublish = 0;
  actionUntil = 0;
  hurtUntil = 0;
  reloadUntil = 0;
  safe = false;
  noiseUntil = 0;
  noiseRadius = 0;
  sprintLocked = false;
  dark!: Phaser.GameObjects.Graphics;
  vignette!: Phaser.GameObjects.Image;
  pointerDown = false;
  pendingShot = false;
  pendingTouchShot = false;
  pendingActions = new Set<string>();
  fadingScores: Phaser.Sound.BaseSound[] = [];
  score?: Phaser.Sound.BaseSound;
  audio!: AudioDirector;
  wind?: Phaser.Sound.BaseSound;
  forestAmbience?: Phaser.Sound.BaseSound;
  seaAmbience?: Phaser.Sound.BaseSound;
  campfireAmbience?: Phaser.Sound.BaseSound;
  spatialVoices: Phaser.Sound.BaseSound[] = [];
  casingQueue: { at: number; x: number; y: number }[] = [];
  heardProjectiles = new Set<string>();
  settings: Settings = { sound: true, music: 0.45, effects: 0.65 };
  interactive: {
    type:
      | "container"
      | "loot"
      | "shelter"
      | "exit"
      | "bed"
      | "radio"
      | "stash"
      | "house"
      | "camp";
    id?: string;
  } | null = null;
  constructor(ui: UI) {
    super("Survival");
    this.ui = ui;
  }
  preload() {
    this.load.on("progress", (value: number) => this.ui.progress(value));
    this.load.on("loaderror", (file: Phaser.Loader.File) =>
      this.ui.loadingError(file.key),
    );
    loadAssets(this);
  }
  create() {
    createAnimations(this);
    this.keys = this.input.keyboard!.addKeys(
      "W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT,CTRL,Q,E,R,F,G,U,ONE,TWO,THREE,FOUR,FIVE",
    ) as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.addCapture(["CTRL", "UP", "DOWN", "LEFT", "RIGHT"]);
    for (const name of [
      "CTRL",
      "E",
      "R",
      "F",
      "G",
      "U",
      "ONE",
      "TWO",
      "THREE",
      "FOUR",
      "FIVE",
    ])
      this.keys[name].on("down", () => {
        if (
          this.playing &&
          !this.paused &&
          !this.keys[name].originalEvent?.repeat
        )
          this.pendingActions.add(name);
      });
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (
        p.button === 0 &&
        p.event.target === this.game.canvas &&
        !this.paused &&
        this.playing
      ) {
        this.pointerDown = true;
        this.pendingShot = true;
      }
    });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (p.button === 0) this.pointerDown = false;
      if (p.button === 2) this.aiming = false;
    });
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (p.button === 2 && !this.paused) this.aiming = true;
    });
    document.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement === this.game.canvas) {
        this.aimX = clamp(this.aimX + e.movementX, 15, this.scale.width - 15);
        this.aimY = clamp(this.aimY + e.movementY, 15, this.scale.height - 15);
      }
    });
    document.addEventListener("pointerlockchange", () => {
      if (!document.pointerLockElement && this.playing && !this.paused) {
        this.cursorReleased = true;
        this.cursorMode();
      }
    });
    this.input.on("gameout", () => {
      this.pointerDown = false;
      this.aiming = false;
    });
    this.game.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    this.ui.api = {
      start: (save) => this.start(save),
      startStory: () => this.startStory(),
      prologue: (showLogo, done) => this.playIntro(showLogo, done),
      pause: (p) => this.setPaused(p),
      save: () => this.save(),
      quit: () => this.quit(),
      consume: (id, uid) => this.use(id, uid),
      craft: (id) => this.craftItem(id),
      rest: () => this.rest(),
      repair: () => this.repair(),
      grid: (uid, x, y) => this.command({ type: "grid", uid, x, y }),
      hotbar: (slot, uid) => this.command({ type: "hotbar", slot, uid }),
      drop: (uid) => this.drop(uid),
      equip: (uid) => this.command({ type: "pack", uid }),
      repairWeapon: () => this.command({ type: "repair" }),
      search: () => this.containerId,
      collect: (id) => this.collectContainer(id),
      transfer: (id, deposit) => this.transfer(id, deposit),
      settings: (settings) => this.configureAudio(settings),
      uiSound: (key) => this.sfx(key, 0.8),
      activateAudio: () => this.activateAudio(),
      touch: (key, down) => {
        if (key === "aim") this.aiming = down;
        if (key === "crouch" && down) this.pendingActions.add("CTRL");
        if (down) {
          this.touchKeys.add(key);
          if (key === "interact") this.pendingActions.add("E");
          if (key === "melee") this.pendingActions.add("F");
          if (key === "shoot") {
            this.pendingShot = true;
            this.pendingTouchShot = true;
          }
        } else this.touchKeys.delete(key);
      },
    };
    this.audio = new AudioDirector(this, this.ui.settings);
    this.wind = this.sound.add("horror-atmo", { loop: true, volume: 0.4 });
    this.forestAmbience = this.sound.add("nature-forest", {
      loop: true,
      volume: 0,
    });
    this.seaAmbience = this.sound.add("nature-sea", { loop: true, volume: 0 });
    this.campfireAmbience = this.sound.add("nature-campfire", {
      loop: true,
      volume: 0,
    });
    this.nightSound = this.sound.add("night", { loop: true, volume: 0 });
    this.ui.loaded();
    this.physics.pause();
    this.sound.once("unlocked", () => this.configureAudio(this.ui.settings));
    this.configureAudio(this.ui.settings);
    const resumeAudio = () => {
      if (this.ui.settings.sound) this.activateAudio();
    };
    document.addEventListener("pointerdown", resumeAudio);
    document.addEventListener("keydown", resumeAudio);
    document
      .getElementById("menu-audio")
      ?.addEventListener("pointerdown", () => {
        const button = document.getElementById("menu-audio")!;
        button.dataset.unlock = String(button.textContent === "ATIVAR ÁUDIO");
      });
    document
      .getElementById("menu-audio")
      ?.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          const button = document.getElementById("menu-audio")!;
          button.dataset.unlock = String(button.textContent === "ATIVAR ÁUDIO");
        }
      });
    document.getElementById("menu-audio")?.addEventListener("click", () => {
      const button = document.getElementById("menu-audio")!,
        first = button.dataset.unlock === "true";
      button.dataset.unlock = "false";
      this.ui.settings.sound = first ? true : !this.ui.settings.sound;
      localStorage.setItem(
        "no-one-left.settings",
        JSON.stringify(this.ui.settings),
      );
      this.configureAudio(this.ui.settings);
    });
  }
  playIntro(showLogo: () => void, done: () => void) {
    showLogo();
    const begin = () => {
      const logo = this.sound.add("intro-logo", {
        volume: this.settings.sound ? this.settings.effects * 0.9 : 0,
      });
      logo.once("complete", () => {
        logo.destroy();
        this.switchMusic(this.playing ? "playing-music" : "menu-music");
      });
      logo.play();
      window.setTimeout(done, 550);
    };
    if (
      this.sound instanceof Phaser.Sound.WebAudioSoundManager &&
      this.sound.context.state !== "running"
    )
      void this.sound.context.resume().then(begin);
    else begin();
  }
  activateAudio() {
    this.ui.settings.sound = true;
    this.settings.sound = true;
    this.sound.mute = false;
    const ready = () => {
      this.configureAudio(this.ui.settings);
      if (this.playing) {
        this.switchMusic("playing-music");
        if (!this.wind?.isPlaying) this.wind?.play();
      } else this.switchMusic("menu-music");
    };
    void this.audio.unlock().then(ready).catch(() => {});
  }
  switchMusic(key: string) {
    this.score = this.audio.setMusic(key);
    this.musicKey = key;
  }
  startStory() {
    if (this.cache.audio.exists("story-music-0")) {
      this.start(undefined, "story");
      return;
    }
    this.ui.toast("Carregando as músicas do modo História…");
    Object.entries(STORY_MUSIC).forEach(([key, path]) =>
      this.load.audio(key, assetUrl("assets/Sounds/" + path)),
    );
    this.load.once("complete", () => this.start(undefined, "story"));
    this.load.start();
  }
  start(save?: SaveData, mode: "survival" | "story" = "survival") {
    this.scale.off("resize", this.resize, this);
    this.stopSpatial();
    this.physics.world.colliders.destroy();
    this.tweens.killAll();
    for (const sound of this.fadingScores) {
      sound.stop();
      sound.destroy();
    }
    this.fadingScores = [];
    this.musicOverride = "";
    this.zombies?.destroy(true);
    this.bullets?.destroy(true);
    this.obstacles?.destroy(true);
    this.roomWalls?.destroy(true);
    this.children.removeAll(true);
    this.loot = [];
    this.occluders = [];
    this.roomVisuals = [];
    this.touchKeys.clear();
    this.gameMode = mode;
    this.storyBorderShown = false;
    this.state = save ? structuredClone(save) : newGame();
    this.session = new LocalSession(this.state);
    this.sequence = 0;
    this.wave = Math.floor(this.state.elapsed / 360);
    this.containers = [];
    this.containerId = "";
    this.houseImages = [];
    this.fruitTrees = [];
    this.visionView = undefined;
    this.casingQueue = [];
    this.heardProjectiles.clear();
    this.crouching = false;
    this.blocking = false;
    this.shootingUntil = 0;
    this.smokeUntil = 0;
    this.lastVision = -10;
    this.facing = 2;
    this.aiming = false;
    this.cursorReleased = false;
    this.aimX = this.scale.width / 2 + 120;
    this.aimY = this.scale.height / 2;
    this.currentShelter = "";
    this.currentHouse = "";
    this.houseDoors = [];
    this.campsDrawn = 0;
    this.finished = false;
    this.playing = true;
    this.paused = false;
    this.lastShot = this.lastMelee = this.lastStep = this.lastGrowl = -10;
    this.lastSave = this.lastPublish = this.state.elapsed;
    this.musicKey = this.score?.key || "score";
    this.lastAmbience = -10;
    this.actionUntil = this.hurtUntil = this.reloadUntil = 0;
    this.sprintLocked = false;
    this.noiseUntil = 0;
    this.pointerDown = false;
    this.pendingShot = false;
    this.pendingTouchShot = false;
    this.pendingActions.clear();
    this.interactive = null;
    this.obstacles = this.physics.add.staticGroup();
    this.roomWalls = this.physics.add.staticGroup();
    this.zombies = this.physics.add.group();
    this.bullets = this.physics.add.group({ defaultKey: "mote", maxSize: 30 });
    if (mode === "story") {
      this.state.x = STORY_LOBBY.x;
      this.state.y = STORY_LOBBY.y + 260;
      this.buildStoryLobby();
    } else this.buildWorld();
    this.player = this.physics.add
      .sprite(this.state.x, this.state.y, "player-Idle")
      .setScale(1)
      .setOrigin(0.5, 0.74)
      .setDepth(this.state.y);
    this.player.body!.setSize(14, 12);
    this.player.body!.setOffset(57, 83);
    this.player.setCollideWorldBounds(true);
    this.player.play("player-Idle-2");
    this.physics.world.setBounds(
      0,
      0,
      mode === "story" ? STORY_WORLD.width : ROOM.cx + 640,
      mode === "story" ? STORY_WORLD.height : WORLD.height,
    );
    this.cameras.main
      .setBounds(
        0,
        0,
        mode === "story" ? STORY_WORLD.width : WORLD.width,
        mode === "story" ? STORY_WORLD.height : WORLD.height,
      )
      .setZoom(this.zoom())
      .setFollowOffset(0, 0)
      .startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBackgroundColor("#172432");
    this.physics.add.collider(this.player, this.obstacles);
    this.physics.add.collider(this.player, this.roomWalls);
    this.physics.add.collider(this.zombies, this.obstacles);
    this.physics.add.collider(this.zombies, this.zombies);
    this.physics.add.collider(this.player, this.zombies);
    this.physics.add.collider(this.bullets, this.obstacles, (bullet) => {
      const b = bullet as Phaser.Physics.Arcade.Sprite;
      this.presentProjectile({
        id: b.getData("projectileId"),
        ownerId: b.getData("ownerId"),
        from: b.getData("muzzle"),
        to: { x: b.x, y: b.y },
        impact: true,
      });
      b.disableBody(true, true);
    });
    this.physics.add.overlap(this.bullets, this.zombies, (bullet, zombie) => {
      const b = bullet as Phaser.Physics.Arcade.Sprite,
        z = zombie as Phaser.Physics.Arcade.Sprite,
        info = z.getData("info") as ZombieInfo;
      if (!b.active || !z.active || info.hp <= 0) return;
      b.disableBody(true, true);
      this.hitZombie(z, b.getData("damage") ?? 42);
    });
    if (mode === "survival") {
      this.spawnLoot();
      this.spawnZombies();
      this.drawCamps();
    }
    this.dark = this.add.graphics().setScrollFactor(0).setDepth(100000);
    this.vignette = this.add
      .image(0, 0, "vignette")
      .setScrollFactor(0)
      .setDepth(100001);
    this.reticle = this.add.graphics().setDepth(99999);
    if (this.textures.exists("visionOverlay"))
      this.textures.remove("visionOverlay");
    this.visionCanvas = this.textures.createCanvas("visionOverlay", 960, 640)!;
    this.visionOverlay = this.add
      .image(0, 0, "visionOverlay")
      .setScrollFactor(0)
      .setDepth(100002);
    this.tracers = this.add.graphics().setDepth(8001);
    this.reticle.setDepth(100003);
    this.cursorMode();
    this.scale.on("resize", this.resize, this);
    this.visionOverlay.setVisible(false);
    this.switchMusic("playing-music");
    this.physics.resume();
    this.anims.resumeAll();
    this.publish();
    this.save();
    this.configureAudio(this.ui.settings);
  }
  zoom() {
    return this.scale.width < 600 ? 1.08 : 1.32;
  }
  interiorZoom() {
    return Math.max(
      1.1,
      Math.min(2.1, this.scale.width / 520, this.scale.height / 400),
    );
  }
  inside() {
    return !!(this.currentShelter || this.currentHouse);
  }
  roomId() {
    return this.currentShelter || (this.currentHouse ? `house:${this.currentHouse}` : "");
  }
  resize() {
    this.cameras.main.setZoom(
      this.inside() ? this.interiorZoom() : this.zoom(),
    );
  }
  block(x: number, y: number, w: number, h: number, group = this.obstacles) {
    const rect = this.add.rectangle(x, y, w, h, 0x000000, 0);
    this.physics.add.existing(rect, true);
    group.add(rect);
    return rect;
  }
  prop(
    key: string,
    frame: string | undefined,
    x: number,
    y: number,
    scale: number,
    blocked = false,
  ) {
    const image = this.add
      .image(x, y, key, frame)
      .setScale(scale)
      .setOrigin(0.5, 0.85)
      .setDepth(y)
      .setTint(0xa8b395);
    this.occluders.push(image);
    if (blocked)
      image.setData(
        "sightBody",
        this.block(
          x,
          y - 8,
          Math.max(20, image.displayWidth * 0.44),
          Math.max(15, image.displayHeight * 0.16),
        ).setData("visualImage", true),
      );
    return image;
  }
  tree(x: number, y: number, kind: number, fruitId?: string) {
    const variety = (kind % 8) + 1;
    const sprite = this.add
      .sprite(x, y, `tree-${variety}-0`)
      .setOrigin(0.5, 0.92)
      .setScale(1.35)
      .setDepth(y)
      .setTint(0xb5c6d2)
      .play(`tree-sway-${variety}`);
    this.occluders.push(sprite as unknown as Phaser.GameObjects.Image);
    // Only the trunk occupies one 32 px map square; the canopy stays traversable.
    sprite.setData(
      "sightBody",
      this.block(x, y - 10, 32, 32).setData("visualImage", true),
    );
    if (fruitId)
      this.fruitTrees.push({
        id: fruitId,
        x,
        y,
        item: (["food", "orange", "pear", "fig", "guava"] as ItemId[])[kind % 5],
      });
    return sprite;
  }
  buildStoryLobby() {
    this.add
      .tileSprite(
        STORY_WORLD.width / 2,
        STORY_WORLD.height / 2,
        STORY_WORLD.width,
        STORY_WORLD.height,
        "grassBase",
      )
      .setDepth(-1000)
      .setTint(0x7b8d66)
      .setTileScale(0.55);
    const boundary = this.add.graphics().setDepth(-900);
    boundary.lineStyle(10, 0x6d8062, 0.22);
    boundary.strokeCircle(STORY_LOBBY.x, STORY_LOBBY.y, STORY_LOBBY.radius);
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2,
        distance = STORY_LOBBY.radius + 85 + (i % 3) * 22,
        x = STORY_LOBBY.x + Math.cos(a) * distance,
        y = STORY_LOBBY.y + Math.sin(a) * distance * 0.7;
      this.prop(
        i % 6 === 0 ? "deadTrees" : "trees",
        "tree" + (i % 12),
        x,
        y,
        0.82,
        true,
      );
    }
    const houseX = STORY_LOBBY.x + 420,
      houseY = STORY_LOBBY.y + 30;
    const house = this.add
      .image(houseX, houseY, "partyHouse")
      .setDisplaySize(430, 430)
      .setOrigin(0.5, 1)
      .setDepth(houseY);
    this.occluders.push(house);
    house.setData(
      "sightBody",
      this.block(houseX, houseY - 55, 300, 125).setData("visualImage", true),
    );
    this.add
      .sprite(STORY_LOBBY.x, STORY_LOBBY.y, "bonfire", "fire0")
      .setScale(0.16)
      .setDepth(STORY_LOBBY.y + 2)
      .play("story-fire");
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4,
        x = STORY_LOBBY.x + Math.cos(a) * 175,
        y = STORY_LOBBY.y + Math.sin(a) * 115;
      this.prop("bench", undefined, x, y, 2, false).setAngle(
        (a * 180) / Math.PI + 90,
      );
    }
    this.add
      .text(
        STORY_LOBBY.x,
        STORY_LOBBY.y + 470,
        "LOBBY DA HISTÓRIA · ZONA SEM COMBATE",
        {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#ced6b6",
          backgroundColor: "#172019bb",
          padding: { x: 14, y: 8 },
        },
      )
      .setOrigin(0.5)
      .setDepth(STORY_LOBBY.y + 480);
  }
  updateStoryAudio() {
    const nearHouse =
        Math.hypot(
          this.player.x - (STORY_LOBBY.x + 420),
          this.player.y - (STORY_LOBBY.y + 30),
        ) < 520,
      index = Math.floor(this.state.elapsed / 55) % 6,
      key = "story-music-" + index;
    if (nearHouse && key !== this.storyMusicKey) {
      this.storyMusic?.stop();
      this.storyMusic?.destroy();
      this.storyMusic = this.sound.add(key, {
        volume: this.settings.music * 0.22,
        loop: true,
      });
      this.storyMusicKey = key;
      this.storyMusic.play();
    }
    if (this.storyMusic)
      (this.storyMusic as Phaser.Sound.WebAudioSound).setVolume(
        nearHouse ? this.settings.music * 0.22 : 0,
      );
  }
  buildWorld() {
    this.add
      .tileSprite(
        WORLD.width / 2,
        WORLD.height / 2,
        WORLD.width - 256,
        WORLD.height - 256,
        "grassBase",
      )
      .setDepth(-1000)
      .setTint(0x87936f)
      .setTileScale(0.55);
    const zoning = this.add.graphics().setDepth(-999);
    MAP_BLUEPRINT.forEach((line, row) =>
      line.forEach((cell, col) => {
        if (cell === "urban") zoning.fillStyle(0x334754, 0.17);
        else if (cell === "industrial") zoning.fillStyle(0x4e535a, 0.28);
        else return;
        zoning.fillRect(col * MAP_CELL, row * MAP_CELL, MAP_CELL, MAP_CELL);
      }),
    );
    // The 32x32 world atlas supplies worn ground patches between fixed city blocks.
    for (let y = 384; y < WORLD.height - 256; y += 512)
      for (let x = 384; x < WORLD.width - 256; x += 640)
        if (!onRoad(x, y, 80) && !isLake(x, y))
          this.add.image(x, y, "terrain", "grass").setScale(1.6).setAlpha(0.24).setDepth(-998);
    this.add
      .tileSprite(1120, 1100, 1900, 1500, "grassOvercast")
      .setDepth(-999)
      .setAlpha(0.22)
      .setTint(0x718568)
      .setTileScale(0.55);
    this.add
      .tileSprite(4800, 3500, 2600, 1900, "grassGen1")
      .setDepth(-999)
      .setAlpha(0.2)
      .setTint(0x617558)
      .setTileScale(0.55);
    const radioactive = this.add.graphics().setDepth(-998);
    radioactive.fillStyle(0x82703f, 0.7);
    radioactive.fillEllipse(
      NUCLEAR_ZONE.x,
      NUCLEAR_ZONE.y,
      NUCLEAR_ZONE.rx * 2,
      NUCLEAR_ZONE.ry * 2,
    );
    radioactive.lineStyle(16, 0xa28b45, 0.2);
    radioactive.strokeEllipse(
      NUCLEAR_ZONE.x,
      NUCLEAR_ZONE.y,
      NUCLEAR_ZONE.rx * 2,
      NUCLEAR_ZONE.ry * 2,
    );
    TREE_SITES.forEach((site, i) => this.tree(site.x, site.y, site.kind, i % 6 === 0 ? site.id : undefined));
    CAR_SITES.forEach((car, i) => {
      this.prop("car", car.red ? "red" : "gray", car.x, car.y, 1.45, true);
      this.addContainer(`car-fixed-${i}`, car.x, car.y + 20, "Porta-malas");
    });
    for (const shelter of SHELTERS) this.bunker(shelter.id, shelter.x, shelter.y);
    this.add
      .text(1775, 1230, "SETOR 07", {
        fontFamily: "monospace",
        fontSize: "25px",
        color: "#c0bd91",
      })
      .setAlpha(0.25)
      .setAngle(-90)
      .setDepth(-940);
    this.add
      .text(NUCLEAR_ZONE.x, NUCLEAR_ZONE.y + NUCLEAR_ZONE.ry + 45, "ZONA DE QUARENTENA", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#b9b487",
      })
      .setAlpha(0.32)
      .setDepth(-940);
    this.add
      .particles(0, 0, "mote", {
        x: { min: 0, max: WORLD.width },
        y: { min: 0, max: WORLD.height },
        quantity: 1,
        frequency: 80,
        lifespan: 9000,
        speedX: { min: 8, max: 18 },
        speedY: { min: -5, max: 3 },
        alpha: { start: 0.22, end: 0 },
        scale: { start: 0.6, end: 0 },
        tint: 0xd0d4a2,
      })
      .setDepth(9000);
    this.drawDistricts();
    this.drawBiomes();
    this.drawLandmarks();
  }
  drawLandmarks() {
    this.prop("volcano", undefined, 300, 330, 3.2, true);
    this.add
      .text(300, 390, "MONTE CINZA", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#c7a66b",
      })
      .setOrigin(0.5)
      .setDepth(400);
    const plant = this.add
      .image(NUCLEAR_ZONE.x, NUCLEAR_ZONE.y, "nuclearPlant")
      .setDisplaySize(760, 507)
      .setOrigin(0.5, 0.78)
      .setDepth(NUCLEAR_ZONE.y + 80);
    this.occluders.push(plant);
    plant.setData(
      "sightBody",
      this.block(NUCLEAR_ZONE.x, NUCLEAR_ZONE.y + 50, 590, 210).setData(
        "visualImage",
        true,
      ),
    );
    this.add
      .text(NUCLEAR_ZONE.x, NUCLEAR_ZONE.y + 240, "☢ ZONA RADIOATIVA", {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#dbc765",
        backgroundColor: "#25220dcc",
        padding: { x: 12, y: 7 },
      })
      .setOrigin(0.5)
      .setDepth(NUCLEAR_ZONE.y + 250);
    for (const b of ISOMETRIC_BUILDINGS) {
      const base = this.add
        .image(b.x, b.y, "isoClean" + (b.a + 1), "b" + b.f)
        .setScale(1.1)
        .setOrigin(0.5, 1)
        .setDepth(b.y);
      const roof = this.add
        .image(b.x, b.y - 64, "roofClean", "r" + b.r)
        .setScale(1.02)
        .setOrigin(0.5, 1)
        .setDepth(b.y + 1);
      this.occluders.push(base, roof);
      base.setData(
        "sightBody",
        this.block(b.x, b.y - 25, 120, 55).setData("visualImage", true),
      );
      this.addContainer(
        "iso-" + b.x + "-" + b.y,
        b.x,
        b.y + 18,
        "Edifício abandonado",
      );
    }
  }
  ruin(x: number, y: number, w: number, h: number) {
    const g = this.add.graphics().setDepth(y - 1);
    g.fillStyle(0x0c160f, 0.38);
    g.fillRect(x + 12, y + 14, w, h);
    this.add
      .tileSprite(x + w / 2, y + h / 2, w - 16, h - 16, "floor")
      .setDepth(y - 2)
      .setTint(0x6b775b)
      .setAlpha(0.85);
    g.fillStyle(0x4d5843);
    g.fillRect(x, y, w, 15);
    g.fillRect(x, y, 16, h);
    g.fillRect(x + w - 16, y, 16, h);
    g.fillRect(x, y + h - 14, w * 0.38, 14);
    g.fillRect(x + w * 0.62, y + h - 14, w * 0.38, 14);
    g.lineStyle(2, 0x83896b, 0.5);
    g.lineBetween(x, y, x + w, y);
    g.lineBetween(x + 4, y, x + 4, y + h);
    for (let i = 0; i < w / 40; i++) {
      g.fillStyle(i % 3 ? 0x384333 : 0x7e8263, 0.6);
      g.fillRect(x + i * 40 + 4, y + 3, 25, 6);
    }
    this.block(x + w / 2, y + 7, w, 14);
    this.block(x + 8, y + h / 2, 16, h);
    this.block(x + w - 8, y + h / 2, 16, h);
    this.block(x + w * 0.19, y + h - 7, w * 0.38, 14);
    this.block(x + w * 0.81, y + h - 7, w * 0.38, 14);
    if (x > 3000) {
      this.add
        .tileSprite(x + w / 2, y + 9, w, 35, "urban0007")
        .setTileScale(2.5)
        .setTint(0x74796d)
        .setDepth(y + 10);
      this.add
        .image(x + 80, y + 10, "urban0012")
        .setScale(2.5)
        .setTint(0x787e70)
        .setDepth(y + 11);
      this.add
        .image(x + w - 80, y + 10, "urban0012")
        .setScale(2.5)
        .setTint(0x787e70)
        .setDepth(y + 11);
    }
    const sofa = this.add
      .image(x + 70, y + 65, "sofa")
      .setDisplaySize(88, 42)
      .setTint(0x8a9778)
      .setDepth(y + 70);
    this.occluders.push(sofa);
    const table = this.add
      .image(x + w - 67, y + 65, "table")
      .setDisplaySize(57, 46)
      .setTint(0x7d8769)
      .setDepth(y + 75);
    this.occluders.push(table);
    this.addContainer(`sofa-${x}-${y}`, x + 70, y + 92, "Sofá");
    this.addContainer(`desk-${x}-${y}`, x + w - 67, y + 94, "Gavetas da mesa");
    this.prop("shelterObjects", "locker", x + 35, y + h - 65, 1.05, true);
    this.addContainer(`locker-${x}-${y}`, x + 35, y + h - 43, "Armário");
    sofa.setData(
      "sightBody",
      this.block(x + 70, y + 65, 83, 35).setData("visualImage", true),
    );
    table.setData(
      "sightBody",
      this.block(x + w - 67, y + 65, 48, 36).setData("visualImage", true),
    );
    this.prop("terrain", "junk", x + 35, y + h - 35, 0.7);
    this.add
      .image(x + w - 45, y + h - 45, "plant")
      .setDisplaySize(45, 48)
      .setTint(0x73895b)
      .setDepth(y + h - 44);
  }
  bunker(id: string, x: number, y: number) {
    const g = this.add.graphics().setDepth(y - 40);
    g.fillStyle(0x132119, 0.45);
    g.fillEllipse(x + 4, y + 12, 100, 42);
    g.fillStyle(0x52604a);
    g.fillRoundedRect(x - 36, y - 30, 72, 40, 5);
    g.lineStyle(2, 0x99a27d, 0.6);
    g.strokeRoundedRect(x - 59, y - 45, 118, 62, 5);
    g.fillStyle(0x293629);
    g.fillRect(x - 23, y - 20, 46, 32);
    this.add
      .image(x, y - 13, "shelterObjects", "hatch")
      .setScale(0.95)
      .setOrigin(0.5, 0.5)
      .setDepth(y + 3)
      .setTint(0xb4be94);
    this.add.circle(x + 30, y - 23, 3, 0xa8c077).setDepth(y + 8);
    this.add
      .text(x, y + 29, `BUNKER ${SHELTERS.find((s) => s.id === id)!.label}`, {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#d3dcb2",
        backgroundColor: "#1b2d20cc",
        padding: { x: 8, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(y + 9);
    this.block(x, y - 31, 74, 12);
  }
  spawnLoot() {
    const rng = randomGenerator(this.state.seed),
      choices: ItemId[] = [
        "food",
        "water",
        "wood",
        "scrap",
        "cloth",
        "ammo",
        "bandage",
        "spoiled",
      ];
    for (let i = 0; i < 16; i++) {
      let x = 240 + rng() * (WORLD.width - 480),
        y = 240 + rng() * (WORLD.height - 480);
      let tries = 0;
      while (
        (this.isBlocked(x, y) ||
          isLake(x, y) ||
          isOcean(x, y) ||
          onRoad(x, y, 18) ||
          isRadioactive(x, y)) &&
        tries++ < 40
      ) {
        x = 240 + rng() * (WORLD.width - 480);
        y = 240 + rng() * (WORLD.height - 480);
      }
      const id = "loot-" + i,
        item = choices[i % choices.length];
      if (!this.state.collected.includes(id))
        this.drawLoot({
          id,
          x,
          y,
          item,
          count: item === "ammo" ? 6 : 1,
          durability: 55 + rng() * 45,
        });
    }
    this.state.dropped.forEach((d) => this.drawLoot(d));
  }
  drawLoot(d: DroppedItem) {
    const sprite = this.add
      .image(d.x, d.y, ITEMS[d.item].icon)
      .setDisplaySize(
        d.item === "weapon" ? 24 : 16,
        d.item === "weapon" ? 17 : 18,
      )
      .setDepth(d.y + 2)
      .setTint(0x979e85)
      .setVisible(!d.shelter || d.shelter === this.roomId());
    this.loot.push({ ...d, sprite });
    this.session.resources.set(d.id, { ...d });
  }
  addContainer(
    id: string,
    x: number,
    y: number,
    name: string,
    shelter?: string,
  ) {
    if (!this.containers.some((c) => c.id === id))
      this.containers.push({ id, x, y, name, shelter });
    if (!this.state.containers[id]) {
      const rng = randomGenerator(
          this.state.seed + [...id].reduce((n, c) => n + c.charCodeAt(0), 0),
        ),
        choices: ItemId[] =
          id.startsWith("desk") ||
          id.startsWith("house") ||
          id.startsWith("fridge")
            ? [
                "water",
                "matches",
                "food",
                ...(Object.keys(NUTRITION).filter(
                  (id) => !["cookedMeat", "bakedPotato"].includes(id),
                ) as ItemId[]),
              ]
            : [
                "cloth",
                "scrap",
                "ammo",
                "wood",
                "bandage",
                "medicine",
                "dirtyWater",
                "battery",
                "wire",
                "rope",
                "leather",
                "nails",
                "tape",
                "vest",
                "gasMask",
                "fuel",
                "lighter",
                "grenade",
                "smoke",
                "note",
                "nightVision",
                "musicRadio",
                "mask",
                "rifle",
                "sniper",
                "shotgun",
              ];
      const contents = emptyInventory();
      for (let i = 0; i < 2 + Math.floor(rng() * 3); i++) {
        const item = choices[Math.floor(rng() * choices.length)];
        contents[item] += item === "ammo" ? 6 : 1;
      }
      if (id.startsWith("locker") && rng() > 0.4) contents.backpack2 = 1;
      if (id.startsWith("car") && rng() > 0.8) contents.backpack3 = 1;
      this.state.containers[id] = contents;
    }
  }
  collectContainer(item: ItemId) {
    const c = this.containers.find((c) => c.id === this.containerId);
    if (!c || Math.hypot(this.player.x - c.x, this.player.y - c.y) > 76)
      return "Aproxime-se do móvel.";
    const n = this.state.containers[c.id][item];
    if (n <= 0) return "Esse móvel está vazio.";
    const count = item === "ammo" ? Math.min(n, 6) : 1,
      id = c.id + ":" + item;
    this.session.resources.set(id, {
      id,
      x: c.x,
      y: c.y,
      item,
      count,
      durability: item === "weapon" ? 65 : 90,
      container: c.id,
      shelter: c.shelter,
    });
    return this.command({ type: "collect", target: id });
  }
  isBlocked(x: number, y: number) {
    return this.obstacles.getChildren().some((o) => {
      const b = (o as Phaser.GameObjects.Rectangle)
        .body as Phaser.Physics.Arcade.StaticBody;
      return (
        x > b.left - 22 &&
        x < b.right + 22 &&
        y > b.top - 22 &&
        y < b.bottom + 22
      );
    });
  }
  spawnZombies(wave = 0) {
    const random = randomGenerator(this.state.seed + 937 + wave * 293);
    // Keep endless sessions bounded; the wave cadence still sustains pressure.
    const alive = [...this.session.actors.values()].filter(
      (a) => a.alive,
    ).length;
    for (
      let i = 0;
      i <
      (wave
        ? Math.min(8, 4 + Math.floor(wave / 3), Math.max(0, 48 - alive))
        : 24);
      i++
    ) {
      const id = wave ? `zombie-w${wave}-${i}` : `zombie-${i}`;
      let x = 180 + random() * (WORLD.width - 360),
        y = 180 + random() * (WORLD.height - 360),
        tries = 0;
      const invalidSpawn = () =>
        this.isBlocked(x, y) ||
        isOcean(x, y) ||
        isLake(x, y) ||
        Math.hypot(x - this.player.x, y - this.player.y) < 440 ||
        SHELTERS.some((s) => Math.hypot(x - s.x, y - s.y) < 150);
      while (
        invalidSpawn() &&
        tries++ < 50
      ) {
        x = 180 + random() * (WORLD.width - 360);
        y = 180 + random() * (WORLD.height - 360);
      }
      if (
        this.state.killed.includes(id) || invalidSpawn()
      )
        continue;
      const kinds: ZombieInfo["kind"][] = [
          "walker",
          "runner",
          "lurker",
          "shambler1",
          "shambler2",
          "shambler3",
          "shambler4",
        ],
        kind = kinds[i % kinds.length];
      const stats: Record<
          ZombieInfo["kind"],
          { hp: number; speed: number; damage: number }
        > = {
          walker: { hp: 68, speed: 54, damage: 9 },
          runner: { hp: 55, speed: 84, damage: 8 },
          lurker: { hp: 85, speed: 43, damage: 13 },
          shambler1: { hp: 74, speed: 48, damage: 10 },
          shambler2: { hp: 90, speed: 40, damage: 14 },
          shambler3: { hp: 62, speed: 59, damage: 9 },
          shambler4: { hp: 78, speed: 51, damage: 11 },
        },
        stat = stats[kind],
        maxHp = stat.hp,
        bar = this.add.graphics();
      const info: ZombieInfo = {
        diedAt: 0,
        maxHp,
        targetX: x,
        targetY: y,
        wanderAt: i * 0.4,
        attackUntil: 0,
        bar,
        id,
        kind,
        hp: stat.hp,
        speed: stat.speed,
        damage: stat.damage,
        lastAttack: -10,
        homeX: x,
        homeY: y,
        alertUntil: 0,
      };
      const modern = kind.startsWith("shambler"),
        z = this.physics.add
          .sprite(x, y, `${kind}-Idle`)
          .setScale(modern ? 0.56 : 0.75)
          .setOrigin(0.5, 0.83)
          .setDepth(y)
          .setData("info", info);
      z.body!.setSize(24, 24);
      z.body!.setOffset(modern ? 52 : 35, modern ? 78 : 52);
      z.setCollideWorldBounds(true);
      z.play(`${kind}-Idle`);
      this.zombies.add(z);
      this.session.actors.set(id, { id, x, y, hp: info.hp, kind, alive: true });
      if (kind === "lurker") z.setAlpha(0.8).setTint(0x819566);
    }
  }
  setPaused(paused: boolean) {
    this.paused = paused;
    this.aiming = false;
    this.cursorMode();
    this.pointerDown = false;
    this.pendingShot = false;
    this.pendingTouchShot = false;
    this.pendingActions.clear();
    this.touchKeys.clear();
    Object.values(this.keys || {}).forEach((k) => k.reset());
    if (paused) {
      this.stopSpatial();
      this.physics.pause();
      this.anims.pauseAll();
      this.tweens.pauseAll();
    } else if (this.playing && !this.finished) {
      this.physics.resume();
      this.anims.resumeAll();
      this.tweens.resumeAll();
    }
    if (this.nightSound?.isPlaying)
      (this.nightSound as Phaser.Sound.WebAudioSound).setVolume(
        paused ? 0 : this.settings.effects * 0.1,
      );
    if (this.score?.isPlaying)
      (this.score as Phaser.Sound.WebAudioSound).setVolume(
        this.musicVolume() * (paused ? 0.4 : 1),
      );
    if (paused) {
      this.setLoopVolume(this.forestAmbience, 0);
      this.setLoopVolume(this.seaAmbience, 0);
      this.setLoopVolume(this.campfireAmbience, 0);
    }
  }
  publish() {
    this.ui.update(
      this.state,
      this.currentShelter,
      this.nearbyCamp,
      this.aim(),
    );
  }
  save() {
    if (!this.playing || this.gameMode === "story") return false;
    this.syncPosition();
    return writeSave(this.state);
  }
  syncPosition() {
    if (this.gameMode === "story") return;
    if (!this.inside() && this.player) {
      this.state.x = clamp(this.player.x, 20, WORLD.width - 20);
      this.state.y = clamp(this.player.y, 20, WORLD.height - 20);
    } else if (this.inside()) {
      this.state.x = this.exterior.x;
      this.state.y = this.exterior.y;
    }
  }
  quit() {
    this.save();
    this.playing = false;
    this.setPaused(true);
    for (const sound of this.fadingScores) {
      this.tweens.killTweensOf(sound);
      sound.stop();
      sound.destroy();
    }
    this.fadingScores = [];
    this.wind?.stop();
    this.forestAmbience?.stop();
    this.seaAmbience?.stop();
    this.campfireAmbience?.stop();
    this.storyMusic?.stop();
    this.storyMusic?.destroy();
    this.storyMusic = undefined;
    this.radiationSound?.stop();
    this.heartbeatSound?.stop();
    this.stopSpatial();
    this.tweens.resumeAll();
    this.nightSound?.stop();
    this.switchMusic("menu-music");
    this.configureAudio(this.ui.settings);
    this.scale.off("resize", this.resize, this);
  }
  command(action: Action) {
    if (!this.playing || this.finished) return "Inicie uma partida.";
    this.session.room = this.roomId();
    this.session.nearCamp = this.nearbyCamp;
    this.state.x = this.player?.x ?? this.state.x;
    this.state.y = this.player?.y ?? this.state.y;
    const r = this.session.dispatch({
      actorId: this.session.playerId,
      sequence: ++this.sequence,
      action,
    });
    if (r.drop) this.drawLoot(r.drop);
    this.syncPosition();
    this.publish();
    return r.message;
  }
  drop(uid: string) {
    return this.command({ type: "drop", uid });
  }
  use(id: ItemId, uid?: string) {
    if (isWeapon(id)) {
      const gun = this.state.grid.find((g) => g.item === id);
      if (!gun) return "Você não tem essa arma.";
      const message = this.command({ type: "equipWeapon", uid: gun.uid });
      this.sfx("equip", 0.8);
      return message;
    }
    const before = this.state.inventory[id],
      message = this.command({ type: "use", item: id, uid });
    if (this.state.inventory[id] < before) {
      if (id === "water" || id === "dirtyWater") this.sfx("drink-real", 0.45);
      if (id === "smoke") {
        this.smokeUntil = this.state.elapsed + 8;
        this.noiseUntil = 0;
      }
      if (id === "grenade") this.throwGrenade();
      if (id === "musicRadio") {
        this.sfx("radio-bip", 0.3);
        this.lastAmbience = -10;
        this.musicOverride = ["score", "score-dark", "score-ruins"][
          (Math.max(
            0,
            ["score", "score-dark", "score-ruins"].indexOf(this.musicKey),
          ) +
            1) %
            3
        ];
      }
      if (this.paused) this.tweens.pauseAll();
    }
    return message;
  }
  craftItem(id: RecipeId) {
    const m = this.command({ type: "craft", recipe: id });
    this.drawCamps();
    this.save();
    return m;
  }
  rest() {
    const m = this.command({ type: "rest" });
    this.save();
    return m;
  }
  repair() {
    const m = this.command({ type: "radio" });
    this.save();
    return m;
  }
  transfer(id: ItemId, deposit: boolean) {
    return this.command({ type: "transfer", item: id, deposit });
  }
  cursorMode() {
    const hidden = this.playing && !this.paused && !this.cursorReleased;
    this.game.canvas.style.cursor = hidden ? "none" : "default";
    document.body.classList.toggle("playing-cursor-hidden", hidden);
    document.getElementById("crosshair")!.style.display = "none";
    if (!hidden && document.pointerLockElement === this.game.canvas)
      document.exitPointerLock();
  }
  toggleCursor() {
    this.cursorReleased = !this.cursorReleased;
    this.cursorMode();
    if (!this.cursorReleased)
      this.game.canvas.requestPointerLock?.()?.catch(() => {});
    this.ui.toast(
      this.cursorReleased
        ? "Mouse livre. U para ocultar e retomar a mira."
        : "Mouse oculto. U para liberar.",
    );
  }
  animatePlayer(action: string, angle?: number) {
    if (angle !== undefined) this.facing = directionRow(angle);
    this.player
      .setFlipX(false)
      .play("player-" + action + "-" + this.facing, true);
  }
  configureAudio(settings: Settings) {
    if (this.score) this.tweens.killTweensOf(this.score);
    this.settings = { ...settings };
    this.audio.configure(settings);
    if (this.score && !this.score.isPlaying && this.audio.ready()) this.score.play();
    if (this.playing && settings.sound && this.audio.ready()) {
      for (const loop of [
        this.wind,
        this.forestAmbience,
        this.seaAmbience,
        this.campfireAmbience,
      ])
        if (loop && !loop.isPlaying) loop.play();
    }
    const label = document.getElementById("menu-audio");
    if (label)
      label.textContent = !settings.sound
        ? "ÁUDIO DESLIGADO"
        : this.sound instanceof Phaser.Sound.WebAudioSoundManager &&
            this.sound.context.state !== "running"
          ? "ATIVAR ÁUDIO"
          : "ÁUDIO ATIVO";
    (this.score as Phaser.Sound.WebAudioSound | undefined)?.setVolume(
      this.musicVolume() * (this.playing && this.paused ? 0.4 : 1),
    );
    (this.wind as Phaser.Sound.WebAudioSound | undefined)?.setVolume(
      this.playing && this.paused ? 0 : settings.effects * 0.09,
    );
    if (this.nightSound?.isPlaying)
      (this.nightSound as Phaser.Sound.WebAudioSound).setVolume(
        this.paused ? 0 : settings.effects * 0.15,
      );
  }
  setLoopVolume(sound: Phaser.Sound.BaseSound | undefined, target: number) {
    if (!sound) return;
    const loop = sound as
      | Phaser.Sound.WebAudioSound
      | Phaser.Sound.HTML5AudioSound;
    loop.setVolume(Phaser.Math.Linear(loop.volume, target, 0.12));
  }
  musicVolume(key = this.musicKey) {
    return this.settings.music * (key === "menu-music" ? 0.42 : 0.34);
  }
  sfx(key: string, volume = 1) {
    const gain: Record<string, number> = {
      reload: 0.28,
      equip: 0.12,
      "door-real": 0.12,
      growl: 0.7,
      hit: 0.65,
    };
    this.audio.effect(
      key,
      volume * (gain[key] ?? 1),
      1,
    );
  }
  stopSpatial() {
    for (const voice of this.spatialVoices) {
      voice.stop();
      voice.destroy();
    }
    this.spatialVoices = [];
  }
  updateSpatial() {
    if (this.sound instanceof Phaser.Sound.WebAudioSoundManager)
      this.sound.setListenerPosition(this.player.x, this.player.y);
    for (let i = this.casingQueue.length - 1; i >= 0; i--)
      if (this.state.elapsed >= this.casingQueue[i].at) {
        const c = this.casingQueue.splice(i, 1)[0];
        this.spatialSfx("casing", c.x, c.y, 0.18);
      }
  }
  spatialSfx(key: string, x: number, y: number, volume: number) {
    if (
      !this.settings.sound ||
      this.spatialVoices.length >= 16 ||
      !this.cache.audio.exists(key)
    )
      return;
    const distance = Math.hypot(x - this.player.x, y - this.player.y);
    if (distance >= 400) return;
    const sound = this.sound.add(key, {
      volume: Math.min(1, this.settings.effects * volume),
      rate: 1,
      source: {
        x,
        y,
        z: 0,
        panningModel: "HRTF",
        distanceModel: "linear",
        refDistance: 35,
        maxDistance: 400,
        rolloffFactor: 1,
      },
    });
    if (!(this.sound instanceof Phaser.Sound.WebAudioSoundManager))
      (sound as Phaser.Sound.HTML5AudioSound).setVolume(
        this.settings.effects * volume * spatialGain(distance),
      );
    this.spatialVoices.push(sound);
    sound.once("complete", () => {
      this.spatialVoices = this.spatialVoices.filter((s) => s !== sound);
      sound.destroy();
    });
    if (!sound.play()) {
      this.spatialVoices = this.spatialVoices.filter((s) => s !== sound);
      sound.destroy();
    }
  }
  presentProjectile(event: ProjectileAudioEvent) {
    const listenerId = this.session.playerId,
      cue = projectileCue(event, this.player, listenerId),
      key = event.id + ":" + cue;
    if (!cue || this.heardProjectiles.has(key)) return;
    this.heardProjectiles.add(key);
    if (this.heardProjectiles.size > 256)
      this.heardProjectiles.delete(
        this.heardProjectiles.values().next().value!,
      );
    const dx = event.to.x - event.from.x,
      dy = event.to.y - event.from.y,
      len = dx * dx + dy * dy,
      t = len
        ? clamp(
            ((this.player.x - event.from.x) * dx +
              (this.player.y - event.from.y) * dy) /
              len,
            0,
            1,
          )
        : 1;
    const position =
      cue === "flyby"
        ? { x: event.from.x + dx * t, y: event.from.y + dy * t }
        : event.to;
    this.spatialSfx(cue, position.x, position.y, 0.3);
  }
  key(name: string, touch?: string) {
    return this.keys[name]?.isDown || !!(touch && this.touchKeys.has(touch));
  }
  once(name: string, touch?: string) {
    const t = !!(touch && this.touchKeys.has(touch));
    if (t) this.touchKeys.delete(touch!);
    const native = Phaser.Input.Keyboard.JustDown(this.keys[name]);
    const pending = this.pendingActions.delete(name);
    return native || pending || t;
  }
  update(_time: number, delta: number) {
    if (!this.playing || this.paused || this.finished || !this.player) return;
    const dt = Math.min(delta / 1000, 0.075),
      now = this.state.elapsed;
    const dx =
      (this.key("D", "right") || this.key("RIGHT") ? 1 : 0) -
      (this.key("A", "left") || this.key("LEFT") ? 1 : 0);
    const dy =
      (this.key("S", "down") || this.key("DOWN") ? 1 : 0) -
      (this.key("W", "up") || this.key("UP") ? 1 : 0);
    const moving = dx !== 0 || dy !== 0;
    if (this.once("CTRL")) this.crouching = !this.crouching;
    this.touchKeys.delete("crouch");
    this.blocking = this.key("Q", "block") && this.state.vitals.stamina >= 8;
    if (this.state.vitals.stamina < 2) this.sprintLocked = true;
    if (this.state.vitals.stamina > 25) this.sprintLocked = false;
    const sprint =
      !this.crouching &&
      !this.blocking &&
      now >= this.shootingUntil &&
      moving &&
      this.key("SHIFT", "sprint") &&
      !this.sprintLocked &&
      this.state.vitals.stamina > 0 &&
      this.state.vitals.infection < 80;
    const wet =
      this.gameMode === "survival" &&
      !this.inside() &&
      (isOcean(this.player.x, this.player.y) ||
        isLake(this.player.x, this.player.y));
    const speed =
      (this.crouching ? 58 : sprint ? 180 : 112) *
      (wet ? 0.48 : 1) *
      (this.state.vitals.infection >= 60 ? 0.8 : 1) *
      (now < this.shootingUntil ? 0.28 : this.blocking ? 0.55 : 1);
    const length = Math.hypot(dx, dy) || 1;
    this.player
      .setVelocity((dx / length) * speed, (dy / length) * speed)
      .setDepth(this.player.y);
    const angle = this.aim(
      this.scale.width < 600 && this.touchKeys.has("shoot"),
    );
    this.facing = directionRow(angle);
    const relative = moving
      ? Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - this.aim())
      : 0;
    const locomotion = this.crouching
      ? moving
        ? "CrouchRun"
        : "CrouchIdle"
      : moving
        ? this.aiming
          ? Math.abs(relative) > 2.3
            ? "RunBackwards"
            : relative < -0.7
              ? "StrafeLeft"
              : relative > 0.7
                ? "StrafeRight"
                : sprint
                  ? "Run"
                  : "Walk"
          : sprint
            ? "Run"
            : "Walk"
        : "Idle";
    if (now >= this.actionUntil)
      this.animatePlayer(this.blocking ? "Guard" : locomotion, angle);
    else
      this.animatePlayer(
        now < this.shootingUntil
          ? this.crouching
            ? "CrouchIdle"
            : "Idle2"
          : "Punch",
        angle,
      );
    const targetZoom = this.inside()
      ? this.interiorZoom()
      : this.zoom() * (this.aiming ? 1.18 : 1);
    const camera = this.cameras.main,
      lookDistance = this.aiming ? 145 : 0,
      lookX = -Math.cos(angle) * lookDistance,
      lookY = -Math.sin(angle) * lookDistance;
    camera
      .setZoom(Phaser.Math.Linear(camera.zoom, targetZoom, 0.12))
      .setFollowOffset(
        Phaser.Math.Linear(camera.followOffset.x, lookX, 0.14),
        Phaser.Math.Linear(camera.followOffset.y, lookY, 0.14),
      );
    if (this.once("U")) this.toggleCursor();
    if (this.once("G")) {
      const uid = this.ui.selectedUid || this.state.hotbar[this.selectedSlot];
      if (uid) this.ui.toast(this.drop(uid));
      else this.ui.toast("Selecione um item no inventário ou na hotbar.");
    }
    this.drawReticle();
    if (moving && now - this.lastStep > (sprint ? 0.26 : 0.43)) {
      const phase = Math.floor(now * 4) % 2 ? "1" : "2",
        surface = wet
          ? "water"
          : this.inside()
            ? "wood"
            : onRoad(this.player.x, this.player.y)
              ? "tile"
            : "grass";
      this.sfx(
        `${surface}-step-${phase}`,
        this.crouching ? 0.12 : sprint ? 0.72 : 0.52,
      );
      this.lastStep = now;
    }
    if (sprint) {
      this.noiseUntil = now + 0.4;
      this.noiseRadius = 150;
    }
    this.safe =
      this.gameMode === "story" ||
      this.inside() ||
      SHELTERS.some(
        (s) =>
          this.state.shelters[s.id].barricaded &&
          Math.hypot(this.player.x - s.x, this.player.y - s.y) < 135,
      ) ||
      this.state.camps.some(
        (c) => Math.hypot(this.player.x - c.x, this.player.y - c.y) < 64,
      );
    this.nearbyCamp =
      !this.inside() &&
      this.state.camps.some(
        (c) => Math.hypot(this.player.x - c.x, this.player.y - c.y) < 75,
      );
    this.session.room = this.roomId();
    this.session.dispatch({
      actorId: this.session.playerId,
      sequence: ++this.sequence,
      action: {
        type: "move",
        intent: {
          x: dx,
          y: dy,
          sprint,
          crouch: this.crouching,
          blocking: this.blocking,
          aim: angle,
        },
      },
    });
    this.session.advance(dt);
    if (this.gameMode === "story") {
      this.state.vitals.health = 100;
      this.state.vitals.hunger = 100;
      this.state.vitals.thirst = 100;
      this.state.vitals.infection = 0;
      this.state.vitals.stamina = 100;
    }
    if (
      this.gameMode === "survival" &&
      !this.inside() &&
      isDeepOcean(this.player.x, this.player.y)
    ) {
      this.state.vitals.health = 0;
      this.ui.toast("Você se afastou da costa e se afogou.");
    } else if (wet) {
      this.state.vitals.stamina = clamp(this.state.vitals.stamina - dt * 12);
      if (this.state.vitals.stamina <= 0) this.session.damagePlayer(dt * 12);
      if (now - this.lastWaveWarning > 12) {
        this.lastWaveWarning = now;
        this.ui.toast("Água profunda adiante. Volte para a margem.");
      }
    }
    if (this.gameMode === "story") {
      this.updateStoryAudio();
      if (
        !this.storyBorderShown &&
        Math.hypot(
          this.player.x - STORY_LOBBY.x,
          this.player.y - STORY_LOBBY.y,
        ) > STORY_LOBBY.radius
      ) {
        this.storyBorderShown = true;
        this.ui.toast(
          "O modo História continuará daqui em uma próxima atualização.",
        );
      }
    }
    if (
      this.gameMode === "survival" &&
      !this.inside() &&
      isRadioactive(this.player.x, this.player.y)
    ) {
      this.state.vitals.infection = clamp(
        this.state.vitals.infection +
          dt * 0.42 * (1 - (this.state.gear?.mask || 0)),
      );
      if (Math.floor(now * 2) % 2 === 0)
        this.state.vitals.health = clamp(this.state.vitals.health - dt * 0.08);
    }
    this.reloadUntil = this.session.reloadAt;
    if (this.once("R")) this.reload();
    if (this.once("F", "melee")) this.melee();
    if (
      (this.pointerDown || this.pendingShot || this.touchKeys.has("shoot")) &&
      !this.inside()
    )
      this.shoot(this.touchKeys.has("shoot") || this.pendingTouchShot);
    this.pendingShot = false;
    this.pendingTouchShot = false;
    for (const [i, key] of ["ONE", "TWO", "THREE", "FOUR", "FIVE"].entries())
      if (this.once(key)) {
        this.selectedSlot = i;
        const item = this.state.grid.find(
          (g) => g.uid === this.state.hotbar[i],
        );
        if (item) {
          this.ui.selectedUid = item.uid;
          if (isWeapon(item.item)) this.ui.toast(this.use(item.item, item.uid));
          else if (item.item.startsWith("backpack"))
            this.ui.toast(this.command({ type: "pack", uid: item.uid }));
          else this.ui.toast(this.use(item.item, item.uid));
        }
      }
    this.findInteraction();
    if (this.once("E", "interact")) this.interact();
    if (
      this.gameMode === "survival" &&
      !this.inside() &&
      Math.floor(this.state.elapsed / 360) > this.wave
    ) {
      this.wave = Math.floor(this.state.elapsed / 360);
      this.spawnZombies(this.wave);
      this.ui.toast("Mais infectados chegaram à ilha.");
    }
    if (!this.inside()) this.updateZombies();
    else
      this.zombies.getChildren().forEach((o) => {
        const z = o as Phaser.Physics.Arcade.Sprite;
        z.setVelocity(0);
        (z.getData("info") as ZombieInfo).bar.setVisible(false);
      });
    this.bullets.getChildren().forEach((o) => {
      const b = o as Phaser.Physics.Arcade.Sprite;
      if (b.active && now - b.getData("born") > 1.15) b.disableBody(true, true);
    });
    this.updateSpatial();
    this.updateFruit();
    this.updateTracers();
    this.loot.forEach((l) => {
      const r = this.session.resources.get(l.id);
      if (r) {
        l.durability = r.durability;
        if (l.item !== r.item) {
          l.item = r.item;
          l.sprite.setTexture(ITEMS[r.item].icon).setDisplaySize(16, 18);
        }
      }
      l.sprite.setVisible(
        l.shelter ? l.shelter === this.roomId() : !this.inside(),
      );
    });
    this.player.setTint(now < this.hurtUntil ? 0xe4a386 : 0xc1c4b5);
    this.updateAmbience();
    this.drawDarkness();
    this.syncPosition();
    this.occluders.forEach((image) =>
      image.setAlpha(
        !this.inside() &&
          image.y > this.player.y &&
          image.getBounds().contains(this.player.x, this.player.y - 20)
          ? 0.32
          : 1,
      ),
    );
    if (this.state.vitals.health <= 0) {
      this.finished = true;
      this.state.vitals.health = 0;
      this.save();
      this.publish();
      this.ui.finish();
      return;
    }
    if (now - this.lastPublish > 0.15) {
      this.publish();
      this.lastPublish = now;
    }
    if (now - this.lastSave > 15) {
      this.save();
      this.lastSave = now;
    }
  }
  updateZombies() {
    const now = this.state.elapsed,
      night = isNight(this.state.minutes);
    this.zombies.getChildren().forEach((o) => {
      const z = o as Phaser.Physics.Arcade.Sprite,
        info = z.getData("info") as ZombieInfo;
      if (info.hp <= 0) {
        if (now - info.diedAt > 45) {
          this.session.actors.delete(info.id);
          z.destroy();
        }
        return;
      }
      if (!z.active) return;
      const dist = Math.hypot(z.x - this.player.x, z.y - this.player.y);
      let detect =
        (night ? 260 : 200) *
        (this.crouching ? 0.12 : 1) *
        (now < this.smokeUntil ? 0.08 : 1);
      if (info.kind === "lurker") detect *= 0.65;
      if (this.noiseUntil > now) detect = Math.max(detect, this.noiseRadius);
      const clearSight = this.lineOfSight(
        z.x,
        z.y - 12,
        this.player.x,
        this.player.y - 12,
      );
      if (dist < detect && !this.safe && (clearSight || this.noiseUntil > now))
        info.alertUntil = now + (this.crouching ? 1.2 : 3);
      if (this.crouching && dist > detect && this.noiseUntil < now)
        info.alertUntil = Math.min(info.alertUntil, now + 1.2);
      const chase = info.alertUntil > now && !this.safe;
      if (now < info.attackUntil) z.setVelocity(0);
      else if (chase && dist < 45) {
        z.setVelocity(0);
        if (now - info.lastAttack > 1.6) {
          info.lastAttack = now;
          info.attackUntil = now + 0.55;
          z.play(
            info.kind +
              "-" +
              (info.kind.startsWith("shambler") ? "Attack" : "Attack_1"),
          );
          this.spatialSfx("zombie-attack", z.x, z.y, 0.22);
          this.hurt(info.damage, true);
        } else z.play(info.kind + "-Idle", true);
      } else if (chase) {
        this.physics.moveToObject(
          z,
          this.player,
          info.speed *
            (night ? 1.15 : 1) *
            (1 + Math.min(0.3, this.wave * 0.02)),
        );
        z.play(
          info.kind + "-" + (info.kind === "runner" ? "Run" : "Walk"),
          true,
        );
        if (Math.abs(this.player.x - z.x) > 7) z.setFlipX(this.player.x < z.x);
      } else {
        if (now >= info.wanderAt) {
          const rng = randomGenerator(
            this.state.seed +
              Math.floor(now / 5) * 131 +
              [...info.id].reduce((n, c) => n + c.charCodeAt(0), 0),
          );
          info.targetX = info.homeX + (rng() - 0.5) * 100;
          info.targetY = info.homeY + (rng() - 0.5) * 70;
          info.wanderAt = now + 5;
        }
        if (Math.hypot(z.x - info.targetX, z.y - info.targetY) > 12) {
          this.physics.moveTo(z, info.targetX, info.targetY, info.speed * 0.3);
          z.play(info.kind + "-Walk", true);
          if (Math.abs(info.targetX - z.x) > 7) z.setFlipX(info.targetX < z.x);
        } else {
          z.setVelocity(0);
          z.play(info.kind + "-Idle", true);
        }
      }
      const actor = this.session.actors.get(info.id);
      if (actor) {
        actor.x = z.x;
        actor.y = z.y;
      }
      info.bar
        .setVisible(this.canSee(z.x, z.y - 20))
        .setPosition(z.x, z.y - 52)
        .setDepth(z.y + 100);
      info.bar
        .clear()
        .fillStyle(0x101510, 0.9)
        .fillRoundedRect(-19, 0, 38, 6, 2)
        .fillStyle(info.hp / info.maxHp < 0.35 ? 0xbb5946 : 0x839468)
        .fillRect(-17, 2, (34 * info.hp) / info.maxHp, 2);
      if (chase && dist < 220 && now - this.lastGrowl > 5) {
        const voice = [
          "zombie-voice",
          "zombie-growl",
          "zombie-screech",
          "zombie-breath",
        ][Math.floor(now) % 4];
        this.spatialSfx(voice, z.x, z.y, 0.18 * (clearSight ? 1 : 0.25));
        this.lastGrowl = now;
      }
      if (
        dist < 400 &&
        (z.body as Body).velocity.length() > 5 &&
        now - (info.stepAt ?? -10) > 0.52
      ) {
        const phase = Math.floor(now * 10) % 2 ? "1" : "2",
          stepKey =
            info.kind === "runner"
              ? `wild-step-${phase}`
              : `grass-step-${phase}`;
        this.spatialSfx(stepKey, z.x, z.y, 0.48 * (clearSight ? 1 : 0.28));
        info.stepAt = now;
      }
      z.setDepth(z.y);
    });
  }
  hurt(amount: number, melee = false) {
    if (this.safe || this.state.elapsed < this.hurtUntil) return;
    const blocked = this.session.damagePlayer(
      amount,
      this.session.playerId,
      melee,
    );
    this.hurtUntil = this.state.elapsed + 0.6;
    this.sfx(
      blocked
        ? "hit"
        : Math.floor(this.state.elapsed * 10) % 2
          ? "player-hit-1"
          : "player-hit-2",
      blocked ? 0.28 : 0.68,
    );
    if (!blocked) this.cameras.main.shake(100, 0.003);
    else this.ui.toast("Ataque bloqueado.");
  }
  aimPoint(touch = false) {
    if (touch) {
      let nearest: Phaser.Physics.Arcade.Sprite | undefined,
        best = 450;
      this.zombies.getChildren().forEach((o) => {
        const z = o as Phaser.Physics.Arcade.Sprite,
          info = z.getData("info") as ZombieInfo,
          d = Math.hypot(z.x - this.player.x, z.y - this.player.y);
        if (z.active && info.hp > 0 && d < best) {
          best = d;
          nearest = z;
        }
      });
      if (nearest) return new Phaser.Math.Vector2(nearest.x, nearest.y - 12);
      const angle = this.facing * (Math.PI / 4);
      return new Phaser.Math.Vector2(
        this.player.x + Math.cos(angle) * 320,
        this.player.y - 12 + Math.sin(angle) * 320,
      );
    }
    const p = this.input.activePointer,
      world =
        document.pointerLockElement === this.game.canvas
          ? this.cameras.main.getWorldPoint(this.aimX, this.aimY)
          : (p.positionToCamera(this.cameras.main) as Phaser.Math.Vector2);
    return new Phaser.Math.Vector2(world.x, world.y);
  }
  aim(touch = false) {
    const world = this.aimPoint(touch);
    return Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y - 12,
      world.x,
      world.y,
    );
  }
  shoot(touch = false) {
    if (this.gameMode === "story") {
      if (this.state.elapsed - this.lastShot > 2) {
        this.ui.toast("O lobby de História é uma zona sem combate.");
        this.lastShot = this.state.elapsed;
      }
      return;
    }
    const spec = WEAPONS[weaponId(this.state)],
      now = this.state.elapsed,
      target = this.aimPoint(touch),
      poseAngle = Phaser.Math.Angle.Between(
        this.player.x,
        this.player.y - 12,
        target.x,
        target.y,
      ),
      muzzle = this.muzzlePoint(poseAngle),
      angle =
        Phaser.Math.Distance.Between(muzzle.x, muzzle.y, target.x, target.y) > 8
          ? Phaser.Math.Angle.Between(muzzle.x, muzzle.y, target.x, target.y)
          : poseAngle,
      b = this.bullets.get(
        muzzle.x,
        muzzle.y,
        "mote",
      ) as Phaser.Physics.Arcade.Sprite | null;
    // Resource consumption belongs to a shot that can actually be presented.
    if (!b) return;
    const r = this.session.dispatch({
      actorId: this.session.playerId,
      sequence: ++this.sequence,
      action: { type: "fire" },
    });
    if (!r.accepted) {
      b.disableBody(true, true);
      if (r.message && this.state.elapsed - this.lastShot > 2) {
        this.ui.toast(r.message);
        this.lastShot = this.state.elapsed;
      }
      if (this.state.ammo <= 0) this.reload();
      return;
    }
    b.enableBody(true, muzzle.x, muzzle.y, true, true)
      .setAlpha(0)
      .setScale(1)
      .setOrigin(0.5);
    b.setData("born", now)
      .setData("ownerId", this.session.playerId)
      .setData("projectileId", this.session.playerId + ":" + this.sequence)
      .setData("damage", spec.damage)
      .setData("angle", angle)
      .setData("muzzle", muzzle)
      .setData("shooter", { x: this.player.x, y: this.player.y })
      .setDepth(8000);
    (b.body as Body).setSize(4, 4).setOffset(0, 0);
    this.physics.velocityFromRotation(
      angle,
      spec.speed,
      (b.body as Body).velocity,
    );
    this.animatePlayer(this.crouching ? "CrouchIdle" : "Idle2", poseAngle);
    this.actionUntil = now + 0.18;
    this.shootingUntil = now + 0.48;
    this.noiseUntil = now + 1.5;
    this.noiseRadius = 450;
    this.audio.effect(spec.shot, 0.82, spec.rate);
    this.casingQueue.push({
      at: now + 0.27,
      x: this.player.x,
      y: this.player.y,
    });
  }

  reload() {
    const message = this.command({ type: "reload" });
    if (message) {
      this.ui.toast(message);
      if (this.session.reloadAt)
        this.sfx(WEAPONS[weaponId(this.state)].reloadSound, 0.65);
    }
  }
  melee() {
    if (this.gameMode === "story") {
      this.ui.toast("Não há combate no lobby de História.");
      return;
    }
    const r = this.session.dispatch({
      actorId: this.session.playerId,
      sequence: ++this.sequence,
      action: { type: "punch" },
    });
    if (!r.accepted) return;
    const angle = this.aim(this.touchKeys.has("melee"));
    this.animatePlayer("Punch", angle);
    this.actionUntil = this.state.elapsed + 0.5;
    this.noiseUntil = this.state.elapsed + 0.5;
    this.noiseRadius = 110;
    const fist = this.add
      .circle(
        this.player.x + Math.cos(angle) * 28,
        this.player.y - 12 + Math.sin(angle) * 28,
        4,
        0xb09c76,
        0.65,
      )
      .setDepth(8000);
    this.tweens.add({
      targets: fist,
      x: fist.x + Math.cos(angle) * 15,
      y: fist.y + Math.sin(angle) * 15,
      alpha: 0,
      duration: 170,
      onComplete: () => fist.destroy(),
    });
    this.zombies.getChildren().forEach((o) => {
      const z = o as Phaser.Physics.Arcade.Sprite,
        info = z.getData("info") as ZombieInfo;
      if (
        z.active &&
        info.hp > 0 &&
        Math.hypot(z.x - this.player.x, z.y - this.player.y) < 65 &&
        Math.abs(
          Phaser.Math.Angle.Wrap(
            Math.atan2(z.y - this.player.y, z.x - this.player.x) - angle,
          ),
        ) < 1.3
      )
        this.hitZombie(z, 32, true);
    });
  }
  hitZombie(z: Phaser.Physics.Arcade.Sprite, damage: number, melee = false) {
    const info = z.getData("info") as ZombieInfo;
    this.session.damageActor(info.id, damage);
    info.hp = this.session.actors.get(info.id)!.hp;
    info.alertUntil = this.state.elapsed + 8;
    const text = this.add
      .text(z.x, z.y - 48, String(damage), {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#dfc8aa",
      })
      .setOrigin(0.5)
      .setDepth(9000);
    this.tweens.add({
      targets: text,
      y: text.y - 25,
      alpha: 0,
      duration: 650,
      onComplete: () => text.destroy(),
    });
    if (melee) this.sfx(info.hp <= 0 ? "last-punch" : "punch-real", 0.72);
    if (info.hp <= 0) {
      this.spatialSfx("zombie-death", z.x, z.y, 0.24);
      info.diedAt = this.state.elapsed;
      info.bar.destroy();
      z.disableBody(false, false);
      z.setActive(true);
      z.play(`${info.kind}-Dead`);
      z.once("animationcomplete", () => z.setActive(false));
      z.setDepth(z.y - 1);
      this.tweens.add({ targets: z, alpha: 0.35, duration: 4000 });
    } else {
      z.setTint(0xd8a485);
      this.tweens.add({
        targets: z,
        alpha: 1,
        duration: 160,
        onComplete: () => {
          if (z.active) z.clearTint();
        },
      });
      const angle = Phaser.Math.Angle.Between(
        this.player.x,
        this.player.y,
        z.x,
        z.y,
      );
      z.x += Math.cos(angle) * 13;
      z.y += Math.sin(angle) * 13;
    }
  }
  findInteraction() {
    this.interactive = null;
    let text = "";
    const x = this.player.x,
      y = this.player.y;
    if (this.currentHouse) {
      const exit = roomPoint(3960, 605);
      if (Math.hypot(x - exit.x, y - exit.y) < 44) {
        this.interactive = { type: "exit" };
        text = "Abrir porta e sair";
      }
    } else if (this.currentShelter) {
      if (
        Math.hypot(x - roomPoint(3960, 605).x, y - roomPoint(3960, 605).y) < 40
      ) {
        this.interactive = { type: "exit" };
        text = "Sair do bunker";
      } else if (
        Math.hypot(x - roomPoint(3730, 310).x, y - roomPoint(3730, 310).y) < 70
      ) {
        this.interactive = { type: "bed" };
        text = "Descansar e acessar o abrigo";
      } else if (
        Math.hypot(x - roomPoint(4260, 240).x, y - roomPoint(4260, 240).y) < 40
      ) {
        this.interactive = { type: "camp" };
        text = "Cozinhar no fogão";
      } else if (
        Math.hypot(x - roomPoint(4180, 320).x, y - roomPoint(4180, 320).y) < 57
      ) {
        this.interactive = {
          type: this.currentShelter === "signal" ? "radio" : "stash",
        };
        text =
          this.currentShelter === "signal"
            ? "Acessar rádio e abrigo"
            : "Acessar reservas do abrigo";
      }
    } else {
      let best = 30;
      for (const l of this.loot) {
        const dist = Math.hypot(x - l.x, y - l.y);
        if (!l.shelter && dist < best) {
          best = dist;
          this.interactive = { type: "loot", id: l.id };
          text = `Coletar ${l.count}× ${ITEMS[l.item].name}`;
        }
      }
      if (!this.interactive) {
        for (const c of this.containers.filter((c) => !c.shelter)) {
          if (Math.hypot(x - c.x, y - c.y) < 52) {
            this.interactive = { type: "container", id: c.id };
            text = "Pesquisar · " + c.name;
            break;
          }
        }
      }
      if (!this.interactive) {
        for (const door of this.houseDoors) {
          if (Math.hypot(x - door.x, y - door.y) < 58) {
            const house = HOUSES.find((h) => h.id === door.id)!;
            this.interactive = { type: "house", id: door.id };
            text = house.locked ? "Porta reforçada · requer pé de cabra" : "Abrir porta e entrar";
            break;
          }
        }
      }
      if (!this.interactive) {
        for (const s of SHELTERS) {
          if (Math.hypot(x - s.x, y - (s.y + 15)) < 92) {
            this.interactive = { type: "shelter", id: s.id };
            text = `Entrar · ${s.name}`;
            break;
          }
        }
      }
      if (!this.interactive && this.nearbyCamp) {
        this.interactive = { type: "camp" };
        text = "Fogueira · cozinhar e descansar";
      }
    }
    if (!this.interactive) {
      for (const l of this.loot) {
        if (
          l.shelter === this.roomId() ||
          (!l.shelter && !this.inside())
        ) {
          if (Math.hypot(x - l.x, y - l.y) < 30) {
            this.interactive = { type: "loot", id: l.id };
            text = "Coletar " + ITEMS[l.item].name;
            break;
          }
        }
      }
    }
    if (!this.interactive && this.inside()) {
      for (const c of this.containers.filter(
        (c) => c.shelter === this.roomId(),
      ))
        if (Math.hypot(x - c.x, y - c.y) < 50) {
          this.interactive = { type: "container", id: c.id };
          text = "Pesquisar · " + c.name;
          break;
        }
    }
    this.ui.hint(text);
  }
  interact() {
    const action = this.interactive;
    if (!action) return;
    if (action.type === "container") {
      this.containerId = action.id!;
      this.ui.open("container");
    } else if (action.type === "loot") {
      const index = this.loot.findIndex((l) => l.id === action.id);
      if (index < 0) return;
      const l = this.loot[index];
      const message = this.command({ type: "collect", target: l.id });
      this.ui.toast(message);
      if (message.startsWith("+")) {
        if (l.item === "backpack2") this.state.collected.push("upgrade-II");
        if (l.item === "backpack3") this.state.collected.push("upgrade-III");
        l.sprite.destroy();
        this.loot.splice(index, 1);
        this.sfx("equip", 0.16);
      }
    } else if (action.type === "shelter") this.enter(action.id!);
    else if (action.type === "house") this.enterHouse(action.id!);
    else if (action.type === "exit") this.currentHouse ? this.leaveHouse() : this.leave();
    else if (action.type === "camp") {
      this.ui.tab = "craft";
      this.ui.open("inventory");
    } else if (this.currentShelter) this.ui.shelter(this.currentShelter);
    this.interactive = null;
    this.ui.hint("");
    this.publish();
  }
  enter(id: string) {
    const shelter = SHELTERS.find((s) => s.id === id)!;
    this.currentShelter = id;
    this.session.room = id;
    this.exterior = { x: shelter.x, y: shelter.y + 65 };
    this.state.shelters[id].discovered = true;
    this.player.setVelocity(0);
    this.zombies
      .getChildren()
      .forEach((z) => (z as Phaser.Physics.Arcade.Sprite).setVelocity(0));
    this.buildInterior(id);
    const spawn = roomPoint(3960, 560);
    this.player.setPosition(spawn.x, spawn.y);
    this.loot.forEach((l) => l.sprite.setVisible(l.shelter === id));
    this.cameras.main
      .setZoom(this.interiorZoom())
      .setBounds(ROOM.cx - 260, ROOM.cy - 190, 520, 400)
      .centerOn(ROOM.cx, ROOM.cy);
    this.sfx("door-real", 0.6);
    this.syncPosition();
    this.publish();
    this.save();
    this.ui.shelter(id);
  }
  enterHouse(id: string) {
    const house = HOUSES.find((entry) => entry.id === id);
    if (!house) return;
    if (house.locked && (this.state.inventory.crowbar ?? 0) < 1) {
      this.ui.toast("A porta está reforçada. Encontre um pé de cabra em outra casa.");
      this.sfx("door-real", 0.22);
      return;
    }
    this.currentHouse = id;
    this.session.room = `house:${id}`;
    this.exterior = { x: house.x, y: house.y + 48 };
    this.player.setVelocity(0);
    this.buildHouseInterior(house);
    const spawn = roomPoint(3960, 560);
    this.player.setPosition(spawn.x, spawn.y);
    this.loot.forEach((loot) => loot.sprite.setVisible(loot.shelter === this.roomId()));
    this.cameras.main
      .setZoom(this.interiorZoom())
      .setBounds(ROOM.cx - 260, ROOM.cy - 190, 520, 400)
      .centerOn(ROOM.cx, ROOM.cy);
    this.sfx("door-real", 0.65);
    this.publish();
    this.save();
  }
  buildHouseInterior(house: (typeof HOUSES)[number]) {
    this.clearInterior();
    const add = (object: Phaser.GameObjects.GameObject) => {
      this.roomVisuals.push(object);
      return object;
    };
    const tint = house.interior === "workshop" ? 0x8fa5b7 : house.interior === "kitchen" ? 0xa8b5c2 : 0x9eb0c0;
    add(this.add.tileSprite(ROOM.cx, ROOM.cy, 350, 245, "floorWood").setTint(tint).setDepth(-790));
    const walls = this.add.graphics().setDepth(-780);
    add(walls);
    walls.fillStyle(0x263b4b, 1);
    walls.fillRect(ROOM.cx - 180, ROOM.cy - 135, 360, 20);
    walls.fillRect(ROOM.cx - 180, ROOM.cy - 135, 18, 270);
    walls.fillRect(ROOM.cx + 162, ROOM.cy - 135, 18, 270);
    walls.fillRect(ROOM.cx - 180, ROOM.cy + 115, 135, 20);
    walls.fillRect(ROOM.cx + 45, ROOM.cy + 115, 135, 20);
    walls.lineStyle(2, 0x7e9bb2, 0.7).strokeRect(ROOM.cx - 180, ROOM.cy - 135, 360, 270);
    this.block(ROOM.cx, ROOM.cy - 125, 360, 20, this.roomWalls);
    this.block(ROOM.cx - 171, ROOM.cy, 18, 270, this.roomWalls);
    this.block(ROOM.cx + 171, ROOM.cy, 18, 270, this.roomWalls);
    this.block(ROOM.cx - 112, ROOM.cy + 125, 135, 20, this.roomWalls);
    this.block(ROOM.cx + 112, ROOM.cy + 125, 135, 20, this.roomWalls);
    add(this.add.image(ROOM.cx, ROOM.cy - 102, "houseInteriorWalls", "wall-strip").setDisplaySize(330, 95).setTint(tint).setDepth(-775));
    const cabinet = add(this.add.image(ROOM.cx + 112, ROOM.cy - 48, "houseInteriorFloors", "furniture").setDisplaySize(92, 62).setTint(tint).setDepth(ROOM.cy - 30)) as Phaser.GameObjects.Image;
    this.block(cabinet.x, cabinet.y, 78, 42, this.roomWalls);
    const tableX = house.interior === "kitchen" ? ROOM.cx - 35 : ROOM.cx + 10;
    add(this.add.image(tableX, ROOM.cy + 22, "table").setDisplaySize(95, 72).setTint(tint).setDepth(ROOM.cy + 45));
    this.block(tableX, ROOM.cy + 20, 84, 58, this.roomWalls);
    if (house.interior === "family")
      add(this.add.image(ROOM.cx - 115, ROOM.cy - 45, "sofa").setDisplaySize(92, 48).setTint(tint).setDepth(ROOM.cy - 20));
    else if (house.interior === "kitchen")
      add(this.add.image(ROOM.cx - 120, ROOM.cy - 47, "fridge").setDisplaySize(42, 70).setTint(tint).setDepth(ROOM.cy - 20));
    else
      add(this.add.image(ROOM.cx - 115, ROOM.cy - 45, "shelterObjects", "locker").setDisplaySize(52, 78).setTint(tint).setDepth(ROOM.cy - 20));
    add(this.add.text(ROOM.cx, ROOM.cy - 112, house.locked ? "CASA REFORÇADA" : "RESIDÊNCIA", {
      fontFamily: "monospace", fontSize: "13px", color: "#b9d4e8",
    }).setOrigin(0.5).setDepth(ROOM.cy - 80));
    add(this.add.text(ROOM.cx, ROOM.cy + 103, "↓ PORTA  [E]", {
      fontFamily: "monospace", fontSize: "10px", color: "#c5dbea",
    }).setOrigin(0.5).setDepth(ROOM.cy + 140));
    const room = `house:${house.id}`;
    this.addContainer(`house-cabinet-${house.id}`, cabinet.x, cabinet.y, "Armário", room);
    this.addContainer(`house-table-${house.id}`, tableX, ROOM.cy + 22, "Gavetas", room);
    if (house.id === "centro-norte-1") this.state.containers[`house-cabinet-${house.id}`].crowbar = 1;
    if (house.locked) {
      const stash = this.state.containers[`house-cabinet-${house.id}`];
      stash.ammo = Math.max(stash.ammo, 12);
      stash[house.k === 0 ? "rifle" : house.k === 1 ? "shotgun" : "sniper"] = 1;
    }
  }
  buildInterior(id: string) {
    this.clearInterior();
    const add = (o: Phaser.GameObjects.GameObject) => {
      this.roomVisuals.push(o);
      return o;
    };
    const tint =
      id === "ash" ? 0x9e9376 : id === "station" ? 0x829692 : 0x8e9e73;
    add(
      this.add
        .tileSprite(3960, 420, 930, 690, "shelterTiles", "earth")
        .setTint(tint)
        .setDepth(-800),
    );
    add(
      this.add
        .tileSprite(3960, 407, 740, 500, id === "ash" ? "floorWood" : "floor")
        .setTint(tint)
        .setDepth(-790),
    );
    const walls = this.add.graphics().setDepth(-780);
    add(walls);
    walls.fillStyle(0x34402f);
    walls.fillRect(3590, 155, 740, 32);
    walls.fillRect(3590, 155, 27, 505);
    walls.fillRect(4303, 155, 27, 505);
    walls.fillRect(3590, 628, 300, 32);
    walls.fillRect(4030, 628, 300, 32);
    walls.lineStyle(2, 0x8e9c76, 0.6);
    walls.strokeRect(3590, 155, 740, 505);
    this.block(3960, 169, 740, 32, this.roomWalls);
    this.block(3603, 407, 27, 505, this.roomWalls);
    this.block(4316, 407, 27, 505, this.roomWalls);
    this.block(3740, 644, 300, 32, this.roomWalls);
    this.block(4180, 644, 300, 32, this.roomWalls);
    add(
      this.add
        .image(3730, 310, "bed")
        .setDisplaySize(83, 180)
        .setTint(tint)
        .setDepth(311),
    );
    this.block(3730, 290, 73, 145, this.roomWalls);
    add(
      this.add
        .image(3930, 260, "sofa")
        .setDisplaySize(160, 75)
        .setTint(tint)
        .setDepth(270),
    );
    this.block(3930, 258, 145, 65, this.roomWalls);
    add(
      this.add
        .image(4080, 450, "table")
        .setDisplaySize(108, 82)
        .setTint(tint)
        .setDepth(460),
    );
    this.block(4080, 446, 97, 68, this.roomWalls);
    add(
      this.add
        .image(4080, 520, "chair")
        .setDisplaySize(50, 52)
        .setTint(tint)
        .setDepth(521),
    );
    add(
      this.add
        .image(4190, 285, "shelterObjects", "locker")
        .setDisplaySize(67, 94)
        .setTint(tint)
        .setDepth(287),
    );
    this.block(4190, 279, 66, 60, this.roomWalls);
    add(
      this.add
        .image(3650, 220, "plant")
        .setDisplaySize(67, 70)
        .setTint(tint)
        .setDepth(221),
    );
    add(
      this.add
        .image(4260, 220, "shelterObjects", "stove")
        .setScale(1.6)
        .setTint(tint)
        .setDepth(222),
    );
    if (id === "ash") {
      add(
        this.add.image(4080, 443, "food").setDisplaySize(20, 20).setDepth(470),
      );
      add(
        this.add
          .image(4250, 540, "shelterObjects", "bench")
          .setDisplaySize(110, 30)
          .setDepth(545),
      );
      add(this.add.circle(4260, 226, 30, 0xd5ac66, 0.09).setDepth(600));
    }
    if (id === "station") {
      add(
        this.add
          .image(3820, 310, "bed")
          .setDisplaySize(78, 175)
          .setTint(0x95a5a5)
          .setDepth(311),
      );
      this.block(3820, 290, 66, 140, this.roomWalls);
      add(
        this.add
          .image(4070, 438, "medicine")
          .setDisplaySize(28, 29)
          .setDepth(470),
      );
      add(
        this.add
          .image(4100, 455, "bandage")
          .setDisplaySize(32, 25)
          .setDepth(470),
      );
      const cross = this.add.graphics().setDepth(240);
      add(cross);
      cross.fillStyle(0xaf9380, 0.8);
      cross.fillRect(4173, 201, 14, 42);
      cross.fillRect(4159, 215, 42, 14);
    }
    if (id === "signal") {
      add(
        this.add.image(4170, 319, "radio").setDisplaySize(44, 30).setDepth(350),
      );
      add(
        this.add
          .image(3970, 345, "shelterObjects", "bench")
          .setDisplaySize(155, 48)
          .setDepth(348),
      );
      this.block(3970, 340, 140, 36, this.roomWalls);
      add(
        this.add.image(3970, 337, "scrap").setDisplaySize(47, 24).setDepth(370),
      );
      add(
        this.add
          .image(4240, 540, "terrain", "crate")
          .setScale(0.85)
          .setDepth(540),
      );
      add(
        this.add
          .image(4150, 540, "terrain", "crate")
          .setScale(0.85)
          .setDepth(540),
      );
    }
    add(
      this.add
        .text(3960, 210, `BUNKER ${SHELTERS.find((s) => s.id === id)!.label}`, {
          fontFamily: "monospace",
          fontSize: "23px",
          color: "#bec99c",
        })
        .setOrigin(0.5)
        .setDepth(220)
        .setAlpha(0.65),
    );
    add(
      this.add
        .text(3960, 615, "↓ SAÍDA  [E]", {
          fontFamily: "monospace",
          fontSize: "12px",
          color: "#c7d1aa",
        })
        .setOrigin(0.5)
        .setDepth(650),
    );
    add(
      this.add
        .text(3680, 425, "DESCANSO [E]", {
          fontFamily: "monospace",
          fontSize: "9px",
          color: "#c0cbaa",
        })
        .setDepth(650),
    );
    add(
      this.add
        .text(4175, 390, id === "signal" ? "RÁDIO [E]" : "RESERVAS [E]", {
          fontFamily: "monospace",
          fontSize: "9px",
          color: "#c0cbaa",
        })
        .setOrigin(0.5)
        .setDepth(650),
    );
    const drawers = roomPoint(4080, 450);
    this.addContainer(
      "bunker-" + id,
      drawers.x,
      drawers.y,
      "Gavetas do bunker",
      id,
    );
    for (const o of this.roomVisuals) {
      const obj = o as Phaser.GameObjects.Image;
      if (obj instanceof Phaser.GameObjects.Graphics)
        obj
          .setScale(ROOM.scale)
          .setPosition(ROOM.cx - 3960 * ROOM.scale, ROOM.cy - 407 * ROOM.scale);
      else {
        const p = roomPoint(obj.x, obj.y);
        obj
          .setPosition(p.x, p.y)
          .setScale(obj.scaleX * ROOM.scale, obj.scaleY * ROOM.scale);
        if (obj instanceof Phaser.GameObjects.Image && obj.depth > 0)
          obj.setDepth(p.y + 3);
      }
    }
    for (const o of this.roomWalls.getChildren()) {
      const rect = o as Phaser.GameObjects.Rectangle,
        p = roomPoint(rect.x, rect.y);
      rect.setPosition(p.x, p.y).setScale(ROOM.scale);
      (rect.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    }
  }
  clearInterior() {
    this.roomVisuals.forEach((o) => o.destroy());
    this.roomVisuals = [];
    this.roomWalls.clear(true, true);
  }
  leave() {
    this.player.setVelocity(0).setPosition(this.exterior.x, this.exterior.y);
    this.currentShelter = "";
    this.session.room = "";
    this.loot.forEach((l) => l.sprite.setVisible(!l.shelter));
    this.clearInterior();
    this.cameras.main
      .setZoom(this.zoom())
      .setBounds(0, 0, WORLD.width, WORLD.height)
      .centerOn(this.player.x, this.player.y);
    this.sfx("door-real", 0.5);
    this.publish();
    this.save();
  }
  leaveHouse() {
    this.player.setVelocity(0).setPosition(this.exterior.x, this.exterior.y);
    this.currentHouse = "";
    this.session.room = "";
    this.loot.forEach((loot) => loot.sprite.setVisible(!loot.shelter));
    this.clearInterior();
    this.cameras.main.setZoom(this.zoom()).setBounds(0, 0, WORLD.width, WORLD.height).centerOn(this.player.x, this.player.y);
    this.sfx("door-real", 0.55);
    this.publish();
    this.save();
  }
  drawCamps() {
    for (let i = this.campsDrawn; i < this.state.camps.length; i++) {
      const c = this.state.camps[i],
        g = this.add.graphics().setDepth(c.y);
      g.fillStyle(0x253220, 0.5);
      g.fillEllipse(c.x, c.y + 7, 98, 38);
      g.fillStyle(0x89936a);
      g.fillTriangle(c.x - 42, c.y + 5, c.x, c.y - 42, c.x + 42, c.y + 5);
      g.fillStyle(0x34452a);
      g.fillTriangle(c.x - 17, c.y + 5, c.x, c.y - 22, c.x + 17, c.y + 5);
      g.lineStyle(2, 0xbdc592);
      g.lineBetween(c.x, c.y - 42, c.x, c.y - 22);
      g.fillStyle(0x746b51);
      g.fillEllipse(c.x + 48, c.y + 5, 29, 14);
      g.lineStyle(4, 0x473b25);
      g.lineBetween(c.x + 38, c.y + 3, c.x + 57, c.y + 8);
      g.lineBetween(c.x + 39, c.y + 9, c.x + 55, c.y + 1);
      g.fillStyle(0xb88039);
      g.fillTriangle(c.x + 40, c.y + 3, c.x + 49, c.y - 16, c.x + 56, c.y + 4);
      g.fillStyle(0xe6c071);
      g.fillTriangle(c.x + 44, c.y + 3, c.x + 49, c.y - 9, c.x + 53, c.y + 3);
      this.add
        .text(c.x, c.y + 26, "ACAMPAMENTO", {
          fontFamily: "monospace",
          fontSize: "9px",
          color: "#cdd7b3",
        })
        .setOrigin(0.5)
        .setDepth(c.y + 27);
    }
    this.campsDrawn = this.state.camps.length;
  }
  drawBiomes() {
    const ocean = (x: number, y: number, w: number, h: number) =>
      this.add
        .tileSprite(x, y, w, h, "waterOcean")
        .setDepth(-990)
        .setTint(0x78989a)
        .setTileScale(1.45);
    ocean(96, WORLD.height / 2, 192, WORLD.height);
    ocean(WORLD.width - 96, WORLD.height / 2, 192, WORLD.height);
    ocean(WORLD.width / 2, 96, WORLD.width - 384, 192);
    ocean(WORLD.width / 2, WORLD.height - 96, WORLD.width - 384, 192);
    const shore = this.add.graphics().setDepth(-989);
    shore.lineStyle(24, 0x9b8d68, 0.72);
    shore.strokeRect(204, 204, WORLD.width - 408, WORLD.height - 408);
    shore.lineStyle(4, 0x7ea6bd, 0.6);
    shore.strokeRect(192, 192, WORLD.width - 384, WORLD.height - 384);
    for (let x = WORLD.lake.x - WORLD.lake.rx; x <= WORLD.lake.x + WORLD.lake.rx; x += 112)
      for (let y = WORLD.lake.y - WORLD.lake.ry; y <= WORLD.lake.y + WORLD.lake.ry; y += 112)
        if (isLake(x, y))
          this.add.sprite(x, y, "calmWater", "calm-0").setDisplaySize(116, 116).setTint(0x9bb9c8).setDepth(-988).play("calm-water");
    for (const tile of buildRoadTiles())
      this.add
        .image(tile.x, tile.y, tile.key)
        .setDisplaySize(ROAD_TILE, ROAD_TILE)
        .setTint(0x8b9187)
        .setDepth(-995);
    const streetProps = [
      { x: 780, y: 845, k: "trashBag" },
      { x: 1030, y: 795, k: "trashBin" },
      { x: 1510, y: 850, k: "manhole" },
      { x: 1810, y: 790, k: "cone" },
      { x: 780, y: 2445, k: "cart" },
      { x: 1040, y: 2385, k: "trashBag" },
      { x: 1500, y: 2450, k: "manhole" },
      { x: 1830, y: 2380, k: "trashBin" },
      { x: 2860, y: 2320, k: "cone" },
      { x: 3230, y: 2260, k: "trashBag" },
      { x: 3620, y: 2325, k: "manhole" },
      { x: 4020, y: 2255, k: "cart" },
      { x: 3085, y: 2810, k: "trashBin" },
      { x: 3855, y: 2780, k: "cone" },
      { x: 3500, y: 3025, k: "manhole" },
    ];
    streetProps.forEach((p) => this.prop(p.k, undefined, p.x, p.y, 1.8, false));
    this.prop("stopSign", undefined, 1735, 870, 2);
    this.prop("stopSign", undefined, 3890, 2350, 2);
    this.prop("trashBin", undefined, 2315, 1880, 2);
    // Three guaranteed upgrades inside furniture; no world markers reveal their contents.
    const lockers = this.containers.filter((c) => c.id.startsWith("locker"));
    if (lockers[0] && !this.state.collected.includes("upgrade-II"))
      this.state.containers[lockers[0].id].backpack2 = Math.max(
        1,
        this.state.containers[lockers[0].id].backpack2,
      );
    if (
      lockers[lockers.length - 1] &&
      !this.state.collected.includes("upgrade-III")
    )
      this.state.containers[lockers[lockers.length - 1].id].backpack3 =
        Math.max(
          1,
          this.state.containers[lockers[lockers.length - 1].id].backpack3,
        );
    const fog = this.add
      .particles(0, 0, "vignette", {
        x: { min: WORLD.shore, max: WORLD.width - WORLD.shore },
        y: { min: WORLD.shore, max: WORLD.height - WORLD.shore },
        frequency: 1600,
        lifespan: 22000,
        speedX: 9,
        speedY: 2,
        scale: { start: 0.7, end: 1.5 },
        alpha: { start: 0, end: 0.075 },
        tint: 0x9dafa3,
        quantity: 1,
      })
      .setDepth(8000)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    fog.setAlpha(0.35);
  }
  drawReticle() {
    this.reticle.clear();
    if (this.cursorReleased || this.inside() || this.scale.width < 600)
      return;
    const w = this.aimPoint();
    const r = this.aiming ? 4 : 7;
    this.reticle.lineStyle(1, 0xe8d398, 0.85);
    this.reticle.lineBetween(w.x - r - 4, w.y, w.x - 3, w.y);
    this.reticle.lineBetween(w.x + 3, w.y, w.x + r + 4, w.y);
    this.reticle.lineBetween(w.x, w.y - r - 4, w.x, w.y - 3);
    this.reticle.lineBetween(w.x, w.y + 3, w.x, w.y + r + 4);
  }
  updateAmbience() {
    const now = this.state.elapsed;
    if (now - this.lastAmbience < 0.35) return;
    this.lastAmbience = now;
    const muted = !this.settings.sound || this.paused,
      outdoors = !this.inside(),
      edgeDistance = Math.min(
        this.player.x,
        this.player.y,
        (this.gameMode === "story" ? STORY_WORLD.width : WORLD.width) -
          this.player.x,
        (this.gameMode === "story" ? STORY_WORLD.height : WORLD.height) -
          this.player.y,
      ),
      seaPresence =
        this.gameMode === "survival" && outdoors
          ? Math.max(0, 1 - Math.max(0, edgeDistance - WORLD.shore) / 720)
          : 0;
    this.setLoopVolume(
      this.forestAmbience,
      muted || !outdoors ? 0 : this.settings.effects * 0.11,
    );
    this.setLoopVolume(
      this.seaAmbience,
      muted ? 0 : this.settings.effects * 0.2 * seaPresence,
    );
    this.setLoopVolume(
      this.campfireAmbience,
      muted || !this.nearbyCamp ? 0 : this.settings.effects * 0.3,
    );
    if (
      isNight(this.state.minutes) &&
      !this.inside() &&
      now - this.lastHorror > 90
    ) {
      this.sfx("horror-violins", 0.018);
      this.lastHorror = now;
    }
    const radiationDistance = Math.hypot(
        this.player.x - NUCLEAR_ZONE.x,
        this.player.y - NUCLEAR_ZONE.y,
      ),
      radiationVolume =
        this.gameMode === "survival"
          ? Math.max(0, 1 - radiationDistance / 850) *
            this.settings.effects *
            0.28
          : 0;
    if (!this.radiationSound) {
      this.radiationSound = this.sound.add("geiger", { loop: true, volume: 0 });
      this.radiationSound.play();
    }
    (this.radiationSound as Phaser.Sound.WebAudioSound).setVolume(
      radiationVolume,
    );
    if (!this.heartbeatSound) {
      this.heartbeatSound = this.sound.add("heartbeat", {
        loop: true,
        volume: 0,
      });
      this.heartbeatSound.play();
    }
    (this.heartbeatSound as Phaser.Sound.WebAudioSound).setVolume(
      this.state.vitals.health < 28
        ? this.settings.effects * 0.22 * (1 - this.state.vitals.health / 28)
        : 0,
    );
    if (!this.nightSound?.isPlaying) this.nightSound?.play();
    const sound = this.nightSound as Phaser.Sound.WebAudioSound;
    const target =
      this.settings.effects *
      (isNight(this.state.minutes) && !this.inside() ? 0.14 : 0.012);
    sound.setVolume(Phaser.Math.Linear(sound.volume, target, 0.12));
  }

  drawDarkness() {
    this.dark.clear();
    const h = (this.state.minutes % 1440) / 60;
    const night = this.inside()
      ? 0.06
      : h >= 19 || h < 5
        ? 0.69
        : h >= 17
          ? 0.13 + (h - 17) * 0.28
          : h < 7
            ? 0.65 - (h - 5) * 0.27
            : 0.13;
    const w = this.scale.width,
      hh = this.scale.height,
      z = this.cameras.main.zoom,
      alpha = clamp(night, 0, 0.72);
    this.dark
      .setScale(1 / z)
      .setPosition((w * (1 - 1 / z)) / 2, (hh * (1 - 1 / z)) / 2);
    this.dark.fillStyle(0x06150e, alpha * 0.78);
    this.dark.fillRect(0, 0, w, hh);
    this.vignette
      .setPosition(w / 2, hh / 2)
      .setDisplaySize(w / z, hh / z)
      .setAlpha(this.inside() ? 0.16 : 0.25 + alpha * 0.45);
  }
  muzzlePoint(angle: number) {
    // Offsets measured on the eight Idle2 frames, relative to the character's feet.
    const offsets = [
      [24, -40],
      [18, -29],
      [0, -26],
      [-17, -29],
      [-23, -45],
      [-13, -56],
      [0, -59],
      [15, -51],
    ];
    const p = offsets[directionRow(angle)];
    return {
      x: this.player.x + p[0],
      y: this.player.y + p[1] + (this.crouching ? 16 : 0),
    };
  }
  updateTracers() {
    this.tracers.clear();
    for (const o of this.bullets.getChildren()) {
      const b = o as Phaser.Physics.Arcade.Sprite;
      if (!b.active) continue;
      const a = b.getData("angle") as number,
        m = b.getData("muzzle") as { x: number; y: number };
      const traveled = Math.hypot(b.x - m.x, b.y - m.y),
        length = Math.min(25, traveled);
      const x = b.x - Math.cos(a) * length,
        y = b.y - Math.sin(a) * length - 3;
      this.tracers.lineStyle(2, 0xc49b40, 0.45).lineBetween(x, y, b.x, b.y - 3);
      this.tracers
        .lineStyle(1, 0xffe58f, 0.9)
        .lineBetween(
          x + Math.cos(a) * length * 0.35,
          y + Math.sin(a) * length * 0.35,
          b.x,
          b.y - 3,
        );
    }
  }
  sightDistance() {
    return this.inside()
      ? 310
      : isNight(this.state.minutes)
        ? this.state.gear?.nightVision
          ? 480
          : 290
        : 490;
  }
  nearbySightBlocks() {
    const x = this.player.x,
      y = this.player.y,
      range = this.sightDistance() + 100;
    return [...this.obstacles.getChildren(), ...this.roomWalls.getChildren()]
      .map(
        (o) =>
          (o as Phaser.GameObjects.Rectangle)
            .body as Phaser.Physics.Arcade.StaticBody,
      )
      .filter(
        (b) =>
          b &&
          Math.abs(b.center.x - x) < range &&
          Math.abs(b.center.y - y) < range,
      )
      .map((b) => ({
        left: b.left,
        right: b.right,
        top: b.top,
        bottom: b.bottom,
      }));
  }
  lineOfSight(x: number, y: number, tx: number, ty: number) {
    return visiblePoint(
      tx,
      ty,
      x,
      y,
      Math.atan2(ty - y, tx - x),
      Math.hypot(tx - x, ty - y) + 1,
      this.sightBlocks,
    );
  }
  canSee(x: number, y: number) {
    return visiblePoint(
      x,
      y,
      this.player.x,
      this.player.y - 12,
      this.aim(),
      this.sightDistance(),
      this.sightBlocks,
    );
  }
  visibleProp(image: Phaser.GameObjects.Image) {
    const body = (
      image.getData("sightBody") as Phaser.GameObjects.Rectangle | undefined
    )?.body as Phaser.Physics.Arcade.StaticBody | undefined;
    const blocks = body
      ? this.sightBlocks.filter(
          (b) =>
            Math.abs(b.left - body.left) > 0.1 ||
            Math.abs(b.top - body.top) > 0.1 ||
            Math.abs(b.right - body.right) > 0.1 ||
            Math.abs(b.bottom - body.bottom) > 0.1,
        )
      : this.sightBlocks;
    const bounds = body ?? image.getBounds();
    const points = body
      ? [
          [body.center.x, body.bottom],
          [body.left, body.bottom],
          [body.right, body.bottom],
          [body.center.x, body.top],
          [body.left, body.top],
          [body.right, body.top],
        ]
      : [
          [image.x, image.y],
          [bounds.left, bounds.bottom],
          [bounds.right, bounds.bottom],
        ];
    return points.some(([x, y]) =>
      visiblePoint(
        x,
        y,
        this.player.x,
        this.player.y - 12,
        this.aim(),
        this.sightDistance(),
        blocks,
      ),
    );
  }
  drawVision() {
    const cam = this.cameras.main,
      w = this.scale.width,
      h = this.scale.height,
      z = cam.zoom;
    this.visionOverlay.setPosition(w / 2, h / 2).setDisplaySize(w / z, h / z);
    if (this.gameMode === "story") {
      const ctx = this.visionCanvas.context,
        view = cam.worldView,
        sx = 960 / view.width,
        sy = 640 / view.height,
        px = (this.player.x - view.x) * sx,
        py = (this.player.y - view.y) * sy,
        inner = 310 * sx,
        outer = 620 * sx;
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, 960, 640);
      ctx.fillStyle = "rgba(2,5,4,.62)";
      ctx.fillRect(0, 0, 960, 640);
      ctx.globalCompositeOperation = "destination-out";
      const glow = ctx.createRadialGradient(px, py, inner, px, py, outer);
      glow.addColorStop(0, "rgba(0,0,0,1)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 960, 640);
      ctx.globalCompositeOperation = "source-over";
      this.visionCanvas.refresh();
      return;
    }
    if (this.state.elapsed - this.lastVision < 0.05) return;
    const dt = this.state.elapsed - this.lastVision;
    this.lastVision = this.state.elapsed;
    this.sightBlocks = this.nearbySightBlocks();
    for (const canvas of [this.visionMask, this.visionBlend, this.visionFresh])
      if (canvas.width !== 960 || canvas.height !== 640) {
        canvas.width = 960;
        canvas.height = 640;
      }
    const view = cam.worldView,
      sx = 960 / view.width,
      sy = 640 / view.height,
      fresh = this.visionFresh.getContext("2d")!;
    fresh.clearRect(0, 0, 960, 640);
    fresh.fillStyle = "#fff";
    fresh.beginPath();
    sightPolygon(
      this.player.x,
      this.player.y - 12,
      this.aim(),
      this.sightDistance(),
      this.sightBlocks,
    ).forEach((p, i) => {
      const x = (p.x - view.x) * sx,
        y = (p.y - view.y) * sy;
      if (i) fresh.lineTo(x, y);
      else fresh.moveTo(x, y);
    });
    fresh.closePath();
    fresh.fill();
    // Illuminate a visible wall's surface without opening the ground behind it.
    for (const o of [
      ...this.obstacles.getChildren(),
      ...this.roomWalls.getChildren(),
    ]) {
      const rect = o as Phaser.GameObjects.Rectangle,
        b = rect.body as Phaser.Physics.Arcade.StaticBody;
      if (
        rect.getData("visualImage") ||
        !b ||
        Math.abs(b.center.x - this.player.x) > this.sightDistance() + 100 ||
        Math.abs(b.center.y - this.player.y) > this.sightDistance() + 100
      )
        continue;
      const others = this.sightBlocks.filter(
        (a) =>
          Math.abs(a.left - b.left) > 0.1 ||
          Math.abs(a.top - b.top) > 0.1 ||
          Math.abs(a.right - b.right) > 0.1 ||
          Math.abs(a.bottom - b.bottom) > 0.1,
      );
      if (
        [
          [b.left, b.top],
          [b.right, b.top],
          [b.left, b.bottom],
          [b.right, b.bottom],
          [b.center.x, b.center.y],
        ].some(([x, y]) =>
          visiblePoint(
            x,
            y,
            this.player.x,
            this.player.y - 12,
            this.aim(),
            this.sightDistance(),
            others,
          ),
        )
      )
        fresh.fillRect(
          (b.left - view.x) * sx,
          (b.top - view.y) * sy,
          b.width * sx,
          b.height * sy,
        );
    }
    const images = this.inside()
      ? (this.roomVisuals.filter(
          (o) => o instanceof Phaser.GameObjects.Image,
        ) as Phaser.GameObjects.Image[])
      : this.occluders;
    for (const image of images) {
      if (!image.active || !image.visible || !this.visibleProp(image)) continue;
      const b = image.getBounds(),
        f = image.frame;
      fresh.drawImage(
        f.source.image as HTMLImageElement,
        f.cutX,
        f.cutY,
        f.cutWidth,
        f.cutHeight,
        (b.x - view.x) * sx,
        (b.y - view.y) * sy,
        b.width * sx,
        b.height * sy,
      );
    }
    const blend = this.visionBlend.getContext("2d")!,
      old = this.visionView,
      mix = old ? 1 - Math.exp(-dt / 0.1) : 1;
    blend.clearRect(0, 0, 960, 640);
    blend.globalCompositeOperation = "source-over";
    blend.globalAlpha = 1 - mix;
    if (old)
      blend.drawImage(
        this.visionMask,
        (old.x - view.x) * sx,
        (old.y - view.y) * sy,
        old.width * sx,
        old.height * sy,
      );
    blend.globalCompositeOperation = "lighter";
    blend.globalAlpha = mix;
    blend.drawImage(this.visionFresh, 0, 0);
    blend.globalAlpha = 1;
    blend.globalCompositeOperation = "source-over";
    const mask = this.visionMask.getContext("2d")!;
    mask.clearRect(0, 0, 960, 640);
    mask.drawImage(this.visionBlend, 0, 0);
    this.visionView = {
      x: view.x,
      y: view.y,
      width: view.width,
      height: view.height,
    };
    const ctx = this.visionCanvas.context;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, 960, 640);
    ctx.fillStyle = "rgba(2,5,4,.86)";
    ctx.fillRect(0, 0, 960, 640);
    ctx.globalCompositeOperation = "destination-out";
    ctx.filter = "blur(9px)";
    ctx.drawImage(this.visionMask, 0, 0);
    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-over";
    this.visionCanvas.refresh();
  }
  updateFruit() {
    for (let i = this.loot.length - 1; i >= 0; i--) {
      const l = this.loot[i];
      if (l.id.startsWith("fruit-") && !this.session.resources.has(l.id)) {
        l.sprite.destroy();
        this.loot.splice(i, 1);
      }
    }
    if (this.inside()) return;
    const now = this.state.elapsed;
    this.state.fruitTimers ??= {};
    for (const tree of this.fruitTrees) {
      if (this.state.fruitTimers[tree.id] === undefined) {
        const n = [...tree.id].reduce((a, c) => a + c.charCodeAt(0), 0);
        this.state.fruitTimers[tree.id] = now + 65 + (n % 150);
      }
      if (
        now < this.state.fruitTimers[tree.id] ||
        Math.hypot(tree.x - this.player.x, tree.y - this.player.y) > 1200
      )
        continue;
      const rng = randomGenerator(
        this.state.seed + this.state.nextItem + tree.x,
      );
      this.state.fruitTimers[tree.id] = now + 180 + rng() * 180;
      if (
        this.state.dropped.filter((d) => d.id.startsWith("fruit-")).length >= 24
      )
        continue;
      const x = tree.x + (rng() - 0.5) * 75,
        y = tree.y + 20 + rng() * 20;
      if (this.isBlocked(x, y) || isOcean(x, y) || isLake(x, y)) continue;
      const d: DroppedItem = {
        id: "fruit-" + this.state.nextItem++,
        item: tree.item,
        count: 1,
        durability: 100,
        x,
        y,
      };
      this.state.dropped.push(d);
      this.drawLoot(d);
    }
  }
  drawDistricts() {
    for (const h of HOUSES) {
      const house = this.prop(`houseModel${h.k}`, undefined, h.x, h.y, 1.05, false)
        .setOrigin(0.5, 1)
        .clearTint();
      this.houseImages.push(house);
      house.setData(
        "sightBody",
        this.block(h.x, h.y - 68, 190, 100).setData("visualImage", true),
      );
      this.block(h.x - 72, h.y - 7, 52, 38);
      this.block(h.x + 72, h.y - 7, 52, 38);
      this.houseDoors.push({ id: h.id, x: h.x, y: h.y + 8 });
      if (h.locked)
        this.add.text(h.x + 20, h.y - 19, "▰", { color: "#9bbbd5", fontSize: "10px" }).setDepth(h.y + 1);
      if (Number(h.id.at(-1)) % 2 === 0)
        this.prop("streetLight", undefined, h.x + 145, h.y + 72, 1.8);
    }
    for (const district of DISTRICTS) {
      this.add
        .text(district.x + 20, district.y + district.h + 18, district.name, {
          fontFamily: "monospace",
          fontSize: "15px",
          color: "#a6ac8a",
        })
        .setAlpha(0.23)
        .setDepth(-940);
    }
    for (let i = 0; i < 16; i++) {
      if (i === 7 || i === 8) continue;
      const x = 3250 + i * 64;
      this.prop(i % 3 ? "urban0132" : "urban0133", undefined, x, 440, 4, false);
      this.block(x, 438, 62, 9);
    }
    this.prop("urban0225", undefined, 4420, 1490, 3, true);
    this.addContainer("gas-station", 4420, 1525, "Depósito do posto");
    const rng = randomGenerator(78431);
    for (let i = 0; i < 40; i++) {
      const x = 3200 + rng() * 1040,
        y = 520 + rng() * 890;
      if (this.isBlocked(x, y)) continue;
      this.prop(
        ["barrel", "beam", "pallet", "cone", "trashBag", "cart"][i % 6],
        undefined,
        x,
        y,
        i % 6 < 4 ? 2 : 2.6,
        i % 6 === 0,
      );
    }
    for (const c of [...this.containers].filter(
      (c) => c.id.startsWith("desk") && Number(c.id.split("-")[1]) > 3000,
    )) {
      this.prop("fridge", undefined, c.x - 50, c.y + 55, 2.4, true);
      this.addContainer(
        "fridge-" + c.id,
        c.x - 50,
        c.y + 72,
        "Geladeira abandonada",
      );
    }
    // Pomar fixo do bairro; a copa é atravessável e só o tronco colide.
    for (let i = 0; i < 9; i++) {
      const x = 770 + (i % 3) * 130,
        y = 2100 + Math.floor(i / 3) * 145;
      this.tree(x, y, i, "orchard-" + i);
    }
  }
  throwGrenade() {
    const a = this.aim(),
      x = this.player.x + Math.cos(a) * 180,
      y = this.player.y + Math.sin(a) * 180;
    const grenade = this.add
      .image(this.player.x, this.player.y - 25, "grenade")
      .setDisplaySize(9, 12)
      .setDepth(8000);
    this.tweens.add({
      targets: grenade,
      x,
      y,
      angle: 360,
      duration: 650,
      onComplete: () => {
        grenade.destroy();
        const dust = this.add.circle(x, y, 65, 0x918577, 0.2).setDepth(8000);
        this.tweens.add({
          targets: dust,
          alpha: 0,
          scale: 1.6,
          duration: 500,
          onComplete: () => dust.destroy(),
        });
        for (const o of this.zombies.getChildren()) {
          const zz = o as Phaser.Physics.Arcade.Sprite;
          if (zz.active && Math.hypot(zz.x - x, zz.y - y) < 120)
            this.hitZombie(zz, 85);
        }
        this.sfx("shot-real", 0.95);
        this.noiseUntil = this.state.elapsed + 2;
        this.noiseRadius = 600;
      },
    });
  }
}
