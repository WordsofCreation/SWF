# dnd5e Feat + Feature-like Item Pattern Deep-Dive (analysis-first) — 2026-03-29

This document is an analysis-only reference for future SWF content tasks. No new gameplay feature data is being generated here.

## Scope and source anchors

- Pattern library: dnd5e reference implementation (5.3.x family as mapped in this repo’s codebase-map docs).
- Integration authority: Foundry VTT v13 Item/DataModel API behavior.
- Primary schema anchor:
  - `module/data/item/feat.mjs` (dnd5e)
  - key behaviors: feat schema, prerequisites validation, type/subtype labeling, activity/favorite/sheet preparations, migration hooks.
- Supporting runtime anchors:
  - `module/documents/item.mjs` (item-use + chat workflow touchpoints)
  - `module/documents/activity/mixin.mjs` (activity use/consume/recharge/scaling lifecycle)
  - `module/documents/active-effect.mjs` (effect application and suppression/enchantment logic)

Foundry v13 anchor reminders:
- Item data is DataModel-backed and source data is sealed; adding undocumented keys is unsafe.
- Document hooks and item lifecycle are authoritative from Foundry API docs.

---

## What counts as “feature-like” in dnd5e practice

In dnd5e, a large set of capabilities that players call “features” are represented as `Item` documents, most commonly `type: feat`, but also sometimes as spell-like or other item/document interactions depending on mechanics. For this repo’s future module content, treat `type: feat` as the default model unless a direct dnd5e analog clearly uses another item type.

---

## Example set (broad coverage)

> Note: Where the pack YAML path is not guaranteed from this repository alone, exact compendium content location is provided.

## Example A — Passive feat automation

- Source location:
  - dnd5e pack content location: `feats24 / origin-feats / Alert`.
  - referenced previously in this repo: `packs/_source/feats24/origin-feats/alert.yml`.
- Item type:
  - `feat`.
- Pattern highlights:
  - passive behavior primarily through `effects[]` (transfer/passive change keys), not activities.
  - `system.activities` is often empty or minimal for passive-only feats.
  - `system.requirements`/`system.prerequisites` can exist even if no activatable action exists.
- Required vs optional (practical):
  - required-like: identity shell + feat subtype/identifier + requirements scaffold.
  - optional: any effect change keys (only when an existing dnd5e key path is known-valid).

## Example B — Limited-use class feature

- Source location:
  - dnd5e compendium location: `classfeatures` pack entry `Second Wind` (Fighter).
- Item type:
  - `feat` (class feature represented as feat item).
- Pattern highlights:
  - limited-use capability uses `system.uses` + recovery cadence (`shortRest`, `longRest`, or specific period patterns in current schema usage).
  - often paired with a `heal` or `utility` activity under `system.activities`.
  - activation economy is modeled in activity activation fields.
- Required vs optional (practical):
  - required-like when limited: coherent uses scaffold (`max`, `spent`, recovery object/array shape per current schema).
  - optional: complex recharge variants or additional utility activities.

## Example C — Feature with action/activity workflow

- Source location:
  - dnd5e compendium location: `classfeatures` entries with activatable abilities (e.g., action/bonus utility features).
  - schema/runtime anchors: `module/data/activity/_module.mjs` + `module/documents/activity/mixin.mjs`.
- Item type:
  - `feat`.
- Pattern highlights:
  - behavior is represented by one or more `system.activities.<id>` nodes.
  - each activity has a declared `type` (`attack`, `save`, `heal`, `utility`, etc.) and type-specific subfields.
  - usage flow (chat card, consume prompts, scaling checks, roll config) happens in activity document lifecycle, not ad hoc feat fields.
- Required vs optional (practical):
  - required-like for active feature: one valid activity node with valid activity type payload.
  - optional: multiple activities for rider/secondary effects.

## Example D — Targeting + save considerations

- Source location:
  - dnd5e compendium location: `classfeatures` and `monsterfeatures` entries that force saves (e.g., breath-like, aura-like, or channel effects).
- Item type:
  - `feat` for most feature entries; monster abilities are often still feature-like item records.
- Pattern highlights:
  - save logic is activity-driven (`type: save`) with explicit save ability/DC formula fields.
  - targeting (creature count/type/template/range) is represented in activity targeting/range fields.
  - damage/healing riders hang off activity payloads, not free-form top-level feat keys.
- Required vs optional (practical):
  - required-like for save features: valid save block + target/range structure aligned to activity type.
  - optional: half-damage/on-save rider specifics, template prompts, condition effects.

## Example E — Scaling, recharge, or resource consumption

- Source location:
  - schema/runtime anchors: `module/documents/activity/mixin.mjs`, plus feat migration and usage handling in `module/data/item/feat.mjs`.
  - dnd5e compendium location: feature entries with uses/recovery/recharge patterns.
- Item type:
  - `feat`.
- Pattern highlights:
  - consumption can target item uses/resources through activity consumption targets.
  - recharge/charged-state handling exists and includes migration handling in feat data model.
  - scaling is resolved through activity scaling workflows and/or advancement-driven progression, depending on feature design.
- Required vs optional (practical):
  - required-like when resource-gated: coherent consumption target and uses/recovery data.
  - optional: nuanced recharge gates or multi-resource consumption logic.

## Example F — Advancement/progression relevance

- Source location:
  - dnd5e pack location: `feats24 / general-feats / ability-score-improvement`.
  - dnd5e pack location: `feats24 / origin-feats / magic-initiate`.
- Item type:
  - `feat`.
- Pattern highlights:
  - progression choices are modeled in `system.advancement[]` entries (e.g., ASI, item choice style advancements).
  - feature gains from classes/subclasses rely on advancement linkages and identifiers rather than arbitrary custom fields.
  - feat model includes class-linked advancement behavior distinctions (`advancementClassLinked` behavior).
- Required vs optional (practical):
  - required-like when granting selections/progression: valid advancement objects with known advancement `type` payloads.
  - optional: additional gating through prerequisites and repeatability flags.

## Example G — Feature that grants/modifies another capability

- Source location:
  - dnd5e pack location: `feats24 / origin-feats / magic-initiate` (granting additional selectable capabilities).
  - feat model enchantment-source behavior in `module/data/item/feat.mjs` (`isEnchantmentSource` + feature subtype handling).
- Item type:
  - `feat`.
- Pattern highlights:
  - “granting” is generally represented by advancement choices (adding items/spells/features) or effect-based modifiers.
  - subtype/category in `system.type` influences how feature is labeled and handled.
  - enchantment-like group features use explicit feature type/subtype semantics; do not invent new grant channels.
- Required vs optional (practical):
  - required-like: identifier + type/subtype + advancement/effect structures matching known patterns.
  - optional: specialized subtype behavior where dnd5e already defines subtype vocabulary.

---

## Cross-example synthesis

## 1) Practical summary: how feat/feature-like items are structured in practice

1. Core item shell is stable; meaningful behavior lives under schema-backed `system` keys.
2. `feat` model composes shared templates: activities, advancement, description, and item type.
3. Most active behavior is activity-centric; most passive behavior is effect-centric.
4. Progression/granted capabilities are advancement-centric.
5. Prerequisites/requirements/repeatability are explicit fields with built-in validation behavior.
6. Uses/recovery/recharge are modeled fields and should be reused instead of custom logic.

## 2) Minimum required field checklist (safe feature patterns)

For a conservative `type: feat` entry:

- Top-level:
  - `name`, `type`, `img`, `system`, `effects`, `flags`, `_stats`.
- Core feat identity:
  - `system.identifier`.
  - `system.type.value` (and subtype when needed by analog).
  - `system.requirements` (nullable but present in schema).
- Description scaffolding:
  - `system.description` fields used by dnd5e pattern.
- Passive-only feat minimum:
  - no activity required if feature is genuinely passive and analogs are passive-only.
- Active feat minimum:
  - at least one valid `system.activities.<id>` entry with correct type payload.
- Limited-use minimum (if applicable):
  - complete `system.uses` + recovery shape aligned to current analog.

## 3) Optional fields that add complexity

- `system.prerequisites.items` / `system.prerequisites.level` / `system.prerequisites.repeatable`.
- `system.advancement[]` entries (ASI, item/spell/feature choices, progression links).
- activity-level save/target/range/template/damage/healing blocks.
- activity `consumption.targets` for item uses/resources.
- recharge-specific state/fields where analogs include them.
- `effects[]` with transfer/suppression/enchantment semantics.
- feature subtype patterns that alter labeling or behavior (per `CONFIG.DND5E.featureTypes`).

## 4) High-risk details future tasks should not guess

- exact enum values for `system.type.value` and subtype keys.
- exact recovery/recharge object shape and period/type tokens.
- exact activity type payload structures (save vs heal vs attack etc.).
- effect `changes[].key` paths/modes/values unless observed in current dnd5e content.
- advancement object schema per advancement type.
- whether a mechanic belongs in activity, effect, advancement, or a combination.
- hidden coupling in `flags.dnd5e.*` (only use when seen in direct analogs).

## 5) Safest first feature vertical slice for SWF (next implementation)

A **single passive feat-style feature with one known-valid passive effect key already used by dnd5e feats** is the safest next slice.

Why this is safest:
- smallest schema surface area,
- avoids high-variance activity/target/save payloads,
- validates feat identity + passive effect workflow end-to-end,
- no sheet override or dnd5e core replacement required.

## 6) Step-by-step implementation plan (do not implement yet)

1. Pick one passive feature concept with a close analog in `feats24` (prefer origin/general feat analog).
2. Copy a closest dnd5e passive feat data shape into SWF source item YAML.
3. Keep top-level and core feat schema scaffolding intact (`identifier`, `type`, `requirements`, description).
4. If adding automation, use exactly one effect key/value/mode pattern already observed in dnd5e feat data.
5. Leave `activities` empty unless analog requires activation.
6. Keep prerequisites minimal unless explicitly required by the concept.
7. Validate YAML format and ensure no undocumented system keys were introduced.
8. In Foundry v13 + dnd5e, import to actor and verify: appears as feat, passive effect applies, no console/data-model errors.
9. Record manual validation notes before moving to a second (active or limited-use) slice.

---

## Manual validation recipe for future tasks using this analysis

1. Re-open 2–3 nearest dnd5e analog entries before authoring any new feat/feature item.
2. Confirm field presence/order/shape against those analogs and against `feat.mjs` schema expectations.
3. Use Foundry v13 item creation/import to catch DataModel validation issues early.
4. Verify in-play usage path (passive effect or activity chat card) without custom JS first.
5. Only after a successful minimal slice, add one complexity dimension at a time (uses, then save/target, then progression).
