import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

test('item materialization builds conservative equipment create payload from item preview', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  globalThis.foundry = {
    utils: {
      escapeHTML: (value) => String(value ?? '').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    }
  };

  loadScript('scripts/authoring/item/item-materialization.js');

  const pipeline = globalThis.SWF.itemMaterialization.buildItemMaterializationPipelineFromPreview({
    name: 'SWF Field Kit',
    typeHint: 'equipment',
    summary: 'Compact mission-ready equipment pack.',
    classification: {
      itemCategory: 'wondrous'
    },
    sourceDetails: {
      custom: 'SWF Builder QA',
      book: 'SW5e Conversion Notes',
      page: '12',
      license: 'CC-BY-4.0',
      rules: '2024'
    },
  });

  assert.equal(pipeline.stages.validation.ok, true);
  assert.equal(pipeline.createData.name, 'SWF Field Kit');
  assert.equal(pipeline.createData.type, 'equipment');
  assert.equal(pipeline.createData.system.type.value, 'wondrous');
  assert.match(pipeline.createData.system.description.value, /Compact mission-ready equipment pack/);
  assert.equal(pipeline.createData.system.source.custom, 'SWF Builder QA');
  assert.equal(pipeline.createData.system.source.book, 'SW5e Conversion Notes');
  assert.equal(pipeline.createData.system.source.page, '12');
  assert.equal(pipeline.createData.system.source.license, 'CC-BY-4.0');
  assert.equal(pipeline.createData.system.source.rules, '2024');
  assert.equal(pipeline.createData.flags['swf-module'].itemBuilderPath, 'equipment-loot-v1');
});

test('item materialization enforces GM-only and creates item on success', async () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  globalThis.foundry = {
    utils: {
      escapeHTML: (value) => String(value ?? '')
    }
  };

  loadScript('scripts/authoring/item/item-materialization.js');

  globalThis.game = { user: { isGM: false } };
  globalThis.Item = { create: async () => ({ id: 'x' }) };

  const denied = await globalThis.SWF.itemMaterialization.materializeItemPreviewAsWorldItem({
    name: 'Denied Item',
    typeHint: 'equipment'
  });
  assert.equal(denied.ok, false);
  assert.equal(denied.reason, 'gm-only');

  globalThis.game = { user: { isGM: true }, system: { id: 'dnd5e' } };
  globalThis.Item = {
    async createDocuments(dataRows) {
      const [data] = dataRows;
      return [{ id: 'item123', name: data.name, type: data.type, system: data.system }];
    }
  };

  const created = await globalThis.SWF.itemMaterialization.materializeItemPreviewAsWorldItem({
    name: 'Created Loot',
    typeHint: 'loot',
    summary: 'Preview summary'
  });

  assert.equal(created.ok, true);
  assert.equal(created.item.id, 'item123');
  assert.equal(created.createData.type, 'loot');
});
