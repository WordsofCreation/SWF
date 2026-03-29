# dnd5e Macro-Adjacent Extension Deep-Dive (analysis-first) — 2026-03-29

This document is analysis-only. It does not add gameplay content and does not override dnd5e core documents or sheets.

## Source anchors inspected

### dnd5e pattern library (current upstream branch/tag surface)
- Repository: `foundryvtt/dnd5e` (5.3.x branch visible in upstream UI; latest listed release shown as `release-5.2.5` on Jan 20, 2026).
- Key source locations reviewed:
  - `dnd5e.mjs`
  - `module/module-registration.mjs`
  - `module/config.mjs`
  - `module/documents/item.mjs`
  - `module/documents/activity/mixin.mjs`
  - `module/documents/activity/_module.mjs`
  - `module/documents/chat-message.mjs`
  - `module/documents/macro.mjs`
  - dnd5e wiki: `Hooks` page (`https://github.com/foundryvtt/dnd5e/wiki/Hooks`)

### Foundry v13 integration source of truth
- Hook framework index: `https://foundryvtt.com/api/modules/hookEvents.html`
- Chat input hook page: `https://foundryvtt.com/api/functions/hookEvents.chatInput.html`
- (Core hook index links include document lifecycle hooks, chat rendering hooks, and hotbar-related hooks.)

---

## Deep-dive map: macro-adjacent behavior, extension points, and safety

## 1) Item-use and chat-card touchpoints

### Location
- dnd5e item usage orchestration: `module/documents/item.mjs` and activity document mixin in `module/documents/activity/mixin.mjs`.
- dnd5e chat message augmentation: `module/documents/chat-message.mjs`.
- dnd5e hook contract for chat post-processing: wiki `dnd5e.renderChatMessage`.

### Responsibility
- Item/activity code owns the authoritative use pipeline: validate use, optional dialog/config collection, consumption, chat payload creation, and post-use callbacks.
- Chat message document code owns system-specific card rendering/interaction behavior layered onto Foundry core chat lifecycle.

### Data vs code
- **Hybrid**:
  - Data-driven: item/activity system data (activation, target, damage/heal/save payloads, consumption targets).
  - Code-driven: orchestration, side-effect timing, and chat rendering lifecycle.

### Module safety assessment
- **Safe-ish**:
  - Observe and post-process at documented hook boundaries (`dnd5e.renderChatMessage`, relevant pre/post roll/use hooks).
  - Add UI affordances in chat via Foundry render hooks without replacing dnd5e’s own sheet/card internals.
- **Risky**:
  - Importing dnd5e internal chat classes/methods directly and depending on private method names.
  - Assuming exact HTML structure/classes in cards without defensive checks/version gating.

---

## 2) Activity execution flow (macro-adjacent core)

### Location
- `module/documents/activity/mixin.mjs`
- activity type modules in `module/documents/activity/*.mjs` and data definitions in `module/data/activity/*`
- dnd5e hooks wiki sections for:
  - `dnd5e.preUseActivity`
  - `dnd5e.postUseActivity`
  - `dnd5e.preActivityConsumption`
  - `dnd5e.activityConsumption`
  - `dnd5e.postActivityConsumption`

### Responsibility
- Defines the canonical execution lifecycle for activity-backed item actions.
- Separates declarative payload (activity data) from execution sequencing and updates.

### Data vs code
- **Hybrid, strongly pipeline-driven**:
  - Data picks *what* happens (roll components, save/damage/heal structure, consumption declarations).
  - Code controls *when/how* it happens and how updates/messages are emitted.

### Module safety assessment
- **Safest extension posture**:
  - Hook before/after documented lifecycle steps.
  - Mutate only permitted config/update payloads in hook args.
- **Risky**:
  - Calling internal mixin/private helpers directly.
  - Re-implementing the use pipeline in a parallel custom flow.

---

## 3) Hooks an add-on module can safely use

### dnd5e-specific hooks (documented surface)
From dnd5e wiki Hooks page, practical high-value hooks include:
- Activity/use lifecycle: `dnd5e.preUseActivity`, `dnd5e.postUseActivity`, consumption hook trio.
- Chat lifecycle: `dnd5e.renderChatMessage`.
- Roll lifecycle family: `dnd5e.preRoll*` and `dnd5e.roll*` variants.
- Actor/item process hooks for specialized domains (concentration, summon, damage application, progression preparation, etc.) where feature scope matches.

### Foundry v13 core hooks (integration truth)
From Foundry hookEvents docs:
- Startup wiring: `init`, `setup`, `ready`.
- Chat/UI: `renderChatMessageHTML`, `chatInput`.
- Document lifecycle: generic `preCreateDocument`, `createDocument`, `preUpdateDocument`, `updateDocument`, etc.
- Hotbar/macro-adjacent: `hotbarDrop` (for drag-to-macro workflows).

### Safety note
- Prefer dnd5e hooks first when available for dnd5e behavior.
- Use Foundry generic hooks for module scaffolding and cross-system-safe glue.
- Keep cancellable hook handlers synchronous unless API explicitly expects async results.

---

## 4) Where dnd5e expects data-driven behavior vs custom code

### Data-first expectations (preferred)
- Defining item capabilities through `system.activities` and item fields.
- Configuring resource costs, recovery, and consumptions declaratively.
- Expressing save/attack/damage/heal behavior with existing activity schemas.

### Code-first expectations (use sparingly)
- Cross-item orchestration and nonstandard multi-step workflows.
- Chat card enhancements that are presentation-only and hook-bound.
- External integrations (analytics, logging, optional automations) that do not alter core execution order.

### Strong anti-pattern
- Inventing ad-hoc custom schema when an existing activity/item field pattern already exists upstream.

---

## 5) Macro-adjacent patterns observed

### Pattern A: item/action as primary macro target
- dnd5e exports macro helpers via `module/documents/macro.mjs` (and from `module/documents/_module.mjs`).
- Practical implication: module features should usually target **item/activity use entry points** rather than bespoke macro execution engines.

### Pattern B: chat buttons and post-render enhancement
- dnd5e chat handling centralizes button behavior and visibility logic in system code.
- Module-safe approach: add narrowly scoped enhancements after render hook(s), with feature detection and graceful no-op when markup changes.

### Pattern C: workflow helper via hooks, not monkey patches
- Documented lifecycle hooks are intended interception points.
- Monkey-patching classes/methods is brittle and should be reserved for last-resort compatibility shims.

---

## 6) Existing extension patterns modules can follow

1. **Lifecycle listener pattern**
   - Register `Hooks.on(...)` in `init/setup/ready`.
   - Intercept activity/roll/chat events.
   - Return `false` only where documented/cancellable and only when intentionally suppressing default behavior.

2. **Decorative chat enhancement pattern**
   - Use render hook(s) to append lightweight controls/labels.
   - Keep logic idempotent (safe on rerenders).

3. **Data-authoring-first pattern**
   - Put most mechanics into item/activity data in compendium source.
   - Keep JS focused on optional UX enhancements and glue.

4. **Compatibility envelope pattern**
   - Gate behavior by system version checks where necessary.
   - Feature-detect properties/elements instead of assuming internals.

---

## 7) Risky internal areas to avoid tight coupling

- Private/unofficial internals inside dnd5e document classes (`item.mjs`, activity mixins, chat-message internals).
- Exact chat-card DOM structure and CSS class names as hard dependencies.
- Unstable import paths/method signatures in `module/documents/*` unless explicitly documented for module use.
- Replacing dnd5e sheets or overriding core document classes in an add-on module.
- Direct mutation of transient workflow objects outside documented hook contracts.

---

## Practical deliverables requested

## 1) Where module logic should live vs where content/data should do the work

### Put in content/data (default)
- Item capabilities, action definitions, consumption/recovery, scaling, targeting, save/attack/heal/damage payloads.
- Most class/feat/item behavior that fits existing dnd5e schema.

### Put in module code (only when needed)
- Cross-cutting UI behavior (chat affordances, notifications, quality-of-life helpers).
- Hook-based adjustments that cannot be represented in item/activity data.
- Integration glue with other module APIs.

### Hybrid
- Data defines mechanics; module code adds optional orchestration or presentation logic around documented hooks.

---

## 2) Safest hook points/extension patterns for future SWF tasks

- dnd5e activity lifecycle hooks (`preUse`, `postUse`, consumption hooks).
- dnd5e chat render hook (`dnd5e.renderChatMessage`) for system-specific card augmentation.
- Foundry `hotbarDrop` for macro shortcut UX.
- Foundry chat/document generic hooks for non-invasive bookkeeping.
- Foundry startup hooks (`init/setup/ready`) for registration/wiring only.

---

## 3) Risky areas future Codex tasks should avoid

- Any direct override/monkey patch of dnd5e core documents/sheets.
- Hard-binding to dnd5e private method names or exact internal class hierarchy.
- Schema invention not present in dnd5e item/activity models.
- Full replacement of chat-card templates when post-render enhancement is sufficient.

---

## 4) Decision checklist: item/system data vs module code vs hybrid

Use this gate sequence for each future feature:

1. **Can this be fully represented by existing dnd5e item/activity fields?**
   - Yes → implement as data.
2. **Does it only need post-processing around existing flow?**
   - Yes → hook-based module code.
3. **Does it require both declarative mechanics and custom UX/automation?**
   - Yes → hybrid (data first, minimal code second).
4. **Does it require overriding core docs/sheets or private internals?**
   - Yes → redesign; treat as high risk and avoid unless absolutely unavoidable.
5. **Is the hook/documented API stable and explicit?**
   - No → avoid coupling; prefer weaker assumptions and feature detection.

---

## 5) Safest first module-code vertical slice to implement next (recommended)

### Slice
**“Passive chat-card enhancer for SWF-tagged item activities.”**

### Why this is safest
- Non-destructive: no override of dnd5e documents/sheets.
- Hook-bound: uses render/lifecycle hooks only.
- Data-driven alignment: features trigger from existing item/activity identifiers and flags.
- Easy rollback and low blast radius.

### Example capabilities for this slice
- Add a small SWF metadata block in rendered card HTML for SWF-owned items.
- Add optional helper button(s) that call normal item/activity use entry points.
- No direct rewrite of dnd5e roll/consume engine.

---

## 6) Step-by-step implementation plan for that slice (do not implement yet)

1. **Define scope contract**
   - Decide exact SWF item selection criteria (e.g., compendium source/identifier prefix/flag).
   - Confirm no new undocumented schema fields are required.

2. **Data audit pass**
   - Verify SWF pack items consistently expose identifiers/flags needed for targeting cards.
   - Normalize any missing identifiers in pack YAML before code work.

3. **Module wiring**
   - In module startup, register `Hooks.on("dnd5e.renderChatMessage", ...)`.
   - Optionally register Foundry `renderChatMessageHTML` fallback for resilience.

4. **Render enhancer implementation**
   - Detect SWF-relevant chat cards defensively.
   - Append minimal DOM fragment (badge + optional button container).
   - Ensure idempotence (avoid duplicate inserts on rerender).

5. **Action handler integration**
   - For any added button, resolve actor/item/activity through documented UUID/data references.
   - Delegate to existing dnd5e item/activity usage methods (no duplicated consumption/roll logic).

6. **Safety guards**
   - Feature-detect required elements; no-op when absent.
   - Wrap behavior in version checks and clear debug logging.

7. **Validation pass (manual)**
   - Test with baseline weapon, consumable, and feat/activity items.
   - Verify no behavior change for non-SWF cards.
   - Verify no duplicate chat decorations on message rerender.

8. **Documentation pass**
   - Record hooks used, assumptions, and compatibility constraints in `docs/`.
   - Include rollback guidance (single hook unregister/remove code path).

