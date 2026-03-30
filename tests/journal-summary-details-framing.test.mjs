import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

test('journal summary/details framing applies preset-aware labels for lore, npc, and quest presets', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };

  loadScript('scripts/authoring/journal/journal-preset-definitions.js');
  loadScript('scripts/authoring/journal/journal-summary-details-framing.js');

  const loreFrame = globalThis.SWF.journalSummaryDetailsFraming.buildSummaryDetailsFrameFromPreview({
    name: 'Lore Entry: Taris',
    summary: 'Planet history and present tensions.',
    notes: ['Context: Outer Rim frontier.', 'Known Boundaries: Ancient records are incomplete.'],
    preset: { key: 'lore-entry' }
  });

  const npcFrame = globalThis.SWF.journalSummaryDetailsFraming.buildSummaryDetailsFrameFromPreview({
    name: 'NPC Profile: Vesh',
    summary: 'Broker with uncertain loyalties.',
    notes: ['Identity Snapshot: Streetwise fixer.'],
    preset: { key: 'npc-profile' }
  });

  const questFrame = globalThis.SWF.journalSummaryDetailsFraming.buildSummaryDetailsFrameFromPreview({
    name: 'Quest/Mission Brief: Silent Dock',
    summary: 'Extract prisoners before sunrise.',
    notes: ['Objective: Infiltrate dock twelve.', 'Constraints: Avoid open conflict.'],
    preset: { key: 'quest-brief' }
  });

  assert.equal(loreFrame.summaryLabel, 'Lore Summary');
  assert.equal(npcFrame.summaryLabel, 'Table Role Summary');
  assert.equal(questFrame.summaryLabel, 'Objective Summary');
  assert.equal(questFrame.detailRows[0].label, 'Objective');
});
