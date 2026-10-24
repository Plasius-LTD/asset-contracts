# TDR 0007: Model Resource Promotion Qualification

- Status: Accepted
- Date: 2026-10-24
- Tracking: asset-contracts Task 51; site Feature 1153
- Decision: ADR 0012

1. Read inert root/options records; reject getters, symbols, exotic/sparse
   arrays, prototype keys and unknown fields. Snapshot all metadata, validate
   existing candidate and confirmation, and copy both bounded byte inventories
   before awaiting. Keep the original privately verified core graph.
2. Qualify source inventory/bytes, then output graph/resources/derived metadata,
   then re-evaluate raw canonical diagnostics with the released evaluator.
3. Match immutable distinct asset/version identities; typed output manifest and
   promotion manifest are equal with files sorted by path. Match graph and
   candidate converter ID/version/source format, exact source and output hashes,
   source provenance and diagnostics/losses. A warning is allowed only when the
   candidate carries the same freshly evaluated warning; unsupported/failed or
   unconsented loss never grants promotion.
4. Validate unique explicit URI bindings to source/output file descriptors.
   Compare every runtime LOD/collision/fidelity resource and projected diagnostic
   resource exactly. LOD0 must bind the output entrypoint. Core still owns
   embedded resources and original/derived graph relationships; no parser here.
5. Require review passed with no blocking findings, existing candidate gates
   and exact confirmation. Check typed GPU manifest equality, ABI envelopes and
   canonical JSON file bytes through createGpuAssetPromotionRecord. Runtime URI
   must end in /assetId/version/entrypoint and satisfy existing immutable HTTPS
   policy. Hosted verifiers still authenticate signatures and approvers.
6. SHA-256 canonicalize version/source/output/diagnostics/sorted bindings. Leave
   events, candidate and confirmation out of package identity, allowing fresh
   approval for the exact prior package. Retain candidate/confirmation alongside
   the closure for callers' independent evidence checks.
7. For rolled-back outcome require private local membership for both prior and
   current; exact prior closure/manifest/runtime URI, same asset/channel, target
   prior version and rollbackOfVersion=current version. Emit from/to exact
   closure identities and never mutate history. Forward calls reject history.
   Persisted JSON must be reconstructed and qualified again; storage owns
   authenticated historical admission, immutable create-only writes and CAS.

Limits: 1,024 public resource bindings; 262,144 metadata values; 2,097,152 UTF-16
characters; depth 24; 2,048 characters/string and 128/key. Existing byte ceilings
apply independently to source and output (16,384 files, 64 MiB/file,128 MiB per
package). Copies are bounded and ephemeral; upstream qualifiers also copy
payloads. No retained byte cache or mutable durable registry. Package phases
are sequential; the final existing typed factory retains its bounded file-set
hashing behavior. Default deadline 10s, configured integer1–60,000ms; cancellation
and timer race cover async work, phase checks cover bounded synchronous work.
No retry/I/O or logging. Value-free errors normalize hostile upstream proxies.

NFR evidence: requirements-based real GLB header/JSON and source fixtures,
exact hashes/bytes, positive warnings, stale diagnostics, missing/tampered
resources, alias/identity/URI drift, review/rights/security/GPU/human gates,
brand and rollback mismatch, fresh confirmation, deterministic inventory order,
copy/freeze isolation, malformed/limits/deadlines/cancel and flag adoption tests.
Run full Node24 frozen tests/privacy/coverage>=80% with all changed sources in
LCOV, types/lint/build/tree/full/runtime audits/privacy/pack/drypublish. Isolated
packed/public ESM/CJS/types/browser consumers use released asset-pipeline to
verify state transitions still require review and approval. Accessibility/SEO
N/A library; trusted metadata requires caller minimization; observability uses
stable codes without logging. Existing package boundaries/API remain stable.
Remote flag gpu.model.conversion.enabled uses backend evaluator; capability N/A.
Release via approved cd.yml/main/production/OIDC with exact CI and public
registry/provenance/consumer verification. No site/backend secretref change.
