/**
 * Read-only feat-target stub builder.
 *
 * This module converts a validated feat manifest into a minimal in-memory object
 * representing the current intended dnd5e Item target shape.
 */
(() => {
  const { manifestValidation, confirmedMappingSnapshot } = globalThis.SWF;

  const STUB_VERSION = 1;

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

  function buildFeatTargetStub(manifest) {
    if (!isFeatManifest(manifest)) {
      return buildUnsupportedTypeResult(manifest);
    }

    const validation = manifestValidation.validateManifest(manifest);
    if (!validation.isValid) {
      return buildInvalidManifestResult(manifest, validation.issues);
    }

    const nameMapping = confirmedMappingSnapshot.getConfirmedMapping("feat", "name");
    const descriptionMapping = confirmedMappingSnapshot.getConfirmedMapping("feat", "description");

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
      provenance: {
        manifest: cloneManifestFields(manifest),
        mappingStatus: {
          name: nameMapping?.status ?? "unresolved",
          description: descriptionMapping?.status ?? "unresolved",
          source: "provisional"
        },
        sourceNotes: [
          "This object is a read-only planning stub and is not a Foundry document.",
          "No Item.create or compendium writes are performed in this layer.",
          "source -> system.source.custom remains intentionally omitted until confirmed."
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
