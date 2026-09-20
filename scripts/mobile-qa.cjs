async (page) => {
  const context = await page
    .context()
    .browser()
    .newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
  const phone = await context.newPage();
  const errors = [];
  phone.on("pageerror", (e) => errors.push(e.message));
  await phone.goto("http://127.0.0.1:5173");
  await phone.waitForFunction(() => window.__NOL?.ui.ready);
  await phone.screenshot({ path: "output/playwright/mobile-menu.png" });
  await phone.getByRole("button", { name: "INICIAR SOBREVIVÊNCIA" }).tap();
  await phone.getByRole("button", { name: "SAIR PARA O MUNDO" }).tap();
  await phone.waitForFunction(
    () => window.__NOL.game.scene.getScene("Survival").state.elapsed > 0.8,
  );
  await phone.getByRole("button", { name: "AGACHAR", exact: true }).tap();
  await phone.waitForFunction(
    () => window.__NOL.game.scene.getScene("Survival").crouching,
  );
  await phone.waitForTimeout(100);
  if (
    !(await phone.evaluate(
      () => window.__NOL.game.scene.getScene("Survival").crouching,
    ))
  )
    throw Error("agachar touch não alterna");
  await phone.getByRole("button", { name: "AGACHAR", exact: true }).tap();
  await phone.waitForFunction(
    () => !window.__NOL.game.scene.getScene("Survival").crouching,
  );
  if (!(await phone.locator("#minimap").isVisible()))
    throw Error("minimapa touch ausente");
  const before = await phone.evaluate(
    () => window.__NOL.game.scene.getScene("Survival").state.ammo,
  );
  await phone.getByRole("button", { name: "TIRO", exact: true }).tap();
  await phone.waitForFunction(
    (v) => window.__NOL.game.scene.getScene("Survival").state.ammo === v - 1,
    before,
  );
  await phone.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival"),
      l = s.loot.find((l) => l.id === "loot-0");
    s.player.body.reset(l.x, l.y);
  });
  await phone.waitForTimeout(180);
  await phone.getByRole("button", { name: "USAR", exact: true }).tap();
  await phone.waitForFunction(() =>
    window.__NOL.game.scene
      .getScene("Survival")
      .state.collected.includes("loot-0"),
  );
  await phone.evaluate(() => {
    const s = window.__NOL.game.scene.getScene("Survival");
    s.player.body.reset(1540, 1360);
  });
  await phone.waitForTimeout(150);
  const arrow = await phone
    .getByRole("button", { name: "Mover para cima", exact: true })
    .boundingBox();
  const previous = await phone.evaluate(
    () => window.__NOL.game.scene.getScene("Survival").player.y,
  );
  const cdp = await context.newCDPSession(phone);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: arrow.x + 20, y: arrow.y + 20 }],
  });
  await phone.waitForTimeout(300);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  const current = await phone.evaluate(
    () => window.__NOL.game.scene.getScene("Survival").player.y,
  );
  if (current >= previous - 20)
    throw new Error("direcional touch não moveu o personagem");
  await phone.screenshot({ path: "output/playwright/mobile-world.png" });
  await phone.getByRole("button", { name: "Abrir inventário" }).tap();
  await phone.screenshot({ path: "output/playwright/mobile-inventory.png" });
  if (
    await phone.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
  )
    throw new Error("overflow horizontal");
  if (errors.length) throw new Error(errors.join("; "));
  console.log(
    JSON.stringify(
      {
        mobile: "pass",
        viewport: "390x844",
        shoot: "pass",
        loot: "pass",
        movement: "pass",
        inventory: "pass",
        errors,
      },
      null,
      2,
    ),
  );
  await context.close();
};
