import { createHash } from "node:crypto";
import {
  CANONICAL_GPU_MODEL_COORDINATE_SYSTEM, GPU_MODEL_DOCUMENT_SCHEMA_VERSION,
  createAndVerifyGpuModelDocument, createGpuModelResourceGraph,
  type GpuModelResourceVerificationPort, type ResourcePackageManifest,
} from "@plasius/gpu-model-core";

const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
async function collect(chunks: AsyncIterable<Uint8Array>) {
  const parts: Uint8Array[] = [];
  for await (const part of chunks) parts.push(part);
  return Buffer.concat(parts);
}

/** Synthetic triangle: authored PNG stays external; derived positions stay embedded. */
export async function canonicalResourcePackage() {
  const positions = new Uint8Array(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]).buffer);
  const image = new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=", "base64"));
  const gltf = {
    asset: { version: "2.0" }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
    buffers: [{ uri: `data:application/octet-stream;base64,${Buffer.from(positions).toString("base64")}`, byteLength: positions.byteLength }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: positions.byteLength }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
    images: [{ uri: "textures/source.png" }], textures: [{ source: 0 }],
    materials: [{ pbrMetallicRoughness: { baseColorTexture: { index: 0 } } }],
  };
  const entrypoint = new TextEncoder().encode(JSON.stringify(gltf));
  const port: GpuModelResourceVerificationPort = {
    async digestSha256(chunks) { return hash(await collect(chunks)); },
    async inspectResource(chunks, context) {
      const bytes = await collect(chunks);
      return context.kind === "image"
        ? { valid: bytes.equals(Buffer.from(image)), detectedMimeType: "image/png", width: 1, height: 1 }
        : { valid: bytes.equals(Buffer.from(positions)), detectedMimeType: "application/octet-stream" };
    },
  };
  const document = await createAndVerifyGpuModelDocument({
    schemaVersion: GPU_MODEL_DOCUMENT_SCHEMA_VERSION, coordinateSystem: CANONICAL_GPU_MODEL_COORDINATE_SYSTEM,
    roots: ["triangle"], nodes: [{ id: "triangle", children: [], meshId: "mesh", localMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] }],
    resources: [
      { id: "derived-positions", kind: "buffer", contentHash: hash(positions), byteLength: positions.byteLength, mimeType: "application/octet-stream", payload: new Blob([positions]) },
      { id: "source-image", kind: "image", contentHash: hash(image), byteLength: image.byteLength, mimeType: "image/png", payload: new Blob([image]) },
    ],
    accessors: [{ id: "positions", resourceId: "derived-positions", byteOffset: 0, count: 3, componentType: "f32", elementType: "vec3", min: [0, 0, 0], max: [1, 1, 0] }],
    meshes: [{ id: "mesh", primitives: [{ id: "primitive", topology: "triangles", attributes: [{ semantic: "POSITION", accessorId: "positions" }] }] }],
    materials: [], textures: [], skeletons: [], joints: [], skins: [], blendShapes: [], animations: [], analyticGeometry: [],
    bounds: { min: [0, 0, 0], max: [1, 1, 0] },
    provenance: { sourceFormat: "gltf", sourceContentHash: hash(entrypoint), converterId: "fixture", converterVersion: "1.0.0" },
    diagnostics: [], metadata: {},
  }, port);
  const graph = createGpuModelResourceGraph(document, { resources: [
    { resourceId: "derived-positions", location: { kind: "embedded" }, exportEmbeddingPolicy: "inherit-source" },
    { resourceId: "source-image", location: { kind: "external", relativePath: "textures/source.png" }, exportEmbeddingPolicy: "prefer-external" },
  ], packages: [] });
  const files = [
    { path: "model.gltf", bytes: entrypoint, contentType: "model/gltf+json" },
    { path: "textures/source.png", bytes: image, contentType: "image/png" },
  ];
  const packageManifest: ResourcePackageManifest = { format: "directory-manifest", entries: [
    { id: "model", path: "model.gltf", role: "mesh", contentType: "model/gltf+json" },
    { id: "image", path: "textures/source.png", role: "texture", contentType: "image/png" },
  ] };
  return { document, graph, files, packageManifest, positions, image };
}
