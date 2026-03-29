/**
 * Read-only feat-target stub builder.
 *
 * This module converts a validated feat manifest into a minimal in-memory object
 * representing the module's current intended dnd5e Item target shape.
 */
(() => {
  const { manifestValidation, confirmedMappingSnapshot, fieldTargetMap } = globalThis.SWF;

  const STUB_VERSION = 2;

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

    const stub = {
      stubKind: "swf.feat-item-target",
      stubVersion: STUB_VERSION,
      documentType: "Item",
      itemType: "feat",
      name: manifest.name,
      system: {
        description: {
          value: manifest.description
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
          source: sourceMapping
        },
        intentionallyOmittedTargets: [
          {
            manifestField: "source",
            targetPath: "system.source.custom",
            reason: "Mapping is still provisional; omitted from system data in this read-only slice."
          },
          {
            manifestField: "status",
            targetPath: "(module workflow metadata)",
            reason: "Planning/workflow metadata remains module-only for now."
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

  globalThis.SWF.featTargetStub = {
    buildFeatTargetStub,
    isFeatManifest,
    summarizeFeatTargetStub
  };
})();
