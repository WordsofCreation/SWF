# dnd5e Reference Architecture Map for SWF Module Authors (2026-03-29)

## Scope & intent

This is an analysis-first reference for future SWF tasks that need to generate dnd5e-compatible content with high schema fidelity.

Baseline used in this repo:
- dnd5e system source map already captured in `docs/dnd5e-codebase-map-2026-03-29.md`.
- Additional item-pattern notes in `docs/dnd5e-item-pattern-analysis-2026-03-29.md`.
- Foundry VTT v13 API docs for integration semantics.

> Practical rule: for every future item/feat/class/subclass/content task, re-open 2–3 analogous dnd5e source examples before generating data.

---

## Category map (source locations + responsibilities + why they matter)

## 1) Items

1. **`module/data/item/_module.mjs`**
   - **Responsible for:** item-type data-model registration and shared templates (`ActivitiesTemplate`, `ItemDescriptionTemplate`, `IdentifiableTemplate`, etc.).
   - **Why it matters:** this is the fastest way to confirm what fields are globally expected across item types versus type-specific fields.

2. **`module/data/item/equipment.mjs`** (or nearest analogous concrete item model)
   - **Responsible for:** concrete schema + defaults + migrations for a non-feature item type.
   - **Why it matters:** use these files to mirror exact nested `system` structure for common content like gear/consumables/weapons.

3. **`module/documents/item.mjs`**
   - **Responsible for:** runtime item behaviors (display card, use flows, roll data, integration hooks).
   - **Why it matters:** clarifies which behaviors are data-driven vs document-driven, and where modules can safely observe/augment use.

4. **`system.json` (`documentTypes.Item`, pack typing metadata)**
   - **Responsible for:** allowed item subtypes and manifest-level type metadata.
   - **Why it matters:** prevents inventing unsupported type labels or fields when building module compendium content.

## 2) Feats and feature-like items

1. **`module/data/item/feat.mjs`**
   - **Responsible for:** canonical feat schema (`type.value`, prerequisites, requirements, advancement linkage, activities template participation).
   - **Why it matters:** primary pattern source for feature-like content generation.

2. **`config.mjs` (`CONFIG.DND5E.featureTypes`, labels/options)**
   - **Responsible for:** controlled vocabularies used by feat/feature typing.
   - **Why it matters:** future content should use configured values, not ad-hoc custom strings.

3. **`system.json` packs (`classfeatures`, `monsterfeatures`, `feats24`, etc.)**
   - **Responsible for:** official organization of feature-like content families.
   - **Why it matters:** informs consistent compendium boundaries and naming in SWF packs.

## 3) Classes

1. **`module/data/item/class.mjs`**
   - **Responsible for:** class schema (hit dice, levels, spellcasting blocks, primary ability, advancement defaults).
   - **Why it matters:** any class data authored in module packs must match this schema exactly.

2. **`module/documents/advancement/*`** (via `module/documents/_module.mjs`)
   - **Responsible for:** advancement document models and level-up mechanics consumed by class items.
   - **Why it matters:** class progression is not just static data; advancement documents are the runtime structure.

3. **`module/documents/actor/actor.mjs`**
   - **Responsible for:** actor-side consumption of class data (resources, spell prep/slots, progression side effects).
   - **Why it matters:** shows what class fields must be present for downstream actor behavior to work.

## 4) Subclasses

1. **`module/data/item/subclass.mjs`**
   - **Responsible for:** subclass schema and class-link fields (e.g., class identifiers) + subclass spellcasting/advancement shape.
   - **Why it matters:** subclass linking and progression break if identifier conventions are not followed.

2. **Class/subclass analog entries in official packs**
   - **Responsible for:** real-world examples of identifiers and advancement sequencing.
   - **Why it matters:** best source for minute details not obvious from schema alone.

3. **`module/data/item/class.mjs` + `subclass.mjs` together**
   - **Responsible for:** handshake between class and subclass metadata.
   - **Why it matters:** generation tasks should always inspect both in tandem to avoid half-correct data.

## 5) Activities / actions / attacks

1. **`module/data/activity/_module.mjs`**
   - **Responsible for:** activity-type registry and shared field components.
   - **Why it matters:** establishes which activity types exist and what common fields can be reused.

2. **`module/data/activity/<type>.mjs` (e.g., `attack.mjs`, `cast.mjs`, `damage.mjs`)**
   - **Responsible for:** type-specific schema and defaults.
   - **Why it matters:** minute differences between action types are here; don’t infer one from another.

3. **`module/documents/activity/mixin.mjs`**
   - **Responsible for:** runtime activity execution pipeline (`use`, consumption, scaling, concentration checks, messaging/hook calls).
   - **Why it matters:** explains the exact order of operations affecting charges, resources, and chat output.

4. **`module/documents/activity/_module.mjs`**
   - **Responsible for:** mapping activity data types to runtime document classes.
   - **Why it matters:** helps diagnose mismatches between authored data and executed behavior.

## 6) Uses, scaling, recharge, and resource consumption

1. **`module/documents/activity/mixin.mjs`**
   - **Responsible for:** consumption gates, payable costs, scaling decisions, usage message assembly.
   - **Why it matters:** authoritative runtime behavior for “can I use this now?” logic.

2. **Item data models that expose use/recharge fields** (feat/spell/consumable/weapon models)
   - **Responsible for:** data-level switches and counters consumed by activity pipeline.
   - **Why it matters:** generation tasks need data that the runtime can actually consume.

3. **`module/documents/actor/actor.mjs` rest/recovery pathways**
   - **Responsible for:** short/long-rest reset semantics and actor resource updates.
   - **Why it matters:** ensures authored uses/recharges align with rest lifecycle expectations.

## 7) Active-effect-related patterns

1. **`module/documents/active-effect.mjs`**
   - **Responsible for:** dnd5e-specific ActiveEffect behavior, suppression, applicability, legacy shims.
   - **Why it matters:** this is the source of truth for which effect change patterns are actually honored.

2. **`module/data/active-effect/_module.mjs`**
   - **Responsible for:** active-effect data-model registration (including enchantment-type models where applicable).
   - **Why it matters:** clarifies effect document variants and expected schema envelope.

3. **`module/data/activity/fields/applied-effect-field.mjs`**
   - **Responsible for:** activity references to effects and level-gated application behavior.
   - **Why it matters:** core pattern for “on-use apply effect” content without custom JS.

4. **`system.json` (`documentTypes.ActiveEffect`)**
   - **Responsible for:** manifest-level effect type registration.
   - **Why it matters:** avoids unsupported effect type assumptions.

## 8) Item usage workflow and chat-card touchpoints

1. **`module/documents/item.mjs`**
   - **Responsible for:** item `displayCard` and use-entry points.
   - **Why it matters:** earliest stable touchpoint for module-safe pre/post display behavior.

2. **`module/documents/activity/mixin.mjs`**
   - **Responsible for:** usage-to-message transition and downstream hook calls.
   - **Why it matters:** explains when chat output happens relative to consumption and effect application.

3. **`module/documents/chat-message.mjs`**
   - **Responsible for:** dnd5e chat-card enrichment and interactions.
   - **Why it matters:** important for UI augmentation, but high churn risk for direct DOM coupling.

4. **`templates/chat/*` and activity/item templates**
   - **Responsible for:** card HTML structure.
   - **Why it matters:** useful for understanding output, but modules should avoid brittle selectors where possible.

## 9) Module-safe extension points

1. **dnd5e lifecycle hooks from document/activity code**
   - **Responsible for:** explicit interception points (e.g., `dnd5e.preUseActivity`, `dnd5e.postUseActivity`, `dnd5e.preDisplayCard`).
   - **Why it matters:** safest system-specific integration path for add-on modules.

2. **Foundry v13 generic document hooks (`hookEvents`)**
   - **Responsible for:** cross-system lifecycle events (`preCreateDocument`, `updateDocument`, etc.).
   - **Why it matters:** more stable than patching system internals; preferable when behavior is not dnd5e-specific.

3. **Flags and metadata on module-owned documents**
   - **Responsible for:** module state storage with low conflict risk.
   - **Why it matters:** lets SWF store custom state without mutating dnd5e core schema.

## 10) Risky internal areas to avoid depending on directly

1. **Underscored internals (`_prepare*`, `_apply*`, `_finalize*`, `_migrate*`)**
   - **Risk:** private/transitional methods may change without compatibility promises.

2. **Direct sheet overrides / replacement of dnd5e document classes**
   - **Risk:** high breakage across system updates; conflicts with other modules.

3. **Chat-card DOM assumptions from system templates**
   - **Risk:** fragile selectors and structure changes between dnd5e updates.

4. **Undocumented `flags.dnd5e.*` semantics**
   - **Risk:** internal flags can be removed/repurposed; only use observed/documented patterns.

---

## 1) Concise architecture map for module authors

- **Manifest layer (`system.json`)**: declares document/item/effect type boundaries and pack organization.
- **Data-model layer (`module/data/**`)**: authoritative schema for `system` payloads (items, activities, effects, advancement).
- **Runtime document layer (`module/documents/**`)**: use/consumption/effect/chat execution behavior.
- **UI/chat layer (`templates/**`, `chat-message.mjs`, sheet apps)**: rendering + interaction details.
- **Integration layer (hooks + Foundry APIs)**: safest extension seam for modules.

Authoring priority: **schema fidelity first**, **workflow alignment second**, **UI customization last**.

## 2) Recommended learning/build order for SWF

1. Confirm current dnd5e version + `system.json` type boundaries.
2. Inspect 2–3 analogous item model files (`module/data/item/*`) for target content.
3. Inspect corresponding activity type data + activity runtime mixin.
4. Inspect active-effect handling if the content applies effects.
5. Validate module-safe hook strategy (dnd5e hooks first, then Foundry generic hooks).
6. Build one tiny vertical slice, test in Foundry, then iterate.

## 3) Safest first implementation slice after this analysis

**A single passive feat-like item with no custom JS**, optionally with one conservative ActiveEffect key already demonstrated in dnd5e source.

Why this first:
- Exercises item schema + compendium import + actor attachment.
- Avoids early dependence on activity runtime complexity.
- Keeps breakage surface small while validating end-to-end module flow.

## 4) “Do not assume” checklist for future Codex tasks

- Do not assume field names from older dnd5e versions still apply.
- Do not assume one activity type’s fields/behavior transfer to another.
- Do not assume uses/recharge fields are sufficient without runtime support in activity pipeline.
- Do not assume undocumented `flags.dnd5e.*` keys are stable.
- Do not assume class/subclass linkage without matching identifier conventions.
- Do not assume chat-card HTML structure is stable.
- Do not assume private underscored methods are safe extension points.
- Do not assume overriding dnd5e sheets/documents is acceptable for module-first architecture.

## 5) Integration source of truth (Foundry v13)

- Hook lifecycle catalog: https://foundryvtt.com/api/modules/hookEvents.html
- Document model API: https://foundryvtt.com/api/classes/foundry.abstract.Document.html
- ActiveEffect API: https://foundryvtt.com/api/classes/foundry.documents.ActiveEffect.html

## Reference links used in this repo analysis

- dnd5e reference map notes: `docs/dnd5e-codebase-map-2026-03-29.md`
- dnd5e item pattern analysis: `docs/dnd5e-item-pattern-analysis-2026-03-29.md`
