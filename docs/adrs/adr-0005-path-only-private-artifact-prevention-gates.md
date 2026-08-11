# ADR-0005: Path-Only Private-Artifact Prevention Gates

## Status

- Accepted
- Date: 2026-07-15
- Version: 1.0

## Tags

security, privacy, packaging, ci, compliance

## Context

Public source repositories and npm artifacts must never contain signed
contributor agreements, acceptance registries, or similar personal records.
An ignore rule cannot reject an already tracked path, while a broad package
directory entry can silently expand a future release artifact.

The prevention control must not increase exposure while evaluating a candidate
repository. It therefore cannot open, hash, copy, diff, or log the contents of
a suspected private artifact.

## Decision

Contributor agreements and acceptance records are stored only in an approved,
access-controlled system outside source control.

This package provides a zero-dependency Node.js path policy with three
enforcement boundaries:

1. `privacy:check` unions working-tree path metadata with `git ls-files
   --cached`, without following symbolic links or reading candidate contents.
   Ignored files remain visible, and a tracked deletion remains prohibited until
   its removal is staged in the proposed index.
2. `package.json.files` must equal a non-empty explicit allowlist. Broad entries
   such as `.`, `*`, `**/*`, and `legal` fail closed; only the three public CLA
   Markdown files may be selected from `legal/`.
3. `pack:check` applies the private-path policy and an exact path/extension
   allowlist to the path manifest returned by `npm pack --dry-run --json
   --ignore-scripts`. Its isolated temporary npm cache is removed in a `finally`
   boundary.

The path policy rejects CSV files case-insensitively, CLA or contributor
registries regardless of extension, signed-CLA storage directories, and paths
that combine a privacy marker with a registry marker. It deliberately permits
benign software terms such as `src/mcp-admin-registry.ts`.

CI runs the repository gate before dependency installation and runs the policy
tests plus package gate after build. Release preparation checks source before
changing release metadata, CD checks the exact prepared commit before install,
and `prepublishOnly` retains the package gate as a final local defense.

Feature flags and capabilities do not apply: this mandatory privacy boundary
must not be remotely bypassable.

## Alternatives Considered

- **Rely on `.gitignore` only**: rejected because ignore rules do not remove or
  reject already tracked files and do not validate the proposed index.
- **Scan file contents for personal data**: rejected for this boundary because
  opening and reporting suspected records can increase exposure, while content
  heuristics still have false positives and false negatives.
- **Rely on `package.json.files` only**: rejected because directory entries can
  expand over time and do not protect source-control state.
- **Rely on the final package manifest only**: rejected because release
  preparation and dependency installation must fail before packaging begins.

## Consequences

- Candidate repositories and npm path manifests fail closed on protected paths
  without inspecting candidate contents.
- Package selection is explicit, and generated/source/documentation roots are
  constrained to their intended extensions.
- New public path categories or private-artifact categories require an explicit
  policy and regression-test update.
- These controls are defense in depth, not a replacement for history cleanup,
  registry remediation, secret scanning, access controls, or retention policy.

## Related Decisions

- [ADR 0001: Asset Contracts Package Boundary](./adr-0001-package-boundary.md)
