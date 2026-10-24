# TDR 0005: Public Conversion Diagnostics

- Status: Accepted
- Date: 2026-10-24
- Tracking: asset-contracts Task49 / site Feature1153
- Decision: ADR0010

## Input and evaluation

Accept outcome completed/unsupported/failed, existing public source provenance,
canonical GpuModelDiagnosticInput and exact private path/public resource bindings.
Snapshot inert JSON (no getters, symbols, sparse arrays, exotic prototypes or
cycles) with depth12/16,384values/2,048-characterstrings/262,144aggregatecharacters;
records/arrays have hard1024member limits. Limit issues/resources to100. Reserve
one issue slot for non-completed outcomes. Reject duplicate paths and conflicting
resource declarations for a URI. Every non-root diagnostic needs a binding;
root uses source. Reuse existing provenance/resource factories and fixed errors.

After snapshot, lazy-import published exact model-core0.7.0 and evaluate canonical
policy. Do not trust a caller-supplied accepted flag or re-evaluate repairs here.
Project core categories into fixed public codes/text; only accepted repairs expose
core rule IDs. Drop arbitrary source code/message/path, originalValue/rawSource.
Explicit failed outcome wins, then unsupported kind/outcome, rejected policy,
warning/clean success. Canonical consent controls loss severity; denied losses
remain blocking for existing fidelity derivation. Return frozen version1 JSON
with technicalAccepted, source, standard/mode, detailed diagnostics and exact
legacy converter diagnostic/loss arrays. No approval/receipt is synthesized.

Native AbortSignal and deadline1–60,000ms(default10,000) cover the operation.
Race lazy import against bounded timer/abort; clean timer/listener in finally.
Check deadlines around bounded synchronous snapshot/evaluation; neither loader
nor synchronous JS can be cancelled mid-execution. No network/filesystem/logging,
retry or callback dependency is added. Input references are caller assertions,
not byte verification; Task48/51 retain manifest/promotion responsibilities.

## Requirements-based validation and delivery

Tests first cover status precedence, strict/tolerant/applied and unknown repairs,
allowed/denied dropped+approximated loss, fixed messages/codes, forensic redaction,
source/resource binding, JSON serialization and mutation isolation. Test invalid
codes/kinds/shapes, accessors/prototypes/symbols/sparse/cyclic inputs, limits and
options, cancellation/deadline and legacy array ceilings. Compose actual
ModelProcessingManifest evidence and verify independent fidelity/hard/rights
gates still reject missing or contradictory evidence. Preserve existing tests.

Backend gpu.model.conversion.enabled adoption enabled/disabled/rollback branches
are tested without live changes; no capability. No dependency versions change.
Run Node24 frozen full gates, >=80%changed-source LCOV, pack/consumer/audit,
then PR CI, merge, exact-main CI and approved hosted cd.yml/main/production OIDC.
Verify registry immutable bytes/provenance/signatures and actual public consumers
before Done. README/Unreleased and ADR/TDR indices ship with additive minor.
