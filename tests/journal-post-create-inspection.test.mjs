import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadScript(path) {
  const source = fs.readFileSync(path, 'utf8');
  vm.runInThisContext(source, { filename: path });
}

test('journal post-create inspection summarizes successful creation conservatively', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };

  loadScript('scripts/authoring/journal/journal-post-create-inspection.js');

  const inspection = globalThis.SWF.journalPostCreateInspection.buildJournalPostCreateInspection({
    preview: {
      name: 'Sample Journal Blueprint',
      summary: 'Preview summary',
      notes: ['n1', 'n2'],
      linkedReferences: [{ kind: 'actor', label: 'A' }]
    },
    result: {
      ok: true,
      statusMessage: 'Created Journal entry: Sample Journal Blueprint',
      createData: {
        name: 'Sample Journal Blueprint',
        pages: [{ type: 'text' }]
      },
      entry: {
        id: 'abc123',
        name: 'Sample Journal Blueprint',
        uuid: 'JournalEntry.abc123',
        pages: { size: 1 }
      }
    }
  });

  assert.equal(inspection.status.ok, true);
  assert.equal(inspection.createdJournal.id, 'abc123');
  assert.match(inspection.fieldMapping.find((row) => row.key === 'name')?.actual ?? '', /Sample Journal Blueprint/);
  assert.equal(inspection.materializedClusters.length > 0, true);
  assert.equal(inspection.deferredClusters.includes('cross-document references (actor/item)'), true);
});

test('journal post-create inspection reports failed creation and keeps deferred list', () => {
  globalThis.SWF = { MODULE_ID: 'swf-module' };

  loadScript('scripts/authoring/journal/journal-post-create-inspection.js');

  const inspection = globalThis.SWF.journalPostCreateInspection.buildJournalPostCreateInspection({
    preview: { name: 'Will Fail' },
    result: {
      ok: false,
      errorMessage: 'Failed to create Journal entry: no permission'
    }
  });

  assert.equal(inspection.status.ok, false);
  assert.equal(inspection.createdJournal, null);
  assert.equal(inspection.materializedClusters.length, 0);
  assert.equal(inspection.warnings.some((warning) => warning.includes('Failed to create Journal entry')), true);
});
