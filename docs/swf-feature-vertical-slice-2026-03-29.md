# SWF Feature Vertical Slice (Minimal) — 2026-03-29

This document records the first minimal **feature-like** item slice for the SWF module.

## Scope

Implemented three sample `type: feat` items in `packs/_source/swf-items/`:

1. `SWF Aware Practice` (passive feat-like item; no activities)
2. `SWF Combat Focus` (limited-use feat-like item; uses + short-rest recovery)
3. `SWF Second Breath` (feat-like item with a heal activity using bonus action)

No custom JS logic, sheet overrides, or undocumented schema keys were added.

## dnd5e pattern anchors used

From the prior analysis deep-dive (`docs/dnd5e-feat-feature-pattern-deep-dive-2026-03-29.md`):

- Passive feat model (Alert-style pattern): feat shell with empty activities.
- Limited-use class feature model (Second Wind-style pattern): `system.uses` with short-rest recovery.
- Activity/action feature model (Second Wind-style heal activity): activity-driven behavior under `system.activities`.

## Notes

- Content is intentionally minimal and review-oriented.
- Unknown/high-variance feature schema areas (complex advancement, save/template targeting, effect key automation) are deliberately deferred.
