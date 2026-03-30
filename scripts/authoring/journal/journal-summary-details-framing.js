/**
 * Journal summary/details framing helpers.
 *
 * Scope: preset-aware labels and rows built from existing journal preview fields only.
 */
(() => {
  const { journalPresetDefinitions } = globalThis.SWF;

  function toNonEmptyString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  const DEFAULT_FRAME = Object.freeze({
    frameTitle: "Journal Summary and Details",
    identityLabel: "Journal Identity",
    summaryLabel: "Summary",
    detailsLabel: "Core Details",
    detailsEmptyText: "No core details were provided."
  });

  const PRESET_FRAMES = Object.freeze({
    "lore-entry": Object.freeze({
      frameTitle: "Lore Entry Summary and Details",
      identityLabel: "Lore Entry",
      summaryLabel: "Lore Summary",
      detailsLabel: "Lore Details"
    }),
    "npc-profile": Object.freeze({
      frameTitle: "NPC Profile Summary and Details",
      identityLabel: "NPC Profile",
      summaryLabel: "Table Role Summary",
      detailsLabel: "NPC Core Details"
    }),
    "quest-brief": Object.freeze({
      frameTitle: "Quest/Mission Summary and Details",
      identityLabel: "Quest/Mission",
      summaryLabel: "Objective Summary",
      detailsLabel: "Mission Core Details"
    })
  });

  function getSummaryDetailsFrameDefinition(presetKey) {
    const normalizedPresetKey = toNonEmptyString(presetKey);
    return Object.freeze({
      ...DEFAULT_FRAME,
      ...(PRESET_FRAMES[normalizedPresetKey] ?? {})
    });
  }

  function mapNotesToDetailRows(notes) {
    if (!Array.isArray(notes)) return Object.freeze([]);

    const rows = notes
      .map((note) => toNonEmptyString(note))
      .filter(Boolean)
      .map((line, index) => {
        const labelMatch = line.match(/^([^:]{1,80}):\s*(.+)$/u);
        if (!labelMatch) {
          return Object.freeze({
            label: `Detail ${index + 1}`,
            value: line
          });
        }

        const label = toNonEmptyString(labelMatch[1]) || `Detail ${index + 1}`;
        const value = toNonEmptyString(labelMatch[2]) || line;
        return Object.freeze({ label, value });
      });

    return Object.freeze(rows);
  }

  function buildSummaryDetailsFrameFromPreview(journalPreview = {}) {
    const preset = journalPresetDefinitions.getJournalPresetByKey(journalPreview?.preset?.key);
    const frame = getSummaryDetailsFrameDefinition(preset.key);
    const name = toNonEmptyString(journalPreview?.name);
    const summary = toNonEmptyString(journalPreview?.summary);
    const detailRows = mapNotesToDetailRows(journalPreview?.notes);

    return Object.freeze({
      presetKey: preset.key,
      presetLabel: preset.label,
      frameTitle: frame.frameTitle,
      identityLabel: frame.identityLabel,
      identityValue: name || "(unnamed journal draft)",
      summaryLabel: frame.summaryLabel,
      summaryValue: summary || "No summary provided.",
      detailsLabel: frame.detailsLabel,
      detailsEmptyText: frame.detailsEmptyText,
      detailRows,
      detailCount: detailRows.length
    });
  }

  globalThis.SWF.journalSummaryDetailsFraming = {
    getSummaryDetailsFrameDefinition,
    buildSummaryDetailsFrameFromPreview,
    INTERNALS: {
      DEFAULT_FRAME,
      PRESET_FRAMES,
      toNonEmptyString,
      mapNotesToDetailRows
    }
  };
})();
