import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

test('item post-create inspection summarizes successful equipment/loot creation conservatively', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };

  loadScript('scripts/authoring/item/item-post-create-inspection.js');

  const inspection = globalThis.SWF.itemPostCreateInspection.buildItemPostCreateInspection({
    preview: {
      name: 'SWF Field Kit',
      typeHint: 'equipment',
      summary: 'Compact mission-ready equipment pack.',
      classification: { itemCategory: 'wondrous' },
      sourceDetails: {
        custom: 'SWF Builder QA',
        book: 'SW5e Conversion Notes',
        page: '12',
        license: 'CC-BY-4.0',
        rules: '2024'
      }
    },
    result: {
      ok: true,
      statusMessage: 'Created Item: SWF Field Kit',
      createData: {
        name: 'SWF Field Kit',
        type: 'equipment',
        img: 'icons/svg/item-bag.svg',
        system: {
          description: { value: '<p>Compact mission-ready equipment pack.</p>' },
          type: { value: 'wondrous' },
          identifier: 'swf-builder-swf-field-kit',
          source: {
            custom: 'SWF Builder QA',
            book: 'SW5e Conversion Notes',
            page: '12',
            license: 'CC-BY-4.0',
            rules: '2024'
          }
        },
        flags: {
          'swf-module': {
            itemBuilderPath: 'equipment-loot-v1'
          }
        }
      },
      item: {
        id: 'abc123',
        name: 'SWF Field Kit',
        type: 'equipment',
        img: 'icons/svg/item-bag.svg',
        uuid: 'Item.abc123',
        system: {
          description: { value: '<p>Compact mission-ready equipment pack.</p>' },
          type: { value: 'wondrous' },
          identifier: 'swf-builder-swf-field-kit',
          source: {
            custom: 'SWF Builder QA',
            book: 'SW5e Conversion Notes',
            page: '12',
            license: 'CC-BY-4.0',
            rules: '2024'
          }
        },
        flags: {
          'swf-module': {
            itemBuilderPath: 'equipment-loot-v1'
          }
        }
      }
    }
  });

  assert.equal(inspection.status.ok, true);
  assert.equal(inspection.createdItem.id, 'abc123');
  assert.equal(inspection.createdItem.img, 'icons/svg/item-bag.svg');
  assert.equal(inspection.materializedClusters.includes('Classification cluster'), true);
  assert.equal(inspection.materializedClusters.includes('Source details cluster'), true);
  assert.equal(inspection.deferredClusters.includes('system.activities'), true);
  assert.equal(inspection.traceSummary.attempted, 6);
  assert.equal(inspection.traceSummary.materialized, 6);
  assert.equal(inspection.traceSummary.reviewNeeded, 0);
  assert.equal(inspection.traceSummary.deferredInspection, 1);
  assert.equal(
    inspection.clusterComparisons.find((row) => row.key === 'module-metadata')?.status,
    'matched'
  );
  assert.equal(
    inspection.inspectionRows.find((row) => row.key === 'folder')?.outcome,
    'omitted by design'
  );
  assert.equal(
    inspection.inspectionRows.find((row) => row.key === 'system.rarity')?.outcome,
    'unsupported/deferred'
  );
});

test('item post-create inspection flags conservative review when requested and observed values diverge', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };

  loadScript('scripts/authoring/item/item-post-create-inspection.js');

  const inspection = globalThis.SWF.itemPostCreateInspection.buildItemPostCreateInspection({
    preview: {
      name: 'Mismatch Test',
      typeHint: 'equipment',
      summary: 'Preview summary',
      sourceDetails: { custom: 'Preview Source' }
    },
    result: {
      ok: true,
      createData: {
        name: 'Mismatch Test',
        type: 'equipment',
        system: {
          description: { value: '<p>Preview summary</p>' },
          type: { value: 'treasure' },
          identifier: 'swf-builder-mismatch-test',
          source: { custom: 'Requested Source' }
        },
        flags: {
          'swf-module': {
            itemBuilderPath: 'equipment-loot-v1'
          }
        }
      },
      item: {
        type: 'loot',
        name: 'Mismatch Test',
        system: {
          description: { value: '<p>different</p>' },
          type: { value: 'art' },
          identifier: 'swf-builder-mismatch-test-v2',
          source: { custom: 'Observed Source' }
        },
        flags: {
          'swf-module': {
            itemBuilderPath: 'equipment-loot-v2'
          }
        }
      }
    }
  });

  assert.equal(inspection.traceSummary.reviewNeeded > 0, true);
  assert.equal(
    inspection.warnings.some((warning) => warning.includes('needs manual review')),
    true
  );
  assert.equal(
    inspection.clusterComparisons.find((row) => row.key === 'source')?.status,
    'mismatch/error'
  );
});
