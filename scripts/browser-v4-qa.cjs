async (page) => {
  const checks = [],
    errors = [],
    missing = [];
  const assert = (v, m) => {
    if (!v) throw Error(m);
    checks.push(m);
  };
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) missing.push(r.url());
  });
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("http://127.0.0.1:5174");
  await page.waitForFunction(() => window.__NOL?.ui.ready);
  for (const [width, height, name] of [
    [1440, 900, "desktop"],
    [375, 667, "phone"],
    [844, 390, "landscape"],
    [320, 568, "small"],
  ]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(200);
    const layout = await page.evaluate(() => {
      const menu = document.getElementById("menu"),
        buttons = [...menu.querySelectorAll("button:not(.hidden)")].filter(
          (b) => b.offsetParent,
        );
      return {
        overflow: menu.scrollWidth > menu.clientWidth,
        buttons: buttons.every((b) => {
          const r = b.getBoundingClientRect();
          return (
            r.left >= 0 &&
            r.right <= innerWidth &&
            r.top >= 0 &&
            r.bottom <= innerHeight
          );
        }),
        overlap: (() => {
          const m = document
              .querySelector(".menu-main")
              .getBoundingClientRect(),
            h = document.querySelector(".menu-header").getBoundingClientRect(),
            f = document.querySelector(".menu-footer").getBoundingClientRect();
          return m.top < h.bottom || m.bottom > f.top;
        })(),
      };
    });
    assert(
      !layout.overflow && layout.buttons && !layout.overlap,
      "Responsive menu " + name + " " + JSON.stringify(layout),
    );
    await page.screenshot({
      path: "output/playwright/menu-v4-" + name + ".png",
    });
  }
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.getByRole("button", { name: "Como sobreviver" }).click();
  await page.waitForTimeout(200);
  assert(
    await page.evaluate(
      () => window.__NOL.game.scene.getScene("Survival").score.isPlaying,
    ),
    "Music plays while still in menu after interaction",
  );
  await page.evaluate(() => window.__NOL.ui.close());
  await page.evaluate(async () => {
    const { newGame } = await import("/src/model.ts");
    window.__NOL.ui.start(newGame(1234));
    window.__NOL.ui.close();
  });
  await page.waitForFunction(
    () => window.__NOL.game.scene.getScene("Survival").state.elapsed > 0.8,
  );
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival");
      return (
        s.houseImages.length === 22 &&
        s.children.list.filter((o) => o.texture?.key === "car").length === 6
      );
    }),
    "22 houses and 6 original cars",
  );
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival");
      return !s.children.list.some((o) =>
        [
          "urban0053",
          "urban0151",
          "urban0152",
          "urban0160",
          "urban0155",
          "urban0162",
          "swampTrunk",
          "swamp",
        ].includes(o.texture?.key),
      );
    }),
    "New Roads and Objects replace street props; swamp trees have whole frames",
  );
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival"),
        ctx = s.visionCanvas.context,
        a = ctx.getImageData(0, 0, 960, 640).data;
      let feather = 0;
      for (let i = 3; i < a.length; i += 4)
        if (a[i] > 4 && a[i] < 210) feather++;
      return feather > 1000;
    }),
    "Visibility shadow has feathered partially transparent edges",
  );
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival");
    s.spatialSfx("gravel", s.player.x - 60, s.player.y, 0.3);
    s.spatialSfx("gravel", s.player.x + 260, s.player.y, 0.3);
  });
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival"),
        voices = s.spatialVoices.filter((v) => v.key === "gravel");
      return (
        voices.some(
          (v) =>
            v.spatialNode.panningModel === "HRTF" &&
            v.spatialNode.maxDistance === 400 &&
            v.spatialNode.distanceModel === "linear",
        ) && Math.abs(s.sound.listenerPosition.x - s.player.x) < 2
      );
    }),
    "Zombie footsteps use HRTF 3D panners and player listener",
  );
  await page.evaluate(async () => {
    const { addItem } = await import("/src/model.ts");
    const s = window.__NOL.game.scene.getScene("Survival");
    s.state.backpack = 3;
    addItem(s.state, "rifle", 1);
    addItem(s.state, "sniper", 1);
    s.use("rifle");
    s.state.ammo = 20;
    s.session.controls.get(s.session.playerId).fireAt = -10;
    s.shoot();
  });
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival");
      return (
        s.state.equippedWeapon === "rifle" &&
        s.state.ammo === 19 &&
        s.bullets
          .getChildren()
          .some(
            (b) =>
              b.active &&
              b.getData("damage") === 35 &&
              b.getData("ownerId") === s.session.playerId,
          )
      );
    }),
    "Rifle selection fires rifle ballistics with ownership",
  );
  await page.waitForTimeout(400);
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival");
      return (
        s.casingQueue.length === 0 &&
        s.sound.sounds.some((v) => v.key === "casing")
      );
    }),
    "Shot schedules separate casing sound",
  );
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival");
    s.stopSpatial();
    s.presentProjectile({
      id: "own-pass",
      ownerId: s.session.playerId,
      from: { x: s.player.x - 80, y: s.player.y },
      to: { x: s.player.x + 80, y: s.player.y },
    });
  });
  assert(
    await page.evaluate(
      () =>
        !window.__NOL.game.scene
          .getScene("Survival")
          .heardProjectiles.has("own-pass:null"),
    ),
    "Own shot does not trigger near-miss cue",
  );
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival");
    s.presentProjectile({
      id: "remote-fixture",
      ownerId: "future-player",
      from: { x: s.player.x - 80, y: s.player.y + 20 },
      to: { x: s.player.x + 80, y: s.player.y + 20 },
    });
    s.presentProjectile({
      id: "near-impact",
      ownerId: s.session.playerId,
      from: { x: s.player.x, y: s.player.y - 40 },
      to: { x: s.player.x + 45, y: s.player.y - 40 },
      impact: true,
    });
  });
  assert(
    await page.evaluate(() => {
      const s = window.__NOL.game.scene.getScene("Survival");
      return (
        s.heardProjectiles.has("remote-fixture:flyby") &&
        s.heardProjectiles.has("near-impact:ricochet")
      );
    }),
    "Remote near miss and own close terrain hit have distinct ricochet cues",
  );
  await page.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival");
    s.player.setPosition(3400, 2530);
    s.state.minutes = 12 * 60;
    s.input.activePointer.x = 683;
    s.input.activePointer.y = 280;
    s.cameras.main.centerOn(s.player.x, s.player.y);
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: "output/playwright/world-v4.png" });
  await page.evaluate(() => {
    const { game, ui } = window.__NOL;
    game.scene.getScene("Survival").quit();
    ui.menu();
  });
  assert(
    await page.evaluate(
      () => window.__NOL.game.scene.getScene("Survival").score.isPlaying,
    ),
    "Music continues after returning to menu",
  );
  assert(errors.length === 0, "No browser errors " + JSON.stringify(errors));
  assert(missing.length === 0, "No missing assets " + JSON.stringify(missing));
  return checks;
};
