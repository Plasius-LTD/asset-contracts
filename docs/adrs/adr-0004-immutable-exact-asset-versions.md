# ADR 0004: Immutable Exact Asset Versions

## Status

- Accepted
- Date: 2026-07-13
- Version: 1.0

## Context

The original `assertAssetVersion` contract validates only a bounded token. That
behavior is still useful for legacy workflow records, but it also accepts labels
such as `latest`. Reusing it for an immutable shader, profile, interface, model,
or rollback reference lets a mutable catalog pointer masquerade as an exact
version and breaks reproducibility, digest binding, cache identity, and safe
rollback.

GPU contracts carry versions at more than the top-level lifecycle envelope.
Interface refs, compatible-model projections, profile role bindings, default
profile refs, qualification matrix refs, and model-resolution `ModelAssetRef`
values must all make the same decision. Implementing local alias lists in each
factory would create inconsistent admission and runtime behavior.

## Decision

1. Add one browser-safe `assertImmutableAssetVersion` implementation in the
   asset-contracts package and export it from the package root.
2. Preserve `assertAssetVersion` without behavioral change for legacy workflow
   contracts where mutable labels can be intentional.
3. Apply the exact validator to every typed GPU asset lifecycle version and
   recursively to exact interface, shader, profile, model, matrix-policy, and
   typed rollback versions. Apply it to model-resolution `ModelAssetRef` while
   leaving tool, policy, converter, and workflow versions on their existing
   validator.
4. Reject the case-insensitive aliases `latest`, `current`, `stable`, `preview`,
   `default`, `production`, `canary`, `next`, `head`, and `main`.
5. Retain the existing exact token grammar and identifiers such as `1`, `v1`,
   calendar versions, and build suffixes. Reject SemVer-style `x` segments,
   range/wildcard operators, whitespace, scheme-bearing URLs, and other values
   outside that grammar.
6. Emit one constant bounded error without interpolating the rejected value.
   This prevents attacker-controlled version text from reaching logs and gives
   storage, pipeline, and runtime callers a stable fail-closed diagnostic.
7. Keep enforcement unconditional inside the contract. The inherited
   `asset.pipeline.shader-store.enabled` feature flag controls host entry into
   the shader lifecycle; it is not a validation bypass.

## Consequences

### Positive

- Storage admission and runtime resolve the same exact identities.
- Style switches and rollback records cannot silently follow a moving alias.
- Existing exact identifiers remain valid, including non-SemVer catalog
  versions already used by model assets.
- Legacy callers retain their existing generic workflow-label behavior.
- Bounded diagnostics do not disclose or amplify untrusted input.

### Negative

- Callers that previously placed a mutable alias in an immutable GPU manifest
  must resolve the catalog pointer before constructing the contract.
- New exact-reference fields must be routed through the shared validator as
  part of contract review.

## Alternatives Considered

- Harden `assertAssetVersion` globally: rejected because legacy jobs and other
  workflow records intentionally retain the broader token vocabulary.
- Require semantic versions: rejected because existing exact versions include
  `1`, `v1`, calendar versions, and other reproducible non-SemVer identifiers.
- Validate only top-level asset versions: rejected because nested refs could
  still carry moving aliases.
- Resolve aliases inside the contracts package: rejected because catalog
  resolution is an I/O and authorization concern, not a pure contract concern.

## Related Decisions and Work

- Plasius-LTD/plasius-ltd-site Epic #902
- Plasius-LTD/plasius-ltd-site Feature #1026
- Plasius-LTD/plasius-ltd-site Story #1027
- Plasius-LTD/asset-contracts Task #18
- [ADR 0003: WGSL Shader Asset Contracts](./adr-0003-wgsl-shader-asset-contracts.md)
- [TDR 0002: Exact-Version Validation Routing](../tdrs/tdr-0002-exact-version-validation-routing.md)
