import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

function loadBuilderSampleStateDependencies() {
  loadScript('scripts/authoring/shared/reference-model.js');
  loadScript('scripts/authoring/shared/validation-trace-model.js');
  loadScript('scripts/authoring/shared/materialization-readiness-model.js');
  loadScript('scripts/authoring/journal/journal-preset-definitions.js');
  loadScript('scripts/authoring/shared/sample-content-registry.js');
  loadScript('scripts/authoring/shared/authoring-preview-state.js');
  loadScript('scripts/authoring/shared/builder-sample-state.js');
}

test('builder sample state initializes default sample selection for each supported lane', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  globalThis.foundry = { utils: { deepClone: (value) => structuredClone(value) } };
  loadBuilderSampleStateDependencies();

  const selectionState = globalThis.SWF.builderSampleState.createBuilderSampleSelectionState();
  assert.equal(selectionState.selectedSampleKeys.item, 'item-guardian-stance');
  assert.equal(selectionState.selectedSampleKeys.actor, 'actor-watch-captain');
  assert.equal(selectionState.selectedSampleKeys.journal, 'journal-lore-vault');
});

test('builder sample projection marks source metadata and sample labels for active lanes', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  globalThis.foundry = { utils: { deepClone: (value) => structuredClone(value) } };
  loadBuilderSampleStateDependencies();

  const previewState = globalThis.SWF.authoringPreviewState.getDefaultPreviewState();
  const selectionState = globalThis.SWF.builderSampleState.createBuilderSampleSelectionState();
  const updatedSelectionState = globalThis.SWF.builderSampleState.setSelectedSampleForSurface(
    selectionState,
    'item',
    'item-steady-breath'
  );
  const projection = globalThis.SWF.builderSampleState.buildPreviewStateWithSamples(previewState, updatedSelectionState);

  assert.equal(projection.previewState.surfaces.item.preview.name, 'Steady Breath');
  assert.equal(projection.surfaceSampleState.item.sourceType, 'sample');
  assert.match(projection.surfaceSampleState.item.sourceLabel, /Loaded sample/);
  assert.equal(globalThis.SWF.builderSampleState.getActiveSampleLabel(projection.surfaceSampleState.item), 'Feat: Steady Breath');
});
