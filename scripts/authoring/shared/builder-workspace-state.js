/**
 * Builder workspace state persistence helpers.
 *
 * Scope: one small GM-facing builder session snapshot stored in module-scoped
 * client settings. Keep this shape intentionally small and lane-agnostic.
 */
(() => {
  const { MODULE_ID, log, authoringPreviewState, builderSampleState, journalDraftState, journalPresetDefinitions } = globalThis.SWF;

  const WORKSPACE_STATE_VERSION = 1;
  const WORKSPACE_STATE_SETTING_KEY = "builderWorkspaceState";

  function toNonEmptyString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function toBoolean(value, fallback = false) {
    if (typeof value === "boolean") return value;
    return fallback;
  }

  function buildDefaultWorkspaceState() {
    return Object.freeze({
      version: WORKSPACE_STATE_VERSION,
      activeSurface: "item",
      journalPresetKey: journalPresetDefinitions.DEFAULT_JOURNAL_PRESET_KEY,
      journalDraft: null,
      sampleSelectionState: builderSampleState.createBuilderSampleSelectionState(),
      // Reserved for future lightweight display toggles; intentionally minimal for now.
      displayPreferences: Object.freeze({
        showValidation: true,
        showMaterializationReadiness: true
      })
    });
  }

  function normalizeSampleSelectionState(selectionState = {}, defaultState = buildDefaultWorkspaceState()) {
    let normalizedState = defaultState.sampleSelectionState;

    for (const surface of authoringPreviewState.getAuthoringSurfaces()) {
      const requestedSampleKey = toNonEmptyString(selectionState?.selectedSampleKeys?.[surface.key]);
      if (!requestedSampleKey) continue;
      normalizedState = builderSampleState.setSelectedSampleForSurface(normalizedState, surface.key, requestedSampleKey);
    }

    return normalizedState;
  }

  function normalizeDisplayPreferences(displayPreferences = {}, defaultState = buildDefaultWorkspaceState()) {
    return Object.freeze({
      showValidation: toBoolean(displayPreferences?.showValidation, defaultState.displayPreferences.showValidation),
      showMaterializationReadiness: toBoolean(
        displayPreferences?.showMaterializationReadiness,
        defaultState.displayPreferences.showMaterializationReadiness
      )
    });
  }

  function normalizeWorkspaceState(candidateState = {}) {
    const defaultState = buildDefaultWorkspaceState();
    const knownSurfaceKeys = new Set(authoringPreviewState.getAuthoringSurfaces().map((surface) => surface.key));

    const requestedActiveSurface = toNonEmptyString(candidateState?.activeSurface);
    const activeSurface = knownSurfaceKeys.has(requestedActiveSurface) ? requestedActiveSurface : defaultState.activeSurface;

    const sampleSelectionState = normalizeSampleSelectionState(candidateState?.sampleSelectionState, defaultState);

    const previewProjection = builderSampleState.buildPreviewStateWithSamples(
      authoringPreviewState.getDefaultPreviewState(),
      sampleSelectionState
    );
    const journalPreview = previewProjection?.previewState?.surfaces?.journal?.preview ?? {};

    const requestedPresetKey = toNonEmptyString(candidateState?.journalPresetKey);
    const resolvedPresetKey = journalPresetDefinitions.getJournalPresetByKey(requestedPresetKey)
      ? requestedPresetKey
      : journalPresetDefinitions.DEFAULT_JOURNAL_PRESET_KEY;

    const normalizedJournalDraft = candidateState?.journalDraft
      ? {
          ...journalDraftState.INTERNALS.normalizeDraftForDirtyComparison(candidateState.journalDraft),
          selectedPresetKey: resolvedPresetKey
        }
      : journalDraftState.createJournalDraftFromPreset(journalPreview, resolvedPresetKey);

    return Object.freeze({
      version: WORKSPACE_STATE_VERSION,
      activeSurface,
      journalPresetKey: resolvedPresetKey,
      journalDraft: normalizedJournalDraft,
      sampleSelectionState,
      displayPreferences: normalizeDisplayPreferences(candidateState?.displayPreferences, defaultState)
    });
  }

  function loadWorkspaceState() {
    let storedState;

    try {
      storedState = game.settings.get(MODULE_ID, WORKSPACE_STATE_SETTING_KEY);
    } catch (error) {
      log("Builder workspace state load failed; using defaults.", error);
      return buildDefaultWorkspaceState();
    }

    if (!storedState || typeof storedState !== "object") {
      return buildDefaultWorkspaceState();
    }

    const storedVersion = Number(storedState?.version ?? 0);
    if (storedVersion !== WORKSPACE_STATE_VERSION) {
      // Migration guard: unknown versions reset to conservative defaults.
      log(
        `Builder workspace state version mismatch (${storedVersion} !== ${WORKSPACE_STATE_VERSION}); defaults restored.`
      );
      return buildDefaultWorkspaceState();
    }

    return normalizeWorkspaceState(storedState);
  }

  async function saveWorkspaceState(candidateState = {}) {
    const normalizedState = normalizeWorkspaceState(candidateState);
    await game.settings.set(MODULE_ID, WORKSPACE_STATE_SETTING_KEY, normalizedState);
    return normalizedState;
  }

  async function clearWorkspaceState() {
    const defaultState = buildDefaultWorkspaceState();
    await game.settings.set(MODULE_ID, WORKSPACE_STATE_SETTING_KEY, defaultState);
    return defaultState;
  }

  globalThis.SWF.builderWorkspaceState = {
    WORKSPACE_STATE_VERSION,
    WORKSPACE_STATE_SETTING_KEY,
    buildDefaultWorkspaceState,
    normalizeWorkspaceState,
    loadWorkspaceState,
    saveWorkspaceState,
    clearWorkspaceState
  };
})();
