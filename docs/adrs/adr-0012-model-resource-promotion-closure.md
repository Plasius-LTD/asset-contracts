# ADR 0012: Model Resource Promotion Closure

- Status: Accepted
- Date: 2026-10-24
- Tracking: asset-contracts Task 51; site Feature 1153 / Epic 1147

## Context

Released resource and texture qualifiers verify complete inventories and bytes,
retain original resource identities and distinguish derived output. Conversion
qualification evaluates raw canonical diagnostics. Typed GPU promotion already
checks bytes, exact versions and GPU compatibility envelopes. ModelCandidate
and its confirmation already enforce rights, security, fidelity, render and
human gates. Published asset-pipeline owns orchestration. Missing composition
must not create an alternate approval route or duplicate those contracts.

## Decision

Add opt-in createModelResourcePromotionRecord. Supply a typed model promotion,
complete source inventory/bytes, existing output texture qualification inputs,
raw diagnostic input, exact resource-to-package/path bindings and the existing
candidate/confirmation. Reuse all existing factories and qualifiers. Snapshot
inert metadata and both byte sets before awaiting; retain only frozen metadata
in output, never bytes, Blobs or GPU objects. No dependency update is required.

Qualify both complete packages, exact immutable distinct source/output
identities, graph and candidate converter identity/version/source format, source
entrypoint digest and converted output digest. Require re-evaluated diagnostic
and loss arrays to equal candidate evidence. Bind every projected diagnostic
resource and candidate LOD/collision/fidelity resource to a qualified file's
path/hash/length/MIME; runtime resources use the output package and LOD0 names
its entrypoint. Existing catalog candidates also match target asset/version.
Explicit bindings avoid deriving trust from opaque URI strings.

Require a passed review without blocking findings; use the existing candidate
confirmation factory for rights/security/fidelity/render/human policy. Reuse
createGpuAssetPromotionRecord for the exact copied output bytes and typed GPU
envelope. Bind the HTTPS runtime URI suffix to assetId/version/entrypoint;
existing credential/query/fragment restrictions still apply. These are local
contract checks. Hosted services must authenticate approvers, verify signed
tokens and validate evidence issuers; this library grants no approval authority.

The separate package closureHash is SHA-256 over existing canonical GPU JSON
serialization of version, qualified source/output, evaluated diagnostics and
sorted resource bindings. It includes all file descriptors, original/derived
lineage and authored reload metadata. It excludes promotion events and
candidate/confirmation tokens so renewed approval does not change package
identity. Preserve existing leaf/assembly processing closureHash semantics.

Rollback requires locally qualified prior/current results through a private
WeakSet, then requalifies target bytes and all independent gates. Compare exact
prior package closure, manifest and runtime URI; enforce same asset/channel,
distinct current/target versions and rollbackOfVersion=current.version. Emit
both exact closure identities. No version, historical record or runtime pointer
is mutated. Forward calls reject rollback metadata. JSON clones are not local
qualification: reconstruct and requalify persisted inputs before use. The
WeakSet is process/module-instance evidence only, not a durable signature or
trusted history database. Hosted storage owns create-only immutable writes,
verified historical records, concurrency control and pointer-last transactions.

## NFRs, alternatives and limits

Fixed inert metadata/count/character/depth and byte ceilings, sequential package
qualification, native abort/default 10s deadline (1–60s), bounded underlying
hashing, no network/retries/logging. A digest cannot be preempted; phase checks
prevent late successful return. Normalize even hostile thrown proxies to fixed
value-free errors. Authored package metadata and candidate content remain
trusted data requiring privacy minimization; only diagnostic projections are
public-safe. No raw forensic diagnostics or provider strings are retained.

Tightening legacy factories would break staged construction. Copying pipeline
or candidate policy would drift from released owners. Accepting structural or
serialized history as qualified would lose the local byte-check evidence.
Persisting bytes in a mutable qualification registry would add memory and
lifecycle ownership; use bounded ephemeral copies and weak membership instead.

This boundary does not parse internal model references, prove embedding or
atlas algorithms, revalidate shader ABI policy (Task 23), supply animation
schemas (Task 12), verify external signatures, or perform storage/promotion.
Existing exact immutable assembly child refs stay in candidate evidence; their
separate catalog packages remain hosted resolver responsibilities.

Backend evaluator gpu.model.conversion.enabled controls adoption. Enabled
callers use the opt-in composition; disabled/rollback adoption uses legacy
factories. No flag service I/O/mutation or UI capability belongs in this library.
Requirements-first tests cover complete real glTF/GLB fixtures, byte drift,
evidence/resource/gate drift, exact rollback, deterministic hashes, immutable
snapshots and malformed/limit/cancel/deadline cases. Qualify packed and public
ESM/CJS/types/browser consumers and released asset-pipeline orchestration.
Release additive minor through existing source PR/exact-main push CI and
two-phase cd.yml/main/production hosted OIDC path, then verify registry
integrity/provenance before Done. No site deployment is authorized by Task 51.
