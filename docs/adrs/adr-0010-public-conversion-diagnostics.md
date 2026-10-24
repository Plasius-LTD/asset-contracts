# ADR 0010: Public Conversion Diagnostics

- Status: Accepted
- Date: 2026-10-24
- Tracking: asset-contracts Task49; site Feature1153 / Epic1147

## Context and decision

Existing ModelConverterDiagnostic/ModelConversionLoss and signed processing,
fidelity, rights, human review and promotion contracts already cover their
boundaries. Model-core0.7.0 owns canonical strict/tolerant/forensic policy,
applied repairs, unsupported data and loss consent. Its private diagnostics may
contain original values, rawSource, private paths and free-form adapter text.
They cannot be forwarded as public contract evidence.

Add qualifyModelConversionDiagnostics as an opt-in async boundary. Lazy import
the existing exact published core dependency and reuse its evaluator; do not
implement another acceptance policy or format parser. Inert bounded snapshots
precede the first await. Project fixed category codes/messages, exact public
resource bindings and existing ModelProvenance. Root diagnostics use source
identity; unmatched non-root paths and contradictory URI identities reject.
Only recognized completed repairs expose core-owned rule IDs. Discard adapter
codes/text/private paths, original values and forensic snapshots. Unknown
adapter codes become fixed category codes; unknown repair rules still block.

Explicit failure takes precedence, then unsupported, then canonical rejection,
then warning/clean success. Denied loss remains blocking in the legacy converter
loss array. Detailed output and existing-shape converter arrays are frozen.
Technical acceptance is not approval. No existing gate or factory is weakened.

## Alternatives, costs and limits

Regex redaction cannot reliably scrub arbitrary provider text. Tightening
legacy factories would break staged consumers. Copying the canonical evaluator
would create policy drift. Requiring eager core loading would add avoidable
first-load work. Lazy import is asynchronous and may load a bundler chunk; module
loading cannot be cancelled, but the wait is bounded. Bounded synchronous work
checks deadlines before/after and cannot be preempted. Resource/provenance
binding is a trusted-caller assertion; byte evidence and promotion remain
separate. No dependency versions change. Tasks12/23/50/51 retain animation,
shader ABI, role and promotion-closure scope respectively.

## Rollout, NFR and release

Backend evaluator gpu.model.conversion.enabled controls consumer adoption;
disabled/rollback callers retain legacy contracts. No service lookup or flag
mutation in this library, no UI entitlement capability. Test both branches and
rollback, malformed metadata, stable codes/serialization, privacy canaries,
resource identity, mutation, limits, deadline/cancellation and real processing
manifest composition. Existing independent gate tests remain active.

Security/privacy use allowlisted output and value-free errors. Fixed work and
input budgets, no retries/I/O/global state address reliability/performance and
scalability; immutable typed JSON and reused factories address maintenance and
testability. Fixed codes support safe observability without logging. UI/SEO and
durable storage controls are N/A. Require Node24 frozen install, full tests and
changed-source LCOV>=80%, types/lint/build, full/runtime audits, tree/privacy/pack
and packed/public ESM/CJS/types/browser consumers. Update README/Unreleased/TDR.
Release additive minor through PR, exact-main push CI, existing hosted
cd.yml/main/production OIDC, registry bytes/provenance and consumer checks.
No site deployment is authorized or required by this package-only Task.
