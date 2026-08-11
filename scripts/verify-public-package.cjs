#!/usr/bin/env node
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  findPrivateArtifactViolations,
  normalizeArtifactPath,
} = require("./private-artifact-policy.cjs");
const {
  collectCandidateArtifactPaths,
} = require("./verify-private-artifacts.cjs");

const EXPECTED_PACKAGE_FILE_ENTRIES = Object.freeze([
  "dist",
  "src",
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "SECURITY.md",
  "CODE_OF_CONDUCT.md",
  "CONTRIBUTORS.md",
  "docs",
  "legal/CLA.md",
  "legal/CORPORATE_CLA.md",
  "legal/INDIVIDUAL_CLA.md",
]);

const BROAD_PACKAGE_FILE_ENTRIES = new Set([
  ".",
  "./",
  "*",
  "**",
  "**/*",
  "legal",
  "legal/",
]);

const EXACT_PUBLIC_TARBALL_PATHS = new Set([
  "package.json",
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "SECURITY.md",
  "CODE_OF_CONDUCT.md",
  "CONTRIBUTORS.md",
  "legal/CLA.md",
  "legal/CORPORATE_CLA.md",
  "legal/INDIVIDUAL_CLA.md",
]);

const REQUIRED_PUBLIC_TARBALL_PREFIXES = Object.freeze([
  "dist/",
  "src/",
  "docs/",
]);

const DIST_FILE_PATTERN = /^dist\/.+(?:\.js|\.cjs|\.d\.ts|\.d\.cts)(?:\.map)?$/u;
const SOURCE_FILE_PATTERN = /^src\/.+\.ts$/u;
const DOCUMENTATION_FILE_PATTERN = /^docs\/.+\.md$/u;

function main() {
  const repositoryPrivateArtifactViolations = findPrivateArtifactViolations(
    collectCandidateArtifactPaths(process.cwd())
  );
  if (repositoryPrivateArtifactViolations.length > 0) {
    reportPrivateArtifactViolations(
      "Public package check stopped before npm pack. Prohibited private artifact paths found:",
      repositoryPrivateArtifactViolations
    );
    return 1;
  }

  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const manifestViolations = findPackageFileManifestViolations(packageJson.files);
  if (manifestViolations.length > 0) {
    console.error(
      "Public package check failed. package.json files must use the exact approved allowlist:"
    );
    for (const violation of manifestViolations) {
      console.error(`- ${violation.message}`);
    }
    return 1;
  }

  const paths = runNpmPackDryRun();

  const privateArtifactViolations = findPrivateArtifactViolations(paths);
  if (privateArtifactViolations.length > 0) {
    reportPrivateArtifactViolations(
      "Public package check failed. Prohibited private artifact paths found:",
      privateArtifactViolations
    );
    return 1;
  }

  const unexpectedTarballPaths = findUnexpectedTarballPaths(paths);
  if (unexpectedTarballPaths.length > 0) {
    console.error(
      "Public package check failed. Paths outside the final package allowlist were found:"
    );
    for (const artifactPath of unexpectedTarballPaths) {
      console.error(`- ${artifactPath}`);
    }
    return 1;
  }

  const missingTarballPaths = findMissingTarballPaths(paths);
  if (missingTarballPaths.length > 0) {
    console.error(
      "Public package check failed. Required package paths or roots were missing:"
    );
    for (const artifactPath of missingTarballPaths) {
      console.error(`- ${artifactPath}`);
    }
    return 1;
  }

  const forbiddenCodeReferencePatterns = [
    {
      label: "private monorepo reference",
      regex: /\bplasius-ltd-site\b/i,
    },
    {
      label: "Plasius Ltd private reference",
      regex: /\bplasius(?:\s+|-)ltd\b/i,
    },
    {
      label: "proprietary PGP artifact reference",
      regex: /\bpgp[-_a-z0-9]*\b/i,
    },
    {
      label: "proprietary Lunari artifact reference",
      regex: /\blunari\b/i,
    },
    {
      label: "proprietary Pixelverse artifact reference",
      regex: /\bpixelverse\b/i,
    },
  ];

  const codeRoots = ["src", "tests", "demo"];
  const codeExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".json"]);
  const violations = scanCodeReferences(
    codeRoots,
    codeExtensions,
    forbiddenCodeReferencePatterns
  );

  if (violations.length > 0) {
    console.error(
      "Public package check failed. Forbidden private/product code references found:"
    );
    for (const violation of violations) {
      console.error(`- ${violation.file}:${violation.line} (${violation.label})`);
    }
    return 1;
  }

  console.log("Public package check passed.");
  return 0;
}

/** @param {unknown} packageFiles */
function findPackageFileManifestViolations(packageFiles) {
  if (!Array.isArray(packageFiles) || packageFiles.length === 0) {
    return [
      {
        code: "missing-files-allowlist",
        message: "files must be a non-empty explicit array.",
      },
    ];
  }

  const violations = [];
  const seen = new Set();

  for (const entry of packageFiles) {
    if (typeof entry !== "string" || entry.length === 0) {
      violations.push({
        code: "invalid-files-entry",
        message: "files entries must be non-empty strings.",
      });
      continue;
    }

    if (BROAD_PACKAGE_FILE_ENTRIES.has(entry)) {
      violations.push({
        code: "broad-files-entry",
        message: `broad files entry is prohibited: ${entry}`,
      });
    }

    if (seen.has(entry)) {
      violations.push({
        code: "duplicate-files-entry",
        message: `duplicate files entry: ${entry}`,
      });
    }
    seen.add(entry);
  }

  for (const expected of EXPECTED_PACKAGE_FILE_ENTRIES) {
    if (!seen.has(expected)) {
      violations.push({
        code: "missing-files-entry",
        message: `missing required files entry: ${expected}`,
      });
    }
  }

  for (const entry of seen) {
    if (!EXPECTED_PACKAGE_FILE_ENTRIES.includes(entry)) {
      violations.push({
        code: "unexpected-files-entry",
        message: `unexpected files entry: ${entry}`,
      });
    }
  }

  if (
    violations.length === 0 &&
    !EXPECTED_PACKAGE_FILE_ENTRIES.every(
      (expected, index) => packageFiles[index] === expected
    )
  ) {
    violations.push({
      code: "files-entry-order",
      message: "files entries must use the canonical approved order.",
    });
  }

  return violations;
}

/** @param {Iterable<string>} artifactPaths */
function findUnexpectedTarballPaths(artifactPaths) {
  return [...artifactPaths]
    .map((artifactPath) => normalizeArtifactPath(artifactPath))
    .filter(Boolean)
    .filter((artifactPath) => !isAllowedTarballPath(artifactPath))
    .sort((left, right) => left.localeCompare(right, "en-US"));
}

/** @param {Iterable<string>} artifactPaths */
function findMissingTarballPaths(artifactPaths) {
  const normalizedPaths = new Set(
    [...artifactPaths]
      .map((artifactPath) => normalizeArtifactPath(artifactPath))
      .filter(Boolean)
  );
  const missing = [];

  for (const artifactPath of EXACT_PUBLIC_TARBALL_PATHS) {
    if (!normalizedPaths.has(artifactPath)) {
      missing.push(artifactPath);
    }
  }

  for (const prefix of REQUIRED_PUBLIC_TARBALL_PREFIXES) {
    if (![...normalizedPaths].some((artifactPath) => artifactPath.startsWith(prefix))) {
      missing.push(`${prefix}*`);
    }
  }

  return missing.sort((left, right) => left.localeCompare(right, "en-US"));
}

/** @param {string} artifactPath */
function isAllowedTarballPath(artifactPath) {
  return (
    EXACT_PUBLIC_TARBALL_PATHS.has(artifactPath) ||
    DIST_FILE_PATTERN.test(artifactPath) ||
    SOURCE_FILE_PATTERN.test(artifactPath) ||
    DOCUMENTATION_FILE_PATTERN.test(artifactPath)
  );
}

function runNpmPackDryRun({
  cwd = process.cwd(),
  execute = execFileSync,
  temporaryRoot = os.tmpdir(),
} = {}) {
  const cacheDir = fs.mkdtempSync(
    path.join(temporaryRoot, "plasius-public-pack-check-")
  );

  try {
    const npmExecutable = process.platform === "win32" ? "npm.cmd" : "npm";
    const output = execute(
      npmExecutable,
      [
        "pack",
        "--dry-run",
        "--json",
        "--ignore-scripts",
        "--cache",
        cacheDir,
      ],
      {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }
    );
    const parsed = parseNpmPackJson(output);
    const files = Array.isArray(parsed) && parsed[0]?.files ? parsed[0].files : [];
    return files.map((entry) => entry.path);
  } finally {
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
}

function parseNpmPackJson(rawOutput) {
  const start = rawOutput.indexOf("[");
  const end = rawOutput.lastIndexOf("]");

  if (start < 0 || end < start) {
    throw new Error("Could not find npm pack JSON payload in command output.");
  }

  const jsonSlice = rawOutput.slice(start, end + 1);
  return JSON.parse(jsonSlice);
}

function reportPrivateArtifactViolations(message, violations) {
  console.error(message);
  for (const violation of violations) {
    console.error(`- ${violation.artifactPath} (${violation.ruleId})`);
  }
}

function scanCodeReferences(roots, extensions, patterns) {
  const allFiles = [];
  for (const root of roots) {
    allFiles.push(...collectFiles(path.resolve(process.cwd(), root), extensions));
  }

  const violations = [];
  for (const file of allFiles) {
    const contents = fs.readFileSync(file, "utf8");

    for (const pattern of patterns) {
      const matchIndex = contents.search(pattern.regex);
      if (matchIndex < 0) {
        continue;
      }

      const beforeMatch = contents.slice(0, matchIndex);
      const line = beforeMatch.split(/\r?\n/u).length;
      violations.push({
        file: path.relative(process.cwd(), file),
        line,
        label: pattern.label,
      });
      break;
    }
  }

  return violations;
}

function collectFiles(root, extensions) {
  if (!fs.existsSync(root)) {
    return [];
  }

  const entries = fs.readdirSync(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === "dist" ||
        entry.name === "dist-cjs"
      ) {
        continue;
      }
      files.push(...collectFiles(fullPath, extensions));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (extensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

module.exports = {
  EXPECTED_PACKAGE_FILE_ENTRIES,
  findMissingTarballPaths,
  findPackageFileManifestViolations,
  findUnexpectedTarballPaths,
  main,
  parseNpmPackJson,
  runNpmPackDryRun,
};
