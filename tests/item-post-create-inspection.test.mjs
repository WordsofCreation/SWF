import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

test('item post-create inspection summarizes successful feat-only creation conservatively', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };

  loadScript('scripts/authoring/item/item-post-create-inspection.js');

  const inspection = globalThis.SWF.itemPostCreateInspection.buildItemPostCreateInspection({
    preview: {
      name: 'SWF Guardian Posture',
      typeHint: 'feat',
      summary: 'Gain disciplined defensive posture fundamentals.',
      classification: { featSubtype: 'class', requirements: 'Vanguard training' },
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
      statusMessage: 'Created Item: SWF Guardian Posture',
      createData: {
        name: 'SWF Guardian Posture',
        type: 'feat',
        system: {
          description: { value: '<p>Gain disciplined defensive posture fundamentals.</p>' },
          type: { value: 'feat', subtype: 'class' },
          requirements: 'Vanguard training',
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
            itemBuilderPath: 'feat-only-v1'
          }
        }
      },
      item: {
        id: 'abc123',
        name: 'SWF Guardian Posture',
        type: 'feat',
        uuid: 'Item.abc123',
        system: {
          description: { value: '<p>Gain disciplined defensive posture fundamentals.</p>' },
          type: { subtype: 'class' },
          requirements: 'Vanguard training',
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
            itemBuilderPath: 'feat-only-v1'
          }
        }
      }
    }
  });

  assert.equal(inspection.status.ok, true);
  assert.equal(inspection.createdItem.id, 'abc123');
  assert.equal(inspection.materializedClusters.includes('Classification cluster'), true);
  assert.equal(inspection.materializedClusters.includes('Source details cluster'), true);
  assert.equal(inspection.deferredClusters.includes('system.activities'), true);
  assert.match(inspection.fieldMapping.find((row) => row.key === 'classification')?.requested ?? '', /system.type.subtype=class/);
  assert.equal(inspection.traceSummary.attempted, 5);
  assert.equal(inspection.traceSummary.materialized, 5);
  assert.equal(inspection.traceSummary.reviewNeeded, 0);
  assert.equal(
    inspection.clusterComparisons.find((row) => row.key === 'module-metadata')?.status,
    'materialized'
  );
});

test('item post-create inspection flags conservative review when requested and observed values diverge', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };

  loadScript('scripts/authoring/item/item-post-create-inspection.js');

  const inspection = globalThis.SWF.itemPostCreateInspection.buildItemPostCreateInspection({
    preview: {
      name: 'Mismatch Test',
      typeHint: 'feat',
      summary: 'Preview summary',
      sourceDetails: { custom: 'Preview Source' }
    },
    result: {
      ok: true,
      createData: {
        name: 'Mismatch Test',
        system: {
          description: { value: '<p>Preview summary</p>' },
          type: { subtype: 'class' },
          requirements: 'Vanguard',
          source: { custom: 'Requested Source' }
        },
        flags: {
          'swf-module': {
            itemBuilderPath: 'feat-only-v1'
          }
        }
      },
      item: {
        name: 'Mismatch Test',
        system: {
          description: { value: '<p>different</p>' },
          type: { subtype: 'general' },
          requirements: 'None',
          source: { custom: 'Observed Source' }
        },
        flags: {
          'swf-module': {
            itemBuilderPath: 'feat-only-v2'
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
});
