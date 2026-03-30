import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

function loadWorkspaceStateDependencies() {
  loadScript('scripts/authoring/shared/reference-model.js');
  loadScript('scripts/authoring/shared/validation-trace-model.js');
  loadScript('scripts/authoring/shared/materialization-readiness-model.js');
  loadScript('scripts/authoring/journal/journal-preset-definitions.js');
  loadScript('scripts/authoring/journal/journal-draft-state.js');
  loadScript('scripts/authoring/shared/authoring-preview-state.js');
  loadScript('scripts/authoring/shared/sample-content-registry.js');
  loadScript('scripts/authoring/shared/builder-sample-state.js');
  loadScript('scripts/authoring/shared/lane-draft-state.js');
  loadScript('scripts/authoring/shared/builder-workspace-state.js');
}

test('workspace normalization migrates legacy journalDraft into laneDrafts and keeps lane defaults', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module', log: () => {} };
  globalThis.foundry = { utils: { deepClone: (value) => structuredClone(value) } };
  loadWorkspaceStateDependencies();

  const normalized = globalThis.SWF.builderWorkspaceState.normalizeWorkspaceState({
    version: 1,
    activeSurface: 'journal',
    journalPresetKey: 'lore-entry',
    journalDraft: {
      selectedPresetKey: 'lore-entry',
      name: 'Legacy Journal Name',
      summary: 'Legacy Summary'
    }
  });

  assert.equal(normalized.version, globalThis.SWF.builderWorkspaceState.WORKSPACE_STATE_VERSION);
  assert.equal(normalized.activeSurface, 'journal');
  assert.equal(normalized.laneDrafts.journal.name, 'Legacy Journal Name');
  assert.equal(typeof normalized.laneDrafts.item.name, 'string');
  assert.equal(typeof normalized.laneDrafts.actor.name, 'string');
});
