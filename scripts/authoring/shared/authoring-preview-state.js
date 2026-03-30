/**
 * Shared in-memory preview state for the stage-1 builder shell.
 *
 * This is intentionally read-only and non-materialized:
 * - No world document creation.
 * - No compendium writes.
 * - No dnd5e sheet or document overrides.
 */
(() => {
  const { MODULE_ID } = globalThis.SWF;

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
      nonMaterialized: true,
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
          Object.freeze({
            kind: "journal",
            localId: "swf.journal.vanguard-field-briefing",
            label: "Vanguard Field Briefing",
            status: "deferred"
          }),
          Object.freeze({
            kind: "item",
            localId: "swf.item.guardian-posture",
            label: "Guardian Posture (planned feature link)",
            status: "deferred"
          })
        ]),
        previewMeta: Object.freeze({
          schemaVersion: 1,
          mode: "read-only",
          materialization: "deferred",
          integrationNotes: Object.freeze([
            "Actor document creation is not implemented in this slice.",
            "dnd5e actor system-data mapping remains explicitly deferred."
          ])
        }),
        notes: Object.freeze([
          "Read-only preview model only.",
          "No Actor document is created."
        ])
      })
    });
  }

  function buildSurfacePreview({ label, documentName, sampleName, typeHint, notes }) {
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
        sampleName: "Sample Item Blueprint",
        typeHint: "feat",
        notes: ["Read-only preview model only.", "No Item document is created."]
      }),
      actor: buildActorPreview(),
      journal: buildSurfacePreview({
        label: "Journal",
        documentName: "JournalEntry",
        sampleName: "Sample Journal Blueprint",
        typeHint: "entry",
        notes: ["Read-only preview model only.", "No JournalEntry document is created."]
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
