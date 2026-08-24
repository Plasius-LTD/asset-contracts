import { describe, expect, it } from "vitest";
import { Ajv2020 } from "ajv/dist/2020.js";
import {
  CANONICAL_MODEL_COORDINATE_SYSTEM,
  MODEL_RESOLUTION_CONTRACT_VERSION,
  MODEL_RESOLUTION_V2_COMPATIBILITY_STATES,
  MODEL_RESOLUTION_V2_CONTRACT_VERSION,
  MODEL_RESOLUTION_V2_JSON_SCHEMAS,
  MODEL_RESOLUTION_V2_STATES,
  PVOX_ASSET_MANIFEST_VERSION,
  PVOX_BRICK_EDGE_VOXELS,
  PVOX_CAPABILITIES,
  PVOX_CONTENT_TYPE,
  PVOX_DEFAULT_LIMITS,
  PVOX_DEFAULT_SOURCE_INGESTION_LIMITS,
  PVOX_FEATURE_FLAG_ID,
  PVOX_FILE_EXTENSION,
  PVOX_FIDELITY_PROFILE_IDS,
  PVOX_FORMAT_VERSION,
  PVOX_HASH_DOMAINS,
  PVOX_HASH_PREIMAGE_LAYOUTS,
  PVOX_HEADER_BYTE_LENGTH,
  PVOX_DIRECTORY_ENTRY_BYTE_LENGTH,
  PVOX_MAX_SECTIONS,
  PVOX_MAX_HIERARCHY_NODES,
  PVOX_MAX_RUNS_PER_BRICK,
  PVOX_MAX_LOCAL_SAMPLES_PER_BRICK,
  PVOX_MAX_ENCODED_BRICK_PAYLOAD_BYTES,
  PVOX_MAX_ABSOLUTE_COORDINATE_METRES,
  PVOX_MAGIC,
  PVOX_MIN_BRICK_DESCRIPTOR_BYTES,
  PVOX_MIN_ENCODED_SURFACE_SAMPLE_BYTES,
  PVOX_MODEL_REQUEST_POLICY_ID,
  PVOX_NON_OVERRIDABLE_GATE_KINDS,
  PVOX_PAGE_KINDS,
  PVOX_PAGE_SIZE_BYTES,
  PVOX_PHYSICAL_PROPERTIES,
  PVOX_REQUIRED_OAUTH_CAPABILITIES,
  PVOX_RUNTIME_CAPABILITY_PROFILE_IDS,
  PVOX_EDIT_JOURNAL_GENESIS_HASH,
  calculatePvoxMinimumArtifactByteLength,
  canonicalizeModelRequestSemanticProfileV1,
  createModelCandidateConfirmationV2,
  createModelCandidateV2,
  createModelProcessingManifestV2,
  createModelRequestSpec,
  createModelRequestSpecV2,
  createModelResolutionV2,
  createPhysicalPropertyEvidence,
  createPvoxAssetManifest,
  createPvoxAssetManifestV1,
  createPvoxEditJournal,
  createPvoxEditJournalChain,
  createPvoxFidelityEvidence,
  createPvoxGateEvidence,
  createVoxelCapabilityAssessment,
  createVoxelTechnicalProfile,
  isModelCandidateV2Confirmable,
  isModelResolutionStateV2,
  toLegacyModelResolutionState,
} from "../src/index.js";

const hash = (character: string): string => character.repeat(64);
const timestamp = "2026-08-20T12:00:00.000Z";
const laterTimestamp = "2026-08-20T12:01:00.000Z";
const promotionTimestamp = "2026-08-20T12:02:00.000Z";
const completedTimestamp = "2026-08-20T12:03:00.000Z";
const token = (character: string): string => character.repeat(40);
const hashAttestation = (domain: string, digest: string, character = "t") => ({
  algorithm: "sha256" as const,
  domain,
  digest,
  attestationToken: token(character),
});

const legacyMatchRequest = () => createModelRequestSpec({
  query: "weathered oak table",
  revision: 1,
  rankerId: "model-ranker",
  hardConstraints: {
    maxBytes: 50_000_000,
    maxTextureBytes: 10_000_000,
  },
});

const request = () => createModelRequestSpecV2({
  contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
  policyProfileId: PVOX_MODEL_REQUEST_POLICY_ID,
  requestSemanticProfileHash: hash("2"),
  query: "weathered oak table",
  revision: 1,
  rankerId: "model-ranker",
  hardConstraints: {
    collision: "required",
    partition: "allowed",
  },
  softPreferences: {
    category: "furniture",
    materials: ["weathered oak"],
  },
  exclusions: ["painted"],
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
    requiredCapabilities: ["rendering", "collision", "destruction", "thermal", "moisture", "fluid-boundary"],
    limits: {
      maximumArtifactBytes: 4 * PVOX_PAGE_SIZE_BYTES,
      maximumPages: 4,
      maximumHierarchyDepth: 8,
      maximumHierarchyNodes: 1_000,
      maximumBricks: 512,
      maximumLogicalVoxels: 512 * PVOX_BRICK_EDGE_VOXELS ** 3,
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

const bounds = {
  min: [-1, 0, -0.5] as const,
  max: [1, 1, 0.5] as const,
};

const artifact = () => ({
  uri: `mcp://models/resolutions/resolution-1/candidates/candidate-1/artifacts/sha256/${hash("a")}.pvox`,
  byteLength: PVOX_PAGE_SIZE_BYTES,
  sha256: hash("a"),
  contentType: PVOX_CONTENT_TYPE,
  authenticated: true as const,
});

const page = () => ({
  pageIndex: 0,
  pageKind: "render-field" as const,
  byteOffset: 0,
  byteLength: PVOX_PAGE_SIZE_BYTES,
  decodedByteLength: PVOX_PAGE_SIZE_BYTES,
  sha256: hash("b"),
  spatialKey: {
    lodLevel: 0,
    partitionIndex: 0,
    hierarchyDepth: 8,
    minimumMortonCode: "0000000000000000",
    maximumMortonCode: "00000000000000ff",
  },
});

const lod = () => ({
  level: 0 as const,
  firstPageIndex: 0,
  pageCount: 1,
  brickCount: 16,
  cellSizeMetres: 0.001,
  maximumSurfaceErrorMetres: 0.0004,
  p99SurfaceErrorMetres: 0.0002,
  silhouetteIou: 0.998,
  maximumContourDisplacementPx: 0.2,
  renderedSsim: 0.99,
  p95DeltaE2000: 1.5,
  normalizedMaterialError: 0.002,
});

const pvoxManifestInput = () => ({
  manifestVersion: PVOX_ASSET_MANIFEST_VERSION,
  representation: "pvox" as const,
  formatVersion: PVOX_FORMAT_VERSION,
  contentType: PVOX_CONTENT_TYPE,
  fileExtension: PVOX_FILE_EXTENSION,
  magic: PVOX_MAGIC,
  brickEdgeVoxels: PVOX_BRICK_EDGE_VOXELS,
  pageSizeBytes: PVOX_PAGE_SIZE_BYTES,
  geometryMode: "solid" as const,
  sourceContentHash: hash("7"),
  canonicalDocumentHash: hash("8"),
  rootHash: hash("c"),
  directoryHash: hash("d"),
  pageSetHash: hash("e"),
  binaryClosureHash: hash("f"),
  validationEvidenceHash: hash("9"),
  compilationInputHash: hash("5"),
  runtimeRequestProfileHash: hash("6"),
  headerByteLength: PVOX_HEADER_BYTE_LENGTH,
  directoryEntryByteLength: PVOX_DIRECTORY_ENTRY_BYTE_LENGTH,
  sectionCount: 19,
  maximumRunsPerBrick: PVOX_MAX_RUNS_PER_BRICK,
  maximumLocalSamplesPerBrick: PVOX_MAX_LOCAL_SAMPLES_PER_BRICK,
  maximumEncodedBrickPayloadBytes: PVOX_MAX_ENCODED_BRICK_PAYLOAD_BYTES,
  coordinateSystem: CANONICAL_MODEL_COORDINATE_SYSTEM,
  boundsMetres: bounds,
  artifact: artifact(),
  pages: [page()],
  lods: [lod()],
});

const technicalProfileInput = () => ({
  boundsMetres: bounds,
  dimensionsMetres: { width: 2, height: 1, depth: 1 },
  geometryMode: "solid" as const,
  artifactByteLength: PVOX_PAGE_SIZE_BYTES,
  pageCount: 1,
  brickCount: 16,
  logicalVoxelCapacity: 16 * PVOX_BRICK_EDGE_VOXELS ** 3,
  encodedSurfaceSampleCount: 1_000,
  surfacePropertyCount: 3,
  sectionCount: 19,
  levelSpanRecordCount: 9,
  physicalPaletteRecordCount: 1,
  physicalEvidenceRecordCount: 19,
  materialRegionCount: 1,
  interiorLayerRecordCount: 1,
  massPropertyRecordCount: 1,
  bondRecordCount: 1,
  hierarchyDepth: 8,
  hierarchyNodeCount: 32,
  collisionHierarchyNodeCount: 16,
  collisionBrickCount: 8,
  collisionLogicalVoxelCapacity: 8 * PVOX_BRICK_EDGE_VOXELS ** 3,
  collisionEncodedSurfaceSampleCount: 500,
  lodCount: 1,
  cpuResidentByteLength: 80_000,
  gpuResidentByteLength: 90_000,
  hasCollision: true,
  partitionCount: 1,
  maximumPartitionExtentMetres: 2,
  maximumPartitionDiagonalMetres: Math.sqrt(6),
});

const processingPages = () => [
  {
    pageIndex: 0,
    pageKind: "metadata" as const,
    byteOffset: 0,
    byteLength: PVOX_PAGE_SIZE_BYTES,
    decodedByteLength: PVOX_PAGE_SIZE_BYTES,
    sha256: hash("b"),
  },
  {
    pageIndex: 1,
    pageKind: "lod-structure" as const,
    byteOffset: PVOX_PAGE_SIZE_BYTES,
    byteLength: PVOX_PAGE_SIZE_BYTES,
    decodedByteLength: PVOX_PAGE_SIZE_BYTES,
    sha256: hash("1"),
  },
  {
    ...page(),
    pageIndex: 2,
    byteOffset: 2 * PVOX_PAGE_SIZE_BYTES,
    sha256: hash("2"),
  },
  {
    ...page(),
    pageIndex: 3,
    pageKind: "collision-field" as const,
    byteOffset: 3 * PVOX_PAGE_SIZE_BYTES,
    sha256: hash("3"),
  },
];

const processingPvoxManifestInput = () => ({
  ...pvoxManifestInput(),
  artifact: { ...artifact(), byteLength: 4 * PVOX_PAGE_SIZE_BYTES },
  pages: processingPages(),
  lods: [{ ...lod(), firstPageIndex: 2 }],
});

const processingTechnicalProfileInput = () => ({
  ...technicalProfileInput(),
  artifactByteLength: 4 * PVOX_PAGE_SIZE_BYTES,
  pageCount: 4,
});

const capabilityInputs = () => PVOX_CAPABILITIES.map((capability, index) => ({
  capability,
  status: capability === "animation" || capability === "deformation" || capability === "volume"
    ? "not-applicable"
    : "supported",
  evaluatorId: "pvox-capability-evaluator",
  evaluatorVersion: "1.0.0",
  subjectContentHash: hash("f"),
  evidenceHash: hash("abcdef012"[index]!),
  reasonCodes: capability === "animation" || capability === "deformation" || capability === "volume"
    ? ["not-present"]
    : [],
  evaluatedAt: timestamp,
}));

const physicalPropertyFixtures = [
  ["density", 700, "kg/m3", "source"],
  ["hardness", 4e7, "Pa", "derived"],
  ["tensile-strength", 8e7, "Pa", "derived"],
  ["compressive-strength", 5e7, "Pa", "derived"],
  ["shear-strength", 1e7, "Pa", "derived"],
  ["fracture-energy", 100, "J/m2", "derived"],
  ["friction", 0.5, "1", "source"],
  ["restitution", 0.2, "1", "source"],
  ["thermal-conductivity", 0.12, "W/(m*K)", "source"],
  ["heat-capacity", 1_700, "J/(kg*K)", "source"],
  ["thermal-expansion", 0.000003, "1/K", "derived"],
  ["ignition-temperature", 573, "K", "source"],
  ["melting-temperature", 1_000, "K", "authored"],
  ["porosity", 0.3, "1", "source"],
  ["permeability", 1e-12, "m2", "derived"],
  ["moisture-response", 0.4, "1", "source"],
  ["flammability", 0.8, "1", "source"],
  ["corrosion-rate", 0, "m/s", "source"],
  ["interior-thickness", 0.02, "m", "authored"],
] as const;

const physicalPropertyInputs = () => physicalPropertyFixtures.map(([property, value, unit, provenance], index) => ({
  property,
  value,
  unit,
  provenance,
  confidence: 0.9,
  subjectContentHash: hash("f"),
  regionId: "region-wood",
  materialId: "oak",
  policyId: "pvox-physical-properties-v1",
  policyVersion: "1.0.0",
  evidenceHash: hash("123456789abcdef0123"[index]!),
}));

const physicalRegionInventoryInput = () => ({
  inventoryVersion: "plasius.pvox-physical-region-inventory/1",
  subjectContentHash: hash("f"),
  inventoryHash: hash("2"),
  inventoryHashAttestation: hashAttestation(PVOX_HASH_DOMAINS.physicalInventory, hash("2"), "i"),
  validationEvidenceHash: hash("9"),
  entries: [{ regionIndex: 0, physicalPaletteIndex: 0, regionId: "region-wood", materialId: "oak" }],
});

const reviewedStructuralEvidence = (
  kind: "mass-properties" | "bond-graph" | "interior-layers",
  recordCount: number,
  evidenceHash: string,
) => ({
  kind,
  subjectContentHash: hash("f"),
  physicalInventoryHash: hash("2"),
  recordCount,
  evidenceHash,
  reviewerId: "material-reviewer",
  reviewedAt: timestamp,
  reviewToken: token("m"),
});

const fidelityInput = () => ({
  profileId: "props-furniture-v1",
  surfaceProfileId: "props-furniture-v1",
  profileVersion: "1.0.0",
  outcome: "passed" as const,
  canonicalDocumentHash: hash("8"),
  pvoxBinaryClosureHash: hash("f"),
  evaluatedDiagonalMetres: Math.sqrt(6),
  lod0CellSizeMetres: 0.001,
  maximumAllowedSurfaceErrorMetres: 0.0015,
  maximumSurfaceErrorMetres: 0.0004,
  p99AllowedSurfaceErrorMetres: Math.sqrt(6) * 0.00025,
  p99SurfaceErrorMetres: 0.0002,
  minimumSilhouetteIou: 0.995,
  silhouetteIou: 0.998,
  maximumAllowedContourDisplacementPx: 0.5,
  maximumContourDisplacementPx: 0.2,
  minimumRenderedSsim: 0.98,
  renderedSsim: 0.99,
  maximumP95DeltaE2000: 3,
  p95DeltaE2000: 1.5,
  maximumNormalizedMaterialError: 1 / 255,
  normalizedMaterialError: 0.002,
  evidenceHash: hash("4"),
  evaluatedAt: timestamp,
  decisionToken: token("f"),
});

const converterInput = () => ({
  compilerId: "gpu-model-voxel",
  compilerVersion: "1.0.0",
  sourceFormat: "glb",
  sourceContentHash: hash("7"),
  canonicalDocumentHash: hash("8"),
  compilationInputHash: hash("5"),
  runtimeRequestProfileHash: hash("6"),
  outputContentHash: hash("a"),
  evidenceHash: hash("5"),
  compiledAt: timestamp,
});

const processingManifestInput = () => ({
  contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
  representation: "pvox" as const,
  manifestId: "manifest-1",
  resolutionId: "resolution-1",
  candidateId: "candidate-1",
  kind: "leaf" as const,
  requestProfileId: "static-world-pvox-v1",
  requestSemanticProfileHash: hash("2"),
  capabilityProfileId: "world-editable-v1",
  contentHash: hash("a"),
  binaryClosureHash: hash("f"),
  processingClosureHash: hash("0"),
  processingClosureAttestation: hashAttestation(PVOX_HASH_DOMAINS.processingClosure, hash("0"), "c"),
  assemblyClosureHash: hash("b"),
  assemblyClosureAttestation: hashAttestation(PVOX_HASH_DOMAINS.assemblyClosure, hash("b"), "a"),
  compilationInputHash: hash("5"),
  runtimeRequestProfileHash: hash("6"),
  coordinateSystem: CANONICAL_MODEL_COORDINATE_SYSTEM,
  pvox: processingPvoxManifestInput(),
  technicalProfile: processingTechnicalProfileInput(),
  requiredCapabilities: ["rendering", "collision", "destruction", "thermal", "moisture", "fluid-boundary"],
  capabilities: capabilityInputs(),
  capabilityEvidenceSetHash: hash("3"),
  capabilityEvidenceSetAttestation: hashAttestation(PVOX_HASH_DOMAINS.capabilitySet, hash("3"), "k"),
  physicalRegionInventory: physicalRegionInventoryInput(),
  physicalProperties: physicalPropertyInputs(),
  physicalEvidenceHash: hash("6"),
  physicalEvidenceAttestation: hashAttestation(PVOX_HASH_DOMAINS.physicalEvidence, hash("6"), "h"),
  massPropertiesEvidence: reviewedStructuralEvidence("mass-properties", 1, hash("7")),
  bondGraphEvidence: reviewedStructuralEvidence("bond-graph", 1, hash("8")),
  interiorLayerEvidence: reviewedStructuralEvidence("interior-layers", 1, hash("1")),
  converter: converterInput(),
  fidelity: fidelityInput(),
  children: [],
  processedAt: timestamp,
});

const viewHashes = [hash("1"), hash("2"), hash("3"), hash("4")] as const;

const views = () => (["front", "left", "top", "isometric"] as const).map((kind, index) => ({
  kind,
  imageUri: `mcp://models/resolutions/resolution-1/candidates/candidate-1/${kind}.png`,
  sha256: viewHashes[index],
  contentType: "image/png" as const,
  width: 1024 as const,
  height: 1024 as const,
}));

const gateInputs = () => PVOX_NON_OVERRIDABLE_GATE_KINDS.map((kind, index) => ({
  kind,
  outcome: "passed" as const,
  validatorId: `validator-${kind}`,
  validatorVersion: "1.0.0",
  subjectContentHash: kind === "malware-scan" || kind === "source-format-validation"
    ? hash("7")
    : hash("f"),
  evidenceHash: kind === "source-format-validation" ? hash("5")
    : kind === "pvox-validation" ? hash("9")
      : kind === "fidelity-validation" ? hash("4")
        : kind === "physical-property-validation" ? hash("6")
          : kind === "renderer-validation" ? hash("0")
            : hash("abcdef0"[index]!),
  reasonCodes: [],
  evaluatedAt: timestamp,
  attestationToken: token("g"),
}));

const matchInput = () => ({
  score: 0.9,
  hardConstraintPass: true,
  exactMatch: true,
  reasonCodes: [],
  ranker: {
    id: "model-ranker",
    version: "1.0.0",
    calibrationId: "golden-model-match",
    calibrationVersion: "1.0.0",
    evidenceMode: "exact-identifier",
    assuranceCeiling: "high",
  },
  fidelityWarnings: [],
  request: legacyMatchRequest(),
  candidateId: "candidate-1",
  candidateContentHash: hash("a"),
  requestSemanticProfileHash: hash("2"),
  requestSemanticProfileCanonical: canonicalizeModelRequestSemanticProfileV1(request()),
  evidenceHash: hash("7"),
});

const provenanceInput = () => ({
  kind: "provider" as const,
  sourceId: "kenney",
  sourceAssetId: "kenney-chair-1",
  sourcePageUri: "https://kenney.nl/assets/example",
  contentHash: hash("7"),
  capturedAt: timestamp,
});

const rightsInput = () => ({
  decisionId: "rights-1",
  decisionToken: token("r"),
  policyId: "commercial-redistribution-v1",
  policyVersion: "1.0.0",
  sourceId: "kenney",
  sourceAssetId: "kenney-chair-1",
  sourceContentHash: hash("7"),
  status: "allowed" as const,
  licenseId: "cc0-1.0",
  evidencePageUri: "https://kenney.nl/assets/example",
  reviewedAt: timestamp,
});

const renderEvidenceInput = () => ({
  renderId: "render-1",
  representation: "pvox" as const,
  lodLevel: 0 as const,
  traversalBackend: "native-pvox" as const,
  rendererId: "gpu-renderer",
  rendererVersion: "1.0.0",
  rendererQualificationHash: hash("a"),
  settingsId: "pvox-review-v1",
  settingsVersion: "1.0.0",
  cameraQualificationHash: hash("b"),
  processingManifestId: "manifest-1",
  processingClosureHash: hash("0"),
  pvoxContentHash: hash("a"),
  pvoxRootHash: hash("c"),
  pvoxDirectoryHash: hash("d"),
  pvoxPageSetHash: hash("e"),
  viewSha256s: viewHashes,
  renderedAt: timestamp,
  evidenceHash: hash("0"),
  evidenceHashAttestation: hashAttestation(PVOX_HASH_DOMAINS.renderEvidence, hash("0"), "v"),
});

const confirmationBindingInput = () => ({
  bindingHash: hash("9"),
  bindingHashAttestation: hashAttestation(PVOX_HASH_DOMAINS.confirmationBinding, hash("9"), "c"),
  resolutionId: "resolution-1",
  requesterId: "requester-subject",
  request: request(),
  requestSemanticProfileHash: hash("2"),
  requestRevision: 1,
  candidateId: "candidate-1",
  candidateContentHash: hash("a"),
  candidateAssetRef: {
    disposition: "proposed" as const,
    proposalId: "proposal-1",
    kind: "leaf" as const,
    contentHash: hash("a"),
  },
  match: matchInput(),
  provenance: provenanceInput(),
  rights: rightsInput(),
  sourceContentHash: hash("7"),
  binaryClosureHash: hash("f"),
  pvoxRootHash: hash("c"),
  pvoxDirectoryHash: hash("d"),
  pvoxPageSetHash: hash("e"),
  compilationInputHash: hash("5"),
  runtimeRequestProfileHash: hash("6"),
  processingClosureHash: hash("0"),
  assemblyClosureHash: hash("b"),
  evaluationClosureHash: hash("1"),
  capabilityEvidenceSetHash: hash("3"),
  hardGates: gateInputs(),
  viewSha256s: viewHashes,
  rightsDecisionId: "rights-1",
  fidelityEvidenceHash: hash("4"),
  physicalEvidenceHash: hash("6"),
  rendererId: "gpu-renderer",
  rendererVersion: "1.0.0",
  rendererEvidenceHash: hash("0"),
  renderEvidence: renderEvidenceInput(),
});

const candidateInput = (assurance: "high" | "low" = "high") => {
  const match = matchInput();
  if (assurance === "low") {
    match.score = 0.7;
    match.exactMatch = false;
    match.ranker.evidenceMode = "multimodal";
    match.ranker.assuranceCeiling = "high";
  }
  const confirmationBinding = { ...confirmationBindingInput(), match };
  return {
    contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
    resolutionId: "resolution-1",
    requesterId: "requester-subject",
    candidateId: "candidate-1",
    request: request(),
    admissionStatus: "confirmable" as const,
    assetRef: {
      disposition: "proposed" as const,
      proposalId: "proposal-1",
      kind: "leaf" as const,
      contentHash: hash("a"),
    },
    match,
    provenance: provenanceInput(),
    rights: rightsInput(),
    processingManifest: processingManifestInput(),
    views: views(),
    renderEvidence: renderEvidenceInput(),
    evaluationClosureHash: hash("1"),
    evaluationClosureAttestation: hashAttestation(PVOX_HASH_DOMAINS.evaluationClosure, hash("1"), "e"),
    hardGates: gateInputs(),
    confirmationBinding,
    confirmationToken: token("c"),
    confirmationRequired: true as const,
  };
};

const diagnosticCandidateInput = () => {
  const base = candidateInput("low");
  const blockedFidelity = {
    ...fidelityInput(),
    outcome: "blocked" as const,
    maximumContourDisplacementPx: 0.6,
  };
  const blockedGates = gateInputs().map((entry) => entry.kind === "fidelity-validation"
    ? { ...entry, outcome: "blocked" as const, reasonCodes: ["contour-displacement-exceeded"] }
    : entry);
  const { confirmationBinding: _binding, confirmationToken: _token, ...withoutConfirmation } = base;
  return {
    ...withoutConfirmation,
    admissionStatus: "diagnostic" as const,
    confirmationRequired: false as const,
    processingManifest: {
      ...processingManifestInput(),
      pvox: {
        ...processingPvoxManifestInput(),
        lods: [{ ...processingPvoxManifestInput().lods[0], maximumContourDisplacementPx: 0.6 }],
      },
      fidelity: blockedFidelity,
    },
    hardGates: blockedGates,
  };
};

const confirmationInput = (semanticRiskAccepted = false) => ({
  contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
  confirmationId: "confirmation-1",
  resolutionId: "resolution-1",
  requesterId: "requester-subject",
  candidateId: "candidate-1",
  confirmationToken: token("c"),
  confirmationBindingHash: hash("9"),
  viewSha256s: viewHashes,
  confirmedBy: "requester-subject",
  confirmedAt: laterTimestamp,
  semanticRiskAccepted,
});

const finalAssetRefInput = () => ({
  contractVersion: MODEL_RESOLUTION_CONTRACT_VERSION,
  assetId: "oak-table",
  version: "1.0.0",
  kind: "leaf" as const,
  contentHash: hash("a"),
  runtimeManifestUri: "mcp://models/catalog/oak-table/versions/1.0.0/manifest",
});

const promotionReceiptInput = () => ({
  contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
  promotionId: "promotion-1",
  resolutionId: "resolution-1",
  requesterId: "requester-subject",
  candidateId: "candidate-1",
  proposalId: "proposal-1",
  candidateAssetRef: {
    disposition: "proposed" as const,
    proposalId: "proposal-1",
    kind: "leaf" as const,
    contentHash: hash("a"),
  },
  confirmationId: "confirmation-1",
  confirmationBindingHash: hash("9"),
  processingManifestId: "manifest-1",
  processingContentHash: hash("a"),
  processingClosureHash: hash("0"),
  assemblyClosureHash: hash("b"),
  assemblyChildClosureHashes: [],
  finalAssetRef: finalAssetRefInput(),
  creditsRecordHash: hash("1"),
  catalogRowHash: hash("2"),
  indexSnapshotHash: hash("3"),
  catalogPointerEtag: "catalog-etag-1",
  indexPointerEtag: "index-etag-1",
  publicationState: "pointer-last-complete" as const,
  creditsWrittenAt: promotionTimestamp,
  catalogRowWrittenAt: promotionTimestamp,
  indexSnapshotWrittenAt: promotionTimestamp,
  pointerPublishedAt: promotionTimestamp,
  publicationHash: hash("4"),
  publicationHashAttestation: hashAttestation(PVOX_HASH_DOMAINS.publication, hash("4"), "p"),
  promotedAt: promotionTimestamp,
  publicationToken: token("p"),
});

describe("PVOX v2 constants and compatibility", () => {
  it("publishes an independent additive contract and governed rollout identifiers", () => {
    expect(MODEL_RESOLUTION_V2_CONTRACT_VERSION).not.toBe(MODEL_RESOLUTION_CONTRACT_VERSION);
    expect(PVOX_FEATURE_FLAG_ID).toBe("asset.pipeline.pvox-models.enabled");
    expect(PVOX_REQUIRED_OAUTH_CAPABILITIES).toEqual([
      "asset.catalog.request",
      "asset.catalog.confirm",
      "asset.catalog.review",
      "asset.source.manage",
      "asset.pipeline.mcp.manage",
    ]);
    expect(PVOX_DEFAULT_LIMITS).toMatchObject({
      maximumArtifactBytes: 164 * 1024 * 1024,
      maximumPages: 2_624,
      maximumHierarchyDepth: 8,
      maximumBricks: 524_288,
      maximumLogicalVoxels: 268_435_456,
      maximumEncodedSurfaceSamples: 8_388_608,
    });
    expect(PVOX_DEFAULT_LIMITS.maximumLogicalVoxels).toBe(PVOX_DEFAULT_LIMITS.maximumBricks * PVOX_BRICK_EDGE_VOXELS ** 3);
    expect(PVOX_DEFAULT_LIMITS.maximumBricks * PVOX_MIN_BRICK_DESCRIPTOR_BYTES).toBeLessThan(PVOX_DEFAULT_LIMITS.maximumArtifactBytes);
    expect(PVOX_DEFAULT_LIMITS.maximumEncodedSurfaceSamples * PVOX_MIN_ENCODED_SURFACE_SAMPLE_BYTES).toBeLessThan(PVOX_DEFAULT_LIMITS.maximumArtifactBytes);
    expect(PVOX_PAGE_KINDS).toEqual(["metadata", "lod-structure", "render-field", "collision-field"]);
    expect(PVOX_FORMAT_VERSION).toEqual({ major: 1, minor: 0 });
    expect(PVOX_HEADER_BYTE_LENGTH).toBe(256);
    expect(PVOX_DIRECTORY_ENTRY_BYTE_LENGTH).toBe(128);
    expect(PVOX_MAX_SECTIONS).toBe(64);
    expect(PVOX_MAX_HIERARCHY_NODES).toBe(1_048_576);
    expect(PVOX_MAX_RUNS_PER_BRICK).toBe(512);
    expect(PVOX_MAX_LOCAL_SAMPLES_PER_BRICK).toBe(512);
    expect(PVOX_MAX_ENCODED_BRICK_PAYLOAD_BYTES).toBe(10_384);
    expect(PVOX_MAX_ABSOLUTE_COORDINATE_METRES).toBe(1_048_576);
    expect(PVOX_HASH_DOMAINS.binaryClosure).toBe("PVOX-BINARY-CLOSURE-V1\0");
    expect(PVOX_HASH_PREIMAGE_LAYOUTS.binaryClosure).toEqual([
      "domain",
      "sourceContentHash:raw32",
      "canonicalDocumentHash:raw32",
      "compilationInputHash:raw32",
      "runtimeRequestProfileHash:raw32",
      "artifactSha256:raw32",
      "rootHash:raw32",
      "directoryHash:raw32",
      "pageSetHash:raw32",
    ]);
    expect(PVOX_MODEL_REQUEST_POLICY_ID).toBe("pvox-world-v1");
    expect(PVOX_FIDELITY_PROFILE_IDS).toContain("props-furniture-v1");
    expect(PVOX_RUNTIME_CAPABILITY_PROFILE_IDS).toContain("world-editable-v1");
    expect(PVOX_DEFAULT_SOURCE_INGESTION_LIMITS.maximumTextureDimensionPx).toBe(16_384);
    expect(Object.isFrozen(PVOX_DEFAULT_LIMITS)).toBe(true);
    expect(new Set(PVOX_PHYSICAL_PROPERTIES).size).toBe(PVOX_PHYSICAL_PROPERTIES.length);
  });

  it.each([
    ["downloading", "searching-providers"],
    ["importing", "processing"],
    ["voxelizing", "processing"],
    ["evaluating-fidelity", "evaluating"],
    ["awaiting-material-review", "evaluating"],
    ["completed", "completed"],
  ] as const)("projects %s to the legacy state %s", (state, legacy) => {
    expect(isModelResolutionStateV2(state)).toBe(true);
    expect(toLegacyModelResolutionState(state)).toBe(legacy);
    expect(MODEL_RESOLUTION_V2_COMPATIBILITY_STATES[state]).toBe(legacy);
  });

  it("rejects unknown v2 states", () => {
    expect(isModelResolutionStateV2("done")).toBe(false);
    expect(() => toLegacyModelResolutionState("done" as never)).toThrow(/state/i);
    expect(MODEL_RESOLUTION_V2_STATES).toContain("awaiting-material-review");
  });

  it("publishes closed JSON schemas for every new contract family", () => {
    expect(Object.keys(MODEL_RESOLUTION_V2_JSON_SCHEMAS)).toEqual([
      "modelRequestSpec",
      "pvoxAssetManifest",
      "voxelTechnicalProfile",
      "voxelCapabilityAssessment",
      "physicalPropertyEvidence",
      "pvoxEditJournal",
      "pvoxFidelityEvidence",
      "pvoxGateEvidence",
      "modelProcessingManifest",
      "modelCandidate",
      "modelCandidateConfirmation",
      "modelPromotionReceipt",
      "modelRefinementQuestion",
      "modelResolution",
    ]);
    for (const schema of Object.values(MODEL_RESOLUTION_V2_JSON_SCHEMAS)) {
      expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
      expect(schema.$id).toMatch(new RegExp(`/model-resolution/${MODEL_RESOLUTION_V2_CONTRACT_VERSION}/[^/]+\\.schema\\.json$`, "u"));
      expect(schema.type).toBe("object");
      expect(schema.additionalProperties).toBe(false);
      expect(schema.$defs).toBeDefined();
      expect(Object.isFrozen(schema)).toBe(true);
    }
  });

  it("publishes self-contained closed schemas with resolvable local references", () => {
    const visit = (schema: unknown, definitions: Readonly<Record<string, unknown>>, path = "schema"): void => {
      if (schema === null || typeof schema !== "object") return;
      const record = schema as Record<string, unknown>;
      if (record.$ref !== undefined) {
        expect(record.$ref, path).toMatch(/^#\/\$defs\/[A-Za-z0-9]+$/u);
        const name = String(record.$ref).slice("#/$defs/".length);
        expect(definitions[name], `${path} unresolved $ref`).toBeDefined();
      }
      if (record.type === "object") {
        expect(record.properties, `${path} must define properties`).toBeDefined();
        if (record.additionalProperties === undefined) {
          expect(path, `${path} may only omit additionalProperties for a closed modelResolution lifecycle overlay`)
            .toMatch(/modelResolution(?:\.schema)?(?:\.\$defs\.modelResolution)?\.allOf\.\d+\.(?:if|then|else)/u);
        } else {
          expect(record.additionalProperties, `${path} must be closed`).toBe(false);
        }
      }
      if (record.type === "array") {
        expect(record.items !== undefined || record.prefixItems !== undefined, `${path} must constrain items`).toBe(true);
      }
      for (const [key, value] of Object.entries(record)) {
        if (key !== "$defs") visit(value, definitions, `${path}.${key}`);
      }
    };

    for (const [name, schema] of Object.entries(MODEL_RESOLUTION_V2_JSON_SCHEMAS)) {
      visit(schema, schema.$defs, name);
      for (const [definitionName, definition] of Object.entries(schema.$defs)) {
        visit(definition, schema.$defs, `${name}.$defs.${definitionName}`);
      }
    }
  });

  it("compiles every standalone schema with Ajv 2020 in strict mode", () => {
    const ajv = new Ajv2020({ strict: true, allErrors: true });
    for (const schema of Object.values(MODEL_RESOLUTION_V2_JSON_SCHEMAS)) {
      expect(() => ajv.compile(schema)).not.toThrow();
    }
  });

  it("mirrors released-v1 opaque IDs, attribution bounds, and reason-code grammar", () => {
    const { $defs } = MODEL_RESOLUTION_V2_JSON_SCHEMAS.modelCandidate;
    const compileDefinition = (name: string) => new Ajv2020({ strict: true, allErrors: true }).compile({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $ref: `#/$defs/${name}`,
      $defs,
    });
    const validateProvenance = compileDefinition("provenance");
    const provenance = {
      kind: "catalog",
      sourceId: "catalog",
      sourceAssetId: `A${"b".repeat(255)}`,
      contentHash: hash("a"),
      capturedAt: timestamp,
    };
    expect(validateProvenance(provenance), JSON.stringify(validateProvenance.errors)).toBe(true);
    expect(validateProvenance({ ...provenance, sourceAssetId: `${provenance.sourceAssetId}c` })).toBe(false);

    const validateAttribution = compileDefinition("attribution");
    const attribution = {
      title: "t".repeat(256),
      creator: "c".repeat(256),
      notice: "n".repeat(512),
    };
    expect(validateAttribution(attribution), JSON.stringify(validateAttribution.errors)).toBe(true);
    expect(validateAttribution({ ...attribution, title: `${attribution.title}t` })).toBe(false);
    expect(validateAttribution({ ...attribution, creator: `${attribution.creator}c` })).toBe(false);

    const matchDefinition = $defs.modelMatchAssessment as {
      readonly properties: Readonly<Record<string, unknown>>;
    };
    const validateReasonCodes = new Ajv2020({ strict: true, allErrors: true }).compile({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      ...matchDefinition.properties.reasonCodes as Record<string, unknown>,
    });
    expect(validateReasonCodes(["ProviderDrift", "FORMAT_CHANGED"]), JSON.stringify(validateReasonCodes.errors)).toBe(true);

    const validatePage = compileDefinition("pvoxPage");
    const { spatialKey: _spatialKey, ...nonSpatialPage } = page();
    expect(validatePage(page()), JSON.stringify(validatePage.errors)).toBe(true);
    expect(validatePage(nonSpatialPage)).toBe(false);
    expect(validatePage({ ...nonSpatialPage, pageKind: "metadata" }), JSON.stringify(validatePage.errors)).toBe(true);
    expect(validatePage({ ...page(), pageKind: "metadata" })).toBe(false);
  });

  it("accepts every factory-normalized public contract with its matching schema", () => {
    const candidate = createModelCandidateV2(candidateInput());
    const confirmation = createModelCandidateConfirmationV2(confirmationInput(), candidate, "resolution-1");
    const completed = createModelResolutionV2({
      contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
      resolutionId: "resolution-1",
      requesterId: "requester-subject",
      request: request(),
      attempts: 1,
      state: "completed",
      candidates: [candidate],
      bestCandidate: candidate,
      confirmation,
      promotionReceipt: promotionReceiptInput(),
      refinementQuestions: [],
      finalAssetRef: finalAssetRefInput(),
      createdAt: timestamp,
      updatedAt: completedTimestamp,
    });
    const diagnostic = createModelCandidateV2(diagnosticCandidateInput());
    const unresolved = createModelResolutionV2({
      contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
      resolutionId: "resolution-1",
      requesterId: "requester-subject",
      request: request(),
      attempts: 2,
      state: "unresolved",
      candidates: [diagnostic],
      bestCandidate: diagnostic,
      refinementQuestions: [{
        questionId: "thin-feature-priority",
        prompt: "Should thin contour fidelity take priority over storage size?",
        reasonCodes: ["contour-displacement-exceeded"],
      }],
      stateReasonCode: "fidelity-profile-not-met",
      createdAt: timestamp,
      updatedAt: laterTimestamp,
    });
    const editJournal = createPvoxEditJournal({
      journalVersion: "plasius.pvox-edit-journal/1",
      baseContentHash: hash("a"),
      basePageSetHash: hash("e"),
      placementId: "placement-1",
      gridVersion: "grid-v1",
      operationId: "operation-1",
      expectedRevision: 0,
      resultingRevision: 1,
      previousJournalHash: PVOX_EDIT_JOURNAL_GENESIS_HASH,
      expectedRootHash: hash("c"),
      resultingRootHash: hash("b"),
      resultingRootHashAttestation: hashAttestation(PVOX_HASH_DOMAINS.editOverlayRoot, hash("b"), "o"),
      patches: [{
        fieldKind: "render-field",
        lodLevel: 0,
        partitionIndex: 0,
        hierarchyDepth: 8,
        mortonCode: "0000000000000001",
        expectedPageIndex: 0,
        expectedPageHash: hash("b"),
        operation: "replace",
        expectedBrickHash: hash("2"),
        resultingBrickHash: hash("3"),
        resultingPageHash: hash("4"),
      }],
      dirtyBoundsMetres: bounds,
      massDeltaKg: -2.5,
      journalHash: hash("1"),
      journalHashAttestation: hashAttestation(PVOX_HASH_DOMAINS.editJournal, hash("1"), "j"),
      recordedAt: timestamp,
    }, pvoxManifestInput());
    if (completed.promotionReceipt === undefined || unresolved.refinementQuestions[0] === undefined) {
      throw new Error("expected normalized receipt and refinement question fixtures");
    }
    const samples = {
      modelRequestSpec: request(),
      pvoxAssetManifest: createPvoxAssetManifestV1(pvoxManifestInput()),
      voxelTechnicalProfile: createVoxelTechnicalProfile(technicalProfileInput()),
      voxelCapabilityAssessment: createVoxelCapabilityAssessment(capabilityInputs()[0]),
      physicalPropertyEvidence: createPhysicalPropertyEvidence(physicalPropertyInputs()[0]),
      pvoxEditJournal: editJournal,
      pvoxFidelityEvidence: createPvoxFidelityEvidence(fidelityInput()),
      pvoxGateEvidence: createPvoxGateEvidence(gateInputs()[0]),
      modelProcessingManifest: createModelProcessingManifestV2(processingManifestInput()),
      modelCandidate: candidate,
      modelCandidateConfirmation: confirmation,
      modelPromotionReceipt: completed.promotionReceipt,
      modelRefinementQuestion: unresolved.refinementQuestions[0],
      modelResolution: completed,
    } satisfies Record<keyof typeof MODEL_RESOLUTION_V2_JSON_SCHEMAS, unknown>;

    const ajv = new Ajv2020({ strict: true, allErrors: true });
    for (const [name, schema] of Object.entries(MODEL_RESOLUTION_V2_JSON_SCHEMAS)) {
      const validate = ajv.compile(schema);
      const valid = validate(samples[name as keyof typeof samples]);
      expect(valid, `${name}: ${ajv.errorsText(validate.errors)}`).toBe(true);
    }
  });

  it("enforces the static section floor and state-dependent resolution lifecycle", () => {
    const ajv = new Ajv2020({ strict: true, allErrors: true });
    const validateManifest = ajv.compile(MODEL_RESOLUTION_V2_JSON_SCHEMAS.pvoxAssetManifest);
    const validateTechnicalProfile = ajv.compile(MODEL_RESOLUTION_V2_JSON_SCHEMAS.voxelTechnicalProfile);
    expect(validateManifest({ ...createPvoxAssetManifestV1(pvoxManifestInput()), sectionCount: 12 })).toBe(false);
    expect(validateTechnicalProfile({ ...createVoxelTechnicalProfile(technicalProfileInput()), sectionCount: 12 })).toBe(false);

    const validateReceipt = ajv.compile(MODEL_RESOLUTION_V2_JSON_SCHEMAS.modelPromotionReceipt);
    const receipt = promotionReceiptInput();
    expect(validateReceipt(receipt), ajv.errorsText(validateReceipt.errors)).toBe(true);
    expect(validateReceipt({
      ...receipt,
      candidateAssetRef: {
        disposition: "existing",
        kind: "leaf",
        contentHash: hash("a"),
        asset: finalAssetRefInput(),
      },
    })).toBe(false);

    const candidate = createModelCandidateV2(candidateInput());
    const confirmation = createModelCandidateConfirmationV2(confirmationInput(), candidate, "resolution-1");
    const completed = createModelResolutionV2({
      contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
      resolutionId: "resolution-1",
      requesterId: "requester-subject",
      request: request(),
      attempts: 1,
      state: "completed",
      candidates: [candidate],
      bestCandidate: candidate,
      confirmation,
      promotionReceipt: receipt,
      refinementQuestions: [],
      finalAssetRef: finalAssetRefInput(),
      createdAt: timestamp,
      updatedAt: completedTimestamp,
    });
    const searching = createModelResolutionV2({
      contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
      resolutionId: "resolution-1",
      requesterId: "requester-subject",
      request: request(),
      attempts: 1,
      state: "searching-catalog",
      candidates: [],
      refinementQuestions: [],
      createdAt: timestamp,
      updatedAt: laterTimestamp,
    });
    const unresolved = createModelResolutionV2({
      contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
      resolutionId: "resolution-1",
      requesterId: "requester-subject",
      request: request(),
      attempts: 1,
      state: "unresolved",
      candidates: [],
      refinementQuestions: [],
      stateReasonCode: "provider-exhausted",
      createdAt: timestamp,
      updatedAt: laterTimestamp,
    });
    const validateResolution = ajv.compile(MODEL_RESOLUTION_V2_JSON_SCHEMAS.modelResolution);
    expect(validateResolution(completed), ajv.errorsText(validateResolution.errors)).toBe(true);
    expect(validateResolution(searching), ajv.errorsText(validateResolution.errors)).toBe(true);
    expect(validateResolution(unresolved), ajv.errorsText(validateResolution.errors)).toBe(true);

    const { confirmation: _confirmation, ...completedWithoutConfirmation } = completed;
    const { finalAssetRef: _finalAssetRef, ...completedWithoutFinalAssetRef } = completed;
    const { promotionReceipt: _promotionReceipt, ...completedWithoutPromotionReceipt } = completed;
    const { stateReasonCode: _stateReasonCode, ...unresolvedWithoutReason } = unresolved;
    expect(validateResolution(completedWithoutConfirmation)).toBe(false);
    expect(validateResolution(completedWithoutFinalAssetRef)).toBe(false);
    expect(validateResolution(completedWithoutPromotionReceipt)).toBe(false);
    expect(validateResolution(unresolvedWithoutReason)).toBe(false);
    expect(validateResolution({ ...searching, stateReasonCode: "unexpected-reason" })).toBe(false);
    expect(validateResolution({ ...searching, confirmation })).toBe(false);
    expect(validateResolution({ ...searching, finalAssetRef: finalAssetRefInput() })).toBe(false);
    expect(validateResolution({ ...searching, promotionReceipt: receipt })).toBe(false);
    expect(validateResolution({
      ...searching,
      state: "awaiting-confirmation",
      compatibilityState: "awaiting-confirmation",
    })).toBe(false);
  });

  it("keeps schema samples and runtime factories aligned at nested boundaries", () => {
    const cases = [
      {
        name: "request runtime profile",
        schema: MODEL_RESOLUTION_V2_JSON_SCHEMAS.modelRequestSpec,
        value: { ...request(), pvoxRuntimeProfile: { ...request().pvoxRuntimeProfile, textureUri: "https://invalid.example" } },
        create: createModelRequestSpecV2,
      },
      {
        name: "fidelity governed threshold",
        schema: MODEL_RESOLUTION_V2_JSON_SCHEMAS.pvoxFidelityEvidence,
        value: { ...fidelityInput(), minimumSilhouetteIou: 0 },
        create: createPvoxFidelityEvidence,
      },
      {
        name: "physical governed unit",
        schema: MODEL_RESOLUTION_V2_JSON_SCHEMAS.physicalPropertyEvidence,
        value: { ...physicalPropertyInputs()[0], unit: "g/cm3" },
        create: createPhysicalPropertyEvidence,
      },
      {
        name: "capability reason semantics",
        schema: MODEL_RESOLUTION_V2_JSON_SCHEMAS.voxelCapabilityAssessment,
        value: { ...capabilityInputs()[0], status: "unsupported", reasonCodes: [] },
        create: createVoxelCapabilityAssessment,
      },
      {
        name: "processing PVOX manifest",
        schema: MODEL_RESOLUTION_V2_JSON_SCHEMAS.modelProcessingManifest,
        value: { ...processingManifestInput(), pvox: { ...pvoxManifestInput(), textureUri: "https://invalid.example" } },
        create: createModelProcessingManifestV2,
      },
      {
        name: "render page requires spatial scope",
        schema: MODEL_RESOLUTION_V2_JSON_SCHEMAS.pvoxAssetManifest,
        value: { ...pvoxManifestInput(), pages: [{ ...page(), spatialKey: undefined }] },
        create: createPvoxAssetManifestV1,
      },
      {
        name: "structural page forbids spatial scope",
        schema: MODEL_RESOLUTION_V2_JSON_SCHEMAS.pvoxAssetManifest,
        value: { ...pvoxManifestInput(), pages: [{ ...page(), pageKind: "metadata" }] },
        create: createPvoxAssetManifestV1,
      },
    ];
    const ajv = new Ajv2020({ strict: true, allErrors: true });
    for (const { name, schema, value, create } of cases) {
      const validate = ajv.compile(schema);
      expect(validate(value), `${name} schema unexpectedly accepted input`).toBe(false);
      expect(() => create(value), `${name} factory unexpectedly accepted input`).toThrow();
    }
  });
});

describe("PVOX request contracts", () => {
  it("keeps acquisition/decode budgets separate from texture-free runtime limits", () => {
    const normalized = request();
    expect(normalized.contractVersion).toBe(MODEL_RESOLUTION_V2_CONTRACT_VERSION);
    expect(normalized.policyProfileId).toBe(PVOX_MODEL_REQUEST_POLICY_ID);
    expect(normalized.sourceIngestionLimits.maximumDecodedTextureBytes).toBe(100_000_000);
    expect(normalized.pvoxRuntimeProfile.limits.maximumArtifactBytes).toBe(4 * PVOX_PAGE_SIZE_BYTES);
    expect(normalized.pvoxRuntimeProfile.limits.maximumLogicalVoxels).toBe(512 * PVOX_BRICK_EDGE_VOXELS ** 3);
    expect(normalized.pvoxRuntimeProfile.limits.maximumEncodedSurfaceSamples).toBe(10_000);
    expect(normalized.pvoxRuntimeProfile.limits.maximumHierarchyNodes).toBe(1_000);
    expect(normalized.pvoxRuntimeProfile.requiredCapabilities).toContain("destruction");
    expect(normalized.pvoxRuntimeProfile.limits).not.toHaveProperty("maximumTextureBytes");
    expect(normalized.pvoxRuntimeProfile.limits).not.toHaveProperty("maxTriangles");
    expect(normalized.pvoxRuntimeProfile.limits).not.toHaveProperty("maximumSurfaceSamples");
    expect(Object.isFrozen(normalized)).toBe(true);
    expect(Object.isFrozen(normalized.pvoxRuntimeProfile.limits)).toBe(true);
  });

  it("rejects mesh-era runtime fields, oversized source limits, and incomplete named capabilities", () => {
    const valid = request();
    expect(() => createModelRequestSpecV2({
      ...valid,
      hardConstraints: { ...valid.hardConstraints, maxTextureBytes: 1 },
    })).toThrow(/unsupported|maxTextureBytes/i);
    expect(() => createModelRequestSpecV2({
      ...valid,
      sourceIngestionLimits: {
        ...valid.sourceIngestionLimits,
        maximumDownloadBytes: PVOX_DEFAULT_SOURCE_INGESTION_LIMITS.maximumDownloadBytes + 1,
      },
    })).toThrow(/maximumDownloadBytes/i);
    expect(() => createModelRequestSpecV2({
      ...valid,
      pvoxRuntimeProfile: {
        ...valid.pvoxRuntimeProfile,
        limits: { ...valid.pvoxRuntimeProfile.limits, maximumTextureBytes: 1 },
      },
    })).toThrow(/unsupported|maximumTextureBytes/i);
    expect(() => createModelRequestSpecV2({
      ...valid,
      pvoxRuntimeProfile: {
        ...valid.pvoxRuntimeProfile,
        limits: { ...valid.pvoxRuntimeProfile.limits, maximumSurfaceSamples: 1 },
      },
    })).toThrow(/unsupported|maximumSurfaceSamples/i);
    expect(() => createModelRequestSpecV2({
      ...valid,
      pvoxRuntimeProfile: {
        ...valid.pvoxRuntimeProfile,
        limits: {
          ...valid.pvoxRuntimeProfile.limits,
          maximumHierarchyNodes: PVOX_MAX_HIERARCHY_NODES + 1,
        },
      },
    })).toThrow(/maximumHierarchyNodes/i);
    expect(() => createModelRequestSpecV2({
      ...valid,
      pvoxRuntimeProfile: {
        ...valid.pvoxRuntimeProfile,
        requiredCapabilities: ["rendering"],
      },
    })).toThrow(/capabilityProfileId|requiredCapabilities/i);
  });
});

describe("PVOX artifact and technical contracts", () => {
  it("validates and deeply freezes an authenticated PVOX closure", () => {
    const manifest = createPvoxAssetManifestV1(pvoxManifestInput());
    expect(manifest.representation).toBe("pvox");
    expect(manifest.artifact.contentType).toBe(PVOX_CONTENT_TYPE);
    expect(Object.isFrozen(manifest)).toBe(true);
    expect(Object.isFrozen(manifest.pages)).toBe(true);
    expect(createPvoxAssetManifest(pvoxManifestInput())).toEqual(manifest);
  });

  it.each([
    ["unknown representation", { representation: "glb" }, /representation/i],
    ["direct artifact URL", { artifact: { ...artifact(), uri: "https://storage.example/model.pvox?sig=secret" } }, /mcp|resource/i],
    ["wrong media type", { artifact: { ...artifact(), contentType: "model/gltf-binary" } }, /contentType|PVOX/i],
    ["scalar format version", { formatVersion: 1 }, /formatVersion|plain object|unsupported/i],
    ["page gap", { pages: [{ ...page(), pageIndex: 1 }] }, /contiguous|pageIndex/i],
    ["misaligned page", { pages: [{ ...page(), byteOffset: 1 }] }, /aligned|byteOffset/i],
    ["partial page", { pages: [{ ...page(), byteLength: PVOX_PAGE_SIZE_BYTES - 1, decodedByteLength: PVOX_PAGE_SIZE_BYTES - 1 }] }, /page|byteLength/i],
    ["decoded page mismatch", { pages: [{ ...page(), decodedByteLength: PVOX_PAGE_SIZE_BYTES - 1 }] }, /decodedByteLength|compress/i],
    ["invalid morton range", { pages: [{ ...page(), spatialKey: { ...page().spatialKey, minimumMortonCode: "ff00000000000000", maximumMortonCode: "00000000000000ff" } }] }, /Morton/i],
    ["missing closure", { binaryClosureHash: undefined }, /closureHash/i],
    ["reused compilation hash", { compilationInputHash: hash("8") }, /distinct|compilation/i],
    ["trailing artifact bytes", { artifact: { ...artifact(), byteLength: PVOX_PAGE_SIZE_BYTES + 1 } }, /exactly cover|artifact/i],
  ])("fails closed for %s", (_name, change, pattern) => {
    expect(() => createPvoxAssetManifestV1({ ...pvoxManifestInput(), ...change })).toThrow(pattern);
  });

  it("rejects unsupported keys before normalizing nested values", () => {
    expect(() => createPvoxAssetManifestV1({
      ...pvoxManifestInput(),
      downloadUrl: "https://provider.example/private",
    })).toThrow(/unsupported/i);
    expect(() => createPvoxAssetManifestV1(Object.create(pvoxManifestInput()))).toThrow(/plain object/i);
  });

  it("rejects accessors, symbols, non-enumerable fields, and sparse arrays without invoking them", () => {
    let getterInvoked = false;
    const accessor = pvoxManifestInput() as Record<string, unknown>;
    Object.defineProperty(accessor, "rootHash", {
      enumerable: true,
      get: () => {
        getterInvoked = true;
        return hash("c");
      },
    });
    expect(() => createPvoxAssetManifestV1(accessor)).toThrow(/data|plain|accessor/i);
    expect(getterInvoked).toBe(false);

    const symbolic = pvoxManifestInput() as Record<PropertyKey, unknown>;
    symbolic[Symbol("secret")] = "hidden";
    expect(() => createPvoxAssetManifestV1(symbolic)).toThrow(/data|symbol|plain/i);

    const hidden = pvoxManifestInput() as Record<string, unknown>;
    Object.defineProperty(hidden, "hidden", { enumerable: false, value: "secret" });
    expect(() => createPvoxAssetManifestV1(hidden)).toThrow(/data|enumerable|plain/i);

    expect(() => createPvoxGateEvidence({
      ...gateInputs()[0],
      outcome: "blocked",
      reasonCodes: new Array(1),
    })).toThrow(/dense|array|reason/i);
  });

  it.each([
    "latest",
    "LaTeSt",
    "current",
    "stable",
    "preview",
    "default",
    "production",
    "canary",
    "v1.x",
    "vX",
  ])("rejects mutable catalog artifact version %s", (version) => {
    const input = {
      ...pvoxManifestInput(),
      artifact: {
        ...artifact(),
        uri: `mcp://models/catalog/oak-table/versions/${version}/artifacts/sha256/${hash("a")}.pvox`,
      },
    };
    expect(() => createPvoxAssetManifestV1(input)).toThrow(/immutable|version|resource/i);
    const validate = new Ajv2020({ strict: true, allErrors: true }).compile(MODEL_RESOLUTION_V2_JSON_SCHEMAS.pvoxAssetManifest);
    expect(validate(input), `schema accepted mutable catalog version ${version}`).toBe(false);
  });

  it("accepts repeated page content while requiring globally ordered non-overlapping Morton ranges", () => {
    const secondPage = {
      ...page(),
      pageIndex: 1,
      byteOffset: PVOX_PAGE_SIZE_BYTES,
      spatialKey: {
        ...page().spatialKey,
        minimumMortonCode: "0000000000000100",
        maximumMortonCode: "00000000000001ff",
      },
    };
    const twoPage = {
      ...pvoxManifestInput(),
      artifact: { ...artifact(), byteLength: 2 * PVOX_PAGE_SIZE_BYTES },
      pages: [page(), secondPage],
      lods: [{ ...lod(), pageCount: 2, brickCount: 32 }],
    };
    expect(createPvoxAssetManifestV1(twoPage).pages[1]?.sha256).toBe(hash("b"));
    expect(() => createPvoxAssetManifestV1({
      ...twoPage,
      pages: [page(), { ...secondPage, spatialKey: { ...secondPage.spatialKey, minimumMortonCode: "00000000000000ff" } }],
    })).toThrow(/Morton|ordered|overlap/i);
  });

  it("orders required field-page spatial keys within kind, LOD, and partition scopes", () => {
    const metadata = {
      pageIndex: 0,
      pageKind: "metadata" as const,
      byteOffset: 0,
      byteLength: PVOX_PAGE_SIZE_BYTES,
      decodedByteLength: PVOX_PAGE_SIZE_BYTES,
      sha256: hash("1"),
    };
    const firstSpatial = {
      ...page(),
      pageIndex: 1,
      byteOffset: PVOX_PAGE_SIZE_BYTES,
    };
    const palette = {
      ...metadata,
      pageIndex: 2,
      pageKind: "lod-structure" as const,
      byteOffset: 2 * PVOX_PAGE_SIZE_BYTES,
      sha256: hash("2"),
    };
    const secondSpatial = {
      ...page(),
      pageIndex: 3,
      byteOffset: 3 * PVOX_PAGE_SIZE_BYTES,
      spatialKey: {
        ...page().spatialKey,
        minimumMortonCode: "0000000000000100",
        maximumMortonCode: "00000000000001ff",
      },
      sha256: hash("3"),
    };
    const manifest = {
      ...pvoxManifestInput(),
      artifact: { ...artifact(), byteLength: 4 * PVOX_PAGE_SIZE_BYTES },
      pages: [metadata, firstSpatial, palette, secondSpatial],
      lods: [{ ...lod(), firstPageIndex: 1, pageCount: 1, brickCount: 8 }],
    };
    expect(createPvoxAssetManifestV1(manifest).pages.map(({ pageKind }) => pageKind)).toEqual(["metadata", "render-field", "lod-structure", "render-field"]);
    expect(() => createPvoxAssetManifestV1({
      ...manifest,
      pages: [metadata, { ...firstSpatial, spatialKey: undefined }, palette, secondSpatial],
    })).toThrow(/spatialKey|render/i);
    expect(() => createPvoxAssetManifestV1({
      ...manifest,
      pages: [{ ...metadata, spatialKey: page().spatialKey }, firstSpatial, palette, secondSpatial],
    })).toThrow(/spatialKey|metadata/i);
    expect(() => createPvoxAssetManifestV1({
      ...manifest,
      pages: [metadata, firstSpatial, palette, { ...secondSpatial, spatialKey: { ...secondSpatial.spatialKey, minimumMortonCode: "00000000000000ff" } }],
    })).toThrow(/Morton|ordered|overlap/i);
    expect(createPvoxAssetManifestV1(manifest).pages[0]?.spatialKey).toBeUndefined();
  });

  it("validates derived dimensions and fixed PVOX limits", () => {
    const profile = createVoxelTechnicalProfile(technicalProfileInput());
    expect(profile.dimensionsMetres.width).toBe(2);
    expect(Object.isFrozen(profile)).toBe(true);
    expect(() => createVoxelTechnicalProfile({
      ...technicalProfileInput(),
      dimensionsMetres: { width: 3, height: 1, depth: 1 },
    })).toThrow(/dimensions/i);
    expect(() => createVoxelTechnicalProfile({
      ...technicalProfileInput(),
      pageCount: PVOX_DEFAULT_LIMITS.maximumPages + 1,
    })).toThrow(/pageCount/i);
    expect(() => createVoxelTechnicalProfile({
      ...technicalProfileInput(),
      gpuResidentByteLength: Number.MAX_SAFE_INTEGER,
    })).toThrow(/gpuResidentByteLength/i);
    expect(() => createVoxelTechnicalProfile({
      ...technicalProfileInput(),
      sectionCount: 20,
    })).toThrow(/sectionCount|closed|exact/i);
    expect(() => createVoxelTechnicalProfile({
      ...technicalProfileInput(),
      boundsMetres: { min: [-0.5, 0.1, -0.5], max: [1.5, 1.1, 0.5] },
    })).toThrow(/floor|cent/i);
    expect(createVoxelTechnicalProfile({
      ...technicalProfileInput(),
      boundsMetres: { min: [-0.004, 0, -0.004], max: [0.004, 0.008, 0.004] },
      dimensionsMetres: { width: 0.008, height: 0.008, depth: 0.008 },
      brickCount: 1,
      logicalVoxelCapacity: 512,
      encodedSurfaceSampleCount: 1,
      hierarchyDepth: 0,
      hierarchyNodeCount: 1,
      levelSpanRecordCount: 1,
      maximumPartitionExtentMetres: 0.008,
      maximumPartitionDiagonalMetres: Math.sqrt(3 * 0.008 ** 2),
    }).hierarchyDepth).toBe(0);
  });

  it("rejects byte-impossible brick/sample counts and partition grids too coarse for LOD0", () => {
    expect(calculatePvoxMinimumArtifactByteLength(createVoxelTechnicalProfile(technicalProfileInput()))).toBe(33_792);
    expect(() => createVoxelTechnicalProfile({
      ...technicalProfileInput(),
      brickCount: 1_000,
      logicalVoxelCapacity: 1_000 * PVOX_BRICK_EDGE_VOXELS ** 3,
      encodedSurfaceSampleCount: 1,
    })).toThrow(/byte|artifact|brick/i);
    expect(() => createVoxelTechnicalProfile({
      ...technicalProfileInput(),
      logicalVoxelCapacity: 1,
    })).toThrow(/logical|voxel|brick/i);
    expect(() => createVoxelTechnicalProfile({
      ...technicalProfileInput(),
      artifactByteLength: 2 * PVOX_PAGE_SIZE_BYTES,
    })).toThrow(/pageCount|page size|artifact/i);
    expect(() => createVoxelTechnicalProfile({
      ...technicalProfileInput(),
      hierarchyNodeCount: PVOX_MAX_HIERARCHY_NODES,
      brickCount: 1,
      logicalVoxelCapacity: PVOX_BRICK_EDGE_VOXELS ** 3,
      encodedSurfaceSampleCount: 1,
    })).toThrow(/hierarchy|node|artifact|byte/i);
    expect(() => createVoxelTechnicalProfile({
      ...technicalProfileInput(),
      artifactByteLength: 2 * PVOX_PAGE_SIZE_BYTES,
      pageCount: 2,
      brickCount: 16,
      logicalVoxelCapacity: 16 * PVOX_BRICK_EDGE_VOXELS ** 3,
      encodedSurfaceSampleCount: 8_100,
    })).toThrow(/sample|artifact|byte/i);
    expect(() => createVoxelTechnicalProfile({
      ...technicalProfileInput(),
      surfacePropertyCount: PVOX_DEFAULT_LIMITS.maximumSurfaceProperties,
      brickCount: 1,
      logicalVoxelCapacity: PVOX_BRICK_EDGE_VOXELS ** 3,
      encodedSurfaceSampleCount: 1,
    })).toThrow(/surface|propert|artifact|byte/i);
    expect(() => createModelProcessingManifestV2({
      ...processingManifestInput(),
      technicalProfile: {
        ...processingTechnicalProfileInput(),
        hierarchyDepth: 7,
        levelSpanRecordCount: 8,
      },
    })).toThrow(/partition|extent|cell|hierarchy/i);
  });
});

describe("capability, physical, fidelity, and edit evidence", () => {
  it("normalizes capability and physical-property evidence", () => {
    const capability = createVoxelCapabilityAssessment(capabilityInputs()[0]);
    const physical = createPhysicalPropertyEvidence(physicalPropertyInputs()[0]);
    expect(capability.status).toBe("supported");
    expect(physical.property).toBe("density");
    expect(Object.isFrozen(capability.reasonCodes)).toBe(true);
  });

  it("requires reasons for unavailable capabilities and review for inferred properties", () => {
    expect(() => createVoxelCapabilityAssessment({
      ...capabilityInputs()[0],
      status: "unsupported",
      reasonCodes: [],
    })).toThrow(/reason/i);
    expect(() => createPhysicalPropertyEvidence({
      ...physicalPropertyInputs()[0],
      provenance: "inferred",
      confidence: 0.9,
    })).toThrow(/review/i);
    expect(createPhysicalPropertyEvidence({
      ...physicalPropertyInputs()[0],
      provenance: "inferred",
      confidence: 0.9,
      reviewedBy: "material-reviewer",
      reviewedAt: timestamp,
      reviewToken: token("m"),
    }).reviewedBy).toBe("material-reviewer");
    expect(() => createPhysicalPropertyEvidence({
      ...physicalPropertyInputs()[0],
      unit: "lb/ft3",
    })).toThrow(/unit|policy/i);
    expect(() => createPhysicalPropertyEvidence({
      ...physicalPropertyInputs()[0],
      value: 0,
    })).toThrow(/value|finite|number/i);
    const expansion = physicalPropertyInputs().find(({ property }) => property === "thermal-expansion")!;
    expect(createPhysicalPropertyEvidence({ ...expansion, value: -0.000001 }).value).toBe(-0.000001);
  });

  it("requires physical evidence in canonical inventory/property order", () => {
    expect(() => createModelProcessingManifestV2({
      ...processingManifestInput(),
      physicalProperties: [...physicalPropertyInputs()].reverse(),
    })).toThrow(/physical|canonical|order/i);
  });

  it.each(["density", "fracture-energy", "interior-thickness", "ignition-temperature", "melting-temperature"] as const)("rejects zero critical %s evidence", (property) => {
    const evidence = physicalPropertyInputs().find((entry) => entry.property === property)!;
    expect(() => createPhysicalPropertyEvidence({ ...evidence, value: 0 })).toThrow(/value|finite|number/i);
  });

  it("derives and enforces a non-overridable fidelity result", () => {
    expect(createPvoxFidelityEvidence(fidelityInput()).outcome).toBe("passed");
    expect(() => createPvoxFidelityEvidence({
      ...fidelityInput(),
      maximumContourDisplacementPx: 0.6,
    })).toThrow(/contour|outcome/i);
    expect(() => createPvoxFidelityEvidence({
      ...fidelityInput(),
      outcome: "blocked",
    })).toThrow(/outcome/i);
    expect(() => createPvoxFidelityEvidence({
      ...fidelityInput(),
      profileId: "caller-defined-easy-profile",
      surfaceProfileId: "caller-defined-easy-profile",
    })).toThrow(/profile/i);
    expect(() => createPvoxFidelityEvidence({
      ...fidelityInput(),
      minimumSilhouetteIou: 0,
      minimumRenderedSsim: 0,
      maximumP95DeltaE2000: 100,
      maximumNormalizedMaterialError: 1,
    })).toThrow(/governed|silhouette|threshold/i);
    expect(() => createPvoxFidelityEvidence({
      ...fidelityInput(),
      p99AllowedSurfaceErrorMetres: 1,
    })).toThrow(/formula|p99|ceiling/i);
  });

  it("requires sequential, placement-bound edit journals", () => {
    const currentState = {
      baseContentHash: hash("a"),
      basePageSetHash: hash("e"),
      placementId: "placement-1",
      gridVersion: "grid-v1",
      revision: 4,
      rootHash: hash("a"),
      latestJournalHash: hash("9"),
      pageHashes: [{ pageIndex: 0, sha256: hash("1") }],
    };
    const journal = createPvoxEditJournal({
      journalVersion: "plasius.pvox-edit-journal/1",
      baseContentHash: hash("a"),
      basePageSetHash: hash("e"),
      placementId: "placement-1",
      gridVersion: "grid-v1",
      operationId: "operation-1",
      expectedRevision: 4,
      resultingRevision: 5,
      previousJournalHash: hash("9"),
      expectedRootHash: hash("a"),
      resultingRootHash: hash("b"),
      resultingRootHashAttestation: hashAttestation(PVOX_HASH_DOMAINS.editOverlayRoot, hash("b"), "o"),
      patches: [{
        fieldKind: "render-field",
        lodLevel: 0,
        partitionIndex: 0,
        hierarchyDepth: 8,
        mortonCode: "0000000000000001",
        expectedPageIndex: 0,
        expectedPageHash: hash("1"),
        operation: "replace",
        expectedBrickHash: hash("2"),
        resultingBrickHash: hash("3"),
        resultingPageHash: hash("4"),
      }],
      dirtyBoundsMetres: bounds,
      massDeltaKg: -2.5,
      journalHash: hash("1"),
      journalHashAttestation: hashAttestation(PVOX_HASH_DOMAINS.editJournal, hash("1"), "j"),
      recordedAt: timestamp,
    }, pvoxManifestInput(), currentState);
    expect(journal.resultingRevision).toBe(5);
    expect(() => createPvoxEditJournal({ ...journal, resultingRevision: 6 }, pvoxManifestInput(), currentState)).toThrow(/sequential|revision/i);
    expect(() => createPvoxEditJournal({ ...journal, placementId: "https://evil.example" }, pvoxManifestInput(), currentState)).toThrow(/placementId/i);
    expect(() => createPvoxEditJournal({
      ...journal,
      patches: journal.patches.map((patch) => ({ ...patch, expectedPageHash: patch.resultingPageHash })),
    }, pvoxManifestInput(), currentState)).toThrow(/page hash|copy-on-write|current|CAS/i);
    expect(() => createPvoxEditJournal({
      ...journal,
      patches: [
        journal.patches[0],
        {
          ...journal.patches[0],
          mortonCode: "0000000000000002",
          expectedBrickHash: hash("5"),
          resultingBrickHash: hash("6"),
          resultingPageHash: hash("7"),
        },
      ],
    }, pvoxManifestInput(), currentState)).toThrow(/one patch|page|conflict/i);
    expect(() => createPvoxEditJournal({ ...journal, journalHash: hash("8") }, pvoxManifestInput(), currentState)).toThrow(/journalHash|preimage|binding/i);

    const genesis = createPvoxEditJournal({
      ...journal,
      operationId: "operation-genesis",
      expectedRevision: 0,
      resultingRevision: 1,
      previousJournalHash: PVOX_EDIT_JOURNAL_GENESIS_HASH,
      expectedRootHash: hash("c"),
      resultingRootHash: hash("b"),
      resultingRootHashAttestation: hashAttestation(PVOX_HASH_DOMAINS.editOverlayRoot, hash("b"), "o"),
      patches: journal.patches.map((patch) => ({ ...patch, expectedPageHash: hash("b") })),
      journalHash: hash("5"),
      journalHashAttestation: hashAttestation(PVOX_HASH_DOMAINS.editJournal, hash("5"), "j"),
    }, pvoxManifestInput());
    const nextInput = {
      ...journal,
      operationId: "operation-next",
      expectedRevision: 1,
      resultingRevision: 2,
      previousJournalHash: hash("5"),
      expectedRootHash: hash("b"),
      resultingRootHash: hash("c"),
      resultingRootHashAttestation: hashAttestation(PVOX_HASH_DOMAINS.editOverlayRoot, hash("c"), "o"),
      patches: journal.patches.map((patch) => ({ ...patch, expectedPageHash: hash("4"), resultingPageHash: hash("5") })),
      journalHash: hash("6"),
      journalHashAttestation: hashAttestation(PVOX_HASH_DOMAINS.editJournal, hash("6"), "j"),
      recordedAt: laterTimestamp,
    };
    const next = createPvoxEditJournal(nextInput, pvoxManifestInput(), {
      baseContentHash: genesis.baseContentHash,
      basePageSetHash: genesis.basePageSetHash,
      placementId: genesis.placementId,
      gridVersion: genesis.gridVersion,
      revision: genesis.resultingRevision,
      rootHash: genesis.resultingRootHash,
      latestJournalHash: genesis.journalHash,
      pageHashes: [{ pageIndex: 0, sha256: hash("4") }],
    });
    expect(createPvoxEditJournalChain([genesis, next], pvoxManifestInput())).toHaveLength(2);
    expect(() => createPvoxEditJournalChain([genesis, { ...next, previousJournalHash: hash("7") }], pvoxManifestInput())).toThrow(/chain|previous|current|state/i);
    expect(() => createPvoxEditJournal({ ...genesis, previousJournalHash: hash("1") }, pvoxManifestInput())).toThrow(/genesis/i);
    expect(() => createPvoxEditJournal({
      ...genesis,
      expectedRootHash: hash("d"),
    }, pvoxManifestInput())).toThrow(/genesis|base|root/i);
    expect(() => createPvoxEditJournal({
      ...genesis,
      patches: genesis.patches.map((patch) => ({
        ...patch,
        operation: "insert",
        expectedBrickHash: PVOX_EDIT_JOURNAL_GENESIS_HASH,
        resultingBrickHash: PVOX_EDIT_JOURNAL_GENESIS_HASH,
      })),
    }, pvoxManifestInput())).toThrow(/insert|empty|result/i);
    expect(() => createPvoxEditJournal({
      ...genesis,
      patches: genesis.patches.map((patch) => ({
        ...patch,
        operation: "remove",
        expectedBrickHash: PVOX_EDIT_JOURNAL_GENESIS_HASH,
        resultingBrickHash: PVOX_EDIT_JOURNAL_GENESIS_HASH,
      })),
    }, pvoxManifestInput())).toThrow(/remove|empty|expected/i);
    expect(() => createPvoxEditJournal(next, pvoxManifestInput())).toThrow(/current|state|non-genesis/i);
  });

  it("validates immutable hard-gate evidence", () => {
    expect(createPvoxGateEvidence(gateInputs()[0]).outcome).toBe("passed");
    expect(() => createPvoxGateEvidence({
      ...gateInputs()[0],
      outcome: "blocked",
      reasonCodes: [],
    })).toThrow(/reason/i);
  });
});

describe("PVOX processing, confirmation, and durable resolution", () => {
  it("builds a PVOX-only processing manifest with complete gates", () => {
    const manifest = createModelProcessingManifestV2(processingManifestInput());
    expect(manifest.representation).toBe("pvox");
    expect(manifest.pvox.artifact.sha256).toBe(manifest.contentHash);
    expect(manifest.capabilities).toHaveLength(PVOX_CAPABILITIES.length);
    expect(Object.isFrozen(manifest.physicalProperties)).toBe(true);
  });

  it("accounts for render bricks across every retained spatial LOD", () => {
    const lod1Page = {
      ...page(),
      pageIndex: 4,
      byteOffset: 4 * PVOX_PAGE_SIZE_BYTES,
      sha256: hash("4"),
      spatialKey: {
        ...page().spatialKey,
        lodLevel: 1 as const,
      },
    };
    const lod1 = {
      ...lod(),
      level: 1 as const,
      firstPageIndex: 4,
      brickCount: 8,
      cellSizeMetres: 0.002,
      maximumSurfaceErrorMetres: 0.0008,
      p99SurfaceErrorMetres: 0.0004,
    };
    const pvox = {
      ...processingPvoxManifestInput(),
      artifact: { ...artifact(), byteLength: 5 * PVOX_PAGE_SIZE_BYTES },
      pages: [...processingPages(), lod1Page],
      lods: [{ ...lod(), firstPageIndex: 2 }, lod1],
    };
    const staleLod0OnlyTechnicalProfile = {
      ...processingTechnicalProfileInput(),
      artifactByteLength: 5 * PVOX_PAGE_SIZE_BYTES,
      pageCount: 5,
      lodCount: 2,
    };
    expect(() => createModelProcessingManifestV2({
      ...processingManifestInput(),
      pvox,
      technicalProfile: staleLod0OnlyTechnicalProfile,
    })).toThrow(/brick|technicalProfile|artifact/i);

    const manifest = createModelProcessingManifestV2({
      ...processingManifestInput(),
      pvox,
      technicalProfile: {
        ...staleLod0OnlyTechnicalProfile,
        brickCount: 24,
        logicalVoxelCapacity: 24 * PVOX_BRICK_EDGE_VOXELS ** 3,
      },
    });
    expect(manifest.technicalProfile.brickCount).toBe(24);
  });

  it("requires domain-separated inventory, assembly, render, and evaluation attestations", () => {
    expect(() => createModelProcessingManifestV2({
      ...processingManifestInput(),
      physicalRegionInventory: {
        ...physicalRegionInventoryInput(),
        inventoryHashAttestation: hashAttestation(PVOX_HASH_DOMAINS.physicalInventory, hash("3"), "i"),
      },
    })).toThrow(/inventoryHashAttestation|digest|hash/i);
    expect(() => createModelProcessingManifestV2({
      ...processingManifestInput(),
      assemblyClosureAttestation: undefined,
    })).toThrow(/assemblyClosureAttestation|attestation|object/i);
    expect(() => createModelCandidateV2({
      ...candidateInput(),
      renderEvidence: {
        ...renderEvidenceInput(),
        evidenceHashAttestation: hashAttestation(PVOX_HASH_DOMAINS.renderEvidence, hash("1"), "v"),
      },
    })).toThrow(/render|attestation|digest|hash/i);
    expect(() => createModelCandidateV2({
      ...candidateInput(),
      evaluationClosureHash: hash("2"),
    })).toThrow(/evaluationClosure|attestation|digest|hash/i);
  });

  it.each([
    ["missing capability", { capabilities: capabilityInputs().slice(1) }, /capabilit/i],
    ["mismatched output", { contentHash: hash("b") }, /contentHash/i],
    ["non-PVOX converter output", { converter: { ...converterInput(), outputContentHash: hash("b") } }, /outputContentHash/i],
    ["wrong resolution namespace", { resolutionId: "resolution-2" }, /namespace|resolution/i],
    ["unbound fidelity subject", { fidelity: { ...fidelityInput(), pvoxBinaryClosureHash: hash("1") } }, /fidelity|closure/i],
    ["unbound physical subject", {
      physicalProperties: physicalPropertyInputs().map((entry) => ({ ...entry, subjectContentHash: hash("1") })),
    }, /physical|subject|closure/i],
    ["unknown representation", { representation: "glb" }, /representation/i],
    ["unbound compilation input", { compilationInputHash: hash("1") }, /compilation|header|hash/i],
    ["unbound runtime profile", { runtimeRequestProfileHash: hash("1") }, /runtime request|profile|hash/i],
  ])("rejects %s", (_name, change, pattern) => {
    expect(() => createModelProcessingManifestV2({ ...processingManifestInput(), ...change })).toThrow(pattern);
  });

  it("enforces complete, high-confidence physical evidence for every supported material region", () => {
    const values = physicalPropertyInputs();
    expect(() => createModelProcessingManifestV2({
      ...processingManifestInput(),
      technicalProfile: {
        ...processingTechnicalProfileInput(),
        physicalEvidenceRecordCount: 18,
      },
      physicalProperties: values.filter(({ property }) => property !== "ignition-temperature"),
    })).toThrow(/ignition-temperature|thermal/i);
    expect(() => createModelProcessingManifestV2({
      ...processingManifestInput(),
      physicalProperties: values.map((entry) => entry.property === "moisture-response" ? { ...entry, confidence: 0.79 } : entry),
    })).toThrow(/confidence|moisture-response/i);
    expect(() => createModelProcessingManifestV2({
      ...processingManifestInput(),
      physicalProperties: values.map((entry) => entry.property === "melting-temperature" ? { ...entry, provenance: "default" } : entry),
    })).toThrow(/default|melting-temperature/i);

    const secondRegion = values.map((entry, index) => ({
      ...entry,
      regionId: "region-metal-inlay",
      materialId: "brass",
      evidenceHash: hash("fedcba9876543210abc"[index]!),
    }));
    expect(createModelProcessingManifestV2({
      ...processingManifestInput(),
      technicalProfile: {
        ...processingTechnicalProfileInput(),
        physicalPaletteRecordCount: 2,
        physicalEvidenceRecordCount: 38,
        materialRegionCount: 2,
      },
      physicalRegionInventory: {
        ...physicalRegionInventoryInput(),
        entries: [
          { regionIndex: 0, physicalPaletteIndex: 0, regionId: "region-wood", materialId: "oak" },
          { regionIndex: 1, physicalPaletteIndex: 1, regionId: "region-metal-inlay", materialId: "brass" },
        ],
      },
      physicalProperties: [...values, ...secondRegion],
    }).physicalProperties).toHaveLength(38);
    expect(() => createModelProcessingManifestV2({
      ...processingManifestInput(),
      physicalProperties: values.map((entry, index) => index === values.length - 1 ? values[0] : entry),
    })).toThrow(/unique|region|material/i);
    expect(() => createModelProcessingManifestV2({
      ...processingManifestInput(),
      technicalProfile: {
        ...processingTechnicalProfileInput(),
        physicalPaletteRecordCount: 2,
        physicalEvidenceRecordCount: 38,
        materialRegionCount: 2,
      },
      physicalRegionInventory: {
        inventoryVersion: "plasius.pvox-physical-region-inventory/1",
        subjectContentHash: hash("f"),
        inventoryHash: hash("2"),
        inventoryHashAttestation: hashAttestation(PVOX_HASH_DOMAINS.physicalInventory, hash("2"), "i"),
        validationEvidenceHash: hash("9"),
        entries: [
          { regionIndex: 0, physicalPaletteIndex: 0, regionId: "region-wood", materialId: "oak" },
          { regionIndex: 1, physicalPaletteIndex: 1, regionId: "region-metal-inlay", materialId: "brass" },
        ],
      },
      physicalProperties: values,
    })).toThrow(/authoritative|inventory.*evidence|material region/i);
  });

  it("requires a non-empty reviewed bond graph for supported destruction", () => {
    expect(() => createModelProcessingManifestV2({
      ...processingManifestInput(),
      pvox: {
        ...processingPvoxManifestInput(),
        sectionCount: 18,
      },
      technicalProfile: {
        ...processingTechnicalProfileInput(),
        sectionCount: 18,
        bondRecordCount: 0,
      },
      bondGraphEvidence: reviewedStructuralEvidence("bond-graph", 0, hash("8")),
    })).toThrow(/destruction|bond/i);
  });

  it("cross-binds governed fidelity facts to the exact PVOX LOD0 record", () => {
    expect(() => createModelProcessingManifestV2({
      ...processingManifestInput(),
      pvox: {
        ...processingPvoxManifestInput(),
        lods: [{ ...processingPvoxManifestInput().lods[0], maximumSurfaceErrorMetres: 0.0003 }],
      },
    })).toThrow(/fidelity|LOD0|surface.*error/i);
  });

  it("requires a canonical single-root PVOX child graph and immutable child closure evidence", () => {
    const child = (instanceId: string, parentInstanceId?: string) => ({
      instanceId,
      ...(parentInstanceId === undefined ? {} : { parentInstanceId }),
      assetRef: {
        disposition: "staged-derived" as const,
        representation: "pvox" as const,
        derivedId: `derived-${instanceId}`,
        kind: "leaf" as const,
        contentHash: hash(instanceId === "a-root" ? "1" : "2"),
        binaryClosureHash: hash(instanceId === "a-root" ? "3" : "4"),
        processingClosureHash: hash(instanceId === "a-root" ? "5" : "6"),
        processingManifestId: `manifest-${instanceId}`,
        processingManifestUri: `mcp://models/resolutions/resolution-1/candidates/candidate-1/derived/derived-${instanceId}/processing-manifest`,
      },
      transform: {
        translationMetres: [0, 0, 0],
        rotationQuaternion: [0, 0, 0, 1],
        scale: [1, 1, 1],
      },
    });
    const children = [child("a-root"), child("b-child", "a-root")];
    const assembly = {
      ...processingManifestInput(),
      kind: "assembly" as const,
      assemblyClosureHash: hash("0"),
      assemblyClosureAttestation: hashAttestation(PVOX_HASH_DOMAINS.assemblyClosure, hash("0"), "a"),
      technicalProfile: { ...processingTechnicalProfileInput(), partitionCount: 2 },
      children,
    };
    expect(createModelProcessingManifestV2(assembly).assemblyClosureHash).toBe(hash("0"));
    expect(() => createModelProcessingManifestV2({ ...assembly, children: [...children].reverse() })).toThrow(/ordered|instanceId/i);
    expect(() => createModelProcessingManifestV2({ ...assembly, children: [child("a-root"), child("b-child")] })).toThrow(/root/i);
    expect(() => createModelProcessingManifestV2({
      ...assembly,
      children: [
        { ...child("a-root"), assetRef: { ...child("a-root").assetRef, representation: "glb" } },
        child("b-child", "a-root"),
      ],
    })).toThrow(/PVOX|representation/i);
  });

  it("creates a confirmable high-assurance candidate bound to every immutable subject", () => {
    const candidate = createModelCandidateV2(candidateInput());
    if (candidate.admissionStatus !== "confirmable") throw new Error("expected confirmable fixture");
    expect(candidate.confirmationBinding.pvoxPageSetHash).toBe(hash("e"));
    expect(isModelCandidateV2Confirmable(candidate)).toBe(true);
    expect(Object.isFrozen(candidate)).toBe(true);
  });

  it("selects an existing catalog asset only when the same immutable version proves PVOX representation", () => {
    const existing = {
      ...candidateInput(),
      assetRef: {
        disposition: "existing" as const,
        kind: "leaf" as const,
        contentHash: hash("a"),
        asset: finalAssetRefInput(),
      },
      processingManifest: {
        ...processingManifestInput(),
        pvox: {
          ...processingPvoxManifestInput(),
          artifact: {
            ...processingPvoxManifestInput().artifact,
            uri: `mcp://models/catalog/oak-table/versions/1.0.0/artifacts/sha256/${hash("a")}.pvox`,
          },
        },
      },
      confirmationBinding: {
        ...confirmationBindingInput(),
        candidateAssetRef: {
          disposition: "existing" as const,
          kind: "leaf" as const,
          contentHash: hash("a"),
          asset: finalAssetRefInput(),
        },
      },
    };
    expect(createModelCandidateV2(existing).assetRef.disposition).toBe("existing");
    expect(() => createModelCandidateV2({
      ...existing,
      processingManifest: {
        ...existing.processingManifest,
        pvox: {
          ...existing.processingManifest.pvox,
          artifact: {
            ...artifact(),
            uri: `mcp://models/catalog/oak-table/versions/2.0.0/artifacts/sha256/${hash("a")}.pvox`,
          },
        },
      },
    })).toThrow(/catalog|version|PVOX/i);
    expect(() => createModelCandidateV2({
      ...existing,
      processingManifest: processingManifestInput(),
    })).toThrow(/catalog|PVOX|existing/i);
  });

  it.each([
    ["source hash", { confirmationBinding: { ...confirmationBindingInput(), sourceContentHash: hash("1") } }, /sourceContentHash/i],
    ["request", { confirmationBinding: { ...confirmationBindingInput(), request: { ...request(), revision: 2 } } }, /request/i],
    ["view hash", { confirmationBinding: { ...confirmationBindingInput(), viewSha256s: [hash("0"), ...viewHashes.slice(1)] } }, /view/i],
    ["renderer evidence", { confirmationBinding: { ...confirmationBindingInput(), rendererEvidenceHash: hash("1") } }, /rendererEvidenceHash/i],
    ["compilation input", { confirmationBinding: { ...confirmationBindingInput(), compilationInputHash: hash("1") } }, /compilationInputHash/i],
    ["runtime request profile", { confirmationBinding: { ...confirmationBindingInput(), runtimeRequestProfileHash: hash("1") } }, /runtimeRequestProfileHash/i],
    ["missing hard gate", { hardGates: gateInputs().slice(1) }, /hard.?gate|dense/i],
    ["blocked hard gate declared confirmable", { hardGates: gateInputs().map((entry, index) => index === 0 ? { ...entry, outcome: "blocked", reasonCodes: ["blocked"] } : entry) }, /admission|confirmable|blocked/i],
    ["blocked rights declared confirmable", { rights: { ...candidateInput().rights, status: "blocked" } }, /admission|rights|confirmable/i],
  ])("rejects a candidate with transplanted or overridable %s evidence", (_name, change, pattern) => {
    expect(() => createModelCandidateV2({ ...candidateInput(), ...change })).toThrow(pattern);
  });

  it("retains a reasoned diagnostic candidate while withholding every confirmation credential", () => {
    const candidate = createModelCandidateV2(diagnosticCandidateInput());
    if (candidate.admissionStatus !== "diagnostic") throw new Error("expected diagnostic fixture");
    expect(candidate.admissionStatus).toBe("diagnostic");
    expect(candidate.confirmationRequired).toBe(false);
    expect(candidate.blockingReasonCodes).toContain("fidelity-validation:contour-displacement-exceeded");
    expect(isModelCandidateV2Confirmable(candidate)).toBe(false);
    expect("confirmationToken" in candidate).toBe(false);
    expect("confirmationBinding" in candidate).toBe(false);
    expect(() => createModelCandidateConfirmationV2({
      contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
    }, candidate, "resolution-1")).toThrow(/confirmable|diagnostic/i);
  });

  it.each([
    ["source-format-validation", hash("1")],
    ["pvox-validation", hash("1")],
    ["fidelity-validation", hash("1")],
    ["physical-property-validation", hash("1")],
    ["renderer-validation", hash("1")],
  ] as const)("cross-binds %s to its concrete evidence hash", (kind, evidenceHash) => {
    expect(() => createModelCandidateV2({
      ...candidateInput(),
      hardGates: gateInputs().map((gate) => gate.kind === kind ? { ...gate, evidenceHash } : gate),
    })).toThrow(/evidence|gate/i);
  });

  it("binds the exact v2 request profiles, geometry, capabilities, and runtime budgets", () => {
    const valid = candidateInput();
    expect(() => createModelCandidateV2({
      ...valid,
      request: {
        ...request(),
        pvoxRuntimeProfile: {
          ...request().pvoxRuntimeProfile,
          fidelityProfileId: "rocks-organic-shells-v1",
        },
      },
    })).toThrow(/fidelity|request/i);
    expect(() => createModelCandidateV2({
      ...valid,
      request: {
        ...request(),
        pvoxRuntimeProfile: {
          ...request().pvoxRuntimeProfile,
          geometryMode: "shell",
        },
      },
    })).toThrow(/geometry|semantic|request/i);
    expect(() => createModelCandidateV2({
      ...valid,
      request: (() => {
        const changedRequest = {
        ...request(),
        pvoxRuntimeProfile: {
          ...request().pvoxRuntimeProfile,
          limits: { ...request().pvoxRuntimeProfile.limits, maximumGpuResidentBytes: 1 },
        },
        };
        return changedRequest;
      })(),
      match: {
        ...valid.match,
        requestSemanticProfileCanonical: canonicalizeModelRequestSemanticProfileV1({
          ...request(),
          pvoxRuntimeProfile: {
            ...request().pvoxRuntimeProfile,
            limits: { ...request().pvoxRuntimeProfile.limits, maximumGpuResidentBytes: 1 },
          },
        }),
      },
    })).toThrow(/gpu|runtime|limit/i);
    expect(() => createModelCandidateV2({
      ...valid,
      request: (() => {
        const changedRequest = {
        ...request(),
        pvoxRuntimeProfile: {
          ...request().pvoxRuntimeProfile,
          limits: { ...request().pvoxRuntimeProfile.limits, maximumHierarchyNodes: 16 },
        },
        };
        return changedRequest;
      })(),
      match: {
        ...valid.match,
        requestSemanticProfileCanonical: canonicalizeModelRequestSemanticProfileV1({
          ...request(),
          pvoxRuntimeProfile: {
            ...request().pvoxRuntimeProfile,
            limits: { ...request().pvoxRuntimeProfile.limits, maximumHierarchyNodes: 16 },
          },
        }),
      },
    })).toThrow(/hierarchy|runtime|limit/i);
    expect(() => createModelCandidateV2({
      ...valid,
      processingManifest: {
        ...processingManifestInput(),
        requiredCapabilities: ["rendering", "collision", "destruction"],
      },
    })).toThrow(/requiredCapabilities|request/i);
  });

  it("rejects semantic assessment and closure transplantation across a changed request", () => {
    const valid = candidateInput();
    const changedRequest = {
      ...request(),
      softPreferences: { ...request().softPreferences, style: "baroque" },
      exclusions: [...request().exclusions, "brass"],
    };
    expect(() => createModelCandidateV2({
      ...valid,
      request: changedRequest,
      confirmationBinding: {
        ...confirmationBindingInput(),
        request: changedRequest,
      },
    })).toThrow(/semantic|profile.*hash|assessment.*request/i);

    const transplantedClosure = hash("1");
    expect(() => createModelCandidateV2({
      ...valid,
      processingManifest: {
        ...processingManifestInput(),
        processingClosureHash: transplantedClosure,
      },
      confirmationBinding: {
        ...confirmationBindingInput(),
        processingClosureHash: transplantedClosure,
      },
    })).toThrow(/processingClosureHash|preimage|binding|attestation/i);
    expect(() => createModelCandidateV2({
      ...valid,
      confirmationBinding: {
        ...confirmationBindingInput(),
        bindingHash: hash("8"),
      },
    })).toThrow(/bindingHash|preimage|attestation/i);
  });

  it("binds semantic, rights, provenance, and renderer evidence into confirmation", () => {
    const valid = candidateInput();
    expect(() => createModelCandidateV2({
      ...valid,
      match: { ...valid.match, evidenceHash: hash("8") },
    })).toThrow(/match|semantic|confirmation|evidence/i);
    expect(() => createModelCandidateV2({
      ...valid,
      rights: { ...valid.rights, licenseId: "commercial-custom" },
    })).toThrow(/rights|confirmation|binding/i);
    expect(() => createModelCandidateV2({
      ...valid,
      provenance: { ...valid.provenance, sourceAssetId: "kenney-chair-other" },
      rights: { ...valid.rights, sourceAssetId: "kenney-chair-other" },
    })).toThrow(/provenance|source|confirmation|binding/i);
    expect(() => createModelCandidateV2({
      ...valid,
      renderEvidence: { ...valid.renderEvidence, rendererQualificationHash: hash("8") },
    })).toThrow(/render|qualification|attestation|confirmation/i);
  });

  it("requires immutable ranker, calibration, rights, renderer, and camera evidence versions", () => {
    expect(() => createModelCandidateV2({
      ...candidateInput(),
      match: { ...matchInput(), ranker: { ...matchInput().ranker, version: "latest" } },
    })).toThrow(/immutable|version/i);
    expect(() => createModelCandidateV2({
      ...candidateInput(),
      rights: { ...candidateInput().rights, policyVersion: "v1.x" },
    })).toThrow(/immutable|version/i);
    expect(() => createModelCandidateV2({
      ...candidateInput(),
      renderEvidence: { ...candidateInput().renderEvidence, traversalBackend: "mesh-bvh" },
    })).toThrow(/native|traversal|PVOX/i);
  });

  it("requires only the semantic-risk override for a low-assurance candidate", () => {
    const candidate = createModelCandidateV2(candidateInput("low"));
    expect(() => createModelCandidateConfirmationV2({
      contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
      confirmationId: "confirmation-1",
      resolutionId: "resolution-1",
      requesterId: "requester-subject",
      candidateId: "candidate-1",
      confirmationToken: token("c"),
      confirmationBindingHash: hash("9"),
      viewSha256s: viewHashes,
      confirmedBy: "requester-subject",
      confirmedAt: laterTimestamp,
      semanticRiskAccepted: false,
    }, candidate, "resolution-1")).toThrow(/semantic/i);

    const confirmation = createModelCandidateConfirmationV2({
      contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
      confirmationId: "confirmation-1",
      resolutionId: "resolution-1",
      requesterId: "requester-subject",
      candidateId: "candidate-1",
      confirmationToken: token("c"),
      confirmationBindingHash: hash("9"),
      viewSha256s: viewHashes,
      confirmedBy: "requester-subject",
      confirmedAt: laterTimestamp,
      semanticRiskAccepted: true,
    }, candidate, "resolution-1");
    expect(confirmation.semanticRiskAccepted).toBe(true);
  });

  it("forbids semantic override for high assurance and transplanted bindings", () => {
    const candidate = createModelCandidateV2(candidateInput());
    const base = {
      contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
      confirmationId: "confirmation-1",
      resolutionId: "resolution-1",
      requesterId: "requester-subject",
      candidateId: "candidate-1",
      confirmationToken: token("c"),
      confirmationBindingHash: hash("9"),
      viewSha256s: viewHashes,
      confirmedBy: "requester-subject",
      confirmedAt: laterTimestamp,
      semanticRiskAccepted: false,
    };
    expect(() => createModelCandidateConfirmationV2({ ...base, semanticRiskAccepted: true }, candidate, "resolution-1")).toThrow(/semantic/i);
    expect(() => createModelCandidateConfirmationV2({ ...base, confirmationBindingHash: hash("1") }, candidate, "resolution-1")).toThrow(/binding/i);
    expect(() => createModelCandidateConfirmationV2({ ...base, confirmedAt: "2026-08-20T11:59:00.000Z" }, candidate, "resolution-1")).toThrow(/evidence/i);
  });

  it("validates new durable states and derives their legacy compatibility state", () => {
    const candidate = createModelCandidateV2(candidateInput());
    const resolution = createModelResolutionV2({
      contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
      resolutionId: "resolution-1",
      requesterId: "requester-subject",
      request: request(),
      attempts: 1,
      state: "awaiting-confirmation",
      candidates: [candidate],
      bestCandidate: candidate,
      refinementQuestions: [],
      createdAt: timestamp,
      updatedAt: laterTimestamp,
    });
    expect(resolution.compatibilityState).toBe("awaiting-confirmation");

    const inFlight = createModelResolutionV2({
      contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
      resolutionId: "resolution-2",
      requesterId: "requester-subject",
      request: request(),
      attempts: 1,
      state: "voxelizing",
      candidates: [],
      refinementQuestions: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    expect(inFlight.compatibilityState).toBe("processing");
  });

  it("does not persist confirmation after the resolution snapshot timestamp", () => {
    const candidate = createModelCandidateV2(candidateInput());
    const confirmation = createModelCandidateConfirmationV2(confirmationInput(), candidate, "resolution-1");
    expect(() => createModelResolutionV2({
      contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
      resolutionId: "resolution-1",
      requesterId: "requester-subject",
      request: request(),
      attempts: 1,
      state: "promoting",
      candidates: [candidate],
      bestCandidate: candidate,
      confirmation,
      refinementQuestions: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    })).toThrow(/confirmation|confirmedAt|updatedAt/i);
  });

  it("rejects request-profile transplantation and sparse durable arrays", () => {
    const candidate = createModelCandidateV2(candidateInput());
    expect(() => createModelResolutionV2({
      contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
      resolutionId: "resolution-1",
      requesterId: "requester-subject",
      request: {
        ...request(),
        pvoxRuntimeProfile: {
          ...request().pvoxRuntimeProfile,
          limits: { ...request().pvoxRuntimeProfile.limits, maximumCpuResidentBytes: 90_000 },
        },
      },
      attempts: 1,
      state: "awaiting-confirmation",
      candidates: [candidate],
      bestCandidate: candidate,
      refinementQuestions: [],
      createdAt: timestamp,
      updatedAt: laterTimestamp,
    })).toThrow(/request|profile|candidate/i);
    expect(() => createModelResolutionV2({
      contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
      resolutionId: "resolution-1",
      requesterId: "requester-subject",
      request: request(),
      attempts: 1,
      state: "searching-catalog",
      candidates: new Array(1),
      refinementQuestions: [],
      createdAt: timestamp,
      updatedAt: laterTimestamp,
    })).toThrow(/dense|candidate|array/i);
    expect(() => createModelCandidateV2({
      ...candidateInput(),
      match: { ...matchInput(), reasonCodes: new Array(1) },
    })).toThrow(/dense|data|array/i);
  });

  it("uses stable refinement question IDs for diagnostic or unresolved outcomes", () => {
    const diagnostic = createModelCandidateV2(diagnosticCandidateInput());
    const base = {
      contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
      resolutionId: "resolution-1",
      requesterId: "requester-subject",
      request: request(),
      attempts: 2,
      state: "unresolved" as const,
      candidates: [diagnostic],
      bestCandidate: diagnostic,
      refinementQuestions: [{
        questionId: "thin-feature-priority",
        prompt: "Should thin contour fidelity take priority over storage size?",
        reasonCodes: ["contour-displacement-exceeded"],
      }],
      stateReasonCode: "fidelity-profile-not-met",
      createdAt: timestamp,
      updatedAt: laterTimestamp,
    };
    expect(createModelResolutionV2(base).refinementQuestions[0]?.questionId).toBe("thin-feature-priority");
    expect(() => createModelResolutionV2({
      ...base,
      refinementQuestions: [base.refinementQuestions[0], base.refinementQuestions[0]],
    })).toThrow(/question|unique/i);
  });

  it("requires a pointer-last PVOX publication receipt for completed staged promotion", () => {
    const candidate = createModelCandidateV2(candidateInput());
    const confirmation = createModelCandidateConfirmationV2(confirmationInput(), candidate, "resolution-1");
    const completed = createModelResolutionV2({
      contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
      resolutionId: "resolution-1",
      requesterId: "requester-subject",
      request: request(),
      attempts: 1,
      state: "completed",
      candidates: [candidate],
      bestCandidate: candidate,
      confirmation,
      promotionReceipt: promotionReceiptInput(),
      refinementQuestions: [],
      finalAssetRef: finalAssetRefInput(),
      createdAt: timestamp,
      updatedAt: completedTimestamp,
    });
    expect(completed.promotionReceipt?.publicationState).toBe("pointer-last-complete");
    expect(completed.promotionReceipt?.indexSnapshotHash).toBe(hash("3"));
    expect(() => createModelResolutionV2({
      ...completed,
      promotionReceipt: undefined,
    })).toThrow(/promotionReceipt|publication/i);
    expect(() => createModelResolutionV2({
      ...completed,
      promotionReceipt: { ...promotionReceiptInput(), proposalId: "proposal-other" },
    })).toThrow(/proposal|receipt|bind/i);
    expect(() => createModelResolutionV2({
      ...completed,
      promotionReceipt: { ...promotionReceiptInput(), confirmationBindingHash: hash("8") },
    })).toThrow(/confirmation|binding|receipt/i);
    expect(() => createModelResolutionV2({
      ...completed,
      promotionReceipt: { ...promotionReceiptInput(), promotedAt: "2026-08-20T12:04:00.000Z" },
    })).toThrow(/promotedAt|updatedAt|follow|exceed/i);
  });

  it("rejects incompatible compatibility states and incomplete terminal states", () => {
    const base = {
      contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
      resolutionId: "resolution-2",
      requesterId: "requester-subject",
      request: request(),
      attempts: 1,
      state: "downloading",
      candidates: [],
      refinementQuestions: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    expect(() => createModelResolutionV2({ ...base, compatibilityState: "completed" })).toThrow(/compatibility/i);
    expect(() => createModelResolutionV2({ ...base, state: "failed" })).toThrow(/stateReasonCode/i);
    expect(() => createModelResolutionV2({ ...base, state: "completed" })).toThrow(/finalAssetRef/i);
    expect(() => createModelResolutionV2({
      ...base,
      state: "promoting",
      confirmation: {},
    })).toThrow(/confirmation requires bestCandidate/i);
  });
});
