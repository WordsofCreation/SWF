import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

test('actor materialization builds conservative npc create payload from actor preview', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };

  loadScript('scripts/authoring/actor/actor-materialization.js');

  const pipeline = globalThis.SWF.actorMaterialization.buildActorMaterializationPipelineFromPreview({
    name: 'Watch Captain Iri Dane',
    typeHint: 'npc',
    summary: 'Patrol commander preview.',
    roleLabel: 'Watch Captain',
    concept: 'Calm tactical commander coordinating rotations.',
    img: 'icons/svg/mystery-man.svg',
    classification: {
      actorPath: 'npc-focused'
    }
  });

  assert.equal(pipeline.stages.validation.ok, true);
  assert.equal(pipeline.createData.name, 'Watch Captain Iri Dane');
  assert.equal(pipeline.createData.type, 'npc');
  assert.equal(pipeline.createData.img, 'icons/svg/mystery-man.svg');
  assert.equal(pipeline.createData.flags['swf-module'].actorBuilderPath, 'npc-core-v1');
  assert.equal(pipeline.createData.flags['swf-module'].actorDraftSummary, 'Patrol commander preview.');
});

test('actor materialization enforces GM-only and creates actor on success', async () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };

  loadScript('scripts/authoring/actor/actor-materialization.js');

  globalThis.game = { user: { isGM: false } };
  globalThis.Actor = { create: async () => ({ id: 'x' }) };

  const denied = await globalThis.SWF.actorMaterialization.materializeActorPreviewAsWorldActor({
    name: 'Denied Actor',
    typeHint: 'npc'
  });
  assert.equal(denied.ok, false);
  assert.equal(denied.reason, 'gm-only');

  globalThis.game = { user: { isGM: true }, system: { id: 'dnd5e' } };
  globalThis.Actor = {
    async createDocuments(dataRows) {
      const [data] = dataRows;
      return [{ id: 'actor123', name: data.name, type: data.type, img: data.img, flags: data.flags }];
    }
  };

  const created = await globalThis.SWF.actorMaterialization.materializeActorPreviewAsWorldActor({
    name: 'Created NPC',
    typeHint: 'npc',
    summary: 'Preview summary',
    classification: { actorPath: 'npc-focused' }
  });

  assert.equal(created.ok, true);
  assert.equal(created.actor.id, 'actor123');
  assert.equal(created.createData.type, 'npc');
});
