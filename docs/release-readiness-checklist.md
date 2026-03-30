# Release Readiness Checklist (Foundry VTT v13 Module)

Purpose: keep SWF package/install/update metadata stable and explicit as the repository evolves.

Scope: packaging and public distribution basics only. No gameplay behavior.

## 1) Ready now (current baseline)

- [ ] `module.json` `id` remains stable as `swf-module` and matches the folder/package identity used by this module.
- [ ] `module.json` `url` points to the repository homepage.
- [ ] `module.json` `manifest` points to the stable raw `module.json` URL on the default branch.
- [ ] `module.json` `compatibility.minimum` and `compatibility.verified` both target Foundry v13.
- [ ] `module.json` `relationships.systems` includes `dnd5e` and keeps compatibility floor aligned with repository intent.
- [ ] `module.json` `version` is bumped for each release-intended change.

## 2) Deferred / not yet ready

- [x] `module.json` `download` URL is set for direct package retrieval (`https://github.com/WordsofCreation/SWF/archive/refs/heads/main.zip`).
- [ ] Foundry auto-update hardening is still deferred until release-tag ZIP assets are published per version.
- [x] Install-from-manifest and direct-download install can now be shared for current progress visibility.

## 3) Pre-release verification (before sharing install URL with users)

- [ ] Confirm `module.json` is valid JSON and committed on the public branch referenced by `manifest`.
- [ ] Open the exact manifest URL in a browser and confirm it resolves without authentication.
- [ ] In Foundry v13, install from the manifest URL and verify module install/enable succeeds.
- [ ] Confirm no schema or metadata fields were invented beyond documented Foundry module manifest fields.
- [ ] If `download` is introduced, validate that URL returns the exact ZIP asset for the matching version.

## 4) Future release considerations (when distribution matures)

- [ ] Add release process notes for creating a tagged GitHub release and attached ZIP asset.
- [ ] Add a short mapping table (`version` → tag → ZIP URL) once release assets are consistently published.
- [ ] Add a lightweight manual smoke test note for upgrade path (install old version, update, verify module still loads).

## Notes

- Keep this checklist boring and explicit.
- When uncertain, mark status as deferred instead of guessing.
- Foundry VTT v13 module manifest documentation is the integration source of truth.
