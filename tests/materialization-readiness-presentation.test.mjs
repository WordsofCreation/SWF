import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

test('materialization readiness presentation returns normalized readiness and cluster sections', () => {
  globalThis.SWF = {};

  loadScript('scripts/authoring/shared/materialization-readiness-model.js');
  loadScript('scripts/authoring/shared/materialization-readiness-presentation.js');

  const display = globalThis.SWF.materializationReadinessPresentation.buildMaterializationReadinessDisplay({
    readyClusters: [' name ', 'summary'],
    deferredClusters: ['system.source'],
    provisionalClusters: [],
    readiness: { status: 'partially-ready', summary: 'Preview clusters are clear.' },
    nextStepNote: 'Define one documented create contract.'
  });

  assert.equal(display.readiness.status, 'partially-ready');
  assert.equal(display.sections.length, 3);
  assert.equal(display.sections[0].items[0], 'name');
  assert.equal(display.sections[2].hasItems, false);
  assert.equal(display.nextStepSummary, 'Ready: 2 • Deferred: 1 • Provisional: 0');
});
