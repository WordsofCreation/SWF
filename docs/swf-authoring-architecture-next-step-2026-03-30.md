# SWF Next-Step Architecture Proposal (Authoring-First, Non-Destructive)

Date: 2026-03-30  
Scope: Foundry VTT v13 add-on module for dnd5e

## 1) Practical architecture proposal

This proposal keeps SWF additive, module-safe, and architecture-first by splitting the future builder into four explicit stages:

1. **Source manifests (read-only input)**
   - Existing and future JSON/YAML source manifests remain the durable authored input.
   - They describe author intent and reference patterns but do not directly create Foundry documents.

2. **Normalized authoring models (in-memory)**
   - Parse and normalize manifests into strict, typed in-memory models for each authoring path:
     - Item authoring model
     - Actor authoring model
     - Journal authoring model
   - Normalization resolves defaults and validates allowed structure using dnd5e-informed mapping rules.

3. **Preview/inspection models (derived, read-only)**
   - Generate presentation-oriented preview payloads from normalized models.
   - Preview models are safe to render in a GM tool without touching world documents/compendia.
   - Diagnostics (warnings/errors/deferred fields) are attached here for inspection.

4. **Future materialization boundary (not implemented yet)**
   - A dedicated adapter layer will later transform normalized models into Foundry document creation payloads.
   - This boundary is intentionally deferred to keep current slices non-destructive.

### Architectural shape by authoring path

- **Item builder path**
  - Input: item source manifest
  - Core: item normalizer + item validation/mapping
  - Output now: item preview model + trace
  - Output later: dnd5e Item creation payload adapter

- **Actor builder path (character/NPC)**
  - Input: actor source manifest with role/archetype intent and references to item stubs
  - Core: actor normalizer + actor validation/mapping
  - Output now: actor preview model + linked-item reference diagnostics
  - Output later: dnd5e Actor creation payload adapter + embedded item linkage workflow

- **Journal builder path**
  - Input: journal source manifest with sections/entries and reference objects
  - Core: journal normalizer + cross-reference resolver
  - Output now: journal preview model (outline + unresolved/resolved references)
  - Output later: JournalEntry/JournalEntryPage creation payload adapter

## 2) Recommended folder/module layout for the next stage

```text
scripts/
  authoring/
    shared/
      ids.js                      # stable local IDs and reference helpers
      reference-schema.js         # in-memory link/reference object guards
      diagnostics.js              # warning/error/deferred issue helpers
      normalization-context.js    # common normalization context builder

    manifests/
      source-manifest-schema.js   # high-level source manifest validation glue
      source-manifest-loader.js   # adapter over existing loader for authoring flows

    item/
      item-authoring-model.js     # normalized item authoring model shape
      item-normalizer.js          # source -> normalized item model
      item-preview-model.js       # normalized -> preview model
      item-trace.js               # mapping/field trace for inspection

    actor/
      actor-authoring-model.js    # normalized actor model shape
      actor-normalizer.js         # source -> normalized actor model
      actor-preview-model.js      # normalized -> preview model
      actor-reference-resolver.js # item link resolution for actor loadout/features

    journal/
      journal-authoring-model.js  # normalized journal model shape
      journal-normalizer.js       # source -> normalized journal model
      journal-preview-model.js    # normalized -> preview model
      journal-reference-resolver.js # references to item/actor targets

    pipeline/
      authoring-pipeline.js       # orchestrates normalize -> validate -> preview
      authoring-registry.js       # in-memory store for normalized + preview artifacts

    materialization/
      README.md                   # deferred boundary contract only (no creation yet)
      payload-contracts.js        # non-executable interfaces for future output

scripts/tool-shell/
  authoring-panel.js              # safe GM UI panel using preview + diagnostics only

templates/
  tool-shell-authoring.hbs        # new preview-centric template

data/manifests/
  authoring/
    item/                         # future item sources
    actor/                        # future actor sources
    journal/                      # future journal sources

docs/
  swf-authoring-architecture-next-step-2026-03-30.md
```

Notes for fit with current codebase:
- Keep existing `scripts/data/*` modules as canonical low-level mapping/validation inputs.
- Add `scripts/authoring/*` as orchestration and model layers on top.
- Keep `scripts/tool-shell.js` as launcher entry point; add new panel code behind existing world setting guards.

## 3) Shared vs feature-specific responsibilities

### Shared (cross-path)
- Manifest loading entry points
- ID strategy and reference object semantics
- Diagnostics format (`error`, `warning`, `deferred`)
- Trace/log model
- Pipeline orchestration and in-memory registry
- Preview safety guarantees (read-only, no document writes)

### Feature-specific
- Item type mapping and dnd5e item field normalization
- Actor role/type normalization and actor-specific linked item semantics
- Journal page/section structure and narrative organization semantics
- Path-specific preview rendering helpers

## 4) Where stubs/models/mapping/trace/validation should live

- **Target stubs / authoring models**
  - Live in `scripts/authoring/<path>/<path>-authoring-model.js`
  - Pure functions + plain objects; no Foundry document API calls.

- **Manifest/mapping logic**
  - Reuse current `scripts/data/*` mapping knowledge as foundational maps.
  - Add path orchestration adapters in `scripts/authoring/<path>/<path>-normalizer.js`.

- **Trace and diagnostics**
  - Shared helpers in `scripts/authoring/shared/diagnostics.js`
  - Path traces in `item-trace.js`, actor/journal equivalents.

- **Validation**
  - Source-level checks: `scripts/authoring/manifests/source-manifest-schema.js`
  - Normalized-model checks: each path normalizer and resolver module
  - Cross-reference checks: actor/journal reference resolvers

## 5) Journal references before real document creation

Until real documents exist, journal authoring should use **module-local reference objects** that point to authoring targets, not Foundry UUIDs.

Recommended temporary reference vocabulary:

- `SWFRef` (generic)
  - `kind`: `"item" | "actor" | "journal"`
  - `targetId`: local stable ID (authoring registry ID)
  - `label`: optional display label
  - `status`: derived (`resolved` | `unresolved` | `deferred`)

- `SWFJournalNode`
  - represents section/page-like units for preview structure
  - contains text blocks plus `SWFRef[]`

- `SWFReferenceIndex`
  - built during pipeline run
  - maps local IDs to normalized model summaries for resolution

This keeps link semantics deterministic now and allows later conversion to Foundry UUID links during materialization.

## 6) Safest initial GM-facing UI surface

Use a **single GM-only Tool Shell panel extension** (existing pattern) with:
- Left: source manifests (item/actor/journal)
- Center: normalized model summary + diagnostics
- Right: preview JSON and reference resolution report

Why this is safest:
- no sheet overrides
- no document class extension
- no compendium/world writes
- aligns with existing `FormApplication` shell and world setting toggles

## 7) How future compendium output should influence design now

Design now for eventual compendium output by introducing explicit output contracts, but do not execute writes:

- Define future adapter boundaries:
  - `toItemDocumentData(normalizedItem)`
  - `toActorDocumentData(normalizedActor, resolvedLinks)`
  - `toJournalDocumentData(normalizedJournal, resolvedLinks)`
- Keep normalized models **compendium-agnostic** (no pack IDs baked in).
- Represent publication targets as future configuration metadata, not active behavior.
- Preserve deterministic IDs to support idempotent future publish/update flows.

## 8) Explicit boundaries between core layers

- **Source Manifests**
  - author intent, friendly fields, references by local IDs
  - never consumed directly by UI rendering or future Foundry writes

- **Normalized Authoring Models**
  - strict internal shape per builder path
  - only place where defaults and canonical mapping are resolved

- **Preview Models**
  - read-only, UI-ready view models
  - include diagnostics and trace info
  - no side effects

- **Future Materialization**
  - isolated adapters that produce Foundry document payloads
  - only layer allowed to call document create/update APIs (later)

## 9) Recommended shared vocabulary

- **Builder terms**
  - `ItemAuthoringModel`
  - `ActorAuthoringModel`
  - `JournalAuthoringModel`
  - `AuthoringPipelineResult`

- **Reference/link terms**
  - `SWFRef`
  - `SWFReferenceIndex`
  - `ResolvedReference`
  - `UnresolvedReference`

- **Diagnostics/trace terms**
  - `AuthoringDiagnostic`
  - `MappingTrace`
  - `CoverageSummary`

- **Future output terms**
  - `DocumentDataContract`
  - `MaterializationAdapter`

## 10) Safest first vertical slice (recommended)

**Slice: Journal preview with local references to existing item authoring stubs (read-only only).**

Why this first:
- exercises cross-path linking early without document writes
- validates shared reference vocabulary immediately
- produces visible GM value in tool shell (structured journal preview)
- keeps risk low because it is model + preview only

Scope of the slice:
- add one journal source manifest example
- normalize it into `JournalAuthoringModel`
- resolve `SWFRef(kind="item")` against in-memory item models/stubs
- render diagnostics and preview in Tool Shell
- no `Document.create`, no compendium operations

## 11) Step-by-step implementation plan for that slice (do not implement yet)

1. **Scaffold shared reference primitives**
   - Add `ids.js`, `reference-schema.js`, `diagnostics.js`.

2. **Create journal source schema + sample source manifest**
   - Add minimal journal manifest type under `data/manifests/authoring/journal/`.
   - Validate only required fields and `SWFRef` structure.

3. **Add journal normalization path**
   - Implement source -> `JournalAuthoringModel` normalizer.
   - Include stable local node IDs and reference arrays.

4. **Add reference index and resolver**
   - Build `SWFReferenceIndex` from current in-memory item stubs/models.
   - Resolve journal refs to `resolved/unresolved/deferred` statuses.

5. **Add journal preview model**
   - Produce UI-friendly outline, per-node refs, and diagnostics.

6. **Integrate into existing Tool Shell**
   - Add journal tab/section with selected manifest detail.
   - Show normalized summary + reference resolution report + preview JSON.

7. **Add non-destructive tests**
   - Unit tests for ref parsing, resolver behavior, and unresolved diagnostics.
   - Snapshot test for preview model shape.

8. **Manual validation in Foundry v13**
   - Enable dev tools + future content tools settings.
   - Open tool shell as GM.
   - Confirm journal preview and reference statuses render as expected.

## 12) Do-not-build-yet list

- Any world document creation (`Item.create`, `Actor.create`, `JournalEntry.create`)
- Any compendium writes/import/update/delete
- Any dnd5e sheet/document override or monkey patching
- Any UUID link persistence logic
- Any migration logic for persisted SWF-created content
- Any third-party integration layers

---

This proposal keeps SWF architecture additive and safe while preparing clear interfaces for eventual item, actor, and journal materialization.
