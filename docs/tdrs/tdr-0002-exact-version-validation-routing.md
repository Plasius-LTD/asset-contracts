# TDR 0002: Exact-Version Validation Routing

## Status

- Accepted
- Date: 2026-07-13
- Version: 1.0

## Direction

`src/asset-version.ts` owns both version boundaries:

- `assertAssetVersion` preserves the existing bounded token grammar for legacy
  workflow records.
- `assertImmutableAssetVersion` starts with the same grammar, rejects the
  case-folded mutable-alias set, and rejects SemVer-like `x` wildcard segments.
  Characters used by ranges, wildcards, whitespace, schemes, authorities,
  queries, and fragments already fail the bounded token grammar.

The immutable error message is constant. It never contains the input, has no
branch-specific wording, and remains bounded even for very large non-string or
string input.

## Validation Routing

The exact validator is mandatory at these boundaries:

| Boundary | Exact version fields |
| --- | --- |
| Typed GPU lifecycle base | `ModelAssetManifest.version`, `GpuInterfaceAssetManifest.version`, `ShaderAssetManifest.version`, `ShaderStyleProfileAssetManifest.version`, `ShaderValidationEvidenceAssetManifest.version` |
| Reflected interface | `GpuInterfaceManifest.interfaceVersion`, `GpuInterfaceRef.interfaceVersion` |
| Shader | `ShaderVersionManifest.version`, GPU-interface and compatible-model interface versions, universal/additive matrix versions |
| Style profile | Profile version, every role's `ShaderVersionRef.version`, compatible interface versions, required matrix versions |
| Model | Compatibility descriptor version, GPU-interface version, optional default-profile version |
| Evidence | Matrix-policy version |
| Promotion | Typed GPU promotion version and optional rollback target |
| Model resolution | Immutable `ModelAssetRef.version` |

Generic manifests, jobs, reviews, and promotion records remain on
`assertAssetVersion` unless they carry a typed GPU manifest. Toolchain,
converter, renderer, policy, and calibration versions are not catalog asset
references and keep their existing validators.

## Processing Order

1. A typed GPU factory validates its lifecycle version before delegating to the
   generic base factory.
2. The canonical `@plasius/gpu-shader` parser validates the nested shape and
   token grammar.
3. Asset-contracts traverses the parsed object and applies the immutable
   validator to every exact nested version.
4. Existing identity, digest, byte, path, evidence, and promotion checks run
   unchanged.

Post-storage ref factories repeat nested exact-version validation before
binding canonical bytes and computing the manifest digest. Model-resolution
validates `ModelAssetRef.version` before constructing its canonical MCP URI so
aliases and URL-shaped values cannot influence the resource identity.

## Verification

- Unit tests preserve exact identifiers and the legacy acceptance of workflow
  labels.
- A table test covers every forbidden alias with mixed casing, range/wildcard
  forms, URL forms, and oversized input without input reflection.
- Regression tests cover all five typed GPU lifecycle kinds, nested shader,
  profile, interface, model, and evidence refs, all three post-storage ref
  factories, typed rollback targets, and model-resolution `ModelAssetRef`.
- Typecheck, lint, full test coverage, build, dependency audit, npm audit, and
  packed-tarball checks remain release gates.
