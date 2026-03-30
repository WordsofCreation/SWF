/**
 * Actor materialization helpers.
 *
 * Scope: first controlled world-document creation path for Actor (npc-only).
 */
(() => {
  const { MODULE_ID } = globalThis.SWF;

  const SUPPORTED_ACTOR_TYPE = "npc";
  const SUPPORTED_ACTOR_PATH = "npc-focused";
  const DEFAULT_ACTOR_IMAGE = "icons/svg/mystery-man.svg";

  function toNonEmptyString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function validateSupportedActorPreview(actorPreview = {}) {
    const normalizedName = toNonEmptyString(actorPreview?.name);
    const normalizedTypeHint = toNonEmptyString(actorPreview?.typeHint).toLowerCase();
    const normalizedActorPath = toNonEmptyString(actorPreview?.classification?.actorPath).toLowerCase();

    const errors = [];
    const warnings = [];

    if (!normalizedName) errors.push("Actor name is required.");
    if (normalizedTypeHint !== SUPPORTED_ACTOR_TYPE) {
      errors.push(`Only ${SUPPORTED_ACTOR_TYPE} actor previews are currently supported for creation.`);
    }
    if (normalizedActorPath && normalizedActorPath !== SUPPORTED_ACTOR_PATH) {
      errors.push(`Actor path '${normalizedActorPath}' is not supported by the conservative NPC creation slice.`);
    }
    if (!normalizedActorPath) {
      warnings.push("Actor classification path was not provided; proceeding with conservative npc-only create payload.");
    }

    return {
      ok: errors.length === 0,
      status: {
        label: errors.length === 0 ? "Ready" : "Blocked",
        summary:
          errors.length === 0
            ? "Preview supports one conservative npc Actor creation path."
            : "Preview is missing required npc-only creation inputs."
      },
      errors,
      warnings
    };
  }

  function buildActorMaterializationInputModelFromPreview(actorPreview = {}) {
    return Object.freeze({
      name: toNonEmptyString(actorPreview?.name) || "SWF Actor Draft",
      type: SUPPORTED_ACTOR_TYPE,
      img: toNonEmptyString(actorPreview?.img) || DEFAULT_ACTOR_IMAGE,
      summary: toNonEmptyString(actorPreview?.summary),
      roleLabel: toNonEmptyString(actorPreview?.roleLabel),
      concept: toNonEmptyString(actorPreview?.concept)
    });
  }

  function buildActorCreateDataFromMaterializationInput(materializationInput = {}) {
    // In-scope fields: actor identity + conservative module metadata.
    // Deferred fields: dnd5e system attributes/details, effects, items, and token automation.
    return {
      name: materializationInput.name,
      type: SUPPORTED_ACTOR_TYPE,
      img: materializationInput.img,
      flags: {
        [MODULE_ID]: {
          actorBuilderPath: "npc-core-v1",
          actorDraftSummary: materializationInput.summary,
          actorDraftRoleLabel: materializationInput.roleLabel,
          actorDraftConcept: materializationInput.concept,
          deferredClusters: [
            "dnd5e.system.attributes",
            "dnd5e.system.details",
            "embedded items/features",
            "prototype token automation",
            "active effects"
          ]
        }
      }
    };
  }

  function buildActorMaterializationPipelineFromPreview(actorPreview = {}) {
    const validation = validateSupportedActorPreview(actorPreview);
    const materializationInput = buildActorMaterializationInputModelFromPreview(actorPreview);
    const createData = buildActorCreateDataFromMaterializationInput(materializationInput);

    return Object.freeze({
      stages: Object.freeze({
        authoringModel: Object.freeze({
          name: toNonEmptyString(actorPreview?.name),
          typeHint: toNonEmptyString(actorPreview?.typeHint),
          img: toNonEmptyString(actorPreview?.img),
          summary: toNonEmptyString(actorPreview?.summary),
          roleLabel: toNonEmptyString(actorPreview?.roleLabel),
          concept: toNonEmptyString(actorPreview?.concept),
          classification: Object.freeze({
            actorPath: toNonEmptyString(actorPreview?.classification?.actorPath)
          })
        }),
        previewShaping: Object.freeze({
          path: "npc-core",
          actorIdentity: "name + type + img",
          retainedDraftMetadata: "summary/roleLabel/concept -> module flags",
          deferred: "all dnd5e system clusters and automation payloads"
        }),
        validation,
        materializationInput
      }),
      createData
    });
  }

  function buildActorCreateIntentSummaryFromPreview(actorPreview = {}) {
    const pipeline = buildActorMaterializationPipelineFromPreview(actorPreview);
    const createData = pipeline.createData;

    return Object.freeze({
      path: "npc-core-v1",
      supportedActorType: SUPPORTED_ACTOR_TYPE,
      name: toNonEmptyString(createData?.name),
      type: toNonEmptyString(createData?.type),
      img: toNonEmptyString(createData?.img),
      retainedDraftSummary: toNonEmptyString(createData?.flags?.[MODULE_ID]?.actorDraftSummary) || "(empty)",
      retainedDraftRoleLabel: toNonEmptyString(createData?.flags?.[MODULE_ID]?.actorDraftRoleLabel) || "(empty)",
      retainedDraftConcept: toNonEmptyString(createData?.flags?.[MODULE_ID]?.actorDraftConcept) || "(empty)",
      deferredClusters: Object.freeze([
        "dnd5e system data",
        "embedded items/features",
        "token automation",
        "active effects"
      ])
    });
  }

  async function materializeActorPreviewAsWorldActor(actorPreview = {}, options = {}) {
    if (!game.user?.isGM) {
      return {
        ok: false,
        reason: "gm-only",
        errorMessage: "Only a GM can create Actors from the SWF builder."
      };
    }

    if (game.system?.id !== "dnd5e") {
      return {
        ok: false,
        reason: "unsupported-system",
        errorMessage: "SWF Actor materialization currently requires the dnd5e system."
      };
    }

    if (typeof Actor?.create !== "function" && typeof Actor?.createDocuments !== "function") {
      return {
        ok: false,
        reason: "missing-api",
        errorMessage: "Actor creation APIs are not available in this Foundry environment."
      };
    }

    const materializationPipeline =
      options?.materializationPipeline ?? buildActorMaterializationPipelineFromPreview(actorPreview);
    const validation = materializationPipeline?.stages?.validation ?? validateSupportedActorPreview(actorPreview);
    if (!validation.ok) {
      return {
        ok: false,
        reason: "validation-failed",
        validation,
        errorMessage: "Actor draft failed npc-only validation."
      };
    }

    try {
      const createData = materializationPipeline.createData;
      const createdActors =
        typeof Actor.createDocuments === "function"
          ? await Actor.createDocuments([createData], {
              renderSheet: options.renderSheet ?? true
            })
          : [await Actor.create(createData, { renderSheet: options.renderSheet ?? true })];
      const actor = Array.isArray(createdActors) ? createdActors[0] : createdActors;
      if (!actor) {
        return {
          ok: false,
          reason: "create-failed",
          validation,
          createData,
          errorMessage: "Actor creation returned no document."
        };
      }

      return {
        ok: true,
        actor,
        createData,
        validation,
        statusMessage: `Created Actor: ${toNonEmptyString(actor.name) || toNonEmptyString(createData.name)}`
      };
    } catch (error) {
      return {
        ok: false,
        reason: "create-threw",
        validation,
        createData: materializationPipeline?.createData,
        errorMessage: `Actor creation failed: ${error?.message || String(error)}`
      };
    }
  }

  globalThis.SWF.actorMaterialization = {
    SUPPORTED_ACTOR_TYPE,
    SUPPORTED_ACTOR_PATH,
    buildActorMaterializationPipelineFromPreview,
    buildActorCreateIntentSummaryFromPreview,
    validateSupportedActorPreview,
    materializeActorPreviewAsWorldActor
  };
})();
