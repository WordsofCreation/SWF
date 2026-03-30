/**
 * Journal preset definitions for conservative builder initialization.
 *
 * Scope: small explicit presets that seed existing journal preview fields.
 */
(() => {
  function toNonEmptyString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  const DEFAULT_JOURNAL_PRESET_KEY = "lore-entry";

  const JOURNAL_PRESETS = Object.freeze([
    Object.freeze({
      key: "lore-entry",
      label: "Lore Entry",
      description: "General world lore with concise context and structured references.",
      summaryHint: "Summarize what this lore entry establishes for the world and why it matters.",
      nameTemplate: "Lore Entry: [Topic]",
      overviewPageName: "Overview",
      detailsPageName: "Details",
      referencePageName: "Deferred References",
      referenceBlockTitle: "Related References",
      referenceBlockSummary:
        "Balanced mention list for related actors and items. References remain descriptive and deferred.",
      notes: Object.freeze([
        "Context: State where this lore is most relevant.",
        "Current Significance: Explain why a GM might surface this entry now.",
        "Known Boundaries: Capture uncertainty, rumors, or what is intentionally unknown."
      ])
    }),
    Object.freeze({
      key: "npc-profile",
      label: "NPC Profile",
      description: "Compact NPC profile with identity, motives, and play-facing cues.",
      summaryHint: "Summarize the NPC's role at the table and immediate relevance.",
      nameTemplate: "NPC Profile: [Name]",
      overviewPageName: "Profile",
      detailsPageName: "Profile Details",
      referencePageName: "Deferred References",
      referenceBlockTitle: "Related Entities and Features",
      referenceBlockSummary:
        "Entity-focused mention list for this NPC profile. References stay deferred with no created links.",
      notes: Object.freeze([
        "Identity Snapshot: Name, role, and one-sentence impression.",
        "Motivations: What this NPC wants right now.",
        "Interaction Cues: Voice, behavior, and boundaries for portrayal."
      ])
    }),
    Object.freeze({
      key: "quest-brief",
      label: "Quest/Mission Brief",
      description: "Mission-style brief with objective framing and completion checkpoints.",
      summaryHint: "Summarize the quest objective and immediate call to action.",
      nameTemplate: "Quest/Mission Brief: [Objective]",
      overviewPageName: "Brief",
      detailsPageName: "Objectives and Details",
      referencePageName: "Deferred References",
      referenceBlockTitle: "Involved Actors and Items",
      referenceBlockSummary:
        "Mission-facing mention list for involved actors and items. All links remain deferred text.",
      notes: Object.freeze([
        "Objective: The concrete success condition.",
        "Constraints: Time pressure, risks, or resource limits.",
        "Completion Signals: How the GM will know this brief is resolved."
      ])
    })
  ]);

  const JOURNAL_PRESET_MAP = Object.freeze(
    JOURNAL_PRESETS.reduce((accumulator, preset) => {
      accumulator[preset.key] = preset;
      return accumulator;
    }, {})
  );

  function getJournalPresetByKey(key) {
    const normalizedKey = toNonEmptyString(key);
    return JOURNAL_PRESET_MAP[normalizedKey] ?? JOURNAL_PRESET_MAP[DEFAULT_JOURNAL_PRESET_KEY];
  }

  function getJournalPresets() {
    return JOURNAL_PRESETS;
  }

  function applyJournalPresetToPreview(journalPreview = {}, key) {
    const preset = getJournalPresetByKey(key ?? journalPreview?.preset?.key);
    const linkedReferences = Array.isArray(journalPreview?.linkedReferences) ? journalPreview.linkedReferences : [];

    return Object.freeze({
      ...journalPreview,
      name: preset.nameTemplate,
      summary: preset.summaryHint,
      notes: Object.freeze([...preset.notes]),
      linkedReferences: Object.freeze([...linkedReferences]),
      preset: Object.freeze({
        key: preset.key,
        label: preset.label,
        description: preset.description,
        overviewPageName: preset.overviewPageName,
        detailsPageName: preset.detailsPageName,
        referencePageName: preset.referencePageName,
        referenceBlockTitle: preset.referenceBlockTitle,
        referenceBlockSummary: preset.referenceBlockSummary
      })
    });
  }

  globalThis.SWF.journalPresetDefinitions = {
    DEFAULT_JOURNAL_PRESET_KEY,
    getJournalPresets,
    getJournalPresetByKey,
    applyJournalPresetToPreview,
    INTERNALS: {
      JOURNAL_PRESETS,
      toNonEmptyString
    }
  };
})();
