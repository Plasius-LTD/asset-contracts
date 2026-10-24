import { createGpuModelDocument, createGpuModelResourceGraph } from "@plasius/gpu-model-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createModelResourcePromotionRecord, qualifyModelConversionDiagnostics, createAssetManifest, createAssetPromotionRecord, MODEL_RESOURCE_PROMOTION_LIMITS, type ModelResourcePromotionInput } from "../src/index.js";
import { promotionResourcePackage } from "./fixtures/promotion-resource-package.js";
type Mutable<T> = { -readonly [P in keyof T]: T[P] extends object ? Mutable<T[P]> : T[P] };
const promote = (value: unknown) => createModelResourcePromotionRecord(value as ModelResourcePromotionInput);
afterEach(() => vi.restoreAllMocks());
describe("model resource promotion closure", () => {
  it("composes complete source/output bytes, raw diagnostics and independent candidate approval", async () => {
    const { input, bytes } = await promotionResourcePackage();
    expect(new DataView(bytes.buffer).getUint32(0, true)).toBe(0x46546c67);
    const result = await promote(input);
    expect(result.promotion.manifest).toEqual(input.promotion.manifest);
    expect(result.source.files).toHaveLength(2); expect(result.output.manifest.files).toHaveLength(5);
    expect(result.output.source.sourceContentHash).toBe(result.diagnostics.source.contentHash);
    expect(result.closureHash).toMatch(/^[a-f0-9]{64}$/u);
    expect(Object.isFrozen(result)).toBe(true); expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
  it.each(["source", "output"] as const)("rejects missing and tampered %s bytes", async (side) => {
    const { input } = await promotionResourcePackage();
    const files = input[side].files;
    await expect(promote({ ...input, [side]: { ...input[side], files: files.slice(1) } })).rejects.toThrow();
    const copy = files.map((f, i) => i === 1 ? { ...f, bytes: new Uint8Array(f.bytes).fill(0) } : f);
    await expect(promote({ ...input, [side]: { ...input[side], files: copy } })).rejects.toThrow();
  });
  it.each(["source-hash", "converter", "output-hash", "diagnostics", "review", "rights", "security", "confirmation", "gpu"])("rejects %s drift or bypass", async (kind) => {
    const { input } = await promotionResourcePackage(); const value = { ...input, candidate: structuredClone(input.candidate), promotion: structuredClone(input.promotion), diagnostics: structuredClone(input.diagnostics), confirmation: structuredClone(input.confirmation) } as unknown as Mutable<ModelResourcePromotionInput>;
    if (kind === "source-hash") value.diagnostics.source = { ...value.diagnostics.source, contentHash: "a".repeat(64) };
    if (kind === "converter") value.candidate.processingManifest.converter = { ...value.candidate.processingManifest.converter, id: "other" };
    if (kind === "output-hash") value.candidate.processingManifest.converter = { ...value.candidate.processingManifest.converter, outputContentHash: "b".repeat(64) };
    if (kind === "diagnostics") value.diagnostics.report = { standard: "gltf-glb", issues: [{ kind: "unsupported", code: "opaque", path: "/", message: "opaque" }] };
    if (kind === "review") value.promotion.reviewReport = { ...value.promotion.reviewReport, passed: false };
    if (kind === "rights") value.candidate.rights = { ...value.candidate.rights, status: "quarantined" };
    if (kind === "security") value.candidate.hardGates = value.candidate.hardGates.map((g, i) => i === 0 ? { ...g, outcome: "blocked", reasonCodes: ["blocked"] } : g);
    if (kind === "confirmation") value.confirmation = { ...value.confirmation, confirmationToken: "different_token_0123456789abcdef" };
    if (kind === "gpu") value.promotion.manifest = { ...value.promotion.manifest, modelAbiHash: "0".repeat(64) as never };
    await expect(promote(value)).rejects.toThrow();
  });
  it("requires exact resource bindings for runtime and diagnostic resources", async () => {
    const { input } = await promotionResourcePackage();
    await expect(promote({ ...input, resourceBindings: [] })).rejects.toThrow();
    await expect(promote({ ...input, resourceBindings: [{ ...input.resourceBindings[0], filePath: "textures/source.png" }] })).rejects.toThrow();
    await expect(promote({ ...input, resourceBindings: [...input.resourceBindings, input.resourceBindings[0]] })).rejects.toThrow();
    const resource = input.resourceBindings[0]!.resource;
    const diagnostics = { ...input.diagnostics, report: { standard: "gltf-glb", issues: [{ kind: "warning", code: "private", path: "/mesh", message: "private" }] }, resources: [{ path: "/mesh", resource }] };
    await expect(promote({ ...input, diagnostics })).rejects.toThrow(); // stale candidate diagnostics
  });
  it("qualifies exact prior rollback and rejects forged or mismatched history", async () => {
    const priorInput = (await promotionResourcePackage("1.0.0")).input;
    const currentInput = (await promotionResourcePackage("2.0.0")).input;
    const prior = await promote(priorInput); const current = await promote(currentInput);
    const input = { ...priorInput, promotion: { ...priorInput.promotion, promotionId: "rollback1", outcome: "rolled-back", rollbackOfVersion: "2.0.0" }, rollback: { prior, current } };
    const result = await promote(input);
    expect(result.rollback).toEqual({ fromVersion: "2.0.0", fromClosureHash: current.closureHash, toVersion: "1.0.0", toClosureHash: prior.closureHash });
    expect(result.promotion.manifest).toEqual(prior.promotion.manifest);
    await expect(promote({ ...input, rollback: { prior: JSON.parse(JSON.stringify(prior)), current } })).rejects.toThrow();
    await expect(promote({ ...input, promotion: { ...input.promotion, rollbackOfVersion: "3.0.0" } })).rejects.toThrow();
    await expect(promote({ ...input, rollback: { prior: current, current: prior } })).rejects.toThrow();
    await expect(promote({ ...priorInput, rollback: { prior, current } })).rejects.toThrow();
    expect(prior.promotion.outcome).toBe("promoted"); expect(current.promotion.outcome).toBe("promoted");
  });
  it("snapshots caller values and bytes before awaiting and hashes closure deterministically", async () => {
    const { input } = await promotionResourcePackage(); const expected = await promote(input); const pending = promote(input);
    input.output.files[0]!.bytes.fill(0);
    expect(await pending).toEqual(expected);
    const fresh = (await promotionResourcePackage()).input;
    const reversed = { ...fresh, output: { ...fresh.output, files: [...fresh.output.files].reverse(), manifest: { ...fresh.output.manifest, files: [...fresh.output.manifest.files].reverse() } },
      source: { ...fresh.source, files: [...fresh.source.files].reverse(), manifest: { ...fresh.source.manifest, files: [...fresh.source.manifest.files].reverse() } } };
    expect((await promote(reversed)).closureHash).toBe(expected.closureHash);
  });
  it("honors abort, deadline, inert input and value-free failures", async () => {
    const { input } = await promotionResourcePackage(); const controller = new AbortController(); controller.abort();
    await expect(createModelResourcePromotionRecord(input, { signal: controller.signal })).rejects.toMatchObject({ code: "aborted" });
    const second = new AbortController(); const pending = createModelResourcePromotionRecord(input, { signal: second.signal }); second.abort();
    await expect(pending).rejects.toMatchObject({ code: "aborted" });
    let calls = 0; const getter = { ...input, get candidate() { calls++; throw new Error("private-canary"); } };
    await expect(promote(getter)).rejects.not.toThrow("private-canary"); expect(calls).toBe(0);
    await expect(createModelResourcePromotionRecord(input, { timeoutMs: 0 })).rejects.toThrow();
    vi.spyOn(performance, "now").mockReturnValueOnce(0).mockReturnValue(100);
    await expect(createModelResourcePromotionRecord(input, { timeoutMs: 1 })).rejects.toMatchObject({ code: "deadline-exceeded" });
  });
  it("accepts re-evaluated bound warnings and rejects diagnostic resource identity drift", async () => {
    const { input } = await promotionResourcePackage(); const resource = input.resourceBindings[0]!.resource;
    const diagnostics = { ...input.diagnostics, report: { standard: "gltf-glb" as const, issues: [{ kind: "warning" as const, code: "private", path: "/mesh", message: "private" }] }, resources: [{ path: "/mesh", resource }] };
    const evaluated = await qualifyModelConversionDiagnostics(diagnostics);
    const candidate = { ...input.candidate, processingManifest: { ...input.candidate.processingManifest, converter: { ...input.candidate.processingManifest.converter, ...evaluated.converter } } };
    const result = await promote({ ...input, diagnostics, candidate });
    expect(result.diagnostics.status).toBe("warning"); expect(JSON.stringify(result.diagnostics)).not.toContain("private");
    await expect(promote({ ...input, diagnostics, candidate, resourceBindings: [{ ...input.resourceBindings[0], resource: { ...resource, sha256: "a".repeat(64) } }] })).rejects.toThrow();
    await expect(promote({ ...input, diagnostics, candidate, resourceBindings: [{ ...input.resourceBindings[0], package: "source" }] })).rejects.toThrow();
  });
  it("rechecks fresh independent confirmation without changing exact package closure", async () => {
    const priorInput = (await promotionResourcePackage()).input;
    const prior = await promote(priorInput); const current = await promote((await promotionResourcePackage("2.0.0")).input);
    const confirmation = { ...priorInput.confirmation, confirmationId: "fresh-confirmation", confirmedAt: "2026-10-24T00:01:00.000Z" };
    const result = await promote({ ...priorInput, confirmation, promotion: { ...priorInput.promotion, outcome: "rolled-back", rollbackOfVersion: "2.0.0" }, rollback: { prior, current } });
    expect(result.closureHash).toBe(prior.closureHash); expect(result.confirmation.confirmationId).toBe("fresh-confirmation");
    await expect(promote({ ...priorInput, promotion: { ...priorInput.promotion, outcome: "rolled-back", rollbackOfVersion: "2.0.0" } })).rejects.toThrow();
    await expect(promote({ ...priorInput, promotion: { ...priorInput.promotion, rollbackOfVersion: "2.0.0" } })).rejects.toThrow();
  });
  it("rejects exact-version aliases, identity overwrite, entrypoint URI drift and blocking review findings", async () => {
    const { input } = await promotionResourcePackage();
    for (const version of ["latest", "main", "1.x", "^1.0.0"]) await expect(promote({ ...input, source: { ...input.source, manifest: { ...input.source.manifest, version } } })).rejects.toThrow();
    await expect(promote({ ...input, source: { ...input.source, manifest: { ...input.source.manifest, assetId: input.promotion.assetId } } })).rejects.toThrow();
    await expect(promote({ ...input, promotion: { ...input.promotion, runtimeManifestUri: "https://assets.example.invalid/models/wrong/1.0.0/model.glb" } })).rejects.toThrow();
    await expect(promote({ ...input, promotion: { ...input.promotion, reviewReport: { ...input.promotion.reviewReport, findings: [{ severity: "blocking", code: "blocked", message: "blocked" }] } } })).rejects.toThrow();
  });
  it("preserves disabled and rollback consumer factory paths", async () => {
    const { input } = await promotionResourcePackage(); const legacy = { ...input.source.manifest, assetId: input.promotion.assetId };
    const adopt = (enabled: boolean) => enabled ? promote(input) : createAssetPromotionRecord({ ...input.promotion, manifest: createAssetManifest(legacy), version: legacy.version, reviewReport: { ...input.promotion.reviewReport, version: legacy.version } });
    expect(await adopt(false)).toHaveProperty("manifest", legacy); expect(await adopt(true)).toHaveProperty("closureHash");
    expect(await adopt(false)).toHaveProperty("manifest", legacy);
  });
  it("rejects exotic records, sparse arrays, oversized metadata and payloads without leaks", async () => {
    const { input } = await promotionResourcePackage(); const cycle: Record<string, unknown> = {}; cycle.self = cycle;
    const hostile = new Proxy({}, { getPrototypeOf() { throw new Proxy({}, { getOwnPropertyDescriptor() { throw new Error("private-canary"); } }); } });
    const invalid = [hostile, null, [], new Date(), { ...input, [Symbol()]: 1 }, { ...input, extra: true }, { ...input, candidate: cycle },
      { ...input, resourceBindings: new Array(1) }, { ...input, resourceBindings: Array.from({ length: MODEL_RESOURCE_PROMOTION_LIMITS.bindings + 1 }, () => input.resourceBindings[0]) },
      { ...input, confirmation: { ...input.confirmation, confirmedBy: "x".repeat(2049) } }, { ...input, promotion: { ...input.promotion, promotedAt: Infinity } },
      { ...input, resourceBindings: [{ ...input.resourceBindings[0], package: "unknown" }] },
      { ...input, output: { ...input.output, files: [{ ...input.output.files[0], bytes: new Uint8Array(64 * 1024 * 1024 + 1) }] } },
      { ...input, source: { ...input.source, files: [{ ...input.source.files[0], bytes: new Uint16Array(1) }] } },
      { ...input, candidate: Object.create({}) }, { ...input, confirmation: { ...input.confirmation, privateValue: "private-canary" } }];
    const log = vi.spyOn(console, "error");
    for (const value of invalid) await expect(promote(value)).rejects.not.toThrow("private-canary");
    expect(log).not.toHaveBeenCalled();
    for (const options of [{ signal: {} }, { timeoutMs: null }, { timeoutMs: 60001 }, { timeoutMs: NaN }, { extra: true }]) await expect(createModelResourcePromotionRecord(input, options as never)).rejects.toThrow();
  });

  it.each(["obj-mtl", "fbx", "cad-bim"] as const)("rejects %s diagnostic policy for glTF source", async (standard) => {
    const { input } = await promotionResourcePackage();
    await expect(promote({ ...input, diagnostics: { ...input.diagnostics, report: { ...input.diagnostics.report, standard } } })).rejects.toMatchObject({ code: "evidence-mismatch" });
  });

  it("rejects unknown source-format policy even with consistent converter provenance", async () => {
    const { input, document, graphInput } = await promotionResourcePackage();
    const sourceFormat = "future-format";
    const graph = createGpuModelResourceGraph(createGpuModelDocument({ ...document, provenance: { ...document.provenance, sourceFormat } }), graphInput);
    const candidate = { ...input.candidate, processingManifest: { ...input.candidate.processingManifest, converter: { ...input.candidate.processingManifest.converter, sourceFormat } } };
    await expect(promote({ ...input, candidate, output: { ...input.output, graph } })).rejects.toMatchObject({ code: "evidence-mismatch" });
  });

});
