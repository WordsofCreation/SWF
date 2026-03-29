# dnd5e Reference Pattern Analysis (2026-03-29)

Reference branch/source inspected: `foundryvtt/dnd5e` branch `5.3.x` and Foundry API v13 docs.

## Sources inspected

### Consumables
- `packs/_source/items/potion/potion-of-healing.yml`
- `packs/_source/items/potion/antitoxin.yml`
- `packs/_source/items/potion/alchemists-fire.yml`

### Weapons
- `packs/_source/items/weapon/club.yml`
- `packs/_source/items/weapon/dagger.yml`
- `packs/_source/items/weapon/giant-slayer-longsword.yml`

### Feat-like items
- `packs/_source/feats24/general-feats/ability-score-improvement.yml`
- `packs/_source/feats24/general-feats/grappler.yml`
- `packs/_source/feats24/origin-feats/magic-initiate.yml`
- (also observed for effect pattern) `packs/_source/feats24/origin-feats/alert.yml`

### Foundry v13 API
- `https://foundryvtt.com/api/classes/foundry.documents.Item.html`

## Pattern notes by requested category

## 1) Simple consumable item examples

### A. Potion of Healing
- **Path:** `packs/_source/items/potion/potion-of-healing.yml`
- **Item type:** `consumable`
- **Important system fields present:**
  - `system.quantity`, `system.weight`, `system.price`
  - `system.type.value: potion`
  - `system.uses.max: "1"`, `system.uses.spent`, `system.uses.recovery`
  - `system.autoDestroy: true`
  - `system.damage.base` (healing dice encoded here)
  - `system.activities.dnd5eactivity000` with `type: heal`
  - activity-level `consumption.targets: [{type: itemUses, value: "1"}]`
  - `identifier`, `effects` (empty)
- **Appears required vs optional (in practice):**
  - Required-like: `name`, `type`, `img`, `system.description`, `system.type.value`, at least one activity for automated use.
  - Common optional: `rarity`, `magicalBonus`, non-empty `effects`.
- **Activities/uses/effects/scaling:**
  - Single heal activity consumes one use and scales mode `whole` with no additional formula.

### B. Antitoxin
- **Path:** `packs/_source/items/potion/antitoxin.yml`
- **Item type:** `consumable`
- **Important system fields present:**
  - same economic/inventory fields as above
  - `system.type.value: potion`
  - `system.damage.base.number: null` (no direct damage/healing roll)
  - activity type `utility`, duration set to `1 hour`, target defaults to self
- **Required vs optional (practice):**
  - Same baseline structure as Potion of Healing.
  - Damage block still exists, but effectively optional in substance when not rolling damage.
- **Activities/uses/effects/scaling:**
  - Utility activity with 1-use consumption and duration tracking; no damage, no save, no embedded effects.

### C. Alchemist’s Fire
- **Path:** `packs/_source/items/potion/alchemists-fire.yml`
- **Item type:** `consumable`
- **Important system fields present:**
  - same inventory/economy/uses fields
  - `system.damage.base` configured for fire
  - two activities:
    - `attack` activity (ranged improvised attack)
    - `save` activity (Dex save with formula `10`, damage on save = half)
- **Required vs optional (practice):**
  - Shows that multiple activities are optional but idiomatic for compound resolution.
  - `properties` can be empty.
- **Activities/uses/effects/scaling:**
  - Both activities consume `itemUses: 1`; range 20 ft; damage part is explicitly repeated per activity.

## 2) Simple weapon item examples

### A. Club
- **Path:** `packs/_source/items/weapon/club.yml`
- **Item type:** `weapon`
- **Important system fields present:**
  - `system.type.value: simpleM`, `system.baseItem: club`
  - `system.damage.base` (1d4 bludgeoning)
  - `system.properties: [lgt]`
  - `system.range` and `system.reach`
  - `system.activities.dnd5eactivity000` of `type: attack`
- **Required vs optional (practice):**
  - Required-like for weapon identity: `type.value`, `baseItem`, base damage, attack activity.
  - Optional-like: `magicalBonus`, non-empty versatile damage.
- **Activities/uses/effects/scaling:**
  - Basic melee attack activity; no consumable uses.

### B. Dagger
- **Path:** `packs/_source/items/weapon/dagger.yml`
- **Item type:** `weapon`
- **Important system fields present:**
  - `system.type.value: simpleM`, `system.baseItem: dagger`
  - `system.range.value: 20`, `system.range.long: 60`
  - `system.properties: [fin, lgt, thr]`
  - base damage 1d4 piercing
  - attack activity with melee classification and 20 ft range
- **Required vs optional (practice):**
  - Same base weapon skeleton as club.
  - Thrown profile introduces additional range + `thr` property (optional by weapon archetype).
- **Activities/uses/effects/scaling:**
  - Single attack activity, no uses/recovery.

### C. Giant Slayer Longsword
- **Path:** `packs/_source/items/weapon/giant-slayer-longsword.yml`
- **Item type:** `weapon`
- **Important system fields present:**
  - `system.type.value: martialM`, `system.baseItem: longsword`
  - `system.properties: [mgc, ver]`
  - `system.magicalBonus: 1`
  - normal attack activity + extra `save` activity for giant-only rider damage/prone save
- **Required vs optional (practice):**
  - Magic rider fields (`magicalBonus`, extra activity, conditional target text) are optional extensions.
- **Activities/uses/effects/scaling:**
  - Pattern for rider behavior via additional activity (save + extra damage), not by inventing custom schema.

## 3) Feature/feat-like item examples with meaningful system data

### A. Ability Score Improvement
- **Path:** `packs/_source/feats24/general-feats/ability-score-improvement.yml`
- **Item type:** `feat`
- **Important system fields present:**
  - `system.type.value`/`subtype` empty but `type: feat` at document level
  - `system.prerequisites.level: 4`
  - `system.repeatable: true`
  - `system.advancement` includes `AbilityScoreImprovement` config (`cap`, `points`, fixed/locked values)
- **Required vs optional (practice):**
  - For feat-like mechanics in 2024 content, `advancement` is key when level-up choices are needed.
  - `activities` can be empty.
- **Activities/uses/effects/scaling:**
  - No activities; uses advancement data model to drive level-up behavior.

### B. Grappler
- **Path:** `packs/_source/feats24/general-feats/grappler.yml`
- **Item type:** `feat`
- **Important system fields present:**
  - `system.type.value: feat`, `system.type.subtype: general`
  - `system.prerequisites.level: 4`, `system.requirements: Strength or Dexterity 13+`
  - `system.advancement` with ASI configuration and locked abilities
- **Required vs optional (practice):**
  - `requirements` is optional but commonly used for textual/non-validated prerequisite details.
- **Activities/uses/effects/scaling:**
  - No activities; meaningful mechanics represented through advancement + descriptive note.

### C. Magic Initiate
- **Path:** `packs/_source/feats24/origin-feats/magic-initiate.yml`
- **Item type:** `feat`
- **Important system fields present:**
  - `system.type.value: feat`, `subtype: origin`, `repeatable: true`
  - `system.advancement` has two `ItemChoice` entries:
    - cantrip selection constraints (`level: 0`, class list restrictions)
    - level 1 spell selection with `uses.max: 1`, `per: lr`, spell preparation metadata
- **Required vs optional (practice):**
  - Shows a robust schema-native pattern for selectable granted content via advancement, rather than custom JS.
- **Activities/uses/effects/scaling:**
  - No direct activity objects; progression and granted options handled in advancement records.

### D. (Supplemental) Alert effect pattern
- **Path:** `packs/_source/feats24/origin-feats/alert.yml`
- **Item type:** `feat`
- **Important system fields present:**
  - embedded `effects` with `changes` key `flags.dnd5e.initiativeAlert` and `transfer: true`
- **Usefulness:**
  - Demonstrates when to use transferable Active Effects to encode passive automation.

## Similarities and differences across examples

### Similarities
- All items share top-level document keys (`name`, `type`, `img`, `system`, `effects`, `flags`, `_stats`, etc.).
- `system.description`, source/license metadata, and identifiers are consistently present.
- Behavior is represented with **schema-backed structures** (`activities`, `advancement`, `effects`) rather than ad-hoc fields.

### Differences
- Consumables lean on `uses`, `autoDestroy`, and often item-use consumption targets.
- Weapons emphasize `baseItem`, weapon category/properties, range/reach, and attack activity.
- Feats often have empty `activities` and instead use `advancement`, prerequisites, and/or passive `effects`.

## Concise practical structure summary (dnd5e in practice)

1. **Top-level Foundry document shell**: `name/type/img/system/effects/folder/sort/ownership/flags/_stats`.
2. **dnd5e-specific mechanics live under `system`** with established sub-objects (`uses`, `damage`, `type`, `properties`, `activities`, `advancement`, etc.).
3. **Automation entry points**:
   - active action flow: `system.activities`
   - level-up/selection flow: `system.advancement`
   - passive modifiers/toggles: `effects[].changes` (often flags)
4. **Reuse existing archetype keys** (e.g., `baseItem`, `type.value`) instead of introducing custom schema fields.

## Recommended minimum checklist for new items (safe/non-inventive)

1. Start from the closest dnd5e reference file (same item type + complexity).
2. Keep top-level document shell intact (`name/type/img/system/effects/flags`).
3. Use only observed `system` keys from analogous items.
4. Include one valid `identifier` and correct `system.type.value`/`subtype`.
5. If item is actionable, add at least one `activity` using existing activity types (`attack`, `heal`, `save`, `utility`).
6. If item grants choices/progression, use `advancement` patterns (`AbilityScoreImprovement`, `ItemChoice`) instead of custom logic.
7. If passive automation is needed, prefer transferable `effects` with known dnd5e flag keys.
8. Validate in Foundry v13 + dnd5e by creating/using item on an actor and checking roll/chat behavior.

## Safest first vertical slice to implement next

Implement **one simple consumable modeled after `potion-of-healing.yml`** with:
- exactly one `heal` activity,
- one-use consumption (`itemUses`),
- `autoDestroy: true`,
- no custom effects,
- no custom JS.

Why safest: minimal schema surface, directly analogous precedent, easy manual validation end-to-end.

## Step-by-step plan (do not implement yet)

1. Pick a single target item concept and select the closest analog (likely Potion of Healing).
2. Copy analog item data shape into module content location used by this repo.
3. Change only content fields (name/description/image/identifier/dice/rarity/price) while preserving schema keys.
4. Ensure `system.activities` remains valid and consumption points to `itemUses`.
5. Confirm no undocumented keys were added.
6. Load in Foundry v13 with dnd5e; import/create the item in a test world.
7. Manual test: use item from actor sheet; verify resource decrement, chat card/roll output, and auto-destroy behavior.
8. If successful, commit as first vertical slice; defer complex riders/effects to later slices.

## Foundry v13 integration guardrail notes

From Foundry API v13 `foundry.documents.Item` docs, item documents share core Document schema fields and expose `system` as type data model territory; schema validation and DataModel cleaning are central. Therefore, module content should align with existing dnd5e type models and avoid arbitrary custom fields unless formally supported.
