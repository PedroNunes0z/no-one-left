import { WEAPONS, weaponId, isWeapon } from "./weapons.ts";
import {
  PACKS,
  carryWeight,
  inventoryMatchesGrid,
  ageFood,
  foodLifetime,
  addItem,
  assignHotbar,
  consume,
  craft,
  dropItem,
  equipPack,
  moveItem,
  newGame,
  reconcileGrid,
  repairRadio,
  repairWeapon,
  rest,
  updateSurvival,
  clamp,
  type SaveData,
  type ItemId,
  type RecipeId,
  type DroppedItem,
} from "./model.ts";
export type EntityId = string;
export interface ActorSnapshot {
  id: EntityId;
  x: number;
  y: number;
  hp: number;
  kind: string;
  alive: boolean;
}
export interface MoveIntent {
  x: number;
  y: number;
  sprint: boolean;
  crouch: boolean;
  blocking?: boolean;
  aim: number;
}
export type Action =
  | { type: "move"; intent: MoveIntent }
  | { type: "use"; item: ItemId; uid?: string }
  | { type: "collect"; target: EntityId }
  | { type: "drop"; uid: string }
  | { type: "grid"; uid: string; x: number; y: number }
  | { type: "hotbar"; uid: string | null; slot: number }
  | { type: "equipWeapon"; uid: string }
  | { type: "pack"; uid: string }
  | { type: "craft"; recipe: RecipeId }
  | { type: "rest" }
  | { type: "radio" }
  | { type: "repair" }
  | { type: "transfer"; item: ItemId; deposit: boolean }
  | { type: "fire" }
  | { type: "reload" }
  | { type: "punch" };
export interface Command {
  actorId: EntityId;
  sequence: number;
  action: Action;
}
export interface CommandResult {
  accepted: boolean;
  message: string;
  drop?: DroppedItem;
}
export interface PlayerRuntime {
  room: string;
  nearCamp: boolean;
  intent: MoveIntent;
  fireAt: number;
  punchAt: number;
  reloadAt: number;
  blockRoll?: number;
}
export interface SessionSnapshot {
  version: 1;
  tick: number;
  players: Record<EntityId, SaveData>;
  actors: ActorSnapshot[];
  controls: Record<EntityId, PlayerRuntime>;
  resources: Resource[];
}
export interface AuthorityPort {
  dispatch(command: Command): CommandResult;
  advance(seconds: number): void;
  snapshot(): SessionSnapshot;
}
export interface Resource {
  id: string;
  x: number;
  y: number;
  item: ItemId;
  count: number;
  durability: number;
  container?: string;
  rotRemaining?: number;
  shelter?: string;
}
/** Engine-independent offline command authority. Physics/hit detection run in the local adapter. */
export class LocalSession implements AuthorityPort {
  readonly playerId = "survivor-1";
  readonly players = new Map<EntityId, SaveData>();
  readonly actors = new Map<EntityId, ActorSnapshot>();
  readonly resources = new Map<EntityId, Resource>();
  readonly controls = new Map<EntityId, PlayerRuntime>();
  tick = 0;
  private sequences = new Map<EntityId, number>();
  private accumulator = 0;
  constructor(state = newGame()) {
    this.players.set(this.playerId, state);
    this.controls.set(this.playerId, {
      room: "",
      nearCamp: false,
      intent: { x: 0, y: 0, sprint: false, crouch: false, aim: 0 },
      fireAt: -10,
      punchAt: -10,
      reloadAt: 0,
    });
  }
  get state() {
    return this.players.get(this.playerId)!;
  }
  private get runtime() {
    return this.controls.get(this.playerId)!;
  }
  get room() {
    return this.runtime.room;
  }
  set room(value: string) {
    this.runtime.room = value;
  }
  get nearCamp() {
    return this.runtime.nearCamp;
  }
  set nearCamp(value: boolean) {
    this.runtime.nearCamp = value;
  }
  get intent() {
    return this.runtime.intent;
  }
  get reloadAt() {
    return this.runtime.reloadAt;
  }
  advance(seconds: number) {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    this.accumulator += Math.min(seconds, 0.1);
    while (this.accumulator >= 1 / 30) {
      this.accumulator -= 1 / 30;
      this.tick++;
      for (const [id, s] of this.players) {
        const r = this.controls.get(id);
        if (!r || s.vitals.health <= 0) continue;
        ageFood(s, 1 / 30);

        if (r.intent.blocking)
          s.vitals.stamina = clamp(s.vitals.stamina - 16 / 30);
        updateSurvival(
          s,
          1 / 30,
          r.intent.sprint,
          r.intent.x !== 0 || r.intent.y !== 0,
          !!r.room,
        );
        if (r.reloadAt && s.elapsed >= r.reloadAt) {
          const n = Math.min(
            WEAPONS[weaponId(s)].capacity - s.ammo,
            s.inventory.ammo,
          );
          s.ammo += n;
          s.inventory.ammo -= n;
          reconcileGrid(s);
          r.reloadAt = 0;
        }
      }
      for (const resource of [...this.resources.values()]) {
        if (resource.container) continue;
        const life = foodLifetime(resource.item);
        if (life) {
          resource.durability = clamp(resource.durability - 100 / life / 30);
          if (resource.durability <= 0) {
            resource.item = "spoiled";
            if (resource.id.startsWith("fruit-")) resource.rotRemaining = 180;
          }
        }
        if (resource.item === "spoiled" && resource.id.startsWith("fruit-")) {
          resource.rotRemaining = (resource.rotRemaining ?? 180) - 1 / 30;
          if (resource.rotRemaining <= 0) {
            this.resources.delete(resource.id);
            for (const p of this.players.values())
              p.dropped = p.dropped.filter((d) => d.id !== resource.id);
            continue;
          }
        }
        for (const p of this.players.values()) {
          const d = p.dropped.find((d) => d.id === resource.id);
          if (d) {
            d.item = resource.item;
            d.durability = resource.durability;
            d.rotRemaining = resource.rotRemaining;
          }
        }
      }
    }
  }
  dispatch(c: Command): CommandResult {
    const s = this.players.get(c.actorId),
      runtime = this.controls.get(c.actorId);
    if (
      !s ||
      !runtime ||
      !Number.isSafeInteger(c.sequence) ||
      c.sequence <= (this.sequences.get(c.actorId) ?? -1)
    )
      return { accepted: false, message: "Comando rejeitado." };
    this.sequences.set(c.actorId, c.sequence);
    if (s.vitals.health <= 0)
      return { accepted: false, message: "A jornada terminou." };
    const a = c.action;
    let message = "";
    let accepted = true;
    let drop: DroppedItem | undefined;
    switch (a.type) {
      case "move":
        if (
          ![a.intent.x, a.intent.y, a.intent.aim].every(Number.isFinite) ||
          Math.abs(a.intent.x) > 1 ||
          Math.abs(a.intent.y) > 1
        )
          return { accepted: false, message: "Movimento inválido." };
        runtime.intent = { ...a.intent };
        break;
      case "use": {
        message = consume(s, a.item, a.uid);
        break;
      }
      case "collect": {
        const r = this.resources.get(a.target);
        if (
          !r ||
          Math.hypot(r.x - s.x, r.y - s.y) > 76 ||
          (r.shelter !== undefined && r.shelter !== runtime.room)
        ) {
          accepted = false;
          message = "Aproxime-se para pegar o item.";
          break;
        }
        message = addItem(s, r.item, r.count, r.durability);
        accepted = message.startsWith("+");
        if (accepted) {
          this.resources.delete(r.id);
          if (r.container) s.containers[r.container][r.item] -= r.count;
          else {
            s.collected.push(r.id);
            s.dropped = s.dropped.filter((d) => d.id !== r.id);
          }
        }
        break;
      }
      case "drop": {
        drop =
          dropItem(s, a.uid, s.x + 18, s.y + 12, runtime.room || undefined) ??
          undefined;
        accepted = !!drop;
        message = drop
          ? "Item colocado no chão."
          : "Selecione um item para soltar.";
        break;
      }
      case "grid":
        message = moveItem(s, a.uid, a.x, a.y);
        break;
      case "hotbar":
        message = assignHotbar(s, a.slot, a.uid);
        break;
      case "equipWeapon": {
        const gun = s.grid.find((g) => g.uid === a.uid);
        if (!gun || !isWeapon(gun.item) || runtime.reloadAt) {
          accepted = false;
          message = "Selecione uma arma ou aguarde a recarga.";
          break;
        }
        const old = weaponId(s);
        s.magazines ??= {};
        s.magazines[old] = s.ammo;
        s.equippedWeapon = gun.item;
        s.ammo = s.magazines[gun.item] ?? 0;
        runtime.fireAt = s.elapsed;
        message = WEAPONS[gun.item].name + " equipada.";
        break;
      }
      case "pack":
        if (runtime.reloadAt) {
          accepted = false;
          message = "Aguarde a recarga terminar.";
        } else message = equipPack(s, a.uid);
        break;
      case "craft": {
        const copy = structuredClone(s);
        message = craft(
          copy,
          a.recipe,
          runtime.room || undefined,
          runtime.nearCamp,
        );
        accepted = message.endsWith("pronto.");
        if (accepted) {
          if (carryWeight(copy) > PACKS[copy.backpack].capacity + 0.001) {
            message = "Peso máximo excedido.";
            accepted = false;
          } else if (!inventoryMatchesGrid(copy)) {
            message = "Não há espaço para o item fabricado.";
            accepted = false;
          } else Object.assign(s, copy);
        }
        break;
      }
      case "rest":
        message =
          runtime.room || runtime.nearCamp
            ? rest(s)
            : "Descanse em um bunker ou acampamento.";
        break;
      case "radio":
        message = repairRadio(s, runtime.room || undefined);
        break;
      case "repair":
        message = repairWeapon(s);
        break;
      case "transfer": {
        const stash = s.shelters[runtime.room]?.stash;
        if (!stash) {
          message = "Entre em um bunker.";
          accepted = false;
          break;
        }
        if (a.deposit) {
          if (s.inventory[a.item] <= 0) {
            message = "Você não tem esse item.";
            break;
          }
          s.inventory[a.item]--;
          stash[a.item]++;
          reconcileGrid(s);
          message = "Item guardado.";
        } else if (stash[a.item] > 0) {
          message = addItem(s, a.item, 1);
          if (message.startsWith("+")) stash[a.item]--;
        } else message = "Não há reservas desse item.";
        break;
      }
      case "fire": {
        const spec = WEAPONS[weaponId(s)],
          gun = s.grid.find((i) => i.item === weaponId(s));
        if (
          runtime.intent.blocking ||
          runtime.room ||
          runtime.reloadAt ||
          s.elapsed - runtime.fireAt < spec.cadence ||
          s.ammo <= 0 ||
          !gun ||
          gun.durability <= 0
        ) {
          accepted = false;
          message = !gun
            ? "Equipe uma arma."
            : gun.durability <= 0
              ? "Arma danificada. Repare com sucata."
              : "";
          break;
        }
        runtime.fireAt = s.elapsed;
        s.ammo--;
        gun.durability = clamp(gun.durability - 0.18);
        break;
      }
      case "reload":
        if (
          runtime.reloadAt ||
          s.ammo >= WEAPONS[weaponId(s)].capacity ||
          s.inventory.ammo <= 0
        ) {
          accepted = false;
          message =
            s.inventory.ammo <= 0 ? "Sem munição. Use F para dar socos." : "";
        } else {
          runtime.reloadAt = s.elapsed + WEAPONS[weaponId(s)].reload;
          message = "Recarregando…";
        }
        break;
      case "punch":
        if (
          runtime.intent.blocking ||
          s.elapsed - runtime.punchAt < 0.65 ||
          s.vitals.stamina < 12
        ) {
          accepted = false;
          break;
        }
        runtime.punchAt = s.elapsed;
        s.vitals.stamina -= 12;
        break;
    }
    return { accepted, message, drop };
  }
  damagePlayer(amount: number, actorId = this.playerId, melee = false) {
    const s = this.players.get(actorId);
    if (!s || !Number.isFinite(amount) || amount < 0) return false;
    const r = this.controls.get(actorId);
    if (melee && r?.intent.blocking && s.vitals.stamina >= 8) {
      s.vitals.stamina -= 8;
      r.blockRoll = (r.blockRoll ?? 0) + 1;
      const roll =
        ((Math.imul(
          (s.seed ^ Math.imul(r.blockRoll, 2654435761)) >>> 0,
          1664525,
        ) +
          1013904223) >>>
          0) /
        4294967296;
      if (roll < 0.75) return true;
    }
    s.vitals.health = clamp(
      s.vitals.health - amount * (1 - s.vitals.armor / 100),
    );
    return false;
  }
  damageActor(id: EntityId, damage: number, attackerId = this.playerId) {
    const a = this.actors.get(id);
    if (!a?.alive || !Number.isFinite(damage) || damage < 0) return false;
    a.hp = Math.max(0, a.hp - damage);
    if (!a.hp) {
      a.alive = false;
      const attacker = this.players.get(attackerId);
      if (attacker) {
        attacker.kills++;
        attacker.killed.push(id);
        if (attacker.killed.length > 2000) {
          const initial = attacker.killed.filter(
            (killedId) => !killedId.startsWith("zombie-w"),
          );
          const waves = attacker.killed
            .filter((killedId) => killedId.startsWith("zombie-w"))
            .slice(-(2000 - initial.length));
          attacker.killed = [...initial, ...waves];
        }
      }
    }
    return !a.alive;
  }
  snapshot(): SessionSnapshot {
    return {
      version: 1,
      tick: this.tick,
      players: Object.fromEntries(
        [...this.players].map(([id, s]) => [id, structuredClone(s)]),
      ),
      actors: [...this.actors.values()].map((a) => ({ ...a })),
      controls: Object.fromEntries(
        [...this.controls].map(([id, r]) => [id, structuredClone(r)]),
      ),
      resources: [...this.resources.values()].map((r) => ({ ...r })),
    };
  }
}
