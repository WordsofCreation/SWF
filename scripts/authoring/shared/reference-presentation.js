/**
 * Shared presentation helpers for builder-linked references.
 *
 * Produces display-friendly rows from preview-only shared reference models.
 */
(() => {
  const { referenceModel } = globalThis.SWF;

  function toTitleCase(value) {
    const normalized = typeof value === "string" ? value.trim() : "";
    if (!normalized) return "";
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  function formatReferenceLabel(reference) {
    const prefix = toTitleCase(reference.kind);
    return `${prefix}: ${reference.label}`;
  }

  function buildReferenceDisplayRow(reference) {
    const details = [];
    if (reference.role) details.push(`Role: ${reference.role}`);
    if (reference.status) details.push(`Status: ${reference.status}`);
    if (reference.source) details.push(`Source: ${reference.source}`);
    if (reference.provisionalNote) details.push(`Note: ${reference.provisionalNote}`);

    return Object.freeze({
      kind: reference.kind,
      label: reference.label,
      title: formatReferenceLabel(reference),
      detailText: details.join(" · "),
      hasMeta: !!reference.meta
    });
  }

  function buildReferenceDisplayRows(references) {
    if (!Array.isArray(references) || !references.length) return Object.freeze([]);

    const rows = references.map((reference) => {
      const model = referenceModel.createReferenceModel(reference);
      return buildReferenceDisplayRow(model);
    });

    return Object.freeze(rows);
  }

  globalThis.SWF.referencePresentation = {
    formatReferenceLabel,
    buildReferenceDisplayRow,
    buildReferenceDisplayRows
  };
})();
