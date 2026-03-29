import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

test('item type capability matrix includes all image-listed dnd5e item types', () => {
  globalThis.SWF = {};
  loadScript('scripts/data/item-type-capability-matrix.js');

  const expected = [
    'background',
    'class',
    'consumable',
    'container',
    'equipment',
    'facility',
    'feat',
    'loot',
    'species',
    'spell',
    'subclass',
    'tattoo'
  ];

  assert.deepEqual(globalThis.SWF.itemTypeCapabilityMatrix.IMAGE_ITEM_TYPES, expected);

  const all = globalThis.SWF.itemTypeCapabilityMatrix.getAllCapabilities();
  assert.equal(all.length, expected.length);
  for (const row of all) {
    assert.equal(typeof row.itemType, 'string');
    assert.equal(typeof row.hasLocalVerticalSlice, 'boolean');
    assert.ok(Array.isArray(row.repositoryExamples));
  }
});

test('item type capability matrix coverage summary remains internally consistent', () => {
  globalThis.SWF = {};
  loadScript('scripts/data/item-type-capability-matrix.js');

  const summary = globalThis.SWF.itemTypeCapabilityMatrix.getCoverageSummary();
  assert.equal(summary.totalTypes, 12);
  assert.equal(summary.localSliceCount + summary.missingSliceCount, summary.totalTypes);
  assert.equal(summary.localSliceCount, 4);
});
