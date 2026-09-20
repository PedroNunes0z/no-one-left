import test from "node:test";
import assert from "node:assert/strict";
import {
  ageFood,
  assignHotbar,
  canPlace,
  carryWeight,
  consume,
  craft,
  dropItem,
  inventoryMatchesGrid,
  newGame,
  validateSave,
} from "../src/model.ts";

test("new games start with a valid grid projection", () => {
  const state = newGame(1);
  assert.equal(inventoryMatchesGrid(state), true);
  assert.ok(carryWeight(state) <= 12);
  assert.ok(validateSave(state));
});

test("consumption targets the selected food instance", () => {
  const state = newGame(2);
  state.inventory.food = 2;
  state.grid = state.grid.filter((item) => item.item !== "food");
  state.grid.unshift(
    { uid: "fresh", item: "food", count: 1, durability: 100, x: 0, y: 0 },
    { uid: "stale", item: "food", count: 1, durability: 10, x: 1, y: 0 },
  );
  state.hotbar[0] = "stale";

  assert.match(consume(state, "food", "stale"), /utilizado/);
  assert.equal(state.vitals.infection, 10);
  assert.equal(state.grid.some((item) => item.uid === "fresh"), true);
  assert.equal(state.grid.some((item) => item.uid === "stale"), false);
  assert.equal(state.hotbar[0], null);
});

test("consumption rejects a uid for another item", () => {
  const state = newGame(3);
  const water = state.grid.find((item) => item.item === "water");
  const before = state.inventory.food;
  assert.equal(consume(state, "food", water.uid), "Item não encontrado na mochila.");
  assert.equal(state.inventory.food, before);
});

test("food ageing cannot make an inconsistent inventory negative", () => {
  const state = newGame(4);
  const food = state.grid.find((item) => item.item === "food");
  state.inventory.food = 0;
  food.durability = 0;
  ageFood(state, 1);
  assert.equal(state.inventory.food, 0);
  assert.ok(state.inventory.spoiled >= 0);
  assert.equal(state.grid.some((item) => item.uid === food.uid), false);
});

test("food ageing ignores invalid time deltas", () => {
  const state = newGame(5);
  const food = state.grid.find((item) => item.item === "food");
  const durability = food.durability;
  ageFood(state, Number.NaN);
  ageFood(state, -1);
  assert.equal(food.durability, durability);
});

test("inferior improvised armor does not replace a vest", () => {
  const state = newGame(6);
  state.vitals.armor = 50;
  state.inventory.scrap = 4;
  state.inventory.cloth = 2;
  assert.match(craft(state, "armor"), /igual ou melhor/);
  assert.equal(state.vitals.armor, 50);
  assert.equal(state.inventory.scrap, 4);
});

test("drops preserve instance durability and clear its hotbar slot", () => {
  const state = newGame(7);
  const food = state.grid.find((item) => item.item === "food");
  food.durability = 37;
  assignHotbar(state, 2, food.uid);
  const dropped = dropItem(state, food.uid, 100, 120, "ash");
  assert.equal(dropped.durability, 37);
  assert.equal(dropped.shelter, "ash");
  assert.equal(state.hotbar[2], null);
  assert.equal(inventoryMatchesGrid(state), true);
});

test("grid placement rejects overlap and pack overflow", () => {
  const state = newGame(8);
  const weapon = state.grid.find((item) => item.item === "weapon");
  const food = state.grid.find((item) => item.item === "food");
  assert.equal(canPlace(state, food.uid, weapon.x, weapon.y), false);
  assert.equal(canPlace(state, food.uid, 99, 99), false);
});

test("save validation rejects inventory/grid divergence", () => {
  const state = newGame(9);
  state.inventory.food++;
  assert.equal(validateSave(state), null);
});

test("save validation accepts a bounded kill history", () => {
  const state = newGame(10);
  state.killed = Array.from({ length: 2000 }, (_, i) => `zombie-w1-${i}`);
  assert.ok(validateSave(state));
});
