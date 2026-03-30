/**
 * Register SWF module settings.
 */
(() => {
  const { MODULE_ID, registerToolShellMenu, registerBuilderShellMenu } = globalThis.SWF;

  function registerSettings() {
    game.settings.register(MODULE_ID, "debugLogging", {
      name: "Enable Debug Logging",
      hint: "When enabled, this client prints SWF development logs to the browser console.",
      scope: "client",
      config: true,
      type: Boolean,
      default: false
    });

    game.settings.register(MODULE_ID, "enableDevTools", {
      name: "Enable Dev Tools Placeholder",
      hint: "Enables SWF dev-tools placeholder messaging for GMs in this world.",
      scope: "world",
      config: true,
      type: Boolean,
      default: false
    });

    game.settings.register(MODULE_ID, "futureContentToolsEnabled", {
      name: "Enable Future Content Tools",
      hint: "Reserved world toggle for future content tooling slices.",
      scope: "world",
      config: true,
      type: Boolean,
      default: false
    });

    registerToolShellMenu();
    registerBuilderShellMenu();
  }

  globalThis.SWF.registerSettings = registerSettings;
})();
