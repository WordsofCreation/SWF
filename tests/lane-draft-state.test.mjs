import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

function loadLaneDraftDependencies() {
  loadScript('scripts/authoring/shared/reference-model.js');
  loadScript('scripts/authoring/shared/validation-trace-model.js');
  loadScript('scripts/authoring/shared/materialization-readiness-model.js');
  loadScript('scripts/authoring/journal/journal-preset-definitions.js');
  loadScript('scripts/authoring/journal/journal-draft-state.js');
  loadScript('scripts/authoring/shared/authoring-preview-state.js');
  loadScript('scripts/authoring/shared/lane-draft-state.js');
}

test('lane draft coordination normalizes per-lane shape and blocks cross-lane field bleed', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  globalThis.foundry = { utils: { deepClone: (value) => structuredClone(value) } };
  loadLaneDraftDependencies();

  const previewState = globalThis.SWF.authoringPreviewState.getDefaultPreviewState();
  const coordination = globalThis.SWF.laneDraftState.buildLaneDraftCoordination({
    previewState,
    activeLane: 'item',
    journalPresetKey: 'lore-entry',
    laneDrafts: {
      item: { name: 'Custom Feat', notesText: 'should-not-exist' },
      journal: { name: 'Custom Journal', summary: 'A summary', roleLabel: 'invalid-on-journal' },
      actor: { name: 'Custom Actor', concept: 'Mentor', selectedPresetKey: 'invalid-on-actor' }
    }
  });

  assert.equal(coordination.laneDrafts.item.name, 'Custom Feat');
  assert.equal(Object.hasOwn(coordination.laneDrafts.item, 'notesText'), false);
  assert.equal(coordination.laneDrafts.journal.name, 'Custom Journal');
  assert.equal(Object.hasOwn(coordination.laneDrafts.journal, 'roleLabel'), false);
  assert.equal(coordination.laneDrafts.journal.selectedPresetKey, 'lore-entry');
  assert.equal(coordination.laneDrafts.actor.name, 'Custom Actor');
  assert.equal(Object.hasOwn(coordination.laneDrafts.actor, 'selectedPresetKey'), false);
});

test('lane draft dirty-state compares against normalized lane baselines', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  globalThis.foundry = { utils: { deepClone: (value) => structuredClone(value) } };
  loadLaneDraftDependencies();

  const previewState = globalThis.SWF.authoringPreviewState.getDefaultPreviewState();
  const clean = globalThis.SWF.laneDraftState.buildLaneDraftCoordination({
    previewState,
    activeLane: 'journal',
    journalPresetKey: 'lore-entry',
    laneDrafts: {}
  });
  assert.equal(clean.laneDirty.journal, false);

  const dirty = globalThis.SWF.laneDraftState.updateLaneDraftField(
    clean.laneDrafts,
    'journal',
    'summary',
    'Changed summary',
    previewState,
    { journalPresetKey: 'lore-entry' }
  );
  const dirtyCoordination = globalThis.SWF.laneDraftState.buildLaneDraftCoordination({
    previewState,
    activeLane: 'journal',
    journalPresetKey: 'lore-entry',
    laneDrafts: dirty
  });

  assert.equal(dirtyCoordination.laneDirty.journal, true);
  assert.equal(dirtyCoordination.laneDirty.item, false);
  assert.equal(dirtyCoordination.laneDirty.actor, false);
});
