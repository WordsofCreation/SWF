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
      classification: { featSubtype: 'class', requirements: 'Vanguard training' }
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
          requirements: 'Vanguard training'
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
          description: { value: '<p>Gain disciplined defensive posture fundamentals.</p>' }
        }
      }
    }
  });

  assert.equal(inspection.status.ok, true);
  assert.equal(inspection.createdItem.id, 'abc123');
  assert.equal(inspection.materializedClusters.includes('classification cluster'), true);
  assert.equal(inspection.deferredClusters.includes('system.activities'), true);
  assert.match(inspection.fieldMapping.find((row) => row.key === 'classification')?.requested ?? '', /system.type.subtype=class/);
});
