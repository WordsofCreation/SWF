/**
 * Journal preset-specific section structure helpers.
 *
 * Scope: tiny preset-aware order/label mapping for overview/details/references pages.
 */
(() => {
  const { journalPresetDefinitions } = globalThis.SWF;

  const SECTION_KEYS = Object.freeze({
    OVERVIEW: "overview",
    DETAILS: "details",
    REFERENCES: "references"
  });

  const DEFAULT_SECTION_ORDER = Object.freeze([
    SECTION_KEYS.OVERVIEW,
    SECTION_KEYS.DETAILS,
    SECTION_KEYS.REFERENCES
  ]);

  const PRESET_SECTION_ORDER = Object.freeze({
    "lore-entry": DEFAULT_SECTION_ORDER,
    "npc-profile": Object.freeze([SECTION_KEYS.OVERVIEW, SECTION_KEYS.REFERENCES, SECTION_KEYS.DETAILS]),
    "quest-brief": DEFAULT_SECTION_ORDER
  });

  const PRESET_SECTION_LABELS = Object.freeze({
    "lore-entry": Object.freeze({
      [SECTION_KEYS.OVERVIEW]: "Lore Overview",
      [SECTION_KEYS.DETAILS]: "Lore Details",
      [SECTION_KEYS.REFERENCES]: "Deferred References"
    }),
    "npc-profile": Object.freeze({
      [SECTION_KEYS.OVERVIEW]: "Profile Overview",
      [SECTION_KEYS.DETAILS]: "Profile Details",
      [SECTION_KEYS.REFERENCES]: "Related Entities"
    }),
    "quest-brief": Object.freeze({
      [SECTION_KEYS.OVERVIEW]: "Mission Brief",
      [SECTION_KEYS.DETAILS]: "Objectives and Details",
      [SECTION_KEYS.REFERENCES]: "Involved References"
    })
  });

  const PRESET_SECTION_INTENT_NOTES = Object.freeze({
    "lore-entry": Object.freeze({
      [SECTION_KEYS.OVERVIEW]: "Lead with world-facing context and significance.",
      [SECTION_KEYS.DETAILS]: "Capture clarifying bullet details for the GM.",
      [SECTION_KEYS.REFERENCES]: "Keep entity references descriptive and deferred."
    }),
    "npc-profile": Object.freeze({
      [SECTION_KEYS.OVERVIEW]: "Anchor the NPC identity and table role first.",
      [SECTION_KEYS.REFERENCES]: "Surface involved entities before deeper portrayal notes.",
      [SECTION_KEYS.DETAILS]: "Preserve behavioral and motivation details as supporting context."
    }),
    "quest-brief": Object.freeze({
      [SECTION_KEYS.OVERVIEW]: "State the immediate objective and call to action.",
      [SECTION_KEYS.DETAILS]: "List constraints and completion checkpoints.",
      [SECTION_KEYS.REFERENCES]: "Track involved actors/items as deferred references."
    })
  });

  function toNonEmptyString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function getOrderForPreset(presetKey) {
    return PRESET_SECTION_ORDER[presetKey] ?? DEFAULT_SECTION_ORDER;
  }

  function getLabelsForPreset(presetKey) {
    return PRESET_SECTION_LABELS[presetKey] ?? {};
  }

  function getIntentNotesForPreset(presetKey) {
    return PRESET_SECTION_INTENT_NOTES[presetKey] ?? {};
  }

  function toSectionLabel(sectionKey, preset, presetLabels) {
    const explicitLabel = toNonEmptyString(presetLabels?.[sectionKey]);
    if (explicitLabel) return explicitLabel;

    if (sectionKey === SECTION_KEYS.OVERVIEW) return "Overview";
    if (sectionKey === SECTION_KEYS.DETAILS) return "Details";
    return "Deferred References";
  }

  function toSectionPageName(sectionKey, preset) {
    if (sectionKey === SECTION_KEYS.OVERVIEW) {
      return toNonEmptyString(preset?.overviewPageName) || "Overview";
    }

    if (sectionKey === SECTION_KEYS.DETAILS) {
      return toNonEmptyString(preset?.detailsPageName) || "Details";
    }

    return toNonEmptyString(preset?.referencePageName) || "Deferred References";
  }

  function shouldIncludeSection(sectionKey, options = {}) {
    if (sectionKey === SECTION_KEYS.OVERVIEW) return true;
    if (sectionKey === SECTION_KEYS.DETAILS) return options.hasDetailsContent === true;
    if (sectionKey === SECTION_KEYS.REFERENCES) return options.hasReferenceContent === true;
    return false;
  }

  function buildJournalSectionPlanFromPreview(journalPreview = {}, options = {}) {
    const preset = journalPresetDefinitions.getJournalPresetByKey(journalPreview?.preset?.key);
    const order = getOrderForPreset(preset.key);
    const labels = getLabelsForPreset(preset.key);
    const intentNotes = getIntentNotesForPreset(preset.key);

    return Object.freeze(
      order.map((sectionKey, index) => {
        const pageName = toSectionPageName(sectionKey, journalPreview?.preset ?? preset);
        const label = toSectionLabel(sectionKey, journalPreview?.preset ?? preset, labels);
        const intentNote = toNonEmptyString(intentNotes?.[sectionKey]);
        const included = shouldIncludeSection(sectionKey, options);

        return Object.freeze({
          key: sectionKey,
          order: index + 1,
          label,
          pageName,
          included,
          conditional: sectionKey !== SECTION_KEYS.OVERVIEW,
          intentNote
        });
      })
    );
  }

  function buildIncludedJournalSectionPlanFromPreview(journalPreview = {}, options = {}) {
    const allSections = buildJournalSectionPlanFromPreview(journalPreview, options);
    return Object.freeze(allSections.filter((section) => section.included));
  }

  globalThis.SWF.journalSectionStructure = {
    SECTION_KEYS,
    buildJournalSectionPlanFromPreview,
    buildIncludedJournalSectionPlanFromPreview,
    INTERNALS: {
      DEFAULT_SECTION_ORDER,
      PRESET_SECTION_ORDER,
      PRESET_SECTION_LABELS,
      PRESET_SECTION_INTENT_NOTES,
      toNonEmptyString,
      getOrderForPreset,
      getLabelsForPreset,
      getIntentNotesForPreset,
      toSectionLabel,
      toSectionPageName,
      shouldIncludeSection
    }
  };
})();
