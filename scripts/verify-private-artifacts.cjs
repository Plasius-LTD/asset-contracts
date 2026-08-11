#!/usr/bin/env node
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const {
  findPrivateArtifactViolations,
  normalizeArtifactPath,
} = require("./private-artifact-policy.cjs");

const EXCLUDED_DIRECTORY_NAMES = new Set([
  ".cache",
  ".git",
  ".npm-cache-packcheck",
  ".turbo",
  "coverage",
  "node_modules",
]);

/**
 * Enumerate working-tree paths without opening files or following symlinks.
 * Ignored files are intentionally included so `.gitignore` cannot become the
 * enforcement boundary.
 *
 * @param {string} rootDirectory
 * @returns {string[]}
 */
function collectWorkingTreeArtifactPaths(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const artifactPaths = [];

  function visit(directory, relativeDirectory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (
        entry.isDirectory() &&
        EXCLUDED_DIRECTORY_NAMES.has(entry.name.toLocaleLowerCase("en-US"))
      ) {
        continue;
      }

      const relativePath = normalizeArtifactPath(
        path.posix.join(relativeDirectory, entry.name)
      );
      const absolutePath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        visit(absolutePath, relativePath);
        continue;
      }

      artifactPaths.push(relativePath);
    }
  }

  visit(root, "");
  return sortArtifactPaths(artifactPaths);
}

/**
 * Read only path metadata from the proposed Git index. This deliberately keeps
 * a tracked-but-unstaged deletion visible until the deletion is staged.
 *
 * @param {string} rootDirectory
 * @returns {string[]}
 */
function collectGitIndexArtifactPaths(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const output = execFileSync(
    "git",
    ["-C", root, "ls-files", "--cached", "-z"],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  return sortArtifactPaths(
    output
      .split("\0")
      .filter(Boolean)
      .map((artifactPath) => normalizeArtifactPath(artifactPath))
  );
}

/**
 * Combine current working-tree metadata with the proposed commit/index state.
 *
 * @param {string} rootDirectory
 * @returns {string[]}
 */
function collectCandidateArtifactPaths(rootDirectory = process.cwd()) {
  return sortArtifactPaths(
    new Set([
      ...collectWorkingTreeArtifactPaths(rootDirectory),
      ...collectGitIndexArtifactPaths(rootDirectory),
    ])
  );
}

/** @param {Iterable<string>} artifactPaths */
function sortArtifactPaths(artifactPaths) {
  return [...artifactPaths].sort((left, right) => {
    const leftPath = left.toLocaleLowerCase("en-US");
    const rightPath = right.toLocaleLowerCase("en-US");
    if (leftPath < rightPath) return -1;
    if (leftPath > rightPath) return 1;
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  });
}

function main(argv = process.argv.slice(2)) {
  if (argv.length > 1) {
    console.error("Usage: verify-private-artifacts.cjs [repository-root]");
    return 2;
  }

  const root = path.resolve(argv[0] || process.cwd());
  const artifactPaths = collectCandidateArtifactPaths(root);
  const violations = findPrivateArtifactViolations(artifactPaths);

  if (violations.length > 0) {
    console.error(
      "Private artifact policy failed. Prohibited paths were found; file contents were not inspected:"
    );
    for (const violation of violations) {
      console.error(`- ${violation.artifactPath} (${violation.ruleId})`);
    }
    return 1;
  }

  console.log(
    `Private artifact policy passed (${artifactPaths.length} candidate paths inspected; contents not read).`
  );
  return 0;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  collectCandidateArtifactPaths,
  collectGitIndexArtifactPaths,
  collectWorkingTreeArtifactPaths,
  main,
};
