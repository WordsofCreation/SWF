/**
 * Read-only conversion trace for feat manifests.
 *
 * This module explains how a normalized feat manifest maps to the current
 * in-memory feat target stub. It does not create or modify any documents.
 */
(() => {
  const { manifestValidation, confirmedMappingSnapshot } = globalThis.SWF;

  const TRACE_STATUS = Object.freeze({
    MAPPED: "mapped",
    NORMALIZED: "normalized",
    OMITTED: "omitted",
    PROVISIONAL: "provisional",
    UNRESOLVED: "unresolved"
  });

  function isFeatManifest(manifest) {
    return manifest?.type === "feat";
  }

  function getValueAtPath(root, path) {
    if (!root || typeof path !== "string" || path.length === 0) return undefined;
    return path.split(".").reduce((value, key) => (value == null ? undefined : value[key]), root);
  }

  function determineStatus({ sourceValue, targetValue, fallback = TRACE_STATUS.MAPPED, confirmedStatus = null }) {
    if (confirmedStatus === "provisional") return TRACE_STATUS.PROVISIONAL;
    if (typeof targetValue === "undefined") return TRACE_STATUS.UNRESOLVED;
    if (sourceValue !== targetValue) return TRACE_STATUS.NORMALIZED;
    return fallback;
  }

  function createTraceEntry({ manifestField, sourceValue, targetPath, targetValue, status, notes }) {
    return Object.freeze({
      manifestField,
      sourceValue,
      targetPath,
      targetValue,
      status,
      notes
    });
  }

  function buildUnsupportedTypeResult(manifest) {
    const type = typeof manifest?.type === "string" ? manifest.type : "(missing)";
    return {
      ok: false,
      trace: [],
      diagnostics: [
        {
          code: "unsupported_manifest_type",
          message: `Feat conversion trace only supports type 'feat'; received '${type}'.`
        }
      ]
    };
  }

  function buildFeatConversionTrace(manifest, stub) {
    if (!isFeatManifest(manifest)) {
      return buildUnsupportedTypeResult(manifest);
    }

    const validation = manifestValidation.validateManifest(manifest);
    if (!validation.isValid) {
      return {
        ok: false,
        trace: [],
        diagnostics: [
          {
            code: "invalid_manifest",
            message: "Feat conversion trace requires a valid normalized feat manifest."
          },
          ...validation.issues.map((issue) => ({
            code: issue.code,
            field: issue.field,
            message: issue.message
          }))
        ]
      };
    }

    if (!stub || stub.itemType !== "feat") {
      return {
        ok: false,
        trace: [],
        diagnostics: [
          {
            code: "missing_feat_stub",
            message: "Feat conversion trace requires a feat target stub result for inspection."
          }
        ]
      };
    }

    const descriptionMapping = confirmedMappingSnapshot.getConfirmedMapping("feat", "description");
    const sourceMapping = confirmedMappingSnapshot.getConfirmedMapping("feat", "source");
    const entries = [
      createTraceEntry({
        manifestField: "name",
        sourceValue: manifest.name,
        targetPath: "name",
        targetValue: stub.name,
        status: determineStatus({ sourceValue: manifest.name, targetValue: stub.name }),
        notes: "Copied directly into the stub Item name field."
      }),
      createTraceEntry({
        manifestField: "(default image)",
        sourceValue: "icons/svg/book.svg",
        targetPath: "img",
        targetValue: stub.img,
        status: determineStatus({
          sourceValue: "icons/svg/book.svg",
          targetValue: stub.img,
          fallback: TRACE_STATUS.PROVISIONAL
        }),
        notes: "Temporary inspection default used for feat presentation while manifest-level image input is deferred."
      }),
      createTraceEntry({
        manifestField: "(deferred feat type markers)",
        sourceValue: null,
        targetPath: "system.type.value/system.type.subtype",
        targetValue: `${getValueAtPath(stub, "system.type.value")}/${getValueAtPath(stub, "system.type.subtype")}`,
        status: TRACE_STATUS.PROVISIONAL,
        notes: "Type/subtype markers are included as explicit placeholders, pending confirmed dnd5e value vocabulary."
      }),
      createTraceEntry({
        manifestField: "description",
        sourceValue: manifest.description,
        targetPath: "system.description.value",
        targetValue: getValueAtPath(stub, "system.description.value"),
        status: determineStatus({
          sourceValue: manifest.description,
          targetValue: getValueAtPath(stub, "system.description.value"),
          confirmedStatus: descriptionMapping?.status ?? null
        }),
        notes: "Current target path is tracked as provisional until rich-text handling is confirmed."
      }),
      createTraceEntry({
        manifestField: "id",
        sourceValue: manifest.id,
        targetPath: "flags.swfModule.manifestId",
        targetValue: getValueAtPath(stub, "flags.swfModule.manifestId"),
        status: determineStatus({
          sourceValue: manifest.id,
          targetValue: getValueAtPath(stub, "flags.swfModule.manifestId")
        }),
        notes: "Retained for module-side provenance only."
      }),
      createTraceEntry({
        manifestField: "version",
        sourceValue: manifest.version,
        targetPath: "flags.swfModule.manifestVersion",
        targetValue: getValueAtPath(stub, "flags.swfModule.manifestVersion"),
        status: determineStatus({
          sourceValue: manifest.version,
          targetValue: getValueAtPath(stub, "flags.swfModule.manifestVersion")
        }),
        notes: "Retained for module-side provenance only."
      }),
      createTraceEntry({
        manifestField: "status",
        sourceValue: manifest.status,
        targetPath: "flags.swfModule.manifestStatus",
        targetValue: getValueAtPath(stub, "flags.swfModule.manifestStatus"),
        status: determineStatus({
          sourceValue: manifest.status,
          targetValue: getValueAtPath(stub, "flags.swfModule.manifestStatus")
        }),
        notes: "Kept as workflow metadata in module flags rather than dnd5e system fields."
      }),
      createTraceEntry({
        manifestField: "source",
        sourceValue: manifest.source,
        targetPath: "system.source.custom",
        targetValue: getValueAtPath(stub, "system.source.custom"),
        status: determineStatus({
          sourceValue: manifest.source,
          targetValue: getValueAtPath(stub, "system.source.custom"),
          fallback: TRACE_STATUS.PROVISIONAL,
          confirmedStatus: sourceMapping?.status ?? "provisional"
        }),
        notes: "Included as a provisional provenance note target to inspect source-shape assumptions without creating documents."
      })
    ];

    return {
      ok: true,
      trace: entries,
      diagnostics: []
    };
  }

  function getFeatTraceSummary(traceResult) {
    if (!traceResult || traceResult.ok !== true) {
      return "No feat conversion trace available.";
    }

    const counts = {
      [TRACE_STATUS.MAPPED]: 0,
      [TRACE_STATUS.NORMALIZED]: 0,
      [TRACE_STATUS.OMITTED]: 0,
      [TRACE_STATUS.PROVISIONAL]: 0,
      [TRACE_STATUS.UNRESOLVED]: 0
    };

    for (const entry of traceResult.trace) {
      if (Object.hasOwn(counts, entry.status)) counts[entry.status] += 1;
    }

    return `Entries: ${traceResult.trace.length} · mapped ${counts.mapped}, normalized ${counts.normalized}, provisional ${counts.provisional}, omitted ${counts.omitted}, unresolved ${counts.unresolved}`;
  }

  globalThis.SWF.featConversionTrace = {
    TRACE_STATUS,
    buildFeatConversionTrace,
    getFeatTraceSummary
  };
})();
