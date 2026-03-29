/**
 * Read-only reference map from manifest types to intended future Foundry/dnd5e targets.
 * This layer is descriptive only; it does not create, import, or mutate documents.
 */
(() => {
  const TARGET_MAP = Object.freeze({
    feat: Object.freeze({
      manifestType: "feat",
      foundryDocumentType: "Item",
      dnd5eDocumentSubtype: "feat",
      intendedCompendiumKind: "Item",
      notes: Object.freeze([
        "Planned to align with dnd5e feat item data shape.",
        "No document creation is performed in this layer."
      ])
    }),
    feature: Object.freeze({
      manifestType: "feature",
      foundryDocumentType: "Item",
      dnd5eDocumentSubtype: "feat",
      intendedCompendiumKind: "Item",
      notes: Object.freeze([
        "Current provisional target matches dnd5e class feature usage via Item/feat.",
        "Kept explicit as provisional until conversion workflow is finalized."
      ])
    }),
    subclass: Object.freeze({
      manifestType: "subclass",
      foundryDocumentType: "(provisional)",
      dnd5eDocumentSubtype: "(provisional)",
      intendedCompendiumKind: "(provisional)",
      notes: Object.freeze([
        "Future subclass conversion target is intentionally left unsettled in this slice.",
        "No schema or import assumptions are made yet."
      ])
    })
  });

  function normalizeType(type) {
    return typeof type === "string" ? type.trim().toLowerCase() : "";
  }

  function toTargetInfo(target) {
    if (!target) return null;
    return {
      manifestType: target.manifestType,
      foundryDocumentType: target.foundryDocumentType,
      dnd5eDocumentSubtype: target.dnd5eDocumentSubtype,
      intendedCompendiumKind: target.intendedCompendiumKind,
      notes: [...target.notes]
    };
  }

  function getTargetInfo(type) {
    const normalizedType = normalizeType(type);
    return toTargetInfo(TARGET_MAP[normalizedType] ?? null);
  }

  function getAllTargetInfo() {
    return Object.values(TARGET_MAP).map(toTargetInfo);
  }

  globalThis.SWF.typeTargetMap = {
    getTargetInfo,
    getAllTargetInfo
  };
})();
