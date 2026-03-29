# dnd5e Item Pattern Deep-Dive (analysis-first) — 2026-03-29

This document is a source-grounded analysis for **future module content creation** (no gameplay content generated here).

## Reference implementation and integration sources

- dnd5e repository: `foundryvtt/dnd5e` (GitHub default branch as inspected on 2026-03-29).
- Foundry VTT integration source: API docs for Item document (v13).

### Foundry v13 integration anchors
- Foundry Item API page: `https://foundryvtt.com/api/classes/foundry.documents.Item.html`
  - Item extends BaseItem and uses typed document data.
  - Source data is sealed; arbitrary keys should not be added.
  - Validation/schema behavior is DataModel-driven.

---

## Category analysis (2–3 analogs each)

## 1) Simple weapon

### Analog examples (dnd5e)
1. `packs/_source/equipment24/weapons/simple-melee/club.yml`
2. `packs/_source/equipment24/weapons/simple-melee/dagger.yml`

### Item type
- `type: weapon`

### Important system fields observed
- Identity & categorization:
  - `system.type.value` (`simpleM`)
  - `system.baseItem` (`club`, `dagger`)
  - `system.identifier`
- Economy/inventory:
  - `system.price`, `system.weight`, `system.quantity`
- Weapon mechanics:
  - `system.damage.base` (dice and damage type)
  - `system.damage.versatile` (present even when empty)
  - `system.properties` (`lgt`; `fin/lgt/thr`)
  - `system.range` / `system.reach`
  - `system.magicalBonus` (null for mundane)
- Action automation:
  - `system.activities.<id>.type: attack`
  - attack configuration under `attack`, `damage`, `range`, `target`, `activation`

### Required vs optional (practical)
- Required-like in practice:
  - top-level document shell (`name/type/img/system/effects/flags/_stats`)
  - weapon identity (`system.type.value`, `system.baseItem`, `system.identifier`)
  - at least one usable attack activity for actionable weapons
  - base damage for standard weapons
- Optional/common:
  - `magicalBonus`
  - non-empty `damage.versatile`
  - specialized properties/mastery beyond archetype baseline
  - embedded `effects`

### Pattern notes
- **Activities:** single `attack` activity is the baseline.
- **Uses/recharge:** generally unused for simple mundane weapons.
- **Scaling:** present as nested keys but not usually active.
- **Effects:** often empty.
- **Damage:** stored both in base weapon damage and possibly activity parts.
- **Targeting/range:** activity range frequently explicit (`5 ft`, `20/60 ft`), target scaffolding present.
- **Activation/consumption:** usually action economy only; no consumable target.
- **Chat/usage touchpoint:** `description.chatFlavor` field exists on activities; often blank in simple cases.

---

## 2) More complex weapon

### Analog examples (dnd5e)
1. `packs/_source/equipment24/weapons/magical/dagger-of-venom.yml`
2. `packs/_source/equipment24/weapons/magical/giant-slayer.yml`
3. `packs/_source/equipment24/weapons/magical/flame-tongue.yml` (folder-level analog for similar enchant/rider pattern)

### Item type
- `type: weapon`

### Important system fields observed
- Baseline weapon fields from simple weapon pattern, plus:
- Multi-activity design:
  - Attack activity + additional `save` or `enchant` activity.
  - Activity `consumption.targets` using `itemUses` for gated powers.
- Uses/recovery on item:
  - e.g., `uses.max: '1'`, `recovery: [{period: dawn, type: recoverAll}]`.
- Embedded effects and enchantments:
  - transfer effects modifying weapon image/name/properties or target conditions.
  - rider linkages in `flags.dnd5e.riders.activity`.
- Magic gating:
  - visibility/identification style fields such as `requireMagic`, `requireIdentification` appear in activities.

### Required vs optional (practical)
- Required-like:
  - same baseline as weapon.
- Optional/complex behavior fields:
  - extra activities (`save`, `enchant`, utility).
  - uses/recovery/recharge cadence.
  - transferable or temporary embedded effects.
  - rider wiring via flags.

### Pattern notes
- **Activities:** complexity is usually modeled by adding activities, not custom schema.
- **Uses/recharge:** item-level uses + recovery period for limited powers.
- **Scaling:** often disabled; complex behavior comes from extra activities/effects.
- **Effects:** primary way to represent temporary enchanted states and conditions.
- **Damage:** rider damage appears in `save.damage.parts` etc.
- **Targeting:** explicit target templates/count/type in rider activities.
- **Activation/consumption:** bonus/action activations and item-use consumption targets.
- **Chat/usage touchpoint:** chat flavor can communicate “on hit -> run rider save activity”.

---

## 3) Consumable

### Analog examples (dnd5e)
1. `packs/_source/equipment24/consumables/potions/healing/potion-of-healing.yml`
2. `packs/_source/equipment24/consumables/bead-of-force.yml`
3. `packs/_source/equipment24/consumables/oil-of-sharpness.yml`

### Item type
- `type: consumable`

### Important system fields observed
- Consumable identity:
  - `system.type.value` (`potion`, `trinket`, etc.)
  - `system.identifier`
- Lifecycle and stock:
  - `system.uses.max/spent/recovery`
  - `system.autoDestroy: true` for one-shot usage patterns
  - `system.quantity`
- Activities:
  - `heal`, `save`, `enchant` depending on item behavior.
  - `consumption.targets` with `type: itemUses` is common.
- Damage/healing:
  - heal activity with healing dice + bonus.
  - save activity damage parts and save DC formula.
- Enchantment patterns for applying effects to other items:
  - restrictions by categories/properties (`weapon`, `ammo`, nonmagical, etc.).

### Required vs optional (practical)
- Required-like:
  - consumable `type`, identifier, description, quantity, uses scaffold.
  - at least one activity for automated behavior.
- Optional/complex:
  - multi-activity flows.
  - save + template targeting.
  - enchant application + transfer effects.
  - explicit recovery rules when re-usable consumable behavior exists.

### Pattern notes
- **Activities:** consumables are strongly activity-driven.
- **Uses/recharge:** central to lifecycle; often hard-gated by item uses.
- **Scaling:** typically static, but scaling keys still exist in schema.
- **Effects:** used for ongoing conditions or temporary enchantments.
- **Damage/healing:** model-specific activity types (`heal` vs `save.damage`).
- **Targeting:** self for potions; templates/spheres for thrown items.
- **Activation/consumption:** bonus/action/minute activations and explicit consume target.
- **Chat/usage touchpoint:** description text often explains post-roll handling not fully automated.

---

## 4) Equipment

### Analog examples (dnd5e)
1. `packs/_source/equipment24/equipment/cloak-of-protection.yml`
2. `packs/_source/equipment24/equipment/amulet-of-health.yml`
3. `packs/_source/equipment24/equipment/boots-of-speed.yml`

### Item type
- `type: equipment`

### Important system fields observed
- Categorization:
  - `system.type.value: wondrous` (for these examples)
  - `system.attunement` / `system.attuned`
  - `system.equipped`
- Passive behavior via effects:
  - AC/save bonuses, ability score overrides, movement multipliers in `effects[].changes`.
- Optional active utility:
  - `boots-of-speed` includes a utility activity plus limited uses and LR recovery.

### Required vs optional (practical)
- Required-like:
  - equipment identity + equip/attunement fields.
  - if passive magic bonus is intended, an effect entry with transfer.
- Optional:
  - activities (many equipment entries have `{}` activities).
  - uses/recovery only for activatable equipment powers.

### Pattern notes
- **Activities:** often absent on passive gear.
- **Uses/recharge:** present for active-toggle equipment.
- **Scaling:** uncommon.
- **Effects:** primary automation vehicle for passive items.
- **Damage/healing/targeting:** not central unless item has active powers.
- **Activation/consumption:** when present, usually utility toggles.
- **Chat/usage touchpoint:** descriptions commonly include Foundry notes for what is/isn’t automated.

---

## 5) Tool / utility item

### Analog examples (dnd5e)
1. `packs/_source/equipment24/tools/other/thieves-tools.yml`
2. `packs/_source/equipment24/tools/artisan/alchemists-supplies.yml`
3. `packs/_source/equipment24/tools/other/herbalism-kit.yml` (same folder family pattern)

### Item type
- `type: tool`

### Important system fields observed
- Tool identity:
  - `system.type.value` (`art`, empty+`baseItem`, etc. depending tool family)
  - `system.baseItem`
  - `system.ability` (e.g., `dex`, `int`)
  - `system.identifier`
- Check workflow:
  - `system.activities.<id>.type: check`
  - `check.ability`, `check.dc.formula`, and action activation.
- Proficiency and bonus stubs:
  - `system.proficient`, `system.bonus`.

### Required vs optional (practical)
- Required-like:
  - tool type/base/ability identity
  - at least one check activity for utility automation
- Optional:
  - associated checks, additional activities, extra effects

### Pattern notes
- **Activities:** check activity is dominant.
- **Uses/recharge/scaling:** usually empty/default.
- **Effects:** usually none.
- **Damage/healing:** n/a.
- **Targeting:** commonly self context.
- **Activation/consumption:** action-based use; no itemUse consume in standard tools.
- **Chat/usage touchpoint:** descriptive “Utilize” guidance embedded in item description.

---

## 6) Feat / feature-like with meaningful system data

### Analog examples (dnd5e)
1. `packs/_source/feats24/general-feats/ability-score-improvement.yml`
2. `packs/_source/feats24/general-feats/grappler.yml`
3. `packs/_source/feats24/origin-feats/magic-initiate.yml`
4. `packs/_source/feats24/origin-feats/alert.yml` (effects automation pattern)

### Item type
- `type: feat`

### Important system fields observed
- Feat identity/prereqs:
  - `system.type.value`, `subtype`, `prerequisites.level`, `requirements`, `repeatable`, `identifier`.
- Advancement-centered mechanics:
  - `system.advancement[]` with `AbilityScoreImprovement` and `ItemChoice` entries.
- Passive automation:
  - transfer effects with keys like `flags.dnd5e.initiativeAlert`.
- Activities typically empty for feats unless a direct action is needed.

### Required vs optional (practical)
- Required-like:
  - feat type identity and identifier.
  - prerequisite/repeatable schema where relevant.
- Optional but high-value:
  - advancement records for choices/progression.
  - passive effects for always-on automation.
  - activity entries only when feat is directly activated.

### Pattern notes
- **Activities:** frequently absent.
- **Uses/recharge:** generally unused at feat item level.
- **Scaling:** represented through advancement choices rather than ad hoc fields.
- **Effects:** common for passive toggles/bonuses.
- **Targeting/damage/healing:** only if feat defines an active resolution.
- **Chat/usage touchpoint:** feat descriptions carry rules text + Foundry automation caveats.

---

## Cross-category comparison

## 1) Practical summary of dnd5e item data structure in practice

1. Core Foundry document shell is consistent across item types.
2. Meaningful mechanics are encoded under `system` using typed, schema-backed submodels.
3. dnd5e commonly expresses behavior via three primary channels:
   - `system.activities` for actions/roll workflow,
   - `system.advancement` for selection/progression,
   - `effects` for passive or temporary modifiers.
4. Complex behavior is composed from existing primitives (multiple activities + effects + uses), not custom fields.

## 2) Minimum required field checklist by category

### Simple weapon
- `name`, `type: weapon`, `img`
- `system.identifier`
- `system.type.value`, `system.baseItem`
- base inventory fields (`price`, `weight`, `quantity`)
- base damage object
- one `attack` activity

### Complex weapon
- all simple weapon minimums
- any gating uses/recovery fields if ability is limited
- additional activity entries for rider/save/enchant behavior
- effect entries when temporary/permanent modifiers are part of mechanics

### Consumable
- `name`, `type: consumable`, `img`
- `system.identifier`, `system.type.value`
- `system.uses` scaffold (+ `autoDestroy` when one-shot)
- inventory/economy fields
- at least one activity (`heal`, `save`, `utility`, or `enchant`)

### Equipment
- `name`, `type: equipment`, `img`
- `system.identifier`, `system.type.value`
- attunement/equipped fields
- effect entries for passive bonuses (if automated)
- activities only if actively used

### Tool
- `name`, `type: tool`, `img`
- `system.identifier`, `system.baseItem` and/or tool type value
- `system.ability`
- one `check` activity with DC pattern if automation intended

### Feat/feature
- `name`, `type: feat`, `img`
- `system.identifier`, feat subtype/prereq as needed
- `system.advancement` for selectable gains (if applicable)
- `effects` for passive automation where supported

## 3) Common optional fields enabling complex behavior

- `system.uses.recovery` (dawn, LR, etc.)
- multi-activity item designs (attack + save + enchant)
- activity-level targeting templates and prompt behavior
- embedded transfer/non-transfer effects
- rider linkage in flags (`flags.dnd5e.riders.*`)
- item/enchant restrictions by categories/properties
- magic/identification visibility gates

## 4) Details future Codex tasks should **not** guess

- exact allowed values for:
  - `system.type.value` per item type,
  - activity `type` variants and nested shapes,
  - effect `changes.key` paths and numeric modes,
  - recovery period/type enumerations,
  - advancement type payload schema (`ItemChoice`, `AbilityScoreImprovement`).
- whether a mechanic should be modeled as:
  - activity vs effect vs advancement.
- flags/rider wiring contracts and any hidden assumptions.
- compendium link conventions and identifiers.

Safe rule: copy the closest existing dnd5e analog and only mutate content-bearing values.

## 5) Safest first vertical slice for this repository

**A single simple consumable modeled on `potion-of-healing.yml`** is safest.

Why:
- minimal schema surface,
- clear one-activity usage flow,
- explicit uses + autoDestroy lifecycle,
- straightforward manual validation in Foundry v13 + dnd5e,
- no need for custom JS or sheet overrides.

## 6) Step-by-step implementation plan (do not implement yet)

1. Pick one item concept that maps 1:1 to Potion of Healing behavior.
2. Copy the Potion of Healing schema shape into this module’s item source location.
3. Change only content values (name/description/img/identifier/price/weight/heal dice).
4. Keep activity type `heal` and `consumption.targets` as `itemUses: 1`.
5. Keep uses and auto-destroy lifecycle aligned with the analog unless intentionally different.
6. Validate YAML/data cleanliness and that no undocumented keys were introduced.
7. In Foundry v13 + dnd5e, import item to actor and execute use flow.
8. Manual checks: decrement uses, produce chat card/roll, item destruction at zero uses (if configured).
9. Only after successful manual validation, commit as the first vertical slice.

---

## Files changed
- `docs/dnd5e-item-pattern-analysis-2026-03-29.md`
