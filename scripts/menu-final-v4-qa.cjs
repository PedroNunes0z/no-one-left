async (page) => {
  await page.goto("http://127.0.0.1:5174");
  await page.waitForFunction(() => window.__NOL?.ui.ready);
  const button = page.getByRole("button", {
    name: "Ativar ou desativar áudio",
  });
  await button.focus();
  await page.keyboard.press("Enter");
  const first = await page.evaluate(() => window.__NOL.ui.settings.sound);
  await page.keyboard.press("Enter");
  if ((await page.evaluate(() => window.__NOL.ui.settings.sound)) === first)
    throw Error("keyboard mute not toggling");
  for (const [width, height] of [
    [320, 568],
    [320, 360],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    const ok = await page.evaluate(() => {
      const main = document.querySelector(".menu-main").getBoundingClientRect(),
        footer = document.querySelector(".menu-footer").getBoundingClientRect(),
        menu = document.getElementById("menu");
      return (
        main.bottom <= footer.top + 0.1 && menu.scrollWidth <= menu.clientWidth
      );
    });
    if (!ok) throw Error("menu overlaps at " + width + "x" + height);
  }
  return {
    keyboardAudioToggle: true,
    compactMenu: true,
    shortWindowScroll: true,
  };
};
