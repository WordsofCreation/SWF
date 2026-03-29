/**
 * Minimal GM-facing tool shell launcher and placeholder application.
 */
(() => {
  const { MODULE_ID, log } = globalThis.SWF;

  class SWFToolShellApp extends FormApplication {
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: `${MODULE_ID}-tool-shell`,
        classes: [MODULE_ID, "swf-tool-shell"],
        title: "SWF Tool Shell",
        template: `modules/${MODULE_ID}/templates/tool-shell.hbs`,
        width: 380,
        height: "auto",
        closeOnSubmit: false,
        submitOnClose: false,
        submitOnChange: false,
        resizable: false
      });
    }

    getData() {
      const setting = (key) => game.settings.get(MODULE_ID, key) === true;
      return {
        settings: {
          debugLogging: setting("debugLogging"),
          enableDevTools: setting("enableDevTools"),
          futureContentToolsEnabled: setting("futureContentToolsEnabled")
        }
      };
    }

    async _updateObject() {
      // Intentionally empty: this shell does not edit data yet.
    }
  }

  function registerToolShellMenu() {
    game.settings.registerMenu(MODULE_ID, "toolShell", {
      name: "Open Tool Shell",
      label: "Launch",
      hint: "Opens a minimal SWF GM-only placeholder window for future tooling.",
      icon: "fas fa-toolbox",
      type: SWFToolShellApp,
      restricted: true
    });

    log("Registered GM tool shell menu.");
  }

  globalThis.SWF.registerToolShellMenu = registerToolShellMenu;
})();
