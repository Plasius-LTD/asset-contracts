import { afterEach, describe, expect, it, vi } from "vitest";
import {
  qualifyModelResourceManifest, ModelResourceManifestError,
  qualifyModelConversionDiagnostics, ModelConversionDiagnosticsError,
  qualifyModelTextureResources, ModelTextureResourceError,
} from "../src/index.js";

import * as publicApi from "../src/index.js";
import { textureResourcePackage } from "./fixtures/texture-resource-package.js";

afterEach(() => vi.restoreAllMocks());
const canary = "SYNTHETIC_PRIVATE_EXCEPTION";
const boundaries = [
  { name: "manifest", qualify: (input: unknown) => qualifyModelResourceManifest(input as never),
    error: () => new ModelResourceManifestError("aborted"), ErrorClass: ModelResourceManifestError,
    message: "Invalid model resource manifest: invalid-input" },
  { name: "diagnostics", qualify: qualifyModelConversionDiagnostics,
    error: () => new ModelConversionDiagnosticsError("aborted"), ErrorClass: ModelConversionDiagnosticsError,
    message: "Invalid model conversion diagnostics: invalid-input" },
  { name: "textures", qualify: (input: unknown) => qualifyModelTextureResources(input as never),
    error: () => new ModelTextureResourceError("aborted"), ErrorClass: ModelTextureResourceError,
    message: "Invalid model texture resources: invalid-input" },
];
const throwingInput = (thrown: unknown) => new Proxy({}, { getPrototypeOf() { throw thrown; } });
async function rejection(operation: Promise<unknown>): Promise<unknown> {
  try { await operation; } catch (error) { return error; }
  throw new Error("Expected qualification to reject");
}

describe.each(boundaries)("$name fixed-error containment", (boundary) => {
  it.each(["ordinary", "nested-proxy", "revoked-proxy", "forged", "subclass", "accessor", "primitive", "null", "function"])("normalizes %s exceptions without retaining caller identity or text", async (kind) => {
    const privateError = new Error(canary);
    let thrown: unknown;
    switch (kind) {
      case "ordinary": thrown = privateError; break;
      case "nested-proxy": thrown = new Proxy({}, { getPrototypeOf() { throw privateError; }, get() { throw privateError; } }); break;
      case "revoked-proxy": { const proxy = Proxy.revocable({}, {}); proxy.revoke(); thrown = proxy.proxy; break; }
      case "forged": thrown = Object.assign(boundary.error(), { message: canary, cause: privateError, detail: canary }); break;
      case "subclass": {
        class CallerError extends boundary.ErrorClass {}
        thrown = Object.assign(new CallerError("aborted"), { message: canary, cause: privateError, detail: canary }); break;
      }
      case "accessor": thrown = Object.defineProperty(boundary.error(), "code", { get() { throw privateError; } }); break;
      case "primitive": thrown = canary; break;
      case "null": thrown = null; break;
      case "function": thrown = Object.assign(() => undefined, { code: "aborted", message: canary }); break;
    }
    const error = await rejection(boundary.qualify(throwingInput(thrown)));
    expect(error === thrown).toBe(false);
    expect(error === privateError).toBe(false);
    expect(error).toBeInstanceOf(boundary.ErrorClass);
    expect(error).toMatchObject({ code: "invalid-input", message: boundary.message });
    expect(Object.hasOwn(error as object, "cause")).toBe(false);
    expect(Object.hasOwn(error as object, "detail")).toBe(false);
    expect(JSON.stringify(error)).not.toContain(canary);
  });

  it("reconstructs a captured internal failure after caller mutation", async () => {
    const captured = await rejection(boundary.qualify(null));
    Object.assign(captured as object, { message: canary, code: "aborted", cause: canary, detail: canary });
    const result = await rejection(boundary.qualify(throwingInput(captured)));
    expect(result).not.toBe(captured);
    expect(result).toBeInstanceOf(boundary.ErrorClass);
    expect(result).toMatchObject({ code: "invalid-input", message: boundary.message });
    expect(Object.hasOwn(result as object, "cause")).toBe(false);
    expect(JSON.stringify(result)).not.toContain(canary);
  });
});

it("keeps internal error provenance out of the public exports", () => {
  expect(Object.hasOwn(publicApi, "modelResourceManifestFailureCode")).toBe(false);
});

it.each(["diagnostics", "textures"])("cleans %s abort listeners and timers after in-flight rejection", async (kind) => {
  const input = kind === "textures" ? (await textureResourcePackage()).input : {
    outcome: "completed", source: { kind: "catalog", sourceId: "catalog", sourceAssetId: "opaque-source",
      contentHash: "a".repeat(64), capturedAt: "2026-10-24T00:00:00.000Z" },
    report: { standard: "gltf-glb", issues: [] }, resources: [],
  };
  const add = vi.spyOn(AbortSignal.prototype, "addEventListener");
  const remove = vi.spyOn(AbortSignal.prototype, "removeEventListener");
  const clear = vi.spyOn(globalThis, "clearTimeout");
  const controller = new AbortController();
  const pending = kind === "textures" ? qualifyModelTextureResources(input as never, { signal: controller.signal })
    : qualifyModelConversionDiagnostics(input, { signal: controller.signal });
  controller.abort(canary);
  const error = await rejection(pending);
  expect(error).toMatchObject({ code: "aborted" });
  expect(JSON.stringify(error)).not.toContain(canary);
  expect(add).toHaveBeenCalled();
  for (const [event, listener] of add.mock.calls) expect(remove).toHaveBeenCalledWith(event, listener);
  expect(clear).toHaveBeenCalled();
});
