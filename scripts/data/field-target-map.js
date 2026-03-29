/**
 * Read-only reference notes for field-level manifest-to-target correspondence.
 * This layer is descriptive only; it does not transform data or create documents.
 */
(() => {
  const FIELD_TARGET_MAP = Object.freeze({
    feat: Object.freeze([
      Object.freeze({
        manifestField: "name",
        intendedTargetPath: "name",
        targetDocumentType: "Item (dnd5e feat)",
        status: "aligned",
        notes: "Expected to map directly to the resulting document name."
      }),
      Object.freeze({
        manifestField: "description",
        intendedTargetPath: "system.description.value",
        targetDocumentType: "Item (dnd5e feat)",
        status: "provisional",
        notes: "Likely destination for rich text; formatting and sanitization rules are intentionally undecided in this slice."
      }),
      Object.freeze({
        manifestField: "source",
        intendedTargetPath: "system.source.custom",
        targetDocumentType: "Item (dnd5e feat)",
        status: "provisional",
        notes: "Tracked as a source reference note; exact dnd5e source-shape mapping remains unsettled."
      }),
      Object.freeze({
        manifestField: "status",
        intendedTargetPath: "(module workflow metadata)",
        targetDocumentType: "SWF module manifest lifecycle",
        status: "unsettled",
        notes: "Manifest status is planning metadata and may remain module-only rather than mapped into Item system data."
      })
    ]),
    feature: Object.freeze([
      Object.freeze({
        manifestField: "name",
        intendedTargetPath: "name",
        targetDocumentType: "Item (dnd5e class feature via feat subtype)",
        status: "aligned",
        notes: "Expected to map directly to the resulting document name."
      }),
      Object.freeze({
        manifestField: "description",
        intendedTargetPath: "system.description.value",
        targetDocumentType: "Item (dnd5e class feature via feat subtype)",
        status: "provisional",
        notes: "Kept consistent with feat planning while conversion details remain intentionally deferred."
      }),
      Object.freeze({
        manifestField: "source",
        intendedTargetPath: "system.source.custom",
        targetDocumentType: "Item (dnd5e class feature via feat subtype)",
        status: "provisional",
        notes: "Current intent mirrors feat handling; exact source container may change after live schema review."
      }),
      Object.freeze({
        manifestField: "status",
        intendedTargetPath: "(module workflow metadata)",
        targetDocumentType: "SWF module manifest lifecycle",
        status: "unsettled",
        notes: "Preserved as module-side planning state with no document-field commitment yet."
      })
    ]),
    subclass: Object.freeze([
      Object.freeze({
        manifestField: "name",
        intendedTargetPath: "(provisional target path)",
        targetDocumentType: "(provisional subclass representation)",
        status: "unsettled",
        notes: "Subclass storage target is intentionally unsettled until a safe dnd5e pattern is locked in."
      }),
      Object.freeze({
        manifestField: "description",
        intendedTargetPath: "(provisional target path)",
        targetDocumentType: "(provisional subclass representation)",
        status: "unsettled",
        notes: "No schema commitment yet; this slice records planning intent only."
      }),
      Object.freeze({
        manifestField: "classIdentifier",
        intendedTargetPath: "(link to parent class reference)",
        targetDocumentType: "(provisional subclass representation)",
        status: "unsettled",
        notes: "Intended to associate a subclass manifest with a class key, but final destination field is not finalized."
      }),
      Object.freeze({
        manifestField: "status",
        intendedTargetPath: "(module workflow metadata)",
        targetDocumentType: "SWF module manifest lifecycle",
        status: "unsettled",
        notes: "Maintained as module-side planning metadata."
      })
    ])
  });

  function normalizeType(type) {
    return typeof type === "string" ? type.trim().toLowerCase() : "";
  }

  function cloneEntry(entry) {
    return {
      manifestField: entry.manifestField,
      intendedTargetPath: entry.intendedTargetPath,
      targetDocumentType: entry.targetDocumentType,
      status: entry.status,
      notes: entry.notes
    };
  }

  function getFieldMappings(type) {
    const normalizedType = normalizeType(type);
    const entries = FIELD_TARGET_MAP[normalizedType] ?? [];
    return entries.map(cloneEntry);
  }

  function getFieldMapping(type, fieldName) {
    const normalizedFieldName = typeof fieldName === "string" ? fieldName.trim() : "";
    if (!normalizedFieldName) return null;

    const mapping = getFieldMappings(type).find((entry) => entry.manifestField === normalizedFieldName);
    return mapping ?? null;
  }

  function getAllFieldMappings() {
    return Object.fromEntries(
      Object.entries(FIELD_TARGET_MAP).map(([type, entries]) => [
        type,
        entries.map(cloneEntry)
      ])
    );
  }

  globalThis.SWF.fieldTargetMap = {
    getFieldMappings,
    getFieldMapping,
    getAllFieldMappings
  };
})();
