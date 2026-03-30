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
    rows.push({
      key: "preset",
      preview: previewPresetKey || "(default)",
      requested: requestedPresetKey || "(default)",
      actual: requestedPresetKey || "not inspected",
      status: requestedPresetKey ? "materialized" : "deferred-inspection"
    });

    const previewNotesCount = toArray(preview?.notes).length;
    rows.push({
      key: "notes",
      preview: `${previewNotesCount} note(s) in preview`,
      requested: previewNotesCount > 0 ? "mapped into preset-defined details page content" : "no details page requested",
      actual: "not compared at field level",
      status: "deferred-inspection"
    });

    const previewReferenceCount = toArray(preview?.linkedReferences).length;
    rows.push({
      key: "linkedReferences",
      preview: `${previewReferenceCount} preview reference(s)`,
      requested: "mapped into a structured References (Deferred) text page when references are present",
      actual: "document links intentionally not created",
      status: "deferred"
    });

    return rows;
  }

  function buildJournalPostCreateInspection({ preview = {}, result = {} } = {}) {
    const success = result?.ok === true;
    const entry = success ? result.entry ?? null : null;
    const createData = result?.createData ?? null;

    const deferredClusters = [
      "ownership defaults",
      "cross-document references (actor/item)",
      "embedded JournalEntry links"
    ];

    const materializedClusters = success
      ? ["name", "preset flag", "overview text page", "details text page when notes are present", "deferred references text page when references are present"]
      : [];

    const warnings = [];
    if (!success) {
      warnings.push(result?.errorMessage || "Journal creation did not complete.");
    }

    warnings.push("Inspection is conservative: page body text is not deep-diffed against preview fields.");

    const notes = [
      "This inspection reports one creation attempt from the current Journal preview state.",
      "Preview-only references remain descriptive text until explicit cross-document materialization is implemented."
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
      mapMaterializedFieldRows
    }
  };
})();
