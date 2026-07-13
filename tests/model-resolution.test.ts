import { describe, expect, it } from "vitest";
import {
  MODEL_CONFIRMATION_VIEW_KINDS,
  MODEL_CANDIDATE_HARD_GATE_KINDS,
  MODEL_MATCH_ASSURANCE_THRESHOLDS,
  MODEL_RANKER_EVIDENCE_MODES,
  MODEL_RESOLUTION_CONTRACT_VERSION,
  MODEL_RESOLUTION_STATES,
  MODEL_TEXT_ONLY_ASSURANCE_CEILING_REASON_CODE,
  STATIC_WORLD_V1_MODEL_POLICY,
  classifyModelMatchAssurance,
  createDisabledModelGeneratorPort,
  createModelAssetRef,
  createModelCandidate,
  createModelCandidateConfirmation,
  createModelGeneratorResult,
  createModelGeneratorRequest,
  createModelMatchAssessment,
  createModelProcessingManifest,
  createModelProvenance,
  createModelRequestSpec,
  createModelResolution,
  createModelRightsAssessment,
  createModelTechnicalProfile,
  evaluateModelHardConstraints,
  evaluateModelHardConstraintsForProfile,
  isModelResolutionState,
} from "../src/index.js";

const hash = (character: string): string => character.repeat(64);

const createRequest = () =>
  createModelRequestSpec({
    query: "  weathered oak farmhouse table  ",
    revision: 0,
    locale: "en-gb",
    rankerId: "semantic-model-ranker",
    hardConstraints: {
      boundsMetres: {
        min: [-1, 0, -0.5],
        max: [1, 1, 0.5],
      },
      dimensionsMetres: {
        width: 2,
        height: 1,
        depth: 1,
      },
      maxTriangles: 80_000,
      maxBytes: 40_000_000,
      maxTextureBytes: 16_000_000,
      maxTextureDimensionPx: 4096,
      maxPartitionCellMetres: 2,
      lod: "required",
      collision: "required",
      partition: "allowed",
    },
    softPreferences: {
      category: "furniture",
      style: "rustic",
      materials: ["oak", "iron"],
      colors: ["brown"],
      era: "victorian",
      condition: "weathered",
      tags: ["farmhouse", "dining"],
    },
    exclusions: ["modern plastic", "glass top"],
  });

const technicalProfile = {
  boundsMetres: {
    min: [-1, 0, -0.5],
    max: [1, 1, 0.5],
  },
  dimensionsMetres: {
    width: 2,
    height: 1,
    depth: 1,
  },
  triangleCount: 64_000,
  byteLength: 24_000_000,
  textureByteLength: 8_000_000,
  maxTextureDimensionPx: 4096,
  lodCount: 4,
  hasCollision: true,
  partitionCount: 1,
  partitionCellMetres: 2,
};

const childAsset = createModelAssetRef({
  assetId: "oak-table-top",
  version: "2026.07.12-a1",
  kind: "leaf",
  contentHash: hash("c"),
  runtimeManifestUri: "mcp://models/catalog/oak-table-top/versions/2026.07.12-a1/manifest",
});

const createViews = () =>
  MODEL_CONFIRMATION_VIEW_KINDS.map((kind, index) => ({
    kind,
    imageUri: `mcp://models/resolutions/resolution-1/candidates/candidate-1/${kind}.png`,
    sha256: hash(String(index + 1)),
    contentType: "image/png",
    width: 1024,
    height: 1024,
  }));

const createMatch = () =>
  createModelMatchAssessment({
    score: 0.91,
    hardConstraintPass: true,
    reasonCodes: ["semantic-category-match", "within-runtime-budget"],
    ranker: {
      id: "semantic-model-ranker",
      version: "1.2.0",
      calibrationId: "catalog-2026-07",
      calibrationVersion: "1",
      evidenceMode: "multimodal",
      assuranceCeiling: "high",
    },
    exactMatch: false,
    fidelityWarnings: ["source material names were normalized"],
    request: createRequest(),
    candidateId: "candidate-1",
    candidateContentHash: hash("a"),
  });

const createProcessingManifest = () => ({
  manifestId: "model-processing.candidate-1.v1",
  resolutionId: "resolution-1",
  candidateId: "candidate-1",
  kind: "assembly",
  contentHash: hash("a"),
  closureHash: hash("f"),
  technicalProfile,
  lods: [0, 1, 2, 3].map((level) => ({
    level,
    resource: {
      uri: `mcp://models/resolutions/resolution-1/candidates/candidate-1/lod${level}.glb`,
      byteLength: level === 0 ? technicalProfile.byteLength : Math.floor(12_000_000 / (2 ** (level - 1))),
      sha256: level === 0 ? hash("a") : hash(String(level + 4)),
      contentType: "model/gltf-binary",
    },
    triangleCount: 64_000 / (2 ** level),
    geometricErrorMetres: level === 0 ? 0 : 0.01 * (2 ** (level - 1)),
  })),
  collision: {
    kind: "convex-hull",
    resource: {
      uri: "mcp://models/resolutions/resolution-1/candidates/candidate-1/collision.glb",
      byteLength: 32_000,
      sha256: hash("8"),
      contentType: "model/gltf-binary",
    },
  },
  collisionPolicy: {
    profileId: "static-world-collision",
    profileVersion: "1",
    disposition: "proxy-required",
    category: "furniture",
    decisionToken: "collision_policy_token_0123456789abcdef",
  },
  children: [
    {
      instanceId: "table-top",
      assetRef: childAsset,
      transform: {
        translationMetres: [0, 0.75, 0],
        rotationQuaternion: [0, 0, 0, 1],
        scale: [1, 1, 1],
      },
    },
  ],
  converter: {
    id: "canonical-model-converter",
    version: "1.0.0",
    sourceFormat: "obj",
    targetFormat: "glb",
    sourceContentHash: hash("e"),
    outputContentHash: hash("a"),
    diagnostics: [
      {
        severity: "warning",
        code: "material-name-normalized",
        message: "Material names were normalized for runtime packaging.",
      },
    ],
    losses: [
      {
        code: "unsupported-source-metadata",
        severity: "info",
        message: "One non-runtime metadata field was omitted.",
      },
    ],
  },
  fidelityEvidence: [
    {
      aspect: "geometry",
      outcome: "preserved",
      message: "Canonical geometry remained within the requested dimensions and triangle budget.",
      evidenceResource: {
        uri: "mcp://models/resolutions/resolution-1/candidates/candidate-1/fidelity.json",
        byteLength: 1024,
        sha256: hash("9"),
        contentType: "application/json",
      },
    },
    {
      aspect: "materials",
      outcome: "preserved",
      message: "Runtime materials were preserved.",
    },
    {
      aspect: "textures",
      outcome: "preserved",
      message: "Runtime textures were preserved.",
    },
  ],
  fidelityGate: {
    profileId: "static-world-fidelity",
    profileVersion: "1",
    outcome: "passed",
    requiredAspects: ["geometry", "materials", "textures"],
    evaluatedAt: "2026-07-12T12:10:00.000Z",
    decisionToken: "fidelity_gate_token_0123456789abcdef",
  },
  processedAt: "2026-07-12T12:10:00.000Z",
});

const createCandidate = () =>
  createModelCandidate({
    resolutionId: "resolution-1",
    candidateId: "candidate-1",
    assetRef: {
      disposition: "proposed",
      proposalId: "proposal-1",
      kind: "assembly",
      contentHash: hash("a"),
    },
    match: createMatch(),
    provenance: {
      kind: "provider",
      sourceId: "polyhaven",
      sourceAssetId: "oak-table-42",
      sourcePageUri: "https://polyhaven.com/a/oak-table-42",
      contentHash: hash("e"),
      capturedAt: "2026-07-12T12:00:00.000Z",
    },
    rights: {
      decisionId: "rights-decision-1",
      decisionToken: "rights_decision_token_0123456789abcdef",
      policyId: "catalog-rights-v1",
      policyVersion: "1",
      sourceId: "polyhaven",
      sourceAssetId: "oak-table-42",
      sourceContentHash: hash("e"),
      status: "allowed",
      licenseId: "CC0-1.0",
      evidencePageUri: "https://polyhaven.com/license",
      reviewedAt: "2026-07-12T12:05:00.000Z",
    },
    technicalProfile,
    processingManifest: createProcessingManifest(),
    views: createViews(),
    renderEvidence: {
      renderId: "render-1",
      rendererId: "plasius-runtime-renderer",
      rendererVersion: "1.0.0",
      settingsId: "canonical-model-four-view",
      settingsVersion: "1",
      processingManifestId: "model-processing.candidate-1.v1",
      sourceContentHash: hash("a"),
      viewSha256s: createViews().map((view) => view.sha256),
      renderedAt: "2026-07-12T12:10:00.000Z",
      attestationToken: "render_attestation_token_0123456789abcdef",
    },
    hardGates: MODEL_CANDIDATE_HARD_GATE_KINDS.map((kind, index) => ({
      kind,
      outcome: "passed",
      validatorId: `${kind}-validator`,
      validatorVersion: "1.0.0",
      subjectContentHash: kind === "malware-scan" ? hash("e") : hash("f"),
      reasonCodes: [],
      evaluatedAt: "2026-07-12T12:10:00.000Z",
      attestationToken: `hard_gate_token_${index}_0123456789abcdef`,
    })),
    confirmationToken: "confirmation_token_0123456789abcdef",
  });

const createConfirmation = (candidate = createCandidate()) => ({
  confirmationId: "confirmation-1",
  resolutionId: "resolution-1",
  candidateId: candidate.candidateId,
  confirmationToken: candidate.confirmationToken,
  viewSha256s: candidate.views.map((view) => view.sha256),
  confirmedBy: "requester-42",
  confirmedAt: "2026-07-12T12:15:00.000Z",
  semanticRiskAccepted: false,
});

const createPromotionReceipt = (
  candidate: ReturnType<typeof createCandidate>,
  finalAssetRef: ReturnType<typeof createModelAssetRef>,
) => ({
  promotionId: "promotion-1",
  resolutionId: "resolution-1",
  candidateId: candidate.candidateId,
  proposalId: candidate.assetRef.disposition === "proposed"
    ? candidate.assetRef.proposalId
    : "not-proposed",
  confirmationId: "confirmation-1",
  processingManifestId: candidate.processingManifest.manifestId,
  processingContentHash: candidate.processingManifest.contentHash,
  closureHash: candidate.processingManifest.closureHash,
  finalAssetRef,
  promotedAt: "2026-07-12T12:18:00.000Z",
  publicationToken: "publication_token_0123456789abcdef",
});

describe("model resolution contracts", () => {
  it("creates a deeply immutable end-to-end resolution candidate and processing manifest", () => {
    const request = createRequest();
    const candidate = createCandidate();
    const manifest = createModelProcessingManifest(createProcessingManifest());
    const resolution = createModelResolution({
      resolutionId: "resolution-1",
      request,
      attempts: 1,
      state: "awaiting-confirmation",
      candidates: [candidate],
      bestCandidate: candidate,
      refinementQuestions: [],
      createdAt: "2026-07-12T12:00:00.000Z",
      updatedAt: "2026-07-12T12:10:00.000Z",
    });

    expect(request).toMatchObject({
      contractVersion: MODEL_RESOLUTION_CONTRACT_VERSION,
      query: "weathered oak farmhouse table",
      locale: "en-GB",
    });
    expect(candidate.confirmationRequired).toBe(true);
    expect(candidate.views.map((view) => view.kind)).toEqual([
      "front",
      "left",
      "top",
      "isometric",
    ]);
    expect(manifest.coordinateSystem).toEqual({
      unit: "metre",
      upAxis: "Y",
      forwardAxis: "-Z",
      origin: "floor-centred",
      outwardFaceWinding: "counter-clockwise",
    });
    expect(manifest.lods.map((lod) => lod.level)).toEqual([0, 1, 2, 3]);
    expect(resolution.request.revision).toBe(0);
    expect(resolution.attempts).toBe(1);
    expect(resolution.bestCandidate).toBe(resolution.candidates[0]);
    expect(Object.isFrozen(resolution)).toBe(true);
    expect(Object.isFrozen(resolution.request.hardConstraints.boundsMetres?.min)).toBe(true);
    expect(Object.isFrozen(candidate.views)).toBe(true);
    expect(Object.isFrozen(manifest.children[0]?.transform.translationMetres)).toBe(true);
  });

  it("pins assurance thresholds and fails the assurance band closed on hard constraints", () => {
    expect(MODEL_MATCH_ASSURANCE_THRESHOLDS).toEqual({ high: 0.75, low: 0.5 });
    expect(MODEL_RANKER_EVIDENCE_MODES).toEqual([
      "text-only",
      "vision",
      "multimodal",
      "exact-identifier",
    ]);
    expect(classifyModelMatchAssurance(0.75, true, "multimodal", false, "high")).toBe("high");
    expect(classifyModelMatchAssurance(0.75, true, "multimodal", false, "low")).toBe("low");
    expect(classifyModelMatchAssurance(0.5, true, "vision", false, "high")).toBe("low");
    expect(classifyModelMatchAssurance(0.499_999, true, "multimodal", false, "high")).toBe("none");
    expect(classifyModelMatchAssurance(1, false, "exact-identifier", true, "high")).toBe("none");
    expect(() => classifyModelMatchAssurance(Number.NaN, true, "vision", false, "high")).toThrow(/score/i);

    expect(classifyModelMatchAssurance(0.99, true, "text-only", false, "low")).toBe("low");
    expect(classifyModelMatchAssurance(0.1, true, "exact-identifier", true, "high")).toBe("high");
    expect(() => classifyModelMatchAssurance(0.99, true, "text-only", true, "low")).toThrow(/exactMatch|exact-identifier/i);
    expect(() => classifyModelMatchAssurance(0.99, true, "text-only", false, "high")).toThrow(/text-only.*ceiling|ceiling.*low/i);

    const assessment = createModelMatchAssessment({
      score: 0.99,
      assurance: "high",
      hardConstraintPass: false,
      reasonCodes: ["triangle-budget-exceeded"],
      ranker: {
        id: "semantic-model-ranker",
        version: "1.2.0",
        calibrationId: "catalog-2026-07",
        calibrationVersion: "1",
        evidenceMode: "text-only",
        assuranceCeiling: "low",
      },
      exactMatch: false,
      fidelityWarnings: [],
      request: createRequest(),
      candidateId: "candidate-1",
      candidateContentHash: hash("a"),
    });
    expect(assessment).toMatchObject({
      assurance: "none",
      exactMatch: false,
      ranker: { evidenceMode: "text-only" },
    });

    const textOnlyAssessment = createModelMatchAssessment({
      ...assessment,
      score: 0.99,
      hardConstraintPass: true,
      reasonCodes: ["semantic-match"],
    });
    expect(textOnlyAssessment).toMatchObject({
      score: 0.99,
      assurance: "low",
    });
    expect(textOnlyAssessment.reasonCodes).toEqual([
      "semantic-match",
      MODEL_TEXT_ONLY_ASSURANCE_CEILING_REASON_CODE,
    ]);
    expect(createModelMatchAssessment({
      ...assessment,
      score: 0.99,
      exactMatch: true,
      hardConstraintPass: true,
      reasonCodes: ["exact-alias-match"],
      ranker: {
        ...assessment.ranker,
        evidenceMode: "exact-identifier",
        assuranceCeiling: "high",
      },
    }).assurance).toBe("high");
    expect(() => createModelMatchAssessment({
      ...assessment,
      hardConstraintPass: true,
      reasonCodes: ["invalid-ranker-ceiling"],
      ranker: {
        ...assessment.ranker,
        assuranceCeiling: "high",
      },
    })).toThrow(/text-only.*ceiling|ceiling.*low/i);
    expect(() => createModelMatchAssessment({
      ...assessment,
      ranker: { ...assessment.ranker, id: "silent-fallback-ranker" },
    })).toThrow(/ranker.*request|selected/i);
  });

  it("carries every tighten-able request budget and measured technical fact", () => {
    const request = createRequest();
    expect(request.hardConstraints).toMatchObject({
      maxTriangles: 80_000,
      maxBytes: 40_000_000,
      maxTextureBytes: 16_000_000,
      maxTextureDimensionPx: 4096,
      maxPartitionCellMetres: 2,
    });
    expect(createModelRequestSpec({
      query: "non-collidable decorative model",
      revision: 0,
    }).hardConstraints.collision).toBe("optional");
    expect(createModelTechnicalProfile(technicalProfile)).toMatchObject({
      textureByteLength: 8_000_000,
      partitionCellMetres: 2,
    });
    expect(() => createModelRequestSpec({
      ...request,
      hardConstraints: {
        ...request.hardConstraints,
        maxTextureBytes: 0,
      },
    })).toThrow(/maxTextureBytes/i);
    expect(() => createModelRequestSpec({
      ...request,
      hardConstraints: {
        ...request.hardConstraints,
        maxBytes: 1_000,
        maxTextureBytes: 1_001,
      },
    })).toThrow(/maxTextureBytes.*maxBytes|texture.*model/i);
    expect(() => createModelRequestSpec({
      ...request,
      hardConstraints: {
        ...request.hardConstraints,
        dimensionsMetres: { width: 3, height: 1, depth: 1 },
      },
    })).toThrow(/dimensionsMetres.*boundsMetres|dimensions.*bounds/i);
    expect(() => createModelRequestSpec({
      ...request,
      hardConstraints: {
        ...request.hardConstraints,
        maxPartitionCellMetres: Number.NaN,
      },
    })).toThrow(/maxPartitionCellMetres|finite/i);
    expect(createModelTechnicalProfile({
      ...technicalProfile,
      textureByteLength: 0,
      maxTextureDimensionPx: 0,
    })).toMatchObject({ textureByteLength: 0, maxTextureDimensionPx: 0 });
    expect(() => createModelTechnicalProfile({
      ...technicalProfile,
      textureByteLength: 0,
    })).toThrow(/textureByteLength|maxTextureDimensionPx|textureless/i);
    expect(() => createModelTechnicalProfile({
      ...technicalProfile,
      textureByteLength: technicalProfile.byteLength + 1,
    })).toThrow(/textureByteLength.*byteLength|texture.*model/i);
    expect(() => createModelTechnicalProfile({
      ...technicalProfile,
      partitionCellMetres: Number.POSITIVE_INFINITY,
    })).toThrow(/partitionCellMetres|finite/i);
    for (const hardConstraints of [
      { maxTriangles: STATIC_WORLD_V1_MODEL_POLICY.maxTriangles + 1 },
      { maxBytes: STATIC_WORLD_V1_MODEL_POLICY.maxBytes + 1 },
      { maxTextureBytes: STATIC_WORLD_V1_MODEL_POLICY.maxTextureBytes + 1 },
      { maxTextureDimensionPx: STATIC_WORLD_V1_MODEL_POLICY.maxTextureDimensionPx + 1 },
      { maxPartitionCellMetres: STATIC_WORLD_V1_MODEL_POLICY.maxPartitionCellMetres + 1 },
    ]) {
      expect(() => createModelRequestSpec({
        query: "oversized model",
        revision: 0,
        hardConstraints,
      })).toThrow(/between|static-world|max/i);
    }
  });

  it("deterministically evaluates and binds every request hard constraint", () => {
    const candidate = createCandidate();
    expect(evaluateModelHardConstraintsForProfile(
      createRequest(),
      createModelTechnicalProfile(technicalProfile),
    )).toEqual({ pass: true, reasonCodes: [] });
    expect(evaluateModelHardConstraints(createRequest(), candidate)).toEqual({
      pass: true,
      reasonCodes: [],
    });
    const failingRequests = [
      ["triangle-budget-exceeded", { maxTriangles: 63_999 }],
      ["model-byte-budget-exceeded", { maxBytes: 23_000_000, maxTextureBytes: 8_000_000 }],
      ["texture-byte-budget-exceeded", { maxTextureBytes: 7_000_000 }],
      ["texture-dimension-budget-exceeded", { maxTextureDimensionPx: 2048 }],
      ["partition-cell-budget-exceeded", { maxPartitionCellMetres: 1 }],
      ["lod-policy-failed", { lod: "forbidden" }],
      ["collision-policy-failed", { collision: "forbidden" }],
      ["partition-policy-failed", { partition: "required" }],
    ] as const;
    for (const [reasonCode, overrides] of failingRequests) {
      const request = createModelRequestSpec({
        ...createRequest(),
        hardConstraints: { ...createRequest().hardConstraints, ...overrides },
      });
      expect(evaluateModelHardConstraints(request, candidate)).toMatchObject({
        pass: false,
        reasonCodes: expect.arrayContaining([reasonCode]),
      });
    }
    const dimensionalRequest = createModelRequestSpec({
      ...createRequest(),
      hardConstraints: {
        ...createRequest().hardConstraints,
        boundsMetres: { min: [-1.5, 0, -0.5], max: [1.5, 1, 0.5] },
        dimensionsMetres: { width: 3, height: 1, depth: 1 },
      },
    });
    expect(evaluateModelHardConstraints(dimensionalRequest, candidate).reasonCodes).toEqual([
      "bounds-mismatch",
      "dimensions-mismatch",
    ]);

    const strictRequest = createModelRequestSpec({
      ...createRequest(),
      hardConstraints: { ...createRequest().hardConstraints, maxTriangles: 63_999 },
    });
    const lyingCandidate = {
      ...candidate,
      match: {
        ...candidate.match,
        request: strictRequest,
        hardConstraintPass: true,
      },
    };
    expect(() => createModelCandidate(lyingCandidate)).toThrow(/hardConstraintPass|deterministic/i);
    expect(() => createModelCandidateConfirmation(
      createConfirmation(candidate),
      lyingCandidate,
      "resolution-1",
    )).toThrow(/hardConstraintPass|deterministic/i);
  });

  it("requires exactly the four confirmation views and an explicit confirmation token", () => {
    const candidate = createCandidate();
    expect(() =>
      createModelCandidate({
        ...candidate,
        views: candidate.views.slice(0, 3),
      })
    ).toThrow(/front.*left.*top.*isometric/i);
    expect(() =>
      createModelCandidate({
        ...candidate,
        views: candidate.views.map((view) => ({
          ...view,
          kind: view.kind === "isometric" ? "front" : view.kind,
        })),
      })
    ).toThrow(/front.*left.*top.*isometric/i);
    expect(() =>
      createModelCandidate({
        ...candidate,
        confirmationToken: "",
      })
    ).toThrow(/confirmation/i);
    expect(() =>
      createModelCandidate({
        ...candidate,
        views: candidate.views.map((view) => ({
          ...view,
          width: 512,
          height: 512,
        })),
      })
    ).toThrow(/1024|width/i);
    expect(() => createModelCandidate({
      ...candidate,
      views: candidate.views.map((view) => ({ ...view, contentType: "image/jpeg" })),
    })).toThrow(/image\/png|contentType/i);
    expect(() => createModelCandidate({
      ...candidate,
      views: candidate.views.map((view, index) => ({
        ...view,
        imageUri: index === 1 ? candidate.views[0].imageUri : view.imageUri,
      })),
    })).toThrow(/unique|view/i);
    const symmetricViews = candidate.views.map((view, index) => ({
      ...view,
      sha256: index === 1 ? candidate.views[0].sha256 : view.sha256,
    }));
    expect(createModelCandidate({
      ...candidate,
      views: symmetricViews,
      renderEvidence: {
        ...candidate.renderEvidence,
        viewSha256s: symmetricViews.map((view) => view.sha256),
      },
    }).views[1].sha256).toBe(candidate.views[0].sha256);
    expect(() => createModelCandidate({
      ...candidate,
      views: candidate.views.map((view) => ({
        ...view,
        imageUri: view.imageUri.replace("candidate-1", "candidate-2"),
      })),
    })).toThrow(/candidate.*view|scope/i);
  });

  it("binds candidates to one authoritative processing manifest", () => {
    const candidate = createCandidate();
    expect(candidate.processingManifest.contentHash).toBe(candidate.assetRef.contentHash);
    expect(candidate.processingManifest.technicalProfile).toEqual(candidate.technicalProfile);
    for (const processingManifest of [
      { ...candidate.processingManifest, candidateId: "candidate-2" },
      { ...candidate.processingManifest, kind: "leaf" },
      { ...candidate.processingManifest, contentHash: hash("f") },
      {
        ...candidate.processingManifest,
        technicalProfile: { ...candidate.technicalProfile, byteLength: 23_000_000 },
      },
    ]) {
      expect(() => createModelCandidate({
        ...candidate,
        processingManifest,
      })).toThrow(/processingManifest|candidateId|kind|contentHash|technicalProfile/i);
    }
    const blockingManifest = {
      ...candidate.processingManifest,
      converter: {
        ...candidate.processingManifest.converter,
        diagnostics: [{
          severity: "blocking",
          code: "invalid-geometry",
          message: "Geometry validation failed.",
        }],
      },
      fidelityGate: {
        ...candidate.processingManifest.fidelityGate,
        outcome: "blocked",
      },
    };
    const blockedCandidate = createModelCandidate({
      ...candidate,
      match: {
        ...candidate.match,
        reasonCodes: [...candidate.match.reasonCodes, "fidelity-blocked"],
      },
      processingManifest: blockingManifest,
    });
    expect(() => createModelResolution({
      resolutionId: "resolution-1",
      request: createRequest(),
      attempts: 1,
      state: "awaiting-confirmation",
      candidates: [blockedCandidate],
      bestCandidate: blockedCandidate,
      refinementQuestions: [],
      createdAt: "2026-07-12T12:00:00.000Z",
      updatedAt: "2026-07-12T12:10:00.000Z",
    })).toThrow(/blocking|confirm/i);
  });

  it("binds confirmation receipts to the signed candidate and explicit low-risk override", () => {
    const candidate = createCandidate();
    const confirmation = createModelCandidateConfirmation(
      createConfirmation(candidate),
      candidate,
      "resolution-1",
    );
    expect(confirmation.viewSha256s).toEqual(candidate.views.map((view) => view.sha256));
    expect(Object.isFrozen(confirmation.viewSha256s)).toBe(true);
    expect(() => createModelCandidateConfirmation({
      ...confirmation,
      confirmationToken: "different_confirmation_token_0123456789",
    }, candidate, "resolution-1")).toThrow(/token|candidate/i);
    expect(() => createModelCandidateConfirmation({
      ...confirmation,
      viewSha256s: [...confirmation.viewSha256s].reverse(),
    }, candidate, "resolution-1")).toThrow(/view|hash/i);
    expect(() => createModelCandidateConfirmation({
      ...confirmation,
      resolutionId: "resolution-2",
    }, candidate, "resolution-1")).toThrow(/resolutionId/i);
    expect(() => createModelCandidateConfirmation({
      ...confirmation,
      resolutionId: "resolution-2",
    }, candidate, "resolution-2")).toThrow(/candidate.*expected.*resolutionId|belong/i);
    expect(() => createModelCandidateConfirmation({
      ...confirmation,
      semanticRiskAccepted: true,
    }, candidate, "resolution-1")).toThrow(/high.*semantic|risk/i);
    expect(() => createModelCandidateConfirmation({
      ...confirmation,
      confirmedAt: "2026-07-12T12:09:59.999Z",
    }, candidate, "resolution-1")).toThrow(/confirmedAt.*evidence|precede/i);

    const lowCandidate = createModelCandidate({
      ...candidate,
      match: {
        ...candidate.match,
        score: 0.6,
        assurance: "low",
      },
    });
    expect(() => createModelCandidateConfirmation(
      createConfirmation(lowCandidate),
      lowCandidate,
      "resolution-1",
    )).toThrow(/low.*semantic|risk.*accept/i);
    expect(createModelCandidateConfirmation({
      ...createConfirmation(lowCandidate),
      semanticRiskAccepted: true,
    }, lowCandidate, "resolution-1").semanticRiskAccepted).toBe(true);
  });

  it("binds render, hard-gate, and match evidence to one resolution request and candidate", () => {
    const candidate = createCandidate();
    expect(() => createModelCandidate({
      ...candidate,
      views: candidate.views.map((view) => ({
        ...view,
        imageUri: view.imageUri.replace("resolution-1", "resolution-2"),
      })),
    })).toThrow(/resolution.*candidate|scoped/i);
    expect(() => createModelCandidate({
      ...candidate,
      renderEvidence: { ...candidate.renderEvidence, sourceContentHash: hash("b") },
    })).toThrow(/renderEvidence.*LOD0|sourceContentHash/i);
    expect(() => createModelCandidate({
      ...candidate,
      hardGates: candidate.hardGates.slice(0, 3),
    })).toThrow(/every required.*hard gate|hardGates/i);
    const blockedCandidate = createModelCandidate({
      ...candidate,
      hardGates: candidate.hardGates.map((gate) => gate.kind === "malware-scan"
        ? { ...gate, outcome: "blocked", reasonCodes: ["malware-detected"] }
        : gate),
    });
    expect(() => createModelResolution({
      resolutionId: "resolution-1",
      request: createRequest(),
      attempts: 1,
      state: "awaiting-confirmation",
      candidates: [blockedCandidate],
      bestCandidate: blockedCandidate,
      refinementQuestions: [],
      createdAt: "2026-07-12T12:00:00.000Z",
      updatedAt: "2026-07-12T12:10:00.000Z",
    })).toThrow(/hard|confirm|gate/i);

    const transplantedRequest = createModelRequestSpec({
      ...createRequest(),
      query: "completely different marble fountain",
      revision: 1,
    });
    const transplantedCandidate = createModelCandidate({
      ...candidate,
      match: { ...candidate.match, request: transplantedRequest },
    });
    expect(() => createModelResolution({
      resolutionId: "resolution-1",
      request: createRequest(),
      attempts: 1,
      state: "awaiting-confirmation",
      candidates: [transplantedCandidate],
      bestCandidate: transplantedCandidate,
      refinementQuestions: [],
      createdAt: "2026-07-12T12:00:00.000Z",
      updatedAt: "2026-07-12T12:10:00.000Z",
    })).toThrow(/immutable request|match.*request/i);
  });

  it("requires complete fidelity evidence and caps unresolved fidelity at low assurance", () => {
    const candidate = createCandidate();
    const lowOnlyManifest = {
      ...candidate.processingManifest,
      fidelityEvidence: candidate.processingManifest.fidelityEvidence.map((evidence) =>
        evidence.aspect === "materials"
          ? { ...evidence, outcome: "approximated", message: "Materials were approximated." }
          : evidence),
      fidelityGate: { ...candidate.processingManifest.fidelityGate, outcome: "low-only" },
    };
    expect(() => createModelCandidate({
      ...candidate,
      match: {
        ...candidate.match,
        reasonCodes: [...candidate.match.reasonCodes, "fidelity-low-only"],
        fidelityWarnings: ["Materials were approximated."],
      },
      processingManifest: lowOnlyManifest,
    })).toThrow(/cap assurance.*low|low-only fidelity/i);
    const lowCandidate = createModelCandidate({
      ...candidate,
      match: {
        ...candidate.match,
        score: 0.6,
        assurance: "low",
        reasonCodes: [...candidate.match.reasonCodes, "fidelity-low-only"],
        fidelityWarnings: ["Materials were approximated."],
      },
      processingManifest: lowOnlyManifest,
    });
    expect(lowCandidate.match.assurance).toBe("low");
    expect(() => createModelProcessingManifest({
      ...candidate.processingManifest,
      fidelityEvidence: [],
    })).toThrow(/geometry.*materials.*textures|fidelityEvidence/i);
    expect(() => createModelProcessingManifest({
      ...candidate.processingManifest,
      converter: {
        ...candidate.processingManifest.converter,
        losses: [{
          code: "material-fidelity-unresolved",
          severity: "warning",
          message: "Material fidelity could not be resolved.",
        }],
      },
    })).toThrow(/fidelityGate.*outcome|fidelity.*match/i);
  });

  it("rejects unsafe model references, signed public pages, unknown fields, and invalid states", () => {
    for (const version of ["latest", "CURRENT", "1.x", "https://assets.example.invalid/v1"]) {
      expect(() => createModelAssetRef({
        assetId: "oak-table",
        version,
        kind: "leaf",
        contentHash: hash("a"),
        runtimeManifestUri: `mcp://models/catalog/oak-table/versions/${encodeURIComponent(version)}/manifest`,
      })).toThrow(/Immutable asset version must be an exact token/u);
    }
    expect(() =>
      createModelAssetRef({
        assetId: "oak-table",
        version: "v1",
        kind: "leaf",
        contentHash: hash("a"),
        runtimeManifestUri: "https://provider.example/download/model.glb?sig=secret",
      })
    ).toThrow(/mcp:\/\/models/i);
    for (const runtimeManifestUri of [
      "mcp://models/catalog/oak-table/versions/v1/../v1/manifest",
      "mcp://models/catalog/oak-table/versions/./v1/manifest",
      "mcp://models/catalog/oak-table/versions/v1/manifest?",
      "mcp://models/catalog/oak-table/versions/v1/manifest#",
      "mcp://models:443/catalog/oak-table/versions/v1/manifest",
      "MCP://MODELS/catalog/oak-table/versions/v1/manifest",
    ]) {
      expect(() => createModelAssetRef({
        assetId: "oak-table",
        version: "v1",
        kind: "leaf",
        contentHash: hash("a"),
        runtimeManifestUri,
      })).toThrow(/canonical|mcp:\/\/models|traversal|query|fragment|identity/i);
    }
    expect(() =>
      createModelAssetRef({
        assetId: "oak-table",
        version: "v1",
        kind: "leaf",
        contentHash: hash("a"),
        runtimeManifestUri: "mcp://models/catalog/other-table/versions/v1/manifest",
      })
    ).toThrow(/assetId|identity|catalog/i);
    expect(() =>
      createModelAssetRef({
        assetId: "oak-table",
        version: "v1",
        kind: "leaf",
        contentHash: hash("a"),
        runtimeManifestUri: "mcp://models/catalog/oak-table/versions/v2/manifest",
      })
    ).toThrow(/version|identity|catalog/i);
    expect(() =>
      createModelAssetRef({
        assetId: "oak-table",
        version: "v1",
        kind: "leaf",
        contentHash: hash("a"),
        runtimeManifestUri: "mcp://models/aliases/oak-table/manifest",
      })
    ).toThrow(/identity|catalog/i);
    expect(() =>
      createModelAssetRef({
        assetId: "oak-table",
        version: "v1",
        kind: "leaf",
        contentHash: hash("a"),
        runtimeManifestUri: "mcp://models/catalog/%252e%252e/private/manifest",
      })
    ).toThrow(/traversal|encoded/i);
    expect(() =>
      createModelAssetRef({
        assetId: "oak-table",
        version: "v1",
        kind: "leaf",
        contentHash: hash("a"),
        runtimeManifestUri: "mcp://assets/catalog/oak-table/manifest",
      })
    ).toThrow(/mcp:\/\/models/i);
    expect(() =>
      createModelRequestSpec({
        query: "oak table",
        revision: 0,
        unexpected: true,
      })
    ).toThrow(/unexpected/i);
    expect(() => createModelRequestSpec(null)).toThrow(/object/i);
    expect(() => createModelRequestSpec(Object.create({ query: "oak table" }))).toThrow(/plain object/i);
    expect(() =>
      createModelCandidate({
        ...createCandidate(),
        provenance: {
          ...createCandidate().provenance,
          sourcePageUri: "https://provider.example/model?id=42&token=secret",
        },
      })
    ).toThrow(/signed|secret|credential/i);
    expect(() =>
      createModelResolution({
        resolutionId: "resolution-1",
        request: createRequest(),
        attempts: 1,
        state: "done",
        candidates: [],
        createdAt: "2026-07-12T12:00:00.000Z",
        updatedAt: "2026-07-12T12:00:00.000Z",
      })
    ).toThrow(/state/i);

    for (const sourceAssetId of [
      "https://provider.example/model",
      "../provider-model",
      "folder/provider-model",
      "folder\\provider-model",
      "/absolute/provider-model",
      "C:\\provider-model",
    ]) {
      expect(() => createModelProvenance({
        kind: "provider",
        sourceId: "provider",
        sourceAssetId,
        sourcePageUri: "https://provider.example/models/provider-model",
        contentHash: hash("b"),
        capturedAt: "2026-07-12T12:00:00.000Z",
      })).toThrow(/sourceAssetId|opaque|token|URL/i);
    }
  });

  it("validates attribution evidence and rejects non-public evidence pages", () => {
    const rights = createModelRightsAssessment({
      decisionId: "rights-decision-2",
      decisionToken: "rights_decision_token_abcdef0123456789",
      policyId: "catalog-rights-v1",
      policyVersion: "1",
      sourceId: "provider",
      sourceAssetId: "oak-table",
      sourceContentHash: hash("e"),
      status: "attribution-required",
      licenseId: "CC-BY-4.0",
      evidencePageUri: "https://provider.example/licenses/cc-by-4.0",
      attribution: {
        title: "Oak Table",
        creator: "Example Artist",
        notice: "Licensed under CC BY 4.0.",
        sourcePageUri: "https://provider.example/models/oak-table",
      },
      reviewedAt: "2026-07-12T12:05:00.000Z",
    });

    expect(rights.attribution).toMatchObject({
      title: "Oak Table",
      sourcePageUri: "https://provider.example/models/oak-table",
    });
    expect(Object.isFrozen(rights.attribution)).toBe(true);
    expect(() => createModelRightsAssessment({
      ...rights,
      attribution: undefined,
    })).toThrow(/attribution.*required/i);
    expect(() => createModelRightsAssessment({
      ...rights,
      attribution: { ...rights.attribution, sourcePageUri: undefined },
    })).toThrow(/sourcePageUri|public.*source/i);

    for (const evidencePageUri of [
      "not-a-url",
      "http://provider.example/license",
      "https://user:password@provider.example/license",
      "https://localhost/license",
      "https://service.localhost/license",
      "https://provider.example./license",
      "https://intranet/license",
      "https://127.0.0.1/license",
      "https://192.168.1.5/license",
      "https://[::1]/license",
      "https://[fc00::1]/license",
      "https://[fe80::1]/license",
      "https://[::ffff:192.168.1.5]/license",
      "https://[ff02::1]/license",
      "https://127.0.0.1.nip.io/license",
      "https://provider.example/license?auth=secret",
    ]) {
      expect(() => createModelRightsAssessment({
        ...rights,
        evidencePageUri,
      })).toThrow(/public HTTPS|credential-free/i);
    }
  });

  it("validates existing catalog candidate identity and optional contract fields", () => {
    const candidate = createCandidate();
    const asset = createModelAssetRef({
      contractVersion: MODEL_RESOLUTION_CONTRACT_VERSION,
      assetId: "oak-table",
      version: "2026.07.12-existing",
      kind: "assembly",
      contentHash: candidate.assetRef.contentHash,
      runtimeManifestUri: "mcp://models/catalog/oak-table/versions/2026.07.12-existing/manifest",
    });
    const existing = createModelCandidate({
      ...candidate,
      confirmationRequired: true,
      assetRef: {
        disposition: "existing",
        asset,
      },
    });
    expect(existing.assetRef).toMatchObject({
      disposition: "existing",
      kind: "assembly",
      contentHash: hash("a"),
    });
    expect(createModelResolution({
      resolutionId: "resolution-1",
      request: createRequest(),
      attempts: 1,
      state: "completed",
      candidates: [existing],
      bestCandidate: existing,
      confirmation: createConfirmation(existing),
      refinementQuestions: [],
      finalAssetRef: asset,
      createdAt: "2026-07-12T12:00:00.000Z",
      updatedAt: "2026-07-12T12:20:00.000Z",
    }).finalAssetRef).toEqual(asset);

    expect(() => createModelCandidate({
      ...candidate,
      assetRef: {
        disposition: "existing",
        asset,
        kind: "leaf",
      },
    })).toThrow(/kind.*match/i);
    expect(() => createModelCandidate({
      ...candidate,
      assetRef: {
        disposition: "existing",
        asset,
        contentHash: hash("f"),
      },
    })).toThrow(/contentHash.*match/i);

    const minimalRequest = createModelRequestSpec({
      contractVersion: MODEL_RESOLUTION_CONTRACT_VERSION,
      query: "oak table",
      revision: 0,
    });
    expect(minimalRequest).toMatchObject({
      policyProfileId: "static-world-v1",
      hardConstraints: {
        maxTriangles: 1_000_000,
        maxBytes: 100 * 1024 * 1024,
        maxTextureBytes: 64 * 1024 * 1024,
        maxTextureDimensionPx: 4096,
        maxPartitionCellMetres: 32,
        collision: "optional",
      },
      softPreferences: {},
      exclusions: [],
    });
    expect(minimalRequest.locale).toBeUndefined();
    expect(() => createModelRequestSpec({
      contractVersion: "unsupported",
      query: "oak table",
      revision: 0,
    })).toThrow(/contractVersion/i);
  });

  it("bounds request revisions and validates attempts, refinements, and final asset consistency", () => {
    expect(
      createModelRequestSpec({
        query: "oak table",
        revision: 3,
      }).revision
    ).toBe(3);
    expect(() =>
      createModelRequestSpec({
        query: "oak table",
        revision: 4,
      })
    ).toThrow(/revision.*3/i);
    expect(() =>
      createModelResolution({
        resolutionId: "resolution-1",
        request: createRequest(),
        attempts: 0,
        state: "searching-catalog",
        candidates: [],
        refinementQuestions: [],
        createdAt: "2026-07-12T12:00:00.000Z",
        updatedAt: "2026-07-12T12:00:00.000Z",
      })
    ).toThrow(/attempt/i);

    const candidate = createCandidate();
    const finalAssetRef = createModelAssetRef({
      assetId: "oak-table",
      version: "2026.07.12-final",
      kind: "assembly",
      contentHash: candidate.assetRef.contentHash,
      runtimeManifestUri: "mcp://models/catalog/oak-table/versions/2026.07.12-final/manifest",
    });
    const completed = createModelResolution({
      resolutionId: "resolution-1",
      request: createRequest(),
      attempts: 2,
      state: "completed",
      candidates: [candidate],
      bestCandidate: candidate,
      confirmation: createConfirmation(candidate),
      refinementQuestions: [],
      finalAssetRef,
      promotionReceipt: createPromotionReceipt(candidate, finalAssetRef),
      createdAt: "2026-07-12T12:00:00.000Z",
      updatedAt: "2026-07-12T12:20:00.000Z",
    });
    expect(completed.finalAssetRef).toEqual(finalAssetRef);
    expect(completed.confirmation?.candidateId).toBe(candidate.candidateId);
    expect(() => createModelResolution({
      ...completed,
      promotionReceipt: undefined,
    })).toThrow(/promotionReceipt/i);
    expect(() => createModelResolution({
      ...completed,
      promotionReceipt: {
        ...completed.promotionReceipt,
        proposalId: "different-proposal",
      },
    })).toThrow(/exact proposal|promotionReceipt.*bind/i);
    expect(() =>
      createModelResolution({
        ...completed,
        finalAssetRef: {
          ...finalAssetRef,
          contentHash: hash("f"),
        },
      })
    ).toThrow(/finalAssetRef.*bestCandidate/i);
    expect(() =>
      createModelResolution({
        ...completed,
        state: "promoting",
      })
    ).toThrow(/finalAssetRef.*completed/i);
    expect(() => createModelResolution({
      ...completed,
      confirmation: undefined,
    })).toThrow(/confirmation/i);
    expect(() =>
      createModelResolution({
        resolutionId: "resolution-1",
        request: createRequest(),
        attempts: 1,
        state: "unresolved",
        candidates: [],
        refinementQuestions: [],
        createdAt: "2026-07-12T12:00:00.000Z",
        updatedAt: "2026-07-12T12:20:00.000Z",
      })
    ).toThrow(/stateReasonCode/i);
    expect(() =>
      createModelResolution({
        resolutionId: "resolution-1",
        request: createRequest(),
        attempts: 1,
        state: "unresolved",
        candidates: [],
        refinementQuestions: ["one", "two", "three", "four"],
        createdAt: "2026-07-12T12:00:00.000Z",
        updatedAt: "2026-07-12T12:20:00.000Z",
      })
    ).toThrow(/at most 3/i);
    expect(createModelResolution({
      resolutionId: "resolution-exhausted",
      request: createRequest(),
      attempts: 3,
      state: "unresolved",
      candidates: [],
      refinementQuestions: [],
      stateReasonCode: "provider-exhausted",
      createdAt: "2026-07-12T12:00:00.000Z",
      updatedAt: "2026-07-12T12:20:00.000Z",
    }).stateReasonCode).toBe("provider-exhausted");
    for (const state of ["failed", "cancelled"] as const) {
      expect(() => createModelResolution({
        resolutionId: `resolution-${state}`,
        request: createRequest(),
        attempts: 1,
        state,
        candidates: [],
        refinementQuestions: [],
        createdAt: "2026-07-12T12:00:00.000Z",
        updatedAt: "2026-07-12T12:20:00.000Z",
      })).toThrow(/stateReasonCode/i);
    }
  });

  it("requires a time-bounded confirmation receipt before promotion or completion", () => {
    const candidate = createCandidate();
    const base = {
      resolutionId: "resolution-1",
      request: createRequest(),
      attempts: 1,
      candidates: [candidate],
      bestCandidate: candidate,
      refinementQuestions: [],
      createdAt: "2026-07-12T12:00:00.000Z",
      updatedAt: "2026-07-12T12:20:00.000Z",
    };
    expect(() => createModelResolution({ ...base, state: "promoting" })).toThrow(/confirmation/i);
    expect(createModelResolution({
      ...base,
      state: "promoting",
      confirmation: createConfirmation(candidate),
    }).state).toBe("promoting");
    expect(() => createModelResolution({
      ...base,
      state: "awaiting-confirmation",
      confirmation: createConfirmation(candidate),
    })).toThrow(/awaiting-confirmation.*confirmation|confirmation.*awaiting/i);
    expect(() => createModelResolution({
      ...base,
      state: "searching-catalog",
      confirmation: createConfirmation(candidate),
    })).toThrow(/confirmation.*state|searching-catalog/i);
    expect(() => createModelResolution({
      ...base,
      state: "promoting",
      confirmation: {
        ...createConfirmation(candidate),
        confirmedAt: "2026-07-12T12:21:00.000Z",
      },
    })).toThrow(/confirmedAt|updatedAt|time/i);

    const secondManifest = {
      ...candidate.processingManifest,
      manifestId: "model-processing.candidate-2.v1",
      candidateId: "candidate-2",
      lods: candidate.processingManifest.lods.map((lod) => ({
        ...lod,
        resource: {
          ...lod.resource,
          uri: lod.resource.uri.replaceAll("candidate-1", "candidate-2"),
        },
      })),
      collision: candidate.processingManifest.collision.kind === "none"
        ? candidate.processingManifest.collision
        : {
            ...candidate.processingManifest.collision,
            resource: {
              ...candidate.processingManifest.collision.resource,
              uri: candidate.processingManifest.collision.resource!.uri.replaceAll("candidate-1", "candidate-2"),
            },
          },
      fidelityEvidence: candidate.processingManifest.fidelityEvidence.map((evidence) => ({
        ...evidence,
        ...(evidence.evidenceResource === undefined
          ? {}
          : {
              evidenceResource: {
                ...evidence.evidenceResource,
                uri: evidence.evidenceResource.uri.replaceAll("candidate-1", "candidate-2"),
              },
            }),
      })),
    };
    const secondCandidate = createModelCandidate({
      ...candidate,
      candidateId: "candidate-2",
      assetRef: {
        ...candidate.assetRef,
        proposalId: "proposal-2",
      },
      match: {
        ...candidate.match,
        candidateId: "candidate-2",
      },
      processingManifest: secondManifest,
      views: candidate.views.map((view) => ({
        ...view,
        imageUri: view.imageUri.replaceAll("candidate-1", "candidate-2"),
      })),
      renderEvidence: {
        ...candidate.renderEvidence,
        processingManifestId: "model-processing.candidate-2.v1",
      },
    });
    expect(() => createModelResolution({
      ...base,
      state: "searching-providers",
      candidates: [candidate, secondCandidate],
      bestCandidate: undefined,
    })).toThrow(/confirmationToken.*unique|token.*duplicate/i);
  });

  it("accepts one to four adaptive LOD levels and rejects non-monotonic or incomplete level sets", () => {
    const candidate = createCandidate();
    const baseManifest = {
      manifestId: "model-processing.candidate-1.v1",
      resolutionId: "resolution-1",
      candidateId: candidate.candidateId,
      kind: "leaf",
      contentHash: hash("4"),
      closureHash: hash("4"),
      technicalProfile: {
        ...technicalProfile,
        lodCount: 1,
        hasCollision: false,
      },
      lods: [
        {
          level: 0,
          resource: {
            uri: "mcp://models/resolutions/resolution-1/candidates/candidate-1/lod0.glb",
            byteLength: technicalProfile.byteLength,
            sha256: hash("4"),
            contentType: "model/gltf-binary",
          },
          triangleCount: 64_000,
          geometricErrorMetres: 0,
        },
      ],
      collision: { kind: "none" },
      collisionPolicy: {
        profileId: "static-world-collision",
        profileVersion: "1",
        disposition: "none-allowed",
        category: "non-collidable-decoration",
        decisionToken: "collision_none_token_0123456789abcdef",
      },
      children: [],
      converter: {
        id: "canonical-model-converter",
        version: "1.0.0",
        sourceFormat: "obj",
        targetFormat: "glb",
        sourceContentHash: hash("e"),
        outputContentHash: hash("4"),
        diagnostics: [],
        losses: [],
      },
      fidelityEvidence: [
        { aspect: "geometry", outcome: "preserved", message: "Geometry passed." },
        { aspect: "materials", outcome: "preserved", message: "Materials passed." },
        { aspect: "textures", outcome: "preserved", message: "Textures passed." },
      ],
      fidelityGate: {
        profileId: "static-world-fidelity",
        profileVersion: "1",
        outcome: "passed",
        requiredAspects: ["geometry", "materials", "textures"],
        evaluatedAt: "2026-07-12T12:10:00.000Z",
        decisionToken: "fidelity_gate_token_abcdef0123456789",
      },
      processedAt: "2026-07-12T12:10:00.000Z",
    };
    const oneLevelManifest = createModelProcessingManifest(baseManifest);
    expect(oneLevelManifest.lods).toHaveLength(1);
    expect(() => createModelProcessingManifest({
      ...baseManifest,
      collisionPolicy: undefined,
    })).toThrow(/collisionPolicy|object/i);
    expect(() => createModelProcessingManifest({
      ...baseManifest,
      collisionPolicy: { ...baseManifest.collisionPolicy, disposition: "proxy-required" },
    })).toThrow(/collision.*authorize|none/i);
    const collidableManifest = createModelProcessingManifest({
      ...baseManifest,
      technicalProfile: {
        ...baseManifest.technicalProfile,
        hasCollision: true,
      },
      collision: {
        kind: "box",
        resource: {
          uri: "mcp://models/resolutions/resolution-1/candidates/candidate-1/collision-box.glb",
          byteLength: 2048,
          sha256: hash("7"),
          contentType: "model/gltf-binary",
        },
      },
      collisionPolicy: {
        ...baseManifest.collisionPolicy,
        disposition: "proxy-required",
        category: "furniture",
      },
    });
    expect(collidableManifest.collision.kind).toBe("box");
    expect(() => createModelProcessingManifest({
      ...baseManifest,
      collision: { kind: "box" },
    })).toThrow(/collision.*require.*resource/i);
    expect(() =>
      createModelProcessingManifest({
        ...baseManifest,
        technicalProfile: { ...technicalProfile, lodCount: 2, hasCollision: false },
        lods: [
          baseManifest.lods[0],
          {
            ...baseManifest.lods[0],
            level: 2,
            triangleCount: 32_000,
          },
        ],
      })
    ).toThrow(/contiguous|LOD0/i);
    expect(() =>
      createModelProcessingManifest({
        ...baseManifest,
        technicalProfile: { ...technicalProfile, lodCount: 2, hasCollision: false },
        lods: [
          baseManifest.lods[0],
          {
            ...baseManifest.lods[0],
            level: 1,
            triangleCount: 80_000,
          },
        ],
      })
    ).toThrow(/triangle.*monotonic/i);
    expect(() =>
      createModelProcessingManifest({
        ...baseManifest,
        technicalProfile: { ...technicalProfile, lodCount: 2, hasCollision: false },
        lods: [
          { ...baseManifest.lods[0], geometricErrorMetres: 0.1 },
          {
            ...baseManifest.lods[0],
            level: 1,
            triangleCount: 32_000,
            geometricErrorMetres: 0.05,
          },
        ],
      })
    ).toThrow(/geometric.*(monotonic|zero)/i);
    expect(() =>
      createModelProcessingManifest({
        ...baseManifest,
        lods: [{ ...baseManifest.lods[0], geometricErrorMetres: Number.NaN }],
      })
    ).toThrow(/geometricErrorMetres|finite/i);
    expect(() =>
      createModelProcessingManifest({
        ...oneLevelManifest,
        lods: [
          ...oneLevelManifest.lods,
          ...[1, 2, 3, 4].map((level) => ({
            ...oneLevelManifest.lods[0],
            level,
            triangleCount: 32_000,
          })),
        ],
      })
    ).toThrow(/one to four/i);
    expect(() =>
      createModelProcessingManifest({
        ...oneLevelManifest,
        collision: {
          kind: "none",
          resource: oneLevelManifest.lods[0]?.resource,
        },
      })
    ).toThrow(/collision.*none|must not include/i);
    expect(() =>
      createModelProcessingManifest({
        ...oneLevelManifest,
        converter: {
          ...oneLevelManifest.converter,
          outputContentHash: hash("f"),
        },
      })
    ).toThrow(/outputContentHash.*contentHash/i);
    expect(() => createModelProcessingManifest({
      ...baseManifest,
      lods: [{
        ...baseManifest.lods[0]!,
        resource: { ...baseManifest.lods[0]!.resource, byteLength: 0 },
      }],
    })).toThrow(/byteLength|positive/i);
    expect(() => createModelProcessingManifest({
      ...baseManifest,
      lods: [{
        ...baseManifest.lods[0]!,
        resource: { ...baseManifest.lods[0]!.resource, contentType: "application/octet-stream" },
      }],
    })).toThrow(/gltf-binary|GLB|contentType/i);
    expect(() => createModelProcessingManifest({
      ...baseManifest,
      lods: [{
        ...baseManifest.lods[0]!,
        resource: { ...baseManifest.lods[0]!.resource, sha256: hash("f") },
      }],
    })).toThrow(/LOD0.*contentHash|sha256/i);
    expect(() => createModelProcessingManifest({
      ...baseManifest,
      lods: [{
        ...baseManifest.lods[0]!,
        resource: { ...baseManifest.lods[0]!.resource, byteLength: technicalProfile.byteLength - 1 },
      }],
    })).toThrow(/LOD0.*byteLength|technicalProfile/i);
    expect(() => createModelProcessingManifest({
      ...baseManifest,
      technicalProfile: { ...baseManifest.technicalProfile, lodCount: 2 },
      lods: [
        baseManifest.lods[0]!,
        {
          ...baseManifest.lods[0]!,
          level: 1,
          resource: {
            ...baseManifest.lods[0]!.resource,
            uri: "mcp://models/resolutions/resolution-1/candidates/candidate-1/lod1.glb",
            sha256: hash("5"),
          },
          triangleCount: 50_000,
          geometricErrorMetres: 0.01,
        },
      ],
    })).toThrow(/30%|reduction/i);
    expect(() => createModelProcessingManifest({
      ...baseManifest,
      technicalProfile: { ...baseManifest.technicalProfile, lodCount: 2 },
      lods: [
        baseManifest.lods[0]!,
        {
          ...baseManifest.lods[0]!,
          level: 1,
          resource: {
            ...baseManifest.lods[0]!.resource,
            uri: "mcp://models/resolutions/resolution-1/candidates/candidate-1/lod1.glb",
          },
          triangleCount: 32_000,
          geometricErrorMetres: 0.01,
        },
      ],
    })).toThrow(/LOD.*hash|sha256.*unique|resources.*unique/i);
    expect(() => createModelProcessingManifest({
      ...baseManifest,
      technicalProfile: { ...baseManifest.technicalProfile, lodCount: 2 },
      lods: [
        baseManifest.lods[0]!,
        {
          ...baseManifest.lods[0]!,
          level: 1,
          resource: {
            ...baseManifest.lods[0]!.resource,
            uri: "mcp://models/resolutions/resolution-1/candidates/candidate-1/lod1.glb",
            sha256: hash("5"),
          },
          triangleCount: 511,
          geometricErrorMetres: 0.01,
        },
      ],
    })).toThrow(/512|triangle/i);
    expect(() => createModelProcessingManifest({
      ...collidableManifest,
      collision: {
        kind: "box",
        resource: collidableManifest.lods[0]!.resource,
      },
    })).toThrow(/collision.*separate|distinct|unique/i);
    expect(() => createModelProcessingManifest({
      ...baseManifest,
      converter: { ...baseManifest.converter, targetFormat: "gltf" },
    })).toThrow(/targetFormat.*glb|GLB/i);
    expect(() =>
      createModelProcessingManifest({
        ...oneLevelManifest,
        fidelityEvidence: [
          {
            aspect: "geometry",
            outcome: "perfect",
            message: "Unsupported fidelity outcome.",
          },
        ],
      })
    ).toThrow(/outcome/i);
    expect(() => createModelProcessingManifest({
      ...baseManifest,
      fidelityEvidence: [
        { aspect: "geometry", outcome: "preserved", message: "Geometry passed." },
        { aspect: "geometry", outcome: "lost", message: "Geometry failed." },
      ],
    })).toThrow(/fidelity.*unique|aspect.*duplicate/i);
    expect(() =>
      createModelProcessingManifest({
        ...oneLevelManifest,
        coordinateSystem: {
          unit: "metre",
          upAxis: "Y",
          forwardAxis: "-Z",
          origin: "centre",
          outwardFaceWinding: "clockwise",
        },
      })
    ).toThrow(/floor-centred|counter-clockwise/i);
    expect(() =>
      createModelProcessingManifest({
        ...oneLevelManifest,
        technicalProfile: {
          ...oneLevelManifest.technicalProfile,
          boundsMetres: {
            min: [0, 0.01, -0.5],
            max: [2, 1.01, 0.5],
          },
        },
      })
    ).toThrow(/floor-centred|origin|bounds/i);
  });

  it("validates bounded, acyclic assembly hierarchy evidence with leaf child assets", () => {
    const manifest = createProcessingManifest();
    const staged = createModelProcessingManifest({
      ...manifest,
      children: [{
        ...manifest.children[0],
        assetRef: {
          disposition: "staged-derived",
          derivedId: "table-top-derived",
          kind: "leaf",
          contentHash: hash("c"),
          processingManifestUri: "mcp://models/resolutions/resolution-1/candidates/candidate-1/children/table-top-derived/manifest",
        },
      }],
    });
    expect(staged.children[0]?.assetRef).toMatchObject({ disposition: "staged-derived" });
    expect(() => createModelProcessingManifest({
      ...manifest,
      children: [{
        ...manifest.children[0],
        assetRef: {
          disposition: "staged-derived",
          derivedId: "table-top-derived",
          kind: "leaf",
          contentHash: hash("c"),
          processingManifestUri: "mcp://models/resolutions/other/candidates/candidate-1/children/table-top-derived/manifest",
        },
      }],
    })).toThrow(/staged child identity|processingManifestUri/i);
    const valid = createModelProcessingManifest({
      ...manifest,
      children: [
        manifest.children[0],
        {
          ...manifest.children[0],
          instanceId: "table-frame",
          parentInstanceId: "table-top",
        },
        {
          ...manifest.children[0],
          instanceId: "table-leg",
          parentInstanceId: "table-frame",
        },
      ],
    });
    expect(valid.children[2]!.parentInstanceId).toBe("table-frame");
    expect(() => createModelProcessingManifest({
      ...manifest,
      children: [{
        ...manifest.children[0],
        parentInstanceId: "missing-parent",
      }],
    })).toThrow(/parent.*exist|missing/i);
    expect(() => createModelProcessingManifest({
      ...manifest,
      children: [{
        ...manifest.children[0],
        parentInstanceId: "table-top",
      }],
    })).toThrow(/self|themselves|cycle/i);
    expect(() => createModelProcessingManifest({
      ...manifest,
      children: [
        { ...manifest.children[0], instanceId: "a", parentInstanceId: "b" },
        { ...manifest.children[0], instanceId: "b", parentInstanceId: "a" },
      ],
    })).toThrow(/cycle/i);
    const assemblyChild = createModelAssetRef({
      assetId: "nested-assembly",
      version: "1",
      kind: "assembly",
      contentHash: hash("6"),
      runtimeManifestUri: "mcp://models/catalog/nested-assembly/versions/1/manifest",
    });
    expect(() => createModelProcessingManifest({
      ...manifest,
      children: [{ ...manifest.children[0], assetRef: assemblyChild }],
    })).toThrow(/child.*leaf|assembly/i);
    const deepChildren = Array.from({ length: 18 }, (_, index) => ({
      ...manifest.children[0],
      instanceId: `node-${index}`,
      ...(index === 0 ? {} : { parentInstanceId: `node-${index - 1}` }),
    }));
    expect(() => createModelProcessingManifest({
      ...manifest,
      children: deepChildren,
    })).toThrow(/depth|hierarchy/i);
  });

  it("validates catalog, provider, and generated provenance without exposing download references", () => {
    const candidate = createCandidate();
    expect(() => createModelCandidate({
      ...candidate,
      rights: { ...candidate.rights, sourceAssetId: "different-source" },
    })).toThrow(/rights.*provenance|exact.*source/i);
    expect(() => createModelCandidate({
      ...candidate,
      provenance: { ...candidate.provenance, contentHash: hash("b") },
      rights: { ...candidate.rights, sourceContentHash: hash("b") },
    })).toThrow(/provenance.*converter|sourceContentHash/i);
    for (const provenance of [
      {
        kind: "catalog",
        sourceId: "plasius-catalog",
        sourceAssetId: "oak-table",
        contentHash: hash("e"),
        capturedAt: "2026-07-12T12:00:00.000Z",
      },
      candidate.provenance,
      {
        kind: "generated",
        sourceId: "future-model-generator",
        sourceAssetId: "generation-42",
        contentHash: hash("e"),
        capturedAt: "2026-07-12T12:00:00.000Z",
      },
    ]) {
      expect(
        createModelCandidate({
          ...candidate,
          provenance,
          rights: {
            ...candidate.rights,
            sourceId: provenance.sourceId,
            sourceAssetId: provenance.sourceAssetId,
            sourceContentHash: provenance.contentHash,
          },
        }).provenance.kind
      ).toBe(provenance.kind);
    }
    expect(() =>
      createModelCandidate({
        ...candidate,
        provenance: {
          ...candidate.provenance,
          kind: "generator",
        },
      })
    ).toThrow(/provenance/i);
    expect(() =>
      createModelCandidate({
        ...candidate,
        provenance: {
          ...candidate.provenance,
          downloadUri: "https://provider.example/download/model.glb",
        },
      })
    ).toThrow(/downloadUri|unexpected/i);
    expect(() =>
      createModelCandidate({
        ...candidate,
        provenance: {
          ...candidate.provenance,
          sourcePageUri: undefined,
        },
      })
    ).toThrow(/provider.*sourcePageUri/i);
    expect(() =>
      createModelCandidate({
        ...candidate,
        provenance: {
          ...candidate.provenance,
          kind: "generated",
        },
      })
    ).toThrow(/generated.*sourcePageUri/i);
  });

  it("publishes the exact resolution states", () => {
    expect(MODEL_RESOLUTION_STATES).toEqual([
      "searching-catalog",
      "searching-providers",
      "awaiting-provider-auth",
      "quarantining",
      "processing",
      "rendering",
      "evaluating",
      "awaiting-rights-review",
      "awaiting-confirmation",
      "promoting",
      "completed",
      "unresolved",
      "failed",
      "cancelled",
    ]);
    expect(isModelResolutionState("completed")).toBe(true);
    expect(isModelResolutionState("done")).toBe(false);
    expect(isModelResolutionState(null)).toBe(false);
  });

  it("keeps the Phase 1 generator port disabled and fails closed on malformed requests", async () => {
    const generator = createDisabledModelGeneratorPort();
    const generatorInput = {
      generationId: "generation-42",
      request: createRequest(),
      budgets: {
        maxDurationMs: 30_000,
        maxTriangles: 80_000,
        maxBytes: 40_000_000,
        maxTextureBytes: 16_000_000,
        maxTextureDimensionPx: 4096,
      },
      seed: "seed-0123456789",
      deadline: "2099-07-12T12:00:00.000Z",
    };
    const normalizedInput = createModelGeneratorRequest(generatorInput);
    expect(normalizedInput.generationId).toBe("generation-42");
    expect(() => createModelGeneratorRequest({
      ...generatorInput,
      budgets: {
        ...generatorInput.budgets,
        maxBytes: 1_000,
        maxTextureBytes: 1_001,
      },
    })).toThrow(/maxTextureBytes.*maxBytes|texture.*budget/i);
    const result = await generator.generate(generatorInput);

    expect(generator.enabled).toBe(false);
    expect(result).toEqual({
      status: "disabled",
      generationId: "generation-42",
      reasonCode: "phase-1-generator-disabled",
    });
    expect(createModelGeneratorResult(result, normalizedInput)).toEqual(result);

    const activeController = new AbortController();
    await expect(generator.generate(generatorInput, {
      signal: activeController.signal,
    })).resolves.toEqual(result);
    activeController.abort();
    await expect(generator.generate(generatorInput, {
      signal: activeController.signal,
    })).rejects.toThrow(/abort/i);
    await expect(generator.generate(generatorInput, {
      signal: {} as AbortSignal,
    })).rejects.toThrow(/AbortSignal/i);

    const generated = createModelGeneratorResult({
      status: "generated",
      generationId: "generation-42",
      sourceBundle: {
        bundleId: "generation-42",
        generationId: "generation-42",
        entrypointUri: "mcp://models/generations/generation-42/source/model.glb",
        artifacts: [
          {
            uri: "mcp://models/generations/generation-42/source/model.glb",
            byteLength: 12_000_000,
            sha256: hash("a"),
            contentType: "model/gltf-binary",
            role: "model-entrypoint",
            textureByteLength: 0,
            maxTextureDimensionPx: 0,
          },
          {
            uri: "mcp://models/generations/generation-42/source/materials.json",
            byteLength: 2048,
            sha256: hash("b"),
            contentType: "application/json",
            role: "metadata",
            textureByteLength: 0,
            maxTextureDimensionPx: 0,
          },
        ],
        generator: {
          id: "future-model-generator",
          version: "2.0.0",
        },
        generatedAt: "2026-07-12T12:00:00.000Z",
        seed: "seed-0123456789",
        context: normalizedInput,
        usage: {
          durationMs: 2_000,
          triangleCount: 64_000,
          byteLength: 12_002_048,
          textureByteLength: 0,
          maxTextureDimensionPx: 0,
        },
      },
    }, normalizedInput);
    expect(generated.status).toBe("generated");
    if (generated.status !== "generated") {
      throw new Error("Expected the generated result variant.");
    }
    expect(generated.sourceBundle.artifacts).toHaveLength(2);
    expect(Object.isFrozen(generated.sourceBundle.artifacts)).toBe(true);
    const embeddedTextureResult = createModelGeneratorResult({
      ...generated,
      sourceBundle: {
        ...generated.sourceBundle,
        artifacts: generated.sourceBundle.artifacts.map((artifact, index) => index === 0
          ? { ...artifact, textureByteLength: 4_000_000, maxTextureDimensionPx: 4096 }
          : artifact),
        usage: {
          ...generated.sourceBundle.usage,
          textureByteLength: 4_000_000,
          maxTextureDimensionPx: 4096,
        },
      },
    }, normalizedInput);
    expect(embeddedTextureResult.status).toBe("generated");
    if (embeddedTextureResult.status !== "generated") {
      throw new Error("Expected embedded texture generated result.");
    }
    expect(() => createModelGeneratorResult({
      ...embeddedTextureResult,
      sourceBundle: {
        ...embeddedTextureResult.sourceBundle,
        usage: {
          ...embeddedTextureResult.sourceBundle.usage,
          textureByteLength: 0,
          maxTextureDimensionPx: 0,
        },
      },
    }, normalizedInput)).toThrow(/textureByteLength|texture.*bytes/i);
    expect(() => createModelGeneratorResult({
      status: "generated",
      generationId: "generation-42",
      sourceBundle: {
        ...generated.sourceBundle,
        artifacts: [],
      },
    }, normalizedInput)).toThrow(/artifact/i);
    expect(() => createModelGeneratorResult({
      status: "generated",
      generationId: "generation-42",
      sourceBundle: {
        ...generated.sourceBundle,
        artifacts: [{
          ...generated.sourceBundle.artifacts[0],
          uri: "https://generator.example/model.glb",
        }],
      },
    }, normalizedInput)).toThrow(/mcp:\/\/models/i);
    expect(() => createModelGeneratorResult({
      ...generated,
      generationId: "generation-43",
    }, normalizedInput)).toThrow(/generationId|request/i);
    expect(() => createModelGeneratorResult({
      ...generated,
      sourceBundle: {
        ...generated.sourceBundle,
        seed: "different-seed-012345",
      },
    }, normalizedInput)).toThrow(/seed|request/i);
    expect(() => createModelGeneratorResult({
      ...generated,
      sourceBundle: {
        ...generated.sourceBundle,
        context: {
          ...generated.sourceBundle.context,
          request: {
            ...generated.sourceBundle.context.request,
            query: "a different model request",
          },
        },
      },
    }, normalizedInput)).toThrow(/context|request/i);
    expect(() => createModelGeneratorResult({
      ...generated,
      sourceBundle: {
        ...generated.sourceBundle,
        entrypointUri: generated.sourceBundle.artifacts[1]!.uri,
      },
    }, normalizedInput)).toThrow(/entrypoint|role/i);
    expect(() => createModelGeneratorResult({
      ...generated,
      sourceBundle: {
        ...generated.sourceBundle,
        artifacts: generated.sourceBundle.artifacts.map((artifact, index) => ({
          ...artifact,
          uri: index === 0
            ? "mcp://models/generations/other-generation/source/model.glb"
            : artifact.uri,
        })),
      },
    }, normalizedInput)).toThrow(/generation.*namespace|scope/i);
    expect(() => createModelGeneratorResult({
      ...generated,
      sourceBundle: {
        ...generated.sourceBundle,
        usage: { ...generated.sourceBundle.usage, byteLength: 12_002_047 },
      },
    }, normalizedInput)).toThrow(/aggregate|byteLength|usage/i);
    expect(() => createModelGeneratorResult({
      ...generated,
      sourceBundle: {
        ...generated.sourceBundle,
        usage: { ...generated.sourceBundle.usage, triangleCount: 80_001 },
      },
    }, normalizedInput)).toThrow(/maxTriangles|budget/i);
    expect(() => createModelGeneratorResult({
      ...generated,
      sourceBundle: {
        ...generated.sourceBundle,
        generatedAt: "2100-07-12T12:00:00.000Z",
      },
    }, normalizedInput)).toThrow(/deadline/i);
    expect(() => createModelGeneratorResult({
      ...generated,
      sourceBundle: {
        ...generated.sourceBundle,
        artifacts: generated.sourceBundle.artifacts.map((artifact) => ({
          ...artifact,
          role: "executable",
        })),
      },
    }, normalizedInput)).toThrow(/role/i);
    expect(() => createModelGeneratorResult({
      status: "disabled",
      generationId: "generation-42",
      reasonCode: "temporarily-disabled",
    }, normalizedInput)).toThrow(/phase-1-generator-disabled|reasonCode/i);

    for (const outcome of [
      {
        status: "unavailable",
        generationId: "generation-42",
        reasonCode: "capacity-unavailable",
        retryable: true,
        occurredAt: "2026-07-12T12:00:00.000Z",
      },
      {
        status: "failed",
        generationId: "generation-42",
        reasonCode: "invalid-generator-output",
        retryable: false,
        occurredAt: "2026-07-12T12:00:00.000Z",
        diagnosticId: "diagnostic-42",
      },
      {
        status: "cancelled",
        generationId: "generation-42",
        reasonCode: "caller-aborted",
        retryable: false,
        occurredAt: "2026-07-12T12:00:00.000Z",
      },
      {
        status: "budget-exceeded",
        generationId: "generation-42",
        reasonCode: "generator-budget-exceeded",
        retryable: false,
        occurredAt: "2026-07-12T12:00:00.000Z",
        violations: [{
          budget: "maxBytes",
          limit: normalizedInput.budgets.maxBytes,
          observed: normalizedInput.budgets.maxBytes + 1,
        }],
      },
    ]) {
      expect(createModelGeneratorResult(outcome, normalizedInput).status).toBe(outcome.status);
    }
    expect(() => createModelGeneratorResult({
      status: "unavailable",
      generationId: "generation-42",
      reasonCode: "capacity-unavailable",
      retryable: false,
      occurredAt: "2026-07-12T12:00:00.000Z",
    }, normalizedInput)).toThrow(/retryable|reason/i);
    expect(() => createModelGeneratorResult({
      status: "budget-exceeded",
      generationId: "generation-42",
      reasonCode: "generator-budget-exceeded",
      retryable: false,
      occurredAt: "2026-07-12T12:00:00.000Z",
      violations: [{
        budget: "maxBytes",
        limit: normalizedInput.budgets.maxBytes - 1,
        observed: normalizedInput.budgets.maxBytes + 1,
      }],
    }, normalizedInput)).toThrow(/limit|budget/i);
    await expect(
      generator.generate({
        generationId: "generation-invalid-budget",
        request: createRequest(),
        budgets: {
          maxDurationMs: 0,
          maxTriangles: 80_000,
          maxBytes: 40_000_000,
          maxTextureBytes: 16_000_000,
          maxTextureDimensionPx: 4096,
        },
        seed: "seed-0123456789",
        deadline: "not-a-date",
      })
    ).rejects.toThrow(/budget|duration|deadline/i);
  });
});
