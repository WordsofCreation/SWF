import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

test('journal presets expose explicit conservative preset keys', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };

  loadScript('scripts/authoring/journal/journal-preset-definitions.js');

  const presets = globalThis.SWF.journalPresetDefinitions.getJournalPresets();
  const keys = presets.map((preset) => preset.key);

  assert.deepEqual(keys, ['lore-entry', 'npc-profile', 'quest-brief']);
  assert.equal(globalThis.SWF.journalPresetDefinitions.DEFAULT_JOURNAL_PRESET_KEY, 'lore-entry');
});

test('journal preset application seeds only existing journal preview fields plus preset metadata', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };

  loadScript('scripts/authoring/journal/journal-preset-definitions.js');

  const applied = globalThis.SWF.journalPresetDefinitions.applyJournalPresetToPreview(
    {
      documentName: 'JournalEntry',
      typeHint: 'entry',
      linkedReferences: [{ kind: 'actor', label: 'A' }],
      validationTrace: { readiness: { status: 'preview-ready' } },
      materializationReadiness: { readiness: { status: 'partially-ready' } }
    },
    'npc-profile'
  );

  assert.equal(applied.name.startsWith('NPC Profile:'), true);
  assert.equal(applied.summary.includes('role at the table'), true);
  assert.equal(Array.isArray(applied.notes), true);
  assert.equal(applied.notes.length > 0, true);
  assert.equal(applied.linkedReferences.length, 1);
  assert.equal(applied.preset.key, 'npc-profile');
  assert.equal(applied.preset.overviewPageName, 'Profile');
});
