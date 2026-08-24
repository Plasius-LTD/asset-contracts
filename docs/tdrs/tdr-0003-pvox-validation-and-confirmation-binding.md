# TDR 0003: PVOX Validation and Confirmation Binding

## Status

- Accepted
- Date: 2026-08-20
- Version: 1.0

## Direction

`src/pvox-model-resolution.ts` owns the additive serialized PVOX boundary. Its
factories accept `unknown`, require plain objects with exact key sets, normalize
through allow-listed reconstruction, validate cross-record invariants, and
deeply freeze the result. Callers must not cast provider, database, queue, MCP,
or decoded JSON payloads directly to exported interfaces.

The module validates evidence describing a byte-verified PVOX artifact. It does
not decode the PVOX binary. `@plasius/gpu-model-voxel` must independently parse
and validate the complete byte stream, fixed records, section table, codecs,
Morton order, page hashes, sizes, bounds, and trailing-byte absence before
issuing compiler/validator evidence accepted by this contract family.

## Request Routing

`createModelRequestSpecV2` separates two budget domains:

| Domain | Contract | Meaning |
| --- | --- | --- |
| Quarantined source | `ModelSourceIngestionLimitsV2` | Provider download, bounded expansion, entry/file counts, decoded texture bytes and decode dimensions |
| Immutable runtime | `PvoxRuntimeRequestProfileV1` | Fidelity and capability profiles, geometry mode, artifact/pages/hierarchy/bricks/logical voxels/encoded surface records/partitions/LODs and CPU/GPU residency |

PVOX runtime limits contain no triangle or texture field. Every request includes
`rendering`; named `world-editable-v1` and `deformable-v1` profiles require their
complete governed capability subsets. Public values may tighten the exported
ceilings but cannot raise them.

V2 matching can reuse the released `ModelMatchAssessment` while the families
coexist, but a durable v2 resolution verifies that every candidate's embedded
v1 assessment has the same normalized query and immutable request revision.

## Artifact and Processing Validation

Validation proceeds in this order:

1. Validate the authenticated MCP artifact URI, declared digest, whole-page byte
   length, fixed PVOX 1.0 `{major, minor}` constants, canonical coordinate
   system, floor-centred bounds, and absolute 1,048,576-metre coordinate cap.
2. Require a 256-byte header, 128-byte directory entries, at most 64 sections,
   8-cubed bricks, and uncompressed 64-KiB pages. Validate contiguous page
   indices/offsets and exact page coverage; partial final pages are invalid.
3. Discriminate pages as metadata, LOD structure, render field, or collision
   field. Metadata/LOD pages forbid spatial scope. Field pages require LOD,
   partition, hierarchy depth, and fixed-width Morton range; ranges are ordered
   and non-overlapping within `(kind, LOD, partition)`.
4. Validate one to four contiguous LODs beginning at LOD0. LOD page slices must
   reference render-field pages in the matching LOD scope.
5. Recompute technical dimensions from bounds and bind whole-page byte count,
   LOD, geometry mode, hierarchy, partition, logical-voxel, encoded-sample, and
   resident counts. Depth zero is a root brick. Maximum partition extent must
   fit `LOD0 cell × 8 × 2^depth`, permitting fidelity-driven small partitions.
6. Enforce 524,288 render bricks, 268,435,456 logical voxels, 8,388,608 encoded
   samples, 1,048,576 hierarchy nodes, 512 runs/local samples per brick, and a
   10,384-byte encoded brick payload. Fixed-record feasibility includes the
   hierarchy, brick descriptors, 128-byte render/collision masks, 16-byte
   render samples, 4-byte collision samples, palette/evidence/interior/mass/
   bond records, directory, and per-section alignment. These lower bounds must
   fit the artifact; no limit silently degrades fidelity. Render brick,
   logical-voxel, and sample totals cover all retained LODs, and section count
   exactly matches the closed static plus optional bond/collision registry.
7. Bind compiler source, canonical-document, compilation-input,
   runtime-request-profile, and output hashes through PVOX, processing, and
   confirmation records.
8. Require exactly one assessment per known capability, bind each to the PVOX
   binary closure, and require every requested capability to be supported.
9. Bind an attested authoritative region/palette inventory to PVOX validation,
   then bind physical evidence by `(regionId, materialId, property)` in region
   index and governed-property order. Every declared material region must be
   represented and satisfy every governed property for its supported
   capabilities at confidence 0.80 or higher; inferred values require signed
   review and critical density, hardness, tensile/compressive/shear strength,
   interior, fracture, ignition, and melting values cannot be zero or defaulted.
   Supported destruction also requires non-empty reviewed mass, bond-graph, and
   interior-layer records.
10. Derive fidelity outcome from governed profile formulas and the fixed
    silhouette, contour, SSIM, colour, and material thresholds. Maximum surface
    error is bounded by both three times the p99 ceiling and 1.5 LOD0 cells.
11. Validate a canonical, acyclic single-root assembly graph and bind every
    catalog/staged child to a PVOX binary closure and immutable manifest identity.
    Leaves also receive a distinct, attested assembly-domain digest over their
    own binary closure and an empty child list.

The compiler evidence and processing manifest cannot prove the PVOX bytes by
themselves. Their issuer must be an allow-listed, attested worker in the hosted
pipeline, and the resource loader must revalidate artifact bytes and hashes.
The synchronous factory does not authenticate issuer tokens. Hosted workers and
resource loaders must use the exported executable preimage encoders to
recompute applicable digests and verify each typed attestation against its
allow-listed issuer. Producer-asserted hashes without successful attestation
verification are not admission evidence.

Hash-domain constants, `PVOX_HASH_PREIMAGE_LAYOUTS`, and executable byte
encoders define the PVOX 1.0 preimages. Integers use the specified little-endian
width, variable UTF-8/JSON inputs are length-prefixed, and digests are raw 32
bytes. The root preimage includes one exact normalized 256-byte header: section
count is stored in the header, directory hash appears once at bytes 176–207,
and reserved bytes 208–255 must be zero. Binary closure includes source,
canonical document, compilation input, runtime request profile, artifact, root,
directory, and page-set hashes. Processing, empty-or-populated assembly, render,
evaluation, confirmation, edit, and publication domains are separate. Fields
holding their own digest/attestation/token are explicitly omitted from the
corresponding canonical preimage to prevent self-reference.
Fixed-layout preimage functions admit exact known own keys only, require exact
six-component bounds and intrinsic non-shared `Uint8Array` byte inputs, and cap
section, assembly, canonical-text, data-tree, and complete preimage work at
governed limits.

## Candidate and Confirmation Binding

A v2 candidate is confirmable only when all of the following are true:

- match assurance is `high` or `low` and its independent hard constraints pass;
- rights status is `allowed` and rights/provenance/source hashes agree;
- the staged or existing asset identity, kind, and content hash agree with the
  PVOX processing manifest;
- exactly four original views are ordered front, left, top, isometric and their
  hashes agree with native PVOX render evidence;
- typed render evidence binds its id, native PVOX LOD0 backend, processing
  manifest and closure, PVOX content/root/directory/page set, renderer and
  settings identity/version, renderer/camera qualification, timestamp, ordered
  view hashes, evidence hash, and domain-separated attestation;
- malware, source-format, PVOX, fidelity, physical-property, renderer, and
  accessibility gates each appear exactly once, pass, and bind the artifact;
- a candidate-level evaluation closure binds fidelity, physical, capability,
  and render evidence;
- the backend-issued confirmation subject matches the complete semantic
  assessment, provenance, normalized rights decision/token/policy/licence/
  attribution, immutable request and candidate, binary/processing/assembly/
  evaluation closures, hard gates, views, and full renderer evidence.

Evidence-valid but blocked candidates normalize to the diagnostic union member,
carry stable blocking reason codes, and omit the confirmation binding/token.

`createModelCandidateConfirmationV2` accepts `semanticRiskAccepted: true` only
for a low-assurance candidate and requires it there. The field cannot bypass or
alter any other decision because candidate construction has already required
every hard gate and evidence relationship to pass. Confirmation time must not
precede the latest evidence it approves.

## Durable State Compatibility

`MODEL_RESOLUTION_V2_STATES` is the authoritative v2 persistence vocabulary.
`MODEL_RESOLUTION_V2_COMPATIBILITY_STATES` is total and deterministic. New
acquisition/compilation states project as follows:

| V2 state | V1 projection |
| --- | --- |
| `downloading` | `searching-providers` |
| `importing` | `processing` |
| `voxelizing` | `processing` |
| `evaluating-fidelity` | `evaluating` |
| `awaiting-material-review` | `evaluating` |

All other states map to the same v1 spelling. Compatibility wrappers may expose
the projection, but persistent v2 records retain the full state. Completed
records require confirmation and a final immutable `ModelAssetRef`; unresolved,
failed, and cancelled records require a bounded stable reason code. Completed
staged candidates also require a pointer-last promotion receipt binding the
proposal, confirmation and its binding hash, processing/assembly closures,
credits, catalog row, index snapshot, pointer ETags, and final asset reference.
Any resolution that carries confirmation must have an `updatedAt` timestamp no
earlier than `confirmedAt`; strict schemas mirror the same state-dependent
confirmation, promotion, final-reference, refinement, and terminal-reason rules.

Placement edit journals use copy-on-write compare-and-swap. Genesis must start
at revision zero, the canonical previous-journal hash, the authenticated base
root, and the base page inventory. A standalone non-genesis entry is accepted
only with authenticated current placement state covering revision, root,
previous journal, and every current page hash. Chain validation derives this
state after each operation, rejects replayed operation ids and stale pages, and
requires chronological sequential revisions. Insert/remove/replace semantics
forbid empty or unchanged endpoints.

## Verification

- TDD records the missing-export failure before implementation.
- Boundary tests cover closed keys, immutable output, fixed format and limit
  invariants, authenticated resources, page ordering/coverage, dimensions,
  capability completeness, physical review, fidelity derivation, edit-journal
  sequence, hard-gate completeness, cross-record hash binding, semantic
  override rules, lifecycle projection, and terminal-state requirements.
- Executable preimage tests use real SHA-256 golden vectors, exact root-header
  bytes, mutation sensitivity, and zero-reserved-byte enforcement rather than
  shape-only repeated-character digest fixtures.
- Fourteen standalone JSON Schema 2020-12 roots live in
  `pvox-model-resolution-schema.ts`; each has a stable contract-versioned `$id`,
  a self-contained closed `$defs` graph, strict Ajv 2020 compilation, and
  factory-output/invalid-sample parity coverage. Factories remain authoritative
  for hash preimages, ordering, formulas, chronology, and cross-record identity.
- The complete existing v1 suite remains green and `src/model-resolution.ts`
  remains unchanged.
- Build, typecheck, lint, npm audit, dependency audit, coverage, changed-source
  LCOV inclusion, and packed-tarball ESM/CJS consumption remain delivery gates.

## Related Decisions

- [ADR 0006: Additive PVOX Model-Resolution Contracts](../adrs/adr-0006-pvox-model-resolution-contracts.md)
- [ADR 0002: Versioned Model Resolution Contracts](../adrs/adr-0002-model-resolution-contracts.md)
- Plasius-LTD/asset-contracts Task #25
