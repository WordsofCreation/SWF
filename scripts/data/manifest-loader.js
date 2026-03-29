/**
 * Minimal loader for module-owned JSON content manifests.
 */
(() => {
  const { MODULE_ID, log, manifestRegistry } = globalThis.SWF;

  const SUPPORTED_TYPES = new Set(["feature", "feat", "subclass"]);
  const MANIFEST_PATHS = [
    `modules/${MODULE_ID}/data/manifests/placeholder-feature.json`,
    `modules/${MODULE_ID}/data/manifests/placeholder-feat.json`
  ];

  const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

  function normalizeManifest(raw) {
    return {
      id: normalizeString(raw?.id).toLowerCase(),
      type: normalizeString(raw?.type).toLowerCase(),
      name: normalizeString(raw?.name),
      version: normalizeString(raw?.version),
      description: normalizeString(raw?.description),
      status: normalizeString(raw?.status).toLowerCase()
    };
  }

  function validateManifest(manifest) {
    const errors = [];

    if (!manifest.id) errors.push("missing id");
    if (!manifest.type) errors.push("missing type");
    if (!manifest.name) errors.push("missing name");
    if (!manifest.version) errors.push("missing version");
    if (!manifest.description) errors.push("missing description");
    if (!manifest.status) errors.push("missing status");
    if (manifest.type && !SUPPORTED_TYPES.has(manifest.type)) {
      errors.push(`unsupported type '${manifest.type}'`);
    }

    return errors;
  }

  async function fetchManifest(path) {
    let response;
    try {
      response = await fetch(path);
    } catch (error) {
      log(`Manifest fetch failed at ${path}:`, error);
      return null;
    }

    if (!response.ok) {
      log(`Manifest fetch returned ${response.status} for ${path}.`);
      return null;
    }

    try {
      return await response.json();
    } catch (error) {
      log(`Manifest JSON parse failed at ${path}:`, error);
      return null;
    }
  }

  async function loadManifests() {
    const validated = [];
    const seenIds = new Set();

    for (const path of MANIFEST_PATHS) {
      const raw = await fetchManifest(path);
      if (!raw) continue;

      const manifest = normalizeManifest(raw);
      const errors = validateManifest(manifest);

      if (seenIds.has(manifest.id)) {
        errors.push(`duplicate id '${manifest.id}'`);
      }

      if (errors.length > 0) {
        log(`Manifest skipped at ${path}: ${errors.join(", ")}.`);
        continue;
      }

      seenIds.add(manifest.id);
      validated.push(manifest);
    }

    manifestRegistry.setAll(validated);
    log(`Manifest load complete: ${validated.length}/${MANIFEST_PATHS.length} valid.`);

    return manifestRegistry.getStats();
  }

  globalThis.SWF.loadManifests = loadManifests;
})();
