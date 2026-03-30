/**
 * Post-creation inspection model for the Actor builder lane.
 *
 * Scope: conservative GM-facing trust layer for one npc-only Actor creation attempt.
 */
(() => {
  // Allowlist is intentionally narrow for the current npc-core-v1 slice.
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
    if (expected && !actual) return INSPECTION_OUTCOME.MISMATCH;
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

  function buildAllowlistedInspectionRows({ preview, createData, actor }) {
    const fieldAllowlist = [
      {
        key: "document.id",
        label: "Document id",
        supportLevel: "materialized",
        previewValue: "n/a",
        expectedRead: () => "",
        actualRead: ({ actor: document }) => document?.id,
        note: "Generated at creation time; compared for presence only."
      },
      {
        key: "name",
        label: "Name",
        supportLevel: "materialized",
        previewValue: toNonEmptyString(preview?.name) || "(empty)",
        expectedRead: ({ createData: requested }) => requested?.name,
        actualRead: ({ actor: document }) => document?.name
      },
      {
        key: "type",
        label: "Type",
        supportLevel: "materialized",
        previewValue: toNonEmptyString(preview?.typeHint) || "(empty)",
        expectedRead: ({ createData: requested }) => requested?.type,
        actualRead: ({ actor: document }) => document?.type
      },
      {
        key: "img",
        label: "Image",
        supportLevel: "materialized",
        previewValue: toNonEmptyString(preview?.img) || "(empty)",
        expectedRead: ({ createData: requested }) => requested?.img,
        actualRead: ({ actor: document }) => document?.img
      },
      {
        key: "folder",
        label: "Folder",
        supportLevel: "omitted",
        previewValue: "(not in actor draft slice)",
        expectedRead: () => "",
        actualRead: ({ actor: document }) => document?.folder?.id ?? document?.folder
      },
      {
        key: "system.details.biography.value",
        label: "Biography/description",
        supportLevel: "deferred",
        previewValue: "(deferred in npc-core-v1)",
        expectedRead: () => "",
        actualRead: ({ actor: document }) => document?.system?.details?.biography?.value
      },
      {
        key: "flags.swf.actorBuilderPath",
        label: "Module actor path flag",
        supportLevel: "materialized",
        previewValue: "n/a",
        expectedRead: ({ createData: requested }) => getModuleFlagValue(requested, "actorBuilderPath"),
        actualRead: ({ actor: document }) => getModuleFlagValue(document, "actorBuilderPath")
      }
    ];

    return fieldAllowlist.map((field) => {
      const expectedRead = safeReadValue(field.expectedRead, { preview, createData, actor });
      const actualRead = safeReadValue(field.actualRead, { preview, createData, actor });
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

    return [
      {
        key: "identity",
        label: "Identity",
        status: rowByKey.name?.outcome ?? INSPECTION_OUTCOME.MISMATCH,
        requested: rowByKey.name?.expected ?? "(empty/default)",
        actual: rowByKey.name?.actual ?? "(not observed)",
        preview: rowByKey.name?.preview ?? "(empty)",
        note: "Preview name should map directly to created Actor name."
      },
      {
        key: "type",
        label: "Actor type",
        status: rowByKey.type?.outcome ?? INSPECTION_OUTCOME.MISMATCH,
        requested: rowByKey.type?.expected ?? "(empty/default)",
        actual: rowByKey.type?.actual ?? "(not observed)",
        preview: rowByKey.type?.preview ?? "(empty)",
        note: "Only npc actor type is in scope for this slice."
      },
      {
        key: "image",
        label: "Portrait image",
        status: rowByKey.img?.outcome ?? INSPECTION_OUTCOME.MISMATCH,
        requested: rowByKey.img?.expected ?? "(empty/default)",
        actual: rowByKey.img?.actual ?? "(not observed)",
        preview: rowByKey.img?.preview ?? "(empty)",
        note: "Conservative check verifies top-level Actor img mapping only."
      },
      {
        key: "module-metadata",
        label: "Module creation metadata",
        status: rowByKey["flags.swf.actorBuilderPath"]?.outcome ?? INSPECTION_OUTCOME.MISMATCH,
        requested: rowByKey["flags.swf.actorBuilderPath"]?.expected ?? "(missing)",
        actual: rowByKey["flags.swf.actorBuilderPath"]?.actual ?? "(not observed)",
        preview: "n/a",
        note: "Flag confirms npc creation path lineage for this lane."
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
        key: "module actor path flag",
        preview: "n/a",
        requested: rows.find((row) => row.key === "flags.swf.actorBuilderPath")?.expected ?? "(missing)",
        actual: rows.find((row) => row.key === "flags.swf.actorBuilderPath")?.actual ?? "(not observed)",
        status:
          rows.find((row) => row.key === "flags.swf.actorBuilderPath")?.outcome ?? INSPECTION_OUTCOME.MISMATCH
      }
    ];
  }

  function buildActorPostCreateInspection({ preview = {}, result = {} } = {}) {
    const success = result?.ok === true;
    const actor = success ? result.actor ?? null : null;
    const createData = result?.createData ?? null;
    const validation = result?.validation ?? null;

    const deferredClusters = Object.freeze([
      "dnd5e.system.attributes",
      "dnd5e.system.details",
      "embedded items/features",
      "prototype token automation",
      "active effects"
    ]);

    const allowlistedRows = buildAllowlistedInspectionRows({ preview, createData, actor });
    const clusterComparisons = buildClusterComparisonRows({ rows: allowlistedRows });
    const materializedClusters = success
      ? clusterComparisons.filter((cluster) => cluster.status === INSPECTION_OUTCOME.MATCHED).map((cluster) => cluster.label)
      : [];

    const warnings = [];
    if (!success) warnings.push(result?.errorMessage || "Actor creation did not complete.");
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
    warnings.push("Inspection is conservative: no deep diff is performed against full dnd5e actor system defaults.");

    const notes = [
      "This inspection reports one creation attempt from the current Actor preview/draft state.",
      "Staged Actor lane trace: authoring model -> preview shaping -> validation -> materialization -> post-create inspection.",
      "Only one npc-only create path is enabled in this slice."
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
        message: success ? result?.statusMessage || "Actor created." : result?.errorMessage || "Actor creation failed."
      },
      createdActor: success
        ? {
            id: toNonEmptyString(actor?.id) || "(unknown)",
            name: toNonEmptyString(actor?.name) || toNonEmptyString(createData?.name) || "(unnamed)",
            type: toNonEmptyString(actor?.type) || toNonEmptyString(createData?.type) || "(unknown)",
            img: toNonEmptyString(actor?.img) || toNonEmptyString(createData?.img) || "(unknown)",
            folder: toNonEmptyString(actor?.folder?.name ?? actor?.folder) || "(none)",
            uuid: toNonEmptyString(actor?.uuid) || ""
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

  globalThis.SWF.actorPostCreateInspection = {
    buildActorPostCreateInspection,
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
