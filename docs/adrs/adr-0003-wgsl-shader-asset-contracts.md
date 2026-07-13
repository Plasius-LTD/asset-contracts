# ADR 0003: WGSL Shader Asset Contracts

## Status

- Accepted
- Date: 2026-07-13
- Version: 1.0

## Context

Plasius shader code is assembled from WGSL fragments while model bytes and CPU
packers are produced elsewhere. Hand-maintained layout metadata can therefore
drift from the GPU-visible records, bindings, vertex inputs, semantics, and
pipeline requirements. The durable asset catalog also needs independently
versioned rendering styles so a model can switch between realistic, cartoon,
anime, and future profiles without repacking compatible model buffers.

`@plasius/gpu-shader` already owns strict, reflection-first GPU-interface,
shader-version, style-profile, compatibility, and qualification contracts.
`@plasius/asset-contracts` owns job, file, manifest, review, and promotion
lifecycle vocabulary. Forking the GPU contracts here would create another
source of truth; replacing the legacy asset manifest would break existing
model-processing consumers.

## Decision

1. Keep the existing `AssetManifest` source-compatible. Add an optional
   `assetKind` only to that legacy base, then require the discriminator on new
   typed manifests for models, GPU interfaces, shaders, style profiles, and
   validation evidence. The legacy generic factory rejects a supplied kind so
   typed validation cannot be bypassed.
2. Depend on the browser-safe root of `@plasius/gpu-shader`, re-export its
   canonical public types, and delegate nested validation to its strict parsers.
   Do not import its Node or testing subpaths from the package root.
3. Store the exact canonical domain manifest inside its lifecycle envelope.
   Do not duplicate records, offsets, alignments, hashes, requirements, or
   shader references into mutable sidecar fields. Typed factories reject
   undeclared envelope keys.
4. Require domain ids to use the same lowercase kebab-case lifecycle asset id
   and require the domain and lifecycle versions to be identical. Lossy
   normalization is not an identity operation. A public
   immutable exact-version reference is constructed only after the entrypoint
   bytes have a catalog URI; the ref factory verifies canonical bytes and
   computes the digest, which is never embedded in the manifest it identifies.
5. Require normalized, relative, unique POSIX Blob paths and every typed
   lifecycle entrypoint to resolve to exactly one file with the expected role.
   For shader assets, bind every module id and immutable URI path one-to-one to
   its WGSL Blob path, digest, byte length, and WGSL content type.
6. Extend model assets with the exact `GpuInterfaceRef`, `modelAbiHash`, provided
   semantics, and an exact default style-profile reference or `null`. Profiles
   remain independent catalog assets and reference exact shader versions by
   render role.
7. Represent validation evidence as its own immutable asset. Validate its
   credential-free HTTPS reference, supported universal or additive matrix identity,
   evidence digest, and distinct attestation digest at this boundary. Leave
   evidence-byte, qualification-bundle, trusted-provenance, and full Cartesian
   coverage verification to storage admission through
   `@plasius/gpu-shader/testing`, where all required artifacts exist.
8. Make generic asset factories preserve caller subtypes. Require typed GPU
   promotion to verify the complete declared byte map, canonical JSON, the
   nested interface/shader/profile entrypoint, and the runtime URI before
   preserving typed metadata
   through review, promotion, rollback, and downstream catalog handling. Keep
   legacy synchronous promotion source-compatible but reject typed assets there.
9. Export the canonical rollout flag `asset.pipeline.shader-store.enabled` and
   style-selection capability `gpu.shader.style.select` from the shared
   contract surface.

## Consequences

### Positive

- Final reflected WGSL remains the sole source of truth for CPU/GPU layouts.
- Existing model asset callers remain source-compatible.
- Interface, shader, evidence, and profile versions can be admitted, promoted,
  pinned, rolled back, and cached independently.
- Typed promotion records retain their complete contract shape.
- Storage admission and runtime can fail closed using the same exact identities.
- Exact public refs are created only after immutable entrypoint URIs exist and
  canonical bytes have been rehashed, so no manifest contains its own digest.

### Negative

- Browser consumers of `@plasius/asset-contracts` gain the runtime dependency
  on the browser-safe `@plasius/gpu-shader` root and its transitive package
  installation footprint.
- Declaration factories cannot prove full matrix passage without the
  qualification bundle. Byte validation can bind the stored files, while
  admission must still verify reflection, semantics, provenance, and complete
  matrix results before promotion.
- Adding a serialized typed-envelope field requires an intentional contract
  update because unknown fields are rejected.

## Alternatives Considered

- Copy GPU manifest interfaces and validation here: rejected because it would
  let layout and evidence rules drift from reflection and runtime validation.
- Make `assetKind` mandatory on the existing base: rejected because it would
  break source compatibility for already published model manifests.
- Store styles inside model versions: rejected because every new style would
  force model republishing and prevent independent rollback.
- Embed a shader's exact-version reference in its own manifest: rejected because
  the manifest digest would become self-referential.
- Treat evidence references as proof of passage: rejected because only the full
  evidence bytes, matrix, bundle, and provenance can prove 100% coverage.

## Related Decisions and Work

- Plasius-LTD/plasius-ltd-site Epic #902
- Plasius-LTD/plasius-ltd-site Feature #1026
- Plasius-LTD/plasius-ltd-site Story #1027
- Plasius-LTD/asset-contracts Task #15
- `@plasius/gpu-shader` ADR 0001
- [ADR 0001: Asset Contracts Package Boundary](./adr-0001-package-boundary.md)
- [TDR 0001: WGSL Shader Asset Envelope Validation](../tdrs/tdr-0001-wgsl-shader-asset-envelope-validation.md)
