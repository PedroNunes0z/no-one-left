export type WeaponId = "weapon" | "rifle" | "sniper" | "shotgun";
export const WEAPONS = {
  weapon: {
    name: "Glock",
    capacity: 8,
    cadence: 0.35,
    reload: 2.2,
    damage: 42,
    speed: 690,
    shot: "shot-pistol",
    reloadSound: "reload-pistol",
    rate: 1,
  },
  rifle: {
    name: "Rifle",
    capacity: 20,
    cadence: 0.16,
    reload: 2.7,
    damage: 35,
    speed: 860,
    shot: "shot-rifle",
    reloadSound: "reload-rifle",
    rate: 1,
  },
  sniper: {
    name: "Sniper",
    capacity: 5,
    cadence: 1.1,
    reload: 3.1,
    damage: 100,
    speed: 1100,
    shot: "shot-rifle",
    reloadSound: "reload-rifle",
    rate: 0.78,
  },
  shotgun: {
    name: "Escopeta 12",
    capacity: 6,
    cadence: 0.8,
    reload: 2.9,
    damage: 88,
    speed: 720,
    shot: "shot-shotgun",
    reloadSound: "reload-shotgun",
    rate: 1,
  },
} as const;
export function isWeapon(id: string): id is WeaponId {
  return Object.hasOwn(WEAPONS, id);
}
export function weaponId(state: { equippedWeapon?: WeaponId }) {
  return state.equippedWeapon ?? "weapon";
}
