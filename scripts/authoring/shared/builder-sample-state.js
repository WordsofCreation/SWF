/**
 * Builder-sample state helpers.
 *
 * Goal: keep sample loading/switching explicit and predictable without introducing
 * persistence or generalized state-management abstractions.
 */
(() => {
  const { authoringPreviewState, sampleContentRegistry } = globalThis.SWF;

  function toNonEmptyString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function clone(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function createBuilderSampleSelectionState() {
    const selectedSampleKeys = {};
    for (const surface of authoringPreviewState.getAuthoringSurfaces()) {
      selectedSampleKeys[surface.key] = sampleContentRegistry.getDefaultSampleKeyForSurface(surface.key);
    }

    return Object.freeze({ selectedSampleKeys: Object.freeze(selectedSampleKeys) });
  }

  function setSelectedSampleForSurface(selectionState = {}, surfaceKey, sampleKey) {
    const normalizedSurfaceKey = toNonEmptyString(surfaceKey);
    if (!normalizedSurfaceKey) return selectionState;

    const resolvedSampleKey =
      toNonEmptyString(sampleKey) || sampleContentRegistry.getDefaultSampleKeyForSurface(normalizedSurfaceKey);
    const selectedSampleKeys = {
      ...(selectionState.selectedSampleKeys ?? {}),
      [normalizedSurfaceKey]: resolvedSampleKey
    };

    return Object.freeze({ selectedSampleKeys: Object.freeze(selectedSampleKeys) });
  }

  function buildPreviewStateWithSamples(previewState = {}, selectionState = {}) {
    const nextSurfaces = { ...(previewState.surfaces ?? {}) };
    const surfaceSampleState = {};

    for (const surface of authoringPreviewState.getAuthoringSurfaces()) {
      const surfacePreview = nextSurfaces[surface.key];
      if (!surfacePreview) continue;

      const selectedSampleKey =
        toNonEmptyString(selectionState.selectedSampleKeys?.[surface.key]) ||
        sampleContentRegistry.getDefaultSampleKeyForSurface(surface.key);
      const selectedSample = sampleContentRegistry.getSampleByKey(surface.key, selectedSampleKey);

      if (selectedSample) {
        nextSurfaces[surface.key] = sampleContentRegistry.applySampleToSurfacePreview(
          surfacePreview,
          surface.key,
          selectedSampleKey
        );
      }

      surfaceSampleState[surface.key] = Object.freeze({
        surfaceKey: surface.key,
        selectedSampleKey,
        selectedSampleLabel: selectedSample?.label ?? "",
        selectedSampleDescription: selectedSample?.description ?? "",
        sourceType: selectedSample ? "sample" : "default",
        sourceLabel: selectedSample ? `Loaded sample: ${selectedSample.label}` : "Default builder preview"
      });
    }

    return Object.freeze({
      previewState: Object.freeze({
        ...clone(previewState),
        surfaces: nextSurfaces
      }),
      surfaceSampleState: Object.freeze(surfaceSampleState)
    });
  }

  function getActiveSampleLabel(surfaceState = {}) {
    return toNonEmptyString(surfaceState.selectedSampleLabel) || "No sample loaded";
  }

  function getSampleLoadResetPolicy() {
    return Object.freeze({
      replaceLaneStateFromSample: true,
      clearPostCreationInspection: true,
      resetJournalDraftFromSamplePreset: true,
      retainSessionShellMetadata: true
    });
  }

  globalThis.SWF.builderSampleState = {
    createBuilderSampleSelectionState,
    setSelectedSampleForSurface,
    buildPreviewStateWithSamples,
    getActiveSampleLabel,
    getSampleLoadResetPolicy
  };
})();
