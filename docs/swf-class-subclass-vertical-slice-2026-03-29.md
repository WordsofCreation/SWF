# SWF Class/Subclass Vertical Slice (Minimal) — 2026-03-29

## Scope

Implemented one minimal class/subclass progression slice in `packs/_source/swf-items/`:

1. Class: `SWF Vanguard` (`type: class`)
2. Subclass: `SWF Guardian Calling` (`type: subclass` linked by `classIdentifier`)
3. Supporting features:
   - `SWF Vanguard Drill` (`type: feat`, granted at class level 1)
   - `SWF Guardian Posture` (`type: feat`, granted at subclass level 3)

No custom JS logic, sheet overrides, or undocumented schema keys were introduced.

## Pattern anchors from dnd5e analysis

Per `docs/dnd5e-class-subclass-pattern-deep-dive-2026-03-29.md`, this slice follows:

- Base class patterns from `fighter.yml` and `rogue.yml`.
- Subclass patterns from `champion.yml` and `thief.yml`.
- Feature grant progression via `ItemGrant` + UUID references, with subclass selection via `Subclass` advancement.

## Notes

- This slice intentionally keeps class/subclass definitions minimal: hit points advancement, one level-1 feature grant, and one subclass selection gate at level 3.
- Trait, starting-equipment trees, ASI scaffolding, and choice-based advancements are intentionally deferred.
- UUID links target the same SWF source-item compendium namespace pattern and should be validated once pack registration/build steps are added.
