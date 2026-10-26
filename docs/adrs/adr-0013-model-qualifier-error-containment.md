# ADR 0013: Model Qualifier Error Containment

- Status: Accepted
- Date: 2026-10-26
- Tracking: asset-contracts Tasks48/49/50; site Feature1153 / Epic1147
- Refines: ADR0009, ADR0010 and ADR0011

## Problem and decision

The three qualifiers promised value-free errors but used instanceof on caught
values and rethrew public error instances. Nested or revoked proxies can throw
while instanceof runs; forged/subclassed errors can retain caller text/cause.
The tracked audit concerns hostile in-process objects, with no demonstrated
production disclosure or remote exploit.

Keep each existing public error constructor and finite code union. Privately
record errors created by internal failure/timer/abort paths in module-local
WeakMaps, storing the category separately from mutable public properties.
At every rejection boundary perform only typeof/null and weak identity lookup;
never inspect a caught object's prototype, accessors, code, message or cause.
Construct a fresh error with fixed text, even for an internally created error.
Texture qualification maps only privately recognized manifest errors; preserve
abort/deadline/limit, map other manifest errors to package-mismatch. Caller-made
errors default to invalid-input. An internal classifier is shared between the
manifest and texture modules, outside the public root exports.

Guarded property allowlisting would contain exceptions but would trust forged
categories. Freezing public errors changes mutation compatibility and still does
not make public construction trusted. Private weak identity preserves legitimate
categories without retaining exceptions or adding an unbounded strong registry.
No dependency, parser, renderer or public factory behavior changes.

## Impact and verification

Boundaries allocate a fresh error only on failure. Weak records do not retain
objects; classification is constant work and cannot call proxy traps. Public
code categories and successful output remain compatible. Existing deadline,
abort, cleanup, limits, canonical identity, legacy, rollout enabled/disabled and
rollback tests stay active. Add failing-first nested/revoked proxy, public forged
and subclassed/accessor errors, primitives and mutated captured-error tests.
Qualify built packed/public ESM and CJS, strict declarations and browser runtime.
Full frozen Node24 tests/LCOV>=80% with all changed sources, lint/types/build,
audit/privacy/pack gates are required. UI accessibility/SEO and backend secretref
are N/A for this in-memory library-only correction; no site deployment.

Inherit backend gpu.model.conversion.enabled for caller adoption. Validation
remains unconditional for admitted calls and requires no new capability. Release
a patch through the existing PR/CI/main cd.yml/production/hosted OIDC route,
verify exact bytes/provenance and public consumers before restoring Done.
Rollback disables caller adoption or the channel; never restore unsafe error
forwarding or weaken independent promotion acceptance.
