import { createHash } from "node:crypto";
import { createGpuModelDocument, createGpuModelResourceGraph } from "@plasius/gpu-model-core";
import { createAssetManifest, type AssetFileRole } from "../../src/index.js";
import { canonicalResourcePackage } from "./canonical-resource-package.js";

const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
/** Independently verified source image, authored texture interpretation and separate derivatives. */
export async function textureResourcePackage() {
  const canonical = await canonicalResourcePackage();
  const image = canonical.document.resources.find((r) => r.id === "source-image")!;
  const texture = { id: "authored-albedo", fileName: "source.png", relativePath: "textures/source.png", mimeType: image.mimeType,
    contentHash: image.contentHash, imageResourceId: image.id, byteLength: image.byteLength,
    intendedUsage: ["base-color" as const], colorSpace: "srgb" as const, exportEmbeddingPolicy: "prefer-external" as const,
    sampler: { id: "authored-sampler", wrapS: "repeat" as const, wrapT: "clamp-to-edge" as const, minFilter: "linear", magFilter: "linear" },
    sourceMetadata: { fixture: "authored-source" } };
  const material = { id: "paint", workflow: "metallic-roughness" as const, alphaMode: "opaque" as const,
    baseColorFactor: [1, 1, 1, 1] as const,
    textures: { baseColor: { textureId: texture.id, samplerId: texture.sampler.id, colorSpace: "srgb" as const,
      intendedUsage: "base-color" as const, texCoordSet: 0, transform: { offset: [0.25, 0.5] as const, scale: [2, 2] as const, rotationRadians: 0.5 } } },
    extensions: {}, sourceMetadata: { fixture: "original-material" } };
  const gltf = JSON.parse(new TextDecoder().decode(canonical.files[0]!.bytes));
  gltf.bufferViews[0].byteStride = 12;
  gltf.accessors.push({ bufferView: 0, componentType: 5126, count: 3, type: "VEC2" });
  gltf.meshes[0].primitives[0].attributes.TEXCOORD_0 = 1;
  canonical.files[0] = { ...canonical.files[0]!, bytes: new TextEncoder().encode(JSON.stringify(gltf)) };
  const document = createGpuModelDocument({ ...canonical.document,
    provenance: { ...canonical.document.provenance, sourceContentHash: hash(canonical.files[0]!.bytes) },
    accessors: [...canonical.document.accessors, { id: "uv", resourceId: "derived-positions", byteOffset: 0, byteStride: 12, count: 3, componentType: "f32", elementType: "vec2" }], textures: [texture], materials: [material],
    meshes: canonical.document.meshes.map((m) => ({ ...m, primitives: m.primitives.map((p) => ({ ...p, materialId: material.id, attributes: [...p.attributes, { semantic: "TEXCOORD_0", accessorId: "uv" }] })) })) });
  const graphInput = { resources: [
    { resourceId: "derived-positions", location: { kind: "embedded" }, exportEmbeddingPolicy: "inherit-source" },
    { resourceId: image.id, location: { kind: "external", relativePath: "textures/source.png" }, exportEmbeddingPolicy: "prefer-external" },
  ], packages: [] };
  const graph = createGpuModelResourceGraph(document, graphInput);
  const files = [...canonical.files,
    { path: "materials/paint.json", bytes: new TextEncoder().encode(JSON.stringify(material)), contentType: "application/json" },
    { path: "derived/upload.bin", bytes: new Uint8Array([10, 20, 30, 40]), contentType: "application/octet-stream" },
    { path: "derived/atlas.png", bytes: new Uint8Array([...canonical.image, 0]), contentType: "image/png" },
  ];
  const roles: AssetFileRole[] = ["model", "texture", "metadata", "binary", "texture"];
  const manifest = createAssetManifest({ assetId: "texture-fixture", version: "1.0.0", entrypoint: "model.gltf",
    createdAt: "2026-10-24T00:00:00.000Z", sourceAdapter: "local-import",
    files: files.map((f, i) => ({ path: f.path, byteLength: f.bytes.byteLength, sha256: hash(f.bytes), contentType: f.contentType, role: roles[i]! })) });
  const packageManifest = { format: "directory-manifest" as const, entries: files.map((f, i) => ({
    id: `entry-${i}`, path: f.path, contentType: f.contentType,
    role: (["mesh", "texture", "material", "auxiliary", "texture"] as const)[i]!,
  })) };
  const resources = [{ resourceId: "derived-positions", filePath: "model.gltf" }, { resourceId: image.id, filePath: "textures/source.png" }];
  const derived = [{ role: "gpu-upload" as const, filePath: "derived/upload.bin", sourceResourceIds: [image.id] },
    { role: "texture-atlas" as const, filePath: "derived/atlas.png", sourceResourceIds: [image.id] }];
  return { input: { manifest, packageManifest, files, graph, resources, derived }, document, graphInput, canonical };
}
