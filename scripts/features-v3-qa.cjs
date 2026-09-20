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
  await page.bringToFront();
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("http://127.0.0.1:5173");
  await page.waitForFunction(() => window.__NOL?.ui.ready);
  await page.evaluate(async () => {
    const { newGame } = await import("/src/model.ts");
    window.__NOL.ui.start(newGame(987));
    window.__NOL.ui.close();
  });
  await page.waitForFunction(
    () => window.__NOL.game.scene.getScene("Survival").state.elapsed > 0.8,
  );
  assert(await page.locator("#minimap").isVisible(), "Minimap visible");
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival");
      return s.zombies.countActive(true) <= 24 && s.fruitTrees.length > 20;
    }),
    "Reduced population and fruit-bearing trees",
  );
  await page.mouse.move(400, 400);
  await page.waitForTimeout(120);
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival");
      return s.facing === 4;
    }),
    "Character faces aim while stationary",
  );
  await page.keyboard.down("d");
  await page.waitForTimeout(150);
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival");
      return s.facing === 4 && s.player.body.velocity.x > 0;
    }),
    "Character faces aim while moving opposite direction",
  );
  await page.keyboard.up("d");
  await page.keyboard.down("q");
  await page.waitForTimeout(120);
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival");
      return (
        s.blocking &&
        s.session.intent.blocking &&
        s.player.anims.currentAnim.key.includes("Guard")
      );
    }),
    "Q activates defensive pose and authoritative defence",
  );
  await page.keyboard.up("q");
  await page.waitForTimeout(120);
  await page.mouse.move(1000, 450);
  await page.keyboard.down("d");
  await page.mouse.down();
  await page.waitForTimeout(120);
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival");
      return (
        s.player.body.velocity.length() < 35 &&
        s.shootingUntil > s.state.elapsed
      );
    }),
    "Shooting reduces movement speed by 72%",
  );
  await page.mouse.up();
  await page.keyboard.up("d");
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival");
      return (
        !s.children.list.some((o) => o.texture?.key === "flash") &&
        !s.player.anims.currentAnim.key.includes("Attack1")
      );
    }),
    "Shooting has no flash or shooting-effect animation",
  );
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival"),
        b = s.bullets.getChildren().find((b) => b.active),
        m = b.getData("muzzle"),
        p = b.getData("shooter");
      return Math.hypot(m.x - p.x, m.y - p.y) < 63 && m.y < p.y - 20;
    }),
    "Tracer starts at measured weapon muzzle",
  );
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival"),
        ctx = s.visionCanvas.context;
      let dark = 0,
        clear = 0;
      for (let x = 0; x < 960; x += 64)
        for (let y = 0; y < 640; y += 64) {
          const a = ctx.getImageData(x, y, 1, 1).data[3];
          if (a > 230) dark++;
          if (a < 10) clear++;
        }
      return dark > 40 && clear > 10;
    }),
    "Outside field of view is very dark",
  );
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival"),
      tree = s.fruitTrees.find((t) => t.id === "orchard-0");
    s.state.fruitTimers[tree.id] = s.state.elapsed;
  });
  await page.waitForTimeout(160);
  assert(
    await page.evaluate(() =>
      window.__NOL.game.scene
        .getScene("Survival")
        .state.dropped.some((d) => d.id.startsWith("fruit-")),
    ),
    "Fruit falls from trees",
  );
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival"),
      d = s.state.dropped.find((d) => d.id.startsWith("fruit-"));
    s.session.resources.get(d.id).durability = 0.001;
  });
  await page.waitForTimeout(120);
  assert(
    await page.evaluate(
      () =>
        window.__NOL.game.scene
          .getScene("Survival")
          .state.dropped.find((d) => d.id.startsWith("fruit-")).item ===
        "spoiled",
    ),
    "Fallen fruit spoils and changes item type",
  );
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival");
    s.player.body.reset(3730, 2540);
    s.cameras.main.centerOn(3730, 2540);
  });
  await page.waitForTimeout(400);
  await page.mouse.move(620, 180);
  await page.waitForTimeout(150);
  await page.screenshot({ path: "output/playwright/v3-urban.png" });
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival");
      return (
        s.children.list.filter((o) => o.texture?.key === "houses").length ===
          10 &&
        s.children.list.filter((o) => o.texture?.key === "car").length === 6 &&
        !s.children.list.some((o) =>
          ["urban0179", "urban0184"].includes(o.texture?.key),
        )
      );
    }),
    "New houses and six original cars replace old vehicles",
  );
  await page.evaluate(async () => {
    const { addItem } = await import("/src/model.ts");
    const s = window.__NOL.game.scene.getScene("Survival");
    addItem(s.state, "rawMeat", 1);
    addItem(s.state, "wood", 1);
    s.enter("ash");
  });
  await page.locator("[data-action=close]").first().click();
  await page.keyboard.press("i");
  await page.locator("[data-tab=craft]").click();
  assert(
    await page.locator("[data-craft=cookMeat]").isEnabled(),
    "Bunker stove enables cooking",
  );
  await page.locator("[data-craft=cookMeat]").click();
  assert(
    await page.evaluate(
      () =>
        window.__NOL.game.scene.getScene("Survival").state.inventory
          .cookedMeat === 1,
    ),
    "Cooking UI produces cooked meat",
  );
  await page.screenshot({ path: "output/playwright/v3-cooking.png" });
  await page.keyboard.press("Escape");
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival");
    s.leave();
    s.player.body.reset(1540, 1360);
    s.state.minutes = 800;
    s.cameras.main.centerOn(1540, 1360);
    const z = s.zombies.getChildren().find((z) => z.active);
    z.body.reset(1720, 1360);
    z.setVelocity(0);
    const info = z.getData("info");
    info.kind = "walker";
    info.alertUntil = 0;
    info.attackUntil = s.state.elapsed + 3;
    s.__stealthZombie = z;
    s.noiseUntil = 0;
  });
  await page.waitForTimeout(120);
  await page.keyboard.press("Control");
  await page.waitForTimeout(180);
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival");
      return (
        s.crouching &&
        s.__stealthZombie.getData("info").alertUntil <= s.state.elapsed + 1.3
      );
    }),
    "Crouching prevents distant zombie detection",
  );
  await page.keyboard.press("Control");
  await page.waitForTimeout(150);
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival");
      return s.__stealthZombie.getData("info").alertUntil > s.state.elapsed;
    }),
    "Standing restores normal detection",
  );
  assert(
    errors.length === 0 && missing.length === 0,
    "No runtime errors or missing assets",
  );
  return { checks, errors, missing };
};
