async (page) => {
  const checks = [],
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const assert = (v, m) => {
    if (!v) throw Error(m);
    checks.push(m);
  };
  await page.goto("http://127.0.0.1:5173");
  await page.waitForFunction(() => window.__NOL?.ui.ready);
  await page.evaluate(async () => {
    const { newGame } = await import("/src/model.ts");
    window.__NOL.ui.start(newGame(1234));
    window.__NOL.ui.close();
  });
  await page.waitForFunction(() => window.__NOL.ui.state.elapsed > 0.7);
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival"),
      z = s.zombies
        .getChildren()
        .find((z) => z.active && z.getData("info").kind === "walker");
    z.body.reset(2500, 2100);
    const i = z.getData("info");
    i.homeX = 2500;
    i.homeY = 2100;
    i.targetX = 2580;
    i.targetY = 2100;
    i.wanderAt = s.state.elapsed + 20;
    i.alertUntil = 0;
    s.__far = z;
  });
  const frames = [];
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(120);
    frames.push(
      await page.evaluate(
        () => window.__NOL.game.scene.getScene("Survival").__far.frame.name,
      ),
    );
  }
  assert(new Set(frames).size >= 4, "Far zombie animation keeps advancing");
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival"),
      c = s.containers.find(
        (c) =>
          c.id.startsWith("locker") && s.state.containers[c.id].backpack2 > 0,
      );
    s.player.body.reset(c.x, c.y);
  });
  await page.waitForTimeout(200);
  await page.keyboard.press("e");
  await page.waitForFunction(() => window.__NOL.ui.panel === "container");
  await page.locator("[data-collect=backpack2]").click();
  await page.keyboard.press("Escape");
  await page.keyboard.press("i");
  const uid = await page.evaluate(
    () => window.__NOL.ui.state.grid.find((i) => i.item === "backpack2").uid,
  );
  await page.locator(`[data-uid="${uid}"]`).click();
  await page.locator("[data-action=equip-pack]").click();
  assert(
    (await page.evaluate(() => window.__NOL.ui.state.backpack)) === 2,
    "Mochila II equips through inventory",
  );
  await page.screenshot({ path: "output/playwright/v3-backpack-II.png" });
  await page.keyboard.press("Escape");
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival");
    s.player.body.reset(1740, 1280);
    s.save();
  });
  const before = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("no-one-left.save.v1")),
  );
  await page.reload();
  await page.waitForFunction(() => window.__NOL?.ui.ready);
  await page.getByRole("button", { name: /CONTINUAR/ }).click();
  await page.waitForTimeout(200);
  assert(
    (await page.evaluate(() => window.__NOL.ui.state.backpack)) === 2,
    "Save restores backpack tier",
  );
  assert(
    (await page.evaluate(() => window.__NOL.ui.state.grid.length)) ===
      before.grid.length,
    "Save restores grid instances",
  );
  await page.evaluate(() => window.__NOL.ui.open("inventory"));
  const restored = await page.evaluate(() =>
    window.__NOL.ui.state.grid.find((i) => i.item === "weapon"),
  );
  assert(
    restored.uid === before.grid.find((i) => i.item === "weapon").uid,
    "Save preserves item identity",
  );
  await page.keyboard.press("Escape");
  for (const id of ["station", "signal"]) {
    await page.evaluate(
      (id) => window.__NOL.game.scene.getScene("Survival").enter(id),
      id,
    );
    await page.locator("[data-action=close]").first().click();
    await page.waitForTimeout(150);
    await page.screenshot({ path: `output/playwright/v3-bunker-${id}.png` });
    await page.evaluate(() =>
      window.__NOL.game.scene.getScene("Survival").leave(),
    );
  }
  assert(
    (await page.evaluate(
      () =>
        window.__NOL.game.scene
          .getScene("Survival")
          .cache.audio.get("shot-real").duration,
    )) > 0,
    "Real shot audio decoded",
  );
  await page.keyboard.press("u");
  await page.waitForTimeout(100);
  assert(
    await page.evaluate(
      () => window.__NOL.game.scene.getScene("Survival").cursorReleased,
    ),
    "Cursor release works",
  );
  await page.keyboard.press("u");
  await page.waitForTimeout(100);
  assert(
    await page.evaluate(
      () => !window.__NOL.game.scene.getScene("Survival").cursorReleased,
    ),
    "Cursor hides again",
  );
  await page.evaluate(() => window.__NOL.ui.open("pause"));
  assert(errors.length === 0, "No browser errors");
  return { checks, farFrames: frames, errors };
};
