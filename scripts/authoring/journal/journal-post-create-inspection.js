/**
 * Post-creation inspection model for the Journal builder lane.
 *
 * Scope: conservative GM-facing trust layer for one JournalEntry creation attempt.
 */
(() => {
  function toNonEmptyString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function toArray(values) {
    return Array.isArray(values) ? values.filter(Boolean) : [];
  }

  function getEntryPageCount(entry) {
    if (!entry) return null;
    if (typeof entry.pages?.size === "number") return entry.pages.size;
    if (Array.isArray(entry.pages)) return entry.pages.length;
    return null;
  }

  function getPagesArray(value) {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.contents)) return value.contents;
    if (typeof value?.toObject === "function") {
      const objectValue = value.toObject();
      if (Array.isArray(objectValue)) return objectValue;
    }
    return [];
  }

  function toPageStructureRows(pages) {
    return getPagesArray(pages).map((page, index) => {
      const pageName = toNonEmptyString(page?.name) || `Page ${index + 1}`;
      const pageType = toNonEmptyString(page?.type) || "unknown";
      return `${index + 1}. ${pageName} (${pageType})`;
    });
  }

  function toSectionStructureRows(sections) {
    return toArray(sections).map((section) => {
      const order = Number(section?.order) || 0;
      const label = toNonEmptyString(section?.label) || toNonEmptyString(section?.key) || "(section)";
      const pageName = toNonEmptyString(section?.pageName) || "(unnamed page)";
      const inclusion = section?.included ? "included" : "omitted";
      return `${order}. ${label} -> ${pageName} (${inclusion})`;
    });
  }

  function findPageByName(pages, targetName) {
    const normalizedTargetName = toNonEmptyString(targetName).toLowerCase();
    if (!normalizedTargetName) return null;

    return (
      getPagesArray(pages).find((page) => toNonEmptyString(page?.name).toLowerCase() === normalizedTargetName) ?? null
    );
  }

  function mapMaterializedFieldRows({ preview, createData, entry }) {
    const rows = [];

    const previewName = toNonEmptyString(preview?.name);
    const requestedName = toNonEmptyString(createData?.name);
    const createdName = toNonEmptyString(entry?.name);
    rows.push({
      key: "name",
      preview: previewName || "(empty)",
      requested: requestedName || "(defaulted)",
      actual: createdName || "(unknown)",
      status: createdName ? "materialized" : "unknown"
    });

    const previewSummary = toNonEmptyString(preview?.summary);
    const overviewPageName = toNonEmptyString(preview?.preset?.overviewPageName) || "Overview";
    const requestedOverviewPage = findPageByName(createData?.pages, overviewPageName);
    const requestedOverviewLength = toNonEmptyString(requestedOverviewPage?.text?.content).length;
    rows.push({
      key: "summary",
      preview: previewSummary || "(empty)",
      requested: requestedOverviewLength > 0 ? `${requestedOverviewLength} chars mapped into ${overviewPageName} page` : "summary defaulted",
      actual: typeof getEntryPageCount(entry) === "number" ? `captured via ${overviewPageName} text page` : "not inspected",
      status: requestedOverviewLength > 0 ? "materialized" : "unknown"
    });

    const requestedSectionRows = toSectionStructureRows(createData?.flags?.[globalThis.SWF?.MODULE_ID]?.journalSectionPlan);
    rows.push({
      key: "preset section structure",
      preview: toNonEmptyString(preview?.preset?.key) || "(default)",
      requested:
        requestedSectionRows.length > 0
          ? requestedSectionRows.join("; ")
          : "no explicit section structure captured",
      actual: requestedSectionRows.length > 0 ? "captured in module flag payload" : "not inspected",
      status: requestedSectionRows.length > 0 ? "materialized" : "deferred-inspection"
    });

    const requestedPageRows = toPageStructureRows(createData?.pages);
    const requestedPages = requestedPageRows.length;
    const createdPageCount = getEntryPageCount(entry);
    const actualPageRows = toPageStructureRows(entry?.pages);
    const actualPagesLabel = actualPageRows.length > 0 ? actualPageRows.join("; ") : "not inspected";
    rows.push({
      key: "pages",
      preview: previewSummary ? "summary text prepared" : "summary defaulted",
      requested:
        requestedPages > 0
          ? `${requestedPages} page(s) requested: ${requestedPageRows.join("; ")}`
          : "0 page(s) requested",
      actual:
        typeof createdPageCount === "number"
          ? `${createdPageCount} page(s) present: ${actualPagesLabel}`
          : "not inspected",
      status: typeof createdPageCount === "number" ? "materialized" : "unknown"
    });

    const previewPresetKey = toNonEmptyString(preview?.preset?.key);
    const requestedPresetKey = toNonEmptyString(createData?.flags?.[globalThis.SWF?.MODULE_ID]?.journalPresetKey);
    const previewPresetLabel = toNonEmptyString(preview?.preset?.label);
    const requestedPresetLabel = toNonEmptyString(createData?.flags?.[globalThis.SWF?.MODULE_ID]?.journalPresetLabel);
    rows.push({
      key: "preset",
      preview: previewPresetKey ? `${previewPresetKey}${previewPresetLabel ? ` (${previewPresetLabel})` : ""}` : "(default)",
      requested: requestedPresetKey
        ? `${requestedPresetKey}${requestedPresetLabel ? ` (${requestedPresetLabel})` : ""}`
        : "(default)",
      actual: requestedPresetKey ? "captured in module flag payload" : "not inspected",
      status: requestedPresetKey ? "materialized" : "deferred-inspection"
    });

    const requestedFrame = createData?.flags?.[globalThis.SWF?.MODULE_ID]?.journalSummaryDetailsFrame;
    rows.push({
      key: "summary/details frame",
      preview: `summary label=${toNonEmptyString(preview?.summary) ? "set" : "defaulted"}; details rows=${toArray(preview?.notes).length}`,
      requested: requestedFrame
        ? `labels captured (summary=${toNonEmptyString(requestedFrame?.summaryLabel) || "Summary"}, identity=${toNonEmptyString(requestedFrame?.identityLabel) || "Journal Identity"}, details=${toNonEmptyString(requestedFrame?.detailsLabel) || "Core Details"})`
        : "no explicit frame labels captured",
      actual: requestedFrame ? "captured in module flag payload" : "not inspected",
      status: requestedFrame ? "materialized" : "deferred-inspection"
    });

    const previewNotesCount = toArray(preview?.notes).length;
    const detailsPageName = toNonEmptyString(preview?.preset?.detailsPageName) || "Details";
    const detailsPageRequested = Boolean(findPageByName(createData?.pages, detailsPageName));
    rows.push({
      key: "notes/details",
      preview: `${previewNotesCount} note(s) in preview`,
      requested: detailsPageRequested ? `details page requested (${detailsPageName})` : "no details page requested",
      actual: detailsPageRequested ? "details captured in text page (line-level diff deferred)" : "none requested",
      status: detailsPageRequested ? "materialized" : "deferred-inspection"
    });

    const previewReferenceCount = toArray(preview?.linkedReferences).length;
    const requestedReferenceEmphasis = createData?.flags?.[globalThis.SWF?.MODULE_ID]?.journalReferenceEmphasis;
    rows.push({
      key: "linkedReferences",
      preview: `${previewReferenceCount} preview reference(s)`,
      requested: requestedReferenceEmphasis
        ? `mapped into a structured References (Deferred) text page when references are present; emphasis=${toNonEmptyString(requestedReferenceEmphasis?.presetKey) || "(default)"}; primary=${toNonEmptyString(requestedReferenceEmphasis?.primaryGroupLabel) || "Primary References"}`
        : "mapped into a structured References (Deferred) text page when references are present",
      actual: "document links intentionally not created",
      status: "deferred"
    });

    return rows;
  }

  function buildJournalPostCreateInspection({ preview = {}, result = {}, draftState = {} } = {}) {
    const success = result?.ok === true;
    const entry = success ? result.entry ?? null : null;
    const createData = result?.createData ?? null;
    const validation = result?.validation ?? null;

    const deferredClusters = [
      "ownership defaults",
      "cross-document references (actor/item)",
      "embedded JournalEntry links"
    ];

    const materializedClusters = success
      ? ["name", "preset flag", "preset section structure", "summary/details frame labels", "reference emphasis labels", "overview text page", "details text page when notes are present", "deferred references text page when references are present"]
      : [];

    const warnings = [];
    if (!success) {
      warnings.push(result?.errorMessage || "Journal creation did not complete.");
    }
    if (validation && !validation.ok) {
      warnings.push(...toArray(validation.errors));
    }
    if (validation?.ok && Array.isArray(validation.warnings) && validation.warnings.length > 0) {
      warnings.push(...validation.warnings);
    }

    warnings.push("Inspection is conservative: page body text is not deep-diffed against preview fields.");

    const notes = [
      "This inspection reports one creation attempt from the current Journal preview state.",
      "Preview-only references remain descriptive text until explicit cross-document materialization is implemented.",
      draftState?.isDirty
        ? "Creation attempt used a modified draft relative to the selected preset defaults."
        : "Creation attempt used preset-derived draft defaults (clean draft state)."
    ];

    return {
      status: {
        ok: success,
        label: success ? "Creation succeeded" : "Creation failed",
        message: success
          ? result?.statusMessage || "Journal entry created."
          : result?.errorMessage || "Journal entry creation failed."
      },
      createdJournal: success
        ? {
            id: toNonEmptyString(entry?.id) || "(unknown)",
            name: toNonEmptyString(entry?.name) || toNonEmptyString(createData?.name) || "(unnamed)",
            uuid: toNonEmptyString(entry?.uuid) || ""
          }
        : null,
      materializedClusters,
      deferredClusters,
      fieldMapping: mapMaterializedFieldRows({ preview, createData, entry }),
      validation: validation
        ? {
            ok: validation.ok === true,
            label: validation?.status?.label ?? (validation.ok ? "Ready" : "Blocked"),
            summary: validation?.status?.summary ?? "",
            errors: toArray(validation.errors),
            warnings: toArray(validation.warnings)
          }
        : null,
      warnings,
      notes
    };
  }

  globalThis.SWF.journalPostCreateInspection = {
    buildJournalPostCreateInspection,
    INTERNALS: {
      toArray,
      toNonEmptyString,
      getEntryPageCount,
      getPagesArray,
      toPageStructureRows,
      toSectionStructureRows,
      mapMaterializedFieldRows,
      findPageByName
    }
  };
})();
