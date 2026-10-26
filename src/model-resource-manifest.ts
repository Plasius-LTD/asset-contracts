import type { ResourcePackageManifest } from "@plasius/gpu-model-core";
import { computeSha256 } from "@plasius/gpu-shader";
import {
  createAssetManifest, createModelAssetManifest,
  type AssetManifest, type ModelAssetManifestInput,
} from "./index.js";

/** Fixed ceilings for the opt-in, in-memory model package qualification boundary. */
export const MODEL_RESOURCE_MANIFEST_LIMITS = Object.freeze({
  files: 16_384, fileBytes: 64 * 1024 * 1024, totalBytes: 128 * 1024 * 1024,
  metadataValues: 262_144, metadataDepth: 16, timeoutMs: 60_000,
});

/** Exported file bytes and their independently supplied canonical MIME declaration. */
export interface ModelResourceFileInput {
  readonly path: string;
  readonly bytes: Uint8Array;
  readonly contentType: string;
}

/** Complete exported inventory; embedded resources remain inside their owning file. */
export interface ModelResourceManifestQualificationInput {
  readonly manifest: AssetManifest;
  readonly packageManifest: ResourcePackageManifest;
  readonly files: readonly ModelResourceFileInput[];
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
}

/** Value-free failure, suitable for callers' bounded diagnostic projections. */
export class ModelResourceManifestError extends TypeError {
  constructor(public readonly code: "invalid-input" | "limit-exceeded" | "path-conflict" | "inventory-mismatch" | "content-mismatch" | "aborted" | "deadline-exceeded") {
    super(`Invalid model resource manifest: ${code}`);
    this.name = "ModelResourceManifestError";
  }
}
// Constructors are public; only failures created here carry trusted categories.
// WeakMap lookup never invokes caller getters or proxy prototype traps.
const failureCodes = new WeakMap<object, ModelResourceManifestError["code"]>();
function failure(code: ModelResourceManifestError["code"]): ModelResourceManifestError {
  const error = new ModelResourceManifestError(code);
  failureCodes.set(error, code);
  return error;
}
/** @internal Read a private category without inspecting the supplied exception. */
export function modelResourceManifestFailureCode(error: unknown): ModelResourceManifestError["code"] | undefined {
  return typeof error === "object" && error !== null ? failureCodes.get(error) : undefined;
}
function fail(code: ModelResourceManifestError["code"] = "invalid-input"): never { throw failure(code); }
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail();
  const output: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  const keys = Reflect.ownKeys(value);
  if (keys.length > MODEL_RESOURCE_MANIFEST_LIMITS.files) fail("limit-exceeded");
  for (const key of keys) {
    if (typeof key !== "string" || ["__proto__", "constructor", "prototype"].includes(key)) fail();
    if (key.length > 128) fail("limit-exceeded");
    const property = Object.getOwnPropertyDescriptor(value, key)!;
    if (!("value" in property) || !property.enumerable) fail();
    output[key] = property.value;
  }
  return output;
}
function list(value: unknown): unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) fail();
  if (value.length > MODEL_RESOURCE_MANIFEST_LIMITS.files) fail("limit-exceeded");
  if (Reflect.ownKeys(value).length !== value.length + 1) fail();
  const output: unknown[] = [];
  for (let i = 0; i < value.length; i++) {
    const property = Object.getOwnPropertyDescriptor(value, String(i));
    if (!property || !("value" in property) || !property.enumerable) fail();
    output.push(property.value);
  }
  return output;
}
function snapshot(value: unknown, budget: { remaining: number }, depth = 0): unknown {
  if (--budget.remaining < 0 || depth > MODEL_RESOURCE_MANIFEST_LIMITS.metadataDepth) fail("limit-exceeded");
  if (value === null || value === undefined || typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.length > 2048) fail("limit-exceeded");
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail();
    return value;
  }
  if (Array.isArray(value)) return Object.freeze(list(value).map((item) => snapshot(item, budget, depth + 1)));
  const fields = record(value);
  for (const key of Object.keys(fields)) fields[key] = snapshot(fields[key], budget, depth + 1);
  return Object.freeze(fields);
}
function path(value: unknown): string {
  if (typeof value !== "string" || value.length > 1024 || !value.length) fail();
  for (const part of value.split("/")) {
    if (part.length > 255 || !/^[A-Za-z0-9_][A-Za-z0-9_.-]*$/u.test(part)
      || part.endsWith(".") || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/iu.test(part)) fail();
  }
  return value;
}
function contentType(value: unknown): string {
  if (typeof value !== "string" || value.length > 128
    || !/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+(?:; charset=utf-8)?$/u.test(value)) fail();
  return value;
}
function uniquePaths(paths: readonly string[]): void {
  const seen = new Set<string>();
  for (const value of paths) {
    const normalized = path(value).toLowerCase();
    if (seen.has(normalized)) fail("path-conflict");
    seen.add(normalized);
  }
  for (const value of seen) {
    for (let offset = value.indexOf("/"); offset !== -1; offset = value.indexOf("/", offset + 1)) {
      if (seen.has(value.slice(0, offset))) fail("path-conflict");
    }
  }
}

const typedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype);
const byteLengthGetter = Object.getOwnPropertyDescriptor(typedArrayPrototype, "byteLength")!.get!;
const bufferGetter = Object.getOwnPropertyDescriptor(typedArrayPrototype, "buffer")!.get!;

/**
 * Binds an exported model inventory to exact file bytes without parsing formats,
 * fetching resources or changing legacy factories. Callers own remote rollout,
 * content inspection and durable storage. The result is evidence at call time,
 * not a promotion attestation. All inputs are copied before the first digest.
 */
export async function qualifyModelResourceManifest(input: ModelResourceManifestQualificationInput): Promise<AssetManifest> {
  try { return await qualify(input); }
  catch (error) {
    return fail(modelResourceManifestFailureCode(error) ?? "invalid-input");
  }
}

async function qualify(input: ModelResourceManifestQualificationInput): Promise<AssetManifest> {
  const started = performance.now();
  const root = record(input);
  if (Object.keys(root).some((key) => !["manifest", "packageManifest", "files", "signal", "timeoutMs"].includes(key))) fail();
  const timeout = root.timeoutMs ?? 10_000;
  if (typeof timeout !== "number" || !Number.isSafeInteger(timeout) || timeout < 1 || timeout > MODEL_RESOURCE_MANIFEST_LIMITS.timeoutMs) fail();
  const signal = root.signal;
  if (signal !== undefined && !(signal instanceof AbortSignal)) fail();
  const check = (): void => {
    if (signal?.aborted) fail("aborted");
    if (performance.now() - started >= timeout) fail("deadline-exceeded");
  };
  check();
  const budget = { remaining: MODEL_RESOURCE_MANIFEST_LIMITS.metadataValues };
  const rawManifest = snapshot(root.manifest, budget) as AssetManifest;
  const inventory = record(snapshot(root.packageManifest, budget));
  if (Object.keys(inventory).some((key) => !["format", "entries"].includes(key))
    || !["zip", "tar", "directory-manifest", "inline"].includes(inventory.format as string)) fail();
  let manifest: AssetManifest;
  try {
    manifest = rawManifest.assetKind === "model"
      ? createModelAssetManifest(rawManifest as ModelAssetManifestInput)
      : createAssetManifest(rawManifest);
  } catch { return fail(); }
  uniquePaths(manifest.files.map((file) => file.path));
  if (!manifest.files.some((file) => file.path === path(manifest.entrypoint))) fail("inventory-mismatch");
  const descriptors = new Map(manifest.files.map((file) => [file.path, file]));
  let total = 0;
  for (const file of manifest.files) {
    if (!Number.isSafeInteger(file.byteLength)) fail();
    if (file.byteLength > MODEL_RESOURCE_MANIFEST_LIMITS.fileBytes) fail("limit-exceeded");
    total += file.byteLength;
    if (total > MODEL_RESOURCE_MANIFEST_LIMITS.totalBytes) fail("limit-exceeded");
    contentType(file.contentType);
  }
  const entries = list(inventory.entries).map(record);
  uniquePaths(entries.map((entry) => path(entry.path)));
  const ids = new Set<string>();
  for (const entry of entries) {
    if (Object.keys(entry).some((key) => !["id", "path", "role", "contentType"].includes(key))
      || typeof entry.id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u.test(entry.id)
      || ids.has(entry.id) || !["mesh", "material", "texture", "animation", "auxiliary"].includes(entry.role as string)) fail();
    ids.add(entry.id);
    const descriptor = descriptors.get(entry.path as string);
    if (!descriptor) fail("inventory-mismatch");
    if (entry.contentType !== undefined && contentType(entry.contentType) !== descriptor.contentType) fail("content-mismatch");
  }
  if (entries.length !== descriptors.size) fail("inventory-mismatch");
  const payloads = list(root.files).map((value) => {
    const file = record(value);
    if (Object.keys(file).length !== 3 || Object.keys(file).some((key) => !["path", "bytes", "contentType"].includes(key))) fail();
    const filePath = path(file.path);
    if (!(file.bytes instanceof Uint8Array) || Object.getPrototypeOf(file.bytes) !== Uint8Array.prototype
      || !(bufferGetter.call(file.bytes) instanceof ArrayBuffer)) fail();
    const descriptor = descriptors.get(filePath);
    if (!descriptor) fail("inventory-mismatch");
    if (byteLengthGetter.call(file.bytes) !== descriptor.byteLength || contentType(file.contentType) !== descriptor.contentType) fail("content-mismatch");
    return { path: filePath, bytes: file.bytes, descriptor };
  });
  uniquePaths(payloads.map((file) => file.path));
  if (payloads.length !== descriptors.size) fail("inventory-mismatch");
  // Descriptor budgets and actual lengths were checked before allocating copies.
  const copies = payloads.map((file) => ({ ...file, bytes: new Uint8Array(file.bytes) }));
  for (const file of copies) {
    check();
    let hash: string;
    try { hash = await computeSha256(file.bytes); } catch { return fail("content-mismatch"); }
    check();
    if (hash !== file.descriptor.sha256) fail("content-mismatch");
  }
  return Object.freeze({ ...manifest, files: Object.freeze([...manifest.files].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)) });
}
