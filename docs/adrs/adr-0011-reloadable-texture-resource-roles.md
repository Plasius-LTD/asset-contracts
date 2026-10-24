# ADR 0011: Reloadable Texture and Resource Roles

- Status: Accepted
- Date: 2026-10-24
- Tracking: asset-contracts Task 50; site Feature 1153 / Epic 1147

## Context

Released AssetFileRole already defines model, binary, texture and metadata.
Task 48 qualifies exact file inventory/bytes, and model-core 0.7.0 owns verified
resources, material-to-texture references and authored interpretation metadata.
Neither boundary maps the canonical inventory to storage roles or records
separate GPU upload/atlas exports while retaining original resource identities.
Legacy descriptor construction must remain compatible.

## Decision

Add opt-in async qualifyModelTextureResources. Compose the existing
qualifyModelResourceManifest and accept only a privately branded model-core
GpuModelResourceGraph. Reuse canonical materials/textures, including samplers,
color spaces, usages, transforms, embedding policy and authored sourceMetadata.
Never reimplement the canonical schemas or parse a model format here.

Use the matching module-format core guard through a normal named import. A
new graph is already immutable/verified. Dynamically importing ESM from the
CJS build would select a different private WeakSet and reject legitimate CJS
require-created graphs. This correctness requirement makes lazy loading this
guard inappropriate. Core remains external; bundlers can remove unused exports
with sideEffects=false. Existing diagnostic evaluation retains its dynamic
import. Consumers must produce graphs using the same installed core instance
and module format as this package (ESM import with ESM, require with CJS).

Map canonical mesh entries to model/binary, material/animation to JSON metadata,
texture to supported image texture, and auxiliary to binary or JSON metadata.
Existing role values are unchanged. Explicit source bindings match every graph
resource exactly once. External files match graph path/hash/length/MIME;
embedded resources retain independent identity and name their owning model
entrypoint. Do not invent separate embedded archive entries or replace source
hashes with entrypoint hashes. Preserve original conversion provenance.

A derived record has gpu-upload or texture-atlas semantics, a distinct exported
file path and unique original sourceResourceIds. Uploads use auxiliary/binary
buffer files; atlases use texture/image files and image sources. Reject missing
sources, output collisions, source overwrite, unknown roles and incompatible
MIME declarations. Output is frozen deterministic version-1 JSON with no Blob
or renderer allocation. Canonical material/texture arrays retain their order.

## Limits and trust

Snapshot caller metadata and exact bytes before awaiting. Reuse Task 48 path,
collision, byte/hash and inventory gates. Apply fixed resource/derived/graph,
metadata value/character/depth and deadline limits. Honor native cancellation;
use no I/O, retries, mutable registry, arbitrary callbacks or logging. Hashing
cannot be interrupted inside Web Crypto; checks prevent successful late return.
Errors expose fixed codes only. Synchronous bounded work is checked before and
after; it cannot be preempted by a JavaScript timer.

Authored sourceMetadata, material names/extensions and original texture paths
are deliberately preserved trusted package content. The output is NOT a
public-safe diagnostics response. Adapters must minimize/sanitize authored
metadata before public distribution; use Task 49's separate diagnostic
projection for public technical messages. Core-brand validation cannot be
replaced by shape checks or serialization; reloaded canonical payloads must be
verified again by core before a new graph is created.

Embedded ownership, internal model references and derivation algorithms remain
trusted adapter assertions. Exact byte qualification does not prove semantic
format validity, inspect derived image signatures, verify a GPU upload layout,
attest an atlas algorithm, or authorize promotion. Tasks 12/23/51 retain
animation metadata, shader ABI and promotion closure. No existing approval gate
changes. No dependency/version/peer/override changes are required.

## Alternatives, rollout and delivery

Adding storage role enums would duplicate existing roles and break closed
consumers. Tightening legacy factories would break staged construction.
Flattening derived output over authored textures would lose reload fidelity.
Copying core schemas or accepting a structural graph would discard verification.

The backend evaluator for gpu.model.conversion.enabled controls consumer
adoption. Enabled callers opt into this qualifier; disabled/rollback callers
retain existing factories. The library performs no flag lookup/mutation. No UI
or entitlement capability applies. Test both branches and rollback.

Require requirements-first round-trip/contract tests, malformed input/role/MIME
and missing/duplicate identity cases, deterministic/frozen output, cancellation,
deadline and bounded metadata tests. Run Node 24 frozen install, full tests and
privacy, coverage >=80% and changed-source LCOV, lint/types/build, audits/tree,
privacy/pack and packed/public ESM/CJS/types/browser consumers. Release additive
minor through source PR, exact-main push CI and existing two-phase
cd.yml/main/production hosted OIDC governance (ADR 0007), then verify registry
integrity/provenance. Site adoption/deployment remains separate.
