/**
 * Tiny in-memory registry for validated SWF content manifests.
 */
(() => {
  const { log } = globalThis.SWF;

  const manifestsById = new Map();
  let lastLoadReport = {
    attempted: 0,
    loaded: 0,
    failed: 0
  };

  function clear() {
    manifestsById.clear();
    lastLoadReport = {
      attempted: 0,
      loaded: 0,
      failed: 0
    };
  }

  function setAll(manifests) {
    clear();
    for (const manifest of manifests) {
      manifestsById.set(manifest.id, manifest);
    }
  }

  function setLastLoadReport(report) {
    lastLoadReport = {
      attempted: Number(report?.attempted) || 0,
      loaded: Number(report?.loaded) || 0,
      failed: Number(report?.failed) || 0
    };
  }

  function getLastLoadReport() {
    return { ...lastLoadReport };
  }

  function getAll() {
    return Array.from(manifestsById.values());
  }

  function getById(id) {
    return manifestsById.get(id) ?? null;
  }

  function getByType(type) {
    return getAll().filter((manifest) => manifest.type === type);
  }

  function getStats() {
    const all = getAll();
    const byType = all.reduce((acc, manifest) => {
      acc[manifest.type] = (acc[manifest.type] ?? 0) + 1;
      return acc;
    }, {});

    return { total: all.length, byType };
  }

  globalThis.SWF.manifestRegistry = {
    clear,
    setAll,
    setLastLoadReport,
    getLastLoadReport,
    getAll,
    getById,
    getByType,
    getStats
  };

  log("Manifest registry initialized.");
})();
