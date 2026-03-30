/**
 * Lane-aware draft normalization and dirty-state helpers.
 *
 * Scope: UI-facing builder coordination only.
 * - Keeps one normalized draft shape per lane.
 * - Tracks dirty state against lane-local normalized baselines.
 * - Intentionally avoids materialization concerns.
 */
(() => {
  const { journalDraftState, journalPresetDefinitions } = globalThis.SWF;
  const { DEFAULT_JOURNAL_PRESET_KEY } = journalPresetDefinitions;

  const LANE_KEYS = Object.freeze(["item", "actor", "journal"]);

  /**
   * Lane field allow-lists are intentionally small.
   * Expand only when a lane gains new editable fields.
   */
  const LANE_ALLOWED_FIELDS = Object.freeze({
    item: Object.freeze(["name", "summary", "typeHint"]),
    actor: Object.freeze(["name", "summary", "typeHint", "roleLabel", "concept"]),
    journal: Object.freeze(["selectedPresetKey", "name", "summary", "notesText"])
  });

  function toLaneKey(value) {
    return LANE_KEYS.includes(value) ? value : "item";
  }

  function toNonEmptyString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function sanitizeAllowedFields(laneKey, draft = {}) {
    const allowed = new Set(LANE_ALLOWED_FIELDS[laneKey] ?? []);
    const sanitized = {};
    for (const [key, value] of Object.entries(draft ?? {})) {
      if (!allowed.has(key)) continue;
      sanitized[key] = value;
    }
    return sanitized;
  }

  function buildLaneDefaultDraft(laneKey, lanePreview = {}, options = {}) {
    if (laneKey === "journal") {
      const selectedPresetKey = toNonEmptyString(options?.journalPresetKey) || DEFAULT_JOURNAL_PRESET_KEY;
      return journalDraftState.createJournalDraftFromPreset(lanePreview, selectedPresetKey);
    }

    if (laneKey === "item") {
      return Object.freeze({
        name: toNonEmptyString(lanePreview?.name),
        summary: toNonEmptyString(lanePreview?.summary),
        typeHint: toNonEmptyString(lanePreview?.typeHint)
      });
    }

    return Object.freeze({
      name: toNonEmptyString(lanePreview?.name),
      summary: toNonEmptyString(lanePreview?.summary),
      typeHint: toNonEmptyString(lanePreview?.typeHint),
      roleLabel: toNonEmptyString(lanePreview?.roleLabel),
      concept: toNonEmptyString(lanePreview?.concept)
    });
  }

  function normalizeLaneDraft(laneKey, laneDraft = {}, lanePreview = {}, options = {}) {
    const safeLaneKey = toLaneKey(laneKey);
    const defaults = buildLaneDefaultDraft(safeLaneKey, lanePreview, options);
    const sanitizedDraft = sanitizeAllowedFields(safeLaneKey, laneDraft);

    if (safeLaneKey === "journal") {
      const normalizedJournalInput = journalDraftState.INTERNALS.normalizeDraftForDirtyComparison(sanitizedDraft);
      const mergedJournalDraft = { ...defaults };
      for (const key of Object.keys(sanitizedDraft)) {
        if (key === "selectedPresetKey") continue;
        mergedJournalDraft[key] = normalizedJournalInput[key];
      }
      return Object.freeze({
        ...mergedJournalDraft,
        selectedPresetKey: toNonEmptyString(options?.journalPresetKey) || defaults.selectedPresetKey
      });
    }

    return Object.freeze({
      ...defaults,
      ...Object.fromEntries(
        Object.entries(sanitizedDraft).map(([key, value]) => [key, toNonEmptyString(value)])
      )
    });
  }

  function normalizeDraftForDirtyComparison(laneKey, laneDraft = {}, lanePreview = {}, options = {}) {
    const safeLaneKey = toLaneKey(laneKey);
    const normalized = normalizeLaneDraft(safeLaneKey, laneDraft, lanePreview, options);
    if (safeLaneKey === "journal") {
      return journalDraftState.INTERNALS.normalizeDraftForDirtyComparison(normalized);
    }
    return normalized;
  }

  function isLaneDraftDirty(laneKey, laneDraft = {}, laneBaseline = {}, lanePreview = {}, options = {}) {
    const safeLaneKey = toLaneKey(laneKey);
    if (safeLaneKey === "journal") {
      return journalDraftState.isJournalDraftDirty(
        normalizeDraftForDirtyComparison("journal", laneDraft, lanePreview, options),
        normalizeDraftForDirtyComparison("journal", laneBaseline, lanePreview, options)
      );
    }

    const normalizedDraft = normalizeDraftForDirtyComparison(safeLaneKey, laneDraft, lanePreview, options);
    const normalizedBaseline = normalizeDraftForDirtyComparison(safeLaneKey, laneBaseline, lanePreview, options);
    return (LANE_ALLOWED_FIELDS[safeLaneKey] ?? []).some((field) => normalizedDraft[field] !== normalizedBaseline[field]);
  }

  function buildLaneDraftCoordination({ previewState = {}, laneDrafts = {}, activeLane = "item", journalPresetKey } = {}) {
    const safeActiveLane = toLaneKey(activeLane);
    const coordinatedDrafts = {};
    const baselines = {};
    const laneDirty = {};

    for (const laneKey of LANE_KEYS) {
      const lanePreview = previewState?.surfaces?.[laneKey]?.preview ?? {};
      const laneOptions = laneKey === "journal" ? { journalPresetKey } : {};
      const baseline = buildLaneDefaultDraft(laneKey, lanePreview, laneOptions);
      const draft = normalizeLaneDraft(laneKey, laneDrafts?.[laneKey], lanePreview, laneOptions);

      coordinatedDrafts[laneKey] = draft;
      baselines[laneKey] = normalizeDraftForDirtyComparison(laneKey, baseline, lanePreview, laneOptions);
      laneDirty[laneKey] = isLaneDraftDirty(laneKey, draft, baseline, lanePreview, laneOptions);
    }

    return Object.freeze({
      activeLane: safeActiveLane,
      laneDrafts: Object.freeze(coordinatedDrafts),
      baselines: Object.freeze(baselines),
      laneDirty: Object.freeze(laneDirty),
      activeLaneDraft: coordinatedDrafts[safeActiveLane],
      isActiveLaneDirty: laneDirty[safeActiveLane] === true
    });
  }

  function updateLaneDraftField(laneDrafts = {}, laneKey, field, value, previewState = {}, options = {}) {
    const safeLaneKey = toLaneKey(laneKey);
    const allowed = new Set(LANE_ALLOWED_FIELDS[safeLaneKey] ?? []);
    if (!allowed.has(field)) return laneDrafts;

    const currentLaneDraft = laneDrafts?.[safeLaneKey] ?? {};
    const nextLaneDraft = normalizeLaneDraft(
      safeLaneKey,
      { ...currentLaneDraft, [field]: value },
      previewState?.surfaces?.[safeLaneKey]?.preview ?? {},
      options
    );

    return Object.freeze({
      ...laneDrafts,
      [safeLaneKey]: nextLaneDraft
    });
  }

  function resetLaneDraft(laneDrafts = {}, laneKey, previewState = {}, options = {}) {
    const safeLaneKey = toLaneKey(laneKey);
    const lanePreview = previewState?.surfaces?.[safeLaneKey]?.preview ?? {};
    const resetDraft = buildLaneDefaultDraft(safeLaneKey, lanePreview, options);

    return Object.freeze({
      ...laneDrafts,
      [safeLaneKey]: resetDraft
    });
  }

  globalThis.SWF.laneDraftState = {
    LANE_KEYS,
    LANE_ALLOWED_FIELDS,
    buildLaneDefaultDraft,
    normalizeLaneDraft,
    isLaneDraftDirty,
    buildLaneDraftCoordination,
    updateLaneDraftField,
    resetLaneDraft
  };
})();
