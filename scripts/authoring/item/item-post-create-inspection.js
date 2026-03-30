/**
 * Post-creation inspection model for the Item builder lane.
 *
 * Scope: conservative GM-facing trust layer for one equipment/loot Item creation attempt.
 */
(() => {
  function toNonEmptyString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function toArray(values) {
    return Array.isArray(values) ? values.filter(Boolean) : [];
  }

  function compareValue(requested, actual) {
    if (!requested && !actual) return "deferred-inspection";
    if (requested === actual) return "materialized";
    if (requested && actual) return "mismatch";
    if (requested && !actual) return "requested-not-observed";
    return "deferred-inspection";
  }

  function getModuleFlagValue(documentOrData, key) {
    const moduleId = globalThis.SWF?.MODULE_ID;
    if (!moduleId || !key) return "";
    const objectValue = documentOrData?.getFlag?.(moduleId, key);
    if (typeof objectValue === "string") return objectValue;
    return toNonEmptyString(documentOrData?.flags?.[moduleId]?.[key]);
  }

  function buildClusterComparisonRows({ preview, createData, item }) {
    const previewName = toNonEmptyString(preview?.name);
    const requestedName = toNonEmptyString(createData?.name);
    const actualName = toNonEmptyString(item?.name);

    const requestedDescription = toNonEmptyString(createData?.system?.description?.value);
    const actualDescription = toNonEmptyString(item?.system?.description?.value);

    const requestedType = toNonEmptyString(createData?.type);
    const actualType = toNonEmptyString(item?.type);
    const requestedCategory = toNonEmptyString(createData?.system?.type?.value);
    const actualCategory = toNonEmptyString(item?.system?.type?.value);
    const requestedIdentifier = toNonEmptyString(createData?.system?.identifier);
    const actualIdentifier = toNonEmptyString(item?.system?.identifier);
    const requestedSource = JSON.stringify({
      custom: toNonEmptyString(createData?.system?.source?.custom),
      book: toNonEmptyString(createData?.system?.source?.book),
      page: toNonEmptyString(createData?.system?.source?.page),
      license: toNonEmptyString(createData?.system?.source?.license),
      rules: toNonEmptyString(createData?.system?.source?.rules)
    });
    const actualSource = JSON.stringify({
      custom: toNonEmptyString(item?.system?.source?.custom),
      book: toNonEmptyString(item?.system?.source?.book),
      page: toNonEmptyString(item?.system?.source?.page),
      license: toNonEmptyString(item?.system?.source?.license),
      rules: toNonEmptyString(item?.system?.source?.rules)
    });

    const requestedPathFlag = getModuleFlagValue(createData, "itemBuilderPath");
    const actualPathFlag = getModuleFlagValue(item, "itemBuilderPath");

    return [
      {
        key: "identity",
        label: "Identity",
        status: compareValue(requestedName, actualName),
        requested: requestedName || "(defaulted)",
        actual: actualName || "(not observed)",
        preview: previewName || "(empty)",
        note: "Preview name should map directly to created Item name."
      },
      {
        key: "description",
        label: "Description summary mapping",
        status: compareValue(requestedDescription, actualDescription),
        requested: requestedDescription ? `${requestedDescription.length} chars requested` : "defaulted description",
        actual: actualDescription ? `${actualDescription.length} chars observed` : "(not observed)",
        preview: toNonEmptyString(preview?.summary) || "(empty)",
        note: "Conservative check compares requested/observed HTML string."
      },
      {
        key: "classification",
        label: "Type profile cluster",
        status:
          compareValue(requestedType, actualType) === "materialized" &&
          compareValue(requestedCategory, actualCategory) === "materialized" &&
          compareValue(requestedIdentifier, actualIdentifier) === "materialized"
            ? "materialized"
            : item
              ? "partial"
              : "deferred-inspection",
        requested: `type=${requestedType || "(unknown)"}; category=${requestedCategory || "(default)"}; identifier=${requestedIdentifier || "(defaulted)"}`,
        actual: item
          ? `type=${actualType || "(unknown)"}; category=${actualCategory || "(unknown)"}; identifier=${actualIdentifier || "(unknown)"}`
          : "(not observed)",
        preview: `typeHint=${toNonEmptyString(preview?.typeHint) || "(empty)"}; itemCategory=${toNonEmptyString(preview?.classification?.itemCategory) || "(default)"}`
      },
      {
        key: "source",
        label: "Source details cluster",
        status: compareValue(requestedSource, actualSource),
        requested: requestedSource,
        actual: item ? actualSource : "(not observed)",
        preview: JSON.stringify({
          custom: toNonEmptyString(preview?.sourceDetails?.custom),
          book: toNonEmptyString(preview?.sourceDetails?.book),
          page: toNonEmptyString(preview?.sourceDetails?.page),
          license: toNonEmptyString(preview?.sourceDetails?.license),
          rules: toNonEmptyString(preview?.sourceDetails?.rules)
        }),
        note: "Conservative source pass-through maps preview sourceDetails into system.source."
      },
      {
        key: "module-metadata",
        label: "Module creation metadata",
        status: compareValue(requestedPathFlag, actualPathFlag),
        requested: requestedPathFlag || "(missing)",
        actual: actualPathFlag || "(not observed)",
        preview: "n/a",
        note: "Flag confirms create path lineage for this lane."
      }
    ];
  }

  function mapMaterializedFieldRows({ preview, createData, item }) {
    const rows = [];

    rows.push({
      key: "name",
      preview: toNonEmptyString(preview?.name) || "(empty)",
      requested: toNonEmptyString(createData?.name) || "(defaulted)",
      actual: toNonEmptyString(item?.name) || "(unknown)",
      status: item?.name ? "materialized" : "unknown"
    });

    rows.push({
      key: "type",
      preview: toNonEmptyString(preview?.typeHint) || "(empty)",
      requested: toNonEmptyString(createData?.type) || "(defaulted)",
      actual: toNonEmptyString(item?.type) || "(unknown)",
      status: item?.type ? "materialized" : "unknown"
    });

    rows.push({
      key: "summary -> system.description.value",
      preview: toNonEmptyString(preview?.summary) || "(empty)",
      requested: toNonEmptyString(createData?.system?.description?.value) || "(defaulted)",
      actual: item?.system?.description?.value ? "description present" : "not inspected",
      status: createData?.system?.description?.value ? "materialized" : "unknown"
    });

    rows.push({
      key: "classification",
      preview: `typeHint=${toNonEmptyString(preview?.typeHint) || "(empty)"}; itemCategory=${toNonEmptyString(preview?.classification?.itemCategory) || "(default)"}`,
      requested: `type=${toNonEmptyString(createData?.type) || "(unknown)"}; system.type.value=${toNonEmptyString(createData?.system?.type?.value)}; system.identifier=${toNonEmptyString(createData?.system?.identifier) || "(defaulted)"}`,
      actual: item
        ? `type=${toNonEmptyString(item?.type) || "(unknown)"}; system.type.value=${toNonEmptyString(item?.system?.type?.value) || "(unknown)"}; system.identifier=${toNonEmptyString(item?.system?.identifier) || "(unknown)"}`
        : "not inspected",
      status: item ? "materialized" : "unknown"
    });

    rows.push({
      key: "source details",
      preview: JSON.stringify({
        custom: toNonEmptyString(preview?.sourceDetails?.custom),
        book: toNonEmptyString(preview?.sourceDetails?.book),
        page: toNonEmptyString(preview?.sourceDetails?.page),
        license: toNonEmptyString(preview?.sourceDetails?.license),
        rules: toNonEmptyString(preview?.sourceDetails?.rules)
      }),
      requested: JSON.stringify({
        custom: toNonEmptyString(createData?.system?.source?.custom),
        book: toNonEmptyString(createData?.system?.source?.book),
        page: toNonEmptyString(createData?.system?.source?.page),
        license: toNonEmptyString(createData?.system?.source?.license),
        rules: toNonEmptyString(createData?.system?.source?.rules)
      }),
      actual: item
        ? JSON.stringify({
            custom: toNonEmptyString(item?.system?.source?.custom),
            book: toNonEmptyString(item?.system?.source?.book),
            page: toNonEmptyString(item?.system?.source?.page),
            license: toNonEmptyString(item?.system?.source?.license),
            rules: toNonEmptyString(item?.system?.source?.rules)
          })
        : "not inspected",
      status: item ? "materialized" : "unknown"
    });

    rows.push({
      key: "module creation metadata",
      preview: "n/a",
      requested: toNonEmptyString(createData?.flags?.[globalThis.SWF?.MODULE_ID]?.itemBuilderPath) || "(missing)",
      actual: item ? "captured in module flag payload" : "not inspected",
      status: createData?.flags?.[globalThis.SWF?.MODULE_ID]?.itemBuilderPath ? "materialized" : "deferred-inspection"
    });

    return rows;
  }

  function buildItemPostCreateInspection({ preview = {}, result = {} } = {}) {
    const success = result?.ok === true;
    const item = success ? result.item ?? null : null;
    const createData = result?.createData ?? null;
    const validation = result?.validation ?? null;

    const deferredClusters = [
      "system.activities",
      "system.uses",
      "system.armor",
      "system.damage",
      "effects automation",
      "cross-document references",
      "ownership and containers"
    ];

    const clusterComparisons = buildClusterComparisonRows({ preview, createData, item });
    const materializedClusters = success
      ? clusterComparisons.filter((cluster) => cluster.status === "materialized").map((cluster) => cluster.label)
      : [];

    const warnings = [];
    if (!success) warnings.push(result?.errorMessage || "Item creation did not complete.");
    if (validation && !validation.ok) warnings.push(...toArray(validation.errors));
    if (validation?.ok && Array.isArray(validation.warnings) && validation.warnings.length > 0) {
      warnings.push(...validation.warnings);
    }
    if (success) {
      const mismatchRows = clusterComparisons.filter((cluster) =>
        ["mismatch", "requested-not-observed", "partial"].includes(cluster.status)
      );
      mismatchRows.forEach((cluster) => warnings.push(`${cluster.label} needs manual review (${cluster.status}).`));
    }
    warnings.push("Inspection is conservative: no deep diff is performed against full dnd5e item system defaults.");

    const notes = [
      "This inspection reports one creation attempt from the current Item preview state.",
      "Staged Item lane trace: authoring model -> preview shaping -> validation -> materialization -> post-create inspection.",
      "Only one equipment/loot create path is enabled in this slice."
    ];

    const traceSummary = {
      attempted: clusterComparisons.length,
      materialized: clusterComparisons.filter((cluster) => cluster.status === "materialized").length,
      reviewNeeded: clusterComparisons.filter((cluster) =>
        ["mismatch", "requested-not-observed", "partial"].includes(cluster.status)
      ).length,
      deferredInspection: clusterComparisons.filter((cluster) => cluster.status === "deferred-inspection").length
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
            uuid: toNonEmptyString(item?.uuid) || ""
          }
        : null,
      materializedClusters,
      deferredClusters,
      traceSummary,
      clusterComparisons,
      fieldMapping: mapMaterializedFieldRows({ preview, createData, item }),
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
      compareValue,
      getModuleFlagValue,
      buildClusterComparisonRows,
      mapMaterializedFieldRows
    }
  };
})();
