/**
 * Read-only checker for manifest shape consistency across internal reference layers.
 */
(() => {
  const {
    manifestValidation,
    manifestRegistry,
    manifestBuilders,
    canonicalFieldInventory
  } = globalThis.SWF;

  const STATUS = Object.freeze({
    CONSISTENT: "consistent",
    DRIFT: "drift",
    WARNING: "warning"
  });

  const INFO_ONLY_FIELDS = Object.freeze(["example"]);

  function normalizeType(type) {
    return typeof type === "string" ? type.trim().toLowerCase() : "";
  }

  function getTopLevelFields(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return [];
    }

    return Object.keys(value).sort();
  }

  function getValidationFields(type) {
    const normalizedType = normalizeType(type);
    const common = Array.isArray(manifestValidation?.COMMON_REQUIRED_FIELDS)
      ? manifestValidation.COMMON_REQUIRED_FIELDS
      : [];
    const typeSpecific = manifestValidation?.TYPE_REQUIRED_FIELDS?.[normalizedType] ?? [];

    return Array.from(new Set([...common, ...typeSpecific])).sort();
  }

  function getCanonicalExampleFields(type) {
    const normalizedType = normalizeType(type);
    const canonicalExample = manifestRegistry
      .getByType(normalizedType)
      .find((manifest) => manifest.example === true);

    return canonicalExample ? getTopLevelFields(canonicalExample) : [];
  }

  function getStarterBuilderFields(type) {
    const starter = manifestBuilders.createStarterForType(type);
    return starter ? getTopLevelFields(starter) : [];
  }

  function getCanonicalInventoryFields(type) {
    return canonicalFieldInventory
      .getCanonicalFields(type)
      .map((entry) => entry.field)
      .sort();
  }

  function difference(sourceFields, targetFields) {
    const target = new Set(targetFields);
    return sourceFields.filter((field) => !target.has(field));
  }

  function buildMismatchList(report) {
    const mismatches = [];

    for (const field of report.missingInValidation) {
      mismatches.push({ field, missingIn: "validation" });
    }
    for (const field of report.missingInExample) {
      mismatches.push({ field, missingIn: "canonicalExample" });
    }
    for (const field of report.missingInBuilder) {
      mismatches.push({ field, missingIn: "starterBuilder" });
    }
    for (const field of report.missingInInventory) {
      mismatches.push({ field, missingIn: "canonicalInventory" });
    }

    return mismatches;
  }

  function classifyStatus(mismatches) {
    if (mismatches.length === 0) {
      return STATUS.CONSISTENT;
    }

    const hasDrift = mismatches.some((entry) => !INFO_ONLY_FIELDS.includes(entry.field));
    return hasDrift ? STATUS.DRIFT : STATUS.WARNING;
  }

  function buildNotes(status, mismatches) {
    if (status === STATUS.CONSISTENT) {
      return ["Top-level field sets align across validation, canonical example, starter builder, and inventory."];
    }

    const infoOnly = mismatches.filter((entry) => INFO_ONLY_FIELDS.includes(entry.field));
    const notes = [];

    if (infoOnly.length > 0) {
      notes.push("Differences include known fixture-only fields (e.g., 'example') that are tracked as warnings.");
    }

    if (status === STATUS.DRIFT) {
      notes.push("At least one non-fixture field differs across layers and should be reviewed before generator/importer work.");
    }

    return notes;
  }

  function buildTypeReport(type) {
    const manifestType = normalizeType(type);
    const validationFields = getValidationFields(manifestType);
    const canonicalExampleFields = getCanonicalExampleFields(manifestType);
    const starterBuilderFields = getStarterBuilderFields(manifestType);
    const canonicalInventoryFields = getCanonicalInventoryFields(manifestType);

    const unionFields = Array.from(
      new Set([
        ...validationFields,
        ...canonicalExampleFields,
        ...starterBuilderFields,
        ...canonicalInventoryFields
      ])
    ).sort();

    const report = {
      manifestType,
      validationFields,
      canonicalExampleFields,
      starterBuilderFields,
      canonicalInventoryFields,
      missingInValidation: difference(unionFields, validationFields),
      missingInExample: difference(unionFields, canonicalExampleFields),
      missingInBuilder: difference(unionFields, starterBuilderFields),
      missingInInventory: difference(unionFields, canonicalInventoryFields)
    };

    report.mismatches = buildMismatchList(report);
    report.status = classifyStatus(report.mismatches);
    report.notes = buildNotes(report.status, report.mismatches);

    return report;
  }

  function getSupportedTypes() {
    return canonicalFieldInventory.getSupportedTypes();
  }

  function getShapeConsistencyReport() {
    return getSupportedTypes().map((type) => buildTypeReport(type));
  }

  function getShapeConsistencyForType(type) {
    const normalizedType = normalizeType(type);
    return getSupportedTypes().includes(normalizedType) ? buildTypeReport(normalizedType) : null;
  }

  function getShapeConsistencySummary() {
    const reports = getShapeConsistencyReport();
    const byStatus = reports.reduce(
      (acc, report) => {
        acc[report.status] += 1;
        return acc;
      },
      { consistent: 0, drift: 0, warning: 0 }
    );

    return {
      totalTypes: reports.length,
      consistentCount: byStatus.consistent,
      driftCount: byStatus.drift,
      warningCount: byStatus.warning,
      statuses: reports.map((report) => ({ manifestType: report.manifestType, status: report.status }))
    };
  }

  globalThis.SWF.shapeConsistencyChecker = {
    STATUS,
    getShapeConsistencyReport,
    getShapeConsistencyForType,
    getShapeConsistencySummary
  };
})();
