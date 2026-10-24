import { canonicalizeGpuContract, type Sha256Hex } from "@plasius/gpu-shader";
import { createHash } from "node:crypto";
import { MODEL_RESOLUTION_CONTRACT_VERSION, MODEL_CANDIDATE_HARD_GATE_KINDS, MODEL_CONFIRMATION_VIEW_KINDS, createModelAssetManifest, createModelCandidate, createModelCandidateConfirmation,
  createModelRequestSpec, type ModelResourcePromotionInput } from "../../src/index.js";
import { textureResourcePackage } from "./texture-resource-package.js";
const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const at = "2026-10-24T00:00:00.000Z";
/** Real glTF source and GLB JSON container with independently verified external image. */
export async function promotionResourcePackage(version = "1.0.0") {
  const { input: output, document, graphInput } = await textureResourcePackage();
  const sourceFiles = output.files.slice(0, 2);
  const source = { manifest: { ...output.manifest, assetId: "source-model", files: output.manifest.files.slice(0, 2) },
    packageManifest: { ...output.packageManifest, entries: output.packageManifest.entries.slice(0, 2) }, files: sourceFiles };
  const material = output.files[2]!;
  output.files[2] = { ...material, bytes: new TextEncoder().encode(canonicalizeGpuContract(JSON.parse(new TextDecoder().decode(material.bytes)))) };
  output.manifest = { ...output.manifest, files: output.manifest.files.map((f, i) => i === 2 ? { ...f, byteLength: output.files[2]!.bytes.length, sha256: hash(output.files[2]!.bytes) } : f) };
  const json = sourceFiles[0]!.bytes;
  const padded = Math.ceil(json.byteLength / 4) * 4;
  const bytes = new Uint8Array(20 + padded); bytes.fill(32, 20);
  const view = new DataView(bytes.buffer); view.setUint32(0, 0x46546c67, true); view.setUint32(4, 2, true); view.setUint32(8, bytes.length, true);
  view.setUint32(12, padded, true); view.setUint32(16, 0x4e4f534a, true); bytes.set(json, 20);
  output.files[0] = { path: "model.glb", bytes, contentType: "model/gltf-binary" };
  output.packageManifest.entries[0] = { ...output.packageManifest.entries[0]!, path: "model.glb", contentType: "model/gltf-binary" };
  output.resources[0] = { ...output.resources[0]!, filePath: "model.glb" };
  const gpuInterface = { interfaceId: "fixture-interface", interfaceVersion: "1.0.0", manifestUri: "https://assets.example.invalid/interfaces/1.0.0/manifest.json",
    manifestSha256: "1".repeat(64) as Sha256Hex, interfaceAbiHash: "2".repeat(64) as Sha256Hex, modelAbiHash: "3".repeat(64) as Sha256Hex };
  const manifest = createModelAssetManifest({ ...output.manifest, assetKind: "model", version, entrypoint: "model.glb", gpuInterface,
    modelAbiHash: gpuInterface.modelAbiHash, providedSemantics: [], defaultStyleProfile: null,
    files: output.manifest.files.map((f, i) => i === 0 ? { ...f, path: "model.glb", byteLength: bytes.length, sha256: hash(bytes), contentType: "model/gltf-binary" } : f) });
  const contentHash = hash(bytes); const sourceHash = hash(json);
  const provenance = { kind: "catalog" as const, sourceId: "fixture", sourceAssetId: "source-model", contentHash: sourceHash, capturedAt: at };
  const resource = { uri: "mcp://models/resolutions/r1/candidates/c1/model.glb", sha256: contentHash, byteLength: bytes.length, contentType: "model/gltf-binary" };
  const profile = { boundsMetres: { min: [-0.5, 0, -0.5], max: [0.5, 1, 0.5] }, dimensionsMetres: { width: 1, height: 1, depth: 1 },
    triangleCount: 1, byteLength: bytes.length, textureByteLength: sourceFiles[1]!.bytes.length, maxTextureDimensionPx: 1,
    lodCount: 1, hasCollision: false, partitionCount: 1, partitionCellMetres: 1 };
  const request = createModelRequestSpec({ query: "synthetic triangle", revision: 0, locale: "en-gb", rankerId: "fixture-ranker",
    hardConstraints: { boundsMetres: profile.boundsMetres, dimensionsMetres: profile.dimensionsMetres, maxTriangles: 10, maxBytes: 100000,
      maxTextureBytes: 10000, maxTextureDimensionPx: 100, maxPartitionCellMetres: 2, lod: "optional", collision: "optional", partition: "allowed" },
    softPreferences: {}, exclusions: [] });
  const converter = { id: "fixture", version: "1.0.0", sourceFormat: "gltf", targetFormat: "glb", sourceContentHash: sourceHash,
    outputContentHash: contentHash, diagnostics: [], losses: [] };
  const views = MODEL_CONFIRMATION_VIEW_KINDS.map((kind, i) => ({ kind, imageUri: `mcp://models/resolutions/r1/candidates/c1/${kind}.png`,
    sha256: String(i + 1).repeat(64), contentType: "image/png", width: 1024, height: 1024 }));
  const candidate = createModelCandidate({ resolutionId: "r1", candidateId: "c1", assetRef: { disposition: "proposed", proposalId: "p1", kind: "leaf", contentHash },
    match: { score: 0.91, hardConstraintPass: true, reasonCodes: [], ranker: { id: "fixture-ranker", version: "1.0.0", calibrationId: "fixture", calibrationVersion: "1", evidenceMode: "multimodal", assuranceCeiling: "high" },
      exactMatch: false, fidelityWarnings: [], request, candidateId: "c1", candidateContentHash: contentHash },
    provenance, rights: { decisionId: "rights1", decisionToken: "rights_token_0123456789abcdef0123456789abcdef", policyId: "fixture", policyVersion: "1", sourceId: "fixture", sourceAssetId: "source-model",
      sourceContentHash: sourceHash, status: "allowed", licenseId: "CC0-1.0", evidencePageUri: "https://assets.example.invalid/license", reviewedAt: at },
    technicalProfile: profile, processingManifest: { manifestId: "processing1", resolutionId: "r1", candidateId: "c1", kind: "leaf", contentHash, closureHash: contentHash,
      technicalProfile: profile, lods: [{ level: 0, resource, triangleCount: 1, geometricErrorMetres: 0 }], collision: { kind: "none" },
      collisionPolicy: { profileId: "fixture", profileVersion: "1", disposition: "none-allowed", category: "fixture", decisionToken: "collision_token_0123456789abcdef0123456789abcdef" },
      children: [], converter, fidelityEvidence: ["geometry", "materials", "textures"].map((aspect) => ({ aspect, outcome: "preserved", message: "Synthetic fixture retained." })),
      fidelityGate: { profileId: "fixture", profileVersion: "1", outcome: "passed", requiredAspects: ["geometry", "materials", "textures"], evaluatedAt: at, decisionToken: "fidelity_token_0123456789abcdef0123456789abcdef" }, processedAt: at },
    views, renderEvidence: { renderId: "render1", rendererId: "fixture", rendererVersion: "1", settingsId: "fixture", settingsVersion: "1", processingManifestId: "processing1",
      sourceContentHash: contentHash, viewSha256s: views.map((v) => v.sha256), renderedAt: at, attestationToken: "render_token_0123456789abcdef0123456789abcdef" },
    hardGates: MODEL_CANDIDATE_HARD_GATE_KINDS.map((kind, i) => ({ kind, outcome: "passed", validatorId: "fixture", validatorVersion: "1", subjectContentHash: kind === "malware-scan" ? sourceHash : contentHash,
      reasonCodes: [], evaluatedAt: at, attestationToken: `gate_${i}_token_0123456789abcdef0123456789abcdef` })), confirmationToken: "confirmation_token_0123456789abcdef0123456789abcdef" });
  const confirmation = createModelCandidateConfirmation({ contractVersion: MODEL_RESOLUTION_CONTRACT_VERSION, confirmationId: "confirm1", resolutionId: "r1", candidateId: "c1", confirmationToken: candidate.confirmationToken,
    viewSha256s: views.map((v) => v.sha256), confirmedBy: "fixture-reviewer", confirmedAt: at, semanticRiskAccepted: false }, candidate, candidate.resolutionId);
  const promotion = { promotionId: `promote-${version}`, jobId: "job1", assetId: manifest.assetId, version, sourceAdapter: manifest.sourceAdapter, outcome: "promoted" as const,
    manifest, reviewReport: { assetId: manifest.assetId, version, passed: true, findings: [], reviewedAt: at }, approvedBy: "fixture-reviewer", approvedAt: at, promotedAt: at,
    runtimeChannel: "fixture", runtimeManifestUri: `https://assets.example.invalid/models/${manifest.assetId}/${version}/model.glb` };
  const input = { promotion, source, output: { ...output, manifest }, diagnostics: { outcome: "completed" as const, source: provenance, report: { standard: "gltf-glb" as const, issues: [] }, resources: [] },
    resourceBindings: [{ resource, package: "output" as const, filePath: "model.glb" }], candidate, confirmation } satisfies ModelResourcePromotionInput;
  return { input, bytes, document, graphInput };
}
