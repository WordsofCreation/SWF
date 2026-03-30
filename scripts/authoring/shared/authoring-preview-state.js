/**
 * Shared in-memory preview state for the stage-1 builder shell.
 *
 * This is intentionally read-only and non-materialized:
 * - No world document creation.
 * - No compendium writes.
 * - No dnd5e sheet or document overrides.
 */
(() => {
  const {
    MODULE_ID,
    referenceModel,
    validationTraceModel,
    materializationReadinessModel,
    journalPresetDefinitions
  } = globalThis.SWF;
  const { createReferenceModel } = referenceModel;
  const { createValidationTraceModel } = validationTraceModel;
  const { createMaterializationReadinessModel } = materializationReadinessModel;
  const { DEFAULT_JOURNAL_PRESET_KEY, applyJournalPresetToPreview } = journalPresetDefinitions;

  const AUTHORING_SURFACES = Object.freeze([
    Object.freeze({ key: "item", label: "Item", documentName: "Item" }),
    Object.freeze({ key: "actor", label: "Actor", documentName: "Actor" }),
    Object.freeze({ key: "journal", label: "Journal", documentName: "JournalEntry" })
  ]);

  function buildActorPreview() {
    return Object.freeze({
      label: "Actor",
      status: "available",
      readOnly: true,
      nonMaterialized: false,
      preview: Object.freeze({
        name: "SWF Vanguard Drill Sergeant",
        documentName: "Actor",
        typeHint: "npc",
        summary: "NPC-oriented actor authoring preview only",
        roleLabel: "Frontline Trainer NPC",
        concept: "Disciplined Vanguard mentor used for encounter and training scenes.",
        identity: Object.freeze({
          ancestry: "Human",
          alignment: "Lawful Neutral",
          disposition: "Firm but fair instructor"
        }),
        classification: Object.freeze({
          actorPath: "npc-focused",
          grouping: "vanguard-order",
          encounterRole: "controller-support"
        }),
        linkedReferences: Object.freeze([
          createReferenceModel({
            kind: "journal",
            label: "Vanguard Field Briefing",
            role: "Encounter context",
            source: "builder-placeholder",
            status: "deferred",
            provisionalNote: "Journal linkage target remains preview-only until materialization rules are finalized.",
            meta: { localId: "swf.journal.vanguard-field-briefing" }
          }),
          createReferenceModel({
            kind: "item",
            label: "Guardian Posture",
            role: "Planned feature link",
            source: "builder-placeholder",
            status: "deferred",
            provisionalNote: "Feature linkage path is intentionally deferred to a future document-creation slice.",
            meta: { localId: "swf.item.guardian-posture" }
          })
        ]),
        validationTrace: createValidationTraceModel({
          warnings: ["Only one conservative npc Actor creation path is enabled; dnd5e system-data mapping remains deferred."],
          deferredFields: ["dnd5e.system.attributes", "dnd5e.system.details"],
          provisionalFields: ["typeHint", "classification.encounterRole"],
          readiness: {
            status: "partially-ready",
            summary: "Actor lane supports one controlled npc-only creation path; richer actor system mapping remains deferred."
          },
          traceNotes: [
            "One explicit GM-only Actor document write path is enabled for npc previews.",
            "Cross-surface links remain local preview references only."
          ]
        }),
        materializationReadiness: createMaterializationReadinessModel({
          readyClusters: ["identity", "classification", "linkedReferences"],
          deferredClusters: ["dnd5e.system.attributes", "dnd5e.system.details", "ownership defaults"],
          provisionalClusters: ["typeHint.npc", "encounter-role mapping"],
          readiness: {
            status: "partially-ready",
            summary: "Actor lane can materialize one npc identity path while document-safe actor system mapping remains deferred."
          },
          nextStepNote: "Add one optional npc details cluster mapping (for example biography) only after validating a stable dnd5e actor schema contract."
        }),
        previewMeta: Object.freeze({
          schemaVersion: 1,
          mode: "read-only",
          materialization: "partial",
          integrationNotes: Object.freeze([
            "Actor document creation is implemented for one conservative npc-only path.",
            "dnd5e actor system-data mapping remains explicitly deferred."
          ])
        }),
        notes: Object.freeze([
          "Preview model remains primary authoring source.",
          "One controlled GM-only npc Actor create path is available."
        ])
      })
    });
  }

  function buildSurfacePreview({
    label,
    documentName,
    sampleName,
    typeHint,
    previewOverrides = {},
    notes,
    linkedReferences = [],
    validationTrace = {},
    materializationReadiness = {}
  }) {
    return Object.freeze({
      label,
      status: "available",
      readOnly: true,
      nonMaterialized: true,
      preview: Object.freeze({
        name: sampleName,
        documentName,
        typeHint,
        summary: `${label} builder preview only`,
        ...previewOverrides,
        linkedReferences: Object.freeze(linkedReferences),
        validationTrace: createValidationTraceModel(validationTrace),
        materializationReadiness: createMaterializationReadinessModel(materializationReadiness),
        notes: Object.freeze(notes)
      })
    });
  }

  const DEFAULT_PREVIEW_STATE = Object.freeze({
    sessionId: `${MODULE_ID}-preview-session`,
    schemaVersion: 1,
    mode: "read-only",
    source: "placeholder",
    surfaces: Object.freeze({
      item: buildSurfacePreview({
        label: "Item",
        documentName: "Item",
        sampleName: "SWF Field Kit",
        typeHint: "equipment",
        previewOverrides: {
          summary: "Compact mission-ready equipment pack with no embedded automation.",
          classification: Object.freeze({
            itemCategory: "wondrous"
          }),
          sourceDetails: Object.freeze({
            custom: "SWF Builder",
            book: "SW5e Conversion Notes",
            page: "Item Lane 1",
            license: "CC-BY-4.0",
            rules: "2024"
          })
        },
        linkedReferences: [
          createReferenceModel({
            kind: "actor",
            label: "SWF Vanguard Drill Sergeant",
            role: "Expected user",
            source: "builder-placeholder",
            status: "candidate",
            provisionalNote: "Candidate user reference for preview only; no ownership link is materialized.",
            meta: { localId: "swf.actor.vanguard-drill-sergeant" }
          })
        ],
        validationTrace: {
          warnings: ["Only one equipment/loot world Item creation path is enabled; activities remain deferred."],
          deferredFields: ["dnd5e.system.activities"],
          provisionalFields: ["classification.itemCategory", "sourceDetails.*"],
          readiness: {
            status: "partially-ready",
            summary: "Item lane supports one conservative equipment/loot creation path; broader dnd5e item system mapping remains deferred."
          },
          traceNotes: ["One explicit GM-only Item document write path is enabled for equipment/loot previews."]
        },
        materializationReadiness: {
          readyClusters: ["name", "summary", "classification", "sourceDetails", "linkedReferences"],
          deferredClusters: ["dnd5e.system.activities", "item ownership defaults"],
          provisionalClusters: ["equipment/loot category allow-list coverage", "sourceDetails optional field population"],
          readiness: {
            status: "partially-ready",
            summary: "Item lane can now materialize one equipment/loot document path while complex item fields remain deferred."
          },
          nextStepNote: "Add one optional equipment details cluster (for example weight and quantity) only after validating a stable dnd5e schema contract."
        },
        notes: ["Preview model remains primary authoring source.", "One controlled GM-only equipment/loot Item create path is available."]
      }),
      actor: buildActorPreview(),
      journal: Object.freeze({
        label: "Journal",
        status: "available",
        readOnly: true,
        nonMaterialized: true,
        preview: applyJournalPresetToPreview(
        buildSurfacePreview({
          label: "Journal",
          documentName: "JournalEntry",
          sampleName: "Sample Journal Blueprint",
          typeHint: "entry",
          linkedReferences: [
            createReferenceModel({
              kind: "actor",
              label: "SWF Vanguard Drill Sergeant",
              role: "Mentioned entity",
              source: "builder-placeholder",
              status: "candidate",
              provisionalNote: "Mention-style cross-reference only; no true relation is created in this slice.",
              meta: { localId: "swf.actor.vanguard-drill-sergeant" }
            }),
            createReferenceModel({
              kind: "item",
              label: "Guardian Posture",
              role: "Mentioned feature",
              source: "builder-placeholder",
              status: "candidate",
              provisionalNote: "Item mention remains an in-memory preview reference.",
              meta: { localId: "swf.item.guardian-posture" }
            })
          ],
          validationTrace: {
            warnings: ["Journal page structure is represented as summary text only in this preview."],
            deferredFields: ["pages", "ownership"],
            provisionalFields: ["name", "linkedReferences"],
            readiness: {
              status: "preview-ready",
              summary: "Journal lane is preview-ready with explicit deferred page materialization."
            },
            traceNotes: ["Narrative links are inspectable but not embedded into documents."]
          },
          materializationReadiness: {
            readyClusters: ["name", "summary", "linkedReferences"],
            deferredClusters: ["pages payload", "ownership defaults", "embedded links"],
            provisionalClusters: ["entry structure conventions"],
            readiness: {
              status: "partially-ready",
              summary: "Journal lane preview is clear for review while page materialization remains explicitly deferred."
            },
            nextStepNote: "Define one minimal JournalEntry page payload contract before enabling journal document creation."
          },
          notes: ["Read-only preview model only.", "No JournalEntry document is created."]
        }).preview,
        DEFAULT_JOURNAL_PRESET_KEY
      )
      })
    })
  });

  function getDefaultPreviewState() {
    return foundry.utils.deepClone(DEFAULT_PREVIEW_STATE);
  }

  function getAuthoringSurfaces() {
    return AUTHORING_SURFACES.map((surface) => ({ ...surface }));
  }

  globalThis.SWF.authoringPreviewState = {
    getDefaultPreviewState,
    getAuthoringSurfaces
  };
})();
