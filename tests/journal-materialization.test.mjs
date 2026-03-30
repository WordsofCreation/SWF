import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

function loadJournalMaterializationDependencies() {
  loadScript('scripts/authoring/journal/journal-preset-definitions.js');
  loadScript('scripts/authoring/journal/journal-section-structure.js');
  loadScript('scripts/authoring/journal/journal-reference-emphasis.js');
  loadScript('scripts/authoring/journal/journal-summary-details-framing.js');
  loadScript('scripts/authoring/journal/journal-reference-presentation.js');
  loadScript('scripts/authoring/journal/journal-materialization.js');
}

test('journal materialization builds explicit overview, details, and deferred-reference pages when content exists', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  globalThis.CONST = { JOURNAL_ENTRY_PAGE_FORMATS: { HTML: 1 } };

  loadJournalMaterializationDependencies();

  const preview = {
    name: 'Sample Journal Blueprint',
    summary: 'Journal builder preview only',
    notes: ['Read-only preview model only.'],
    preset: {
      key: 'lore-entry',
      referenceEmphasisKey: 'lore-entry',
      overviewPageName: 'Overview',
      detailsPageName: 'Details',
      referencePageName: 'Deferred References'
    },
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
  assert.equal(data.pages.length, 3);
  assert.equal(data.pages[0].name, 'Overview');
  assert.equal(data.pages[0].type, 'text');
  assert.equal(data.pages[0].text.format, 1);
  assert.match(data.pages[0].text.content, /Lore Summary/);
  assert.match(data.pages[0].text.content, /Journal builder preview only/);

  assert.equal(data.pages[1].name, 'Details');
  assert.equal(data.pages[1].type, 'text');
  assert.equal(data.pages[1].text.format, 1);
  assert.match(data.pages[1].text.content, /Lore Details/);

  assert.equal(data.pages[2].name, 'Deferred References');
  assert.equal(data.pages[2].type, 'text');
  assert.equal(data.pages[2].text.format, 1);
  assert.match(data.pages[2].text.content, /References \(Deferred\)/);
  assert.match(data.pages[2].text.content, /SWF Vanguard Drill Sergeant/);
  assert.match(data.pages[2].text.content, /Core Lore Mentions/);
  assert.match(data.pages[2].text.content, /Target page:/);
  assert.match(data.pages[2].text.content, /Preset emphasis:/);

  assert.equal(data.flags['swf-module'].journalPresetKey, 'lore-entry');
  assert.equal(data.flags['swf-module'].journalReferenceEmphasis.primaryGroupLabel, 'Core Lore Mentions');
  assert.equal(data.flags['swf-module'].journalSummaryDetailsFrame.summaryLabel, 'Lore Summary');
  assert.deepEqual(
    data.flags['swf-module'].journalSectionPlan.map((section) => section.key),
    ['overview', 'details', 'references']
  );
});

test('journal materialization applies preset page naming when provided', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  globalThis.CONST = { JOURNAL_ENTRY_PAGE_FORMATS: { HTML: 1 } };

  loadJournalMaterializationDependencies();

  const data = globalThis.SWF.journalMaterialization.buildJournalEntryCreateDataFromPreview({
    name: 'Quest Brief: The Broken Tower',
    summary: 'Recover the missing sigil.',
    notes: ['Objective: Recover the sigil.', 'Constraints: Return before dawn.'],
    linkedReferences: [],
    preset: {
      key: 'quest-brief',
      overviewPageName: 'Brief',
      detailsPageName: 'Mission Details',
      referencePageName: 'Deferred References'
    }
  });

  assert.equal(data.pages.length, 2);
  assert.equal(data.pages[0].name, 'Brief');
  assert.equal(data.pages[1].name, 'Mission Details');
  assert.equal(data.flags['swf-module'].journalPresetKey, 'quest-brief');
});

test('journal materialization creates only overview page when notes and references are absent', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  globalThis.CONST = { JOURNAL_ENTRY_PAGE_FORMATS: { HTML: 1 } };

  loadJournalMaterializationDependencies();

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

  loadJournalMaterializationDependencies();

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


test('journal materialization applies npc preset section order when all section content exists', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  globalThis.CONST = { JOURNAL_ENTRY_PAGE_FORMATS: { HTML: 1 } };

  loadJournalMaterializationDependencies();

  const data = globalThis.SWF.journalMaterialization.buildJournalEntryCreateDataFromPreview({
    name: 'NPC Profile: Koro Venn',
    summary: 'A fixer with shifting loyalties.',
    notes: ['Motivations: Stay employed.', 'Interaction Cues: Speaks quickly.'],
    linkedReferences: [{ kind: 'actor', label: 'Dock Marshal' }],
    preset: {
      key: 'npc-profile',
      referenceEmphasisKey: 'npc-profile',
      overviewPageName: 'Profile',
      detailsPageName: 'Profile Details',
      referencePageName: 'Deferred References'
    }
  });

  assert.deepEqual(
    data.pages.map((page) => page.name),
    ['Profile', 'Deferred References', 'Profile Details']
  );
});
