# packs/

Contains compendium-related content and source YAML.

Current state:
- Source item definitions live in `packs/_source/swf-items/`.
- One initial module compendium pack is now registered in `module.json` at `packs/star-wars-compendium.db` as a `JournalEntry` pack labeled **Star Wars Compendium**.
- The first registered pack is intentionally scaffold-only (empty) for safe in-Foundry visibility testing.

- Current workflow-oriented sample trio in `_source/swf-items/`:
  - `swf-training-dagger.yml` (weapon attack)
  - `swf-second-breath.yml` (feat-like limited-use action/heal)
  - `swf-restorative-tonic.yml` (consumable use/consume)
