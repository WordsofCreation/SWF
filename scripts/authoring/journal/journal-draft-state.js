/**
 * Journal draft state helpers for tiny in-memory editability.
 *
 * Scope: Journal lane only; no persistence, no document writes.
 */
(() => {
  const { journalPresetDefinitions } = globalThis.SWF;
  const { DEFAULT_JOURNAL_PRESET_KEY, applyJournalPresetToPreview } = journalPresetDefinitions;

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

    return {
      selectedPresetKey: presetPreview?.preset?.key ?? DEFAULT_JOURNAL_PRESET_KEY,
      name: toNonEmptyString(presetPreview?.name),
      summary: toNonEmptyString(presetPreview?.summary),
      notesText: toNotesText(presetPreview?.notes)
    };
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
    applyJournalDraftToPreview,
    updateDraftField,
    INTERNALS: {
      toNonEmptyString,
      toNotesArray,
      toNotesText
    }
  };
})();
