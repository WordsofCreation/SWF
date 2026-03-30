# packs/

Contains compendium databases and source YAML used by this module.

## Star Wars compendium taxonomy scaffold (v13 / dnd5e-compatible)

The module now declares explicit, growth-oriented compendium packs by content family:

- `star-wars-compendium` (`JournalEntry`) — **Star Wars Rules**
- `star-wars-species` (`Item`) — **Star Wars Species**
- `star-wars-classes` (`Item`) — **Star Wars Classes**
- `star-wars-backgrounds` (`Item`) — **Star Wars Backgrounds**
- `star-wars-feats` (`Item`) — **Star Wars Feats**
- `star-wars-equipment` (`Item`) — **Star Wars Equipment**
- `star-wars-powers` (`Item`) — **Star Wars Powers** (future-facing Force/tech ability slot)
- `star-wars-creatures` (`Actor`) — **Star Wars Creatures**
- `star-wars-npcs` (`Actor`) — **Star Wars NPCs**

Pack declarations are intentionally conservative and use only dnd5e-compatible document types (`JournalEntry`, `Item`, `Actor`).

## Source YAML

Current source-of-truth YAML remains in:
- `packs/_source/swf-items/`

This architecture step is structural only. Most newly added packs are intentionally empty and reserved for staged content growth.
