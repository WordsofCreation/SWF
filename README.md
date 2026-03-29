# SWF Foundry Module (Scaffold)

## Purpose
This repository is a **Foundry Virtual Tabletop v13 add-on module** scaffold intended to extend the **dnd5e** system over time.

## Scope Boundaries
- Target **Foundry VTT v13 only**.
- This is a **module**, not a custom game system.
- Do **not** override dnd5e core sheets or document classes.
- Do **not** add optional third-party integrations yet.
- Do **not** invent custom document schema at this stage.
- Prefer dnd5e-aligned data/content patterns over custom code when adding gameplay content.

## Current Status
Initial minimal content slice added under `packs/_source/swf-items/` with three dnd5e-pattern sample items (weapon, consumable, feat).

## Next Recommended Tasks
1. Inspect 2–3 analogous dnd5e reference examples for a first target content type (e.g., one simple item).
2. Define a single vertical slice (e.g., one item or one feature) and implement it using dnd5e patterns.
3. Add manual validation steps in Foundry v13 for that slice.
4. Create the first compendium pack metadata and placeholder entry only after reference inspection.
