# SWF Workflow-Oriented Vertical Slice (v1) — 2026-03-29

This document captures the first minimal, reviewable workflow slice for this Foundry VTT v13 dnd5e module.

## Before changes: reference patterns selected

The following analyzed dnd5e examples were used as pattern anchors:

1. **Basic attack item workflow**
   - `equipment24/weapons/simple-melee/dagger.yml`
   - `equipment24/weapons/simple-melee/club.yml`
   - Why: both are low-variance baseline weapon records with a single `attack` activity and no custom logic.

2. **Feature-like action workflow**
   - Class-feature style `Second Wind` pattern from dnd5e class features (as captured in prior analysis)
   - `equipment24/equipment/boots-of-speed.yml` (limited-use activatable utility pattern)
   - Why: this provides a conservative feat-like action model with `uses` + `recovery` + activity-driven resolution.

3. **Consumable use/consumption workflow**
   - `equipment24/consumables/potions/healing/potion-of-healing.yml`
   - `equipment24/consumables/bead-of-force.yml`
   - Why: potion/healing is the safest low-complexity consumption path, and bead-of-force confirms save/use-driven consumable activity patterns.

## Assumptions

- Existing SWF `_source` item YAML is the current review surface for content.
- Compendium packing/registration is intentionally deferred.
- `SWF Second Breath` is treated as a class-feature-like feat item and is expected to be used on a compatible actor (fighter-level formula token in bonus healing).

## Data-driven vs code-driven in this slice

- **Data-driven (implemented):**
  - Item `system` data, `system.activities`, `system.uses`, and `consumption.targets`.
  - No new schema keys beyond observed dnd5e patterns.
- **Code-driven (existing dnd5e runtime):**
  - Activity lifecycle orchestration, resource consumption updates, chat card generation, and roll resolution.
- **Module custom code added:** none for workflow behavior.

## Implemented sample content (first workflow slice)

1. `SWF Training Dagger` (`type: weapon`) — basic attack workflow.
2. `SWF Second Breath` (`type: feat`) — action economy + limited use + heal activity workflow.
3. `SWF Restorative Tonic` (`type: consumable`) — confirmed item-use consumption workflow.

## Field uncertainty notes (explicit)

- `SWF Second Breath` healing bonus uses `@classes.fighter.levels` following the Second Wind-style pattern.
  - This is intentionally preserved from the analyzed class-feature model.
  - If actor class-agnostic behavior is desired later, this token should be revisited with an explicit dnd5e analog before changing.

## What should be analyzed next (before more complex workflows)

1. Save outcome granularity (half damage / success behavior) across `save` activities.
2. Applied-effect linking (`appliedEffects` / rider wiring) for multi-step items.
3. Template-targeted area workflows and target prompt behavior.
4. Long-rest/dawn recharge interactions with mixed activity consumption targets.
