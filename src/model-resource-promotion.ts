import { canonicalizeGpuContract, computeSha256 } from "@plasius/gpu-shader";
import { assertImmutableAssetVersion } from "./asset-version.js";
import { qualifyModelResourceManifest, MODEL_RESOURCE_MANIFEST_LIMITS, type ModelResourceManifestQualificationInput, type ModelResourceFileInput } from "./model-resource-manifest.js";
import { qualifyModelTextureResources, type ModelTextureResourceQualificationInput, type QualifiedModelTextureResources } from "./model-texture-resources.js";
import { qualifyModelConversionDiagnostics, type ModelConversionDiagnosticsInput, type QualifiedModelConversionDiagnostics } from "./model-conversion-diagnostics.js";
import { createModelCandidate, createModelCandidateConfirmation, createModelResourceRef, type ModelCandidate, type ModelCandidateConfirmation, type ModelResourceRef } from "./model-resolution.js";
import { createModelAssetManifest, createGpuAssetPromotionRecord, type AssetManifest, type AssetPromotionRecord, type ModelAssetManifest } from "./index.js";

/** Hard ceilings supplement the existing per-package byte and graph limits. */
export const MODEL_RESOURCE_PROMOTION_LIMITS = Object.freeze({ bindings: 1024, values: 262_144, characters: 2_097_152, depth: 24, timeoutMs: 60_000 });
/** Explicit location of a public evidence resource inside one qualified package. */
export interface ModelPromotionResourceBinding {
  readonly resource: ModelResourceRef;
  readonly package: "source" | "output";
  readonly filePath: string;
}
/** Existing contracts composed without granting durable storage or signature authority. */
export interface ModelResourcePromotionInput {
  readonly promotion: AssetPromotionRecord<ModelAssetManifest>;
  readonly source: Omit<ModelResourceManifestQualificationInput, "signal" | "timeoutMs">;
  readonly output: ModelTextureResourceQualificationInput;
  readonly diagnostics: ModelConversionDiagnosticsInput;
  readonly resourceBindings: readonly ModelPromotionResourceBinding[];
  readonly candidate: ModelCandidate;
  readonly confirmation: ModelCandidateConfirmation;
  readonly rollback?: { readonly prior: QualifiedModelResourcePromotion; readonly current: QualifiedModelResourcePromotion };
}
/** Native controls cover the entire composition, with no I/O, retries or pointer writes. */
export interface ModelResourcePromotionOptions { readonly signal?: AbortSignal; readonly timeoutMs?: number }
/** Frozen call-time evidence. Requalify persisted JSON; a clone has no local qualification brand. */
export interface QualifiedModelResourcePromotion {
  readonly contractVersion: 1;
  readonly promotion: AssetPromotionRecord<ModelAssetManifest>;
  readonly source: AssetManifest;
  readonly output: QualifiedModelTextureResources;
  readonly diagnostics: QualifiedModelConversionDiagnostics;
  readonly resourceBindings: readonly ModelPromotionResourceBinding[];
  readonly candidate: ModelCandidate;
  readonly confirmation: ModelCandidateConfirmation;
  /** Separate package closure digest; preserves legacy candidate leaf/assembly hash semantics. */
  readonly closureHash: string;
  readonly rollback?: { readonly fromVersion: string; readonly fromClosureHash: string; readonly toVersion: string; readonly toClosureHash: string };
}
/** Stable value-free failure; upstream exceptions and authored values are never included. */
export class ModelResourcePromotionError extends TypeError {
  constructor(public readonly code: "invalid-input" | "limit-exceeded" | "package-mismatch" | "evidence-mismatch" | "gate-blocked" | "rollback-mismatch" | "aborted" | "deadline-exceeded") {
    super(`Invalid model resource promotion: ${code}`); this.name = "ModelResourcePromotionError";
  }
}
const qualified = new WeakSet<object>();
// Canonical adapter formats select the released evaluator policy. An unknown
// format cannot inherit a different standard's repair/acceptance rules.
const conversionStandards = new Map<string, string>([
  ["gltf", "gltf-glb"], ["glb", "gltf-glb"], ["obj", "obj-mtl"], ["mtl", "obj-mtl"],
  ["fbx", "fbx"], ["step", "cad-bim"], ["stp", "cad-bim"],
  ["iges", "cad-bim"], ["igs", "cad-bim"], ["ifc", "cad-bim"],
]);
function fail(code: ModelResourcePromotionError["code"] = "invalid-input"): never { throw new ModelResourcePromotionError(code); }
function fields(value: unknown, allowed?: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail();
  const keys = Reflect.ownKeys(value); if (keys.length > 1024) fail("limit-exceeded");
  const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const key of keys) {
    if (typeof key !== "string" || key.length > 128 || ["__proto__", "constructor", "prototype"].includes(key) || (allowed && !allowed.includes(key))) fail();
    const property = Object.getOwnPropertyDescriptor(value, key)!;
    if (!("value" in property) || !property.enumerable) fail();
    result[key] = property.value;
  }
  return result;
}
function array(value: unknown, maximum: number): unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) fail();
  if (value.length > maximum) fail("limit-exceeded");
  if (Reflect.ownKeys(value).length !== value.length + 1) fail();
  return Array.from({ length: value.length }, (_, i) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) fail();
    return descriptor.value;
  });
}
function snapshot(value: unknown, budget: { values: number; characters: number }, depth = 0): unknown {
  if (--budget.values < 0 || depth > MODEL_RESOURCE_PROMOTION_LIMITS.depth) fail("limit-exceeded");
  if (value === null || value === undefined || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    budget.characters -= value.length;
    if (value.length > 2048 || budget.characters < 0) fail("limit-exceeded"); return value;
  }
  if (Array.isArray(value)) return Object.freeze(array(value, MODEL_RESOURCE_MANIFEST_LIMITS.files).map((v) => snapshot(v, budget, depth + 1)));
  const result = fields(value);
  for (const key of Object.keys(result)) {
    budget.characters -= key.length; if (budget.characters < 0) fail("limit-exceeded");
    result[key] = snapshot(result[key], budget, depth + 1);
  }
  return Object.freeze(result);
}
const typedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype);
const byteLengthGetter = Object.getOwnPropertyDescriptor(typedArrayPrototype, "byteLength")!.get!;
const bufferGetter = Object.getOwnPropertyDescriptor(typedArrayPrototype, "buffer")!.get!;
function copyFiles(value: unknown): readonly ModelResourceFileInput[] {
  let total = 0;
  const files = array(value, MODEL_RESOURCE_MANIFEST_LIMITS.files).map((v) => {
    const file = fields(v, ["path", "bytes", "contentType"]); const bytes = file.bytes;
    if (typeof file.path !== "string" || typeof file.contentType !== "string" || !(bytes instanceof Uint8Array)
      || Object.getPrototypeOf(bytes) !== Uint8Array.prototype || !(bufferGetter.call(bytes) instanceof ArrayBuffer)) fail();
    const length = byteLengthGetter.call(bytes) as number;
    total += length;
    if (length > MODEL_RESOURCE_MANIFEST_LIMITS.fileBytes || total > MODEL_RESOURCE_MANIFEST_LIMITS.totalBytes) fail("limit-exceeded");
    return { path: file.path, bytes, contentType: file.contentType };
  });
  return files.map((f) => ({ ...f, bytes: new Uint8Array(f.bytes) }));
}
const same = (a: unknown, b: unknown): boolean => canonicalizeGpuContract(a) === canonicalizeGpuContract(b);
const entry = (m: AssetManifest) => m.files.find((f) => f.path === m.entrypoint)!;
const identity = (m: AssetManifest): string => `${m.assetId}/${m.version}`;

/**
 * Qualifies complete source/output inventories and conversion lineage before
 * composing existing typed promotion, rights, hard-gate and human confirmation
 * contracts. Tokens remain trusted hosted assertions; this is not a signature
 * verifier, parser, storage transaction or permission grant. Rollback rechecks
 * target bytes/gates and requires locally qualified exact prior/current records.
 */
export async function createModelResourcePromotionRecord(input: ModelResourcePromotionInput, options: ModelResourcePromotionOptions = {}): Promise<QualifiedModelResourcePromotion> {
  let timer: ReturnType<typeof setTimeout> | undefined; let signal: AbortSignal | undefined; let onAbort: (() => void) | undefined;
  try {
    const started = performance.now(); const controls = fields(options, ["signal", "timeoutMs"]);
    const timeoutMs = controls.timeoutMs === undefined ? 10_000 : controls.timeoutMs;
    if (typeof timeoutMs !== "number" || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MODEL_RESOURCE_PROMOTION_LIMITS.timeoutMs) fail();
    signal = controls.signal as AbortSignal | undefined;
    const aborted = Object.getOwnPropertyDescriptor(AbortSignal.prototype, "aborted")!.get!;
    const check = () => { if (signal !== undefined && aborted.call(signal)) fail("aborted"); if (performance.now() - started >= timeoutMs) fail("deadline-exceeded"); };
    check();
    const root = fields(input, ["promotion", "source", "output", "diagnostics", "resourceBindings", "candidate", "confirmation", "rollback"]);
    const budget = { values: MODEL_RESOURCE_PROMOTION_LIMITS.values, characters: MODEL_RESOURCE_PROMOTION_LIMITS.characters };
    const snap = (v: unknown) => snapshot(v, budget);
    const promotionInput = snap(root.promotion) as ModelResourcePromotionInput["promotion"];
    const sourceInput = fields(root.source, ["manifest", "packageManifest", "files"]);
    const outputInput = fields(root.output, ["manifest", "packageManifest", "files", "graph", "resources", "derived"]);
    const sourceMetadata = { manifest: snap(sourceInput.manifest) as AssetManifest, packageManifest: snap(sourceInput.packageManifest) as ModelResourceManifestQualificationInput["packageManifest"] };
    const outputMetadata = { manifest: snap(outputInput.manifest) as AssetManifest, packageManifest: snap(outputInput.packageManifest) as ModelTextureResourceQualificationInput["packageManifest"],
      graph: outputInput.graph as ModelTextureResourceQualificationInput["graph"], resources: snap(outputInput.resources) as ModelTextureResourceQualificationInput["resources"], derived: snap(outputInput.derived) as ModelTextureResourceQualificationInput["derived"] };
    const rawDiagnostics = snap(root.diagnostics);
    const candidate = createModelCandidate(snap(root.candidate));
    const confirmation = createModelCandidateConfirmation(snap(root.confirmation), candidate, candidate.resolutionId);
    const bindings = array(snap(root.resourceBindings), MODEL_RESOURCE_PROMOTION_LIMITS.bindings).map((v): ModelPromotionResourceBinding => {
      const b = fields(v, ["resource", "package", "filePath"]);
      if ((b.package !== "source" && b.package !== "output") || typeof b.filePath !== "string") fail();
      return Object.freeze({ resource: createModelResourceRef(b.resource), package: b.package, filePath: b.filePath });
    }).sort((a, b) => a.resource.uri < b.resource.uri ? -1 : a.resource.uri > b.resource.uri ? 1 : 0);
    const history = root.rollback === undefined ? undefined : fields(root.rollback, ["prior", "current"]);
    if (history && (!qualified.has(history.prior as object) || !qualified.has(history.current as object))) fail("rollback-mismatch");
    const prior = history?.prior as QualifiedModelResourcePromotion | undefined;
    const current = history?.current as QualifiedModelResourcePromotion | undefined;
    const sourceFiles = copyFiles(sourceInput.files); const outputFiles = copyFiles(outputInput.files);
    check();
    const interrupted = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new ModelResourcePromotionError("deadline-exceeded")), Math.max(1, timeoutMs - (performance.now() - started)));
      onAbort = () => reject(new ModelResourcePromotionError("aborted"));
      if (signal) AbortSignal.prototype.addEventListener.call(signal, "abort", onAbort, { once: true });
    });
    // Sequential package hashing limits digest concurrency. Every caller byte was
    // copied above; only inert snapshots and the immutable core graph cross await.
    const work = async () => {
      const source = await qualifyModelResourceManifest({ ...sourceMetadata, files: sourceFiles, signal, timeoutMs }); check();
      const output = await qualifyModelTextureResources({ ...outputMetadata, files: outputFiles }, { signal, timeoutMs }); check();
      const diagnostics = await qualifyModelConversionDiagnostics(rawDiagnostics, { signal, timeoutMs }); check();
      assertImmutableAssetVersion(source.version); assertImmutableAssetVersion(output.manifest.version);
      if (identity(source) === identity(output.manifest) || !same(output.manifest, createModelAssetManifest({ ...promotionInput.manifest, files: [...promotionInput.manifest.files].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0) })) || output.manifest.assetKind !== "model") fail("package-mismatch");
      const converter = candidate.processingManifest.converter;
      if (!diagnostics.technicalAccepted || diagnostics.standard !== conversionStandards.get(converter.sourceFormat) || !same(diagnostics.source, candidate.provenance)
        || diagnostics.source.contentHash !== entry(source).sha256 || output.source.sourceContentHash !== entry(source).sha256
        || converter.sourceContentHash !== entry(source).sha256 || converter.outputContentHash !== entry(output.manifest).sha256
        || converter.id !== output.source.converterId || converter.version !== output.source.converterVersion
        || converter.sourceFormat !== output.source.sourceFormat || !same(diagnostics.converter.diagnostics, converter.diagnostics) || !same(diagnostics.converter.losses, converter.losses)) fail("evidence-mismatch");
      const byUri = new Map<string, ModelPromotionResourceBinding>();
      for (const binding of bindings) {
        const file = (binding.package === "source" ? source : output.manifest).files.find((f) => f.path === binding.filePath);
        if (!file || byUri.has(binding.resource.uri) || file.sha256 !== binding.resource.sha256 || file.byteLength !== binding.resource.byteLength || file.contentType !== binding.resource.contentType) fail("evidence-mismatch");
        byUri.set(binding.resource.uri, binding);
      }
      const requireResource = (resource: ModelResourceRef, outputOnly = false) => {
        const binding = byUri.get(resource.uri);
        if (!binding || !same(binding.resource, resource) || (outputOnly && binding.package !== "output")) fail("evidence-mismatch");
        return binding;
      };
      for (const d of diagnostics.diagnostics) if (d.resource) requireResource(d.resource);
      for (const lod of candidate.processingManifest.lods) requireResource(lod.resource, true);
      if (candidate.processingManifest.collision.resource) requireResource(candidate.processingManifest.collision.resource, true);
      for (const f of candidate.processingManifest.fidelityEvidence) if (f.evidenceResource) requireResource(f.evidenceResource, true);
      if (requireResource(candidate.processingManifest.lods[0]!.resource, true).filePath !== output.manifest.entrypoint) fail("evidence-mismatch");
      if (candidate.assetRef.disposition === "existing" && (candidate.assetRef.asset.assetId !== output.manifest.assetId || candidate.assetRef.asset.version !== output.manifest.version)) fail("evidence-mismatch");
      if (promotionInput.sourceAdapter !== output.manifest.sourceAdapter || promotionInput.reviewReport.passed !== true || promotionInput.reviewReport.findings.some((f) => f.severity === "blocking")) fail("gate-blocked");
      const expectedSuffix = `/${output.manifest.assetId}/${output.manifest.version}/${output.manifest.entrypoint}`;
      const runtimeUri = new URL(promotionInput.runtimeManifestUri);
      if (!runtimeUri.pathname.endsWith(expectedSuffix)) fail("evidence-mismatch");
      const promotion = await createGpuAssetPromotionRecord(promotionInput, new Map(outputFiles.map((f) => [f.path, f.bytes]))); check();
      // Promotion event/time/approver are intentionally outside this digest, so
      // an exact rollback can reuse the same package with a new approval event.
      const closure = { contractVersion: 1 as const, source, output, diagnostics, resourceBindings: Object.freeze(bindings), candidate, confirmation };
      const closureHash = await computeSha256(new TextEncoder().encode(canonicalizeGpuContract({ contractVersion: 1, source, output, diagnostics, resourceBindings: bindings }))); check();
      let rollback: QualifiedModelResourcePromotion["rollback"];
      if (promotion.outcome === "rolled-back") {
        if (!prior || !current || prior.promotion.assetId !== promotion.assetId || current.promotion.assetId !== promotion.assetId
          || prior.promotion.runtimeChannel !== promotion.runtimeChannel || current.promotion.runtimeChannel !== promotion.runtimeChannel
          || promotion.version !== prior.promotion.version || promotion.version === current.promotion.version || promotion.rollbackOfVersion !== current.promotion.version
          || closureHash !== prior.closureHash || !same(promotion.manifest, prior.promotion.manifest)
          || promotion.runtimeManifestUri !== prior.promotion.runtimeManifestUri) fail("rollback-mismatch");
        rollback = Object.freeze({ fromVersion: current.promotion.version, fromClosureHash: current.closureHash, toVersion: prior.promotion.version, toClosureHash: prior.closureHash });
      } else if (history || promotion.rollbackOfVersion !== undefined) fail("rollback-mismatch");
      const result = Object.freeze({ ...closure, promotion, closureHash, ...(rollback ? { rollback } : {}) });
      qualified.add(result); return result;
    };
    return await Promise.race([work(), interrupted]);
  } catch (error) {
    // Even a proxy thrown by an inert-input inspection must not escape with
    // authored exception text. Never invoke an upstream error's accessors.
    let code: unknown;
    try { code = Object.getOwnPropertyDescriptor(error, "code")?.value; } catch { return fail(); }
    if (["invalid-input", "limit-exceeded", "package-mismatch", "evidence-mismatch", "gate-blocked", "rollback-mismatch", "aborted", "deadline-exceeded"].includes(code as string)) return fail(code as ModelResourcePromotionError["code"]);
    return fail();
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    if (signal && onAbort) AbortSignal.prototype.removeEventListener.call(signal, "abort", onAbort);
  }
}
