# SWF Item Vertical Slice (Minimal) — 2026-03-29

This document records the first minimal item content slice for the SWF module.

## Scope

Implemented exactly three sample items in `packs/_source/swf-items/`:

1. `SWF Training Dagger` (`type: weapon`)
2. `SWF Restorative Tonic` (`type: consumable`)
3. `SWF Steady Hands` (`type: feat`)

No custom JS logic, sheet overrides, or undocumented schema keys were added.

## Reference patterns used

Patterns were taken from the repository analysis in:

- `docs/dnd5e-item-pattern-analysis-2026-03-29.md`

Specifically:

- Simple weapon analogs: `club.yml`, `dagger.yml`
- Consumable analogs: `potion-of-healing.yml`, `bead-of-force.yml`, `oil-of-sharpness.yml`
- Feature-like choice: `type: feat` with minimal feature scaffolding (description, feature type, uses scaffold, identifier, and empty activities/effects)

## Notes

- This slice intentionally stays in `_source` YAML for reviewability.
- Import/build workflow for compendium DB generation is deferred to a follow-up slice.
- Where the feat schema can vary by origin (class/race/general feat), this slice uses a conservative general feat shape.
