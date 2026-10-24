import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createGpuModelDocument, createGpuModelResourceGraph } from "@plasius/gpu-model-core";
import { createAssetManifest, qualifyModelTextureResources, MODEL_TEXTURE_RESOURCE_LIMITS,
  type ModelTextureResourceQualificationInput } from "../src/index.js";
import { textureResourcePackage } from "./fixtures/texture-resource-package.js";
const qualify = (value: unknown) => qualifyModelTextureResources(value as ModelTextureResourceQualificationInput);
afterEach(() => vi.restoreAllMocks());
describe("reloadable model texture/resource roles", () => {
  it("retains canonical material, texture, sampler, transform and source identities across JSON reload", async () => {
    const { input, document } = await textureResourcePackage(); const result = await qualify(input);
    const json = JSON.parse(JSON.stringify(result));
    expect(json.contractVersion).toBe(1); expect(json.materials).toEqual(document.materials); expect(json.textures).toEqual(document.textures);
    const texture = json.textures.find((t: { id: string }) => t.id === json.materials[0].textures.baseColor.textureId);
    const source = json.resources.find((r: { resourceId: string }) => r.resourceId === texture.imageResourceId);
    expect(source).toMatchObject({ contentHash: texture.contentHash, byteLength: texture.byteLength, mimeType: texture.mimeType,
      filePath: "textures/source.png", location: { kind: "external", relativePath: "textures/source.png" } });
    const file = json.manifest.files.find((f: { path: string }) => f.path === source.filePath);
    expect(file.sha256).toBe(source.contentHash); expect(file.role).toBe("texture");
    expect(json.materials[0].textures.baseColor.transform.offset).toEqual([0.25, 0.5]);
    expect(json.textures[0].sampler.wrapT).toBe("clamp-to-edge");
    expect(json.resources.find((r: { resourceId: string }) => r.resourceId === "derived-positions").location).toEqual({ kind: "embedded" });
    expect(json.resources.some((r: object) => "payload" in r)).toBe(false);
    const reloaded = createGpuModelDocument({ ...document, materials: json.materials, textures: json.textures });
    expect(reloaded.materials).toEqual(document.materials);
    expect(reloaded.textures).toEqual(document.textures);
    expect(JSON.parse(new TextDecoder().decode(input.files[2]!.bytes))).toEqual(json.materials[0]);
  });
  it("records GPU upload and atlas output without replacing original resource bytes or metadata", async () => {
    const { input } = await textureResourcePackage(); const result = await qualify(input);
    expect(result.derived).toEqual([...input.derived].reverse());
    expect(result.resources.find((r) => r.resourceId === "source-image")!.contentHash).not.toBe(result.manifest.files.find((f) => f.path === "derived/atlas.png")!.sha256);
    expect(result.textures[0]!.relativePath).toBe("textures/source.png");
    expect(Object.isFrozen(result)).toBe(true); expect(Object.isFrozen(result.derived[0]!.sourceResourceIds)).toBe(true);
    expect(Object.isFrozen(result.materials[0]!.textures.baseColor!.transform)).toBe(true);
  });
  it("serializes deterministically regardless of inventory, binding and derived order", async () => {
    const { input } = await textureResourcePackage(); const first = await qualify(input);
    const second = await qualify({ ...input, resources: [...input.resources].reverse(), derived: [...input.derived].reverse(), files: [...input.files].reverse(),
      manifest: { ...input.manifest, files: [...input.manifest.files].reverse() }, packageManifest: { ...input.packageManifest, entries: [...input.packageManifest.entries].reverse() } });
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });
  it("rejects graph clones and validates canonical material-to-texture references through core", async () => {
    const { input, document } = await textureResourcePackage();
    await expect(qualify({ ...input, graph: { ...input.graph } })).rejects.toMatchObject({ code: "unverified-graph" });
    expect(() => createGpuModelDocument({ ...document, materials: [{ ...document.materials[0], textures: { baseColor: { ...document.materials[0]!.textures.baseColor, textureId: "missing" } } }] })).toThrow();
  });
  it.each(["missing", "duplicate", "extra"])("rejects %s canonical resource bindings", async (kind) => {
    const { input } = await textureResourcePackage(); const resources = kind === "missing" ? input.resources.slice(1) : [...input.resources, kind === "duplicate" ? input.resources[0] : { resourceId: "absent", filePath: "model.gltf" }];
    await expect(qualify({ ...input, resources })).rejects.toThrow();
  });
  it.each(["unknown", "metadata", "wgsl"])("rejects texture storage role %s without tightening legacy factories", async (role) => {
    const { input } = await textureResourcePackage(); const manifest = { ...input.manifest, files: input.manifest.files.map((f) => f.path === "textures/source.png" ? { ...f, role } : f) };
    await expect(qualify({ ...input, manifest })).rejects.toThrow();
    if (role === "metadata") expect(createAssetManifest(manifest as typeof input.manifest)).toBeDefined();
  });
  it.each(["mesh", "material", "animation", "auxiliary", "future-role"])("rejects incompatible canonical texture file role %s", async (role) => {
    const { input } = await textureResourcePackage();
    await expect(qualify({ ...input, packageManifest: { ...input.packageManifest, entries: input.packageManifest.entries.map((e) => e.path === "textures/source.png" ? { ...e, role } : e) } })).rejects.toThrow();
  });
  it.each(["hash", "length", "mime", "path"])("rejects external canonical resource %s drift", async (change) => {
    const { input } = await textureResourcePackage();
    if (change === "path") input.resources[1] = { ...input.resources[1]!, filePath: "derived/atlas.png" };
    else {
      const f = input.files[1]!;
      if (change === "hash") input.files[1] = { ...f, bytes: new Uint8Array(f.bytes).fill(0) };
      if (change === "length") input.files[1] = { ...f, bytes: new Uint8Array([1]) };
      if (change === "mime") input.files[1] = { ...f, contentType: "image/jpeg" };
    }
    await expect(qualify(input)).rejects.toThrow();
  });
  it("rejects canonical identity drift even when descriptor/inventory/payload agree with each other", async () => {
    const { input } = await textureResourcePackage();
    const atlas = input.manifest.files.find((f) => f.path === "derived/atlas.png")!;
    input.manifest = { ...input.manifest, files: input.manifest.files.map((f) => f.path === "textures/source.png" ? { ...atlas, path: f.path } : f) };
    input.files[1] = { ...input.files[4]!, path: "textures/source.png" };
    await expect(qualify(input)).rejects.toMatchObject({ code: "resource-mismatch" });
  });
  it("rejects embedded resources bound to an unrelated file", async () => {
    const { input } = await textureResourcePackage(); input.resources[0] = { ...input.resources[0]!, filePath: "derived/upload.bin" };
    await expect(qualify(input)).rejects.toThrow();
  });
  it.each(["role", "missing-source", "duplicate-source", "no-source", "missing-output", "duplicate-output", "source-overwrite", "wrong-file-role"])("rejects derived %s", async (kind) => {
    const { input } = await textureResourcePackage(); const first = input.derived[0]!;
    const derived: unknown[] = [...input.derived];
    if (kind === "role") derived[0] = { ...first, role: "future-allocation" };
    if (kind === "missing-source") derived[0] = { ...first, sourceResourceIds: ["absent"] };
    if (kind === "duplicate-source") derived[0] = { ...first, sourceResourceIds: ["source-image", "source-image"] };
    if (kind === "no-source") derived[0] = { ...first, sourceResourceIds: [] };
    if (kind === "missing-output") derived[0] = { ...first, filePath: "missing.bin" };
    if (kind === "duplicate-output") derived.push(first);
    if (kind === "source-overwrite") derived[0] = { ...first, filePath: "textures/source.png" };
    if (kind === "wrong-file-role") derived[0] = { ...first, filePath: "materials/paint.json" };
    await expect(qualify({ ...input, derived })).rejects.toThrow();
  });
  it("requires image sources for atlas output and correct upload/atlas MIME", async () => {
    const { input } = await textureResourcePackage();
    await expect(qualify({ ...input, derived: [{ ...input.derived[1], sourceResourceIds: ["derived-positions"] }] })).rejects.toThrow();
    const mime = "application/json"; input.files[3] = { ...input.files[3]!, contentType: mime };
    input.manifest = { ...input.manifest, files: input.manifest.files.map((f) => f.path === "derived/upload.bin" ? { ...f, contentType: mime } : f) };
    input.packageManifest = { ...input.packageManifest, entries: input.packageManifest.entries.map((f) => f.path === "derived/upload.bin" ? { ...f, contentType: mime } : f) };
    await expect(qualify(input)).rejects.toThrow();
  });
  it("accepts empty derived output without requiring renderer allocations", async () => {
    const { input } = await textureResourcePackage(); await expect(qualify({ ...input, derived: [] })).resolves.toHaveProperty("derived", []);
  });
  it("snapshots metadata and bytes before the first await", async () => {
    const { input } = await textureResourcePackage(); const expected = await qualify(input); const pending = qualify(input);
    input.resources[1]!.filePath = "changed.png"; input.derived[0]!.sourceResourceIds.length = 0; input.files[1]!.bytes.fill(0);
    input.packageManifest.entries[0]!.id = "changed";
    expect(await pending).toEqual(expected);
  });
  it("rejects malformed records/accessors/proxies with fixed value-free errors", async () => {
    const { input } = await textureResourcePackage(); let called = 0;
    const getter = { ...input }; Object.defineProperty(getter, "resources", { get() { called++; return []; } });
    for (const bad of [null, [], getter, { ...input, extra: "synthetic-private" }, { ...input, derived: new Date() }, { ...input, resources: new Array(3) },
      { ...input, derived: [{ ...input.derived[0], allocation: "private" }] }, new Proxy({}, { ownKeys() { throw new Error("synthetic-private"); } })]) {
      await expect(qualify(bad)).rejects.toMatchObject({ name: "ModelTextureResourceError", message: expect.stringMatching(/^Invalid model texture resources: [a-z-]+$/) });
    }
    expect(called).toBe(0);
  });
  it("enforces bounded counts, metadata and options", async () => {
    const { input } = await textureResourcePackage();
    for (const bad of [{ ...input, resources: new Array(MODEL_TEXTURE_RESOURCE_LIMITS.resources + 1) }, { ...input, derived: [{ ...input.derived[0], filePath: "a".repeat(2049) }] }]) await expect(qualify(bad)).rejects.toThrow();
    for (const timeoutMs of [0, -1, Infinity, 60_001, 1.5]) await expect(qualifyModelTextureResources(input, { timeoutMs })).rejects.toThrow();
    await expect(qualifyModelTextureResources(input, { signal: {} as AbortSignal })).rejects.toThrow();
  });
  it("handles cancellation and deadlines with no partial result", async () => {
    const { input } = await textureResourcePackage(); const controller = new AbortController(); controller.abort();
    await expect(qualifyModelTextureResources(input, { signal: controller.signal })).rejects.toMatchObject({ code: "aborted" });
    const later = new AbortController(); const pending = qualifyModelTextureResources(input, { signal: later.signal }); later.abort();
    await expect(pending).rejects.toMatchObject({ code: "aborted" });
    vi.spyOn(performance, "now").mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValue(1000);
    await expect(qualifyModelTextureResources(input, { timeoutMs: 1 })).rejects.toMatchObject({ code: "deadline-exceeded" });
  });
  it("keeps enabled/disabled/rollback composition additive", async () => {
    const { input } = await textureResourcePackage(); const choose = (enabled: boolean) => enabled ? qualify({ ...input, resources: [] }) : Promise.resolve(createAssetManifest(input.manifest));
    expect(await choose(false)).toEqual(input.manifest); await expect(choose(true)).rejects.toThrow(); expect(await choose(false)).toEqual(input.manifest);
  });

  it("qualifies embedded textures without inventing an exported image file", async () => {
    const { input, document, graphInput } = await textureResourcePackage();
    const embedded = createGpuModelDocument({ ...document, textures: [{ ...document.textures[0], exportEmbeddingPolicy: "prefer-embedded" }] });
    const graph = createGpuModelResourceGraph(embedded, { ...graphInput, resources: graphInput.resources.map((r) => r.resourceId === "source-image" ? { ...r, location: { kind: "embedded" }, exportEmbeddingPolicy: "prefer-embedded" } : r) });
    const exported = JSON.parse(new TextDecoder().decode(input.files[0]!.bytes));
    exported.images[0].uri = `data:image/png;base64,${Buffer.from(input.files[1]!.bytes).toString("base64")}`;
    const bytes = new TextEncoder().encode(JSON.stringify(exported));
    const files = input.files.filter((f) => f.path !== "textures/source.png").map((f) => f.path === "model.gltf" ? { ...f, bytes } : f);
    const manifest = { ...input.manifest, files: input.manifest.files.filter((f) => f.path !== "textures/source.png").map((f) => f.path === "model.gltf" ? { ...f, byteLength: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex") } : f) };
    const packageManifest = { ...input.packageManifest, entries: input.packageManifest.entries.filter((e) => e.path !== "textures/source.png") };
    const result = await qualify({ ...input, files, manifest, packageManifest, graph, resources: input.resources.map((r) => r.resourceId === "source-image" ? { ...r, filePath: "model.gltf" } : r) });
    expect(result.manifest.files.some((f) => f.path === "textures/source.png")).toBe(false);
    expect(result.resources.find((r) => r.resourceId === "source-image")).toMatchObject({ filePath: "model.gltf", location: { kind: "embedded" } });
    expect(result.resources.find((r) => r.resourceId === "source-image")!.contentHash).toBe(document.textures[0]!.contentHash);
  });
  it("preserves specialized model envelope fields", async () => {
    const { input } = await textureResourcePackage();
    const model = { ...input.manifest, assetKind: "model", modelAbiHash: "0".repeat(64), providedSemantics: [], defaultStyleProfile: null,
      gpuInterface: { interfaceId: "fixture-interface", interfaceVersion: "1.0.0", manifestUri: "https://assets.example.invalid/fixture/1.0.0/manifest.json", manifestSha256: "2".repeat(64), interfaceAbiHash: "1".repeat(64), modelAbiHash: "0".repeat(64) } };
    expect((await qualify({ ...input, manifest: model })).manifest).toMatchObject({ assetKind: "model", gpuInterface: model.gpuInterface, defaultStyleProfile: null });
  });
  it.each(["material", "texture", "auxiliary"])("rejects incompatible MIME declarations for %s inventory entries", async (role) => {
    const { input } = await textureResourcePackage(); const index = role === "material" ? 2 : role === "texture" ? 4 : 3;
    const mime = "text/plain"; const path = input.files[index]!.path;
    input.files[index] = { ...input.files[index]!, contentType: mime };
    input.manifest = { ...input.manifest, files: input.manifest.files.map((f) => f.path === path ? { ...f, contentType: mime } : f) };
    input.packageManifest = { ...input.packageManifest, entries: input.packageManifest.entries.map((e) => e.path === path ? { ...e, contentType: mime } : e) };
    await expect(qualify(input)).rejects.toMatchObject({ code: "role-mismatch" });
  });

  it("preserves source identities when the same authored image has multiple texture interpretations", async () => {
    const { input, document, graphInput } = await textureResourcePackage();
    const second = createGpuModelDocument({ ...document, textures: [...document.textures, { ...document.textures[0], id: "second-view" }] });
    const graph = createGpuModelResourceGraph(second, graphInput);
    const result = await qualify({ ...input, graph });
    expect(result.textures).toHaveLength(2); expect(result.resources.filter((r) => r.resourceId === "source-image")).toHaveLength(1);
  });
});
