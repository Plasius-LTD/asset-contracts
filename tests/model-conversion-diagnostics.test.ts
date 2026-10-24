import { afterEach, describe, expect, it, vi } from "vitest";
import { createModelCandidate, qualifyModelConversionDiagnostics, ModelConversionDiagnosticsError } from "../src/index.js";

const secret = "private-canary-signed-url-token";
const source = { kind: "catalog", sourceId: "catalog", sourceAssetId: "opaque-source", contentHash: "a".repeat(64), capturedAt: "2026-10-24T00:00:00.000Z" };
const resource = { uri: "mcp://models/resolutions/r1/candidates/c1/mesh.glb", sha256: "b".repeat(64), byteLength: 4, contentType: "model/gltf-binary" };
const issue = (kind = "warning", extra: Record<string, unknown> = {}) => ({ kind, code: secret, path: "/mesh/0", message: secret, ...extra });
const input = (issues: unknown[] = [], extra: Record<string, unknown> = {}) => ({ outcome: "completed", source, report: { standard: "gltf-glb", issues }, resources: [{ path: "/mesh/0", resource }], ...extra });
afterEach(() => vi.restoreAllMocks());

describe("public conversion diagnostics qualification", () => {
  it("returns immutable JSON-safe success using existing source provenance", async () => {
    const result = await qualifyModelConversionDiagnostics(input());
    expect(result).toMatchObject({ contractVersion: 1, status: "succeeded", technicalAccepted: true, source, converter: { diagnostics: [], losses: [] } });
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.source)).toBe(true);
  });

  it("replaces adapter code/message/path with fixed text and resource identity", async () => {
    const result = await qualifyModelConversionDiagnostics(input([issue()]));
    expect(result.status).toBe("warning");
    expect(result.diagnostics[0]).toMatchObject({ code: "conversion.warning", severity: "warning", resource });
    expect(result.converter.diagnostics[0]).toEqual({ code: "conversion.warning", severity: "warning", message: "Conversion completed with an advisory." });
    expect(JSON.stringify(result)).not.toContain(secret);
    expect(JSON.stringify(result)).not.toContain("/mesh/0");
  });

  it.each(["dropped", "approximated"])("preserves %s loss and blocks unconsented loss", async (effect) => {
    const value = input([issue("loss", { effect })]);
    const denied = await qualifyModelConversionDiagnostics(value);
    expect(denied.status).toBe("failed");
    expect(denied.technicalAccepted).toBe(false);
    expect(denied.converter.losses[0]?.severity).toBe("blocking");
    const allowed = await qualifyModelConversionDiagnostics({ ...value, report: { ...value.report, allowLoss: true } });
    expect(allowed.status).toBe("warning");
    expect(allowed.diagnostics[0]).toMatchObject({ effect, code: `conversion.loss.${effect}`, severity: "warning" });
  });

  it("uses canonical applied-repair policy without exposing originalValue", async () => {
    const value = input([issue("violation", { ruleId: "non-normalized-weights", repairApplied: true, originalValue: secret })]);
    expect((await qualifyModelConversionDiagnostics(value)).status).toBe("failed");
    const result = await qualifyModelConversionDiagnostics({ ...value, report: { ...value.report, mode: "tolerant" } });
    expect(result.status).toBe("warning");
    expect(result.diagnostics[0]).toMatchObject({ code: "conversion.repair", fallback: "non-normalized-weights" });
    expect(JSON.stringify(result)).not.toContain(secret);
  });

  it("unknown rule IDs remain blocking even if a repair is asserted", async () => {
    const value = input([issue("violation", { ruleId: secret, repairApplied: true, originalValue: secret })]);
    const result = await qualifyModelConversionDiagnostics({ ...value, report: { ...value.report, mode: "tolerant" } });
    expect(result.status).toBe("failed");
    expect(result.diagnostics[0]?.code).toBe("conversion.blocked");
    expect(JSON.stringify(result)).not.toContain(secret);
  });

  it.each(["unsupported", "failed"])("projects explicit %s outcome with no provider exception", async (outcome) => {
    const result = await qualifyModelConversionDiagnostics(input([], { outcome }));
    expect(result.status).toBe(outcome);
    expect(result.technicalAccepted).toBe(false);
    expect(result.converter.diagnostics[0]?.severity).toBe("blocking");
  });

  it("unsupported canonical data stays unsupported; explicit failure takes precedence", async () => {
    expect((await qualifyModelConversionDiagnostics(input([issue("unsupported")]))).status).toBe("unsupported");
    expect((await qualifyModelConversionDiagnostics(input([issue("unsupported")], { outcome: "failed" }))).status).toBe("failed");
  });

  it("supports root/source diagnostics without a fabricated resource", async () => {
    const result = await qualifyModelConversionDiagnostics(input([issue("warning", { path: "/" })], { resources: [] }));
    expect(result.diagnostics[0]?.resource).toBeUndefined();
    expect(result.source.contentHash).toBe(source.contentHash);
  });

  it("does not serialize forensic rawSource", async () => {
    const result = await qualifyModelConversionDiagnostics(input([], { report: { standard: "fbx", mode: "forensic", rawSource: { bytes: secret }, issues: [] } }));
    expect(JSON.stringify(result)).not.toContain(secret);
    expect(JSON.stringify(result)).not.toContain("rawSource");
  });

  it("snapshots inputs before lazy evaluation", async () => {
    const value = structuredClone(input([issue()]));
    const promise = qualifyModelConversionDiagnostics(value);
    value.source.contentHash = "c".repeat(64);
    value.resources[0]!.resource.sha256 = "d".repeat(64);
    value.report.issues.length = 0;
    const result = await promise;
    expect(result.source.contentHash).toBe("a".repeat(64));
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]?.resource?.sha256).toBe("b".repeat(64));
    expect(Object.isFrozen(result.diagnostics[0]?.resource)).toBe(true);
  });

  it("is stable across JSON input serialization and does not share resource snapshots", async () => {
    const value = input([issue(), issue("loss", { effect: "dropped" })]);
    expect(await qualifyModelConversionDiagnostics(JSON.parse(JSON.stringify(value)))).toEqual(await qualifyModelConversionDiagnostics(value));
  });

  it("keeps legacy converter arrays bounded including terminal outcomes", async () => {
    const result = await qualifyModelConversionDiagnostics(input(Array.from({ length: 99 }, () => issue()), { outcome: "failed" }));
    expect(result.converter.diagnostics).toHaveLength(100);
    await expect(qualifyModelConversionDiagnostics(input(Array.from({ length: 100 }, () => issue()), { outcome: "failed" }))).rejects.toMatchObject({ code: "limit-exceeded" });
    expect((await qualifyModelConversionDiagnostics(input(Array.from({ length: 100 }, () => issue())))).diagnostics).toHaveLength(100);
  });

  it("rejects conflicting resource identity and malformed option objects with safe errors", async () => {
    await expect(qualifyModelConversionDiagnostics(input([], { resources: [{ path: "/mesh/0", resource }, { path: "/mesh/1", resource: { ...resource, sha256: "c".repeat(64) } }] }))).rejects.toMatchObject({ code: "invalid-input" });
    for (const options of [{ signal: {} }, { timeoutMs: null }, { timeoutMs: "100" }, { extra: secret }]) {
      await expect(qualifyModelConversionDiagnostics(input(), options as never)).rejects.toBeInstanceOf(ModelConversionDiagnosticsError);
    }
  });

  it.each([
    undefined, null, [], { ...input(), outcome: "invented" }, { ...input(), providerException: secret },
    input([issue("invented")]), input([issue("warning", { code: "" })]), input([issue("warning", { code: 123 })]),
    input([issue("warning", { path: "/unknown" })]), input([], { source: { ...source, contentHash: secret } }),
    input([], { resources: [{ path: "/mesh/0", resource: { ...resource, uri: "https://user:password@private/path?secret=yes" } }] }),
    input([], { resources: [{ path: "/mesh/0", resource }, { path: "/mesh/0", resource }] }),
    input([], { resources: [{ path: "/", resource }] }), input([], { report: { standard: "unknown", issues: [] } }),
  ])("rejects malformed input with value-free errors (%#)", async (value) => {
    await expect(qualifyModelConversionDiagnostics(value)).rejects.toBeInstanceOf(ModelConversionDiagnosticsError);
    await expect(qualifyModelConversionDiagnostics(value)).rejects.not.toThrow(secret);
  });

  it("rejects getters, exotic prototypes, symbols, sparse arrays and cycles without invoking getters", async () => {
    let calls = 0;
    const getter = { ...input(), get report() { calls++; throw new Error(secret); } };
    const cycle: Record<string, unknown> = {}; cycle.cycle = cycle;
    for (const value of [getter, new Date(), { ...input(), [Symbol()]: 1 }, input(new Array(1)), input([], { source: cycle })]) {
      await expect(qualifyModelConversionDiagnostics(value)).rejects.toBeInstanceOf(ModelConversionDiagnosticsError);
    }
    expect(calls).toBe(0);
  });

  it("bounds issue counts, strings, nested metadata and aggregate values", async () => {
    await expect(qualifyModelConversionDiagnostics(input(Array.from({ length: 101 }, () => issue())))).rejects.toThrow();
    await expect(qualifyModelConversionDiagnostics(input([issue("warning", { message: "x".repeat(2049) })]))).rejects.toThrow();
    let nested: unknown = secret;
    for (let i = 0; i < 15; i++) nested = { nested };
    await expect(qualifyModelConversionDiagnostics(input([], { report: { standard: "fbx", mode: "forensic", rawSource: nested, issues: [] } }))).rejects.toThrow();
    const forensic = (rawSource: unknown) => input([], { report: { standard: "fbx", mode: "forensic", rawSource, issues: [] } });
    await expect(qualifyModelConversionDiagnostics(forensic(Array.from({ length: 140 }, () => "x".repeat(2048))))).rejects.toMatchObject({ code: "limit-exceeded" });
    await expect(qualifyModelConversionDiagnostics(forensic(Array.from({ length: 1024 }, () => Array.from({ length: 20 }, () => 0))))).rejects.toMatchObject({ code: "limit-exceeded" });
  });

  it("honors pre-abort, in-flight abort and bounded deadlines", async () => {
    const controller = new AbortController(); controller.abort(secret);
    await expect(qualifyModelConversionDiagnostics(input(), { signal: controller.signal })).rejects.toMatchObject({ code: "aborted" });
    const second = new AbortController();
    const promise = qualifyModelConversionDiagnostics(input(), { signal: second.signal }); second.abort(secret);
    await expect(promise).rejects.toMatchObject({ code: "aborted" });
    for (const timeoutMs of [0, NaN, 60_001]) await expect(qualifyModelConversionDiagnostics(input(), { timeoutMs })).rejects.toMatchObject({ code: "invalid-input" });
    vi.spyOn(performance, "now").mockReturnValueOnce(0).mockReturnValue(100);
    await expect(qualifyModelConversionDiagnostics(input(), { timeoutMs: 1 })).rejects.toMatchObject({ code: "deadline-exceeded" });
  });

  it("keeps disabled/rollback legacy diagnostics and independent promotion requirements", async () => {
    const legacy = { severity: "warning", code: "legacy", message: "Legacy advisory" };
    const compose = async (enabled: boolean) => enabled ? (await qualifyModelConversionDiagnostics(input([issue()]))).converter.diagnostics : [legacy];
    expect((await compose(true))[0]?.code).toBe("conversion.warning");
    expect(await compose(false)).toEqual([legacy]);
    expect(await compose(false)).toEqual([legacy]);
    const technical = await qualifyModelConversionDiagnostics(input());
    expect(() => createModelCandidate(technical)).toThrow();
    expect(technical).not.toHaveProperty("rights");
    expect(technical).not.toHaveProperty("approval");
    expect(technical).not.toHaveProperty("promotionReceipt");
  });
});
