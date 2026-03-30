/**
 * Tiny Journal-lane validation for conservative JournalEntry creation gating.
 *
 * Scope: Journal only, in-memory only, no persistence.
 */
(() => {
  const { journalPresetDefinitions } = globalThis.SWF;

  function toNonEmptyString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function toNotesArray(notes) {
    if (!Array.isArray(notes)) return [];
    return notes.map((note) => toNonEmptyString(note)).filter(Boolean);
  }

  function hasPresetKey(presetKey) {
    return journalPresetDefinitions.getJournalPresets().some((preset) => preset.key === presetKey);
  }

  function buildValidationResult({ errors, warnings }) {
    const ok = errors.length === 0;
    const status = ok
      ? warnings.length > 0
        ? {
            label: "Ready with Warnings",
            summary: "Draft passes required checks. Review warnings before creation."
          }
        : {
            label: "Ready",
            summary: "Draft passes required checks for controlled Journal creation."
          }
      : {
          label: "Blocked",
          summary: "Draft has required-field errors. Fix errors before Journal creation."
        };

    return Object.freeze({
      ok,
      status: Object.freeze(status),
      errors: Object.freeze(errors),
      warnings: Object.freeze(warnings)
    });
  }

  function validateJournalPreviewForCreate(journalPreview = {}) {
    const errors = [];
    const warnings = [];

    const name = toNonEmptyString(journalPreview.name);
    if (!name) errors.push("Name is required.");

    const summary = toNonEmptyString(journalPreview.summary);
    if (!summary) errors.push("Summary is required.");

    const presetKey = toNonEmptyString(journalPreview?.preset?.key);
    if (!presetKey) errors.push("Preset key is required.");
    else if (!hasPresetKey(presetKey)) errors.push(`Preset key is unknown: ${presetKey}`);

    if (summary) {
      const overviewPageName = toNonEmptyString(journalPreview?.preset?.overviewPageName) || "Overview";
      warnings.push(`Overview page intent will use "${overviewPageName}" with summary text.`);
    }

    const normalizedNotes = toNotesArray(journalPreview.notes);
    if (normalizedNotes.length === 0) warnings.push("No details notes are present; details page will be skipped.");

    return buildValidationResult({ errors, warnings });
  }

  globalThis.SWF.journalValidation = {
    validateJournalPreviewForCreate,
    INTERNALS: {
      toNonEmptyString,
      toNotesArray,
      hasPresetKey
    }
  };
})();
