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

  function buildOverviewPageContent(summary) {
    return [`<h1>Summary</h1>`, `<p>${escapeHtml(summary)}</p>`].join("\n");
  }

  function buildDetailsPageContent(notes) {
    if (!Array.isArray(notes) || notes.length === 0) return "";

    return [
      `<h1>Details</h1>`,
      `<p>These notes are carried from the Journal preview model.</p>`,
      `<ul>${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>`
    ].join("\n");
  }

  function buildDeferredReferencesPageContent(deferredReferenceLines) {
    if (!Array.isArray(deferredReferenceLines) || deferredReferenceLines.length === 0) return "";

    return [
      `<h1>Deferred References</h1>`,
      `<p>These references remain preview-only in this Journal materialization slice.</p>`,
      `<ul>${deferredReferenceLines.join("")}</ul>`
    ].join("\n");
  }

  function buildJournalEntryCreateDataFromPreview(journalPreview = {}) {
    const name = toNonEmptyString(journalPreview.name) || "SWF Journal Draft";
    const summary = toNonEmptyString(journalPreview.summary) || "No summary provided.";
    const notes = Array.isArray(journalPreview.notes)
      ? journalPreview.notes.map((note) => toNonEmptyString(note)).filter(Boolean)
      : [];
    const deferredReferenceLines = toDeferredReferenceLines(journalPreview.linkedReferences);

    const format = CONST?.JOURNAL_ENTRY_PAGE_FORMATS?.HTML ?? 1;
    const overviewPageContent = buildOverviewPageContent(summary);
    const detailsPageContent = buildDetailsPageContent(notes);
    const deferredReferencesPageContent = buildDeferredReferencesPageContent(deferredReferenceLines);
    const pages = [
      {
        name: "Overview",
        type: "text",
        text: {
          format,
          content: overviewPageContent
        }
      }
    ];

    if (detailsPageContent) {
      pages.push({
        name: "Details",
        type: "text",
        text: {
          format,
          content: detailsPageContent
        }
      });
    }

    if (deferredReferencesPageContent) {
      pages.push({
        name: "Deferred References",
        type: "text",
        text: {
          format,
          content: deferredReferencesPageContent
        }
      });
    }

    return {
      name,
      pages
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
      buildOverviewPageContent,
      buildDetailsPageContent,
      buildDeferredReferencesPageContent,
      toDeferredReferenceLines,
      escapeHtml,
      toNonEmptyString
    }
  };
})();
