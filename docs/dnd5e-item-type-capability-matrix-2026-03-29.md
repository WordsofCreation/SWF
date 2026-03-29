# dnd5e Item-Type Capability Matrix (image-aligned) — 2026-03-29

## Purpose

This note answers the question: **do we fully understand the full functionality of the item-type choices shown in the provided image** (`background`, `class`, `consumable`, `container`, `equipment`, `facility`, `feat`, `loot`, `species`, `spell`, `subclass`, `tattoo`)?

Short answer: **we have a strong directional model, but not full implementation coverage yet**. We now track this explicitly in code (`item-type-capability-matrix.js`) to make slice planning objective.

## Primary references used

- Foundry VTT v13 module development docs (module package model and add-on behavior).
- Foundry VTT v13 system development docs (explicitly encourages studying real systems).
- Public `foundryvtt/dnd5e` repository (MIT) as the schema and content pattern reference.

## What “full functionality” means in this repo

For SWF, “full functionality” for one item type means all of the following are true:

1. We have inspected 2–3 dnd5e analogs for that exact type.
2. We can describe the minimum viable data shape without inventing fields.
3. We have one vertical-slice SWF example for that type.
4. The item behaves correctly in Foundry v13 + dnd5e in manual testing.

## Current capability status (image item types)

- **Implemented local vertical slice**
  - `class`
  - `consumable`
  - `feat` (used for SWF feature entries)
  - `subclass`
- **Not yet implemented as SWF vertical slices**
  - `background`, `container`, `equipment`, `facility`, `loot`, `species`, `spell`, `tattoo`

This means we understand the direction and constraints, but we are **not yet at full functional coverage across all image-listed types**.

## Implications for next slices

Recommended order for lowest-risk expansion:

1. `equipment` (passive effect baseline)
2. `loot` (inventory/economy baseline)
3. `spell` (single low-complexity cast activity)
4. `background` or `species` (advancement-heavy patterns)
5. `container`, `facility`, `tattoo` (after confirming latest upstream nuances)

## Manual validation checklist (for any new type)

1. Import or load the SWF entry in a world using Foundry v13 + dnd5e.
2. Open the item sheet and confirm no schema warnings in console.
3. Execute each activity once from chat/sheet (if applicable).
4. Confirm uses/recovery/effects behavior is aligned with dnd5e analog behavior.
5. Confirm no custom undocumented fields were introduced.

