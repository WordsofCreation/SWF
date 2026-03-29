/**
 * Read-only utility for comparing normalized manifest-like objects.
 */
(() => {
  const { log, manifestBuilders, manifestRegistry, manifestValidation } = globalThis.SWF;

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function normalizeForComparison(manifestLike) {
    return manifestValidation.normalizeManifest(manifestLike ?? {});
  }

  function describeValueType(value) {
    if (Array.isArray(value)) return "array";
    if (value === null) return "null";
    return typeof value;
  }

  function collectPaths(value, basePath = "") {
    if (!isPlainObject(value)) {
      return [];
    }

    const entries = [];
    for (const key of Object.keys(value)) {
      const path = basePath ? `${basePath}.${key}` : key;
      const child = value[key];
      entries.push(path);

      if (isPlainObject(child)) {
        entries.push(...collectPaths(child, path));
      }
    }

    return entries;
  }

  function getPathValue(value, path) {
    const segments = path.split(".");
    let cursor = value;

    for (const segment of segments) {
      if (!isPlainObject(cursor) || !(segment in cursor)) {
        return undefined;
      }
      cursor = cursor[segment];
    }

    return cursor;
  }

  function compareManifestShapes(leftManifestLike, rightManifestLike) {
    const left = normalizeForComparison(leftManifestLike);
    const right = normalizeForComparison(rightManifestLike);

    const leftPaths = new Set(collectPaths(left));
    const rightPaths = new Set(collectPaths(right));
    const allPaths = Array.from(new Set([...leftPaths, ...rightPaths])).sort();

    const issues = [];

    for (const path of allPaths) {
      const inLeft = leftPaths.has(path);
      const inRight = rightPaths.has(path);

      if (inLeft && !inRight) {
        issues.push({
          category: "missing",
          path,
          leftValue: getPathValue(left, path),
          message: `Field '${path}' exists on canonical manifest but is missing from starter manifest.`
        });
        continue;
      }

      if (!inLeft && inRight) {
        issues.push({
          category: "extra",
          path,
          rightValue: getPathValue(right, path),
          message: `Field '${path}' exists on starter manifest but is not present on canonical manifest.`
        });
        continue;
      }

      const leftValue = getPathValue(left, path);
      const rightValue = getPathValue(right, path);
      const leftType = describeValueType(leftValue);
      const rightType = describeValueType(rightValue);

      if (leftType !== rightType) {
        issues.push({
          category: "mismatch",
          path,
          leftType,
          rightType,
          message: `Field '${path}' has type '${leftType}' on canonical and '${rightType}' on starter.`
        });
        continue;
      }

      if (!isPlainObject(leftValue) && !Array.isArray(leftValue) && leftValue !== rightValue) {
        issues.push({
          category: "mismatch",
          path,
          leftValue,
          rightValue,
          message: `Field '${path}' has differing primitive values.`
        });
      }
    }

    return {
      canonical: left,
      starter: right,
      issueCount: issues.length,
      issues
    };
  }

  function summarizeComparison(result) {
    return result.issues.reduce(
      (acc, issue) => {
        acc[issue.category] = (acc[issue.category] ?? 0) + 1;
        return acc;
      },
      { missing: 0, extra: 0, mismatch: 0 }
    );
  }

  function compareCanonicalAgainstStarters() {
    const types = manifestBuilders.getSupportedStarterTypes();

    return types.map((type) => {
      const canonicalManifest = manifestRegistry.getByType(type).find((manifest) => manifest.example === true) ?? null;
      const starterManifest = manifestBuilders.createStarterForType(type);

      if (!canonicalManifest || !starterManifest) {
        return {
          type,
          missingInput: true,
          issueCount: 0,
          summary: { missing: 0, extra: 0, mismatch: 0 },
          issues: []
        };
      }

      const comparison = compareManifestShapes(canonicalManifest, starterManifest);
      return {
        type,
        missingInput: false,
        issueCount: comparison.issueCount,
        summary: summarizeComparison(comparison),
        issues: comparison.issues
      };
    });
  }

  function logCanonicalStarterComparisons() {
    const reports = compareCanonicalAgainstStarters();
    for (const report of reports) {
      if (report.missingInput) {
        log(`[manifest-compare] Skipped ${report.type}: canonical or starter manifest unavailable.`);
        continue;
      }

      log(
        `[manifest-compare] ${report.type}: ${report.issueCount} issues ` +
          `(missing=${report.summary.missing}, extra=${report.summary.extra}, mismatch=${report.summary.mismatch}).`,
        report.issues
      );
    }

    return reports;
  }

  globalThis.SWF.manifestCompare = {
    compareManifestShapes,
    summarizeComparison,
    compareCanonicalAgainstStarters,
    logCanonicalStarterComparisons
  };
})();
