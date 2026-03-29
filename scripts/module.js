/**
 * SWF module runtime hooks.
 *
 * Intentionally minimal and non-invasive: no actor/item/sheet patches.
 */
(() => {
  const { MODULE_ID, log, registerSettings } = globalThis.SWF;

  Hooks.once("init", () => {
    registerSettings();
    log("Initialized module runtime.");
  });

  Hooks.once("ready", () => {
    log("Ready hook completed.");

    const devToolsEnabled = game.settings.get(MODULE_ID, "enableDevTools");
    if (game.user?.isGM && devToolsEnabled) {
      ui.notifications?.info("SWF dev tools placeholder is active for this world.");
    }
  });
})();
