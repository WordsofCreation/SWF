/**
 * Journal materialization helpers.
 *
 * Scope: first controlled world-document creation path for JournalEntry only.
 */
(() => {
  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function toNonEmptyString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function toDeferredReferenceLines(linkedReferences = []) {
    if (!Array.isArray(linkedReferences) || linkedReferences.length === 0) return [];

    return linkedReferences
      .map((reference) => {
        const kind = toNonEmptyString(reference?.kind) || "reference";
        const label = toNonEmptyString(reference?.label) || "(unnamed)";
        const status = toNonEmptyString(reference?.status) || "deferred";
        const note = toNonEmptyString(reference?.provisionalNote) || "Materialization deferred for safety.";
        return `<li><strong>${escapeHtml(kind)}:</strong> ${escapeHtml(label)} (${escapeHtml(status)}) — ${escapeHtml(note)}</li>`;
      })
      .filter(Boolean);
  }

  function buildJournalEntryCreateDataFromPreview(journalPreview = {}) {
    const name = toNonEmptyString(journalPreview.name) || "SWF Journal Draft";
    const summary = toNonEmptyString(journalPreview.summary) || "No summary provided.";
    const notes = Array.isArray(journalPreview.notes)
      ? journalPreview.notes.map((note) => toNonEmptyString(note)).filter(Boolean)
      : [];
    const deferredReferenceLines = toDeferredReferenceLines(journalPreview.linkedReferences);

    const pageBody = [
      `<p>${escapeHtml(summary)}</p>`,
      notes.length > 0
        ? `<h2>Preview Notes</h2><ul>${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>`
        : "",
      deferredReferenceLines.length > 0
        ? `<h2>Deferred References</h2><p>These references remain preview-only in this slice.</p><ul>${deferredReferenceLines.join("")}</ul>`
        : ""
    ]
      .filter(Boolean)
      .join("\n");

    const format = CONST?.JOURNAL_ENTRY_PAGE_FORMATS?.HTML ?? 1;

    return {
      name,
      pages: [
        {
          name: "Overview",
          type: "text",
          text: {
            format,
            content: pageBody
          }
        }
      ]
    };
  }

  async function materializeJournalPreviewAsWorldEntry(journalPreview = {}, options = {}) {
    if (!game.user?.isGM) {
      return {
        ok: false,
        reason: "gm-only",
        errorMessage: "Only a GM can create Journal entries from the SWF builder."
      };
    }

    if (typeof JournalEntry?.create !== "function") {
      return {
        ok: false,
        reason: "missing-api",
        errorMessage: "JournalEntry.create is not available in this Foundry environment."
      };
    }

    try {
      const createData = buildJournalEntryCreateDataFromPreview(journalPreview);
      const entry = await JournalEntry.create(createData, {
        renderSheet: options.renderSheet ?? true
      });

      return {
        ok: true,
        entry,
        createData,
        statusMessage: `Created Journal entry: ${entry?.name ?? createData.name}`
      };
    } catch (error) {
      return {
        ok: false,
        reason: "create-failed",
        error,
        errorMessage: `Failed to create Journal entry: ${error?.message ?? "Unknown error"}`
      };
    }
  }

  globalThis.SWF.journalMaterialization = {
    buildJournalEntryCreateDataFromPreview,
    materializeJournalPreviewAsWorldEntry,
    INTERNALS: {
      toDeferredReferenceLines,
      escapeHtml,
      toNonEmptyString
    }
  };
})();
