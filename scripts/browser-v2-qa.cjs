async (page) => {
  const errors = [],
    missing = [],
    checks = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) missing.push(r.url());
  });
  const assert = (v, m) => {
    if (!v) throw Error(m);
    checks.push(m);
  };
  const read = (fn) => page.evaluate(fn);
  await page.bringToFront();
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("http://127.0.0.1:5173");
  await page.waitForFunction(() => window.__NOL?.ui.ready);
  await page.evaluate(async () => {
    const { newGame } = await import("/src/model.ts");
    window.__NOL.ui.start(newGame(1234));
    window.__NOL.ui.close();
  });
  await page.waitForFunction(
    () => window.__NOL.game.scene.getScene("Survival").state.elapsed > 0.8,
  );
  assert(
    await read(() =>
      window.__NOL.game.scene
        .getScene("Survival")
        .player.texture.key.startsWith("player-"),
    ),
    "Character sprite loaded",
  );
  const x = await read(
    () => window.__NOL.game.scene.getScene("Survival").player.x,
  );
  await page.keyboard.down("d");
  await page.waitForTimeout(600);
  await page.keyboard.up("d");
  assert(
    (await read(() => window.__NOL.game.scene.getScene("Survival").player.x)) >
      x + 20,
    "WASD moves",
  );
  await page.keyboard.down("Control");
  await page.keyboard.down("d");
  await page.waitForTimeout(250);
  assert(
    await read(() =>
      window.__NOL.game.scene
        .getScene("Survival")
        .player.anims.currentAnim.key.includes("Crouch"),
    ),
    "CTRL crouches and animates",
  );
  await page.keyboard.up("d");
  await page.keyboard.up("Control");
  await page.mouse.move(870, 450);
  await page.mouse.down({ button: "right" });
  await page.waitForTimeout(300);
  assert(
    (await read(
      () => window.__NOL.game.scene.getScene("Survival").cameras.main.zoom,
    )) > 1.43,
    "Right mouse aims and zooms",
  );
  await page.mouse.up({ button: "right" });
  const ammo = await read(
    () => window.__NOL.game.scene.getScene("Survival").state.ammo,
  );
  await page.mouse.click(870, 450);
  await page.waitForTimeout(100);
  assert(
    (await read(
      () => window.__NOL.game.scene.getScene("Survival").state.ammo,
    )) ===
      ammo - 1,
    "Left click shoots",
  );
  assert(
    (await read(
      () =>
        window.__NOL.game.scene
          .getScene("Survival")
          .state.grid.find((i) => i.item === "weapon").durability,
    )) < 100,
    "Gun wears on firing",
  );
  await page.keyboard.press("r");
  await page.waitForTimeout(1600);
  assert(
    (await read(
      () => window.__NOL.game.scene.getScene("Survival").state.ammo,
    )) === 8,
    "R reloads",
  );
  await page.keyboard.press("i");
  const uid = await read(
    () => window.__NOL.ui.state.grid.find((i) => i.item === "food").uid,
  );
  const bag = page.locator("[data-bag]");
  await page
    .locator(`[data-uid="${uid}"]`)
    .dragTo(bag, { targetPosition: { x: 216, y: 168 } });
  assert(
    (await read(
      () => window.__NOL.ui.state.grid.find((i) => i.item === "food").x,
    )) === 4,
    "Grid drag and drop moves item",
  );
  await page
    .locator(`[data-uid="${uid}"]`)
    .dragTo(page.locator('.editable-slot[data-slot="4"]'));
  assert(
    (await read(() => window.__NOL.ui.state.hotbar[4])) === uid,
    "Drag to hotbar assigns slot 5",
  );
  await page.screenshot({ path: "output/playwright/v2-inventory.png" });
  await page.locator(`[data-uid="${uid}"]`).click();
  await page.keyboard.press("g");
  assert(
    (await read(() => window.__NOL.ui.state.dropped.length)) === 1,
    "G drops a whole stack",
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival"),
      l = s.loot.find((l) => l.id.startsWith("drop-"));
    s.player.body.reset(l.x, l.y);
    s.player.setVelocity(0);
  });
  await page.waitForTimeout(150);
  await page.keyboard.press("e");
  await page.waitForTimeout(150);
  assert(
    (await read(() => window.__NOL.ui.state.dropped.length)) === 0,
    "Dropped loot can be picked up",
  );
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival"),
      c = s.containers.find((c) => c.id.startsWith("locker"));
    s.player.body.reset(c.x, c.y);
    s.player.setVelocity(0);
  });
  await page.waitForTimeout(100);
  await page.keyboard.press("e");
  await page.waitForTimeout(120);
  assert(
    (await read(() => window.__NOL.ui.panel)) === "container",
    "E searches furniture",
  );
  const count = await read(() =>
    Object.values(
      window.__NOL.ui.state.containers[window.__NOL.ui.api.search()],
    ).reduce((a, b) => a + b, 0),
  );
  await page.locator("[data-collect]").first().click();
  const after = await read(() =>
    Object.values(
      window.__NOL.ui.state.containers[window.__NOL.ui.api.search()],
    ).reduce((a, b) => a + b, 0),
  );
  assert(after < count, "Furniture pickup removes its contents");
  await page.keyboard.press("Escape");
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival");
    s.player.body.reset(1168, 920);
    s.player.setVelocity(0);
  });
  await page.waitForTimeout(200);
  await page.keyboard.press("e");
  await page.waitForTimeout(150);
  assert(
    (await read(
      () => window.__NOL.game.scene.getScene("Survival").currentShelter,
    )) === "ash",
    "E enters bunker",
  );
  await page.locator("[data-action=close]").first().click();
  await page.waitForTimeout(250);
  await page.screenshot({ path: "output/playwright/v2-bunker.png" });
  assert(
    await read(() => {
      const s = window.__NOL.game.scene.getScene("Survival");
      return (
        s.roomVisuals.filter((o) => o.texture?.key === "bed")[0].displayHeight <
        90
      );
    }),
    "Bunker furnishings scaled to player",
  );
  await page.keyboard.press("e");
  await page.waitForTimeout(150);
  assert(
    (await read(
      () => window.__NOL.game.scene.getScene("Survival").currentShelter,
    )) === "",
    "E leaves bunker",
  );
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival");
    s.player.body.reset(1540, 1360);
    const z = s.zombies
      .getChildren()
      .find((z) => z.active && z.getData("info").hp > 0);
    z.body.reset(1575, 1347);
    z.setVelocity(0);
    const i = z.getData("info");
    i.lastAttack = s.state.elapsed;
    i.attackUntil = s.state.elapsed + 2;
    s.cameras.main.centerOn(1540, 1360);
    s.__qaZombie = z;
    s.safe = false;
  });
  await page.waitForTimeout(300);
  await page.mouse.move(870, 425);
  const hp = await read(
    () =>
      window.__NOL.game.scene.getScene("Survival").__qaZombie.getData("info")
        .hp,
  );
  await page.keyboard.press("f");
  await page.waitForTimeout(150);
  assert(
    (await read(
      () =>
        window.__NOL.game.scene.getScene("Survival").__qaZombie.getData("info")
          .hp,
    )) < hp,
    "F punches nearby zombie",
  );
  assert(
    await read(
      () =>
        window.__NOL.game.scene.getScene("Survival").__qaZombie.getData("info")
          .bar.visible,
    ),
    "Zombie health bar visible",
  );
  await page.screenshot({ path: "output/playwright/v2-combat.png" });
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival");
    s.player.body.reset(590, 610);
    s.cameras.main.centerOn(590, 610);
  });
  await page.waitForTimeout(350);
  await page.screenshot({ path: "output/playwright/v2-swamp.png" });
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival");
    s.player.body.reset(2250, 1690);
    s.cameras.main.centerOn(2250, 1690);
  });
  await page.waitForTimeout(350);
  await page.screenshot({ path: "output/playwright/v2-lake.png" });
  await page.keyboard.press("u");
  await page.waitForTimeout(100);
  assert(
    await read(
      () => window.__NOL.game.scene.getScene("Survival").cursorReleased,
    ),
    "U releases mouse",
  );
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival");
    s.player.body.reset(30, 1300);
  });
  await page.waitForTimeout(250);
  assert(
    (await read(() => window.__NOL.ui.panel)) === "death",
    "Deep ocean causes death",
  );
  assert(
    errors.length === 0 && missing.length === 0,
    "No browser errors or missing assets",
  );
  return { checks, errors, missing };
};
