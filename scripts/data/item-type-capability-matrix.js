/**
 * Reference capability matrix for dnd5e Item document types shown in the Item creation UI.
 *
 * This module is descriptive only and intentionally does not create documents.
 */
(() => {
  const IMAGE_ITEM_TYPES = Object.freeze([
    "background",
    "class",
    "consumable",
    "container",
    "equipment",
    "facility",
    "feat",
    "loot",
    "species",
    "spell",
    "subclass",
    "tattoo"
  ]);

  const CAPABILITY_MATRIX = Object.freeze({
    background: Object.freeze({
      itemType: "background",
      hasLocalVerticalSlice: false,
      repositoryExamples: Object.freeze([]),
      notes: "No SWF slice yet. Reference against dnd5e background pack examples before adding content."
    }),
    class: Object.freeze({
      itemType: "class",
      hasLocalVerticalSlice: true,
      repositoryExamples: Object.freeze(["packs/_source/swf-items/swf-class-vanguard.yml"]),
      notes: "Initial SWF class slice exists and should remain aligned to dnd5e class structure."
    }),
    consumable: Object.freeze({
      itemType: "consumable",
      hasLocalVerticalSlice: true,
      repositoryExamples: Object.freeze(["packs/_source/swf-items/swf-restorative-tonic.yml"]),
      notes: "Initial SWF consumable slice exists; activity and uses patterns should follow dnd5e analogs."
    }),
    container: Object.freeze({
      itemType: "container",
      hasLocalVerticalSlice: false,
      repositoryExamples: Object.freeze([]),
      notes: "No SWF slice yet. Start with a simple storage-only baseline when introduced."
    }),
    equipment: Object.freeze({
      itemType: "equipment",
      hasLocalVerticalSlice: false,
      repositoryExamples: Object.freeze([]),
      notes: "No SWF slice yet. Favor passive-effects baseline before active toggles."
    }),
    facility: Object.freeze({
      itemType: "facility",
      hasLocalVerticalSlice: false,
      repositoryExamples: Object.freeze([]),
      notes: "No SWF slice yet. Confirm Foundry v13 + current dnd5e facility patterns before implementation."
    }),
    feat: Object.freeze({
      itemType: "feat",
      hasLocalVerticalSlice: true,
      repositoryExamples: Object.freeze([
        "packs/_source/swf-items/swf-feature-guardian-posture.yml",
        "packs/_source/swf-items/swf-second-breath.yml"
      ]),
      notes: "SWF features currently map to dnd5e feat documents; keep classification/provenance explicit."
    }),
    loot: Object.freeze({
      itemType: "loot",
      hasLocalVerticalSlice: false,
      repositoryExamples: Object.freeze([]),
      notes: "No SWF slice yet. Use non-activatable economic inventory baseline first."
    }),
    species: Object.freeze({
      itemType: "species",
      hasLocalVerticalSlice: false,
      repositoryExamples: Object.freeze([]),
      notes: "No SWF slice yet. Treat advancement links as required reference-first work."
    }),
    spell: Object.freeze({
      itemType: "spell",
      hasLocalVerticalSlice: false,
      repositoryExamples: Object.freeze([]),
      notes: "No SWF slice yet. Use one low-complexity spell slice before scaling and variants."
    }),
    subclass: Object.freeze({
      itemType: "subclass",
      hasLocalVerticalSlice: true,
      repositoryExamples: Object.freeze(["packs/_source/swf-items/swf-subclass-vanguard-guardian.yml"]),
      notes: "Initial SWF subclass slice exists and should stay linked to owning class identifier patterns."
    }),
    tattoo: Object.freeze({
      itemType: "tattoo",
      hasLocalVerticalSlice: false,
      repositoryExamples: Object.freeze([]),
      notes: "No SWF slice yet. Validate current dnd5e tattoo schema usage before adding any content."
    })
  });

  function getCapability(itemType) {
    if (typeof itemType !== "string") return null;
    const normalized = itemType.trim().toLowerCase();
    const entry = CAPABILITY_MATRIX[normalized];
    if (!entry) return null;
    return {
      itemType: entry.itemType,
      hasLocalVerticalSlice: entry.hasLocalVerticalSlice,
      repositoryExamples: [...entry.repositoryExamples],
      notes: entry.notes
    };
  }

  function getAllCapabilities() {
    return IMAGE_ITEM_TYPES.map((itemType) => getCapability(itemType));
  }

  function getCoverageSummary() {
    const all = getAllCapabilities();
    const withSlice = all.filter((entry) => entry.hasLocalVerticalSlice).length;
    return {
      totalTypes: all.length,
      localSliceCount: withSlice,
      missingSliceCount: all.length - withSlice,
      percentCovered: Number(((withSlice / all.length) * 100).toFixed(1))
    };
  }

  globalThis.SWF.itemTypeCapabilityMatrix = {
    IMAGE_ITEM_TYPES,
    getCapability,
    getAllCapabilities,
    getCoverageSummary
  };
})();
