import {
  GPU_INTERFACE_MANIFEST_VERSION,
  SHADER_STYLE_PROFILE_MANIFEST_VERSION,
  SHADER_VERSION_MANIFEST_VERSION,
  SUPPORTED_STABLE_WEBGPU_MATRIX_POLICIES,
  canonicalizeGpuContract,
  computeSha256,
  type GpuInterfaceManifest,
  type GpuInterfaceRef,
  type ShaderStyleProfileManifest,
  type ShaderStyleProfileRef,
  type ShaderValidationEvidenceRef,
  type ShaderVersionManifest,
  type Sha256Hex,
} from "@plasius/gpu-shader";
import { describe, expect, it } from "vitest";
import {
  ASSET_FILE_ROLES,
  ASSET_KINDS,
  ASSET_WGSL_CONTENT_TYPE,
  GPU_SHADER_STORE_FEATURE_FLAG,
  GPU_SHADER_STYLE_SELECTION_CAPABILITY,
  createAssetFileDescriptor,
  createAssetManifest,
  createAssetPromotionRecord,
  createAssetReviewReport,
  createGpuAssetPromotionRecord,
  createGpuInterfaceAssetManifest,
  createGpuInterfaceRef,
  createModelAssetManifest,
  createShaderAssetManifest,
  createShaderStyleProfileAssetManifest,
  createShaderStyleProfileRef,
  createShaderValidationEvidenceAssetManifest,
  createShaderValidationEvidenceRef,
  createShaderVersionRef,
  validateGpuAssetFiles,
  isAssetFileRole,
  isAssetKind,
  type AssetFileDescriptor,
  type AssetFileRole,
} from "../src/index.js";

const H0 = "0".repeat(64) as Sha256Hex;
const H1 = "1".repeat(64) as Sha256Hex;
const H2 = "2".repeat(64) as Sha256Hex;
const H3 = "3".repeat(64) as Sha256Hex;
const H4 = "4".repeat(64) as Sha256Hex;
const CREATED_AT = "2026-07-13T00:00:00.000Z";

function assetFile(
  path: string,
  role: AssetFileRole,
  sha256 = H4,
  byteLength = 1,
  contentType = "application/json",
): AssetFileDescriptor {
  return {
    path,
    role,
    sha256,
    byteLength,
    contentType,
    ...(role === "wgsl" ? { moduleId: "main" } : {}),
  };
}

function minimalGpuInterface(): GpuInterfaceManifest {
  return {
    contractVersion: GPU_INTERFACE_MANIFEST_VERSION,
    interfaceId: "model-interface",
    interfaceVersion: "1.0.0",
    modules: [{ moduleId: "main", sha256: H0 }],
    records: [],
    bindings: [],
    entryPoints: [{
      moduleId: "main",
      name: "main",
      stage: "compute",
      inputs: [],
      outputs: [],
      bindingKeys: [],
      overrideNames: [],
      workgroupSize: [
        { kind: "literal", value: 1 },
        { kind: "literal", value: 1 },
        { kind: "literal", value: 1 },
      ],
      workgroupStorageSize: 0,
    }],
    vertexInputs: [],
    overrides: [],
    modelAbi: {
      recordNames: [],
      bindings: [],
      vertexInputs: [],
      semantics: [],
    },
    modelAbiHash: H0,
    interfaceAbiHash: H1,
    generatedBy: {
      packageVersion: "0.1.0",
      reflector: "wgsl_reflect",
      reflectorVersion: "1.5.0",
    },
  };
}

function minimalInterfaceRef(): GpuInterfaceRef {
  return {
    interfaceId: "model-interface",
    interfaceVersion: "1.0.0",
    manifestUri: "https://assets.example.invalid/interfaces/model/1.0.0/manifest.json",
    manifestSha256: H2,
    interfaceAbiHash: H1,
    modelAbiHash: H0,
  };
}

function minimalEvidenceRef(): ShaderValidationEvidenceRef {
  const policy = SUPPORTED_STABLE_WEBGPU_MATRIX_POLICIES[0];
  return {
    evidenceId: "qualification-test",
    uri: "https://assets.example.invalid/evidence/qualification-test.json",
    sha256: H2,
    matrixId: policy.matrixId,
    matrixVersion: policy.matrixVersion,
    matrixSha256: policy.matrixSha256 as Sha256Hex,
    attestationRef: {
      uri: "https://assets.example.invalid/evidence/qualification-test.attestation.json",
      sha256: H3,
    },
  };
}

function minimalShaderManifest(): ShaderVersionManifest {
  return {
    contractVersion: SHADER_VERSION_MANIFEST_VERSION,
    shaderId: "shader-realistic",
    version: "1.0.0",
    modules: [{
      moduleId: "main",
      uri: "https://assets.example.invalid/shaders/realistic/1.0.0/main.wgsl",
      byteLength: 1,
      sha256: H0,
      contentType: ASSET_WGSL_CONTENT_TYPE,
    }],
    gpuInterface: minimalInterfaceRef(),
    pipelines: [{
      kind: "compute",
      pipelineId: "pipeline.main",
      layout: { bindGroups: [] },
      compute: { moduleId: "main", entryPoint: "main", constants: {} },
    }],
    renderRoles: [{ role: "material", pipelineIds: ["pipeline.main"] }],
    compatibleModelInterfaces: [{
      interfaceId: "model-interface",
      interfaceVersion: "1.0.0",
      manifestSha256: H2,
      interfaceAbiHash: H1,
      modelAbiHash: H0,
    }],
    requirements: { semantics: [], features: [], limits: [], formats: [] },
    shaderAbiHash: H2,
    validationEvidence: minimalEvidenceRef(),
    additionalValidationEvidence: [],
  };
}

function minimalProfileManifest(): ShaderStyleProfileManifest {
  return {
    contractVersion: SHADER_STYLE_PROFILE_MANIFEST_VERSION,
    profileId: "style-realistic",
    version: "1.0.0",
    style: "realistic",
    roles: [{
      role: "material",
      shader: {
        shaderId: "shader-realistic",
        version: "1.0.0",
        manifestUri: "https://assets.example.invalid/shaders/realistic/1.0.0/manifest.json",
        manifestSha256: H4,
      },
    }],
    compatibleModelInterfaces: [...minimalShaderManifest().compatibleModelInterfaces],
    requiredSemantics: [],
    requiredValidationScopes: [],
  };
}

function minimalProfileRef(): ShaderStyleProfileRef {
  return {
    profileId: "style-realistic",
    version: "1.0.0",
    manifestUri: "https://assets.example.invalid/profiles/realistic/1.0.0/manifest.json",
    manifestSha256: H1,
  };
}

describe("GPU shader asset contracts", () => {
  it("exports closed asset kinds, file roles, rollout flag, and style capability", () => {
    expect(ASSET_KINDS).toEqual([
      "model",
      "gpu-interface",
      "shader",
      "shader-style-profile",
      "shader-validation-evidence",
    ]);
    expect(ASSET_FILE_ROLES).toContain("wgsl");
    expect(ASSET_FILE_ROLES).toContain("shader-validation-evidence");
    expect(isAssetKind("shader")).toBe(true);
    expect(isAssetKind("spir-v")).toBe(false);
    expect(isAssetFileRole("gpu-interface-manifest")).toBe(true);
    expect(isAssetFileRole("glsl")).toBe(false);
    expect(GPU_SHADER_STORE_FEATURE_FLAG).toBe("asset.pipeline.shader-store.enabled");
    expect(GPU_SHADER_STYLE_SELECTION_CAPABILITY).toBe("gpu.shader.style.select");
  });

  it("keeps legacy manifests source-compatible and preserves typed fields", () => {
    const manifest = createAssetManifest({
      assetId: "legacy-model",
      version: "1.0.0",
      entrypoint: "model.glb",
      files: [assetFile("model.glb", "model")],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      repositoryHint: "preserved" as const,
    });

    expect("assetKind" in manifest).toBe(false);
    expect(manifest.repositoryHint).toBe("preserved");
  });

  it("creates a model manifest whose CPU-facing metadata is derived from the GPU interface", () => {
    const manifest = createModelAssetManifest({
      assetKind: "model",
      assetId: "model-fixture",
      version: "1.0.0",
      entrypoint: "model.glb",
      files: [assetFile("model.glb", "model")],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      gpuInterface: minimalInterfaceRef(),
      modelAbiHash: H0,
      providedSemantics: ["model.position"],
    });

    expect(manifest.defaultStyleProfile).toBeNull();
    expect(manifest.modelAbiHash).toBe(manifest.gpuInterface.modelAbiHash);
    expect(Object.isFrozen(manifest.providedSemantics)).toBe(true);

    expect(() => createModelAssetManifest({
      ...manifest,
      modelAbiHash: H3,
    })).toThrow(/modelAbiHash/u);
  });

  it("creates immutable interface, shader, profile, and evidence assets", () => {
    const gpuInterface = createGpuInterfaceAssetManifest({
      assetKind: "gpu-interface",
      assetId: "model-interface",
      version: "1.0.0",
      entrypoint: "gpu-interface.json",
      files: [assetFile("gpu-interface.json", "gpu-interface-manifest")],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      gpuInterfaceManifest: minimalGpuInterface(),
    });
    const shader = createShaderAssetManifest({
      assetKind: "shader",
      assetId: "shader-realistic",
      version: "1.0.0",
      entrypoint: "shader.json",
      files: [
        assetFile("shader.json", "shader-manifest"),
        assetFile("main.wgsl", "wgsl", H0, 1, ASSET_WGSL_CONTENT_TYPE),
      ],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      shaderManifest: minimalShaderManifest(),
    });
    const profile = createShaderStyleProfileAssetManifest({
      assetKind: "shader-style-profile",
      assetId: "style-realistic",
      version: "1.0.0",
      entrypoint: "profile.json",
      files: [assetFile("profile.json", "shader-style-profile-manifest")],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      styleProfileManifest: minimalProfileManifest(),
    });
    const evidence = createShaderValidationEvidenceAssetManifest({
      assetKind: "shader-validation-evidence",
      assetId: "qualification-test",
      version: "2026-07-13",
      entrypoint: "qualification-test.json",
      files: [
        assetFile("qualification-test.json", "shader-validation-evidence", H2),
        assetFile("qualification-test.attestation.json", "shader-validation-attestation", H3),
      ],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      validationEvidence: minimalEvidenceRef(),
    });

    expect(Object.isFrozen(gpuInterface.gpuInterfaceManifest)).toBe(true);
    expect(Object.isFrozen(shader.shaderManifest.modules)).toBe(true);
    expect(Object.isFrozen(profile.styleProfileManifest.roles)).toBe(true);
    expect(Object.isFrozen(evidence.validationEvidence.attestationRef)).toBe(true);

    expect(() => createAssetPromotionRecord({
      promotionId: "promotion.shader-realistic.v1",
      jobId: "assetjob.shader-realistic.admission",
      assetId: shader.assetId,
      version: shader.version,
      sourceAdapter: "local-import",
      outcome: "promoted",
      manifest: shader,
      reviewReport: createAssetReviewReport({
        assetId: shader.assetId,
        version: shader.version,
        passed: true,
        findings: [],
        reviewedAt: CREATED_AT,
      }),
      approvedBy: "shader-admission:matrix-gate",
      approvedAt: CREATED_AT,
      promotedAt: CREATED_AT,
      runtimeChannel: "stable-universal",
      runtimeManifestUri: "https://assets.example.invalid/catalog/shader-realistic/1.0.0/manifest.json",
    })).toThrow(/complete file bytes/u);
  });

  it("binds complete asset bytes before typed promotion and creates exact refs", async () => {
    const moduleBytes = new TextEncoder().encode("@compute @workgroup_size(1) fn main() {}");
    const moduleSha256 = await computeSha256(moduleBytes);
    const shaderManifest: ShaderVersionManifest = {
      ...minimalShaderManifest(),
      modules: [{
        moduleId: "main",
        uri: "https://assets.example.invalid/shaders/shader-realistic/1.0.0/main.wgsl",
        byteLength: moduleBytes.byteLength,
        sha256: moduleSha256,
        contentType: ASSET_WGSL_CONTENT_TYPE,
      }],
    };
    const manifestBytes = new TextEncoder().encode(canonicalizeGpuContract(shaderManifest));
    const manifestSha256 = await computeSha256(manifestBytes);
    const shader = createShaderAssetManifest({
      assetKind: "shader",
      assetId: "shader-realistic",
      version: "1.0.0",
      entrypoint: "shader.json",
      files: [
        assetFile("shader.json", "shader-manifest", manifestSha256, manifestBytes.byteLength),
        assetFile(
          "main.wgsl",
          "wgsl",
          moduleSha256,
          moduleBytes.byteLength,
          ASSET_WGSL_CONTENT_TYPE,
        ),
      ],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      shaderManifest,
    });
    const files = new Map<string, Uint8Array>([
      ["shader.json", manifestBytes],
      ["main.wgsl", moduleBytes],
    ]);

    await expect(validateGpuAssetFiles({ manifest: shader, files })).resolves.toMatchObject({
      assetKind: "shader",
      assetId: "shader-realistic",
    });

    const shaderRef = await createShaderVersionRef({
      manifest: shaderManifest,
      manifestBytes,
      manifestUri: "https://assets.example.invalid/shaders/shader-realistic/1.0.0/shader.json",
    });
    const interfaceManifest = minimalGpuInterface();
    const interfaceRef = await createGpuInterfaceRef({
      manifest: interfaceManifest,
      manifestBytes: new TextEncoder().encode(canonicalizeGpuContract(interfaceManifest)),
      manifestUri: "https://assets.example.invalid/interfaces/model-interface/1.0.0/gpu-interface.json",
    });
    const profileManifest = minimalProfileManifest();
    const profileRef = await createShaderStyleProfileRef({
      manifest: profileManifest,
      manifestBytes: new TextEncoder().encode(canonicalizeGpuContract(profileManifest)),
      manifestUri: "https://assets.example.invalid/profiles/style-realistic/1.0.0/profile.json",
    });
    expect(shaderRef.shaderId).toBe("shader-realistic");
    expect(interfaceRef.interfaceId).toBe("model-interface");
    expect(profileRef.profileId).toBe("style-realistic");
    await expect(createGpuInterfaceRef({
      manifest: interfaceManifest,
      manifestBytes: new TextEncoder().encode("{}"),
      manifestUri: "https://assets.example.invalid/interfaces/model-interface/1.0.0/gpu-interface.json",
    })).rejects.toThrow(/differ from the supplied manifest/u);

    const promotion = await createGpuAssetPromotionRecord({
      promotionId: "promotion.shader-realistic.v1",
      jobId: "assetjob.shader-realistic.admission",
      assetId: shader.assetId,
      version: shader.version,
      sourceAdapter: "local-import",
      outcome: "promoted",
      manifest: shader,
      reviewReport: createAssetReviewReport({
        assetId: shader.assetId,
        version: shader.version,
        passed: true,
        findings: [],
        reviewedAt: CREATED_AT,
      }),
      approvedBy: "shader-admission:matrix-gate",
      approvedAt: CREATED_AT,
      promotedAt: CREATED_AT,
      runtimeChannel: "stable-universal",
      runtimeManifestUri: shaderRef.manifestUri,
    }, files);
    expect(promotion.manifest.shaderManifest.shaderId).toBe("shader-realistic");
    await expect(createGpuAssetPromotionRecord({
      ...promotion,
      runtimeManifestUri: "not-even-a-uri",
    }, files)).rejects.toThrow(/immutable asset URI/u);

    const changedManifest = { ...shaderManifest, shaderAbiHash: H3 };
    const changedBytes = new TextEncoder().encode(canonicalizeGpuContract(changedManifest));
    const changedSha256 = await computeSha256(changedBytes);
    const mismatchedAsset = createShaderAssetManifest({
      ...shader,
      files: [
        assetFile("shader.json", "shader-manifest", changedSha256, changedBytes.byteLength),
        assetFile(
          "main.wgsl",
          "wgsl",
          moduleSha256,
          moduleBytes.byteLength,
          ASSET_WGSL_CONTENT_TYPE,
        ),
      ],
      shaderManifest,
    });
    await expect(validateGpuAssetFiles({
      manifest: mismatchedAsset,
      files: new Map([
        ["shader.json", changedBytes],
        ["main.wgsl", moduleBytes],
      ]),
    })).rejects.toThrow(/entrypoint bytes differ/u);
  });

  it("rejects canonical evidence bytes that do not bind passing matrix evidence", async () => {
    const evidenceBytes = new TextEncoder().encode("{}");
    const attestationBytes = new TextEncoder().encode('{"kind":"attestation"}');
    const evidenceSha256 = await computeSha256(evidenceBytes);
    const attestationSha256 = await computeSha256(attestationBytes);
    const validationEvidence: ShaderValidationEvidenceRef = {
      ...minimalEvidenceRef(),
      sha256: evidenceSha256,
      attestationRef: {
        ...minimalEvidenceRef().attestationRef,
        sha256: attestationSha256,
      },
    };
    const manifest = createShaderValidationEvidenceAssetManifest({
      assetKind: "shader-validation-evidence",
      assetId: "qualification-test",
      version: "2026-07-13",
      entrypoint: "qualification-test.json",
      files: [
        assetFile(
          "qualification-test.json",
          "shader-validation-evidence",
          evidenceSha256,
          evidenceBytes.byteLength,
        ),
        assetFile(
          "qualification-test.attestation.json",
          "shader-validation-attestation",
          attestationSha256,
          attestationBytes.byteLength,
        ),
      ],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      validationEvidence,
    });

    await expect(validateGpuAssetFiles({
      manifest,
      files: new Map([
        ["qualification-test.json", evidenceBytes],
        ["qualification-test.attestation.json", attestationBytes],
      ]),
    })).rejects.toThrow(/passing declared evidence/u);
  });

  it("rejects mismatched identities, bytes, roles, semantics, and matrix evidence", () => {
    expect(() => createGpuInterfaceAssetManifest({
      assetKind: "gpu-interface",
      assetId: "wrong-interface",
      version: "1.0.0",
      entrypoint: "gpu-interface.json",
      files: [assetFile("gpu-interface.json", "gpu-interface-manifest")],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      gpuInterfaceManifest: minimalGpuInterface(),
    })).toThrow(/identity/u);

    expect(() => createGpuInterfaceAssetManifest({
      assetKind: "gpu-interface",
      assetId: "model-interface",
      version: "1.0.0",
      entrypoint: "gpu-interface.json",
      files: [assetFile("gpu-interface.json", "gpu-interface-manifest")],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      gpuInterfaceManifest: {
        ...minimalGpuInterface(),
        interfaceId: "model.interface",
      },
    })).toThrow(/identity/u);

    expect(() => createGpuInterfaceAssetManifest({
      assetKind: "gpu-interface",
      assetId: "model-interface",
      version: "1.0.0",
      entrypoint: "gpu-interface.json",
      files: [assetFile("gpu-interface.json", "gpu-interface-manifest")],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      gpuInterfaceManifest: minimalGpuInterface(),
      records: [],
    } as never)).toThrow(/unsupported fields/u);

    expect(() => createGpuInterfaceAssetManifest({
      assetKind: "gpu-interface",
      assetId: "model-interface",
      version: "1.0.0",
      entrypoint: "gpu-interface.json",
      files: [assetFile(
        "gpu-interface.json",
        "gpu-interface-manifest",
        H4,
        1,
        "application/octet-stream",
      )],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      gpuInterfaceManifest: minimalGpuInterface(),
    })).toThrow(/application\/json/u);

    expect(() => createShaderAssetManifest({
      assetKind: "shader",
      assetId: "shader-realistic",
      version: "1.0.0",
      entrypoint: "shader.json",
      files: [
        assetFile("shader.json", "shader-manifest"),
        assetFile("main.wgsl", "wgsl", H1, 1, ASSET_WGSL_CONTENT_TYPE),
      ],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      shaderManifest: minimalShaderManifest(),
    })).toThrow(/WGSL module files/u);

    expect(() => createShaderAssetManifest({
      assetKind: "shader",
      assetId: "shader-realistic",
      version: "1.0.0",
      entrypoint: "shader.json",
      files: [
        assetFile("shader.json", "shader-manifest"),
        assetFile("main.wgsl", "wgsl", H0, 1, ASSET_WGSL_CONTENT_TYPE),
      ],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      shaderManifest: {
        ...minimalShaderManifest(),
        modules: [{
          ...minimalShaderManifest().modules[0]!,
          uri: "https://assets.example.invalid/shaders/realistic/1.0.0/other.wgsl",
        }],
      },
    })).toThrow(/URI paths/u);

    expect(() => createShaderAssetManifest({
      assetKind: "shader",
      assetId: "shader-realistic",
      version: "1.0.0",
      entrypoint: "shader.json",
      files: [
        assetFile("shader.json", "shader-manifest"),
        assetFile("main.wgsl", "wgsl", H0, 1, ASSET_WGSL_CONTENT_TYPE),
        assetFile("legacy.spv", "binary"),
      ],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      shaderManifest: minimalShaderManifest(),
    })).toThrow(/do not allow binary/u);

    expect(() => createShaderAssetManifest({
      assetKind: "shader",
      assetId: "shader-realistic",
      version: "1.0.0",
      entrypoint: "shader.json",
      files: [
        assetFile("shader.json", "shader-manifest"),
        assetFile("main.wgsl", "wgsl", H0, 1, ASSET_WGSL_CONTENT_TYPE),
      ],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      shaderManifest: {
        ...minimalShaderManifest(),
        shaderAbiHash: "bad" as Sha256Hex,
      },
    })).toThrow(/shaderAbiHash/u);

    expect(() => createShaderAssetManifest({
      assetKind: "shader",
      assetId: "shader-realistic",
      version: "1.0.0",
      entrypoint: "shader.json",
      files: [
        assetFile("shader.json", "shader-manifest"),
        assetFile("main.wgsl", "wgsl", H0, 1, ASSET_WGSL_CONTENT_TYPE),
      ],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      shaderManifest: {
        ...minimalShaderManifest(),
        requirements: {
          semantics: ["model.position", "model.position"],
          features: [],
          limits: [],
          formats: [],
        },
      },
    })).toThrow(/duplicate/u);

    const incompleteEvidenceFiles = [
      assetFile("qualification-test.json", "shader-validation-evidence", H2),
    ];
    expect(() => createShaderValidationEvidenceAssetManifest({
      assetKind: "shader-validation-evidence",
      assetId: "qualification-test",
      version: "2026-07-13",
      entrypoint: "qualification-test.json",
      files: incompleteEvidenceFiles,
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      validationEvidence: minimalEvidenceRef(),
    })).toThrow(/attestation/u);

    expect(() => createShaderValidationEvidenceAssetManifest({
      assetKind: "shader-validation-evidence",
      assetId: "qualification-test",
      version: "2026-07-13",
      entrypoint: "qualification-test.json",
      files: [
        assetFile("qualification-test.json", "shader-validation-evidence", H2),
        assetFile("qualification-test.attestation.json", "shader-validation-attestation", H3),
      ],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      validationEvidence: {
        ...minimalEvidenceRef(),
        matrixSha256: H4,
      },
    })).toThrow(/supported WebGPU matrix/u);

    expect(() => createShaderValidationEvidenceAssetManifest({
      assetKind: "shader-validation-evidence",
      assetId: "qualification-test",
      version: "2026-07-13",
      entrypoint: "qualification-test.json",
      files: [
        assetFile("qualification-test.json", "shader-validation-evidence", H2),
        assetFile("qualification-test.attestation.json", "shader-validation-attestation", H3),
      ],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      validationEvidence: {
        ...minimalEvidenceRef(),
        uri: "https://assets.example.invalid/evidence/qualification-test.json?sig=secret",
      },
    })).toThrow(/SAS credentials/u);

    expect(() => createShaderStyleProfileAssetManifest({
      assetKind: "shader-style-profile",
      assetId: "style-realistic",
      version: "1.0.0",
      entrypoint: "profile.json",
      files: [assetFile("profile.json", "shader-style-profile-manifest")],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      styleProfileManifest: {
        ...minimalProfileManifest(),
        roles: [],
      },
    })).toThrow(/roles/u);

    expect(() => createShaderStyleProfileAssetManifest({
      assetKind: "shader-style-profile",
      assetId: "style-realistic",
      version: "1.0.0",
      entrypoint: "profile.json",
      files: [assetFile("profile.json", "shader-style-profile-manifest")],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      styleProfileManifest: {
        ...minimalProfileManifest(),
        roles: [{
          role: "material",
          shader: {
            ...minimalProfileManifest().roles[0]!.shader,
            manifestSha256: "bad" as Sha256Hex,
          },
        }],
      },
    })).toThrow(/manifestSha256/u);
  });

  it("rejects undeclared asset kinds and file roles", () => {
    expect(() => createAssetManifest({
      assetKind: "spir-v" as "shader",
      assetId: "bad-kind",
      version: "1.0.0",
      entrypoint: "shader.spv",
      files: [assetFile("shader.spv", "binary")],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
    })).toThrow(/specialized/u);

    expect(() => createAssetManifest({
      assetKind: "shader",
      assetId: "shader-realistic",
      version: "1.0.0",
      entrypoint: "shader.json",
      files: [assetFile("shader.json", "shader-manifest")],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
    })).toThrow(/specialized/u);

    expect(() => createAssetFileDescriptor({
      ...assetFile("shader.glsl", "wgsl"),
      role: "glsl" as "wgsl",
    })).toThrow(/role/u);

    expect(() => createAssetFileDescriptor({
      ...assetFile("/main.wgsl", "wgsl", H0, 1, ASSET_WGSL_CONTENT_TYPE),
    })).toThrow(/relative POSIX path/u);

    expect(() => createAssetFileDescriptor({
      ...assetFile("https://example.invalid/main.wgsl", "wgsl", H0, 1, ASSET_WGSL_CONTENT_TYPE),
    })).toThrow(/relative POSIX path/u);

    expect(() => createAssetFileDescriptor({
      ...assetFile("%2e%2e/main.wgsl", "wgsl", H0, 1, ASSET_WGSL_CONTENT_TYPE),
    })).toThrow(/relative POSIX path/u);

    expect(() => createAssetManifest({
      assetId: "duplicate-files",
      version: "1.0.0",
      entrypoint: "model.glb",
      files: [
        assetFile("model.glb", "model"),
        assetFile("model.glb", "binary"),
      ],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
    })).toThrow(/unique/u);

    expect(() => createShaderValidationEvidenceRef({
      ...minimalEvidenceRef(),
      evidenceId: "qualification..test",
    })).toThrow(/safe GPU contract token/u);
    expect(createShaderValidationEvidenceRef({
      ...minimalEvidenceRef(),
      evidenceId: "qualification/run-1",
    }).evidenceId).toBe("qualification/run-1");
  });

  it("accepts an exact default style-profile reference for a compatible model", () => {
    const manifest = createModelAssetManifest({
      assetKind: "model",
      assetId: "model-fixture",
      version: "1.0.0",
      entrypoint: "model.glb",
      files: [assetFile("model.glb", "model")],
      sourceAdapter: "local-import",
      createdAt: CREATED_AT,
      gpuInterface: minimalInterfaceRef(),
      modelAbiHash: H0,
      providedSemantics: ["model.position"],
      defaultStyleProfile: minimalProfileRef(),
    });

    expect(manifest.defaultStyleProfile?.profileId).toBe("style-realistic");
  });
});
