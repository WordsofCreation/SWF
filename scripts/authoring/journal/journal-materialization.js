/**
 * Journal materialization helpers.
 *
 * Scope: first controlled world-document creation path for JournalEntry only.
 */
(() => {
  const { MODULE_ID, journalSectionStructure, journalBuildPipeline } = globalThis.SWF;

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

    const emphasisNote = toNonEmptyString(referenceBlock?.emphasis?.note);
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
      emphasisNote ? `<p><strong>Preset emphasis:</strong> ${escapeHtml(emphasisNote)}</p>` : "",
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

  function buildJournalMaterializationInputModelFromPreview(journalPreview = {}) {
    const name = toNonEmptyString(journalPreview?.name) || "SWF Journal Draft";
    const summary = toNonEmptyString(journalPreview?.summary) || "No summary provided.";
    const notes = Array.isArray(journalPreview?.notes)
      ? journalPreview.notes.map((note) => toNonEmptyString(note)).filter(Boolean)
      : [];
    const presetKey = toNonEmptyString(journalPreview?.preset?.key) || "lore-entry";
    const normalizedPreview = {
      ...journalPreview,
      name,
      summary,
      notes
    };
    const shapingStage = journalBuildPipeline.buildJournalShapingStageFromPreview(normalizedPreview, {
      referenceInclusionMode: "linked"
    });
    const summaryDetailsFrame = shapingStage.summaryDetailsFrame;
    const sectionPlan = shapingStage.sectionPlan;
    const referenceBlock = shapingStage.referenceBlock;

    return Object.freeze({
      name,
      summary,
      notes,
      presetKey,
      sectionPlan,
      summaryDetailsFrame,
      referenceBlock
    });
  }

  function buildJournalEntryCreateDataFromMaterializationInput(materializationInput = {}, journalPreview = {}) {
    const { name, presetKey, sectionPlan, summaryDetailsFrame, referenceBlock } = materializationInput;
    const referenceBlockHtml = buildStructuredReferenceHtml(referenceBlock);

    const format = CONST?.JOURNAL_ENTRY_PAGE_FORMATS?.HTML ?? 1;
    const overviewPageContent = buildOverviewPageContent(summaryDetailsFrame);
    const detailsPageContent = buildDetailsPageContent(summaryDetailsFrame);

    const contentBySectionKey = {
      [journalSectionStructure.SECTION_KEYS.OVERVIEW]: overviewPageContent,
      [journalSectionStructure.SECTION_KEYS.DETAILS]: detailsPageContent,
      [journalSectionStructure.SECTION_KEYS.REFERENCES]: referenceBlockHtml
    };

    const pages = sectionPlan
      .map((section) => {
        if (!section.included) return null;
        const content = toNonEmptyString(contentBySectionKey[section.key]);
        if (!content) return null;

        return {
          name: section.pageName,
          type: "text",
          text: {
            format,
            content
          }
        };
      })
      .filter(Boolean);

    return {
      name,
      pages,
      flags: {
        [MODULE_ID]: {
          journalPresetKey: presetKey,
          journalPresetLabel: toNonEmptyString(journalPreview?.preset?.label) || "",
          journalSectionPlan: sectionPlan.map((section) => ({
            key: section.key,
            order: section.order,
            label: section.label,
            pageName: section.pageName,
            included: section.included,
            conditional: section.conditional,
            intentNote: section.intentNote
          })),
          journalReferenceEmphasis: {
            presetKey: toNonEmptyString(referenceBlock?.emphasis?.presetKey),
            primaryGroupLabel: toNonEmptyString(referenceBlock?.emphasis?.primaryGroupLabel),
            secondaryGroupLabel: toNonEmptyString(referenceBlock?.emphasis?.secondaryGroupLabel),
            note: toNonEmptyString(referenceBlock?.emphasis?.note)
          },
          journalSummaryDetailsFrame: {
            identityLabel: toNonEmptyString(summaryDetailsFrame?.identityLabel),
            summaryLabel: toNonEmptyString(summaryDetailsFrame?.summaryLabel),
            detailsLabel: toNonEmptyString(summaryDetailsFrame?.detailsLabel)
          }
        }
      }
    };
  }

  function buildJournalMaterializationPipelineFromPreview(journalPreview = {}) {
    const materializationInput = buildJournalMaterializationInputModelFromPreview(journalPreview);
    const buildPipeline = journalBuildPipeline.buildJournalBuildPipelineFromPreview(
      {
        ...journalPreview,
        name: materializationInput.name,
        summary: materializationInput.summary,
        notes: materializationInput.notes
      },
      { referenceInclusionMode: "linked" }
    );
    const createData = buildJournalEntryCreateDataFromMaterializationInput(materializationInput, journalPreview);

    return Object.freeze({
      stages: Object.freeze({
        presetSelection: buildPipeline.preset,
        authoringModel: buildPipeline.authoring,
        previewShaping: buildPipeline.shaping,
        validation: buildPipeline.validation,
        materializationInput
      }),
      createData
    });
  }

  function buildJournalEntryCreateDataFromPreview(journalPreview = {}) {
    return buildJournalMaterializationPipelineFromPreview(journalPreview).createData;
  }

  function buildJournalCreateIntentSummaryFromPreview(journalPreview = {}) {
    const materializationPipeline = buildJournalMaterializationPipelineFromPreview(journalPreview);
    const createData = materializationPipeline.createData;
    const presetKey = toNonEmptyString(journalPreview?.preset?.key) || "lore-entry";
    const presetLabel = toNonEmptyString(journalPreview?.preset?.label) || "(unlabeled preset)";
    const fullSectionPlan = journalSectionStructure.buildJournalSectionPlanFromPreview(journalPreview, {
      hasDetailsContent: true,
      hasReferenceContent: true
    });
    const detailsSection = fullSectionPlan.find((section) => section.key === journalSectionStructure.SECTION_KEYS.DETAILS);
    const referenceSection = fullSectionPlan.find((section) => section.key === journalSectionStructure.SECTION_KEYS.REFERENCES);
    const detailsPageName = toNonEmptyString(detailsSection?.pageName) || "Details";
    const referencePageName = toNonEmptyString(referenceSection?.pageName) || "Deferred References";
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
      referenceEmphasis: Object.freeze({
        presetKey: toNonEmptyString(createData?.flags?.[MODULE_ID]?.journalReferenceEmphasis?.presetKey) || "(default)",
        primaryGroupLabel:
          toNonEmptyString(createData?.flags?.[MODULE_ID]?.journalReferenceEmphasis?.primaryGroupLabel) || "Primary References",
        secondaryGroupLabel:
          toNonEmptyString(createData?.flags?.[MODULE_ID]?.journalReferenceEmphasis?.secondaryGroupLabel) || "Secondary References",
        note: toNonEmptyString(createData?.flags?.[MODULE_ID]?.journalReferenceEmphasis?.note)
      }),
      sectionRows: Object.freeze(
        fullSectionPlan
          .map((section) =>
            Object.freeze({
              order: section.order,
              key: section.key,
              label: section.label,
              pageName: section.pageName,
              included: pageNames.includes(section.pageName),
              intentNote: section.intentNote
            })
          )
      ),
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
    if (typeof globalThis.SWF?.journalBuildPipeline?.buildJournalBuildPipelineFromPreview === "function") {
      return globalThis.SWF.journalBuildPipeline.buildJournalBuildPipelineFromPreview(journalPreview).validation;
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

    const materializationPipeline =
      options?.materializationPipeline ?? buildJournalMaterializationPipelineFromPreview(journalPreview);
    const validation = materializationPipeline?.stages?.validation ?? validateJournalPreview(journalPreview);
    if (!validation.ok) {
      return {
        ok: false,
        reason: "validation-failed",
        validation,
        errorMessage: "Journal draft failed validation. Fix errors before creating."
      };
    }

    try {
      const createData = materializationPipeline.createData;
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
    buildJournalMaterializationInputModelFromPreview,
    buildJournalMaterializationPipelineFromPreview,
    buildJournalEntryCreateDataFromPreview,
    buildJournalCreateIntentSummaryFromPreview,
    materializeJournalPreviewAsWorldEntry,
    INTERNALS: {
      buildJournalEntryCreateDataFromMaterializationInput,
      buildOverviewPageContent,
      buildDetailsPageContent,
      buildStructuredReferenceHtml,
      escapeHtml,
      toNonEmptyString,
      validateJournalPreview
    }
  };
})();
