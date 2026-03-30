import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

test('journal materialization builds explicit overview and details pages when details content exists', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  globalThis.CONST = { JOURNAL_ENTRY_PAGE_FORMATS: { HTML: 1 } };

  loadScript('scripts/authoring/journal/journal-materialization.js');

  const preview = {
    name: 'Sample Journal Blueprint',
    summary: 'Journal builder preview only',
    notes: ['Read-only preview model only.'],
    linkedReferences: [
      {
        kind: 'actor',
        label: 'SWF Vanguard Drill Sergeant',
        status: 'candidate',
        provisionalNote: 'Mention-style cross-reference only; no true relation is created in this slice.'
      }
    ]
  };

  const data = globalThis.SWF.journalMaterialization.buildJournalEntryCreateDataFromPreview(preview);
  assert.equal(data.name, 'Sample Journal Blueprint');
  assert.equal(Array.isArray(data.pages), true);
  assert.equal(data.pages.length, 2);
  assert.equal(data.pages[0].name, 'Overview');
  assert.equal(data.pages[0].type, 'text');
  assert.equal(data.pages[0].text.format, 1);
  assert.match(data.pages[0].text.content, /Journal builder preview only/);
  assert.equal(data.pages[1].name, 'Details');
  assert.equal(data.pages[1].type, 'text');
  assert.equal(data.pages[1].text.format, 1);
  assert.match(data.pages[1].text.content, /Deferred References/);
  assert.match(data.pages[1].text.content, /SWF Vanguard Drill Sergeant/);
});

test('journal materialization creates only overview page when notes and references are absent', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  globalThis.CONST = { JOURNAL_ENTRY_PAGE_FORMATS: { HTML: 1 } };

  loadScript('scripts/authoring/journal/journal-materialization.js');

  const data = globalThis.SWF.journalMaterialization.buildJournalEntryCreateDataFromPreview({
    name: 'One Page Journal',
    summary: 'Overview only.'
  });

  assert.equal(data.pages.length, 1);
  assert.equal(data.pages[0].name, 'Overview');
  assert.match(data.pages[0].text.content, /Overview only/);
});

test('journal materialization enforces GM-only and returns created entry on success', async () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  globalThis.CONST = { JOURNAL_ENTRY_PAGE_FORMATS: { HTML: 1 } };

  loadScript('scripts/authoring/journal/journal-materialization.js');

  globalThis.game = { user: { isGM: false } };
  globalThis.JournalEntry = { create: async () => ({ id: 'x' }) };

  const denied = await globalThis.SWF.journalMaterialization.materializeJournalPreviewAsWorldEntry({ name: 'Denied' });
  assert.equal(denied.ok, false);
  assert.equal(denied.reason, 'gm-only');

  globalThis.game = { user: { isGM: true } };
  globalThis.JournalEntry = {
    async create(data) {
      return { id: 'abc123', name: data.name };
    }
  };

  const created = await globalThis.SWF.journalMaterialization.materializeJournalPreviewAsWorldEntry({
    name: 'Created Journal',
    summary: 'Safe test summary.'
  });

  assert.equal(created.ok, true);
  assert.equal(created.entry.id, 'abc123');
  assert.equal(created.createData.name, 'Created Journal');
});
