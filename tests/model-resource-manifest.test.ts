import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ResourcePackageManifest } from "@plasius/gpu-model-core";
import {
  createAssetFileDescriptor, createAssetManifest,
  qualifyModelResourceManifest, MODEL_RESOURCE_MANIFEST_LIMITS,
  type AssetManifest, type ModelResourceFileInput,
} from "../src/index.js";
import { canonicalResourcePackage } from "./fixtures/canonical-resource-package.js";

const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
function fixture() {
  const files: ModelResourceFileInput[] = [
    { path: "textures/source.png", bytes: new Uint8Array([1, 2, 3]), contentType: "image/png" },
    { path: "model.gltf", bytes: new TextEncoder().encode('{"asset":{"version":"2.0"}}'), contentType: "model/gltf+json" },
    { path: "derived/vertices.bin", bytes: new Uint8Array([4, 5, 6, 7]), contentType: "application/octet-stream" },
  ];
  const manifest: AssetManifest = createAssetManifest({
    assetId: "canonical-fixture", version: "1.0.0", entrypoint: "model.gltf",
    createdAt: "2026-10-24T00:00:00.000Z", sourceAdapter: "local-import",
    files: files.map((file) => createAssetFileDescriptor({
      path: file.path, byteLength: file.bytes.byteLength, sha256: digest(file.bytes),
      contentType: file.contentType, role: file.path.endsWith(".png") ? "texture" : file.path.endsWith(".bin") ? "binary" : "model",
    })),
  });
  const packageManifest: ResourcePackageManifest = { format: "directory-manifest", entries: files.map((file, i) => ({
    id: `file-${i}`, path: file.path, role: i === 0 ? "texture" : "mesh", contentType: file.contentType,
  })) };
  return { manifest, packageManifest, files };
}

afterEach(() => vi.restoreAllMocks());
describe("canonical package descriptor qualification", () => {
  it("qualifies a published core verified document with external and embedded resources", async () => {
    const canonical = await canonicalResourcePackage();
    const base = fixture().manifest;
    const manifest = { ...base, files: canonical.files.map((file) => ({
      path: file.path, byteLength: file.bytes.byteLength, sha256: digest(file.bytes), contentType: file.contentType,
      role: file.path.endsWith(".png") ? "texture" as const : "model" as const,
    })) };
    const result = await qualifyModelResourceManifest({ manifest, files: canonical.files, packageManifest: canonical.packageManifest });
    expect(result.files).toHaveLength(2);
    expect(canonical.document.provenance.sourceContentHash).toBe(result.files[0]!.sha256);
    const image = canonical.graph.nodes.find((node) => node.kind === "resource" && node.id === "source-image");
    const embedded = canonical.graph.nodes.find((node) => node.kind === "resource" && node.id === "derived-positions");
    if (image?.kind !== "resource" || embedded?.kind !== "resource") throw new Error("missing fixture resource");
    expect(image.value.location).toEqual({ kind: "external", relativePath: "textures/source.png" });
    expect(image.value.resource.contentHash).toBe(result.files[1]!.sha256);
    expect(new Uint8Array(await image.value.resource.payload.arrayBuffer())).toEqual(canonical.image);
    expect(embedded.value.location).toEqual({ kind: "embedded" });
    expect(embedded.value.resource.contentHash).toBe(digest(canonical.positions));
    const json = JSON.parse(new TextDecoder().decode(canonical.files[0]!.bytes));
    expect(new Uint8Array(Buffer.from(json.buffers[0].uri.split(",")[1], "base64"))).toEqual(canonical.positions);
    expect(new Uint8Array(await embedded.value.resource.payload.arrayBuffer())).toEqual(canonical.positions);
  });
  it("binds exact bytes and preserves source/derived paths, roles and source adapter", async () => {
    const input = fixture();
    const output = await qualifyModelResourceManifest(input);
    expect(output.files.map((file) => file.path)).toEqual(["derived/vertices.bin", "model.gltf", "textures/source.png"]);
    expect(output.sourceAdapter).toBe(input.manifest.sourceAdapter);
    for (const file of output.files) expect(file).toEqual(input.manifest.files.find((value) => value.path === file.path));
    expect(Object.isFrozen(output)).toBe(true);
    expect(Object.isFrozen(output.files)).toBe(true);
    expect(output.files.every(Object.isFrozen)).toBe(true);
    const reversed = { ...input, manifest: { ...input.manifest, files: [...input.manifest.files].reverse() },
      packageManifest: { ...input.packageManifest, entries: [...input.packageManifest.entries].reverse() }, files: [...input.files].reverse() };
    expect(await qualifyModelResourceManifest(reversed)).toEqual(output);
  });

  it.each(["../secret", "/absolute", "a/./b", "a//b", "a\\b", "%2e%2e/x", "a?x", "a#x", "CON.png", "a.", "a\n.png"])("rejects unsafe package paths %j", async (path) => {
    const input = fixture();
    input.packageManifest = { ...input.packageManifest, entries: [{ ...input.packageManifest.entries[0]!, path }, ...input.packageManifest.entries.slice(1)] };
    await expect(qualifyModelResourceManifest(input)).rejects.toThrow();
  });

  it.each([NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])("rejects invalid descriptor byte counts %s", async (byteLength) => {
    const input = fixture();
    input.manifest = { ...input.manifest, files: [{ ...input.manifest.files[0]!, byteLength }, ...input.manifest.files.slice(1)] };
    await expect(qualifyModelResourceManifest(input)).rejects.toThrow();
  });

  it("rejects missing entrypoint, inventory entries, payloads, extra payloads and duplicate ids", async () => {
    const missing = fixture(); missing.manifest = { ...missing.manifest, entrypoint: "absent.gltf" };
    const inventory = fixture(); inventory.packageManifest = { ...inventory.packageManifest, entries: inventory.packageManifest.entries.slice(1) };
    const payload = fixture(); payload.files.pop();
    const extra = fixture(); extra.files.push({ path: "extra.bin", bytes: new Uint8Array(), contentType: "application/octet-stream" });
    const ids = fixture(); ids.packageManifest = { ...ids.packageManifest, entries: ids.packageManifest.entries.map((entry) => ({ ...entry, id: "same" })) };
    for (const input of [missing, inventory, payload, extra, ids]) await expect(qualifyModelResourceManifest(input)).rejects.toThrow();
  });

  it("rejects duplicate, case-conflicting and file/directory paths", async () => {
    for (const path of ["model.gltf", "MODEL.GLTF", "model.gltf/child.bin"]) {
      const input = fixture();
      input.manifest = { ...input.manifest, files: [{ ...input.manifest.files[0]!, path }, ...input.manifest.files.slice(1)] };
      await expect(qualifyModelResourceManifest(input)).rejects.toThrow();
    }
    const input = fixture(); input.files.push(input.files[0]!);
    await expect(qualifyModelResourceManifest(input)).rejects.toThrow();
  });

  it("rejects digest, byte length and declared content type mismatches", async () => {
    for (const change of [{ sha256: "f".repeat(64) }, { byteLength: 2 }, { contentType: "image/jpeg" }, { contentType: "not-a-mime" }]) {
      const input = fixture(); input.manifest = { ...input.manifest, files: [{ ...input.manifest.files[0]!, ...change }, ...input.manifest.files.slice(1)] };
      await expect(qualifyModelResourceManifest(input)).rejects.toThrow();
    }
    const input = fixture(); input.files[0] = { ...input.files[0]!, contentType: "image/jpeg" };
    await expect(qualifyModelResourceManifest(input)).rejects.toThrow();
  });

  it("snapshots bytes and metadata before asynchronous hashing", async () => {
    const input = fixture(); const expected = await qualifyModelResourceManifest(input);
    const pending = qualifyModelResourceManifest(input);
    input.files[0]!.bytes.fill(0);
    input.manifest = { ...input.manifest, entrypoint: "changed.gltf" };
    (input.packageManifest.entries as unknown[]).length = 0;
    expect(await pending).toEqual(expected);
  });

  it("rejects getters, exotic records, sparse arrays and shared payload buffers without exposing values", async () => {
    let calls = 0; const input = fixture();
    input.manifest = { ...input.manifest };
    Object.defineProperty(input.manifest, "entrypoint", { get() { calls++; return "synthetic-private"; } });
    await expect(qualifyModelResourceManifest(input)).rejects.toThrow();
    expect(calls).toBe(0);
    const sparse = fixture(); sparse.files = new Array(3);
    const shared = fixture(); shared.files[0] = { ...shared.files[0]!, bytes: new Uint8Array(new SharedArrayBuffer(3)) };
    for (const bad of [sparse, shared, { ...fixture(), packageManifest: new Date() }]) {
      await expect(qualifyModelResourceManifest(bad as ReturnType<typeof fixture>)).rejects.toThrow();
    }
  });

  it("enforces fixed file/aggregate budgets before hashing", async () => {
    const count = fixture(); count.files = new Array(MODEL_RESOURCE_MANIFEST_LIMITS.files + 1);
    await expect(qualifyModelResourceManifest(count)).rejects.toThrow(/limit-exceeded/);
    const bytes = fixture(); bytes.manifest = { ...bytes.manifest, files: [{ ...bytes.manifest.files[0]!, byteLength: MODEL_RESOURCE_MANIFEST_LIMITS.fileBytes + 1 }, ...bytes.manifest.files.slice(1)] };
    await expect(qualifyModelResourceManifest(bytes)).rejects.toThrow(/limit-exceeded/);
    const aggregate = fixture();
    aggregate.manifest = { ...aggregate.manifest, files: aggregate.manifest.files.map((file) => ({ ...file, byteLength: MODEL_RESOURCE_MANIFEST_LIMITS.fileBytes })) };
    await expect(qualifyModelResourceManifest(aggregate)).rejects.toThrow(/limit-exceeded/);
  });

  it("rejects malformed shapes, options and metadata with fixed value-free errors", async () => {
    const badInputs: unknown[] = [null, [], { ...fixture(), extra: "private" }];
    for (const timeoutMs of [0, -1, NaN, Infinity, 1.5, 60_001, "private"]) badInputs.push({ ...fixture(), timeoutMs });
    for (const signal of [null, {}, "private"]) badInputs.push({ ...fixture(), signal });
    for (const packageManifest of [null, { format: "rar", entries: [] }, { ...fixture().packageManifest, private: true }]) badInputs.push({ ...fixture(), packageManifest });
    const deep = fixture(); let nested: Record<string, unknown> = {};
    for (let i = 0; i < 20; i++) nested = { child: nested };
    badInputs.push({ ...deep, manifest: { ...deep.manifest, nested } });
    const sparse = fixture(); badInputs.push({ ...sparse, manifest: { ...sparse.manifest, files: new Array(3) } });
    badInputs.push(new Proxy({}, { ownKeys() { throw new Error("synthetic-private"); } }));
    for (const input of badInputs) {
      try { await qualifyModelResourceManifest(input as ReturnType<typeof fixture>); throw new Error("accepted invalid input"); }
      catch (error) { expect(error).toHaveProperty("name", "ModelResourceManifestError"); expect((error as Error).message).toMatch(/^Invalid model resource manifest: [a-z-]+$/); }
    }
  });

  it("rejects malformed entry metadata, payload shapes and duplicate inventory paths", async () => {
    for (const change of [{ id: "bad/id" }, { role: "private" }, { private: true }, { path: "absent.bin" }, { path: "MODEL.GLTF" }]) {
      const input = fixture(); input.packageManifest = { ...input.packageManifest, entries: [{ ...input.packageManifest.entries[0]!, ...change }, ...input.packageManifest.entries.slice(1)] } as ResourcePackageManifest;
      await expect(qualifyModelResourceManifest(input)).rejects.toThrow();
    }
    for (const change of [{ bytes: [] }, { bytes: new ArrayBuffer(3) }, { private: true }, { path: "absent.bin" }]) {
      const input = fixture(); input.files[0] = { ...input.files[0]!, ...change } as ModelResourceFileInput;
      await expect(qualifyModelResourceManifest(input)).rejects.toThrow();
    }
  });

  it("uses intrinsic payload lengths without executing caller getters", async () => {
    const input = fixture(); let calls = 0;
    Object.defineProperty(input.files[0]!.bytes, "byteLength", { get() { calls++; return 100; } });
    Object.defineProperty(input.files[0]!.bytes, "buffer", { get() { calls++; throw new Error("private"); } });
    await expect(qualifyModelResourceManifest(input)).resolves.toHaveProperty("entrypoint", "model.gltf");
    expect(calls).toBe(0);
  });

  it("preserves typed model metadata through the specialized existing factory", async () => {
    const input = fixture();
    const model = { ...input.manifest, assetKind: "model" as const, modelAbiHash: "0".repeat(64), providedSemantics: [], defaultStyleProfile: null,
      gpuInterface: { interfaceId: "fixture-interface", interfaceVersion: "1.0.0", manifestUri: "https://assets.example.invalid/fixture/1.0.0/manifest.json", manifestSha256: "2".repeat(64), interfaceAbiHash: "1".repeat(64), modelAbiHash: "0".repeat(64) } };
    const result = await qualifyModelResourceManifest({ ...input, manifest: model });
    expect(result).toMatchObject({ assetKind: "model", gpuInterface: model.gpuInterface, defaultStyleProfile: null });
    const incompatibleModel = { ...model, modelAbiHash: "3".repeat(64) };
    await expect(qualifyModelResourceManifest({ ...input, manifest: incompatibleModel })).rejects.toThrow();
  });

  it("accepts missing optional inventory MIME declarations and zero-byte auxiliary files", async () => {
    const input = fixture();
    input.packageManifest = { ...input.packageManifest, entries: input.packageManifest.entries.map((entry) => ({ id: entry.id, role: entry.role, path: entry.path })) };
    expect((await qualifyModelResourceManifest(input)).files).toHaveLength(3);
    const empty = { path: "empty.bin", bytes: new Uint8Array(), contentType: "application/octet-stream" };
    input.files.push(empty);
    input.manifest = { ...input.manifest, files: [...input.manifest.files, { path: empty.path, byteLength: 0, sha256: digest(empty.bytes), contentType: empty.contentType, role: "binary" }] };
    input.packageManifest = { ...input.packageManifest, entries: [...input.packageManifest.entries, { id: "empty", path: empty.path, role: "auxiliary" }] };
    await expect(qualifyModelResourceManifest(input)).resolves.toHaveProperty("files.length", 4);
  });

  it("checks cancellation and deadline without returning partial qualification", async () => {
    const abort = new AbortController(); abort.abort();
    await expect(qualifyModelResourceManifest({ ...fixture(), signal: abort.signal })).rejects.toThrow(/aborted/);
    const later = new AbortController(); const pending = qualifyModelResourceManifest({ ...fixture(), signal: later.signal }); later.abort();
    await expect(pending).rejects.toThrow(/aborted/);
    vi.spyOn(performance, "now").mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValue(1000);
    await expect(qualifyModelResourceManifest({ ...fixture(), timeoutMs: 1 })).rejects.toThrow(/deadline-exceeded/);
  });

  it("leaves legacy factories and disabled/rollback composition compatible", async () => {
    const input = fixture(); const invalid = { ...input, files: [] };
    const choose = (enabled: boolean) => enabled ? qualifyModelResourceManifest(invalid) : Promise.resolve(createAssetManifest(input.manifest));
    expect(await choose(false)).toEqual(input.manifest);
    await expect(choose(true)).rejects.toThrow();
    expect(await choose(false)).toEqual(input.manifest);
    expect(createAssetManifest({ ...input.manifest, entrypoint: "not-yet-written.gltf" }).entrypoint).toBe("not-yet-written.gltf");
  });
});
