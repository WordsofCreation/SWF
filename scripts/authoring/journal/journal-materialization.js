/**
 * Journal materialization helpers.
 *
 * Scope: first controlled world-document creation path for JournalEntry only.
 */
(() => {
  const { MODULE_ID, journalReferencePresentation } = globalThis.SWF;

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

  function buildOverviewPageContent(summary) {
    return `<h2>Summary</h2><p>${escapeHtml(summary)}</p>`;
  }

  function buildStructuredReferenceHtml(referenceBlock) {
    if (!referenceBlock || referenceBlock.surfacedCount === 0) return "";

    const sectionHtml = referenceBlock.sections
      .filter((section) => section.count > 0)
      .map((section) => {
        const rows = section.entries
          .map((entry) => {
            const roleSegment = entry.role ? ` · role: ${escapeHtml(entry.role)}` : "";
            return `<li><strong>${escapeHtml(entry.label)}</strong>${roleSegment} · status: ${escapeHtml(entry.status)} · ${escapeHtml(entry.note)}</li>`;
          })
          .join("");
        return `<h3>${escapeHtml(section.label)}</h3><ul>${rows}</ul>`;
      })
      .join("\n");

    return [
      `<h2>${escapeHtml(referenceBlock.title)} (${escapeHtml(referenceBlock.statusLabel)})</h2>`,
      `<p>${escapeHtml(referenceBlock.summary)}</p>`,
      `<p><strong>Target page:</strong> ${escapeHtml(referenceBlock.targetPageName)}</p>`,
      sectionHtml,
      "<p>Future cross-document links are intentionally deferred.</p>"
    ]
      .filter(Boolean)
      .join("\n");
  }

  function buildDetailsPageContent({ notes }) {
    return notes.length > 0
      ? `<h2>Preview Notes</h2><ul>${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>`
      : "";
  }

  function buildJournalEntryCreateDataFromPreview(journalPreview = {}) {
    const name = toNonEmptyString(journalPreview.name) || "SWF Journal Draft";
    const summary = toNonEmptyString(journalPreview.summary) || "No summary provided.";
    const notes = Array.isArray(journalPreview.notes)
      ? journalPreview.notes.map((note) => toNonEmptyString(note)).filter(Boolean)
      : [];

    const presetKey = toNonEmptyString(journalPreview?.preset?.key) || "lore-entry";
    const overviewPageName = toNonEmptyString(journalPreview?.preset?.overviewPageName) || "Overview";
    const detailsPageName = toNonEmptyString(journalPreview?.preset?.detailsPageName) || "Details";
    const referencePageName = toNonEmptyString(journalPreview?.preset?.referencePageName) || "Deferred References";

    const referenceBlock = journalReferencePresentation.mapSharedReferencesToJournalReferenceBlock(
      journalPreview.linkedReferences,
      { targetPageName: detailsPageName }
    );
    const referenceBlockHtml = buildStructuredReferenceHtml(referenceBlock);

    const format = CONST?.JOURNAL_ENTRY_PAGE_FORMATS?.HTML ?? 1;
    const overviewPageContent = buildOverviewPageContent(summary);
    const detailsPageContent = buildDetailsPageContent({ notes });
    const pages = [
      {
        name: overviewPageName,
        type: "text",
        text: {
          format,
          content: overviewPageContent
        }
      }
    ];

    if (detailsPageContent) {
      pages.push({
        name: detailsPageName,
        type: "text",
        text: {
          format,
          content: detailsPageContent
        }
      });
    }

    if (referenceBlockHtml) {
      pages.push({
        name: referencePageName,
        type: "text",
        text: {
          format,
          content: referenceBlockHtml
        }
      });
    }

    return {
      name,
      pages,
      flags: {
        [MODULE_ID]: {
          journalPresetKey: presetKey
        }
      }
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
      buildStructuredReferenceHtml,
      escapeHtml,
      toNonEmptyString
    }
  };
})();
