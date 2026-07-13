/** Version identifier carried by every top-level model-resolution contract. */
export const MODEL_RESOLUTION_CONTRACT_VERSION = "2026-07-12.v1" as const;

/** Maximum request revision accepted by the v1 contract. */
export const MODEL_REQUEST_MAX_REVISION = 3 as const;

/** Assurance thresholds used by every model ranker calibration. */
export const MODEL_MATCH_ASSURANCE_THRESHOLDS = Object.freeze({
  high: 0.75,
  low: 0.5,
} as const);

/** Stable assurance bands for catalog and provider matches. */
export const MODEL_MATCH_ASSURANCE_BANDS = Object.freeze([
  "high",
  "low",
  "none",
] as const);

/** Evidence available to the ranker when it produced a match assessment. */
export const MODEL_RANKER_EVIDENCE_MODES = Object.freeze([
  "text-only",
  "vision",
  "multimodal",
  "exact-identifier",
] as const);

/** Audit reason added when a text-only ranker is capped below its raw score band. */
export const MODEL_TEXT_ONLY_ASSURANCE_CEILING_REASON_CODE = "text-only-assurance-ceiling" as const;

/** Audit reason added when another declared ranker ceiling lowers assurance. */
export const MODEL_RANKER_ASSURANCE_CEILING_REASON_CODE = "ranker-assurance-ceiling" as const;

/** Authenticated original views required before a candidate can be confirmed. */
export const MODEL_CONFIRMATION_VIEW_KINDS = Object.freeze([
  "front",
  "left",
  "top",
  "isometric",
] as const);

/** Required width and height for authenticated confirmation originals. */
export const MODEL_CONFIRMATION_VIEW_SIZE_PX = 1024 as const;

/** Exact asynchronous model-resolution states shared with orchestration packages. */
export const MODEL_RESOLUTION_STATES = Object.freeze([
  "searching-catalog",
  "searching-providers",
  "awaiting-provider-auth",
  "quarantining",
  "processing",
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

/** Canonical runtime model kinds. */
export const MODEL_ASSET_KINDS = Object.freeze(["leaf", "assembly"] as const);

/** Stable origins for catalog, provider, and future generated candidates. */
export const MODEL_PROVENANCE_KINDS = Object.freeze([
  "catalog",
  "provider",
  "generated",
] as const);

/** Fail-closed rights states used before confirmation or promotion. */
export const MODEL_RIGHTS_STATUSES = Object.freeze([
  "allowed",
  "attribution-required",
  "quarantined",
  "blocked",
] as const);

/** Canonical output coordinate system for processed models. */
export const CANONICAL_MODEL_COORDINATE_SYSTEM = Object.freeze({
  unit: "metre",
  upAxis: "Y",
  forwardAxis: "-Z",
  origin: "floor-centred",
  outwardFaceWinding: "counter-clockwise",
} as const);

/** Fail-closed v1 runtime limits; callers may only tighten these values. */
export const STATIC_WORLD_V1_MODEL_POLICY = Object.freeze({
  id: "static-world-v1",
  maxTriangles: 1_000_000,
  maxBytes: 100 * 1024 * 1024,
  maxTextureBytes: 64 * 1024 * 1024,
  maxTextureDimensionPx: 4096,
  maxPartitionCellMetres: 32,
} as const);

/** Independent attestations required before a semantic confirmation can proceed. */
export const MODEL_CANDIDATE_HARD_GATE_KINDS = Object.freeze([
  "malware-scan",
  "technical-validation",
  "human-review",
  "accessibility-review",
] as const);

/** Stable reason returned by the disabled Phase 1 generator port. */
export const MODEL_GENERATOR_DISABLED_REASON_CODE = "phase-1-generator-disabled" as const;

/** Match assurance derived from score and the independent hard-constraint gate. */
export type ModelMatchAssurance = typeof MODEL_MATCH_ASSURANCE_BANDS[number];

/** Evidence family retained with each ranker assessment. */
export type ModelRankerEvidenceMode = typeof MODEL_RANKER_EVIDENCE_MODES[number];

/** A required confirmation-view identifier. */
export type ModelConfirmationViewKind = typeof MODEL_CONFIRMATION_VIEW_KINDS[number];

/** A state in the asynchronous model-resolution lifecycle. */
export type ModelResolutionState = typeof MODEL_RESOLUTION_STATES[number];

/** Whether an immutable asset is a single leaf or a composed assembly. */
export type ModelAssetKind = typeof MODEL_ASSET_KINDS[number];

/** Where a candidate originated. */
export type ModelProvenanceKind = typeof MODEL_PROVENANCE_KINDS[number];

/** Rights eligibility applied before human confirmation. */
export type ModelRightsStatus = typeof MODEL_RIGHTS_STATUSES[number];

/** One independent non-semantic confirmation gate. */
export type ModelCandidateHardGateKind = typeof MODEL_CANDIDATE_HARD_GATE_KINDS[number];

/** Required/optional/forbidden policy for LOD or collision requirements. */
export type ModelRequirementPolicy = "required" | "optional" | "forbidden";

/** Whether runtime packaging must remain single, may partition, or must partition. */
export type ModelPartitionPolicy = "single" | "allowed" | "required";

/** A canonical three-dimensional vector. */
export type ModelVector3 = readonly [number, number, number];

/** A canonical quaternion in x/y/z/w order. */
export type ModelQuaternion = readonly [number, number, number, number];

/** Axis-aligned bounds expressed in metres. */
export interface ModelBoundsMetres {
  readonly min: ModelVector3;
  readonly max: ModelVector3;
}

/** Width, height, and depth expressed in metres. */
export interface ModelDimensionsMetres {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
}

/** Hard request constraints that must pass independently of semantic rank. */
export interface ModelHardConstraints {
  readonly boundsMetres?: ModelBoundsMetres;
  readonly dimensionsMetres?: ModelDimensionsMetres;
  readonly maxTriangles?: number;
  readonly maxBytes?: number;
  readonly maxTextureBytes?: number;
  readonly maxTextureDimensionPx?: number;
  readonly maxPartitionCellMetres?: number;
  readonly lod?: ModelRequirementPolicy;
  readonly collision?: ModelRequirementPolicy;
  readonly partition?: ModelPartitionPolicy;
}

/** Soft ranking preferences that may improve score but never bypass hard constraints. */
export interface ModelSoftPreferences {
  readonly category?: string;
  readonly style?: string;
  readonly materials?: readonly string[];
  readonly colors?: readonly string[];
  readonly era?: string;
  readonly condition?: string;
  readonly tags?: readonly string[];
}

/** Immutable normalized natural-language request for a model. */
export interface ModelRequestSpec {
  readonly contractVersion: typeof MODEL_RESOLUTION_CONTRACT_VERSION;
  readonly policyProfileId: typeof STATIC_WORLD_V1_MODEL_POLICY.id;
  readonly query: string;
  readonly revision: number;
  readonly locale?: string;
  readonly rankerId?: string;
  readonly hardConstraints: ModelHardConstraints;
  readonly softPreferences: ModelSoftPreferences;
  readonly exclusions: readonly string[];
}

/** Versioned ranker and calibration evidence attached to an assessment. */
export interface ModelRankerRef {
  readonly id: string;
  readonly version: string;
  readonly calibrationId: string;
  readonly calibrationVersion: string;
  readonly evidenceMode: ModelRankerEvidenceMode;
  readonly assuranceCeiling: ModelMatchAssurance;
}

/** Immutable model match assessment with a derived assurance band. */
export interface ModelMatchAssessment {
  readonly contractVersion: typeof MODEL_RESOLUTION_CONTRACT_VERSION;
  readonly score: number;
  readonly assurance: ModelMatchAssurance;
  readonly hardConstraintPass: boolean;
  readonly exactMatch: boolean;
  readonly reasonCodes: readonly string[];
  readonly ranker: ModelRankerRef;
  readonly fidelityWarnings: readonly string[];
  readonly request: ModelRequestSpec;
  readonly candidateId: string;
  readonly candidateContentHash: string;
}

/** Deterministic result of comparing one normalized request with one candidate. */
export interface ModelHardConstraintEvaluation {
  readonly pass: boolean;
  readonly reasonCodes: readonly string[];
}

/** Runtime facts used to evaluate request constraints. */
export interface ModelTechnicalProfile {
  readonly boundsMetres: ModelBoundsMetres;
  readonly dimensionsMetres: ModelDimensionsMetres;
  readonly triangleCount: number;
  readonly byteLength: number;
  readonly textureByteLength: number;
  readonly maxTextureDimensionPx: number;
  readonly lodCount: number;
  readonly hasCollision: boolean;
  readonly partitionCount: number;
  readonly partitionCellMetres: number;
}

/** Attribution content used by accessible model acknowledgements. */
export interface ModelAttribution {
  readonly title: string;
  readonly creator: string;
  readonly notice: string;
  readonly sourcePageUri?: string;
}

/** Fail-closed rights assessment for a candidate. */
export interface ModelRightsAssessment {
  readonly decisionId: string;
  readonly decisionToken: string;
  readonly policyId: string;
  readonly policyVersion: string;
  readonly sourceId: string;
  readonly sourceAssetId: string;
  readonly sourceContentHash: string;
  readonly status: ModelRightsStatus;
  readonly licenseId: string;
  readonly evidencePageUri: string;
  readonly attribution?: ModelAttribution;
  readonly reviewedAt: string;
}

/** Public-safe provenance without download or signed staging URLs. */
export interface ModelProvenance {
  readonly kind: ModelProvenanceKind;
  readonly sourceId: string;
  readonly sourceAssetId: string;
  readonly sourcePageUri?: string;
  readonly contentHash: string;
  readonly capturedAt: string;
}

/** Immutable promoted model reference safe for player-facing responses. */
export interface ModelAssetRef {
  readonly contractVersion: typeof MODEL_RESOLUTION_CONTRACT_VERSION;
  readonly assetId: string;
  readonly version: string;
  readonly kind: ModelAssetKind;
  readonly contentHash: string;
  readonly runtimeManifestUri: string;
}

/** Existing promoted candidate identity. */
export interface ExistingModelCandidateAssetRef {
  readonly disposition: "existing";
  readonly kind: ModelAssetKind;
  readonly contentHash: string;
  readonly asset: ModelAssetRef;
}

/** Staged proposal identity without exposing its private resource location. */
export interface ProposedModelCandidateAssetRef {
  readonly disposition: "proposed";
  readonly kind: ModelAssetKind;
  readonly contentHash: string;
  readonly proposalId: string;
}

/** Candidate identity before or after catalog promotion. */
export type ModelCandidateAssetRef =
  | ExistingModelCandidateAssetRef
  | ProposedModelCandidateAssetRef;

/** Authenticated square original used during mandatory human confirmation. */
export interface ModelConfirmationView {
  readonly kind: ModelConfirmationViewKind;
  readonly imageUri: string;
  readonly sha256: string;
  readonly contentType: "image/png";
  readonly width: typeof MODEL_CONFIRMATION_VIEW_SIZE_PX;
  readonly height: typeof MODEL_CONFIRMATION_VIEW_SIZE_PX;
}

/** Deterministic renderer/camera attestation covering the exact four-view pack. */
export interface ModelRenderEvidence {
  readonly renderId: string;
  readonly rendererId: string;
  readonly rendererVersion: string;
  readonly settingsId: string;
  readonly settingsVersion: string;
  readonly processingManifestId: string;
  readonly sourceContentHash: string;
  readonly viewSha256s: readonly [string, string, string, string];
  readonly renderedAt: string;
  readonly attestationToken: string;
}

/** Versioned, signed evidence for a non-semantic confirmation gate. */
export interface ModelCandidateHardGateEvidence {
  readonly kind: ModelCandidateHardGateKind;
  readonly outcome: "passed" | "blocked";
  readonly validatorId: string;
  readonly validatorVersion: string;
  readonly subjectContentHash: string;
  readonly reasonCodes: readonly string[];
  readonly evaluatedAt: string;
  readonly attestationToken: string;
}

/** Exact four-view confirmation tuple in canonical order. */
export type ModelConfirmationViews = readonly [
  ModelConfirmationView,
  ModelConfirmationView,
  ModelConfirmationView,
  ModelConfirmationView,
];

/** Immutable candidate returned by catalog/provider/generator resolution. */
export interface ModelCandidate {
  readonly contractVersion: typeof MODEL_RESOLUTION_CONTRACT_VERSION;
  readonly resolutionId: string;
  readonly candidateId: string;
  readonly assetRef: ModelCandidateAssetRef;
  readonly match: ModelMatchAssessment;
  readonly provenance: ModelProvenance;
  readonly rights: ModelRightsAssessment;
  readonly technicalProfile: ModelTechnicalProfile;
  readonly processingManifest: ModelProcessingManifest;
  readonly views: ModelConfirmationViews;
  readonly renderEvidence: ModelRenderEvidence;
  readonly hardGates: readonly ModelCandidateHardGateEvidence[];
  readonly confirmationToken: string;
  readonly confirmationRequired: true;
}

/** Public-safe resource reference used by processing evidence. */
export interface ModelResourceRef {
  readonly uri: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly contentType: string;
}

/** Adaptive LOD level; LOD0 is always present and up to LOD3 may follow. */
export type ModelLodLevel = 0 | 1 | 2 | 3;

/** Processed resource and triangle evidence for one LOD level. */
export interface ModelLodRecord {
  readonly level: ModelLodLevel;
  readonly resource: ModelResourceRef;
  readonly triangleCount: number;
  readonly geometricErrorMetres: number;
}

/** Collision representation emitted by processing. */
export type ModelCollisionKind =
  | "none"
  | "box"
  | "convex-hull"
  | "triangle-mesh"
  | "compound";

/** Collision evidence, with a resource for every non-empty collision kind. */
export interface ModelCollisionRecord {
  readonly kind: ModelCollisionKind;
  readonly resource?: ModelResourceRef;
}

/** Canonical transform for an assembly child. */
export interface ModelTransform {
  readonly translationMetres: ModelVector3;
  readonly rotationQuaternion: ModelQuaternion;
  readonly scale: ModelVector3;
}

/** Candidate-scoped immutable reference for a not-yet-promoted derived leaf. */
export interface StagedModelAssemblyChildRef {
  readonly disposition: "staged-derived";
  readonly derivedId: string;
  readonly kind: "leaf";
  readonly contentHash: string;
  readonly processingManifestUri: string;
}

/** Catalog or staged-derived leaf identity accepted in an assembly closure. */
export type ModelAssemblyChildAssetRef = ModelAssetRef | StagedModelAssemblyChildRef;

/** Immutable child reference, optional hierarchy parent, and local transform. */
export interface ModelAssemblyChild {
  readonly instanceId: string;
  readonly parentInstanceId?: string;
  readonly assetRef: ModelAssemblyChildAssetRef;
  readonly transform: ModelTransform;
}

/** Severity for conversion diagnostics and fidelity losses. */
export type ModelDiagnosticSeverity = "info" | "warning" | "blocking";

/** Structured diagnostic emitted by a converter. */
export interface ModelConverterDiagnostic {
  readonly severity: ModelDiagnosticSeverity;
  readonly code: string;
  readonly message: string;
}

/** Explicit semantic loss recorded during conversion. */
export interface ModelConversionLoss {
  readonly code: string;
  readonly severity: ModelDiagnosticSeverity;
  readonly message: string;
}

/** Converter identity, hashes, diagnostics, and loss evidence. */
export interface ModelConverterEvidence {
  readonly id: string;
  readonly version: string;
  readonly sourceFormat: string;
  readonly targetFormat: string;
  readonly sourceContentHash: string;
  readonly outputContentHash: string;
  readonly diagnostics: readonly ModelConverterDiagnostic[];
  readonly losses: readonly ModelConversionLoss[];
}

/** Fidelity aspect assessed after conversion. */
export type ModelFidelityAspect =
  | "geometry"
  | "materials"
  | "textures"
  | "rigging"
  | "animation"
  | "metadata";

/** Fidelity result for a converted aspect. */
export type ModelFidelityOutcome = "preserved" | "approximated" | "lost";

/** Structured fidelity evidence suitable for review. */
export interface ModelFidelityEvidence {
  readonly aspect: ModelFidelityAspect;
  readonly outcome: ModelFidelityOutcome;
  readonly message: string;
  readonly evidenceResource?: ModelResourceRef;
}

/** Signed category-policy decision requiring a collision proxy or allowing none. */
export interface ModelCollisionPolicyEvidence {
  readonly profileId: string;
  readonly profileVersion: string;
  readonly disposition: "proxy-required" | "none-allowed";
  readonly category: string;
  readonly decisionToken: string;
}

/** Signed fidelity-policy result that independently gates semantic assurance. */
export interface ModelFidelityGateEvidence {
  readonly profileId: string;
  readonly profileVersion: string;
  readonly outcome: "passed" | "low-only" | "blocked";
  readonly requiredAspects: readonly ["geometry", "materials", "textures"];
  readonly evaluatedAt: string;
  readonly decisionToken: string;
}

/** Canonical, immutable model-processing manifest. */
export interface ModelProcessingManifest {
  readonly contractVersion: typeof MODEL_RESOLUTION_CONTRACT_VERSION;
  readonly manifestId: string;
  readonly resolutionId: string;
  readonly candidateId: string;
  readonly kind: ModelAssetKind;
  readonly contentHash: string;
  readonly closureHash: string;
  readonly coordinateSystem: typeof CANONICAL_MODEL_COORDINATE_SYSTEM;
  readonly technicalProfile: ModelTechnicalProfile;
  readonly lods: readonly ModelLodRecord[];
  readonly collision: ModelCollisionRecord;
  readonly collisionPolicy: ModelCollisionPolicyEvidence;
  readonly children: readonly ModelAssemblyChild[];
  readonly converter: ModelConverterEvidence;
  readonly fidelityEvidence: readonly ModelFidelityEvidence[];
  readonly fidelityGate: ModelFidelityGateEvidence;
  readonly processedAt: string;
}

/** Immutable evidence that one requester confirmed one exact candidate render pack. */
export interface ModelCandidateConfirmation {
  readonly contractVersion: typeof MODEL_RESOLUTION_CONTRACT_VERSION;
  readonly confirmationId: string;
  readonly resolutionId: string;
  readonly candidateId: string;
  readonly confirmationToken: string;
  readonly viewSha256s: readonly [string, string, string, string];
  readonly confirmedBy: string;
  readonly confirmedAt: string;
  readonly semanticRiskAccepted: boolean;
}

/** Backend-issued receipt binding one staged proposal closure to its final catalog identity. */
export interface ModelPromotionReceipt {
  readonly contractVersion: typeof MODEL_RESOLUTION_CONTRACT_VERSION;
  readonly promotionId: string;
  readonly resolutionId: string;
  readonly candidateId: string;
  readonly proposalId: string;
  readonly confirmationId: string;
  readonly processingManifestId: string;
  readonly processingContentHash: string;
  readonly closureHash: string;
  readonly finalAssetRef: ModelAssetRef;
  readonly promotedAt: string;
  readonly publicationToken: string;
}

/** Immutable record for one asynchronous model-resolution request. */
export interface ModelResolution {
  readonly contractVersion: typeof MODEL_RESOLUTION_CONTRACT_VERSION;
  readonly resolutionId: string;
  readonly request: ModelRequestSpec;
  readonly attempts: number;
  readonly state: ModelResolutionState;
  readonly candidates: readonly ModelCandidate[];
  readonly bestCandidate?: ModelCandidate;
  readonly confirmation?: ModelCandidateConfirmation;
  readonly promotionReceipt?: ModelPromotionReceipt;
  readonly refinementQuestions: readonly string[];
  readonly finalAssetRef?: ModelAssetRef;
  readonly stateReasonCode?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Bounded compute and output budgets accepted by a generator port. */
export interface ModelGeneratorBudgets {
  readonly maxDurationMs: number;
  readonly maxTriangles: number;
  readonly maxBytes: number;
  readonly maxTextureBytes: number;
  readonly maxTextureDimensionPx: number;
}

/** Normalized request passed to a model generator implementation. */
export interface ModelGeneratorRequest {
  readonly generationId: string;
  readonly request: ModelRequestSpec;
  readonly budgets: ModelGeneratorBudgets;
  readonly seed: string;
  readonly deadline: string;
}

/** Disabled Phase 1 generator result. */
export interface DisabledModelGeneratorResult {
  readonly status: "disabled";
  readonly generationId: string;
  readonly reasonCode: typeof MODEL_GENERATOR_DISABLED_REASON_CODE;
}

/** Versioned generator identity retained with source-bundle evidence. */
export interface ModelGeneratorIdentity {
  readonly id: string;
  readonly version: string;
}

/** Bounded internal artifacts emitted for normal ingestion by an enabled generator. */
export type ModelGeneratorArtifactRole =
  | "model-entrypoint"
  | "model-dependency"
  | "binary"
  | "texture"
  | "metadata";

/** One generated artifact and its closed ingestion role. */
export interface ModelGeneratorArtifact extends ModelResourceRef {
  readonly role: ModelGeneratorArtifactRole;
  readonly textureByteLength: number;
  readonly maxTextureDimensionPx: number;
}

/** Measured generator use checked against the invocation budgets. */
export interface ModelGeneratorUsage {
  readonly durationMs: number;
  readonly triangleCount: number;
  readonly byteLength: number;
  readonly textureByteLength: number;
  readonly maxTextureDimensionPx: number;
}

/** Request-bound source bundle submitted to the normal quarantine and ingestion path. */
export interface ModelGeneratorSourceBundle {
  readonly bundleId: string;
  readonly generationId: string;
  readonly entrypointUri: string;
  readonly artifacts: readonly ModelGeneratorArtifact[];
  readonly generator: ModelGeneratorIdentity;
  readonly generatedAt: string;
  readonly seed: string;
  readonly context: ModelGeneratorRequest;
  readonly usage: ModelGeneratorUsage;
}

/** Successful generator result consumed by the normal processing pipeline. */
export interface GeneratedModelGeneratorResult {
  readonly status: "generated";
  readonly generationId: string;
  readonly sourceBundle: ModelGeneratorSourceBundle;
}

/** Stable reasons an enabled generator may be temporarily or permanently unavailable. */
export type ModelGeneratorUnavailableReason =
  | "capacity-unavailable"
  | "provider-unavailable"
  | "authentication-required"
  | "rate-limited"
  | "unsupported-request";

/** Stable generator execution or output-validation failure reasons. */
export type ModelGeneratorFailureReason =
  | "provider-failed"
  | "invalid-generator-output"
  | "internal-failure";

/** Stable reasons a generator invocation ended without producing an output. */
export type ModelGeneratorCancellationReason =
  | "caller-aborted"
  | "deadline-exceeded"
  | "superseded"
  | "service-shutdown";

interface ModelGeneratorTerminalEvidence {
  readonly generationId: string;
  readonly retryable: boolean;
  readonly occurredAt: string;
  readonly diagnosticId?: string;
}

/** Request-bound unavailable outcome with stable retryability. */
export interface UnavailableModelGeneratorResult extends ModelGeneratorTerminalEvidence {
  readonly status: "unavailable";
  readonly reasonCode: ModelGeneratorUnavailableReason;
}

/** Request-bound failed outcome without raw provider error disclosure. */
export interface FailedModelGeneratorResult extends ModelGeneratorTerminalEvidence {
  readonly status: "failed";
  readonly reasonCode: ModelGeneratorFailureReason;
}

/** Request-bound cancellation outcome. */
export interface CancelledModelGeneratorResult extends ModelGeneratorTerminalEvidence {
  readonly status: "cancelled";
  readonly reasonCode: ModelGeneratorCancellationReason;
}

/** Name of one bounded generator resource dimension. */
export type ModelGeneratorBudgetName = keyof ModelGeneratorBudgets;

/** Exact observed value that exceeded one invocation budget. */
export interface ModelGeneratorBudgetViolation {
  readonly budget: ModelGeneratorBudgetName;
  readonly limit: number;
  readonly observed: number;
}

/** Fail-closed outcome carrying no partial source bundle. */
export interface BudgetExceededModelGeneratorResult extends ModelGeneratorTerminalEvidence {
  readonly status: "budget-exceeded";
  readonly reasonCode: "generator-budget-exceeded";
  readonly retryable: false;
  readonly violations: readonly ModelGeneratorBudgetViolation[];
}

/** Stable result union shared by disabled Phase 1 and future enabled generators. */
export type ModelGeneratorResult =
  | DisabledModelGeneratorResult
  | GeneratedModelGeneratorResult
  | UnavailableModelGeneratorResult
  | FailedModelGeneratorResult
  | CancelledModelGeneratorResult
  | BudgetExceededModelGeneratorResult;

/** Optional cancellation context for generator calls. */
export interface ModelGeneratorCallOptions {
  readonly signal?: AbortSignal;
}

/** Generator boundary; Phase 1 supplies only a disabled implementation. */
export interface ModelGeneratorPort {
  readonly enabled: boolean;
  generate(
    input: ModelGeneratorRequest,
    options?: ModelGeneratorCallOptions,
  ): Promise<ModelGeneratorResult>;
}

const ASSET_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const VERSION_PATTERN = /^[0-9A-Za-z][0-9A-Za-z._-]{0,127}$/u;
const TOKEN_PATTERN = /^[0-9A-Za-z][0-9A-Za-z._:-]{0,127}$/u;
const CONFIRMATION_TOKEN_PATTERN = /^[0-9A-Za-z_-]{32,256}$/u;
const OPAQUE_SOURCE_ASSET_ID_PATTERN = /^[0-9A-Za-z][0-9A-Za-z._-]{0,255}$/u;
const MODEL_PATH_SEGMENT_PATTERN = /^[0-9A-Za-z._~-]+$/u;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const CONTENT_TYPE_PATTERN = /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/iu;
const URL_LIKE_PATTERN = /(?:https?:\/\/|\bwww\.)/iu;
const ENCODED_PATH_PATTERN = /%(?:2e|2f|5c|25)/iu;
const MAX_QUERY_LENGTH = 512;
const MAX_TEXT_LENGTH = 512;
const MAX_LIST_LENGTH = 32;
const MAX_CANDIDATES = 50;
const MAX_ATTEMPTS = 100;
const MODEL_CANONICAL_ORIGIN_TOLERANCE_METRES = 1e-6;
const MODEL_MATCH_ASSURANCE_ORDER: Readonly<Record<ModelMatchAssurance, number>> = Object.freeze({
  none: 0,
  low: 1,
  high: 2,
});

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

function assertRecord(value: unknown, fieldName: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${fieldName} must be an object.`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${fieldName} must be a plain object.`);
  }
  return value as Record<string, unknown>;
}

function assertAllowedKeys(
  record: Record<string, unknown>,
  allowedKeys: readonly string[],
  fieldName: string,
): void {
  const unexpected = Object.keys(record).find((key) => !allowedKeys.includes(key));
  if (unexpected !== undefined) {
    throw new Error(`${fieldName} contains unexpected field ${unexpected}.`);
  }
}

function assertContractVersion(record: Record<string, unknown>, fieldName: string): void {
  if (
    record.contractVersion !== undefined
    && record.contractVersion !== MODEL_RESOLUTION_CONTRACT_VERSION
  ) {
    throw new Error(`${fieldName} contractVersion is not supported.`);
  }
}

function hasControlCharacters(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127;
  });
}

function requiredString(
  value: unknown,
  fieldName: string,
  maxLength = MAX_TEXT_LENGTH,
): string {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string.`);
  }
  const normalized = value.trim().replace(/\s+/gu, " ");
  if (normalized.length === 0 || normalized.length > maxLength || hasControlCharacters(normalized)) {
    throw new Error(`${fieldName} must be a non-empty bounded string.`);
  }
  return normalized;
}

function optionalString(
  value: unknown,
  fieldName: string,
  maxLength = MAX_TEXT_LENGTH,
): string | undefined {
  return value === undefined ? undefined : requiredString(value, fieldName, maxLength);
}

function assertNoDirectUrl(value: string, fieldName: string): void {
  if (URL_LIKE_PATTERN.test(value)) {
    throw new Error(`${fieldName} must not contain a direct URL.`);
  }
}

function requiredToken(value: unknown, fieldName: string): string {
  const token = requiredString(value, fieldName, 128);
  if (!TOKEN_PATTERN.test(token)) {
    throw new Error(`${fieldName} must be a token up to 128 characters.`);
  }
  return token;
}

function requiredModelPathSegment(value: unknown, fieldName: string): string {
  const segment = requiredString(value, fieldName, 128);
  if (
    !MODEL_PATH_SEGMENT_PATTERN.test(segment)
    || segment === "."
    || segment === ".."
  ) {
    throw new Error(`${fieldName} must be a canonical model URI path segment.`);
  }
  return segment;
}

function requiredAttestationToken(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !CONFIRMATION_TOKEN_PATTERN.test(value)) {
    throw new Error(`${fieldName} must be a bounded opaque signed token.`);
  }
  return value;
}

function requiredSha256(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !SHA256_PATTERN.test(value)) {
    throw new Error(`${fieldName} must be a lowercase 64-character sha256 digest.`);
  }
  return value;
}

function requiredInteger(
  value: unknown,
  fieldName: string,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new Error(`${fieldName} must be an integer between ${minimum} and ${maximum}.`);
  }
  return value as number;
}

function requiredFiniteNumber(
  value: unknown,
  fieldName: string,
  minimum: number,
  maximum = Number.MAX_VALUE,
): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${fieldName} must be a finite number between ${minimum} and ${maximum}.`);
  }
  return value;
}

function requiredBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${fieldName} must be a boolean.`);
  }
  return value;
}

function requiredTimestamp(value: unknown, fieldName: string): string {
  const timestamp = requiredString(value, fieldName, 64);
  const parsed = new Date(timestamp);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/u.test(timestamp) || Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} must be a valid UTC RFC3339 timestamp.`);
  }
  const withoutSuffix = timestamp.slice(0, -1);
  const [wholeSeconds, fractionalSeconds = ""] = withoutSuffix.split(".");
  const canonicalInput = `${wholeSeconds}.${fractionalSeconds.padEnd(3, "0")}Z`;
  const canonicalTimestamp = parsed.toISOString();
  if (canonicalTimestamp !== canonicalInput) {
    throw new Error(`${fieldName} must be a valid UTC RFC3339 timestamp.`);
  }
  return canonicalTimestamp;
}

function requiredEnum<T extends string>(
  value: unknown,
  values: readonly T[],
  fieldName: string,
): T {
  if (typeof value !== "string" || !values.includes(value as T)) {
    throw new Error(`${fieldName} is not supported.`);
  }
  return value as T;
}

function stringList(
  value: unknown,
  fieldName: string,
  options: { readonly tokens?: boolean; readonly maxItems?: number } = {},
): readonly string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array.`);
  }
  const maxItems = options.maxItems ?? MAX_LIST_LENGTH;
  if (value.length > maxItems) {
    throw new Error(`${fieldName} must contain at most ${maxItems} items.`);
  }
  const items = value.map((item, index) => {
    const normalized = options.tokens
      ? requiredToken(item, `${fieldName}[${index}]`)
      : requiredString(item, `${fieldName}[${index}]`, 128);
    assertNoDirectUrl(normalized, `${fieldName}[${index}]`);
    return normalized;
  });
  const normalizedKeys = new Set(items.map((item) => item.toLocaleLowerCase("en-GB")));
  if (normalizedKeys.size !== items.length) {
    throw new Error(`${fieldName} must not contain duplicate values.`);
  }
  return items;
}

function requiredVector3(value: unknown, fieldName: string, positive = false): ModelVector3 {
  if (!Array.isArray(value) || value.length !== 3) {
    throw new Error(`${fieldName} must contain exactly three numbers.`);
  }
  return [
    requiredFiniteNumber(value[0], `${fieldName}[0]`, positive ? Number.EPSILON : -Number.MAX_VALUE),
    requiredFiniteNumber(value[1], `${fieldName}[1]`, positive ? Number.EPSILON : -Number.MAX_VALUE),
    requiredFiniteNumber(value[2], `${fieldName}[2]`, positive ? Number.EPSILON : -Number.MAX_VALUE),
  ];
}

function createBounds(value: unknown, fieldName: string): ModelBoundsMetres {
  const record = assertRecord(value, fieldName);
  assertAllowedKeys(record, ["min", "max"], fieldName);
  const min = requiredVector3(record.min, `${fieldName}.min`);
  const max = requiredVector3(record.max, `${fieldName}.max`);
  if (min.some((axis, index) => axis >= max[index]!)) {
    throw new Error(`${fieldName} min axes must be lower than max axes.`);
  }
  return { min, max };
}

function createDimensions(value: unknown, fieldName: string): ModelDimensionsMetres {
  const record = assertRecord(value, fieldName);
  assertAllowedKeys(record, ["width", "height", "depth"], fieldName);
  return {
    width: requiredFiniteNumber(record.width, `${fieldName}.width`, Number.EPSILON),
    height: requiredFiniteNumber(record.height, `${fieldName}.height`, Number.EPSILON),
    depth: requiredFiniteNumber(record.depth, `${fieldName}.depth`, Number.EPSILON),
  };
}

function assertModelUri(value: unknown, fieldName: string): string {
  const uri = requiredString(value, fieldName, 2048);
  const canonicalPrefix = "mcp://models/";
  if (
    !uri.startsWith(canonicalPrefix)
    || uri.includes("\\")
    || uri.includes("?")
    || uri.includes("#")
    || ENCODED_PATH_PATTERN.test(uri)
  ) {
    throw new Error(
      `${fieldName} must be a canonical traversal-free mcp://models URI without query or fragment.`,
    );
  }
  const rawSegments = uri.slice(canonicalPrefix.length).split("/");
  if (
    rawSegments.length === 0
    || rawSegments.some((segment) =>
      segment.length === 0
      || segment === "."
      || segment === ".."
      || !MODEL_PATH_SEGMENT_PATTERN.test(segment))
  ) {
    throw new Error(`${fieldName} must be a canonical traversal-free mcp://models URI.`);
  }
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error(`${fieldName} must be a valid mcp://models URI.`);
  }
  if (
    parsed.protocol !== "mcp:"
    || parsed.hostname !== "models"
    || parsed.port.length > 0
    || parsed.username.length > 0
    || parsed.password.length > 0
    || parsed.search.length > 0
    || parsed.hash.length > 0
  ) {
    throw new Error(`${fieldName} must be a credential-free mcp://models URI.`);
  }
  if (parsed.href !== uri) {
    throw new Error(`${fieldName} must use canonical mcp://models serialization.`);
  }
  return uri;
}

function isPrivateHostname(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase();
  if (lowerHostname.endsWith(".")) {
    return true;
  }
  const normalized = lowerHostname.replace(/^\[|\]$/gu, "");
  if (
    normalized === "localhost"
    || normalized.endsWith(".localhost")
    || normalized.endsWith(".local")
    || normalized.endsWith(".internal")
    || normalized.endsWith(".lan")
    || normalized.endsWith(".home")
    || normalized.endsWith(".arpa")
    || normalized.endsWith(".nip.io")
    || normalized.endsWith(".sslip.io")
    || normalized === "localtest.me"
    || normalized.endsWith(".localtest.me")
  ) {
    return true;
  }
  if (normalized.includes(":")) {
    if (
      normalized === "::"
      || normalized === "::1"
      || normalized.startsWith("::ffff:")
      || normalized.startsWith("fc")
      || normalized.startsWith("fd")
      || /^(?:fe8|fe9|fea|feb)/u.test(normalized)
      || normalized.startsWith("ff")
      || normalized.startsWith("2001:db8:")
    ) {
      return true;
    }
    const firstHextet = Number.parseInt(normalized.split(":", 1)[0] ?? "", 16);
    return !Number.isInteger(firstHextet) || firstHextet < 0x2000 || firstHextet > 0x3fff;
  }
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/u.exec(normalized);
  if (!match) {
    return !normalized.includes(".");
  }
  const octets = match.slice(1).map(Number);
  return octets.some((octet) => octet > 255)
    || octets[0] === 0
    || octets[0] === 10
    || (octets[0] === 100 && (octets[1] ?? 0) >= 64 && (octets[1] ?? 0) <= 127)
    || octets[0] === 127
    || (octets[0] === 169 && octets[1] === 254)
    || (octets[0] === 172 && (octets[1] ?? 0) >= 16 && (octets[1] ?? 0) <= 31)
    || (octets[0] === 192 && octets[1] === 0 && octets[2] === 0)
    || (octets[0] === 192 && octets[1] === 0 && octets[2] === 2)
    || (octets[0] === 192 && octets[1] === 168)
    || (octets[0] === 198 && (octets[1] === 18 || octets[1] === 19))
    || (octets[0] === 198 && octets[1] === 51 && octets[2] === 100)
    || (octets[0] === 203 && octets[1] === 0 && octets[2] === 113)
    || (octets[0] ?? 0) >= 224;
}

function assertPublicPageUri(value: unknown, fieldName: string): string {
  const uri = requiredString(value, fieldName, 2048);
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error(`${fieldName} must be a valid public HTTPS page URI.`);
  }
  if (
    parsed.protocol !== "https:"
    || parsed.username.length > 0
    || parsed.password.length > 0
    || parsed.hostname.length === 0
    || uri.includes("?")
    || uri.includes("#")
    || isPrivateHostname(parsed.hostname)
  ) {
    throw new Error(`${fieldName} must be a credential-free public HTTPS page URI.`);
  }
  return uri;
}

function assetId(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !ASSET_ID_PATTERN.test(value)) {
    throw new Error(`${fieldName} must use lowercase kebab-case letters and numbers.`);
  }
  return value;
}

function assetVersion(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !VERSION_PATTERN.test(value)) {
    throw new Error(`${fieldName} must be a non-empty version token up to 128 characters.`);
  }
  return value;
}

function opaqueSourceAssetId(value: unknown, fieldName = "ModelProvenance.sourceAssetId"): string {
  if (typeof value !== "string" || !OPAQUE_SOURCE_ASSET_ID_PATTERN.test(value)) {
    throw new Error(`${fieldName} must be an opaque bounded token.`);
  }
  return value;
}

function createHardConstraints(value: unknown): ModelHardConstraints {
  const record = value === undefined
    ? {}
    : assertRecord(value, "ModelRequestSpec.hardConstraints");
  assertAllowedKeys(record, [
    "boundsMetres",
    "dimensionsMetres",
    "maxTriangles",
    "maxBytes",
    "maxTextureBytes",
    "maxTextureDimensionPx",
    "maxPartitionCellMetres",
    "lod",
    "collision",
    "partition",
  ], "ModelRequestSpec.hardConstraints");
  const result: {
    boundsMetres?: ModelBoundsMetres;
    dimensionsMetres?: ModelDimensionsMetres;
    maxTriangles?: number;
    maxBytes?: number;
    maxTextureBytes?: number;
    maxTextureDimensionPx?: number;
    maxPartitionCellMetres?: number;
    lod?: ModelRequirementPolicy;
    collision?: ModelRequirementPolicy;
    partition?: ModelPartitionPolicy;
  } = {
    maxTriangles: STATIC_WORLD_V1_MODEL_POLICY.maxTriangles,
    maxBytes: STATIC_WORLD_V1_MODEL_POLICY.maxBytes,
    maxTextureBytes: STATIC_WORLD_V1_MODEL_POLICY.maxTextureBytes,
    maxTextureDimensionPx: STATIC_WORLD_V1_MODEL_POLICY.maxTextureDimensionPx,
    maxPartitionCellMetres: STATIC_WORLD_V1_MODEL_POLICY.maxPartitionCellMetres,
    lod: "optional",
    collision: "optional",
    partition: "allowed",
  };
  if (record.boundsMetres !== undefined) {
    result.boundsMetres = createBounds(record.boundsMetres, "ModelRequestSpec.hardConstraints.boundsMetres");
  }
  if (record.dimensionsMetres !== undefined) {
    result.dimensionsMetres = createDimensions(record.dimensionsMetres, "ModelRequestSpec.hardConstraints.dimensionsMetres");
  }
  if (record.maxTriangles !== undefined) {
    result.maxTriangles = requiredInteger(
      record.maxTriangles,
      "ModelRequestSpec.hardConstraints.maxTriangles",
      1,
      STATIC_WORLD_V1_MODEL_POLICY.maxTriangles,
    );
  }
  if (record.maxBytes !== undefined) {
    result.maxBytes = requiredInteger(
      record.maxBytes,
      "ModelRequestSpec.hardConstraints.maxBytes",
      1,
      STATIC_WORLD_V1_MODEL_POLICY.maxBytes,
    );
  }
  if (record.maxTextureBytes !== undefined) {
    result.maxTextureBytes = requiredInteger(
      record.maxTextureBytes,
      "ModelRequestSpec.hardConstraints.maxTextureBytes",
      1,
      STATIC_WORLD_V1_MODEL_POLICY.maxTextureBytes,
    );
  }
  if (record.maxTextureDimensionPx !== undefined) {
    result.maxTextureDimensionPx = requiredInteger(
      record.maxTextureDimensionPx,
      "ModelRequestSpec.hardConstraints.maxTextureDimensionPx",
      1,
      STATIC_WORLD_V1_MODEL_POLICY.maxTextureDimensionPx,
    );
  }
  if (record.maxPartitionCellMetres !== undefined) {
    result.maxPartitionCellMetres = requiredFiniteNumber(
      record.maxPartitionCellMetres,
      "ModelRequestSpec.hardConstraints.maxPartitionCellMetres",
      Number.EPSILON,
      STATIC_WORLD_V1_MODEL_POLICY.maxPartitionCellMetres,
    );
  }
  if (record.lod !== undefined) {
    result.lod = requiredEnum(record.lod, ["required", "optional", "forbidden"] as const, "ModelRequestSpec.hardConstraints.lod");
  }
  if (record.collision !== undefined) {
    result.collision = requiredEnum(record.collision, ["required", "optional", "forbidden"] as const, "ModelRequestSpec.hardConstraints.collision");
  }
  if (record.partition !== undefined) {
    result.partition = requiredEnum(record.partition, ["single", "allowed", "required"] as const, "ModelRequestSpec.hardConstraints.partition");
  }
  if (record.maxTextureBytes === undefined && result.maxBytes !== undefined) {
    result.maxTextureBytes = Math.min(result.maxTextureBytes ?? result.maxBytes, result.maxBytes);
  }
  if (
    result.maxBytes !== undefined
    && result.maxTextureBytes !== undefined
    && result.maxTextureBytes > result.maxBytes
  ) {
    throw new Error("ModelRequestSpec hardConstraints maxTextureBytes must not exceed maxBytes.");
  }
  if (result.boundsMetres !== undefined && result.dimensionsMetres !== undefined) {
    const boundsDimensions = result.boundsMetres.max.map(
      (axis, index) => axis - result.boundsMetres!.min[index]!,
    );
    const suppliedDimensions = [
      result.dimensionsMetres.width,
      result.dimensionsMetres.height,
      result.dimensionsMetres.depth,
    ];
    if (boundsDimensions.some((axis, index) =>
      Math.abs(axis - suppliedDimensions[index]!) > Math.max(1e-6, Math.abs(axis) * 1e-6))) {
      throw new Error("ModelRequestSpec hardConstraints dimensionsMetres must match boundsMetres.");
    }
  }
  return result;
}

function createSoftPreferences(value: unknown): ModelSoftPreferences {
  if (value === undefined) {
    return {};
  }
  const record = assertRecord(value, "ModelRequestSpec.softPreferences");
  assertAllowedKeys(record, [
    "category",
    "style",
    "materials",
    "colors",
    "era",
    "condition",
    "tags",
  ], "ModelRequestSpec.softPreferences");
  const result: {
    category?: string;
    style?: string;
    materials?: readonly string[];
    colors?: readonly string[];
    era?: string;
    condition?: string;
    tags?: readonly string[];
  } = {};
  for (const field of ["category", "style", "era", "condition"] as const) {
    const normalized = optionalString(record[field], `ModelRequestSpec.softPreferences.${field}`, 80);
    if (normalized !== undefined) {
      assertNoDirectUrl(normalized, `ModelRequestSpec.softPreferences.${field}`);
      result[field] = normalized;
    }
  }
  for (const field of ["materials", "colors", "tags"] as const) {
    if (record[field] !== undefined) {
      result[field] = stringList(record[field], `ModelRequestSpec.softPreferences.${field}`);
    }
  }
  return result;
}

/** Validate and normalize an unknown model request payload. */
export function createModelRequestSpec(input: unknown): ModelRequestSpec {
  const record = assertRecord(input, "ModelRequestSpec");
  assertAllowedKeys(record, [
    "contractVersion",
    "policyProfileId",
    "query",
    "revision",
    "locale",
    "rankerId",
    "hardConstraints",
    "softPreferences",
    "exclusions",
  ], "ModelRequestSpec");
  assertContractVersion(record, "ModelRequestSpec");
  if (
    record.policyProfileId !== undefined
    && record.policyProfileId !== STATIC_WORLD_V1_MODEL_POLICY.id
  ) {
    throw new Error("ModelRequestSpec.policyProfileId must be static-world-v1.");
  }
  const query = requiredString(record.query, "ModelRequestSpec.query", MAX_QUERY_LENGTH);
  assertNoDirectUrl(query, "ModelRequestSpec.query");
  const revision = requiredInteger(
    record.revision,
    `ModelRequestSpec revision (maximum ${MODEL_REQUEST_MAX_REVISION})`,
    0,
    MODEL_REQUEST_MAX_REVISION,
  );
  let locale: string | undefined;
  if (record.locale !== undefined) {
    const requestedLocale = requiredString(record.locale, "ModelRequestSpec.locale", 64);
    try {
      [locale] = Intl.getCanonicalLocales(requestedLocale);
    } catch {
      throw new Error("ModelRequestSpec.locale must be a valid BCP 47 locale.");
    }
    if (locale === undefined) {
      throw new Error("ModelRequestSpec.locale must be a valid BCP 47 locale.");
    }
  }
  const rankerId = record.rankerId === undefined
    ? undefined
    : requiredToken(record.rankerId, "ModelRequestSpec.rankerId");
  const result: ModelRequestSpec = {
    contractVersion: MODEL_RESOLUTION_CONTRACT_VERSION,
    policyProfileId: STATIC_WORLD_V1_MODEL_POLICY.id,
    query,
    revision,
    ...(locale === undefined ? {} : { locale }),
    ...(rankerId === undefined ? {} : { rankerId }),
    hardConstraints: createHardConstraints(record.hardConstraints),
    softPreferences: createSoftPreferences(record.softPreferences),
    exclusions: record.exclusions === undefined
      ? []
      : stringList(record.exclusions, "ModelRequestSpec.exclusions"),
  };
  return deepFreeze(result);
}

function deriveRawModelMatchAssurance(score: number, exactMatch: boolean): ModelMatchAssurance {
  if (exactMatch || score >= MODEL_MATCH_ASSURANCE_THRESHOLDS.high) {
    return "high";
  }
  if (score >= MODEL_MATCH_ASSURANCE_THRESHOLDS.low) {
    return "low";
  }
  return "none";
}

/** Derive an assurance band while independently failing closed on hard constraints. */
export function classifyModelMatchAssurance(
  score: number,
  hardConstraintPass: boolean,
  evidenceMode: ModelRankerEvidenceMode,
  exactMatch: boolean,
  assuranceCeiling: ModelMatchAssurance,
): ModelMatchAssurance {
  requiredFiniteNumber(score, "Model match score", 0, 1);
  requiredBoolean(hardConstraintPass, "Model match hardConstraintPass");
  requiredEnum(evidenceMode, MODEL_RANKER_EVIDENCE_MODES, "Model match evidenceMode");
  requiredBoolean(exactMatch, "Model match exactMatch");
  requiredEnum(assuranceCeiling, MODEL_MATCH_ASSURANCE_BANDS, "Model match assuranceCeiling");
  if (evidenceMode === "text-only" && exactMatch) {
    throw new Error("Model match exactMatch must be false for text-only evidence.");
  }
  if (evidenceMode === "text-only" && assuranceCeiling === "high") {
    throw new Error("Model match text-only assuranceCeiling must be low or none.");
  }
  if (evidenceMode === "exact-identifier" && !exactMatch) {
    throw new Error("Model match exact-identifier evidence requires exactMatch true.");
  }
  if (evidenceMode !== "exact-identifier" && evidenceMode !== "text-only" && exactMatch) {
    throw new Error("Model match exactMatch requires exact-identifier evidence.");
  }
  if (!hardConstraintPass) {
    return "none";
  }
  const rawAssurance = deriveRawModelMatchAssurance(score, exactMatch);
  return MODEL_MATCH_ASSURANCE_ORDER[rawAssurance] <= MODEL_MATCH_ASSURANCE_ORDER[assuranceCeiling]
    ? rawAssurance
    : assuranceCeiling;
}

function createRankerRef(value: unknown): ModelRankerRef {
  const record = assertRecord(value, "ModelMatchAssessment.ranker");
  assertAllowedKeys(record, [
    "id",
    "version",
    "calibrationId",
    "calibrationVersion",
    "evidenceMode",
    "assuranceCeiling",
  ], "ModelMatchAssessment.ranker");
  return {
    id: requiredToken(record.id, "ModelMatchAssessment.ranker.id"),
    version: assetVersion(record.version, "ModelMatchAssessment.ranker.version"),
    calibrationId: requiredToken(record.calibrationId, "ModelMatchAssessment.ranker.calibrationId"),
    calibrationVersion: assetVersion(record.calibrationVersion, "ModelMatchAssessment.ranker.calibrationVersion"),
    evidenceMode: requiredEnum(
      record.evidenceMode,
      MODEL_RANKER_EVIDENCE_MODES,
      "ModelMatchAssessment.ranker.evidenceMode",
    ),
    assuranceCeiling: requiredEnum(
      record.assuranceCeiling,
      MODEL_MATCH_ASSURANCE_BANDS,
      "ModelMatchAssessment.ranker.assuranceCeiling",
    ),
  };
}

/** Validate and freeze an unknown match assessment payload. */
export function createModelMatchAssessment(input: unknown): ModelMatchAssessment {
  const record = assertRecord(input, "ModelMatchAssessment");
  assertAllowedKeys(record, [
    "contractVersion",
    "score",
    "assurance",
    "hardConstraintPass",
    "exactMatch",
    "reasonCodes",
    "ranker",
    "fidelityWarnings",
    "request",
    "candidateId",
    "candidateContentHash",
  ], "ModelMatchAssessment");
  assertContractVersion(record, "ModelMatchAssessment");
  const score = requiredFiniteNumber(record.score, "ModelMatchAssessment.score", 0, 1);
  const hardConstraintPass = requiredBoolean(record.hardConstraintPass, "ModelMatchAssessment.hardConstraintPass");
  const exactMatch = requiredBoolean(record.exactMatch, "ModelMatchAssessment.exactMatch");
  const ranker = createRankerRef(record.ranker);
  const request = createModelRequestSpec(record.request);
  if (request.rankerId !== undefined && request.rankerId !== ranker.id) {
    throw new Error("ModelMatchAssessment ranker.id must match the caller-selected request rankerId.");
  }
  if (record.assurance !== undefined) {
    requiredEnum(record.assurance, MODEL_MATCH_ASSURANCE_BANDS, "ModelMatchAssessment.assurance");
  }
  let reasonCodes = stringList(record.reasonCodes, "ModelMatchAssessment.reasonCodes", {
    tokens: true,
  });
  if (!hardConstraintPass && reasonCodes.length === 0) {
    throw new Error("ModelMatchAssessment.reasonCodes must explain a failed hard constraint.");
  }
  const assurance = classifyModelMatchAssurance(
    score,
    hardConstraintPass,
    ranker.evidenceMode,
    exactMatch,
    ranker.assuranceCeiling,
  );
  const rawAssurance = deriveRawModelMatchAssurance(score, exactMatch);
  if (
    hardConstraintPass
    && MODEL_MATCH_ASSURANCE_ORDER[assurance] < MODEL_MATCH_ASSURANCE_ORDER[rawAssurance]
  ) {
    const ceilingReason = ranker.evidenceMode === "text-only"
      ? MODEL_TEXT_ONLY_ASSURANCE_CEILING_REASON_CODE
      : MODEL_RANKER_ASSURANCE_CEILING_REASON_CODE;
    if (!reasonCodes.includes(ceilingReason)) {
      if (reasonCodes.length >= MAX_LIST_LENGTH) {
        throw new Error(
          `ModelMatchAssessment.reasonCodes must contain at most ${MAX_LIST_LENGTH} items including the assurance ceiling reason.`,
        );
      }
      reasonCodes = [...reasonCodes, ceilingReason];
    }
  }
  return deepFreeze({
    contractVersion: MODEL_RESOLUTION_CONTRACT_VERSION,
    score,
    assurance,
    hardConstraintPass,
    exactMatch,
    reasonCodes,
    ranker,
    fidelityWarnings: stringList(record.fidelityWarnings ?? [], "ModelMatchAssessment.fidelityWarnings"),
    request,
    candidateId: requiredToken(record.candidateId, "ModelMatchAssessment.candidateId"),
    candidateContentHash: requiredSha256(
      record.candidateContentHash,
      "ModelMatchAssessment.candidateContentHash",
    ),
  });
}

/** Validate and freeze technical facts about a processed candidate. */
export function createModelTechnicalProfile(input: unknown): ModelTechnicalProfile {
  const record = assertRecord(input, "ModelTechnicalProfile");
  assertAllowedKeys(record, [
    "boundsMetres",
    "dimensionsMetres",
    "triangleCount",
    "byteLength",
    "textureByteLength",
    "maxTextureDimensionPx",
    "lodCount",
    "hasCollision",
    "partitionCount",
    "partitionCellMetres",
  ], "ModelTechnicalProfile");
  const boundsMetres = createBounds(record.boundsMetres, "ModelTechnicalProfile.boundsMetres");
  const dimensionsMetres = createDimensions(record.dimensionsMetres, "ModelTechnicalProfile.dimensionsMetres");
  const derivedDimensions = boundsMetres.max.map((axis, index) => axis - boundsMetres.min[index]!) as [number, number, number];
  const suppliedDimensions = [dimensionsMetres.width, dimensionsMetres.height, dimensionsMetres.depth];
  if (derivedDimensions.some((axis, index) => Math.abs(axis - suppliedDimensions[index]!) > Math.max(1e-6, Math.abs(axis) * 1e-6))) {
    throw new Error("ModelTechnicalProfile dimensionsMetres must match boundsMetres.");
  }
  const byteLength = requiredInteger(record.byteLength, "ModelTechnicalProfile.byteLength", 1, Number.MAX_SAFE_INTEGER);
  const textureByteLength = requiredInteger(
    record.textureByteLength,
    "ModelTechnicalProfile.textureByteLength",
    0,
    Number.MAX_SAFE_INTEGER,
  );
  const maxTextureDimensionPx = requiredInteger(
    record.maxTextureDimensionPx,
    "ModelTechnicalProfile.maxTextureDimensionPx",
    0,
    32_768,
  );
  if (textureByteLength > byteLength) {
    throw new Error("ModelTechnicalProfile.textureByteLength must not exceed model byteLength.");
  }
  if ((textureByteLength === 0) !== (maxTextureDimensionPx === 0)) {
    throw new Error(
      "ModelTechnicalProfile textureless models require textureByteLength and maxTextureDimensionPx to both be zero.",
    );
  }
  return deepFreeze({
    boundsMetres,
    dimensionsMetres,
    triangleCount: requiredInteger(record.triangleCount, "ModelTechnicalProfile.triangleCount", 1, 1_000_000_000),
    byteLength,
    textureByteLength,
    maxTextureDimensionPx,
    lodCount: requiredInteger(record.lodCount, "ModelTechnicalProfile.lodCount", 1, 4),
    hasCollision: requiredBoolean(record.hasCollision, "ModelTechnicalProfile.hasCollision"),
    partitionCount: requiredInteger(record.partitionCount, "ModelTechnicalProfile.partitionCount", 1, 10_000),
    partitionCellMetres: requiredFiniteNumber(
      record.partitionCellMetres,
      "ModelTechnicalProfile.partitionCellMetres",
      Number.EPSILON,
      1_000_000,
    ),
  });
}

function createAttribution(value: unknown): ModelAttribution {
  const record = assertRecord(value, "ModelRightsAssessment.attribution");
  assertAllowedKeys(record, ["title", "creator", "notice", "sourcePageUri"], "ModelRightsAssessment.attribution");
  const sourcePageUri = record.sourcePageUri === undefined
    ? undefined
    : assertPublicPageUri(record.sourcePageUri, "ModelRightsAssessment.attribution.sourcePageUri");
  return {
    title: requiredString(record.title, "ModelRightsAssessment.attribution.title", 256),
    creator: requiredString(record.creator, "ModelRightsAssessment.attribution.creator", 256),
    notice: requiredString(record.notice, "ModelRightsAssessment.attribution.notice", 512),
    ...(sourcePageUri === undefined ? {} : { sourcePageUri }),
  };
}

/** Validate and freeze rights and attribution evidence. */
export function createModelRightsAssessment(input: unknown): ModelRightsAssessment {
  const record = assertRecord(input, "ModelRightsAssessment");
  assertAllowedKeys(record, [
    "decisionId",
    "decisionToken",
    "policyId",
    "policyVersion",
    "sourceId",
    "sourceAssetId",
    "sourceContentHash",
    "status",
    "licenseId",
    "evidencePageUri",
    "attribution",
    "reviewedAt",
  ], "ModelRightsAssessment");
  const status = requiredEnum(record.status, MODEL_RIGHTS_STATUSES, "ModelRightsAssessment.status");
  const attribution = record.attribution === undefined ? undefined : createAttribution(record.attribution);
  if (status === "attribution-required" && attribution === undefined) {
    throw new Error("ModelRightsAssessment attribution is required for attribution-required rights.");
  }
  if (status === "attribution-required" && attribution?.sourcePageUri === undefined) {
    throw new Error("ModelRightsAssessment attribution-required rights require a public attribution sourcePageUri.");
  }
  return deepFreeze({
    decisionId: requiredToken(record.decisionId, "ModelRightsAssessment.decisionId"),
    decisionToken: requiredAttestationToken(
      record.decisionToken,
      "ModelRightsAssessment.decisionToken",
    ),
    policyId: requiredToken(record.policyId, "ModelRightsAssessment.policyId"),
    policyVersion: assetVersion(record.policyVersion, "ModelRightsAssessment.policyVersion"),
    sourceId: requiredToken(record.sourceId, "ModelRightsAssessment.sourceId"),
    sourceAssetId: opaqueSourceAssetId(record.sourceAssetId, "ModelRightsAssessment.sourceAssetId"),
    sourceContentHash: requiredSha256(
      record.sourceContentHash,
      "ModelRightsAssessment.sourceContentHash",
    ),
    status,
    licenseId: requiredToken(record.licenseId, "ModelRightsAssessment.licenseId"),
    evidencePageUri: assertPublicPageUri(record.evidencePageUri, "ModelRightsAssessment.evidencePageUri"),
    ...(attribution === undefined ? {} : { attribution }),
    reviewedAt: requiredTimestamp(record.reviewedAt, "ModelRightsAssessment.reviewedAt"),
  });
}

/** Validate public-safe catalog, provider, or generated provenance. */
export function createModelProvenance(input: unknown): ModelProvenance {
  const record = assertRecord(input, "ModelProvenance");
  assertAllowedKeys(record, [
    "kind",
    "sourceId",
    "sourceAssetId",
    "sourcePageUri",
    "contentHash",
    "capturedAt",
  ], "ModelProvenance");
  const kind = requiredEnum(record.kind, MODEL_PROVENANCE_KINDS, "ModelProvenance kind");
  const sourceAssetId = opaqueSourceAssetId(record.sourceAssetId);
  const sourcePageUri = record.sourcePageUri === undefined
    ? undefined
    : assertPublicPageUri(record.sourcePageUri, "ModelProvenance.sourcePageUri");
  if (kind === "provider" && sourcePageUri === undefined) {
    throw new Error("ModelProvenance provider provenance requires sourcePageUri.");
  }
  if (kind === "generated" && sourcePageUri !== undefined) {
    throw new Error("ModelProvenance generated provenance must not include sourcePageUri.");
  }
  return deepFreeze({
    kind,
    sourceId: requiredToken(record.sourceId, "ModelProvenance.sourceId"),
    sourceAssetId,
    ...(sourcePageUri === undefined ? {} : { sourcePageUri }),
    contentHash: requiredSha256(record.contentHash, "ModelProvenance.contentHash"),
    capturedAt: requiredTimestamp(record.capturedAt, "ModelProvenance.capturedAt"),
  });
}

/** Validate and freeze an immutable player-safe model asset reference. */
export function createModelAssetRef(input: unknown): ModelAssetRef {
  const record = assertRecord(input, "ModelAssetRef");
  assertAllowedKeys(record, [
    "contractVersion",
    "assetId",
    "version",
    "kind",
    "contentHash",
    "runtimeManifestUri",
  ], "ModelAssetRef");
  assertContractVersion(record, "ModelAssetRef");
  const validatedAssetId = assetId(record.assetId, "ModelAssetRef.assetId");
  const validatedVersion = assetVersion(record.version, "ModelAssetRef.version");
  const runtimeManifestUri = assertModelUri(record.runtimeManifestUri, "ModelAssetRef.runtimeManifestUri");
  const expectedManifestUri = `mcp://models/catalog/${validatedAssetId}/versions/${validatedVersion}/manifest`;
  if (runtimeManifestUri !== expectedManifestUri) {
    throw new Error(
      "ModelAssetRef.runtimeManifestUri must exactly match the assetId/version catalog identity.",
    );
  }
  return deepFreeze({
    contractVersion: MODEL_RESOLUTION_CONTRACT_VERSION,
    assetId: validatedAssetId,
    version: validatedVersion,
    kind: requiredEnum(record.kind, MODEL_ASSET_KINDS, "ModelAssetRef.kind"),
    contentHash: requiredSha256(record.contentHash, "ModelAssetRef.contentHash"),
    runtimeManifestUri,
  });
}

function createCandidateAssetRef(value: unknown): ModelCandidateAssetRef {
  const record = assertRecord(value, "ModelCandidate.assetRef");
  const disposition = requiredEnum(record.disposition, ["existing", "proposed"], "ModelCandidate.assetRef.disposition");
  if (disposition === "existing") {
    assertAllowedKeys(record, ["disposition", "asset", "kind", "contentHash"], "ModelCandidate.assetRef");
    const asset = createModelAssetRef(record.asset);
    if (record.kind !== undefined && record.kind !== asset.kind) {
      throw new Error("ModelCandidate existing assetRef kind must match asset.");
    }
    if (record.contentHash !== undefined && record.contentHash !== asset.contentHash) {
      throw new Error("ModelCandidate existing assetRef contentHash must match asset.");
    }
    return {
      disposition,
      kind: asset.kind,
      contentHash: asset.contentHash,
      asset,
    };
  }
  assertAllowedKeys(record, ["disposition", "proposalId", "kind", "contentHash"], "ModelCandidate.assetRef");
  return {
    disposition,
    proposalId: requiredToken(record.proposalId, "ModelCandidate.assetRef.proposalId"),
    kind: requiredEnum(record.kind, MODEL_ASSET_KINDS, "ModelCandidate.assetRef.kind"),
    contentHash: requiredSha256(record.contentHash, "ModelCandidate.assetRef.contentHash"),
  };
}

function createConfirmationView(value: unknown, index: number): ModelConfirmationView {
  const fieldName = `ModelCandidate.views[${index}]`;
  const record = assertRecord(value, fieldName);
  assertAllowedKeys(record, ["kind", "imageUri", "sha256", "contentType", "width", "height"], fieldName);
  const width = requiredInteger(record.width, `${fieldName}.width`, MODEL_CONFIRMATION_VIEW_SIZE_PX, MODEL_CONFIRMATION_VIEW_SIZE_PX);
  const height = requiredInteger(record.height, `${fieldName}.height`, MODEL_CONFIRMATION_VIEW_SIZE_PX, MODEL_CONFIRMATION_VIEW_SIZE_PX);
  if (record.contentType !== "image/png") {
    throw new Error(`${fieldName}.contentType must be image/png.`);
  }
  return {
    kind: requiredEnum(record.kind, MODEL_CONFIRMATION_VIEW_KINDS, `${fieldName}.kind`),
    imageUri: assertModelUri(record.imageUri, `${fieldName}.imageUri`),
    sha256: requiredSha256(record.sha256, `${fieldName}.sha256`),
    contentType: "image/png",
    width: width as typeof MODEL_CONFIRMATION_VIEW_SIZE_PX,
    height: height as typeof MODEL_CONFIRMATION_VIEW_SIZE_PX,
  };
}

function createConfirmationViews(
  value: unknown,
  resolutionId: string,
  candidateId: string,
): ModelConfirmationViews {
  if (!Array.isArray(value) || value.length !== MODEL_CONFIRMATION_VIEW_KINDS.length) {
    throw new Error("Model candidate views must include exactly front, left, top, isometric.");
  }
  const views = value.map(createConfirmationView);
  const byKind = new Map(views.map((view) => [view.kind, view]));
  if (byKind.size !== MODEL_CONFIRMATION_VIEW_KINDS.length) {
    throw new Error("Model candidate views must include exactly front, left, top, isometric.");
  }
  const ordered = MODEL_CONFIRMATION_VIEW_KINDS.map((kind) => byKind.get(kind));
  if (ordered.some((view) => view === undefined)) {
    throw new Error("Model candidate views must include exactly front, left, top, isometric.");
  }
  const confirmedViews = ordered as ModelConfirmationView[];
  if (new Set(confirmedViews.map((view) => view.imageUri)).size !== confirmedViews.length) {
    throw new Error("Model candidate confirmation views must use unique resources.");
  }
  for (const view of confirmedViews) {
    const expectedUri = `mcp://models/resolutions/${resolutionId}/candidates/${candidateId}/${view.kind}.png`;
    if (view.imageUri !== expectedUri) {
      throw new Error(
        "Model candidate confirmation view resources must be scoped to the resolution, candidate, and view kind.",
      );
    }
  }
  return [ordered[0]!, ordered[1]!, ordered[2]!, ordered[3]!];
}

function createRenderEvidence(
  value: unknown,
  manifest: ModelProcessingManifest,
  views: ModelConfirmationViews,
): ModelRenderEvidence {
  const record = assertRecord(value, "ModelCandidate.renderEvidence");
  assertAllowedKeys(record, [
    "renderId",
    "rendererId",
    "rendererVersion",
    "settingsId",
    "settingsVersion",
    "processingManifestId",
    "sourceContentHash",
    "viewSha256s",
    "renderedAt",
    "attestationToken",
  ], "ModelCandidate.renderEvidence");
  if (record.processingManifestId !== manifest.manifestId) {
    throw new Error("ModelCandidate.renderEvidence.processingManifestId must match processingManifest.");
  }
  if (record.sourceContentHash !== manifest.lods[0]?.resource.sha256) {
    throw new Error("ModelCandidate.renderEvidence.sourceContentHash must match canonical LOD0.");
  }
  if (!Array.isArray(record.viewSha256s) || record.viewSha256s.length !== 4) {
    throw new Error("ModelCandidate.renderEvidence.viewSha256s must contain four ordered hashes.");
  }
  const viewSha256s = record.viewSha256s.map((digest, index) =>
    requiredSha256(digest, `ModelCandidate.renderEvidence.viewSha256s[${index}]`));
  if (viewSha256s.some((digest, index) => digest !== views[index]?.sha256)) {
    throw new Error("ModelCandidate.renderEvidence view hashes must match the candidate view pack.");
  }
  const renderedAt = requiredTimestamp(record.renderedAt, "ModelCandidate.renderEvidence.renderedAt");
  if (Date.parse(renderedAt) < Date.parse(manifest.processedAt)) {
    throw new Error("ModelCandidate.renderEvidence.renderedAt must not precede processing.");
  }
  return {
    renderId: requiredToken(record.renderId, "ModelCandidate.renderEvidence.renderId"),
    rendererId: requiredToken(record.rendererId, "ModelCandidate.renderEvidence.rendererId"),
    rendererVersion: assetVersion(record.rendererVersion, "ModelCandidate.renderEvidence.rendererVersion"),
    settingsId: requiredToken(record.settingsId, "ModelCandidate.renderEvidence.settingsId"),
    settingsVersion: assetVersion(record.settingsVersion, "ModelCandidate.renderEvidence.settingsVersion"),
    processingManifestId: manifest.manifestId,
    sourceContentHash: manifest.contentHash,
    viewSha256s: [viewSha256s[0]!, viewSha256s[1]!, viewSha256s[2]!, viewSha256s[3]!],
    renderedAt,
    attestationToken: requiredAttestationToken(
      record.attestationToken,
      "ModelCandidate.renderEvidence.attestationToken",
    ),
  };
}

function createCandidateHardGates(
  value: unknown,
  provenance: ModelProvenance,
  manifest: ModelProcessingManifest,
): readonly ModelCandidateHardGateEvidence[] {
  if (!Array.isArray(value) || value.length !== MODEL_CANDIDATE_HARD_GATE_KINDS.length) {
    throw new Error("ModelCandidate.hardGates must contain every required independent hard gate.");
  }
  const gates = value.map((item, index): ModelCandidateHardGateEvidence => {
    const fieldName = `ModelCandidate.hardGates[${index}]`;
    const record = assertRecord(item, fieldName);
    assertAllowedKeys(record, [
      "kind",
      "outcome",
      "validatorId",
      "validatorVersion",
      "subjectContentHash",
      "reasonCodes",
      "evaluatedAt",
      "attestationToken",
    ], fieldName);
    const kind = requiredEnum(record.kind, MODEL_CANDIDATE_HARD_GATE_KINDS, `${fieldName}.kind`);
    const subjectContentHash = requiredSha256(record.subjectContentHash, `${fieldName}.subjectContentHash`);
    const expectedHash = kind === "malware-scan"
      ? provenance.contentHash
      : manifest.closureHash;
    if (subjectContentHash !== expectedHash) {
      throw new Error(`${fieldName}.subjectContentHash must match the gate subject.`);
    }
    const outcome = requiredEnum(record.outcome, ["passed", "blocked"] as const, `${fieldName}.outcome`);
    const reasonCodes = stringList(record.reasonCodes ?? [], `${fieldName}.reasonCodes`, { tokens: true });
    if (outcome === "blocked" && reasonCodes.length === 0) {
      throw new Error(`${fieldName}.reasonCodes must explain a blocked hard gate.`);
    }
    return {
      kind,
      outcome,
      validatorId: requiredToken(record.validatorId, `${fieldName}.validatorId`),
      validatorVersion: assetVersion(record.validatorVersion, `${fieldName}.validatorVersion`),
      subjectContentHash,
      reasonCodes,
      evaluatedAt: requiredTimestamp(record.evaluatedAt, `${fieldName}.evaluatedAt`),
      attestationToken: requiredAttestationToken(record.attestationToken, `${fieldName}.attestationToken`),
    };
  });
  if (new Set(gates.map((gate) => gate.kind)).size !== MODEL_CANDIDATE_HARD_GATE_KINDS.length) {
    throw new Error("ModelCandidate.hardGates must contain each required gate exactly once.");
  }
  if (new Set(gates.map((gate) => gate.attestationToken)).size !== gates.length) {
    throw new Error("ModelCandidate hard gate attestation tokens must be unique.");
  }
  const byKind = new Map(gates.map((gate) => [gate.kind, gate]));
  return MODEL_CANDIDATE_HARD_GATE_KINDS.map((kind) => byKind.get(kind)!);
}

/** Validate and deeply freeze a model candidate from unknown JavaScript input. */
export function createModelCandidate(input: unknown): ModelCandidate {
  const record = assertRecord(input, "ModelCandidate");
  assertAllowedKeys(record, [
    "contractVersion",
    "resolutionId",
    "candidateId",
    "assetRef",
    "match",
    "provenance",
    "rights",
    "technicalProfile",
    "processingManifest",
    "views",
    "renderEvidence",
    "hardGates",
    "confirmationToken",
    "confirmationRequired",
  ], "ModelCandidate");
  assertContractVersion(record, "ModelCandidate");
  if (record.confirmationRequired !== undefined && record.confirmationRequired !== true) {
    throw new Error("ModelCandidate confirmationRequired must always be true.");
  }
  if (typeof record.confirmationToken !== "string" || !CONFIRMATION_TOKEN_PATTERN.test(record.confirmationToken)) {
    throw new Error("ModelCandidate confirmationToken must be a bounded opaque token.");
  }
  const resolutionId = requiredModelPathSegment(record.resolutionId, "ModelCandidate.resolutionId");
  const candidateId = requiredModelPathSegment(record.candidateId, "ModelCandidate.candidateId");
  const assetRef = createCandidateAssetRef(record.assetRef);
  const technicalProfile = createModelTechnicalProfile(record.technicalProfile);
  const processingManifest = createModelProcessingManifest(record.processingManifest);
  if (
    processingManifest.resolutionId !== resolutionId
    ||
    processingManifest.candidateId !== candidateId
    || processingManifest.kind !== assetRef.kind
    || processingManifest.contentHash !== assetRef.contentHash
    || JSON.stringify(processingManifest.technicalProfile) !== JSON.stringify(technicalProfile)
  ) {
    throw new Error(
      "ModelCandidate processingManifest must match candidateId, asset kind/contentHash, and technicalProfile.",
    );
  }
  const match = createModelMatchAssessment(record.match);
  if (match.candidateId !== candidateId || match.candidateContentHash !== assetRef.contentHash) {
    throw new Error("ModelCandidate match assessment must bind candidateId and candidate contentHash.");
  }
  const hardConstraintEvaluation = evaluateNormalizedModelHardConstraints(
    match.request,
    technicalProfile,
  );
  if (match.hardConstraintPass !== hardConstraintEvaluation.pass) {
    throw new Error(
      "ModelCandidate match hardConstraintPass must match deterministic evaluation.",
    );
  }
  if (
    hardConstraintEvaluation.reasonCodes.some(
      (reasonCode) => !match.reasonCodes.includes(reasonCode),
    )
  ) {
    throw new Error(
      "ModelCandidate match reasonCodes must include every failed hard constraint.",
    );
  }
  const provenance = createModelProvenance(record.provenance);
  if (provenance.contentHash !== processingManifest.converter.sourceContentHash) {
    throw new Error("ModelCandidate provenance contentHash must match converter sourceContentHash.");
  }
  const rights = createModelRightsAssessment(record.rights);
  if (
    rights.sourceId !== provenance.sourceId
    || rights.sourceAssetId !== provenance.sourceAssetId
    || rights.sourceContentHash !== provenance.contentHash
  ) {
    throw new Error("ModelCandidate rights decision must bind the exact provenance source and content hash.");
  }
  if (processingManifest.fidelityGate.outcome === "low-only") {
    if (
      match.assurance === "high"
      || !match.reasonCodes.includes("fidelity-low-only")
      || match.fidelityWarnings.length === 0
    ) {
      throw new Error("ModelCandidate low-only fidelity must cap assurance at low and include fidelity evidence.");
    }
  }
  if (
    processingManifest.fidelityGate.outcome === "blocked"
    && !match.reasonCodes.includes("fidelity-blocked")
  ) {
    throw new Error("ModelCandidate blocked fidelity must be recorded in match reasonCodes.");
  }
  const views = createConfirmationViews(record.views, resolutionId, candidateId);
  const renderEvidence = createRenderEvidence(record.renderEvidence, processingManifest, views);
  const hardGates = createCandidateHardGates(record.hardGates, provenance, processingManifest);
  return deepFreeze({
    contractVersion: MODEL_RESOLUTION_CONTRACT_VERSION,
    resolutionId,
    candidateId,
    assetRef,
    match,
    provenance,
    rights,
    technicalProfile,
    processingManifest,
    views,
    renderEvidence,
    hardGates,
    confirmationToken: record.confirmationToken,
    confirmationRequired: true,
  });
}

/** Return whether a candidate may enter mandatory human confirmation. */
export function isModelCandidateConfirmable(candidate: ModelCandidate): boolean {
  const blockingEvidence = [
    ...candidate.processingManifest.converter.diagnostics,
    ...candidate.processingManifest.converter.losses,
  ].some((evidence) => evidence.severity === "blocking");
  return candidate.confirmationRequired
    && candidate.match.hardConstraintPass
    && candidate.match.assurance !== "none"
    && (candidate.rights.status === "allowed" || candidate.rights.status === "attribution-required")
    && !blockingEvidence
    && candidate.processingManifest.fidelityGate.outcome !== "blocked"
    && candidate.hardGates.length === MODEL_CANDIDATE_HARD_GATE_KINDS.length
    && candidate.hardGates.every((gate) => gate.outcome === "passed")
    && candidate.views.length === MODEL_CONFIRMATION_VIEW_KINDS.length;
}

/** Validate a requester confirmation against one exact candidate and resolution. */
export function createModelCandidateConfirmation(
  input: unknown,
  expectedCandidate: ModelCandidate,
  expectedResolutionId: string,
): ModelCandidateConfirmation {
  const record = assertRecord(input, "ModelCandidateConfirmation");
  assertAllowedKeys(record, [
    "contractVersion",
    "confirmationId",
    "resolutionId",
    "candidateId",
    "confirmationToken",
    "viewSha256s",
    "confirmedBy",
    "confirmedAt",
    "semanticRiskAccepted",
  ], "ModelCandidateConfirmation");
  assertContractVersion(record, "ModelCandidateConfirmation");
  const candidate = createModelCandidate(expectedCandidate);
  const resolutionId = requiredModelPathSegment(
    expectedResolutionId,
    "ModelCandidateConfirmation expected resolutionId",
  );
  if (candidate.resolutionId !== resolutionId) {
    throw new Error(
      "ModelCandidateConfirmation expected candidate must belong to the expected resolutionId.",
    );
  }
  if (record.resolutionId !== resolutionId) {
    throw new Error("ModelCandidateConfirmation.resolutionId must match the expected resolutionId.");
  }
  if (record.candidateId !== candidate.candidateId) {
    throw new Error("ModelCandidateConfirmation.candidateId must match the confirmed candidate.");
  }
  if (
    typeof record.confirmationToken !== "string"
    || !CONFIRMATION_TOKEN_PATTERN.test(record.confirmationToken)
    || record.confirmationToken !== candidate.confirmationToken
  ) {
    throw new Error("ModelCandidateConfirmation.confirmationToken must match the signed candidate token.");
  }
  if (!Array.isArray(record.viewSha256s) || record.viewSha256s.length !== 4) {
    throw new Error("ModelCandidateConfirmation.viewSha256s must contain the ordered four candidate view hashes.");
  }
  const viewSha256s = record.viewSha256s.map((value, index) =>
    requiredSha256(value, `ModelCandidateConfirmation.viewSha256s[${index}]`));
  const expectedHashes = candidate.views.map((view) => view.sha256);
  if (viewSha256s.some((digest, index) => digest !== expectedHashes[index])) {
    throw new Error("ModelCandidateConfirmation view hashes must match the ordered candidate views.");
  }
  if (!isModelCandidateConfirmable(candidate)) {
    throw new Error("ModelCandidateConfirmation candidate is not confirmable because a hard review gate is blocking.");
  }
  const semanticRiskAccepted = requiredBoolean(
    record.semanticRiskAccepted,
    "ModelCandidateConfirmation.semanticRiskAccepted",
  );
  if (candidate.match.assurance === "low" && !semanticRiskAccepted) {
    throw new Error("ModelCandidateConfirmation low assurance requires explicit semantic risk acceptance.");
  }
  if (candidate.match.assurance === "high" && semanticRiskAccepted) {
    throw new Error("ModelCandidateConfirmation high assurance must not record a semantic risk override.");
  }
  const confirmedBy = requiredString(record.confirmedBy, "ModelCandidateConfirmation.confirmedBy", 256);
  assertNoDirectUrl(confirmedBy, "ModelCandidateConfirmation.confirmedBy");
  const confirmedAt = requiredTimestamp(
    record.confirmedAt,
    "ModelCandidateConfirmation.confirmedAt",
  );
  const latestEvidenceTime = Math.max(
    Date.parse(candidate.provenance.capturedAt),
    Date.parse(candidate.rights.reviewedAt),
    Date.parse(candidate.processingManifest.processedAt),
    Date.parse(candidate.processingManifest.fidelityGate.evaluatedAt),
    Date.parse(candidate.renderEvidence.renderedAt),
    ...candidate.hardGates.map((gate) => Date.parse(gate.evaluatedAt)),
  );
  if (Date.parse(confirmedAt) < latestEvidenceTime) {
    throw new Error(
      "ModelCandidateConfirmation.confirmedAt must not precede the candidate evidence required for confirmation.",
    );
  }
  return deepFreeze({
    contractVersion: MODEL_RESOLUTION_CONTRACT_VERSION,
    confirmationId: requiredToken(record.confirmationId, "ModelCandidateConfirmation.confirmationId"),
    resolutionId,
    candidateId: candidate.candidateId,
    confirmationToken: candidate.confirmationToken,
    viewSha256s: [viewSha256s[0]!, viewSha256s[1]!, viewSha256s[2]!, viewSha256s[3]!],
    confirmedBy,
    confirmedAt,
    semanticRiskAccepted,
  });
}

/** Validate and freeze a public-safe processing resource reference. */
export function createModelResourceRef(input: unknown): ModelResourceRef {
  const record = assertRecord(input, "ModelResourceRef");
  assertAllowedKeys(record, ["uri", "byteLength", "sha256", "contentType"], "ModelResourceRef");
  const contentType = requiredString(record.contentType, "ModelResourceRef.contentType", 128);
  if (!CONTENT_TYPE_PATTERN.test(contentType)) {
    throw new Error("ModelResourceRef.contentType must be a valid media type.");
  }
  return deepFreeze({
    uri: assertModelUri(record.uri, "ModelResourceRef.uri"),
    byteLength: requiredInteger(record.byteLength, "ModelResourceRef.byteLength", 1, Number.MAX_SAFE_INTEGER),
    sha256: requiredSha256(record.sha256, "ModelResourceRef.sha256"),
    contentType,
  });
}

function createLodRecord(value: unknown, index: number): ModelLodRecord {
  const fieldName = `ModelProcessingManifest.lods[${index}]`;
  const record = assertRecord(value, fieldName);
  assertAllowedKeys(record, ["level", "resource", "triangleCount", "geometricErrorMetres"], fieldName);
  const resource = createModelResourceRef(record.resource);
  if (resource.contentType !== "model/gltf-binary") {
    throw new Error(`${fieldName}.resource.contentType must be model/gltf-binary for canonical GLB output.`);
  }
  return {
    level: requiredInteger(record.level, `${fieldName}.level`, 0, 3) as ModelLodLevel,
    resource,
    triangleCount: requiredInteger(record.triangleCount, `${fieldName}.triangleCount`, 1, 1_000_000_000),
    geometricErrorMetres: requiredFiniteNumber(
      record.geometricErrorMetres,
      `${fieldName}.geometricErrorMetres`,
      0,
      1_000_000,
    ),
  };
}

function createCollisionRecord(value: unknown): ModelCollisionRecord {
  const record = assertRecord(value, "ModelProcessingManifest.collision");
  assertAllowedKeys(record, ["kind", "resource"], "ModelProcessingManifest.collision");
  const kind = requiredEnum(
    record.kind,
    ["none", "box", "convex-hull", "triangle-mesh", "compound"],
    "ModelProcessingManifest.collision.kind",
  );
  if (kind === "none") {
    if (record.resource !== undefined) {
      throw new Error("ModelProcessingManifest collision kind none must not include a resource.");
    }
    return { kind };
  }
  if (record.resource === undefined) {
    throw new Error("ModelProcessingManifest non-empty collision kinds require a resource.");
  }
  const resource = createModelResourceRef(record.resource);
  if (resource.contentType !== "model/gltf-binary") {
    throw new Error("ModelProcessingManifest collision resources must be model/gltf-binary GLBs.");
  }
  return { kind, resource };
}

function createTransform(value: unknown, fieldName: string): ModelTransform {
  const record = assertRecord(value, fieldName);
  assertAllowedKeys(record, ["translationMetres", "rotationQuaternion", "scale"], fieldName);
  const translationMetres = requiredVector3(record.translationMetres, `${fieldName}.translationMetres`);
  if (!Array.isArray(record.rotationQuaternion) || record.rotationQuaternion.length !== 4) {
    throw new Error(`${fieldName}.rotationQuaternion must contain exactly four numbers.`);
  }
  const rotationQuaternion: ModelQuaternion = [
    requiredFiniteNumber(record.rotationQuaternion[0], `${fieldName}.rotationQuaternion[0]`, -1, 1),
    requiredFiniteNumber(record.rotationQuaternion[1], `${fieldName}.rotationQuaternion[1]`, -1, 1),
    requiredFiniteNumber(record.rotationQuaternion[2], `${fieldName}.rotationQuaternion[2]`, -1, 1),
    requiredFiniteNumber(record.rotationQuaternion[3], `${fieldName}.rotationQuaternion[3]`, -1, 1),
  ];
  const magnitude = Math.hypot(...rotationQuaternion);
  if (Math.abs(magnitude - 1) > 1e-4) {
    throw new Error(`${fieldName}.rotationQuaternion must be normalized.`);
  }
  return {
    translationMetres,
    rotationQuaternion,
    scale: requiredVector3(record.scale, `${fieldName}.scale`, true),
  };
}

function createAssemblyChildAssetRef(
  value: unknown,
  resolutionId: string,
  candidateId: string,
  fieldName: string,
): ModelAssemblyChildAssetRef {
  const record = assertRecord(value, fieldName);
  if (record.disposition !== "staged-derived") {
    const catalogRef = createModelAssetRef(value);
    if (catalogRef.kind !== "leaf") {
      throw new Error("ModelProcessingManifest v1 assembly child assetRef values must be leaf assets.");
    }
    return catalogRef;
  }
  assertAllowedKeys(record, [
    "disposition",
    "derivedId",
    "kind",
    "contentHash",
    "processingManifestUri",
  ], fieldName);
  if (record.kind !== "leaf") {
    throw new Error("ModelProcessingManifest staged-derived child assetRef kind must be leaf.");
  }
  const derivedId = requiredModelPathSegment(record.derivedId, `${fieldName}.derivedId`);
  const processingManifestUri = assertModelUri(
    record.processingManifestUri,
    `${fieldName}.processingManifestUri`,
  );
  const expectedUri = `mcp://models/resolutions/${resolutionId}/candidates/${candidateId}/children/${derivedId}/manifest`;
  if (processingManifestUri !== expectedUri) {
    throw new Error(`${fieldName}.processingManifestUri must match the staged child identity.`);
  }
  return {
    disposition: "staged-derived",
    derivedId,
    kind: "leaf",
    contentHash: requiredSha256(record.contentHash, `${fieldName}.contentHash`),
    processingManifestUri,
  };
}

function createAssemblyChild(
  value: unknown,
  index: number,
  resolutionId: string,
  candidateId: string,
): ModelAssemblyChild {
  const fieldName = `ModelProcessingManifest.children[${index}]`;
  const record = assertRecord(value, fieldName);
  assertAllowedKeys(record, ["instanceId", "parentInstanceId", "assetRef", "transform"], fieldName);
  const instanceId = requiredToken(record.instanceId, `${fieldName}.instanceId`);
  const parentInstanceId = record.parentInstanceId === undefined
    ? undefined
    : requiredToken(record.parentInstanceId, `${fieldName}.parentInstanceId`);
  const childAssetRef = createAssemblyChildAssetRef(
    record.assetRef,
    resolutionId,
    candidateId,
    `${fieldName}.assetRef`,
  );
  return {
    instanceId,
    ...(parentInstanceId === undefined ? {} : { parentInstanceId }),
    assetRef: childAssetRef,
    transform: createTransform(record.transform, `${fieldName}.transform`),
  };
}

function createDiagnostic(
  value: unknown,
  fieldName: string,
): ModelConverterDiagnostic {
  const record = assertRecord(value, fieldName);
  assertAllowedKeys(record, ["severity", "code", "message"], fieldName);
  return {
    severity: requiredEnum(record.severity, ["info", "warning", "blocking"], `${fieldName}.severity`),
    code: requiredToken(record.code, `${fieldName}.code`),
    message: requiredString(record.message, `${fieldName}.message`, 1024),
  };
}

function createConverterEvidence(value: unknown): ModelConverterEvidence {
  const record = assertRecord(value, "ModelProcessingManifest.converter");
  assertAllowedKeys(record, [
    "id",
    "version",
    "sourceFormat",
    "targetFormat",
    "sourceContentHash",
    "outputContentHash",
    "diagnostics",
    "losses",
  ], "ModelProcessingManifest.converter");
  if (!Array.isArray(record.diagnostics) || record.diagnostics.length > 100) {
    throw new Error("ModelProcessingManifest.converter.diagnostics must be a bounded array.");
  }
  if (!Array.isArray(record.losses) || record.losses.length > 100) {
    throw new Error("ModelProcessingManifest.converter.losses must be a bounded array.");
  }
  return {
    id: requiredToken(record.id, "ModelProcessingManifest.converter.id"),
    version: assetVersion(record.version, "ModelProcessingManifest.converter.version"),
    sourceFormat: requiredToken(record.sourceFormat, "ModelProcessingManifest.converter.sourceFormat"),
    targetFormat: requiredToken(record.targetFormat, "ModelProcessingManifest.converter.targetFormat"),
    sourceContentHash: requiredSha256(record.sourceContentHash, "ModelProcessingManifest.converter.sourceContentHash"),
    outputContentHash: requiredSha256(record.outputContentHash, "ModelProcessingManifest.converter.outputContentHash"),
    diagnostics: record.diagnostics.map((item, index) =>
      createDiagnostic(item, `ModelProcessingManifest.converter.diagnostics[${index}]`)),
    losses: record.losses.map((item, index) =>
      createDiagnostic(item, `ModelProcessingManifest.converter.losses[${index}]`)),
  };
}

function createFidelityEvidence(value: unknown, index: number): ModelFidelityEvidence {
  const fieldName = `ModelProcessingManifest.fidelityEvidence[${index}]`;
  const record = assertRecord(value, fieldName);
  assertAllowedKeys(record, ["aspect", "outcome", "message", "evidenceResource"], fieldName);
  const evidenceResource = record.evidenceResource === undefined
    ? undefined
    : createModelResourceRef(record.evidenceResource);
  return {
    aspect: requiredEnum(
      record.aspect,
      ["geometry", "materials", "textures", "rigging", "animation", "metadata"],
      `${fieldName}.aspect`,
    ),
    outcome: requiredEnum(record.outcome, ["preserved", "approximated", "lost"], `${fieldName}.outcome`),
    message: requiredString(record.message, `${fieldName}.message`, 1024),
    ...(evidenceResource === undefined ? {} : { evidenceResource }),
  };
}

function createCollisionPolicyEvidence(
  value: unknown,
  collision: ModelCollisionRecord,
): ModelCollisionPolicyEvidence {
  const record = assertRecord(value, "ModelProcessingManifest.collisionPolicy");
  assertAllowedKeys(record, [
    "profileId",
    "profileVersion",
    "disposition",
    "category",
    "decisionToken",
  ], "ModelProcessingManifest.collisionPolicy");
  const disposition = requiredEnum(
    record.disposition,
    ["proxy-required", "none-allowed"] as const,
    "ModelProcessingManifest.collisionPolicy.disposition",
  );
  if (
    (collision.kind === "none" && disposition !== "none-allowed")
    || (collision.kind !== "none" && disposition !== "proxy-required")
  ) {
    throw new Error("ModelProcessingManifest collisionPolicy must explicitly authorize collision none or require a proxy.");
  }
  return {
    profileId: requiredToken(record.profileId, "ModelProcessingManifest.collisionPolicy.profileId"),
    profileVersion: assetVersion(
      record.profileVersion,
      "ModelProcessingManifest.collisionPolicy.profileVersion",
    ),
    disposition,
    category: requiredToken(record.category, "ModelProcessingManifest.collisionPolicy.category"),
    decisionToken: requiredAttestationToken(
      record.decisionToken,
      "ModelProcessingManifest.collisionPolicy.decisionToken",
    ),
  };
}

function createFidelityGateEvidence(
  value: unknown,
  fidelityEvidence: readonly ModelFidelityEvidence[],
  converter: ModelConverterEvidence,
): ModelFidelityGateEvidence {
  const record = assertRecord(value, "ModelProcessingManifest.fidelityGate");
  assertAllowedKeys(record, [
    "profileId",
    "profileVersion",
    "outcome",
    "requiredAspects",
    "evaluatedAt",
    "decisionToken",
  ], "ModelProcessingManifest.fidelityGate");
  const expectedAspects = ["geometry", "materials", "textures"] as const;
  if (
    !Array.isArray(record.requiredAspects)
    || record.requiredAspects.length !== expectedAspects.length
    || record.requiredAspects.some((aspect, index) => aspect !== expectedAspects[index])
  ) {
    throw new Error("ModelProcessingManifest.fidelityGate.requiredAspects must be geometry, materials, textures.");
  }
  const byAspect = new Map(fidelityEvidence.map((evidence) => [evidence.aspect, evidence]));
  if (expectedAspects.some((aspect) => !byAspect.has(aspect))) {
    throw new Error("ModelProcessingManifest fidelityEvidence must cover geometry, materials, and textures.");
  }
  const hasBlockingConverterEvidence = [
    ...converter.diagnostics,
    ...converter.losses,
  ].some((evidence) => evidence.severity === "blocking");
  const geometryLost = byAspect.get("geometry")?.outcome === "lost";
  const hasWarningLoss = converter.losses.some((loss) => loss.severity === "warning");
  const hasUnresolvedFidelity = expectedAspects.some(
    (aspect) => byAspect.get(aspect)?.outcome !== "preserved",
  ) || hasWarningLoss;
  const derivedOutcome: ModelFidelityGateEvidence["outcome"] =
    hasBlockingConverterEvidence || geometryLost
      ? "blocked"
      : hasUnresolvedFidelity
        ? "low-only"
        : "passed";
  const outcome = requiredEnum(
    record.outcome,
    ["passed", "low-only", "blocked"] as const,
    "ModelProcessingManifest.fidelityGate.outcome",
  );
  if (outcome !== derivedOutcome) {
    throw new Error("ModelProcessingManifest fidelityGate outcome must match converter and fidelity evidence.");
  }
  return {
    profileId: requiredToken(record.profileId, "ModelProcessingManifest.fidelityGate.profileId"),
    profileVersion: assetVersion(record.profileVersion, "ModelProcessingManifest.fidelityGate.profileVersion"),
    outcome,
    requiredAspects: expectedAspects,
    evaluatedAt: requiredTimestamp(record.evaluatedAt, "ModelProcessingManifest.fidelityGate.evaluatedAt"),
    decisionToken: requiredAttestationToken(
      record.decisionToken,
      "ModelProcessingManifest.fidelityGate.decisionToken",
    ),
  };
}

function assertCoordinateSystem(value: unknown): void {
  if (value === undefined) {
    return;
  }
  const record = assertRecord(value, "ModelProcessingManifest.coordinateSystem");
  assertAllowedKeys(record, [
    "unit",
    "upAxis",
    "forwardAxis",
    "origin",
    "outwardFaceWinding",
  ], "ModelProcessingManifest.coordinateSystem");
  if (
    record.unit !== CANONICAL_MODEL_COORDINATE_SYSTEM.unit
    || record.upAxis !== CANONICAL_MODEL_COORDINATE_SYSTEM.upAxis
    || record.forwardAxis !== CANONICAL_MODEL_COORDINATE_SYSTEM.forwardAxis
    || record.origin !== CANONICAL_MODEL_COORDINATE_SYSTEM.origin
    || record.outwardFaceWinding !== CANONICAL_MODEL_COORDINATE_SYSTEM.outwardFaceWinding
  ) {
    throw new Error(
      "ModelProcessingManifest.coordinateSystem must be metres, Y-up, -Z forward, floor-centred, and counter-clockwise outward.",
    );
  }
}

function assertCandidateResourceScope(
  uri: string,
  resolutionId: string,
  candidateId: string,
  fieldName: string,
): void {
  const expectedPrefix = `mcp://models/resolutions/${resolutionId}/candidates/${candidateId}/`;
  if (!uri.startsWith(expectedPrefix)) {
    throw new Error(`${fieldName} must be scoped to resolution ${resolutionId} and candidate ${candidateId}.`);
  }
}

function assertAssemblyHierarchy(children: readonly ModelAssemblyChild[]): void {
  const byId = new Map(children.map((child) => [child.instanceId, child]));
  for (const child of children) {
    if (child.parentInstanceId === undefined) {
      continue;
    }
    if (child.parentInstanceId === child.instanceId) {
      throw new Error("ModelProcessingManifest assembly children must not parent themselves.");
    }
    if (!byId.has(child.parentInstanceId)) {
      throw new Error("ModelProcessingManifest assembly parentInstanceId values must reference existing children.");
    }
  }
  const maximumDepth = 16;
  for (const child of children) {
    const visited = new Set<string>();
    let current: ModelAssemblyChild | undefined = child;
    let depth = 0;
    while (current?.parentInstanceId !== undefined) {
      if (visited.has(current.instanceId)) {
        throw new Error("ModelProcessingManifest assembly hierarchy must not contain cycles.");
      }
      visited.add(current.instanceId);
      depth += 1;
      if (depth > maximumDepth) {
        throw new Error(`ModelProcessingManifest assembly hierarchy depth must not exceed ${maximumDepth}.`);
      }
      current = byId.get(current.parentInstanceId);
    }
  }
}

/** Validate and deeply freeze a canonical processing manifest. */
export function createModelProcessingManifest(input: unknown): ModelProcessingManifest {
  const record = assertRecord(input, "ModelProcessingManifest");
  assertAllowedKeys(record, [
    "contractVersion",
    "manifestId",
    "resolutionId",
    "candidateId",
    "kind",
    "contentHash",
    "closureHash",
    "coordinateSystem",
    "technicalProfile",
    "lods",
    "collision",
    "collisionPolicy",
    "children",
    "converter",
    "fidelityEvidence",
    "fidelityGate",
    "processedAt",
  ], "ModelProcessingManifest");
  assertContractVersion(record, "ModelProcessingManifest");
  const resolutionId = requiredModelPathSegment(
    record.resolutionId,
    "ModelProcessingManifest.resolutionId",
  );
  const candidateId = requiredModelPathSegment(
    record.candidateId,
    "ModelProcessingManifest.candidateId",
  );
  assertCoordinateSystem(record.coordinateSystem);
  const kind = requiredEnum(record.kind, MODEL_ASSET_KINDS, "ModelProcessingManifest.kind");
  const contentHash = requiredSha256(record.contentHash, "ModelProcessingManifest.contentHash");
  const closureHash = requiredSha256(record.closureHash, "ModelProcessingManifest.closureHash");
  if (kind === "leaf" && closureHash !== contentHash) {
    throw new Error("ModelProcessingManifest leaf closureHash must match contentHash.");
  }
  const technicalProfile = createModelTechnicalProfile(record.technicalProfile);
  const [minimumX, minimumY, minimumZ] = technicalProfile.boundsMetres.min;
  const [maximumX, , maximumZ] = technicalProfile.boundsMetres.max;
  if (
    Math.abs(minimumY) > MODEL_CANONICAL_ORIGIN_TOLERANCE_METRES
    || Math.abs((minimumX + maximumX) / 2) > MODEL_CANONICAL_ORIGIN_TOLERANCE_METRES
    || Math.abs((minimumZ + maximumZ) / 2) > MODEL_CANONICAL_ORIGIN_TOLERANCE_METRES
  ) {
    throw new Error(
      "ModelProcessingManifest floor-centred origin requires minY and the X/Z bounds centre to be zero.",
    );
  }
  if (!Array.isArray(record.lods) || record.lods.length < 1 || record.lods.length > 4) {
    throw new Error("ModelProcessingManifest.lods must contain one to four adaptive levels beginning with LOD0.");
  }
  const lods = record.lods.map(createLodRecord);
  for (const [index, lod] of lods.entries()) {
    if (lod.level !== index) {
      throw new Error("ModelProcessingManifest LOD levels must be contiguous and begin with LOD0.");
    }
    if (index > 0 && lod.triangleCount > lods[index - 1]!.triangleCount) {
      throw new Error("ModelProcessingManifest LOD triangle counts must be monotonic non-increasing.");
    }
    if (index > 0 && lod.geometricErrorMetres < lods[index - 1]!.geometricErrorMetres) {
      throw new Error("ModelProcessingManifest LOD geometric error must be monotonic non-decreasing.");
    }
    if (index === 0 && lod.geometricErrorMetres !== 0) {
      throw new Error("ModelProcessingManifest LOD0 geometric error must be zero.");
    }
    if (index > 0 && lod.triangleCount > Math.floor(lods[index - 1]!.triangleCount * 0.7)) {
      throw new Error("ModelProcessingManifest retained LODs must reduce the preceding level by at least 30%.");
    }
    if (index > 0 && lod.triangleCount < 512) {
      throw new Error("ModelProcessingManifest retained LODs must contain at least 512 triangles.");
    }
  }
  if (new Set(lods.map((lod) => lod.resource.uri)).size !== lods.length) {
    throw new Error("ModelProcessingManifest LOD resources must be unique.");
  }
  if (new Set(lods.map((lod) => lod.resource.sha256)).size !== lods.length) {
    throw new Error("ModelProcessingManifest LOD resource sha256 hashes must be unique.");
  }
  if (technicalProfile.lodCount !== lods.length) {
    throw new Error("ModelProcessingManifest technicalProfile.lodCount must match lods.");
  }
  if (technicalProfile.triangleCount !== lods[0]!.triangleCount) {
    throw new Error("ModelProcessingManifest technicalProfile.triangleCount must match LOD0.");
  }
  if (
    lods[0]!.resource.sha256 !== contentHash
    || lods[0]!.resource.byteLength !== technicalProfile.byteLength
  ) {
    throw new Error(
      "ModelProcessingManifest LOD0 sha256/byteLength must match contentHash and technicalProfile.byteLength.",
    );
  }
  for (const [index, lod] of lods.entries()) {
    assertCandidateResourceScope(
      lod.resource.uri,
      resolutionId,
      candidateId,
      `ModelProcessingManifest.lods[${index}].resource`,
    );
  }
  const collision = createCollisionRecord(record.collision);
  const collisionPolicy = createCollisionPolicyEvidence(record.collisionPolicy, collision);
  if (technicalProfile.hasCollision !== (collision.kind !== "none")) {
    throw new Error("ModelProcessingManifest technicalProfile.hasCollision must match collision evidence.");
  }
  if (
    collision.resource !== undefined
    && lods.some((lod) =>
      lod.resource.uri === collision.resource?.uri
      || lod.resource.sha256 === collision.resource?.sha256)
  ) {
    throw new Error("ModelProcessingManifest collision evidence must be separate and distinct from LOD resources.");
  }
  if (collision.resource !== undefined) {
    assertCandidateResourceScope(
      collision.resource.uri,
      resolutionId,
      candidateId,
      "ModelProcessingManifest.collision.resource",
    );
  }
  if (!Array.isArray(record.children) || record.children.length > 256) {
    throw new Error("ModelProcessingManifest.children must be a bounded array.");
  }
  const children = record.children.map((child, index) =>
    createAssemblyChild(child, index, resolutionId, candidateId));
  if (kind === "leaf" && children.length !== 0) {
    throw new Error("ModelProcessingManifest leaf models must not contain assembly children.");
  }
  if (kind === "leaf" && technicalProfile.partitionCount !== 1) {
    throw new Error("ModelProcessingManifest leaf models must have exactly one partition.");
  }
  if (kind === "assembly" && children.length === 0) {
    throw new Error("ModelProcessingManifest assembly models require at least one child.");
  }
  if (new Set(children.map((child) => child.instanceId)).size !== children.length) {
    throw new Error("ModelProcessingManifest assembly instanceId values must be unique.");
  }
  assertAssemblyHierarchy(children);
  const converter = createConverterEvidence(record.converter);
  if (converter.targetFormat !== "glb") {
    throw new Error("ModelProcessingManifest converter.targetFormat must be glb.");
  }
  if (converter.outputContentHash !== contentHash) {
    throw new Error("ModelProcessingManifest converter outputContentHash must match contentHash.");
  }
  if (!Array.isArray(record.fidelityEvidence) || record.fidelityEvidence.length > 100) {
    throw new Error("ModelProcessingManifest.fidelityEvidence must be a bounded array.");
  }
  const fidelityEvidence = record.fidelityEvidence.map(createFidelityEvidence);
  if (new Set(fidelityEvidence.map((evidence) => evidence.aspect)).size !== fidelityEvidence.length) {
    throw new Error("ModelProcessingManifest fidelity evidence aspects must be unique.");
  }
  for (const [index, evidence] of fidelityEvidence.entries()) {
    if (evidence.evidenceResource !== undefined) {
      assertCandidateResourceScope(
        evidence.evidenceResource.uri,
        resolutionId,
        candidateId,
        `ModelProcessingManifest.fidelityEvidence[${index}].evidenceResource`,
      );
    }
  }
  const fidelityGate = createFidelityGateEvidence(record.fidelityGate, fidelityEvidence, converter);
  return deepFreeze({
    contractVersion: MODEL_RESOLUTION_CONTRACT_VERSION,
    manifestId: requiredToken(record.manifestId, "ModelProcessingManifest.manifestId"),
    resolutionId,
    candidateId,
    kind,
    contentHash,
    closureHash,
    coordinateSystem: CANONICAL_MODEL_COORDINATE_SYSTEM,
    technicalProfile,
    lods,
    collision,
    collisionPolicy,
    children,
    converter,
    fidelityEvidence,
    fidelityGate,
    processedAt: requiredTimestamp(record.processedAt, "ModelProcessingManifest.processedAt"),
  });
}

function modelCandidateEquivalent(left: ModelCandidate, right: ModelCandidate): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function finalAssetMatchesCandidate(
  finalAssetRef: ModelAssetRef,
  candidate: ModelCandidate,
): boolean {
  if (
    finalAssetRef.kind !== candidate.assetRef.kind
    || finalAssetRef.contentHash !== candidate.assetRef.contentHash
  ) {
    return false;
  }
  if (candidate.assetRef.disposition === "proposed") {
    return true;
  }
  return finalAssetRef.assetId === candidate.assetRef.asset.assetId
    && finalAssetRef.version === candidate.assetRef.asset.version
    && finalAssetRef.runtimeManifestUri === candidate.assetRef.asset.runtimeManifestUri;
}

function createModelPromotionReceipt(
  input: unknown,
  resolutionId: string,
  candidate: ModelCandidate,
  confirmation: ModelCandidateConfirmation,
  finalAssetRef: ModelAssetRef,
): ModelPromotionReceipt {
  if (candidate.assetRef.disposition !== "proposed") {
    throw new Error("ModelPromotionReceipt is only valid for a staged proposed candidate.");
  }
  const record = assertRecord(input, "ModelPromotionReceipt");
  assertAllowedKeys(record, [
    "contractVersion",
    "promotionId",
    "resolutionId",
    "candidateId",
    "proposalId",
    "confirmationId",
    "processingManifestId",
    "processingContentHash",
    "closureHash",
    "finalAssetRef",
    "promotedAt",
    "publicationToken",
  ], "ModelPromotionReceipt");
  assertContractVersion(record, "ModelPromotionReceipt");
  if (
    record.resolutionId !== resolutionId
    || record.candidateId !== candidate.candidateId
    || record.proposalId !== candidate.assetRef.proposalId
    || record.confirmationId !== confirmation.confirmationId
    || record.processingManifestId !== candidate.processingManifest.manifestId
    || record.processingContentHash !== candidate.processingManifest.contentHash
    || record.closureHash !== candidate.processingManifest.closureHash
  ) {
    throw new Error("ModelPromotionReceipt must bind the exact proposal, confirmation, manifest, and closure.");
  }
  const receiptAssetRef = createModelAssetRef(record.finalAssetRef);
  if (JSON.stringify(receiptAssetRef) !== JSON.stringify(finalAssetRef)) {
    throw new Error("ModelPromotionReceipt.finalAssetRef must match the completed finalAssetRef.");
  }
  return deepFreeze({
    contractVersion: MODEL_RESOLUTION_CONTRACT_VERSION,
    promotionId: requiredToken(record.promotionId, "ModelPromotionReceipt.promotionId"),
    resolutionId,
    candidateId: candidate.candidateId,
    proposalId: candidate.assetRef.proposalId,
    confirmationId: confirmation.confirmationId,
    processingManifestId: candidate.processingManifest.manifestId,
    processingContentHash: candidate.processingManifest.contentHash,
    closureHash: candidate.processingManifest.closureHash,
    finalAssetRef: receiptAssetRef,
    promotedAt: requiredTimestamp(record.promotedAt, "ModelPromotionReceipt.promotedAt"),
    publicationToken: requiredAttestationToken(
      record.publicationToken,
      "ModelPromotionReceipt.publicationToken",
    ),
  });
}

function numbersApproximatelyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= Math.max(1e-6, Math.abs(left) * 1e-6);
}

function evaluateNormalizedModelHardConstraints(
  request: ModelRequestSpec,
  profile: ModelTechnicalProfile,
): ModelHardConstraintEvaluation {
  const constraints = request.hardConstraints;
  const reasonCodes: string[] = [];
  if (
    constraints.boundsMetres !== undefined
    && (
      constraints.boundsMetres.min.some((axis, index) =>
        !numbersApproximatelyEqual(axis, profile.boundsMetres.min[index]!))
      || constraints.boundsMetres.max.some((axis, index) =>
        !numbersApproximatelyEqual(axis, profile.boundsMetres.max[index]!))
    )
  ) {
    reasonCodes.push("bounds-mismatch");
  }
  if (
    constraints.dimensionsMetres !== undefined
    && ![
      [constraints.dimensionsMetres.width, profile.dimensionsMetres.width],
      [constraints.dimensionsMetres.height, profile.dimensionsMetres.height],
      [constraints.dimensionsMetres.depth, profile.dimensionsMetres.depth],
    ].every(([expected, actual]) => numbersApproximatelyEqual(expected!, actual!))
  ) {
    reasonCodes.push("dimensions-mismatch");
  }
  if (constraints.maxTriangles !== undefined && profile.triangleCount > constraints.maxTriangles) {
    reasonCodes.push("triangle-budget-exceeded");
  }
  if (constraints.maxBytes !== undefined && profile.byteLength > constraints.maxBytes) {
    reasonCodes.push("model-byte-budget-exceeded");
  }
  if (
    constraints.maxTextureBytes !== undefined
    && profile.textureByteLength > constraints.maxTextureBytes
  ) {
    reasonCodes.push("texture-byte-budget-exceeded");
  }
  if (
    constraints.maxTextureDimensionPx !== undefined
    && profile.maxTextureDimensionPx > constraints.maxTextureDimensionPx
  ) {
    reasonCodes.push("texture-dimension-budget-exceeded");
  }
  if (
    constraints.maxPartitionCellMetres !== undefined
    && profile.partitionCellMetres > constraints.maxPartitionCellMetres
  ) {
    reasonCodes.push("partition-cell-budget-exceeded");
  }
  if (
    (constraints.lod === "required" && profile.lodCount < 2)
    || (constraints.lod === "forbidden" && profile.lodCount !== 1)
  ) {
    reasonCodes.push("lod-policy-failed");
  }
  if (
    (constraints.collision === "required" && !profile.hasCollision)
    || (constraints.collision === "forbidden" && profile.hasCollision)
  ) {
    reasonCodes.push("collision-policy-failed");
  }
  if (
    (constraints.partition === "single" && profile.partitionCount !== 1)
    || (constraints.partition === "required" && profile.partitionCount < 2)
  ) {
    reasonCodes.push("partition-policy-failed");
  }
  return deepFreeze({ pass: reasonCodes.length === 0, reasonCodes });
}

/**
 * Deterministically evaluate a normalized request against technical facts before
 * constructing a full candidate.
 */
export function evaluateModelHardConstraintsForProfile(
  requestInput: ModelRequestSpec,
  profileInput: ModelTechnicalProfile,
): ModelHardConstraintEvaluation {
  const request = createModelRequestSpec(requestInput);
  const profile = createModelTechnicalProfile(profileInput);
  return evaluateNormalizedModelHardConstraints(request, profile);
}

/** Deterministically evaluate every normalized request hard constraint against a candidate. */
export function evaluateModelHardConstraints(
  requestInput: ModelRequestSpec,
  candidateInput: ModelCandidate,
): ModelHardConstraintEvaluation {
  const request = createModelRequestSpec(requestInput);
  const candidate = createModelCandidate(candidateInput);
  return evaluateModelHardConstraintsForProfile(request, candidate.technicalProfile);
}

/** Return whether an unknown value is an exact resolution state. */
export function isModelResolutionState(value: unknown): value is ModelResolutionState {
  return typeof value === "string" && MODEL_RESOLUTION_STATES.includes(value as ModelResolutionState);
}

/** Validate and deeply freeze an asynchronous model-resolution record. */
export function createModelResolution(input: unknown): ModelResolution {
  const record = assertRecord(input, "ModelResolution");
  assertAllowedKeys(record, [
    "contractVersion",
    "resolutionId",
    "request",
    "attempts",
    "state",
    "candidates",
    "bestCandidate",
    "confirmation",
    "promotionReceipt",
    "refinementQuestions",
    "finalAssetRef",
    "stateReasonCode",
    "createdAt",
    "updatedAt",
  ], "ModelResolution");
  assertContractVersion(record, "ModelResolution");
  const resolutionId = requiredModelPathSegment(record.resolutionId, "ModelResolution.resolutionId");
  const request = createModelRequestSpec(record.request);
  const createdAt = requiredTimestamp(record.createdAt, "ModelResolution.createdAt");
  const updatedAt = requiredTimestamp(record.updatedAt, "ModelResolution.updatedAt");
  if (Date.parse(updatedAt) < Date.parse(createdAt)) {
    throw new Error("ModelResolution.updatedAt must not precede createdAt.");
  }
  const state = requiredEnum(record.state, MODEL_RESOLUTION_STATES, "ModelResolution.state");
  if (!Array.isArray(record.candidates) || record.candidates.length > MAX_CANDIDATES) {
    throw new Error(`ModelResolution.candidates must contain at most ${MAX_CANDIDATES} items.`);
  }
  const candidates = record.candidates.map(createModelCandidate);
  if (new Set(candidates.map((candidate) => candidate.candidateId)).size !== candidates.length) {
    throw new Error("ModelResolution candidateId values must be unique.");
  }
  if (new Set(candidates.map((candidate) => candidate.confirmationToken)).size !== candidates.length) {
    throw new Error("ModelResolution candidate confirmationToken values must be unique.");
  }
  for (const candidate of candidates) {
    if (candidate.resolutionId !== resolutionId) {
      throw new Error("ModelResolution candidates must be scoped to the resolutionId.");
    }
    if (JSON.stringify(candidate.match.request) !== JSON.stringify(request)) {
      throw new Error("ModelResolution candidate match assessments must bind the immutable request revision.");
    }
    const evaluation = evaluateModelHardConstraints(request, candidate);
    if (candidate.match.hardConstraintPass !== evaluation.pass) {
      throw new Error("ModelResolution candidate hardConstraintPass must match deterministic evaluation.");
    }
    if (evaluation.reasonCodes.some((reasonCode) => !candidate.match.reasonCodes.includes(reasonCode))) {
      throw new Error("ModelResolution candidate match reasonCodes must include every failed hard constraint.");
    }
    const evidenceTimes = [
      candidate.provenance.capturedAt,
      candidate.rights.reviewedAt,
      candidate.processingManifest.processedAt,
      candidate.processingManifest.fidelityGate.evaluatedAt,
      candidate.renderEvidence.renderedAt,
      ...candidate.hardGates.map((gate) => gate.evaluatedAt),
    ];
    if (evidenceTimes.some((timestamp) => Date.parse(timestamp) > Date.parse(updatedAt))) {
      throw new Error("ModelResolution candidate evidence timestamps must not exceed updatedAt.");
    }
  }
  let bestCandidate: ModelCandidate | undefined;
  if (record.bestCandidate !== undefined) {
    const requestedBest = createModelCandidate(record.bestCandidate);
    bestCandidate = candidates.find((candidate) => candidate.candidateId === requestedBest.candidateId);
    if (bestCandidate === undefined || !modelCandidateEquivalent(bestCandidate, requestedBest)) {
      throw new Error("ModelResolution.bestCandidate must exactly match a candidate.");
    }
  }
  if (["awaiting-confirmation", "promoting", "completed"].includes(state) && bestCandidate === undefined) {
    throw new Error(`ModelResolution ${state} state requires bestCandidate.`);
  }
  if (
    ["awaiting-confirmation", "promoting", "completed"].includes(state)
    && bestCandidate !== undefined
    && !isModelCandidateConfirmable(bestCandidate)
  ) {
    throw new Error(
      `ModelResolution ${state} bestCandidate must pass hard, assurance, rights, and view gates.`,
    );
  }
  let confirmation: ModelCandidateConfirmation | undefined;
  if (record.confirmation !== undefined) {
    if (bestCandidate === undefined) {
      throw new Error("ModelResolution confirmation requires bestCandidate.");
    }
    confirmation = createModelCandidateConfirmation(record.confirmation, bestCandidate, resolutionId);
    if (
      Date.parse(confirmation.confirmedAt) < Date.parse(createdAt)
      || Date.parse(confirmation.confirmedAt) > Date.parse(updatedAt)
    ) {
      throw new Error("ModelResolution confirmation.confirmedAt must fall between createdAt and updatedAt.");
    }
  }
  if (["promoting", "completed"].includes(state) && confirmation === undefined) {
    throw new Error(`ModelResolution ${state} state requires confirmation evidence.`);
  }
  if (state === "awaiting-confirmation" && confirmation !== undefined) {
    throw new Error("ModelResolution awaiting-confirmation state must not already contain confirmation evidence.");
  }
  if (
    confirmation !== undefined
    && !["promoting", "completed", "failed", "cancelled"].includes(state)
  ) {
    throw new Error(`ModelResolution confirmation evidence is not allowed in ${state} state.`);
  }
  const refinementQuestions = record.refinementQuestions === undefined
    ? []
    : stringList(record.refinementQuestions, "ModelResolution.refinementQuestions", { maxItems: 3 });
  const stateReasonCode = record.stateReasonCode === undefined
    ? undefined
    : requiredToken(record.stateReasonCode, "ModelResolution.stateReasonCode");
  if (
    ["failed", "cancelled", "unresolved"].includes(state)
    && stateReasonCode === undefined
  ) {
    throw new Error(`ModelResolution ${state} state requires stateReasonCode.`);
  }
  if (
    state === "awaiting-confirmation"
    && bestCandidate?.match.assurance === "low"
    && refinementQuestions.length === 0
  ) {
    throw new Error("ModelResolution low-assurance bestCandidate requires refinementQuestions.");
  }
  const finalAssetRef = record.finalAssetRef === undefined
    ? undefined
    : createModelAssetRef(record.finalAssetRef);
  if (state === "completed" && finalAssetRef === undefined) {
    throw new Error("ModelResolution completed state requires finalAssetRef.");
  }
  if (state !== "completed" && finalAssetRef !== undefined) {
    throw new Error("ModelResolution finalAssetRef is only allowed for completed state.");
  }
  if (
    finalAssetRef !== undefined
    && bestCandidate !== undefined
    && !finalAssetMatchesCandidate(finalAssetRef, bestCandidate)
  ) {
    throw new Error("ModelResolution finalAssetRef must match bestCandidate kind, hash, and immutable identity.");
  }
  let promotionReceipt: ModelPromotionReceipt | undefined;
  if (record.promotionReceipt !== undefined) {
    if (
      state !== "completed"
      || bestCandidate === undefined
      || confirmation === undefined
      || finalAssetRef === undefined
    ) {
      throw new Error("ModelResolution promotionReceipt is only allowed for a completed staged promotion.");
    }
    promotionReceipt = createModelPromotionReceipt(
      record.promotionReceipt,
      resolutionId,
      bestCandidate,
      confirmation,
      finalAssetRef,
    );
    if (
      Date.parse(promotionReceipt.promotedAt) < Date.parse(confirmation.confirmedAt)
      || Date.parse(promotionReceipt.promotedAt) > Date.parse(updatedAt)
    ) {
      throw new Error("ModelResolution promotionReceipt.promotedAt must follow confirmation and not exceed updatedAt.");
    }
  }
  if (
    state === "completed"
    && bestCandidate?.assetRef.disposition === "proposed"
    && promotionReceipt === undefined
  ) {
    throw new Error("ModelResolution completed proposed candidates require a promotionReceipt.");
  }
  if (bestCandidate?.assetRef.disposition === "existing" && promotionReceipt !== undefined) {
    throw new Error("ModelResolution existing catalog selections must not include a promotionReceipt.");
  }
  return deepFreeze({
    contractVersion: MODEL_RESOLUTION_CONTRACT_VERSION,
    resolutionId,
    request,
    attempts: requiredInteger(record.attempts, "ModelResolution.attempts", 1, MAX_ATTEMPTS),
    state,
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

function createGeneratorSeed(value: unknown, fieldName: string): string {
  const seed = requiredString(value, fieldName, 128);
  if (seed.length < 8) {
    throw new Error(`${fieldName} must contain at least eight characters.`);
  }
  assertNoDirectUrl(seed, fieldName);
  return seed;
}

/** Validate and normalize an unknown generator request. */
export function createModelGeneratorRequest(input: unknown): ModelGeneratorRequest {
  const record = assertRecord(input, "ModelGeneratorRequest");
  assertAllowedKeys(record, [
    "generationId",
    "request",
    "budgets",
    "seed",
    "deadline",
  ], "ModelGeneratorRequest");
  const budgets = assertRecord(record.budgets, "ModelGeneratorRequest.budgets");
  assertAllowedKeys(budgets, [
    "maxDurationMs",
    "maxTriangles",
    "maxBytes",
    "maxTextureBytes",
    "maxTextureDimensionPx",
  ], "ModelGeneratorRequest.budgets");
  const seed = createGeneratorSeed(record.seed, "ModelGeneratorRequest.seed");
  const maxBytes = requiredInteger(
    budgets.maxBytes,
    "ModelGeneratorRequest budget maxBytes",
    1,
    10_000_000_000,
  );
  const maxTextureBytes = requiredInteger(
    budgets.maxTextureBytes,
    "ModelGeneratorRequest budget maxTextureBytes",
    1,
    10_000_000_000,
  );
  if (maxTextureBytes > maxBytes) {
    throw new Error("ModelGeneratorRequest maxTextureBytes must not exceed maxBytes.");
  }
  return deepFreeze({
    generationId: requiredModelPathSegment(record.generationId, "ModelGeneratorRequest.generationId"),
    request: createModelRequestSpec(record.request),
    budgets: {
      maxDurationMs: requiredInteger(budgets.maxDurationMs, "ModelGeneratorRequest budget maxDurationMs", 1, 300_000),
      maxTriangles: requiredInteger(budgets.maxTriangles, "ModelGeneratorRequest budget maxTriangles", 1, 10_000_000),
      maxBytes,
      maxTextureBytes,
      maxTextureDimensionPx: requiredInteger(budgets.maxTextureDimensionPx, "ModelGeneratorRequest budget maxTextureDimensionPx", 1, 32_768),
    },
    seed,
    deadline: requiredTimestamp(record.deadline, "ModelGeneratorRequest.deadline"),
  });
}

const MODEL_GENERATOR_ARTIFACT_ROLES = [
  "model-entrypoint",
  "model-dependency",
  "binary",
  "texture",
  "metadata",
] as const;

const MODEL_GENERATOR_BUDGET_NAMES = [
  "maxDurationMs",
  "maxTriangles",
  "maxBytes",
  "maxTextureBytes",
  "maxTextureDimensionPx",
] as const;

const MODEL_GENERATOR_REASON_RETRYABILITY: Readonly<Record<string, boolean>> = Object.freeze({
  "capacity-unavailable": true,
  "provider-unavailable": true,
  "authentication-required": true,
  "rate-limited": true,
  "unsupported-request": false,
  "provider-failed": true,
  "invalid-generator-output": false,
  "internal-failure": true,
  "caller-aborted": false,
  "deadline-exceeded": true,
  superseded: false,
  "service-shutdown": true,
});

function assertGeneratorRetryability(reasonCode: string, retryable: boolean): void {
  if (MODEL_GENERATOR_REASON_RETRYABILITY[reasonCode] !== retryable) {
    throw new Error(`ModelGeneratorResult retryable must match stable reason ${reasonCode}.`);
  }
}

function createModelGeneratorArtifact(value: unknown, index: number): ModelGeneratorArtifact {
  const fieldName = `ModelGeneratorResult.sourceBundle.artifacts[${index}]`;
  const record = assertRecord(value, fieldName);
  assertAllowedKeys(record, [
    "uri",
    "byteLength",
    "sha256",
    "contentType",
    "role",
    "textureByteLength",
    "maxTextureDimensionPx",
  ], fieldName);
  const resource = createModelResourceRef({
    uri: record.uri,
    byteLength: record.byteLength,
    sha256: record.sha256,
    contentType: record.contentType,
  });
  const role = requiredEnum(record.role, MODEL_GENERATOR_ARTIFACT_ROLES, `${fieldName}.role`);
  const compatibleContentTypes: Readonly<Record<ModelGeneratorArtifactRole, readonly string[]>> = {
    "model-entrypoint": ["model/gltf-binary", "model/gltf+json"],
    "model-dependency": ["model/gltf-binary", "model/gltf+json"],
    binary: ["application/octet-stream"],
    texture: ["image/png", "image/jpeg", "image/webp", "image/ktx2"],
    metadata: ["application/json"],
  };
  if (!compatibleContentTypes[role].includes(resource.contentType.toLowerCase())) {
    throw new Error(`${fieldName}.contentType is not compatible with artifact role ${role}.`);
  }
  const textureByteLength = requiredInteger(
    record.textureByteLength,
    `${fieldName}.textureByteLength`,
    0,
    resource.byteLength,
  );
  const maxTextureDimensionPx = requiredInteger(
    record.maxTextureDimensionPx,
    `${fieldName}.maxTextureDimensionPx`,
    0,
    32_768,
  );
  if ((textureByteLength === 0) !== (maxTextureDimensionPx === 0)) {
    throw new Error(`${fieldName} texture bytes and dimensions must both be zero or both positive.`);
  }
  if (role === "texture" && textureByteLength !== resource.byteLength) {
    throw new Error(`${fieldName} standalone texture bytes must equal artifact byteLength.`);
  }
  if (["binary", "metadata"].includes(role) && textureByteLength !== 0) {
    throw new Error(`${fieldName} non-model metadata/binary artifacts must not claim embedded textures.`);
  }
  return { ...resource, role, textureByteLength, maxTextureDimensionPx };
}

function createModelGeneratorUsage(value: unknown): ModelGeneratorUsage {
  const record = assertRecord(value, "ModelGeneratorResult.sourceBundle.usage");
  assertAllowedKeys(record, [
    "durationMs",
    "triangleCount",
    "byteLength",
    "textureByteLength",
    "maxTextureDimensionPx",
  ], "ModelGeneratorResult.sourceBundle.usage");
  const textureByteLength = requiredInteger(
    record.textureByteLength,
    "ModelGeneratorResult.sourceBundle.usage.textureByteLength",
    0,
    Number.MAX_SAFE_INTEGER,
  );
  const maxTextureDimensionPx = requiredInteger(
    record.maxTextureDimensionPx,
    "ModelGeneratorResult.sourceBundle.usage.maxTextureDimensionPx",
    0,
    32_768,
  );
  if ((textureByteLength === 0) !== (maxTextureDimensionPx === 0)) {
    throw new Error("ModelGeneratorResult texture usage bytes and dimensions must both be zero or both positive.");
  }
  return {
    durationMs: requiredInteger(record.durationMs, "ModelGeneratorResult.sourceBundle.usage.durationMs", 0, 300_000),
    triangleCount: requiredInteger(record.triangleCount, "ModelGeneratorResult.sourceBundle.usage.triangleCount", 1, 10_000_000),
    byteLength: requiredInteger(record.byteLength, "ModelGeneratorResult.sourceBundle.usage.byteLength", 1, Number.MAX_SAFE_INTEGER),
    textureByteLength,
    maxTextureDimensionPx,
  };
}

function createGeneratorTerminalEvidence(
  record: Record<string, unknown>,
  expected: ModelGeneratorRequest,
): ModelGeneratorTerminalEvidence {
  const generationId = requiredModelPathSegment(record.generationId, "ModelGeneratorResult.generationId");
  if (generationId !== expected.generationId) {
    throw new Error("ModelGeneratorResult.generationId must match the generator request.");
  }
  const diagnosticId = record.diagnosticId === undefined
    ? undefined
    : requiredToken(record.diagnosticId, "ModelGeneratorResult.diagnosticId");
  return {
    generationId,
    retryable: requiredBoolean(record.retryable, "ModelGeneratorResult.retryable"),
    occurredAt: requiredTimestamp(record.occurredAt, "ModelGeneratorResult.occurredAt"),
    ...(diagnosticId === undefined ? {} : { diagnosticId }),
  };
}

/** Validate and deeply freeze a request-bound generator outcome. */
export function createModelGeneratorResult(
  input: unknown,
  expectedRequest: ModelGeneratorRequest,
): ModelGeneratorResult {
  const expected = createModelGeneratorRequest(expectedRequest);
  const record = assertRecord(input, "ModelGeneratorResult");
  const status = requiredEnum(record.status, [
    "disabled",
    "generated",
    "unavailable",
    "failed",
    "cancelled",
    "budget-exceeded",
  ] as const, "ModelGeneratorResult.status");
  const generationId = requiredModelPathSegment(record.generationId, "ModelGeneratorResult.generationId");
  if (generationId !== expected.generationId) {
    throw new Error("ModelGeneratorResult.generationId must match the generator request.");
  }
  if (status === "disabled") {
    assertAllowedKeys(record, ["status", "generationId", "reasonCode"], "ModelGeneratorResult");
    if (record.reasonCode !== MODEL_GENERATOR_DISABLED_REASON_CODE) {
      throw new Error(
        `ModelGeneratorResult.reasonCode must be ${MODEL_GENERATOR_DISABLED_REASON_CODE}.`,
      );
    }
    return deepFreeze({
      status,
      generationId,
      reasonCode: MODEL_GENERATOR_DISABLED_REASON_CODE,
    });
  }

  if (status === "generated") {
    assertAllowedKeys(record, ["status", "generationId", "sourceBundle"], "ModelGeneratorResult");
    const sourceBundle = assertRecord(record.sourceBundle, "ModelGeneratorResult.sourceBundle");
    assertAllowedKeys(sourceBundle, [
      "bundleId",
      "generationId",
      "entrypointUri",
      "artifacts",
      "generator",
      "generatedAt",
      "seed",
      "context",
      "usage",
    ], "ModelGeneratorResult.sourceBundle");
    const bundleId = requiredModelPathSegment(sourceBundle.bundleId, "ModelGeneratorResult.sourceBundle.bundleId");
    const bundleGenerationId = requiredModelPathSegment(
      sourceBundle.generationId,
      "ModelGeneratorResult.sourceBundle.generationId",
    );
    if (bundleId !== generationId || bundleGenerationId !== generationId) {
      throw new Error("ModelGeneratorResult source bundle identifiers must match generationId.");
    }
    if (!Array.isArray(sourceBundle.artifacts) || sourceBundle.artifacts.length < 1 || sourceBundle.artifacts.length > 32) {
      throw new Error("ModelGeneratorResult.sourceBundle.artifacts must contain one to 32 internal resources.");
    }
    const artifacts = sourceBundle.artifacts.map(createModelGeneratorArtifact);
    if (new Set(artifacts.map((artifact) => artifact.uri)).size !== artifacts.length) {
      throw new Error("ModelGeneratorResult.sourceBundle.artifacts must have unique URIs.");
    }
    const namespace = `mcp://models/generations/${generationId}/source/`;
    if (artifacts.some((artifact) => !artifact.uri.startsWith(namespace))) {
      throw new Error("ModelGeneratorResult artifacts must remain inside the generation source namespace.");
    }
    const entrypointUri = assertModelUri(sourceBundle.entrypointUri, "ModelGeneratorResult.sourceBundle.entrypointUri");
    const entrypointArtifacts = artifacts.filter((artifact) => artifact.role === "model-entrypoint");
    if (
      entrypointArtifacts.length !== 1
      || entrypointArtifacts[0]?.uri !== entrypointUri
      || !artifacts.some((artifact) => artifact.uri === entrypointUri)
    ) {
      throw new Error("ModelGeneratorResult source bundle requires exactly one model-entrypoint matching entrypointUri.");
    }
    const generator = assertRecord(sourceBundle.generator, "ModelGeneratorResult.sourceBundle.generator");
    assertAllowedKeys(generator, ["id", "version"], "ModelGeneratorResult.sourceBundle.generator");
    const generatedAt = requiredTimestamp(sourceBundle.generatedAt, "ModelGeneratorResult.sourceBundle.generatedAt");
    if (Date.parse(generatedAt) > Date.parse(expected.deadline)) {
      throw new Error("ModelGeneratorResult generatedAt must not exceed the request deadline.");
    }
    const seed = createGeneratorSeed(sourceBundle.seed, "ModelGeneratorResult.sourceBundle.seed");
    if (seed !== expected.seed) {
      throw new Error("ModelGeneratorResult source bundle seed must match the generator request.");
    }
    const context = createModelGeneratorRequest(sourceBundle.context);
    if (JSON.stringify(context) !== JSON.stringify(expected)) {
      throw new Error("ModelGeneratorResult source bundle context must exactly match the generator request.");
    }
    const usage = createModelGeneratorUsage(sourceBundle.usage);
    const aggregateBytes = artifacts.reduce((total, artifact) => total + artifact.byteLength, 0);
    const textureBytes = artifacts.reduce(
      (total, artifact) => total + artifact.textureByteLength,
      0,
    );
    const maxTextureDimensionPx = Math.max(
      0,
      ...artifacts.map((artifact) => artifact.maxTextureDimensionPx),
    );
    if (!Number.isSafeInteger(aggregateBytes) || usage.byteLength !== aggregateBytes) {
      throw new Error("ModelGeneratorResult usage.byteLength must equal aggregate artifact bytes.");
    }
    if (usage.textureByteLength !== textureBytes) {
      throw new Error("ModelGeneratorResult usage.textureByteLength must equal texture artifact bytes.");
    }
    if (usage.maxTextureDimensionPx !== maxTextureDimensionPx) {
      throw new Error("ModelGeneratorResult usage.maxTextureDimensionPx must equal measured artifact texture dimensions.");
    }
    if (
      usage.durationMs > expected.budgets.maxDurationMs
      || usage.triangleCount > expected.budgets.maxTriangles
      || usage.byteLength > expected.budgets.maxBytes
      || usage.textureByteLength > expected.budgets.maxTextureBytes
      || usage.maxTextureDimensionPx > expected.budgets.maxTextureDimensionPx
    ) {
      throw new Error("ModelGeneratorResult generated usage exceeds the request budget.");
    }
    return deepFreeze({
      status,
      generationId,
      sourceBundle: {
        bundleId,
        generationId,
        entrypointUri,
        artifacts,
        generator: {
          id: requiredToken(generator.id, "ModelGeneratorResult.sourceBundle.generator.id"),
          version: assetVersion(generator.version, "ModelGeneratorResult.sourceBundle.generator.version"),
        },
        generatedAt,
        seed,
        context,
        usage,
      },
    });
  }

  const terminalAllowedKeys = [
    "status",
    "generationId",
    "reasonCode",
    "retryable",
    "occurredAt",
    "diagnosticId",
  ] as const;
  if (status === "budget-exceeded") {
    assertAllowedKeys(record, [...terminalAllowedKeys, "violations"], "ModelGeneratorResult");
    if (record.reasonCode !== "generator-budget-exceeded" || record.retryable !== false) {
      throw new Error("ModelGeneratorResult budget-exceeded must use its fixed reasonCode and retryable false.");
    }
    if (!Array.isArray(record.violations) || record.violations.length < 1 || record.violations.length > 5) {
      throw new Error("ModelGeneratorResult budget violations must contain one to five entries.");
    }
    const violations = record.violations.map((value, index): ModelGeneratorBudgetViolation => {
      const fieldName = `ModelGeneratorResult.violations[${index}]`;
      const violation = assertRecord(value, fieldName);
      assertAllowedKeys(violation, ["budget", "limit", "observed"], fieldName);
      const budget = requiredEnum(violation.budget, MODEL_GENERATOR_BUDGET_NAMES, `${fieldName}.budget`);
      const limit = requiredInteger(violation.limit, `${fieldName}.limit`, 0, Number.MAX_SAFE_INTEGER);
      const observed = requiredInteger(violation.observed, `${fieldName}.observed`, 0, Number.MAX_SAFE_INTEGER);
      if (limit !== expected.budgets[budget] || observed <= limit) {
        throw new Error(`${fieldName} limit must match the request budget and observed must exceed it.`);
      }
      return { budget, limit, observed };
    });
    if (new Set(violations.map((violation) => violation.budget)).size !== violations.length) {
      throw new Error("ModelGeneratorResult budget violation names must be unique.");
    }
    const terminal = createGeneratorTerminalEvidence(record, expected);
    return deepFreeze({
      status,
      ...terminal,
      reasonCode: "generator-budget-exceeded",
      retryable: false,
      violations,
    });
  }

  assertAllowedKeys(record, terminalAllowedKeys, "ModelGeneratorResult");
  const terminal = createGeneratorTerminalEvidence(record, expected);
  if (status === "unavailable") {
    const reasonCode = requiredEnum(record.reasonCode, [
      "capacity-unavailable",
      "provider-unavailable",
      "authentication-required",
      "rate-limited",
      "unsupported-request",
    ] as const, "ModelGeneratorResult.reasonCode");
    assertGeneratorRetryability(reasonCode, terminal.retryable);
    return deepFreeze({ status, ...terminal, reasonCode });
  }
  if (status === "failed") {
    const reasonCode = requiredEnum(record.reasonCode, [
      "provider-failed",
      "invalid-generator-output",
      "internal-failure",
    ] as const, "ModelGeneratorResult.reasonCode");
    assertGeneratorRetryability(reasonCode, terminal.retryable);
    return deepFreeze({ status, ...terminal, reasonCode });
  }
  const reasonCode = requiredEnum(record.reasonCode, [
    "caller-aborted",
    "deadline-exceeded",
    "superseded",
    "service-shutdown",
  ] as const, "ModelGeneratorResult.reasonCode");
  assertGeneratorRetryability(reasonCode, terminal.retryable);
  return deepFreeze({ status, ...terminal, reasonCode });
}

/** Create the fail-closed Phase 1 generator port; it never performs generation. */
export function createDisabledModelGeneratorPort(): ModelGeneratorPort {
  return Object.freeze({
    enabled: false,
    async generate(
      input: ModelGeneratorRequest,
      options: ModelGeneratorCallOptions = {},
    ): Promise<DisabledModelGeneratorResult> {
      if (options.signal !== undefined) {
        if (typeof options.signal.throwIfAborted !== "function") {
          throw new Error("ModelGeneratorPort signal must be an AbortSignal.");
        }
        options.signal.throwIfAborted();
      }
      const request = createModelGeneratorRequest(input);
      return deepFreeze({
        status: "disabled",
        generationId: request.generationId,
        reasonCode: MODEL_GENERATOR_DISABLED_REASON_CODE,
      });
    },
  });
}
