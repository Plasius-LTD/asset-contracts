# TDR 0004: Model Resource Manifest Qualification

- Status: Accepted
- Date: 2026-10-24
- Tracking: asset-contracts Task 48; site Feature 1153
- Decision: ADR 0009

## Inputs and sequence

1. Accept an existing base or typed model `AssetManifest`, the published
   model-core `ResourcePackageManifest`, and exact exported `Uint8Array` files
   with independent content-type declarations. Optional inputs are native
   AbortSignal and a 1–60,000 ms deadline (default 10,000 ms).
2. Reject exotic metadata records, accessors, symbols, prototype keys, sparse
   arrays and unsupported root fields without executing metadata getters.
   Snapshot metadata using fixed count/depth/string/key limits.
3. Reuse the existing base or specialized model factory. Keep every existing
   role, source adapter and specialized field. Do not tighten legacy factories.
4. Require portable relative paths, unique case-insensitive names and no
   file/directory prefix collision. The entrypoint must be a descriptor path.
   Reject unsafe integer counts and fixed file/aggregate budget overruns.
5. Require one canonical package entry per descriptor, unique bounded logical
   ids, supported core inventory roles, and MIME declaration agreement when
   the optional inventory declaration exists. Do not map core roles to storage
   roles or infer content type from a filename.
6. Require one actual payload per descriptor with exact byte length and MIME
   declaration. Read byte lengths and buffers through typed-array intrinsics,
   rejecting shared storage. Only after all budgets and actual lengths pass,
   snapshot bytes before any asynchronous operation.
7. Sequentially compute SHA-256 through gpu-shader's existing Web Crypto helper.
   Check signal/deadline before and after every digest; compare exact lowercase
   digests. Return no result on any failure. Sequential hashing avoids
   unbounded concurrency; no filesystem, network, log, retry or caller callback
   is introduced. Deadline expiration cannot interrupt the platform digest,
   but it prevents a successful return after the operation finishes.
8. Return frozen metadata and frozen descriptors sorted by UTF-16 code units.
   The result is not a storage receipt or promotion attestation. A caller must
   retain the qualified bytes unchanged at its own durable boundary.

## Canonical fixture and source fidelity

Tests import the published model-core package, independently verify a triangle
document, and build its resource graph. The derived position buffer is embedded
in a glTF data URI; the original PNG remains an external exported file. Compare
each resource's byte content/hash with its payload and exported location, and
bind document source provenance to the entrypoint digest. Embedded data is not
listed as a fictitious archive file. The fixture does not grant production
format-parser, texture-role or promotion-closure authority.

## Rollout, compatibility and NFR evidence

Callers compose this helper behind backend-evaluated
`gpu.model.conversion.enabled`; disabled and rollback paths continue the legacy
factory. Test that enabled qualification rejects mismatched bytes while both
fallback paths preserve legacy behavior. No live control mutation is needed.
Security/privacy tests cover malformed shapes, value-free failures, traversal,
collisions, byte/hash/MIME drift, shared buffers and input mutation. Fixed
budgets and sequential work address reliability/performance; frozen snapshots
and exact inventory types address maintainability/testability. UI accessibility,
SEO and storage/encryption controls are N/A to this in-memory library boundary.

The public type requires exact `@plasius/gpu-model-core@0.7.0`; the import is
type-only. A full-audit failure also requires the targeted development-only
fast-uri override floor `^3.1.6` to `^3.1.9` and lock `3.1.8` to fixed `3.1.9`;
retain the existing AJV/major-3 dependency contract and rerun all gates. No
other dependency versions change. Require frozen Node 24 install,
full tests/privacy/coverage and changed-source LCOV, lint/types/build, dependency
tree/audits, packed ESM/CJS/types/browser-safe import, and public-registry
artifact/provenance checks. Ship an additive minor release via existing
`cd.yml`/`main`/`production` OIDC governance. Site adoption is separate.
