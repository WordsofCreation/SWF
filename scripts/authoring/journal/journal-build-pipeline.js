/**
 * Journal build pipeline helpers.
 *
 * Scope: one explicit, Journal-only staging model for draft shaping and creation gating.
 */
(() => {
  const {
    journalSummaryDetailsFraming,
    journalReferencePresentation,
    journalSectionStructure,
    journalValidation
  } = globalThis.SWF;

  function toNonEmptyString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function toReferencesArray(linkedReferences) {
    return Array.isArray(linkedReferences) ? linkedReferences : [];
  }

  function buildJournalShapingStageFromPreview(journalPreview = {}, options = {}) {
    const normalizedPreview = journalPreview ?? {};
    const summaryDetailsFrame = journalSummaryDetailsFraming.buildSummaryDetailsFrameFromPreview(normalizedPreview);
    const referenceBlock = journalReferencePresentation.mapSharedReferencesToJournalReferenceBlock(
      normalizedPreview.linkedReferences,
      {
        presetKey: normalizedPreview?.preset?.referenceEmphasisKey ?? normalizedPreview?.preset?.key,
        targetPageName: normalizedPreview?.preset?.referencePageName || "Deferred References",
        title: normalizedPreview?.preset?.referenceBlockTitle,
        summary: normalizedPreview?.preset?.referenceBlockSummary
      }
    );
    const referenceInclusionMode = options?.referenceInclusionMode === "surfaced" ? "surfaced" : "linked";
    const linkedReferenceCount = toReferencesArray(normalizedPreview.linkedReferences).length;
    const hasReferenceContent =
      referenceInclusionMode === "surfaced" ? referenceBlock.surfacedCount > 0 : linkedReferenceCount > 0;
    const sectionPlan = journalSectionStructure.buildJournalSectionPlanFromPreview(normalizedPreview, {
      hasDetailsContent: (summaryDetailsFrame?.detailCount ?? 0) > 0,
      hasReferenceContent
    });

    return Object.freeze({
      summaryDetailsFrame,
      referenceBlock,
      sectionPlan,
      hasDetailsContent: (summaryDetailsFrame?.detailCount ?? 0) > 0,
      hasReferenceContent,
      referenceInclusionMode
    });
  }

  function buildJournalBuildPipelineFromPreview(journalPreview = {}, options = {}) {
    const normalizedPreview = journalPreview ?? {};
    const shaping = buildJournalShapingStageFromPreview(normalizedPreview, options);
    const validation = journalValidation.validateJournalPreviewForCreate(normalizedPreview);

    return Object.freeze({
      preset: Object.freeze({
        key: toNonEmptyString(normalizedPreview?.preset?.key),
        label: toNonEmptyString(normalizedPreview?.preset?.label)
      }),
      authoring: Object.freeze({
        name: toNonEmptyString(normalizedPreview?.name),
        summary: toNonEmptyString(normalizedPreview?.summary),
        notesCount: Array.isArray(normalizedPreview?.notes) ? normalizedPreview.notes.length : 0,
        linkedReferenceCount: toReferencesArray(normalizedPreview?.linkedReferences).length
      }),
      shaping,
      validation
    });
  }

  globalThis.SWF.journalBuildPipeline = {
    buildJournalShapingStageFromPreview,
    buildJournalBuildPipelineFromPreview,
    INTERNALS: {
      toNonEmptyString,
      toReferencesArray
    }
  };
})();
