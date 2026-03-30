/**
 * Shared read-only reference model for builder-linked entities.
 *
 * This layer is intentionally small and preview-only:
 * - Plain in-memory objects.
 * - No Foundry document creation or mutation.
 * - No compendium interaction.
 */
(() => {
  const REFERENCE_KINDS = Object.freeze(["item", "actor", "journal"]);

  function normalizeString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function normalizeOptionalString(value) {
    const normalized = normalizeString(value);
    return normalized || null;
  }

  function createReferenceModel({
    kind,
    label,
    role = null,
    source = null,
    status = null,
    provisionalNote = null,
    meta = null
  } = {}) {
    const normalizedKind = normalizeString(kind).toLowerCase();
    if (!REFERENCE_KINDS.includes(normalizedKind)) {
      throw new Error(
        `[SWF] Invalid shared reference kind '${kind ?? ""}'. Expected one of: ${REFERENCE_KINDS.join(", ")}.`
      );
    }

    const normalizedLabel = normalizeString(label);
    if (!normalizedLabel) {
      throw new Error("[SWF] Shared reference requires a non-empty label.");
    }

    const normalizedMeta = meta && typeof meta === "object" ? foundry.utils.deepClone(meta) : null;

    return Object.freeze({
      kind: normalizedKind,
      label: normalizedLabel,
      role: normalizeOptionalString(role),
      source: normalizeOptionalString(source),
      status: normalizeOptionalString(status),
      provisionalNote: normalizeOptionalString(provisionalNote),
      meta: normalizedMeta ? Object.freeze(normalizedMeta) : null
    });
  }

  globalThis.SWF.referenceModel = {
    REFERENCE_KINDS,
    createReferenceModel
  };
})();
