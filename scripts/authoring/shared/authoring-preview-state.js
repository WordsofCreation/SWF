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
      actor: buildSurfacePreview({
        label: "Actor",
        documentName: "Actor",
        sampleName: "Sample Actor Blueprint",
        typeHint: "npc",
        notes: ["Read-only preview model only.", "No Actor document is created."]
      }),
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
