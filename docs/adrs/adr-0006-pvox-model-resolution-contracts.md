# ADR 0006: Additive PVOX Model-Resolution Contracts

## Status

- Accepted
- Date: 2026-08-20
- Version: 1.0

## Context

Plasius-LTD/plasius-ltd-site Feature #2012 and Story #2013 require the hosted
MCP service to acquire rights-cleared provider models, compile them to the
texture-free Plasius voxel representation, render native PVOX evidence, obtain
human confirmation, and atomically promote the immutable result. Asset-contracts
Task #25 owns the shared serialized vocabulary and trust-boundary validation.

The existing model-resolution family is already released. It describes the v1
static-world GLB processing path, embeds mesh and texture ceilings in
`ModelRequestSpec`, and is consumed by compatibility wrappers. Changing its
types, constants, factories, state union, or runtime behavior would break those
consumers. `ModelAssetRef`, however, is representation-neutral and remains the
correct immutable catalog identity.

PVOX introduces independently hashed pages, a sparse voxel hierarchy, localized
surface and physical fields, native-render evidence, placement edit journals,
and additional durable job states. An ingestion texture budget is meaningful
while decoding a provider source but must never become a model-owned runtime
texture limit.

## Decision

1. Add `pvox-model-resolution.ts` as a separate v2 family and re-export it from
   the package root. Leave all v1 source and behavior unchanged.
2. Preserve `ModelAssetRef`. Add a representation-discriminated
   `ModelProcessingManifestV2` whose only admitted representation is `pvox`.
3. Add `ModelRequestSpecV2`. Keep provider download, archive, file, and texture
   decode ceilings in `sourceIngestionLimits`; keep fidelity, geometry,
   capabilities, PVOX storage, hierarchy, spatial data, LOD, and residency
   ceilings in `pvoxRuntimeProfile`. Reject legacy triangle/texture fields at
   the v2 runtime boundary.
4. Fix the public PVOX envelope to version 1.0 (`major: 1`, `minor: 0`) for
   static/rigid content, with little-endian format policy owned
   by `@plasius/gpu-model-voxel`, `.pvox`,
   `application/vnd.plasius.pvox`, `PVOX` magic, 8-cubed bricks, 64-KiB pages,
   a 256-byte header, 128-byte directory entries, at most 64 sections, depth
   zero through eight, at most 2,624 pages, and at most 164 MiB. Every page is a
   complete uncompressed 64-KiB hash unit. Metadata/LOD-structure pages have no
   spatial scope; render/collision pages require LOD, partition, depth, and
   Morton scope. The contracts package validates metadata, layout summaries,
   hashes, bounds, scoped ordering, and cross-record binding; the voxel package
   remains responsible for validating binary bytes and codecs. Technical
   render-brick, logical-voxel, and encoded-sample counts are artifact-wide
   sums across all retained LODs, and section count exactly matches the closed
   static plus optional bond/collision registry.
5. Require authenticated, credential-free PVOX resources only beneath the
   exact resolution/candidate or immutable catalog/version MCP namespace. Do
   not serialize provider URLs, signed storage URLs, source files, texture
   resources, or credentials into PVOX runtime contracts.
6. Represent every runtime capability as independent versioned evidence bound
   to the PVOX binary closure. For the `world-editable-v1` request profile, require
   rendering, collision, destruction, thermal, moisture, and fluid-boundary
   capabilities. Enforce the complete governed property set for every localized
   region/material, confidence at least 0.80, signed review for inferred values,
   and no zero/default critical density, hardness, tensile/compressive/shear
   strength, fracture, interior, ignition, or melting evidence. Bind an
   independently attested complete region/palette inventory first, then require
   physical evidence in canonical region/property order so omitted regions and
   input-order-dependent digests fail closed. A supported destruction capability
   additionally requires non-empty reviewed mass, bond-graph, and interior-layer
   records.
7. Require fidelity evidence to derive a passing decision from its recorded
   geometry, silhouette, rendered, colour, and material thresholds. A supplied
   `passed` label cannot contradict those measurements.
8. Bind native PVOX render evidence to the processing manifest, PVOX root,
   directory and page set, exact ordered four-view hashes, renderer version, and
   an attestation. Require every non-overridable malware, source-format, PVOX,
   fidelity, physical-property, renderer, and accessibility gate to pass.
9. Keep binary, processing, assembly, render, evaluation, confirmation, edit,
   and publication closures distinct. A leaf assembly closure hashes an empty
   child list and never aliases the leaf binary closure. Bind compiler,
   manifest, confirmation, and promotion records to separate source,
   canonical-document, compilation-input, runtime-request-profile, artifact,
   root, directory, page-set, and closure digests. Publish exact domain
   separators, exact byte-order layouts, executable preimage encoders, and real
   SHA-256 golden vectors. The normalized 256-byte root header includes section
   count and one directory digest, requires zero reserved bytes, and never
   double-hashes a header field. Contract factories cross-bind typed
   attestations; authenticated hosts recompute digests and verify issuer tokens.
   Fixed encoders reject extra own keys, malformed fixed tuples, non-byte-array
   views, shared mutable byte storage, and inputs beyond governed work ceilings.
10. Bind confirmation tokens and receipts to the exact v2 request and semantic
   assessment, candidate identity, complete provenance and normalized rights
   decision, PVOX binary/processing/assembly/evaluation closure hashes, ordered
   view hashes, hard gates, fidelity, capability/physical-property, and complete
   native renderer/settings/qualification evidence.
   Allow an explicit override only for low semantic assurance; do not permit any
   technical or governance gate to be overridden.
11. Return blocked but valid evidence as a diagnostic candidate with stable
   reason codes and no confirmation credential. Completed staged candidates
   require a pointer-last promotion receipt covering credits, catalog row,
   index snapshot, processing/assembly closures, confirmation and its exact
   binding hash, and final ref.
12. Validate placement edits as authenticated copy-on-write CAS operations.
   Genesis binds the base artifact, page set, and root. A standalone later edit
   requires complete authenticated current revision/root/journal/page state;
   chain validation derives it after each edit, rejects replay and stale pages,
   and forbids empty/no-op insert, remove, or replace transitions.
13. Extend only the v2 lifecycle with `downloading`, `importing`, `voxelizing`,
    `evaluating-fidelity`, and `awaiting-material-review`. Export a total,
    deterministic mapping to v1 states for compatibility wrappers rather than
    widening the v1 union.
14. Validate unknown input through data-only, dense-array, closed-key factories
    that reconstruct and deeply freeze output. Export 14 stable-id, strict,
    self-contained JSON Schema 2020-12 descriptors from a separate schema
    module for MCP construction, while retaining factories as the authoritative
    relational validation boundary. Schema conditionals mirror durable-state
    confirmation, promotion, final-reference, refinement, and reason-code rules;
    confirmation timestamps cannot exceed the enclosing snapshot timestamp.

## Consequences

### Positive

- Existing v1 consumers remain source- and behavior-compatible.
- Hosted MCP, processing, rendering, catalog, and admin packages share one
  immutable PVOX evidence vocabulary.
- Source texture decoding is explicitly quarantined from the texture-free
  runtime representation.
- Candidate evidence cannot be transplanted across requests, sources, PVOX
  closures, rights decisions, views, or renderers.
- A low semantic match remains reviewable without weakening technical, rights,
  security, accessibility, or physical-property admission.

### Negative

- V2 orchestration must project request semantics into the released v1 match
  assessment while both families coexist.
- Strict closed contracts require a future contract version for new serialized
  physical fields, capability kinds, fidelity measurements, or binary envelope
  versions.
- The metadata contract cannot replace independent byte validation in
  `@plasius/gpu-model-voxel` or authenticated resource authorization in the MCP
  host.
- Schema test tooling uses narrow audited transitive dependency overrides;
  normal dependency maintenance must refresh those pins instead of weakening
  the audit gate when upstream ranges change.

## Alternatives Considered

- Replace the v1 model-resolution types: rejected because it would silently
  change released GLB behavior and exhaustive state handling.
- Reuse v1 `maxTextureBytes` for PVOX: rejected because it conflates sandboxed
  source decoding with texture-free runtime resources.
- Store PVOX as another GLB processing output: rejected because PVOX has a
  different binary, capability, fidelity, physical, mutation, and renderer
  evidence model.
- Permit semantic override of failed PVOX gates: rejected because confidence in
  naming does not mitigate licensing, malware, format, fidelity, physical, or
  renderer failure.

## Related Decisions and Work

- Plasius-LTD/plasius-ltd-site Epic #902
- Plasius-LTD/plasius-ltd-site Feature #2012
- Plasius-LTD/plasius-ltd-site Story #2013
- Plasius-LTD/asset-contracts Task #25
- [ADR 0002: Versioned Model Resolution Contracts](./adr-0002-model-resolution-contracts.md)
- [TDR 0003: PVOX Validation and Confirmation Binding](../tdrs/tdr-0003-pvox-validation-and-confirmation-binding.md)
