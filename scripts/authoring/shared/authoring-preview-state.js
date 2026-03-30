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
    Object.freeze({ key: "item", label: "Item" }),
    Object.freeze({ key: "actor", label: "Actor" }),
    Object.freeze({ key: "journal", label: "Journal" })
  ]);

  const DEFAULT_PREVIEW_STATE = Object.freeze({
    sessionId: `${MODULE_ID}-preview-session`,
    mode: "read-only",
    source: "placeholder",
    surfaces: Object.freeze({
      item: Object.freeze({
        label: "Item",
        status: "available",
        preview: Object.freeze({
          name: "Sample Item Blueprint",
          type: "feat",
          notes: ["Read-only preview model only.", "No Item document is created."]
        })
      }),
      actor: Object.freeze({
        label: "Actor",
        status: "available",
        preview: Object.freeze({
          name: "Sample Actor Blueprint",
          type: "npc",
          notes: ["Read-only preview model only.", "No Actor document is created."]
        })
      }),
      journal: Object.freeze({
        label: "Journal",
        status: "available",
        preview: Object.freeze({
          name: "Sample Journal Blueprint",
          type: "entry",
          notes: ["Read-only preview model only.", "No JournalEntry document is created."]
        })
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
