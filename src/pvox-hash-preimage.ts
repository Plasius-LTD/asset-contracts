import { canonicalizeGpuContract } from "@plasius/gpu-shader";
import {
  PVOX_ASSEMBLY_CLOSURE_HASH_DOMAIN,
  PVOX_BINARY_CLOSURE_HASH_DOMAIN,
  PVOX_BRICK_EDGE_VOXELS,
  PVOX_CAPABILITIES,
  PVOX_CAPABILITY_SET_HASH_DOMAIN,
  PVOX_CONFIRMATION_BINDING_HASH_DOMAIN,
  PVOX_DIRECTORY_ENTRY_BYTE_LENGTH,
  PVOX_DIRECTORY_HASH_DOMAIN,
  PVOX_DEFAULT_LIMITS,
  PVOX_EDIT_JOURNAL_GENESIS_HASH,
  PVOX_EDIT_JOURNAL_HASH_DOMAIN,
  PVOX_MAX_ABSOLUTE_COORDINATE_METRES,
  PVOX_MAX_EDIT_PATCHES,
  PVOX_EDIT_OVERLAY_ROOT_HASH_DOMAIN,
  PVOX_EVALUATION_CLOSURE_HASH_DOMAIN,
  PVOX_FORMAT_VERSION,
  PVOX_HEADER_BYTE_LENGTH,
  PVOX_MAGIC,
  PVOX_MAX_SECTIONS,
  PVOX_PAGE_SET_HASH_DOMAIN,
  PVOX_PAGE_SIZE_BYTES,
  PVOX_PHYSICAL_EVIDENCE_HASH_DOMAIN,
  PVOX_PHYSICAL_INVENTORY_HASH_DOMAIN,
  PVOX_PHYSICAL_PROPERTIES,
  PVOX_PROCESSING_CLOSURE_HASH_DOMAIN,
  PVOX_PUBLICATION_HASH_DOMAIN,
  PVOX_RENDER_EVIDENCE_HASH_DOMAIN,
  PVOX_REQUEST_SEMANTIC_PROFILE_HASH_DOMAIN,
  PVOX_ROOT_HASH_DOMAIN,
  PVOX_RUNTIME_REQUEST_PROFILE_HASH_DOMAIN,
  PVOX_SECTION_ALIGNMENT_BYTES,
  PVOX_SECTION_HASH_DOMAIN,
} from "./pvox-model-resolution.js";

export const PVOX_SHA256_BYTE_LENGTH = 32 as const;
export const PVOX_SHA256_HEX_LENGTH = PVOX_SHA256_BYTE_LENGTH * 2;
export const PVOX_CANONICAL_UTF8_LENGTH_PREFIX_BYTES = 4 as const;
export const PVOX_ROOT_HEADER_DIRECTORY_HASH_OFFSET = 176 as const;
export const PVOX_ROOT_HEADER_COMPILATION_INPUT_HASH_OFFSET = 112 as const;
export const PVOX_ROOT_HEADER_RUNTIME_REQUEST_PROFILE_HASH_OFFSET = 144 as const;
export const PVOX_ROOT_HEADER_TRAILING_RESERVED_OFFSET = 208 as const;
export const PVOX_ROOT_HEADER_TRAILING_RESERVED_BYTE_LENGTH = 48 as const;
export const PVOX_ROOT_HEADER_INLINE_RESERVED_OFFSET = 58 as const;
export const PVOX_ROOT_HEADER_INLINE_RESERVED_BYTE_LENGTH = 2 as const;
export const PVOX_ROOT_HEADER_COORDINATE_BASIS_METRES_Y_UP_NEGATIVE_Z_FORWARD_CCW = 1 as const;
export const PVOX_ROOT_HEADER_FLAGS_V1 = 0 as const;
export const PVOX_ROOT_HEADER_MAXIMUM_HIERARCHY_DEPTH_V1 = 8 as const;
export const PVOX_ROOT_HEADER_MINIMUM_FIXED_POINT_FRACTION_BITS_V1 = 0 as const;
export const PVOX_ROOT_HEADER_MAXIMUM_FIXED_POINT_FRACTION_BITS_V1 = 32 as const;
/** Upper bound for one canonical JSON/text component in a governed PVOX hash preimage. */
export const PVOX_MAX_CANONICAL_HASH_UTF8_BYTES_V1 = PVOX_DEFAULT_LIMITS.maximumArtifactBytes;
/** Upper bound for a complete encoded hash preimage, including its domain and framing. */
export const PVOX_MAX_HASH_PREIMAGE_BYTES_V1 = PVOX_DEFAULT_LIMITS.maximumArtifactBytes + PVOX_PAGE_SIZE_BYTES;

const U16_MAXIMUM = 0xffff;
const U32_MAXIMUM = 0xffff_ffff;
const U64_MAXIMUM = 0xffff_ffff_ffff_ffffn;
const I64_MINIMUM = -0x8000_0000_0000_0000n;
const I64_MAXIMUM = 0x7fff_ffff_ffff_ffffn;
const PVOX_ROOT_HEADER_BOUND_COMPONENT_COUNT = 6 as const;
const PVOX_ROOT_HEADER_MAGIC_OFFSET = 0 as const;
const PVOX_ROOT_HEADER_FORMAT_MAJOR_OFFSET = 4 as const;
const PVOX_ROOT_HEADER_FORMAT_MINOR_OFFSET = 6 as const;
const PVOX_ROOT_HEADER_BYTE_LENGTH_OFFSET = 8 as const;
const PVOX_ROOT_HEADER_DIRECTORY_ENTRY_BYTE_LENGTH_OFFSET = 10 as const;
const PVOX_ROOT_HEADER_SECTION_COUNT_OFFSET = 12 as const;
const PVOX_ROOT_HEADER_FLAGS_OFFSET = 14 as const;
const PVOX_ROOT_HEADER_ARTIFACT_BYTE_LENGTH_OFFSET = 16 as const;
const PVOX_ROOT_HEADER_DIRECTORY_BYTE_OFFSET_OFFSET = 24 as const;
const PVOX_ROOT_HEADER_DIRECTORY_BYTE_LENGTH_OFFSET = 32 as const;
const PVOX_ROOT_HEADER_PAGE_SIZE_OFFSET = 40 as const;
const PVOX_ROOT_HEADER_PAGE_COUNT_OFFSET = 44 as const;
const PVOX_ROOT_HEADER_BRICK_EDGE_OFFSET = 48 as const;
const PVOX_ROOT_HEADER_MAXIMUM_HIERARCHY_DEPTH_OFFSET = 50 as const;
const PVOX_ROOT_HEADER_GEOMETRY_MODE_OFFSET = 51 as const;
const PVOX_ROOT_HEADER_COORDINATE_BASIS_OFFSET = 52 as const;
const PVOX_ROOT_HEADER_FIXED_POINT_FRACTION_BITS_OFFSET = 56 as const;
const PVOX_ROOT_HEADER_BOUNDS_OFFSET = 60 as const;
const PVOX_ROOT_HEADER_BOUND_COMPONENT_BYTE_LENGTH = 8 as const;
const PVOX_ROOT_HEADER_DIRECTORY_START_PAGE_OFFSET = 108 as const;
const PVOX_MAX_HASH_PREIMAGE_DATA_NODES_V1 = PVOX_DEFAULT_LIMITS.maximumHierarchyNodes;

const TEXT_ENCODER = new TextEncoder();
const PVOX_MAGIC_BYTES = TEXT_ENCODER.encode(PVOX_MAGIC);

function assertPvoxPreimageDataOnly(
  value: unknown,
  fieldName: string,
  seen = new WeakSet<object>(),
  depth = 0,
  state = { nodes: 0 },
): void {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "bigint") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${fieldName} must contain finite data values only.`);
    return;
  }
  if (typeof value !== "object") throw new Error(`${fieldName} must contain JSON/fixed-width data values only.`);
  state.nodes += 1;
  if (depth > 64 || state.nodes > PVOX_MAX_HASH_PREIMAGE_DATA_NODES_V1 || seen.has(value)) throw new Error(`${fieldName} must be an acyclic bounded data tree.`);
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      state.nodes += value.length;
      if (state.nodes > PVOX_MAX_HASH_PREIMAGE_DATA_NODES_V1) throw new Error(`${fieldName} must be an acyclic bounded data tree.`);
      const descriptors = Object.getOwnPropertyDescriptors(value);
      const keys = Reflect.ownKeys(descriptors);
      if (keys.some((key) => typeof key === "symbol" || (key !== "length" && !/^(0|[1-9][0-9]*)$/u.test(key)))) throw new Error(`${fieldName} arrays must contain indexed data properties only.`);
      for (let index = 0; index < value.length; index += 1) {
        const descriptor = descriptors[String(index)];
        if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) throw new Error(`${fieldName} arrays must be dense enumerable data properties.`);
        assertPvoxPreimageDataOnly(descriptor.value, `${fieldName}[${index}]`, seen, depth + 1, state);
      }
      return;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new Error(`${fieldName} objects must have a plain or null prototype.`);
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key === "symbol") throw new Error(`${fieldName} objects must contain string-keyed data properties only.`);
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) throw new Error(`${fieldName} objects must contain enumerable data properties only.`);
      assertPvoxPreimageDataOnly(descriptor.value, `${fieldName}.${key}`, seen, depth + 1, state);
    }
  } finally {
    seen.delete(value);
  }
}

function assertExactPvoxPreimageKeys(value: object, expectedKeys: readonly string[], fieldName: string): void {
  const actualKeys = Object.keys(value);
  if (actualKeys.length !== expectedKeys.length || expectedKeys.some((key) => !Object.hasOwn(value, key))) {
    throw new Error(`${fieldName} must contain exactly: ${expectedKeys.join(", ")}.`);
  }
}

function preflightPvoxFixedObject(value: unknown, expectedKeys: readonly string[], fieldName: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${fieldName} must be an object.`);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new Error(`${fieldName} must have a plain or null prototype.`);
  assertExactPvoxPreimageKeys(value, expectedKeys, fieldName);
  for (const key of expectedKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) throw new Error(`${fieldName}.${key} must be an enumerable data property.`);
  }
  return value as Record<string, unknown>;
}

function getPreflightPvoxDataProperty(value: Record<string, unknown>, key: string): unknown {
  return (Object.getOwnPropertyDescriptor(value, key) as PropertyDescriptor & { value: unknown }).value;
}

function preflightPvoxArrayCardinality(value: unknown, minimum: number, maximum: number, fieldName: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${fieldName} must be an array.`);
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
  if (!lengthDescriptor || !("value" in lengthDescriptor) || typeof lengthDescriptor.value !== "number" || !Number.isSafeInteger(lengthDescriptor.value)
    || lengthDescriptor.value < minimum || lengthDescriptor.value > maximum) {
    throw new Error(`${fieldName} must contain from ${minimum} through ${maximum} entries.`);
  }
  return value;
}

function copyPvoxByteInput(value: unknown, fieldName: string, maximumByteLength: number): Uint8Array {
  if (!(value instanceof Uint8Array)) throw new Error(`${fieldName} must be a Uint8Array.`);
  let byteLength: number;
  try {
    const typedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype) as object;
    const byteLengthGetter = Object.getOwnPropertyDescriptor(typedArrayPrototype, "byteLength")?.get;
    const bufferGetter = Object.getOwnPropertyDescriptor(typedArrayPrototype, "buffer")?.get;
    if (byteLengthGetter === undefined || bufferGetter === undefined) throw new Error("Typed-array intrinsics are unavailable.");
    byteLength = byteLengthGetter.call(value) as number;
    const buffer = bufferGetter.call(value) as ArrayBufferLike;
    if (typeof SharedArrayBuffer !== "undefined" && buffer instanceof SharedArrayBuffer) {
      throw new Error(`${fieldName} must not use shared mutable storage.`);
    }
  } catch (error) {
    if (error instanceof Error && /shared mutable storage/u.test(error.message)) throw error;
    throw new Error(`${fieldName} must be an intrinsic Uint8Array.`, { cause: error });
  }
  if (byteLength > maximumByteLength) throw new Error(`${fieldName} exceeds the governed PVOX byte limit.`);
  const output = new Uint8Array(byteLength);
  for (let index = 0; index < byteLength; index += 1) output[index] = value[index]!;
  return output;
}

export const PVOX_ROOT_HEADER_GEOMETRY_MODE_CODES_V1 = Object.freeze({
  solid: 1,
  shell: 2,
  mixed: 3,
} as const);

export type PvoxRootHeaderGeometryModeV1 = keyof typeof PVOX_ROOT_HEADER_GEOMETRY_MODE_CODES_V1;

/** Closed byte layout. Root and binary-closure digests are deliberately external to this header. */
export const PVOX_ROOT_HEADER_LAYOUT_V1 = Object.freeze({
  magic: Object.freeze({ offset: PVOX_ROOT_HEADER_MAGIC_OFFSET, byteLength: PVOX_MAGIC_BYTES.byteLength }),
  formatMajor: Object.freeze({ offset: PVOX_ROOT_HEADER_FORMAT_MAJOR_OFFSET, byteLength: 2 }),
  formatMinor: Object.freeze({ offset: PVOX_ROOT_HEADER_FORMAT_MINOR_OFFSET, byteLength: 2 }),
  headerByteLength: Object.freeze({ offset: PVOX_ROOT_HEADER_BYTE_LENGTH_OFFSET, byteLength: 2 }),
  directoryEntryByteLength: Object.freeze({ offset: PVOX_ROOT_HEADER_DIRECTORY_ENTRY_BYTE_LENGTH_OFFSET, byteLength: 2 }),
  sectionCount: Object.freeze({ offset: PVOX_ROOT_HEADER_SECTION_COUNT_OFFSET, byteLength: 2 }),
  flags: Object.freeze({ offset: PVOX_ROOT_HEADER_FLAGS_OFFSET, byteLength: 2 }),
  artifactByteLength: Object.freeze({ offset: PVOX_ROOT_HEADER_ARTIFACT_BYTE_LENGTH_OFFSET, byteLength: 8 }),
  directoryByteOffset: Object.freeze({ offset: PVOX_ROOT_HEADER_DIRECTORY_BYTE_OFFSET_OFFSET, byteLength: 8 }),
  directoryByteLength: Object.freeze({ offset: PVOX_ROOT_HEADER_DIRECTORY_BYTE_LENGTH_OFFSET, byteLength: 8 }),
  pageSizeBytes: Object.freeze({ offset: PVOX_ROOT_HEADER_PAGE_SIZE_OFFSET, byteLength: 4 }),
  pageCount: Object.freeze({ offset: PVOX_ROOT_HEADER_PAGE_COUNT_OFFSET, byteLength: 4 }),
  brickEdgeVoxels: Object.freeze({ offset: PVOX_ROOT_HEADER_BRICK_EDGE_OFFSET, byteLength: 2 }),
  maximumHierarchyDepth: Object.freeze({ offset: PVOX_ROOT_HEADER_MAXIMUM_HIERARCHY_DEPTH_OFFSET, byteLength: 1 }),
  geometryMode: Object.freeze({ offset: PVOX_ROOT_HEADER_GEOMETRY_MODE_OFFSET, byteLength: 1 }),
  coordinateBasis: Object.freeze({ offset: PVOX_ROOT_HEADER_COORDINATE_BASIS_OFFSET, byteLength: 4 }),
  fixedPointFractionBits: Object.freeze({ offset: PVOX_ROOT_HEADER_FIXED_POINT_FRACTION_BITS_OFFSET, byteLength: 2 }),
  inlineReserved: Object.freeze({ offset: PVOX_ROOT_HEADER_INLINE_RESERVED_OFFSET, byteLength: PVOX_ROOT_HEADER_INLINE_RESERVED_BYTE_LENGTH }),
  quantizedBounds: Object.freeze({ offset: PVOX_ROOT_HEADER_BOUNDS_OFFSET, byteLength: PVOX_ROOT_HEADER_BOUND_COMPONENT_COUNT * PVOX_ROOT_HEADER_BOUND_COMPONENT_BYTE_LENGTH }),
  directoryStartPage: Object.freeze({ offset: PVOX_ROOT_HEADER_DIRECTORY_START_PAGE_OFFSET, byteLength: 4 }),
  compilationInputHash: Object.freeze({ offset: PVOX_ROOT_HEADER_COMPILATION_INPUT_HASH_OFFSET, byteLength: PVOX_SHA256_BYTE_LENGTH }),
  runtimeRequestProfileHash: Object.freeze({ offset: PVOX_ROOT_HEADER_RUNTIME_REQUEST_PROFILE_HASH_OFFSET, byteLength: PVOX_SHA256_BYTE_LENGTH }),
  directoryHash: Object.freeze({ offset: PVOX_ROOT_HEADER_DIRECTORY_HASH_OFFSET, byteLength: PVOX_SHA256_BYTE_LENGTH }),
  trailingReserved: Object.freeze({ offset: PVOX_ROOT_HEADER_TRAILING_RESERVED_OFFSET, byteLength: PVOX_ROOT_HEADER_TRAILING_RESERVED_BYTE_LENGTH }),
  rootHash: Object.freeze({ storage: "external" }),
  binaryClosureHash: Object.freeze({ storage: "external" }),
} as const);

export interface PvoxRootHeaderInputV1 {
  readonly sectionCount: number;
  readonly artifactByteLength: number | bigint;
  readonly directoryByteOffset: number | bigint;
  readonly directoryByteLength: number | bigint;
  readonly pageCount: number;
  readonly maximumHierarchyDepth: number;
  readonly geometryMode: PvoxRootHeaderGeometryModeV1;
  readonly fixedPointFractionBits: number;
  /** minX, minY, minZ, maxX, maxY, maxZ in the declared fixed-point scale. */
  readonly quantizedBounds: readonly [bigint, bigint, bigint, bigint, bigint, bigint];
  readonly directoryStartPage: number;
  readonly compilationInputHash: string;
  readonly runtimeRequestProfileHash: string;
  readonly directoryHash: string;
}

export interface PvoxRootSectionHashRecordV1 {
  readonly sectionType: number;
  readonly sectionVersion: number;
  readonly sectionHash: string;
}

export interface PvoxPageHashRecordV1 {
  readonly pageIndex: number;
  readonly byteOffset: number | bigint;
  readonly byteLength: number;
  readonly pageSha256: string;
}

export interface PvoxBinaryClosureHashInputV1 {
  readonly sourceContentHash: string;
  readonly canonicalDocumentHash: string;
  readonly compilationInputHash: string;
  readonly runtimeRequestProfileHash: string;
  readonly artifactSha256: string;
  readonly rootHash: string;
  readonly directoryHash: string;
  readonly pageSetHash: string;
}

export interface PvoxPhysicalInventoryHashRecordV1 {
  readonly regionIndex: number;
  readonly physicalPaletteIndex: number;
  readonly regionId: string;
  readonly materialId: string;
}

export interface PvoxPhysicalInventoryHashInputV1 {
  readonly inventoryVersion: string;
  readonly subjectBinaryClosureHash: string;
  readonly validationEvidenceHash: string;
  readonly entries: readonly PvoxPhysicalInventoryHashRecordV1[];
}

export interface PvoxEvaluationClosureHashInputV1 {
  readonly fidelityEvidenceHash: string;
  readonly physicalEvidenceHash: string;
  readonly capabilitySetHash: string;
  readonly renderEvidenceHash: string;
}

export interface PvoxPhysicalEvidenceRegionMaterialV1 {
  readonly regionId: string;
  readonly materialId: string;
}

/** `orderedRegionMaterials` is validation context derived from the attested inventory and is not encoded twice. */
export interface PvoxPhysicalEvidenceHashInputV1 {
  readonly physicalInventoryHash: string;
  readonly orderedRegionMaterials: readonly PvoxPhysicalEvidenceRegionMaterialV1[];
  readonly orderedCanonicalEvidence: readonly unknown[];
}

export interface PvoxProcessingClosureHashInputV1 {
  readonly binaryClosureHash: string;
  readonly requestSemanticProfileHash: string;
  readonly technicalProfile: unknown;
  readonly pvoxValidationEvidenceHash: string;
  readonly physicalInventoryValidationEvidenceHash: string;
  readonly capabilitySetHash: string;
  readonly physicalInventoryHash: string;
  readonly physicalEvidenceHash: string;
  readonly massPropertiesEvidenceHash: string;
  readonly bondGraphEvidenceHash: string;
  readonly interiorLayerEvidenceHash: string;
  readonly compilerEvidenceHash: string;
  readonly fidelityEvidenceHash: string;
}

export interface PvoxAssemblyClosureHashInputV1 {
  readonly ownBinaryClosureHash: string;
  readonly orderedChildren: readonly unknown[];
}

export interface PvoxEditOverlayRootHashInputV1 {
  readonly baseContentHash: string;
  readonly basePageSetHash: string;
  readonly placementId: string;
  readonly gridVersion: string;
  readonly expectedRevision: number | bigint;
  readonly resultingRevision: number | bigint;
  readonly previousJournalHash: string;
  readonly expectedRootHash: string;
  readonly orderedPatches: readonly PvoxEditOverlayPatchHashInputV1[];
}

export interface PvoxEditOverlayPatchHashInputV1 {
  readonly fieldKind: "render-field" | "collision-field";
  readonly lodLevel: number;
  readonly partitionIndex: number;
  readonly hierarchyDepth: number;
  readonly mortonCode: string;
  readonly expectedPageIndex: number;
  readonly expectedPageHash: string;
  readonly operation: "insert" | "replace" | "remove";
  readonly expectedBrickHash: string;
  readonly resultingBrickHash: string;
  readonly resultingPageHash: string;
}

export const PVOX_NAMED_JSON_CLOSURE_SPECS_V1 = Object.freeze({
  "request-semantic-profile": Object.freeze({
    domain: PVOX_REQUEST_SEMANTIC_PROFILE_HASH_DOMAIN,
    omittedJsonPointers: Object.freeze(["/requestSemanticProfileHash"] as const),
  }),
  "runtime-request-profile": Object.freeze({
    domain: PVOX_RUNTIME_REQUEST_PROFILE_HASH_DOMAIN,
    omittedJsonPointers: Object.freeze(["/runtimeRequestProfileHash"] as const),
  }),
  "render-evidence": Object.freeze({
    domain: PVOX_RENDER_EVIDENCE_HASH_DOMAIN,
    omittedJsonPointers: Object.freeze(["/evidenceHash", "/evidenceHashAttestation"] as const),
  }),
  "confirmation-binding": Object.freeze({
    domain: PVOX_CONFIRMATION_BINDING_HASH_DOMAIN,
    omittedJsonPointers: Object.freeze(["/bindingHash", "/bindingHashAttestation"] as const),
  }),
  "edit-journal": Object.freeze({
    domain: PVOX_EDIT_JOURNAL_HASH_DOMAIN,
    omittedJsonPointers: Object.freeze(["/journalHash", "/journalHashAttestation", "/resultingRootHashAttestation"] as const),
  }),
  "publication-receipt": Object.freeze({
    domain: PVOX_PUBLICATION_HASH_DOMAIN,
    omittedJsonPointers: Object.freeze(["/publicationHash", "/publicationHashAttestation", "/publicationToken"] as const),
  }),
} as const);

export type PvoxNamedJsonClosureV1 = keyof typeof PVOX_NAMED_JSON_CLOSURE_SPECS_V1;

function assertSafeIntegerInRange(value: number, minimum: number, maximum: number, fieldName: string): number {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${fieldName} must be a safe integer from ${minimum} through ${maximum}.`);
  }
  return value;
}

function asUnsignedBigInt(value: number | bigint, fieldName: string): bigint {
  const result = typeof value === "bigint"
    ? value
    : BigInt(assertSafeIntegerInRange(value, 0, Number.MAX_SAFE_INTEGER, fieldName));
  if (result < 0n || result > U64_MAXIMUM) throw new Error(`${fieldName} must fit an unsigned 64-bit integer.`);
  return result;
}

function assertSignedBigInt(value: bigint, fieldName: string): bigint {
  if (value < I64_MINIMUM || value > I64_MAXIMUM) throw new Error(`${fieldName} must fit a signed 64-bit integer.`);
  return value;
}

function maximumQuantizedCoordinate(fractionBits: number): bigint {
  return BigInt(PVOX_MAX_ABSOLUTE_COORDINATE_METRES) * (1n << BigInt(fractionBits));
}

function assertQuantizedCoordinate(value: bigint, fractionBits: number, fieldName: string): bigint {
  const coordinate = assertSignedBigInt(value, fieldName);
  const absolute = coordinate < 0n ? -coordinate : coordinate;
  if (absolute > maximumQuantizedCoordinate(fractionBits)) throw new Error(`${fieldName} exceeds the governed absolute PVOX coordinate limit.`);
  return coordinate;
}

function concatenateBytes(parts: readonly Uint8Array[]): Uint8Array {
  const byteLength = parts.reduce((total, part) => total + part.byteLength, 0);
  if (!Number.isSafeInteger(byteLength) || byteLength > PVOX_MAX_HASH_PREIMAGE_BYTES_V1) {
    throw new Error("PVOX hash preimage exceeds the governed byte limit.");
  }
  const output = new Uint8Array(byteLength);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

function writeBytes(target: Uint8Array, offset: number, value: Uint8Array): void {
  target.set(value, offset);
}

function isZeroRange(value: Uint8Array, offset: number, byteLength: number): boolean {
  for (let index = offset; index < offset + byteLength; index += 1) {
    if (value[index] !== 0) return false;
  }
  return true;
}

function readAscii(value: Uint8Array, offset: number, byteLength: number): string {
  return String.fromCharCode(...value.slice(offset, offset + byteLength));
}

export function encodePvoxU16LeV1(value: number): Uint8Array {
  const output = new Uint8Array(2);
  new DataView(output.buffer).setUint16(0, assertSafeIntegerInRange(value, 0, U16_MAXIMUM, "u16"), true);
  return output;
}

export function encodePvoxU32LeV1(value: number): Uint8Array {
  const output = new Uint8Array(4);
  new DataView(output.buffer).setUint32(0, assertSafeIntegerInRange(value, 0, U32_MAXIMUM, "u32"), true);
  return output;
}

export function encodePvoxU64LeV1(value: number | bigint): Uint8Array {
  const output = new Uint8Array(8);
  new DataView(output.buffer).setBigUint64(0, asUnsignedBigInt(value, "u64"), true);
  return output;
}

export function encodePvoxI64LeV1(value: bigint): Uint8Array {
  const output = new Uint8Array(8);
  new DataView(output.buffer).setBigInt64(0, assertSignedBigInt(value, "i64"), true);
  return output;
}

export function decodePvoxSha256HexV1(value: string, fieldName = "sha256"): Uint8Array {
  if (!new RegExp(`^[0-9a-f]{${PVOX_SHA256_HEX_LENGTH}}$`, "u").test(value)) {
    throw new Error(`${fieldName} must be a canonical lowercase SHA-256 digest.`);
  }
  const output = new Uint8Array(PVOX_SHA256_BYTE_LENGTH);
  for (let index = 0; index < output.byteLength; index += 1) {
    output[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return output;
}

function encodeCanonicalRawUtf8(value: string): Uint8Array {
  if (!value.isWellFormed()) throw new Error("Canonical UTF-8 values cannot contain unpaired UTF-16 surrogates.");
  let byteLength = 0;
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit <= 0x7f) byteLength += 1;
    else if (codeUnit <= 0x7ff) byteLength += 2;
    else if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      byteLength += 4;
      index += 1;
    } else byteLength += 3;
    if (byteLength > PVOX_MAX_CANONICAL_HASH_UTF8_BYTES_V1) {
      throw new Error("Canonical UTF-8 value exceeds the governed PVOX hash-input byte limit.");
    }
  }
  const encoded = TEXT_ENCODER.encode(value);
  if (encoded.byteLength !== byteLength) throw new Error("Canonical UTF-8 byte-length calculation failed.");
  return encoded;
}

export function encodePvoxCanonicalUtf8V1(value: string): Uint8Array {
  const utf8 = encodeCanonicalRawUtf8(value);
  if (utf8.byteLength > U32_MAXIMUM) throw new Error("Canonical UTF-8 value exceeds the unsigned 32-bit length prefix.");
  return concatenateBytes([encodePvoxU32LeV1(utf8.byteLength), utf8]);
}

export function encodePvoxSectionHashPreimageV1(
  sectionType: number,
  sectionVersion: number,
  exactSectionBytes: Uint8Array,
): Uint8Array {
  const sectionBytes = copyPvoxByteInput(exactSectionBytes, "exactSectionBytes", PVOX_DEFAULT_LIMITS.maximumArtifactBytes);
  return concatenateBytes([
    TEXT_ENCODER.encode(PVOX_SECTION_HASH_DOMAIN),
    encodePvoxU32LeV1(sectionType),
    encodePvoxU16LeV1(sectionVersion),
    encodePvoxU64LeV1(sectionBytes.byteLength),
    sectionBytes,
  ]);
}

export function encodePvoxDirectoryHashPreimageV1(
  entryCount: number,
  exactOrderedDirectoryBytes: Uint8Array,
): Uint8Array {
  const count = assertSafeIntegerInRange(entryCount, 1, PVOX_MAX_SECTIONS, "entryCount");
  const directoryBytes = copyPvoxByteInput(
    exactOrderedDirectoryBytes,
    "exactOrderedDirectoryBytes",
    PVOX_MAX_SECTIONS * PVOX_DIRECTORY_ENTRY_BYTE_LENGTH,
  );
  if (directoryBytes.byteLength !== count * PVOX_DIRECTORY_ENTRY_BYTE_LENGTH) {
    throw new Error("Directory bytes must contain exactly entryCount fixed-width entries.");
  }
  return concatenateBytes([
    TEXT_ENCODER.encode(PVOX_DIRECTORY_HASH_DOMAIN),
    encodePvoxU16LeV1(count),
    encodePvoxU16LeV1(PVOX_DIRECTORY_ENTRY_BYTE_LENGTH),
    directoryBytes,
  ]);
}

export function encodePvoxPageSetHashPreimageV1(records: readonly PvoxPageHashRecordV1[]): Uint8Array {
  preflightPvoxArrayCardinality(records, 1, PVOX_DEFAULT_LIMITS.maximumPages, "PVOX page-set hash input");
  assertPvoxPreimageDataOnly(records, "PVOX page-set hash input");
  let previousEnd = 0n;
  const encoded = records.map((record, position) => {
    assertExactPvoxPreimageKeys(record, ["pageIndex", "byteOffset", "byteLength", "pageSha256"], `records[${position}]`);
    if (record.pageIndex !== position) throw new Error("Page-set records must have contiguous page indexes starting at zero.");
    const offset = asUnsignedBigInt(record.byteOffset, `records[${position}].byteOffset`);
    const byteLength = assertSafeIntegerInRange(record.byteLength, PVOX_PAGE_SIZE_BYTES, PVOX_PAGE_SIZE_BYTES, `records[${position}].byteLength`);
    if (offset !== previousEnd || offset !== BigInt(position) * BigInt(PVOX_PAGE_SIZE_BYTES)) throw new Error("Page-set records must exactly cover contiguous 64-KiB PVOX pages.");
    previousEnd = offset + BigInt(byteLength);
    return concatenateBytes([
      encodePvoxU32LeV1(record.pageIndex),
      encodePvoxU64LeV1(offset),
      encodePvoxU32LeV1(byteLength),
      decodePvoxSha256HexV1(record.pageSha256, `records[${position}].pageSha256`),
    ]);
  });
  return concatenateBytes([
    TEXT_ENCODER.encode(PVOX_PAGE_SET_HASH_DOMAIN),
    encodePvoxU32LeV1(records.length),
    ...encoded,
  ]);
}

function normalizeJsonData(value: unknown): unknown {
  return cloneProjectedData(value, "", new Set<string>(), new WeakSet<object>());
}

function encodeCanonicalJsonRecord(value: unknown): Uint8Array {
  return encodePvoxCanonicalUtf8V1(canonicalizeGpuContract(normalizeJsonData(value)));
}

function encodeCanonicalJsonRecords(values: readonly unknown[]): readonly Uint8Array[] {
  const normalized = normalizeJsonData(values);
  if (!Array.isArray(normalized)) throw new Error("Canonical JSON record input must be an array.");
  const encoded: Uint8Array[] = [];
  let aggregateByteLength = 0;
  for (const value of normalized) {
    const record = encodeCanonicalJsonRecord(value);
    aggregateByteLength += record.byteLength;
    if (aggregateByteLength > PVOX_MAX_CANONICAL_HASH_UTF8_BYTES_V1) {
      throw new Error("Canonical JSON records exceed the governed PVOX hash-input byte limit.");
    }
    encoded.push(record);
  }
  return encoded;
}

export function encodePvoxBinaryClosureHashPreimageV1(input: PvoxBinaryClosureHashInputV1): Uint8Array {
  assertPvoxPreimageDataOnly(input, "PVOX binary-closure hash input");
  assertExactPvoxPreimageKeys(input, [
    "sourceContentHash", "canonicalDocumentHash", "compilationInputHash", "runtimeRequestProfileHash",
    "artifactSha256", "rootHash", "directoryHash", "pageSetHash",
  ], "PVOX binary-closure hash input");
  return concatenateBytes([
    TEXT_ENCODER.encode(PVOX_BINARY_CLOSURE_HASH_DOMAIN),
    decodePvoxSha256HexV1(input.sourceContentHash, "sourceContentHash"),
    decodePvoxSha256HexV1(input.canonicalDocumentHash, "canonicalDocumentHash"),
    decodePvoxSha256HexV1(input.compilationInputHash, "compilationInputHash"),
    decodePvoxSha256HexV1(input.runtimeRequestProfileHash, "runtimeRequestProfileHash"),
    decodePvoxSha256HexV1(input.artifactSha256, "artifactSha256"),
    decodePvoxSha256HexV1(input.rootHash, "rootHash"),
    decodePvoxSha256HexV1(input.directoryHash, "directoryHash"),
    decodePvoxSha256HexV1(input.pageSetHash, "pageSetHash"),
  ]);
}

export function encodePvoxCapabilitySetHashPreimageV1(
  subjectBinaryClosureHash: string,
  orderedCanonicalAssessments: readonly unknown[],
): Uint8Array {
  preflightPvoxArrayCardinality(
    orderedCanonicalAssessments,
    PVOX_CAPABILITIES.length,
    PVOX_CAPABILITIES.length,
    "Capability hash input",
  );
  const assessments = normalizeJsonData(orderedCanonicalAssessments);
  if (!Array.isArray(assessments) || assessments.length !== PVOX_CAPABILITIES.length) {
    throw new Error("Capability hash input must contain every governed capability in canonical order.");
  }
  assessments.forEach((assessment, index) => {
    if (assessment === null || typeof assessment !== "object" || Array.isArray(assessment)
      || (assessment as Record<string, unknown>).capability !== PVOX_CAPABILITIES[index]) {
      throw new Error("Capability hash input must contain every governed capability in canonical order.");
    }
  });
  const encoded = encodeCanonicalJsonRecords(assessments);
  return concatenateBytes([
    TEXT_ENCODER.encode(PVOX_CAPABILITY_SET_HASH_DOMAIN),
    decodePvoxSha256HexV1(subjectBinaryClosureHash, "subjectBinaryClosureHash"),
    encodePvoxU32LeV1(encoded.length),
    ...encoded,
  ]);
}

export function encodePvoxPhysicalInventoryHashPreimageV1(input: PvoxPhysicalInventoryHashInputV1): Uint8Array {
  const shallowInput = preflightPvoxFixedObject(
    input,
    ["inventoryVersion", "subjectBinaryClosureHash", "validationEvidenceHash", "entries"],
    "PVOX physical-inventory hash input",
  );
  preflightPvoxArrayCardinality(
    getPreflightPvoxDataProperty(shallowInput, "entries"),
    1,
    PVOX_DEFAULT_LIMITS.maximumMaterialRegions,
    "PVOX physical-inventory hash input.entries",
  );
  assertPvoxPreimageDataOnly(input, "PVOX physical-inventory hash input");
  assertExactPvoxPreimageKeys(input, ["inventoryVersion", "subjectBinaryClosureHash", "validationEvidenceHash", "entries"], "PVOX physical-inventory hash input");
  if (input.entries.length < 1 || input.entries.length > PVOX_DEFAULT_LIMITS.maximumMaterialRegions) throw new Error("Physical inventory must fit the governed material-region limit.");
  const encoded = input.entries.map((record, index) => {
    assertExactPvoxPreimageKeys(record, ["regionIndex", "physicalPaletteIndex", "regionId", "materialId"], `entries[${index}]`);
    const regionIndex = assertSafeIntegerInRange(record.regionIndex, 0, U32_MAXIMUM, `entries[${index}].regionIndex`);
    if (regionIndex !== index) throw new Error("Physical inventory records must have contiguous canonical region indexes starting at zero.");
    return concatenateBytes([
      encodePvoxU32LeV1(regionIndex),
      encodePvoxU32LeV1(record.physicalPaletteIndex),
      encodePvoxCanonicalUtf8V1(record.regionId),
      encodePvoxCanonicalUtf8V1(record.materialId),
    ]);
  });
  return concatenateBytes([
    TEXT_ENCODER.encode(PVOX_PHYSICAL_INVENTORY_HASH_DOMAIN),
    encodePvoxCanonicalUtf8V1(input.inventoryVersion),
    decodePvoxSha256HexV1(input.subjectBinaryClosureHash, "subjectBinaryClosureHash"),
    decodePvoxSha256HexV1(input.validationEvidenceHash, "validationEvidenceHash"),
    encodePvoxU32LeV1(input.entries.length),
    ...encoded,
  ]);
}

export function encodePvoxPhysicalEvidenceHashPreimageV1(input: PvoxPhysicalEvidenceHashInputV1): Uint8Array {
  const shallowInput = preflightPvoxFixedObject(
    input,
    ["physicalInventoryHash", "orderedRegionMaterials", "orderedCanonicalEvidence"],
    "PVOX physical-evidence hash input",
  );
  preflightPvoxArrayCardinality(
    getPreflightPvoxDataProperty(shallowInput, "orderedRegionMaterials"),
    1,
    PVOX_DEFAULT_LIMITS.maximumMaterialRegions,
    "PVOX physical-evidence hash input.orderedRegionMaterials",
  );
  preflightPvoxArrayCardinality(
    getPreflightPvoxDataProperty(shallowInput, "orderedCanonicalEvidence"),
    0,
    PVOX_DEFAULT_LIMITS.maximumPhysicalEvidenceEntries,
    "PVOX physical-evidence hash input.orderedCanonicalEvidence",
  );
  assertPvoxPreimageDataOnly(input, "PVOX physical-evidence hash input");
  assertExactPvoxPreimageKeys(input, ["physicalInventoryHash", "orderedRegionMaterials", "orderedCanonicalEvidence"], "PVOX physical-evidence hash input");
  if (input.orderedRegionMaterials.length < 1 || input.orderedRegionMaterials.length > PVOX_DEFAULT_LIMITS.maximumMaterialRegions) {
    throw new Error("Physical evidence region/material validation context must fit the governed material-region limit.");
  }
  const regionOrder = new Map<string, number>();
  input.orderedRegionMaterials.forEach((regionMaterial, index) => {
    assertExactPvoxPreimageKeys(regionMaterial, ["regionId", "materialId"], `orderedRegionMaterials[${index}]`);
    const { regionId, materialId } = regionMaterial;
    const key = `${regionId}\u0000${materialId}`;
    if (regionOrder.has(key)) throw new Error("Physical evidence region/material validation context must be unique and canonical.");
    regionOrder.set(key, index);
  });
  const normalizedEvidence = normalizeJsonData(input.orderedCanonicalEvidence);
  if (!Array.isArray(normalizedEvidence) || normalizedEvidence.length > PVOX_DEFAULT_LIMITS.maximumPhysicalEvidenceEntries) throw new Error("Physical evidence must be a bounded canonical array.");
  let previousOrder = -1;
  for (const [index, evidence] of normalizedEvidence.entries()) {
    if (evidence === null || typeof evidence !== "object" || Array.isArray(evidence)) throw new Error(`Physical evidence[${index}] must be an object.`);
    const record = evidence as Record<string, unknown>;
    if (typeof record.regionId !== "string" || typeof record.materialId !== "string" || typeof record.property !== "string") {
      throw new Error(`Physical evidence[${index}] must declare regionId, materialId, and property.`);
    }
    const regionIndex = regionOrder.get(`${record.regionId}\u0000${record.materialId}`);
    const propertyIndex = (PVOX_PHYSICAL_PROPERTIES as readonly string[]).indexOf(record.property);
    if (regionIndex === undefined || propertyIndex < 0) throw new Error(`Physical evidence[${index}] is absent from the governed inventory/property registry.`);
    const order = regionIndex * PVOX_PHYSICAL_PROPERTIES.length + propertyIndex;
    if (order <= previousOrder) throw new Error("Physical evidence must use canonical inventory-region and governed-property order.");
    previousOrder = order;
  }
  const encoded = encodeCanonicalJsonRecords(normalizedEvidence);
  return concatenateBytes([
    TEXT_ENCODER.encode(PVOX_PHYSICAL_EVIDENCE_HASH_DOMAIN),
    decodePvoxSha256HexV1(input.physicalInventoryHash, "physicalInventoryHash"),
    encodePvoxU32LeV1(encoded.length),
    ...encoded,
  ]);
}

export function encodePvoxEvaluationClosureHashPreimageV1(input: PvoxEvaluationClosureHashInputV1): Uint8Array {
  assertPvoxPreimageDataOnly(input, "PVOX evaluation-closure hash input");
  assertExactPvoxPreimageKeys(input, ["fidelityEvidenceHash", "physicalEvidenceHash", "capabilitySetHash", "renderEvidenceHash"], "PVOX evaluation-closure hash input");
  return concatenateBytes([
    TEXT_ENCODER.encode(PVOX_EVALUATION_CLOSURE_HASH_DOMAIN),
    decodePvoxSha256HexV1(input.fidelityEvidenceHash, "fidelityEvidenceHash"),
    decodePvoxSha256HexV1(input.physicalEvidenceHash, "physicalEvidenceHash"),
    decodePvoxSha256HexV1(input.capabilitySetHash, "capabilitySetHash"),
    decodePvoxSha256HexV1(input.renderEvidenceHash, "renderEvidenceHash"),
  ]);
}

export function encodePvoxProcessingClosureHashPreimageV1(input: PvoxProcessingClosureHashInputV1): Uint8Array {
  assertPvoxPreimageDataOnly(input, "PVOX processing-closure hash input");
  assertExactPvoxPreimageKeys(input, [
    "binaryClosureHash", "requestSemanticProfileHash", "technicalProfile", "pvoxValidationEvidenceHash",
    "physicalInventoryValidationEvidenceHash", "capabilitySetHash", "physicalInventoryHash",
    "physicalEvidenceHash", "massPropertiesEvidenceHash", "bondGraphEvidenceHash",
    "interiorLayerEvidenceHash", "compilerEvidenceHash", "fidelityEvidenceHash",
  ], "PVOX processing-closure hash input");
  return concatenateBytes([
    TEXT_ENCODER.encode(PVOX_PROCESSING_CLOSURE_HASH_DOMAIN),
    decodePvoxSha256HexV1(input.binaryClosureHash, "binaryClosureHash"),
    decodePvoxSha256HexV1(input.requestSemanticProfileHash, "requestSemanticProfileHash"),
    encodeCanonicalJsonRecord(input.technicalProfile),
    decodePvoxSha256HexV1(input.pvoxValidationEvidenceHash, "pvoxValidationEvidenceHash"),
    decodePvoxSha256HexV1(input.physicalInventoryValidationEvidenceHash, "physicalInventoryValidationEvidenceHash"),
    decodePvoxSha256HexV1(input.capabilitySetHash, "capabilitySetHash"),
    decodePvoxSha256HexV1(input.physicalInventoryHash, "physicalInventoryHash"),
    decodePvoxSha256HexV1(input.physicalEvidenceHash, "physicalEvidenceHash"),
    decodePvoxSha256HexV1(input.massPropertiesEvidenceHash, "massPropertiesEvidenceHash"),
    decodePvoxSha256HexV1(input.bondGraphEvidenceHash, "bondGraphEvidenceHash"),
    decodePvoxSha256HexV1(input.interiorLayerEvidenceHash, "interiorLayerEvidenceHash"),
    decodePvoxSha256HexV1(input.compilerEvidenceHash, "compilerEvidenceHash"),
    decodePvoxSha256HexV1(input.fidelityEvidenceHash, "fidelityEvidenceHash"),
  ]);
}

export function encodePvoxAssemblyClosureHashPreimageV1(input: PvoxAssemblyClosureHashInputV1): Uint8Array {
  const shallowInput = preflightPvoxFixedObject(input, ["ownBinaryClosureHash", "orderedChildren"], "PVOX assembly-closure hash input");
  preflightPvoxArrayCardinality(
    getPreflightPvoxDataProperty(shallowInput, "orderedChildren"),
    0,
    PVOX_DEFAULT_LIMITS.maximumAssemblyChildren,
    "PVOX assembly-closure hash input.orderedChildren",
  );
  assertPvoxPreimageDataOnly(input, "PVOX assembly-closure hash input");
  assertExactPvoxPreimageKeys(input, ["ownBinaryClosureHash", "orderedChildren"], "PVOX assembly-closure hash input");
  const children = normalizeJsonData(input.orderedChildren);
  if (!Array.isArray(children) || children.length > PVOX_DEFAULT_LIMITS.maximumAssemblyChildren) throw new Error("orderedChildren must be a canonical JSON array within the governed assembly-child limit.");
  return concatenateBytes([
    TEXT_ENCODER.encode(PVOX_ASSEMBLY_CLOSURE_HASH_DOMAIN),
    decodePvoxSha256HexV1(input.ownBinaryClosureHash, "ownBinaryClosureHash"),
    encodePvoxU32LeV1(children.length),
    encodePvoxCanonicalUtf8V1(canonicalizeGpuContract(children)),
  ]);
}

export function encodePvoxEditOverlayRootHashPreimageV1(input: PvoxEditOverlayRootHashInputV1): Uint8Array {
  const shallowInput = preflightPvoxFixedObject(input, [
    "baseContentHash", "basePageSetHash", "placementId", "gridVersion", "expectedRevision",
    "resultingRevision", "previousJournalHash", "expectedRootHash", "orderedPatches",
  ], "PVOX edit-overlay hash input");
  preflightPvoxArrayCardinality(
    getPreflightPvoxDataProperty(shallowInput, "orderedPatches"),
    1,
    PVOX_MAX_EDIT_PATCHES,
    "PVOX edit-overlay hash input.orderedPatches",
  );
  assertPvoxPreimageDataOnly(input, "PVOX edit-overlay hash input");
  assertExactPvoxPreimageKeys(input, [
    "baseContentHash", "basePageSetHash", "placementId", "gridVersion", "expectedRevision",
    "resultingRevision", "previousJournalHash", "expectedRootHash", "orderedPatches",
  ], "PVOX edit-overlay hash input");
  const expectedRevision = asUnsignedBigInt(input.expectedRevision, "expectedRevision");
  const resultingRevision = asUnsignedBigInt(input.resultingRevision, "resultingRevision");
  if (resultingRevision !== expectedRevision + 1n) throw new Error("Edit-overlay revisions must be sequential.");
  const normalizedPatches = normalizeJsonData(input.orderedPatches);
  if (!Array.isArray(normalizedPatches) || normalizedPatches.length < 1 || normalizedPatches.length > PVOX_MAX_EDIT_PATCHES) {
    throw new Error("Edit-overlay patches must be a bounded non-empty canonical array.");
  }
  const requiredKeys = [
    "fieldKind", "lodLevel", "partitionIndex", "hierarchyDepth", "mortonCode", "expectedPageIndex",
    "expectedPageHash", "operation", "expectedBrickHash", "resultingBrickHash", "resultingPageHash",
  ] as const;
  let previousAddress = "";
  const pageIndexes = new Set<number>();
  normalizedPatches.forEach((patch, index) => {
    if (patch === null || typeof patch !== "object" || Array.isArray(patch)) throw new Error(`Edit-overlay patch[${index}] must be an object.`);
    const record = patch as Record<string, unknown>;
    if (Object.keys(record).length !== requiredKeys.length || requiredKeys.some((key) => !(key in record))) throw new Error(`Edit-overlay patch[${index}] must contain the complete fixed patch address and transition.`);
    if (record.fieldKind !== "render-field" && record.fieldKind !== "collision-field") throw new Error(`Edit-overlay patch[${index}].fieldKind is invalid.`);
    const lodLevel = assertSafeIntegerInRange(record.lodLevel as number, 0, PVOX_DEFAULT_LIMITS.maximumLodCount - 1, `orderedPatches[${index}].lodLevel`);
    const partitionIndex = assertSafeIntegerInRange(record.partitionIndex as number, 0, PVOX_DEFAULT_LIMITS.maximumPartitions - 1, `orderedPatches[${index}].partitionIndex`);
    const hierarchyDepth = assertSafeIntegerInRange(record.hierarchyDepth as number, 0, PVOX_DEFAULT_LIMITS.maximumHierarchyDepth, `orderedPatches[${index}].hierarchyDepth`);
    if (typeof record.mortonCode !== "string" || !/^[0-9a-f]{16}$/u.test(record.mortonCode)) throw new Error(`Edit-overlay patch[${index}].mortonCode is invalid.`);
    const expectedPageIndex = assertSafeIntegerInRange(record.expectedPageIndex as number, 0, PVOX_DEFAULT_LIMITS.maximumPages - 1, `orderedPatches[${index}].expectedPageIndex`);
    if (pageIndexes.has(expectedPageIndex)) throw new Error("Edit-overlay permits only one transition per page.");
    pageIndexes.add(expectedPageIndex);
    const expectedPageHash = decodePvoxSha256HexV1(record.expectedPageHash as string, `orderedPatches[${index}].expectedPageHash`);
    const resultingPageHash = decodePvoxSha256HexV1(record.resultingPageHash as string, `orderedPatches[${index}].resultingPageHash`);
    if (expectedPageHash.every((value, offset) => value === resultingPageHash[offset])) throw new Error("Edit-overlay page transitions must change the page hash.");
    const expectedBrickHash = record.expectedBrickHash as string;
    const resultingBrickHash = record.resultingBrickHash as string;
    decodePvoxSha256HexV1(expectedBrickHash, `orderedPatches[${index}].expectedBrickHash`);
    decodePvoxSha256HexV1(resultingBrickHash, `orderedPatches[${index}].resultingBrickHash`);
    if (record.operation === "insert") {
      if (expectedBrickHash !== PVOX_EDIT_JOURNAL_GENESIS_HASH || resultingBrickHash === PVOX_EDIT_JOURNAL_GENESIS_HASH) throw new Error("Edit-overlay insert must change an empty brick to a non-empty result.");
    } else if (record.operation === "remove") {
      if (expectedBrickHash === PVOX_EDIT_JOURNAL_GENESIS_HASH || resultingBrickHash !== PVOX_EDIT_JOURNAL_GENESIS_HASH) throw new Error("Edit-overlay remove must change a non-empty brick to the empty result.");
    } else if (record.operation === "replace") {
      if (expectedBrickHash === PVOX_EDIT_JOURNAL_GENESIS_HASH || resultingBrickHash === PVOX_EDIT_JOURNAL_GENESIS_HASH || expectedBrickHash === resultingBrickHash) throw new Error("Edit-overlay replace must change one non-empty brick to another.");
    } else {
      throw new Error(`Edit-overlay patch[${index}].operation is invalid.`);
    }
    const address = [record.fieldKind, String(lodLevel).padStart(2, "0"), String(partitionIndex).padStart(6, "0"), String(hierarchyDepth).padStart(2, "0"), record.mortonCode].join("\u0000");
    if (index > 0 && address <= previousAddress) throw new Error("Edit-overlay patches must be unique and canonically ordered by their complete spatial address.");
    previousAddress = address;
  });
  const patches = encodeCanonicalJsonRecords(normalizedPatches);
  return concatenateBytes([
    TEXT_ENCODER.encode(PVOX_EDIT_OVERLAY_ROOT_HASH_DOMAIN),
    decodePvoxSha256HexV1(input.baseContentHash, "baseContentHash"),
    decodePvoxSha256HexV1(input.basePageSetHash, "basePageSetHash"),
    encodePvoxCanonicalUtf8V1(input.placementId),
    encodePvoxCanonicalUtf8V1(input.gridVersion),
    encodePvoxU64LeV1(expectedRevision),
    encodePvoxU64LeV1(resultingRevision),
    decodePvoxSha256HexV1(input.previousJournalHash, "previousJournalHash"),
    decodePvoxSha256HexV1(input.expectedRootHash, "expectedRootHash"),
    encodePvoxU32LeV1(patches.length),
    ...patches,
  ]);
}

export function encodePvoxRootHeaderV1(input: PvoxRootHeaderInputV1): Uint8Array {
  const rootHeaderKeys = [
    "sectionCount", "artifactByteLength", "directoryByteOffset", "directoryByteLength", "pageCount",
    "maximumHierarchyDepth", "geometryMode", "fixedPointFractionBits", "quantizedBounds",
    "directoryStartPage", "compilationInputHash", "runtimeRequestProfileHash", "directoryHash",
  ] as const;
  const shallowInput = preflightPvoxFixedObject(input, rootHeaderKeys, "PVOX root-header input");
  preflightPvoxArrayCardinality(
    getPreflightPvoxDataProperty(shallowInput, "quantizedBounds"),
    PVOX_ROOT_HEADER_BOUND_COMPONENT_COUNT,
    PVOX_ROOT_HEADER_BOUND_COMPONENT_COUNT,
    "quantizedBounds",
  );
  assertPvoxPreimageDataOnly(input, "PVOX root-header input");
  assertExactPvoxPreimageKeys(input, rootHeaderKeys, "PVOX root-header input");
  if (!Array.isArray(input.quantizedBounds)
    || input.quantizedBounds.length !== PVOX_ROOT_HEADER_BOUND_COMPONENT_COUNT
    || input.quantizedBounds.some((component) => typeof component !== "bigint")) {
    throw new Error("quantizedBounds must contain exactly six bigint components.");
  }
  const sectionCount = assertSafeIntegerInRange(input.sectionCount, 1, PVOX_MAX_SECTIONS, "sectionCount");
  const artifactByteLength = asUnsignedBigInt(input.artifactByteLength, "artifactByteLength");
  const directoryByteOffset = asUnsignedBigInt(input.directoryByteOffset, "directoryByteOffset");
  const directoryByteLength = asUnsignedBigInt(input.directoryByteLength, "directoryByteLength");
  const expectedDirectoryByteLength = BigInt(sectionCount * PVOX_DIRECTORY_ENTRY_BYTE_LENGTH);
  if (directoryByteLength !== expectedDirectoryByteLength) throw new Error("directoryByteLength must match sectionCount fixed-width entries.");
  if (directoryByteOffset < BigInt(PVOX_HEADER_BYTE_LENGTH)
    || directoryByteOffset % BigInt(PVOX_SECTION_ALIGNMENT_BYTES) !== 0n) {
    throw new Error("directoryByteOffset must follow the header and satisfy PVOX section alignment.");
  }
  if (artifactByteLength < directoryByteOffset + directoryByteLength) {
    throw new Error("artifactByteLength cannot end before the directory.");
  }
  const pageCount = assertSafeIntegerInRange(input.pageCount, 1, PVOX_DEFAULT_LIMITS.maximumPages, "pageCount");
  if (artifactByteLength > BigInt(PVOX_DEFAULT_LIMITS.maximumArtifactBytes)
    || artifactByteLength !== BigInt(pageCount) * BigInt(PVOX_PAGE_SIZE_BYTES)) {
    throw new Error("artifactByteLength must equal pageCount multiplied by the fixed PVOX page size and fit the governed ceiling.");
  }
  const maximumHierarchyDepth = assertSafeIntegerInRange(input.maximumHierarchyDepth, 0, PVOX_ROOT_HEADER_MAXIMUM_HIERARCHY_DEPTH_V1, "maximumHierarchyDepth");
  const fixedPointFractionBits = assertSafeIntegerInRange(input.fixedPointFractionBits, PVOX_ROOT_HEADER_MINIMUM_FIXED_POINT_FRACTION_BITS_V1, PVOX_ROOT_HEADER_MAXIMUM_FIXED_POINT_FRACTION_BITS_V1, "fixedPointFractionBits");
  const directoryStartPage = assertSafeIntegerInRange(input.directoryStartPage, 0, U32_MAXIMUM, "directoryStartPage");
  const expectedDirectoryStartPage = Number(directoryByteOffset / BigInt(PVOX_PAGE_SIZE_BYTES));
  if (directoryStartPage !== expectedDirectoryStartPage || directoryStartPage >= pageCount) throw new Error("directoryStartPage must identify a page containing directoryByteOffset.");
  for (let axis = 0; axis < PVOX_ROOT_HEADER_BOUND_COMPONENT_COUNT / 2; axis += 1) {
    if (input.quantizedBounds[axis]! >= input.quantizedBounds[axis + 3]!) {
      throw new Error("quantizedBounds minima must be below their corresponding maxima.");
    }
  }

  const output = new Uint8Array(PVOX_HEADER_BYTE_LENGTH);
  const view = new DataView(output.buffer);
  writeBytes(output, PVOX_ROOT_HEADER_MAGIC_OFFSET, PVOX_MAGIC_BYTES);
  view.setUint16(PVOX_ROOT_HEADER_FORMAT_MAJOR_OFFSET, PVOX_FORMAT_VERSION.major, true);
  view.setUint16(PVOX_ROOT_HEADER_FORMAT_MINOR_OFFSET, PVOX_FORMAT_VERSION.minor, true);
  view.setUint16(PVOX_ROOT_HEADER_BYTE_LENGTH_OFFSET, PVOX_HEADER_BYTE_LENGTH, true);
  view.setUint16(PVOX_ROOT_HEADER_DIRECTORY_ENTRY_BYTE_LENGTH_OFFSET, PVOX_DIRECTORY_ENTRY_BYTE_LENGTH, true);
  view.setUint16(PVOX_ROOT_HEADER_SECTION_COUNT_OFFSET, sectionCount, true);
  view.setUint16(PVOX_ROOT_HEADER_FLAGS_OFFSET, PVOX_ROOT_HEADER_FLAGS_V1, true);
  view.setBigUint64(PVOX_ROOT_HEADER_ARTIFACT_BYTE_LENGTH_OFFSET, artifactByteLength, true);
  view.setBigUint64(PVOX_ROOT_HEADER_DIRECTORY_BYTE_OFFSET_OFFSET, directoryByteOffset, true);
  view.setBigUint64(PVOX_ROOT_HEADER_DIRECTORY_BYTE_LENGTH_OFFSET, directoryByteLength, true);
  view.setUint32(PVOX_ROOT_HEADER_PAGE_SIZE_OFFSET, PVOX_PAGE_SIZE_BYTES, true);
  view.setUint32(PVOX_ROOT_HEADER_PAGE_COUNT_OFFSET, pageCount, true);
  view.setUint16(PVOX_ROOT_HEADER_BRICK_EDGE_OFFSET, PVOX_BRICK_EDGE_VOXELS, true);
  view.setUint8(PVOX_ROOT_HEADER_MAXIMUM_HIERARCHY_DEPTH_OFFSET, maximumHierarchyDepth);
  view.setUint8(PVOX_ROOT_HEADER_GEOMETRY_MODE_OFFSET, PVOX_ROOT_HEADER_GEOMETRY_MODE_CODES_V1[input.geometryMode]);
  view.setUint32(PVOX_ROOT_HEADER_COORDINATE_BASIS_OFFSET, PVOX_ROOT_HEADER_COORDINATE_BASIS_METRES_Y_UP_NEGATIVE_Z_FORWARD_CCW, true);
  view.setUint16(PVOX_ROOT_HEADER_FIXED_POINT_FRACTION_BITS_OFFSET, fixedPointFractionBits, true);
  input.quantizedBounds.forEach((component, index) => {
    view.setBigInt64(PVOX_ROOT_HEADER_BOUNDS_OFFSET + index * PVOX_ROOT_HEADER_BOUND_COMPONENT_BYTE_LENGTH, assertQuantizedCoordinate(component, fixedPointFractionBits, `quantizedBounds[${index}]`), true);
  });
  view.setUint32(PVOX_ROOT_HEADER_DIRECTORY_START_PAGE_OFFSET, directoryStartPage, true);
  writeBytes(output, PVOX_ROOT_HEADER_COMPILATION_INPUT_HASH_OFFSET, decodePvoxSha256HexV1(input.compilationInputHash, "compilationInputHash"));
  writeBytes(output, PVOX_ROOT_HEADER_RUNTIME_REQUEST_PROFILE_HASH_OFFSET, decodePvoxSha256HexV1(input.runtimeRequestProfileHash, "runtimeRequestProfileHash"));
  writeBytes(output, PVOX_ROOT_HEADER_DIRECTORY_HASH_OFFSET, decodePvoxSha256HexV1(input.directoryHash, "directoryHash"));
  return output;
}

/** Validates the exact header and returns a defensive copy; reserved bytes are rejected, never silently rewritten. */
export function normalizePvoxRootHeaderForHashV1(exactHeader: Uint8Array): Uint8Array {
  const output = copyPvoxByteInput(exactHeader, "PVOX root header", PVOX_HEADER_BYTE_LENGTH);
  if (output.byteLength !== PVOX_HEADER_BYTE_LENGTH) throw new Error(`PVOX root header must be exactly ${PVOX_HEADER_BYTE_LENGTH} bytes.`);
  const view = new DataView(output.buffer, output.byteOffset, output.byteLength);
  if (readAscii(output, PVOX_ROOT_HEADER_MAGIC_OFFSET, PVOX_MAGIC_BYTES.byteLength) !== PVOX_MAGIC) throw new Error("PVOX root header magic is invalid.");
  if (view.getUint16(PVOX_ROOT_HEADER_FORMAT_MAJOR_OFFSET, true) !== PVOX_FORMAT_VERSION.major
    || view.getUint16(PVOX_ROOT_HEADER_FORMAT_MINOR_OFFSET, true) !== PVOX_FORMAT_VERSION.minor) throw new Error("PVOX root header version is unsupported.");
  if (view.getUint16(PVOX_ROOT_HEADER_BYTE_LENGTH_OFFSET, true) !== PVOX_HEADER_BYTE_LENGTH
    || view.getUint16(PVOX_ROOT_HEADER_DIRECTORY_ENTRY_BYTE_LENGTH_OFFSET, true) !== PVOX_DIRECTORY_ENTRY_BYTE_LENGTH) throw new Error("PVOX root header fixed-width declarations are invalid.");
  const sectionCount = view.getUint16(PVOX_ROOT_HEADER_SECTION_COUNT_OFFSET, true);
  if (sectionCount < 1 || sectionCount > PVOX_MAX_SECTIONS) throw new Error("PVOX root header sectionCount is invalid.");
  if (view.getUint16(PVOX_ROOT_HEADER_FLAGS_OFFSET, true) !== PVOX_ROOT_HEADER_FLAGS_V1) throw new Error("PVOX root header contains unknown flags.");
  const directoryByteOffset = view.getBigUint64(PVOX_ROOT_HEADER_DIRECTORY_BYTE_OFFSET_OFFSET, true);
  const directoryByteLength = view.getBigUint64(PVOX_ROOT_HEADER_DIRECTORY_BYTE_LENGTH_OFFSET, true);
  if (directoryByteOffset < BigInt(PVOX_HEADER_BYTE_LENGTH)
    || directoryByteOffset % BigInt(PVOX_SECTION_ALIGNMENT_BYTES) !== 0n
    || directoryByteLength !== BigInt(sectionCount * PVOX_DIRECTORY_ENTRY_BYTE_LENGTH)) throw new Error("PVOX root header directory layout is invalid.");
  const artifactByteLength = view.getBigUint64(PVOX_ROOT_HEADER_ARTIFACT_BYTE_LENGTH_OFFSET, true);
  const pageCount = view.getUint32(PVOX_ROOT_HEADER_PAGE_COUNT_OFFSET, true);
  if (artifactByteLength < directoryByteOffset + directoryByteLength
    || artifactByteLength > BigInt(PVOX_DEFAULT_LIMITS.maximumArtifactBytes)
    || pageCount < 1
    || pageCount > PVOX_DEFAULT_LIMITS.maximumPages
    || artifactByteLength !== BigInt(pageCount) * BigInt(PVOX_PAGE_SIZE_BYTES)) throw new Error("PVOX root header artifact/page accounting is invalid.");
  if (view.getUint32(PVOX_ROOT_HEADER_PAGE_SIZE_OFFSET, true) !== PVOX_PAGE_SIZE_BYTES
    || view.getUint16(PVOX_ROOT_HEADER_BRICK_EDGE_OFFSET, true) !== PVOX_BRICK_EDGE_VOXELS) throw new Error("PVOX root header runtime layout is invalid.");
  if (view.getUint8(PVOX_ROOT_HEADER_MAXIMUM_HIERARCHY_DEPTH_OFFSET) > PVOX_ROOT_HEADER_MAXIMUM_HIERARCHY_DEPTH_V1
    || !Object.values(PVOX_ROOT_HEADER_GEOMETRY_MODE_CODES_V1).includes(view.getUint8(PVOX_ROOT_HEADER_GEOMETRY_MODE_OFFSET) as 1 | 2 | 3)
    || view.getUint32(PVOX_ROOT_HEADER_COORDINATE_BASIS_OFFSET, true) !== PVOX_ROOT_HEADER_COORDINATE_BASIS_METRES_Y_UP_NEGATIVE_Z_FORWARD_CCW
    || view.getUint16(PVOX_ROOT_HEADER_FIXED_POINT_FRACTION_BITS_OFFSET, true) > PVOX_ROOT_HEADER_MAXIMUM_FIXED_POINT_FRACTION_BITS_V1) throw new Error("PVOX root header geometry layout is invalid.");
  const expectedDirectoryStartPage = Number(directoryByteOffset / BigInt(PVOX_PAGE_SIZE_BYTES));
  if (view.getUint32(PVOX_ROOT_HEADER_DIRECTORY_START_PAGE_OFFSET, true) !== expectedDirectoryStartPage || expectedDirectoryStartPage >= pageCount) throw new Error("PVOX root header directory page binding is invalid.");
  const fractionBits = view.getUint16(PVOX_ROOT_HEADER_FIXED_POINT_FRACTION_BITS_OFFSET, true);
  for (let axis = 0; axis < PVOX_ROOT_HEADER_BOUND_COMPONENT_COUNT / 2; axis += 1) {
    const minimum = assertQuantizedCoordinate(view.getBigInt64(PVOX_ROOT_HEADER_BOUNDS_OFFSET + axis * PVOX_ROOT_HEADER_BOUND_COMPONENT_BYTE_LENGTH, true), fractionBits, `quantizedBounds[${axis}]`);
    const maximum = assertQuantizedCoordinate(view.getBigInt64(PVOX_ROOT_HEADER_BOUNDS_OFFSET + (axis + 3) * PVOX_ROOT_HEADER_BOUND_COMPONENT_BYTE_LENGTH, true), fractionBits, `quantizedBounds[${axis + 3}]`);
    if (minimum >= maximum) throw new Error("PVOX root header quantized bounds are invalid.");
  }
  if (!isZeroRange(output, PVOX_ROOT_HEADER_INLINE_RESERVED_OFFSET, PVOX_ROOT_HEADER_INLINE_RESERVED_BYTE_LENGTH)
    || !isZeroRange(output, PVOX_ROOT_HEADER_TRAILING_RESERVED_OFFSET, PVOX_ROOT_HEADER_TRAILING_RESERVED_BYTE_LENGTH)) throw new Error("PVOX root header reserved bytes must be zero.");
  return output;
}

export function encodePvoxRootHashPreimageV1(
  exactHeader: Uint8Array,
  orderedSectionHashes: readonly PvoxRootSectionHashRecordV1[],
): Uint8Array {
  preflightPvoxArrayCardinality(orderedSectionHashes, 1, PVOX_MAX_SECTIONS, "PVOX root section-hash input");
  assertPvoxPreimageDataOnly(orderedSectionHashes, "PVOX root section-hash input");
  const header = normalizePvoxRootHeaderForHashV1(exactHeader);
  const sectionCount = new DataView(header.buffer, header.byteOffset, header.byteLength).getUint16(PVOX_ROOT_HEADER_SECTION_COUNT_OFFSET, true);
  if (orderedSectionHashes.length !== sectionCount) throw new Error("Root section hashes must match the header sectionCount.");
  let previousKey = -1n;
  const sections = orderedSectionHashes.map((record, index) => {
    assertExactPvoxPreimageKeys(record, ["sectionType", "sectionVersion", "sectionHash"], `orderedSectionHashes[${index}]`);
    const sectionType = assertSafeIntegerInRange(record.sectionType, 0, U32_MAXIMUM, `orderedSectionHashes[${index}].sectionType`);
    const sectionVersion = assertSafeIntegerInRange(record.sectionVersion, 0, U16_MAXIMUM, `orderedSectionHashes[${index}].sectionVersion`);
    const key = (BigInt(sectionType) << 16n) | BigInt(sectionVersion);
    if (key <= previousKey) throw new Error("Root section hashes must be unique and strictly ordered by type then version.");
    previousKey = key;
    return concatenateBytes([
      encodePvoxU32LeV1(sectionType),
      encodePvoxU16LeV1(sectionVersion),
      decodePvoxSha256HexV1(record.sectionHash, `orderedSectionHashes[${index}].sectionHash`),
    ]);
  });
  return concatenateBytes([TEXT_ENCODER.encode(PVOX_ROOT_HASH_DOMAIN), header, ...sections]);
}

function escapeJsonPointerSegment(value: string): string {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

function cloneProjectedData(
  value: unknown,
  pointer: string,
  omittedPointers: ReadonlySet<string>,
  seen: WeakSet<object>,
  depth = 0,
  state = { nodes: 0 },
): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("PVOX hash projections require finite JSON numbers.");
    return value;
  }
  if (typeof value !== "object") throw new Error("PVOX hash projections accept JSON data only.");
  state.nodes += 1;
  if (depth > 64 || state.nodes > PVOX_MAX_HASH_PREIMAGE_DATA_NODES_V1) throw new Error("PVOX hash projections must be bounded data trees.");
  if (seen.has(value)) throw new Error("PVOX hash projections cannot contain cycles or shared object references.");
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      state.nodes += value.length;
      if (state.nodes > PVOX_MAX_HASH_PREIMAGE_DATA_NODES_V1) throw new Error("PVOX hash projections must be bounded data trees.");
      const descriptors = Object.getOwnPropertyDescriptors(value);
      const keys = Reflect.ownKeys(descriptors);
      if (keys.some((key) => typeof key === "symbol" || (key !== "length" && !/^(0|[1-9][0-9]*)$/u.test(key)))) throw new Error("PVOX hash projection arrays cannot contain named or symbol properties.");
      const output: unknown[] = [];
      for (let index = 0; index < value.length; index += 1) {
        const descriptor = descriptors[String(index)];
        if (!descriptor || descriptor.get || descriptor.set || !descriptor.enumerable) throw new Error("PVOX hash projection arrays must be dense enumerable data.");
        const childPointer = `${pointer}/${index}`;
        if (omittedPointers.has(childPointer)) throw new Error("PVOX named omissions cannot remove array positions.");
        output.push(cloneProjectedData(descriptor.value, childPointer, omittedPointers, seen, depth + 1, state));
      }
      return output;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new Error("PVOX hash projection objects must have a plain or null prototype.");
    const output: Record<string, unknown> = {};
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key === "symbol") throw new Error("PVOX hash projection objects cannot contain symbol properties.");
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || descriptor.get || descriptor.set || !descriptor.enumerable) throw new Error("PVOX hash projection objects must contain enumerable data properties only.");
      const childPointer = `${pointer}/${escapeJsonPointerSegment(key)}`;
      if (!omittedPointers.has(childPointer)) output[key] = cloneProjectedData(descriptor.value, childPointer, omittedPointers, seen, depth + 1, state);
    }
    return output;
  } finally {
    seen.delete(value);
  }
}

export function projectPvoxNamedJsonClosureV1(name: PvoxNamedJsonClosureV1, value: unknown): unknown {
  const spec = PVOX_NAMED_JSON_CLOSURE_SPECS_V1[name];
  return cloneProjectedData(value, "", new Set<string>(spec.omittedJsonPointers), new WeakSet<object>());
}

export function canonicalizePvoxNamedJsonClosureV1(name: PvoxNamedJsonClosureV1, value: unknown): string {
  return canonicalizeGpuContract(projectPvoxNamedJsonClosureV1(name, value));
}

export function encodePvoxNamedJsonClosurePreimageV1(name: PvoxNamedJsonClosureV1, value: unknown): Uint8Array {
  const spec = PVOX_NAMED_JSON_CLOSURE_SPECS_V1[name];
  return concatenateBytes([
    TEXT_ENCODER.encode(spec.domain),
    encodePvoxCanonicalUtf8V1(canonicalizePvoxNamedJsonClosureV1(name, value)),
  ]);
}
