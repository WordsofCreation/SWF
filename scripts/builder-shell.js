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
    itemMaterialization,
    itemPostCreateInspection,
    journalMaterialization,
    journalPostCreateInspection,
    journalPresetDefinitions,
    journalDraftState,
    laneDraftState,
    sampleContentRegistry,
    builderSampleState,
    builderWorkspaceState
  } = globalThis.SWF;
  let builderShellApp = null;

  class SWFBuilderShellApp extends FormApplication {
    #activeSurface = "item";
    #itemCreateInspection = null;
    #journalCreateInspection = null;
    #journalPresetKey = journalPresetDefinitions.DEFAULT_JOURNAL_PRESET_KEY;
    #laneDrafts = Object.freeze({});
    #sampleSelectionState = builderSampleState.createBuilderSampleSelectionState();
    #displayPreferences = { showValidation: true, showMaterializationReadiness: true };

    constructor(...args) {
      super(...args);
      this.#hydrateFromWorkspaceState(builderWorkspaceState.loadWorkspaceState());
    }

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
      html.find('[data-action="create-item"]').on("click", this.#onCreateItem.bind(this));
      html.find('[data-action="open-created-item"]').on("click", this.#onOpenCreatedItem.bind(this));
      html.find('[data-action="create-journal"]').on("click", this.#onCreateJournal.bind(this));
      html.find('[data-action="open-created-journal"]').on("click", this.#onOpenCreatedJournal.bind(this));
      html.find('[data-action="select-journal-preset"]').on("change", this.#onSelectJournalPreset.bind(this));
      html.find('[data-action="select-sample"]').on("change", this.#onSelectSample.bind(this));
      html.find('[data-action="reset-journal-draft"]').on("click", this.#onResetJournalDraft.bind(this));
      html.find('[data-action="reset-workspace-state"]').on("click", this.#onResetWorkspaceState.bind(this));
      html.find("[data-journal-draft-field]").on("change", this.#onEditJournalDraftField.bind(this));
    }

    getData() {
      const surfaces = authoringPreviewState.getAuthoringSurfaces();
      const sampleProjection = this.#buildPreviewStateWithSamples();
      const previewState = sampleProjection.previewState;
      const laneDraftCoordination = laneDraftState.buildLaneDraftCoordination({
        previewState,
        laneDrafts: this.#laneDrafts,
        activeLane: this.#activeSurface,
        journalPresetKey: this.#journalPresetKey
      });
      this.#laneDrafts = laneDraftCoordination.laneDrafts;
      const activeSurface = surfaces.find((surface) => surface.key === this.#activeSurface) ?? surfaces[0];
      const activePreview = activeSurface ? previewState.surfaces[activeSurface.key] ?? null : null;
      const sampleRows = sampleContentRegistry.getSamplesForSurface(activeSurface?.key);
      const selectedSample = sampleContentRegistry.getSampleByKey(
        activeSurface?.key,
        this.#sampleSelectionState.selectedSampleKeys?.[activeSurface?.key]
      );
      const activeSurfaceSampleState = sampleProjection.surfaceSampleState[activeSurface?.key] ?? null;
      const linkedReferences = activePreview?.preview?.linkedReferences ?? [];
      const validationTrace = activePreview?.preview?.validationTrace ?? {};
      const materializationReadiness = activePreview?.preview?.materializationReadiness ?? {};
      if (activeSurface?.key === "journal" && !this.#getJournalDraft()) this.#resetJournalDraftFromPreset(this.#journalPresetKey);
      const journalPreview =
        activeSurface?.key === "journal"
          ? journalDraftState.applyJournalDraftToPreview(activePreview?.preview ?? {}, this.#getJournalDraft() ?? {})
          : null;
      const journalMaterializationPipeline =
        activeSurface?.key === "journal"
          ? journalMaterialization.buildJournalMaterializationPipelineFromPreview(journalPreview ?? {})
          : null;
      const journalPipeline = journalMaterializationPipeline?.stages ?? null;
      const journalValidationResult = journalPipeline?.validation ?? null;
      const journalPresetDefaultDraft =
        activeSurface?.key === "journal"
          ? laneDraftCoordination.baselines.journal ?? this.#buildJournalPresetDefaultDraft(activePreview?.preview ?? {})
          : null;
      const isJournalDraftDirty =
        activeSurface?.key === "journal"
          ? laneDraftCoordination.laneDirty.journal === true
          : false;
      const journalSummaryDetailsFrame = journalPipeline?.shaping?.summaryDetailsFrame ?? null;
      const journalReferenceBlock = journalPipeline?.shaping?.referenceBlock ?? null;
      const journalSectionPlan = journalPipeline?.shaping?.sectionPlan ?? null;
      const itemMaterializationPipeline =
        activeSurface?.key === "item"
          ? itemMaterialization.buildItemMaterializationPipelineFromPreview(activePreview?.preview ?? {})
          : null;
      const itemValidationResult = itemMaterializationPipeline?.stages?.validation ?? null;
      const itemCreateIntentSummary =
        activeSurface?.key === "item"
          ? itemMaterialization.buildItemCreateIntentSummaryFromPreview(activePreview?.preview ?? {})
          : null;
      const canCreateItem = game.user?.isGM === true && activeSurface?.key === "item" && itemValidationResult?.ok === true;

      const canCreateJournal =
        game.user?.isGM === true && activeSurface?.key === "journal" && journalValidationResult?.ok === true;
      const journalCreateIntentSummary =
        activeSurface?.key === "journal"
          ? journalMaterialization.buildJournalCreateIntentSummaryFromPreview(journalPreview ?? {})
          : null;
      const activePreviewWithPreset =
        activeSurface?.key === "journal" && activePreview
          ? {
              ...activePreview,
              preview: journalPreview
            }
          : activePreview;
      const activeStateOrigin =
        activeSurface?.key === "journal" && isJournalDraftDirty
          ? "manual-draft-overrides"
          : activeSurfaceSampleState?.sourceType ?? "default";
      const activeStateOriginLabel =
        activeSurface?.key === "journal" && isJournalDraftDirty
          ? "Manual edits on top of loaded sample/preset defaults"
          : activeSurfaceSampleState?.sourceLabel ?? "Default builder preview";

      return {
        shell: {
          schemaVersion: previewState.schemaVersion,
          mode: previewState.mode,
          source: previewState.source,
          sessionId: previewState.sessionId
        },
        canCreateJournal,
        canCreateItem,
        itemValidation: itemValidationResult,
        itemCreateIntentSummary,
        itemCreateInspection: this.#itemCreateInspection,
        canOpenCreatedItem: Boolean(this.#itemCreateInspection?.createdItem?.id),
        journalCreateInspection: this.#journalCreateInspection,
        canOpenCreatedJournal: Boolean(this.#journalCreateInspection?.createdJournal?.id),
        surfaces: surfaces.map((surface) => ({
          ...surface,
          isActive: activeSurface ? surface.key === activeSurface.key : false
        })),
        activeSurface,
        activePreview: activePreviewWithPreset,
        sampleOptions: sampleRows.map((sample) => ({
          key: sample.key,
          label: sample.label,
          description: sample.description,
          isSelected: sample.key === this.#sampleSelectionState.selectedSampleKeys?.[activeSurface?.key]
        })),
        selectedSample,
        activeSampleState: {
          activeSampleKey: activeSurfaceSampleState?.selectedSampleKey ?? "",
          activeSampleLabel: builderSampleState.getActiveSampleLabel(activeSurfaceSampleState),
          activeStateOrigin,
          activeStateOriginLabel
        },
        activePreviewJson: activePreviewWithPreset ? JSON.stringify(activePreviewWithPreset.preview, null, 2) : "",
        referenceRows: referencePresentation.buildReferenceDisplayRows(linkedReferences),
        journalReferenceBlock,
        journalSummaryDetailsFrame,
        journalSectionPlan,
        journalPresetOptions: journalPresetDefinitions.getJournalPresets().map((preset) => ({
          key: preset.key,
          label: preset.label,
          description: preset.description,
          isSelected: preset.key === this.#journalPresetKey
        })),
        selectedJournalPreset: journalPreview?.preset ?? null,
        journalDraftStatus: activeSurface?.key === "journal" ? (isJournalDraftDirty ? "modified" : "clean") : null,
        isJournalDraftDirty,
        journalDraft: this.#getJournalDraft() ?? null,
        activeLaneDraftStatus: laneDraftCoordination.isActiveLaneDirty ? "modified" : "clean",
        displayPreferences: this.#displayPreferences,
        journalValidation: journalValidationResult,
        journalCreateIntentSummary,
        validationTrace: validationTracePresentation.buildValidationTraceDisplay(validationTrace),
        materializationReadiness:
          materializationReadinessPresentation.buildMaterializationReadinessDisplay(materializationReadiness),
        assumptions: [
          "Preview state is module-local and ephemeral in memory.",
          "Journal lane can create one world JournalEntry via explicit GM action.",
          "Item lane can create one world feat Item via explicit GM action.",
          "Actor lane remains preview-only with no document writes.",
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
      this.#itemCreateInspection = null;
      this.#journalCreateInspection = null;
      await this.#persistWorkspaceState();
      await this.render(false);
    }

    async #onCreateItem(event) {
      event.preventDefault();
      if (!game.user?.isGM) return;

      const itemPreview = this.#getPreviewStateWithSamples()?.surfaces?.item?.preview ?? {};
      const materializationPipeline = itemMaterialization.buildItemMaterializationPipelineFromPreview(itemPreview);
      const itemValidationResult = materializationPipeline.stages.validation;

      if (!itemValidationResult.ok) {
        const message = "Item preview failed feat-only validation. Fix preview inputs before creating.";
        this.#itemCreateInspection = itemPostCreateInspection.buildItemPostCreateInspection({
          preview: itemPreview,
          result: { ok: false, reason: "validation-failed", errorMessage: message, validation: itemValidationResult }
        });
        ui.notifications?.error(message);
        await this.render(false);
        return;
      }

      const result = await itemMaterialization.materializeItemPreviewAsWorldItem(itemPreview, {
        materializationPipeline
      });
      this.#itemCreateInspection = itemPostCreateInspection.buildItemPostCreateInspection({
        preview: itemPreview,
        result
      });

      if (result.ok) ui.notifications?.info(result.statusMessage);
      else ui.notifications?.error(result.errorMessage);

      await this.render(false);
    }

    async #onOpenCreatedItem(event) {
      event.preventDefault();
      if (!game.user?.isGM) return;

      const createdItemId = this.#itemCreateInspection?.createdItem?.id;
      if (!createdItemId) return;

      const createdItem = game.items?.get(createdItemId);
      if (!createdItem) {
        ui.notifications?.warn("Created Item could not be found in the Items sidebar.");
        return;
      }

      createdItem.sheet?.render(true, { focus: true });
    }


    async #onSelectJournalPreset(event) {
      event.preventDefault();
      const nextPresetKey = event.currentTarget?.value;
      if (!nextPresetKey) return;

      this.#resetJournalDraftFromPreset(nextPresetKey);
      this.#journalCreateInspection = null;
      await this.#persistWorkspaceState();
      await this.render(false);
    }

    async #onEditJournalDraftField(event) {
      const field = event.currentTarget?.dataset?.journalDraftField;
      if (!field) return;

      this.#laneDrafts = laneDraftState.updateLaneDraftField(
        this.#laneDrafts,
        "journal",
        field,
        event.currentTarget?.value,
        this.#getPreviewStateWithSamples(),
        { journalPresetKey: this.#journalPresetKey }
      );
      this.#journalCreateInspection = null;
      await this.#persistWorkspaceState();
      await this.render(false);
    }

    async #onResetJournalDraft(event) {
      event.preventDefault();
      this.#resetJournalDraftFromPreset(this.#getJournalDraft()?.selectedPresetKey ?? this.#journalPresetKey);
      this.#journalCreateInspection = null;
      await this.#persistWorkspaceState();
      await this.render(false);
    }

    async #onCreateJournal(event) {
      event.preventDefault();
      if (!game.user?.isGM) return;

      const previewState = this.#getPreviewStateWithSamples();
      const journalPresetDefaultDraft = this.#buildJournalPresetDefaultDraft(previewState?.surfaces?.journal?.preview ?? {});
      const isJournalDraftDirty = journalDraftState.isJournalDraftDirty(this.#getJournalDraft() ?? {}, journalPresetDefaultDraft);
      const journalPreview = journalDraftState.applyJournalDraftToPreview(
        previewState?.surfaces?.journal?.preview ?? {},
        this.#getJournalDraft() ?? {}
      );
      const materializationPipeline = journalMaterialization.buildJournalMaterializationPipelineFromPreview(journalPreview);
      const journalValidationResult = materializationPipeline.stages.validation;
      if (!journalPreview) {
        const message = "Journal preview is unavailable; creation was skipped.";
        this.#journalCreateInspection = journalPostCreateInspection.buildJournalPostCreateInspection({
          preview: {},
          result: { ok: false, errorMessage: message, validation: journalValidationResult },
          draftState: { isDirty: isJournalDraftDirty }
        });
        ui.notifications?.error(message);
        await this.render(false);
        return;
      }

      if (!journalValidationResult.ok) {
        const message = "Journal draft failed validation. Fix errors before creating a Journal entry.";
        this.#journalCreateInspection = journalPostCreateInspection.buildJournalPostCreateInspection({
          preview: journalPreview,
          result: { ok: false, reason: "validation-failed", errorMessage: message, validation: journalValidationResult },
          draftState: { isDirty: isJournalDraftDirty }
        });
        ui.notifications?.error(message);
        await this.render(false);
        return;
      }

      const result = await journalMaterialization.materializeJournalPreviewAsWorldEntry(journalPreview, {
        materializationPipeline
      });
      this.#journalCreateInspection = journalPostCreateInspection.buildJournalPostCreateInspection({
        preview: journalPreview,
        result,
        draftState: { isDirty: isJournalDraftDirty }
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
      await this.#persistWorkspaceState();
    }

    async #onSelectSample(event) {
      event.preventDefault();
      const surfaceKey = event.currentTarget?.dataset?.sampleSurface;
      const sampleKey = event.currentTarget?.value;
      if (!surfaceKey || !sampleKey) return;

      this.#sampleSelectionState = builderSampleState.setSelectedSampleForSurface(this.#sampleSelectionState, surfaceKey, sampleKey);
      this.#clearStateForSampleLoad();

      if (surfaceKey === "journal") {
        const previewState = this.#getPreviewStateWithSamples();
        const journalPreview = previewState?.surfaces?.journal?.preview ?? {};
        const nextPresetKey = journalPreview?.preset?.key ?? this.#journalPresetKey;
        this.#resetJournalDraftFromPreset(nextPresetKey);
      } else {
        this.#laneDrafts = laneDraftState.resetLaneDraft(
          this.#laneDrafts,
          surfaceKey,
          this.#getPreviewStateWithSamples()
        );
      }

      await this.#persistWorkspaceState();
      await this.render(false);
    }

    async #onResetWorkspaceState(event) {
      event.preventDefault();
      const clearedState = await builderWorkspaceState.clearWorkspaceState();
      this.#hydrateFromWorkspaceState(clearedState);
      this.#clearStateForSampleLoad();
      ui.notifications?.info("Builder workspace state reset to defaults for this GM client.");
      await this.render(false);
    }

    #resetJournalDraftFromPreset(presetKey) {
      const previewState = this.#getPreviewStateWithSamples();
      this.#laneDrafts = laneDraftState.resetLaneDraft(
        this.#laneDrafts,
        "journal",
        previewState,
        { journalPresetKey: presetKey }
      );
      this.#journalPresetKey = this.#getJournalDraft()?.selectedPresetKey ?? presetKey;
    }

    #buildJournalPresetDefaultDraft(journalPreview = {}) {
      return journalDraftState.createJournalDraftFromPreset(
        journalPreview,
        this.#getJournalDraft()?.selectedPresetKey ?? this.#journalPresetKey
      );
    }

    #getJournalDraft() {
      return this.#laneDrafts?.journal ?? null;
    }

    #clearStateForSampleLoad() {
      const resetPolicy = builderSampleState.getSampleLoadResetPolicy();
      if (!resetPolicy.clearPostCreationInspection) return;

      this.#itemCreateInspection = null;
      this.#journalCreateInspection = null;
    }

    #buildPreviewStateWithSamples() {
      return builderSampleState.buildPreviewStateWithSamples(
        authoringPreviewState.getDefaultPreviewState(),
        this.#sampleSelectionState
      );
    }

    #getPreviewStateWithSamples() {
      return this.#buildPreviewStateWithSamples().previewState;
    }

    #buildWorkspaceStateSnapshot() {
      return {
        version: builderWorkspaceState.WORKSPACE_STATE_VERSION,
        activeSurface: this.#activeSurface,
        journalPresetKey: this.#journalPresetKey,
        laneDrafts: this.#laneDrafts,
        sampleSelectionState: this.#sampleSelectionState,
        displayPreferences: this.#displayPreferences
      };
    }

    #hydrateFromWorkspaceState(workspaceState = {}) {
      const normalizedState = builderWorkspaceState.normalizeWorkspaceState(workspaceState);
      this.#activeSurface = normalizedState.activeSurface;
      this.#journalPresetKey = normalizedState.journalPresetKey;
      this.#laneDrafts = normalizedState.laneDrafts ?? Object.freeze({});
      this.#sampleSelectionState = normalizedState.sampleSelectionState;
      this.#displayPreferences = normalizedState.displayPreferences;
    }

    async #persistWorkspaceState() {
      const normalizedState = await builderWorkspaceState.saveWorkspaceState(this.#buildWorkspaceStateSnapshot());
      this.#hydrateFromWorkspaceState(normalizedState);
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
