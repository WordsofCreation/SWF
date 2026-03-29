import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

test('normalizeManifest strictly normalizes optional featCategory vocabulary field', () => {
  globalThis.SWF = {};
  loadScript('scripts/data/manifest-validation.js');

  const normalized = globalThis.SWF.manifestValidation.normalizeManifest({
    id: 'Feat-A',
    type: 'FEAT',
    name: 'A',
    version: '1.0.0',
    description: 'desc',
    status: 'DRAFT',
    source: 'swf-module',
    featCategory: '  General  '
  });

  assert.equal(normalized.featCategory, 'general');
});

test('validateManifest keeps featCategory vocabulary checks warning-level only', () => {
  globalThis.SWF = {};
  loadScript('scripts/data/manifest-validation.js');

  const result = globalThis.SWF.manifestValidation.validateManifest({
    id: 'feat-a',
    type: 'feat',
    name: 'A',
    version: '1.0.0',
    description: 'desc',
    status: 'draft',
    source: 'swf-module',
    featCategory: 'unknown-category'
  });

  assert.equal(result.isValid, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].code, 'unrecognized_optional_vocabulary');
  assert.equal(result.warnings[0].field, 'featCategory');
});

test('formatDeferredClassificationValue renders null/deferred values explicitly', () => {
  globalThis.SWF = {
    MODULE_ID: 'swf',
    log: () => {},
    manifestRegistry: {},
    manifestValidation: { TYPE_REQUIRED_FIELDS: {} },
    canonicalFieldInventory: {},
    typeTargetMap: {},
    fieldTargetMap: {},
    unresolvedMappingTracker: {},
    confirmedMappingSnapshot: {},
    mappingCoverageReport: {},
    shapeConsistencyChecker: {},
    featTargetStub: {},
    featConversionTrace: {}
  };

  globalThis.FormApplication = class {};
  globalThis.foundry = { utils: { mergeObject: (a, b) => ({ ...a, ...b }) } };
  globalThis.game = { settings: { registerMenu: () => {}, get: () => false } };

  loadScript('scripts/tool-shell.js');

  assert.equal(globalThis.SWF.formatDeferredClassificationValue(null), '(deferred)');
  assert.equal(globalThis.SWF.formatDeferredClassificationValue(undefined), '(deferred)');
  assert.equal(globalThis.SWF.formatDeferredClassificationValue(''), '(deferred)');
  assert.equal(globalThis.SWF.formatDeferredClassificationValue(false), 'false');
});
