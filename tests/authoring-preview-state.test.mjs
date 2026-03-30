import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

function loadPreviewStateDependencies() {
  loadScript('scripts/authoring/shared/reference-model.js');
  loadScript('scripts/authoring/shared/validation-trace-model.js');
  loadScript('scripts/authoring/shared/materialization-readiness-model.js');
  loadScript('scripts/authoring/journal/journal-preset-definitions.js');
  loadScript('scripts/authoring/shared/authoring-preview-state.js');
}

test('authoring preview state exposes three shared surfaces', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  globalThis.foundry = { utils: { deepClone: (value) => structuredClone(value) } };

  loadPreviewStateDependencies();

  const surfaces = globalThis.SWF.authoringPreviewState.getAuthoringSurfaces();
  assert.deepEqual(
    surfaces.map((surface) => surface.key),
    ['item', 'actor', 'journal']
  );
});

test('authoring preview state remains read-only and tracks conservative materialization flags per surface', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  globalThis.foundry = { utils: { deepClone: (value) => structuredClone(value) } };

  loadPreviewStateDependencies();

  const previewState = globalThis.SWF.authoringPreviewState.getDefaultPreviewState();
  assert.equal(previewState.mode, 'read-only');
  assert.equal(previewState.schemaVersion, 1);

  for (const key of ['item', 'actor', 'journal']) {
    const surface = previewState.surfaces[key];
    assert.equal(surface.readOnly, true);
    const expectedNonMaterialized = key === 'actor' ? false : true;
    assert.equal(surface.nonMaterialized, expectedNonMaterialized);
    assert.equal(typeof surface.preview.documentName, 'string');
    assert.equal(typeof surface.preview.name, 'string');
    assert.ok(Array.isArray(surface.preview.notes));
    assert.equal(typeof surface.preview.validationTrace.readiness.status, 'string');
    assert.ok(Array.isArray(surface.preview.validationTrace.deferredFields));
    assert.equal(typeof surface.preview.materializationReadiness.readiness.status, 'string');
    assert.ok(Array.isArray(surface.preview.materializationReadiness.readyClusters));
  }
});

test('actor surface exposes structured npc-oriented preview clusters', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  globalThis.foundry = { utils: { deepClone: (value) => structuredClone(value) } };

  loadPreviewStateDependencies();

  const previewState = globalThis.SWF.authoringPreviewState.getDefaultPreviewState();
  const actor = previewState.surfaces.actor.preview;

  assert.equal(actor.documentName, 'Actor');
  assert.equal(actor.typeHint, 'npc');
  assert.equal(actor.classification.actorPath, 'npc-focused');
  assert.equal(typeof actor.identity.disposition, 'string');
  assert.equal(Array.isArray(actor.linkedReferences), true);
  assert.equal(actor.previewMeta.materialization, 'partial');
  assert.equal(actor.validationTrace.readiness.status, 'partially-ready');
  assert.equal(actor.materializationReadiness.readiness.status, 'partially-ready');
  assert.ok(actor.materializationReadiness.deferredClusters.includes('dnd5e.system.attributes'));
});


test('journal surface is initialized from the default journal preset', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  globalThis.foundry = { utils: { deepClone: (value) => structuredClone(value) } };

  loadPreviewStateDependencies();

  const previewState = globalThis.SWF.authoringPreviewState.getDefaultPreviewState();
  const journal = previewState.surfaces.journal.preview;

  assert.equal(journal.preset.key, 'lore-entry');
  assert.equal(journal.preset.detailsPageName, 'Details');
  assert.match(journal.summary, /Summarize/);
});
