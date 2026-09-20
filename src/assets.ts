import { SUPPLY_IMAGES } from "./supplies";
import Phaser from "phaser";
export const assetUrl = (path: string) =>
  "/" + path.split("/").map(encodeURIComponent).join("/");
export const images: Record<string, string> = {
  ...SUPPLY_IMAGES,
  grassBase: "assets/Map/Grass/Grass 1 - 128x128.png",
  grassOvercast: "assets/Map/Grass/grass_overcast.png",
  grassGen1: "assets/Map/Grass/ground_grass_gen_01.png",
  isoBuilding1:
    "assets/Map/Isometric/Building-tiles/Isometric Buildings 1 - 64x96.png",
  isoBuilding2:
    "assets/Map/Isometric/Building-tiles/Isometric Buildings 2 - 64x96.png",
  isoBuilding3:
    "assets/Map/Isometric/Building-tiles/Isometric Buildings 3 - 64x96.png",
  isoRoofs:
    "assets/Map/Isometric/Roof-tiles/Isometric Town Roofing - 143x92.png",
  volcano: "assets/Map/Ground/lavaCone00.png",
  nuclearPlant: "assets/Map/Nuclear-usine.png",
  partyHouse: "assets/Map/party-house.png",
  bonfire: "assets/Map/Objects/World-at-piece/bonfire.png",
  ...Object.fromEntries(
    ["EW", "NE", "NEWS", "NS", "NW", "PLAZA", "SE", "SW"].map((n) => [
      "road" + n,
      "roads/road" + n + ".png",
    ]),
  ),
  trashBag: "assets/Map/Objects/Trash-bag_1.png",
  trashBin: "assets/Map/Objects/Garbage-Bin_1.png",
  manhole: "assets/Map/Objects/Manhole.png",
  stopSign: "assets/Map/Objects/Stop-sign_Down_1.png",
  debris: "assets/Map/Objects/Gray-brick_Debris.png",
  cart: "assets/Map/Objects/Shopping-cart.png",
  tire: "assets/Map/Objects/Tire_2_Grass_Dark-Green.png",
  cardboard: "assets/Map/Objects/Cardboard_1.png",
  rifle: "assets/Itens/Weapons/Rifles-and-pistol-sprites/PNG/mpx.png",
  sniper: "assets/Itens/Weapons/Rifles-and-pistol-sprites/PNG/kar98.png",
  shotgun: "assets/Itens/Weapons/Rifles-and-pistol-sprites/PNG/shotgun.png",
  urban0006:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Modular Big Building/Zombie-Tileset---_0006_Capa-7.png",
  urban0007:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Modular Big Building/Zombie-Tileset---_0007_Capa-8.png",
  urban0012:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Modular Big Building/Zombie-Tileset---_0012_Capa-13.png",
  urban0132:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Modular Fences/Zombie-Tileset---_0132_Capa-133.png",
  urban0133:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Modular Fences/Zombie-Tileset---_0133_Capa-134.png",
  urban0225:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Gas Station/Zombie-Tileset---_0225_Capa-226.png",

  houseKit: "assets/Map/Houses/Exterrior/walls_roofs_and_other.png",
  houseInteriorFloors: "assets/Map/Houses/Interrior/Floors_furnitures.png",
  houseInteriorWalls: "assets/Map/Houses/Interrior/Walls_sides_other.png",
  oceanAutotiles: "assets/Map/Water/ocean-autotiles-anim.png",
  calmWater: "assets/Map/Water/calm-water-autotiles-anim.png",
  barrel: "assets/Map/Objects/Barrel_rust_blue_1.png",
  beam: "assets/Map/Objects/Iron-beam.png",
  pallet: "assets/Map/Objects/Pallet_1.png",
  fridge: "assets/Map/Objects/Refrigerator.png",
  streetLight: "assets/Map/Objects/Street-Light_1_Side.png",
  bench: "assets/Map/Objects/Bench_1_down.png",
  cone: "assets/Map/Objects/Traffic-cone.png",
  urban0029:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Modular Road/Zombie-Tileset---_0029_Capa-30.png",
  urban0039:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Modular Road/Zombie-Tileset---_0039_Capa-40.png",
  urban0053:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Modular Road/Zombie-Tileset---_0053_Capa-54.png",
  urban0077:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Terrain Variations/Zombie-Tileset---_0077_Capa-78.png",
  urban0078:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Terrain Variations/Zombie-Tileset---_0078_Capa-79.png",
  urban0079:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Terrain Variations/Zombie-Tileset---_0079_Capa-80.png",
  urban0080:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Terrain Variations/Zombie-Tileset---_0080_Capa-81.png",
  urban0151:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Urban Assets/Zombie-Tileset---_0151_Capa-152.png",
  urban0152:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Urban Assets/Zombie-Tileset---_0152_Capa-153.png",
  urban0154:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Urban Assets/Zombie-Tileset---_0154_Capa-155.png",
  urban0155:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Urban Assets/Zombie-Tileset---_0155_Capa-156.png",
  urban0160:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Urban Assets/Zombie-Tileset---_0160_Capa-161.png",
  urban0162:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Urban Assets/Zombie-Tileset---_0162_Capa-163.png",
  urban0134:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Trees/Zombie-Tileset---_0134_Capa-135.png",
  urban0135:
    "assets/Map/Zombie Apocalypse Tileset/Organized separated sprites/Trees/Zombie-Tileset---_0135_Capa-136.png",
  terrain: "assets/Map/32x32.png",
  shelterTiles: "assets/EspecialRoom/Shelter/Asset pack shelter/tilemap.png",
  shelterObjects: "assets/EspecialRoom/Shelter/Asset pack shelter/assets.png",
  shelterTree: "assets/EspecialRoom/Shelter/Asset pack shelter/Tree.png",
  car: "assets/EspecialRoom/Shelter/Asset pack shelter/Car.png",
  floor: "assets/HouseInterior/Tiles/PNG_version_2/Walls/Floor2.png",
  floorWood: "assets/HouseInterior/Tiles/PNG_version_2/Walls/Floor5.png",
  bed: "assets/HouseInterior/Objects/PNG/objects_house_0036_Layer-37.png",
  sofa: "assets/HouseInterior/Objects/PNG/objects_house_0000_Layer-1.png",
  table: "assets/HouseInterior/Objects/PNG/objects_house_0048_Layer-49.png",
  chair: "assets/HouseInterior/Objects/PNG/objects_house_0026_Layer-27.png",
  plant: "assets/HouseInterior/Objects/PNG/objects_house_0056_Layer-57.png",
  food: "assets/Itens/Foods/apple.png",
  spoiled: "assets/Itens/Foods/spoiled-food.png",
  bandage: "assets/Itens/Medicine/PNG/bandage.png",
  medicine: "assets/Itens/Medicine/PNG/remedy1.png",
  ammo: "assets/Itens/Ammunition/9x19mm.png",
  scrap: "assets/Itens/Variable/sucata.png",
  cloth: "assets/Itens/Variable/gloves.png",
  radio: "assets/Itens/Variable/radio.png",
  weapon: "assets/Itens/Weapons/Rifles-and-pistol-sprites/PNG/desert-eagle.png",
  backpack1: "assets/Itens/Variable/backpack.png",
  backpack2: "assets/Itens/Variable/backpack.png",
  backpack3: "assets/Itens/Variable/backpack.png",
};
export const actors = [
  {
    key: "player",
    folder: "assets/Character",
    size: 128,
    actions: [
      "Idle",
      "Idle2",
      "Walk",
      "Run",
      "Attack1",
      "Attack2",
      "Attack4",
      "CrouchIdle",
      "CrouchRun",
      "RunBackwards",
      "StrafeLeft",
      "StrafeRight",
      "TakeDamage",
      "Die",
    ],
  },
  {
    key: "walker",
    folder: "assets/NormalZombie/Zombie Man",
    size: 96,
    actions: ["Idle", "Walk", "Run", "Attack_1", "Hurt", "Dead"],
  },
  {
    key: "runner",
    folder: "assets/NormalZombie/Wild Zombie",
    size: 96,
    actions: ["Idle", "Walk", "Run", "Attack_1", "Hurt", "Dead"],
  },
  {
    key: "lurker",
    folder: "assets/NormalZombie/Zombie Woman",
    size: 96,
    actions: ["Idle", "Walk", "Run", "Attack_1", "Hurt", "Dead"],
  },
  ...[1, 2, 3, 4].map((n) => ({
    key: "shambler" + n,
    folder: "assets/NormalZombie/Zombie_" + n,
    size: 128,
    actions: ["Idle", "Walk", "Attack", "Hurt", "Dead"],
  })),
];
export const STORY_MUSIC: Record<string, string> = {
  "story-music-0":
    "Eletronic_Music/den_elbriggs__eddie_lung-experimental-background-trance-beat-272688.mp3",
  "story-music-1": "Eletronic_Music/imia-rek-cursed-lands-393777.mp3",
  "story-music-2": "Eletronic_Music/mixkit-autofahren-770.mp3",
  "story-music-3": "Eletronic_Music/mixkit-infected-vibes-157.mp3",
  "story-music-4":
    "Eletronic_Music/out-in-the-night-otto-mp3-main-version-45586-02-45.mp3",
  "story-music-5":
    "Eletronic_Music/sonofabutcher-post-apocalyptic-378441.mp3",
};

export function loadAssets(scene: Phaser.Scene) {
  Object.entries(images).forEach(([key, path]) =>
    scene.load.image(key, assetUrl(path)),
  );
  for (let tree = 1; tree <= 8; tree++)
    for (let frame = 0; frame < 4; frame++)
      scene.load.image(
        `tree-${tree}-${frame}`,
        assetUrl(
          `assets/Map/Trees/trees-greenland/tree${tree}/tree${tree}_${String(frame).padStart(2, "0")}.png`,
        ),
      );
  actors.forEach((a) =>
    a.actions.forEach((action) =>
      scene.load.spritesheet(
        `${a.key}-${action}`,
        assetUrl(`${a.folder}/${action}.png`),
        { frameWidth: a.size, frameHeight: a.size },
      ),
    ),
  );
  const recordings: Record<string, string> = {
    "shot-real": "shot-real.wav",
    reload: "reload.wav",
    equip: "reload_2.wav",
    "door-real": "door-real.ogg",
    night: "night.mp3",
    "score-dark": "score-dark.ogg",
    "score-ruins": "score-ruins.ogg",
  };
  Object.entries(recordings).forEach(([key, file]) =>
    scene.load.audio(key, "/audio/recorded/" + file),
  );

  const supplied: Record<string, string> = {
    "intro-logo": "no-one-left.mp3",
    "menu-music": "Menu-theme/bridge-of-death.mp3",
    "playing-music": "Music/playing/music-playing-1.mp3",
    "ui-click": "Interface/user-interface-click-01.wav",
    "ui-open": "Interface/user-interface-menu-appearance-short-01.wav",
    "ui-close": "Interface/user-interface-menu-closed.wav",
    "backpack-open": "Sample_A_Sound_Effect/BackpackPickUp.wav",
    "backpack-close": "Sample_A_Sound_Effect/Backpack_Drop.wav",
    geiger: "Ambient/geiger.mp3",
    "radio-bip": "Ambient/bip-radio.mp3",
    "horror-atmo":
      "Ambient/atmo-horror-drone-deep-synth-metal-creak-loop-01.wav",
    "wild-step-1": "Zombies/heavy_footsteps.wav",
    "wild-step-2": "Zombies/heavy_footsteps-02.wav",
    "zombie-breath": "Zombies/zombie-breath.mp3",
    "zombie-attack": "Zombies/zombie-attack.mp3",
    "zombie-death": "Zombies/zombie_runner_death.wav",
    "zombie-voice": "Zombies/Zombie-moaning.mp3",
    "zombie-growl": "Zombies/Growling-zombie.mp3",
    "zombie-screech": "Zombies/Strong-zombie-screech.mp3",
    "player-hit-1": "Character/get-hit-1.wav",
    "player-hit-2": "Character/get-hit-2.wav",
    "punch-real": "Character/hit-punch.mp3",
    "last-punch": "Character/last-hit-before-kill.mp3",
    "drink-real": "Character/object-bottle-glass-drink-swallow-01.wav",
    heartbeat: "Character/human-body-heartbeat-low-health.wav",
    "grass-step-1":
      "Footsteps_Essentials/Footsteps_Grass/Footsteps_Grass_Walk/Footsteps_Walk_Grass_Mono_01.wav",
    "grass-step-2":
      "Footsteps_Essentials/Footsteps_Grass/Footsteps_Grass_Walk/Footsteps_Walk_Grass_Mono_02.wav",
    "ground-step-1":
      "Footsteps_Essentials/Footsteps_DirtyGround/Footsteps_DirtyGround_Walk/Footsteps_DirtyGround_Walk_01.wav",
    "ground-step-2":
      "Footsteps_Essentials/Footsteps_DirtyGround/Footsteps_DirtyGround_Walk/Footsteps_DirtyGround_Walk_02.wav",
    "tile-step-1":
      "Footsteps_Essentials/Footsteps_Tile/Footsteps_Tile_Walk/Footsteps_Tile_Walk_01.wav",
    "tile-step-2":
      "Footsteps_Essentials/Footsteps_Tile/Footsteps_Tile_Walk/Footsteps_Tile_Walk_02.wav",
    "water-step-1":
      "Footsteps_Essentials/Footsteps_Water/Footsteps_Water_Walk/Footsteps_WaterV1_Walk_01.wav",
    "water-step-2":
      "Footsteps_Essentials/Footsteps_Water/Footsteps_Water_Walk/Footsteps_WaterV1_Walk_02.wav",
    "wood-step-1":
      "Footsteps_Essentials/Footsteps_Wood/Footsteps_Wood_Walk/Footsteps_Wood_Walk_01.wav",
    "wood-step-2":
      "Footsteps_Essentials/Footsteps_Wood/Footsteps_Wood_Walk/Footsteps_Wood_Walk_02.wav",
    "nature-sea": "Nature_Essentials/Ambiance_Sea_Loop_Stereo.wav",
    "nature-forest": "Nature_Essentials/Ambiance_Wind_Forest_Loop_Stereo.wav",
    "nature-campfire":
      "Nature_Essentials/Ambiance_Firecamp_Medium_Loop_Mono.wav",
    "shot-pistol": "Weapons/pistol-fire.wav",
    "reload-pistol": "Weapons/pistol-reload.mp3",
    "shot-rifle": "Weapons/assault-rifle-fire.wav",
    "reload-rifle": "Weapons/assault-rifle-reload.wav",
    "shot-shotgun": "Weapons/shotgun-fire.mp3",
    "reload-shotgun": "Weapons/shotgun-reload.mp3",
    casing: "Weapons/bullet-drop.wav",
    ricochet: "Weapons/bullet-ricochet.wav",
    flyby: "Weapons/shot-ricochet-drop-01.wav",
    "horror-violins": "Music/atmo-pads-ringing-horror-short-01.wav",
  };
  
  Object.entries(supplied).forEach(([key, path]) =>
    scene.load.audio(key, assetUrl("assets/Sounds/" + path)),
  );
  ["score", "shot", "step", "growl", "door", "pickup", "hit", "wind"].forEach(
    (key) => scene.load.audio(key, `/audio/${key}.wav`),
  );
}
export function createAnimations(scene: Phaser.Scene) {
  actors.forEach((a) =>
    a.actions.forEach((action) => {
      const key = `${a.key}-${action}`;

      if (a.key === "player") {
        for (let row = 0; row < 8; row++) {
          if (action === "Attack4") {
            const guard = "player-Guard-" + row;
            if (!scene.anims.exists(guard))
              scene.anims.create({
                key: guard,
                frames: scene.anims.generateFrameNumbers(key, {
                  start: row * 14,
                  end: row * 14,
                }),
                frameRate: 1,
                repeat: -1,
              });
            const punch = "player-Punch-" + row;
            if (!scene.anims.exists(punch))
              scene.anims.create({
                key: punch,
                frames: scene.anims.generateFrameNumbers(key, {
                  start: row * 14,
                  end: row * 14 + 7,
                }),
                frameRate: 22,
                repeat: 0,
              });
          }
          const k = key + "-" + row;
          if (!scene.anims.exists(k))
            scene.anims.create({
              key: k,
              frames: scene.anims.generateFrameNumbers(key, {
                start: row * 14,
                end: row * 14 + 13,
              }),
              frameRate: ["Run", "CrouchRun"].includes(action)
                ? 18
                : action === "Idle" ||
                    action === "Idle2" ||
                    action === "CrouchIdle"
                  ? 10
                  : 20,
              repeat: [
                "Idle",
                "Idle2",
                "Walk",
                "Run",
                "CrouchIdle",
                "CrouchRun",
                "RunBackwards",
                "StrafeLeft",
                "StrafeRight",
              ].includes(action)
                ? -1
                : 0,
            });
        }
        return;
      }
      if (!scene.anims.exists(key))
        scene.anims.create({
          key,
          frames: scene.anims.generateFrameNumbers(key),
          frameRate: action === "Run" ? 12 : action === "Idle" ? 6 : 9,
          repeat: ["Idle", "Walk", "Run"].includes(action) ? -1 : 0,
        });
    }),
  );
  const chroma = (source: string, target: string) => {
    const src = scene.textures.get(source).getSourceImage() as HTMLImageElement,
      canvas = scene.textures.createCanvas(target, src.width, src.height)!,
      ctx = canvas.context;
    ctx.drawImage(src, 0, 0);
    const pixels = ctx.getImageData(0, 0, src.width, src.height),
      data = pixels.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      if (r < 35 && g > 100 && b > 100 && Math.abs(g - b) < 45) data[i + 3] = 0;
    }
    ctx.putImageData(pixels, 0, 0);
    canvas.refresh();
    return canvas;
  };
  for (let n = 1; n <= 3; n++) {
    const texture = chroma("isoBuilding" + n, "isoClean" + n);
    for (let i = 0; i < 72; i++)
      texture.add("b" + i, 0, (i % 9) * 128, Math.floor(i / 9) * 96, 128, 96);
  }
  const roofs = chroma("isoRoofs", "roofClean");
  for (let i = 0; i < 12; i++)
    roofs.add("r" + i, 0, (i % 3) * 144, Math.floor(i / 3) * 92, 144, 92);
  const fire = scene.textures.get("bonfire");
  const fireXs = [0, 443, 887, 1330];
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 4; col++)
      fire.add(
        "fire" + (row * 4 + col),
        0,
        fireXs[col],
        row ? 443 : 0,
        col === 0 ? 443 : col === 1 ? 444 : 443,
        row ? 444 : 443,
      );
  if (!scene.anims.exists("story-fire"))
    scene.anims.create({
      key: "story-fire",
      frames: Array.from({ length: 8 }, (_, i) => ({
        key: "bonfire",
        frame: "fire" + i,
      })),
      frameRate: 10,
      repeat: -1,
    });
  for (const mask of [7, 11, 13, 14]) {
    const tile = scene.textures.createCanvas("roadT" + mask, 256, 256)!,
      ctx = tile.context;
    ctx.drawImage(
      scene.textures.get("roadNEWS").getSourceImage() as HTMLImageElement,
      0,
      0,
    );
    for (const [bit, key, x, y, w, h] of [
      [1, "roadEW", 0, 0, 256, 64],
      [2, "roadNS", 192, 0, 64, 256],
      [4, "roadEW", 0, 192, 256, 64],
      [8, "roadNS", 0, 0, 64, 256],
    ] as [number, string, number, number, number, number][]) {
      if (!(mask & bit))
        ctx.drawImage(
          scene.textures.get(key).getSourceImage() as HTMLImageElement,
          x,
          y,
          w,
          h,
          x,
          y,
          w,
          h,
        );
    }
    tile.refresh();
  }
  for (let tree = 1; tree <= 8; tree++)
    scene.anims.create({
      key: `tree-sway-${tree}`,
      frames: Array.from({ length: 4 }, (_, frame) => ({
        key: `tree-${tree}-${frame}`,
      })),
      frameRate: 3 + (tree % 2),
      repeat: -1,
      yoyo: true,
    });

  const kit = scene.textures.get("houseKit").getSourceImage() as HTMLImageElement;
  const makeHouse = (index: number) => {
    const texture = scene.textures.createCanvas(`houseModel${index}`, 224, 248)!;
    const ctx = texture.context;
    ctx.imageSmoothingEnabled = false;
    const brick = index === 1;
    // Every facade is assembled from loose roof, wall, door and window parts.
    if (index === 2) ctx.drawImage(kit, 576, 12, 128, 118, 48, 3, 128, 118);
    else ctx.drawImage(kit, 20, 24, 184, 72, 20, 4, 184, 72);
    for (let x = 20; x < 204; x += 84)
      ctx.drawImage(kit, brick ? 352 : 20, brick ? 224 : 128, brick ? 96 : 84, 64, x, 74, 84, 64);
    for (let x = 20; x < 204; x += 84)
      ctx.drawImage(kit, brick ? 352 : 20, brick ? 224 : 128, brick ? 96 : 84, 64, x, 136, 84, 64);
    ctx.drawImage(kit, 480 + (index % 2) * 48, 24, 32, 80, 96, 156, 32, 80);
    ctx.drawImage(kit, 400, 136, 18, 25, 50, 150, 27, 38);
    ctx.drawImage(kit, 400, 136, 18, 25, 150, 150, 27, 38);
    const pixels = ctx.getImageData(0, 0, 224, 248), data = pixels.data;
    for (let i = 0; i < data.length; i += 4)
      if (data[i] > 205 && data[i + 1] > 175 && data[i + 2] > 145) data[i + 3] = 0;
    ctx.putImageData(pixels, 0, 0);
    texture.refresh();
  };
  for (let i = 0; i < 3; i++) makeHouse(i);

  const oceanSource = scene.textures.get("oceanAutotiles").getSourceImage() as HTMLImageElement;
  const ocean = scene.textures.createCanvas("waterOcean", 64, 64)!;
  ocean.context.imageSmoothingEnabled = false;
  ocean.context.drawImage(oceanSource, 656, 96, 64, 64, 0, 0, 64, 64);
  ocean.refresh();
  const calmSource = scene.textures.get("calmWater").getSourceImage() as HTMLImageElement;
  for (let frame = 0; frame < 12; frame++)
    scene.textures.get("calmWater").add(`calm-${frame}`, 0, frame * 128, 0, 128, 128);
  scene.anims.create({
    key: "calm-water",
    frames: Array.from({ length: 12 }, (_, frame) => ({ key: "calmWater", frame: `calm-${frame}` })),
    frameRate: 5,
    repeat: -1,
  });
  const lake = scene.textures.createCanvas("waterLake", 128, 128)!;
  lake.context.imageSmoothingEnabled = false;
  lake.context.drawImage(calmSource, 0, 0, 128, 128, 0, 0, 128, 128);
  lake.refresh();
  const terrain = scene.textures.get("terrain");
  const interiorWalls = scene.textures.get("houseInteriorWalls");
  if (!interiorWalls.has("wall-strip"))
    interiorWalls.add("wall-strip", 0, 0, 0, 256, 96);
  const interiorFloors = scene.textures.get("houseInteriorFloors");
  if (!interiorFloors.has("furniture"))
    interiorFloors.add("furniture", 0, 128, 192, 128, 96);

  const frames: [string, number, number, number, number][] = [
    ["deadTree", 960, 480, 288, 320],
    ["rock", 864, 576, 64, 64],
    ["crate", 868, 448, 64, 64],
    ["junk", 768, 512, 64, 64],
    ["tire", 864, 512, 64, 64],
    ["grass", 832, 676, 36, 56],
    ["couch", 704, 668, 96, 96],
  ];
  frames.forEach(([key, x, y, w, h]) => {
    if (!terrain.has(key)) terrain.add(key, 0, x, y, w, h);
  });
  const shelter = scene.textures.get("shelterObjects");
  const objects: [string, number, number, number, number][] = [
    ["hatch", 50, 0, 59, 50],
    ["stove", 20, 57, 44, 54],
    ["locker", 69, 57, 28, 47],
    ["bench", 64, 98, 44, 14],
  ];

  objects.forEach(([key, x, y, w, h]) => {
    if (!shelter.has(key)) shelter.add(key, 0, x, y, w, h);
  });

  scene.textures.get("car").add("red", 0, 0, 32, 64, 38);

  scene.textures.get("car").add("gray", 0, 64, 0, 64, 32);

  scene.textures.get("shelterTree").add("greenTree", 0, 0, 16, 96, 96);

  scene.textures.get("shelterTiles").add("earth", 0, 32, 48, 16, 16);

  const vignette = scene.textures.createCanvas("vignette", 512, 512)!;

  const gradient = vignette.context.createRadialGradient(
    256,
    256,
    40,
    256,
    256,
    300,
  );

  gradient.addColorStop(0, "rgba(3,13,8,0)");
  gradient.addColorStop(0.45, "rgba(3,13,8,.08)");
  gradient.addColorStop(1, "rgba(3,13,8,.9)");

  vignette.context.fillStyle = gradient;
  vignette.context.fillRect(0, 0, 512, 512);
  vignette.refresh();

  const g = scene.add.graphics();
  g.fillStyle(0x263d39);
  g.fillRoundedRect(7, 8, 18, 29, 4);
  g.fillStyle(0x8cc0b0);
  g.fillRoundedRect(10, 10, 12, 23, 2);
  g.fillStyle(0xd2dcbd);
  g.fillRect(12, 3, 8, 5);
  g.generateTexture("water", 32, 40);
  g.clear();
  g.fillStyle(0x6d8066);
  g.fillRoundedRect(7, 8, 18, 29, 4);
  g.fillStyle(0xced290);
  g.fillRect(12, 3, 8, 5);
  g.generateTexture("dirtyWater", 32, 40);
  g.clear();
  g.fillStyle(0x836b49);
  g.fillRoundedRect(3, 10, 32, 12, 3);
  g.lineStyle(2, 0x403a2e);
  g.lineBetween(8, 14, 29, 14);
  g.generateTexture("wood", 40, 32);
  g.clear();
  g.fillStyle(0xffffff);
  g.fillCircle(2, 2, 2);
  g.generateTexture("mote", 4, 4);
  g.destroy();
}
