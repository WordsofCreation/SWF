# AGENTS Instructions for This Repository

## Project Intent
This repo is a Foundry VTT v13 **add-on module** for the **dnd5e** system. Keep changes minimal, reviewable, and aligned with upstream patterns.

## Non-Negotiable Workflow Rules
1. **Reference inspection required before generation**  
   Before generating any new **item, feat, class, subclass, or feature**, inspect **2–3 analogous examples** in the dnd5e reference implementation.
2. **dnd5e is the pattern library**  
   Treat the dnd5e repository as the canonical pattern source for data shape, field usage, naming, and organization.
3. **Foundry v13 docs are integration source of truth**  
   Treat Foundry VTT v13 module/API documentation as authoritative for integration behavior.
4. **No undocumented schema invention**  
   Do not invent undocumented schema fields when a matching dnd5e pattern exists.
5. **Build vertical slices**  
   Implement one small end-to-end slice at a time (e.g., one item or one feature), then validate.
6. **Final response quality bar**  
   Every Codex final response must include:
   - Manual test steps
   - Files changed

## Implementation Guardrails
- Target Foundry VTT v13 only.
- Keep this as a module (never convert to a custom system scaffold).
- Do not override dnd5e core documents or sheets.
- Avoid optional integrations unless explicitly requested.
- Prefer content/data patterns over custom JS logic when possible.
