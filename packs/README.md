# packs/

Contains compendium-related content and source YAML.

Current state:
- Source item definitions live in `packs/_source/swf-items/`.
- `module.json` currently registers:
  - `packs/star-wars-compendium.db` as `JournalEntry` (**Star Wars Compendium**) for conversion/rules journal visibility.
  - `packs/star-wars-equipment.db` as `Item` (**Star Wars Equipment**) for starter Star Wars-themed dnd5e-compatible gear.

- Starter Star Wars equipment set in this slice:
  - `Blaster Pistol`
  - `Blaster Rifle`
  - `Vibroknife`
  - `Training Lightsaber`
  - `Medpac`
  - `Light Combat Gear`

- Source-of-truth YAML for review remains in `_source/swf-items/`.
