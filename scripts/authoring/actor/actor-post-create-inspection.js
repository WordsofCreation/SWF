/**
 * Post-creation inspection model for the Actor builder lane.
 *
 * Scope: conservative GM-facing trust layer for one npc-only Actor creation attempt.
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

  function buildClusterComparisonRows({ preview, createData, actor }) {
    const requestedName = toNonEmptyString(createData?.name);
    const actualName = toNonEmptyString(actor?.name);

    const requestedType = toNonEmptyString(createData?.type);
    const actualType = toNonEmptyString(actor?.type);

    const requestedImg = toNonEmptyString(createData?.img);
    const actualImg = toNonEmptyString(actor?.img);

    const requestedPathFlag = getModuleFlagValue(createData, "actorBuilderPath");
    const actualPathFlag = getModuleFlagValue(actor, "actorBuilderPath");

    return [
      {
        key: "identity",
        label: "Identity",
        status: compareValue(requestedName, actualName),
        requested: requestedName || "(defaulted)",
        actual: actualName || "(not observed)",
        preview: toNonEmptyString(preview?.name) || "(empty)",
        note: "Preview name should map directly to created Actor name."
      },
      {
        key: "type",
        label: "Actor type",
        status: compareValue(requestedType, actualType),
        requested: requestedType || "(defaulted)",
        actual: actualType || "(not observed)",
        preview: toNonEmptyString(preview?.typeHint) || "(empty)",
        note: "Only npc actor type is in scope for this slice."
      },
      {
        key: "image",
        label: "Portrait image",
        status: compareValue(requestedImg, actualImg),
        requested: requestedImg || "(defaulted)",
        actual: actualImg || "(not observed)",
        preview: toNonEmptyString(preview?.img) || "(empty)",
        note: "Conservative check verifies top-level Actor img mapping only."
      },
      {
        key: "module-metadata",
        label: "Module creation metadata",
        status: compareValue(requestedPathFlag, actualPathFlag),
        requested: requestedPathFlag || "(missing)",
        actual: actualPathFlag || "(not observed)",
        preview: "n/a",
        note: "Flag confirms npc creation path lineage for this lane."
      }
    ];
  }

  function mapMaterializedFieldRows({ preview, createData, actor }) {
    return [
      {
        key: "name",
        preview: toNonEmptyString(preview?.name) || "(empty)",
        requested: toNonEmptyString(createData?.name) || "(defaulted)",
        actual: toNonEmptyString(actor?.name) || "(unknown)",
        status: actor?.name ? "materialized" : "unknown"
      },
      {
        key: "type",
        preview: toNonEmptyString(preview?.typeHint) || "(empty)",
        requested: toNonEmptyString(createData?.type) || "(defaulted)",
        actual: toNonEmptyString(actor?.type) || "(unknown)",
        status: actor?.type ? "materialized" : "unknown"
      },
      {
        key: "img",
        preview: toNonEmptyString(preview?.img) || "(empty)",
        requested: toNonEmptyString(createData?.img) || "(defaulted)",
        actual: toNonEmptyString(actor?.img) || "(unknown)",
        status: actor?.img ? "materialized" : "unknown"
      },
      {
        key: "module creation metadata",
        preview: "n/a",
        requested: toNonEmptyString(createData?.flags?.[globalThis.SWF?.MODULE_ID]?.actorBuilderPath) || "(missing)",
        actual: actor ? "captured in module flag payload" : "not inspected",
        status: createData?.flags?.[globalThis.SWF?.MODULE_ID]?.actorBuilderPath ? "materialized" : "deferred-inspection"
      }
    ];
  }

  function buildActorPostCreateInspection({ preview = {}, result = {} } = {}) {
    const success = result?.ok === true;
    const actor = success ? result.actor ?? null : null;
    const createData = result?.createData ?? null;
    const validation = result?.validation ?? null;

    const deferredClusters = [
      "dnd5e.system.attributes",
      "dnd5e.system.details",
      "embedded items/features",
      "prototype token automation",
      "active effects"
    ];

    const clusterComparisons = buildClusterComparisonRows({ preview, createData, actor });
    const materializedClusters = success
      ? clusterComparisons.filter((cluster) => cluster.status === "materialized").map((cluster) => cluster.label)
      : [];

    const warnings = [];
    if (!success) warnings.push(result?.errorMessage || "Actor creation did not complete.");
    if (validation && !validation.ok) warnings.push(...toArray(validation.errors));
    if (validation?.ok && Array.isArray(validation.warnings) && validation.warnings.length > 0) {
      warnings.push(...validation.warnings);
    }
    if (success) {
      const mismatchRows = clusterComparisons.filter((cluster) =>
        ["mismatch", "requested-not-observed"].includes(cluster.status)
      );
      mismatchRows.forEach((cluster) => warnings.push(`${cluster.label} needs manual review (${cluster.status}).`));
    }
    warnings.push("Inspection is conservative: no deep diff is performed against full dnd5e actor system defaults.");

    const notes = [
      "This inspection reports one creation attempt from the current Actor preview/draft state.",
      "Staged Actor lane trace: authoring model -> preview shaping -> validation -> materialization -> post-create inspection.",
      "Only one npc-only create path is enabled in this slice."
    ];

    const traceSummary = {
      attempted: clusterComparisons.length,
      materialized: clusterComparisons.filter((cluster) => cluster.status === "materialized").length,
      reviewNeeded: clusterComparisons.filter((cluster) =>
        ["mismatch", "requested-not-observed"].includes(cluster.status)
      ).length,
      deferredInspection: clusterComparisons.filter((cluster) => cluster.status === "deferred-inspection").length
    };

    return {
      status: {
        ok: success,
        label: success ? "Creation succeeded" : "Creation failed",
        message: success ? result?.statusMessage || "Actor created." : result?.errorMessage || "Actor creation failed."
      },
      createdActor: success
        ? {
            id: toNonEmptyString(actor?.id) || "(unknown)",
            name: toNonEmptyString(actor?.name) || toNonEmptyString(createData?.name) || "(unnamed)",
            type: toNonEmptyString(actor?.type) || toNonEmptyString(createData?.type) || "(unknown)",
            uuid: toNonEmptyString(actor?.uuid) || ""
          }
        : null,
      materializedClusters,
      deferredClusters,
      traceSummary,
      clusterComparisons,
      fieldMapping: mapMaterializedFieldRows({ preview, createData, actor }),
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

  globalThis.SWF.actorPostCreateInspection = {
    buildActorPostCreateInspection,
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
