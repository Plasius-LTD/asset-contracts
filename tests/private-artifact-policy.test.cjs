const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  findPrivateArtifactViolations,
  normalizeArtifactPath,
} = require("../scripts/private-artifact-policy.cjs");
const {
  collectCandidateArtifactPaths,
} = require("../scripts/verify-private-artifacts.cjs");
const {
  EXPECTED_PACKAGE_FILE_ENTRIES,
  findMissingTarballPaths,
  findPackageFileManifestViolations,
  findUnexpectedTarballPaths,
  runNpmPackDryRun,
} = require("../scripts/verify-public-package.cjs");

test("normalizes platform separators and an optional npm package prefix", () => {
  assert.equal(
    normalizeArtifactPath("package\\packages\\example\\legal\\CLA-REGISTRY.csv"),
    "packages/example/legal/CLA-REGISTRY.csv"
  );
  assert.equal(
    normalizeArtifactPath(
      "./package/packages/example/../example/legal/CLA-REGISTRY.csv"
    ),
    "packages/example/legal/CLA-REGISTRY.csv"
  );
});

test("rejects every CSV extension case-insensitively", () => {
  const violations = findPrivateArtifactViolations([
    "fixtures/public-data.csv",
    "package/legal/renamed-records.CsV",
  ]);

  assert.deepEqual(
    violations.map(({ artifactPath, ruleId }) => ({ artifactPath, ruleId })),
    [
      {
        artifactPath: "fixtures/public-data.csv",
        ruleId: "csv-artifact",
      },
      {
        artifactPath: "legal/renamed-records.CsV",
        ruleId: "csv-artifact",
      },
    ]
  );
});

test("rejects CLA and contributor registries with any extension", () => {
  const violations = findPrivateArtifactViolations([
    "legal/CLA-REGISTRY.json",
    "legal/cla-registry/record.json",
    "packages/example/legal/contributor_registry.xlsx",
    "packages\\example\\LEGAL\\Contributors Registry.db",
  ]);

  assert.equal(violations.length, 4);
  assert.ok(
    violations.every(({ ruleId }) => ruleId === "contributor-registry")
  );
});

test("rejects signed CLA storage and privacy-marked registries", () => {
  const violations = findPrivateArtifactViolations([
    "legal/signed-clas/example.pdf",
    "records/internal-contributor-roster.json",
    "private/ledger.json",
    "packages/example/confidential_register.txt",
  ]);

  assert.deepEqual(
    new Set(violations.map(({ ruleId }) => ruleId)),
    new Set(["private-registry", "signed-cla-storage"])
  );
  assert.equal(violations.length, 4);
});

test("allows public CLA templates and benign software registries", () => {
  assert.deepEqual(
    findPrivateArtifactViolations([
      "CONTRIBUTORS.md",
      "legal/CLA.md",
      "legal/INDIVIDUAL_CLA.md",
      "legal/CORPORATE_CLA.md",
      "src/mcp-admin-registry.ts",
      "docs/cla-signing-process.md",
    ]),
    []
  );
});

test("candidate discovery includes a tracked but unstaged deletion", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "private-artifact-index-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  execFileSync("git", ["init", "--quiet", root]);
  fs.mkdirSync(path.join(root, "legal"), { recursive: true });
  const candidatePath = path.join(root, "legal", "CLA-REGISTRY.csv");
  fs.closeSync(fs.openSync(candidatePath, "w"));
  execFileSync("git", ["-C", root, "add", "legal/CLA-REGISTRY.csv"]);

  fs.rmSync(candidatePath);
  assert.deepEqual(
    findPrivateArtifactViolations(collectCandidateArtifactPaths(root)).map(
      ({ artifactPath, ruleId }) => ({ artifactPath, ruleId })
    ),
    [
      {
        artifactPath: "legal/CLA-REGISTRY.csv",
        ruleId: "csv-artifact",
      },
    ]
  );

  execFileSync("git", ["-C", root, "add", "--update"]);
  assert.deepEqual(
    findPrivateArtifactViolations(collectCandidateArtifactPaths(root)),
    []
  );
});

test("candidate discovery includes ignored working-tree paths", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "private-artifact-ignore-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  execFileSync("git", ["init", "--quiet", root]);
  fs.writeFileSync(path.join(root, ".gitignore"), "*.csv\n");
  fs.closeSync(fs.openSync(path.join(root, "ignored.csv"), "w"));

  assert.deepEqual(
    findPrivateArtifactViolations(collectCandidateArtifactPaths(root)).map(
      ({ artifactPath, ruleId }) => ({ artifactPath, ruleId })
    ),
    [{ artifactPath: "ignored.csv", ruleId: "csv-artifact" }]
  );
});

test("requires a non-empty exact package files allowlist", () => {
  assert.deepEqual(
    findPackageFileManifestViolations(EXPECTED_PACKAGE_FILE_ENTRIES),
    []
  );
  assert.ok(
    findPackageFileManifestViolations(undefined).some(
      ({ code }) => code === "missing-files-allowlist"
    )
  );
  assert.ok(
    findPackageFileManifestViolations([]).some(
      ({ code }) => code === "missing-files-allowlist"
    )
  );
});

test("rejects broad package files entries", () => {
  for (const broadEntry of [".", "*", "**/*", "legal"]) {
    const violations = findPackageFileManifestViolations([
      ...EXPECTED_PACKAGE_FILE_ENTRIES,
      broadEntry,
    ]);
    assert.ok(
      violations.some(({ code }) => code === "broad-files-entry"),
      `expected ${broadEntry} to be rejected as broad`
    );
  }
});

test("allows only exact public roots and approved prefix extensions in a pack", () => {
  const allowedPaths = [
    "package/package.json",
    "package/README.md",
    "package/CHANGELOG.md",
    "package/LICENSE",
    "package/SECURITY.md",
    "package/CODE_OF_CONDUCT.md",
    "package/CONTRIBUTORS.md",
    "package/legal/CLA.md",
    "package/legal/CORPORATE_CLA.md",
    "package/legal/INDIVIDUAL_CLA.md",
    "package/dist/index.js",
    "package/dist/index.js.map",
    "package/dist/index.cjs",
    "package/dist/index.cjs.map",
    "package/dist/index.d.ts",
    "package/dist/index.d.ts.map",
    "package/dist/index.d.cts",
    "package/dist/index.d.cts.map",
    "package/src/index.ts",
    "package/docs/adrs/index.md",
  ];

  assert.deepEqual(findUnexpectedTarballPaths(allowedPaths), []);
  assert.deepEqual(findMissingTarballPaths(allowedPaths), []);

  assert.deepEqual(
    findUnexpectedTarballPaths([
      "dist/index.mjs",
      "src/index.js",
      "docs/decision.txt",
      "legal/INTERNAL.md",
      "scripts/postinstall.cjs",
    ]),
    [
      "dist/index.mjs",
      "docs/decision.txt",
      "legal/INTERNAL.md",
      "scripts/postinstall.cjs",
      "src/index.js",
    ]
  );
});

test("cleans the isolated npm cache when pack inspection fails", (t) => {
  const temporaryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "private-artifact-pack-cache-")
  );
  t.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));

  let cacheDirectory;
  assert.throws(
    () =>
      runNpmPackDryRun({
        temporaryRoot,
        execute: (_command, args) => {
          cacheDirectory = args[args.indexOf("--cache") + 1];
          assert.equal(fs.existsSync(cacheDirectory), true);
          throw new Error("synthetic npm pack failure");
        },
      }),
    /synthetic npm pack failure/u
  );

  assert.equal(typeof cacheDirectory, "string");
  assert.equal(fs.existsSync(cacheDirectory), false);
});
