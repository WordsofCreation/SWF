# Manifest Semantics: `example` vs `canonical`

## Purpose
This note defines repository terminology for module-owned manifest metadata so future tasks do not blur fixture usage with source-of-truth shape decisions.

## Definitions
- **`example`**
  - A sample/illustrative manifest artifact used as a fixture-style reference.
  - In this repository, `example: true` indicates the manifest is intentionally tagged as example content.
  - `example` is metadata and is not itself a required schema field.

- **`canonical`**
  - The currently approved reference shape/interpretation this repository treats as source of truth for read-only comparison and future tooling decisions.
  - Canonical meaning currently comes from explicit designation in repo assets and inventory layers (for example: `data/manifests/canonical-*.json` plus `scripts/data/canonical-field-inventory.js`).

## Relationship Rules
1. Not every example is canonical.
2. In the current repo state, canonical manifest files are a **subset of examples** (they are tagged `example: true` and also designated as canonical by location/name and usage).
3. Future non-canonical examples are allowed without changing canonical rules.

## Current Source-of-Truth Guidance
For module-owned manifest shape discussions, treat the following as canonical sources of truth (in priority order):
1. `scripts/data/canonical-field-inventory.js` for explicit canonical field expectations.
2. `data/manifests/canonical-*.json` for canonical example artifacts used by read-only comparison/diagnostic layers.
3. Validation and starter layers as supporting references, not a replacement for explicit canonical designation.

## Non-Goals (This Step)
- No runtime behavior changes.
- No manifest conversion/import/export semantics.
- No Foundry document creation or mutation.
