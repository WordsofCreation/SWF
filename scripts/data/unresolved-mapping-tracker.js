/**
 * Read-only tracker for mapping decisions that remain unresolved/provisional/blocked.
 * This does not alter validation, conversion, or document creation behavior.
 */
(() => {
  const { fieldTargetMap } = globalThis.SWF;

  const STATUS = Object.freeze({
    UNRESOLVED: "unresolved",
    PROVISIONAL: "provisional",
    BLOCKED: "blocked",
    CONFIRMED: "confirmed"
  });

  const ENTRIES = Object.freeze([
    Object.freeze({
      manifestType: "feat",
      field: "description",
      unresolvedReason: "Formatting and sanitization behavior for rich text has not been locked for this module.",
      status: STATUS.PROVISIONAL,
      suggestedNextCheck: "Confirm dnd5e feat description expectations and Foundry v13 text-editor constraints before conversion.",
      notes: "Kept in sync with field-target notes where description is currently provisional."
    }),
    Object.freeze({
      manifestType: "feat",
      field: "repeatable",
      unresolvedReason: "Repeatable flag path/value handling is intentionally inspection-only and not yet confirmed for manifest-driven conversion.",
      status: STATUS.PROVISIONAL,
      suggestedNextCheck: "Re-check dnd5e feat prerequisite repeatable conventions before promoting this mapping beyond read-only notes.",
      notes: "Dedicated tracking row keeps repeatable provisional status visible outside stub internals."
    }),
    Object.freeze({
      manifestType: "feature",
      field: "source",
      unresolvedReason: "The final source container path is not confirmed for class-feature style records in this module workflow.",
      status: STATUS.UNRESOLVED,
      suggestedNextCheck: "Re-check current dnd5e source field conventions for feature-like Item data before importer design.",
      notes: "Intentionally unresolved until a concrete importer slice exists."
    }),
    Object.freeze({
      manifestType: "subclass",
      field: "classIdentifier",
      unresolvedReason: "Subclass-parent linkage target is not finalized in a safe add-on module workflow.",
      status: STATUS.BLOCKED,
      suggestedNextCheck: "Inspect current dnd5e subclass linkage patterns and verify module-safe creation boundaries.",
      notes: "Blocked on explicit target path decisions for subclass representation."
    })
  ]);

  function normalizeType(type) {
    return typeof type === "string" ? type.trim().toLowerCase() : "";
  }

  function normalizeField(field) {
    return typeof field === "string" ? field.trim() : "";
  }

  function cloneEntry(entry) {
    return {
      manifestType: entry.manifestType,
      field: entry.field,
      unresolvedReason: entry.unresolvedReason,
      status: entry.status,
      suggestedNextCheck: entry.suggestedNextCheck,
      notes: entry.notes
    };
  }

  function getUnresolvedMappings() {
    return ENTRIES.map(cloneEntry);
  }

  function getUnresolvedMappingsForType(type) {
    const normalizedType = normalizeType(type);
    if (!normalizedType) return [];

    return ENTRIES.filter((entry) => entry.manifestType === normalizedType).map(cloneEntry);
  }

  function getUnresolvedMappingsForField(type, field) {
    const normalizedType = normalizeType(type);
    const normalizedField = normalizeField(field);
    if (!normalizedType || !normalizedField) return [];

    return ENTRIES
      .filter((entry) => entry.manifestType === normalizedType && entry.field === normalizedField)
      .map(cloneEntry);
  }

  function countByStatus(type) {
    const entries = type ? getUnresolvedMappingsForType(type) : getUnresolvedMappings();
    const counts = {
      [STATUS.UNRESOLVED]: 0,
      [STATUS.PROVISIONAL]: 0,
      [STATUS.BLOCKED]: 0,
      [STATUS.CONFIRMED]: 0
    };

    for (const entry of entries) {
      if (Object.hasOwn(counts, entry.status)) {
        counts[entry.status] += 1;
      }
    }

    return counts;
  }

  function getStatusVocabulary() {
    return Object.values(STATUS);
  }

  function getDerivedStatusForField(type, field) {
    const fieldMapping = fieldTargetMap?.getFieldMapping?.(type, field);
    if (!fieldMapping) return null;

    if (fieldMapping.status === "provisional") return STATUS.PROVISIONAL;
    if (fieldMapping.status === "aligned") return STATUS.CONFIRMED;
    if (fieldMapping.status === "unsettled") return STATUS.UNRESOLVED;
    return null;
  }

  globalThis.SWF.unresolvedMappingTracker = {
    getUnresolvedMappings,
    getUnresolvedMappingsForType,
    getUnresolvedMappingsForField,
    countByStatus,
    getStatusVocabulary,
    getDerivedStatusForField
  };
})();
