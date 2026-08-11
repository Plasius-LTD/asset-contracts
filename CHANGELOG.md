# Changelog

## Unreleased

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - Added zero-dependency, path-only Git-index, working-tree, and final npm-pack
    gates that prevent CSV files, contributor registries, signed CLA artifacts,
    and privacy-marked registries from entering source or release artifacts.
  - Replaced the broad `legal/` package entry with the three exact public CLA
    Markdown documents and an extension-constrained final package allowlist.

## [0.3.1] - 2026-07-13

- **Added**
  - Added the canonical `assertImmutableAssetVersion` validator for immutable
    catalog identities while retaining the legacy `assertAssetVersion` helper
    for intentionally mutable workflow labels.

- **Changed**
  - Applied exact-version validation to model, GPU-interface, shader,
    style-profile, validation-evidence, post-storage reference, immutable
    rollback, and model-resolution `ModelAssetRef` contracts.
  - Aligned the GPU contract dependency to `@plasius/gpu-shader` 0.1.1 so
    validation uses the canonical stable-WebGPU matrix policy artifact.

- **Fixed**
  - Fixed immutable shader, profile, interface, evidence, model, and rollback
    references accepting moving catalog labels such as `latest`.

- **Security**
  - Rejected case-insensitive mutable aliases, ranges, wildcards, and
    URL-shaped values at immutable GPU asset boundaries with a stable bounded
    error that never includes untrusted input.

## [0.3.0] - 2026-07-13

- **Added**
  - Added typed model, reflected GPU-interface, WGSL shader, rendering-style
    profile, and shader-validation-evidence asset manifests and immutable
    factories for Story #1027 and Task #15.
  - Added GPU model ABI, provided-semantics, optional exact default-style,
    shader module, stable-WebGPU matrix evidence, and attestation contracts by
    reusing `@plasius/gpu-shader` as the canonical domain source.
  - Added complete-file byte validation, typed GPU promotion, one-to-one WGSL
    module-path binding, and post-storage exact interface/shader/profile refs.

- **Changed**
  - Kept legacy manifests source-compatible while making generic manifest and
    promotion factories preserve specialized caller fields and manifest types.
  - Added canonical GPU asset kinds, file roles, and WGSL/JSON content types.

- **Fixed**
  - (placeholder)

- **Security**
  - Added fail-closed typed-envelope validation for undeclared fields, lifecycle
    identity/version drift, ABI hash drift, WGSL digest/size/content-type drift,
    unsupported matrix policies, credential-bearing artifact URIs, and missing
    evidence attestations.
  - Rejected absolute, scheme-bearing, traversing, duplicate, and non-POSIX Blob
    paths; typed assets cannot bypass byte verification through legacy promotion.

## [0.2.0] - 2026-07-13

- **Added**
  - Added versioned model request, assessment, candidate, rights/provenance,
    processing manifest, resolution, immutable asset reference, and
    forward-compatible generator-port/result contracts with a disabled Phase 1
    implementation for Story #1484 and Task #1485.
  - Added deterministic render, collision/fidelity policy, independent hard-gate,
    confirmation, staged-child closure, and atomic promotion receipt evidence.

- **Changed**
  - Refreshed compatible test, lint, build, and type-definition dependencies as
    part of the Epic dependency review; TypeScript 7 remains deferred as a
    separate major compatibility upgrade.

- **Fixed**
  - (placeholder)

- **Security**
  - Bound assurance, rights, conversion, render, validation, confirmation, and
    promotion evidence to the exact request, source package, resolution,
    candidate, processing manifest, and staged closure.
  - Added fail-closed public request ceilings, deterministic hard-constraint
    evaluation for pre-candidate profiles and at candidate/resolution boundaries,
    resolution-bound confirmation chronology, canonical MCP resource namespaces,
    and query-free public-page references.

## [0.1.5] - 2026-06-28

- **Added**
  - (placeholder)

- **Changed**
  - Refreshed `@typescript-eslint/eslint-plugin` to `8.62.0` to align the linting baseline with the current latest-stable template packages.

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.4] - 2026-06-22

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.3] - 2026-06-21

- Scaffolded @plasius/asset-contracts for the unified AI asset pipeline.
- Added canonical asset job and promotion record contracts to complete the initial public asset lifecycle surface.
- Pointed package support metadata at the active `plasius-ltd-site` issue tracker.
- Corrected repo-local guidance so the scaffold documentation identifies the asset-contracts package accurately.


[0.1.3]: https://github.com/Plasius-LTD/asset-contracts/releases/tag/v0.1.3
[0.1.4]: https://github.com/Plasius-LTD/asset-contracts/releases/tag/v0.1.4
[0.1.5]: https://github.com/Plasius-LTD/asset-contracts/releases/tag/v0.1.5
[0.2.0]: https://github.com/Plasius-LTD/asset-contracts/releases/tag/v0.2.0
[0.3.0]: https://github.com/Plasius-LTD/asset-contracts/releases/tag/v0.3.0
[0.3.1]: https://github.com/Plasius-LTD/asset-contracts/releases/tag/v0.3.1
