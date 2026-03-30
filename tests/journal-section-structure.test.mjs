import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

test('journal section structure maps preset-specific labels and order conservatively', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };

  loadScript('scripts/authoring/journal/journal-preset-definitions.js');
  loadScript('scripts/authoring/journal/journal-section-structure.js');

  const npcPlan = globalThis.SWF.journalSectionStructure.buildJournalSectionPlanFromPreview(
    {
      preset: {
        key: 'npc-profile',
        overviewPageName: 'Profile',
        detailsPageName: 'Profile Details',
        referencePageName: 'Deferred References'
      }
    },
    {
      hasDetailsContent: true,
      hasReferenceContent: true
    }
  );

  assert.deepEqual(
    npcPlan.map((section) => section.key),
    ['overview', 'references', 'details']
  );
  assert.equal(npcPlan[1].label, 'Related Entities');
  assert.equal(npcPlan[2].pageName, 'Profile Details');
});

test('journal section structure marks optional sections omitted when content is absent', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };

  loadScript('scripts/authoring/journal/journal-preset-definitions.js');
  loadScript('scripts/authoring/journal/journal-section-structure.js');

  const plan = globalThis.SWF.journalSectionStructure.buildJournalSectionPlanFromPreview(
    {
      preset: {
        key: 'quest-brief',
        overviewPageName: 'Brief',
        detailsPageName: 'Objectives and Details',
        referencePageName: 'Deferred References'
      }
    },
    {
      hasDetailsContent: false,
      hasReferenceContent: false
    }
  );

  assert.equal(plan.find((section) => section.key === 'overview')?.included, true);
  assert.equal(plan.find((section) => section.key === 'details')?.included, false);
  assert.equal(plan.find((section) => section.key === 'references')?.included, false);
});
