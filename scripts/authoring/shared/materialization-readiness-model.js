/**
 * Shared read-only materialization-readiness model for builder preview surfaces.
 *
 * This model intentionally describes readiness only:
 * - Plain in-memory object shape.
 * - No Foundry document creation or updates.
 * - No compendium writes or materialization pipeline.
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

  function createReadinessSummary(readiness = {}) {
    const status = normalizeString(readiness.status) || "deferred";
    const summary = normalizeString(readiness.summary) || "Materialization remains deferred for this preview surface.";

    return Object.freeze({ status, summary });
  }

  function createMaterializationReadinessModel({
    readyClusters = [],
    deferredClusters = [],
    provisionalClusters = [],
    readiness = {},
    nextStepNote = ""
  } = {}) {
    return Object.freeze({
      readyClusters: normalizeStringList(readyClusters),
      deferredClusters: normalizeStringList(deferredClusters),
      provisionalClusters: normalizeStringList(provisionalClusters),
      readiness: createReadinessSummary(readiness),
      nextStepNote: normalizeString(nextStepNote) || "Define one documented document-creation contract before enabling materialization."
    });
  }

  globalThis.SWF.materializationReadinessModel = {
    createMaterializationReadinessModel
  };
})();
