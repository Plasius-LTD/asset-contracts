# ADR 0002: Versioned Model Resolution Contracts

## Status

- Accepted
- Date: 2026-07-13
- Version: 1.0

## Context

Story `Plasius-LTD/plasius-ltd-site#1484` requires one public vocabulary for
resolving natural-language model requests across the promoted catalog,
approved providers, and a future generator. Task #1485 assigns that vocabulary
and its runtime validation to `@plasius/asset-contracts`.

The existing asset job, screenshot, review, manifest, and promotion contracts
must remain source- and behavior-compatible. Extending their enums would change
existing standard screenshot packs and could invalidate exhaustive consumer
switches. Model resolution also has different lifecycle and evidence semantics
from asset processing and promotion jobs.

External JavaScript, MCP, provider, and persistence payloads cannot rely on
TypeScript declarations for safety. Public candidate data must not expose raw
downloads, signed blobs, local paths, or unpromoted runtime resources.

## Decision

1. Add the model-resolution surface as a separate versioned module re-exported
   from the existing package root. Do not change legacy exports or behavior.
2. Normalize and validate unknown input through strict factories that reject
   unknown keys, bound strings/numbers/arrays, reconstruct allow-listed fields,
   and deeply freeze output.
3. Derive raw assurance from fixed thresholds (`high >= 0.75`, `low >= 0.50`),
   then cap it at the persisted ranker ceiling. Text-only rankers cannot declare
   a ceiling above `low`, and capped assessments receive a stable audit reason.
   Deterministic ID/alias matches use the distinct `exact-identifier` evidence
   mode. Force `none` whenever hard constraints fail. Human confirmation remains
   mandatory for every otherwise confirmable candidate. Embed the exact
   normalized request and candidate identity in each assessment, enforce any
   caller-selected ranker id, and recompute hard constraints at the candidate
   boundary (and again in its resolution context) rather than trusting a
   claimed pass. A confirmation timestamp must follow all evidence needed to
   make that decision, and its candidate must belong to the receipt's expected
   resolution. Expose the same deterministic evaluator over request plus
   technical profile so acquisition services can construct honest assessments
   without duplicating policy.
4. Require exactly four authenticated `1024 × 1024` originals: front, left,
   top, and isometric. Scope them to the exact resolution/candidate namespace
   and bind them through versioned renderer and camera/settings evidence covering
   canonical LOD0, the processing manifest, timestamp, ordered hashes, and a
   signed attestation. Hosted MCP preview projection is a later integration
   concern.
5. Represent staged candidates through opaque proposal ids and hashes. Expose
   promoted models only through immutable `ModelAssetRef` values whose manifest
   path exactly matches their asset id and version. Require completed staged
   candidates to carry a backend-issued promotion receipt binding proposal,
   confirmation, manifest, assembly closure, and final catalog identity.
6. Restrict model resources to credential-free `mcp://models/...` references.
   Permit provenance and rights links only as public HTTPS pages without
   credentials, queries, or fragments. Treat this as serialization safety, not
   network authorization; provider fetchers still require host allowlists,
   public DNS/IP validation, target pinning, and redirect revalidation.
7. Fix processed output to metres, Y-up, `-Z` forward, a floor-centred origin,
   and counter-clockwise outward face winding. Record one to four contiguous
   LODs beginning at LOD0 with measured monotonic geometric error, collision,
   assembly children/transforms, converter diagnostics/losses, and fidelity
   evidence. Bind LOD0 and collision GLBs, enforce retained-level reduction and
   fidelity evidence, require a versioned collision proxy/none decision, keep
   omitted request collision policy non-constraining so that signed category
   policy can authorize `collision: none`, and
   permit candidate-scoped staged derived leaf children so a new closure can be
   reviewed before atomic promotion. Keep projected-error selection and
   hysteresis thresholds in processing/runtime policy.
8. Publish the exact resolution-state vocabulary in contracts, while leaving
   transition and retry policy to a separately tracked `@plasius/asset-pipeline`
   task. Confirmation requires independent signed malware, technical,
   human-review, accessibility, rights, render, and fidelity evidence; a semantic
   risk override cannot replace them.
9. Apply the `static-world-v1` ceilings in normalized requests. Public callers
   may tighten but not raise the 1M triangle, 100 MiB GLB, 64 MiB texture, 4K
   texture, or 32-metre partition limits. A future raised policy requires a
   separately authenticated operator contract.
10. Publish a generator port and stable disabled/generated/unavailable/failed/
    cancelled/budget-exceeded result union now, but supply only a fail-closed
    Phase 1 disabled implementation. Generated bundles echo the exact request,
    remain in a generation-scoped namespace, declare a single entrypoint and
    closed artifact roles, and prove aggregate plus embedded-texture budget use
    without a future breaking interface change.

## Consequences

### Positive

- Catalog, providers, hosted MCP, processing, and future generation share one
  immutable public vocabulary.
- Malformed JavaScript and unsafe references fail before orchestration or
  promotion side effects.
- Rights, match, rendering, validation, and promotion evidence cannot be moved
  between requests, source packages, resolutions, candidates, or staged closures.
- Legacy asset contracts and their existing screenshot plan remain unchanged.
- Rights, attribution, conversion, and fidelity evidence remain reviewable and
  persistable without leaking private download locations.

### Negative

- Strict factories require a contract revision when new serialized fields are
  introduced rather than silently retaining unknown data.
- The contracts package now owns more structural validation code and must keep
  its boundary tests comprehensive.
- Asset-pipeline and hosted MCP integration must consume a released package
  version before they can remove duplicated local vocabulary.

## Alternatives Considered

- Extend the existing asset-job and screenshot enums: rejected because their
  state flow and standard 12-view pack have different compatibility semantics.
- Store raw provider or signed blob URLs in candidates: rejected because those
  references can leak credentials or unpromoted resources.
- Put transition policy in this package: rejected because orchestration and
  retry planning belong to `@plasius/asset-pipeline` under site ADR 0084.
- Enable generation in Phase 1: rejected because provider exhaustion must fail
  closed until a separately reviewed implementation and rollout path exist.

## Related Decisions and Work

- plasius-ltd-site Story #1484
- plasius-ltd-site Task #1485
- plasius-ltd-site ADR 0084
- plasius-ltd-site TDR 0004
- [ADR 0001: Asset Contracts Package Boundary](./adr-0001-package-boundary.md)
