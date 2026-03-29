/**
 * Tiny explicit validation contract for module-owned manifest metadata.
 */
(() => {
  const COMMON_REQUIRED_FIELDS = ["id", "type", "name", "version", "description", "status"];
  const TYPE_REQUIRED_FIELDS = {
    feature: ["source"],
    feat: ["source"],
    subclass: ["classIdentifier"]
  };

  const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");
  const toId = (value) => normalizeString(value).toLowerCase();

  function createIssue({ severity = "error", code, field = null, message }) {
    return { severity, code, field, message };
  }

  function normalizeManifest(raw) {
    const base = {
      id: toId(raw?.id),
      type: toId(raw?.type),
      name: normalizeString(raw?.name),
      version: normalizeString(raw?.version),
      description: normalizeString(raw?.description),
      status: toId(raw?.status)
    };

    if (raw && Object.hasOwn(raw, "source")) {
      base.source = normalizeString(raw.source);
    }

    if (raw && Object.hasOwn(raw, "classIdentifier")) {
      base.classIdentifier = normalizeString(raw.classIdentifier);
    }

    if (raw && Object.hasOwn(raw, "example")) {
      // `example` is fixture/sample tagging metadata.
      // Canonical designation is documented separately and is not implied for all examples.
      base.example = raw.example === true;
    }

    return base;
  }

  function validateManifest(manifest) {
    const issues = [];

    for (const field of COMMON_REQUIRED_FIELDS) {
      if (typeof manifest[field] !== "string" || manifest[field].length === 0) {
        issues.push(createIssue({
          code: "missing_required_field",
          field,
          message: `Missing required field '${field}'.`
        }));
      }
    }

    if (!manifest.type || !Object.hasOwn(TYPE_REQUIRED_FIELDS, manifest.type)) {
      issues.push(createIssue({
        code: "unsupported_type",
        field: "type",
        message: `Unsupported manifest type '${manifest.type || "(empty)"}'.`
      }));
    } else {
      for (const field of TYPE_REQUIRED_FIELDS[manifest.type]) {
        if (typeof manifest[field] !== "string" || manifest[field].length === 0) {
          issues.push(createIssue({
            code: "missing_type_required_field",
            field,
            message: `Type '${manifest.type}' requires field '${field}'.`
          }));
        }
      }
    }

    return {
      issues,
      errors: issues.filter((issue) => issue.severity === "error"),
      warnings: issues.filter((issue) => issue.severity === "warning"),
      isValid: issues.every((issue) => issue.severity !== "error")
    };
  }

  globalThis.SWF.manifestValidation = {
    COMMON_REQUIRED_FIELDS,
    TYPE_REQUIRED_FIELDS,
    normalizeManifest,
    validateManifest,
    createIssue
  };
})();
