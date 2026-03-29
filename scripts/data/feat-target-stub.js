/**
 * Read-only feat-target stub builder.
 *
 * This module converts a validated feat manifest into a minimal in-memory object
 * representing the module's current intended dnd5e Item target shape.
 */
(() => {
  const { manifestValidation, confirmedMappingSnapshot, fieldTargetMap } = globalThis.SWF;

  const STUB_VERSION = 5;
  const DEFAULT_FEAT_IMG = "icons/svg/book.svg";

  function isFeatManifest(manifest) {
    return manifest?.type === "feat";
  }

  function cloneManifestFields(manifest) {
    return {
      id: manifest.id,
      type: manifest.type,
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      status: manifest.status,
      source: manifest.source
    };
  }

  function buildUnsupportedTypeResult(manifest) {
    const type = typeof manifest?.type === "string" ? manifest.type : "(missing)";
    return {
      ok: false,
      stub: null,
      diagnostics: [
        {
          code: "unsupported_manifest_type",
          message: `Feat target stub builder only supports type 'feat'; received '${type}'.`
        }
      ]
    };
  }

  function buildInvalidManifestResult(manifest, issues) {
    return {
      ok: false,
      stub: null,
      diagnostics: [
        {
          code: "invalid_manifest",
          message: "Feat target stub builder requires a valid normalized feat manifest."
        },
        ...issues.map((issue) => ({
          code: issue.code,
          field: issue.field,
          message: issue.message
        }))
      ],
      normalizedManifest: cloneManifestFields(manifest)
    };
  }

  function getMappingStatus(field) {
    const confirmed = confirmedMappingSnapshot.getConfirmedMapping("feat", field);
    if (confirmed) {
      return {
        status: confirmed.status,
        targetPath: confirmed.confirmedTargetPath,
        source: confirmed.confirmedSource
      };
    }

    const mapped = fieldTargetMap.getFieldMapping("feat", field);
    return {
      status: mapped?.status ?? "unresolved",
      targetPath: mapped?.intendedTargetPath ?? "(unresolved)",
      source: mapped ? "field-target-map" : "missing"
    };
  }

  function buildFeatTargetStub(manifest) {
    if (!isFeatManifest(manifest)) {
      return buildUnsupportedTypeResult(manifest);
    }

    const validation = manifestValidation.validateManifest(manifest);
    if (!validation.isValid) {
      return buildInvalidManifestResult(manifest, validation.issues);
    }

    const nameMapping = getMappingStatus("name");
    const descriptionMapping = getMappingStatus("description");
    const sourceMapping = getMappingStatus("source");
    const featTypeMapping = {
      status: "provisional",
      targetPath: "system.type.value/system.type.subtype",
      source: "dnd5e-feat-pattern-analysis"
    };
    const imgMapping = {
      status: "provisional",
      targetPath: "img",
      source: "dnd5e-item-pattern-analysis"
    };
    const requirementsText = typeof manifest.prerequisiteText === "string" ? manifest.prerequisiteText : "";
    const prerequisiteLevel = Number.isInteger(manifest.prerequisiteLevel) ? manifest.prerequisiteLevel : null;
    const prerequisitesMapping = {
      requirements: {
        status: "provisional",
        targetPath: "system.requirements",
        source: "dnd5e-feat-feature-pattern-deep-dive"
      },
      level: {
        status: "provisional",
        targetPath: "system.prerequisites.level",
        source: "dnd5e-feat-feature-pattern-deep-dive"
      }
    };
    const classificationMapping = {
      category: {
        status: "provisional",
        targetPath: "system.type.value",
        source: "dnd5e-feat-feature-pattern-deep-dive"
      },
      subcategory: {
        status: "provisional",
        targetPath: "system.type.subtype",
        source: "dnd5e-feat-feature-pattern-deep-dive"
      },
      repeatable: {
        status: "provisional",
        targetPath: "system.prerequisites.repeatable",
        source: "dnd5e-feat-feature-pattern-deep-dive"
      },
      acquisitionMode: {
        status: "deferred",
        targetPath: "(no manifest field in this slice)",
        source: "swf-module-manifest-discipline"
      }
    };

    const stub = {
      stubKind: "swf.feat-item-target",
      stubVersion: STUB_VERSION,
      documentType: "Item",
      itemType: "feat",
      name: manifest.name,
      img: DEFAULT_FEAT_IMG,
      classification: {
        featCategory: null,
        featSubcategory: null,
        repeatable: null,
        acquisitionMode: null
      },
      system: {
        type: {
          value: null,
          subtype: null
        },
        description: {
          value: manifest.description
        },
        source: {
          custom: manifest.source
        },
        requirements: requirementsText,
        prerequisites: {
          level: prerequisiteLevel,
          repeatable: null
        }
      },
      flags: {
        swfModule: {
          manifestId: manifest.id,
          manifestVersion: manifest.version,
          manifestStatus: manifest.status,
          source: manifest.source
        }
      },
      sourceNotes: {
        modelIntent: "Read-only planning stub for a future dnd5e feat Item shape.",
        resolvedMappings: {
          name: nameMapping,
          description: descriptionMapping
        },
        provisionalMappings: {
          source: sourceMapping,
          featType: featTypeMapping,
          img: imgMapping,
          prerequisites: prerequisitesMapping,
          classification: classificationMapping
        },
        intentionallyOmittedTargets: [
          {
            manifestField: "status",
            targetPath: "(module workflow metadata)",
            reason: "Planning/workflow metadata remains module-only for now."
          },
          {
            manifestField: "(no manifest field yet)",
            targetPath: "system.type.value/system.type.subtype",
            reason: "Feat-type taxonomy is intentionally deferred until manifest vocabulary is introduced."
          },
          {
            manifestField: "(prerequisites cluster remainder)",
            targetPath: "system.prerequisites.items",
            reason: "Only level + repeatable are modeled in this step; additional eligibility fields remain deferred."
          },
          {
            manifestField: "(no manifest field yet)",
            targetPath: "(feat acquisition mode metadata)",
            reason: "Acquisition metadata remains deferred until manifest vocabulary exists for feat gain source."
          }
        ],
        safety: [
          "This object is not a Foundry document instance.",
          "No Item.create, update, import, or compendium write is performed."
        ]
      }
    };

    return {
      ok: true,
      stub,
      diagnostics: []
    };
  }

  function summarizeFeatTargetStub(result) {
    if (!result || result.ok !== true || !result.stub) {
      return "No feat target stub available.";
    }

    return [
      `Target: ${result.stub.documentType}/${result.stub.itemType}`,
      `Name: ${result.stub.name}`,
      `Manifest: ${result.stub.flags.swfModule.manifestId}@${result.stub.flags.swfModule.manifestVersion}`
    ].join(" | ");
  }

  function summarizeFeatPresentationFields(stub) {
    if (!stub || stub.itemType !== "feat") {
      return "No feat presentation cluster available.";
    }

    const sourceCustom = stub.system?.source?.custom;
    const typeValue = stub.system?.type?.value ?? "(deferred)";
    const subtypeValue = stub.system?.type?.subtype ?? "(deferred)";
    const sourceLabel = sourceCustom || "(empty)";

    return `Name: ${stub.name} | Item Type: ${stub.itemType} | Feat Type: ${typeValue}/${subtypeValue} | Img: ${stub.img} | Source: ${sourceLabel}`;
  }

  function summarizeFeatPrerequisites(stub) {
    if (!stub || stub.itemType !== "feat") {
      return "No feat prerequisites cluster available.";
    }

    const requirements = stub.system?.requirements || "(none)";
    const level = stub.system?.prerequisites?.level;
    const levelLabel = Number.isInteger(level) ? String(level) : "(none)";

    return `Requirements Text: ${requirements} | Minimum Level: ${levelLabel}`;
  }

  function summarizeFeatClassification(stub) {
    if (!stub || stub.itemType !== "feat") {
      return "No feat classification cluster available.";
    }

    const category = stub.classification?.featCategory ?? "(deferred)";
    const subcategory = stub.classification?.featSubcategory ?? "(deferred)";
    const repeatable = stub.classification?.repeatable;
    const acquisitionMode = stub.classification?.acquisitionMode ?? "(deferred)";
    const repeatableLabel = typeof repeatable === "boolean" ? String(repeatable) : "(deferred)";

    return `Category: ${category} | Subcategory: ${subcategory} | Repeatable: ${repeatableLabel} | Acquisition: ${acquisitionMode}`;
  }

  globalThis.SWF.featTargetStub = {
    buildFeatTargetStub,
    isFeatManifest,
    summarizeFeatTargetStub,
    summarizeFeatPresentationFields,
    summarizeFeatPrerequisites,
    summarizeFeatClassification
  };
})();
