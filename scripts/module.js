/**
 * SWF module runtime hooks.
 *
 * Intentionally minimal and non-invasive: no actor/item/sheet patches.
 */
(() => {
  const { MODULE_ID, log, registerSettings, loadManifests, manifestRegistry } = globalThis.SWF;

  Hooks.once("init", () => {
    registerSettings();
    log("Initialized module runtime.");
  });

  Hooks.once("ready", async () => {
    log("Ready hook completed.");

    const devToolsEnabled = game.settings.get(MODULE_ID, "enableDevTools");
    if (game.user?.isGM && devToolsEnabled) {
      ui.notifications?.info("SWF dev tools placeholder is active for this world.");
    }

    const futureContentToolsEnabled = game.settings.get(MODULE_ID, "futureContentToolsEnabled");
    if (!futureContentToolsEnabled) {
      manifestRegistry.clear();
      log("Manifest load skipped: futureContentToolsEnabled is off.");
      return;
    }

    await loadManifests();
  });
})();
