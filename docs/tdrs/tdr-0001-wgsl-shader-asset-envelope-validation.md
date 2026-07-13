# TDR 0001: WGSL Shader Asset Envelope Validation

## Status

- Accepted
- Date: 2026-07-13
- Version: 1.0

## Direction

Implement the storage-facing contract layer as a thin, browser-safe adapter over
`@plasius/gpu-shader`:

1. `createGpuInterfaceAssetManifest` strictly parses `GpuInterfaceManifest` and
   binds its exact lifecycle id and version to a `gpu-interface-manifest`
   entrypoint.
2. `createShaderAssetManifest` strictly parses `ShaderVersionManifest`, binds
   identity/version, and binds every module id and URI path one-to-one to a
   unique relative WGSL path, digest, byte length, and content type.
3. `createShaderStyleProfileAssetManifest` strictly parses exact role-to-shader
   pins and binds the profile identity/version to its entrypoint.
4. `createModelAssetManifest` normalizes a missing default profile to `null` and
   validates model ABI equality through `ModelGpuCompatibilityDescriptor`.
5. `createShaderValidationEvidenceAssetManifest` accepts only the currently
   supported universal or additive matrix policy and requires exact evidence
   and attestation file digests.
6. Specialized factories reconstruct allow-listed envelopes and reject unknown
   keys. The legacy generic factory remains extensible and generic; promotion
   preserves typed fields only through `createGpuAssetPromotionRecord`, which
   first verifies the complete declared file-byte map. The synchronous legacy
   promotion factory rejects typed assets.
7. Post-storage ref factories accept validated domain manifests, canonical
   bytes, and immutable URIs; they recompute entrypoint digests, avoiding
   self-referential or caller-asserted manifest hashes.

## Admission Boundary

These synchronous factories validate shape and declared relationships only.
`@plasius/asset-processing` must use the Node/testing subpaths to assemble WGSL,
reflect final interfaces, regenerate CPU artifacts and hashes, digest actual
files, validate fixtures, and verify complete evidence. `@plasius/asset-pipeline`
may promote only the independently immutable assets produced by that admission
result. Runtime catalog consumers re-verify bytes and compatibility before
creating GPU resources.

No caller-provided layout sidecar, evidence reference alone, skipped runner, or
unavailable matrix cell can satisfy the admission gate.

## Dependency Direction

```text
@plasius/asset-contracts -> @plasius/gpu-shader (browser-safe root)
@plasius/asset-processing -> @plasius/asset-contracts
@plasius/asset-processing -> @plasius/gpu-shader/node + /testing
@plasius/asset-pipeline -> released @plasius/asset-contracts + processing result
```

The contracts root must never import Node-only reflection, filesystem, browser
automation, or qualification execution code.
