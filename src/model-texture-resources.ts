import { isGpuModelResourceGraph } from "@plasius/gpu-model-core";
import type {
  GpuModelMaterial, GpuModelTexture, GpuModelProvenance, GpuModelResourceGraph,
  GpuModelResourceLocation, GpuModelTextureEmbeddingPolicy,
} from "@plasius/gpu-model-core";
import { qualifyModelResourceManifest, ModelResourceManifestError, type ModelResourceManifestQualificationInput } from "./model-resource-manifest.js";
import type { AssetManifest, AssetFileDescriptor } from "./index.js";

/** Hard ceilings for the additive package role boundary; callers cannot raise them. */
export const MODEL_TEXTURE_RESOURCE_LIMITS = Object.freeze({ resources: 16_384, derived: 4096, nodes: 65_536, values: 262_144, characters: 2_097_152, depth: 16, timeoutMs: 60_000 });
/** An embedded resource names its owning entrypoint; external resources name their exact graph path. */
export interface ModelTextureResourceBinding { readonly resourceId: string; readonly filePath: string }
/** Declarative derived output; source identities remain independent of output hashes and paths. */
export interface ModelDerivedTextureResource {
  readonly role: "gpu-upload" | "texture-atlas";
  readonly filePath: string;
  readonly sourceResourceIds: readonly string[];
}
/** Existing exact-byte inventory plus a privately verified canonical graph and explicit export bindings. */
export interface ModelTextureResourceQualificationInput extends Omit<ModelResourceManifestQualificationInput, "signal" | "timeoutMs"> {
  readonly graph: GpuModelResourceGraph;
  readonly resources: readonly ModelTextureResourceBinding[];
  readonly derived: readonly ModelDerivedTextureResource[];
}
/** Deadline and cancellation cover hashing and bounded synchronous qualification. */
export interface ModelTextureResourceQualificationOptions { readonly signal?: AbortSignal; readonly timeoutMs?: number }
/** JSON resource identity without a Blob, renderer allocation or credential-bearing URL. */
export interface QualifiedModelTextureResource extends ModelTextureResourceBinding {
  readonly kind: "image" | "buffer";
  readonly contentHash: string;
  readonly byteLength: number;
  readonly mimeType: string;
  readonly location: GpuModelResourceLocation;
  readonly exportEmbeddingPolicy: GpuModelTextureEmbeddingPolicy;
}
/** Trusted package metadata, including authored sourceMetadata; not a public-safe diagnostic projection. */
export interface QualifiedModelTextureResources {
  readonly contractVersion: 1;
  readonly manifest: AssetManifest;
  readonly source: GpuModelProvenance;
  readonly resources: readonly QualifiedModelTextureResource[];
  readonly materials: readonly GpuModelMaterial[];
  readonly textures: readonly GpuModelTexture[];
  readonly derived: readonly ModelDerivedTextureResource[];
}
/** Fixed, value-free errors. No caller metadata or upstream exception text is exposed. */
export class ModelTextureResourceError extends TypeError {
  constructor(public readonly code: "invalid-input" | "limit-exceeded" | "unverified-graph" | "package-mismatch" | "resource-mismatch" | "role-mismatch" | "aborted" | "deadline-exceeded") {
    super(`Invalid model texture resources: ${code}`); this.name = "ModelTextureResourceError";
  }
}
function fail(code: ModelTextureResourceError["code"] = "invalid-input"): never { throw new ModelTextureResourceError(code); }
function fields(value: unknown, allowed?: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail();
  const keys = Reflect.ownKeys(value);
  if (keys.length > 1024) fail("limit-exceeded");
  const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const key of keys) {
    if (typeof key !== "string" || key.length > 128 || ["__proto__", "prototype", "constructor"].includes(key) || (allowed && !allowed.includes(key))) fail();
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
  const result: unknown[] = [];
  for (let i = 0; i < value.length; i++) {
    const property = Object.getOwnPropertyDescriptor(value, String(i));
    if (!property || !("value" in property) || !property.enumerable) fail();
    result.push(property.value);
  }
  return result;
}
function snapshot(value: unknown, budget: { values: number; characters: number }, depth = 0): unknown {
  if (--budget.values < 0 || depth > MODEL_TEXTURE_RESOURCE_LIMITS.depth) fail("limit-exceeded");
  if (value === null || value === undefined || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    budget.characters -= value.length;
    if (value.length > 2048 || budget.characters < 0) fail("limit-exceeded");
    return value;
  }
  if (Array.isArray(value)) return Object.freeze(array(value, MODEL_TEXTURE_RESOURCE_LIMITS.resources).map((v) => snapshot(v, budget, depth + 1)));
  const result = fields(value);
  for (const key of Object.keys(result)) {
    budget.characters -= key.length;
    if (budget.characters < 0) fail("limit-exceeded");
    result[key] = snapshot(result[key], budget, depth + 1);
  }
  return Object.freeze(result);
}
function token(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u.test(value)) fail();
  return value;
}
const compare = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
const imageMime = (value: string): boolean => ["image/png", "image/jpeg", "image/webp", "image/ktx2"].includes(value);
const bufferMime = (value: string): boolean => ["application/octet-stream", "application/vnd.plasius.gpu-buffer"].includes(value);
function storageRole(role: unknown, file: AssetFileDescriptor): void {
  const valid = role === "texture" ? file.role === "texture" && imageMime(file.contentType)
    : role === "material" || role === "animation" ? file.role === "metadata" && file.contentType === "application/json"
      : role === "mesh" ? (file.role === "binary" && bufferMime(file.contentType)) || (file.role === "model" && (file.contentType.startsWith("model/") || ["application/json", "application/octet-stream", "text/plain"].includes(file.contentType)))
        : role === "auxiliary" && ((file.role === "binary" && bufferMime(file.contentType)) || (file.role === "metadata" && file.contentType === "application/json"));
  if (!valid) fail("role-mismatch");
}

/**
 * Qualify reload metadata without parsing formats, allocating GPU objects or
 * replacing authored resource identities. Metadata is trusted package content;
 * adapters must sanitize it before public use. This is not promotion evidence.
 */
export async function qualifyModelTextureResources(input: ModelTextureResourceQualificationInput, options: ModelTextureResourceQualificationOptions = {}): Promise<QualifiedModelTextureResources> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let signal: AbortSignal | undefined;
  let onAbort: (() => void) | undefined;
  try {
    const started = performance.now();
    const controls = fields(options, ["signal", "timeoutMs"]);
    const timeoutMs = controls.timeoutMs === undefined ? 10_000 : controls.timeoutMs;
    if (typeof timeoutMs !== "number" || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MODEL_TEXTURE_RESOURCE_LIMITS.timeoutMs) fail();
    signal = controls.signal as AbortSignal | undefined;
    const aborted = Object.getOwnPropertyDescriptor(AbortSignal.prototype, "aborted")!.get!;
    const check = () => {
      if (signal !== undefined && aborted.call(signal)) fail("aborted");
      if (performance.now() - started >= timeoutMs) fail("deadline-exceeded");
    };
    check();
    const root = fields(input, ["manifest", "packageManifest", "files", "graph", "resources", "derived"]);
    const graph = root.graph;
    if (!isGpuModelResourceGraph(graph)) fail("unverified-graph");
    if (graph.nodes.length > MODEL_TEXTURE_RESOURCE_LIMITS.nodes) fail("limit-exceeded");
    const budget = { values: MODEL_TEXTURE_RESOURCE_LIMITS.values, characters: MODEL_TEXTURE_RESOURCE_LIMITS.characters };
    const inventory = snapshot(root.packageManifest, budget) as ModelResourceManifestQualificationInput["packageManifest"];
    const bindings = array(snapshot(root.resources, budget), MODEL_TEXTURE_RESOURCE_LIMITS.resources).map((value) => {
      const binding = fields(value, ["resourceId", "filePath"]);
      return Object.freeze({ resourceId: token(binding.resourceId), filePath: tokenPath(binding.filePath) });
    });
    const derived = array(snapshot(root.derived, budget), MODEL_TEXTURE_RESOURCE_LIMITS.derived).map((value) => {
      const record = fields(value, ["role", "filePath", "sourceResourceIds"]);
      if (record.role !== "gpu-upload" && record.role !== "texture-atlas") fail("role-mismatch");
      const ids = array(record.sourceResourceIds, MODEL_TEXTURE_RESOURCE_LIMITS.resources).map(token);
      if (!ids.length || new Set(ids).size !== ids.length) fail("resource-mismatch");
      return Object.freeze({ role: record.role, filePath: tokenPath(record.filePath), sourceResourceIds: Object.freeze(ids.sort(compare)) });
    });
    check();
    const interrupted = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new ModelTextureResourceError("deadline-exceeded")), Math.max(1, timeoutMs - (performance.now() - started)));
      onAbort = () => reject(new ModelTextureResourceError("aborted"));
      if (signal) AbortSignal.prototype.addEventListener.call(signal, "abort", onAbort, { once: true });
    });
    // The existing qualifier snapshots metadata AND byte payloads synchronously
    // before its first digest. Promise.race owns both rejection paths immediately.
    const manifest = await Promise.race([
      qualifyModelResourceManifest({ manifest: root.manifest as AssetManifest, files: root.files as ModelResourceManifestQualificationInput["files"], packageManifest: inventory, signal, timeoutMs }),
      interrupted,
    ]);
    check();
    const files = new Map(manifest.files.map((file) => [file.path, file]));
    const roles = new Map(inventory.entries.map((entry) => [entry.path, entry.role]));
    for (const entry of inventory.entries) storageRole(entry.role, files.get(entry.path)!);
    const resources = new Map(graph.nodes.filter((node) => node.kind === "resource").map((node) => [node.id, node.value]));
    if (bindings.length !== resources.size || new Set(bindings.map((b) => b.resourceId)).size !== bindings.length) fail("resource-mismatch");
    const resourceFiles = new Set<string>();
    const qualified = bindings.map((binding): QualifiedModelTextureResource => {
      const value = resources.get(binding.resourceId); const file = files.get(binding.filePath);
      if (!value || !file) fail("resource-mismatch");
      const { resource, location, exportEmbeddingPolicy } = value;
      if (location.kind === "external") {
        if (binding.filePath !== location.relativePath || file.sha256 !== resource.contentHash || file.byteLength !== resource.byteLength || file.contentType !== resource.mimeType) fail("resource-mismatch");
        if (resource.kind === "image" ? roles.get(file.path) !== "texture" : file.role !== "binary") fail("role-mismatch");
      } else if (binding.filePath !== manifest.entrypoint || file.role !== "model") fail("resource-mismatch");
      resourceFiles.add(binding.filePath);
      return Object.freeze({ ...binding, kind: resource.kind, contentHash: resource.contentHash, byteLength: resource.byteLength, mimeType: resource.mimeType, location, exportEmbeddingPolicy });
    });
    const outputFiles = new Set<string>();
    for (const output of derived) {
      const file = files.get(output.filePath);
      if (!file || outputFiles.has(output.filePath) || resourceFiles.has(output.filePath)) fail("resource-mismatch");
      outputFiles.add(output.filePath);
      for (const id of output.sourceResourceIds) {
        const source = resources.get(id);
        if (!source || (output.role === "texture-atlas" && source.resource.kind !== "image")) fail("resource-mismatch");
      }
      if (output.role === "gpu-upload" ? file.role !== "binary" || !bufferMime(file.contentType) || roles.get(file.path) !== "auxiliary"
        : file.role !== "texture" || !imageMime(file.contentType) || roles.get(file.path) !== "texture") fail("role-mismatch");
    }
    const materials = graph.nodes.filter((node) => node.kind === "material").map((node) => node.value);
    const textures = graph.nodes.filter((node) => node.kind === "texture").map((node) => node.value);
    const source = graph.nodes.find((node) => node.kind === "provenance")!;
    if (source.kind !== "provenance") fail();
    // Bound authored metadata without substituting a new material/texture schema.
    snapshot({ materials, textures, source: source.value }, budget);
    check();
    return Object.freeze({ contractVersion: 1, manifest, source: source.value,
      resources: Object.freeze(qualified.sort((a, b) => compare(a.resourceId, b.resourceId))),
      materials: Object.freeze(materials), textures: Object.freeze(textures),
      derived: Object.freeze(derived.sort((a, b) => compare(a.filePath, b.filePath))) });
  } catch (error) {
    if (error instanceof ModelTextureResourceError) throw error;
    if (error instanceof ModelResourceManifestError) return fail(error.code === "aborted" || error.code === "deadline-exceeded" || error.code === "limit-exceeded" ? error.code : "package-mismatch");
    return fail();
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    if (signal && onAbort) AbortSignal.prototype.removeEventListener.call(signal, "abort", onAbort);
  }
}
function tokenPath(value: unknown): string {
  // Full portable-path and collision checks are reused from the byte qualifier.
  if (typeof value !== "string" || !value.length || value.length > 1024) fail();
  return value;
}
