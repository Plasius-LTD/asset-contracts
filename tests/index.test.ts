import { describe, expect, it } from "vitest";
import {
  ASSET_SCREENSHOT_KINDS,
  assertAssetId,
  assertAssetVersion,
  createAssetFileDescriptor,
  createAssetManifest,
  createAssetReviewReport,
  createStandardScreenshotPlan,
  isAssetId,
  isAssetSourceAdapter,
  normalizeAssetId,
} from "../src/index.js";

describe("asset contracts", () => {
  it("normalizes and validates asset ids", () => {
    expect(normalizeAssetId(" Eames Lounge Chair Ottoman ")).toBe("eames-lounge-chair-ottoman");
    expect(isAssetId("eames-lounge-chair-ottoman")).toBe(true);
    expect(isAssetId("Eames Lounge Chair")).toBe(false);
    expect(assertAssetId("eames-lounge-chair-ottoman")).toBe("eames-lounge-chair-ottoman");
    expect(() => assertAssetId("Eames Lounge Chair")).toThrow(/kebab-case/);
    expect(assertAssetVersion("2026.05.27-abc123")).toBe("2026.05.27-abc123");
    expect(() => assertAssetVersion("")).toThrow(/version/);
    expect(isAssetSourceAdapter("ai-generate")).toBe(true);
    expect(isAssetSourceAdapter("manual-upload")).toBe(false);
  });

  it("creates immutable asset manifests", () => {
    const manifest = createAssetManifest({
      assetId: "eames-lounge-chair-ottoman",
      version: "2026.05.27-abc123",
      entrypoint: "model.gltf",
      sourceAdapter: "local-import",
      createdAt: "2026-05-27T00:00:00.000Z",
      files: [
        createAssetFileDescriptor({
          path: "model.gltf",
          byteLength: 128,
          sha256: "a".repeat(64),
          contentType: "model/gltf+json",
          role: "model",
        }),
      ],
    });

    expect(manifest.files).toHaveLength(1);
    expect(Object.isFrozen(manifest)).toBe(true);
    expect(Object.isFrozen(manifest.files)).toBe(true);
  });

  it("rejects invalid asset manifest inputs", () => {
    const validFile = {
      path: "model.gltf",
      byteLength: 128,
      sha256: "a".repeat(64),
      contentType: "model/gltf+json",
      role: "model" as const,
    };

    expect(() => createAssetFileDescriptor({ ...validFile, path: "../model.gltf" })).toThrow(/path/);
    expect(() => createAssetFileDescriptor({ ...validFile, byteLength: -1 })).toThrow(/byteLength/);
    expect(() => createAssetFileDescriptor({ ...validFile, sha256: "bad" })).toThrow(/sha256/);
    expect(() =>
      createAssetManifest({
        assetId: "eames-lounge-chair-ottoman",
        version: "2026.05.27-abc123",
        entrypoint: "../model.gltf",
        sourceAdapter: "local-import",
        createdAt: "2026-05-27T00:00:00.000Z",
        files: [validFile],
      })
    ).toThrow(/entrypoint/);
    expect(() =>
      createAssetManifest({
        assetId: "eames-lounge-chair-ottoman",
        version: "2026.05.27-abc123",
        entrypoint: "model.gltf",
        sourceAdapter: "manual-upload" as "local-import",
        createdAt: "2026-05-27T00:00:00.000Z",
        files: [validFile],
      })
    ).toThrow(/sourceAdapter/);
  });

  it("creates the standard screenshot review pack", () => {
    const plan = createStandardScreenshotPlan();
    expect(plan.map((item) => item.kind)).toEqual(ASSET_SCREENSHOT_KINDS);
    expect(plan[0]?.width).toBe(1600);
  });

  it("creates immutable review reports", () => {
    const report = createAssetReviewReport({
      assetId: "eames-lounge-chair-ottoman",
      version: "2026.05.27-abc123",
      passed: false,
      reviewedAt: "2026-05-27T00:00:00.000Z",
      findings: [
        {
          severity: "blocking",
          code: "texture.missing",
          message: "Missing texture reference.",
          artifactPath: "screenshots/material-closeup.png",
        },
      ],
    });

    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.findings)).toBe(true);
    expect(report.findings[0]?.severity).toBe("blocking");
    expect(() =>
      createAssetReviewReport({
        assetId: "Eames Lounge Chair",
        version: "2026.05.27-abc123",
        passed: true,
        reviewedAt: "2026-05-27T00:00:00.000Z",
        findings: [],
      })
    ).toThrow(/kebab-case/);
  });
});
