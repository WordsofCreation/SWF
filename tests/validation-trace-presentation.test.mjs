import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

test('validation trace presentation returns normalized readiness and sections', () => {
  globalThis.SWF = {};

  loadScript('scripts/authoring/shared/validation-trace-model.js');
  loadScript('scripts/authoring/shared/validation-trace-presentation.js');

  const display = globalThis.SWF.validationTracePresentation.buildValidationTraceDisplay({
    warnings: ['  Missing mapping  '],
    deferredFields: ['system.source'],
    provisionalFields: [],
    readiness: { status: 'preview-ready', summary: 'Safe for read-only review.' },
    traceNotes: ['No writes are performed.']
  });

  assert.equal(display.readiness.status, 'preview-ready');
  assert.equal(display.sections.length, 4);
  assert.equal(display.sections[0].items[0], 'Missing mapping');
  assert.equal(display.sections[2].hasItems, false);
});
