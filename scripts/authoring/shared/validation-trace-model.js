/**
 * Shared read-only validation and trace model for builder preview surfaces.
 *
 * This intentionally supports preview inspection only:
 * - Plain in-memory object shape.
 * - No document creation or mutation.
 * - No rule-engine style automation.
 */
(() => {
  function normalizeString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function normalizeStringList(values) {
    if (!Array.isArray(values)) return Object.freeze([]);

    const normalized = [];
    const seen = new Set();

    for (const value of values) {
      const label = normalizeString(value);
      if (!label || seen.has(label)) continue;
      seen.add(label);
      normalized.push(label);
    }

    return Object.freeze(normalized);
  }

  function createReadinessModel(readiness = {}) {
    const status = normalizeString(readiness.status) || "draft";
    const summary = normalizeString(readiness.summary) || "Preview remains draft and non-materialized.";

    return Object.freeze({ status, summary });
  }

  function createValidationTraceModel({
    warnings = [],
    deferredFields = [],
    provisionalFields = [],
    readiness = {},
    traceNotes = []
  } = {}) {
    return Object.freeze({
      warnings: normalizeStringList(warnings),
      deferredFields: normalizeStringList(deferredFields),
      provisionalFields: normalizeStringList(provisionalFields),
      readiness: createReadinessModel(readiness),
      traceNotes: normalizeStringList(traceNotes)
    });
  }

  globalThis.SWF.validationTraceModel = {
    createValidationTraceModel
  };
})();
