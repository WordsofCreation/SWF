/**
 * Read-only curated snapshot for mapping decisions that are stable enough to treat as current canon.
 *
 * Design choice: this is an explicitly curated layer (not a fully derived view) so we only expose
 * intentionally confirmed/provisional/unresolved/planned decisions.
 */
(() => {
  const { fieldTargetMap, unresolvedMappingTracker } = globalThis.SWF;

  const STATUS = Object.freeze({
    CONFIRMED: "confirmed",
    PROVISIONAL: "provisional",
    UNRESOLVED: "unresolved",
    PLANNED: "planned"
  });

  const SNAPSHOT_ENTRIES = Object.freeze([
    Object.freeze({
      manifestType: "feat",
      field: "name",
      confirmedTargetPath: "name",
      confirmedTargetNote: "Direct name-to-name mapping is treated as stable in current module planning.",
      status: STATUS.CONFIRMED,
      confirmedSource: "field-target-map:aligned",
      notes: "Safe baseline for read-only inspection; no conversion behavior is introduced."
    }),
    Object.freeze({
      manifestType: "feature",
      field: "name",
      confirmedTargetPath: "name",
      confirmedTargetNote: "Feature name is currently treated with the same stable name mapping assumption as feat.",
      status: STATUS.CONFIRMED,
      confirmedSource: "field-target-map:aligned",
      notes: "Kept narrow and explicit until feature conversion rules exist."
    }),
    Object.freeze({
      manifestType: "feat",
      field: "description",
      confirmedTargetPath: "system.description.value",
      confirmedTargetNote: "Target path intent is useful for planning, but rich-text handling remains provisional.",
      status: STATUS.PROVISIONAL,
      confirmedSource: "field-target-map:provisional",
      notes: "Not promoted to confirmed until sanitization/formatting behavior is locked."
    }),
    Object.freeze({
      manifestType: "feature",
      field: "source",
      confirmedTargetPath: "system.source.custom",
      confirmedTargetNote: "Current target intent exists, but unresolved tracker keeps this mapping unsettled.",
      status: STATUS.UNRESOLVED,
      confirmedSource: "unresolved-mapping-tracker:unresolved",
      notes: "Intentionally left unresolved in this slice."
    }),
    Object.freeze({
      manifestType: "subclass",
      field: "classIdentifier",
      confirmedTargetPath: "(planned parent-class linkage target)",
      confirmedTargetNote: "A parent-link field is expected conceptually, but no safe concrete target path is canon yet.",
      status: STATUS.PLANNED,
      confirmedSource: "type-target-map:provisional + field-target-map:unsettled",
      notes: "Kept as planned-only to avoid premature schema commitment."
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
      confirmedTargetPath: entry.confirmedTargetPath,
      confirmedTargetNote: entry.confirmedTargetNote,
      status: entry.status,
      confirmedSource: entry.confirmedSource,
      notes: entry.notes
    };
  }

  function getConfirmedMappings() {
    return SNAPSHOT_ENTRIES.map(cloneEntry);
  }

  function getConfirmedMappingsForType(type) {
    const normalizedType = normalizeType(type);
    if (!normalizedType) return [];

    return SNAPSHOT_ENTRIES.filter((entry) => entry.manifestType === normalizedType).map(cloneEntry);
  }

  function getConfirmedMapping(type, field) {
    const normalizedType = normalizeType(type);
    const normalizedField = normalizeField(field);
    if (!normalizedType || !normalizedField) return null;

    const match = SNAPSHOT_ENTRIES.find(
      (entry) => entry.manifestType === normalizedType && entry.field === normalizedField
    );

    return match ? cloneEntry(match) : null;
  }

  function countByStatus(type) {
    const entries = type ? getConfirmedMappingsForType(type) : getConfirmedMappings();
    const counts = {
      [STATUS.CONFIRMED]: 0,
      [STATUS.PROVISIONAL]: 0,
      [STATUS.UNRESOLVED]: 0,
      [STATUS.PLANNED]: 0
    };

    for (const entry of entries) {
      if (Object.hasOwn(counts, entry.status)) {
        counts[entry.status] += 1;
      }
    }

    return counts;
  }

  function getConfirmedCoverageForType(type) {
    const normalizedType = normalizeType(type);
    if (!normalizedType) {
      return { totalTrackedFields: 0, confirmedFields: 0, coverage: 0 };
    }

    const fieldMappings = fieldTargetMap?.getFieldMappings?.(normalizedType) ?? [];
    const trackedFields = new Set(fieldMappings.map((entry) => entry.manifestField));
    const unresolvedFields = new Set(
      (unresolvedMappingTracker?.getUnresolvedMappingsForType?.(normalizedType) ?? []).map((entry) => entry.field)
    );
    const confirmedFields = new Set(
      SNAPSHOT_ENTRIES.filter(
        (entry) => entry.manifestType === normalizedType && entry.status === STATUS.CONFIRMED
      ).map((entry) => entry.field)
    );

    const totalTrackedFields = new Set([...trackedFields, ...unresolvedFields]).size;
    const confirmedCount = confirmedFields.size;
    const coverage = totalTrackedFields > 0 ? confirmedCount / totalTrackedFields : 0;

    return {
      totalTrackedFields,
      confirmedFields: confirmedCount,
      coverage
    };
  }

  function getStatusVocabulary() {
    return Object.values(STATUS);
  }

  globalThis.SWF.confirmedMappingSnapshot = {
    getConfirmedMappings,
    getConfirmedMappingsForType,
    getConfirmedMapping,
    countByStatus,
    getConfirmedCoverageForType,
    getStatusVocabulary
  };
})();
