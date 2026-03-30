/**
 * Shared presentation helpers for builder validation-and-trace preview data.
 */
(() => {
  const { validationTraceModel } = globalThis.SWF;

  function createTraceSection({ key, label, items, emptyText }) {
    return Object.freeze({
      key,
      label,
      items,
      hasItems: items.length > 0,
      emptyText
    });
  }

  function buildValidationTraceDisplay(trace) {
    const model = validationTraceModel.createValidationTraceModel(trace);

    const sections = Object.freeze([
      createTraceSection({
        key: "warnings",
        label: "Warnings",
        items: model.warnings,
        emptyText: "No preview warnings."
      }),
      createTraceSection({
        key: "deferred-fields",
        label: "Deferred Fields",
        items: model.deferredFields,
        emptyText: "No deferred fields listed."
      }),
      createTraceSection({
        key: "provisional-fields",
        label: "Provisional Fields",
        items: model.provisionalFields,
        emptyText: "No provisional fields listed."
      }),
      createTraceSection({
        key: "trace-notes",
        label: "Trace Notes",
        items: model.traceNotes,
        emptyText: "No trace notes listed."
      })
    ]);

    return Object.freeze({
      readiness: model.readiness,
      sections
    });
  }

  globalThis.SWF.validationTracePresentation = {
    buildValidationTraceDisplay
  };
})();
