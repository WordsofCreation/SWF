/**
 * Tiny in-memory starter manifest builders.
 *
 * These builders only return normalized plain objects and never persist data.
 */
(() => {
  const { manifestValidation } = globalThis.SWF;

  const DEFAULT_VERSION = "0.1.0";
  const DEFAULT_STATUS = "draft";

  function createBaseStarter({ id, type, name, description }) {
    return {
      id,
      type,
      name,
      version: DEFAULT_VERSION,
      description,
      status: DEFAULT_STATUS
    };
  }

  function normalizeAndValidateStarter(rawStarter) {
    const manifest = manifestValidation.normalizeManifest(rawStarter);
    const result = manifestValidation.validateManifest(manifest);

    if (!result.isValid) {
      const details = result.issues.map((issue) => issue.message).join(" ");
      throw new Error(`Invalid starter manifest generated: ${details}`);
    }

    return manifest;
  }

  function createFeatureStarter() {
    return normalizeAndValidateStarter({
      ...createBaseStarter({
        id: "starter-feature",
        type: "feature",
        name: "Starter Feature",
        description: "Starter in-memory manifest for feature-type SWF content metadata."
      }),
      source: "swf-module"
    });
  }

  function createFeatStarter() {
    return normalizeAndValidateStarter({
      ...createBaseStarter({
        id: "starter-feat",
        type: "feat",
        name: "Starter Feat",
        description: "Starter in-memory manifest for feat-type SWF content metadata."
      }),
      source: "swf-module"
    });
  }

  function createSubclassStarter() {
    return normalizeAndValidateStarter({
      ...createBaseStarter({
        id: "starter-subclass",
        type: "subclass",
        name: "Starter Subclass",
        description: "Starter in-memory manifest for subclass-type SWF content metadata."
      }),
      classIdentifier: "starter-class"
    });
  }

  const starterBuildersByType = {
    feature: createFeatureStarter,
    feat: createFeatStarter,
    subclass: createSubclassStarter
  };

  function createStarterForType(type) {
    const normalizedType = typeof type === "string" ? type.trim().toLowerCase() : "";
    const builder = starterBuildersByType[normalizedType];
    return builder ? builder() : null;
  }

  function getSupportedStarterTypes() {
    return Object.keys(starterBuildersByType);
  }

  globalThis.SWF.manifestBuilders = {
    createFeatureStarter,
    createFeatStarter,
    createSubclassStarter,
    createStarterForType,
    getSupportedStarterTypes
  };
})();
