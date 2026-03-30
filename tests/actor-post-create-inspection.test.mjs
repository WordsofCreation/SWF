import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

test('actor post-create inspection summarizes successful npc-only creation conservatively', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };

  loadScript('scripts/authoring/actor/actor-post-create-inspection.js');

  const inspection = globalThis.SWF.actorPostCreateInspection.buildActorPostCreateInspection({
    preview: {
      name: 'Watch Captain Iri Dane',
      typeHint: 'npc',
      img: 'icons/svg/mystery-man.svg'
    },
    result: {
      ok: true,
      statusMessage: 'Created Actor: Watch Captain Iri Dane',
      createData: {
        name: 'Watch Captain Iri Dane',
        type: 'npc',
        img: 'icons/svg/mystery-man.svg',
        flags: {
          'swf-module': {
            actorBuilderPath: 'npc-core-v1'
          }
        }
      },
      actor: {
        id: 'actor123',
        name: 'Watch Captain Iri Dane',
        type: 'npc',
        img: 'icons/svg/mystery-man.svg',
        uuid: 'Actor.actor123',
        flags: {
          'swf-module': {
            actorBuilderPath: 'npc-core-v1'
          }
        }
      }
    }
  });

  assert.equal(inspection.status.ok, true);
  assert.equal(inspection.createdActor.id, 'actor123');
  assert.equal(inspection.materializedClusters.includes('Actor type'), true);
  assert.equal(inspection.deferredClusters.includes('dnd5e.system.attributes'), true);
  assert.equal(inspection.traceSummary.attempted, 4);
  assert.equal(inspection.traceSummary.materialized, 4);
  assert.equal(inspection.traceSummary.reviewNeeded, 0);
});

test('actor post-create inspection flags conservative review when requested and observed values diverge', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };

  loadScript('scripts/authoring/actor/actor-post-create-inspection.js');

  const inspection = globalThis.SWF.actorPostCreateInspection.buildActorPostCreateInspection({
    preview: {
      name: 'Mismatch Test',
      typeHint: 'npc',
      img: 'icons/svg/mystery-man.svg'
    },
    result: {
      ok: true,
      createData: {
        name: 'Mismatch Test',
        type: 'npc',
        img: 'icons/svg/mystery-man.svg',
        flags: {
          'swf-module': {
            actorBuilderPath: 'npc-core-v1'
          }
        }
      },
      actor: {
        name: 'Mismatch Test',
        type: 'character',
        img: 'icons/svg/aura.svg',
        flags: {
          'swf-module': {
            actorBuilderPath: 'npc-core-v2'
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
