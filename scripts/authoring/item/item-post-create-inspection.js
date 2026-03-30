/**
 * Post-creation inspection model for the Item builder lane.
 *
 * Scope: conservative GM-facing trust layer for one equipment/loot Item creation attempt.
 */
(() => {
  // Allowlist is intentionally narrow for the current equipment-loot-v1 slice.
  // Do not expand this into deep system-data diffing.
  const INSPECTION_OUTCOME = Object.freeze({
    MATCHED: "matched",
    NORMALIZED: "normalized/defaulted",
    OMITTED: "omitted by design",
    DEFERRED: "unsupported/deferred",
    MISMATCH: "mismatch/error"
  });

  function toNonEmptyString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function toArray(values) {
    return Array.isArray(values) ? values.filter(Boolean) : [];
  }

  function getModuleFlagValue(documentOrData, key) {
    const moduleId = globalThis.SWF?.MODULE_ID;
    if (!moduleId || !key) return "";
    const objectValue = documentOrData?.getFlag?.(moduleId, key);
    if (typeof objectValue === "string") return objectValue;
    return toNonEmptyString(documentOrData?.flags?.[moduleId]?.[key]);
  }

  function toInspectableValue(value) {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value.trim();
    return String(value).trim();
  }

  function resolveInspectionOutcome({ expected, actual, supportLevel }) {
    if (supportLevel === "omitted") return INSPECTION_OUTCOME.OMITTED;
    if (supportLevel === "deferred") return INSPECTION_OUTCOME.DEFERRED;

    if (expected && actual && expected === actual) return INSPECTION_OUTCOME.MATCHED;
    if (!expected && !actual) return INSPECTION_OUTCOME.NORMALIZED;
    if (!expected && actual) return INSPECTION_OUTCOME.NORMALIZED;
    return INSPECTION_OUTCOME.MISMATCH;
  }

  function safeReadValue(readFn, payload) {
    try {
      return {
        value: toInspectableValue(readFn(payload)),
        readError: ""
      };
    } catch (error) {
      return {
        value: "",
        readError: error?.message || String(error)
      };
    }
  }

  function buildAllowlistedInspectionRows({ preview, createData, item }) {
    const fieldAllowlist = [
      {
        key: "document.id",
        label: "Document id",
        supportLevel: "materialized",
        previewValue: "n/a",
        expectedRead: () => "",
        actualRead: ({ item: document }) => document?.id,
        note: "Generated at creation time; compared for presence only."
      },
      {
        key: "name",
        label: "Name",
        supportLevel: "materialized",
        previewValue: toNonEmptyString(preview?.name) || "(empty)",
        expectedRead: ({ createData: requested }) => requested?.name,
        actualRead: ({ item: document }) => document?.name
      },
      {
        key: "type",
        label: "Type",
        supportLevel: "materialized",
        previewValue: toNonEmptyString(preview?.typeHint) || "(empty)",
        expectedRead: ({ createData: requested }) => requested?.type,
        actualRead: ({ item: document }) => document?.type
      },
      {
        key: "img",
        label: "Image",
        supportLevel: "materialized",
        previewValue: toNonEmptyString(preview?.img) || "(empty)",
        expectedRead: ({ createData: requested }) => requested?.img,
        actualRead: ({ item: document }) => document?.img
      },
      {
        key: "folder",
        label: "Folder",
        supportLevel: "omitted",
        previewValue: "(not in item draft slice)",
        expectedRead: () => "",
        actualRead: ({ item: document }) => document?.folder?.id ?? document?.folder
      },
      {
        key: "system.description.value",
        label: "Description/notes",
        supportLevel: "materialized",
        previewValue: toNonEmptyString(preview?.summary) || "(empty)",
        expectedRead: ({ createData: requested }) => requested?.system?.description?.value,
        actualRead: ({ item: document }) => document?.system?.description?.value,
        note: "Conservative check compares requested/observed HTML description string."
      },
      {
        key: "system.type.value",
        label: "Classification category",
        supportLevel: "materialized",
        previewValue: toNonEmptyString(preview?.classification?.itemCategory) || "(default)",
        expectedRead: ({ createData: requested }) => requested?.system?.type?.value,
        actualRead: ({ item: document }) => document?.system?.type?.value
      },
      {
        key: "system.identifier",
        label: "Classification identifier",
        supportLevel: "materialized",
        previewValue: "(derived from normalized name)",
        expectedRead: ({ createData: requested }) => requested?.system?.identifier,
        actualRead: ({ item: document }) => document?.system?.identifier
      },
      {
        key: "system.source.cluster",
        label: "Source details",
        supportLevel: "materialized",
        previewValue: JSON.stringify({
          custom: toNonEmptyString(preview?.sourceDetails?.custom),
          book: toNonEmptyString(preview?.sourceDetails?.book),
          page: toNonEmptyString(preview?.sourceDetails?.page),
          license: toNonEmptyString(preview?.sourceDetails?.license),
          rules: toNonEmptyString(preview?.sourceDetails?.rules)
        }),
        expectedRead: ({ createData: requested }) =>
          JSON.stringify({
            custom: toNonEmptyString(requested?.system?.source?.custom),
            book: toNonEmptyString(requested?.system?.source?.book),
            page: toNonEmptyString(requested?.system?.source?.page),
            license: toNonEmptyString(requested?.system?.source?.license),
            rules: toNonEmptyString(requested?.system?.source?.rules)
          }),
        actualRead: ({ item: document }) =>
          JSON.stringify({
            custom: toNonEmptyString(document?.system?.source?.custom),
            book: toNonEmptyString(document?.system?.source?.book),
            page: toNonEmptyString(document?.system?.source?.page),
            license: toNonEmptyString(document?.system?.source?.license),
            rules: toNonEmptyString(document?.system?.source?.rules)
          })
      },
      {
        key: "system.rarity",
        label: "Rarity",
        supportLevel: "deferred",
        previewValue: "(deferred in equipment-loot-v1)",
        expectedRead: () => "",
        actualRead: ({ item: document }) => document?.system?.rarity
      },
      {
        key: "flags.swf.itemBuilderPath",
        label: "Module item path flag",
        supportLevel: "materialized",
        previewValue: "n/a",
        expectedRead: ({ createData: requested }) => getModuleFlagValue(requested, "itemBuilderPath"),
        actualRead: ({ item: document }) => getModuleFlagValue(document, "itemBuilderPath")
      }
    ];

    return fieldAllowlist.map((field) => {
      const expectedRead = safeReadValue(field.expectedRead, { preview, createData, item });
      const actualRead = safeReadValue(field.actualRead, { preview, createData, item });
      const outcome =
        expectedRead.readError || actualRead.readError
          ? INSPECTION_OUTCOME.MISMATCH
          : resolveInspectionOutcome({
              expected: expectedRead.value,
              actual: actualRead.value,
              supportLevel: field.supportLevel
            });

      return {
        key: field.key,
        label: field.label,
        preview: field.previewValue,
        expected: expectedRead.value || "(empty/default)",
        actual: actualRead.value || "(not observed)",
        outcome,
        supportLevel: field.supportLevel,
        note: field.note || "",
        readError: expectedRead.readError || actualRead.readError || ""
      };
    });
  }

  function buildClusterComparisonRows({ rows }) {
    const rowByKey = Object.fromEntries(rows.map((row) => [row.key, row]));

    const classificationStatus = ["system.type.value", "system.identifier"].every(
      (key) => rowByKey[key]?.outcome === INSPECTION_OUTCOME.MATCHED
    )
      ? INSPECTION_OUTCOME.MATCHED
      : INSPECTION_OUTCOME.MISMATCH;

    return [
      {
        key: "identity",
        label: "Identity",
        status: rowByKey.name?.outcome ?? INSPECTION_OUTCOME.MISMATCH,
        requested: rowByKey.name?.expected ?? "(empty/default)",
        actual: rowByKey.name?.actual ?? "(not observed)",
        preview: rowByKey.name?.preview ?? "(empty)",
        note: "Preview name should map directly to created Item name."
      },
      {
        key: "type",
        label: "Item type",
        status: rowByKey.type?.outcome ?? INSPECTION_OUTCOME.MISMATCH,
        requested: rowByKey.type?.expected ?? "(empty/default)",
        actual: rowByKey.type?.actual ?? "(not observed)",
        preview: rowByKey.type?.preview ?? "(empty)",
        note: "Only equipment/loot type paths are in scope for this slice."
      },
      {
        key: "description",
        label: "Description",
        status: rowByKey["system.description.value"]?.outcome ?? INSPECTION_OUTCOME.MISMATCH,
        requested: rowByKey["system.description.value"]?.expected ?? "(empty/default)",
        actual: rowByKey["system.description.value"]?.actual ?? "(not observed)",
        preview: rowByKey["system.description.value"]?.preview ?? "(empty)",
        note: rowByKey["system.description.value"]?.note || ""
      },
      {
        key: "classification",
        label: "Classification cluster",
        status: classificationStatus,
        requested:
          `system.type.value=${rowByKey["system.type.value"]?.expected ?? "(empty/default)"}; ` +
          `system.identifier=${rowByKey["system.identifier"]?.expected ?? "(empty/default)"}`,
        actual:
          `system.type.value=${rowByKey["system.type.value"]?.actual ?? "(not observed)"}; ` +
          `system.identifier=${rowByKey["system.identifier"]?.actual ?? "(not observed)"}`,
        preview:
          `itemCategory=${rowByKey["system.type.value"]?.preview ?? "(default)"}; ` +
          `identifier=${rowByKey["system.identifier"]?.preview ?? "(derived)"}`,
        note: "Classification fields are allowlisted because this slice explicitly materializes them."
      },
      {
        key: "source",
        label: "Source details cluster",
        status: rowByKey["system.source.cluster"]?.outcome ?? INSPECTION_OUTCOME.MISMATCH,
        requested: rowByKey["system.source.cluster"]?.expected ?? "(empty/default)",
        actual: rowByKey["system.source.cluster"]?.actual ?? "(not observed)",
        preview: rowByKey["system.source.cluster"]?.preview ?? "(empty)",
        note: "Conservative source pass-through maps preview sourceDetails into system.source."
      },
      {
        key: "module-metadata",
        label: "Module creation metadata",
        status: rowByKey["flags.swf.itemBuilderPath"]?.outcome ?? INSPECTION_OUTCOME.MISMATCH,
        requested: rowByKey["flags.swf.itemBuilderPath"]?.expected ?? "(missing)",
        actual: rowByKey["flags.swf.itemBuilderPath"]?.actual ?? "(not observed)",
        preview: "n/a",
        note: "Flag confirms create path lineage for this lane."
      }
    ];
  }

  function mapMaterializedFieldRows({ rows }) {
    return [
      {
        key: "name",
        preview: rows.find((row) => row.key === "name")?.preview ?? "(empty)",
        requested: rows.find((row) => row.key === "name")?.expected ?? "(empty/default)",
        actual: rows.find((row) => row.key === "name")?.actual ?? "(not observed)",
        status: rows.find((row) => row.key === "name")?.outcome ?? INSPECTION_OUTCOME.MISMATCH
      },
      {
        key: "type",
        preview: rows.find((row) => row.key === "type")?.preview ?? "(empty)",
        requested: rows.find((row) => row.key === "type")?.expected ?? "(empty/default)",
        actual: rows.find((row) => row.key === "type")?.actual ?? "(not observed)",
        status: rows.find((row) => row.key === "type")?.outcome ?? INSPECTION_OUTCOME.MISMATCH
      },
      {
        key: "img",
        preview: rows.find((row) => row.key === "img")?.preview ?? "(empty)",
        requested: rows.find((row) => row.key === "img")?.expected ?? "(empty/default)",
        actual: rows.find((row) => row.key === "img")?.actual ?? "(not observed)",
        status: rows.find((row) => row.key === "img")?.outcome ?? INSPECTION_OUTCOME.MISMATCH
      },
      {
        key: "description -> system.description.value",
        preview: rows.find((row) => row.key === "system.description.value")?.preview ?? "(empty)",
        requested: rows.find((row) => row.key === "system.description.value")?.expected ?? "(empty/default)",
        actual: rows.find((row) => row.key === "system.description.value")?.actual ?? "(not observed)",
        status: rows.find((row) => row.key === "system.description.value")?.outcome ?? INSPECTION_OUTCOME.MISMATCH
      },
      {
        key: "classification (type/value + identifier)",
        preview:
          `system.type.value=${rows.find((row) => row.key === "system.type.value")?.preview ?? "(default)"}; ` +
          `system.identifier=${rows.find((row) => row.key === "system.identifier")?.preview ?? "(derived)"}`,
        requested:
          `system.type.value=${rows.find((row) => row.key === "system.type.value")?.expected ?? "(empty/default)"}; ` +
          `system.identifier=${rows.find((row) => row.key === "system.identifier")?.expected ?? "(empty/default)"}`,
        actual:
          `system.type.value=${rows.find((row) => row.key === "system.type.value")?.actual ?? "(not observed)"}; ` +
          `system.identifier=${rows.find((row) => row.key === "system.identifier")?.actual ?? "(not observed)"}`,
        status:
          rows.find((row) => row.key === "system.type.value")?.outcome === INSPECTION_OUTCOME.MATCHED &&
          rows.find((row) => row.key === "system.identifier")?.outcome === INSPECTION_OUTCOME.MATCHED
            ? INSPECTION_OUTCOME.MATCHED
            : INSPECTION_OUTCOME.MISMATCH
      },
      {
        key: "source details",
        preview: rows.find((row) => row.key === "system.source.cluster")?.preview ?? "(empty)",
        requested: rows.find((row) => row.key === "system.source.cluster")?.expected ?? "(empty/default)",
        actual: rows.find((row) => row.key === "system.source.cluster")?.actual ?? "(not observed)",
        status: rows.find((row) => row.key === "system.source.cluster")?.outcome ?? INSPECTION_OUTCOME.MISMATCH
      },
      {
        key: "module item path flag",
        preview: "n/a",
        requested: rows.find((row) => row.key === "flags.swf.itemBuilderPath")?.expected ?? "(missing)",
        actual: rows.find((row) => row.key === "flags.swf.itemBuilderPath")?.actual ?? "(not observed)",
        status: rows.find((row) => row.key === "flags.swf.itemBuilderPath")?.outcome ?? INSPECTION_OUTCOME.MISMATCH
      }
    ];
  }

  function buildItemPostCreateInspection({ preview = {}, result = {} } = {}) {
    const success = result?.ok === true;
    const item = success ? result.item ?? null : null;
    const createData = result?.createData ?? null;
    const validation = result?.validation ?? null;

    const deferredClusters = Object.freeze([
      "system.activities",
      "system.uses",
      "system.armor",
      "system.damage",
      "effects automation",
      "cross-document references",
      "ownership and containers"
    ]);

    const allowlistedRows = buildAllowlistedInspectionRows({ preview, createData, item });
    const clusterComparisons = buildClusterComparisonRows({ rows: allowlistedRows });
    const materializedClusters = success
      ? clusterComparisons
          .filter((cluster) => cluster.status === INSPECTION_OUTCOME.MATCHED)
          .map((cluster) => cluster.label)
      : [];

    const warnings = [];
    if (!success) warnings.push(result?.errorMessage || "Item creation did not complete.");
    if (validation && !validation.ok) warnings.push(...toArray(validation.errors));
    if (validation?.ok && Array.isArray(validation.warnings) && validation.warnings.length > 0) {
      warnings.push(...validation.warnings);
    }
    if (success) {
      const mismatchRows = clusterComparisons.filter((cluster) => cluster.status === INSPECTION_OUTCOME.MISMATCH);
      mismatchRows.forEach((cluster) => warnings.push(`${cluster.label} needs manual review (${cluster.status}).`));
    }
    allowlistedRows
      .filter((row) => row.readError)
      .forEach((row) => warnings.push(`Inspection read failed for ${row.label}: ${row.readError}`));
    warnings.push("Inspection is conservative: no deep diff is performed against full dnd5e item system defaults.");

    const notes = [
      "This inspection reports one creation attempt from the current Item preview/draft state.",
      "Staged Item lane trace: authoring model -> preview shaping -> validation -> materialization -> post-create inspection.",
      "Allowlisted fields are intentionally limited to the equipment/loot-v1 create payload.",
      "Only one equipment/loot create path is enabled in this slice."
    ];

    const traceSummary = {
      attempted: clusterComparisons.length,
      materialized: clusterComparisons.filter((cluster) => cluster.status === INSPECTION_OUTCOME.MATCHED).length,
      reviewNeeded: clusterComparisons.filter((cluster) => cluster.status === INSPECTION_OUTCOME.MISMATCH).length,
      deferredInspection: allowlistedRows.filter((row) => row.outcome === INSPECTION_OUTCOME.DEFERRED).length
    };

    return {
      status: {
        ok: success,
        label: success ? "Creation succeeded" : "Creation failed",
        message: success ? result?.statusMessage || "Item created." : result?.errorMessage || "Item creation failed."
      },
      createdItem: success
        ? {
            id: toNonEmptyString(item?.id) || "(unknown)",
            name: toNonEmptyString(item?.name) || toNonEmptyString(createData?.name) || "(unnamed)",
            type: toNonEmptyString(item?.type) || toNonEmptyString(createData?.type) || "(unknown)",
            img: toNonEmptyString(item?.img) || toNonEmptyString(createData?.img) || "(unknown)",
            folder: toNonEmptyString(item?.folder?.name ?? item?.folder) || "(none)",
            uuid: toNonEmptyString(item?.uuid) || ""
          }
        : null,
      inspectionRows: allowlistedRows,
      materializedClusters,
      deferredClusters,
      traceSummary,
      clusterComparisons,
      fieldMapping: mapMaterializedFieldRows({ rows: allowlistedRows }),
      validation: validation
        ? {
            ok: validation.ok === true,
            label: validation?.status?.label ?? (validation.ok ? "Ready" : "Blocked"),
            summary: validation?.status?.summary ?? "",
            errors: toArray(validation.errors),
            warnings: toArray(validation.warnings)
          }
        : null,
      warnings,
      notes
    };
  }

  globalThis.SWF.itemPostCreateInspection = {
    buildItemPostCreateInspection,
    INTERNALS: {
      toArray,
      toNonEmptyString,
      toInspectableValue,
      resolveInspectionOutcome,
      safeReadValue,
      getModuleFlagValue,
      buildAllowlistedInspectionRows,
      buildClusterComparisonRows,
      mapMaterializedFieldRows
    }
  };
})();
