# ADR 0009: Additive Model Resource Manifest Qualification

- Status: Accepted
- Date: 2026-10-24
- Tracking: package Task 48; site Feature 1153 / Epic 1147

## Context

The existing file and manifest factories validate descriptor syntax. They do
not bind a model-core `ResourcePackageManifest` to the exact exported file set
or prove that the declared entrypoint exists. Tightening the existing factories
would change their public compatibility contract, including callers which
construct descriptors before storage bytes exist.

## Decision

Add `qualifyModelResourceManifest` as a separate, opt-in asynchronous boundary.
Reuse `AssetFileDescriptor`, `AssetManifest`, their existing factories, the
published model-core package inventory type, and gpu-shader's SHA-256 helper.
The qualifier requires one inventory entry and one byte payload for each
descriptor, including the entrypoint. It checks portable relative paths,
case-insensitive and file/directory collisions, canonical declared MIME types,
safe integer byte lengths, actual lengths and SHA-256 digests. Output file
order uses locale-independent code-unit comparison.

Snapshot all metadata and byte inputs before the first hash. Apply fixed count,
depth and byte ceilings, reject shared byte storage, and check cancellation and
deadline around each bounded hash. Web Crypto cannot cancel an in-flight
digest; a deadline is checked again before any successful return. No partial
manifest is returned on failure. Errors contain fixed codes, not caller data.

Keep roles, sourceAdapter and source/derived paths unchanged. Embedded resources
remain inside their exported entrypoint; they are not invented as separate
archive files. A verified model-core fixture independently checks embedded and
external resource identity and source provenance. This boundary neither parses
formats nor proves that a file internally references every required resource.
Task 51 owns promotion/resource closure, Task 50 owns detailed role mapping,
Task 12 owns animation/source relationship schemas and Task 23 owns shader ABI
qualification. Typed model envelopes still use the existing specialized factory.

Use exact published `@plasius/gpu-model-core@0.7.0` as a direct dependency because
the public input declarations reference its inventory type. The import is
type-only: no core parser, renderer or model runtime is loaded by this helper.
The full qualification audit additionally found the pre-existing development
AJV dependency `fast-uri@3.1.8` affected by newly published URI-normalization
advisories. Raise its existing override floor from `^3.1.6` to `^3.1.9` and
lock fixed `3.1.9`, retaining major 3. This targeted audit-blocker remediation
does not add runtime URI processing. No other dependency versions change.

## Alternatives and consequences

Changing legacy factories would break staged descriptor construction. Parsing
glTF/FBX here would duplicate adapter responsibilities. Treating descriptor
hashes as byte evidence would allow mismatches to survive. The new boundary
provides byte/inventory qualification only; storage, malware inspection,
format validity and promotion remain downstream responsibilities. Qualification
is evidence at call time, not an unforgeable promotion attestation.

## Rollout, tests and release

The backend remote evaluator owns `gpu.model.conversion.enabled`. Callers opt
into this helper when enabled; disabled or rollback paths retain their existing
factories. This library performs no live flag lookup or state mutation. There
is no UI or entitlement capability. Tests cover enabled/disabled/rollback
composition, legacy compatibility, canonical resource identity, malformed
inputs, fixed budgets, cancellation, deadlines and mutation isolation.

Update README, Unreleased changelog and TDR 0004. Require Node 24 frozen install,
tests/privacy, coverage and changed-source LCOV, lint/types/build, audits, pack
gates and packed/public ESM/CJS/types qualification. Release an additive minor
version through the existing PR, exact-main push CI and hosted
`cd.yml`/`production` OIDC path from ADR 0007. Verify public registry integrity
and provenance before downstream adoption. This Task authorizes no site
deployment or change to any existing release gate.
