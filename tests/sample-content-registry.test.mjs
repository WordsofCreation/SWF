import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

function loadSampleRegistryDependencies() {
  loadScript('scripts/authoring/shared/reference-model.js');
  loadScript('scripts/authoring/journal/journal-preset-definitions.js');
  loadScript('scripts/authoring/shared/sample-content-registry.js');
}

test('sample-content registry exposes tiny curated sample counts per existing lane', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  globalThis.foundry = { utils: { deepClone: (value) => structuredClone(value) } };

  loadSampleRegistryDependencies();

  const { sampleContentRegistry } = globalThis.SWF;
  assert.equal(sampleContentRegistry.getSamplesForSurface('journal').length, 3);
  assert.equal(sampleContentRegistry.getSamplesForSurface('item').length, 2);
  assert.equal(sampleContentRegistry.getSamplesForSurface('actor').length, 1);
});

test('journal sample application remains preset-aware and keeps references explicit', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  globalThis.foundry = { utils: { deepClone: (value) => structuredClone(value) } };

  loadSampleRegistryDependencies();

  const baseJournalSurface = {
    label: 'Journal',
    preview: {
      name: 'Base Journal',
      summary: 'Base summary',
      notes: [],
      linkedReferences: []
    }
  };

  const applied = globalThis.SWF.sampleContentRegistry.applySampleToSurfacePreview(
    baseJournalSurface,
    'journal',
    'journal-npc-quartermaster'
  );

  assert.equal(applied.preview.preset.key, 'npc-profile');
  assert.equal(applied.preview.name, 'NPC Profile: Quartermaster Reth');
  assert.equal(applied.preview.notes.length, 3);
  assert.equal(applied.preview.linkedReferences.length, 2);
});

test('item sample application stays on currently supported feat-only path inputs', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  globalThis.foundry = { utils: { deepClone: (value) => structuredClone(value) } };

  loadSampleRegistryDependencies();

  const baseItemSurface = {
    label: 'Item',
    preview: {
      name: 'Base Item',
      typeHint: 'feat',
      classification: { featSubtype: 'origin', requirements: '' },
      sourceDetails: {}
    }
  };

  const applied = globalThis.SWF.sampleContentRegistry.applySampleToSurfacePreview(
    baseItemSurface,
    'item',
    'item-steady-breath'
  );

  assert.equal(applied.preview.typeHint, 'feat');
  assert.equal(applied.preview.classification.featSubtype, 'origin');
  assert.match(applied.preview.summary, /measured breathing drills/);
});
