/**
 * Journal-facing structured reference presentation.
 *
 * Scope: map shared reference models into one compact, page-aware, deferred block.
 */
(() => {
  const TARGET_REFERENCE_KINDS = Object.freeze(["actor", "item"]);

  function toNonEmptyString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function toTitleCase(value) {
    const normalized = toNonEmptyString(value);
    if (!normalized) return "";
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  function normalizeReferenceRow(reference) {
    const kind = toNonEmptyString(reference?.kind).toLowerCase();
    const label = toNonEmptyString(reference?.label) || "(unnamed)";

    return Object.freeze({
      kind,
      label,
      role: toNonEmptyString(reference?.role) || null,
      status: toNonEmptyString(reference?.status) || "deferred",
      note: toNonEmptyString(reference?.provisionalNote) || "Deferred reference; no document link is created in this slice."
    });
  }

  function buildKindSection(kind, references) {
    const entries = references.filter((reference) => reference.kind === kind);
    return Object.freeze({
      kind,
      label: `${toTitleCase(kind)} References`,
      count: entries.length,
      entries: Object.freeze(entries)
    });
  }

  function mapSharedReferencesToJournalReferenceBlock(linkedReferences = [], options = {}) {
    const targetPageName = toNonEmptyString(options?.targetPageName) || "Details";
    const normalizedRows = Array.isArray(linkedReferences)
      ? linkedReferences.map((reference) => normalizeReferenceRow(reference))
      : [];
    const surfacedReferences = normalizedRows.filter((reference) => TARGET_REFERENCE_KINDS.includes(reference.kind));
    const deferredReferences = normalizedRows.filter((reference) => !TARGET_REFERENCE_KINDS.includes(reference.kind));
    const sections = TARGET_REFERENCE_KINDS.map((kind) => buildKindSection(kind, surfacedReferences));

    return Object.freeze({
      title: "References",
      targetPageName,
      statusLabel: "Deferred",
      summary:
        "Structured reference listing for this Journal preview. Item/Actor references are surfaced as deferred text only.",
      sections: Object.freeze(sections),
      surfacedCount: surfacedReferences.length,
      deferredCount: normalizedRows.length,
      surfacedReferences: Object.freeze(surfacedReferences),
      deferredReferences: Object.freeze(deferredReferences)
    });
  }

  globalThis.SWF.journalReferencePresentation = {
    TARGET_REFERENCE_KINDS,
    mapSharedReferencesToJournalReferenceBlock,
    INTERNALS: {
      toNonEmptyString,
      toTitleCase,
      normalizeReferenceRow,
      buildKindSection
    }
  };
})();
