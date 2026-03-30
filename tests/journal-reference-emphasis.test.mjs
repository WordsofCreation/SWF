import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

test('journal reference emphasis returns preset-specific grouping defaults', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  loadScript('scripts/authoring/journal/journal-reference-emphasis.js');

  const lore = globalThis.SWF.journalReferenceEmphasis.getJournalReferenceEmphasisByPresetKey('lore-entry');
  const quest = globalThis.SWF.journalReferenceEmphasis.getJournalReferenceEmphasisByPresetKey('quest-brief');
  const fallback = globalThis.SWF.journalReferenceEmphasis.getJournalReferenceEmphasisByPresetKey('unknown');

  assert.equal(lore.primaryGroupLabel, 'Core Lore Mentions');
  assert.deepEqual(Array.from(quest.orderedKinds), ['item', 'actor']);
  assert.equal(fallback.key, 'lore-entry');
});
