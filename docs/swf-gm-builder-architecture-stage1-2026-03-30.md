# SWF GM Builder Architecture — Stage 1 (Architecture-First, Non-Destructive)

Date: 2026-03-30  
Audience: SWF maintainers building a GM-facing authoring module for Foundry VTT v13 + dnd5e

## Why this is the right next step

SWF already has the safe foundations we should preserve:
- module runtime hooks that avoid document/sheet overrides;
- a manifest loading + validation path;
- a GM-only tool shell that renders read-only diagnostics and mapping traces;
- item-pattern analysis work for dnd5e feat/feature/subclass anatomy.

The next architectural step is to introduce a **builder pipeline that remains in-memory only** and clearly separates source intent, normalized authoring state, and preview targets.

---

## 1) Practical architecture proposal

### A. Four-layer authoring pipeline (all additive)

1. **Source Manifest Layer (author intent)**
   - Durable JSON/YAML author input under module-owned data folders.
   - No Foundry document UUID assumptions required.

2. **Normalized Authoring Model Layer (internal canonical state)**
   - Deterministic in-memory model with defaults resolved.
   - Strictly module-local model contracts for item, actor, journal builders.

3. **Preview Target Layer (read-only “would-be” outputs)**
   - Derived payloads shaped like future document data where practical.
   - Includes diagnostics, mapping coverage, unresolved links, and deferred fields.

4. **Materialization Boundary Layer (deferred/not implemented)**
   - Future adapters that convert normalized models into document payloads.
   - Only this boundary may eventually call create/update APIs.

### B. Builder domains

- **Item Builder**
  - Focus: dnd5e-compatible item anatomy and type-specific clusters.
  - Output now: `ItemPreviewTarget` + mapping trace.

- **Actor Builder**
  - Focus: character/NPC authoring state with linked item references.
  - Output now: `ActorPreviewTarget` + unresolved/resolved link report.

- **Journal Builder**
  - Focus: section/page organization and references to item/actor authoring artifacts.
  - Output now: `JournalPreviewTarget` + reference integrity report.

### C. Architectural safety rules

- No world document writes.
- No compendium writes.
- No dnd5e document/sheet overrides.
- No direct use of undocumented schema fields.
- Reference identity remains module-local until future materialization.

---

## 2) Recommended folder/module layout for next stage

```text
scripts/
  authoring/
    shared/
      authoring-types.js            # shared typedef/contracts for builder layers
      diagnostics.js                # standardized warnings/errors/deferred
      stable-ids.js                 # local IDs for manifests/models/references
      reference-graph.js            # in-memory reference graph + resolution statuses
      normalization-context.js      # shared context for normalize/validate/trace

    manifests/
      manifest-discovery.js         # non-breaking extension over existing manifest loader
      manifest-kind-registry.js     # item/actor/journal manifest kind routing

    item/
      item-authoring-model.js       # source -> normalized item model contract
      item-normalizer.js            # normalization + dnd5e-informed field mapping
      item-preview-target.js        # normalized item -> preview target
      item-validation.js            # structural/business rule checks

    actor/
      actor-authoring-model.js
      actor-normalizer.js
      actor-preview-target.js
      actor-validation.js
      actor-link-resolution.js      # resolves links to item authoring artifacts

    journal/
      journal-authoring-model.js
      journal-normalizer.js
      journal-preview-target.js
      journal-validation.js
      journal-link-resolution.js    # resolves links to item/actor/journal artifacts

    pipeline/
      run-authoring-pipeline.js     # normalize -> validate -> preview orchestration
      authoring-registry.js         # in-memory registry for normalized + preview artifacts
      authoring-trace.js            # mapping + transform trace aggregation

    materialization/
      README.md                     # contract-only; explicitly no write behavior yet
      payload-contracts.js          # future interfaces for toDocumentData adapters

scripts/
  tool-shell-authoring.js           # optional extension of current tool shell tabs/panels

templates/
  tool-shell-authoring.hbs          # read-only preview/diagnostics UI

data/manifests/
  authoring/
    items/
    actors/
    journals/
```

Design intent: keep existing `scripts/data/*` as foundational mapping/analysis modules and layer `scripts/authoring/*` on top for pipeline orchestration.

---

## 3) Recommended shared vocabulary

### Core builder objects

- `SourceManifest` — raw persisted author intent.
- `NormalizedAuthoringModel` — strict in-memory canonical model.
- `PreviewTargetModel` — read-only “would-be output” model.
- `AuthoringPipelineResult` — normalized model + preview + diagnostics + trace.

### Builder-specific canonical names

- `ItemAuthoringModel`, `ItemPreviewTarget`
- `ActorAuthoringModel`, `ActorPreviewTarget`
- `JournalAuthoringModel`, `JournalPreviewTarget`

### References and links (cross-builder)

- `SWFLinkRef`
  - `kind`: `"item" | "actor" | "journal"`
  - `targetLocalId`: stable module-local identifier
  - `label`: optional author-facing label

- `SWFResolvedLink`
  - resolved target summary, canonical path, and confidence/status

- `SWFUnresolvedLink`
  - unresolved reason (`missing_target`, `kind_mismatch`, `deferred_materialization`)

- `SWFReferenceIndex`
  - in-memory index from local IDs to normalized model summaries

### Diagnostics + trace

- `AuthoringDiagnostic` (`error | warning | deferred`)
- `MappingTraceRecord`
- `ValidationReport`
- `ReferenceIntegrityReport`

### Future output vocabulary (deferred)

- `DocumentPayloadContract`
- `MaterializationAdapter`
- `PublishPlan` (future, compendium/world target metadata)

---

## 4) Safest first vertical slice to implement next

## Slice recommendation: **Item Builder Preview (single feat manifest path, no writes)**

Why this is safest and most useful now:
- Reuses strongest existing repo knowledge (feat mapping/trace work).
- Delivers a GM-facing “authoring confidence” UI quickly.
- Exercises full pipeline (manifest -> normalized -> preview -> diagnostics) without document creation.
- Creates shared primitives needed by actor/journal builders later.

Scope of this slice:
1. Add `scripts/authoring/shared` primitives.
2. Add item-only pipeline modules (`item-normalizer`, `item-preview-target`, `item-validation`).
3. Route one existing canonical feat manifest through the item pipeline.
4. Show pipeline result in a read-only tool-shell panel.
5. Keep all outputs ephemeral/in-memory.

---

## 5) Step-by-step implementation plan for that slice (no implementation yet)

1. **Define shared contracts and diagnostics**
   - Add `authoring-types.js`, `diagnostics.js`, `stable-ids.js`.
   - Define exact object shapes for `ItemAuthoringModel`, `ItemPreviewTarget`, and `AuthoringPipelineResult`.

2. **Create item normalization boundary**
   - Implement `item-normalizer.js` as pure transformation from `SourceManifest` to `ItemAuthoringModel`.
   - Reuse existing item/feat mapping analysis modules rather than inventing new fields.

3. **Add item validation phase**
   - Implement `item-validation.js` to enforce required/known-safe fields.
   - Classify uncertain fields as `deferred` diagnostics, not errors, unless structurally invalid.

4. **Create item preview target transformation**
   - Implement `item-preview-target.js` to generate read-only target payload and mapping trace summary.
   - Ensure preview target is explicitly marked non-materialized.

5. **Introduce pipeline runner**
   - Add `run-authoring-pipeline.js` to orchestrate normalize -> validate -> preview.
   - Store results only in `authoring-registry.js` (memory only).

6. **Expose in GM tool shell (read-only)**
   - Add a new tab/panel that lists item manifests and shows:
     - normalized authoring model,
     - preview target JSON,
     - diagnostics,
     - mapping trace summary.

7. **Add tests for the new item pipeline**
   - Unit tests for normalization and validation behavior.
   - Golden snapshot test for one feat preview target.
   - Negative test for unresolved/deferred mapping behavior.

8. **Manual validation in Foundry v13**
   - Confirm GM can open the panel and inspect preview artifacts.
   - Confirm no world/compendium documents are created/updated.
   - Confirm module still behaves with future-content setting disabled.

9. **Document extension points for actor/journal**
   - Add short docs for how actor/journal pipelines will plug into shared reference index and diagnostics.

---

## 6) “Do not build yet” discipline list

Do not implement these yet:
- Document creation APIs (`Item.create`, `Actor.create`, `JournalEntry.create`, etc.).
- Compendium import/export or pack mutation.
- UUID-link conversion to real documents.
- Any dnd5e document class/sheet override.
- Rich actor automation (effects, active automation execution).
- Cross-world publish/update synchronization.
- Migration framework for persisted builder state.

---

## How future compendium output should shape design now (without implementing)

- Keep normalized models pack-agnostic.
- Add optional future `PublishPlan` metadata separate from authoring model core.
- Preserve stable local IDs now to support deterministic future publish/update mapping.
- Treat materialization adapters as replaceable leaf modules, not core pipeline dependencies.

This keeps today’s architecture safe while enabling compendium-oriented workflows later with minimal refactor.
