async (page) => {
  const checks = [],
    assert = (v, m) => {
      if (!v) throw Error(m);
      checks.push(m);
    };
  await page.goto("http://127.0.0.1:5174");
  await page.waitForFunction(() => window.__NOL?.ui.ready);
  await page.getByRole("button", { name: "Como sobreviver" }).click();
  await page.evaluate(() => window.__NOL.ui.close());
  await page.getByRole("button", { name: "Ativar ou desativar áudio" }).click();
  assert(
    await page.evaluate(() => window.__NOL.game.sound.mute),
    "Menu audio button mutes",
  );
  await page.getByRole("button", { name: "Ativar ou desativar áudio" }).click();
  assert(
    await page.evaluate(() => !window.__NOL.game.sound.mute),
    "Menu audio button unmutes",
  );
  await page.evaluate(async () => {
    const { newGame } = await import("/src/model.ts");
    const state = newGame(345);
    state.x = 1600;
    state.y = 2200;
    window.__NOL.ui.start(state);
    window.__NOL.ui.close();
  });
  await page.waitForFunction(
    () => window.__NOL.game.scene.getScene("Survival").state.elapsed > 0.8,
  );
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival");
      s.testAim = s.aim;
      s.aim = () => 0;
      s.testProp = s.prop(
        "barrel",
        undefined,
        s.player.x + 100,
        s.player.y - 12,
        2,
        true,
      );
      s.sightBlocks = s.nearbySightBlocks();
      const b = s.testProp.getData("sightBody").body;
      return !s.canSee(b.center.x, b.center.y) && s.visibleProp(s.testProp);
    }),
    "Visible obstacle illuminates despite its own collider blocking center",
  );
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival");
      s.testWall = s.block(s.player.x + 50, s.player.y - 12, 14, 100);
      s.sightBlocks = s.nearbySightBlocks();
      return !s.visibleProp(s.testProp);
    }),
    "Separate wall still hides obstacle behind it",
  );
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival");
    s.testWall.destroy();
    s.testProp.getData("sightBody").destroy();
    s.testProp.destroy();
    s.aim = s.testAim;
  });
  await page.keyboard.press("Control");
  await page.waitForTimeout(120);
  assert(
    await page.evaluate(
      () => window.__NOL.game.scene.getScene("Survival").crouching,
    ),
    "Crouch remains toggle after visual changes",
  );
  await page.keyboard.press("Control");
  const shotId = await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival");
    s.aim = () => 0;
    s.hitTestWall = s.block(s.player.x + 46, s.player.y - 40, 12, 64);
    s.session.controls.get(s.session.playerId).fireAt = -10;
    s.shoot();
    return s.session.playerId + ":" + s.sequence;
  });
  await page.waitForTimeout(180);
  assert(
    await page.evaluate(
      (id) =>
        window.__NOL.game.scene
          .getScene("Survival")
          .heardProjectiles.has(id + ":ricochet"),
      shotId,
    ),
    "Actual local bullet collision plays close-impact ricochet",
  );
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival");
    s.hitTestWall.destroy();
    s.aim = s.testAim;
    s.player.setPosition(620, 610);
    s.cameras.main.centerOn(620, 610);
    s.state.minutes = 12 * 60;
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "output/playwright/swamp-v4.png" });
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival");
      return s.children.list.some(
        (o) =>
          o.texture?.key === "roadT7" ||
          o.texture?.key === "roadT11" ||
          o.texture?.key === "roadT13" ||
          o.texture?.key === "roadT14",
      );
    }),
    "Road T-junctions close unused branches with supplied sidewalk pixels",
  );
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival");
    s.state.ammo = 0;
    s.use("sniper");
    s.reload();
  });
  assert(
    await page.evaluate(
      () =>
        window.__NOL.game.scene.getScene("Survival").state.equippedWeapon !==
        "sniper",
    ),
    "Missing weapons cannot be equipped",
  );
  return checks;
};
