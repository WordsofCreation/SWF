/**
 * Journal draft state helpers for tiny in-memory editability.
 *
 * Scope: Journal lane only; no persistence, no document writes.
 */
(() => {
  const { journalPresetDefinitions } = globalThis.SWF;
  const { DEFAULT_JOURNAL_PRESET_KEY, applyJournalPresetToPreview } = journalPresetDefinitions;
  const JOURNAL_DIRTY_FIELDS = Object.freeze(["name", "summary", "notesText"]);

  function toNonEmptyString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function toNotesText(notes) {
    if (!Array.isArray(notes)) return "";
    return notes
      .map((note) => toNonEmptyString(note))
      .filter(Boolean)
      .join("\n");
  }

  function toNotesArray(notesText) {
    if (typeof notesText !== "string") return [];
    return notesText
      .split(/\r?\n/u)
      .map((line) => toNonEmptyString(line))
      .filter(Boolean);
  }

  function createJournalDraftFromPreset(journalPreview = {}, presetKey = DEFAULT_JOURNAL_PRESET_KEY) {
    const presetPreview = applyJournalPresetToPreview(journalPreview, presetKey);
    return buildJournalPresetDefaultDraft(presetPreview);
  }

  function buildJournalPresetDefaultDraft(journalPreview = {}) {
    return {
      selectedPresetKey: journalPreview?.preset?.key ?? DEFAULT_JOURNAL_PRESET_KEY,
      name: toNonEmptyString(journalPreview?.name),
      summary: toNonEmptyString(journalPreview?.summary),
      notesText: toNotesText(journalPreview?.notes)
    };
  }

  function normalizeDraftForDirtyComparison(draft = {}) {
    return {
      selectedPresetKey: toNonEmptyString(draft?.selectedPresetKey) || DEFAULT_JOURNAL_PRESET_KEY,
      name: toNonEmptyString(draft?.name),
      summary: toNonEmptyString(draft?.summary),
      notesText: toNotesText(toNotesArray(draft?.notesText))
    };
  }

  function isJournalDraftDirty(currentDraft = {}, presetDefaultDraft = {}) {
    const normalizedCurrent = normalizeDraftForDirtyComparison(currentDraft);
    const normalizedPresetDefaults = normalizeDraftForDirtyComparison({
      ...presetDefaultDraft,
      selectedPresetKey: normalizedCurrent.selectedPresetKey
    });

    return JOURNAL_DIRTY_FIELDS.some((field) => normalizedCurrent[field] !== normalizedPresetDefaults[field]);
  }

  function applyJournalDraftToPreview(journalPreview = {}, draft = {}) {
    const selectedPresetKey = toNonEmptyString(draft?.selectedPresetKey) || DEFAULT_JOURNAL_PRESET_KEY;
    const presetPreview = applyJournalPresetToPreview(journalPreview, selectedPresetKey);

    const presetName = toNonEmptyString(presetPreview?.name);
    const presetSummary = toNonEmptyString(presetPreview?.summary);
    const name = toNonEmptyString(draft?.name) || presetName;
    const summary = toNonEmptyString(draft?.summary) || presetSummary;
    const notes = toNotesArray(draft?.notesText);

    return Object.freeze({
      ...presetPreview,
      name,
      summary,
      notes: Object.freeze(notes)
    });
  }

  function updateDraftField(draft = {}, field, value) {
    if (!["name", "summary", "notesText"].includes(field)) return draft;
    return {
      ...draft,
      [field]: typeof value === "string" ? value : ""
    };
  }

  globalThis.SWF.journalDraftState = {
    createJournalDraftFromPreset,
    buildJournalPresetDefaultDraft,
    isJournalDraftDirty,
    applyJournalDraftToPreview,
    updateDraftField,
    INTERNALS: {
      JOURNAL_DIRTY_FIELDS,
      toNonEmptyString,
      toNotesArray,
      toNotesText,
      normalizeDraftForDirtyComparison
    }
  };
})();
