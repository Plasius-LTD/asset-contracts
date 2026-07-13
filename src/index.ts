import {
  GPU_SHADER_STORE_FEATURE_FLAG,
  GPU_SHADER_STYLE_SELECTION_CAPABILITY,
  SHADER_VALIDATION_EVIDENCE_VERSION,
  SUPPORTED_ADDITIVE_WEBGPU_MATRIX_POLICIES,
  SUPPORTED_STABLE_WEBGPU_MATRIX_POLICIES,
  canonicalizeGpuContract,
  computeSha256,
  parseGpuInterfaceManifest,
  parseJsonBytes,
  parseModelGpuCompatibilityDescriptor,
  parseShaderStyleProfileManifest,
  parseShaderVersionManifest,
} from "@plasius/gpu-shader";
import type {
  GpuInterfaceManifest,
  GpuInterfaceRef,
  ModelGpuCompatibilityDescriptor,
  ShaderStyleProfileManifest,
  ShaderStyleProfileRef,
  ShaderValidationEvidenceRef,
  ShaderVersionManifest,
  ShaderVersionRef,
  Sha256Hex,
} from "@plasius/gpu-shader";

export const ASSET_CONTRACTS_PACKAGE = "@plasius/asset-contracts";

export * from "./model-resolution.js";
export {
  GPU_SHADER_STORE_FEATURE_FLAG,
  GPU_SHADER_STYLE_SELECTION_CAPABILITY,
};
export type {
  GpuInterfaceManifest,
  GpuInterfaceRef,
  ModelGpuCompatibilityDescriptor,
  ShaderStyleProfileManifest,
  ShaderStyleProfileRef,
  ShaderValidationEvidenceRef,
  ShaderVersionManifest,
  ShaderVersionRef,
  Sha256Hex,
};
export const UNIFIED_ASSET_PIPELINE_FEATURE_FLAG_ID = "asset.pipeline.unified-ai-assets.enabled";
export const ASSET_PIPELINE_MCP_CAPABILITY = "asset.pipeline.mcp.manage";
export const ASSET_PIPELINE_REVIEW_CAPABILITY = "asset.pipeline.review.approve";

/** Canonical content type required for immutable WebGPU shader modules. */
export const ASSET_WGSL_CONTENT_TYPE = "text/wgsl; charset=utf-8" as const;
/** Canonical content type for JSON lifecycle artifacts. */
export const ASSET_JSON_CONTENT_TYPE = "application/json" as const;

/** Closed asset categories supported by the unified model-storage lifecycle. */
export const ASSET_KINDS = Object.freeze([
  "model",
  "gpu-interface",
  "shader",
  "shader-style-profile",
  "shader-validation-evidence",
] as const);

/** Legacy and GPU-specific roles for files inside one immutable asset version. */
export const ASSET_FILE_ROLES = Object.freeze([
  "model",
  "binary",
  "texture",
  "manifest",
  "screenshot",
  "metadata",
  "wgsl",
  "gpu-interface-manifest",
  "shader-manifest",
  "shader-style-profile-manifest",
  "shader-validation-evidence",
  "shader-validation-attestation",
  "shader-qualification-fixture",
  "shader-compile-unit-inventory",
  "shader-matrix",
] as const);

export const ASSET_JOB_STATES = Object.freeze([
  "requested",
  "intake-uploaded",
  "validated",
  "processing",
  "processed",
  "rendering-review",
  "reviewed",
  "awaiting-approval",
  "approved",
  "promoting",
  "promoted",
  "rejected",
  "failed",
  "rolled-back",
] as const);

export const ASSET_SOURCE_ADAPTERS = Object.freeze([
  "local-import",
  "ai-generate",
  "ai-modify",
  "texture-regenerate",
  "processor-retry",
] as const);

export const ASSET_SCREENSHOT_KINDS = Object.freeze([
  "hero",
  "front",
  "back",
  "left",
  "right",
  "top",
  "material-closeup",
  "wireframe-density",
  "normal-debug",
  "lod-comparison",
  "collision-proxy",
  "scale-reference",
] as const);

export const ASSET_REVIEW_SEVERITIES = Object.freeze([
  "info",
  "warning",
  "blocking",
] as const);

export const ASSET_PROMOTION_OUTCOMES = Object.freeze([
  "promoted",
  "rolled-back",
] as const);

export type AssetJobState = typeof ASSET_JOB_STATES[number];
export type AssetSourceAdapter = typeof ASSET_SOURCE_ADAPTERS[number];
export type AssetScreenshotKind = typeof ASSET_SCREENSHOT_KINDS[number];
export type AssetReviewSeverity = typeof ASSET_REVIEW_SEVERITIES[number];
export type AssetPromotionOutcome = typeof ASSET_PROMOTION_OUTCOMES[number];
export type AssetKind = typeof ASSET_KINDS[number];
export type AssetFileRole = typeof ASSET_FILE_ROLES[number];

export interface AssetFileDescriptor {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly contentType: string;
  readonly role: AssetFileRole;
  /** Required only for WGSL files; binds the Blob path to one shader module. */
  readonly moduleId?: string;
}

export interface AssetManifest {
  /** Omitted only by legacy callers created before typed asset lifecycles. */
  readonly assetKind?: AssetKind;
  readonly assetId: string;
  readonly version: string;
  readonly entrypoint: string;
  readonly files: readonly AssetFileDescriptor[];
  readonly sourceAdapter: AssetSourceAdapter;
  readonly createdAt: string;
}

/** Asset manifest with a required discriminator while legacy manifests remain valid. */
export interface TypedAssetManifest<K extends AssetKind> extends AssetManifest {
  readonly assetKind: K;
}

/** Model asset extended with its reflected GPU ABI and discoverable default style. */
export interface ModelAssetManifest extends TypedAssetManifest<"model"> {
  readonly gpuInterface: GpuInterfaceRef;
  readonly modelAbiHash: Sha256Hex;
  readonly providedSemantics: readonly string[];
  readonly defaultStyleProfile: ShaderStyleProfileRef | null;
}

/** Input permits a model to omit its default style while preserving explicit null output. */
export type ModelAssetManifestInput = Omit<ModelAssetManifest, "defaultStyleProfile"> & {
  readonly defaultStyleProfile?: ShaderStyleProfileRef | null;
};

/** Lifecycle envelope for one generated GPU-interface manifest. */
export interface GpuInterfaceAssetManifest extends TypedAssetManifest<"gpu-interface"> {
  readonly gpuInterfaceManifest: GpuInterfaceManifest;
}

/** Lifecycle envelope for one exact, independently versioned WGSL shader. */
export interface ShaderAssetManifest extends TypedAssetManifest<"shader"> {
  readonly shaderManifest: ShaderVersionManifest;
}

/** Lifecycle envelope for a profile that pins exact shader versions by render role. */
export interface ShaderStyleProfileAssetManifest extends TypedAssetManifest<"shader-style-profile"> {
  readonly styleProfileManifest: ShaderStyleProfileManifest;
}

/** Lifecycle envelope for universal matrix evidence and its external attestation reference. */
export interface ShaderValidationEvidenceAssetManifest extends TypedAssetManifest<"shader-validation-evidence"> {
  readonly validationEvidence: ShaderValidationEvidenceRef;
}

/** Post-storage inputs used to construct a non-self-referential interface ref. */
export interface GpuInterfaceRefInput {
  readonly manifest: GpuInterfaceManifest;
  readonly manifestBytes: Uint8Array;
  readonly manifestUri: string;
}

/** Post-storage inputs used to construct a non-self-referential shader ref. */
export interface ShaderVersionRefInput {
  readonly manifest: ShaderVersionManifest;
  readonly manifestBytes: Uint8Array;
  readonly manifestUri: string;
}

/** Post-storage inputs used to construct a non-self-referential style ref. */
export interface ShaderStyleProfileRefInput {
  readonly manifest: ShaderStyleProfileManifest;
  readonly manifestBytes: Uint8Array;
  readonly manifestUri: string;
}

/** Exact bytes supplied to a typed storage/promotion validation boundary. */
export interface GpuAssetFileValidationInput {
  readonly manifest: GpuAssetManifest;
  readonly files: ReadonlyMap<string, Uint8Array>;
}

/** All schema-driven GPU asset envelopes accepted by the storage pipeline. */
export type GpuAssetManifest =
  | ModelAssetManifest
  | GpuInterfaceAssetManifest
  | ShaderAssetManifest
  | ShaderStyleProfileAssetManifest
  | ShaderValidationEvidenceAssetManifest;

export interface AssetScreenshotPlanItem {
  readonly kind: AssetScreenshotKind;
  readonly label: string;
  readonly width: number;
  readonly height: number;
}

export interface AssetReviewFinding {
  readonly severity: AssetReviewSeverity;
  readonly code: string;
  readonly message: string;
  readonly artifactPath?: string;
  readonly evidenceUri?: string;
}

export interface AssetReviewReport {
  readonly assetId: string;
  readonly version: string;
  readonly passed: boolean;
  readonly findings: readonly AssetReviewFinding[];
  readonly reviewedAt: string;
}

export interface AssetJobRecord {
  readonly jobId: string;
  readonly assetId: string;
  readonly version: string;
  readonly state: AssetJobState;
  readonly sourceAdapter: AssetSourceAdapter;
  readonly requestedAt: string;
  readonly requestedBy: string;
  readonly featureFlagId: string;
  readonly requiredCapability?: string;
}

export interface AssetPromotionRecord<TManifest extends AssetManifest = AssetManifest> {
  readonly promotionId: string;
  readonly jobId: string;
  readonly assetId: string;
  readonly version: string;
  readonly sourceAdapter: AssetSourceAdapter;
  readonly outcome: AssetPromotionOutcome;
  readonly manifest: TManifest;
  readonly reviewReport: AssetReviewReport;
  readonly approvedBy: string;
  readonly approvedAt: string;
  readonly promotedAt: string;
  readonly runtimeChannel: string;
  readonly runtimeManifestUri: string;
  readonly rollbackOfVersion?: string;
}

const ASSET_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const VERSION_PATTERN = /^[0-9A-Za-z][0-9A-Za-z._-]{0,127}$/u;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const TOKEN_PATTERN = /^[0-9A-Za-z][0-9A-Za-z._:-]{0,127}$/u;
const ASSET_MANIFEST_KEYS = Object.freeze([
  "assetKind",
  "assetId",
  "version",
  "entrypoint",
  "files",
  "sourceAdapter",
  "createdAt",
] as const);

export function isAssetId(value: unknown): value is string {
  return typeof value === "string" && ASSET_ID_PATTERN.test(value);
}

export function normalizeAssetId(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-+|-+$/gu, "");
}

export function assertAssetId(value: unknown): string {
  if (!isAssetId(value)) {
    throw new Error("Asset id must use lowercase kebab-case letters and numbers.");
  }
  return value;
}

export function assertAssetVersion(value: unknown): string {
  if (typeof value !== "string" || !VERSION_PATTERN.test(value)) {
    throw new Error("Asset version must be a non-empty token up to 128 characters.");
  }
  return value;
}

export function isAssetSourceAdapter(value: unknown): value is AssetSourceAdapter {
  return ASSET_SOURCE_ADAPTERS.includes(value as AssetSourceAdapter);
}

export function isAssetKind(value: unknown): value is AssetKind {
  return ASSET_KINDS.includes(value as AssetKind);
}

export function isAssetFileRole(value: unknown): value is AssetFileRole {
  return ASSET_FILE_ROLES.includes(value as AssetFileRole);
}

export function isAssetJobState(value: unknown): value is AssetJobState {
  return ASSET_JOB_STATES.includes(value as AssetJobState);
}

export function isAssetPromotionOutcome(value: unknown): value is AssetPromotionOutcome {
  return ASSET_PROMOTION_OUTCOMES.includes(value as AssetPromotionOutcome);
}

export function createAssetFileDescriptor(input: AssetFileDescriptor): AssetFileDescriptor {
  assertRelativeAssetPath(input.path, "Asset file path");
  if (!Number.isInteger(input.byteLength) || input.byteLength < 0) {
    throw new Error("Asset file byteLength must be a non-negative integer.");
  }
  if (!SHA256_PATTERN.test(input.sha256)) {
    throw new Error("Asset file sha256 must be a lowercase 64-character digest.");
  }
  if (!input.contentType || input.contentType.trim() !== input.contentType) {
    throw new Error("Asset file contentType must be a non-empty canonical value.");
  }
  if (!isAssetFileRole(input.role)) {
    throw new Error("Asset file role is not supported.");
  }
  if (input.role === "wgsl") {
    assertGpuToken(input.moduleId, "Asset WGSL file moduleId");
  } else if (input.moduleId !== undefined) {
    throw new Error("Asset file moduleId is allowed only for WGSL files.");
  }
  return Object.freeze({ ...input });
}

export function createAssetManifest<TManifest extends AssetManifest>(input: TManifest): TManifest {
  if (input.assetKind !== undefined) {
    throw new Error("Typed assets require their specialized manifest factory.");
  }
  return createBaseAssetManifest(input);
}

function createBaseAssetManifest<TManifest extends AssetManifest>(input: TManifest): TManifest {
  assertAssetId(input.assetId);
  assertAssetVersion(input.version);
  if (input.assetKind !== undefined && !isAssetKind(input.assetKind)) {
    throw new Error("Asset manifest assetKind is not supported.");
  }
  if (!isAssetSourceAdapter(input.sourceAdapter)) {
    throw new Error("Asset manifest sourceAdapter is not supported.");
  }
  assertRelativeAssetPath(input.entrypoint, "Asset manifest entrypoint");
  const files = input.files.map(createAssetFileDescriptor);
  const filePaths = new Set(files.map((file) => file.path));
  if (filePaths.size !== files.length) {
    throw new Error("Asset manifest file paths must be unique.");
  }
  return Object.freeze({
    ...input,
    files: Object.freeze(files),
  }) as TManifest;
}

/**
 * Creates a model lifecycle manifest whose CPU-side ABI metadata is validated
 * against the canonical GPU-interface reference.
 */
export function createModelAssetManifest(input: ModelAssetManifestInput): ModelAssetManifest {
  assertExactKeys(input, [
    ...ASSET_MANIFEST_KEYS,
    "gpuInterface",
    "modelAbiHash",
    "providedSemantics",
    "defaultStyleProfile",
  ], "ModelAssetManifest");
  const base = createTypedAssetBase(input, "model", "model");
  assertAllowedFileRoles(base, [
    "model",
    "binary",
    "texture",
    "manifest",
    "screenshot",
    "metadata",
  ]);
  const descriptor = parseModelGpuCompatibilityDescriptor({
    modelId: base.assetId,
    version: base.version,
    gpuInterface: input.gpuInterface,
    modelAbiHash: input.modelAbiHash,
    providedSemantics: input.providedSemantics,
    defaultStyleProfile: input.defaultStyleProfile ?? null,
  });
  return Object.freeze({
    ...base,
    gpuInterface: descriptor.gpuInterface,
    modelAbiHash: descriptor.modelAbiHash,
    providedSemantics: descriptor.providedSemantics,
    defaultStyleProfile: descriptor.defaultStyleProfile,
  });
}

/** Creates a lifecycle envelope around a strictly parsed reflected interface. */
export function createGpuInterfaceAssetManifest(
  input: GpuInterfaceAssetManifest,
): GpuInterfaceAssetManifest {
  assertExactKeys(input, [
    ...ASSET_MANIFEST_KEYS,
    "gpuInterfaceManifest",
  ], "GpuInterfaceAssetManifest");
  const base = createTypedAssetBase(
    input,
    "gpu-interface",
    "gpu-interface-manifest",
    ASSET_JSON_CONTENT_TYPE,
  );
  assertAllowedFileRoles(base, ["gpu-interface-manifest"]);
  assertRoleCount(base, "gpu-interface-manifest", 1);
  const gpuInterfaceManifest = parseGpuInterfaceManifest(input.gpuInterfaceManifest);
  assertDomainIdentity(
    base,
    gpuInterfaceManifest.interfaceId,
    gpuInterfaceManifest.interfaceVersion,
    "GPU interface",
  );
  return Object.freeze({ ...base, gpuInterfaceManifest });
}

/**
 * Creates a shader lifecycle envelope and proves that its complete WGSL file
 * set matches the module digests and sizes in the strict shader manifest.
 */
export function createShaderAssetManifest(input: ShaderAssetManifest): ShaderAssetManifest {
  assertExactKeys(input, [
    ...ASSET_MANIFEST_KEYS,
    "shaderManifest",
  ], "ShaderAssetManifest");
  const base = createTypedAssetBase(
    input,
    "shader",
    "shader-manifest",
    ASSET_JSON_CONTENT_TYPE,
  );
  assertAllowedFileRoles(base, ["shader-manifest", "wgsl"]);
  assertRoleCount(base, "shader-manifest", 1);
  const shaderManifest = parseShaderVersionManifest(input.shaderManifest);
  assertDomainIdentity(base, shaderManifest.shaderId, shaderManifest.version, "Shader");
  assertShaderModuleFiles(base.files, shaderManifest);
  return Object.freeze({ ...base, shaderManifest });
}

/** Creates a profile lifecycle envelope with exact immutable shader references. */
export function createShaderStyleProfileAssetManifest(
  input: ShaderStyleProfileAssetManifest,
): ShaderStyleProfileAssetManifest {
  assertExactKeys(input, [
    ...ASSET_MANIFEST_KEYS,
    "styleProfileManifest",
  ], "ShaderStyleProfileAssetManifest");
  const base = createTypedAssetBase(
    input,
    "shader-style-profile",
    "shader-style-profile-manifest",
    ASSET_JSON_CONTENT_TYPE,
  );
  assertAllowedFileRoles(base, ["shader-style-profile-manifest"]);
  assertRoleCount(base, "shader-style-profile-manifest", 1);
  const styleProfileManifest = parseShaderStyleProfileManifest(input.styleProfileManifest);
  assertDomainIdentity(base, styleProfileManifest.profileId, styleProfileManifest.version, "Style profile");
  return Object.freeze({ ...base, styleProfileManifest });
}

/**
 * Creates the storage envelope for qualification evidence. Full evidence-byte,
 * bundle, provenance, and Cartesian-coverage verification remains an admission
 * concern in `@plasius/gpu-shader/testing`.
 */
export function createShaderValidationEvidenceAssetManifest(
  input: ShaderValidationEvidenceAssetManifest,
): ShaderValidationEvidenceAssetManifest {
  assertExactKeys(input, [
    ...ASSET_MANIFEST_KEYS,
    "validationEvidence",
  ], "ShaderValidationEvidenceAssetManifest");
  const base = createTypedAssetBase(
    input,
    "shader-validation-evidence",
    "shader-validation-evidence",
    ASSET_JSON_CONTENT_TYPE,
  );
  assertAllowedFileRoles(base, [
    "shader-validation-evidence",
    "shader-validation-attestation",
    "shader-qualification-fixture",
    "shader-compile-unit-inventory",
    "shader-matrix",
    "metadata",
  ]);
  assertRoleCount(base, "shader-validation-evidence", 1);
  const validationEvidence = createShaderValidationEvidenceRef(input.validationEvidence);
  if (!isAssetId(validationEvidence.evidenceId) || validationEvidence.evidenceId !== base.assetId) {
    throw new Error("Shader validation evidence identity must match the asset identity.");
  }
  const evidenceFile = requireEntrypoint(base, "shader-validation-evidence");
  if (evidenceFile.sha256 !== validationEvidence.sha256) {
    throw new Error("Shader validation evidence file digest must match its evidence reference.");
  }
  const attestationFiles = base.files.filter((file) => file.role === "shader-validation-attestation");
  if (attestationFiles.length !== 1
    || attestationFiles[0]?.sha256 !== validationEvidence.attestationRef.sha256
    || attestationFiles[0]?.contentType !== ASSET_JSON_CONTENT_TYPE) {
    throw new Error("Shader validation evidence must include its exact attestation file.");
  }
  return Object.freeze({ ...base, validationEvidence });
}

/** Strictly validates and freezes a supported universal or additive evidence reference. */
export function createShaderValidationEvidenceRef(
  input: ShaderValidationEvidenceRef,
): ShaderValidationEvidenceRef {
  const value = assertRecord(input, "ShaderValidationEvidenceRef");
  assertExactKeys(value, [
    "evidenceId",
    "uri",
    "sha256",
    "matrixId",
    "matrixVersion",
    "matrixSha256",
    "attestationRef",
  ], "ShaderValidationEvidenceRef");
  const attestation = assertRecord(value.attestationRef, "ShaderValidationEvidenceRef.attestationRef");
  assertExactKeys(attestation, ["uri", "sha256"], "ShaderValidationEvidenceRef.attestationRef");
  const result: ShaderValidationEvidenceRef = {
    evidenceId: assertGpuToken(value.evidenceId, "Shader validation evidence id"),
    uri: assertImmutableHttpsUri(value.uri, "Shader validation evidence uri"),
    sha256: assertSha256(value.sha256, "Shader validation evidence sha256"),
    matrixId: assertGpuToken(value.matrixId, "Shader validation evidence matrixId"),
    matrixVersion: assertGpuToken(value.matrixVersion, "Shader validation evidence matrixVersion"),
    matrixSha256: assertSha256(value.matrixSha256, "Shader validation evidence matrixSha256"),
    attestationRef: Object.freeze({
      uri: assertImmutableHttpsUri(attestation.uri, "Shader validation evidence attestation uri"),
      sha256: assertSha256(attestation.sha256, "Shader validation evidence attestation sha256"),
    }),
  };
  const supportedUniversal = SUPPORTED_STABLE_WEBGPU_MATRIX_POLICIES.some((policy) =>
    result.matrixId === policy.matrixId
    && result.matrixVersion === policy.matrixVersion
    && result.matrixSha256 === policy.matrixSha256);
  const supportedAdditive = SUPPORTED_ADDITIVE_WEBGPU_MATRIX_POLICIES.some((policy) =>
    result.matrixId === policy.matrixId
    && result.matrixVersion === policy.matrixVersion
    && result.matrixSha256 === policy.matrixSha256);
  if (!supportedUniversal && !supportedAdditive) {
    throw new Error("Shader validation evidence must target a supported WebGPU matrix policy.");
  }
  if (result.uri === result.attestationRef.uri || result.sha256 === result.attestationRef.sha256) {
    throw new Error("Shader validation evidence and attestation identities must be distinct.");
  }
  return Object.freeze(result);
}

/** Constructs an exact interface reference after immutable manifest bytes exist. */
export async function createGpuInterfaceRef(input: GpuInterfaceRefInput): Promise<GpuInterfaceRef> {
  const manifest = parseGpuInterfaceManifest(input.manifest);
  assertAssetId(manifest.interfaceId);
  assertAssetVersion(manifest.interfaceVersion);
  const manifestSha256 = await bindDomainManifestBytes(input.manifestBytes, manifest, "GPU interface");
  return Object.freeze({
    interfaceId: manifest.interfaceId,
    interfaceVersion: manifest.interfaceVersion,
    manifestUri: assertImmutableHttpsUri(input.manifestUri, "GPU interface manifest uri"),
    manifestSha256,
    interfaceAbiHash: manifest.interfaceAbiHash,
    modelAbiHash: manifest.modelAbiHash,
  });
}

/** Constructs an exact shader-version reference after immutable manifest bytes exist. */
export async function createShaderVersionRef(input: ShaderVersionRefInput): Promise<ShaderVersionRef> {
  const manifest = parseShaderVersionManifest(input.manifest);
  assertAssetId(manifest.shaderId);
  assertAssetVersion(manifest.version);
  const manifestSha256 = await bindDomainManifestBytes(input.manifestBytes, manifest, "Shader");
  return Object.freeze({
    shaderId: manifest.shaderId,
    version: manifest.version,
    manifestUri: assertImmutableHttpsUri(input.manifestUri, "Shader manifest uri"),
    manifestSha256,
  });
}

/** Constructs an exact style-profile reference after immutable manifest bytes exist. */
export async function createShaderStyleProfileRef(
  input: ShaderStyleProfileRefInput,
): Promise<ShaderStyleProfileRef> {
  const manifest = parseShaderStyleProfileManifest(input.manifest);
  assertAssetId(manifest.profileId);
  assertAssetVersion(manifest.version);
  const manifestSha256 = await bindDomainManifestBytes(input.manifestBytes, manifest, "Style profile");
  return Object.freeze({
    profileId: manifest.profileId,
    version: manifest.version,
    manifestUri: assertImmutableHttpsUri(input.manifestUri, "Style profile manifest uri"),
    manifestSha256,
  });
}

/** Revalidates any typed GPU asset envelope at a storage or promotion boundary. */
export function createGpuAssetManifest(input: GpuAssetManifest): GpuAssetManifest {
  switch (input.assetKind) {
    case "model":
      return createModelAssetManifest(input);
    case "gpu-interface":
      return createGpuInterfaceAssetManifest(input);
    case "shader":
      return createShaderAssetManifest(input);
    case "shader-style-profile":
      return createShaderStyleProfileAssetManifest(input);
    case "shader-validation-evidence":
      return createShaderValidationEvidenceAssetManifest(input);
    default:
      throw new Error("GPU asset manifest assetKind is not supported.");
  }
}

/**
 * Digest-verifies a complete typed asset version and binds canonical JSON
 * entrypoint bytes to the validated interface, shader, or profile object.
 */
export async function validateGpuAssetFiles(
  input: GpuAssetFileValidationInput,
): Promise<GpuAssetManifest> {
  const manifest = createGpuAssetManifest(input.manifest);
  if (input.files.size !== manifest.files.length) {
    throw new Error("GPU asset validation requires exactly the declared file set.");
  }
  for (const path of input.files.keys()) {
    if (!manifest.files.some((file) => file.path === path)) {
      throw new Error(`GPU asset validation received undeclared file ${path}.`);
    }
  }
  await Promise.all(manifest.files.map(async (file) => {
    const bytes = input.files.get(file.path);
    if (!(bytes instanceof Uint8Array)) {
      throw new Error(`GPU asset validation is missing bytes for ${file.path}.`);
    }
    if (bytes.byteLength !== file.byteLength) {
      throw new Error(`GPU asset file ${file.path} byte length differs from its descriptor.`);
    }
    if (await computeSha256(bytes) !== file.sha256) {
      throw new Error(`GPU asset file ${file.path} digest differs from its descriptor.`);
    }
    if (file.contentType === ASSET_JSON_CONTENT_TYPE) {
      assertCanonicalJsonBytes(bytes, `GPU asset file ${file.path}`);
    } else if (file.role === "wgsl") {
      try {
        new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch (cause) {
        throw new Error(`GPU asset WGSL file ${file.path} is not valid UTF-8.`, { cause });
      }
    }
  }));

  const entrypointBytes = input.files.get(manifest.entrypoint);
  if (!(entrypointBytes instanceof Uint8Array)) {
    throw new Error("GPU asset validation is missing entrypoint bytes.");
  }
  const expectedDomainManifest = domainManifestForAsset(manifest);
  if (expectedDomainManifest !== null) {
    const parsedEntrypoint = parseJsonBytes(entrypointBytes, "GPU asset manifest entrypoint");
    if (canonicalizeGpuContract(parsedEntrypoint) !== canonicalizeGpuContract(expectedDomainManifest)) {
      throw new Error("GPU asset entrypoint bytes differ from the validated domain manifest.");
    }
  } else if (manifest.assetKind === "shader-validation-evidence") {
    assertEvidenceEntrypointIdentity(
      parseJsonBytes(entrypointBytes, "Shader validation evidence entrypoint"),
      manifest.validationEvidence,
    );
  }
  return manifest;
}

export function createStandardScreenshotPlan(
  width = 1600,
  height = 1000
): readonly AssetScreenshotPlanItem[] {
  return Object.freeze(
    ASSET_SCREENSHOT_KINDS.map((kind) =>
      Object.freeze({
        kind,
        label: kind.replace(/-/gu, " "),
        width,
        height,
      })
    )
  );
}

export function createAssetReviewReport(input: AssetReviewReport): AssetReviewReport {
  assertAssetId(input.assetId);
  assertAssetVersion(input.version);
  return Object.freeze({
    ...input,
    findings: Object.freeze(input.findings.map((finding) => Object.freeze({ ...finding }))),
  });
}

export function createAssetJobRecord(input: AssetJobRecord): AssetJobRecord {
  assertToken(input.jobId, "Asset job id");
  assertAssetId(input.assetId);
  assertAssetVersion(input.version);
  if (!isAssetJobState(input.state)) {
    throw new Error("Asset job state is not supported.");
  }
  if (!isAssetSourceAdapter(input.sourceAdapter)) {
    throw new Error("Asset job sourceAdapter is not supported.");
  }
  assertRequiredString(input.requestedAt, "Asset job requestedAt");
  assertRequiredString(input.requestedBy, "Asset job requestedBy");
  assertToken(input.featureFlagId, "Asset job featureFlagId");
  if (input.requiredCapability !== undefined) {
    assertToken(input.requiredCapability, "Asset job requiredCapability");
  }
  return Object.freeze({ ...input });
}

export function createAssetPromotionRecord<TManifest extends AssetManifest>(
  input: AssetPromotionRecord<TManifest>,
): AssetPromotionRecord<TManifest> {
  if (input.manifest.assetKind !== undefined) {
    throw new Error("Typed GPU assets require createGpuAssetPromotionRecord with the complete file bytes.");
  }
  return createValidatedPromotionRecord(input, createAssetManifest(input.manifest));
}

/** Digest-verifies and promotes a typed GPU asset without a generic-factory bypass. */
export async function createGpuAssetPromotionRecord<TManifest extends GpuAssetManifest>(
  input: AssetPromotionRecord<TManifest>,
  files: ReadonlyMap<string, Uint8Array>,
): Promise<AssetPromotionRecord<TManifest>> {
  const manifest = await validateGpuAssetFiles({ manifest: input.manifest, files }) as TManifest;
  assertTypedRuntimeManifestUri(manifest, input.runtimeManifestUri);
  return createValidatedPromotionRecord(input, manifest);
}

function createValidatedPromotionRecord<TManifest extends AssetManifest>(
  input: AssetPromotionRecord<TManifest>,
  manifest: TManifest,
): AssetPromotionRecord<TManifest> {
  assertToken(input.promotionId, "Asset promotion id");
  assertToken(input.jobId, "Asset promotion job id");
  assertAssetId(input.assetId);
  assertAssetVersion(input.version);
  if (!isAssetSourceAdapter(input.sourceAdapter)) {
    throw new Error("Asset promotion sourceAdapter is not supported.");
  }
  if (!isAssetPromotionOutcome(input.outcome)) {
    throw new Error("Asset promotion outcome is not supported.");
  }

  if (manifest.assetId !== input.assetId || manifest.version !== input.version) {
    throw new Error("Asset promotion manifest must match the promoted asset id and version.");
  }

  const reviewReport = createAssetReviewReport(input.reviewReport);
  if (reviewReport.assetId !== input.assetId || reviewReport.version !== input.version) {
    throw new Error("Asset promotion reviewReport must match the promoted asset id and version.");
  }

  assertRequiredString(input.approvedBy, "Asset promotion approvedBy");
  assertRequiredString(input.approvedAt, "Asset promotion approvedAt");
  assertRequiredString(input.promotedAt, "Asset promotion promotedAt");
  assertRequiredString(input.runtimeChannel, "Asset promotion runtimeChannel");
  assertRequiredString(input.runtimeManifestUri, "Asset promotion runtimeManifestUri");
  if (input.rollbackOfVersion !== undefined) {
    assertAssetVersion(input.rollbackOfVersion);
  }

  return Object.freeze({
    ...input,
    manifest,
    reviewReport,
  });
}

function createTypedAssetBase<K extends AssetKind>(
  input: AssetManifest,
  assetKind: K,
  entrypointRole: AssetFileRole,
  entrypointContentType?: string,
): TypedAssetManifest<K> {
  if (input.assetKind !== assetKind) {
    throw new Error(`Asset manifest assetKind must be ${assetKind}.`);
  }
  const base = createBaseAssetManifest({
    assetKind,
    assetId: input.assetId,
    version: input.version,
    entrypoint: input.entrypoint,
    files: input.files,
    sourceAdapter: input.sourceAdapter,
    createdAt: input.createdAt,
  });
  const entrypoint = requireEntrypoint(base, entrypointRole);
  if (entrypointContentType !== undefined && entrypoint.contentType !== entrypointContentType) {
    throw new Error(`Asset manifest ${entrypointRole} entrypoint must use ${entrypointContentType}.`);
  }
  return base;
}

function requireEntrypoint(
  manifest: AssetManifest,
  expectedRole: AssetFileRole,
): AssetFileDescriptor {
  const matches = manifest.files.filter((file) => file.path === manifest.entrypoint);
  if (matches.length !== 1 || matches[0]?.role !== expectedRole) {
    throw new Error(`Asset manifest entrypoint must identify exactly one ${expectedRole} file.`);
  }
  return matches[0];
}

function assertDomainIdentity(
  manifest: AssetManifest,
  domainId: string,
  domainVersion: string,
  label: string,
): void {
  if (!isAssetId(domainId) || domainId !== manifest.assetId || domainVersion !== manifest.version) {
    throw new Error(`${label} identity and version must match the lifecycle asset identity and version.`);
  }
}

function assertShaderModuleFiles(
  files: readonly AssetFileDescriptor[],
  shaderManifest: ShaderVersionManifest,
): void {
  const moduleFiles = files.filter((file) => file.role === "wgsl");
  const moduleFileIds = new Set(moduleFiles.map((file) => file.moduleId));
  if (moduleFiles.length !== shaderManifest.modules.length
    || moduleFileIds.size !== moduleFiles.length) {
    throw new Error("Shader asset must contain exactly one uniquely mapped WGSL file per shader module.");
  }
  for (const module of shaderManifest.modules) {
    const file = moduleFiles.find((candidate) => candidate.moduleId === module.moduleId);
    if (!file
      || file.sha256 !== module.sha256
      || file.byteLength !== module.byteLength
      || file.contentType !== module.contentType) {
      throw new Error("Shader asset WGSL module files must exactly match the shader manifest module IDs, digests, sizes, and content types.");
    }
    const moduleUri = new URL(module.uri);
    const pathSuffix = `/${file.path.split("/").map(encodeURIComponent).join("/")}`;
    if (!moduleUri.pathname.endsWith(pathSuffix)) {
      throw new Error("Shader module URI paths must identify their mapped immutable WGSL asset files.");
    }
  }
}

function assertAllowedFileRoles(
  manifest: AssetManifest,
  allowedRoles: readonly AssetFileRole[],
): void {
  const allowed = new Set(allowedRoles);
  const unexpected = manifest.files.find((file) => !allowed.has(file.role));
  if (unexpected) {
    throw new Error(`${manifest.assetKind ?? "legacy"} assets do not allow ${unexpected.role} files.`);
  }
}

function domainManifestForAsset(
  manifest: GpuAssetManifest,
): GpuInterfaceManifest | ShaderVersionManifest | ShaderStyleProfileManifest | null {
  switch (manifest.assetKind) {
    case "gpu-interface":
      return manifest.gpuInterfaceManifest;
    case "shader":
      return manifest.shaderManifest;
    case "shader-style-profile":
      return manifest.styleProfileManifest;
    case "model":
    case "shader-validation-evidence":
      return null;
  }
}

function assertTypedRuntimeManifestUri(manifest: GpuAssetManifest, value: string): void {
  const runtimeUri = new URL(assertImmutableHttpsUri(value, "GPU asset runtimeManifestUri"));
  if (manifest.assetKind === "shader-validation-evidence") {
    if (runtimeUri.href !== manifest.validationEvidence.uri) {
      throw new Error("Evidence promotion URI must equal its exact validation-evidence URI.");
    }
    return;
  }
  if (manifest.assetKind === "model") return;

  const entrypointSuffix = `/${manifest.entrypoint.split("/").map(encodeURIComponent).join("/")}`;
  if (!runtimeUri.pathname.endsWith(entrypointSuffix)) {
    throw new Error("Typed GPU promotion URI must identify the validated manifest entrypoint.");
  }
  if (manifest.assetKind === "shader") {
    const runtimeDirectory = runtimeUri.pathname.slice(0, -entrypointSuffix.length);
    for (const module of manifest.shaderManifest.modules) {
      const moduleUri = new URL(module.uri);
      const moduleFile = manifest.files.find((file) =>
        file.role === "wgsl" && file.moduleId === module.moduleId);
      if (!moduleFile) {
        throw new Error(`Shader module ${module.moduleId} has no mapped WGSL file.`);
      }
      const moduleSuffix = `/${moduleFile.path.split("/").map(encodeURIComponent).join("/")}`;
      if (moduleUri.origin !== runtimeUri.origin
        || moduleUri.pathname.slice(0, -moduleSuffix.length) !== runtimeDirectory) {
        throw new Error("Shader module and manifest URIs must share one immutable version root.");
      }
    }
  }
}

function assertEvidenceEntrypointIdentity(
  value: unknown,
  ref: ShaderValidationEvidenceRef,
): void {
  const evidence = assertRecord(value, "Shader validation evidence entrypoint");
  if (evidence.contractVersion !== SHADER_VALIDATION_EVIDENCE_VERSION
    || evidence.evidenceId !== ref.evidenceId
    || evidence.status !== "passed") {
    throw new Error("Shader validation evidence bytes do not identify passing declared evidence.");
  }
  const matrixRef = assertRecord(evidence.matrixRef, "Shader validation evidence matrixRef");
  if (matrixRef.matrixId !== ref.matrixId
    || matrixRef.version !== ref.matrixVersion
    || matrixRef.sha256 !== ref.matrixSha256) {
    throw new Error("Shader validation evidence bytes differ from the declared matrix identity.");
  }
  const counts = assertRecord(evidence.counts, "Shader validation evidence counts");
  const compileUnits = counts.compileUnits as number;
  const cells = counts.cells as number;
  const expectedResults = counts.expectedResults as number;
  if (!Number.isSafeInteger(compileUnits)
    || !Number.isSafeInteger(cells)
    || !Number.isSafeInteger(expectedResults)
    || !Number.isSafeInteger(counts.passedResults)
    || compileUnits <= 0
    || cells <= 0
    || expectedResults !== compileUnits * cells
    || counts.passedResults !== expectedResults) {
    throw new Error("Shader validation evidence bytes do not declare complete passing result counts.");
  }
}

function assertCanonicalJsonBytes(bytes: Uint8Array, fieldName: string): void {
  const value = parseJsonBytes(bytes, fieldName);
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (canonicalizeGpuContract(value) !== text) {
    throw new Error(`${fieldName} must use canonical JSON serialization.`);
  }
}

async function bindDomainManifestBytes(
  bytes: Uint8Array,
  manifest: GpuInterfaceManifest | ShaderVersionManifest | ShaderStyleProfileManifest,
  fieldName: string,
): Promise<Sha256Hex> {
  if (!(bytes instanceof Uint8Array)) {
    throw new Error(`${fieldName} manifest bytes must be a Uint8Array.`);
  }
  assertCanonicalJsonBytes(bytes, `${fieldName} manifest`);
  const parsed = parseJsonBytes(bytes, `${fieldName} manifest`);
  if (canonicalizeGpuContract(parsed) !== canonicalizeGpuContract(manifest)) {
    throw new Error(`${fieldName} manifest bytes differ from the supplied manifest.`);
  }
  return computeSha256(bytes);
}

function assertRoleCount(
  manifest: AssetManifest,
  role: AssetFileRole,
  expectedCount: number,
): void {
  if (manifest.files.filter((file) => file.role === role).length !== expectedCount) {
    throw new Error(`Asset manifest must contain exactly ${expectedCount} ${role} file(s).`);
  }
}

function assertExactKeys(
  value: object,
  allowed: readonly string[],
  fieldName: string,
): void {
  const allowedSet = new Set(allowed);
  const unexpected = Object.keys(value).filter((key) => !allowedSet.has(key));
  if (unexpected.length > 0) {
    throw new Error(`${fieldName} contains unsupported fields: ${unexpected.join(", ")}.`);
  }
}

function assertRecord(value: unknown, fieldName: string): Readonly<Record<string, unknown>> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${fieldName} must be an object.`);
  }
  return value as Readonly<Record<string, unknown>>;
}

function assertSha256(value: unknown, fieldName: string): Sha256Hex {
  if (typeof value !== "string" || !SHA256_PATTERN.test(value)) {
    throw new Error(`${fieldName} must be a lowercase 64-character digest.`);
  }
  return value as Sha256Hex;
}

function assertGpuToken(value: unknown, fieldName: string): string {
  if (typeof value !== "string"
    || value.length === 0
    || value.length > 160
    || !/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u.test(value)
    || value.includes("..")) {
    throw new Error(`${fieldName} must be a safe GPU contract token.`);
  }
  return value;
}

function assertRelativeAssetPath(value: unknown, fieldName: string): string {
  if (typeof value !== "string"
    || value.length === 0
    || value.length > 1024
    || value.startsWith("/")
    || value.includes("\\")
    || value.includes(":")
    || value.includes("%")
    || value.includes("..")
    || value.includes("?")
    || value.includes("#")
    || value.trim() !== value
    || value.split("/").some((segment) => segment.length === 0 || segment === ".")
    || [...value].some((character) => character.charCodeAt(0) <= 0x1f)) {
    throw new Error(`${fieldName} must be a normalized relative POSIX path without traversal or a URI scheme.`);
  }
  return value;
}

function assertImmutableHttpsUri(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) {
    throw new Error(`${fieldName} must be an absolute immutable asset URI.`);
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch (cause) {
    throw new Error(`${fieldName} must be an absolute immutable asset URI.`, { cause });
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.hash) {
    throw new Error(`${fieldName} must be credential-free HTTPS without a fragment.`);
  }
  const queryKeys = [...parsed.searchParams.keys()].map((key) => key.toLowerCase());
  const forbidden = new Set([
    "sig",
    "se",
    "sp",
    "sv",
    "spr",
    "st",
    "skoid",
    "sktid",
    "skt",
    "ske",
    "sks",
    "skv",
  ]);
  if (queryKeys.some((key) => forbidden.has(key)) || new Set(queryKeys).size !== queryKeys.length) {
    throw new Error(`${fieldName} must not contain SAS credentials or duplicate query parameters.`);
  }
  if (parsed.href !== value) {
    throw new Error(`${fieldName} must use canonical URL serialization.`);
  }
  return value;
}

function assertToken(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !TOKEN_PATTERN.test(value)) {
    throw new Error(`${fieldName} must be a non-empty token up to 128 characters.`);
  }
  return value;
}

function assertRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }
  return value;
}
