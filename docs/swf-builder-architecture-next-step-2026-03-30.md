# SWF Builder Architecture — Next Practical Step (Architecture-First)

Date: 2026-03-30  
Target: Foundry VTT v13 add-on module for dnd5e

## Repository fit check (current baseline)

This proposal fits the current SWF shape:
- Existing safe module lifecycle and settings toggles (`scripts/module.js`, `scripts/settings.js`).
- Existing GM-only, read-only tool shell surface (`scripts/tool-shell.js`, `templates/tool-shell.hbs`).
- Existing manifest and validation plumbing (`scripts/data/manifest-loader.js`, `scripts/data/manifest-validation.js`, `scripts/data/manifest-registry.js`).
- Existing mapping/trace emphasis for feat and item anatomy (`scripts/data/feat-target-stub.js`, `scripts/data/feat-conversion-trace.js`, `scripts/data/type-target-map.js`, `scripts/data/field-target-map.js`).

This means the next step should extend that structure rather than replace it.

---

## 1) Practical architecture proposal for Item, Actor, and Journal authoring

Use a **four-stage, non-destructive authoring pipeline** shared by all builders:

1. **Source Manifest Layer**
   - Durable authored intent (JSON/YAML).
   - Human-editable input only.

2. **Normalized Authoring Layer (in-memory)**
   - Deterministic, strict model per builder domain.
   - Defaults and canonical naming resolved here.

3. **Preview Target Layer (read-only)**
   - “Would-be” output payloads and summaries for GM inspection.
   - Includes diagnostics, mapping trace, and unresolved references.

4. **Future Materialization Boundary (deferred)**
   - Explicit adapter contracts for eventual world/compendium writes.
   - No document APIs called in this stage.

### Domain responsibilities

- **Item Builder**
  - Source: item manifests.
  - Normalized: dnd5e-compatible item authoring model.
  - Preview: target stub + mapping/coverage/deferred diagnostics.

- **Actor Builder**
  - Source: actor manifests for PC/NPC archetypes.
  - Normalized: actor authoring model with inventory/feature link intents.
  - Preview: actor target stub + resolved/unresolved item-link report.

- **Journal Builder**
  - Source: journal manifests for pages/sections/GM notes.
  - Normalized: journal authoring model with typed link references.
  - Preview: structured page outline + reference integrity report.

---

## 2) Recommended folder/module layout for the next stage

```text
scripts/
  authoring/
    shared/
      contracts.js                 # common contracts/types (layer objects)
      diagnostics.js               # error/warning/deferred helpers
      ids.js                       # stable module-local IDs for artifacts/refs
      reference-index.js           # in-memory index + resolution helpers
      normalization-context.js     # shared context passed through pipeline

    manifests/
      manifest-kind-router.js      # item/actor/journal manifest routing
      manifest-source-adapter.js   # thin adapter over existing loader/registry

    item/
      item-authoring-model.js      # source -> normalized item shape
      item-normalizer.js
      item-validation.js
      item-preview-target.js
      item-trace.js

    actor/
      actor-authoring-model.js
      actor-normalizer.js
      actor-validation.js
      actor-preview-target.js
      actor-link-resolution.js

    journal/
      journal-authoring-model.js
      journal-normalizer.js
      journal-validation.js
      journal-preview-target.js
      journal-link-resolution.js

    pipeline/
      run-authoring-pipeline.js    # normalize -> validate -> preview
      authoring-registry.js        # in-memory normalized/preview artifacts
      authoring-trace.js           # merged pipeline trace records

    materialization/
      README.md                    # deferred write boundary only
      payload-contracts.js         # future adapter interfaces only

templates/
  tool-shell-authoring.hbs         # read-only builder panel(s)

data/manifests/
  authoring/
    items/
    actors/
    journals/
```

Design principle: keep `scripts/data/*` as trusted mapping/reference primitives and layer `scripts/authoring/*` above them for pipeline orchestration.

---

## 3) Recommended shared vocabulary

### Builder model vocabulary

- `SourceManifest`
- `ItemAuthoringModel`
- `ActorAuthoringModel`
- `JournalAuthoringModel`
- `PreviewTargetModel`
- `AuthoringPipelineResult`

### Cross-builder reference/link vocabulary

- `SWFReference`
  - `kind`: `"item" | "actor" | "journal"`
  - `targetLocalId`: module-local stable ID
  - `label?`: author-facing optional label

- `ResolvedReference`
  - `status`: `"resolved"`
  - `targetSummary`: minimal normalized target summary for preview

- `UnresolvedReference`
  - `status`: `"unresolved" | "deferred"`
  - `reason`: `"missing_target" | "kind_mismatch" | "materialization_deferred"`

- `ReferenceIntegrityReport`
  - per-node/per-section counts and reasons

### Diagnostics and mapping vocabulary

- `AuthoringDiagnostic` (`error`, `warning`, `deferred`)
- `ValidationReport`
- `MappingTraceRecord`
- `CoverageSummary`

### Future output vocabulary (not yet implemented)

- `DocumentPayloadContract`
- `MaterializationAdapter`
- `PublishPlan`

---

## 4) Safest first vertical slice to implement next

**Recommended slice: Item Builder Preview (Feat-focused, read-only, in-memory only).**

Why this first:
- Leverages the strongest existing repo work (feat mapping, target stub, trace).
- Delivers immediate GM-facing value with low risk.
- Exercises all shared architecture layers before actor/journal complexity.
- Maintains strict compliance with “no document creation yet”.

Slice deliverable:
- One pipeline path from source feat manifest -> normalized item model -> preview target + diagnostics in tool shell.

---

## 5) Step-by-step implementation plan for that slice (do not implement yet)

1. **Define shared contracts and diagnostics**
   - Add `scripts/authoring/shared/contracts.js`, `diagnostics.js`, `ids.js`.

2. **Add manifest routing adapter for authoring**
   - Introduce `manifest-kind-router.js` and `manifest-source-adapter.js`.
   - Reuse current manifest registry/loader output; do not fork parsing logic.

3. **Build item normalization phase**
   - Implement pure transformation in `item-normalizer.js`.
   - Reuse existing field/target maps and feat trace modules.

4. **Build item validation phase**
   - Enforce structural requirements in `item-validation.js`.
   - Mark uncertain mappings as `deferred`, not hard failures, unless invalid.

5. **Build preview target phase**
   - Create `item-preview-target.js` for UI-safe read-only preview payload.
   - Include explicit `nonMaterialized: true` marker in preview metadata.

6. **Wire pipeline orchestrator**
   - Add `run-authoring-pipeline.js` + in-memory `authoring-registry.js`.

7. **Expose in GM tool shell as read-only panel**
   - Add builder preview tab/section in existing shell entry flow.
   - Display normalized model, preview target JSON, diagnostics, and trace summary.

8. **Add tests for architecture behavior**
   - Unit tests for normalize/validate/preview pipeline outputs.
   - Snapshot/golden test for one canonical feat manifest.
   - Negative test for deferred mapping and unresolved reference diagnostics.

9. **Manual Foundry v13 validation**
   - Verify panel is GM-only.
   - Verify no document creation/update calls are triggered.
   - Verify disabling future-content setting bypasses the pipeline cleanly.

---

## 6) “Do not build yet” list (discipline guardrails)

- Any call to create/update/delete world documents (`Item`, `Actor`, `JournalEntry`).
- Any compendium pack write/import/mutation path.
- Any UUID conversion/persistence to real Foundry documents.
- Any dnd5e core document class override or sheet override.
- Any automation/execution engine for active effects/actions.
- Any migration strategy for persisted SWF-built content.

This keeps the next stage source-grounded, additive, and safe while preparing a production-ready path to future materialization.
