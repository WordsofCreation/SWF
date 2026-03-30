/**
 * Stage-1 GM-facing builder shell.
 *
 * The shell is intentionally read-only and preview-oriented.
 */
(() => {
  const { MODULE_ID, log, authoringPreviewState } = globalThis.SWF;

  class SWFBuilderShellApp extends FormApplication {
    #activeSurface = "item";

    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: `${MODULE_ID}-builder-shell`,
        classes: [MODULE_ID, "swf-builder-shell"],
        title: "SWF Builder Shell (Read-Only)",
        template: `modules/${MODULE_ID}/templates/builder-shell.hbs`,
        width: 760,
        height: "auto",
        closeOnSubmit: false,
        submitOnClose: false,
        submitOnChange: false,
        resizable: true
      });
    }

    activateListeners(html) {
      super.activateListeners(html);
      html.find("[data-builder-surface]").on("click", this.#onSelectSurface.bind(this));
    }

    getData() {
      const surfaces = authoringPreviewState.getAuthoringSurfaces();
      const previewState = authoringPreviewState.getDefaultPreviewState();
      const activeSurface = surfaces.find((surface) => surface.key === this.#activeSurface) ?? surfaces[0];
      const activePreview = activeSurface ? previewState.surfaces[activeSurface.key] ?? null : null;

      return {
        shell: {
          schemaVersion: previewState.schemaVersion,
          mode: previewState.mode,
          source: previewState.source,
          sessionId: previewState.sessionId
        },
        surfaces: surfaces.map((surface) => ({
          ...surface,
          isActive: activeSurface ? surface.key === activeSurface.key : false
        })),
        activeSurface,
        activePreview,
        activePreviewJson: activePreview ? JSON.stringify(activePreview.preview, null, 2) : "",
        assumptions: [
          "Preview state is module-local and ephemeral in memory.",
          "No world or compendium documents are created or updated.",
          "Item/Actor/Journal tabs share one read-only preview state contract.",
          "This shell is additive and does not override dnd5e sheets."
        ]
      };
    }

    async #onSelectSurface(event) {
      event.preventDefault();
      const surface = event.currentTarget?.dataset?.builderSurface;
      if (!surface) return;

      this.#activeSurface = surface;
      await this.render(false);
    }

    async _updateObject() {
      // Intentionally empty: stage-1 builder shell has no persistence.
    }
  }

  function registerBuilderShellMenu() {
    game.settings.registerMenu(MODULE_ID, "builderShell", {
      name: "Open Builder Shell",
      label: "Launch",
      hint: "Opens the SWF GM-only read-only builder shell for Item, Actor, and Journal previews.",
      icon: "fas fa-hammer",
      type: SWFBuilderShellApp,
      restricted: true
    });

    log("Registered GM builder shell menu.");
  }

  globalThis.SWF.registerBuilderShellMenu = registerBuilderShellMenu;
})();
