# Changelog

## Unreleased

- **Added**
  - Added the additive PVOX v2 model-resolution contract family for Task #25:
    source-ingestion and texture-free runtime request profiles, authenticated
    PVOX manifests, voxel technical/capability/physical/fidelity evidence,
    compound-addressed edit journals, native-render confirmation binding,
    diagnostic/confirmable candidate results, pointer-last promotion receipts,
    durable lifecycle states, and strict self-contained JSON Schema descriptors.
  - Added executable, little-endian PVOX hash-preimage encoders with an exact
    normalized root-header layout and real SHA-256 golden vectors.
  - (placeholder)

- **Changed**
  - Preserved v1 GLB model-resolution APIs and immutable `ModelAssetRef` values
    while providing deterministic v2-to-v1 state projections for compatibility
    wrappers.
  - Fixed PVOX 1.0 to a major/minor version, whole uncompressed 64-KiB pages,
    scoped metadata/LOD/render/collision page kinds, bounded codec/layout
    constants, and feasible brick/logical-voxel/encoded-sample ceilings.
  - Bound npm publication to the exact prepared `main` commit after successful
    push-triggered CI.
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - Added fail-closed validation for authenticated PVOX resource namespaces,
    fixed format/page/limit invariants, binary/processing/assembly closure
    separation, exact hash-domain bindings, localized physical and governed
    fidelity admission, non-overridable hard gates, and confirmation tokens
    bound to the complete candidate evidence subject.
  - Bound confirmation and pointer-last publication to the complete semantic,
    provenance, rights, binary/processing/assembly/evaluation, capability,
    native-render, and confirmation-binding evidence closures.
  - Required typed physical-inventory/render/evaluation/assembly attestations,
    canonical physical evidence order, base-root-bound edit genesis, complete
    current-state CAS for later edits, and non-empty edit transitions.
  - Made render brick/sample budgets artifact-wide across all retained LODs,
    required an exact closed section registry and non-empty destruction bond
    graph, and bound confirmation chronology to durable snapshot timestamps.
  - Rejected unknown fixed-preimage fields, malformed fixed tuples, byte-view
    type confusion, shared mutable byte storage, and inputs beyond governed
    assembly/hash-work limits; aligned strict JSON Schema lifecycle branches
    with the authoritative runtime factories.
  - Pinned audited transitive `brace-expansion`, `nanoid`, and `postcss`
    versions so the complete development and production dependency trees are
    free of known npm advisories at the configured severity gate.
  - Added fail-closed source and npm-package admission for the administrative contributor registry and pinned the CI/CD runtime to Node.js 24.18.0 LTS.
  - Added zero-dependency, path-only Git-index, working-tree, and final npm-pack
    gates that prevent CSV files, contributor registries, signed CLA artifacts,
    and privacy-marked registries from entering source or release artifacts.
  - Replaced the broad `legal/` package entry with the three exact public CLA
    Markdown documents and an extension-constrained final package allowlist.
  - Removed the legacy npm write-token path and added a fail-closed npm
    11.5.1-or-newer OIDC runtime check.
  - (placeholder)

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
