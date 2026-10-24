# TDR 0006: Reloadable Texture and Resource Qualification

- Status: Accepted
- Date: 2026-10-24
- Tracking: asset-contracts Task 50; site Feature 1153
- Decision: ADR 0011

## Sequence and role policy

1. Read inert root/options records without executing getters. Verify the graph
   with the matching ESM/CJS core instance's private brand, not a shape cast.
2. Snapshot inventory, resource bindings and derived records with shared fixed
   budgets before awaiting. Reject unknown fields, accessors, symbols, prototype
   keys, sparse/exotic arrays, non-finite values and malformed IDs.
3. Invoke existing qualifyModelResourceManifest, which synchronously snapshots
   manifest metadata and all bounded exact byte payloads before its first hash.
   Race the operation against native cancellation/deadline and clean listeners.
4. Map every inventory entry to an existing storage role and MIME policy:

| Canonical role | Storage role | MIME policy |
| --- | --- | --- |
| mesh | model | model/*, application/json, application/octet-stream, text/plain |
| mesh | binary | application/octet-stream, application/vnd.plasius.gpu-buffer |
| material or animation | metadata | application/json |
| texture | texture | image/png, image/jpeg, image/webp, image/ktx2 |
| auxiliary | binary or metadata | buffer MIME for binary; application/json for metadata |

5. Require exactly one binding per graph resource. For external resources,
   compare exact graph path, verified content hash/length/MIME and appropriate
   image/buffer role. Embedded resources bind only the model entrypoint and
   retain their independent hash/length/MIME rather than the container's hash.
6. Validate each derived output's distinct existing file and original source
   IDs. gpu-upload requires auxiliary/binary with buffer MIME. texture-atlas
   requires texture with image MIME and image sources. Never overwrite a bound
   source file or reassign a source identity to derived bytes. Multiple authored
   texture interpretations may share one original image resource.
7. Bound canonical authored material/texture/provenance metadata, retain its
   already immutable values and emit JSON without Blob payloads. Sort resource
   bindings by resourceId, derivatives by path and source-ID sets by UTF-16
   code units. Preserve canonical array order and original provenance.

This is declarative role qualification, not a parser, MIME sniffer, GPU-layout
validator or promotion attestation. Derived records are optional (empty array);
caller-declared derivation/embedding is not cryptographic algorithm evidence.

## Fixed limits and errors

Resource bindings: 16,384; derived records: 4,096; core graph nodes: 65,536.
Shared metadata budgets: 262,144 values, 2,097,152 UTF-16 characters, depth 16,
2,048 characters/string and 128/key; arrays at most 16,384. IDs use 128-character
canonical tokens. The existing byte qualifier also applies its own limits:
16,384 files, 64 MiB/file, 128 MiB total and portable-path rules. Default deadline
10 seconds, configurable integer 1–60,000 ms. Cancellation/timer cover the
async boundary and checks surround bounded synchronous phases. Web Crypto work
cannot be interrupted but never yields a successful result after cancellation
or expiry. Work is sequential and introduces no retry or storage/network I/O.

ModelTextureResourceError exposes invalid-input, limit-exceeded,
unverified-graph, package-mismatch, resource-mismatch, role-mismatch, aborted or
deadline-exceeded. Upstream errors are normalized without caller values.

## Verification, rollout and limitations

Synthetic fixtures independently verify core image/buffer bytes; canonical
material references require a real UV accessor. Compare external hashes and
reloaded material JSON with core metadata; serialize and reconstruct canonical
materials/textures, then verify core accepts the reloaded document. An embedded
image fixture uses an actual data URI without a fictitious exported source
image. Derivative hashes differ from the source identity. Test duplicate/missing
resources, role/MIME drift, unknown roles, graph clone rejection, multiple
interpretations, getters/proxies, mutation isolation, limits, deadline/abort and
legacy enabled/disabled/rollback composition. Qualify both typed model and
legacy envelopes; do not modify shader ABI or animation schemas.

Trusted authored sourceMetadata is intentionally preserved; callers own privacy
minimization before distribution. Public diagnostics use the separate Task 49
projection. UI accessibility/SEO/browser UI and durable storage controls are N/A
here. Security/privacy: value-free failures, bounded inert input and exact bytes.
Performance/reliability: fixed budgets, sequential hashing, no GPU allocation,
I/O or retry. Maintainability/testability: existing schemas/qualifier reuse and
immutable deterministic JSON. Compatibility: additive API, unchanged legacy
factories, dependency versions and existing approval gates.

The source-of-truth backend evaluator gpu.model.conversion.enabled controls
adoption. Disable/rollback retains legacy factories; no service call or mutation
inside this package and capability N/A. Normal module-format core guard import
preserves private brand identity across ESM/CJS. Verify packed/public ESM/CJS
consumers with their matching core entry and browser bundling/execution. Release
through existing PR/exact-main CI/cd.yml/production hosted OIDC route, verify
public registry integrity/provenance and dependency signatures. No site release
or backend secretref mutation is authorized by this Task.
