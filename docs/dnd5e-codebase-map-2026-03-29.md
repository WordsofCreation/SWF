# Foundry dnd5e Reference Implementation Codebase Map (2026-03-29)

Scope: practical mapping for SWF module authors targeting Foundry VTT v13 + dnd5e 5.3.x.

Reference baseline checked:
- dnd5e branch/version: `5.3.x` (`system.json` shows `version: 5.3.0`, compatibility minimum `13.347`).
- Foundry API: v13 docs (`hookEvents`, `Document`, `ActiveEffect`).

## 1) Item data patterns

1. **`module/data/item/_module.mjs`**  
   Registry of all item type data models and shared templates (`ActivitiesTemplate`, `AdvancementTemplate`, `ItemDescriptionTemplate`, etc.). This is the top-level map of item system-data shape by type.
   - https://raw.githubusercontent.com/foundryvtt/dnd5e/5.3.x/module/data/item/_module.mjs

2. **`module/data/item/feat.mjs`**  
   Concrete example of a rich item model: schema definition + migrations + derived data + sheet data + prerequisites validation.
   - https://raw.githubusercontent.com/foundryvtt/dnd5e/5.3.x/module/data/item/feat.mjs

3. **`module/documents/item.mjs`**  
   Item document-level behavior, including chat card and item-use workflow touchpoints and dnd5e item-specific hooks.
   - https://raw.githubusercontent.com/foundryvtt/dnd5e/5.3.x/module/documents/item.mjs

4. **`system.json` (`documentTypes.Item`)**  
   Manifest-level constraints for item html/file path fields by item type; useful for safe module content fields.
   - https://raw.githubusercontent.com/foundryvtt/dnd5e/5.3.x/system.json

## 2) Feat / feature patterns

1. **`module/data/item/feat.mjs`**  
   Canonical feat/feature schema and behavior (requirements, prerequisites, type/subtype, advancement linkage).

2. **`CONFIG.DND5E.featureTypes` usage in `feat.mjs`**  
   Demonstrates feature categorization and subtype labeling behavior; critical for consistent feature typing.

3. **`system.json` pack declarations** (`feats24`, `classfeatures`, `monsterfeatures`, etc.)  
   Reveals where official feature-like content is organized and how content types are grouped.

4. **`module/data/item/_module.mjs`**  
   Confirms feat data model uses shared templates (`Activities`, `Advancement`, etc.) instead of custom one-off shapes.

## 3) Class and subclass progression patterns

1. **`module/data/item/class.mjs`**  
   Defines class schema (hit dice, levels, spellcasting, primaryAbility), default advancement creation, and class-level guards.
   - https://raw.githubusercontent.com/foundryvtt/dnd5e/5.3.x/module/data/item/class.mjs

2. **`module/data/item/subclass.mjs`**  
   Defines subclass schema (`classIdentifier`, spellcasting) and advancement template usage.
   - https://raw.githubusercontent.com/foundryvtt/dnd5e/5.3.x/module/data/item/subclass.mjs

3. **`module/documents/actor/actor.mjs`**  
   Actor-side logic that consumes class/subclass data for progression, spell slots, rests, concentration, etc.
   - https://raw.githubusercontent.com/foundryvtt/dnd5e/5.3.x/module/documents/actor/actor.mjs

4. **`module/documents/advancement/*` (via `module/documents/_module.mjs`)**  
   Advancement document subsystem is first-class and should be reused rather than replaced.
   - https://raw.githubusercontent.com/foundryvtt/dnd5e/5.3.x/module/documents/_module.mjs

## 4) Activities / attacks / usage workflows

1. **`module/data/activity/_module.mjs`**  
   Enumerates activity data types (`attack`, `cast`, `damage`, `heal`, `save`, etc.) and field components.
   - https://raw.githubusercontent.com/foundryvtt/dnd5e/5.3.x/module/data/activity/_module.mjs

2. **`module/documents/activity/mixin.mjs`**  
   Core activity lifecycle (`use`, `consume`, scaling, concentration integration, usage message creation) and dnd5e activity hook surface.
   - https://raw.githubusercontent.com/foundryvtt/dnd5e/5.3.x/module/documents/activity/mixin.mjs

3. **`module/documents/activity/_module.mjs`**  
   Dispatch map from activity types to concrete runtime document implementations.
   - https://raw.githubusercontent.com/foundryvtt/dnd5e/5.3.x/module/documents/activity/_module.mjs

4. **`module/documents/chat-message.mjs`**  
   Chat-card enrichment + damage/target UI behaviors for usage results.
   - https://raw.githubusercontent.com/foundryvtt/dnd5e/5.3.x/module/documents/chat-message.mjs

## 5) Effect-related patterns

1. **`module/documents/active-effect.mjs`**  
   dnd5e ActiveEffect application logic: shim fields, flag coercion, activity-targeted effects, enchantments, suppression rules.
   - https://raw.githubusercontent.com/foundryvtt/dnd5e/5.3.x/module/documents/active-effect.mjs

2. **`module/data/activity/fields/applied-effect-field.mjs`**  
   How activities reference applied effects by id/level constraints.
   - https://raw.githubusercontent.com/foundryvtt/dnd5e/5.3.x/module/data/activity/fields/applied-effect-field.mjs

3. **`module/data/active-effect/_module.mjs`**  
   Active-effect data model registration (notably enchantment model registration).
   - https://raw.githubusercontent.com/foundryvtt/dnd5e/5.3.x/module/data/active-effect/_module.mjs

4. **`system.json` (`documentTypes.ActiveEffect`)**  
   Manifest-level active effect type registration (`enchantment`) visible to Foundry.

## 6) Compendium / content organization

1. **`system.json` `packs` list**  
   Primary map of official compendium separation by topic and item types (legacy + 2024 content families).

2. **`system.json` `packFolders`**  
   How packs are grouped for UI discoverability; useful naming/organization precedent for module compendia.

3. **`system.json` dnd5e flags on packs**  
   Metadata patterns (`sourceBook`, `types`, sorting hints) useful for consistent module metadata strategy.

## 7) Module-safe extension points

1. **System hooks called from activity lifecycle (`activity/mixin.mjs`)**  
   Examples: `dnd5e.preUseActivity`, `dnd5e.postUseActivity`, `dnd5e.preActivityConsumption`, `dnd5e.activityConsumption`, `dnd5e.postActivityConsumption`.

2. **System hooks called from actor and item documents**  
   Examples in `actor.mjs` and `item.mjs`: `dnd5e.preApplyDamage`, `dnd5e.calculateDamage`, `dnd5e.preDisplayCard`, `dnd5e.preCreateScrollFromSpell`.

3. **Foundry generic document hooks (v13 `hookEvents`)**  
   `preCreateDocument`, `createDocument`, `preUpdateDocument`, `updateDocument`, etc., as cross-system-safe interception points.
   - https://foundryvtt.com/api/modules/hookEvents.html

4. **Macro bridge (`module/documents/macro.mjs`)**  
   `create5eMacro` + roll/toggle helper commands show expected macro-facing invocation style without sheet overrides.
   - https://raw.githubusercontent.com/foundryvtt/dnd5e/5.3.x/module/documents/macro.mjs

## 8) Risky places for an add-on module to depend on directly

1. **Private-ish internals underscored methods**  
   e.g. `_prepareUsageScaling`, `_finalizeMessageConfig`, `_applyLegacy`, other `_` methods in activity/effect classes. These are high-change surfaces.

2. **Chat card DOM structure assumptions**  
   `chat-message.mjs` enrichment manipulates specific class names and HTML structures that may shift between releases.

3. **Migration/helper internals in data models**  
   `_migrateData` and shim behavior are transitional and can disappear after migration windows.

4. **Direct replacement/override of dnd5e document classes or sheets**  
   dnd5e registers document and sheet classes centrally in `dnd5e.mjs`; replacing these from a module is brittle and contrary to add-on safety.

---

## Concise architecture map for module authors

- **Manifest level (`system.json`)** defines content taxonomy, item subtypes, and document type registration boundaries.
- **Data model layer (`module/data/**`)** defines authoritative `system` schema by type (items, activities, active effects, advancement).
- **Document layer (`module/documents/**`)** executes runtime behavior: usage, rolls, resource consumption, concentration, effect application.
- **Application/sheet/chat layer (`module/applications/**`, `chat-message.mjs`)** handles UI presentation/editing and chat interactivity.
- **Registry/config layer (`config.mjs`, `registry.mjs`, `dnd5e.mjs`)** wires everything into Foundry CONFIG and runtime globals.

Practical implication: module content should align with **data model + hooks** first, and avoid coupling to internals of UI rendering classes.

## Recommended learning/build order for SWF

1. `system.json` and pack organization (what dnd5e considers canonical content groupings).
2. `module/data/item/*` with emphasis on `feat.mjs`, `class.mjs`, `subclass.mjs` (schema first).
3. `module/data/activity/*` + `module/documents/activity/mixin.mjs` (usage pipeline).
4. `module/documents/active-effect.mjs` (effect keys, flags, activity-targeted change patterns).
5. `module/documents/item.mjs` + `chat-message.mjs` (chat/use touchpoints).
6. Foundry v13 core hook/document API references for module-safe interception.

## Safest first vertical slice after analysis

A **single passive feat** in your module compendium that:
- uses the established feat schema fields,
- has no custom JS,
- optionally includes a minimal transferable ActiveEffect using an already-observed dnd5e key pattern,
- validates end-to-end: compendium import -> actor add -> sheet display -> effect application.

Why this first: smallest cross-section that exercises item schema + optional effects without deep dependence on activity/chat internals.

## “Do not assume” warnings for future Codex tasks

1. Do not assume old dnd5e field names still work; check migration/shim behavior first.
2. Do not assume an activity type supports all consumption/target fields identically.
3. Do not assume chat card HTML is stable for DOM patching.
4. Do not assume undocumented `flags.dnd5e.*` keys are safe unless observed in current source.
5. Do not assume class/subclass linkage can be inferred without `classIdentifier`/identifier conventions.
6. Do not assume effect changes against `system.activities.*` are generic Foundry behavior; this is dnd5e-specific handling.
7. Do not assume core hooks and dnd5e hooks are interchangeable—choose the least-coupled hook that satisfies the need.
8. Do not assume SRD pack naming/pathing is fixed across major dnd5e updates; re-check `system.json` each release.

## Foundry v13 integration source touchpoints

- Hook catalog and generic document hook lifecycle:
  - https://foundryvtt.com/api/modules/hookEvents.html
- Core Document model semantics (DataModel + persistence):
  - https://foundryvtt.com/api/classes/foundry.abstract.Document.html
- ActiveEffect document behavior in v13 API:
  - https://foundryvtt.com/api/classes/foundry.documents.ActiveEffect.html
