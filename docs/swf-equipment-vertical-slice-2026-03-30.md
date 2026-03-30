# SWF Equipment Vertical Slice (Starter Set) — 2026-03-30

## Decision implemented

Add one narrow, conservative, dnd5e-compatible starter equipment set using Star Wars names/flavor while preserving the baseline 5e chassis and item schemas.

## dnd5e analogs inspected before authoring

1. `foundryvtt/dnd5e` `packs/_source/equipment24/weapons/simple-melee/dagger.yml` (weapon baseline, simple attack activity)
2. `foundryvtt/dnd5e` `packs/_source/equipment24/weapons/martial-ranged/heavy-crossbow.yml` (stronger ranged weapon baseline)
3. `foundryvtt/dnd5e` `packs/_source/equipment24/armor/light/leather-armor.yml` (light armor baseline)
4. `foundryvtt/dnd5e` `packs/_source/equipment24/consumables/potions/healing/potion-of-healing.yml` (consumable shape/uses pattern)

## What is mechanically stable vs re-themed

Mechanically stable:
- dnd5e `Item` types (`weapon`, `consumable`, `equipment`)
- conservative `system` field usage already present in SWF and dnd5e patterns
- standard attack activity shell for weapons
- standard AC model for light armor equivalent
- simple uses tracking for consumable support gear

Re-themed:
- names, description flavor, and presentation text to Star Wars framing
- item labels map to familiar 5e analogs without new subsystem logic

## Starter equipment entries

- Blaster Pistol (hand-crossbow-style simple ranged sidearm)
- Blaster Rifle (heavy-crossbow-style martial ranged weapon)
- Vibroknife (dagger analog)
- Training Lightsaber (restrained longsword-style training weapon)
- Medpac (healer's-kit-style consumable support gear with uses)
- Light Combat Gear (leather-armor analog)

## Assumptions and explicit deferrals

Assumptions:
- No separate ammo/power-cell subsystem in this slice.
- Blasters remain conservative ranged-weapon analogs using standard weapon fields.
- Medpac uses simple uses-tracking and descriptive guidance rather than automated stabilize/heal workflows.

Deferred:
- bulk item expansion
- species/class/actor content
- advanced automation, Active Effects, macros, or custom schema fields
- firearm/energy-specific mechanics
