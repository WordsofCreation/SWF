import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

test('journal reference presentation maps shared references into actor/item sections', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };
  loadScript('scripts/authoring/journal/journal-reference-emphasis.js');
  loadScript('scripts/authoring/journal/journal-reference-presentation.js');

  const block = globalThis.SWF.journalReferencePresentation.mapSharedReferencesToJournalReferenceBlock(
    [
      { kind: 'actor', label: 'SWF Vanguard Drill Sergeant', role: 'Mentioned entity', status: 'candidate' },
      { kind: 'item', label: 'Guardian Posture', status: 'candidate' },
      { kind: 'journal', label: 'Nested Journal Link' }
    ],
    { targetPageName: 'Details', presetKey: 'quest-brief' }
  );

  assert.equal(block.title, 'References');
  assert.equal(block.targetPageName, 'Details');
  assert.equal(block.surfacedCount, 2);
  assert.equal(block.deferredCount, 3);
  assert.equal(block.sections[0].kind, 'item');
  assert.equal(block.sections.find((section) => section.kind === 'actor')?.count, 1);
  assert.equal(block.sections.find((section) => section.kind === 'item')?.count, 1);
  assert.equal(block.primarySections[0].kind, 'item');
  assert.equal(block.emphasis.primaryGroupLabel, 'Primary Mission Assets');
  assert.equal(block.deferredReferences.length, 1);
  assert.equal(block.deferredReferences[0].kind, 'journal');
});
