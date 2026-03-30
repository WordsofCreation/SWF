/**
 * Tiny curated sample-content registry for builder-lane validation.
 *
 * Scope: additive, conservative samples only for lanes and materialization paths
 * already supported by the current module slice.
 */
(() => {
  const { referenceModel, journalPresetDefinitions } = globalThis.SWF;
  const { createReferenceModel } = referenceModel;
  const { applyJournalPresetToPreview, DEFAULT_JOURNAL_PRESET_KEY } = journalPresetDefinitions;

  function toNonEmptyString(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function clone(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function mergeRecords(base, override) {
    if (!override || typeof override !== "object" || Array.isArray(override)) return clone(override ?? base);
    const seed = base && typeof base === "object" && !Array.isArray(base) ? clone(base) : {};
    for (const [key, overrideValue] of Object.entries(override)) {
      if (Array.isArray(overrideValue)) {
        seed[key] = clone(overrideValue);
        continue;
      }

      if (overrideValue && typeof overrideValue === "object") {
        seed[key] = mergeRecords(seed[key], overrideValue);
        continue;
      }

      seed[key] = overrideValue;
    }

    return seed;
  }

  function buildLinkedReferences(referenceRows = []) {
    return Object.freeze(referenceRows.map((row) => createReferenceModel(row)));
  }

  const SAMPLE_REGISTRY = Object.freeze({
    journal: Object.freeze([
      Object.freeze({
        key: "journal-lore-vault",
        label: "Lore: Ember Vault",
        description: "Lore-entry sample with two deferred references and concise details framing.",
        presetKey: "lore-entry",
        previewOverrides: Object.freeze({
          name: "Lore Entry: Ember Vault",
          summary: "A sealed archive beneath the old observatory that local orders quietly monitor.",
          notes: Object.freeze([
            "Context: Kept under warded watch by civic archivists and temple sentries.",
            "Current Significance: A missing access sigil suggests someone already breached an outer chamber.",
            "Known Boundaries: No verified map exists for the vault's inner stacks."
          ]),
          linkedReferences: buildLinkedReferences([
            {
              kind: "actor",
              label: "Archivist Lysa Marr",
              role: "Primary witness",
              source: "swf-sample",
              status: "candidate",
              provisionalNote: "Witness profile remains a mention-only reference in this validation slice.",
              meta: { localId: "swf.actor.archivist-lysa-marr" }
            },
            {
              kind: "item",
              label: "Ember Sigil Plate",
              role: "Key object",
              source: "swf-sample",
              status: "deferred",
              provisionalNote: "Physical key representation is deferred to future item-path expansion.",
              meta: { localId: "swf.item.ember-sigil-plate" }
            }
          ])
        })
      }),
      Object.freeze({
        key: "journal-npc-quartermaster",
        label: "NPC: Quartermaster",
        description: "NPC-profile sample that exercises identity/motive notes and reference emphasis.",
        presetKey: "npc-profile",
        previewOverrides: Object.freeze({
          name: "NPC Profile: Quartermaster Reth",
          summary: "A disciplined logistics officer who controls mission issue gear and favors precise requests.",
          notes: Object.freeze([
            "Identity Snapshot: Veteran quartermaster with immaculate records and clipped speech.",
            "Motivations: Keep scarce supplies moving to reliable teams.",
            "Interaction Cues: Rewards concise plans; distrusts vague requisitions."
          ]),
          linkedReferences: buildLinkedReferences([
            {
              kind: "item",
              label: "Field Requisition Ledger",
              role: "Signature tool",
              source: "swf-sample",
              status: "candidate",
              provisionalNote: "Ledger entry remains textual in references until link-safe item handling expands.",
              meta: { localId: "swf.item.field-requisition-ledger" }
            },
            {
              kind: "journal",
              label: "Mission Brief: Night Gate",
              role: "Current assignment",
              source: "swf-sample",
              status: "candidate",
              provisionalNote: "Mission brief relation is currently descriptive only.",
              meta: { localId: "swf.journal.mission-night-gate" }
            }
          ])
        })
      }),
      Object.freeze({
        key: "journal-quest-watchfire",
        label: "Quest: Watchfire",
        description: "Quest-brief sample with objective/constraints framing and one actor reference.",
        presetKey: "quest-brief",
        previewOverrides: Object.freeze({
          name: "Quest/Mission Brief: Rekindle Watchfire",
          summary: "Reach the ridge beacon before dawn and relight it to signal safe passage.",
          notes: Object.freeze([
            "Objective: Carry ember canister to the ridge beacon and relight the watchfire.",
            "Constraints: Crosswind intensifies after midnight and narrows approach options.",
            "Completion Signals: Beacon burns steady for one watch and allied scouts answer with mirror flash."
          ]),
          linkedReferences: buildLinkedReferences([
            {
              kind: "actor",
              label: "Scout Captain Thane",
              role: "Quest contact",
              source: "swf-sample",
              status: "candidate",
              provisionalNote: "Quest contact remains a deferred mention reference.",
              meta: { localId: "swf.actor.scout-captain-thane" }
            }
          ])
        })
      })
    ]),
    item: Object.freeze([
      Object.freeze({
        key: "item-guardian-stance",
        label: "Feat: Guardian Stance",
        description: "Conservative feat sample aligned to the existing feat-only materialization path.",
        previewOverrides: Object.freeze({
          name: "Guardian Stance",
          typeHint: "feat",
          summary: "Maintain a practiced defensive stance that emphasizes control over aggression.",
          classification: Object.freeze({
            featSubtype: "class",
            requirements: "Vanguard training"
          }),
          sourceDetails: Object.freeze({
            custom: "SWF Sample Content",
            book: "Builder Validation Notes",
            page: "Item Sample A",
            license: "CC-BY-4.0",
            rules: "2024"
          }),
          linkedReferences: buildLinkedReferences([
            {
              kind: "journal",
              label: "Lore Entry: Ember Vault",
              role: "Training context",
              source: "swf-sample",
              status: "candidate",
              provisionalNote: "Reference remains informative only in this slice.",
              meta: { localId: "swf.journal.ember-vault" }
            }
          ])
        })
      }),
      Object.freeze({
        key: "item-steady-breath",
        label: "Feat: Steady Breath",
        description: "Second feat-only sample to validate preview, create-intent, and post-create inspection repeatability.",
        previewOverrides: Object.freeze({
          name: "Steady Breath",
          typeHint: "feat",
          summary: "Use measured breathing drills to stay focused under sudden battlefield pressure.",
          classification: Object.freeze({
            featSubtype: "origin",
            requirements: "Militia background"
          }),
          sourceDetails: Object.freeze({
            custom: "SWF Sample Content",
            book: "Builder Validation Notes",
            page: "Item Sample B",
            license: "CC-BY-4.0",
            rules: "2024"
          }),
          linkedReferences: buildLinkedReferences([
            {
              kind: "actor",
              label: "Quartermaster Reth",
              role: "Recommended trainer",
              source: "swf-sample",
              status: "candidate",
              provisionalNote: "Trainer association remains a non-materialized preview reference.",
              meta: { localId: "swf.actor.quartermaster-reth" }
            }
          ])
        })
      })
    ]),
    actor: Object.freeze([
      Object.freeze({
        key: "actor-watch-captain",
        label: "Preview: Watch Captain",
        description: "Preview-only actor sample to validate actor lane framing while actor materialization stays deferred.",
        previewOverrides: Object.freeze({
          name: "Watch Captain Iri Dane",
          typeHint: "npc",
          summary: "Patrol commander preview used to validate actor references and deferred-state visibility.",
          roleLabel: "Watch Captain",
          concept: "Calm tactical commander coordinating city-wall rotations.",
          identity: Object.freeze({
            ancestry: "Human",
            alignment: "Lawful Good",
            disposition: "Measured and dutiful"
          }),
          classification: Object.freeze({
            actorPath: "npc-focused",
            grouping: "city-watch",
            encounterRole: "defender-support"
          }),
          linkedReferences: buildLinkedReferences([
            {
              kind: "item",
              label: "Guardian Stance",
              role: "Training doctrine",
              source: "swf-sample",
              status: "deferred",
              provisionalNote: "Doctrine association is preview-only until actor materialization exists.",
              meta: { localId: "swf.item.guardian-stance" }
            },
            {
              kind: "journal",
              label: "Quest/Mission Brief: Rekindle Watchfire",
              role: "Current directive",
              source: "swf-sample",
              status: "candidate",
              provisionalNote: "Directive linkage remains descriptive in this slice.",
              meta: { localId: "swf.journal.rekindle-watchfire" }
            }
          ])
        })
      })
    ])
  });

  const DEFAULT_SAMPLE_KEYS = Object.freeze({
    item: SAMPLE_REGISTRY.item[0]?.key ?? "",
    actor: SAMPLE_REGISTRY.actor[0]?.key ?? "",
    journal: SAMPLE_REGISTRY.journal[0]?.key ?? ""
  });

  function getSamplesForSurface(surfaceKey) {
    const key = toNonEmptyString(surfaceKey).toLowerCase();
    const rows = SAMPLE_REGISTRY[key];
    return Array.isArray(rows) ? rows : [];
  }

  function getDefaultSampleKeyForSurface(surfaceKey) {
    const key = toNonEmptyString(surfaceKey).toLowerCase();
    return DEFAULT_SAMPLE_KEYS[key] ?? "";
  }

  function getSampleByKey(surfaceKey, sampleKey) {
    const normalizedKey = toNonEmptyString(sampleKey);
    const rows = getSamplesForSurface(surfaceKey);
    return rows.find((row) => row.key === normalizedKey) ?? null;
  }

  function applySampleToSurfacePreview(surfacePreview = {}, surfaceKey, sampleKey) {
    const sample = getSampleByKey(surfaceKey, sampleKey);
    if (!sample) return surfacePreview;

    const mergedPreview = mergeRecords(surfacePreview.preview ?? {}, sample.previewOverrides ?? {});
    const normalizedSurfaceKey = toNonEmptyString(surfaceKey).toLowerCase();
    if (normalizedSurfaceKey === "journal") {
      const presetKey = toNonEmptyString(sample.presetKey) || DEFAULT_JOURNAL_PRESET_KEY;
      const presetAppliedPreview = applyJournalPresetToPreview(mergedPreview, presetKey);
      const journalPreview = Object.freeze(mergeRecords(presetAppliedPreview, sample.previewOverrides ?? {}));

      return Object.freeze({
        ...clone(surfacePreview),
        preview: journalPreview
      });
    }

    return Object.freeze({
      ...clone(surfacePreview),
      preview: Object.freeze(mergedPreview)
    });
  }

  globalThis.SWF.sampleContentRegistry = {
    getSamplesForSurface,
    getDefaultSampleKeyForSurface,
    getSampleByKey,
    applySampleToSurfacePreview,
    INTERNALS: {
      SAMPLE_REGISTRY,
      DEFAULT_SAMPLE_KEYS,
      mergeRecords,
      toNonEmptyString
    }
  };
})();
