const path = require("node:path");

const PATH_MARKER_SEPARATOR = String.raw`(?:^|[/ ._-])`;
const PATH_MARKER_END = String.raw`(?=$|[/ ._-])`;

const PRIVACY_MARKER_PATTERN = new RegExp(
  `${PATH_MARKER_SEPARATOR}(?:private|confidential|internal|personal|pii)${PATH_MARKER_END}`,
  "iu"
);
const REGISTRY_MARKER_PATTERN = new RegExp(
  `${PATH_MARKER_SEPARATOR}(?:registry|register|roster|ledger)${PATH_MARKER_END}`,
  "iu"
);

const PRIVATE_ARTIFACT_RULES = Object.freeze([
  Object.freeze({
    id: "csv-artifact",
    description:
      "CSV files are not permitted in public source or package artifacts.",
    matches: (artifactPath) => /\.csv$/iu.test(artifactPath),
  }),
  Object.freeze({
    id: "contributor-registry",
    description:
      "Contributor and CLA acceptance registries must remain in approved private systems.",
    matches: (artifactPath) =>
      /(?:^|\/)(?:cla|contributors?)[ ._-]*registry(?:\.[^/]*)?(?:\/|$)/iu.test(
        artifactPath
      ),
  }),
  Object.freeze({
    id: "signed-cla-storage",
    description:
      "Signed CLA submissions and signature records must remain in approved private systems.",
    matches: (artifactPath) =>
      /(?:^|\/)(?:signed[ ._-]*clas?|cla[ ._-]*(?:acceptances?|signatures?|submissions?))(?:\/|$)/iu.test(
        artifactPath
      ),
  }),
  Object.freeze({
    id: "private-registry",
    description:
      "Private, confidential, internal, personal, or PII registries must remain outside public artifacts.",
    matches: (artifactPath) =>
      PRIVACY_MARKER_PATTERN.test(artifactPath) &&
      REGISTRY_MARKER_PATTERN.test(artifactPath),
  }),
]);

/**
 * Normalize a repository or package path without opening the referenced file.
 * npm tarball listings may include one leading `package/` directory, which is
 * removed so source-tree and package checks share the same policy.
 *
 * @param {string} artifactPath
 * @returns {string}
 */
function normalizeArtifactPath(artifactPath) {
  if (typeof artifactPath !== "string") {
    throw new TypeError("Artifact paths must be strings.");
  }

  let normalized = path.posix.normalize(artifactPath.replace(/\\/gu, "/"));
  if (normalized === ".") {
    return "";
  }

  if (normalized.startsWith("./")) {
    normalized = normalized.slice(2);
  }

  if (normalized === "package") {
    return "";
  }

  return normalized.startsWith("package/")
    ? normalized.slice("package/".length)
    : normalized;
}

/**
 * Find private-artifact policy violations using path metadata only.
 *
 * @param {Iterable<string>} artifactPaths
 * @returns {Array<{artifactPath: string, ruleId: string, description: string}>}
 */
function findPrivateArtifactViolations(artifactPaths) {
  const violations = new Map();

  for (const candidate of artifactPaths) {
    const artifactPath = normalizeArtifactPath(candidate);
    if (!artifactPath) {
      continue;
    }

    for (const rule of PRIVATE_ARTIFACT_RULES) {
      if (!rule.matches(artifactPath)) {
        continue;
      }

      const key = `${artifactPath.toLocaleLowerCase("en-US")}\0${rule.id}`;
      violations.set(key, {
        artifactPath,
        ruleId: rule.id,
        description: rule.description,
      });
      break;
    }
  }

  return [...violations.values()].sort((left, right) => {
    const leftPath = left.artifactPath.toLocaleLowerCase("en-US");
    const rightPath = right.artifactPath.toLocaleLowerCase("en-US");
    if (leftPath < rightPath) return -1;
    if (leftPath > rightPath) return 1;
    if (left.artifactPath < right.artifactPath) return -1;
    if (left.artifactPath > right.artifactPath) return 1;
    return left.ruleId.localeCompare(right.ruleId, "en-US");
  });
}

module.exports = {
  findPrivateArtifactViolations,
  normalizeArtifactPath,
  PRIVATE_ARTIFACT_RULES,
};
