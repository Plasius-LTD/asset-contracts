import { canonicalizeGpuContract } from "@plasius/gpu-shader";
import { assertImmutableAssetVersion } from "./asset-version.js";
import {
  CANONICAL_MODEL_COORDINATE_SYSTEM,
  MODEL_CONFIRMATION_VIEW_KINDS,
  MODEL_CONFIRMATION_VIEW_SIZE_PX,
  MODEL_REQUEST_MAX_REVISION,
  MODEL_RESOLUTION_STATES,
  createModelAssetRef,
  createModelMatchAssessment,
  createModelProvenance,
  createModelRequestSpec,
  createModelRightsAssessment,
  type ModelAssetKind,
  type ModelAssetRef,
  type ModelBoundsMetres,
  type ModelCandidateAssetRef,
  type ModelConfirmationViews,
  type ModelDimensionsMetres,
  type ModelMatchAssessment,
  type ModelProvenance,
  type ModelRequirementPolicy,
  type ModelResolutionState,
  type ModelRightsAssessment,
  type ModelSoftPreferences,
  type ModelTransform,
} from "./model-resolution.js";

/** Additive contract revision used by PVOX-backed resolution payloads. */
export const MODEL_RESOLUTION_V2_CONTRACT_VERSION = "2026-08-20.v2" as const;

/** Version of the public PVOX asset manifest envelope. */
export const PVOX_ASSET_MANIFEST_VERSION = "plasius.pvox-asset-manifest/1" as const;

/** Version of placement-scoped PVOX edit journals. */
export const PVOX_EDIT_JOURNAL_VERSION = "plasius.pvox-edit-journal/1" as const;
export const PVOX_EDIT_JOURNAL_GENESIS_HASH = "0".repeat(64);
export const PVOX_MAX_EDIT_PATCHES = 4_096 as const;
export const PVOX_FIDELITY_PROFILE_VERSION = "1.0.0" as const;
export const PVOX_PHYSICAL_PROPERTY_POLICY_ID = "pvox-physical-properties-v1" as const;
export const PVOX_PHYSICAL_PROPERTY_POLICY_VERSION = "1.0.0" as const;
export const PVOX_NATIVE_RENDERER_ID = "gpu-renderer" as const;
export const PVOX_NATIVE_REVIEW_SETTINGS_ID = "pvox-review-v1" as const;

/** Binary PVOX format constants shared by contracts and hosted resource metadata. */
export const PVOX_FORMAT_VERSION = Object.freeze({ major: 1, minor: 0 } as const);
export const PVOX_MAGIC = "PVOX" as const;
export const PVOX_CONTENT_TYPE = "application/vnd.plasius.pvox" as const;
export const PVOX_FILE_EXTENSION = ".pvox" as const;
export const PVOX_BRICK_EDGE_VOXELS = 8 as const;
export const PVOX_PAGE_SIZE_BYTES = 65_536 as const;
export const PVOX_HEADER_BYTE_LENGTH = 256 as const;
export const PVOX_DIRECTORY_ENTRY_BYTE_LENGTH = 128 as const;
export const PVOX_SECTION_ALIGNMENT_BYTES = 256 as const;
export const PVOX_MAX_SECTIONS = 64 as const;
export const PVOX_MAX_HIERARCHY_NODES = 1_048_576 as const;
export const PVOX_MAX_RUNS_PER_BRICK = 512 as const;
export const PVOX_MAX_LOCAL_SAMPLES_PER_BRICK = 512 as const;
export const PVOX_MAX_ENCODED_BRICK_PAYLOAD_BYTES = 10_384 as const;
export const PVOX_MAX_ABSOLUTE_COORDINATE_METRES = 1_048_576 as const;
/** Conservative fixed-record lower bounds used to reject impossible manifests. */
export const PVOX_MIN_BRICK_DESCRIPTOR_BYTES = 96 as const;
/** Occupancy plus active-sample masks retained even by constant render-field bricks. */
export const PVOX_RENDER_BRICK_MASK_BYTES = 128 as const;
export const PVOX_MIN_ENCODED_SURFACE_SAMPLE_BYTES = 16 as const;
/** Collision-field samples contain the governed fixed-width signed-distance value. */
export const PVOX_MIN_ENCODED_COLLISION_SAMPLE_BYTES = 4 as const;
/** Collision bricks retain the same bounded 512-voxel occupancy/sample masks. */
export const PVOX_COLLISION_BRICK_MASK_BYTES = 128 as const;
export const PVOX_PARTITION_RECORD_BYTES = 128 as const;
export const PVOX_LOD_RECORD_BYTES = 128 as const;
export const PVOX_ROOT_RECORD_BYTES = 64 as const;
export const PVOX_LEVEL_SPAN_RECORD_BYTES = 32 as const;
export const PVOX_HIERARCHY_NODE_RECORD_BYTES = 32 as const;
export const PVOX_SURFACE_PROPERTY_RECORD_BYTES = 128 as const;
export const PVOX_PHYSICAL_PROPERTY_RECORD_BYTES = 256 as const;
export const PVOX_PHYSICAL_EVIDENCE_RECORD_BYTES = 96 as const;
export const PVOX_MATERIAL_REGION_RECORD_BYTES = 128 as const;
export const PVOX_INTERIOR_LAYER_RECORD_BYTES = 64 as const;
export const PVOX_MASS_PROPERTY_RECORD_BYTES = 128 as const;
export const PVOX_BOND_RECORD_BYTES = 32 as const;
export const PVOX_MIN_STATIC_SECTION_COUNT = 13 as const;
export const PVOX_COLLISION_SECTION_COUNT = 5 as const;
export const PVOX_PHYSICAL_REGION_INVENTORY_VERSION = "plasius.pvox-physical-region-inventory/1" as const;
/** Closed v1 page families. Field pages require scoped spatial keys; structural pages forbid them. */
export const PVOX_PAGE_KINDS = Object.freeze(["metadata", "lod-structure", "render-field", "collision-field"] as const);
/** Domain separators for the independently implemented PVOX 1.0 hash preimages. */
export const PVOX_SECTION_HASH_DOMAIN = "PVOX-SECTION-V1\0" as const;
export const PVOX_DIRECTORY_HASH_DOMAIN = "PVOX-DIRECTORY-V1\0" as const;
export const PVOX_PAGE_SET_HASH_DOMAIN = "PVOX-PAGESET-V1\0" as const;
export const PVOX_ROOT_HASH_DOMAIN = "PVOX-ROOT-V1\0" as const;
export const PVOX_BINARY_CLOSURE_HASH_DOMAIN = "PVOX-BINARY-CLOSURE-V1\0" as const;
export const PVOX_REQUEST_SEMANTIC_PROFILE_HASH_DOMAIN = "PVOX-REQUEST-SEMANTIC-PROFILE-V1\0" as const;
export const PVOX_RUNTIME_REQUEST_PROFILE_HASH_DOMAIN = "PVOX-RUNTIME-REQUEST-PROFILE-V1\0" as const;
export const PVOX_CAPABILITY_SET_HASH_DOMAIN = "PVOX-CAPABILITY-SET-V1\0" as const;
export const PVOX_PHYSICAL_INVENTORY_HASH_DOMAIN = "PVOX-PHYSICAL-INVENTORY-V1\0" as const;
export const PVOX_PHYSICAL_EVIDENCE_HASH_DOMAIN = "PVOX-PHYSICAL-EVIDENCE-V1\0" as const;
export const PVOX_RENDER_EVIDENCE_HASH_DOMAIN = "PVOX-RENDER-EVIDENCE-V1\0" as const;
export const PVOX_EVALUATION_CLOSURE_HASH_DOMAIN = "PVOX-EVALUATION-CLOSURE-V1\0" as const;
export const PVOX_PROCESSING_CLOSURE_HASH_DOMAIN = "PVOX-PROCESSING-CLOSURE-V1\0" as const;
export const PVOX_ASSEMBLY_CLOSURE_HASH_DOMAIN = "PVOX-ASSEMBLY-CLOSURE-V1\0" as const;
export const PVOX_CONFIRMATION_BINDING_HASH_DOMAIN = "PVOX-CONFIRMATION-BINDING-V1\0" as const;
export const PVOX_EDIT_OVERLAY_ROOT_HASH_DOMAIN = "PVOX-EDIT-OVERLAY-ROOT-V1\0" as const;
export const PVOX_EDIT_JOURNAL_HASH_DOMAIN = "PVOX-EDIT-JOURNAL-V1\0" as const;
export const PVOX_PUBLICATION_HASH_DOMAIN = "PVOX-PUBLICATION-V1\0" as const;
export const PVOX_HASH_DOMAINS = Object.freeze({
  section: PVOX_SECTION_HASH_DOMAIN,
  directory: PVOX_DIRECTORY_HASH_DOMAIN,
  pageSet: PVOX_PAGE_SET_HASH_DOMAIN,
  root: PVOX_ROOT_HASH_DOMAIN,
  binaryClosure: PVOX_BINARY_CLOSURE_HASH_DOMAIN,
  requestSemanticProfile: PVOX_REQUEST_SEMANTIC_PROFILE_HASH_DOMAIN,
  runtimeRequestProfile: PVOX_RUNTIME_REQUEST_PROFILE_HASH_DOMAIN,
  capabilitySet: PVOX_CAPABILITY_SET_HASH_DOMAIN,
  physicalInventory: PVOX_PHYSICAL_INVENTORY_HASH_DOMAIN,
  physicalEvidence: PVOX_PHYSICAL_EVIDENCE_HASH_DOMAIN,
  renderEvidence: PVOX_RENDER_EVIDENCE_HASH_DOMAIN,
  evaluationClosure: PVOX_EVALUATION_CLOSURE_HASH_DOMAIN,
  processingClosure: PVOX_PROCESSING_CLOSURE_HASH_DOMAIN,
  assemblyClosure: PVOX_ASSEMBLY_CLOSURE_HASH_DOMAIN,
  confirmationBinding: PVOX_CONFIRMATION_BINDING_HASH_DOMAIN,
  editOverlayRoot: PVOX_EDIT_OVERLAY_ROOT_HASH_DOMAIN,
  editJournal: PVOX_EDIT_JOURNAL_HASH_DOMAIN,
  publication: PVOX_PUBLICATION_HASH_DOMAIN,
} as const);
/** Machine-readable field order; integer fields are canonical little-endian and digests are raw 32 bytes. */
export const PVOX_HASH_PREIMAGE_LAYOUTS = Object.freeze({
  section: Object.freeze(["domain", "type:u32le", "version:u16le", "encodedLength:u64le", "exactSectionBytes"] as const),
  directory: Object.freeze(["domain", "entryCount:u16le", "entryBytes:u16le", "exactOrderedDirectoryBytes"] as const),
  pageSet: Object.freeze(["domain", "pageCount:u32le", "ordered(pageIndex:u32le,offset:u64le,length:u32le,pageSha256:raw32)"] as const),
  root: Object.freeze(["domain", "normalizedHeader:exact256bytes(sectionCount-at-12,reserved-58-59-zero,directoryHash-at-176-once,reserved-208-255-zero)", "ordered(sectionType:u32le,sectionVersion:u16le,sectionHash:raw32)"] as const),
  binaryClosure: Object.freeze(["domain", "sourceContentHash:raw32", "canonicalDocumentHash:raw32", "compilationInputHash:raw32", "runtimeRequestProfileHash:raw32", "artifactSha256:raw32", "rootHash:raw32", "directoryHash:raw32", "pageSetHash:raw32"] as const),
  requestSemanticProfile: Object.freeze(["domain", "utf8Length:u32le", "canonicalRequestProjection:rfc8785-utf8"] as const),
  runtimeRequestProfile: Object.freeze(["domain", "utf8Length:u32le", "canonicalRuntimeProfileProjection:rfc8785-utf8"] as const),
  capabilitySet: Object.freeze(["domain", "subjectBinaryClosureHash:raw32", "assessmentCount:u32le", "orderedCanonicalCapabilityAssessments:each-u32-length+rfc8785-utf8"] as const),
  physicalInventory: Object.freeze(["domain", "inventoryVersion:utf8-length-prefixed", "subjectBinaryClosureHash:raw32", "validationEvidenceHash:raw32", "entryCount:u32le", "ordered(regionIndex:u32le,physicalPaletteIndex:u32le,regionId:utf8-length-prefixed,materialId:utf8-length-prefixed)"] as const),
  physicalEvidence: Object.freeze(["domain", "physicalInventoryHash:raw32", "evidenceCount:u32le", "orderedCanonicalEvidence:each-u32-length+rfc8785-utf8"] as const),
  renderEvidence: Object.freeze(["domain", "canonicalRenderEvidenceExcludingEvidenceHashAndAttestationLength:u32le", "canonicalRenderEvidenceExcludingEvidenceHashAndAttestation:rfc8785-utf8"] as const),
  evaluationClosure: Object.freeze(["domain", "fidelityEvidenceHash:raw32", "physicalEvidenceHash:raw32", "capabilitySetHash:raw32", "renderEvidenceHash:raw32"] as const),
  processingClosure: Object.freeze(["domain", "binaryClosureHash:raw32", "requestSemanticProfileHash:raw32", "canonicalTechnicalProfileLength:u32le", "canonicalTechnicalProfile:rfc8785-utf8", "pvoxValidationEvidenceHash:raw32", "physicalInventoryValidationEvidenceHash:raw32", "capabilitySetHash:raw32", "physicalInventoryHash:raw32", "physicalEvidenceHash:raw32", "massPropertiesEvidenceHash:raw32", "bondGraphEvidenceHash:raw32", "interiorLayerEvidenceHash:raw32", "compilerEvidenceHash:raw32", "fidelityEvidenceHash:raw32"] as const),
  assemblyClosure: Object.freeze(["domain", "ownBinaryClosureHash:raw32", "childCount:u32le", "orderedCanonicalChildrenLength:u32le", "orderedCanonicalChildren:rfc8785-utf8"] as const),
  confirmationBinding: Object.freeze(["domain", "canonicalConfirmationSubjectLength:u32le", "canonicalConfirmationSubjectExcluding(bindingHash,bindingHashAttestation):rfc8785-utf8"] as const),
  editOverlayRoot: Object.freeze(["domain", "baseContentHash:raw32", "basePageSetHash:raw32", "placementId:utf8-length-prefixed", "gridVersion:utf8-length-prefixed", "expectedRevision:u64le", "resultingRevision:u64le", "previousJournalHash:raw32", "expectedRootHash:raw32", "patchCount:u32le", "orderedFullPatchAddressAndTransitions:rfc8785-each-u32-length"] as const),
  editJournal: Object.freeze(["domain", "canonicalJournalLength:u32le", "canonicalJournalExcluding(journalHash,journalHashAttestation,resultingRootHashAttestation):rfc8785-utf8"] as const),
  publication: Object.freeze(["domain", "canonicalPublicationLength:u32le", "canonicalPointerLastPublicationReceiptExcluding(publicationHash,publicationHashAttestation,publicationToken):rfc8785-utf8"] as const),
} as const);

/** Exact root hashing rule; `PVOX_ROOT_HEADER_LAYOUT_V1` exports every byte offset. */
export const PVOX_ROOT_HEADER_HASH_RULE = deepFreeze({
  rootHashStorage: "external",
  binaryClosureHashStorage: "external",
  inlineReservedByteOffset: 58,
  inlineReservedByteLength: 2,
  directoryHashByteOffset: 176,
  directoryHashByteLength: 32,
  directoryHashTreatment: "include-as-stored",
  reservedByteOffset: 208,
  reservedByteLength: 48,
  reservedByteValue: 0,
  directoryHashOccurrencesInRootPreimage: 1,
} as const);

/** Registered PVOX 1.0 section identifiers; FourCC values are encoded little-endian. */
export const PVOX_SECTION_REGISTRY = deepFreeze({
  PART: { type: 0x54524150, version: 1, recordBytes: PVOX_PARTITION_RECORD_BYTES, required: true },
  LODS: { type: 0x53444f4c, version: 1, recordBytes: PVOX_LOD_RECORD_BYTES, required: true },
  ROOT: { type: 0x544f4f52, version: 1, recordBytes: PVOX_ROOT_RECORD_BYTES, required: true },
  LEVL: { type: 0x4c56454c, version: 1, recordBytes: PVOX_LEVEL_SPAN_RECORD_BYTES, required: true },
  NODE: { type: 0x45444f4e, version: 1, recordBytes: PVOX_HIERARCHY_NODE_RECORD_BYTES, required: true },
  BRIK: { type: 0x4b495242, version: 1, recordBytes: PVOX_MIN_BRICK_DESCRIPTOR_BYTES, required: true },
  DATA: { type: 0x41544144, version: 1, recordBytes: 0, required: true },
  SURF: { type: 0x46525553, version: 1, recordBytes: PVOX_SURFACE_PROPERTY_RECORD_BYTES, required: true },
  PHYS: { type: 0x53594850, version: 1, recordBytes: PVOX_PHYSICAL_PROPERTY_RECORD_BYTES, required: true },
  PEVI: { type: 0x49564550, version: 1, recordBytes: PVOX_PHYSICAL_EVIDENCE_RECORD_BYTES, required: true },
  REGN: { type: 0x4e474552, version: 1, recordBytes: PVOX_MATERIAL_REGION_RECORD_BYTES, required: true },
  LAYR: { type: 0x5259414c, version: 1, recordBytes: PVOX_INTERIOR_LAYER_RECORD_BYTES, required: true },
  MASS: { type: 0x5353414d, version: 1, recordBytes: PVOX_MASS_PROPERTY_RECORD_BYTES, required: true },
  BOND: { type: 0x444e4f42, version: 1, recordBytes: PVOX_BOND_RECORD_BYTES, required: false },
  CROT: { type: 0x544f5243, version: 1, recordBytes: PVOX_ROOT_RECORD_BYTES, required: false },
  CLEV: { type: 0x56454c43, version: 1, recordBytes: PVOX_LEVEL_SPAN_RECORD_BYTES, required: false },
  CNOD: { type: 0x444f4e43, version: 1, recordBytes: PVOX_HIERARCHY_NODE_RECORD_BYTES, required: false },
  CBRK: { type: 0x4b524243, version: 1, recordBytes: PVOX_MIN_BRICK_DESCRIPTOR_BYTES, required: false },
  CDAT: { type: 0x54414443, version: 1, recordBytes: 0, required: false },
} as const);

/** Parent Feature rollout gate for every PVOX-backed path. */
export const PVOX_FEATURE_FLAG_ID = "asset.pipeline.pvox-models.enabled" as const;

/** Request policy for texture-free PVOX runtime artifacts. */
export const PVOX_MODEL_REQUEST_POLICY_ID = "pvox-world-v1" as const;

/** Governed PVOX fidelity profiles exposed to requesters. */
export const PVOX_FIDELITY_PROFILE_IDS = Object.freeze([
  "precision-hero-v1",
  "props-furniture-v1",
  "rocks-organic-shells-v1",
  "buildings-v1",
  "deformable-v1",
] as const);

/** Named runtime capability profiles; providers cannot define new values. */
export const PVOX_RUNTIME_CAPABILITY_PROFILE_IDS = Object.freeze([
  "static-render-v1",
  "world-editable-v1",
  "deformable-v1",
] as const);

/** Existing OAuth capabilities reused by PVOX MCP tools and resources. */
export const PVOX_REQUIRED_OAUTH_CAPABILITIES = Object.freeze([
  "asset.catalog.request",
  "asset.catalog.confirm",
  "asset.catalog.review",
  "asset.source.manage",
  "asset.pipeline.mcp.manage",
] as const);

/** Fail-closed default ceilings for one PVOX artifact and its public evidence. */
export const PVOX_DEFAULT_LIMITS = Object.freeze({
  maximumArtifactBytes: 164 * 1024 * 1024,
  maximumPages: 2_624,
  maximumHierarchyDepth: 8,
  maximumBricks: 524_288,
  maximumLogicalVoxels: 268_435_456,
  maximumEncodedSurfaceSamples: 8_388_608,
  maximumHierarchyNodes: PVOX_MAX_HIERARCHY_NODES,
  maximumSurfaceProperties: 65_536,
  maximumPartitions: 256,
  maximumLodCount: 4,
  maximumCpuResidentBytes: 512 * 1024 * 1024,
  maximumGpuResidentBytes: 512 * 1024 * 1024,
  maximumPhysicalProperties: 64,
  maximumPhysicalEvidenceEntries: 64 * 19,
  maximumMaterialRegions: 64,
  maximumInteriorLayers: 1_024,
  maximumMassPropertyRecords: 256,
  maximumBondRecords: 524_288,
  maximumAssemblyChildren: 256,
} as const);

/** Source-only acquisition/decode ceilings. These never become runtime texture budgets. */
export const PVOX_DEFAULT_SOURCE_INGESTION_LIMITS = Object.freeze({
  maximumDownloadBytes: 512 * 1024 * 1024,
  maximumExpandedBytes: 2 * 1024 * 1024 * 1024,
  maximumArchiveEntries: 10_000,
  maximumSourceFiles: 20_000,
  maximumDecodedTextureBytes: 512 * 1024 * 1024,
  maximumTextureDimensionPx: 16_384,
} as const);

/** Exact v2 lifecycle, retaining every v1 state and adding PVOX progress. */
export const MODEL_RESOLUTION_V2_STATES = Object.freeze([
  "searching-catalog",
  "searching-providers",
  "awaiting-provider-auth",
  "downloading",
  "quarantining",
  "importing",
  "processing",
  "voxelizing",
  "evaluating-fidelity",
  "awaiting-material-review",
  "rendering",
  "evaluating",
  "awaiting-rights-review",
  "awaiting-confirmation",
  "promoting",
  "completed",
  "unresolved",
  "failed",
  "cancelled",
] as const);

export type ModelResolutionStateV2 = typeof MODEL_RESOLUTION_V2_STATES[number];

/** Deterministic projection used only by v1 compatibility wrappers. */
export const MODEL_RESOLUTION_V2_COMPATIBILITY_STATES: Readonly<
  Record<ModelResolutionStateV2, ModelResolutionState>
> = Object.freeze({
  "searching-catalog": "searching-catalog",
  "searching-providers": "searching-providers",
  "awaiting-provider-auth": "awaiting-provider-auth",
  downloading: "searching-providers",
  quarantining: "quarantining",
  importing: "processing",
  processing: "processing",
  voxelizing: "processing",
  "evaluating-fidelity": "evaluating",
  "awaiting-material-review": "evaluating",
  rendering: "rendering",
  evaluating: "evaluating",
  "awaiting-rights-review": "awaiting-rights-review",
  "awaiting-confirmation": "awaiting-confirmation",
  promoting: "promoting",
  completed: "completed",
  unresolved: "unresolved",
  failed: "failed",
  cancelled: "cancelled",
});

/** Runtime capabilities independently admitted by one PVOX artifact. */
export const PVOX_CAPABILITIES = Object.freeze([
  "rendering",
  "collision",
  "destruction",
  "thermal",
  "moisture",
  "fluid-boundary",
  "deformation",
  "animation",
  "volume",
] as const);

export type PvoxCapability = typeof PVOX_CAPABILITIES[number];
export type PvoxCapabilityStatus = "supported" | "unsupported" | "not-applicable";
export type PvoxGeometryMode = "solid" | "shell" | "mixed";
export type PvoxRequestedGeometryMode = PvoxGeometryMode | "auto";
export type PvoxFidelityProfileId = typeof PVOX_FIDELITY_PROFILE_IDS[number];
export type PvoxRuntimeCapabilityProfileId = typeof PVOX_RUNTIME_CAPABILITY_PROFILE_IDS[number];

/** Mesh/archive/texture budgets used only while a provider source is quarantined. */
export interface ModelSourceIngestionLimitsV2 {
  readonly maximumDownloadBytes: number;
  readonly maximumExpandedBytes: number;
  readonly maximumArchiveEntries: number;
  readonly maximumSourceFiles: number;
  readonly maximumDecodedTextureBytes: number;
  readonly maximumTextureDimensionPx: number;
}

/** Runtime-only, artifact-wide PVOX ceilings. Texture and triangle fields are intentionally absent. */
export interface PvoxRuntimeLimitsV1 {
  readonly maximumArtifactBytes: number;
  readonly maximumPages: number;
  readonly maximumHierarchyDepth: number;
  readonly maximumHierarchyNodes: number;
  readonly maximumBricks: number;
  readonly maximumLogicalVoxels: number;
  readonly maximumEncodedSurfaceSamples: number;
  readonly maximumSurfaceProperties: number;
  readonly maximumPhysicalPaletteRecords: number;
  readonly maximumPhysicalEvidenceEntries: number;
  readonly maximumMaterialRegions: number;
  readonly maximumInteriorLayers: number;
  readonly maximumMassPropertyRecords: number;
  readonly maximumBondRecords: number;
  readonly maximumPartitions: number;
  readonly maximumLodCount: number;
  readonly maximumCpuResidentBytes: number;
  readonly maximumGpuResidentBytes: number;
}

/** Governed PVOX representation, fidelity, capability and runtime-budget request. */
export interface PvoxRuntimeRequestProfileV1 {
  readonly profileId: string;
  readonly fidelityProfileId: PvoxFidelityProfileId;
  readonly capabilityProfileId: PvoxRuntimeCapabilityProfileId;
  readonly geometryMode: PvoxRequestedGeometryMode;
  readonly requiredCapabilities: readonly PvoxCapability[];
  readonly limits: PvoxRuntimeLimitsV1;
}

/** Technical constraints that remain meaningful after texture-free voxel compilation. */
export interface ModelHardConstraintsV2 {
  readonly boundsMetres?: ModelBoundsMetres;
  readonly dimensionsMetres?: ModelDimensionsMetres;
  readonly collision?: ModelRequirementPolicy;
  readonly partition?: "single" | "allowed" | "required";
}

/**
 * Normalized request for the PVOX pipeline.
 *
 * Source-ingestion limits are deliberately independent from immutable PVOX runtime
 * limits so an ingestion texture budget can never be interpreted as a runtime one.
 */
export interface ModelRequestSpecV2 {
  readonly contractVersion: typeof MODEL_RESOLUTION_V2_CONTRACT_VERSION;
  readonly policyProfileId: typeof PVOX_MODEL_REQUEST_POLICY_ID;
  readonly requestSemanticProfileHash: string;
  readonly query: string;
  readonly revision: number;
  readonly locale?: string;
  readonly rankerId?: string;
  readonly hardConstraints: ModelHardConstraintsV2;
  readonly softPreferences: ModelSoftPreferences;
  readonly exclusions: readonly string[];
  readonly sourceIngestionLimits: ModelSourceIngestionLimitsV2;
  readonly pvoxRuntimeProfile: PvoxRuntimeRequestProfileV1;
}

/** Hard gates that semantic confidence can never override. Rights remain separate. */
export const PVOX_NON_OVERRIDABLE_GATE_KINDS = Object.freeze([
  "malware-scan",
  "source-format-validation",
  "pvox-validation",
  "fidelity-validation",
  "physical-property-validation",
  "renderer-validation",
  "accessibility-review",
] as const);

export type PvoxNonOverridableGateKind = typeof PVOX_NON_OVERRIDABLE_GATE_KINDS[number];

/** Physical fields that may be retained with localized PVOX material regions. */
export const PVOX_PHYSICAL_PROPERTIES = Object.freeze([
  "density",
  "hardness",
  "tensile-strength",
  "compressive-strength",
  "shear-strength",
  "fracture-energy",
  "friction",
  "restitution",
  "thermal-conductivity",
  "heat-capacity",
  "thermal-expansion",
  "ignition-temperature",
  "melting-temperature",
  "porosity",
  "permeability",
  "moisture-response",
  "flammability",
  "corrosion-rate",
  "interior-thickness",
] as const);

export type PhysicalPropertyKind = typeof PVOX_PHYSICAL_PROPERTIES[number];
export type PhysicalPropertyProvenance = "source" | "authored" | "derived" | "inferred" | "default";

export interface PvoxAuthenticatedResourceMetadata {
  readonly uri: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly contentType: typeof PVOX_CONTENT_TYPE;
  readonly authenticated: true;
}

export interface PvoxPageSpatialKey {
  readonly lodLevel: PvoxLodLevel;
  readonly partitionIndex: number;
  readonly hierarchyDepth: number;
  readonly minimumMortonCode: string;
  readonly maximumMortonCode: string;
}

export interface PvoxPageRecord {
  readonly pageIndex: number;
  readonly pageKind: typeof PVOX_PAGE_KINDS[number];
  readonly byteOffset: number;
  readonly byteLength: number;
  readonly decodedByteLength: number;
  readonly sha256: string;
  readonly spatialKey?: PvoxPageSpatialKey;
}

export type PvoxLodLevel = 0 | 1 | 2 | 3;

export interface PvoxLodRecord {
  readonly level: PvoxLodLevel;
  readonly firstPageIndex: number;
  readonly pageCount: number;
  readonly brickCount: number;
  readonly cellSizeMetres: number;
  readonly maximumSurfaceErrorMetres: number;
  readonly p99SurfaceErrorMetres: number;
  readonly silhouetteIou: number;
  readonly maximumContourDisplacementPx: number;
  readonly renderedSsim: number;
  readonly p95DeltaE2000: number;
  readonly normalizedMaterialError: number;
}

/** Public authenticated metadata for one immutable PVOX binary closure. */
export interface PvoxAssetManifestV1 {
  readonly manifestVersion: typeof PVOX_ASSET_MANIFEST_VERSION;
  readonly representation: "pvox";
  readonly formatVersion: typeof PVOX_FORMAT_VERSION;
  readonly contentType: typeof PVOX_CONTENT_TYPE;
  readonly fileExtension: typeof PVOX_FILE_EXTENSION;
  readonly magic: typeof PVOX_MAGIC;
  readonly brickEdgeVoxels: typeof PVOX_BRICK_EDGE_VOXELS;
  readonly pageSizeBytes: typeof PVOX_PAGE_SIZE_BYTES;
  readonly geometryMode: PvoxGeometryMode;
  readonly sourceContentHash: string;
  readonly canonicalDocumentHash: string;
  readonly rootHash: string;
  readonly directoryHash: string;
  readonly pageSetHash: string;
  readonly binaryClosureHash: string;
  readonly validationEvidenceHash: string;
  readonly compilationInputHash: string;
  readonly runtimeRequestProfileHash: string;
  readonly headerByteLength: typeof PVOX_HEADER_BYTE_LENGTH;
  readonly directoryEntryByteLength: typeof PVOX_DIRECTORY_ENTRY_BYTE_LENGTH;
  readonly sectionCount: number;
  readonly maximumRunsPerBrick: typeof PVOX_MAX_RUNS_PER_BRICK;
  readonly maximumLocalSamplesPerBrick: typeof PVOX_MAX_LOCAL_SAMPLES_PER_BRICK;
  readonly maximumEncodedBrickPayloadBytes: typeof PVOX_MAX_ENCODED_BRICK_PAYLOAD_BYTES;
  readonly coordinateSystem: typeof CANONICAL_MODEL_COORDINATE_SYSTEM;
  readonly boundsMetres: ModelBoundsMetresV2;
  readonly artifact: PvoxAuthenticatedResourceMetadata;
  readonly pages: readonly PvoxPageRecord[];
  readonly lods: readonly PvoxLodRecord[];
}

export type PvoxAssetManifest = PvoxAssetManifestV1;

export interface ModelBoundsMetresV2 {
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
}

export interface ModelDimensionsMetresV2 {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
}

/** PVOX runtime facts that intentionally contain no triangle or texture fields. */
export interface VoxelTechnicalProfile {
  readonly boundsMetres: ModelBoundsMetresV2;
  readonly dimensionsMetres: ModelDimensionsMetresV2;
  readonly geometryMode: PvoxGeometryMode;
  readonly artifactByteLength: number;
  readonly pageCount: number;
  /** Sum of render bricks across every retained spatial LOD in the artifact. */
  readonly brickCount: number;
  /** Artifact-wide render capacity; exactly `brickCount * 8 * 8 * 8`. */
  readonly logicalVoxelCapacity: number;
  /** Sum of encoded render-field surface samples across every retained LOD. */
  readonly encodedSurfaceSampleCount: number;
  readonly surfacePropertyCount: number;
  readonly sectionCount: number;
  readonly levelSpanRecordCount: number;
  readonly physicalPaletteRecordCount: number;
  readonly physicalEvidenceRecordCount: number;
  readonly materialRegionCount: number;
  readonly interiorLayerRecordCount: number;
  readonly massPropertyRecordCount: number;
  readonly bondRecordCount: number;
  readonly collisionHierarchyNodeCount: number;
  readonly collisionBrickCount: number;
  readonly collisionLogicalVoxelCapacity: number;
  readonly collisionEncodedSurfaceSampleCount: number;
  readonly hierarchyDepth: number;
  readonly hierarchyNodeCount: number;
  readonly lodCount: number;
  readonly cpuResidentByteLength: number;
  readonly gpuResidentByteLength: number;
  readonly hasCollision: boolean;
  readonly partitionCount: number;
  readonly maximumPartitionExtentMetres: number;
  readonly maximumPartitionDiagonalMetres: number;
}

/** One independently evaluated runtime capability. */
export interface VoxelCapabilityAssessment {
  readonly capability: PvoxCapability;
  readonly status: PvoxCapabilityStatus;
  readonly evaluatorId: string;
  readonly evaluatorVersion: string;
  readonly subjectContentHash: string;
  readonly evidenceHash: string;
  readonly reasonCodes: readonly string[];
  readonly evaluatedAt: string;
}

/** One localized physical value with explicit origin and review evidence. */
export interface PhysicalPropertyEvidence {
  readonly property: PhysicalPropertyKind;
  readonly value: number;
  readonly unit: string;
  readonly provenance: PhysicalPropertyProvenance;
  readonly confidence: number;
  readonly subjectContentHash: string;
  readonly regionId: string;
  readonly materialId: string;
  readonly policyId: typeof PVOX_PHYSICAL_PROPERTY_POLICY_ID;
  readonly policyVersion: typeof PVOX_PHYSICAL_PROPERTY_POLICY_VERSION;
  readonly evidenceHash: string;
  readonly reviewedBy?: string;
  readonly reviewedAt?: string;
  readonly reviewToken?: string;
}

export interface PvoxPhysicalRegionInventoryEntry {
  readonly regionIndex: number;
  readonly physicalPaletteIndex: number;
  readonly regionId: string;
  readonly materialId: string;
}

/** Validator-attested authoritative material-region inventory read from PVOX REGN/PHYS records. */
export interface PvoxPhysicalRegionInventoryV1 {
  readonly inventoryVersion: typeof PVOX_PHYSICAL_REGION_INVENTORY_VERSION;
  readonly subjectContentHash: string;
  readonly inventoryHash: string;
  readonly inventoryHashAttestation: PvoxHashAttestation;
  readonly validationEvidenceHash: string;
  readonly entries: readonly PvoxPhysicalRegionInventoryEntry[];
}

export type PvoxReviewedStructuralEvidenceKind = "mass-properties" | "bond-graph" | "interior-layers";

export interface PvoxReviewedStructuralEvidence {
  readonly kind: PvoxReviewedStructuralEvidenceKind;
  readonly subjectContentHash: string;
  readonly physicalInventoryHash: string;
  readonly recordCount: number;
  readonly evidenceHash: string;
  readonly reviewerId: string;
  readonly reviewedAt: string;
  readonly reviewToken: string;
}

/** Structurally cross-bound digest evidence; token verification remains an authenticated host responsibility. */
export interface PvoxHashAttestation {
  readonly algorithm: "sha256";
  readonly domain: typeof PVOX_HASH_DOMAINS[keyof typeof PVOX_HASH_DOMAINS];
  readonly digest: string;
  readonly attestationToken: string;
}

/** V1 assessment plus the exact normalized V2 request subject ranked by that assessment. */
export type PvoxModelMatchAssessmentV2 = ModelMatchAssessment & Readonly<{
  requestSemanticProfileHash: string;
  requestSemanticProfileCanonical: string;
  evidenceHash: string;
}>;

/** Immutable comparison of PVOX output with the verified canonical document. */
export interface PvoxFidelityEvidence {
  readonly profileId: PvoxFidelityProfileId;
  readonly surfaceProfileId: Exclude<PvoxFidelityProfileId, "deformable-v1">;
  readonly profileVersion: typeof PVOX_FIDELITY_PROFILE_VERSION;
  readonly outcome: "passed" | "blocked";
  readonly canonicalDocumentHash: string;
  readonly pvoxBinaryClosureHash: string;
  readonly evaluatedDiagonalMetres: number;
  readonly lod0CellSizeMetres: number;
  readonly maximumAllowedSurfaceErrorMetres: number;
  readonly maximumSurfaceErrorMetres: number;
  readonly p99AllowedSurfaceErrorMetres: number;
  readonly p99SurfaceErrorMetres: number;
  readonly minimumSilhouetteIou: number;
  readonly silhouetteIou: number;
  readonly maximumAllowedContourDisplacementPx: number;
  readonly maximumContourDisplacementPx: number;
  readonly minimumRenderedSsim: number;
  readonly renderedSsim: number;
  readonly maximumP95DeltaE2000: number;
  readonly p95DeltaE2000: number;
  readonly maximumNormalizedMaterialError: number;
  readonly normalizedMaterialError: number;
  readonly evidenceHash: string;
  readonly evaluatedAt: string;
  readonly decisionToken: string;
}

export type PvoxEditOperation = "insert" | "replace" | "remove";

export interface PvoxBrickPatchDescriptor {
  readonly fieldKind: "render-field" | "collision-field";
  readonly lodLevel: PvoxLodLevel;
  readonly partitionIndex: number;
  readonly hierarchyDepth: number;
  readonly mortonCode: string;
  readonly expectedPageIndex: number;
  readonly expectedPageHash: string;
  readonly operation: PvoxEditOperation;
  readonly expectedBrickHash: string;
  readonly resultingBrickHash: string;
  readonly resultingPageHash: string;
}

/** Placement-scoped, sequential copy-on-write mutation journal. */
export interface PvoxEditJournal {
  readonly journalVersion: typeof PVOX_EDIT_JOURNAL_VERSION;
  readonly baseContentHash: string;
  readonly basePageSetHash: string;
  readonly placementId: string;
  readonly gridVersion: string;
  readonly operationId: string;
  readonly expectedRevision: number;
  readonly resultingRevision: number;
  readonly previousJournalHash: string;
  readonly expectedRootHash: string;
  readonly resultingRootHash: string;
  readonly resultingRootHashAttestation: PvoxHashAttestation;
  readonly patches: readonly PvoxBrickPatchDescriptor[];
  readonly dirtyBoundsMetres: ModelBoundsMetresV2;
  readonly massDeltaKg: number;
  readonly journalHash: string;
  readonly journalHashAttestation: PvoxHashAttestation;
  readonly recordedAt: string;
}

/** Authenticated placement state required to validate a standalone non-genesis CAS edit. */
export interface PvoxEditJournalCurrentState {
  readonly baseContentHash: string;
  readonly basePageSetHash: string;
  readonly placementId: string;
  readonly gridVersion: string;
  readonly revision: number;
  readonly rootHash: string;
  readonly latestJournalHash: string;
  readonly pageHashes: readonly Readonly<{ pageIndex: number; sha256: string }>[];
}

export interface PvoxCompilerEvidence {
  readonly compilerId: string;
  readonly compilerVersion: string;
  readonly sourceFormat: string;
  readonly sourceContentHash: string;
  readonly canonicalDocumentHash: string;
  readonly compilationInputHash: string;
  readonly runtimeRequestProfileHash: string;
  readonly outputContentHash: string;
  readonly evidenceHash: string;
  readonly compiledAt: string;
}

export interface PvoxGateEvidence {
  readonly kind: PvoxNonOverridableGateKind;
  readonly outcome: "passed" | "blocked";
  readonly validatorId: string;
  readonly validatorVersion: string;
  readonly subjectContentHash: string;
  readonly evidenceHash: string;
  readonly reasonCodes: readonly string[];
  readonly evaluatedAt: string;
  readonly attestationToken: string;
}

export interface PvoxCatalogAssemblyChildRef {
  readonly disposition: "existing";
  readonly representation: "pvox";
  readonly asset: ModelAssetRef;
  readonly processingManifestId: string;
  readonly processingClosureHash: string;
  readonly binaryClosureHash: string;
  readonly processingManifestUri: string;
}

export interface PvoxStagedAssemblyChildRef {
  readonly disposition: "staged-derived";
  readonly representation: "pvox";
  readonly derivedId: string;
  readonly kind: "leaf";
  readonly contentHash: string;
  readonly binaryClosureHash: string;
  readonly processingClosureHash: string;
  readonly processingManifestId: string;
  readonly processingManifestUri: string;
}

export interface PvoxAssemblyChild {
  readonly instanceId: string;
  readonly parentInstanceId?: string;
  readonly assetRef: PvoxCatalogAssemblyChildRef | PvoxStagedAssemblyChildRef;
  readonly transform: ModelTransform;
}

/** Additive PVOX-only processing manifest. The GLB v1 manifest is unchanged. */
export interface ModelProcessingManifestV2 {
  readonly contractVersion: typeof MODEL_RESOLUTION_V2_CONTRACT_VERSION;
  readonly representation: "pvox";
  readonly manifestId: string;
  readonly resolutionId: string;
  readonly candidateId: string;
  readonly kind: ModelAssetKind;
  readonly requestProfileId: string;
  readonly requestSemanticProfileHash: string;
  readonly capabilityProfileId: PvoxRuntimeCapabilityProfileId;
  readonly contentHash: string;
  readonly binaryClosureHash: string;
  readonly processingClosureHash: string;
  readonly processingClosureAttestation: PvoxHashAttestation;
  readonly assemblyClosureHash: string;
  readonly assemblyClosureAttestation: PvoxHashAttestation;
  readonly compilationInputHash: string;
  readonly runtimeRequestProfileHash: string;
  readonly coordinateSystem: typeof CANONICAL_MODEL_COORDINATE_SYSTEM;
  readonly pvox: PvoxAssetManifestV1;
  readonly technicalProfile: VoxelTechnicalProfile;
  readonly requiredCapabilities: readonly PvoxCapability[];
  readonly capabilities: readonly VoxelCapabilityAssessment[];
  readonly capabilityEvidenceSetHash: string;
  readonly capabilityEvidenceSetAttestation: PvoxHashAttestation;
  readonly physicalRegionInventory: PvoxPhysicalRegionInventoryV1;
  readonly physicalProperties: readonly PhysicalPropertyEvidence[];
  readonly physicalEvidenceHash: string;
  readonly physicalEvidenceAttestation: PvoxHashAttestation;
  readonly massPropertiesEvidence: PvoxReviewedStructuralEvidence;
  readonly bondGraphEvidence: PvoxReviewedStructuralEvidence;
  readonly interiorLayerEvidence: PvoxReviewedStructuralEvidence;
  readonly converter: PvoxCompilerEvidence;
  readonly fidelity: PvoxFidelityEvidence;
  readonly children: readonly PvoxAssemblyChild[];
  readonly processedAt: string;
}

export interface PvoxRenderEvidence {
  readonly renderId: string;
  readonly representation: "pvox";
  readonly lodLevel: 0;
  readonly traversalBackend: "native-pvox";
  readonly rendererId: typeof PVOX_NATIVE_RENDERER_ID;
  readonly rendererVersion: string;
  readonly rendererQualificationHash: string;
  readonly settingsId: typeof PVOX_NATIVE_REVIEW_SETTINGS_ID;
  readonly settingsVersion: string;
  readonly cameraQualificationHash: string;
  readonly processingManifestId: string;
  readonly processingClosureHash: string;
  readonly pvoxContentHash: string;
  readonly pvoxRootHash: string;
  readonly pvoxDirectoryHash: string;
  readonly pvoxPageSetHash: string;
  readonly viewSha256s: readonly [string, string, string, string];
  readonly renderedAt: string;
  readonly evidenceHash: string;
  readonly evidenceHashAttestation: PvoxHashAttestation;
}

/** Exact subject covered by a backend-issued candidate confirmation token. */
export interface ModelCandidateConfirmationBindingV2 {
  readonly bindingHash: string;
  readonly bindingHashAttestation: PvoxHashAttestation;
  readonly resolutionId: string;
  readonly requesterId: string;
  readonly request: ModelRequestSpecV2;
  readonly requestSemanticProfileHash: string;
  readonly requestRevision: number;
  readonly candidateId: string;
  readonly candidateContentHash: string;
  readonly candidateAssetRef: ModelCandidateAssetRef;
  readonly match: PvoxModelMatchAssessmentV2;
  readonly provenance: ModelProvenance;
  readonly rights: ModelRightsAssessment;
  readonly sourceContentHash: string;
  readonly binaryClosureHash: string;
  readonly pvoxRootHash: string;
  readonly pvoxDirectoryHash: string;
  readonly pvoxPageSetHash: string;
  readonly compilationInputHash: string;
  readonly runtimeRequestProfileHash: string;
  readonly processingClosureHash: string;
  readonly assemblyClosureHash: string;
  readonly evaluationClosureHash: string;
  readonly capabilityEvidenceSetHash: string;
  readonly hardGates: readonly PvoxGateEvidence[];
  readonly viewSha256s: readonly [string, string, string, string];
  readonly rightsDecisionId: string;
  readonly fidelityEvidenceHash: string;
  readonly physicalEvidenceHash: string;
  readonly rendererId: string;
  readonly rendererVersion: string;
  readonly rendererEvidenceHash: string;
  readonly renderEvidence: PvoxRenderEvidence;
}

interface ModelCandidateV2Base {
  readonly contractVersion: typeof MODEL_RESOLUTION_V2_CONTRACT_VERSION;
  readonly resolutionId: string;
  readonly requesterId: string;
  readonly candidateId: string;
  readonly request: ModelRequestSpecV2;
  readonly assetRef: ModelCandidateAssetRef;
  readonly match: PvoxModelMatchAssessmentV2;
  readonly provenance: ModelProvenance;
  readonly rights: ModelRightsAssessment;
  readonly processingManifest: ModelProcessingManifestV2;
  readonly views: ModelConfirmationViews;
  readonly renderEvidence: PvoxRenderEvidence;
  readonly evaluationClosureHash: string;
  readonly evaluationClosureAttestation: PvoxHashAttestation;
  readonly hardGates: readonly PvoxGateEvidence[];
}

export interface ConfirmableModelCandidateV2 extends ModelCandidateV2Base {
  readonly admissionStatus: "confirmable";
  readonly confirmationBinding: ModelCandidateConfirmationBindingV2;
  readonly confirmationToken: string;
  readonly confirmationRequired: true;
}

export interface DiagnosticModelCandidateV2 extends ModelCandidateV2Base {
  readonly admissionStatus: "diagnostic";
  readonly blockingReasonCodes: readonly string[];
  readonly confirmationRequired: false;
}

export type ModelCandidateV2 = ConfirmableModelCandidateV2 | DiagnosticModelCandidateV2;

export interface ModelCandidateConfirmationV2 {
  readonly contractVersion: typeof MODEL_RESOLUTION_V2_CONTRACT_VERSION;
  readonly confirmationId: string;
  readonly resolutionId: string;
  readonly requesterId: string;
  readonly candidateId: string;
  readonly confirmationToken: string;
  readonly confirmationBindingHash: string;
  readonly viewSha256s: readonly [string, string, string, string];
  readonly confirmedBy: string;
  readonly confirmedAt: string;
  readonly semanticRiskAccepted: boolean;
}

export interface ModelPromotionReceiptV2 {
  readonly contractVersion: typeof MODEL_RESOLUTION_V2_CONTRACT_VERSION;
  readonly promotionId: string;
  readonly resolutionId: string;
  readonly requesterId: string;
  readonly candidateId: string;
  readonly proposalId: string;
  readonly candidateAssetRef: ModelCandidateAssetRef;
  readonly confirmationId: string;
  readonly confirmationBindingHash: string;
  readonly processingManifestId: string;
  readonly processingContentHash: string;
  readonly processingClosureHash: string;
  readonly assemblyClosureHash: string;
  readonly assemblyChildClosureHashes: readonly string[];
  readonly finalAssetRef: ModelAssetRef;
  readonly creditsRecordHash: string;
  readonly catalogRowHash: string;
  readonly indexSnapshotHash: string;
  readonly catalogPointerEtag: string;
  readonly indexPointerEtag: string;
  readonly publicationState: "pointer-last-complete";
  readonly creditsWrittenAt: string;
  readonly catalogRowWrittenAt: string;
  readonly indexSnapshotWrittenAt: string;
  readonly pointerPublishedAt: string;
  readonly publicationHash: string;
  readonly publicationHashAttestation: PvoxHashAttestation;
  readonly promotedAt: string;
  readonly publicationToken: string;
}

export interface ModelRefinementQuestionV2 {
  readonly questionId: string;
  readonly prompt: string;
  readonly reasonCodes: readonly string[];
}

export interface ModelResolutionV2 {
  readonly contractVersion: typeof MODEL_RESOLUTION_V2_CONTRACT_VERSION;
  readonly resolutionId: string;
  readonly requesterId: string;
  readonly request: ModelRequestSpecV2;
  readonly attempts: number;
  readonly state: ModelResolutionStateV2;
  readonly compatibilityState: ModelResolutionState;
  readonly candidates: readonly ModelCandidateV2[];
  readonly bestCandidate?: ModelCandidateV2;
  readonly confirmation?: ModelCandidateConfirmationV2;
  readonly promotionReceipt?: ModelPromotionReceiptV2;
  readonly refinementQuestions: readonly ModelRefinementQuestionV2[];
  readonly finalAssetRef?: ModelAssetRef;
  readonly stateReasonCode?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

type UnknownRecord = Record<string, unknown>;

const SHA256 = /^[a-f0-9]{64}$/u;
const TOKEN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;
const PATH_SEGMENT = /^(?!\.{1,2}$)[A-Za-z0-9][A-Za-z0-9._~-]{0,127}$/u;
const ATTESTATION = /^[A-Za-z0-9_-]{32,256}$/u;
const REASON_CODE = /^[a-z0-9][a-z0-9._:-]{0,127}$/u;
const MORTON_CODE = /^[a-f0-9]{16}$/u;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
const PVOX_RESOLUTION_RESOURCE = /^mcp:\/\/models\/resolutions\/([A-Za-z0-9._~-]{1,128})\/candidates\/([A-Za-z0-9._~-]{1,128})\/artifacts\/sha256\/([a-f0-9]{64})\.pvox$/u;
const PVOX_CATALOG_RESOURCE = /^mcp:\/\/models\/catalog\/([a-z0-9]+(?:-[a-z0-9]+)*)\/versions\/([A-Za-z0-9][A-Za-z0-9._-]{0,127})\/artifacts\/sha256\/([a-f0-9]{64})\.pvox$/u;
const DIRECT_URL = /(?:https?:\/\/|\bwww\.)/iu;

function hasUnsafeControlCharacters(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f
      || (codePoint >= 0x7f && codePoint <= 0x9f)
      || codePoint === 0x2028
      || codePoint === 0x2029;
  });
}

function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== "object") return value;
  const object = value as object;
  if (seen.has(object)) return value;
  seen.add(object);
  for (const child of Object.values(value as UnknownRecord)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function asRecord(value: unknown, fieldName: string): UnknownRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${fieldName} must be a plain object.`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${fieldName} must be a plain object.`);
  }
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) {
    throw new Error(`${fieldName} must contain enumerable string-keyed data properties only.`);
  }
  for (const key of keys as string[]) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) {
      throw new Error(`${fieldName} must contain enumerable string-keyed data properties only.`);
    }
  }
  return value as UnknownRecord;
}

function exactKeys(record: UnknownRecord, allowed: readonly string[], fieldName: string): void {
  const set = new Set(allowed);
  const unsupported = Object.keys(record).find((key) => !set.has(key));
  if (unsupported !== undefined) throw new Error(`${fieldName} contains an unsupported field.`);
}

function asDenseArray(value: unknown, fieldName: string, minimum: number, maximum: number): readonly unknown[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    throw new Error(`${fieldName} must be a bounded dense array.`);
  }
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key === "symbol" || (key !== "length" && !/^(?:0|[1-9]\d*)$/u.test(key)))) {
    throw new Error(`${fieldName} must be a bounded dense array of data elements.`);
  }
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) {
      throw new Error(`${fieldName} must be a bounded dense array of data elements.`);
    }
  }
  return value;
}

function assertDataOnlyTree(value: unknown, fieldName: string, seen = new WeakSet<object>(), depth = 0): void {
  if (value === null || typeof value !== "object") return;
  if (depth > 32) throw new Error(`${fieldName} data nesting exceeds the contract limit.`);
  if (seen.has(value)) throw new Error(`${fieldName} must not contain cyclic data.`);
  seen.add(value);
  if (Array.isArray(value)) {
    const entries = asDenseArray(value, fieldName, 0, 10_000);
    for (let index = 0; index < entries.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index))!;
      assertDataOnlyTree(descriptor.value, `${fieldName}[${index}]`, seen, depth + 1);
    }
  } else {
    const record = asRecord(value, fieldName);
    for (const key of Object.keys(record)) {
      const descriptor = Object.getOwnPropertyDescriptor(record, key)!;
      assertDataOnlyTree(descriptor.value, `${fieldName}.${key}`, seen, depth + 1);
    }
  }
  seen.delete(value);
}

function requireString(value: unknown, fieldName: string, maximum = 512): string {
  if (
    typeof value !== "string"
    || value.length === 0
    || value.length > maximum
    || value.trim() !== value
    || hasUnsafeControlCharacters(value)
  ) throw new Error(`${fieldName} must be a bounded safe string.`);
  return value;
}

function requireToken(value: unknown, fieldName: string): string {
  const output = requireString(value, fieldName, 128);
  if (!TOKEN.test(output) || DIRECT_URL.test(output)) throw new Error(`${fieldName} must be a bounded token.`);
  return output;
}

function requirePathSegment(value: unknown, fieldName: string): string {
  const output = requireString(value, fieldName, 128);
  if (!PATH_SEGMENT.test(output)) throw new Error(`${fieldName} must be a safe path segment.`);
  return output;
}

function requireReasonCode(value: unknown, fieldName: string): string {
  const output = requireString(value, fieldName, 128);
  if (!REASON_CODE.test(output)) throw new Error(`${fieldName} must be a reason code.`);
  return output;
}

function requireSha256(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) throw new Error(`${fieldName} must be a lowercase SHA-256 digest.`);
  return value;
}

function requireAttestation(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !ATTESTATION.test(value)) throw new Error(`${fieldName} must be a bounded attestation token.`);
  return value;
}

function requireInteger(value: unknown, fieldName: string, minimum: number, maximum: number): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new Error(`${fieldName} must be an integer from ${minimum} to ${maximum}.`);
  }
  return value as number;
}

function requireNumber(value: unknown, fieldName: string, minimum: number, maximum: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${fieldName} must be a finite number from ${minimum} to ${maximum}.`);
  }
  return value;
}

function requireBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${fieldName} must be boolean.`);
  return value;
}

function requireTimestamp(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !ISO_TIMESTAMP.test(value) || !Number.isFinite(Date.parse(value))) {
    throw new Error(`${fieldName} must be a canonical UTC timestamp.`);
  }
  return value;
}

function requireEnum<const T extends readonly string[]>(value: unknown, allowed: T, fieldName: string): T[number] {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    throw new Error(`${fieldName} must be one of ${allowed.join(", ")}.`);
  }
  return value as T[number];
}

function requireReasonCodes(value: unknown, fieldName: string): readonly string[] {
  const entries = asDenseArray(value, fieldName, 0, 32);
  const result = entries.map((entry, index) => requireReasonCode(entry, `${fieldName}[${index}]`));
  if (new Set(result).size !== result.length) throw new Error(`${fieldName} must not contain duplicates.`);
  return result;
}

function requireShaTuple(value: unknown, fieldName: string): readonly [string, string, string, string] {
  const entries = asDenseArray(value, fieldName, 4, 4);
  return [
    requireSha256(entries[0], `${fieldName}[0]`),
    requireSha256(entries[1], `${fieldName}[1]`),
    requireSha256(entries[2], `${fieldName}[2]`),
    requireSha256(entries[3], `${fieldName}[3]`),
  ];
}

function requireVector(value: unknown, fieldName: string): readonly [number, number, number] {
  const entries = asDenseArray(value, fieldName, 3, 3);
  return [
    requireNumber(entries[0], `${fieldName}[0]`, -PVOX_MAX_ABSOLUTE_COORDINATE_METRES, PVOX_MAX_ABSOLUTE_COORDINATE_METRES),
    requireNumber(entries[1], `${fieldName}[1]`, -PVOX_MAX_ABSOLUTE_COORDINATE_METRES, PVOX_MAX_ABSOLUTE_COORDINATE_METRES),
    requireNumber(entries[2], `${fieldName}[2]`, -PVOX_MAX_ABSOLUTE_COORDINATE_METRES, PVOX_MAX_ABSOLUTE_COORDINATE_METRES),
  ];
}

function createBounds(value: unknown, fieldName: string): ModelBoundsMetresV2 {
  const record = asRecord(value, fieldName);
  exactKeys(record, ["min", "max"], fieldName);
  const min = requireVector(record.min, `${fieldName}.min`);
  const max = requireVector(record.max, `${fieldName}.max`);
  if (min.some((coordinate, index) => coordinate >= max[index]!)) throw new Error(`${fieldName} minimum values must be below maximum values.`);
  return { min, max };
}

function approximatelyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= Math.max(1e-6, Math.abs(left) * 1e-6, Math.abs(right) * 1e-6);
}

function createHashAttestation(
  value: unknown,
  expectedDomain: PvoxHashAttestation["domain"],
  expectedDigest: string,
  fieldName: string,
): PvoxHashAttestation {
  const record = asRecord(value, fieldName);
  exactKeys(record, ["algorithm", "domain", "digest", "attestationToken"], fieldName);
  if (record.algorithm !== "sha256" || record.domain !== expectedDomain) {
    throw new Error(`${fieldName} must use the governed SHA-256 domain.`);
  }
  const digest = requireSha256(record.digest, `${fieldName}.digest`);
  if (digest !== expectedDigest) throw new Error(`${fieldName}.digest must match its bound contract hash.`);
  return {
    algorithm: "sha256",
    domain: expectedDomain,
    digest,
    attestationToken: requireAttestation(record.attestationToken, `${fieldName}.attestationToken`),
  };
}

/** Canonical JSON used only as a versioned hash preimage; SHA-256 is computed by the producing service. */
export function canonicalizePvoxHashProjectionV1(value: unknown): string {
  assertDataOnlyTree(value, "PVOX hash projection");
  return canonicalizeGpuContract(value);
}

/** Exact full-v2 request projection excluding only its externally computed digest. */
export function canonicalizeModelRequestSemanticProfileV1(request: ModelRequestSpecV2): string {
  return canonicalizePvoxHashProjectionV1({
    contractVersion: request.contractVersion,
    policyProfileId: request.policyProfileId,
    query: request.query,
    revision: request.revision,
    ...(request.locale === undefined ? {} : { locale: request.locale }),
    ...(request.rankerId === undefined ? {} : { rankerId: request.rankerId }),
    hardConstraints: request.hardConstraints,
    softPreferences: request.softPreferences,
    exclusions: request.exclusions,
    sourceIngestionLimits: request.sourceIngestionLimits,
    pvoxRuntimeProfile: request.pvoxRuntimeProfile,
  });
}

function alignPvoxSectionBytes(value: number): number {
  return Math.ceil(value / PVOX_SECTION_ALIGNMENT_BYTES) * PVOX_SECTION_ALIGNMENT_BYTES;
}

/** Conservative exact fixed-record lower bound for a declared PVOX technical profile. */
export function calculatePvoxMinimumArtifactByteLength(profile: VoxelTechnicalProfile): number {
  const sectionPayloads = [
    profile.partitionCount * PVOX_PARTITION_RECORD_BYTES,
    profile.lodCount * PVOX_LOD_RECORD_BYTES,
    profile.partitionCount * profile.lodCount * PVOX_ROOT_RECORD_BYTES,
    profile.levelSpanRecordCount * PVOX_LEVEL_SPAN_RECORD_BYTES,
    profile.hierarchyNodeCount * PVOX_HIERARCHY_NODE_RECORD_BYTES,
    profile.brickCount * PVOX_MIN_BRICK_DESCRIPTOR_BYTES,
    profile.brickCount * PVOX_RENDER_BRICK_MASK_BYTES
      + profile.encodedSurfaceSampleCount * PVOX_MIN_ENCODED_SURFACE_SAMPLE_BYTES,
    profile.surfacePropertyCount * PVOX_SURFACE_PROPERTY_RECORD_BYTES,
    profile.physicalPaletteRecordCount * PVOX_PHYSICAL_PROPERTY_RECORD_BYTES,
    profile.physicalEvidenceRecordCount * PVOX_PHYSICAL_EVIDENCE_RECORD_BYTES,
    profile.materialRegionCount * PVOX_MATERIAL_REGION_RECORD_BYTES,
    profile.interiorLayerRecordCount * PVOX_INTERIOR_LAYER_RECORD_BYTES,
    profile.massPropertyRecordCount * PVOX_MASS_PROPERTY_RECORD_BYTES,
    profile.bondRecordCount * PVOX_BOND_RECORD_BYTES,
    ...(profile.hasCollision ? [
      profile.partitionCount * profile.lodCount * PVOX_ROOT_RECORD_BYTES,
      profile.levelSpanRecordCount * PVOX_LEVEL_SPAN_RECORD_BYTES,
      profile.collisionHierarchyNodeCount * PVOX_HIERARCHY_NODE_RECORD_BYTES,
      profile.collisionBrickCount * PVOX_MIN_BRICK_DESCRIPTOR_BYTES,
      profile.collisionBrickCount * PVOX_COLLISION_BRICK_MASK_BYTES
        + profile.collisionEncodedSurfaceSampleCount * PVOX_MIN_ENCODED_COLLISION_SAMPLE_BYTES,
    ] : []),
  ];
  return alignPvoxSectionBytes(PVOX_HEADER_BYTE_LENGTH + profile.sectionCount * PVOX_DIRECTORY_ENTRY_BYTE_LENGTH)
    + sectionPayloads.reduce((total, byteLength) => total + alignPvoxSectionBytes(byteLength), 0);
}

function assertFloorCentredBounds(bounds: ModelBoundsMetresV2, fieldName: string): void {
  if (!approximatelyEqual(bounds.min[1], 0)
    || !approximatelyEqual(bounds.min[0] + bounds.max[0], 0)
    || !approximatelyEqual(bounds.min[2] + bounds.max[2], 0)) {
    throw new Error(`${fieldName} must use a floor-centred origin with centred X/Z bounds.`);
  }
}

function createDimensions(value: unknown, fieldName: string): ModelDimensionsMetresV2 {
  const record = asRecord(value, fieldName);
  exactKeys(record, ["width", "height", "depth"], fieldName);
  return {
    width: requireNumber(record.width, `${fieldName}.width`, Number.EPSILON, 1_000_000_000),
    height: requireNumber(record.height, `${fieldName}.height`, Number.EPSILON, 1_000_000_000),
    depth: requireNumber(record.depth, `${fieldName}.depth`, Number.EPSILON, 1_000_000_000),
  };
}

function assertCoordinateSystem(value: unknown, fieldName: string): void {
  const record = asRecord(value, fieldName);
  exactKeys(record, ["unit", "upAxis", "forwardAxis", "origin", "outwardFaceWinding"], fieldName);
  for (const [key, expected] of Object.entries(CANONICAL_MODEL_COORDINATE_SYSTEM)) {
    if (record[key] !== expected) throw new Error(`${fieldName} must use the canonical model coordinate system.`);
  }
}

type PvoxResourceScope =
  | { readonly kind: "resolution"; readonly resolutionId: string; readonly candidateId: string; readonly sha256: string }
  | { readonly kind: "catalog"; readonly assetId: string; readonly version: string; readonly sha256: string };

function parsePvoxResourceScope(uri: string): PvoxResourceScope {
  const resolutionMatch = PVOX_RESOLUTION_RESOURCE.exec(uri);
  if (resolutionMatch !== null) {
    return {
      kind: "resolution",
      resolutionId: requirePathSegment(resolutionMatch[1], "PVOX resource resolutionId"),
      candidateId: requirePathSegment(resolutionMatch[2], "PVOX resource candidateId"),
      sha256: requireSha256(resolutionMatch[3], "PVOX resource hash"),
    };
  }
  const catalogMatch = PVOX_CATALOG_RESOURCE.exec(uri);
  if (catalogMatch !== null) {
    return {
      kind: "catalog",
      assetId: requirePathSegment(catalogMatch[1], "PVOX resource assetId"),
      version: assertImmutableAssetVersion(catalogMatch[2]),
      sha256: requireSha256(catalogMatch[3], "PVOX resource hash"),
    };
  }
  throw new Error("PVOX artifact URI must be an authenticated canonical PVOX MCP resource.");
}

function createResource(value: unknown): PvoxAuthenticatedResourceMetadata {
  const record = asRecord(value, "PvoxAssetManifestV1.artifact");
  exactKeys(record, ["uri", "byteLength", "sha256", "contentType", "authenticated"], "PvoxAssetManifestV1.artifact");
  const uri = requireString(record.uri, "PvoxAssetManifestV1.artifact.uri", 512);
  if (uri.includes("%") || uri.includes("?") || uri.includes("#") || uri.includes("..") || DIRECT_URL.test(uri)) {
    throw new Error("PvoxAssetManifestV1.artifact.uri must be an authenticated canonical MCP resource.");
  }
  const scope = parsePvoxResourceScope(uri);
  const sha256 = requireSha256(record.sha256, "PvoxAssetManifestV1.artifact.sha256");
  if (scope.sha256 !== sha256) throw new Error("PvoxAssetManifestV1.artifact URI hash must match sha256.");
  if (record.contentType !== PVOX_CONTENT_TYPE) throw new Error("PvoxAssetManifestV1.artifact.contentType must be the PVOX content type.");
  if (record.authenticated !== true) throw new Error("PvoxAssetManifestV1.artifact must be authenticated.");
  return {
    uri,
    byteLength: requireInteger(record.byteLength, "PvoxAssetManifestV1.artifact.byteLength", 1, PVOX_DEFAULT_LIMITS.maximumArtifactBytes),
    sha256,
    contentType: PVOX_CONTENT_TYPE,
    authenticated: true,
  };
}

function createPage(value: unknown, index: number): PvoxPageRecord {
  const fieldName = `PvoxAssetManifestV1.pages[${index}]`;
  const record = asRecord(value, fieldName);
  const pageKind = requireEnum(record.pageKind, PVOX_PAGE_KINDS, `${fieldName}.pageKind`);
  exactKeys(record, ["pageIndex", "pageKind", "byteOffset", "byteLength", "decodedByteLength", "sha256", "spatialKey"], fieldName);
  const byteLength = requireInteger(record.byteLength, `${fieldName}.byteLength`, PVOX_PAGE_SIZE_BYTES, PVOX_PAGE_SIZE_BYTES);
  const decodedByteLength = requireInteger(record.decodedByteLength, `${fieldName}.decodedByteLength`, PVOX_PAGE_SIZE_BYTES, PVOX_PAGE_SIZE_BYTES);
  if (decodedByteLength !== byteLength) throw new Error(`${fieldName} decodedByteLength must equal byteLength because PVOX pages are never compressed.`);
  let spatialKey: PvoxPageSpatialKey | undefined;
  if (record.spatialKey !== undefined) {
    const spatialRecord = asRecord(record.spatialKey, `${fieldName}.spatialKey`);
    exactKeys(spatialRecord, ["lodLevel", "partitionIndex", "hierarchyDepth", "minimumMortonCode", "maximumMortonCode"], `${fieldName}.spatialKey`);
    const minimumMortonCode = requireString(spatialRecord.minimumMortonCode, `${fieldName}.spatialKey.minimumMortonCode`, 16);
    const maximumMortonCode = requireString(spatialRecord.maximumMortonCode, `${fieldName}.spatialKey.maximumMortonCode`, 16);
    if (!MORTON_CODE.test(minimumMortonCode) || !MORTON_CODE.test(maximumMortonCode) || minimumMortonCode > maximumMortonCode) {
      throw new Error(`${fieldName} spatial Morton range must be canonical and ordered.`);
    }
    spatialKey = {
      lodLevel: requireInteger(spatialRecord.lodLevel, `${fieldName}.spatialKey.lodLevel`, 0, PVOX_DEFAULT_LIMITS.maximumLodCount - 1) as PvoxLodLevel,
      partitionIndex: requireInteger(spatialRecord.partitionIndex, `${fieldName}.spatialKey.partitionIndex`, 0, PVOX_DEFAULT_LIMITS.maximumPartitions - 1),
      hierarchyDepth: requireInteger(spatialRecord.hierarchyDepth, `${fieldName}.spatialKey.hierarchyDepth`, 0, PVOX_DEFAULT_LIMITS.maximumHierarchyDepth),
      minimumMortonCode,
      maximumMortonCode,
    };
  }
  const spatialPage = pageKind === "render-field" || pageKind === "collision-field";
  if (spatialPage !== (spatialKey !== undefined)) {
    throw new Error(`${fieldName} render/collision field pages require spatialKey; metadata/LOD-structure pages forbid it.`);
  }
  return {
    pageIndex: requireInteger(record.pageIndex, `${fieldName}.pageIndex`, 0, PVOX_DEFAULT_LIMITS.maximumPages - 1),
    pageKind,
    byteOffset: requireInteger(record.byteOffset, `${fieldName}.byteOffset`, 0, PVOX_DEFAULT_LIMITS.maximumArtifactBytes - 1),
    byteLength,
    decodedByteLength,
    sha256: requireSha256(record.sha256, `${fieldName}.sha256`),
    ...(spatialKey === undefined ? {} : { spatialKey }),
  };
}

function createLod(value: unknown, index: number, pageCount: number): PvoxLodRecord {
  const fieldName = `PvoxAssetManifestV1.lods[${index}]`;
  const record = asRecord(value, fieldName);
  exactKeys(record, [
    "level", "firstPageIndex", "pageCount", "brickCount", "cellSizeMetres",
    "maximumSurfaceErrorMetres", "p99SurfaceErrorMetres", "silhouetteIou",
    "maximumContourDisplacementPx", "renderedSsim", "p95DeltaE2000",
    "normalizedMaterialError",
  ], fieldName);
  const firstPageIndex = requireInteger(record.firstPageIndex, `${fieldName}.firstPageIndex`, 0, pageCount - 1);
  const lodPageCount = requireInteger(record.pageCount, `${fieldName}.pageCount`, 1, pageCount);
  if (firstPageIndex + lodPageCount > pageCount) throw new Error(`${fieldName} page range exceeds the PVOX page set.`);
  const maximumSurfaceErrorMetres = requireNumber(record.maximumSurfaceErrorMetres, `${fieldName}.maximumSurfaceErrorMetres`, 0, 1_000_000);
  const p99SurfaceErrorMetres = requireNumber(record.p99SurfaceErrorMetres, `${fieldName}.p99SurfaceErrorMetres`, 0, maximumSurfaceErrorMetres);
  return {
    level: requireInteger(record.level, `${fieldName}.level`, 0, 3) as PvoxLodLevel,
    firstPageIndex,
    pageCount: lodPageCount,
    brickCount: requireInteger(record.brickCount, `${fieldName}.brickCount`, 1, PVOX_DEFAULT_LIMITS.maximumBricks),
    cellSizeMetres: requireNumber(record.cellSizeMetres, `${fieldName}.cellSizeMetres`, Number.EPSILON, 1_000_000),
    maximumSurfaceErrorMetres,
    p99SurfaceErrorMetres,
    silhouetteIou: requireNumber(record.silhouetteIou, `${fieldName}.silhouetteIou`, 0, 1),
    maximumContourDisplacementPx: requireNumber(record.maximumContourDisplacementPx, `${fieldName}.maximumContourDisplacementPx`, 0, 1_000_000),
    renderedSsim: requireNumber(record.renderedSsim, `${fieldName}.renderedSsim`, 0, 1),
    p95DeltaE2000: requireNumber(record.p95DeltaE2000, `${fieldName}.p95DeltaE2000`, 0, 100),
    normalizedMaterialError: requireNumber(record.normalizedMaterialError, `${fieldName}.normalizedMaterialError`, 0, 1),
  };
}

function createSourceIngestionLimitsV2(value: unknown): ModelSourceIngestionLimitsV2 {
  const fieldName = "ModelRequestSpecV2.sourceIngestionLimits";
  const record = asRecord(value, fieldName);
  exactKeys(record, [
    "maximumDownloadBytes",
    "maximumExpandedBytes",
    "maximumArchiveEntries",
    "maximumSourceFiles",
    "maximumDecodedTextureBytes",
    "maximumTextureDimensionPx",
  ], fieldName);
  const limits: ModelSourceIngestionLimitsV2 = {
    maximumDownloadBytes: requireInteger(record.maximumDownloadBytes, `${fieldName}.maximumDownloadBytes`, 1, PVOX_DEFAULT_SOURCE_INGESTION_LIMITS.maximumDownloadBytes),
    maximumExpandedBytes: requireInteger(record.maximumExpandedBytes, `${fieldName}.maximumExpandedBytes`, 1, PVOX_DEFAULT_SOURCE_INGESTION_LIMITS.maximumExpandedBytes),
    maximumArchiveEntries: requireInteger(record.maximumArchiveEntries, `${fieldName}.maximumArchiveEntries`, 1, PVOX_DEFAULT_SOURCE_INGESTION_LIMITS.maximumArchiveEntries),
    maximumSourceFiles: requireInteger(record.maximumSourceFiles, `${fieldName}.maximumSourceFiles`, 1, PVOX_DEFAULT_SOURCE_INGESTION_LIMITS.maximumSourceFiles),
    maximumDecodedTextureBytes: requireInteger(record.maximumDecodedTextureBytes, `${fieldName}.maximumDecodedTextureBytes`, 1, PVOX_DEFAULT_SOURCE_INGESTION_LIMITS.maximumDecodedTextureBytes),
    maximumTextureDimensionPx: requireInteger(record.maximumTextureDimensionPx, `${fieldName}.maximumTextureDimensionPx`, 1, PVOX_DEFAULT_SOURCE_INGESTION_LIMITS.maximumTextureDimensionPx),
  };
  if (limits.maximumExpandedBytes < limits.maximumDownloadBytes) {
    throw new Error(`${fieldName}.maximumExpandedBytes must cover maximumDownloadBytes.`);
  }
  if (limits.maximumSourceFiles < limits.maximumArchiveEntries) {
    throw new Error(`${fieldName}.maximumSourceFiles must cover maximumArchiveEntries.`);
  }
  if (limits.maximumDecodedTextureBytes > limits.maximumExpandedBytes) {
    throw new Error(`${fieldName}.maximumDecodedTextureBytes must not exceed maximumExpandedBytes.`);
  }
  return limits;
}

function createPvoxRuntimeLimitsV1(value: unknown): PvoxRuntimeLimitsV1 {
  const fieldName = "ModelRequestSpecV2.pvoxRuntimeProfile.limits";
  const record = asRecord(value, fieldName);
  exactKeys(record, [
    "maximumArtifactBytes",
    "maximumPages",
    "maximumHierarchyDepth",
    "maximumHierarchyNodes",
    "maximumBricks",
    "maximumLogicalVoxels",
    "maximumEncodedSurfaceSamples",
    "maximumSurfaceProperties",
    "maximumPhysicalPaletteRecords",
    "maximumPhysicalEvidenceEntries",
    "maximumMaterialRegions",
    "maximumInteriorLayers",
    "maximumMassPropertyRecords",
    "maximumBondRecords",
    "maximumPartitions",
    "maximumLodCount",
    "maximumCpuResidentBytes",
    "maximumGpuResidentBytes",
  ], fieldName);
  const limits: PvoxRuntimeLimitsV1 = {
    maximumArtifactBytes: requireInteger(record.maximumArtifactBytes, `${fieldName}.maximumArtifactBytes`, 1, PVOX_DEFAULT_LIMITS.maximumArtifactBytes),
    maximumPages: requireInteger(record.maximumPages, `${fieldName}.maximumPages`, 1, PVOX_DEFAULT_LIMITS.maximumPages),
    maximumHierarchyDepth: requireInteger(record.maximumHierarchyDepth, `${fieldName}.maximumHierarchyDepth`, 0, PVOX_DEFAULT_LIMITS.maximumHierarchyDepth),
    maximumHierarchyNodes: requireInteger(record.maximumHierarchyNodes, `${fieldName}.maximumHierarchyNodes`, 1, PVOX_DEFAULT_LIMITS.maximumHierarchyNodes),
    maximumBricks: requireInteger(record.maximumBricks, `${fieldName}.maximumBricks`, 1, PVOX_DEFAULT_LIMITS.maximumBricks),
    maximumLogicalVoxels: requireInteger(record.maximumLogicalVoxels, `${fieldName}.maximumLogicalVoxels`, 1, PVOX_DEFAULT_LIMITS.maximumLogicalVoxels),
    maximumEncodedSurfaceSamples: requireInteger(record.maximumEncodedSurfaceSamples, `${fieldName}.maximumEncodedSurfaceSamples`, 1, PVOX_DEFAULT_LIMITS.maximumEncodedSurfaceSamples),
    maximumSurfaceProperties: requireInteger(record.maximumSurfaceProperties, `${fieldName}.maximumSurfaceProperties`, 1, PVOX_DEFAULT_LIMITS.maximumSurfaceProperties),
    maximumPhysicalPaletteRecords: requireInteger(record.maximumPhysicalPaletteRecords, `${fieldName}.maximumPhysicalPaletteRecords`, 1, PVOX_DEFAULT_LIMITS.maximumPhysicalProperties),
    maximumPhysicalEvidenceEntries: requireInteger(record.maximumPhysicalEvidenceEntries, `${fieldName}.maximumPhysicalEvidenceEntries`, 1, PVOX_DEFAULT_LIMITS.maximumPhysicalEvidenceEntries),
    maximumMaterialRegions: requireInteger(record.maximumMaterialRegions, `${fieldName}.maximumMaterialRegions`, 1, PVOX_DEFAULT_LIMITS.maximumMaterialRegions),
    maximumInteriorLayers: requireInteger(record.maximumInteriorLayers, `${fieldName}.maximumInteriorLayers`, 1, PVOX_DEFAULT_LIMITS.maximumInteriorLayers),
    maximumMassPropertyRecords: requireInteger(record.maximumMassPropertyRecords, `${fieldName}.maximumMassPropertyRecords`, 1, PVOX_DEFAULT_LIMITS.maximumMassPropertyRecords),
    maximumBondRecords: requireInteger(record.maximumBondRecords, `${fieldName}.maximumBondRecords`, 0, PVOX_DEFAULT_LIMITS.maximumBondRecords),
    maximumPartitions: requireInteger(record.maximumPartitions, `${fieldName}.maximumPartitions`, 1, PVOX_DEFAULT_LIMITS.maximumPartitions),
    maximumLodCount: requireInteger(record.maximumLodCount, `${fieldName}.maximumLodCount`, 1, PVOX_DEFAULT_LIMITS.maximumLodCount),
    maximumCpuResidentBytes: requireInteger(record.maximumCpuResidentBytes, `${fieldName}.maximumCpuResidentBytes`, 1, PVOX_DEFAULT_LIMITS.maximumCpuResidentBytes),
    maximumGpuResidentBytes: requireInteger(record.maximumGpuResidentBytes, `${fieldName}.maximumGpuResidentBytes`, 1, PVOX_DEFAULT_LIMITS.maximumGpuResidentBytes),
  };
  if (limits.maximumArtifactBytes > limits.maximumPages * PVOX_PAGE_SIZE_BYTES) {
    throw new Error(`${fieldName}.maximumPages cannot contain maximumArtifactBytes.`);
  }
  if (limits.maximumLogicalVoxels > limits.maximumBricks * PVOX_BRICK_EDGE_VOXELS ** 3) {
    throw new Error(`${fieldName}.maximumLogicalVoxels cannot exceed the requested brick capacity.`);
  }
  if (limits.maximumEncodedSurfaceSamples > limits.maximumLogicalVoxels) {
    throw new Error(`${fieldName}.maximumEncodedSurfaceSamples cannot exceed maximumLogicalVoxels.`);
  }
  return limits;
}

function createPvoxRuntimeRequestProfileV1(value: unknown): PvoxRuntimeRequestProfileV1 {
  const fieldName = "ModelRequestSpecV2.pvoxRuntimeProfile";
  const record = asRecord(value, fieldName);
  exactKeys(record, ["profileId", "fidelityProfileId", "capabilityProfileId", "geometryMode", "requiredCapabilities", "limits"], fieldName);
  const requestedCapabilityEntries = asDenseArray(record.requiredCapabilities, `${fieldName}.requiredCapabilities`, 1, PVOX_CAPABILITIES.length);
  const requiredCapabilities = requestedCapabilityEntries.map((entry, index) => requireEnum(entry, PVOX_CAPABILITIES, `${fieldName}.requiredCapabilities[${index}]`));
  if (new Set(requiredCapabilities).size !== requiredCapabilities.length) {
    throw new Error(`${fieldName}.requiredCapabilities must not contain duplicates.`);
  }
  if (!requiredCapabilities.includes("rendering")) {
    throw new Error(`${fieldName}.requiredCapabilities must include rendering.`);
  }
  const capabilityProfileId = requireEnum(record.capabilityProfileId, PVOX_RUNTIME_CAPABILITY_PROFILE_IDS, `${fieldName}.capabilityProfileId`);
  const profileRequirements: Readonly<Record<PvoxRuntimeCapabilityProfileId, readonly PvoxCapability[]>> = {
    "static-render-v1": ["rendering"],
    "world-editable-v1": ["rendering", "collision", "destruction", "thermal", "moisture", "fluid-boundary"],
    "deformable-v1": ["rendering", "deformation", "animation"],
  };
  if (profileRequirements[capabilityProfileId].some((capability) => !requiredCapabilities.includes(capability))) {
    throw new Error(`${fieldName}.requiredCapabilities do not satisfy capabilityProfileId.`);
  }
  const limits = createPvoxRuntimeLimitsV1(record.limits);
  if (capabilityProfileId === "world-editable-v1"
    && limits.maximumPhysicalEvidenceEntries < limits.maximumMaterialRegions * PVOX_PHYSICAL_PROPERTIES.length) {
    throw new Error(`${fieldName}.limits must budget a complete physical-property matrix for every allowed material region.`);
  }
  return {
    profileId: requireToken(record.profileId, `${fieldName}.profileId`),
    fidelityProfileId: requireEnum(record.fidelityProfileId, PVOX_FIDELITY_PROFILE_IDS, `${fieldName}.fidelityProfileId`),
    capabilityProfileId,
    geometryMode: requireEnum(record.geometryMode, ["solid", "shell", "mixed", "auto"] as const, `${fieldName}.geometryMode`),
    requiredCapabilities,
    limits,
  };
}

/** Validate and deeply freeze one normalized PVOX model request. */
export function createModelRequestSpecV2(input: unknown): ModelRequestSpecV2 {
  const fieldName = "ModelRequestSpecV2";
  const record = asRecord(input, fieldName);
  assertDataOnlyTree(record, fieldName);
  exactKeys(record, [
    "contractVersion",
    "policyProfileId",
    "requestSemanticProfileHash",
    "query",
    "revision",
    "locale",
    "rankerId",
    "hardConstraints",
    "softPreferences",
    "exclusions",
    "sourceIngestionLimits",
    "pvoxRuntimeProfile",
  ], fieldName);
  if (record.contractVersion !== MODEL_RESOLUTION_V2_CONTRACT_VERSION) {
    throw new Error(`${fieldName}.contractVersion is unsupported.`);
  }
  if (record.policyProfileId !== PVOX_MODEL_REQUEST_POLICY_ID) {
    throw new Error(`${fieldName}.policyProfileId must be ${PVOX_MODEL_REQUEST_POLICY_ID}.`);
  }
  const hardConstraintsRecord = asRecord(record.hardConstraints ?? {}, `${fieldName}.hardConstraints`);
  exactKeys(hardConstraintsRecord, ["boundsMetres", "dimensionsMetres", "collision", "partition"], `${fieldName}.hardConstraints`);
  const softPreferencesRecord = asRecord(record.softPreferences ?? {}, `${fieldName}.softPreferences`);
  for (const field of ["materials", "colors", "tags"] as const) {
    if (softPreferencesRecord[field] !== undefined) {
      asDenseArray(softPreferencesRecord[field], `${fieldName}.softPreferences.${field}`, 0, 32);
    }
  }
  const exclusions = asDenseArray(record.exclusions ?? [], `${fieldName}.exclusions`, 0, 32);
  const normalizedV1 = createModelRequestSpec({
    query: record.query,
    revision: record.revision,
    ...(record.locale === undefined ? {} : { locale: record.locale }),
    ...(record.rankerId === undefined ? {} : { rankerId: record.rankerId }),
    hardConstraints: hardConstraintsRecord,
    softPreferences: softPreferencesRecord,
    exclusions,
  });
  const hardConstraints: ModelHardConstraintsV2 = {
    ...(normalizedV1.hardConstraints.boundsMetres === undefined ? {} : { boundsMetres: normalizedV1.hardConstraints.boundsMetres }),
    ...(normalizedV1.hardConstraints.dimensionsMetres === undefined ? {} : { dimensionsMetres: normalizedV1.hardConstraints.dimensionsMetres }),
    ...(normalizedV1.hardConstraints.collision === undefined ? {} : { collision: normalizedV1.hardConstraints.collision }),
    ...(normalizedV1.hardConstraints.partition === undefined ? {} : { partition: normalizedV1.hardConstraints.partition }),
  };
  return deepFreeze({
    contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
    policyProfileId: PVOX_MODEL_REQUEST_POLICY_ID,
    requestSemanticProfileHash: requireSha256(record.requestSemanticProfileHash, `${fieldName}.requestSemanticProfileHash`),
    query: normalizedV1.query,
    revision: normalizedV1.revision,
    ...(normalizedV1.locale === undefined ? {} : { locale: normalizedV1.locale }),
    ...(normalizedV1.rankerId === undefined ? {} : { rankerId: normalizedV1.rankerId }),
    hardConstraints,
    softPreferences: normalizedV1.softPreferences,
    exclusions: normalizedV1.exclusions,
    sourceIngestionLimits: createSourceIngestionLimitsV2(record.sourceIngestionLimits),
    pvoxRuntimeProfile: createPvoxRuntimeRequestProfileV1(record.pvoxRuntimeProfile),
  });
}

/** Validate and deeply freeze authenticated PVOX artifact metadata. */
export function createPvoxAssetManifestV1(input: unknown): PvoxAssetManifestV1 {
  const record = asRecord(input, "PvoxAssetManifestV1");
  exactKeys(record, [
    "manifestVersion", "representation", "formatVersion", "contentType", "fileExtension",
    "magic", "brickEdgeVoxels", "pageSizeBytes", "geometryMode", "sourceContentHash",
    "canonicalDocumentHash", "rootHash", "directoryHash", "pageSetHash", "binaryClosureHash",
    "validationEvidenceHash", "compilationInputHash", "runtimeRequestProfileHash",
    "headerByteLength", "directoryEntryByteLength", "sectionCount", "maximumRunsPerBrick",
    "maximumLocalSamplesPerBrick", "maximumEncodedBrickPayloadBytes",
    "coordinateSystem", "boundsMetres", "artifact", "pages", "lods",
  ], "PvoxAssetManifestV1");
  if (record.manifestVersion !== PVOX_ASSET_MANIFEST_VERSION) throw new Error("PvoxAssetManifestV1.manifestVersion is unsupported.");
  if (record.representation !== "pvox") throw new Error("PvoxAssetManifestV1.representation must be pvox.");
  const formatVersion = asRecord(record.formatVersion, "PvoxAssetManifestV1.formatVersion");
  exactKeys(formatVersion, ["major", "minor"], "PvoxAssetManifestV1.formatVersion");
  if (formatVersion.major !== PVOX_FORMAT_VERSION.major || formatVersion.minor !== PVOX_FORMAT_VERSION.minor) throw new Error("PvoxAssetManifestV1.formatVersion is unsupported.");
  if (record.contentType !== PVOX_CONTENT_TYPE || record.fileExtension !== PVOX_FILE_EXTENSION || record.magic !== PVOX_MAGIC) {
    throw new Error("PvoxAssetManifestV1 must declare the canonical PVOX content type, extension, and magic.");
  }
  if (record.brickEdgeVoxels !== PVOX_BRICK_EDGE_VOXELS || record.pageSizeBytes !== PVOX_PAGE_SIZE_BYTES) {
    throw new Error("PvoxAssetManifestV1 must use fixed 8-cubed bricks and 64-KiB pages.");
  }
  assertCoordinateSystem(record.coordinateSystem, "PvoxAssetManifestV1.coordinateSystem");
  const boundsMetres = createBounds(record.boundsMetres, "PvoxAssetManifestV1.boundsMetres");
  assertFloorCentredBounds(boundsMetres, "PvoxAssetManifestV1.boundsMetres");
  const artifact = createResource(record.artifact);
  if (artifact.byteLength % PVOX_PAGE_SIZE_BYTES !== 0) throw new Error("PvoxAssetManifestV1 artifact byteLength must contain whole 64-KiB pages.");
  const pageEntries = asDenseArray(record.pages, "PvoxAssetManifestV1.pages", 1, PVOX_DEFAULT_LIMITS.maximumPages);
  const pages = pageEntries.map(createPage);
  let expectedOffset = 0;
  const previousSpatialMaximumByScope = new Map<string, string>();
  for (const [index, current] of pages.entries()) {
    if (current.pageIndex !== index) throw new Error("PvoxAssetManifestV1 pageIndex values must be contiguous from zero.");
    if (current.byteOffset !== expectedOffset || current.byteOffset % PVOX_PAGE_SIZE_BYTES !== 0) {
      throw new Error("PvoxAssetManifestV1 page byteOffset values must be contiguous and page aligned.");
    }
    const spatialKey = current.spatialKey;
    if (spatialKey !== undefined) {
      const scope = `${current.pageKind}\u0000${spatialKey.lodLevel}\u0000${spatialKey.partitionIndex}`;
      const previousMaximum = previousSpatialMaximumByScope.get(scope);
      if (previousMaximum !== undefined && spatialKey.minimumMortonCode <= previousMaximum) {
        throw new Error("PvoxAssetManifestV1 page Morton ranges must be ordered and non-overlapping within each kind, LOD, and partition.");
      }
      previousSpatialMaximumByScope.set(scope, spatialKey.maximumMortonCode);
    }
    expectedOffset += current.byteLength;
  }
  if (expectedOffset !== artifact.byteLength) throw new Error("PvoxAssetManifestV1 pages must exactly cover the artifact bytes.");
  const lodEntries = asDenseArray(record.lods, "PvoxAssetManifestV1.lods", 1, 4);
  const lods = lodEntries.map((entry, index) => createLod(entry, index, pages.length));
  for (const [index, current] of lods.entries()) {
    if (current.level !== index) throw new Error("PvoxAssetManifestV1 LOD levels must be contiguous from LOD0.");
    const previous = lods[index - 1];
    if (previous !== undefined && (
      current.brickCount > previous.brickCount
      || current.cellSizeMetres < previous.cellSizeMetres
      || current.maximumSurfaceErrorMetres < previous.maximumSurfaceErrorMetres
      || current.p99SurfaceErrorMetres < previous.p99SurfaceErrorMetres
    )) throw new Error("PvoxAssetManifestV1 LOD complexity and errors must be monotonic.");
    if (pages.slice(current.firstPageIndex, current.firstPageIndex + current.pageCount).some(({ pageKind, spatialKey }) => pageKind !== "render-field" || spatialKey?.lodLevel !== current.level)) {
      throw new Error("PvoxAssetManifestV1 LOD page ranges must reference render-field pages in the matching LOD scope.");
    }
  }
  const sourceContentHash = requireSha256(record.sourceContentHash, "PvoxAssetManifestV1.sourceContentHash");
  const canonicalDocumentHash = requireSha256(record.canonicalDocumentHash, "PvoxAssetManifestV1.canonicalDocumentHash");
  const compilationInputHash = requireSha256(record.compilationInputHash, "PvoxAssetManifestV1.compilationInputHash");
  const runtimeRequestProfileHash = requireSha256(record.runtimeRequestProfileHash, "PvoxAssetManifestV1.runtimeRequestProfileHash");
  if (new Set([sourceContentHash, canonicalDocumentHash, compilationInputHash, runtimeRequestProfileHash]).size !== 4) {
    throw new Error("PvoxAssetManifestV1 source, canonical document, compilation input, and runtime request profile hashes must be distinct attestations.");
  }
  if (record.headerByteLength !== PVOX_HEADER_BYTE_LENGTH
    || record.directoryEntryByteLength !== PVOX_DIRECTORY_ENTRY_BYTE_LENGTH
    || record.maximumRunsPerBrick !== PVOX_MAX_RUNS_PER_BRICK
    || record.maximumLocalSamplesPerBrick !== PVOX_MAX_LOCAL_SAMPLES_PER_BRICK
    || record.maximumEncodedBrickPayloadBytes !== PVOX_MAX_ENCODED_BRICK_PAYLOAD_BYTES) {
    throw new Error("PvoxAssetManifestV1 must declare the fixed PVOX 1.0 layout and brick codec limits.");
  }
  return deepFreeze({
    manifestVersion: PVOX_ASSET_MANIFEST_VERSION,
    representation: "pvox",
    formatVersion: PVOX_FORMAT_VERSION,
    contentType: PVOX_CONTENT_TYPE,
    fileExtension: PVOX_FILE_EXTENSION,
    magic: PVOX_MAGIC,
    brickEdgeVoxels: PVOX_BRICK_EDGE_VOXELS,
    pageSizeBytes: PVOX_PAGE_SIZE_BYTES,
    geometryMode: requireEnum(record.geometryMode, ["solid", "shell", "mixed"] as const, "PvoxAssetManifestV1.geometryMode"),
    sourceContentHash,
    canonicalDocumentHash,
    rootHash: requireSha256(record.rootHash, "PvoxAssetManifestV1.rootHash"),
    directoryHash: requireSha256(record.directoryHash, "PvoxAssetManifestV1.directoryHash"),
    pageSetHash: requireSha256(record.pageSetHash, "PvoxAssetManifestV1.pageSetHash"),
    binaryClosureHash: requireSha256(record.binaryClosureHash, "PvoxAssetManifestV1.binaryClosureHash"),
    validationEvidenceHash: requireSha256(record.validationEvidenceHash, "PvoxAssetManifestV1.validationEvidenceHash"),
    compilationInputHash,
    runtimeRequestProfileHash,
    headerByteLength: PVOX_HEADER_BYTE_LENGTH,
    directoryEntryByteLength: PVOX_DIRECTORY_ENTRY_BYTE_LENGTH,
    sectionCount: requireInteger(record.sectionCount, "PvoxAssetManifestV1.sectionCount", PVOX_MIN_STATIC_SECTION_COUNT, PVOX_MAX_SECTIONS),
    maximumRunsPerBrick: PVOX_MAX_RUNS_PER_BRICK,
    maximumLocalSamplesPerBrick: PVOX_MAX_LOCAL_SAMPLES_PER_BRICK,
    maximumEncodedBrickPayloadBytes: PVOX_MAX_ENCODED_BRICK_PAYLOAD_BYTES,
    coordinateSystem: CANONICAL_MODEL_COORDINATE_SYSTEM,
    boundsMetres,
    artifact,
    pages,
    lods,
  });
}

/** Compatibility alias retaining the explicit v1 manifest implementation. */
export function createPvoxAssetManifest(input: unknown): PvoxAssetManifestV1 {
  return createPvoxAssetManifestV1(input);
}

/** Validate and deeply freeze a PVOX runtime technical profile. */
export function createVoxelTechnicalProfile(input: unknown): VoxelTechnicalProfile {
  const record = asRecord(input, "VoxelTechnicalProfile");
  exactKeys(record, [
    "boundsMetres", "dimensionsMetres", "geometryMode", "artifactByteLength", "pageCount",
    "brickCount", "logicalVoxelCapacity", "encodedSurfaceSampleCount", "surfacePropertyCount", "sectionCount",
    "levelSpanRecordCount", "physicalPaletteRecordCount", "physicalEvidenceRecordCount", "materialRegionCount",
    "interiorLayerRecordCount", "massPropertyRecordCount", "bondRecordCount", "hierarchyDepth", "hierarchyNodeCount", "lodCount",
    "collisionHierarchyNodeCount", "collisionBrickCount", "collisionLogicalVoxelCapacity", "collisionEncodedSurfaceSampleCount",
    "cpuResidentByteLength", "gpuResidentByteLength", "hasCollision", "partitionCount",
    "maximumPartitionExtentMetres", "maximumPartitionDiagonalMetres",
  ], "VoxelTechnicalProfile");
  const boundsMetres = createBounds(record.boundsMetres, "VoxelTechnicalProfile.boundsMetres");
  assertFloorCentredBounds(boundsMetres, "VoxelTechnicalProfile.boundsMetres");
  const dimensionsMetres = createDimensions(record.dimensionsMetres, "VoxelTechnicalProfile.dimensionsMetres");
  const derived = boundsMetres.max.map((coordinate, index) => coordinate - boundsMetres.min[index]!) as [number, number, number];
  const supplied = [dimensionsMetres.width, dimensionsMetres.height, dimensionsMetres.depth];
  if (derived.some((coordinate, index) => Math.abs(coordinate - supplied[index]!) > Math.max(1e-6, Math.abs(coordinate) * 1e-6))) {
    throw new Error("VoxelTechnicalProfile dimensionsMetres must match boundsMetres.");
  }
  const artifactByteLength = requireInteger(record.artifactByteLength, "VoxelTechnicalProfile.artifactByteLength", 1, PVOX_DEFAULT_LIMITS.maximumArtifactBytes);
  const pageCount = requireInteger(record.pageCount, "VoxelTechnicalProfile.pageCount", 1, PVOX_DEFAULT_LIMITS.maximumPages);
  if (artifactByteLength !== pageCount * PVOX_PAGE_SIZE_BYTES) {
    throw new Error("VoxelTechnicalProfile artifactByteLength must equal pageCount multiplied by the fixed PVOX page size.");
  }
  const brickCount = requireInteger(record.brickCount, "VoxelTechnicalProfile.brickCount", 1, PVOX_DEFAULT_LIMITS.maximumBricks);
  const logicalVoxelCapacity = requireInteger(record.logicalVoxelCapacity, "VoxelTechnicalProfile.logicalVoxelCapacity", 1, PVOX_DEFAULT_LIMITS.maximumLogicalVoxels);
  if (logicalVoxelCapacity !== brickCount * PVOX_BRICK_EDGE_VOXELS ** 3) {
    throw new Error("VoxelTechnicalProfile logicalVoxelCapacity must equal brickCount multiplied by 512 voxels per brick.");
  }
  const encodedSurfaceSampleCount = requireInteger(record.encodedSurfaceSampleCount, "VoxelTechnicalProfile.encodedSurfaceSampleCount", 1, PVOX_DEFAULT_LIMITS.maximumEncodedSurfaceSamples);
  if (encodedSurfaceSampleCount > logicalVoxelCapacity) {
    throw new Error("VoxelTechnicalProfile encodedSurfaceSampleCount cannot exceed logicalVoxelCapacity.");
  }
  const surfacePropertyCount = requireInteger(record.surfacePropertyCount, "VoxelTechnicalProfile.surfacePropertyCount", 1, PVOX_DEFAULT_LIMITS.maximumSurfaceProperties);
  const sectionCount = requireInteger(record.sectionCount, "VoxelTechnicalProfile.sectionCount", PVOX_MIN_STATIC_SECTION_COUNT, PVOX_MAX_SECTIONS);
  const hierarchyDepth = requireInteger(record.hierarchyDepth, "VoxelTechnicalProfile.hierarchyDepth", 0, PVOX_DEFAULT_LIMITS.maximumHierarchyDepth);
  const hierarchyNodeCount = requireInteger(record.hierarchyNodeCount, "VoxelTechnicalProfile.hierarchyNodeCount", 1, PVOX_DEFAULT_LIMITS.maximumHierarchyNodes);
  const lodCount = requireInteger(record.lodCount, "VoxelTechnicalProfile.lodCount", 1, PVOX_DEFAULT_LIMITS.maximumLodCount);
  const partitionCount = requireInteger(record.partitionCount, "VoxelTechnicalProfile.partitionCount", 1, PVOX_DEFAULT_LIMITS.maximumPartitions);
  const levelSpanRecordCount = requireInteger(record.levelSpanRecordCount, "VoxelTechnicalProfile.levelSpanRecordCount", partitionCount * lodCount, partitionCount * lodCount * (hierarchyDepth + 1));
  const physicalPaletteRecordCount = requireInteger(record.physicalPaletteRecordCount, "VoxelTechnicalProfile.physicalPaletteRecordCount", 1, PVOX_DEFAULT_LIMITS.maximumPhysicalProperties);
  const physicalEvidenceRecordCount = requireInteger(record.physicalEvidenceRecordCount, "VoxelTechnicalProfile.physicalEvidenceRecordCount", 0, PVOX_DEFAULT_LIMITS.maximumPhysicalEvidenceEntries);
  const materialRegionCount = requireInteger(record.materialRegionCount, "VoxelTechnicalProfile.materialRegionCount", 1, PVOX_DEFAULT_LIMITS.maximumMaterialRegions);
  const interiorLayerRecordCount = requireInteger(record.interiorLayerRecordCount, "VoxelTechnicalProfile.interiorLayerRecordCount", 0, PVOX_DEFAULT_LIMITS.maximumInteriorLayers);
  const massPropertyRecordCount = requireInteger(record.massPropertyRecordCount, "VoxelTechnicalProfile.massPropertyRecordCount", 0, PVOX_DEFAULT_LIMITS.maximumMassPropertyRecords);
  const bondRecordCount = requireInteger(record.bondRecordCount, "VoxelTechnicalProfile.bondRecordCount", 0, PVOX_DEFAULT_LIMITS.maximumBondRecords);
  const hasCollision = requireBoolean(record.hasCollision, "VoxelTechnicalProfile.hasCollision");
  const collisionHierarchyNodeCount = requireInteger(record.collisionHierarchyNodeCount, "VoxelTechnicalProfile.collisionHierarchyNodeCount", hasCollision ? 1 : 0, hasCollision ? PVOX_DEFAULT_LIMITS.maximumHierarchyNodes : 0);
  const collisionBrickCount = requireInteger(record.collisionBrickCount, "VoxelTechnicalProfile.collisionBrickCount", hasCollision ? 1 : 0, hasCollision ? PVOX_DEFAULT_LIMITS.maximumBricks : 0);
  const collisionLogicalVoxelCapacity = requireInteger(record.collisionLogicalVoxelCapacity, "VoxelTechnicalProfile.collisionLogicalVoxelCapacity", hasCollision ? PVOX_BRICK_EDGE_VOXELS ** 3 : 0, hasCollision ? PVOX_DEFAULT_LIMITS.maximumLogicalVoxels : 0);
  if (collisionLogicalVoxelCapacity !== collisionBrickCount * PVOX_BRICK_EDGE_VOXELS ** 3) {
    throw new Error("VoxelTechnicalProfile collisionLogicalVoxelCapacity must equal collisionBrickCount multiplied by 512.");
  }
  const collisionEncodedSurfaceSampleCount = requireInteger(record.collisionEncodedSurfaceSampleCount, "VoxelTechnicalProfile.collisionEncodedSurfaceSampleCount", hasCollision ? 1 : 0, hasCollision ? PVOX_DEFAULT_LIMITS.maximumEncodedSurfaceSamples : 0);
  if (collisionEncodedSurfaceSampleCount > collisionLogicalVoxelCapacity) {
    throw new Error("VoxelTechnicalProfile collision encoded sample count cannot exceed its logical voxel capacity.");
  }
  const requiredSectionCount = PVOX_MIN_STATIC_SECTION_COUNT + (bondRecordCount > 0 ? 1 : 0) + (hasCollision ? PVOX_COLLISION_SECTION_COUNT : 0);
  if (sectionCount !== requiredSectionCount) {
    throw new Error("VoxelTechnicalProfile sectionCount must exactly represent the closed static, optional bond, and optional collision section registry.");
  }
  const maximumDimensionMetres = Math.max(...supplied);
  const fullDiagonalMetres = Math.hypot(...supplied);
  const maximumPartitionExtentMetres = requireNumber(record.maximumPartitionExtentMetres, "VoxelTechnicalProfile.maximumPartitionExtentMetres", Number.EPSILON, maximumDimensionMetres + Math.max(1e-9, maximumDimensionMetres * 1e-9));
  const maximumPartitionDiagonalMetres = requireNumber(record.maximumPartitionDiagonalMetres, "VoxelTechnicalProfile.maximumPartitionDiagonalMetres", maximumPartitionExtentMetres, fullDiagonalMetres + Math.max(1e-9, fullDiagonalMetres * 1e-9));
  if (partitionCount === 1 && (!approximatelyEqual(maximumPartitionExtentMetres, maximumDimensionMetres) || !approximatelyEqual(maximumPartitionDiagonalMetres, fullDiagonalMetres))) {
    throw new Error("VoxelTechnicalProfile single-partition extent and diagonal must cover the complete bounds.");
  }
  const profile: VoxelTechnicalProfile = {
    boundsMetres,
    dimensionsMetres,
    geometryMode: requireEnum(record.geometryMode, ["solid", "shell", "mixed"] as const, "VoxelTechnicalProfile.geometryMode"),
    artifactByteLength,
    pageCount,
    brickCount,
    logicalVoxelCapacity,
    encodedSurfaceSampleCount,
    surfacePropertyCount,
    sectionCount,
    levelSpanRecordCount,
    physicalPaletteRecordCount,
    physicalEvidenceRecordCount,
    materialRegionCount,
    interiorLayerRecordCount,
    massPropertyRecordCount,
    bondRecordCount,
    hierarchyDepth,
    hierarchyNodeCount,
    lodCount,
    collisionHierarchyNodeCount,
    collisionBrickCount,
    collisionLogicalVoxelCapacity,
    collisionEncodedSurfaceSampleCount,
    cpuResidentByteLength: requireInteger(record.cpuResidentByteLength, "VoxelTechnicalProfile.cpuResidentByteLength", 1, PVOX_DEFAULT_LIMITS.maximumCpuResidentBytes),
    gpuResidentByteLength: requireInteger(record.gpuResidentByteLength, "VoxelTechnicalProfile.gpuResidentByteLength", 1, PVOX_DEFAULT_LIMITS.maximumGpuResidentBytes),
    hasCollision,
    partitionCount,
    maximumPartitionExtentMetres,
    maximumPartitionDiagonalMetres,
  };
  const minimumArtifactByteLength = calculatePvoxMinimumArtifactByteLength(profile);
  if (minimumArtifactByteLength > artifactByteLength) {
    throw new Error(`VoxelTechnicalProfile fixed PVOX records require at least ${minimumArtifactByteLength} artifact bytes.`);
  }
  return deepFreeze(profile);
}

/** Validate and deeply freeze one PVOX capability decision. */
export function createVoxelCapabilityAssessment(input: unknown): VoxelCapabilityAssessment {
  const record = asRecord(input, "VoxelCapabilityAssessment");
  exactKeys(record, ["capability", "status", "evaluatorId", "evaluatorVersion", "subjectContentHash", "evidenceHash", "reasonCodes", "evaluatedAt"], "VoxelCapabilityAssessment");
  const status = requireEnum(record.status, ["supported", "unsupported", "not-applicable"] as const, "VoxelCapabilityAssessment.status");
  const reasonCodes = requireReasonCodes(record.reasonCodes, "VoxelCapabilityAssessment.reasonCodes");
  if (status === "supported" && reasonCodes.length !== 0) throw new Error("Supported capability evidence must not contain failure reason codes.");
  if (status !== "supported" && reasonCodes.length === 0) throw new Error("Unavailable capability evidence requires a reason code.");
  return deepFreeze({
    capability: requireEnum(record.capability, PVOX_CAPABILITIES, "VoxelCapabilityAssessment.capability"),
    status,
    evaluatorId: requireToken(record.evaluatorId, "VoxelCapabilityAssessment.evaluatorId"),
    evaluatorVersion: assertImmutableAssetVersion(record.evaluatorVersion),
    subjectContentHash: requireSha256(record.subjectContentHash, "VoxelCapabilityAssessment.subjectContentHash"),
    evidenceHash: requireSha256(record.evidenceHash, "VoxelCapabilityAssessment.evidenceHash"),
    reasonCodes,
    evaluatedAt: requireTimestamp(record.evaluatedAt, "VoxelCapabilityAssessment.evaluatedAt"),
  });
}

export const PVOX_PHYSICAL_PROPERTY_POLICIES: Readonly<Record<PhysicalPropertyKind, Readonly<{ unit: string; minimum: number; maximum: number }>>> = deepFreeze({
  density: { unit: "kg/m3", minimum: Number.EPSILON, maximum: 50_000 },
  hardness: { unit: "Pa", minimum: Number.EPSILON, maximum: 1e12 },
  "tensile-strength": { unit: "Pa", minimum: Number.EPSILON, maximum: 1e12 },
  "compressive-strength": { unit: "Pa", minimum: Number.EPSILON, maximum: 1e12 },
  "shear-strength": { unit: "Pa", minimum: Number.EPSILON, maximum: 1e12 },
  "fracture-energy": { unit: "J/m2", minimum: Number.EPSILON, maximum: 1e9 },
  friction: { unit: "1", minimum: 0, maximum: 1 },
  restitution: { unit: "1", minimum: 0, maximum: 1 },
  "thermal-conductivity": { unit: "W/(m*K)", minimum: 0, maximum: 1e5 },
  "heat-capacity": { unit: "J/(kg*K)", minimum: 0, maximum: 1e7 },
  "thermal-expansion": { unit: "1/K", minimum: -1, maximum: 1 },
  "ignition-temperature": { unit: "K", minimum: Number.EPSILON, maximum: 100_000 },
  "melting-temperature": { unit: "K", minimum: Number.EPSILON, maximum: 100_000 },
  porosity: { unit: "1", minimum: 0, maximum: 1 },
  permeability: { unit: "m2", minimum: 0, maximum: 1 },
  "moisture-response": { unit: "1", minimum: 0, maximum: 1 },
  flammability: { unit: "1", minimum: 0, maximum: 1 },
  "corrosion-rate": { unit: "m/s", minimum: 0, maximum: 1 },
  "interior-thickness": { unit: "m", minimum: Number.EPSILON, maximum: 1_000_000 },
});

/** Validate and deeply freeze one localized physical-property value. */
export function createPhysicalPropertyEvidence(input: unknown): PhysicalPropertyEvidence {
  const record = asRecord(input, "PhysicalPropertyEvidence");
  exactKeys(record, ["property", "value", "unit", "provenance", "confidence", "subjectContentHash", "regionId", "materialId", "policyId", "policyVersion", "evidenceHash", "reviewedBy", "reviewedAt", "reviewToken"], "PhysicalPropertyEvidence");
  const property = requireEnum(record.property, PVOX_PHYSICAL_PROPERTIES, "PhysicalPropertyEvidence.property");
  const policy = PVOX_PHYSICAL_PROPERTY_POLICIES[property];
  if (record.policyId !== PVOX_PHYSICAL_PROPERTY_POLICY_ID || record.policyVersion !== PVOX_PHYSICAL_PROPERTY_POLICY_VERSION) {
    throw new Error("PhysicalPropertyEvidence must use the governed immutable physical-property policy.");
  }
  assertImmutableAssetVersion(record.policyVersion);
  if (record.unit !== policy.unit) throw new Error("PhysicalPropertyEvidence unit must match its governed property policy.");
  const provenance = requireEnum(record.provenance, ["source", "authored", "derived", "inferred", "default"] as const, "PhysicalPropertyEvidence.provenance");
  const reviewedBy = record.reviewedBy === undefined ? undefined : requireToken(record.reviewedBy, "PhysicalPropertyEvidence.reviewedBy");
  const reviewedAt = record.reviewedAt === undefined ? undefined : requireTimestamp(record.reviewedAt, "PhysicalPropertyEvidence.reviewedAt");
  const reviewToken = record.reviewToken === undefined ? undefined : requireAttestation(record.reviewToken, "PhysicalPropertyEvidence.reviewToken");
  if (new Set([reviewedBy, reviewedAt, reviewToken].map((entry) => entry === undefined)).size !== 1) throw new Error("PhysicalPropertyEvidence signed review identity, timestamp, and token must be supplied together.");
  if (provenance === "inferred" && reviewedBy === undefined) throw new Error("Inferred PhysicalPropertyEvidence requires human review.");
  return deepFreeze({
    property,
    value: requireNumber(record.value, "PhysicalPropertyEvidence.value", policy.minimum, policy.maximum),
    unit: policy.unit,
    provenance,
    confidence: requireNumber(record.confidence, "PhysicalPropertyEvidence.confidence", 0, 1),
    subjectContentHash: requireSha256(record.subjectContentHash, "PhysicalPropertyEvidence.subjectContentHash"),
    regionId: requireToken(record.regionId, "PhysicalPropertyEvidence.regionId"),
    materialId: requireToken(record.materialId, "PhysicalPropertyEvidence.materialId"),
    policyId: PVOX_PHYSICAL_PROPERTY_POLICY_ID,
    policyVersion: PVOX_PHYSICAL_PROPERTY_POLICY_VERSION,
    evidenceHash: requireSha256(record.evidenceHash, "PhysicalPropertyEvidence.evidenceHash"),
    ...(reviewedBy === undefined ? {} : { reviewedBy, reviewedAt, reviewToken }),
  });
}

/** Validate the validator-attested inventory that makes omitted PVOX material regions detectable. */
export function createPvoxPhysicalRegionInventoryV1(input: unknown): PvoxPhysicalRegionInventoryV1 {
  const fieldName = "PvoxPhysicalRegionInventoryV1";
  const record = asRecord(input, fieldName);
  exactKeys(record, ["inventoryVersion", "subjectContentHash", "inventoryHash", "inventoryHashAttestation", "validationEvidenceHash", "entries"], fieldName);
  if (record.inventoryVersion !== PVOX_PHYSICAL_REGION_INVENTORY_VERSION) throw new Error(`${fieldName}.inventoryVersion is unsupported.`);
  const entriesInput = asDenseArray(record.entries, `${fieldName}.entries`, 1, PVOX_DEFAULT_LIMITS.maximumMaterialRegions);
  const entries = entriesInput.map((entry, index): PvoxPhysicalRegionInventoryEntry => {
    const entryName = `${fieldName}.entries[${index}]`;
    const item = asRecord(entry, entryName);
    exactKeys(item, ["regionIndex", "physicalPaletteIndex", "regionId", "materialId"], entryName);
    return {
      regionIndex: requireInteger(item.regionIndex, `${entryName}.regionIndex`, 0, PVOX_DEFAULT_LIMITS.maximumMaterialRegions - 1),
      physicalPaletteIndex: requireInteger(item.physicalPaletteIndex, `${entryName}.physicalPaletteIndex`, 0, PVOX_DEFAULT_LIMITS.maximumPhysicalProperties - 1),
      regionId: requireToken(item.regionId, `${entryName}.regionId`),
      materialId: requireToken(item.materialId, `${entryName}.materialId`),
    };
  });
  if (entries.some((entry, index) => entry.regionIndex !== index)) throw new Error(`${fieldName} regionIndex values must be contiguous and canonically ordered.`);
  const pairs = entries.map(({ regionId, materialId }) => `${regionId}\u0000${materialId}`);
  if (new Set(pairs).size !== pairs.length) throw new Error(`${fieldName} region/material pairs must be unique.`);
  const inventoryHash = requireSha256(record.inventoryHash, `${fieldName}.inventoryHash`);
  return deepFreeze({
    inventoryVersion: PVOX_PHYSICAL_REGION_INVENTORY_VERSION,
    subjectContentHash: requireSha256(record.subjectContentHash, `${fieldName}.subjectContentHash`),
    inventoryHash,
    inventoryHashAttestation: createHashAttestation(record.inventoryHashAttestation, PVOX_PHYSICAL_INVENTORY_HASH_DOMAIN, inventoryHash, `${fieldName}.inventoryHashAttestation`),
    validationEvidenceHash: requireSha256(record.validationEvidenceHash, `${fieldName}.validationEvidenceHash`),
    entries,
  });
}

function createReviewedStructuralEvidence(
  input: unknown,
  expectedKind: PvoxReviewedStructuralEvidenceKind,
  expectedSubjectHash: string,
  expectedInventoryHash: string,
  expectedRecordCount: number,
  fieldName: string,
): PvoxReviewedStructuralEvidence {
  const record = asRecord(input, fieldName);
  exactKeys(record, ["kind", "subjectContentHash", "physicalInventoryHash", "recordCount", "evidenceHash", "reviewerId", "reviewedAt", "reviewToken"], fieldName);
  if (record.kind !== expectedKind) throw new Error(`${fieldName}.kind must be ${expectedKind}.`);
  const subjectContentHash = requireSha256(record.subjectContentHash, `${fieldName}.subjectContentHash`);
  const physicalInventoryHash = requireSha256(record.physicalInventoryHash, `${fieldName}.physicalInventoryHash`);
  const recordCount = requireInteger(record.recordCount, `${fieldName}.recordCount`, 0, PVOX_DEFAULT_LIMITS.maximumBondRecords);
  if (subjectContentHash !== expectedSubjectHash || physicalInventoryHash !== expectedInventoryHash || recordCount !== expectedRecordCount) {
    throw new Error(`${fieldName} must bind the exact PVOX closure, physical inventory, and binary record count.`);
  }
  return deepFreeze({
    kind: expectedKind,
    subjectContentHash,
    physicalInventoryHash,
    recordCount,
    evidenceHash: requireSha256(record.evidenceHash, `${fieldName}.evidenceHash`),
    reviewerId: requireToken(record.reviewerId, `${fieldName}.reviewerId`),
    reviewedAt: requireTimestamp(record.reviewedAt, `${fieldName}.reviewedAt`),
    reviewToken: requireAttestation(record.reviewToken, `${fieldName}.reviewToken`),
  });
}

/** Validate a measured fidelity decision and derive its non-overridable outcome. */
export function createPvoxFidelityEvidence(input: unknown): PvoxFidelityEvidence {
  const record = asRecord(input, "PvoxFidelityEvidence");
  exactKeys(record, [
    "profileId", "surfaceProfileId", "profileVersion", "outcome", "canonicalDocumentHash",
    "pvoxBinaryClosureHash", "evaluatedDiagonalMetres", "lod0CellSizeMetres", "maximumAllowedSurfaceErrorMetres",
    "maximumSurfaceErrorMetres", "p99AllowedSurfaceErrorMetres", "p99SurfaceErrorMetres",
    "minimumSilhouetteIou", "silhouetteIou", "maximumAllowedContourDisplacementPx",
    "maximumContourDisplacementPx", "minimumRenderedSsim", "renderedSsim",
    "maximumP95DeltaE2000", "p95DeltaE2000", "maximumNormalizedMaterialError",
    "normalizedMaterialError", "evidenceHash", "evaluatedAt", "decisionToken",
  ], "PvoxFidelityEvidence");
  const profileId = requireEnum(record.profileId, PVOX_FIDELITY_PROFILE_IDS, "PvoxFidelityEvidence.profileId");
  const surfaceProfileId = requireEnum(record.surfaceProfileId, [
    "precision-hero-v1",
    "props-furniture-v1",
    "rocks-organic-shells-v1",
    "buildings-v1",
  ] as const, "PvoxFidelityEvidence.surfaceProfileId");
  if (profileId !== "deformable-v1" && profileId !== surfaceProfileId) {
    throw new Error("PvoxFidelityEvidence surfaceProfileId must match its governed profileId.");
  }
  if (record.profileVersion !== PVOX_FIDELITY_PROFILE_VERSION) {
    throw new Error("PvoxFidelityEvidence.profileVersion must use the governed profile version.");
  }
  assertImmutableAssetVersion(record.profileVersion);
  const evaluatedDiagonalMetres = requireNumber(record.evaluatedDiagonalMetres, "PvoxFidelityEvidence.evaluatedDiagonalMetres", Number.EPSILON, 1_000_000_000);
  const lod0CellSizeMetres = requireNumber(record.lod0CellSizeMetres, "PvoxFidelityEvidence.lod0CellSizeMetres", Number.EPSILON, 1_000_000);
  const profileFormula: Readonly<Record<typeof surfaceProfileId, readonly [number, number]>> = {
    "precision-hero-v1": [0.00025, 0.0001],
    "props-furniture-v1": [0.0005, 0.00025],
    "rocks-organic-shells-v1": [0.001, 0.0005],
    "buildings-v1": [0.002, 0.0001],
  };
  const [absoluteFloor, diagonalFactor] = profileFormula[surfaceProfileId];
  const governedP99Ceiling = Math.max(absoluteFloor, evaluatedDiagonalMetres * diagonalFactor);
  const governedMaximumCeiling = Math.min(3 * governedP99Ceiling, 1.5 * lod0CellSizeMetres);
  const suppliedP99Ceiling = requireNumber(record.p99AllowedSurfaceErrorMetres, "PvoxFidelityEvidence.p99AllowedSurfaceErrorMetres", 0, 1_000_000);
  const suppliedMaximumCeiling = requireNumber(record.maximumAllowedSurfaceErrorMetres, "PvoxFidelityEvidence.maximumAllowedSurfaceErrorMetres", 0, 1_000_000);
  if (!approximatelyEqual(suppliedP99Ceiling, governedP99Ceiling) || !approximatelyEqual(suppliedMaximumCeiling, governedMaximumCeiling)) {
    throw new Error("PvoxFidelityEvidence surface ceilings must match the governed profile formula and LOD0 cell limit.");
  }
  const minimumSilhouetteIou = requireNumber(record.minimumSilhouetteIou, "PvoxFidelityEvidence.minimumSilhouetteIou", 0, 1);
  const maximumAllowedContourDisplacementPx = requireNumber(record.maximumAllowedContourDisplacementPx, "PvoxFidelityEvidence.maximumAllowedContourDisplacementPx", 0, 1_000_000);
  const minimumRenderedSsim = requireNumber(record.minimumRenderedSsim, "PvoxFidelityEvidence.minimumRenderedSsim", 0, 1);
  const maximumP95DeltaE2000 = requireNumber(record.maximumP95DeltaE2000, "PvoxFidelityEvidence.maximumP95DeltaE2000", 0, 100);
  const maximumNormalizedMaterialError = requireNumber(record.maximumNormalizedMaterialError, "PvoxFidelityEvidence.maximumNormalizedMaterialError", 0, 1);
  if (!approximatelyEqual(minimumSilhouetteIou, 0.995)
    || !approximatelyEqual(maximumAllowedContourDisplacementPx, 0.5)
    || !approximatelyEqual(minimumRenderedSsim, 0.98)
    || !approximatelyEqual(maximumP95DeltaE2000, 3)
    || !approximatelyEqual(maximumNormalizedMaterialError, 1 / 255)) {
    throw new Error("PvoxFidelityEvidence must use the governed silhouette, contour, render, colour, and material thresholds.");
  }
  const output = {
    profileId,
    surfaceProfileId,
    profileVersion: PVOX_FIDELITY_PROFILE_VERSION,
    canonicalDocumentHash: requireSha256(record.canonicalDocumentHash, "PvoxFidelityEvidence.canonicalDocumentHash"),
    pvoxBinaryClosureHash: requireSha256(record.pvoxBinaryClosureHash, "PvoxFidelityEvidence.pvoxBinaryClosureHash"),
    evaluatedDiagonalMetres,
    lod0CellSizeMetres,
    maximumAllowedSurfaceErrorMetres: governedMaximumCeiling,
    maximumSurfaceErrorMetres: requireNumber(record.maximumSurfaceErrorMetres, "PvoxFidelityEvidence.maximumSurfaceErrorMetres", 0, 1_000_000),
    p99AllowedSurfaceErrorMetres: governedP99Ceiling,
    p99SurfaceErrorMetres: requireNumber(record.p99SurfaceErrorMetres, "PvoxFidelityEvidence.p99SurfaceErrorMetres", 0, 1_000_000),
    minimumSilhouetteIou,
    silhouetteIou: requireNumber(record.silhouetteIou, "PvoxFidelityEvidence.silhouetteIou", 0, 1),
    maximumAllowedContourDisplacementPx,
    maximumContourDisplacementPx: requireNumber(record.maximumContourDisplacementPx, "PvoxFidelityEvidence.maximumContourDisplacementPx", 0, 1_000_000),
    minimumRenderedSsim,
    renderedSsim: requireNumber(record.renderedSsim, "PvoxFidelityEvidence.renderedSsim", 0, 1),
    maximumP95DeltaE2000,
    p95DeltaE2000: requireNumber(record.p95DeltaE2000, "PvoxFidelityEvidence.p95DeltaE2000", 0, 100),
    maximumNormalizedMaterialError,
    normalizedMaterialError: requireNumber(record.normalizedMaterialError, "PvoxFidelityEvidence.normalizedMaterialError", 0, 1),
    evidenceHash: requireSha256(record.evidenceHash, "PvoxFidelityEvidence.evidenceHash"),
    evaluatedAt: requireTimestamp(record.evaluatedAt, "PvoxFidelityEvidence.evaluatedAt"),
    decisionToken: requireAttestation(record.decisionToken, "PvoxFidelityEvidence.decisionToken"),
  };
  const passed = output.maximumSurfaceErrorMetres <= output.maximumAllowedSurfaceErrorMetres
    && output.p99SurfaceErrorMetres <= output.p99AllowedSurfaceErrorMetres
    && output.silhouetteIou >= output.minimumSilhouetteIou
    && output.maximumContourDisplacementPx <= output.maximumAllowedContourDisplacementPx
    && output.renderedSsim >= output.minimumRenderedSsim
    && output.p95DeltaE2000 <= output.maximumP95DeltaE2000
    && output.normalizedMaterialError <= output.maximumNormalizedMaterialError;
  const outcome = requireEnum(record.outcome, ["passed", "blocked"] as const, "PvoxFidelityEvidence.outcome");
  if (outcome !== (passed ? "passed" : "blocked")) throw new Error("PvoxFidelityEvidence outcome must match its measured fidelity thresholds.");
  return deepFreeze({ ...output, outcome });
}

function createPvoxEditJournalCurrentState(
  input: unknown,
  baseManifest: PvoxAssetManifestV1,
): PvoxEditJournalCurrentState {
  const fieldName = "PvoxEditJournalCurrentState";
  const record = asRecord(input, fieldName);
  exactKeys(record, ["baseContentHash", "basePageSetHash", "placementId", "gridVersion", "revision", "rootHash", "latestJournalHash", "pageHashes"], fieldName);
  const pageEntries = asDenseArray(record.pageHashes, `${fieldName}.pageHashes`, baseManifest.pages.length, baseManifest.pages.length);
  const pageHashes = pageEntries.map((entry, index) => {
    const entryName = `${fieldName}.pageHashes[${index}]`;
    const page = asRecord(entry, entryName);
    exactKeys(page, ["pageIndex", "sha256"], entryName);
    const pageIndex = requireInteger(page.pageIndex, `${entryName}.pageIndex`, 0, baseManifest.pages.length - 1);
    if (pageIndex !== index) throw new Error(`${fieldName}.pageHashes must be complete and ordered by pageIndex.`);
    return { pageIndex, sha256: requireSha256(page.sha256, `${entryName}.sha256`) };
  });
  return deepFreeze({
    baseContentHash: requireSha256(record.baseContentHash, `${fieldName}.baseContentHash`),
    basePageSetHash: requireSha256(record.basePageSetHash, `${fieldName}.basePageSetHash`),
    placementId: requireToken(record.placementId, `${fieldName}.placementId`),
    gridVersion: requireToken(record.gridVersion, `${fieldName}.gridVersion`),
    revision: requireInteger(record.revision, `${fieldName}.revision`, 1, Number.MAX_SAFE_INTEGER),
    rootHash: requireSha256(record.rootHash, `${fieldName}.rootHash`),
    latestJournalHash: requireSha256(record.latestJournalHash, `${fieldName}.latestJournalHash`),
    pageHashes,
  });
}

/** Validate and deeply freeze one placement-specific edit journal. */
export function createPvoxEditJournal(
  input: unknown,
  baseManifestInput: unknown,
  currentStateInput?: unknown,
): PvoxEditJournal {
  const record = asRecord(input, "PvoxEditJournal");
  exactKeys(record, ["journalVersion", "baseContentHash", "basePageSetHash", "placementId", "gridVersion", "operationId", "expectedRevision", "resultingRevision", "previousJournalHash", "expectedRootHash", "resultingRootHash", "resultingRootHashAttestation", "patches", "dirtyBoundsMetres", "massDeltaKg", "journalHash", "journalHashAttestation", "recordedAt"], "PvoxEditJournal");
  if (record.journalVersion !== PVOX_EDIT_JOURNAL_VERSION) throw new Error("PvoxEditJournal.journalVersion is unsupported.");
  const baseManifest = createPvoxAssetManifestV1(baseManifestInput);
  const baseContentHash = requireSha256(record.baseContentHash, "PvoxEditJournal.baseContentHash");
  const basePageSetHash = requireSha256(record.basePageSetHash, "PvoxEditJournal.basePageSetHash");
  if (baseContentHash !== baseManifest.artifact.sha256 || basePageSetHash !== baseManifest.pageSetHash) {
    throw new Error("PvoxEditJournal must bind the exact base PVOX artifact and page inventory.");
  }
  const expectedRevision = requireInteger(record.expectedRevision, "PvoxEditJournal.expectedRevision", 0, Number.MAX_SAFE_INTEGER - 1);
  const resultingRevision = requireInteger(record.resultingRevision, "PvoxEditJournal.resultingRevision", 1, Number.MAX_SAFE_INTEGER);
  if (resultingRevision !== expectedRevision + 1) throw new Error("PvoxEditJournal revisions must be sequential.");
  const previousJournalHash = requireSha256(record.previousJournalHash, "PvoxEditJournal.previousJournalHash");
  if ((expectedRevision === 0) !== (previousJournalHash === PVOX_EDIT_JOURNAL_GENESIS_HASH)) {
    throw new Error("PvoxEditJournal genesis revision must use only the canonical genesis previousJournalHash.");
  }
  const expectedRootHash = requireSha256(record.expectedRootHash, "PvoxEditJournal.expectedRootHash");
  const resultingRootHash = requireSha256(record.resultingRootHash, "PvoxEditJournal.resultingRootHash");
  if (expectedRootHash === resultingRootHash) throw new Error("PvoxEditJournal copy-on-write operation must change the overlay root hash.");
  const placementId = requireToken(record.placementId, "PvoxEditJournal.placementId");
  const gridVersion = requireToken(record.gridVersion, "PvoxEditJournal.gridVersion");
  let currentState: PvoxEditJournalCurrentState | undefined;
  if (expectedRevision === 0) {
    if (currentStateInput !== undefined) throw new Error("PvoxEditJournal genesis must not supply a non-genesis current state.");
    if (expectedRootHash !== baseManifest.rootHash) throw new Error("PvoxEditJournal genesis expectedRootHash must equal the authenticated base PVOX rootHash.");
  } else {
    if (currentStateInput === undefined) throw new Error("PvoxEditJournal non-genesis validation requires the authenticated current placement state.");
    currentState = createPvoxEditJournalCurrentState(currentStateInput, baseManifest);
    if (currentState.baseContentHash !== baseContentHash
      || currentState.basePageSetHash !== basePageSetHash
      || currentState.placementId !== placementId
      || currentState.gridVersion !== gridVersion
      || currentState.revision !== expectedRevision
      || currentState.rootHash !== expectedRootHash
      || currentState.latestJournalHash !== previousJournalHash) {
      throw new Error("PvoxEditJournal non-genesis CAS subject must match the authenticated current placement state.");
    }
  }
  const patchEntries = asDenseArray(record.patches, "PvoxEditJournal.patches", 1, PVOX_MAX_EDIT_PATCHES);
  const patches = patchEntries.map((entry, index): PvoxBrickPatchDescriptor => {
    const fieldName = `PvoxEditJournal.patches[${index}]`;
    const patch = asRecord(entry, fieldName);
    exactKeys(patch, ["fieldKind", "lodLevel", "partitionIndex", "hierarchyDepth", "mortonCode", "expectedPageIndex", "expectedPageHash", "operation", "expectedBrickHash", "resultingBrickHash", "resultingPageHash"], fieldName);
    const mortonCode = requireString(patch.mortonCode, `${fieldName}.mortonCode`, 16);
    if (!MORTON_CODE.test(mortonCode)) throw new Error(`${fieldName}.mortonCode must be a canonical Morton code.`);
    const operation = requireEnum(patch.operation, ["insert", "replace", "remove"] as const, `${fieldName}.operation`);
    const expectedBrickHash = requireSha256(patch.expectedBrickHash, `${fieldName}.expectedBrickHash`);
    const resultingBrickHash = requireSha256(patch.resultingBrickHash, `${fieldName}.resultingBrickHash`);
    const expectedPageHash = requireSha256(patch.expectedPageHash, `${fieldName}.expectedPageHash`);
    const resultingPageHash = requireSha256(patch.resultingPageHash, `${fieldName}.resultingPageHash`);
    if (operation === "replace" && (expectedBrickHash === PVOX_EDIT_JOURNAL_GENESIS_HASH || resultingBrickHash === PVOX_EDIT_JOURNAL_GENESIS_HASH || expectedBrickHash === resultingBrickHash)) throw new Error(`${fieldName} replacement must change one non-empty brick hash to another.`);
    if (operation === "insert" && (expectedBrickHash !== PVOX_EDIT_JOURNAL_GENESIS_HASH || resultingBrickHash === PVOX_EDIT_JOURNAL_GENESIS_HASH)) throw new Error(`${fieldName} insertion must change an empty brick to a non-empty result.`);
    if (operation === "remove" && (expectedBrickHash === PVOX_EDIT_JOURNAL_GENESIS_HASH || resultingBrickHash !== PVOX_EDIT_JOURNAL_GENESIS_HASH)) throw new Error(`${fieldName} removal must change a non-empty expected brick to the empty result.`);
    if (expectedPageHash === resultingPageHash) throw new Error(`${fieldName} copy-on-write patch must change the page hash.`);
    const fieldKind = requireEnum(patch.fieldKind, ["render-field", "collision-field"] as const, `${fieldName}.fieldKind`);
    const lodLevel = requireInteger(patch.lodLevel, `${fieldName}.lodLevel`, 0, PVOX_DEFAULT_LIMITS.maximumLodCount - 1) as PvoxLodLevel;
    const partitionIndex = requireInteger(patch.partitionIndex, `${fieldName}.partitionIndex`, 0, PVOX_DEFAULT_LIMITS.maximumPartitions - 1);
    const hierarchyDepth = requireInteger(patch.hierarchyDepth, `${fieldName}.hierarchyDepth`, 0, PVOX_DEFAULT_LIMITS.maximumHierarchyDepth);
    const expectedPageIndex = requireInteger(patch.expectedPageIndex, `${fieldName}.expectedPageIndex`, 0, baseManifest.pages.length - 1);
    const basePage = baseManifest.pages[expectedPageIndex]!;
    if (basePage.pageKind !== fieldKind
      || basePage.spatialKey?.lodLevel !== lodLevel
      || basePage.spatialKey.partitionIndex !== partitionIndex
      || basePage.spatialKey.hierarchyDepth !== hierarchyDepth
      || mortonCode < basePage.spatialKey.minimumMortonCode
      || mortonCode > basePage.spatialKey.maximumMortonCode
      || (expectedRevision === 0 && expectedPageHash !== basePage.sha256)
      || (currentState !== undefined && currentState.pageHashes[expectedPageIndex]!.sha256 !== expectedPageHash)) {
      throw new Error(`${fieldName} must address and CAS the exact base PVOX page inventory.`);
    }
    return {
      fieldKind,
      lodLevel,
      partitionIndex,
      hierarchyDepth,
      mortonCode,
      expectedPageIndex,
      expectedPageHash,
      operation,
      expectedBrickHash,
      resultingBrickHash,
      resultingPageHash,
    };
  });
  const patchAddress = (patch: PvoxBrickPatchDescriptor): string => [
    patch.fieldKind,
    String(patch.lodLevel).padStart(2, "0"),
    String(patch.partitionIndex).padStart(6, "0"),
    String(patch.hierarchyDepth).padStart(2, "0"),
    patch.mortonCode,
  ].join("\u0000");
  for (let index = 1; index < patches.length; index += 1) {
    if (patchAddress(patches[index]!) <= patchAddress(patches[index - 1]!)) throw new Error("PvoxEditJournal patches must be unique and ordered by field, LOD, partition, depth, and Morton code.");
  }
  if (new Set(patches.map(({ expectedPageIndex }) => expectedPageIndex)).size !== patches.length) {
    throw new Error("PvoxEditJournal permits only one coherent patch transition per page.");
  }
  const journalHash = requireSha256(record.journalHash, "PvoxEditJournal.journalHash");
  return deepFreeze({
    journalVersion: PVOX_EDIT_JOURNAL_VERSION,
    baseContentHash,
    basePageSetHash,
    placementId,
    gridVersion,
    operationId: requireToken(record.operationId, "PvoxEditJournal.operationId"),
    expectedRevision,
    resultingRevision,
    previousJournalHash,
    expectedRootHash,
    resultingRootHash,
    resultingRootHashAttestation: createHashAttestation(record.resultingRootHashAttestation, PVOX_EDIT_OVERLAY_ROOT_HASH_DOMAIN, resultingRootHash, "PvoxEditJournal.resultingRootHashAttestation"),
    patches,
    dirtyBoundsMetres: createBounds(record.dirtyBoundsMetres, "PvoxEditJournal.dirtyBoundsMetres"),
    massDeltaKg: requireNumber(record.massDeltaKg, "PvoxEditJournal.massDeltaKg", -Number.MAX_VALUE, Number.MAX_VALUE),
    journalHash,
    journalHashAttestation: createHashAttestation(record.journalHashAttestation, PVOX_EDIT_JOURNAL_HASH_DOMAIN, journalHash, "PvoxEditJournal.journalHashAttestation"),
    recordedAt: requireTimestamp(record.recordedAt, "PvoxEditJournal.recordedAt"),
  });
}

/** Validate an ordered, gap-free CAS journal chain for one placement overlay. */
export function createPvoxEditJournalChain(input: unknown, baseManifestInput: unknown): readonly PvoxEditJournal[] {
  const entries = asDenseArray(input, "PvoxEditJournalChain", 1, 10_000);
  const baseManifest = createPvoxAssetManifestV1(baseManifestInput);
  const journals: PvoxEditJournal[] = [];
  const operationIds = new Set<string>();
  const currentPageHashes = new Map(baseManifest.pages.map(({ pageIndex, sha256 }) => [pageIndex, sha256]));
  for (const entry of entries) {
    const previous = journals.at(-1);
    const currentState: PvoxEditJournalCurrentState | undefined = previous === undefined ? undefined : {
      baseContentHash: previous.baseContentHash,
      basePageSetHash: previous.basePageSetHash,
      placementId: previous.placementId,
      gridVersion: previous.gridVersion,
      revision: previous.resultingRevision,
      rootHash: previous.resultingRootHash,
      latestJournalHash: previous.journalHash,
      pageHashes: baseManifest.pages.map(({ pageIndex }) => ({ pageIndex, sha256: currentPageHashes.get(pageIndex)! })),
    };
    const journal = createPvoxEditJournal(entry, baseManifest, currentState);
    if (previous === undefined && (journal.expectedRevision !== 0 || journal.previousJournalHash !== PVOX_EDIT_JOURNAL_GENESIS_HASH)) {
      throw new Error("PvoxEditJournalChain must begin at the canonical genesis revision.");
    }
    if (previous !== undefined && Date.parse(journal.recordedAt) < Date.parse(previous.recordedAt)) {
      throw new Error("PvoxEditJournalChain entries must form one chronological revision/root/hash chain.");
    }
    if (operationIds.has(journal.operationId)) throw new Error("PvoxEditJournalChain operation IDs must be unique to prevent replay.");
    operationIds.add(journal.operationId);
    for (const patch of journal.patches) {
      if (currentPageHashes.get(patch.expectedPageIndex) !== patch.expectedPageHash) {
        throw new Error("PvoxEditJournalChain patch expectedPageHash must match the current page CAS state.");
      }
      currentPageHashes.set(patch.expectedPageIndex, patch.resultingPageHash);
    }
    journals.push(journal);
  }
  return deepFreeze(journals);
}

function createCompilerEvidence(value: unknown): PvoxCompilerEvidence {
  const record = asRecord(value, "ModelProcessingManifestV2.converter");
  exactKeys(record, ["compilerId", "compilerVersion", "sourceFormat", "sourceContentHash", "canonicalDocumentHash", "compilationInputHash", "runtimeRequestProfileHash", "outputContentHash", "evidenceHash", "compiledAt"], "ModelProcessingManifestV2.converter");
  return {
    compilerId: requireToken(record.compilerId, "ModelProcessingManifestV2.converter.compilerId"),
    compilerVersion: assertImmutableAssetVersion(record.compilerVersion),
    sourceFormat: requireToken(record.sourceFormat, "ModelProcessingManifestV2.converter.sourceFormat"),
    sourceContentHash: requireSha256(record.sourceContentHash, "ModelProcessingManifestV2.converter.sourceContentHash"),
    canonicalDocumentHash: requireSha256(record.canonicalDocumentHash, "ModelProcessingManifestV2.converter.canonicalDocumentHash"),
    compilationInputHash: requireSha256(record.compilationInputHash, "ModelProcessingManifestV2.converter.compilationInputHash"),
    runtimeRequestProfileHash: requireSha256(record.runtimeRequestProfileHash, "ModelProcessingManifestV2.converter.runtimeRequestProfileHash"),
    outputContentHash: requireSha256(record.outputContentHash, "ModelProcessingManifestV2.converter.outputContentHash"),
    evidenceHash: requireSha256(record.evidenceHash, "ModelProcessingManifestV2.converter.evidenceHash"),
    compiledAt: requireTimestamp(record.compiledAt, "ModelProcessingManifestV2.converter.compiledAt"),
  };
}

/** Validate and deeply freeze one non-overridable PVOX gate. */
export function createPvoxGateEvidence(input: unknown): PvoxGateEvidence {
  const record = asRecord(input, "PvoxGateEvidence");
  exactKeys(record, ["kind", "outcome", "validatorId", "validatorVersion", "subjectContentHash", "evidenceHash", "reasonCodes", "evaluatedAt", "attestationToken"], "PvoxGateEvidence");
  const outcome = requireEnum(record.outcome, ["passed", "blocked"] as const, "PvoxGateEvidence.outcome");
  const reasonCodes = requireReasonCodes(record.reasonCodes, "PvoxGateEvidence.reasonCodes");
  if (outcome === "blocked" && reasonCodes.length === 0) throw new Error("Blocked PvoxGateEvidence requires a reason code.");
  return deepFreeze({
    kind: requireEnum(record.kind, PVOX_NON_OVERRIDABLE_GATE_KINDS, "PvoxGateEvidence.kind"),
    outcome,
    validatorId: requireToken(record.validatorId, "PvoxGateEvidence.validatorId"),
    validatorVersion: assertImmutableAssetVersion(record.validatorVersion),
    subjectContentHash: requireSha256(record.subjectContentHash, "PvoxGateEvidence.subjectContentHash"),
    evidenceHash: requireSha256(record.evidenceHash, "PvoxGateEvidence.evidenceHash"),
    reasonCodes,
    evaluatedAt: requireTimestamp(record.evaluatedAt, "PvoxGateEvidence.evaluatedAt"),
    attestationToken: requireAttestation(record.attestationToken, "PvoxGateEvidence.attestationToken"),
  });
}

function createTransform(value: unknown, fieldName: string): ModelTransform {
  const record = asRecord(value, fieldName);
  exactKeys(record, ["translationMetres", "rotationQuaternion", "scale"], fieldName);
  const translationMetres = requireVector(record.translationMetres, `${fieldName}.translationMetres`);
  const rotationEntries = asDenseArray(record.rotationQuaternion, `${fieldName}.rotationQuaternion`, 4, 4);
  const rotationQuaternion = rotationEntries.map((entry, index) => requireNumber(entry, `${fieldName}.rotationQuaternion[${index}]`, -1, 1)) as [number, number, number, number];
  if (Math.abs(Math.hypot(...rotationQuaternion) - 1) > 1e-4) throw new Error(`${fieldName}.rotationQuaternion must be normalized.`);
  const scale = requireVector(record.scale, `${fieldName}.scale`);
  if (scale.some((entry) => entry <= 0)) throw new Error(`${fieldName}.scale values must be positive.`);
  return { translationMetres, rotationQuaternion, scale };
}

function createAssemblyChild(value: unknown, index: number, resolutionId: string, candidateId: string): PvoxAssemblyChild {
  const fieldName = `ModelProcessingManifestV2.children[${index}]`;
  const record = asRecord(value, fieldName);
  exactKeys(record, ["instanceId", "parentInstanceId", "assetRef", "transform"], fieldName);
  const childRef = asRecord(record.assetRef, `${fieldName}.assetRef`);
  let assetRef: PvoxAssemblyChild["assetRef"];
  if (childRef.disposition === "staged-derived") {
    exactKeys(childRef, ["disposition", "representation", "derivedId", "kind", "contentHash", "binaryClosureHash", "processingClosureHash", "processingManifestId", "processingManifestUri"], `${fieldName}.assetRef`);
    if (childRef.kind !== "leaf" || childRef.representation !== "pvox") throw new Error(`${fieldName}.assetRef must be a PVOX leaf.`);
    const derivedId = requirePathSegment(childRef.derivedId, `${fieldName}.assetRef.derivedId`);
    const expectedUri = `mcp://models/resolutions/${resolutionId}/candidates/${candidateId}/derived/${derivedId}/processing-manifest`;
    if (childRef.processingManifestUri !== expectedUri) throw new Error(`${fieldName}.assetRef.processingManifestUri must match the exact staged-derived PVOX identity.`);
    assetRef = {
      disposition: "staged-derived",
      representation: "pvox",
      derivedId,
      kind: "leaf",
      contentHash: requireSha256(childRef.contentHash, `${fieldName}.assetRef.contentHash`),
      binaryClosureHash: requireSha256(childRef.binaryClosureHash, `${fieldName}.assetRef.binaryClosureHash`),
      processingClosureHash: requireSha256(childRef.processingClosureHash, `${fieldName}.assetRef.processingClosureHash`),
      processingManifestId: requireToken(childRef.processingManifestId, `${fieldName}.assetRef.processingManifestId`),
      processingManifestUri: expectedUri,
    };
  } else {
    exactKeys(childRef, ["disposition", "representation", "asset", "processingManifestId", "binaryClosureHash", "processingClosureHash", "processingManifestUri"], `${fieldName}.assetRef`);
    if (childRef.disposition !== "existing" || childRef.representation !== "pvox") throw new Error(`${fieldName}.assetRef must use an existing or staged-derived PVOX disposition.`);
    assertDataOnlyTree(childRef.asset, `${fieldName}.assetRef.asset`);
    const asset = createModelAssetRef(childRef.asset);
    if (asset.kind !== "leaf") throw new Error(`${fieldName}.assetRef must reference a leaf.`);
    const expectedUri = `mcp://models/catalog/${asset.assetId}/versions/${asset.version}/processing-manifest`;
    if (childRef.processingManifestUri !== expectedUri) throw new Error(`${fieldName}.assetRef.processingManifestUri must match the immutable catalog PVOX identity.`);
    assetRef = {
      disposition: "existing",
      representation: "pvox",
      asset,
      processingManifestId: requireToken(childRef.processingManifestId, `${fieldName}.assetRef.processingManifestId`),
      binaryClosureHash: requireSha256(childRef.binaryClosureHash, `${fieldName}.assetRef.binaryClosureHash`),
      processingClosureHash: requireSha256(childRef.processingClosureHash, `${fieldName}.assetRef.processingClosureHash`),
      processingManifestUri: expectedUri,
    };
  }
  const parentInstanceId = record.parentInstanceId === undefined ? undefined : requireToken(record.parentInstanceId, `${fieldName}.parentInstanceId`);
  return {
    instanceId: requireToken(record.instanceId, `${fieldName}.instanceId`),
    ...(parentInstanceId === undefined ? {} : { parentInstanceId }),
    assetRef,
    transform: createTransform(record.transform, `${fieldName}.transform`),
  };
}

function assertAssembly(children: readonly PvoxAssemblyChild[]): void {
  const byId = new Map(children.map((child) => [child.instanceId, child]));
  if (byId.size !== children.length) throw new Error("ModelProcessingManifestV2 assembly instance IDs must be unique.");
  if (children.some((child, index) => index > 0 && child.instanceId <= children[index - 1]!.instanceId)) throw new Error("ModelProcessingManifestV2 assembly children must be canonically ordered by instanceId.");
  if (children.filter(({ parentInstanceId }) => parentInstanceId === undefined).length !== 1) throw new Error("ModelProcessingManifestV2 assembly must contain exactly one root child.");
  const stagedDerivedIds = children.flatMap(({ assetRef }) => assetRef.disposition === "staged-derived" ? [assetRef.derivedId] : []);
  if (new Set(stagedDerivedIds).size !== stagedDerivedIds.length) throw new Error("ModelProcessingManifestV2 staged-derived child IDs must be unique.");
  for (const child of children) {
    const visited = new Set<string>();
    let current: PvoxAssemblyChild | undefined = child;
    let depth = 0;
    while (current?.parentInstanceId !== undefined) {
      if (current.parentInstanceId === current.instanceId || visited.has(current.instanceId)) throw new Error("ModelProcessingManifestV2 assembly must be acyclic.");
      visited.add(current.instanceId);
      current = byId.get(current.parentInstanceId);
      if (current === undefined) throw new Error("ModelProcessingManifestV2 assembly parent must exist.");
      depth += 1;
      if (depth > 16) throw new Error("ModelProcessingManifestV2 assembly depth exceeds the limit.");
    }
  }
}

const PVOX_CAPABILITY_PHYSICAL_PROPERTIES: Readonly<Partial<Record<PvoxCapability, readonly PhysicalPropertyKind[]>>> = Object.freeze({
  destruction: ["density", "hardness", "tensile-strength", "compressive-strength", "shear-strength", "fracture-energy", "friction", "restitution", "interior-thickness"],
  thermal: ["thermal-conductivity", "heat-capacity", "thermal-expansion", "ignition-temperature", "melting-temperature", "flammability"],
  moisture: ["porosity", "permeability", "moisture-response", "corrosion-rate"],
  "fluid-boundary": ["porosity", "permeability"],
});

const NON_DEFAULT_CRITICAL_PROPERTIES = new Set<PhysicalPropertyKind>([
  "density",
  "hardness",
  "tensile-strength",
  "compressive-strength",
  "shear-strength",
  "fracture-energy",
  "interior-thickness",
  "ignition-temperature",
  "melting-temperature",
]);

/** Validate and deeply freeze a PVOX-only processing manifest. */
export function createModelProcessingManifestV2(input: unknown): ModelProcessingManifestV2 {
  const record = asRecord(input, "ModelProcessingManifestV2");
  exactKeys(record, [
    "contractVersion", "representation", "manifestId", "resolutionId", "candidateId", "kind",
    "requestProfileId", "requestSemanticProfileHash", "capabilityProfileId", "contentHash", "binaryClosureHash",
    "processingClosureHash", "processingClosureAttestation", "assemblyClosureHash", "assemblyClosureAttestation",
    "compilationInputHash", "runtimeRequestProfileHash", "coordinateSystem", "pvox", "technicalProfile",
    "requiredCapabilities", "capabilities", "capabilityEvidenceSetHash", "capabilityEvidenceSetAttestation",
    "physicalRegionInventory", "physicalProperties", "physicalEvidenceHash", "physicalEvidenceAttestation",
    "massPropertiesEvidence", "bondGraphEvidence", "interiorLayerEvidence", "converter", "fidelity", "children", "processedAt",
  ], "ModelProcessingManifestV2");
  if (record.contractVersion !== MODEL_RESOLUTION_V2_CONTRACT_VERSION) throw new Error("ModelProcessingManifestV2.contractVersion is unsupported.");
  if (record.representation !== "pvox") throw new Error("ModelProcessingManifestV2.representation must be pvox.");
  const resolutionId = requirePathSegment(record.resolutionId, "ModelProcessingManifestV2.resolutionId");
  const candidateId = requirePathSegment(record.candidateId, "ModelProcessingManifestV2.candidateId");
  assertCoordinateSystem(record.coordinateSystem, "ModelProcessingManifestV2.coordinateSystem");
  const pvox = createPvoxAssetManifestV1(record.pvox);
  const resourceScope = parsePvoxResourceScope(pvox.artifact.uri);
  if (resourceScope.kind === "resolution" && (resourceScope.resolutionId !== resolutionId || resourceScope.candidateId !== candidateId)) {
    throw new Error("ModelProcessingManifestV2 PVOX resource namespace must match resolutionId and candidateId.");
  }
  const technicalProfile = createVoxelTechnicalProfile(record.technicalProfile);
  const contentHash = requireSha256(record.contentHash, "ModelProcessingManifestV2.contentHash");
  const binaryClosureHash = requireSha256(record.binaryClosureHash, "ModelProcessingManifestV2.binaryClosureHash");
  const processingClosureHash = requireSha256(record.processingClosureHash, "ModelProcessingManifestV2.processingClosureHash");
  const assemblyClosureHash = requireSha256(record.assemblyClosureHash, "ModelProcessingManifestV2.assemblyClosureHash");
  const requestSemanticProfileHash = requireSha256(record.requestSemanticProfileHash, "ModelProcessingManifestV2.requestSemanticProfileHash");
  const compilationInputHash = requireSha256(record.compilationInputHash, "ModelProcessingManifestV2.compilationInputHash");
  const runtimeRequestProfileHash = requireSha256(record.runtimeRequestProfileHash, "ModelProcessingManifestV2.runtimeRequestProfileHash");
  if (contentHash !== pvox.artifact.sha256) throw new Error("ModelProcessingManifestV2 contentHash must match the PVOX artifact.");
  if (binaryClosureHash !== pvox.binaryClosureHash) throw new Error("ModelProcessingManifestV2 binaryClosureHash must match the PVOX binary closure.");
  if (compilationInputHash !== pvox.compilationInputHash || runtimeRequestProfileHash !== pvox.runtimeRequestProfileHash) {
    throw new Error("ModelProcessingManifestV2 compilation input and runtime request profile hashes must match the PVOX header bindings.");
  }
  const artifactRenderBrickCount = pvox.lods.reduce((total, lodRecord) => total + lodRecord.brickCount, 0);
  if (
    technicalProfile.artifactByteLength !== pvox.artifact.byteLength
    || technicalProfile.pageCount !== pvox.pages.length
    || technicalProfile.sectionCount !== pvox.sectionCount
    || technicalProfile.brickCount !== artifactRenderBrickCount
    || technicalProfile.lodCount !== pvox.lods.length
    || technicalProfile.geometryMode !== pvox.geometryMode
    || JSON.stringify(technicalProfile.boundsMetres) !== JSON.stringify(pvox.boundsMetres)
  ) throw new Error("ModelProcessingManifestV2 technicalProfile must match the PVOX artifact.");
  if (!pvox.pages.some(({ pageKind }) => pageKind === "metadata")) throw new Error("ModelProcessingManifestV2 PVOX must contain a metadata page for its header and directory.");
  if (technicalProfile.hierarchyNodeCount > 0 && !pvox.pages.some(({ pageKind }) => pageKind === "lod-structure")) {
    throw new Error("ModelProcessingManifestV2 hierarchy nodes require a lod-structure page.");
  }
  const collisionPages = pvox.pages.filter(({ pageKind }) => pageKind === "collision-field");
  if (technicalProfile.hasCollision !== (collisionPages.length > 0)) {
    throw new Error("ModelProcessingManifestV2 collision technical claims require matching collision-field pages and forbid unclaimed collision pages.");
  }
  const maximumGridExtentMetres = pvox.lods[0]!.cellSizeMetres * PVOX_BRICK_EDGE_VOXELS * 2 ** technicalProfile.hierarchyDepth;
  if (technicalProfile.maximumPartitionExtentMetres > maximumGridExtentMetres && !approximatelyEqual(technicalProfile.maximumPartitionExtentMetres, maximumGridExtentMetres)) {
    throw new Error("ModelProcessingManifestV2 partition extent exceeds the LOD0 cell and hierarchy grid capacity; use smaller fidelity-driven partitions.");
  }
  const capabilityEntries = asDenseArray(record.capabilities, "ModelProcessingManifestV2.capabilities", PVOX_CAPABILITIES.length, PVOX_CAPABILITIES.length);
  const capabilities = capabilityEntries.map(createVoxelCapabilityAssessment);
  const byCapability = new Map(capabilities.map((entry) => [entry.capability, entry]));
  if (byCapability.size !== PVOX_CAPABILITIES.length || PVOX_CAPABILITIES.some((name) => !byCapability.has(name))) throw new Error("ModelProcessingManifestV2 must include every PVOX capability exactly once.");
  const orderedCapabilities = PVOX_CAPABILITIES.map((name) => byCapability.get(name)!);
  if (orderedCapabilities.some((entry) => entry.subjectContentHash !== binaryClosureHash)) throw new Error("ModelProcessingManifestV2 capability evidence must bind the binaryClosureHash.");
  const capabilityEvidenceSetHash = requireSha256(record.capabilityEvidenceSetHash, "ModelProcessingManifestV2.capabilityEvidenceSetHash");
  const capabilityEvidenceSetAttestation = createHashAttestation(
    record.capabilityEvidenceSetAttestation,
    PVOX_CAPABILITY_SET_HASH_DOMAIN,
    capabilityEvidenceSetHash,
    "ModelProcessingManifestV2.capabilityEvidenceSetAttestation",
  );
  const requiredCapabilityEntries = asDenseArray(record.requiredCapabilities, "ModelProcessingManifestV2.requiredCapabilities", 1, PVOX_CAPABILITIES.length);
  const requiredCapabilities = requiredCapabilityEntries.map((entry, index) => requireEnum(entry, PVOX_CAPABILITIES, `ModelProcessingManifestV2.requiredCapabilities[${index}]`));
  if (new Set(requiredCapabilities).size !== requiredCapabilities.length) throw new Error("ModelProcessingManifestV2.requiredCapabilities must be unique.");
  if (!requiredCapabilities.includes("rendering")) throw new Error("ModelProcessingManifestV2 rendering capability is always required.");
  if (technicalProfile.hasCollision !== (byCapability.get("collision")?.status === "supported")) throw new Error("ModelProcessingManifestV2 collision capability must match technicalProfile.hasCollision.");
  if (technicalProfile.hasCollision && collisionPages.every(({ spatialKey }) => spatialKey?.lodLevel !== 0)) {
    throw new Error("ModelProcessingManifestV2 supported collision requires LOD0 collision-field evidence.");
  }
  const physicalRegionInventory = createPvoxPhysicalRegionInventoryV1(record.physicalRegionInventory);
  if (physicalRegionInventory.subjectContentHash !== binaryClosureHash
    || physicalRegionInventory.validationEvidenceHash !== pvox.validationEvidenceHash
    || physicalRegionInventory.entries.length !== technicalProfile.materialRegionCount
    || physicalRegionInventory.entries.some(({ physicalPaletteIndex }) => physicalPaletteIndex >= technicalProfile.physicalPaletteRecordCount)) {
    throw new Error("ModelProcessingManifestV2 authoritative physical region inventory must bind the PVOX validator, closure, region count, and palette records.");
  }
  const physicalEntries = asDenseArray(record.physicalProperties, "ModelProcessingManifestV2.physicalProperties", 0, PVOX_DEFAULT_LIMITS.maximumPhysicalEvidenceEntries);
  const physicalProperties = physicalEntries.map(createPhysicalPropertyEvidence);
  const byRegionProperty = new Map(physicalProperties.map((entry) => [`${entry.regionId}\u0000${entry.materialId}\u0000${entry.property}`, entry]));
  if (byRegionProperty.size !== physicalProperties.length) throw new Error("ModelProcessingManifestV2 physical properties must be unique per region, material, and property.");
  if (physicalProperties.some((entry) => entry.subjectContentHash !== binaryClosureHash)) throw new Error("ModelProcessingManifestV2 physical evidence must bind the PVOX binary closure subject.");
  const authoritativePairs = physicalRegionInventory.entries.map(({ regionId, materialId }) => `${regionId}\u0000${materialId}`);
  const authoritativePairSet = new Set(authoritativePairs);
  if (physicalProperties.some(({ regionId, materialId }) => !authoritativePairSet.has(`${regionId}\u0000${materialId}`))) {
    throw new Error("ModelProcessingManifestV2 physical evidence cannot introduce a region absent from the authoritative inventory.");
  }
  const authoritativeRegionIndex = new Map(authoritativePairs.map((pair, index) => [pair, index]));
  const physicalPropertyIndex = new Map(PVOX_PHYSICAL_PROPERTIES.map((property, index) => [property, index]));
  let previousPhysicalOrder = -1;
  for (const evidence of physicalProperties) {
    const regionIndex = authoritativeRegionIndex.get(`${evidence.regionId}\u0000${evidence.materialId}`)!;
    const propertyIndex = physicalPropertyIndex.get(evidence.property)!;
    const order = regionIndex * PVOX_PHYSICAL_PROPERTIES.length + propertyIndex;
    if (order <= previousPhysicalOrder) {
      throw new Error("ModelProcessingManifestV2 physical properties must be canonically ordered by inventory regionIndex and governed property order.");
    }
    previousPhysicalOrder = order;
  }
  for (const capability of PVOX_CAPABILITIES) {
    if (byCapability.get(capability)?.status !== "supported") continue;
    if ((PVOX_CAPABILITY_PHYSICAL_PROPERTIES[capability]?.length ?? 0) > 0 && authoritativePairs.length === 0) {
      throw new Error(`Supported ${capability} capability requires governed physical evidence.`);
    }
    for (const pair of authoritativePairs) {
      const [regionId, materialId] = pair.split("\u0000");
      for (const property of PVOX_CAPABILITY_PHYSICAL_PROPERTIES[capability] ?? []) {
        const evidence = byRegionProperty.get(`${regionId}\u0000${materialId}\u0000${property}`);
        if (evidence === undefined || evidence.confidence < 0.8 || (NON_DEFAULT_CRITICAL_PROPERTIES.has(property) && evidence.provenance === "default")) {
          throw new Error(`Supported ${capability} capability requires governed ${property} evidence for every material region with confidence at least 0.80 and no critical defaults.`);
        }
      }
    }
  }
  if (physicalProperties.length !== technicalProfile.physicalEvidenceRecordCount) {
    throw new Error("ModelProcessingManifestV2 authoritative material-region evidence count must match the PVOX PEVI record count.");
  }
  const physicalEvidenceHash = requireSha256(record.physicalEvidenceHash, "ModelProcessingManifestV2.physicalEvidenceHash");
  const physicalEvidenceAttestation = createHashAttestation(
    record.physicalEvidenceAttestation,
    PVOX_PHYSICAL_EVIDENCE_HASH_DOMAIN,
    physicalEvidenceHash,
    "ModelProcessingManifestV2.physicalEvidenceAttestation",
  );
  const massPropertiesEvidence = createReviewedStructuralEvidence(
    record.massPropertiesEvidence,
    "mass-properties",
    binaryClosureHash,
    physicalRegionInventory.inventoryHash,
    technicalProfile.massPropertyRecordCount,
    "ModelProcessingManifestV2.massPropertiesEvidence",
  );
  const bondGraphEvidence = createReviewedStructuralEvidence(
    record.bondGraphEvidence,
    "bond-graph",
    binaryClosureHash,
    physicalRegionInventory.inventoryHash,
    technicalProfile.bondRecordCount,
    "ModelProcessingManifestV2.bondGraphEvidence",
  );
  const interiorLayerEvidence = createReviewedStructuralEvidence(
    record.interiorLayerEvidence,
    "interior-layers",
    binaryClosureHash,
    physicalRegionInventory.inventoryHash,
    technicalProfile.interiorLayerRecordCount,
    "ModelProcessingManifestV2.interiorLayerEvidence",
  );
  if (byCapability.get("destruction")?.status === "supported"
    && (technicalProfile.massPropertyRecordCount === 0
      || technicalProfile.bondRecordCount === 0
      || technicalProfile.interiorLayerRecordCount === 0)) {
    throw new Error("ModelProcessingManifestV2 destruction capability requires reviewed mass, bond-graph, and interior-layer records.");
  }
  const converter = createCompilerEvidence(record.converter);
  if (
    converter.sourceContentHash !== pvox.sourceContentHash
    || converter.canonicalDocumentHash !== pvox.canonicalDocumentHash
    || converter.compilationInputHash !== compilationInputHash
    || converter.runtimeRequestProfileHash !== runtimeRequestProfileHash
    || converter.outputContentHash !== contentHash
  ) throw new Error("ModelProcessingManifestV2 converter hashes must match source, canonical document, compilation input, runtime request profile, and PVOX outputContentHash.");
  const fidelity = createPvoxFidelityEvidence(record.fidelity);
  const diagonalMetres = technicalProfile.maximumPartitionDiagonalMetres;
  if (fidelity.canonicalDocumentHash !== pvox.canonicalDocumentHash
    || fidelity.pvoxBinaryClosureHash !== binaryClosureHash
    || !approximatelyEqual(fidelity.evaluatedDiagonalMetres, diagonalMetres)
    || !approximatelyEqual(fidelity.lod0CellSizeMetres, pvox.lods[0]!.cellSizeMetres)) {
    throw new Error("ModelProcessingManifestV2 fidelity evidence must bind the canonical document, PVOX closure, evaluated bounds, and LOD0 cell size.");
  }
  const lod0 = pvox.lods[0]!;
  if (!approximatelyEqual(fidelity.maximumSurfaceErrorMetres, lod0.maximumSurfaceErrorMetres)
    || !approximatelyEqual(fidelity.p99SurfaceErrorMetres, lod0.p99SurfaceErrorMetres)
    || !approximatelyEqual(fidelity.silhouetteIou, lod0.silhouetteIou)
    || !approximatelyEqual(fidelity.maximumContourDisplacementPx, lod0.maximumContourDisplacementPx)
    || !approximatelyEqual(fidelity.renderedSsim, lod0.renderedSsim)
    || !approximatelyEqual(fidelity.p95DeltaE2000, lod0.p95DeltaE2000)
    || !approximatelyEqual(fidelity.normalizedMaterialError, lod0.normalizedMaterialError)) {
    throw new Error("ModelProcessingManifestV2 fidelity evidence must exactly match every governed PVOX LOD0 metric.");
  }
  const childEntries = asDenseArray(record.children, "ModelProcessingManifestV2.children", 0, PVOX_DEFAULT_LIMITS.maximumAssemblyChildren);
  const children = childEntries.map((entry, index) => createAssemblyChild(entry, index, resolutionId, candidateId));
  const kind = requireEnum(record.kind, ["leaf", "assembly"] as const, "ModelProcessingManifestV2.kind");
  if (kind === "leaf" && children.length !== 0) throw new Error("A leaf ModelProcessingManifestV2 cannot contain children.");
  if (kind === "leaf" && technicalProfile.partitionCount !== 1) throw new Error("A leaf ModelProcessingManifestV2 must have one partition.");
  if (kind === "leaf" && assemblyClosureHash === binaryClosureHash) throw new Error("A leaf ModelProcessingManifestV2 requires a distinct domain-separated empty-child assemblyClosureHash.");
  if (kind === "assembly" && children.length === 0) throw new Error("An assembly ModelProcessingManifestV2 requires children.");
  if (kind === "assembly") assertAssembly(children);
  const assemblyClosureAttestation = createHashAttestation(record.assemblyClosureAttestation, PVOX_ASSEMBLY_CLOSURE_HASH_DOMAIN, assemblyClosureHash, "ModelProcessingManifestV2.assemblyClosureAttestation");
  const processingClosureAttestation = createHashAttestation(
    record.processingClosureAttestation,
    PVOX_PROCESSING_CLOSURE_HASH_DOMAIN,
    processingClosureHash,
    "ModelProcessingManifestV2.processingClosureAttestation",
  );
  const processedAt = requireTimestamp(record.processedAt, "ModelProcessingManifestV2.processedAt");
  const latestEvidence = Math.max(
    Date.parse(converter.compiledAt),
    Date.parse(fidelity.evaluatedAt),
    ...orderedCapabilities.map(({ evaluatedAt }) => Date.parse(evaluatedAt)),
    ...physicalProperties.flatMap(({ reviewedAt }) => reviewedAt === undefined ? [] : [Date.parse(reviewedAt)]),
    Date.parse(massPropertiesEvidence.reviewedAt),
    Date.parse(bondGraphEvidence.reviewedAt),
    Date.parse(interiorLayerEvidence.reviewedAt),
  );
  if (Date.parse(processedAt) < latestEvidence) throw new Error("ModelProcessingManifestV2.processedAt must follow all processing evidence.");
  return deepFreeze({
    contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
    representation: "pvox",
    manifestId: requireToken(record.manifestId, "ModelProcessingManifestV2.manifestId"),
    resolutionId,
    candidateId,
    kind,
    requestProfileId: requireToken(record.requestProfileId, "ModelProcessingManifestV2.requestProfileId"),
    requestSemanticProfileHash,
    capabilityProfileId: requireEnum(record.capabilityProfileId, PVOX_RUNTIME_CAPABILITY_PROFILE_IDS, "ModelProcessingManifestV2.capabilityProfileId"),
    contentHash,
    binaryClosureHash,
    processingClosureHash,
    processingClosureAttestation,
    assemblyClosureHash,
    assemblyClosureAttestation,
    compilationInputHash,
    runtimeRequestProfileHash,
    coordinateSystem: CANONICAL_MODEL_COORDINATE_SYSTEM,
    pvox,
    technicalProfile,
    requiredCapabilities,
    capabilities: orderedCapabilities,
    capabilityEvidenceSetHash,
    capabilityEvidenceSetAttestation,
    physicalRegionInventory,
    physicalProperties,
    physicalEvidenceHash,
    physicalEvidenceAttestation,
    massPropertiesEvidence,
    bondGraphEvidence,
    interiorLayerEvidence,
    converter,
    fidelity,
    children,
    processedAt,
  });
}

function createCandidateAssetRef(value: unknown): ModelCandidateAssetRef {
  const record = asRecord(value, "ModelCandidateV2.assetRef");
  if (record.disposition === "existing") {
    exactKeys(record, ["disposition", "kind", "contentHash", "asset"], "ModelCandidateV2.assetRef");
    assertDataOnlyTree(record.asset, "ModelCandidateV2.assetRef.asset");
    const asset = createModelAssetRef(record.asset);
    if (record.kind !== asset.kind || record.contentHash !== asset.contentHash) throw new Error("ModelCandidateV2 existing assetRef must match the immutable asset.");
    return { disposition: "existing", kind: asset.kind, contentHash: asset.contentHash, asset };
  }
  exactKeys(record, ["disposition", "proposalId", "kind", "contentHash"], "ModelCandidateV2.assetRef");
  if (record.disposition !== "proposed") throw new Error("ModelCandidateV2.assetRef disposition is unsupported.");
  return {
    disposition: "proposed",
    proposalId: requireToken(record.proposalId, "ModelCandidateV2.assetRef.proposalId"),
    kind: requireEnum(record.kind, ["leaf", "assembly"] as const, "ModelCandidateV2.assetRef.kind"),
    contentHash: requireSha256(record.contentHash, "ModelCandidateV2.assetRef.contentHash"),
  };
}

function createViews(value: unknown, resolutionId: string, candidateId: string): ModelConfirmationViews {
  const entries = asDenseArray(value, "ModelCandidateV2.views", 4, 4);
  const parsed = entries.map((entry, index) => {
    const fieldName = `ModelCandidateV2.views[${index}]`;
    const record = asRecord(entry, fieldName);
    exactKeys(record, ["kind", "imageUri", "sha256", "contentType", "width", "height"], fieldName);
    const kind = requireEnum(record.kind, MODEL_CONFIRMATION_VIEW_KINDS, `${fieldName}.kind`);
    const expectedUri = `mcp://models/resolutions/${resolutionId}/candidates/${candidateId}/${kind}.png`;
    if (record.imageUri !== expectedUri) throw new Error(`${fieldName}.imageUri must match the candidate view identity.`);
    if (record.contentType !== "image/png" || record.width !== MODEL_CONFIRMATION_VIEW_SIZE_PX || record.height !== MODEL_CONFIRMATION_VIEW_SIZE_PX) throw new Error(`${fieldName} must be an authenticated 1024x1024 PNG.`);
    return { kind, imageUri: expectedUri, sha256: requireSha256(record.sha256, `${fieldName}.sha256`), contentType: "image/png" as const, width: MODEL_CONFIRMATION_VIEW_SIZE_PX, height: MODEL_CONFIRMATION_VIEW_SIZE_PX };
  });
  if (parsed.some((entry, index) => entry.kind !== MODEL_CONFIRMATION_VIEW_KINDS[index])) throw new Error("ModelCandidateV2.views must be ordered front, left, top, isometric.");
  return parsed as unknown as ModelConfirmationViews;
}

function createRenderEvidence(value: unknown): PvoxRenderEvidence {
  const record = asRecord(value, "ModelCandidateV2.renderEvidence");
  exactKeys(record, ["renderId", "representation", "lodLevel", "traversalBackend", "rendererId", "rendererVersion", "rendererQualificationHash", "settingsId", "settingsVersion", "cameraQualificationHash", "processingManifestId", "processingClosureHash", "pvoxContentHash", "pvoxRootHash", "pvoxDirectoryHash", "pvoxPageSetHash", "viewSha256s", "renderedAt", "evidenceHash", "evidenceHashAttestation"], "ModelCandidateV2.renderEvidence");
  if (record.representation !== "pvox" || record.lodLevel !== 0 || record.traversalBackend !== "native-pvox") {
    throw new Error("ModelCandidateV2 render evidence must use native PVOX LOD0 traversal.");
  }
  if (record.rendererId !== PVOX_NATIVE_RENDERER_ID || record.settingsId !== PVOX_NATIVE_REVIEW_SETTINGS_ID) {
    throw new Error("ModelCandidateV2 render evidence must use the governed native renderer and review settings.");
  }
  const evidenceHash = requireSha256(record.evidenceHash, "ModelCandidateV2.renderEvidence.evidenceHash");
  return {
    renderId: requireToken(record.renderId, "ModelCandidateV2.renderEvidence.renderId"),
    representation: "pvox",
    lodLevel: 0,
    traversalBackend: "native-pvox",
    rendererId: PVOX_NATIVE_RENDERER_ID,
    rendererVersion: assertImmutableAssetVersion(record.rendererVersion),
    rendererQualificationHash: requireSha256(record.rendererQualificationHash, "ModelCandidateV2.renderEvidence.rendererQualificationHash"),
    settingsId: PVOX_NATIVE_REVIEW_SETTINGS_ID,
    settingsVersion: assertImmutableAssetVersion(record.settingsVersion),
    cameraQualificationHash: requireSha256(record.cameraQualificationHash, "ModelCandidateV2.renderEvidence.cameraQualificationHash"),
    processingManifestId: requireToken(record.processingManifestId, "ModelCandidateV2.renderEvidence.processingManifestId"),
    processingClosureHash: requireSha256(record.processingClosureHash, "ModelCandidateV2.renderEvidence.processingClosureHash"),
    pvoxContentHash: requireSha256(record.pvoxContentHash, "ModelCandidateV2.renderEvidence.pvoxContentHash"),
    pvoxRootHash: requireSha256(record.pvoxRootHash, "ModelCandidateV2.renderEvidence.pvoxRootHash"),
    pvoxDirectoryHash: requireSha256(record.pvoxDirectoryHash, "ModelCandidateV2.renderEvidence.pvoxDirectoryHash"),
    pvoxPageSetHash: requireSha256(record.pvoxPageSetHash, "ModelCandidateV2.renderEvidence.pvoxPageSetHash"),
    viewSha256s: requireShaTuple(record.viewSha256s, "ModelCandidateV2.renderEvidence.viewSha256s"),
    renderedAt: requireTimestamp(record.renderedAt, "ModelCandidateV2.renderEvidence.renderedAt"),
    evidenceHash,
    evidenceHashAttestation: createHashAttestation(record.evidenceHashAttestation, PVOX_RENDER_EVIDENCE_HASH_DOMAIN, evidenceHash, "ModelCandidateV2.renderEvidence.evidenceHashAttestation"),
  };
}

/** Extend a released-v1 assessment without changing its closed v1 factory. */
export function createPvoxModelMatchAssessmentV2(input: unknown): PvoxModelMatchAssessmentV2 {
  const fieldName = "PvoxModelMatchAssessmentV2";
  const record = asRecord(input, fieldName);
  assertDataOnlyTree(record, fieldName);
  exactKeys(record, [
    "contractVersion", "score", "assurance", "hardConstraintPass", "exactMatch", "reasonCodes", "ranker",
    "fidelityWarnings", "request", "candidateId", "candidateContentHash", "requestSemanticProfileHash",
    "requestSemanticProfileCanonical", "evidenceHash",
  ], fieldName);
  const assessment = createModelMatchAssessment({
    ...(record.contractVersion === undefined ? {} : { contractVersion: record.contractVersion }),
    score: record.score,
    ...(record.assurance === undefined ? {} : { assurance: record.assurance }),
    hardConstraintPass: record.hardConstraintPass,
    exactMatch: record.exactMatch,
    reasonCodes: record.reasonCodes,
    ranker: record.ranker,
    fidelityWarnings: record.fidelityWarnings,
    request: record.request,
    candidateId: record.candidateId,
    candidateContentHash: record.candidateContentHash,
  });
  return deepFreeze({
    ...assessment,
    requestSemanticProfileHash: requireSha256(record.requestSemanticProfileHash, `${fieldName}.requestSemanticProfileHash`),
    requestSemanticProfileCanonical: requireString(record.requestSemanticProfileCanonical, `${fieldName}.requestSemanticProfileCanonical`, 65_536),
    evidenceHash: requireSha256(record.evidenceHash, `${fieldName}.evidenceHash`),
  });
}

function createConfirmationBinding(value: unknown): ModelCandidateConfirmationBindingV2 {
  const record = asRecord(value, "ModelCandidateV2.confirmationBinding");
  assertDataOnlyTree(record, "ModelCandidateV2.confirmationBinding");
  exactKeys(record, ["bindingHash", "bindingHashAttestation", "resolutionId", "requesterId", "request", "requestSemanticProfileHash", "requestRevision", "candidateId", "candidateContentHash", "candidateAssetRef", "match", "provenance", "rights", "sourceContentHash", "binaryClosureHash", "pvoxRootHash", "pvoxDirectoryHash", "pvoxPageSetHash", "compilationInputHash", "runtimeRequestProfileHash", "processingClosureHash", "assemblyClosureHash", "evaluationClosureHash", "capabilityEvidenceSetHash", "hardGates", "viewSha256s", "rightsDecisionId", "fidelityEvidenceHash", "physicalEvidenceHash", "rendererId", "rendererVersion", "rendererEvidenceHash", "renderEvidence"], "ModelCandidateV2.confirmationBinding");
  const bindingHash = requireSha256(record.bindingHash, "ModelCandidateV2.confirmationBinding.bindingHash");
  const hardGateEntries = asDenseArray(record.hardGates, "ModelCandidateV2.confirmationBinding.hardGates", PVOX_NON_OVERRIDABLE_GATE_KINDS.length, PVOX_NON_OVERRIDABLE_GATE_KINDS.length);
  return {
    bindingHash,
    bindingHashAttestation: createHashAttestation(record.bindingHashAttestation, PVOX_CONFIRMATION_BINDING_HASH_DOMAIN, bindingHash, "ModelCandidateV2.confirmationBinding.bindingHashAttestation"),
    resolutionId: requirePathSegment(record.resolutionId, "ModelCandidateV2.confirmationBinding.resolutionId"),
    requesterId: requireToken(record.requesterId, "ModelCandidateV2.confirmationBinding.requesterId"),
    request: createModelRequestSpecV2(record.request),
    requestSemanticProfileHash: requireSha256(record.requestSemanticProfileHash, "ModelCandidateV2.confirmationBinding.requestSemanticProfileHash"),
    requestRevision: requireInteger(record.requestRevision, "ModelCandidateV2.confirmationBinding.requestRevision", 0, MODEL_REQUEST_MAX_REVISION),
    candidateId: requirePathSegment(record.candidateId, "ModelCandidateV2.confirmationBinding.candidateId"),
    candidateContentHash: requireSha256(record.candidateContentHash, "ModelCandidateV2.confirmationBinding.candidateContentHash"),
    candidateAssetRef: createCandidateAssetRef(record.candidateAssetRef),
    match: createPvoxModelMatchAssessmentV2(record.match),
    provenance: createModelProvenance(record.provenance),
    rights: createModelRightsAssessment(record.rights),
    sourceContentHash: requireSha256(record.sourceContentHash, "ModelCandidateV2.confirmationBinding.sourceContentHash"),
    binaryClosureHash: requireSha256(record.binaryClosureHash, "ModelCandidateV2.confirmationBinding.binaryClosureHash"),
    pvoxRootHash: requireSha256(record.pvoxRootHash, "ModelCandidateV2.confirmationBinding.pvoxRootHash"),
    pvoxDirectoryHash: requireSha256(record.pvoxDirectoryHash, "ModelCandidateV2.confirmationBinding.pvoxDirectoryHash"),
    pvoxPageSetHash: requireSha256(record.pvoxPageSetHash, "ModelCandidateV2.confirmationBinding.pvoxPageSetHash"),
    compilationInputHash: requireSha256(record.compilationInputHash, "ModelCandidateV2.confirmationBinding.compilationInputHash"),
    runtimeRequestProfileHash: requireSha256(record.runtimeRequestProfileHash, "ModelCandidateV2.confirmationBinding.runtimeRequestProfileHash"),
    processingClosureHash: requireSha256(record.processingClosureHash, "ModelCandidateV2.confirmationBinding.processingClosureHash"),
    assemblyClosureHash: requireSha256(record.assemblyClosureHash, "ModelCandidateV2.confirmationBinding.assemblyClosureHash"),
    evaluationClosureHash: requireSha256(record.evaluationClosureHash, "ModelCandidateV2.confirmationBinding.evaluationClosureHash"),
    capabilityEvidenceSetHash: requireSha256(record.capabilityEvidenceSetHash, "ModelCandidateV2.confirmationBinding.capabilityEvidenceSetHash"),
    hardGates: hardGateEntries.map(createPvoxGateEvidence),
    viewSha256s: requireShaTuple(record.viewSha256s, "ModelCandidateV2.confirmationBinding.viewSha256s"),
    rightsDecisionId: requireToken(record.rightsDecisionId, "ModelCandidateV2.confirmationBinding.rightsDecisionId"),
    fidelityEvidenceHash: requireSha256(record.fidelityEvidenceHash, "ModelCandidateV2.confirmationBinding.fidelityEvidenceHash"),
    physicalEvidenceHash: requireSha256(record.physicalEvidenceHash, "ModelCandidateV2.confirmationBinding.physicalEvidenceHash"),
    rendererId: requireToken(record.rendererId, "ModelCandidateV2.confirmationBinding.rendererId"),
    rendererVersion: assertImmutableAssetVersion(record.rendererVersion),
    rendererEvidenceHash: requireSha256(record.rendererEvidenceHash, "ModelCandidateV2.confirmationBinding.rendererEvidenceHash"),
    renderEvidence: createRenderEvidence(record.renderEvidence),
  };
}

function assertRequestMatchesProcessing(request: ModelRequestSpecV2, processing: ModelProcessingManifestV2): void {
  const profile = request.pvoxRuntimeProfile;
  const technical = processing.technicalProfile;
  if (processing.requestProfileId !== profile.profileId
    || processing.requestSemanticProfileHash !== request.requestSemanticProfileHash
    || processing.capabilityProfileId !== profile.capabilityProfileId
    || processing.fidelity.profileId !== profile.fidelityProfileId) {
    throw new Error("ModelCandidateV2 processing profile IDs must match the exact v2 request.");
  }
  if (profile.geometryMode !== "auto" && profile.geometryMode !== technical.geometryMode) {
    throw new Error("ModelCandidateV2 processing geometryMode must match the exact v2 request.");
  }
  const requestedCapabilities = new Set(profile.requiredCapabilities);
  if (requestedCapabilities.size !== processing.requiredCapabilities.length
    || processing.requiredCapabilities.some((capability) => !requestedCapabilities.has(capability))) {
    throw new Error("ModelCandidateV2 processing requiredCapabilities must exactly match the v2 request.");
  }
  const limits = profile.limits;
  if (technical.artifactByteLength > limits.maximumArtifactBytes
    || technical.pageCount > limits.maximumPages
    || technical.hierarchyDepth > limits.maximumHierarchyDepth
    || technical.hierarchyNodeCount + technical.collisionHierarchyNodeCount > limits.maximumHierarchyNodes
    || technical.brickCount + technical.collisionBrickCount > limits.maximumBricks
    || technical.logicalVoxelCapacity + technical.collisionLogicalVoxelCapacity > limits.maximumLogicalVoxels
    || technical.encodedSurfaceSampleCount + technical.collisionEncodedSurfaceSampleCount > limits.maximumEncodedSurfaceSamples
    || technical.surfacePropertyCount > limits.maximumSurfaceProperties
    || technical.physicalPaletteRecordCount > limits.maximumPhysicalPaletteRecords
    || technical.physicalEvidenceRecordCount > limits.maximumPhysicalEvidenceEntries
    || technical.materialRegionCount > limits.maximumMaterialRegions
    || technical.interiorLayerRecordCount > limits.maximumInteriorLayers
    || technical.massPropertyRecordCount > limits.maximumMassPropertyRecords
    || technical.bondRecordCount > limits.maximumBondRecords
    || technical.partitionCount > limits.maximumPartitions
    || technical.lodCount > limits.maximumLodCount
    || technical.cpuResidentByteLength > limits.maximumCpuResidentBytes
    || technical.gpuResidentByteLength > limits.maximumGpuResidentBytes) {
    throw new Error("ModelCandidateV2 PVOX technical profile exceeds an exact request runtime limit.");
  }
  const constraints = request.hardConstraints;
  if (constraints.boundsMetres !== undefined
    && (constraints.boundsMetres.min.some((value, index) => !approximatelyEqual(value, technical.boundsMetres.min[index]!))
      || constraints.boundsMetres.max.some((value, index) => !approximatelyEqual(value, technical.boundsMetres.max[index]!)))) {
    throw new Error("ModelCandidateV2 PVOX bounds do not satisfy the exact request.");
  }
  if (constraints.dimensionsMetres !== undefined
    && (!approximatelyEqual(constraints.dimensionsMetres.width, technical.dimensionsMetres.width)
      || !approximatelyEqual(constraints.dimensionsMetres.height, technical.dimensionsMetres.height)
      || !approximatelyEqual(constraints.dimensionsMetres.depth, technical.dimensionsMetres.depth))) {
    throw new Error("ModelCandidateV2 PVOX dimensions do not satisfy the exact request.");
  }
  if ((constraints.collision === "required" && !technical.hasCollision)
    || (constraints.collision === "forbidden" && technical.hasCollision)) {
    throw new Error("ModelCandidateV2 PVOX collision capability does not satisfy the exact request.");
  }
  if ((constraints.partition === "single" && technical.partitionCount !== 1)
    || (constraints.partition === "required" && technical.partitionCount < 2)) {
    throw new Error("ModelCandidateV2 PVOX partitioning does not satisfy the exact request.");
  }
}

/** Validate a complete PVOX candidate and every non-overridable binding. */
export function createModelCandidateV2(input: unknown): ModelCandidateV2 {
  const record = asRecord(input, "ModelCandidateV2");
  assertDataOnlyTree(record, "ModelCandidateV2");
  const commonKeys = ["contractVersion", "resolutionId", "requesterId", "candidateId", "request", "admissionStatus", "assetRef", "match", "provenance", "rights", "processingManifest", "views", "renderEvidence", "evaluationClosureHash", "evaluationClosureAttestation", "hardGates", "confirmationRequired"] as const;
  const admissionStatus = requireEnum(record.admissionStatus, ["confirmable", "diagnostic"] as const, "ModelCandidateV2.admissionStatus");
  exactKeys(record, admissionStatus === "confirmable" ? [...commonKeys, "confirmationBinding", "confirmationToken"] : [...commonKeys, "blockingReasonCodes"], "ModelCandidateV2");
  if (record.contractVersion !== MODEL_RESOLUTION_V2_CONTRACT_VERSION) throw new Error("ModelCandidateV2.contractVersion is unsupported.");
  const resolutionId = requirePathSegment(record.resolutionId, "ModelCandidateV2.resolutionId");
  const requesterId = requireToken(record.requesterId, "ModelCandidateV2.requesterId");
  const candidateId = requirePathSegment(record.candidateId, "ModelCandidateV2.candidateId");
  const request = createModelRequestSpecV2(record.request);
  const assetRef = createCandidateAssetRef(record.assetRef);
  assertDataOnlyTree(record.match, "ModelCandidateV2.match");
  assertDataOnlyTree(record.provenance, "ModelCandidateV2.provenance");
  assertDataOnlyTree(record.rights, "ModelCandidateV2.rights");
  const match = createPvoxModelMatchAssessmentV2(record.match);
  assertImmutableAssetVersion(match.ranker.version);
  assertImmutableAssetVersion(match.ranker.calibrationVersion);
  const provenance = createModelProvenance(record.provenance);
  const rights = createModelRightsAssessment(record.rights);
  assertImmutableAssetVersion(rights.policyVersion);
  const processingManifest = createModelProcessingManifestV2(record.processingManifest);
  if (processingManifest.resolutionId !== resolutionId || processingManifest.candidateId !== candidateId || processingManifest.kind !== assetRef.kind || processingManifest.contentHash !== assetRef.contentHash) throw new Error("ModelCandidateV2 processing manifest must match candidate identity and contentHash.");
  if (match.candidateId !== candidateId || match.candidateContentHash !== assetRef.contentHash) throw new Error("ModelCandidateV2 match must bind the exact candidate content.");
  if (match.requestSemanticProfileHash !== request.requestSemanticProfileHash) throw new Error("ModelCandidateV2 semantic assessment must bind the complete normalized v2 request profile hash.");
  if (match.requestSemanticProfileCanonical !== canonicalizeModelRequestSemanticProfileV1(request)) throw new Error("ModelCandidateV2 semantic assessment must bind the exact canonical v2 request profile.");
  if (match.request.query !== request.query || match.request.revision !== request.revision || match.request.locale !== request.locale || match.request.rankerId !== request.rankerId) throw new Error("ModelCandidateV2 match must bind the exact v2 request semantics and revision.");
  assertRequestMatchesProcessing(request, processingManifest);
  if (provenance.contentHash !== processingManifest.pvox.sourceContentHash) throw new Error("ModelCandidateV2 provenance must bind the PVOX sourceContentHash.");
  if (rights.sourceId !== provenance.sourceId || rights.sourceAssetId !== provenance.sourceAssetId || rights.sourceContentHash !== provenance.contentHash) throw new Error("ModelCandidateV2 rights evidence must bind the exact source.");
  const resourceScope = parsePvoxResourceScope(processingManifest.pvox.artifact.uri);
  if (assetRef.disposition === "proposed" && (resourceScope.kind !== "resolution" || resourceScope.resolutionId !== resolutionId || resourceScope.candidateId !== candidateId)) {
    throw new Error("ModelCandidateV2 proposed PVOX resource must use its resolution/candidate namespace.");
  }
  if (assetRef.disposition === "existing" && (resourceScope.kind !== "catalog" || resourceScope.assetId !== assetRef.asset.assetId || resourceScope.version !== assetRef.asset.version)) {
    throw new Error("ModelCandidateV2 existing asset must prove the same immutable catalog PVOX representation.");
  }
  const views = createViews(record.views, resolutionId, candidateId);
  const renderEvidence = createRenderEvidence(record.renderEvidence);
  if (
    renderEvidence.processingManifestId !== processingManifest.manifestId
    || renderEvidence.processingClosureHash !== processingManifest.processingClosureHash
    || renderEvidence.pvoxContentHash !== processingManifest.contentHash
    || renderEvidence.pvoxRootHash !== processingManifest.pvox.rootHash
    || renderEvidence.pvoxDirectoryHash !== processingManifest.pvox.directoryHash
    || renderEvidence.pvoxPageSetHash !== processingManifest.pvox.pageSetHash
    || renderEvidence.viewSha256s.some((digest, index) => digest !== views[index]!.sha256)
  ) throw new Error("ModelCandidateV2 renderer evidence must bind the PVOX manifest and ordered views.");
  if (Date.parse(renderEvidence.renderedAt) < Date.parse(processingManifest.processedAt)) throw new Error("ModelCandidateV2 render evidence must follow processing.");
  const evaluationClosureHash = requireSha256(record.evaluationClosureHash, "ModelCandidateV2.evaluationClosureHash");
  const evaluationClosureAttestation = createHashAttestation(
    record.evaluationClosureAttestation,
    PVOX_EVALUATION_CLOSURE_HASH_DOMAIN,
    evaluationClosureHash,
    "ModelCandidateV2.evaluationClosureAttestation",
  );
  const gateEntries = asDenseArray(record.hardGates, "ModelCandidateV2.hardGates", PVOX_NON_OVERRIDABLE_GATE_KINDS.length, PVOX_NON_OVERRIDABLE_GATE_KINDS.length);
  const gates = gateEntries.map(createPvoxGateEvidence);
  const byGate = new Map(gates.map((entry) => [entry.kind, entry]));
  if (byGate.size !== PVOX_NON_OVERRIDABLE_GATE_KINDS.length || PVOX_NON_OVERRIDABLE_GATE_KINDS.some((kind) => !byGate.has(kind))) throw new Error("ModelCandidateV2 must contain every non-overridable hard gate exactly once.");
  const orderedGates = PVOX_NON_OVERRIDABLE_GATE_KINDS.map((kind) => byGate.get(kind)!);
  const concreteGateHashes: Readonly<Partial<Record<PvoxNonOverridableGateKind, string>>> = {
    "source-format-validation": processingManifest.converter.evidenceHash,
    "pvox-validation": processingManifest.pvox.validationEvidenceHash,
    "fidelity-validation": processingManifest.fidelity.evidenceHash,
    "physical-property-validation": processingManifest.physicalEvidenceHash,
    "renderer-validation": renderEvidence.evidenceHash,
  };
  for (const gate of orderedGates) {
    const expectedHash = gate.kind === "malware-scan" || gate.kind === "source-format-validation" ? provenance.contentHash : processingManifest.binaryClosureHash;
    if (gate.subjectContentHash !== expectedHash) throw new Error(`ModelCandidateV2 ${gate.kind} hard gate binds the wrong subject.`);
    const concreteHash = concreteGateHashes[gate.kind];
    if (concreteHash !== undefined && gate.evidenceHash !== concreteHash) throw new Error(`ModelCandidateV2 ${gate.kind} hard gate must bind its concrete evidence hash.`);
  }
  const fidelityGate = byGate.get("fidelity-validation")!;
  if (fidelityGate.outcome !== processingManifest.fidelity.outcome) throw new Error("ModelCandidateV2 fidelity gate outcome must match measured fidelity evidence.");
  const blockingReasonCodes = [
    ...(match.assurance === "none" ? ["semantic-assurance-none"] : []),
    ...(!match.hardConstraintPass ? ["semantic-hard-constraints-failed"] : []),
    ...(!["allowed", "attribution-required"].includes(rights.status) ? [`rights:${rights.status}`] : []),
    ...processingManifest.requiredCapabilities.flatMap((capability) => {
      const evidence = processingManifest.capabilities.find((entry) => entry.capability === capability)!;
      return evidence.status === "supported" ? [] : [`capability:${capability}:${evidence.status}`];
    }),
    ...orderedGates.flatMap((gate) => gate.outcome === "passed" ? [] : gate.reasonCodes.map((reason) => `${gate.kind}:${reason}`)),
  ];
  const shouldBeConfirmable = blockingReasonCodes.length === 0;
  if ((admissionStatus === "confirmable") !== shouldBeConfirmable) throw new Error("ModelCandidateV2 admissionStatus must reflect all rights, semantic, capability, fidelity, and hard-gate blockers.");
  const common = {
    contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
    resolutionId,
    requesterId,
    candidateId,
    request,
    assetRef,
    match,
    provenance,
    rights,
    processingManifest,
    views,
    renderEvidence,
    evaluationClosureHash,
    evaluationClosureAttestation,
    hardGates: orderedGates,
  };
  if (admissionStatus === "diagnostic") {
    if (record.confirmationRequired !== false) throw new Error("Diagnostic ModelCandidateV2 confirmationRequired must be false.");
    if (record.blockingReasonCodes !== undefined) {
      const suppliedEntries = asDenseArray(record.blockingReasonCodes, "ModelCandidateV2.blockingReasonCodes", 1, 256);
      const suppliedBlockingReasons = suppliedEntries.map((entry, index) => requireReasonCode(entry, `ModelCandidateV2.blockingReasonCodes[${index}]`));
      if (JSON.stringify(suppliedBlockingReasons) !== JSON.stringify(blockingReasonCodes)) throw new Error("Diagnostic ModelCandidateV2 blockingReasonCodes must be derived from its evidence.");
    }
    return deepFreeze({ ...common, admissionStatus: "diagnostic", blockingReasonCodes, confirmationRequired: false });
  }
  if (record.confirmationRequired !== true) throw new Error("Confirmable ModelCandidateV2 confirmationRequired must be true.");
  const confirmationBinding = createConfirmationBinding(record.confirmationBinding);
  const expectedBinding = {
    resolutionId,
    requesterId,
    requestSemanticProfileHash: request.requestSemanticProfileHash,
    requestRevision: match.request.revision,
    candidateId,
    candidateContentHash: assetRef.contentHash,
    sourceContentHash: provenance.contentHash,
    binaryClosureHash: processingManifest.binaryClosureHash,
    pvoxRootHash: processingManifest.pvox.rootHash,
    pvoxDirectoryHash: processingManifest.pvox.directoryHash,
    pvoxPageSetHash: processingManifest.pvox.pageSetHash,
    compilationInputHash: processingManifest.compilationInputHash,
    runtimeRequestProfileHash: processingManifest.runtimeRequestProfileHash,
    processingClosureHash: processingManifest.processingClosureHash,
    assemblyClosureHash: processingManifest.assemblyClosureHash,
    evaluationClosureHash,
    capabilityEvidenceSetHash: processingManifest.capabilityEvidenceSetHash,
    rightsDecisionId: rights.decisionId,
    fidelityEvidenceHash: processingManifest.fidelity.evidenceHash,
    physicalEvidenceHash: processingManifest.physicalEvidenceHash,
    rendererId: renderEvidence.rendererId,
    rendererVersion: renderEvidence.rendererVersion,
    rendererEvidenceHash: renderEvidence.evidenceHash,
  };
  for (const [key, expected] of Object.entries(expectedBinding)) {
    if (confirmationBinding[key as keyof typeof confirmationBinding] !== expected) throw new Error(`ModelCandidateV2 confirmationBinding.${key} must match candidate evidence.`);
  }
  if (JSON.stringify(confirmationBinding.request) !== JSON.stringify(request)) throw new Error("ModelCandidateV2 confirmationBinding.request must match the exact v2 request.");
  if (JSON.stringify(confirmationBinding.candidateAssetRef) !== JSON.stringify(assetRef)) throw new Error("ModelCandidateV2 confirmationBinding candidate asset identity must match the exact proposal or catalog asset.");
  if (JSON.stringify(confirmationBinding.match) !== JSON.stringify(match)) throw new Error("ModelCandidateV2 confirmationBinding must bind the complete semantic match evidence.");
  if (JSON.stringify(confirmationBinding.provenance) !== JSON.stringify(provenance)) throw new Error("ModelCandidateV2 confirmationBinding must bind the complete provider provenance identity.");
  if (JSON.stringify(confirmationBinding.rights) !== JSON.stringify(rights)) throw new Error("ModelCandidateV2 confirmationBinding must bind the complete normalized rights decision.");
  if (JSON.stringify(confirmationBinding.renderEvidence) !== JSON.stringify(renderEvidence)) throw new Error("ModelCandidateV2 confirmationBinding must bind the complete native renderer evidence.");
  if (JSON.stringify(confirmationBinding.hardGates) !== JSON.stringify(orderedGates)) throw new Error("ModelCandidateV2 confirmationBinding must contain the complete ordered hard-gate evidence set.");
  if (confirmationBinding.viewSha256s.some((digest, index) => digest !== views[index]!.sha256)) throw new Error("ModelCandidateV2 confirmationBinding view hashes must match candidate views.");
  const confirmationToken = requireAttestation(record.confirmationToken, "ModelCandidateV2.confirmationToken");
  if (confirmationBinding.bindingHashAttestation.attestationToken !== confirmationToken) throw new Error("ModelCandidateV2 confirmation token must attest the exact confirmation binding hash.");
  return deepFreeze({
    ...common,
    admissionStatus: "confirmable",
    confirmationBinding,
    confirmationToken,
    confirmationRequired: true,
  });
}

/** Return whether a fully validated candidate still satisfies every hard gate. */
export function isModelCandidateV2Confirmable(candidate: ModelCandidateV2): boolean {
  return candidate.admissionStatus === "confirmable"
    && candidate.confirmationRequired
    && candidate.match.hardConstraintPass
    && candidate.match.assurance !== "none"
    && (candidate.rights.status === "allowed" || candidate.rights.status === "attribution-required")
    && candidate.processingManifest.fidelity.outcome === "passed"
    && candidate.hardGates.length === PVOX_NON_OVERRIDABLE_GATE_KINDS.length
    && candidate.hardGates.every(({ outcome }) => outcome === "passed")
    && candidate.processingManifest.requiredCapabilities.every((name) => candidate.processingManifest.capabilities.find((entry) => entry.capability === name)?.status === "supported");
}

/** Validate one requester confirmation against the exact PVOX review subject. */
export function createModelCandidateConfirmationV2(input: unknown, expectedCandidate: ModelCandidateV2, expectedResolutionId: string): ModelCandidateConfirmationV2 {
  const record = asRecord(input, "ModelCandidateConfirmationV2");
  exactKeys(record, ["contractVersion", "confirmationId", "resolutionId", "requesterId", "candidateId", "confirmationToken", "confirmationBindingHash", "viewSha256s", "confirmedBy", "confirmedAt", "semanticRiskAccepted"], "ModelCandidateConfirmationV2");
  if (record.contractVersion !== MODEL_RESOLUTION_V2_CONTRACT_VERSION) throw new Error("ModelCandidateConfirmationV2.contractVersion is unsupported.");
  const candidate = createModelCandidateV2(expectedCandidate);
  if (candidate.admissionStatus !== "confirmable") throw new Error("ModelCandidateConfirmationV2 cannot confirm a diagnostic candidate.");
  const resolutionId = requirePathSegment(expectedResolutionId, "ModelCandidateConfirmationV2 expected resolutionId");
  if (candidate.resolutionId !== resolutionId || record.resolutionId !== resolutionId || record.requesterId !== candidate.requesterId || record.candidateId !== candidate.candidateId) throw new Error("ModelCandidateConfirmationV2 must match the candidate, requester, and resolution.");
  if (record.confirmationToken !== candidate.confirmationToken) throw new Error("ModelCandidateConfirmationV2 confirmationToken must match the candidate.");
  if (record.confirmationBindingHash !== candidate.confirmationBinding.bindingHash) throw new Error("ModelCandidateConfirmationV2 confirmation binding must match the candidate.");
  const viewSha256s = requireShaTuple(record.viewSha256s, "ModelCandidateConfirmationV2.viewSha256s");
  if (viewSha256s.some((digest, index) => digest !== candidate.views[index]!.sha256)) throw new Error("ModelCandidateConfirmationV2 view hashes must match candidate evidence.");
  if (!isModelCandidateV2Confirmable(candidate)) throw new Error("ModelCandidateConfirmationV2 candidate is not confirmable because a hard gate is blocked.");
  const semanticRiskAccepted = requireBoolean(record.semanticRiskAccepted, "ModelCandidateConfirmationV2.semanticRiskAccepted");
  if ((candidate.match.assurance === "low") !== semanticRiskAccepted) throw new Error("Only low semantic assurance requires and permits semantic risk acceptance.");
  const confirmedAt = requireTimestamp(record.confirmedAt, "ModelCandidateConfirmationV2.confirmedAt");
  const latestEvidence = Math.max(
    Date.parse(candidate.provenance.capturedAt), Date.parse(candidate.rights.reviewedAt),
    Date.parse(candidate.processingManifest.processedAt), Date.parse(candidate.renderEvidence.renderedAt),
    ...candidate.hardGates.map(({ evaluatedAt }) => Date.parse(evaluatedAt)),
  );
  if (Date.parse(confirmedAt) < latestEvidence) throw new Error("ModelCandidateConfirmationV2 confirmation must follow all required evidence.");
  const confirmedBy = requireString(record.confirmedBy, "ModelCandidateConfirmationV2.confirmedBy", 256);
  if (DIRECT_URL.test(confirmedBy)) throw new Error("ModelCandidateConfirmationV2.confirmedBy must not expose a URL.");
  if (confirmedBy !== candidate.requesterId) throw new Error("ModelCandidateConfirmationV2 confirmedBy must be the requester bound to the resolution.");
  return deepFreeze({
    contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
    confirmationId: requireToken(record.confirmationId, "ModelCandidateConfirmationV2.confirmationId"),
    resolutionId,
    requesterId: candidate.requesterId,
    candidateId: candidate.candidateId,
    confirmationToken: candidate.confirmationToken,
    confirmationBindingHash: candidate.confirmationBinding.bindingHash,
    viewSha256s,
    confirmedBy,
    confirmedAt,
    semanticRiskAccepted,
  });
}

/** Narrow an unknown state to the additive PVOX lifecycle. */
export function isModelResolutionStateV2(value: unknown): value is ModelResolutionStateV2 {
  return typeof value === "string" && (MODEL_RESOLUTION_V2_STATES as readonly string[]).includes(value);
}

/** Project one v2 state for legacy wrappers without changing v1 state enums. */
export function toLegacyModelResolutionState(state: ModelResolutionStateV2): ModelResolutionState {
  if (!isModelResolutionStateV2(state)) throw new Error("Unknown ModelResolutionStateV2 state.");
  return MODEL_RESOLUTION_V2_COMPATIBILITY_STATES[state];
}

function candidatesEquivalent(left: ModelCandidateV2, right: ModelCandidateV2): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function createModelPromotionReceiptV2(
  input: unknown,
  resolutionId: string,
  candidate: ConfirmableModelCandidateV2,
  confirmation: ModelCandidateConfirmationV2,
  finalAssetRef: ModelAssetRef,
): ModelPromotionReceiptV2 {
  if (candidate.assetRef.disposition !== "proposed") throw new Error("ModelPromotionReceiptV2 is only valid for a proposed candidate.");
  const record = asRecord(input, "ModelPromotionReceiptV2");
  exactKeys(record, [
    "contractVersion", "promotionId", "resolutionId", "requesterId", "candidateId", "proposalId", "candidateAssetRef", "confirmationId", "confirmationBindingHash",
    "processingManifestId", "processingContentHash", "processingClosureHash", "assemblyClosureHash", "assemblyChildClosureHashes", "finalAssetRef", "creditsRecordHash",
    "catalogRowHash", "indexSnapshotHash", "catalogPointerEtag", "indexPointerEtag", "publicationState",
    "creditsWrittenAt", "catalogRowWrittenAt", "indexSnapshotWrittenAt", "pointerPublishedAt",
    "publicationHash", "publicationHashAttestation", "promotedAt", "publicationToken",
  ], "ModelPromotionReceiptV2");
  if (record.contractVersion !== MODEL_RESOLUTION_V2_CONTRACT_VERSION || record.publicationState !== "pointer-last-complete") {
    throw new Error("ModelPromotionReceiptV2 must use the v2 contract and prove pointer-last completion.");
  }
  if (record.resolutionId !== resolutionId
    || record.requesterId !== candidate.requesterId
    || record.candidateId !== candidate.candidateId
    || record.proposalId !== candidate.assetRef.proposalId
    || record.confirmationId !== confirmation.confirmationId
    || record.confirmationBindingHash !== confirmation.confirmationBindingHash
    || record.processingManifestId !== candidate.processingManifest.manifestId
    || record.processingContentHash !== candidate.processingManifest.contentHash
    || record.processingClosureHash !== candidate.processingManifest.processingClosureHash
    || record.assemblyClosureHash !== candidate.processingManifest.assemblyClosureHash) {
    throw new Error("ModelPromotionReceiptV2 must bind the exact proposal, confirmation, processing content, and PVOX assembly closure.");
  }
  assertDataOnlyTree(record.candidateAssetRef, "ModelPromotionReceiptV2.candidateAssetRef");
  const candidateAssetRef = createCandidateAssetRef(record.candidateAssetRef);
  if (JSON.stringify(candidateAssetRef) !== JSON.stringify(candidate.assetRef)) throw new Error("ModelPromotionReceiptV2 must bind the exact proposed candidate identity.");
  const childClosureEntries = asDenseArray(record.assemblyChildClosureHashes, "ModelPromotionReceiptV2.assemblyChildClosureHashes", 0, PVOX_DEFAULT_LIMITS.maximumAssemblyChildren);
  const assemblyChildClosureHashes = childClosureEntries.map((entry, index) => requireSha256(entry, `ModelPromotionReceiptV2.assemblyChildClosureHashes[${index}]`));
  const expectedChildClosureHashes = candidate.processingManifest.children.map(({ assetRef }) => assetRef.binaryClosureHash);
  if (JSON.stringify(assemblyChildClosureHashes) !== JSON.stringify(expectedChildClosureHashes)) throw new Error("ModelPromotionReceiptV2 child closure sequence must match the canonical assembly order.");
  assertDataOnlyTree(record.finalAssetRef, "ModelPromotionReceiptV2.finalAssetRef");
  const receiptAssetRef = createModelAssetRef(record.finalAssetRef);
  if (JSON.stringify(receiptAssetRef) !== JSON.stringify(finalAssetRef)) throw new Error("ModelPromotionReceiptV2 finalAssetRef must match the completed resolution.");
  const creditsWrittenAt = requireTimestamp(record.creditsWrittenAt, "ModelPromotionReceiptV2.creditsWrittenAt");
  const catalogRowWrittenAt = requireTimestamp(record.catalogRowWrittenAt, "ModelPromotionReceiptV2.catalogRowWrittenAt");
  const indexSnapshotWrittenAt = requireTimestamp(record.indexSnapshotWrittenAt, "ModelPromotionReceiptV2.indexSnapshotWrittenAt");
  const pointerPublishedAt = requireTimestamp(record.pointerPublishedAt, "ModelPromotionReceiptV2.pointerPublishedAt");
  const promotedAt = requireTimestamp(record.promotedAt, "ModelPromotionReceiptV2.promotedAt");
  const publicationSequence = [confirmation.confirmedAt, creditsWrittenAt, catalogRowWrittenAt, indexSnapshotWrittenAt, pointerPublishedAt, promotedAt].map(Date.parse);
  if (publicationSequence.some((time, index) => index > 0 && time < publicationSequence[index - 1]!)) {
    throw new Error("ModelPromotionReceiptV2 must prove credits, catalog row, index snapshot, and pointers were published in pointer-last order.");
  }
  const publicationHash = requireSha256(record.publicationHash, "ModelPromotionReceiptV2.publicationHash");
  const publicationHashAttestation = createHashAttestation(record.publicationHashAttestation, PVOX_PUBLICATION_HASH_DOMAIN, publicationHash, "ModelPromotionReceiptV2.publicationHashAttestation");
  const publicationToken = requireAttestation(record.publicationToken, "ModelPromotionReceiptV2.publicationToken");
  if (publicationHashAttestation.attestationToken !== publicationToken) throw new Error("ModelPromotionReceiptV2 publication token must attest the exact publication hash.");
  return deepFreeze({
    contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
    promotionId: requireToken(record.promotionId, "ModelPromotionReceiptV2.promotionId"),
    resolutionId,
    requesterId: candidate.requesterId,
    candidateId: candidate.candidateId,
    proposalId: candidate.assetRef.proposalId,
    candidateAssetRef,
    confirmationId: confirmation.confirmationId,
    confirmationBindingHash: confirmation.confirmationBindingHash,
    processingManifestId: candidate.processingManifest.manifestId,
    processingContentHash: candidate.processingManifest.contentHash,
    processingClosureHash: candidate.processingManifest.processingClosureHash,
    assemblyClosureHash: candidate.processingManifest.assemblyClosureHash,
    assemblyChildClosureHashes,
    finalAssetRef: receiptAssetRef,
    creditsRecordHash: requireSha256(record.creditsRecordHash, "ModelPromotionReceiptV2.creditsRecordHash"),
    catalogRowHash: requireSha256(record.catalogRowHash, "ModelPromotionReceiptV2.catalogRowHash"),
    indexSnapshotHash: requireSha256(record.indexSnapshotHash, "ModelPromotionReceiptV2.indexSnapshotHash"),
    catalogPointerEtag: requireToken(record.catalogPointerEtag, "ModelPromotionReceiptV2.catalogPointerEtag"),
    indexPointerEtag: requireToken(record.indexPointerEtag, "ModelPromotionReceiptV2.indexPointerEtag"),
    publicationState: "pointer-last-complete",
    creditsWrittenAt,
    catalogRowWrittenAt,
    indexSnapshotWrittenAt,
    pointerPublishedAt,
    publicationHash,
    publicationHashAttestation,
    promotedAt,
    publicationToken,
  });
}

function createModelRefinementQuestionV2(input: unknown, index: number): ModelRefinementQuestionV2 {
  const fieldName = `ModelResolutionV2.refinementQuestions[${index}]`;
  const record = asRecord(input, fieldName);
  exactKeys(record, ["questionId", "prompt", "reasonCodes"], fieldName);
  return deepFreeze({
    questionId: requireToken(record.questionId, `${fieldName}.questionId`),
    prompt: requireString(record.prompt, `${fieldName}.prompt`, 500),
    reasonCodes: requireReasonCodes(record.reasonCodes, `${fieldName}.reasonCodes`),
  });
}

/** Validate one durable PVOX model-resolution snapshot. */
export function createModelResolutionV2(input: unknown): ModelResolutionV2 {
  const record = asRecord(input, "ModelResolutionV2");
  exactKeys(record, ["contractVersion", "resolutionId", "requesterId", "request", "attempts", "state", "compatibilityState", "candidates", "bestCandidate", "confirmation", "promotionReceipt", "refinementQuestions", "finalAssetRef", "stateReasonCode", "createdAt", "updatedAt"], "ModelResolutionV2");
  if (record.contractVersion !== MODEL_RESOLUTION_V2_CONTRACT_VERSION) throw new Error("ModelResolutionV2.contractVersion is unsupported.");
  const resolutionId = requirePathSegment(record.resolutionId, "ModelResolutionV2.resolutionId");
  const requesterId = requireToken(record.requesterId, "ModelResolutionV2.requesterId");
  const request = createModelRequestSpecV2(record.request);
  const state = requireEnum(record.state, MODEL_RESOLUTION_V2_STATES, "ModelResolutionV2.state");
  const compatibilityState = toLegacyModelResolutionState(state);
  if (record.compatibilityState !== undefined && record.compatibilityState !== compatibilityState) throw new Error("ModelResolutionV2 compatibilityState must match its deterministic legacy projection.");
  const candidateEntries = asDenseArray(record.candidates, "ModelResolutionV2.candidates", 0, 20);
  const candidates = candidateEntries.map(createModelCandidateV2);
  if (new Set(candidates.map(({ candidateId }) => candidateId)).size !== candidates.length) throw new Error("ModelResolutionV2 candidate IDs must be unique.");
  if (candidates.some((candidate) => candidate.resolutionId !== resolutionId || candidate.requesterId !== requesterId || JSON.stringify(candidate.request) !== JSON.stringify(request))) throw new Error("ModelResolutionV2 candidates must bind the exact requester, v2 resolution request, and profiles.");
  const bestCandidate = record.bestCandidate === undefined ? undefined : createModelCandidateV2(record.bestCandidate);
  if (bestCandidate !== undefined && !candidates.some((candidate) => candidatesEquivalent(candidate, bestCandidate))) throw new Error("ModelResolutionV2 bestCandidate must be one exact candidate in the resolution.");
  if (state === "awaiting-confirmation" && (bestCandidate === undefined || !isModelCandidateV2Confirmable(bestCandidate))) throw new Error("ModelResolutionV2 awaiting-confirmation requires one confirmable bestCandidate.");
  const refinementEntries = asDenseArray(record.refinementQuestions, "ModelResolutionV2.refinementQuestions", 0, 3);
  const refinementQuestions = refinementEntries.map(createModelRefinementQuestionV2);
  if (new Set(refinementQuestions.map(({ questionId }) => questionId)).size !== refinementQuestions.length) throw new Error("ModelResolutionV2 refinement question IDs must be unique.");
  if (state === "awaiting-confirmation" && bestCandidate?.match.assurance === "low" && refinementQuestions.length === 0) throw new Error("Low-assurance ModelResolutionV2 requires refinement questions.");
  if (state === "completed" && record.finalAssetRef === undefined) throw new Error("ModelResolutionV2 completed state requires finalAssetRef.");
  const confirmation = record.confirmation === undefined
    ? undefined
    : bestCandidate === undefined
      ? (() => { throw new Error("ModelResolutionV2 confirmation requires bestCandidate."); })()
      : createModelCandidateConfirmationV2(record.confirmation, bestCandidate, resolutionId);
  if (["promoting", "completed"].includes(state) && confirmation === undefined) throw new Error(`ModelResolutionV2 ${state} requires confirmation.`);
  if (!["promoting", "completed"].includes(state) && confirmation !== undefined) throw new Error("ModelResolutionV2 confirmation is only allowed while promoting or completed.");
  if (record.finalAssetRef !== undefined) assertDataOnlyTree(record.finalAssetRef, "ModelResolutionV2.finalAssetRef");
  const finalAssetRef = record.finalAssetRef === undefined ? undefined : createModelAssetRef(record.finalAssetRef);
  if (state === "completed" && finalAssetRef === undefined) throw new Error("ModelResolutionV2 completed state requires finalAssetRef.");
  if (state !== "completed" && finalAssetRef !== undefined) throw new Error("ModelResolutionV2 finalAssetRef is only allowed for completed state.");
  if (finalAssetRef !== undefined && bestCandidate !== undefined) {
    if (finalAssetRef.kind !== bestCandidate.assetRef.kind || finalAssetRef.contentHash !== bestCandidate.assetRef.contentHash) {
      throw new Error("ModelResolutionV2 finalAssetRef must match bestCandidate.");
    }
    if (bestCandidate.assetRef.disposition === "existing") {
      const existingAsset = bestCandidate.assetRef.asset;
      if (finalAssetRef.assetId !== existingAsset.assetId
        || finalAssetRef.version !== existingAsset.version
        || finalAssetRef.runtimeManifestUri !== existingAsset.runtimeManifestUri) {
        throw new Error("ModelResolutionV2 finalAssetRef must preserve the exact existing immutable asset identity.");
      }
    }
  }
  let promotionReceipt: ModelPromotionReceiptV2 | undefined;
  if (record.promotionReceipt !== undefined) {
    if (state !== "completed" || finalAssetRef === undefined || confirmation === undefined || bestCandidate?.admissionStatus !== "confirmable" || bestCandidate.assetRef.disposition !== "proposed") {
      throw new Error("ModelResolutionV2 promotionReceipt is only allowed for a completed confirmed proposed candidate.");
    }
    promotionReceipt = createModelPromotionReceiptV2(record.promotionReceipt, resolutionId, bestCandidate, confirmation, finalAssetRef);
  }
  if (state === "completed" && bestCandidate?.assetRef.disposition === "proposed" && promotionReceipt === undefined) {
    throw new Error("ModelResolutionV2 completed proposed candidates require a pointer-last promotionReceipt.");
  }
  if (bestCandidate?.assetRef.disposition === "existing" && promotionReceipt !== undefined) throw new Error("ModelResolutionV2 existing selections must not include a promotionReceipt.");
  const stateReasonCode = record.stateReasonCode === undefined ? undefined : requireReasonCode(record.stateReasonCode, "ModelResolutionV2.stateReasonCode");
  if (["unresolved", "failed", "cancelled"].includes(state) && stateReasonCode === undefined) throw new Error(`ModelResolutionV2 ${state} state requires stateReasonCode.`);
  if (!["unresolved", "failed", "cancelled"].includes(state) && stateReasonCode !== undefined) throw new Error("ModelResolutionV2 stateReasonCode is reserved for terminal non-success states.");
  const createdAt = requireTimestamp(record.createdAt, "ModelResolutionV2.createdAt");
  const updatedAt = requireTimestamp(record.updatedAt, "ModelResolutionV2.updatedAt");
  if (Date.parse(updatedAt) < Date.parse(createdAt)) throw new Error("ModelResolutionV2.updatedAt must not precede createdAt.");
  if (confirmation !== undefined && Date.parse(confirmation.confirmedAt) > Date.parse(updatedAt)) {
    throw new Error("ModelResolutionV2 confirmation confirmedAt must not exceed updatedAt.");
  }
  if (promotionReceipt !== undefined && confirmation !== undefined && (Date.parse(promotionReceipt.promotedAt) < Date.parse(confirmation.confirmedAt) || Date.parse(promotionReceipt.promotedAt) > Date.parse(updatedAt))) {
    throw new Error("ModelResolutionV2 promotionReceipt must follow confirmation and not exceed updatedAt.");
  }
  return deepFreeze({
    contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
    resolutionId,
    requesterId,
    request,
    attempts: requireInteger(record.attempts, "ModelResolutionV2.attempts", 1, 12),
    state,
    compatibilityState,
    candidates,
    ...(bestCandidate === undefined ? {} : { bestCandidate }),
    ...(confirmation === undefined ? {} : { confirmation }),
    ...(promotionReceipt === undefined ? {} : { promotionReceipt }),
    refinementQuestions,
    ...(finalAssetRef === undefined ? {} : { finalAssetRef }),
    ...(stateReasonCode === undefined ? {} : { stateReasonCode }),
    createdAt,
    updatedAt,
  });
}
