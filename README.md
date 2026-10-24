# @plasius/asset-contracts

[![npm version](https://img.shields.io/npm/v/@plasius/asset-contracts.svg)](https://www.npmjs.com/package/@plasius/asset-contracts)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Plasius-LTD/asset-contracts/ci.yml?branch=main&label=build&style=flat)](https://github.com/Plasius-LTD/asset-contracts/actions/workflows/ci.yml)
[![coverage](https://img.shields.io/codecov/c/github/Plasius-LTD/asset-contracts)](https://codecov.io/gh/Plasius-LTD/asset-contracts)
[![License](https://img.shields.io/github/license/Plasius-LTD/asset-contracts)](./LICENSE)
[![Code of Conduct](https://img.shields.io/badge/code%20of%20conduct-yes-blue.svg)](./CODE_OF_CONDUCT.md)
[![Security Policy](https://img.shields.io/badge/security%20policy-yes-orange.svg)](./SECURITY.md)
[![Changelog](https://img.shields.io/badge/changelog-md-blue.svg)](./CHANGELOG.md)

Canonical contracts for Plasius asset jobs, model resolution, immutable WebGPU
shader assets, screenshot plans, reviews, and promotion records.

## Model resource promotion closure

`createModelResourcePromotionRecord(input, options?)` composes a typed
`AssetPromotionRecord<ModelAssetManifest>`, complete source and output byte
inventories, raw conversion diagnostics, explicit public resource bindings,
and existing `ModelCandidate` / `ModelCandidateConfirmation` evidence. The
output uses the existing texture/resource qualification input. Source and
output must have distinct immutable asset/version identities. Runtime URIs
end in `/assetId/version/entrypoint` and satisfy existing immutable HTTPS rules.

The boundary verifies all file paths/hashes/lengths/MIME, original/derived
lineage, converter/source/output identity, re-evaluated diagnostics and runtime
resource bindings before calling `createGpuAssetPromotionRecord`. Diagnostic
policy must match the canonical source format: glTF/GLB, OBJ/MTL, FBX, or
STEP/STP/IGES/IGS/IFC use their corresponding released evaluator standard;
unknown formats fail closed. Review must
pass without blocking findings; existing rights, security, fidelity, render,
GPU envelope and human confirmation contracts remain required. Every runtime
LOD/collision/fidelity resource and projected diagnostic resource needs one
`{ resource, package: "source" | "output", filePath }` binding to verified bytes.

The frozen result retains `promotion`, `source`, qualified `output`, evaluated
`diagnostics`, sorted `resourceBindings`, `candidate`, `confirmation` and a
separate deterministic `closureHash`. This package digest includes both complete
inventories and lineage; it preserves existing candidate leaf/assembly hash
semantics. No bytes or Blobs are retained. Raw provider diagnostic text is
excluded; authored package and candidate metadata remain trusted content that
callers must minimize before public distribution.

For `outcome: "rolled-back"`, supply `rollback: { prior, current }` with results
qualified by this same installed module instance. Requalify the exact prior
source/output bytes and approval gates; target version/manifest/closure/runtime
URI must match `prior`, and `rollbackOfVersion` must equal `current`'s distinct
version for the same asset/channel. The result names both exact closure hashes.
New independent confirmation is allowed without changing package identity.
Forward calls reject rollback metadata. A JSON clone has no local qualification
brand: reconstruct and qualify its original inputs before using it as history.

This function performs no storage or pointer changes. Hosted services own
signature/issuer verification, authenticated immutable history, create-only
version admission and pointer-last concurrency control. Local qualification
does not prove embedded model references, derivation algorithms or GPU matrix
policy; existing downstream gates still apply. Fixed metadata/byte limits,
abort and a default 10s deadline (configurable 1–60s) bound work. Errors contain
fixed codes only. Backend `gpu.model.conversion.enabled` controls opt-in caller
adoption; disabled/rollback adoption retains existing factories. Capability N/A
for this package-only API. See [ADR0012](./docs/adrs/adr-0012-model-resource-promotion-closure.md)
and [TDR0007](./docs/tdrs/tdr-0007-model-resource-promotion-closure.md).

## Install

```bash
npm install @plasius/asset-contracts
```

## Scope

This package is part of the unified AI asset pipeline package family. It is scaffolded from the @plasius/schema package template and owns the asset contracts boundary described in the Plasius asset pipeline design.

The exported surface covers:

- asset id, legacy workflow-version, and immutable exact-version validation
  helpers
- asset job metadata contracts
- manifest and file descriptor contracts
- opt-in canonical model package inventory and exact-byte qualification
- reloadable canonical texture/material metadata and explicit upload/atlas roles
- opt-in public-safe canonical conversion diagnostics and resource/source binding
- screenshot plan definitions
- review findings and review report contracts
- immutable promotion record contracts
- versioned natural-language model request and match-assessment contracts
- catalog, provider, and future generated model candidate contracts
- request-bound match, rights, render, hard-gate, confirmation, and promotion receipts
- immutable promoted `ModelAssetRef` values
- canonical model processing, LOD, collision, assembly, converter, and fidelity evidence
- asynchronous resolution records and the disabled Phase 1 generator port
- additive PVOX request, artifact, voxel capability, physical evidence, native
  render, confirmation-binding, and durable lifecycle contracts
- typed model, reflected GPU-interface, WGSL shader, rendering-style profile,
  and shader-validation-evidence asset manifests
- model-facing GPU ABI references, semantics, and optional exact default-style
  references
- generic manifest inference plus byte-verified typed promotion that preserves
  specialized manifest fields

## Canonical Model Resource Qualification

`qualifyModelResourceManifest` binds an existing `AssetManifest` to a published
`@plasius/gpu-model-core` `ResourcePackageManifest` and the complete exported
file bytes. Existing factories retain their staged-construction behavior.

```ts
import { qualifyModelResourceManifest } from "@plasius/asset-contracts";

// Obtain manifest, packageManifest and exportedFiles from your trusted pipeline.
const qualified = await qualifyModelResourceManifest({
  manifest,
  packageManifest,
  files: exportedFiles, // [{ path, bytes: Uint8Array, contentType }]
  signal: abortController.signal,
  timeoutMs: 10_000,
});
```

Every manifest path, canonical inventory path and payload path must correspond
exactly, including the entrypoint. The qualifier checks actual byte lengths and
SHA-256 digests, agreement of canonical MIME declarations, portable relative
POSIX paths, case-insensitive collisions and file/directory conflicts. Optional
inventory MIME declarations may be omitted; the descriptor and payload MIME
declarations are required. It preserves roles, sourceAdapter, source/derived
paths and specialized model metadata, returning frozen descriptors sorted by
locale-independent code-unit order. Typed model inputs are also revalidated by
`createModelAssetManifest`.

Pass ordinary `Uint8Array` values backed by `ArrayBuffer`; use
`new Uint8Array(nodeBuffer)` for Node buffers. Shared buffers, getters in
metadata, exotic records and sparse arrays are rejected. Metadata and bytes
are copied before the first hash. `MODEL_RESOURCE_MANIFEST_LIMITS` caps files
at 16,384, each file at 64 MiB, total bytes at 128 MiB, metadata depth at 16 and
metadata values at 262,144. Metadata strings are capped at 2,048 characters,
keys at 128, paths at 1,024 and MIME declarations at 128. The default deadline
is 10 seconds; callers may choose 1–60,000 ms. Cancellation and deadline checks
surround each bounded digest; Web Crypto cannot cancel an in-flight digest.
Failures use value-free `ModelResourceManifestError.code` values.

Embedded resources remain inside their owning entrypoint; list only actual
exported files. This helper checks bytes and declarations, not internal format
references, MIME sniffing, malware, rendering, storage or promotion authority.
Keep source provenance in the canonical document and do not substitute derived
hashes for original source hashes. Role qualification is available through the additive helper below; animation/source
relationships remain adapter-owned; promotion composition uses the opt-in closure boundary above. The result
is qualification at call time; callers must preserve the exact bytes in their
own immutable storage boundary.

The backend remote evaluator owns `gpu.model.conversion.enabled`. Call this
helper on the enabled adoption path; disabled and rollback paths retain the
existing factory path. The package performs no flag lookup or live mutation,
and adds no UI capability. The model-core dependency is exact published
`0.7.0` for public type compatibility; its import here is type-only, with no
runtime parser or renderer loading. Downstream adoption must use a released
package. See [ADR 0009](./docs/adrs/adr-0009-model-resource-manifest-qualification.md)
and [TDR 0004](./docs/tdrs/tdr-0004-model-resource-manifest-qualification.md).

## Reloadable Texture and Resource Roles

`qualifyModelTextureResources` composes exact byte/inventory qualification with
published model-core's verified material/texture graph. It keeps authored
metadata and source image identity separate from derived GPU uploads/atlases.

```ts
import { qualifyModelTextureResources } from "@plasius/asset-contracts";

const reload = await qualifyModelTextureResources({
  manifest, packageManifest, files: exportedFiles,
  graph: verifiedCanonicalGraph,
  resources: [
    { resourceId: "source-image", filePath: "textures/source.png" },
    { resourceId: "embedded-buffer", filePath: "model.gltf" },
  ], // Exactly one binding per graph resource.
  derived: [
    { role: "gpu-upload", filePath: "derived/upload.bin", sourceResourceIds: ["source-image"] },
    { role: "texture-atlas", filePath: "derived/atlas.png", sourceResourceIds: ["source-image"] },
  ], // Or [] when no derivative is exported.
}, { signal: abortController.signal, timeoutMs: 10_000 });
// Persist JSON.stringify(reload) alongside the qualified immutable bytes.
```

Use existing storage roles: canonical texture → texture with PNG/JPEG/WebP/KTX2
MIME; material/animation → metadata with application/json; mesh → model or
binary; auxiliary → binary or JSON metadata. Uploads require auxiliary/binary
buffer files, atlases texture/image files. See TDR 0006 for the exact MIME table.
Missing/duplicate resources, incompatible roles/MIME, unknown roles, graph
clones and source/output collisions reject. External files match graph path,
hash, byte length and MIME; embedded resources name the owning model entrypoint
and retain their independent resource hash. List only actual exported files.

The frozen version-1 result contains manifest, original source provenance,
resources, canonical materials/textures and derived records. Authored usage,
color space, sampler, binding transform, embedding policy and sourceMetadata
survive JSON reload. Original image IDs and bytes are never replaced by atlas
hashes or upload paths. No Blob payload or renderer allocation is serialized.
Adapters own model-internal references, derivation algorithms and image content
inspection; qualification does not attest those operations or grant promotion.
Task 12 animation schemas and Task 23 shader ABI remain separate;
promotion composition uses the opt-in closure boundary above.

This is **trusted package metadata**, including names, extensions, original
paths and authored sourceMetadata. Minimize/sanitize that data before public
distribution; use the separate public diagnostics API for technical responses.
Serialized graphs lose their private brand: verify reloaded canonical resources
and reconstruct a graph through core before qualifying again. Produce graphs
with the same installed model-core instance and matching module format (ESM
import with ESM, require with CJS). The normal named guard import preserves that
identity; unused exports remain tree-shakeable through sideEffects=false.

Inputs/bytes are snapshotted before awaiting. Fixed ceilings are 16,384 resource
bindings, 4,096 derivatives, 65,536 graph nodes, shared 262,144 metadata values,
2,097,152 UTF-16 characters, depth 16 and 2,048 characters/string. Existing file
limits also apply. Default deadline 10 seconds, allowed range 1–60,000 ms;
cancellation/deadline reject without a partial result. In-flight Web Crypto
cannot be cancelled. ModelTextureResourceError.code is value-free.

The backend evaluator gpu.model.conversion.enabled controls caller adoption;
disabled/rollback paths retain legacy factories. No lookup/mutation or UI
capability is introduced. Dependencies and legacy factories are unchanged.
See [ADR 0011](./docs/adrs/adr-0011-reloadable-texture-resource-roles.md) and
[TDR 0006](./docs/tdrs/tdr-0006-reloadable-texture-resource-roles.md).

## Public Conversion Diagnostics

`qualifyModelConversionDiagnostics` adds an opt-in, version-1 JSON boundary over
published model-core diagnostics. It reuses the canonical evaluator, loading it
only when this async helper is called. Existing factories remain compatible.

```ts
import { qualifyModelConversionDiagnostics } from "@plasius/asset-contracts";

const result = await qualifyModelConversionDiagnostics({
  outcome: "completed", // or "unsupported" / "failed" from your trusted adapter
  source: publicSourceProvenance, // existing ModelProvenance; original source hash
  report: canonicalDiagnosticInput, // model-core GpuModelDiagnosticInput
  resources: [{ path: "/meshes/0", resource: publicModelResourceRef }],
}, { signal: abortController.signal, timeoutMs: 10_000 });
// Only these existing diagnostic/loss fields belong in ModelConverterEvidence:
const converterEvidence = { ...trustedConverterIdentity, ...result.converter };
```

Every non-root diagnostic path must match exactly one supplied resource binding.
The root path `/` refers to `result.source`; no resource is fabricated. Resource
references use existing credential-free `mcp://models/...` contracts and include
hash, length and MIME identity. Conflicting references for one URI reject. These
bindings and provenance are caller assertions, not proof that bytes were read.
Use manifest qualification and independent promotion checks at their boundaries.

Statuses are derived deterministically: explicit failure wins, then unsupported
data/outcome, then canonical rejection, then warning or clean success. Loss
requires canonical explicit consent; denied loss produces blocking legacy loss
evidence. Only canonical accepted repairs receive a fallback rule id. Unknown
repair rules remain blocking. Arbitrary adapter codes, messages, private paths,
provider exceptions, original repair values and forensic rawSource are never
serialized; unknown adapter codes map to fixed category codes. Public codes are
`conversion.warning`, `conversion.repair`, `conversion.loss.dropped`,
`conversion.loss.approximated`, `conversion.unsupported`, `conversion.blocked`
and `conversion.failed`, with fixed bounded messages. Malformed input rejects
with value-free `ModelConversionDiagnosticsError.code`.

This projection is technical evidence only. `technicalAccepted` never replaces
human approval, malware/security, rights, fidelity, confirmation or promotion
receipts. `result.converter` contains the exact existing diagnostics/losses
shape; the detailed `result.diagnostics` additionally binds resources and
loss/fallback metadata. Preserve all independent evidence when composing it.

Inputs must be inert JSON records; getters, exotic prototypes, sparse arrays,
cycles, symbols and extra contract keys reject. Metadata is snapshotted before
awaiting. Fixed ceilings are 100 issues/resources, depth 12, 16,384 values,
2,048 characters per string and 262,144 total string characters. Non-completed
outcomes reserve one issue slot for a terminal diagnostic, so accept at most
99 issues. Arrays never exceed legacy 100-entry limits. Default deadline is
10 seconds, configurable from 1–60,000 ms; cancellation/deadlines bound the
lazy import wait and are checked around bounded synchronous evaluation. They
cannot preempt JavaScript evaluation or cancel the platform module loader.
No network, filesystem, logs, retries or persistent state are introduced.

Use the backend-evaluated `gpu.model.conversion.enabled` adoption decision;
disabled/rollback paths retain existing factories and diagnostics. No live flag
lookup/mutation or UI capability is added. The already-published exact
model-core0.7.0 dependency supplies evaluation without adding a parser or
renderer. No dependency version changes are needed. See [ADR 0010](./docs/adrs/adr-0010-public-conversion-diagnostics.md)
and [TDR 0005](./docs/tdrs/tdr-0005-public-conversion-diagnostics.md).

## Private Artifact Prevention

Signed contributor agreements and contributor acceptance records are retained
only in an approved access-controlled system outside source control. The
zero-dependency prevention gate inspects path metadata only; it never opens or
hashes suspected private artifacts.

Run the repository and package gates before review or release:

```bash
npm run privacy:check
npm run test:privacy
npm run build
npm run pack:check
```

`privacy:check` evaluates both working-tree paths and the proposed Git index,
so ignored files and tracked-but-unstaged deletions cannot bypass it.
`pack:check` validates the explicit `package.json` publish allowlist and the
exact `npm pack --dry-run` path manifest. Only the three public CLA Markdown
documents may be published from `legal/`; `dist/`, `src/`, and `docs/` also
enforce file-extension allowlists. CI, release preparation, and CD all fail
closed on these gates. The targeted path rules remain defense in depth and do
not replace secret scanning, access controls, or incident response.

## WebGPU Shader Asset Contracts

`@plasius/gpu-shader` owns reflection-derived GPU layouts, ABI hashes, exact
shader and style-profile manifests, compatibility logic, and qualification
evidence. This package adds those domain contracts to the existing immutable
asset lifecycle without copying layout rules into sidecar metadata.

```ts
import {
  ASSET_WGSL_CONTENT_TYPE,
  createShaderAssetManifest,
} from "@plasius/asset-contracts";

const asset = createShaderAssetManifest({
  assetKind: "shader",
  assetId: "shader-cartoon",
  version: "1.2.0",
  entrypoint: "shader.json",
  files: [
    {
      path: "shader.json",
      byteLength: 2048,
      sha256: shaderManifestSha256,
      contentType: "application/json",
      role: "shader-manifest",
    },
    {
      path: "material.wgsl",
      byteLength: materialWgsl.byteLength,
      sha256: materialWgslSha256,
      contentType: ASSET_WGSL_CONTENT_TYPE,
      role: "wgsl",
      moduleId: "material",
    },
  ],
  sourceAdapter: "local-import",
  createdAt: "2026-07-13T12:00:00.000Z",
  shaderManifest,
});
```

The typed factories:

- keep the legacy `AssetManifest` source-compatible by making `assetKind`
  optional only on that base contract; its generic factory remains kindless and
  routes typed assets to specialized factories
- require a role-specific entrypoint for every typed asset
- require the domain id to use the same lowercase kebab-case lifecycle id and
  exact version, avoiding lossy identity normalization
- reject mutable aliases, ranges, wildcards, and URL-shaped values anywhere an
  immutable GPU asset or nested exact reference carries a version
- strictly parse reflected interface, shader-version, style-profile, and model
  compatibility values through `@plasius/gpu-shader`
- require each shader module id and immutable URI path to map one-to-one to a
  unique relative WGSL Blob path with the declared digest, byte length, and
  content type
- require evidence references to use an accepted universal or additive WebGPU
  matrix policy and include exact evidence and attestation file digests
- reject undeclared typed-envelope fields, preventing manually supplied CPU/GPU
  layouts from becoming a second source of truth

`createModelAssetManifest` adds `gpuInterface`, `modelAbiHash`,
`providedSemantics`, and `defaultStyleProfile` to a model version. A missing
default profile normalizes to `null`; compatible style profiles remain separate
catalog assets, so cartoon, anime, realistic, and future profiles can be added
without republishing a model.

The synchronous factories validate declarations and lifecycle relationships.
`validateGpuAssetFiles` additionally requires the complete, exact file map,
verifies every byte length and SHA-256 digest, requires canonical JSON, and
binds interface/shader/profile entrypoint bytes to the nested domain manifest.
`createGpuAssetPromotionRecord` performs that byte validation and binds the
runtime URI to the validated entrypoint before producing a typed promotion
record; the legacy synchronous promotion factory rejects typed assets. Exact
`GpuInterfaceRef`, `ShaderVersionRef`, and `ShaderStyleProfileRef` values accept
canonical manifest bytes, recompute their digest, and are constructed only
after the immutable URI exists, avoiding self-referential manifests. Evidence
byte validation also requires a passing status, the declared matrix identity,
and complete non-empty result counts before the stronger qualification
validator runs.

Storage admission must still assemble WGSL, regenerate manifests and codecs,
validate qualification bundles and full matrix evidence through
`@plasius/gpu-shader/testing`, then atomically promote the immutable version.
Runtime must still resolve only promoted catalog assets and verify bytes,
compatibility, features, formats, and limits before pipeline creation.

Rollout and user-visible style discovery use the canonical exports:

- feature flag: `asset.pipeline.shader-store.enabled`
- capability: `gpu.shader.style.select`

### Immutable exact versions

Use `assertImmutableAssetVersion` for catalog identities, immutable Blob roots,
and exact references. It accepts existing exact identifiers such as `1`, `v1`,
`1.2.0`, and `2026.07.13-a1`, while rejecting the case-insensitive aliases
`latest`, `current`, `stable`, `preview`, `default`, `production`, `canary`,
`next`, `head`, and `main`. SemVer-style `x` wildcards, other range/wildcard
syntax, and URL-shaped values also fail with one constant, bounded error that
does not echo caller input.

`assertAssetVersion` remains available for legacy workflow records where a
mutable label is intentional. Typed model, interface, shader, style-profile,
and validation-evidence manifests always use the exact validator, as do nested
interface/profile/shader pins, matrix-policy versions, immutable rollback
targets, post-storage ref factories, and model-resolution `ModelAssetRef`
values. The shader-store feature flag controls whether hosts enter this asset
lifecycle; disabling the flag does not weaken validation for data that reaches
the contract boundary.

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

## PVOX Model Resolution Contracts

`MODEL_RESOLUTION_V2_CONTRACT_VERSION` is an additive contract family for the
partner-to-PVOX pipeline. It does not change the v1 GLB ingestion contracts or
`ModelAssetRef`. A v2 processing manifest uses the discriminant
`representation: "pvox"`; its authenticated runtime resource has the fixed
`.pvox` extension, `application/vnd.plasius.pvox` media type, `PVOX` magic,
the `{ major: 1, minor: 0 }` static/rigid format, 256-byte header, 128-byte
directory entries, at most 64 sections, and whole uncompressed 64-KiB pages.
Pages are typed as metadata, LOD structure, render field, or collision field;
field pages carry a complete LOD/partition/depth/Morton scope. Root, directory,
page-set, binary-closure, compilation-input, and runtime-request-profile hashes
remain distinct.

Use `createModelRequestSpecV2` for a PVOX resolution. Source acquisition and
decode limits live only in `sourceIngestionLimits`. The texture-free runtime
profile separately declares fidelity, geometry mode, required capabilities,
and PVOX artifact/page/hierarchy/brick/logical-voxel/encoded-sample/residency
limits. The default artifact ceilings are 524,288 render bricks, 268,435,456
logical voxels, and 8,388,608 encoded surface samples; factories also reject
record counts that cannot fit the declared whole-page artifact. Legacy triangle
or texture fields cannot be supplied as PVOX runtime constraints. Partition
extent is fidelity-driven and must fit the LOD0 cell size and hierarchy depth;
the contract does not assume a 32-metre partition can meet every profile.

```ts
import {
  MODEL_RESOLUTION_V2_CONTRACT_VERSION,
  PVOX_MODEL_REQUEST_POLICY_ID,
  PVOX_PAGE_SIZE_BYTES,
  createModelRequestSpecV2,
} from "@plasius/asset-contracts";

const request = createModelRequestSpecV2({
  contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
  policyProfileId: PVOX_MODEL_REQUEST_POLICY_ID,
  requestSemanticProfileHash: requestSemanticProfileSha256,
  query: "weathered oak farmhouse table",
  revision: 0,
  hardConstraints: { collision: "required", partition: "allowed" },
  softPreferences: { category: "furniture", materials: ["oak"] },
  exclusions: [],
  sourceIngestionLimits: {
    maximumDownloadBytes: 100_000_000,
    maximumExpandedBytes: 200_000_000,
    maximumArchiveEntries: 1_000,
    maximumSourceFiles: 2_000,
    maximumDecodedTextureBytes: 100_000_000,
    maximumTextureDimensionPx: 8_192,
  },
  pvoxRuntimeProfile: {
    profileId: "static-world-pvox-v1",
    fidelityProfileId: "props-furniture-v1",
    capabilityProfileId: "world-editable-v1",
    geometryMode: "auto",
    requiredCapabilities: [
      "rendering", "collision", "destruction", "thermal", "moisture",
      "fluid-boundary",
    ],
    limits: {
      maximumArtifactBytes: 4 * PVOX_PAGE_SIZE_BYTES,
      maximumPages: 4,
      maximumHierarchyDepth: 8,
      maximumHierarchyNodes: 1_000,
      maximumBricks: 512,
      maximumLogicalVoxels: 262_144,
      maximumEncodedSurfaceSamples: 10_000,
      maximumSurfaceProperties: 4_096,
      maximumPhysicalPaletteRecords: 2,
      maximumPhysicalEvidenceEntries: 38,
      maximumMaterialRegions: 2,
      maximumInteriorLayers: 16,
      maximumMassPropertyRecords: 2,
      maximumBondRecords: 128,
      maximumPartitions: 32,
      maximumLodCount: 4,
      maximumCpuResidentBytes: 100_000_000,
      maximumGpuResidentBytes: 100_000_000,
    },
  },
});
```

`createPvoxAssetManifestV1`, `createVoxelTechnicalProfile`,
`createVoxelCapabilityAssessment`, `createPhysicalPropertyEvidence`,
`createPvoxFidelityEvidence`, `createPvoxEditJournal`, and
`createModelProcessingManifestV2` reconstruct and deeply freeze allow-listed
data. The processing factory binds the verified source and canonical-document
hashes, distinct compilation-input and runtime-request-profile attestations,
and binary closure to the independently validated PVOX artifact, capability
evidence, physical evidence, fidelity decision, processing closure, and assembly
closure. Every leaf and assembly has a distinct domain-separated assembly
closure attestation; a leaf hashes an empty child list rather than aliasing its
binary closure. `PVOX_HASH_DOMAINS`, `PVOX_HASH_PREIMAGE_LAYOUTS`, and the
executable preimage helpers publish the exact PVOX 1.0 section, directory,
page-set, root, evidence, confirmation, journal, and publication hash inputs.
Fixed-layout encoders reject unknown own fields, malformed tuple lengths,
non-`Uint8Array` byte payloads, shared mutable byte storage, and inputs beyond
the governed artifact, assembly, and preimage ceilings rather than silently
omitting or coercing them.
The synchronous factories cross-bind supplied digests and typed attestations.
At an authenticated trust boundary, the host must recompute each applicable
digest from the canonical preimage and verify the attestation token against its
allow-listed issuer; matching object fields alone are not cryptographic proof.

Physical evidence is localized by `(regionId, materialId, property)`. Every
material region must carry the complete high-confidence governed property set
for each advertised editable capability; inferred evidence requires signed
review, and critical density, hardness, tensile/compressive/shear strength,
fracture, interior, ignition, and melting values cannot be zero or defaulted.
Physical evidence is serialized in authoritative
region-index then governed-property order, and both the region inventory and
aggregate evidence carry domain-separated hash attestations. Edit journals
address each copy-on-write patch by
field kind, LOD, partition, hierarchy depth, Morton code, expected page index,
and expected/result page hashes. Genesis is bound to the authenticated base root;
standalone later revisions require the complete authenticated current placement
state, while chain validation derives that state after every copy-on-write step.
Insert, replace, and remove operations reject empty/no-op transitions.

`createModelCandidateV2` additionally requires the four native-PVOX review
views, native-render attestation, allowed rights decision, and one passing
attestation for every non-overridable gate. Its confirmation token subject binds
the exact v2 request and semantic assessment, candidate identity, full
provenance and normalized rights decision, source/PVOX/binary/processing/
assembly/evaluation hashes, capability evidence, ordered view hashes, fidelity
and physical evidence, and the complete native-render record. Native-render,
inventory, binary/processing/assembly/evaluation, confirmation, edit, and
publication subjects use distinct hash domains. A blocked candidate remains available
as a diagnostic result with reason codes but receives no confirmation token.
Only a low semantic score can be overridden; licensing, malware, source-format,
PVOX, fidelity, physical-property, renderer, and accessibility failures always
remain blocking. Completed staged candidates require a pointer-last promotion
receipt binding the proposal, confirmation, processing/assembly closures,
confirmation-binding hash, credits, catalog row, index snapshot, and final
immutable `ModelAssetRef`.

`VoxelTechnicalProfile.brickCount`, `logicalVoxelCapacity`, and
`encodedSurfaceSampleCount` are artifact-wide render-field totals across every
retained LOD, not LOD0-only values. Section counts exactly match the closed
static, optional bond, and optional collision registry. Advertising destruction
requires non-empty reviewed mass, bond-graph, and interior-layer records.
Durable snapshots carrying confirmation must have `updatedAt` at or after the
confirmation timestamp; their JSON Schemas enforce the same state-dependent
confirmation, promotion, terminal, and reason-code rules as the factories.

The v2 lifecycle preserves every v1 state and adds `downloading`, `importing`,
`voxelizing`, `evaluating-fidelity`, and `awaiting-material-review`.
`toLegacyModelResolutionState` supplies a deterministic projection for existing
wrappers without widening the v1 state union. Closed JSON Schema 2020-12
descriptors are exported through `MODEL_RESOLUTION_V2_JSON_SCHEMAS` for MCP and
admin packages. Each of the 14 standalone schemas has a stable versioned `$id`,
a self-contained closed `$defs` bundle, and strict Ajv 2020 coverage; runtime
consumers must still call the factories for relational/hash/chronology checks at
trust boundaries.

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
- `asset.pipeline.pvox-models.enabled`

## Related Documents

- plasius-ltd-site `docs/Design/unified-ai-asset-pipeline.md`
- plasius-ltd-site `docs/adrs/adr-0084-unified-ai-asset-pipeline-packages.md`
- plasius-ltd-site `docs/tdrs/tdr-0004-unified-ai-asset-pipeline.md`
- package `docs/adrs/adr-0002-model-resolution-contracts.md`
- package `docs/adrs/adr-0003-wgsl-shader-asset-contracts.md`
- package `docs/adrs/adr-0006-pvox-model-resolution-contracts.md`
- package `docs/tdrs/tdr-0001-wgsl-shader-asset-envelope-validation.md`
- package `docs/tdrs/tdr-0003-pvox-validation-and-confirmation-binding.md`

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

File package bugs, support requests, and implementation Tasks in
[`Plasius-LTD/asset-contracts` Issues](https://github.com/Plasius-LTD/asset-contracts/issues),
which are enabled. Report vulnerabilities privately through
[SECURITY.md](./SECURITY.md).

The organisation [Plasius-LTD-site Project](https://github.com/orgs/Plasius-LTD/projects/1)
remains the source of truth for acceptance criteria, ownership, and status.
Epics, Features, and Stories remain in the site repository; package Tasks belong
here and link to their parent Feature. Existing site issues retain their history
and links; they do not need to be moved or duplicated.

### Model resource contract follow-ups

[Feature 1153](https://github.com/Plasius-LTD/plasius-ltd-site/issues/1153) owns the
following package Tasks created by
[tracker coordination 1169](https://github.com/Plasius-LTD/plasius-ltd-site/issues/1169):

| Contract concern | Package Task |
| --- | --- |
| Model resource descriptors | [#48](https://github.com/Plasius-LTD/asset-contracts/issues/48) |
| Conversion diagnostics | [#49](https://github.com/Plasius-LTD/asset-contracts/issues/49) |
| Texture and resource roles | [#50](https://github.com/Plasius-LTD/asset-contracts/issues/50) |
| Promotion manifest resource closure | [#51](https://github.com/Plasius-LTD/asset-contracts/issues/51) |

These are follow-up qualification and implementation scopes, not new API promises
or completed functionality. Reuse the existing file descriptors, manifests,
roles, promotion records, GPU contracts, and model-resolution contracts; identify
remaining gaps before changing exports. Separate animation and shader ABI work
remains in its existing Tasks. Claim and start an active Project Task before any
implementation.

The Tasks inherit `gpu.model.conversion.enabled`, the backend remote rollout
control for canonical model adapter adoption. This tracker correction does not
change its evaluator or state. Future runtime adoption must test disabled,
enabled, and rollback paths under that Feature.
See [ADR 0008](./docs/adrs/adr-0008-package-owned-issue-tracking.md) for the tracker
decision and release implications.

## License

Apache-2.0

<!-- BEGIN PLASIUS RELEASE INTEGRITY -->
## Release integrity

CI keeps the administrative contributor registry outside Git and npm package
artifacts using exact, case-normalised path checks. CI runs on approved
self-hosted runners. Release preparation and npm publication use GitHub-hosted
runners with Node.js 24.18.0 LTS and npm 11.5.1 or newer. CD must not be
dispatched until the npm trusted-publisher binding is verified. Publication is
token-free and proceeds only while the prepared commit remains the exact
`main` head after successful push-triggered CI for that SHA. Repository release
admission scripts run in a separate credential-free job; the fresh privileged
release-preparation job disables Git hooks before creating its review PR.
<!-- END PLASIUS RELEASE INTEGRITY -->
