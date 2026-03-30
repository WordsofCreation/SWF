/**
 * Post-creation inspection model for the Item builder lane.
 *
 * Scope: conservative GM-facing trust layer for one feat-only Item creation attempt.
 */
(() => {
  function toNonEmptyString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function toArray(values) {
    return Array.isArray(values) ? values.filter(Boolean) : [];
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
      preview: `featSubtype=${toNonEmptyString(preview?.classification?.featSubtype) || "(default)"}; requirements=${toNonEmptyString(preview?.classification?.requirements) || "(empty)"}`,
      requested: `system.type.value=${toNonEmptyString(createData?.system?.type?.value)}; system.type.subtype=${toNonEmptyString(createData?.system?.type?.subtype)}; system.requirements=${toNonEmptyString(createData?.system?.requirements) || "(empty)"}`,
      actual: item
        ? `system.type.value=${toNonEmptyString(item?.system?.type?.value) || toNonEmptyString(item?.type) || "(unknown)"}; system.type.subtype=${toNonEmptyString(item?.system?.type?.subtype) || "(unknown)"}; system.requirements=${toNonEmptyString(item?.system?.requirements) || "(empty)"}`
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
      "system.advancement",
      "effects automation",
      "cross-document references"
    ];

    const materializedClusters = success
      ? ["name", "item type", "description summary mapping", "classification cluster", "module create metadata"]
      : [];

    const warnings = [];
    if (!success) warnings.push(result?.errorMessage || "Item creation did not complete.");
    if (validation && !validation.ok) warnings.push(...toArray(validation.errors));
    if (validation?.ok && Array.isArray(validation.warnings) && validation.warnings.length > 0) {
      warnings.push(...validation.warnings);
    }
    warnings.push("Inspection is conservative: no deep diff is performed against full dnd5e item system defaults.");

    const notes = [
      "This inspection reports one creation attempt from the current Item preview state.",
      "Staged Item lane trace: authoring model -> preview shaping -> validation -> materialization -> post-create inspection.",
      "Only one feat-only create path is enabled in this slice."
    ];

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
      mapMaterializedFieldRows
    }
  };
})();
