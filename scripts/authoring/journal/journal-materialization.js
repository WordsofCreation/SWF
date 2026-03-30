/**
 * Journal materialization helpers.
 *
 * Scope: first controlled world-document creation path for JournalEntry only.
 */
(() => {
  const { MODULE_ID, journalReferencePresentation, journalSummaryDetailsFraming } = globalThis.SWF;

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

  function buildOverviewPageContent(summaryDetailsFrame) {
    const title = toNonEmptyString(summaryDetailsFrame?.summaryLabel) || "Summary";
    const identityLabel = toNonEmptyString(summaryDetailsFrame?.identityLabel) || "Journal Identity";
    const identityValue = toNonEmptyString(summaryDetailsFrame?.identityValue) || "(unnamed journal draft)";
    const summaryValue = toNonEmptyString(summaryDetailsFrame?.summaryValue) || "No summary provided.";

    return [
      `<h2>${escapeHtml(title)}</h2>`,
      `<p>${escapeHtml(summaryValue)}</p>`,
      `<p><strong>${escapeHtml(identityLabel)}:</strong> ${escapeHtml(identityValue)}</p>`
    ].join("\n");
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

  function buildDetailsPageContent(summaryDetailsFrame) {
    const detailsLabel = toNonEmptyString(summaryDetailsFrame?.detailsLabel) || "Core Details";
    const detailRows = Array.isArray(summaryDetailsFrame?.detailRows) ? summaryDetailsFrame.detailRows : [];

    if (detailRows.length === 0) return "";

    const rowsHtml = detailRows
      .map((row) => {
        const rowLabel = toNonEmptyString(row?.label);
        const rowValue = toNonEmptyString(row?.value);
        if (!rowLabel && !rowValue) return "";
        if (!rowLabel) return `<li>${escapeHtml(rowValue)}</li>`;
        return `<li><strong>${escapeHtml(rowLabel)}:</strong> ${escapeHtml(rowValue)}</li>`;
      })
      .filter(Boolean)
      .join("");

    if (!rowsHtml) return "";

    return `<h2>${escapeHtml(detailsLabel)}</h2><ul>${rowsHtml}</ul>`;
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
    const referenceBlockTitle = toNonEmptyString(journalPreview?.preset?.referenceBlockTitle);
    const referenceBlockSummary = toNonEmptyString(journalPreview?.preset?.referenceBlockSummary);

    const summaryDetailsFrame = journalSummaryDetailsFraming.buildSummaryDetailsFrameFromPreview({
      ...journalPreview,
      name,
      summary,
      notes
    });

    const referenceBlock = journalReferencePresentation.mapSharedReferencesToJournalReferenceBlock(
      journalPreview.linkedReferences,
      {
        targetPageName: referencePageName,
        title: referenceBlockTitle,
        summary: referenceBlockSummary
      }
    );
    const referenceBlockHtml = buildStructuredReferenceHtml(referenceBlock);

    const format = CONST?.JOURNAL_ENTRY_PAGE_FORMATS?.HTML ?? 1;
    const overviewPageContent = buildOverviewPageContent(summaryDetailsFrame);
    const detailsPageContent = buildDetailsPageContent(summaryDetailsFrame);
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
          journalPresetKey: presetKey,
          journalPresetLabel: toNonEmptyString(journalPreview?.preset?.label) || "",
          journalSummaryDetailsFrame: {
            identityLabel: toNonEmptyString(summaryDetailsFrame?.identityLabel),
            summaryLabel: toNonEmptyString(summaryDetailsFrame?.summaryLabel),
            detailsLabel: toNonEmptyString(summaryDetailsFrame?.detailsLabel)
          }
        }
      }
    };
  }

  function buildJournalCreateIntentSummaryFromPreview(journalPreview = {}) {
    const createData = buildJournalEntryCreateDataFromPreview(journalPreview);
    const presetKey = toNonEmptyString(journalPreview?.preset?.key) || "lore-entry";
    const presetLabel = toNonEmptyString(journalPreview?.preset?.label) || "(unlabeled preset)";
    const detailsPageName = toNonEmptyString(journalPreview?.preset?.detailsPageName) || "Details";
    const referencePageName = toNonEmptyString(journalPreview?.preset?.referencePageName) || "Deferred References";
    const pageRows = Array.isArray(createData.pages)
      ? createData.pages.map((page, index) => {
          const pageName = toNonEmptyString(page?.name) || `Page ${index + 1}`;
          const pageType = toNonEmptyString(page?.type) || "unknown";
          return {
            index: index + 1,
            name: pageName,
            type: pageType
          };
        })
      : [];
    const pageNames = pageRows.map((row) => row.name);

    return Object.freeze({
      presetKey,
      presetLabel,
      name: toNonEmptyString(createData.name),
      pageCount: pageRows.length,
      summaryDetailsFrame: Object.freeze({
        title: toNonEmptyString(createData?.flags?.[MODULE_ID]?.journalSummaryDetailsFrame?.summaryLabel) || "Summary",
        identityLabel: toNonEmptyString(createData?.flags?.[MODULE_ID]?.journalSummaryDetailsFrame?.identityLabel) || "Journal Identity",
        detailsLabel: toNonEmptyString(createData?.flags?.[MODULE_ID]?.journalSummaryDetailsFrame?.detailsLabel) || "Core Details"
      }),
      pageRows: Object.freeze(pageRows),
      pageNames: Object.freeze(pageNames),
      includesDetailsPage: pageNames.includes(detailsPageName),
      includesDeferredReferencesPage: pageNames.includes(referencePageName),
      hasDetailsContent: pageNames.includes(detailsPageName),
      hasDeferredReferenceContent: pageNames.includes(referencePageName),
      notes: Object.freeze([
        "Summary values are derived from the same normalized JournalEntry create payload used by Create Journal Entry.",
        "Deferred references are rendered as descriptive text only; cross-document links remain out of scope."
      ])
    });
  }

  function validateJournalPreview(journalPreview = {}) {
    if (typeof globalThis.SWF?.journalValidation?.validateJournalPreviewForCreate === "function") {
      return globalThis.SWF.journalValidation.validateJournalPreviewForCreate(journalPreview);
    }

    return {
      ok: true,
      status: {
        label: "Ready",
        summary: "Validation module unavailable; using permissive fallback for this environment."
      },
      errors: [],
      warnings: ["Journal validation module was unavailable during create attempt; checks were deferred."]
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

    const validation = validateJournalPreview(journalPreview);
    if (!validation.ok) {
      return {
        ok: false,
        reason: "validation-failed",
        validation,
        errorMessage: "Journal draft failed validation. Fix errors before creating."
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
        validation,
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
    buildJournalCreateIntentSummaryFromPreview,
    materializeJournalPreviewAsWorldEntry,
    INTERNALS: {
      buildOverviewPageContent,
      buildDetailsPageContent,
      buildStructuredReferenceHtml,
      escapeHtml,
      toNonEmptyString,
      validateJournalPreview
    }
  };
})();
