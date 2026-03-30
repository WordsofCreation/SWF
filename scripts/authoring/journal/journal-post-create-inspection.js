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
    const requestedPages = Array.isArray(createData?.pages) ? createData.pages.length : 0;
    const createdPageCount = getEntryPageCount(entry);
    rows.push({
      key: "pages",
      preview: previewSummary ? "summary text prepared" : "summary defaulted",
      requested: `${requestedPages} page(s) requested`,
      actual: typeof createdPageCount === "number" ? `${createdPageCount} page(s) present` : "not inspected",
      status: typeof createdPageCount === "number" ? "materialized" : "unknown"
    });

    const previewNotesCount = toArray(preview?.notes).length;
    rows.push({
      key: "notes",
      preview: `${previewNotesCount} note(s) in preview`,
      requested: "embedded into overview page content",
      actual: "not compared at field level",
      status: "deferred-inspection"
    });

    const previewReferenceCount = toArray(preview?.linkedReferences).length;
    rows.push({
      key: "linkedReferences",
      preview: `${previewReferenceCount} preview reference(s)`,
      requested: "listed as deferred references in page content",
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
      ? ["name", "single overview text page", "preview notes in overview page", "deferred reference summary text"]
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
      mapMaterializedFieldRows
    }
  };
})();
