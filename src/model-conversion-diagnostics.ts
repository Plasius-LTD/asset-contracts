import type { GpuModelDiagnosticInput, GpuModelDiagnosticMode, GpuModelDiagnosticStandard } from "@plasius/gpu-model-core";
import {
  createModelProvenance, createModelResourceRef,
  type ModelProvenance, type ModelResourceRef, type ModelConverterDiagnostic, type ModelConversionLoss,
} from "./model-resolution.js";

/** Hard ceilings for public conversion evidence, including private input metadata. */
export const MODEL_CONVERSION_DIAGNOSTIC_LIMITS = Object.freeze({ issues: 100, resources: 100, values: 16_384, depth: 12, string: 2048, characters: 262_144, timeoutMs: 60_000 });

/** Exact private canonical path to an opaque, credential-free public resource. */
export interface ModelConversionResourceBinding {
  readonly path: string;
  readonly resource: ModelResourceRef;
}
/** Canonical evaluator input; arbitrary adapter text is never projected. */
export interface ModelConversionDiagnosticsInput {
  readonly outcome: "completed" | "unsupported" | "failed";
  readonly source: ModelProvenance;
  readonly report: GpuModelDiagnosticInput;
  readonly resources: readonly ModelConversionResourceBinding[];
}
/** Cancellation and deadline cover snapshotting, lazy import and evaluation. */
export interface ModelConversionDiagnosticsOptions {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
}
/** Stable public codes; adapter-supplied codes are never treated as this vocabulary. */
export type ModelConversionDiagnosticCode = "conversion.warning" | "conversion.repair" | "conversion.loss.dropped" | "conversion.loss.approximated" | "conversion.unsupported" | "conversion.blocked" | "conversion.failed";
/** Technical evidence only; this is never human, rights, security or promotion approval. */
export interface QualifiedModelConversionDiagnostic extends ModelConverterDiagnostic {
  readonly code: ModelConversionDiagnosticCode;
  readonly resource?: ModelResourceRef;
  readonly effect?: "dropped" | "approximated";
  readonly fallback?: string;
}
/** Deterministic JSON projection plus legacy-compatible converter evidence fields. */
export interface QualifiedModelConversionDiagnostics {
  readonly contractVersion: 1;
  readonly status: "succeeded" | "warning" | "unsupported" | "failed";
  readonly technicalAccepted: boolean;
  readonly standard: GpuModelDiagnosticStandard;
  readonly mode: GpuModelDiagnosticMode;
  readonly source: ModelProvenance;
  readonly diagnostics: readonly QualifiedModelConversionDiagnostic[];
  readonly converter: {
    readonly diagnostics: readonly ModelConverterDiagnostic[];
    readonly losses: readonly ModelConversionLoss[];
  };
}
/** Fixed, value-free error; never includes adapter/provider exception text. */
export class ModelConversionDiagnosticsError extends TypeError {
  constructor(public readonly code: "invalid-input" | "limit-exceeded" | "unbound-resource" | "aborted" | "deadline-exceeded") {
    super(`Invalid model conversion diagnostics: ${code}`);
    this.name = "ModelConversionDiagnosticsError";
  }
}
function fail(code: ModelConversionDiagnosticsError["code"] = "invalid-input"): never { throw new ModelConversionDiagnosticsError(code); }

function fields(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail();
  const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  const keys = Reflect.ownKeys(value);
  if (keys.length > 1024) fail("limit-exceeded");
  for (const key of keys) {
    if (typeof key !== "string" || key.length > 128 || ["__proto__", "prototype", "constructor"].includes(key)) fail();
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    if (!("value" in descriptor) || !descriptor.enumerable) fail();
    result[key] = descriptor.value;
  }
  return result;
}
function only(record: Record<string, unknown>, keys: readonly string[]): void {
  if (Object.keys(record).some((key) => !keys.includes(key))) fail();
}
function snapshot(value: unknown, budget: { values: number; characters: number }, depth = 0): unknown {
  if (--budget.values < 0 || depth > MODEL_CONVERSION_DIAGNOSTIC_LIMITS.depth) fail("limit-exceeded");
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "string") {
    budget.characters -= value.length;
    if (value.length > MODEL_CONVERSION_DIAGNOSTIC_LIMITS.string || budget.characters < 0) fail("limit-exceeded");
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype || value.length > 1024) fail("limit-exceeded");
    if (Reflect.ownKeys(value).length !== value.length + 1) fail();
    const result = [];
    for (let i = 0; i < value.length; i++) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
      if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) fail();
      result.push(snapshot(descriptor.value, budget, depth + 1));
    }
    return Object.freeze(result);
  }
  const record = fields(value);
  for (const key of Object.keys(record)) {
    budget.characters -= key.length;
    if (budget.characters < 0) fail("limit-exceeded");
    record[key] = snapshot(record[key], budget, depth + 1);
  }
  return Object.freeze(record);
}
function legacy(value: QualifiedModelConversionDiagnostic): ModelConverterDiagnostic {
  return Object.freeze({ severity: value.severity, code: value.code, message: value.message });
}

/**
 * Evaluate canonical diagnostics and project fixed public text. Unknown adapter codes
 * are intentionally discarded; unknown repair rules remain blocking in model-core.
 * Exact path bindings are assertions by the trusted caller, not byte attestations.
 */
export async function qualifyModelConversionDiagnostics(input: unknown, options: ModelConversionDiagnosticsOptions = {}): Promise<QualifiedModelConversionDiagnostics> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let signal: AbortSignal | undefined;
  let onAbort: (() => void) | undefined;
  try {
    const start = performance.now();
    const controls = fields(options);
    only(controls, ["signal", "timeoutMs"]);
    const timeoutMs = controls.timeoutMs === undefined ? 10_000 : controls.timeoutMs;
    if (typeof timeoutMs !== "number" || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MODEL_CONVERSION_DIAGNOSTIC_LIMITS.timeoutMs) fail();
    signal = controls.signal as AbortSignal | undefined;
    const aborted = Object.getOwnPropertyDescriptor(AbortSignal.prototype, "aborted")!.get!;
    const check = () => {
      if (signal !== undefined && aborted.call(signal)) fail("aborted");
      if (performance.now() - start >= timeoutMs) fail("deadline-exceeded");
    };
    check();
    const args = fields(snapshot(input, { values: MODEL_CONVERSION_DIAGNOSTIC_LIMITS.values, characters: MODEL_CONVERSION_DIAGNOSTIC_LIMITS.characters }));
    only(args, ["outcome", "source", "report", "resources"]);
    if (!["completed", "unsupported", "failed"].includes(args.outcome as string)) fail();
    const source = createModelProvenance(args.source);
    const reportInput = fields(args.report);
    // Reserve room for the outcome diagnostic in legacy arrays limited to 100.
    const maximumIssues = MODEL_CONVERSION_DIAGNOSTIC_LIMITS.issues - (args.outcome === "completed" ? 0 : 1);
    if (!Array.isArray(reportInput.issues) || reportInput.issues.length > maximumIssues) fail("limit-exceeded");
    if (!Array.isArray(args.resources) || args.resources.length > MODEL_CONVERSION_DIAGNOSTIC_LIMITS.resources) fail("limit-exceeded");
    const resources = new Map<string, ModelResourceRef>();
    const identities = new Map<string, string>();
    for (const value of args.resources) {
      const binding = fields(value);
      only(binding, ["path", "resource"]);
      if (typeof binding.path !== "string" || !binding.path.startsWith("/") || binding.path === "/" || resources.has(binding.path)) fail();
      const resource = createModelResourceRef(binding.resource);
      const identity = JSON.stringify(resource);
      if (identities.has(resource.uri) && identities.get(resource.uri) !== identity) fail();
      identities.set(resource.uri, identity);
      resources.set(binding.path, resource);
    }
    check();
    const interrupted = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new ModelConversionDiagnosticsError("deadline-exceeded")), Math.max(1, timeoutMs - (performance.now() - start)));
      onAbort = () => reject(new ModelConversionDiagnosticsError("aborted"));
      if (signal) AbortSignal.prototype.addEventListener.call(signal, "abort", onAbort, { once: true });
    });
    const core = await Promise.race([import("@plasius/gpu-model-core"), interrupted]);
    check();
    const report = core.evaluateGpuModelDiagnostics(reportInput);
    const diagnostics: QualifiedModelConversionDiagnostic[] = report.diagnostics.map((diagnostic) => {
      const resource = resources.get(diagnostic.path);
      if (diagnostic.path !== "/" && !resource) fail("unbound-resource");
      const base = resource ? { resource } : {};
      switch (diagnostic.kind) {
        case "warning": return Object.freeze({ ...base, severity: "warning", code: "conversion.warning", message: "Conversion completed with an advisory." });
        case "repair": return Object.freeze({ ...base, severity: "warning", code: "conversion.repair", message: "Conversion applied a canonical repair fallback.", fallback: diagnostic.ruleId });
        case "loss": return Object.freeze({ ...base, severity: reportInput.allowLoss === true ? "warning" : "blocking", code: `conversion.loss.${diagnostic.effect}`, message: diagnostic.effect === "dropped" ? "Conversion dropped source data." : "Conversion approximated source data.", effect: diagnostic.effect });
        case "unsupported": return Object.freeze({ ...base, severity: "blocking", code: "conversion.unsupported", message: "Conversion encountered unsupported data." });
        case "blocking-error": return Object.freeze({ ...base, severity: "blocking", code: "conversion.blocked", message: "Conversion did not satisfy canonical validation policy." });
      }
    });
    if (args.outcome !== "completed") diagnostics.push(Object.freeze({ severity: "blocking", code: args.outcome === "failed" ? "conversion.failed" : "conversion.unsupported", message: args.outcome === "failed" ? "Conversion failed." : "Conversion encountered unsupported data." }));
    const technicalAccepted = args.outcome === "completed" && report.accepted;
    const status = args.outcome === "failed" ? "failed" : args.outcome === "unsupported" || report.diagnostics.some((item) => item.kind === "unsupported") ? "unsupported" : !technicalAccepted ? "failed" : diagnostics.length ? "warning" : "succeeded";
    const losses = diagnostics.filter((item) => item.effect !== undefined).map(legacy);
    check();
    return Object.freeze({ contractVersion: 1, status, technicalAccepted, standard: report.standard, mode: report.mode, source,
      diagnostics: Object.freeze(diagnostics), converter: Object.freeze({ diagnostics: Object.freeze(diagnostics.filter((item) => item.effect === undefined).map(legacy)), losses: Object.freeze(losses) }) });
  } catch (error) {
    if (error instanceof ModelConversionDiagnosticsError) throw error;
    return fail();
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    if (signal && onAbort) AbortSignal.prototype.removeEventListener.call(signal, "abort", onAbort);
  }
}
