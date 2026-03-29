/**
 * Read-only canonical field inventory by manifest type.
 *
 * This layer defines the current canonical shape expectations used by this module,
 * without introducing conversion or persistence behavior.
 */
(() => {
  const { manifestValidation } = globalThis.SWF;

  function createField({ field, required, category, notes = "" }) {
    return Object.freeze({ field, required, category, notes });
  }

  function cloneField(entry) {
    return {
      field: entry.field,
      required: entry.required,
      category: entry.category,
      notes: entry.notes
    };
  }

  function normalizeType(type) {
    return typeof type === "string" ? type.trim().toLowerCase() : "";
  }

  const COMMON_FIELDS = Object.freeze(
    (manifestValidation?.COMMON_REQUIRED_FIELDS ?? []).map((field) => createField({
      field,
      required: true,
      category: "common",
      notes: "Shared canonical manifest metadata."
    }))
  );

  const TYPE_FIELD_NOTES = Object.freeze({
    feature: Object.freeze({
      source: "Module/source provenance marker used by current feature manifests."
    }),
    feat: Object.freeze({
      source: "Module/source provenance marker used by current feat manifests."
    }),
    subclass: Object.freeze({
      classIdentifier: "Current subclass link key used to reference the parent class."
    })
  });

  const TYPE_INVENTORY = Object.freeze(
    Object.fromEntries(
      Object.entries(manifestValidation?.TYPE_REQUIRED_FIELDS ?? {}).map(([type, fields]) => [
        type,
        Object.freeze(fields.map((field) => createField({
          field,
          required: true,
          category: "type-specific",
          notes: TYPE_FIELD_NOTES[type]?.[field] ?? "Type-specific canonical field."
        })))
      ])
    )
  );

  // Intentionally excluded from canonical inventory for now:
  // `example` appears only in canonical sample manifests and is treated as fixture metadata.
  // It is not currently required for runtime starter manifests or validation.

  function getCommonCanonicalFields() {
    return COMMON_FIELDS.map(cloneField);
  }

  function getTypeSpecificCanonicalFields(type) {
    const normalizedType = normalizeType(type);
    const fields = TYPE_INVENTORY[normalizedType] ?? [];
    return fields.map(cloneField);
  }

  function getCanonicalFields(type) {
    const normalizedType = normalizeType(type);
    if (!normalizedType || !Object.hasOwn(TYPE_INVENTORY, normalizedType)) {
      return [];
    }

    return [
      ...COMMON_FIELDS.map(cloneField),
      ...TYPE_INVENTORY[normalizedType].map(cloneField)
    ];
  }

  function hasCanonicalField(type, field) {
    const normalizedField = typeof field === "string" ? field.trim() : "";
    if (!normalizedField) return false;
    return getCanonicalFields(type).some((entry) => entry.field === normalizedField);
  }

  function countCanonicalFields(type) {
    return getCanonicalFields(type).length;
  }

  function getSupportedTypes() {
    return Object.keys(TYPE_INVENTORY);
  }

  function getAllCanonicalFieldInventories() {
    return Object.fromEntries(
      getSupportedTypes().map((type) => [
        type,
        {
          type,
          commonFields: getCommonCanonicalFields(),
          typeSpecificFields: getTypeSpecificCanonicalFields(type),
          orderedFields: getCanonicalFields(type)
        }
      ])
    );
  }

  globalThis.SWF.canonicalFieldInventory = {
    getSupportedTypes,
    getCommonCanonicalFields,
    getTypeSpecificCanonicalFields,
    getCanonicalFields,
    hasCanonicalField,
    countCanonicalFields,
    getAllCanonicalFieldInventories
  };
})();
