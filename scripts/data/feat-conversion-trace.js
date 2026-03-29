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
        manifestField: "featCategory",
        sourceValue: Object.hasOwn(manifest, "featCategory") ? manifest.featCategory : "(missing)",
        targetPath: "system.type.value/system.type.subtype",
        targetValue: `${getValueAtPath(stub, "system.type.value")}/${getValueAtPath(stub, "system.type.subtype")}`,
        status: TRACE_STATUS.NORMALIZED,
        notes:
          "Optional featCategory is normalized to strict lowercase and copied to the type value placeholder; allowed vocabulary remains provisional in this read-only slice."
      }),
      createTraceEntry({
        manifestField: "featCategory",
        sourceValue: Object.hasOwn(manifest, "featCategory") ? manifest.featCategory : "(missing)",
        targetPath: "classification.featCategory → system.type.value",
        targetValue: getValueAtPath(stub, "classification.featCategory"),
        status: TRACE_STATUS.PROVISIONAL,
        notes:
          "Classification category is tracked as a read-only planning value. Optional vocabulary currently accepts provisional values only and is warning-level validated."
      }),
      createTraceEntry({
        manifestField: "(deferred feat classification subcategory)",
        sourceValue: null,
        targetPath: "classification.featSubcategory → system.type.subtype",
        targetValue: getValueAtPath(stub, "classification.featSubcategory"),
        status: TRACE_STATUS.PROVISIONAL,
        notes: "Classification subcategory is tracked separately from category to keep future taxonomy decisions explicit."
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
      }),
      createTraceEntry({
        manifestField: "prerequisiteText",
        sourceValue: typeof manifest.prerequisiteText === "string" ? manifest.prerequisiteText : "(missing)",
        targetPath: "system.requirements",
        targetValue: getValueAtPath(stub, "system.requirements"),
        status: TRACE_STATUS.PROVISIONAL,
        notes: "Mapped into a minimal requirements text slot for read-only eligibility inspection; exact long-term vocabulary remains provisional."
      }),
      createTraceEntry({
        manifestField: "prerequisiteLevel",
        sourceValue: Number.isInteger(manifest.prerequisiteLevel) ? manifest.prerequisiteLevel : "(missing)",
        targetPath: "system.prerequisites.level",
        targetValue: getValueAtPath(stub, "system.prerequisites.level"),
        status: TRACE_STATUS.PROVISIONAL,
        notes: "Minimal structured prerequisite level is tracked for inspection while additional prerequisite fields stay intentionally deferred."
      }),
      createTraceEntry({
        manifestField: "(repeatable mapping note)",
        sourceValue: null,
        targetPath: "classification.repeatable → system.prerequisites.repeatable",
        targetValue: getValueAtPath(stub, "system.prerequisites.repeatable"),
        status: TRACE_STATUS.PROVISIONAL,
        notes:
          "Repeatability is explicitly tracked as provisional in mapping notes outside the stub to keep unresolved status visible while target confirmation remains pending."
      }),
      createTraceEntry({
        manifestField: "source",
        sourceValue: manifest.source,
        targetPath: "classification.groupingLabel",
        targetValue: getValueAtPath(stub, "classification.groupingLabel"),
        status: TRACE_STATUS.NORMALIZED,
        notes: "A compact grouping label is derived from manifest source for read-only organization and remains separate from dnd5e feat taxonomy fields."
      }),
      createTraceEntry({
        manifestField: "(classification mapping hints)",
        sourceValue: null,
        targetPath: "classification.mappingHints.*",
        targetValue: JSON.stringify(getValueAtPath(stub, "classification.mappingHints")),
        status: TRACE_STATUS.PROVISIONAL,
        notes: "Mapping hints keep uncertain category/repeatable target paths explicit instead of silently treating them as confirmed."
      }),
      createTraceEntry({
        manifestField: "status",
        sourceValue: manifest.status,
        targetPath: "classification.acquisition.manifestStatus",
        targetValue: getValueAtPath(stub, "classification.acquisition.manifestStatus"),
        status: determineStatus({
          sourceValue: manifest.status,
          targetValue: getValueAtPath(stub, "classification.acquisition.manifestStatus")
        }),
        notes: "Manifest workflow status is retained as read-only acquisition context metadata in the stub."
      }),
      createTraceEntry({
        manifestField: "source",
        sourceValue: manifest.source,
        targetPath: "classification.acquisition.sourceTag",
        targetValue: getValueAtPath(stub, "classification.acquisition.sourceTag"),
        status: determineStatus({
          sourceValue: manifest.source,
          targetValue: getValueAtPath(stub, "classification.acquisition.sourceTag")
        }),
        notes: "Source tag is mirrored into acquisition context for inspection-only categorization planning."
      }),
      createTraceEntry({
        manifestField: "prerequisiteText/prerequisiteLevel",
        sourceValue:
          (typeof manifest.prerequisiteText === "string" && manifest.prerequisiteText.length > 0) ||
          Number.isInteger(manifest.prerequisiteLevel),
        targetPath: "classification.acquisition.hasPrerequisiteGate",
        targetValue: getValueAtPath(stub, "classification.acquisition.hasPrerequisiteGate"),
        status: TRACE_STATUS.NORMALIZED,
        notes: "A simple boolean acquisition gate marker is derived from prerequisite text or minimum level presence."
      }),
      createTraceEntry({
        manifestField: "prerequisiteText/prerequisiteLevel",
        sourceValue:
          (typeof manifest.prerequisiteText === "string" && manifest.prerequisiteText.length > 0) ||
          Number.isInteger(manifest.prerequisiteLevel),
        targetPath: "classification.acquisition.traitSummary",
        targetValue: getValueAtPath(stub, "classification.acquisition.traitSummary"),
        status: TRACE_STATUS.NORMALIZED,
        notes: "Acquisition trait summary is a compact read-only label derived from prerequisite gate presence."
      }),
      createTraceEntry({
        manifestField: "(deferred acquisition mode)",
        sourceValue: null,
        targetPath: "classification.acquisitionMode",
        targetValue: getValueAtPath(stub, "classification.acquisitionMode"),
        status: TRACE_STATUS.OMITTED,
        notes: "Acquisition metadata is represented as a read-only placeholder with no manifest input in this step."
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
