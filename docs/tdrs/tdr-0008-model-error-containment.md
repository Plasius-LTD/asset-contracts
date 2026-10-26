# TDR 0008: Model Error Containment

- Status: Accepted
- Date: 2026-10-26
- Decision: ADR0013
- Tracking: asset-contracts48/49/50 / site Feature1153

Each module's failure factory records its newly constructed public error and
finite category in a private WeakMap. fail(), abort and deadline callbacks all
use that factory. catch normalizes to a fresh public error using only the stored
category, defaulting to invalid-input. A captured error mutated by the caller
retains its original stored category; forged instances/subclasses/proxies never
become trusted solely by their prototype or code property. Manifest's internal
classifier supports texture's existing package-mismatch/category mapping and
is not re-exported by the public root. Public constructors and code unions stay
unchanged. No getter or prototype operation occurs during classification.

Regression cases must fail on original main and pass on the correction through
source and both public module entries. Check no retained caller identity,
message, cause or extra field; nested/revoked proxies, public errors/subclasses,
throwing code accessors and primitive/null/function throws. Keep actual success,
limits, pre/in-flight abort, deadline, cleanup and rollout composition tests.
Document full checks and exact-source CI/approved hosted OIDC patch publication
with registry provenance and installed consumer verification on all three Tasks.
No dependency update, flag mutation, new package or downstream site release.
