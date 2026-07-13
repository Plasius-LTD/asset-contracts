# @plasius/asset-contracts

Canonical contracts for Plasius asset jobs, manifests, screenshot plans, reviews, and promotion records.

## Install

```bash
npm install @plasius/asset-contracts
```

## Scope

This package is part of the unified AI asset pipeline package family. It is scaffolded from the @plasius/schema package template and owns the asset contracts boundary described in the Plasius asset pipeline design.

The exported surface covers:

- asset id and version validation helpers
- asset job metadata contracts
- manifest and file descriptor contracts
- screenshot plan definitions
- review findings and review report contracts
- immutable promotion record contracts
- versioned natural-language model request and match-assessment contracts
- catalog, provider, and future generated model candidate contracts
- request-bound match, rights, render, hard-gate, confirmation, and promotion receipts
- immutable promoted `ModelAssetRef` values
- canonical model processing, LOD, collision, assembly, converter, and fidelity evidence
- asynchronous resolution records and the disabled Phase 1 generator port

## Model Resolution Contracts

`MODEL_RESOLUTION_CONTRACT_VERSION` identifies the additive v1 model-resolution
surface. Factories accept unknown JavaScript input, reject unknown or malformed
fields, reconstruct allow-listed output, and deeply freeze every returned
record.

```ts
import {
  createModelRequestSpec,
  createModelMatchAssessment,
} from "@plasius/asset-contracts";

const request = createModelRequestSpec({
  query: "weathered oak farmhouse table",
  revision: 0,
  hardConstraints: {
    maxTriangles: 80_000,
    maxBytes: 40_000_000,
    maxTextureBytes: 16_000_000,
    maxTextureDimensionPx: 4096,
    maxPartitionCellMetres: 2,
    lod: "required",
    collision: "required",
  },
  softPreferences: {
    category: "furniture",
    materials: ["oak"],
  },
});

const candidateContentHash = "a".repeat(64);

const assessment = createModelMatchAssessment({
  score: 0.78,
  hardConstraintPass: true,
  exactMatch: false,
  reasonCodes: ["semantic-category-match"],
  ranker: {
    id: "semantic-model-ranker",
    version: "1.2.0",
    calibrationId: "catalog-2026-07",
    calibrationVersion: "1",
    evidenceMode: "multimodal",
    assuranceCeiling: "high",
  },
  fidelityWarnings: [],
  request,
  candidateId: "candidate-1",
  candidateContentHash,
});
```

Raw assurance is derived consistently: `high` is `>= 0.75`, `low` is
`0.50–0.749…`, and `none` is `< 0.50`. The effective result is no higher than
the ranker's persisted `assuranceCeiling`. Text-only rankers may declare only
`low` or `none`; when their raw score would be high the factory appends the
stable `text-only-assurance-ceiling` audit reason. Deterministic ID or alias
matches use `evidenceMode: "exact-identifier"` with `exactMatch: true`. A failed
hard-constraint gate always forces `none`, regardless of score or exactness.
High and low matches still require human confirmation; there is no automatic
promotion path. Candidate construction independently recomputes the embedded
request's hard constraints, so callers cannot bypass them by invoking the
confirmation contract directly. Confirmation must also be timestamped after
the candidate evidence it approves and cannot be relabelled for another
resolution. Acquisition/ranking services can call
`evaluateModelHardConstraintsForProfile` with the normalized request and
technical profile before constructing the assessment and candidate.

Each candidate carries exactly four authenticated originals in canonical order:
`front`, `left`, `top`, and `isometric`. Originals are `1024 × 1024`; smaller
MCP previews are projections owned by the hosted tool response, not this
evidence contract.

Requests carry immutable revisions from `0` through `3`. Resolution records
also carry an attempt count, optional best-candidate and refinement context,
at most three refinement questions, and a final immutable asset reference only
when state is `completed`. The normalized request always applies the
`static-world-v1` ceilings (1,000,000 triangles, 100 MiB GLB, 64 MiB textures,
4K textures, and 32-metre partition cells); callers may tighten but cannot
raise them through the public contract.

Match assessments embed the exact normalized request plus candidate id and
content hash, and a caller-selected ranker id must match the calibrated ranker
that produced the assessment. Resolution validation recomputes every hard
constraint against the candidate technical profile and rejects a claimed gate
result or reason list that disagrees.

Each candidate is scoped to one resolution, embeds its authoritative processing
manifest, and binds the exact source package to provenance and a versioned,
signed rights decision. Four-view evidence includes renderer and camera/settings
versions, canonical LOD0 hash, processing-manifest id, timestamp, ordered view
hashes, and an attestation token. Malware, technical, human-review, and
accessibility attestations are independent required gates. Confirmation receipts
bind the signed candidate token and ordered render hashes; low assurance requires
an explicit semantic-risk override. Completed staged assets additionally require
a backend-issued promotion receipt binding the proposal, confirmed manifest and
assembly closure to the exact final `ModelAssetRef`.

## Model Processing and References

`ModelProcessingManifest` fixes processed output to metres, Y-up, `-Z` forward,
a floor-centred origin, and counter-clockwise outward face winding. It supports
one to four contiguous adaptive levels beginning at LOD0, monotonic
non-increasing triangle counts, monotonic non-decreasing measured geometric
error, collision evidence, leaf or assembly models, immutable child references
and transforms, converter diagnostics and losses, and structured fidelity
evidence. Retained LODs are canonical GLBs, reduce the preceding triangle count
by at least 30%, contain at least 512 triangles after LOD0, and have distinct
resource hashes. LOD0 hash and byte length bind the manifest and technical
profile; collision output is a separate GLB. A versioned collision policy must
either require the proxy or explicitly authorize `collision: none` for the
category. An omitted request collision preference normalizes to `optional`;
only an explicit `required` or `forbidden` request adds a separate hard gate.
Fidelity policy requires geometry, material, and texture evidence;
blocking geometry/converter evidence fails closed and unresolved fidelity caps
semantic assurance at low.

Assembly children may reference immutable catalog leaves or candidate-scoped
staged derived leaves. Their optional parent links must form an acyclic hierarchy
of depth 16 or less. An assembly closure hash follows the staged parent/child
closure into the atomic promotion receipt. Runtime projected-error and
hysteresis thresholds are
processing/runtime policy and are intentionally not embedded in the contract.

Runtime manifests, confirmation images, LODs, collision artifacts, and fidelity
evidence use credential-free `mcp://models/...` references. The factories reject
queries, fragments, encoded traversal, alternate MCP authorities, local paths,
and external download URLs. Review resources must use the exact
`mcp://models/resolutions/{resolutionId}/candidates/{candidateId}/...` namespace.
Provenance and rights evidence may link only to credential-free public HTTPS
pages with no query or fragment. This lexical contract is not fetch
authorization: provider connectors must still enforce host allowlists, resolve
and validate public IPs, pin the approved connection target, and revalidate every
redirect to prevent DNS rebinding or wildcard-host SSRF.
Promoted runtime references additionally use the exact
`mcp://models/catalog/{assetId}/versions/{version}/manifest` identity path.

## Generator Boundary

`createDisabledModelGeneratorPort()` is the Phase 1 implementation of
`ModelGeneratorPort`. It validates the normalized request, compute/output
budgets (including aggregate texture bytes), deterministic seed, deadline, and
optional cancellation signal, then returns `phase-1-generator-disabled` without
performing network or generation work. Every invocation and outcome carries a
caller-issued generation id. The stable result union covers disabled, generated,
unavailable, failed, cancelled, and budget-exceeded outcomes with closed reasons
and stable retryability. A generated bundle echoes the exact request context,
declares one model entrypoint and closed artifact roles, remains inside its
generation resource namespace, and records aggregate, standalone, and embedded
texture measurements that must fit the invocation budgets and deadline.
Provider exhaustion therefore remains an unresolved or best-low outcome until a
separately governed generator implementation is delivered.

## Feature Flag

- `asset.pipeline.unified-ai-assets.enabled`

## Related Documents

- plasius-ltd-site `docs/Design/unified-ai-asset-pipeline.md`
- plasius-ltd-site `docs/adrs/adr-0084-unified-ai-asset-pipeline-packages.md`
- plasius-ltd-site `docs/tdrs/tdr-0004-unified-ai-asset-pipeline.md`
- package `docs/adrs/adr-0002-model-resolution-contracts.md`

## Development

```bash
npm install
npm run build
npm test
npm run test:coverage
npm run pack:check
```

## Governance

- Security policy: [SECURITY.md](./SECURITY.md)
- Code of conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- ADRs: [docs/adrs](./docs/adrs)
- CLA and legal docs: [legal](./legal)

## Support

`Plasius-LTD/asset-contracts` keeps GitHub Issues disabled. File package bugs and support requests in [`Plasius-LTD/plasius-ltd-site`](https://github.com/Plasius-LTD/plasius-ltd-site/issues) and include `asset-contracts` in the title or body so package work can be routed correctly.

## License

Apache-2.0
