# dnd5e Activity / Attack / Item-Use Workflow Deep-Dive (analysis-first) — 2026-03-29

This is an analysis-only document for future SWF module development. No new gameplay content is generated here.

## Scope and source anchors

Pattern library and integration sources used:

- dnd5e system reference (5.3.x):
  - `module/documents/activity/mixin.mjs`
  - `module/data/activity/_module.mjs`
  - `module/documents/item.mjs`
  - `module/documents/chat-message.mjs`
  - `module/documents/active-effect.mjs`
  - `module/data/activity/fields/applied-effect-field.mjs`
  - `system.json`
- dnd5e content analog paths from official packs:
  - `packs/_source/equipment24/weapons/simple-melee/club.yml`
  - `packs/_source/equipment24/weapons/simple-melee/dagger.yml`
  - `packs/_source/equipment24/weapons/magical/dagger-of-venom.yml`
  - `packs/_source/equipment24/weapons/magical/giant-slayer.yml`
  - `packs/_source/equipment24/consumables/potions/healing/potion-of-healing.yml`
  - `packs/_source/equipment24/consumables/bead-of-force.yml`
  - `packs/_source/equipment24/consumables/oil-of-sharpness.yml`
  - `packs/_source/equipment24/equipment/boots-of-speed.yml`
  - `classfeatures` compendium entries (e.g., `Second Wind`-style limited-use class feature patterns)
- Foundry v13 integration docs:
  - Hook events: `https://foundryvtt.com/api/modules/hookEvents.html`
  - Document model: `https://foundryvtt.com/api/classes/foundry.abstract.Document.html`
  - Item API: `https://foundryvtt.com/api/classes/foundry.documents.Item.html`
  - ActiveEffect API: `https://foundryvtt.com/api/classes/foundry.documents.ActiveEffect.html`

---

## Baseline runtime model: how usage executes in dnd5e

From `module/documents/activity/mixin.mjs`, activity usage follows a consistent sequence:

1. `activity.use(...)` validates item ownership and visibility/use gates.
2. Pre-use hook: `dnd5e.preUseActivity`.
3. Usage dialog/scaling preparation as needed.
4. Consumption pipeline (`consume`):
   - `dnd5e.preActivityConsumption`
   - calculate usage updates
   - `dnd5e.activityConsumption`
   - apply updates/deltas to actor/item docs
   - `dnd5e.postActivityConsumption`
5. Chat message config/finalization + message creation.
6. Post-use hook: `dnd5e.postUseActivity`.
7. Subsequent actions (attack/save/damage/heal/etc. follow-up flow).

Practical implication: **resource consumption and usage deltas are first-class workflow citizens**, not optional add-ons.

---

## Example-by-example analysis

## Example 1 — Baseline weapon attack workflow

**Source locations**
- Content analogs:
  - `packs/_source/equipment24/weapons/simple-melee/club.yml`
  - `packs/_source/equipment24/weapons/simple-melee/dagger.yml`
- Runtime anchors:
  - `module/data/activity/attack.mjs`
  - `module/documents/activity/mixin.mjs`
  - `module/documents/item.mjs`

**Item/activity type**
- Item `type: weapon`.
- Primary activity `type: attack` under `system.activities.<id>`.

**Important fields used**
- Weapon identity: `system.baseItem`, `system.identifier`, `system.type.value`.
- Attack activity blocks: `activation`, `attack`, `damage`, `range`, `target`.
- Weapon damage identity: `system.damage.base`, optional `system.damage.versatile`.

**Data-driven vs code-driven**
- Data-driven:
  - attack availability and payload shape from activity fields.
  - range/target/damage definitions from item data.
- Code-driven:
  - lifecycle orchestration (validation, consumption, message creation, subsequent actions).

**Required vs optional (practical)**
- Required-like:
  - valid weapon shell + one valid attack activity for an actionable weapon.
  - coherent damage definition.
- Optional:
  - versatile damage, magical bonus, additional rider activities.

**Pattern notes**
- Activation: action/bonus/etc. is activity-level.
- Attack rolls: attack activity handles roll pathway.
- Saves: not required for basic attack.
- Damage/healing: damage block is central.
- Targeting: explicit range/target scaffolding.
- Usage limits: usually none for mundane attacks.
- Scaling: commonly dormant for mundane weapons.
- Effects: commonly empty unless magical rider behavior exists.
- Chat/workflow touchpoint: chat card generated through activity usage pipeline.
- Module-safe extensions: `dnd5e.preUseActivity`, `dnd5e.postUseActivity`.

---

## Example 2 — Consumable item-use workflow (healing)

**Source locations**
- Content analog:
  - `packs/_source/equipment24/consumables/potions/healing/potion-of-healing.yml`
- Runtime anchors:
  - `module/data/activity/heal.mjs`
  - `module/documents/activity/mixin.mjs`

**Item/activity type**
- Item `type: consumable`.
- Primary activity often `type: heal`.

**Important fields used**
- Consumable lifecycle: `system.quantity`, `system.uses`, `system.autoDestroy`.
- Activity consumption: `consumption.targets[]` (commonly `itemUses`).
- Healing payload: activity `healing` block.
- Activation economy: activity `activation`.

**Data-driven vs code-driven**
- Data-driven:
  - heal roll payload and consumption target declaration.
- Code-driven:
  - application of consumption deltas and document updates.

**Required vs optional (practical)**
- Required-like:
  - consumable type scaffold + valid uses/consumption alignment.
  - at least one activity for actual “use”.
- Optional:
  - multi-activity consumable behavior.

**Pattern notes**
- Activation: usually action-based but data-driven.
- Attack rolls: generally no attack roll for potion drink/use.
- Saves: not typical for direct healing potion use.
- Damage/healing: heal activity defines formula.
- Targeting: often self/creature depending analog.
- Usage limits: tightly coupled to uses + potential auto-destroy.
- Scaling: usually static unless configured.
- Effects: optional for ongoing buffs.
- Chat/workflow touchpoint: usage result communicated via activity card.
- Module-safe extensions: consumption hooks + post-use hook are safest.

---

## Example 3 — Save-based offensive consumable/effect workflow

**Source locations**
- Content analogs:
  - `packs/_source/equipment24/consumables/bead-of-force.yml`
  - `packs/_source/equipment24/weapons/magical/dagger-of-venom.yml` (rider save behavior)
- Runtime anchors:
  - `module/data/activity/save.mjs`
  - `module/documents/activity/mixin.mjs`

**Item/activity type**
- `consumable` and/or `weapon` with secondary `save` activity.

**Important fields used**
- Save model: save ability + DC formula on activity payload.
- Damage rider: activity damage parts connected to save outcome behavior.
- Targeting/template fields for AoE-style effects where present.
- Consumption targets + item uses for limited rider activation.

**Data-driven vs code-driven**
- Data-driven:
  - save ability, DC, target shape, and damage structure.
- Code-driven:
  - sequence of usage, consumption, and message assembly.

**Required vs optional (practical)**
- Required-like:
  - coherent save block and DC declaration.
- Optional:
  - complex templates/half-damage logic, multi-step rider orchestration.

**Pattern notes**
- Activation: activity-controlled.
- Attack rolls: may coexist with attack in multi-activity item.
- Saves: primary in this workflow.
- Damage/healing: damage on failed/partial outcomes encoded in activity schema.
- Targeting: explicit for area or selected targets.
- Usage limits: often item-use gated.
- Scaling: optional.
- Effects: frequently used for conditions/riders.
- Chat/workflow touchpoint: save prompts/results routed through usage message card path.
- Module-safe extensions: pre/post use + consumption hooks.

---

## Example 4 — Feature/feat with activatable limited-use action

**Source locations**
- Content analogs:
  - `classfeatures` compendium entries with activatable class features (e.g., `Second Wind` pattern)
  - `packs/_source/equipment24/equipment/boots-of-speed.yml` for non-feat but clear limited-use activatable utility pattern
- Runtime anchors:
  - `module/data/item/feat.mjs`
  - `module/data/activity/utility.mjs` / `heal.mjs` (depending feature)
  - `module/documents/activity/mixin.mjs`

**Item/activity type**
- Item `type: feat` (class feature-as-item pattern in dnd5e).
- Activity often `utility` or `heal` depending effect.

**Important fields used**
- Feature identity: `system.identifier`, `system.type.value`, `requirements/prerequisites`.
- Usage limits: `system.uses.max/spent/recovery`.
- Activity consumption targets aligned to those uses.
- Activation + optional target/save/damage/healing blocks per activity type.

**Data-driven vs code-driven**
- Data-driven:
  - uses/recovery declarations and activity payload.
- Code-driven:
  - reset/consumption application and final usage steps.

**Required vs optional (practical)**
- Required-like:
  - valid feat shell + one valid activity for active feature.
  - coherent uses/recovery when limited-use.
- Optional:
  - multiple linked activities, riders, effects.

**Pattern notes**
- Activation: always activity-level.
- Attack/saves: included only if relevant to this feature.
- Damage/healing: via activity type payload.
- Targeting: by activity target block.
- Usage limits/recharge: via uses + recovery cadence.
- Scaling: optional; often driven by level/relevant-level settings.
- Effects: passive or applied effects may coexist with activity.
- Chat/workflow touchpoint: same activity lifecycle, card creation, deltas.
- Module-safe extensions: hooks; avoid patching feat internals directly.

---

## Example 5 — Enchantment/effect-application workflow via item use

**Source locations**
- Content analogs:
  - `packs/_source/equipment24/consumables/oil-of-sharpness.yml`
  - `packs/_source/equipment24/weapons/magical/flame-tongue.yml` (analog class of enchant/rider behavior)
- Runtime anchors:
  - `module/documents/active-effect.mjs`
  - `module/data/activity/fields/applied-effect-field.mjs`
  - `module/documents/activity/mixin.mjs`

**Item/activity type**
- Consumable/weapon with enchantment-like activity + embedded effects.

**Important fields used**
- Embedded `effects[]` definitions with dnd5e-recognized keys.
- Activity-linked effect application references (applied-effect fields).
- Restrictions/eligibility definitions in activity/effect data.

**Data-driven vs code-driven**
- Data-driven:
  - which effect is applied and under what content-declared constraints.
- Code-driven:
  - suppression, applicability, and runtime effect handling semantics.

**Required vs optional (practical)**
- Required-like:
  - valid effect payload shape and recognized change keys.
- Optional:
  - advanced suppression/enchantment/rider linking.

**Pattern notes**
- Activation: activity-triggered effect application.
- Attack/saves: optional and item-specific.
- Damage/healing: may be inherited via rider activities.
- Targeting: often constrained by valid target/item constraints.
- Usage limits: often combined with item uses.
- Scaling: optional.
- Effects: primary behavior carrier.
- Chat/workflow touchpoint: effect refs included in usage message config.
- Module-safe extensions: observe hooks and store module state in module flags.

---

## Cross-example comparison

## 1) Practical summary of dnd5e activity/item-use workflow structure

- dnd5e treats **activity documents as execution units** for item actions.
- Item data declares what can happen (activation, targeting, attack/save/heal/damage payloads, costs).
- Activity runtime handles when/how it happens (validation, scaling, consumption, chat creation, follow-up actions).
- Effects are a parallel mechanism: passive automation or applied-on-use behavior.
- Limited uses/recovery are first-class and feed directly into consumption/update pipelines.

## 2) Minimum checklist for safest workflow types

### A. Safe baseline active attack item
- Valid item shell (`name/type/system/effects/flags/_stats`).
- `system.identifier` and expected type/category fields.
- One `system.activities.<id>` with `type: attack`.
- Coherent `activation`, `attack`, `damage`, `range`, `target`.

### B. Safe baseline consumable use
- Valid consumable shell.
- `system.quantity`, `system.uses`, and optional `autoDestroy` aligned with intent.
- One `heal` or `utility` activity.
- `consumption.targets[]` aligned to item uses if charges are consumed.

### C. Safe baseline save-based activity
- One `save` activity with explicit save ability + DC formula.
- Coherent targeting/template/range.
- Damage/healing subpayload only if analog includes it.

## 3) Optional fields that add complexity

- Multi-activity items with rider sequencing.
- Consumption targeting actor resources in addition to item uses.
- Recharge/recovery variants and conditional resets.
- Advanced scaling blocks.
- Applied effect references and enchantment restrictions.
- Concentration/cause metadata in usage config flow.
- Chat flavor and card metadata customization.

## 4) Details future Codex tasks should not guess about

- Exact enum tokens for activity/item subtype fields.
- Exact `uses.recovery` object shapes and period/type values.
- Save/DC formula conventions for each activity family.
- Effect `changes[].key` paths/modes/values unless seen in current dnd5e analogs.
- Internal/undocumented `flags.dnd5e.*` semantics.
- Whether behavior belongs in activity payload vs effect vs advancement.
- Chat-card DOM shape and internal CSS selectors.

## 5) Module-safe extension points vs risky internals

### Module-safe extension points
- dnd5e usage hooks:
  - `dnd5e.preUseActivity`
  - `dnd5e.postUseActivity`
  - `dnd5e.preActivityConsumption`
  - `dnd5e.activityConsumption`
  - `dnd5e.postActivityConsumption`
- dnd5e item hook touchpoint:
  - `dnd5e.preDisplayCard`
- Foundry generic hooks (`preCreateDocument`, `updateDocument`, etc.) for non-system-specific interception.
- Module-owned flags (non-dnd5e namespace) for custom state.

### Risky internal areas
- Underscored/private-ish methods in dnd5e documents/data models (`_prepare*`, `_finalize*`, `_migrate*`).
- Direct sheet/document overrides of dnd5e core classes.
- Direct assumptions about chat card markup internals.
- Depending on undocumented dnd5e-internal flags.

## 6) Safest first workflow-oriented vertical slice for SWF next

**Recommended slice:**

A single `feat` item with one **simple, limited-use `heal` activity** that consumes `itemUses` and posts normal dnd5e usage/chat output, with no sheet overrides and no custom JS behavior.

Why this slice is safest:
- exercises activity use pipeline end-to-end (activation → consume → chat);
- exercises limited-use + recovery behavior;
- avoids attack+save+rider combinatorics early;
- remains strictly data-driven and analog-friendly.

## 7) Step-by-step implementation plan for that slice (do not implement yet)

1. Pick 2–3 live analogs before authoring:
   - one limited-use class feature,
   - one consumable heal,
   - one utility/equipment item with uses+recovery.
2. Copy a closest analog item shell (feat type preferred) into SWF pack source.
3. Set stable identity fields (`identifier`, type/category, description scaffolding).
4. Add exactly one `heal` activity with minimal required blocks:
   - `activation`, `healing`, `target`, `range` (if analog includes), `consumption`.
5. Wire consumption to `itemUses` and set `system.uses` + `recovery` cadence from analog.
6. Avoid riders/effects/scaling unless the first analog requires them.
7. Validate YAML and field names against dnd5e analog schema shape.
8. In Foundry v13+dnd5e, manually verify:
   - feature appears and is usable,
   - uses decrement and recover on expected rest/period,
   - chat card and roll output render without errors.
9. Record test notes and only then add one complexity dimension (e.g., save rider or effect application).

---

## Manual test steps for this analysis artifact

1. Open this file and verify all source anchors resolve to real dnd5e paths or Foundry docs URLs.
2. Confirm each example maps to one of the requested workflow categories (attack, consumable use, feature action, save/effect, healing/damage).
3. Validate future-slice plan avoids overriding dnd5e core docs/sheets and uses hook-safe extension points only.
