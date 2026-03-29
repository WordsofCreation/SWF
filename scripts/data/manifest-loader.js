/**
 * Minimal loader for module-owned JSON content manifests.
 */
(() => {
  const { MODULE_ID, log, manifestRegistry, manifestValidation } = globalThis.SWF;

  const MANIFEST_PATHS = [
    `modules/${MODULE_ID}/data/manifests/canonical-feature.json`,
    `modules/${MODULE_ID}/data/manifests/canonical-feat.json`,
    `modules/${MODULE_ID}/data/manifests/canonical-subclass.json`
  ];

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
    const valid = [];
    const invalid = [];
    const seenIds = new Set();

    for (const path of MANIFEST_PATHS) {
      const raw = await fetchManifest(path);
      if (!raw) {
        const unreadableManifest = manifestValidation.normalizeManifest({});
        invalid.push({
          path,
          id: "(unreadable)",
          type: "unknown",
          manifest: unreadableManifest,
          issues: [
            manifestValidation.createIssue({
              code: "manifest_unreadable",
              message: "Manifest could not be read or parsed."
            })
          ]
        });
        continue;
      }

      const manifest = manifestValidation.normalizeManifest(raw);
      const result = manifestValidation.validateManifest(manifest);
      const issues = [...result.issues];

      if (manifest.id && seenIds.has(manifest.id)) {
        issues.push(
          manifestValidation.createIssue({
            code: "duplicate_manifest_id",
            field: "id",
            message: `Duplicate manifest id '${manifest.id}'.`
          })
        );
      }

      const hasErrors = issues.some((issue) => issue.severity === "error");
      if (hasErrors) {
        invalid.push({
          path,
          id: manifest.id || "(missing-id)",
          type: manifest.type || "unknown",
          manifest,
          issues
        });
        log(`Manifest skipped at ${path}: ${issues.map((issue) => issue.message).join(" ")}`);
        continue;
      }

      seenIds.add(manifest.id);
      valid.push(manifest);
    }

    manifestRegistry.setAll(valid);
    manifestRegistry.setInvalidEntries(invalid);
    manifestRegistry.setLastLoadReport({
      attempted: MANIFEST_PATHS.length,
      loaded: valid.length,
      failed: invalid.length,
      warnings: 0
    });

    log(`Manifest load complete: ${valid.length}/${MANIFEST_PATHS.length} valid, ${invalid.length} invalid.`);

    return manifestRegistry.getStats();
  }

  globalThis.SWF.loadManifests = loadManifests;
})();
