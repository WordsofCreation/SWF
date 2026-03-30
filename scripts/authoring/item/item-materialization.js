/**
 * Item materialization helpers.
 *
 * Scope: first controlled world-document creation path for Item (feat-only).
 */
(() => {
  const { MODULE_ID } = globalThis.SWF;

  const SUPPORTED_ITEM_TYPE = "feat";
  const DEFAULT_FEAT_SUBTYPE = "general";
  const DEFAULT_ITEM_IMAGE = "icons/svg/book.svg";
  const ALLOWED_FEAT_SUBTYPES = Object.freeze(["general", "origin", "fightingStyle", "epicBoon", "class", "species", "calling"]);

  function toNonEmptyString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function slugify(value) {
    const normalized = toNonEmptyString(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return normalized || "unnamed";
  }

  function toDescriptionHtml(summary) {
    const normalizedSummary = toNonEmptyString(summary);
    if (!normalizedSummary) return "<p>No summary provided.</p>";
    return `<p>${foundry.utils.escapeHTML(normalizedSummary)}</p>`;
  }

  function buildConservativeSourceCluster(sourceDetails = {}) {
    const custom = toNonEmptyString(sourceDetails?.custom) || "SWF Builder";
    const book = toNonEmptyString(sourceDetails?.book);
    const page = toNonEmptyString(sourceDetails?.page);
    const license = toNonEmptyString(sourceDetails?.license);
    const rules = toNonEmptyString(sourceDetails?.rules);

    return Object.freeze({
      custom,
      book,
      page,
      license,
      rules
    });
  }

  function validateSupportedItemPreview(itemPreview = {}) {
    const normalizedName = toNonEmptyString(itemPreview?.name);
    const normalizedTypeHint = toNonEmptyString(itemPreview?.typeHint).toLowerCase();
    const normalizedSubtype = toNonEmptyString(itemPreview?.classification?.featSubtype);

    const errors = [];
    const warnings = [];

    if (!normalizedName) errors.push("Item name is required.");
    if (normalizedTypeHint !== SUPPORTED_ITEM_TYPE) {
      errors.push(`Only ${SUPPORTED_ITEM_TYPE} item previews are currently supported for creation.`);
    }
    if (normalizedSubtype && !ALLOWED_FEAT_SUBTYPES.includes(normalizedSubtype)) {
      warnings.push(`Feat subtype '${normalizedSubtype}' is not in the conservative allow-list; defaulting to ${DEFAULT_FEAT_SUBTYPE}.`);
    }

    return {
      ok: errors.length === 0,
      status: {
        label: errors.length === 0 ? "Ready" : "Blocked",
        summary:
          errors.length === 0
            ? "Preview supports one conservative feat Item creation path."
            : "Preview is missing required feat-only creation inputs."
      },
      errors,
      warnings
    };
  }

  function buildItemMaterializationInputModelFromPreview(itemPreview = {}) {
    const name = toNonEmptyString(itemPreview?.name) || "SWF Item Draft";
    const summary = toNonEmptyString(itemPreview?.summary);
    const featSubtype = toNonEmptyString(itemPreview?.classification?.featSubtype) || DEFAULT_FEAT_SUBTYPE;
    const requirements = toNonEmptyString(itemPreview?.classification?.requirements);
    const source = buildConservativeSourceCluster(itemPreview?.sourceDetails);

    return Object.freeze({
      name,
      summary,
      type: SUPPORTED_ITEM_TYPE,
      featSubtype,
      requirements,
      source,
      identifier: `swf-builder-${slugify(name)}`
    });
  }

  function buildItemCreateDataFromMaterializationInput(materializationInput = {}, itemPreview = {}) {
    const descriptionValue = toDescriptionHtml(materializationInput.summary);
    const safeSubtype = ALLOWED_FEAT_SUBTYPES.includes(materializationInput.featSubtype)
      ? materializationInput.featSubtype
      : DEFAULT_FEAT_SUBTYPE;

    return {
      name: materializationInput.name,
      type: SUPPORTED_ITEM_TYPE,
      img: toNonEmptyString(itemPreview?.img) || DEFAULT_ITEM_IMAGE,
      system: {
        description: {
          value: descriptionValue,
          chat: "",
          unidentified: ""
        },
        source: {
          custom: materializationInput?.source?.custom || "SWF Builder",
          book: materializationInput?.source?.book || "",
          page: materializationInput?.source?.page || "",
          license: materializationInput?.source?.license || "",
          rules: materializationInput?.source?.rules || ""
        },
        type: {
          value: SUPPORTED_ITEM_TYPE,
          subtype: safeSubtype
        },
        prerequisites: {
          level: null
        },
        requirements: materializationInput.requirements,
        identifier: materializationInput.identifier
      },
      effects: [],
      flags: {
        [MODULE_ID]: {
          itemBuilderPath: "feat-only-v1",
          itemSummarySource: materializationInput.summary ? "preview.summary" : "defaulted",
          deferredClusters: [
            "system.activities",
            "system.uses",
            "system.advancement",
            "system.enchant",
            "cross-document references"
          ]
        }
      }
    };
  }

  function buildItemMaterializationPipelineFromPreview(itemPreview = {}) {
    const validation = validateSupportedItemPreview(itemPreview);
    const materializationInput = buildItemMaterializationInputModelFromPreview(itemPreview);
    const createData = buildItemCreateDataFromMaterializationInput(materializationInput, itemPreview);

    return Object.freeze({
      stages: Object.freeze({
        authoringModel: Object.freeze({
          name: toNonEmptyString(itemPreview?.name),
          typeHint: toNonEmptyString(itemPreview?.typeHint),
          summary: toNonEmptyString(itemPreview?.summary),
          classification: Object.freeze({
            featSubtype: toNonEmptyString(itemPreview?.classification?.featSubtype),
            requirements: toNonEmptyString(itemPreview?.classification?.requirements)
          }),
          sourceDetails: Object.freeze({
            custom: toNonEmptyString(itemPreview?.sourceDetails?.custom),
            book: toNonEmptyString(itemPreview?.sourceDetails?.book),
            page: toNonEmptyString(itemPreview?.sourceDetails?.page),
            license: toNonEmptyString(itemPreview?.sourceDetails?.license),
            rules: toNonEmptyString(itemPreview?.sourceDetails?.rules)
          })
        }),
        previewShaping: Object.freeze({
          path: "feat-only",
          summaryAsDescription: true,
          classificationCluster: "classification.featSubtype + classification.requirements",
          sourceCluster: "sourceDetails.* -> system.source.* (conservative string pass-through)"
        }),
        validation,
        materializationInput
      }),
      createData
    });
  }

  function buildItemCreateIntentSummaryFromPreview(itemPreview = {}) {
    const pipeline = buildItemMaterializationPipelineFromPreview(itemPreview);
    const createData = pipeline.createData;

    return Object.freeze({
      path: "feat-only-v1",
      supportedItemType: SUPPORTED_ITEM_TYPE,
      name: toNonEmptyString(createData?.name),
      type: toNonEmptyString(createData?.type),
      featSubtype: toNonEmptyString(createData?.system?.type?.subtype),
      descriptionLength: toNonEmptyString(createData?.system?.description?.value).length,
      requirements: toNonEmptyString(createData?.system?.requirements) || "(empty)",
      source: Object.freeze({
        custom: toNonEmptyString(createData?.system?.source?.custom) || "(defaulted)",
        book: toNonEmptyString(createData?.system?.source?.book) || "(empty)",
        page: toNonEmptyString(createData?.system?.source?.page) || "(empty)",
        license: toNonEmptyString(createData?.system?.source?.license) || "(empty)",
        rules: toNonEmptyString(createData?.system?.source?.rules) || "(empty)"
      }),
      deferredClusters: Object.freeze(["activities", "uses", "advancement", "effects automation", "linked references"])
    });
  }

  async function materializeItemPreviewAsWorldItem(itemPreview = {}, options = {}) {
    if (!game.user?.isGM) {
      return {
        ok: false,
        reason: "gm-only",
        errorMessage: "Only a GM can create Items from the SWF builder."
      };
    }

    if (game.system?.id !== "dnd5e") {
      return {
        ok: false,
        reason: "unsupported-system",
        errorMessage: "SWF Item materialization currently requires the dnd5e system."
      };
    }

    if (typeof Item?.create !== "function" && typeof Item?.createDocuments !== "function") {
      return {
        ok: false,
        reason: "missing-api",
        errorMessage: "Item creation APIs are not available in this Foundry environment."
      };
    }

    const materializationPipeline =
      options?.materializationPipeline ?? buildItemMaterializationPipelineFromPreview(itemPreview);
    const validation = materializationPipeline?.stages?.validation ?? validateSupportedItemPreview(itemPreview);
    if (!validation.ok) {
      return {
        ok: false,
        reason: "validation-failed",
        validation,
        errorMessage: "Item draft failed feat-only validation."
      };
    }

    try {
      const createData = materializationPipeline.createData;
      const createdItems =
        typeof Item.createDocuments === "function"
          ? await Item.createDocuments([createData], {
              renderSheet: options.renderSheet ?? true
            })
          : [await Item.create(createData, { renderSheet: options.renderSheet ?? true })];
      const item = Array.isArray(createdItems) ? createdItems[0] : createdItems;
      if (!item) {
        return {
          ok: false,
          reason: "create-failed",
          validation,
          createData,
          errorMessage: "Item creation returned no document."
        };
      }

      return {
        ok: true,
        item,
        createData,
        validation,
        statusMessage: `Created Item: ${item?.name ?? createData.name}`
      };
    } catch (error) {
      return {
        ok: false,
        reason: "create-failed",
        error,
        errorMessage: `Failed to create Item: ${error?.message ?? "Unknown error"}`
      };
    }
  }

  globalThis.SWF.itemMaterialization = {
    SUPPORTED_ITEM_TYPE,
    buildItemMaterializationInputModelFromPreview,
    buildItemMaterializationPipelineFromPreview,
    buildItemCreateDataFromMaterializationInput,
    buildItemCreateIntentSummaryFromPreview,
    materializeItemPreviewAsWorldItem,
    INTERNALS: {
      validateSupportedItemPreview,
      toNonEmptyString,
      toDescriptionHtml,
      slugify,
      buildConservativeSourceCluster
    }
  };
})();
