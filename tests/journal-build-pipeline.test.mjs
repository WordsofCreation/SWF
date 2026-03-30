import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

function loadJournalPipelineDependencies() {
  loadScript('scripts/authoring/journal/journal-preset-definitions.js');
  loadScript('scripts/authoring/journal/journal-reference-emphasis.js');
  loadScript('scripts/authoring/journal/journal-summary-details-framing.js');
  loadScript('scripts/authoring/journal/journal-reference-presentation.js');
  loadScript('scripts/authoring/journal/journal-section-structure.js');
  loadScript('scripts/authoring/journal/journal-validation.js');
  loadScript('scripts/authoring/journal/journal-build-pipeline.js');
}

test('journal build pipeline returns explicit authoring, shaping, and validation stages', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  loadJournalPipelineDependencies();

  const pipeline = globalThis.SWF.journalBuildPipeline.buildJournalBuildPipelineFromPreview({
    name: 'NPC Profile: Koro Venn',
    summary: 'A fixer with shifting loyalties.',
    notes: ['Identity Snapshot: Streetwise fixer.'],
    linkedReferences: [{ kind: 'actor', label: 'Dock Marshal' }],
    preset: {
      key: 'npc-profile',
      label: 'NPC Profile',
      overviewPageName: 'Profile',
      detailsPageName: 'Profile Details',
      referencePageName: 'Deferred References',
      referenceEmphasisKey: 'npc-profile'
    }
  });

  assert.equal(pipeline.authoring.name, 'NPC Profile: Koro Venn');
  assert.equal(pipeline.shaping.summaryDetailsFrame.summaryLabel, 'Table Role Summary');
  assert.equal(pipeline.shaping.referenceBlock.targetPageName, 'Deferred References');
  assert.deepEqual(
    pipeline.shaping.sectionPlan.map((section) => section.key),
    ['overview', 'references', 'details']
  );
  assert.equal(pipeline.validation.ok, true);
});
