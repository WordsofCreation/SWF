/**
 * Minimal GM-facing tool shell launcher and placeholder application.
 */
(() => {
  const { MODULE_ID, log, manifestRegistry, manifestValidation } = globalThis.SWF;

  class SWFToolShellApp extends FormApplication {
    #selectedManifestKey = null;

    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: `${MODULE_ID}-tool-shell`,
        classes: [MODULE_ID, "swf-tool-shell"],
        title: "SWF Tool Shell",
        template: `modules/${MODULE_ID}/templates/tool-shell.hbs`,
        width: 700,
        height: "auto",
        closeOnSubmit: false,
        submitOnClose: false,
        submitOnChange: false,
        resizable: false
      });
    }

    activateListeners(html) {
      super.activateListeners(html);
      html.find("[data-manifest-key]").on("click", this.#onSelectManifest.bind(this));
    }

    getData() {
      const setting = (key) => game.settings.get(MODULE_ID, key) === true;
      const manifestStats = manifestRegistry.getStats();
      const loadReport = manifestRegistry.getLastLoadReport();
      const manifestEntries = manifestRegistry.getAll().map((manifest) => {
        const selectionKey = this.#toValidSelectionKey(manifest.id);
        return {
          selectionKey,
          isSelected: selectionKey === this.#selectedManifestKey,
          source: "valid",
          id: manifest.id,
          type: manifest.type,
          name: manifest.name,
          version: manifest.version,
          status: manifest.status,
          validationState: "valid"
        };
      });
      const invalidEntries = manifestRegistry.getInvalidEntries().map((entry, index) => {
        const selectionKey = this.#toInvalidSelectionKey(index);
        return {
          selectionKey,
          isSelected: selectionKey === this.#selectedManifestKey,
          source: "invalid",
          path: entry.path,
          id: entry.id,
          type: entry.type,
          issueCount: entry.issues.length,
          issueSummary: entry.issues.map((issue) => issue.message).join(" ")
        };
      });
      const detail = this.#getSelectedManifestDetail();

      return {
        settings: {
          debugLogging: setting("debugLogging"),
          enableDevTools: setting("enableDevTools"),
          futureContentToolsEnabled: setting("futureContentToolsEnabled")
        },
        manifests: {
          total: manifestStats.total,
          invalid: manifestStats.invalid,
          attempted: loadReport.attempted,
          failed: loadReport.failed,
          entries: manifestEntries,
          invalidEntries,
          detail,
          hasEntries: manifestEntries.length > 0,
          hasInvalidEntries: invalidEntries.length > 0,
          hasFailures: loadReport.failed > 0
        }
      };
    }

    async #onSelectManifest(event) {
      event.preventDefault();
      const key = event.currentTarget?.dataset?.manifestKey;
      this.#selectedManifestKey = typeof key === "string" && key.length > 0 ? key : null;
      await this.render(false);
    }

    #toValidSelectionKey(id) {
      return `valid:${id}`;
    }

    #toInvalidSelectionKey(index) {
      return `invalid:${index}`;
    }

    #getSelectedManifestDetail() {
      if (!this.#selectedManifestKey) {
        return {
          hasSelection: false
        };
      }

      if (this.#selectedManifestKey.startsWith("valid:")) {
        const id = this.#selectedManifestKey.slice("valid:".length);
        const manifest = manifestRegistry.getById(id);
        if (!manifest) {
          return { hasSelection: false };
        }

        const typeSpecificFields = this.#collectTypeSpecificFields(manifest);
        return {
          hasSelection: true,
          source: "valid",
          id: manifest.id,
          type: manifest.type,
          name: manifest.name,
          version: manifest.version,
          status: manifest.status,
          description: manifest.description,
          typeSpecificFields,
          hasTypeSpecificFields: typeSpecificFields.length > 0,
          validationSummary: "Valid (0 issues)",
          hasIssues: false,
          issues: []
        };
      }

      if (this.#selectedManifestKey.startsWith("invalid:")) {
        const index = Number(this.#selectedManifestKey.slice("invalid:".length));
        if (!Number.isInteger(index)) {
          return { hasSelection: false };
        }

        const entry = manifestRegistry.getInvalidEntries()[index];
        if (!entry) {
          return { hasSelection: false };
        }

        const normalizedManifest = entry.manifest ?? {};
        const typeSpecificFields = this.#collectTypeSpecificFields(normalizedManifest);
        const errors = entry.issues.filter((issue) => issue.severity === "error").length;
        const warnings = entry.issues.filter((issue) => issue.severity === "warning").length;
        const validationSummary = `Invalid (${entry.issues.length} issues: ${errors} errors, ${warnings} warnings)`;

        return {
          hasSelection: true,
          source: "invalid",
          path: entry.path,
          id: entry.id,
          type: entry.type,
          name: normalizedManifest.name || "(missing)",
          version: normalizedManifest.version || "(missing)",
          status: normalizedManifest.status || "(missing)",
          description: normalizedManifest.description || "(missing)",
          typeSpecificFields,
          hasTypeSpecificFields: typeSpecificFields.length > 0,
          validationSummary,
          hasIssues: entry.issues.length > 0,
          issues: entry.issues
        };
      }

      return { hasSelection: false };
    }

    #collectTypeSpecificFields(manifest) {
      const type = typeof manifest?.type === "string" ? manifest.type : "";
      const required = manifestValidation.TYPE_REQUIRED_FIELDS[type] ?? [];
      return required.map((field) => ({
        key: field,
        value: typeof manifest[field] === "string" && manifest[field].length > 0 ? manifest[field] : "(missing)"
      }));
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
