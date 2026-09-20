import { WEAPONS, weaponId, isWeapon, type WeaponId } from "./weapons.ts";
import { EXTRA_ITEMS, NUTRITION, EXTRA_PHYSICS } from "./supplies.ts";
import { WORLD, ROOM } from "./world.ts";
export type ItemId =
  | keyof typeof EXTRA_ITEMS
  | "food"
  | "water"
  | "dirtyWater"
  | "spoiled"
  | "bandage"
  | "medicine"
  | "ammo"
  | "wood"
  | "scrap"
  | "cloth"
  | "weapon"
  | "rifle"
  | "sniper"
  | "shotgun"
  | "backpack1"
  | "backpack2"
  | "backpack3";
export type Inventory = Record<ItemId, number>;
export interface Vitals {
  health: number;
  hunger: number;
  thirst: number;
  stamina: number;
  infection: number;
  armor: number;
}
export interface ShelterState {
  discovered: boolean;
  barricaded: boolean;
  stash: Inventory;
}
export interface SaveData {
  equippedWeapon?: WeaponId;
  magazines?: Partial<Record<WeaponId, number>>;
  version: 2;
  worldVersion?: 3;
  fruitTimers?: Record<string, number>;
  gear?: { mask: number; nightVision: boolean };
  grid: GridItem[];
  backpack: 1 | 2 | 3;
  hotbar: (string | null)[];
  dropped: DroppedItem[];
  containers: Record<string, Inventory>;
  nextItem: number;
  seed: number;
  x: number;
  y: number;
  minutes: number;
  elapsed: number;
  vitals: Vitals;
  inventory: Inventory;
  collected: string[];
  killed: string[];
  shelters: Record<string, ShelterState>;
  camps: { x: number; y: number }[];
  radio: boolean;
  rescueAt: number;
  ammo: number;
  kills: number;
}
export const SAVE_KEY = "no-one-left.save.v1";
export const ITEMS: Record<
  ItemId,
  { name: string; description: string; icon: string; category: string }
> = {
  ...EXTRA_ITEMS,
  food: {
    name: "Alimento",
    description: "Uma pequena reserva. Recupera 30 de saciedade.",
    icon: "food",
    category: "Suprimentos",
  },
  water: {
    name: "Água potável",
    description: "Filtrada e segura. Recupera 40 de hidratação.",
    icon: "water",
    category: "Suprimentos",
  },
  dirtyWater: {
    name: "Água contaminada",
    description:
      "Recupera 25 de hidratação, mas causa infecção. Purifique em um abrigo.",
    icon: "dirtyWater",
    category: "Suprimentos",
  },
  spoiled: {
    name: "Alimento estragado",
    description: "Recupera 15 de saciedade, mas causa infecção.",
    icon: "spoiled",
    category: "Suprimentos",
  },
  bandage: {
    name: "Bandagem",
    description: "Estanca ferimentos. Recupera 25 de vida.",
    icon: "bandage",
    category: "Medicina",
  },
  medicine: {
    name: "Antibiótico",
    description: "Reduz a infecção em 40 pontos.",
    icon: "medicine",
    category: "Medicina",
  },
  ammo: {
    name: "Reserva de munição",
    description:
      "Reserva compartilhada pelas armas nesta versão. Recarregue com R.",
    icon: "ammo",
    category: "Equipamento",
  },
  wood: {
    name: "Madeira",
    description: "Construa um acampamento ou reforce um abrigo.",
    icon: "wood",
    category: "Materiais",
  },
  scrap: {
    name: "Sucata",
    description: "Peças para fabricar proteção e manter o abrigo.",
    icon: "scrap",
    category: "Materiais",
  },
  rifle: {
    name: "Rifle",
    description:
      "20 tiros. Cadência rápida; encontre em armários e porta-malas.",
    icon: "rifle",
    category: "Equipamento",
  },
  sniper: {
    name: "Sniper",
    description: "5 tiros. Alto dano, disparos lentos; ocupa mais espaço.",
    icon: "sniper",
    category: "Equipamento",
  },
  shotgun: {
    name: "Escopeta 12",
    description: "6 cartuchos. Grande dano a curta distância e recarga lenta.",
    icon: "shotgun",
    category: "Equipamento",
  },
  weapon: {
    name: "Glock",
    description: "9 mm. Perde durabilidade ao atirar; sucata permite reparar.",
    icon: "weapon",
    category: "Equipamento",
  },
  backpack1: {
    name: "Mochila I",
    description: "12 kg · grade 6 × 5 · peso 0,8 kg.",
    icon: "backpack1",
    category: "Equipamento",
  },
  backpack2: {
    name: "Mochila II",
    description: "22 kg · grade 7 × 6 · peso 1,3 kg.",
    icon: "backpack2",
    category: "Equipamento",
  },
  backpack3: {
    name: "Mochila III",
    description: "35 kg · grade 8 × 7 · peso 2 kg.",
    icon: "backpack3",
    category: "Equipamento",
  },
  cloth: {
    name: "Tecido",
    description: "Fabrique bandagens e proteção improvisada.",
    icon: "cloth",
    category: "Materiais",
  },
};
export const SHELTERS = [
  {
    id: "ash",
    name: "Refúgio das cinzas",
    label: "01",
    x: 1168,
    y: 880,
    description:
      "Um lugar para respirar. Entre os escombros, ainda existe uma cama.",
    theme: "amber",
  },
  {
    id: "station",
    name: "Estação esquecida",
    label: "02",
    x: 2544,
    y: 624,
    description: "Sob a velha ferrovia, remédios e silêncio aguardam.",
    theme: "blue",
  },
  {
    id: "signal",
    name: "Último sinal",
    label: "03",
    x: 688,
    y: 2080,
    description: "Um rádio quebrado. Talvez alguém ainda esteja ouvindo.",
    theme: "green",
  },
] as const;
export const emptyInventory = (): Inventory =>
  Object.fromEntries(Object.keys(ITEMS).map((id) => [id, 0])) as Inventory;
export const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));
export function newGame(
  seed = Math.floor(Math.random() * 2147483647),
): SaveData {
  const state: SaveData = {
    version: 2,
    worldVersion: 3,
    grid: [],
    backpack: 1,
    hotbar: [null, null, null, null, null],
    dropped: [],
    containers: {},
    nextItem: 1,
    seed,
    x: 1568,
    y: 1330,
    minutes: 17 * 60 + 20,
    elapsed: 0,
    vitals: {
      health: 100,
      hunger: 86,
      thirst: 78,
      stamina: 100,
      infection: 0,
      armor: 0,
    },
    inventory: {
      ...emptyInventory(),
      food: 2,
      water: 2,
      bandage: 1,
      ammo: 24,
      weapon: 1,
    },
    collected: [],
    killed: [],
    shelters: Object.fromEntries(
      SHELTERS.map((s) => [
        s.id,
        { discovered: false, barricaded: false, stash: emptyInventory() },
      ]),
    ),
    camps: [],
    radio: false,
    rescueAt: 0,
    ammo: 8,
    kills: 0,
  };
  reconcileGrid(state);
  state.hotbar = ["food", "water", "bandage", "weapon", null].map(
    (id) => state.grid.find((i) => i.item === id)?.uid ?? null,
  );
  return state;
}
export function randomGenerator(seed: number) {
  let value = seed >>> 0;
  return () =>
    (value = (Math.imul(value, 1664525) + 1013904223) >>> 0) / 4294967296;
}
export function isNight(minutes: number) {
  const h = (minutes % 1440) / 60;
  return h < 6 || h >= 19;
}
export function clockText(minutes: number) {
  const t = Math.floor(minutes % 1440);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
export function updateSurvival(
  state: SaveData,
  dt: number,
  sprinting: boolean,
  moving: boolean,
  safe: boolean,
) {
  state.elapsed += dt;
  state.minutes += dt * 1.7;
  const v = state.vitals;
  v.hunger = clamp(v.hunger - dt * (sprinting ? 0.065 : 0.027));
  v.thirst = clamp(v.thirst - dt * (sprinting ? 0.1 : 0.044));
  v.stamina = clamp(
    v.stamina +
    dt *
    (sprinting && moving ? -23 : v.hunger > 15 && v.thirst > 15 ? 15 : 5),
  );
  if (v.infection > 0)
    v.infection = clamp(v.infection + dt * (safe ? 0 : 0.006));
  const damage =
    (v.hunger <= 0 ? 0.5 : 0) +
    (v.thirst <= 0 ? 0.8 : 0) +
    (v.infection >= 30 ? v.infection / 140 : 0);
  v.health = clamp(v.health - dt * damage);
}
export function consume(state: SaveData, id: ItemId, uid?: string): string {
  if (state.inventory[id] <= 0) return "Você não tem esse item.";
  const selected = uid
    ? state.grid.find((item) => item.uid === uid && item.item === id)
    : state.grid.find((item) => item.item === id);
  if (!selected) return "Item não encontrado na mochila.";
  const v = state.vitals;
  const n = NUTRITION[id];
  if (n?.raw) return "Cozinhe este alimento na fogueira ou no fogão.";
  if (n) {
    v.hunger = clamp(v.hunger + n.hunger);
    v.thirst = clamp(v.thirst + n.thirst);
  } else if (id === "vest") v.armor = 50;
  else if (id === "gasMask" || id === "mask") {
    state.gear ??= { mask: 0, nightVision: false };
    state.gear.mask = id === "gasMask" ? 0.85 : 0.5;
  } else if (id === "nightVision") {
    if (!state.inventory.battery) return "Precisa de uma bateria.";
    state.inventory.battery--;
    reconcileGrid(state);
    state.gear ??= { mask: 0, nightVision: false };
    state.gear.nightVision = true;
  } else if (id === "grenade" || id === "smoke" || id === "musicRadio") {
  } else if (id === "note")
    return "Nota: árvores dão frutos; carne exige fogo. Agache para passar despercebido. A costa é seu limite.";
  else if (id === "food") v.hunger = clamp(v.hunger + 30);
  else if (id === "water") v.thirst = clamp(v.thirst + 40);
  else if (id === "dirtyWater") {
    v.thirst = clamp(v.thirst + 25);
    v.infection = clamp(v.infection + 22);
  } else if (id === "spoiled") {
    v.hunger = clamp(v.hunger + 15);
    v.infection = clamp(v.infection + 18);
  } else if (id === "bandage") v.health = clamp(v.health + 25);
  else if (id === "medicine") v.infection = clamp(v.infection - 40);
  else return "Este item é utilizado na fabricação ou no equipamento.";
  if (id === "food" && selected.durability < 25)
    v.infection = clamp(v.infection + 10);
  state.inventory[id]--;
  selected.count--;
  if (selected.count <= 0) {
    state.grid = state.grid.filter((item) => item.uid !== selected.uid);
    state.hotbar = state.hotbar.map((itemUid) =>
      itemUid === selected.uid ? null : itemUid,
    );
  }
  reconcileGrid(state);
  return `${ITEMS[id].name} utilizado.`;
}
export const RECIPES = {
  fire: {
    name: "Fogueira e abrigo",
    description: "Constrói um acampamento usando isqueiro",
    cost: { wood: 3, lighter: 1 },
  },
  fireMatches: {
    name: "Fogueira com fósforos",
    description: "Constrói um acampamento leve",
    cost: { wood: 3, matches: 1 },
  },
  reinforce: {
    name: "Reforço com pregos e corda",
    description: "Reforça o bunker com materiais encontrados",
    cost: { wood: 2, nails: 3, rope: 1 },
  },
  cookMeat: {
    name: "Assar carne",
    description: "Na fogueira ou fogão · +45 saciedade",
    cost: { rawMeat: 1, wood: 1 },
  },
  cookPotato: {
    name: "Assar batata",
    description: "Na fogueira ou fogão · +32 saciedade",
    cost: { potato: 1, wood: 1 },
  },
  vest: {
    name: "Colete reforçado",
    description: "Equipar para reduzir o dano em 50%",
    cost: { leather: 2, scrap: 3, tape: 1 },
  },
  battery: {
    name: "Recuperar bateria",
    description: "Energia para o visor noturno",
    cost: { scrap: 2, wire: 2 },
  },
  grenade: {
    name: "Montar granada",
    description: "Arremesse pela opção Usar",
    cost: { scrap: 2, ammo: 6, fuel: 1 },
  },
  smoke: {
    name: "Preparar fumaça",
    description: "Oculta sua posição por 8 segundos",
    cost: { cloth: 2, fuel: 1, matches: 1 },
  },
  rope: {
    name: "Trançar corda",
    description: "Material para reforços",
    cost: { cloth: 3 },
  },
  lighter: {
    name: "Reabastecer isqueiro",
    description: "Uma reserva de fogo",
    cost: { fuel: 1, scrap: 1 },
  },

  bandage: {
    name: "Bandagem",
    description: "Recupera 25 de vida",
    cost: { cloth: 2 },
  },
  armor: {
    name: "Proteção improvisada",
    description: "Reduz o dano dos ataques em 35%",
    cost: { scrap: 4, cloth: 2 },
  },
  camp: {
    name: "Acampamento",
    description: "Um novo ponto de descanso no mapa",
    cost: { wood: 6, scrap: 3 },
  },
  barricade: {
    name: "Reforçar abrigo",
    description: "Amplia a zona segura ao redor do bunker",
    cost: { wood: 3, scrap: 2 },
  },
  purify: {
    name: "Purificar água",
    description: "No abrigo, transforma água contaminada em potável",
    cost: { dirtyWater: 1, wood: 1 },
  },
} as const;
export type RecipeId = keyof typeof RECIPES;
export function craft(
  state: SaveData,
  id: RecipeId,
  shelterId?: string,
  nearFire = false,
): string {
  if (!RECIPES[id]) return "Receita inválida.";
  const recipe = RECIPES[id],
    createsCamp = ["camp", "fire", "fireMatches"].includes(id),
    reinforces = id === "barricade" || id === "reinforce";
  if ((reinforces || id === "purify") && !shelterId)
    return "Entre em um abrigo para fazer isso.";
  if (id === "armor" && state.vitals.armor >= 35)
    return "Você já está usando proteção igual ou melhor.";
  if (reinforces && shelterId && state.shelters[shelterId].barricaded)
    return "Este abrigo já está reforçado.";
  if (createsCamp && shelterId)
    return "Saia do bunker para construir um acampamento.";
  if (
    createsCamp &&
    state.camps.some((c) => Math.hypot(c.x - state.x, c.y - state.y) < 200)
  )
    return "Você já tem um acampamento por perto.";
  if ((id === "cookMeat" || id === "cookPotato") && !shelterId && !nearFire)
    return "Aproxime-se de uma fogueira ou use o fogão do bunker.";
  const cost = Object.entries(recipe.cost) as [ItemId, number][];
  if (cost.some(([item, count]) => state.inventory[item] < count))
    return "Materiais insuficientes.";
  cost.forEach(([item, count]) => (state.inventory[item] -= count));
  if (id === "cookMeat") state.inventory.cookedMeat++;
  if (id === "cookPotato") state.inventory.bakedPotato++;
  if (["vest", "battery", "grenade", "smoke", "rope", "lighter"].includes(id))
    state.inventory[id as ItemId]++;
  if (id === "bandage") state.inventory.bandage++;
  if (id === "armor") state.vitals.armor = 35;
  if (createsCamp) state.camps.push({ x: state.x, y: state.y });
  if (reinforces && shelterId) state.shelters[shelterId].barricaded = true;
  if (id === "purify") state.inventory.water++;
  reconcileGrid(state);
  return `${recipe.name}: pronto.`;
}
export function rest(state: SaveData): string {
  if (state.vitals.hunger < 12 || state.vitals.thirst < 12)
    return "Coma e beba antes de descansar.";
  state.minutes += 240;
  state.vitals.health = clamp(state.vitals.health + 35);
  state.vitals.stamina = 100;
  state.vitals.hunger = clamp(state.vitals.hunger - 12);
  state.vitals.thirst = clamp(state.vitals.thirst - 12);
  return "Quatro horas de descanso. Você recuperou 35 de vida.";
}
export function repairRadio(state: SaveData, shelterId?: string): string {
  if (shelterId !== "signal") return "O rádio fica no bunker Último sinal.";
  if (state.radio)
    return "O rádio está ligado. Só há estática lá fora. Continue sobrevivendo.";
  if (state.inventory.scrap < 6)
    return "Você precisa de 6 sucatas para manter o rádio.";
  state.inventory.scrap -= 6;
  reconcileGrid(state);
  state.radio = true;
  state.rescueAt = 0;
  return "Rádio funcionando. Nenhum resgate: este abrigo é sua base para sobreviver.";
}
function number(value: unknown, min: number, max: number): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}
export function validateSave(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as SaveData;
  if (
    (s.version !== (1 as number) && s.version !== 2) ||
    !number(s.seed, 0, 4294967295) ||
    !Number.isInteger(s.seed) ||
    !number(s.x, 20, WORLD.width - 20) ||
    !number(s.y, 20, WORLD.height - 20) ||
    !number(s.minutes, 0, 1e9) ||
    !number(s.elapsed, 0, 1e8) ||
    !s.vitals ||
    !s.inventory ||
    !s.shelters
  )
    return null;
  if (
    !(
      ["health", "hunger", "thirst", "stamina", "infection", "armor"] as const
    ).every((k) => number(s.vitals[k], 0, 100))
  )
    return null;
  const validInventory = (i: Inventory) =>
    i &&
    Object.keys(ITEMS).every(
      (k) =>
        number(i[k as ItemId] ?? 0, 0, 9999) &&
        Number.isInteger(i[k as ItemId] ?? 0),
    );
  if (
    !validInventory(s.inventory) ||
    !SHELTERS.every(
      (t) =>
        s.shelters[t.id] &&
        typeof s.shelters[t.id].discovered === "boolean" &&
        typeof s.shelters[t.id].barricaded === "boolean" &&
        validInventory(s.shelters[t.id].stash),
    )
  )
    return null;
  if (
    !Array.isArray(s.collected) ||
    !Array.isArray(s.killed) ||
    ![...s.collected, ...s.killed].every(
      (i) => typeof i === "string" && i.length < 100,
    ) ||
    s.collected.length > 10000 ||
    s.killed.length > 10000
  )
    return null;
  if (
    !Array.isArray(s.camps) ||
    s.camps.length > 100 ||
    !s.camps.every(
      (c) =>
        c &&
        number(c.x, 20, WORLD.width - 20) &&
        number(c.y, 20, WORLD.height - 20),
    )
  )
    return null;
  if (
    typeof s.radio !== "boolean" ||
    !number(s.rescueAt, 0, 1e8) ||
    !number(s.ammo, 0, WEAPONS[weaponId(s)]?.capacity ?? 8) ||
    !Number.isInteger(s.ammo) ||
    !number(s.kills, 0, 1e6)
  )
    return null;
  if (s.equippedWeapon !== undefined && !isWeapon(s.equippedWeapon))
    return null;
  if (
    s.magazines &&
    Object.entries(s.magazines).some(
      ([id, n]) =>
        !isWeapon(id) ||
        !number(n, 0, WEAPONS[id].capacity) ||
        !Number.isInteger(n),
    )
  )
    return null;
  const copy = structuredClone(s);
  if (
    copy.gear &&
    (!number(copy.gear.mask, 0, 1) ||
      typeof copy.gear.nightVision !== "boolean")
  )
    return null;
  if (
    copy.fruitTimers &&
    Object.values(copy.fruitTimers).some((t) => !number(t, 0, 1e8))
  )
    return null;
  copy.inventory = { ...emptyInventory(), ...copy.inventory };
  for (const shelter of Object.values(copy.shelters))
    shelter.stash = { ...emptyInventory(), ...shelter.stash };
  if (!copy.worldVersion && Array.isArray(copy.dropped))
    for (const drop of copy.dropped)
      if (drop.shelter && number(drop.x, 3700, 4220)) drop.x += ROOM.cx - 3960;
  copy.worldVersion = 3;
  const legacy = (copy.version as number) === 1;
  if (legacy) {
    copy.version = 2;
    copy.grid = [];
    copy.backpack = 3;
    copy.hotbar = [null, null, null, null, null];
    copy.dropped = [];
    copy.containers = {};
    copy.nextItem = 1;
    copy.inventory.weapon ||= 1;
  }
  if (
    ![1, 2, 3].includes(copy.backpack) ||
    !Array.isArray(copy.grid) ||
    !Array.isArray(copy.hotbar) ||
    copy.hotbar.length !== 5 ||
    !Array.isArray(copy.dropped) ||
    !copy.containers ||
    !number(copy.nextItem, 1, 1e8)
  )
    return null;
  const seen = new Set<string>();
  for (const item of copy.grid) {
    if (
      !item ||
      !(item.item in ITEMS) ||
      typeof item.uid !== "string" ||
      seen.has(item.uid) ||
      !number(item.count, 1, 9999) ||
      !Number.isInteger(item.count) ||
      !number(item.durability, 0, 100) ||
      !Number.isInteger(item.x) ||
      !Number.isInteger(item.y)
    )
      return null;
    seen.add(item.uid);
  }
  if (
    copy.hotbar.some(
      (uid) => uid !== null && (typeof uid !== "string" || !seen.has(uid)),
    ) ||
    copy.grid.some((i) => !canPlace(copy, i.uid, i.x, i.y))
  )
    return null;
  if (
    copy.dropped.length > 1000 ||
    copy.dropped.some(
      (d) =>
        !d ||
        typeof d.id !== "string" ||
        !(d.item in ITEMS) ||
        !number(d.x, 0, ROOM.cx + 640) ||
        !number(d.y, 0, WORLD.height) ||
        !number(d.count, 1, 9999) ||
        !number(d.durability, 0, 100) ||
        (d.rotRemaining !== undefined && !number(d.rotRemaining, 0, 180)),
    )
  )
    return null;
  if (
    !Object.entries(copy.containers).every(
      ([key, inv]) => key.length < 100 && validInventory(inv),
    )
  )
    return null;
  if (!legacy && !inventoryMatchesGrid(copy)) return null;
  for (const [id, inv] of Object.entries(copy.containers))
    copy.containers[id] = { ...emptyInventory(), ...inv };
  reconcileGrid(copy);
  if (legacy) {
    for (const id of Object.keys(ITEMS) as ItemId[]) {
      const missing =
        copy.inventory[id] -
        copy.grid.filter((g) => g.item === id).reduce((n, g) => n + g.count, 0);
      if (missing > 0) {
        copy.shelters.ash.stash[id] += missing;
        copy.inventory[id] -= missing;
      }
    }
    while (
      carryWeight(copy) > PACKS[copy.backpack].capacity &&
      copy.grid.length
    ) {
      const g = copy.grid[copy.grid.length - 1];
      copy.shelters.ash.stash[g.item]++;
      copy.inventory[g.item]--;
      if (--g.count === 0) copy.grid.pop();
    }
  } else if (carryWeight(copy) > PACKS[copy.backpack].capacity + 0.001)
    return null;
  copy.rescueAt = 0;
  return copy;
}
export function readSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? validateSave(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
export function writeSave(state: SaveData): boolean {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export interface GridItem {
  uid: string;
  item: ItemId;
  count: number;
  durability: number;
  x: number;
  y: number;
}
export interface DroppedItem {
  id: string;
  item: ItemId;
  count: number;
  durability: number;
  x: number;
  y: number;
  shelter?: string;
  rotRemaining?: number;
}
export const PACKS = {
  1: { name: "Mochila I", columns: 6, rows: 5, capacity: 12, weight: 0.8 },
  2: { name: "Mochila II", columns: 7, rows: 6, capacity: 22, weight: 1.3 },
  3: { name: "Mochila III", columns: 8, rows: 7, capacity: 35, weight: 2 },
} as const;
export const ITEM_PHYSICS: Record<
  ItemId,
  { weight: number; w: number; h: number; stack: number }
> = {
  ...EXTRA_PHYSICS,
  food: { weight: 0.3, w: 1, h: 1, stack: 4 },
  water: { weight: 0.75, w: 1, h: 2, stack: 2 },
  dirtyWater: { weight: 0.75, w: 1, h: 2, stack: 2 },
  spoiled: { weight: 0.3, w: 1, h: 1, stack: 4 },
  bandage: { weight: 0.1, w: 1, h: 1, stack: 5 },
  medicine: { weight: 0.12, w: 1, h: 1, stack: 3 },
  ammo: { weight: 0.012, w: 1, h: 1, stack: 48 },
  wood: { weight: 0.7, w: 3, h: 1, stack: 4 },
  scrap: { weight: 0.4, w: 2, h: 1, stack: 4 },
  cloth: { weight: 0.1, w: 2, h: 1, stack: 5 },
  rifle: { weight: 3.4, w: 3, h: 2, stack: 1 },
  sniper: { weight: 4.2, w: 4, h: 2, stack: 1 },
  shotgun: { weight: 3.8, w: 3, h: 2, stack: 1 },
  weapon: { weight: 1.1, w: 2, h: 2, stack: 1 },
  backpack1: { weight: 0.8, w: 2, h: 3, stack: 1 },
  backpack2: { weight: 1.3, w: 2, h: 3, stack: 1 },
  backpack3: { weight: 2, w: 3, h: 3, stack: 1 },
};
export function carryWeight(s: SaveData) {
  return (
    PACKS[s.backpack].weight +
    Object.entries(s.inventory).reduce(
      (sum, [id, n]) => sum + ITEM_PHYSICS[id as ItemId].weight * n,
      0,
    )
  );
}
export function inventoryMatchesGrid(s: SaveData) {
  return (Object.keys(ITEMS) as ItemId[]).every(
    (id) =>
      s.grid
        .filter((item) => item.item === id)
        .reduce((total, item) => total + item.count, 0) === s.inventory[id],
  );
}
export function canPlace(s: SaveData, uid: string, x: number, y: number) {
  const item = s.grid.find((i) => i.uid === uid);
  if (!item) return false;
  const shape = ITEM_PHYSICS[item.item],
    pack = PACKS[s.backpack];
  if (x < 0 || y < 0 || x + shape.w > pack.columns || y + shape.h > pack.rows)
    return false;
  return !s.grid.some((i) => {
    if (i.uid === uid) return false;
    const d = ITEM_PHYSICS[i.item];
    return (
      x < i.x + d.w && x + shape.w > i.x && y < i.y + d.h && y + shape.h > i.y
    );
  });
}
export function moveItem(s: SaveData, uid: string, x: number, y: number) {
  if (!Number.isInteger(x) || !Number.isInteger(y) || !canPlace(s, uid, x, y))
    return "Esse espaço está ocupado ou é pequeno demais.";
  const i = s.grid.find((i) => i.uid === uid)!;
  i.x = x;
  i.y = y;
  return "Item reposicionado.";
}
function placeFirst(s: SaveData, item: GridItem) {
  const pack = PACKS[s.backpack];
  for (let y = 0; y < pack.rows; y++)
    for (let x = 0; x < pack.columns; x++)
      if (canPlace(s, item.uid, x, y)) {
        item.x = x;
        item.y = y;
        return true;
      }
  return false;
}
// Counts remain a compact projection for crafting/stashes. Stable instances carry layout and wear.
export function reconcileGrid(s: SaveData) {
  for (const id of Object.keys(ITEMS) as ItemId[]) {
    let remaining = s.inventory[id] || 0;
    for (const i of s.grid.filter((i) => i.item === id)) {
      i.count = Math.min(i.count, remaining);
      remaining -= i.count;
    }
    s.grid = s.grid.filter((i) => i.count > 0);
    while (remaining > 0) {
      const i: GridItem = {
        uid: `item-${s.nextItem++}`,
        item: id,
        count: Math.min(remaining, ITEM_PHYSICS[id].stack),
        durability: 100,
        x: -999,
        y: -999,
      };
      s.grid.push(i);
      if (!placeFirst(s, i)) {
        s.grid.pop();
        break;
      }
      remaining -= i.count;
    }
  }
  s.hotbar = s.hotbar.map((uid) =>
    s.grid.some((i) => i.uid === uid) ? uid : null,
  );
}
export function addItem(
  s: SaveData,
  id: ItemId,
  count: number,
  durability = 100,
): string {
  if (!Number.isInteger(count) || count < 1 || !(id in ITEMS))
    return "Item inválido.";
  if (
    carryWeight(s) + ITEM_PHYSICS[id].weight * count >
    PACKS[s.backpack].capacity
  )
    return "Peso máximo da mochila atingido.";
  const copy = structuredClone(s);
  copy.inventory[id] += count;
  reconcileGrid(copy);
  if (
    copy.grid
      .filter((i) => i.item === id)
      .reduce((sum, i) => sum + i.count, 0) !== copy.inventory[id]
  )
    return "Não há espaço suficiente na grade.";
  const oldIds = new Set(s.grid.map((i) => i.uid));
  for (const i of copy.grid) if (!oldIds.has(i.uid)) i.durability = durability;
  Object.assign(s, copy);
  return `+${count} ${ITEMS[id].name}`;
}
export function assignHotbar(s: SaveData, slot: number, uid: string | null) {
  if (
    !Number.isInteger(slot) ||
    slot < 0 ||
    slot >= 5 ||
    (uid !== null && !s.grid.some((i) => i.uid === uid))
  )
    return "Atalho inválido.";
  s.hotbar[slot] = uid;
  return "Atalho atualizado.";
}
export function dropItem(
  s: SaveData,
  uid: string,
  x: number,
  y: number,
  shelter?: string,
): DroppedItem | null {
  const i = s.grid.find((i) => i.uid === uid);
  if (!i) return null;
  const dropped: DroppedItem = {
    id: `drop-${s.nextItem++}`,
    item: i.item,
    count: i.count,
    durability: i.durability,
    x,
    y,
    shelter,
  };
  s.inventory[i.item] -= i.count;
  s.grid = s.grid.filter((g) => g.uid !== uid);
  s.hotbar = s.hotbar.map((u) => (u === uid ? null : u));
  s.dropped.push(dropped);
  return dropped;
}

export function equipPack(s: SaveData, uid: string) {
  
  const i = s.grid.find((g) => g.uid === uid);
  
  if (!i || !i.item.startsWith("backpack")) 
    return "Selecione uma mochila.";
  
  const tier = Number(i.item.at(-1)) as 1 | 2 | 3,
    copy = structuredClone(s);
  copy.inventory[i.item]--;
  copy.grid = copy.grid.filter((g) => g.uid !== uid);
  copy.backpack = tier;
  if (carryWeight(copy) > PACKS[tier].capacity)
    return "Essa mochila não suporta o peso atual.";
  for (const g of copy.grid) {
    g.x = -999;
    g.y = -999;
  }
  for (const g of copy.grid)
    if (!placeFirst(copy, g)) return "Os itens não cabem nessa mochila.";
  const old = `backpack${s.backpack}` as ItemId;
  const result = addItem(copy, old, 1);
  if (!result.startsWith("+"))
    return "Não há espaço para guardar a mochila anterior.";
  copy.hotbar = copy.hotbar.map((u) =>
    copy.grid.some((g) => g.uid === u) ? u : null,
  );
  Object.assign(s, copy);
  return `${PACKS[tier].name} equipada.`;
}
export function repairWeapon(s: SaveData) {
  const i = s.grid.find((g) => g.item === weaponId(s));
  if (!i) return "Você não tem uma arma.";
  if (s.inventory.scrap < 2) return "O reparo exige 2 sucatas.";
  s.inventory.scrap -= 2;
  i.durability = 100;
  reconcileGrid(s);
  return "Arma reparada.";
}

/** Decay is based on active simulation time and survives save/load through durability. */
export function ageFood(state: SaveData, dt: number) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  for (const g of state.grid) {
    const life = g.item === "food" ? 480 : NUTRITION[g.item]?.lifetime;
    if (life) {
      g.durability = clamp(g.durability - (dt * 100) / life);
      if (g.durability <= 0) {
        const freshId = g.item;
        const converted = Math.min(
          g.count,
          Math.max(0, state.inventory[freshId] || 0),
        );
        state.inventory[freshId] = Math.max(
          0,
          (state.inventory[freshId] || 0) - converted,
        );
        g.item = "spoiled";
        g.count = converted;
        g.durability = 0;
        state.inventory.spoiled += converted;
      }
    }
  }
  state.grid = state.grid.filter((item) => item.count > 0);
  reconcileGrid(state);
}
export function foodLifetime(id: ItemId) {
  return id === "food" ? 480 : NUTRITION[id]?.lifetime || 0;
}
export function isUsable(id: ItemId) {
  return (
    (!!NUTRITION[id] && !NUTRITION[id].raw) ||
    [
      "food",
      "water",
      "dirtyWater",
      "spoiled",
      "bandage",
      "medicine",
      "vest",
      "gasMask",
      "mask",
      "nightVision",
      "grenade",
      "smoke",
      "note",
      "musicRadio",
    ].includes(id)
  );
}
