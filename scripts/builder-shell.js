/**
 * Stage-1 GM-facing builder shell.
 *
 * The shell is intentionally read-only and preview-oriented.
 */
(() => {
  const {
    MODULE_ID,
    log,
    authoringPreviewState,
    referencePresentation,
    validationTracePresentation,
    materializationReadinessPresentation,
    journalReferencePresentation,
    journalMaterialization,
    journalPostCreateInspection
  } = globalThis.SWF;
  let builderShellApp = null;

  class SWFBuilderShellApp extends FormApplication {
    #activeSurface = "item";
    #journalCreateInspection = null;

    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: `${MODULE_ID}-builder-shell`,
        classes: [MODULE_ID, "swf-builder-shell"],
        title: "SWF Builder Shell",
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
      html.find('[data-action="create-journal"]').on("click", this.#onCreateJournal.bind(this));
      html.find('[data-action="open-created-journal"]').on("click", this.#onOpenCreatedJournal.bind(this));
    }

    getData() {
      const surfaces = authoringPreviewState.getAuthoringSurfaces();
      const previewState = authoringPreviewState.getDefaultPreviewState();
      const activeSurface = surfaces.find((surface) => surface.key === this.#activeSurface) ?? surfaces[0];
      const activePreview = activeSurface ? previewState.surfaces[activeSurface.key] ?? null : null;
      const linkedReferences = activePreview?.preview?.linkedReferences ?? [];
      const validationTrace = activePreview?.preview?.validationTrace ?? {};
      const materializationReadiness = activePreview?.preview?.materializationReadiness ?? {};
      const journalReferenceBlock =
        activeSurface?.key === "journal"
          ? journalReferencePresentation.mapSharedReferencesToJournalReferenceBlock(linkedReferences, {
              targetPageName: "Details"
            })
          : null;

      const canCreateJournal = game.user?.isGM === true && activeSurface?.key === "journal";

      return {
        shell: {
          schemaVersion: previewState.schemaVersion,
          mode: previewState.mode,
          source: previewState.source,
          sessionId: previewState.sessionId
        },
        canCreateJournal,
        journalCreateInspection: this.#journalCreateInspection,
        canOpenCreatedJournal: Boolean(this.#journalCreateInspection?.createdJournal?.id),
        surfaces: surfaces.map((surface) => ({
          ...surface,
          isActive: activeSurface ? surface.key === activeSurface.key : false
        })),
        activeSurface,
        activePreview,
        activePreviewJson: activePreview ? JSON.stringify(activePreview.preview, null, 2) : "",
        referenceRows: referencePresentation.buildReferenceDisplayRows(linkedReferences),
        journalReferenceBlock,
        validationTrace: validationTracePresentation.buildValidationTraceDisplay(validationTrace),
        materializationReadiness:
          materializationReadinessPresentation.buildMaterializationReadinessDisplay(materializationReadiness),
        assumptions: [
          "Preview state is module-local and ephemeral in memory.",
          "Journal lane can create one world JournalEntry via explicit GM action.",
          "Item and Actor lanes remain preview-only with no document writes.",
          "Item/Actor/Journal tabs share one read-only preview state contract.",
          "Linked references use one shared preview-only reference model.",
          "This shell is additive and does not override dnd5e sheets."
        ]
      };
    }

    async #onSelectSurface(event) {
      event.preventDefault();
      const surface = event.currentTarget?.dataset?.builderSurface;
      if (!surface) return;

      this.#activeSurface = surface;
      this.#journalCreateInspection = null;
      await this.render(false);
    }

    async #onCreateJournal(event) {
      event.preventDefault();
      if (!game.user?.isGM) return;

      const previewState = authoringPreviewState.getDefaultPreviewState();
      const journalPreview = previewState?.surfaces?.journal?.preview;
      if (!journalPreview) {
        const message = "Journal preview is unavailable; creation was skipped.";
        this.#journalCreateInspection = journalPostCreateInspection.buildJournalPostCreateInspection({
          preview: {},
          result: { ok: false, errorMessage: message }
        });
        ui.notifications?.error(message);
        await this.render(false);
        return;
      }

      const result = await journalMaterialization.materializeJournalPreviewAsWorldEntry(journalPreview);
      this.#journalCreateInspection = journalPostCreateInspection.buildJournalPostCreateInspection({
        preview: journalPreview,
        result
      });

      if (result.ok) ui.notifications?.info(result.statusMessage);
      else ui.notifications?.error(result.errorMessage);

      await this.render(false);
    }

    async #onOpenCreatedJournal(event) {
      event.preventDefault();
      if (!game.user?.isGM) return;

      const createdJournalId = this.#journalCreateInspection?.createdJournal?.id;
      if (!createdJournalId) return;

      const createdEntry = game.journal?.get(createdJournalId);
      if (!createdEntry) {
        ui.notifications?.warn("Created Journal entry could not be found in the sidebar.");
        return;
      }

      createdEntry.sheet?.render(true, { focus: true });
    }

    async _updateObject() {
      // Intentionally empty: stage-1 builder shell has no persistence.
    }
  }

  function openBuilderShell() {
    if (!game.user?.isGM) return;
    builderShellApp ??= new SWFBuilderShellApp();
    void builderShellApp.render(true, { focus: true });
  }

  function registerBuilderShellMenu() {
    game.settings.registerMenu(MODULE_ID, "builderShell", {
      name: "Open Builder Shell",
      label: "Launch",
      hint: "Opens the SWF GM-only builder shell for Item/Actor preview and controlled Journal creation.",
      icon: "fas fa-hammer",
      type: SWFBuilderShellApp,
      restricted: true
    });

    log("Registered GM builder shell menu.");
  }

  function registerBuilderShellKeybinding() {
    game.keybindings.register(MODULE_ID, "openBuilderShell", {
      name: "Open Builder Shell",
      hint: "Launches the SWF GM-only builder shell.",
      editable: [
        {
          key: "KeyB",
          modifiers: ["Shift"]
        }
      ],
      onDown: () => {
        openBuilderShell();
        return true;
      },
      restricted: true,
      precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
    });

    log("Registered GM builder shell keybinding.");
  }

  globalThis.SWF.openBuilderShell = openBuilderShell;
  globalThis.SWF.registerBuilderShellMenu = registerBuilderShellMenu;
  globalThis.SWF.registerBuilderShellKeybinding = registerBuilderShellKeybinding;
})();
