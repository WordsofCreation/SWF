/**
 * Shared presentation helpers for builder materialization-readiness data.
 */
(() => {
  const { materializationReadinessModel } = globalThis.SWF;

  function createSection({ key, label, items, emptyText }) {
    return Object.freeze({
      key,
      label,
      items,
      hasItems: items.length > 0,
      emptyText
    });
  }

  function buildMaterializationReadinessDisplay(readiness) {
    const model = materializationReadinessModel.createMaterializationReadinessModel(readiness);

    const sections = Object.freeze([
      createSection({
        key: "ready-clusters",
        label: "Ready Clusters",
        items: model.readyClusters,
        emptyText: "No clusters are marked ready."
      }),
      createSection({
        key: "deferred-clusters",
        label: "Deferred Clusters",
        items: model.deferredClusters,
        emptyText: "No deferred clusters are listed."
      }),
      createSection({
        key: "provisional-clusters",
        label: "Provisional Clusters",
        items: model.provisionalClusters,
        emptyText: "No provisional clusters are listed."
      })
    ]);

    const nextStepSummary = `Ready: ${model.readyClusters.length} • Deferred: ${model.deferredClusters.length} • Provisional: ${model.provisionalClusters.length}`;

    return Object.freeze({
      readiness: model.readiness,
      nextStepNote: model.nextStepNote,
      nextStepSummary,
      sections
    });
  }

  globalThis.SWF.materializationReadinessPresentation = {
    buildMaterializationReadinessDisplay
  };
})();
