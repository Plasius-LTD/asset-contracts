export const ASSET_CONTRACTS_PACKAGE = "@plasius/asset-contracts";
export const UNIFIED_ASSET_PIPELINE_FEATURE_FLAG_ID = "asset.pipeline.unified-ai-assets.enabled";
export const ASSET_PIPELINE_MCP_CAPABILITY = "asset.pipeline.mcp.manage";
export const ASSET_PIPELINE_REVIEW_CAPABILITY = "asset.pipeline.review.approve";

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

export type AssetJobState = typeof ASSET_JOB_STATES[number];
export type AssetSourceAdapter = typeof ASSET_SOURCE_ADAPTERS[number];
export type AssetScreenshotKind = typeof ASSET_SCREENSHOT_KINDS[number];
export type AssetReviewSeverity = typeof ASSET_REVIEW_SEVERITIES[number];

export interface AssetFileDescriptor {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly contentType: string;
  readonly role: "model" | "binary" | "texture" | "manifest" | "screenshot" | "metadata";
}

export interface AssetManifest {
  readonly assetId: string;
  readonly version: string;
  readonly entrypoint: string;
  readonly files: readonly AssetFileDescriptor[];
  readonly sourceAdapter: AssetSourceAdapter;
  readonly createdAt: string;
}

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

const ASSET_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const VERSION_PATTERN = /^[0-9A-Za-z][0-9A-Za-z._-]{0,127}$/u;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;

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

export function createAssetFileDescriptor(input: AssetFileDescriptor): AssetFileDescriptor {
  if (!input.path || input.path.includes("..")) {
    throw new Error("Asset file path must be relative and must not traverse upward.");
  }
  if (!Number.isInteger(input.byteLength) || input.byteLength < 0) {
    throw new Error("Asset file byteLength must be a non-negative integer.");
  }
  if (!SHA256_PATTERN.test(input.sha256)) {
    throw new Error("Asset file sha256 must be a lowercase 64-character digest.");
  }
  return Object.freeze({ ...input });
}

export function createAssetManifest(input: AssetManifest): AssetManifest {
  assertAssetId(input.assetId);
  assertAssetVersion(input.version);
  if (!isAssetSourceAdapter(input.sourceAdapter)) {
    throw new Error("Asset manifest sourceAdapter is not supported.");
  }
  if (!input.entrypoint || input.entrypoint.includes("..")) {
    throw new Error("Asset manifest entrypoint must be a relative file path.");
  }
  return Object.freeze({
    ...input,
    files: Object.freeze(input.files.map(createAssetFileDescriptor)),
  });
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
