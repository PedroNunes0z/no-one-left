import test from "node:test";
import assert from "node:assert/strict";
import { addItem, newGame } from "../src/model.ts";
import { LocalSession } from "../src/session.ts";

function dispatch(session, sequence, action) {
  return session.dispatch({ actorId: session.playerId, sequence, action });
}

test("commands require monotonically increasing sequence numbers", () => {
  const session = new LocalSession(newGame(20));
  assert.equal(dispatch(session, 1, { type: "move", intent: { x: 0, y: 0, sprint: false, crouch: false, aim: 0 } }).accepted, true);
  assert.equal(dispatch(session, 1, { type: "move", intent: { x: 0, y: 0, sprint: false, crouch: false, aim: 0 } }).accepted, false);
});

test("remote resources cannot be collected", () => {
  const state = newGame(21);
  const session = new LocalSession(state);
  session.resources.set("remote", { id: "remote", x: state.x + 100, y: state.y, item: "food", count: 1, durability: 100 });
  assert.equal(dispatch(session, 1, { type: "collect", target: "remote" }).accepted, false);
  assert.ok(session.resources.has("remote"));
});

test("room resources require the matching room", () => {
  const state = newGame(22);
  const session = new LocalSession(state);
  session.resources.set("inside", { id: "inside", x: state.x, y: state.y, item: "food", count: 1, durability: 100, shelter: "ash" });
  assert.equal(dispatch(session, 1, { type: "collect", target: "inside" }).accepted, false);
  session.room = "ash";
  assert.equal(dispatch(session, 2, { type: "collect", target: "inside" }).accepted, true);
});

test("room drops use the player's current room coordinates", () => {
  const state = newGame(23);
  const session = new LocalSession(state);
  session.room = "ash";
  state.x = 7020;
  state.y = 420;
  const uid = state.grid.find((item) => item.item === "bandage").uid;
  const result = dispatch(session, 1, { type: "drop", uid });
  assert.equal(result.accepted, true);
  assert.equal(result.drop.shelter, "ash");
  assert.equal(result.drop.x, 7038);
  assert.equal(result.drop.y, 432);
});

test("pack changes are blocked while reloading", () => {
  const state = newGame(24);
  assert.match(addItem(state, "backpack2", 1), /^\+1/);
  const pack = state.grid.find((item) => item.item === "backpack2");
  state.ammo = 0;
  const session = new LocalSession(state);
  assert.equal(dispatch(session, 1, { type: "reload" }).accepted, true);
  const result = dispatch(session, 2, { type: "pack", uid: pack.uid });
  assert.equal(result.accepted, false);
  assert.match(result.message, /recarga/);
  assert.equal(state.backpack, 1);
});

test("accepted shots consume ammo and durability once", () => {
  const state = newGame(25);
  const weapon = state.grid.find((item) => item.item === "weapon");
  const session = new LocalSession(state);
  assert.equal(dispatch(session, 1, { type: "fire" }).accepted, true);
  assert.equal(state.ammo, 7);
  assert.equal(weapon.durability, 99.82);
  assert.equal(dispatch(session, 2, { type: "fire" }).accepted, false);
  assert.equal(state.ammo, 7);
});

test("selected stale food drives infection in the authority", () => {
  const state = newGame(26);
  state.inventory.food = 2;
  state.grid = state.grid.filter((item) => item.item !== "food");
  state.grid.unshift(
    { uid: "fresh", item: "food", count: 1, durability: 100, x: 0, y: 0 },
    { uid: "stale", item: "food", count: 1, durability: 5, x: 1, y: 0 },
  );
  const session = new LocalSession(state);
  dispatch(session, 1, { type: "use", item: "food", uid: "stale" });
  assert.equal(state.vitals.infection, 10);
  assert.equal(state.grid.some((item) => item.uid === "fresh"), true);
});

test("kill history stays bounded without forgetting initial zombies", () => {
  const state = newGame(27);
  state.killed = ["zombie-0", ...Array.from({ length: 1999 }, (_, i) => `zombie-w1-${i}`)];
  const session = new LocalSession(state);
  for (let i = 0; i < 10; i++) {
    const id = `zombie-w2-${i}`;
    session.actors.set(id, { id, x: 0, y: 0, hp: 1, kind: "walker", alive: true });
    session.damageActor(id, 1);
  }
  assert.equal(state.killed.length, 2000);
  assert.ok(state.killed.includes("zombie-0"));
  assert.ok(state.killed.includes("zombie-w2-9"));
  assert.equal(state.kills, 10);
});

test("snapshots are detached from live session state", () => {
  const state = newGame(28);
  const session = new LocalSession(state);
  const snapshot = session.snapshot();
  snapshot.players[session.playerId].vitals.health = 1;
  assert.equal(state.vitals.health, 100);
});
