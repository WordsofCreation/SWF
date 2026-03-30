/**
 * Item materialization helpers.
 *
 * Scope: first controlled world-document creation path for Item (equipment/loot only).
 */
(() => {
  const { MODULE_ID } = globalThis.SWF;

  const SUPPORTED_ITEM_TYPES = Object.freeze(["equipment", "loot"]);
  const DEFAULT_ITEM_TYPE = "equipment";
  const DEFAULT_ITEM_IMAGE = "icons/svg/item-bag.svg";
  const DEFAULT_TYPE_CLASSIFICATION = Object.freeze({
    equipment: "wondrous",
    loot: "treasure"
  });
  const ALLOWED_TYPE_CLASSIFICATIONS = Object.freeze({
    equipment: Object.freeze(["wondrous", "clothing", "trinket", "light", "medium", "heavy", "shield", "vehicle"]),
    loot: Object.freeze(["treasure", "gem", "art", "material"])
  });

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

  function resolveSupportedItemType(value) {
    const normalized = toNonEmptyString(value).toLowerCase();
    return SUPPORTED_ITEM_TYPES.includes(normalized) ? normalized : "";
  }

  function resolveItemClassification(itemType, draftValue) {
    const safeType = resolveSupportedItemType(itemType) || DEFAULT_ITEM_TYPE;
    const normalized = toNonEmptyString(draftValue);
    const allowed = ALLOWED_TYPE_CLASSIFICATIONS[safeType] ?? [];
    return allowed.includes(normalized) ? normalized : DEFAULT_TYPE_CLASSIFICATION[safeType];
  }

  function validateSupportedItemPreview(itemPreview = {}) {
    const normalizedName = toNonEmptyString(itemPreview?.name);
    const normalizedTypeHint = resolveSupportedItemType(itemPreview?.typeHint);
    const providedClassification = toNonEmptyString(itemPreview?.classification?.itemCategory);

    const errors = [];
    const warnings = [];

    if (!normalizedName) errors.push("Item name is required.");
    if (!normalizedTypeHint) {
      errors.push(`Only ${SUPPORTED_ITEM_TYPES.join(" / ")} item previews are currently supported for creation.`);
    }
    if (normalizedTypeHint && providedClassification) {
      const allowed = ALLOWED_TYPE_CLASSIFICATIONS[normalizedTypeHint] ?? [];
      if (!allowed.includes(providedClassification)) {
        warnings.push(
          `Classification '${providedClassification}' is not in the conservative allow-list for ${normalizedTypeHint}; defaulting to ${DEFAULT_TYPE_CLASSIFICATION[normalizedTypeHint]}.`
        );
      }
    }

    return {
      ok: errors.length === 0,
      status: {
        label: errors.length === 0 ? "Ready" : "Blocked",
        summary:
          errors.length === 0
            ? "Preview supports one conservative equipment/loot Item creation path."
            : "Preview is missing required equipment/loot creation inputs."
      },
      errors,
      warnings
    };
  }

  function buildItemMaterializationInputModelFromPreview(itemPreview = {}) {
    const name = toNonEmptyString(itemPreview?.name) || "SWF Item Draft";
    const itemType = resolveSupportedItemType(itemPreview?.typeHint) || DEFAULT_ITEM_TYPE;
    const summary = toNonEmptyString(itemPreview?.summary);
    const classification = resolveItemClassification(itemType, itemPreview?.classification?.itemCategory);
    const source = buildConservativeSourceCluster(itemPreview?.sourceDetails);

    return Object.freeze({
      name,
      summary,
      type: itemType,
      itemCategory: classification,
      source,
      identifier: `swf-builder-${slugify(name)}`
    });
  }

  function buildItemCreateDataFromMaterializationInput(materializationInput = {}, itemPreview = {}) {
    const descriptionValue = toDescriptionHtml(materializationInput.summary);

    return {
      name: materializationInput.name,
      type: materializationInput.type,
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
          value: materializationInput.itemCategory
        },
        identifier: materializationInput.identifier
      },
      effects: [],
      flags: {
        [MODULE_ID]: {
          itemBuilderPath: "equipment-loot-v1",
          itemType: materializationInput.type,
          itemCategory: materializationInput.itemCategory,
          itemSummarySource: materializationInput.summary ? "preview.summary" : "defaulted",
          deferredClusters: [
            "system.activities",
            "system.uses",
            "system.armor",
            "system.damage",
            "cross-document references",
            "ownership and containers"
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
            itemCategory: toNonEmptyString(itemPreview?.classification?.itemCategory)
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
          path: "equipment-loot-only",
          summaryAsDescription: true,
          classificationCluster: "classification.itemCategory -> system.type.value",
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
      path: "equipment-loot-v1",
      supportedItemTypes: SUPPORTED_ITEM_TYPES,
      name: toNonEmptyString(createData?.name),
      type: toNonEmptyString(createData?.type),
      itemCategory: toNonEmptyString(createData?.system?.type?.value),
      descriptionLength: toNonEmptyString(createData?.system?.description?.value).length,
      source: Object.freeze({
        custom: toNonEmptyString(createData?.system?.source?.custom) || "(defaulted)",
        book: toNonEmptyString(createData?.system?.source?.book) || "(empty)",
        page: toNonEmptyString(createData?.system?.source?.page) || "(empty)",
        license: toNonEmptyString(createData?.system?.source?.license) || "(empty)",
        rules: toNonEmptyString(createData?.system?.source?.rules) || "(empty)"
      }),
      deferredClusters: Object.freeze(["activities", "uses", "armor and damage profiles", "effects automation", "linked references"])
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
        errorMessage: "Item draft failed conservative equipment/loot validation."
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
    SUPPORTED_ITEM_TYPES,
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
      buildConservativeSourceCluster,
      resolveSupportedItemType,
      resolveItemClassification
    }
  };
})();
