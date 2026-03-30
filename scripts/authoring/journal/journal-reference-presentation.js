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
      emphasis: "secondary",
      entries: Object.freeze(entries)
    });
  }

  function getEffectiveEmphasisModel(options = {}) {
    const fallback = Object.freeze({
      key: "default",
      primaryGroupLabel: "Primary References",
      secondaryGroupLabel: "Secondary References",
      primaryKinds: Object.freeze(["actor"]),
      secondaryKinds: Object.freeze(["item"]),
      orderedKinds: TARGET_REFERENCE_KINDS,
      note: "References are shown as deferred text only; cross-document links are intentionally not created in this slice."
    });
    const presetKey = toNonEmptyString(options?.presetKey);
    const emphasisApi = globalThis.SWF?.journalReferenceEmphasis;
    if (!presetKey || typeof emphasisApi?.getJournalReferenceEmphasisByPresetKey !== "function") return fallback;
    return emphasisApi.getJournalReferenceEmphasisByPresetKey(presetKey) ?? fallback;
  }

  function buildKindSectionsWithEmphasis(surfacedReferences, emphasisModel) {
    const sectionByKind = new Map(
      TARGET_REFERENCE_KINDS.map((kind) => [
        kind,
        {
          kind,
          label: `${toTitleCase(kind)} References`,
          count: 0,
          emphasis: "secondary",
          entries: []
        }
      ])
    );

    surfacedReferences.forEach((reference) => {
      const section = sectionByKind.get(reference.kind);
      if (!section) return;
      section.entries.push(reference);
      section.count += 1;
    });

    TARGET_REFERENCE_KINDS.forEach((kind) => {
      const section = sectionByKind.get(kind);
      if (!section) return;
      if (emphasisModel.primaryKinds.includes(kind)) section.emphasis = "primary";
      if (emphasisModel.secondaryKinds.includes(kind)) section.emphasis = "secondary";
      section.label =
        section.emphasis === "primary"
          ? `${emphasisModel.primaryGroupLabel} · ${toTitleCase(kind)}`
          : `${emphasisModel.secondaryGroupLabel} · ${toTitleCase(kind)}`;
      section.entries = Object.freeze(section.entries);
    });

    const kindOrder = Array.isArray(emphasisModel.orderedKinds)
      ? emphasisModel.orderedKinds.filter((kind) => TARGET_REFERENCE_KINDS.includes(kind))
      : [];
    const effectiveOrder = kindOrder.length ? kindOrder : TARGET_REFERENCE_KINDS;
    return effectiveOrder.map((kind) => Object.freeze(sectionByKind.get(kind) ?? buildKindSection(kind, [])));
  }

  function mapSharedReferencesToJournalReferenceBlock(linkedReferences = [], options = {}) {
    const targetPageName = toNonEmptyString(options?.targetPageName) || "Details";
    const title = toNonEmptyString(options?.title) || "References";
    const summary =
      toNonEmptyString(options?.summary) ||
      "Structured reference listing for this Journal preview. Item/Actor references are surfaced as deferred text only.";
    const normalizedRows = Array.isArray(linkedReferences)
      ? linkedReferences.map((reference) => normalizeReferenceRow(reference))
      : [];
    const emphasisModel = getEffectiveEmphasisModel(options);
    const surfacedReferences = normalizedRows.filter((reference) => TARGET_REFERENCE_KINDS.includes(reference.kind));
    const deferredReferences = normalizedRows.filter((reference) => !TARGET_REFERENCE_KINDS.includes(reference.kind));
    const sections = buildKindSectionsWithEmphasis(surfacedReferences, emphasisModel);
    const primarySections = sections.filter((section) => section.emphasis === "primary");
    const secondarySections = sections.filter((section) => section.emphasis !== "primary");

    return Object.freeze({
      title,
      targetPageName,
      statusLabel: "Deferred",
      summary,
      emphasis: Object.freeze({
        presetKey: emphasisModel.key,
        primaryGroupLabel: emphasisModel.primaryGroupLabel,
        secondaryGroupLabel: emphasisModel.secondaryGroupLabel,
        note: toNonEmptyString(emphasisModel.note)
      }),
      sections: Object.freeze(sections),
      primarySections: Object.freeze(primarySections),
      secondarySections: Object.freeze(secondarySections),
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
      buildKindSection,
      getEffectiveEmphasisModel,
      buildKindSectionsWithEmphasis
    }
  };
})();
