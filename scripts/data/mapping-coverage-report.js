/**
 * Read-only mapping maturity coverage report.
 *
 * Design choice: this is a derived view built from existing read-only mapping layers
 * (validation required fields, field-target notes, unresolved tracker, and confirmed snapshot).
 */
(() => {
  const { manifestValidation, fieldTargetMap, unresolvedMappingTracker, confirmedMappingSnapshot } = globalThis.SWF;

  const COVERAGE_STATUS = Object.freeze({
    CONFIRMED: "confirmed",
    PROVISIONAL: "provisional",
    UNRESOLVED: "unresolved",
    PLANNED: "planned",
    UNMAPPED: "unmapped"
  });

  function normalizeType(type) {
    return typeof type === "string" ? type.trim().toLowerCase() : "";
  }

  function getSupportedTypes() {
    return Object.keys(manifestValidation?.TYPE_REQUIRED_FIELDS ?? {});
  }

  function getValidationFields(type) {
    const requiredByType = manifestValidation?.TYPE_REQUIRED_FIELDS?.[type] ?? [];
    return [...(manifestValidation?.COMMON_REQUIRED_FIELDS ?? []), ...requiredByType];
  }

  function getResolvedStatusFromFieldTarget(type, field) {
    const mapping = fieldTargetMap?.getFieldMapping?.(type, field);
    if (!mapping) return null;

    if (mapping.status === "aligned") return COVERAGE_STATUS.CONFIRMED;
    if (mapping.status === "provisional") return COVERAGE_STATUS.PROVISIONAL;
    if (mapping.status === "unsettled") return COVERAGE_STATUS.UNRESOLVED;
    return null;
  }

  function getResolvedStatusFromUnresolved(type, field) {
    const entries = unresolvedMappingTracker?.getUnresolvedMappingsForField?.(type, field) ?? [];
    if (!entries.length) return null;

    if (entries.some((entry) => entry.status === "provisional")) return COVERAGE_STATUS.PROVISIONAL;
    if (entries.some((entry) => entry.status === "unresolved" || entry.status === "blocked")) return COVERAGE_STATUS.UNRESOLVED;
    if (entries.some((entry) => entry.status === "confirmed")) return COVERAGE_STATUS.CONFIRMED;
    return null;
  }

  function getResolvedStatusFromSnapshot(type, field) {
    const entry = confirmedMappingSnapshot?.getConfirmedMapping?.(type, field);
    if (!entry) return null;

    if (entry.status === "confirmed") return COVERAGE_STATUS.CONFIRMED;
    if (entry.status === "provisional") return COVERAGE_STATUS.PROVISIONAL;
    if (entry.status === "unresolved") return COVERAGE_STATUS.UNRESOLVED;
    if (entry.status === "planned") return COVERAGE_STATUS.PLANNED;
    return null;
  }

  function resolveCoverageStatus(type, field) {
    return (
      getResolvedStatusFromSnapshot(type, field)
      ?? getResolvedStatusFromUnresolved(type, field)
      ?? getResolvedStatusFromFieldTarget(type, field)
      ?? COVERAGE_STATUS.UNMAPPED
    );
  }

  function getTrackedFields(type) {
    const trackedFields = new Set(getValidationFields(type));

    for (const entry of fieldTargetMap?.getFieldMappings?.(type) ?? []) {
      trackedFields.add(entry.manifestField);
    }

    for (const entry of unresolvedMappingTracker?.getUnresolvedMappingsForType?.(type) ?? []) {
      trackedFields.add(entry.field);
    }

    for (const entry of confirmedMappingSnapshot?.getConfirmedMappingsForType?.(type) ?? []) {
      trackedFields.add(entry.field);
    }

    return [...trackedFields];
  }

  function createCoverageNotes(counts) {
    if (counts.totalTrackedFields === 0) {
      return "No tracked fields for this manifest type yet.";
    }

    if (counts.unmappedCount > 0) {
      return "Some required/tracked fields do not yet have mapping notes.";
    }

    if (counts.unresolvedCount > 0 || counts.provisionalCount > 0 || counts.plannedCount > 0) {
      return "Tracked fields are documented, but some mappings remain provisional, unresolved, or planned.";
    }

    return "All tracked fields currently map to confirmed notes.";
  }

  function getCoverageForType(type) {
    const manifestType = normalizeType(type);
    if (!manifestType) {
      return null;
    }

    const fields = getTrackedFields(manifestType);
    const counts = {
      manifestType,
      totalTrackedFields: fields.length,
      confirmedCount: 0,
      provisionalCount: 0,
      unresolvedCount: 0,
      plannedCount: 0,
      unmappedCount: 0
    };

    for (const field of fields) {
      const status = resolveCoverageStatus(manifestType, field);
      if (status === COVERAGE_STATUS.CONFIRMED) counts.confirmedCount += 1;
      else if (status === COVERAGE_STATUS.PROVISIONAL) counts.provisionalCount += 1;
      else if (status === COVERAGE_STATUS.UNRESOLVED) counts.unresolvedCount += 1;
      else if (status === COVERAGE_STATUS.PLANNED) counts.plannedCount += 1;
      else counts.unmappedCount += 1;
    }

    return {
      ...counts,
      coverageNotes: createCoverageNotes(counts)
    };
  }

  function getCoverageReport() {
    return getSupportedTypes().map((type) => getCoverageForType(type)).filter((entry) => entry !== null);
  }

  function getCoverageSummary() {
    const report = getCoverageReport();
    return report.reduce(
      (summary, entry) => {
        summary.manifestTypeCount += 1;
        summary.totalTrackedFields += entry.totalTrackedFields;
        summary.confirmedCount += entry.confirmedCount;
        summary.provisionalCount += entry.provisionalCount;
        summary.unresolvedCount += entry.unresolvedCount;
        summary.plannedCount += entry.plannedCount;
        summary.unmappedCount += entry.unmappedCount;
        return summary;
      },
      {
        manifestTypeCount: 0,
        totalTrackedFields: 0,
        confirmedCount: 0,
        provisionalCount: 0,
        unresolvedCount: 0,
        plannedCount: 0,
        unmappedCount: 0
      }
    );
  }

  globalThis.SWF.mappingCoverageReport = {
    getCoverageReport,
    getCoverageForType,
    getCoverageSummary
  };
})();
