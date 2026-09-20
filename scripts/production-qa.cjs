async (hostPage) => {
  const context = await hostPage
    .context()
    .browser()
    .newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const errors = [],
    missing = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) missing.push(r.url());
  });
  await page.goto("http://127.0.0.1:4173");
  await page.getByRole("button", { name: "INICIAR SOBREVIVÊNCIA" }).waitFor();
  await page.waitForFunction(
    () => !document.querySelector("[data-action=new]").disabled,
  );
  if (await page.evaluate(() => typeof window.__NOL !== "undefined"))
    throw new Error("ponte de desenvolvimento exposta no build");
  await page.screenshot({ path: "output/playwright/production-menu.png" });
  await page.getByRole("button", { name: "INICIAR SOBREVIVÊNCIA" }).click();
  await page.getByRole("button", { name: "SAIR PARA O MUNDO" }).click();
  await page.keyboard.down("d");
  await page.waitForTimeout(400);
  await page.keyboard.up("d");
  await page.screenshot({ path: "output/playwright/production-world.png" });
  await page.keyboard.press("i");
  await page.getByRole("dialog", { name: "O que você carrega" }).waitFor();
  const failedImages = await page
    .locator("img")
    .evaluateAll((images) =>
      images
        .filter((image) => !image.complete || image.naturalWidth === 0)
        .map((image) => image.src),
    );
  if (errors.length || missing.length || failedImages.length)
    throw new Error(JSON.stringify({ errors, missing, failedImages }));
  await context.close();
  return {
    production: "pass",
    assets: "pass",
    inventory: "pass",
    debugBridgeAbsent: true,
    errors,
    missing,
    failedImages,
  };
};
