# dnd5e Class + Subclass Pattern Deep-Dive (analysis-first) — 2026-03-29

Scope: establish source-grounded patterns for future SWF class-like content creation (Foundry VTT v13 + dnd5e 5.3.x lineage), without generating new gameplay content yet.

## Sources inspected

### dnd5e system source (pattern library)
- `module/data/item/class.mjs`  
  https://raw.githubusercontent.com/foundryvtt/dnd5e/refs/heads/5.3.x/module/data/item/class.mjs
- `module/data/item/subclass.mjs`  
  https://raw.githubusercontent.com/foundryvtt/dnd5e/refs/heads/5.3.x/module/data/item/subclass.mjs
- `module/documents/advancement/_module.mjs`  
  https://raw.githubusercontent.com/foundryvtt/dnd5e/refs/heads/5.3.x/module/documents/advancement/_module.mjs
- `module/documents/advancement/subclass.mjs`  
  https://raw.githubusercontent.com/foundryvtt/dnd5e/refs/heads/5.3.x/module/documents/advancement/subclass.mjs
- `module/documents/advancement/item-grant.mjs`  
  https://raw.githubusercontent.com/foundryvtt/dnd5e/refs/heads/5.3.x/module/documents/advancement/item-grant.mjs
- `module/documents/advancement/item-choice.mjs`  
  https://raw.githubusercontent.com/foundryvtt/dnd5e/refs/heads/5.3.x/module/documents/advancement/item-choice.mjs
- `module/documents/actor/actor.mjs`  
  https://raw.githubusercontent.com/foundryvtt/dnd5e/refs/heads/5.3.x/module/documents/actor/actor.mjs

### dnd5e content examples (canonical usage)
- Base class example: `packs/_source/classes/fighter.yml`  
  https://raw.githubusercontent.com/foundryvtt/dnd5e/refs/heads/5.3.x/packs/_source/classes/fighter.yml
- Subclass example: `packs/_source/subclasses/champion.yml`  
  https://raw.githubusercontent.com/foundryvtt/dnd5e/refs/heads/5.3.x/packs/_source/subclasses/champion.yml

### Foundry v13 integration docs (source of truth for integration behavior)
- Foundry Item document API:  
  https://foundryvtt.com/api/classes/foundry.documents.Item.html
- Foundry TypeDataModel API:  
  https://foundryvtt.com/api/classes/foundry.abstract.TypeDataModel.html

---

## Example-by-example analysis

## Example A — `fighter.yml` (base class with progression data)
**Type:** class content example.

**What it demonstrates**
- `type: class` with `system.identifier: fighter`, class-level basics (`levels`, hit die fields, description, source).
- Uses `system.advancement[]` as the primary progression structure.
- Level-by-level feature grants are mostly `ItemGrant` entries targeting `Compendium.dnd5e.classfeatures.*` UUIDs.
- Subclass selection timing is explicitly encoded by an advancement entry of type `Subclass` at level 3 (in class defaults and mirrored in content behavior).
- Includes trait/proficiency setup through `Trait` advancements (armor, weapons, saves, skills).

**Important fields observed**
- Required-like for stable class behavior:
  - `type: class`
  - `system.identifier`
  - `system.levels`
  - hit-die representation (legacy content may still show `hitDice`; class model migrates to `hd.*`)
  - `system.advancement[]` entries with valid advancement `type` payloads.
- Optional / complexity-increasing:
  - `ItemChoice` advancement blocks (e.g., Fighting Style choices).
  - class restrictions in advancement records (e.g., primary/secondary handling).
  - spellcasting payload (for caster classes).

**Pattern notes**
- **Level progression:** driven by `advancement` levels, not just prose table text.
- **Feature grants:** done via `ItemGrant` UUIDs.
- **Subclass timing:** represented in advancement pipeline; class content expects this.
- **References/links:** compendium UUID references are first-class.
- **Dependencies:** relies on valid compendium entries existing for granted features.

---

## Example B — `champion.yml` (subclass with grant timing)
**Type:** subclass content example.

**What it demonstrates**
- `type: subclass` with `system.identifier` and explicit `system.classIdentifier: fighter` linkage.
- Subclass feature timing modeled by `ItemGrant` entries at levels 3/7/10/15/18.
- Optional additional choices (e.g., an `ItemChoice` advancement) can appear inside subclass progression.

**Important fields observed**
- Required-like:
  - `type: subclass`
  - `system.identifier`
  - `system.classIdentifier` (critical class link)
  - `system.advancement[]`
- Optional / complexity-increasing:
  - subclass spellcasting block.
  - additional `ItemChoice` advancements with restrictions.

**Pattern notes**
- **Feature grants:** subclass continues to use `ItemGrant` to class-feature-like items.
- **Prerequisites/dependencies:** linkage to the parent class is identifier-based, not name-matching.
- **Character-facing workflow:** subclass item is selected/attached by subclass advancement flow from the class.

---

## Example C — `module/data/item/class.mjs` (class schema + defaults)
**Type:** class data model.

**What it demonstrates**
- Canonical class schema fields include:
  - `hd` (`additional`, `denomination`, `spent`)
  - `levels`
  - `primaryAbility`
  - `properties`
  - `spellcasting`
- Migration paths exist for legacy class fields (`hitDice`, `hitDiceUsed`, old spellcasting string).
- Class creation has default advancement scaffold including:
  - `HitPoints`
  - `Subclass` at level 3
  - ASIs at 4/8/12/16/19.
- Guards in update lifecycle enforce minimum/maximum level behavior.

**Required vs optional signal**
- Required-like: schema-backed fields above + advancement template participation.
- Optional: non-caster spellcasting remains `progression: none`; class properties and extended options vary by class design.

**Workflow touchpoints**
- On create/update, class data integrates with actor-level systems (assigning primary class, spellcasting ability defaults).

---

## Example D — `module/data/item/subclass.mjs` (subclass schema)
**Type:** subclass data model.

**What it demonstrates**
- Subclass schema is intentionally small:
  - `classIdentifier` (required `IdentifierField`)
  - `spellcasting`
  - advancement + description templates.
- Subclass model participates in advancement migration and spellcasting prep behavior.

**Required vs optional signal**
- Required-like: `classIdentifier` and advancement structure.
- Optional: spellcasting details depending on subclass design.

---

## Example E — advancement documents (`subclass`, `item-grant`, `item-choice`)
**Type:** advancement runtime behavior.

**What it demonstrates**
- `SubclassAdvancement`:
  - allowed only once for a class item.
  - applies selected subclass item to actor and stamps subclass `system.classIdentifier` from class identifier.
- `ItemGrantAdvancement`:
  - supports granting concrete item types (feat/spell/consumable/container/equipment/loot/tool/weapon).
  - stores granted document mapping in advancement value state.
- `ItemChoiceAdvancement`:
  - extends item grant behavior with multi-level choice payloads (`configuration.choices`).

**Required vs optional signal**
- Required-like for progression automation: valid `type` + matching configuration/value schema for that advancement type.
- Optional: optional-choice logic, spell ability specialization, replacement behavior.

**Pattern notes**
- **Feature linking:** UUID-driven grants dominate.
- **Dependencies:** invalid item types or broken UUIDs will break advancement expectations.

---

## Example F — `actor.mjs` touchpoints (consumption side)
**Type:** actor workflow integration.

**What it demonstrates**
- Actor computes class/subclass maps from embedded items keyed by `identifier`.
- Actor-derived class/subclass behavior assumes identifiers are present and coherent.

**Pattern notes**
- Missing or inconsistent identifiers can break class/subclass lookups even if items import successfully.

---

## Cross-example synthesis

### 1) Practical summary of class/subclass structure in dnd5e practice
1. Class and subclass are item documents (`type: class` / `type: subclass`) with strict typed system data.
2. Progression is advancement-centric (`system.advancement[]`) rather than ad hoc custom fields.
3. Feature acquisition is mostly UUID-linked `ItemGrant` (and occasionally `ItemChoice`) entries.
4. Subclass selection is a dedicated advancement step (`Subclass`) with timing encoded at class progression level.
5. Subclass-to-class relationship is identifier-based via `system.classIdentifier` matched against class `system.identifier`.
6. Actor workflows consume these identifiers and advancement outcomes directly for character-facing behavior.

### 2) Minimum required field checklist (safest class/subclass patterns)

## Class (minimum-safe)
- Top level:
  - `_id`, `name`, `type: class`, `img`
- `system`:
  - `identifier`
  - `levels` (numeric)
  - hit-die structure compatible with current schema (`hd.*`, with migration tolerance from legacy fields)
  - `advancement` array with valid advancement entries
  - description/source blocks expected by normal item payload shape

## Subclass (minimum-safe)
- Top level:
  - `_id`, `name`, `type: subclass`, `img`
- `system`:
  - `identifier`
  - `classIdentifier` (must match target class identifier)
  - `advancement` array (usually ItemGrant entries at subclass feature levels)
  - description/source blocks

### 3) Optional fields that introduce more complex behavior
- `system.spellcasting` (class or subclass variants).
- `ItemChoice` advancements with nested `choices`, restrictions, and replacement behavior.
- Trait advancement variants with `classRestriction` and choice pools.
- Any advancement entry with optional grants and spell ability overrides.
- Additional ActiveEffects / automation layers tied to granted features.

### 4) Details future tasks should **not** guess
- Exact advancement payload schema per `type` (`Subclass`, `ItemGrant`, `ItemChoice`, `Trait`, etc.).
- Valid UUID targets and compendium source IDs for feature grants.
- Identifier conventions and linking assumptions (`identifier` vs `classIdentifier`).
- Spellcasting progression/ability details for a given class/subclass concept.
- Whether a behavior belongs in advancement config vs granted feature item data.
- Any undocumented `flags.dnd5e.*` behavior.

### 5) Safest first class/subclass vertical slice for SWF next
A **minimal non-caster class + one linked non-caster subclass** with conservative advancement only:
- Class slice:
  - identifier + hit dice + level scaffold.
  - minimum advancement stack: `HitPoints`, one `Subclass` entry at level 3, plus one `ItemGrant` for a level-1 starter feature.
- Subclass slice:
  - `classIdentifier` link to the new class.
  - one `ItemGrant` at level 3 to a simple passive feat-like feature item.

Why safest:
- Exercises class/subclass handshake + advancement runtime.
- Avoids spellcasting and complex multi-level choice payloads initially.
- Validates end-to-end character progression with minimal surface area.

### 6) Step-by-step implementation plan (do not implement yet)
1. Re-open 2–3 nearest dnd5e analogs before authoring (class, subclass, one granted feature).
2. Copy class skeleton from a non-caster class analog; keep only required schema + minimal advancement entries.
3. Define SWF class `identifier` first; lock this string before creating subclass.
4. Add subclass item with matching `classIdentifier` and minimal `ItemGrant` at intended level.
5. Author a single passive granted feature item (feat-style) referenced by stable UUID from subclass/class advancement.
6. Validate YAML/data pack compiles with no schema validation errors.
7. In Foundry v13 + dnd5e, test on a fresh character:
   - add class at level 1,
   - level to subclass selection point,
   - choose subclass,
   - verify granted feature appears at expected level.
8. Confirm actor class/subclass maps resolve identifiers as expected and no console warnings arise.
9. Only after this slice passes, add one additional advancement complexity (e.g., one ItemChoice) in a second slice.

---

## Manual test steps for this analysis artifact
1. Open each source URL listed above and verify field names and advancement type names still match current dnd5e 5.3.x.
2. Compare this note against local SWF content conventions under `packs/_source` before generating any class/subclass content.
3. For next implementation task, explicitly reference this file in the task brief and re-check at least 2 analogs again.

## Files changed
- `docs/dnd5e-class-subclass-pattern-deep-dive-2026-03-29.md`
