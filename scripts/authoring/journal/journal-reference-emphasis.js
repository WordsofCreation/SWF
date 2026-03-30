/**
 * Preset-specific Journal reference emphasis mapping.
 *
 * Scope: presentation-only grouping/ordering/labeling for shared references.
 * Shared reference object shape remains unchanged.
 */
(() => {
  function toNonEmptyString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  const DEFAULT_REFERENCE_EMPHASIS_KEY = "lore-entry";

  const JOURNAL_REFERENCE_EMPHASIS = Object.freeze({
    "lore-entry": Object.freeze({
      key: "lore-entry",
      primaryGroupLabel: "Core Lore Mentions",
      secondaryGroupLabel: "Supporting Mentions",
      primaryKinds: Object.freeze(["actor"]),
      secondaryKinds: Object.freeze(["item"]),
      orderedKinds: Object.freeze(["actor", "item"]),
      note: "Lore entries keep characters/factions first, with related items listed as supporting context."
    }),
    "npc-profile": Object.freeze({
      key: "npc-profile",
      primaryGroupLabel: "Primary NPC Connections",
      secondaryGroupLabel: "Associated Features and Gear",
      primaryKinds: Object.freeze(["actor"]),
      secondaryKinds: Object.freeze(["item"]),
      orderedKinds: Object.freeze(["actor", "item"]),
      note: "NPC profiles foreground actor relationships, then list related items/features as secondary."
    }),
    "quest-brief": Object.freeze({
      key: "quest-brief",
      primaryGroupLabel: "Primary Mission Assets",
      secondaryGroupLabel: "Supporting Contacts",
      primaryKinds: Object.freeze(["item"]),
      secondaryKinds: Object.freeze(["actor"]),
      orderedKinds: Object.freeze(["item", "actor"]),
      note: "Quest briefs emphasize objective-facing items first, followed by involved contacts."
    })
  });

  function getJournalReferenceEmphasisByPresetKey(key) {
    const normalizedKey = toNonEmptyString(key);
    return JOURNAL_REFERENCE_EMPHASIS[normalizedKey] ?? JOURNAL_REFERENCE_EMPHASIS[DEFAULT_REFERENCE_EMPHASIS_KEY];
  }

  globalThis.SWF.journalReferenceEmphasis = {
    DEFAULT_REFERENCE_EMPHASIS_KEY,
    getJournalReferenceEmphasisByPresetKey,
    INTERNALS: {
      JOURNAL_REFERENCE_EMPHASIS,
      toNonEmptyString
    }
  };
})();
