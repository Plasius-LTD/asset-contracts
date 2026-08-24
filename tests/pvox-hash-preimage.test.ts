import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  PVOX_NAMED_JSON_CLOSURE_SPECS_V1,
  PVOX_ROOT_HEADER_COMPILATION_INPUT_HASH_OFFSET,
  PVOX_ROOT_HEADER_DIRECTORY_HASH_OFFSET,
  PVOX_ROOT_HEADER_INLINE_RESERVED_OFFSET,
  PVOX_ROOT_HEADER_LAYOUT_V1,
  PVOX_ROOT_HEADER_RUNTIME_REQUEST_PROFILE_HASH_OFFSET,
  PVOX_ROOT_HEADER_TRAILING_RESERVED_OFFSET,
  PVOX_SHA256_BYTE_LENGTH,
  canonicalizePvoxNamedJsonClosureV1,
  encodePvoxBinaryClosureHashPreimageV1,
  encodePvoxAssemblyClosureHashPreimageV1,
  encodePvoxCapabilitySetHashPreimageV1,
  encodePvoxCanonicalUtf8V1,
  encodePvoxDirectoryHashPreimageV1,
  encodePvoxI64LeV1,
  encodePvoxEvaluationClosureHashPreimageV1,
  encodePvoxEditOverlayRootHashPreimageV1,
  encodePvoxNamedJsonClosurePreimageV1,
  encodePvoxPageSetHashPreimageV1,
  encodePvoxPhysicalEvidenceHashPreimageV1,
  encodePvoxPhysicalInventoryHashPreimageV1,
  encodePvoxProcessingClosureHashPreimageV1,
  encodePvoxRootHashPreimageV1,
  encodePvoxRootHeaderV1,
  encodePvoxSectionHashPreimageV1,
  encodePvoxU16LeV1,
  encodePvoxU32LeV1,
  encodePvoxU64LeV1,
  normalizePvoxRootHeaderForHashV1,
} from "../src/pvox-hash-preimage.js";
import {
  MODEL_RESOLUTION_V2_CONTRACT_VERSION,
  PVOX_CAPABILITIES,
  PVOX_DEFAULT_LIMITS,
  PVOX_DEFAULT_SOURCE_INGESTION_LIMITS,
  PVOX_DIRECTORY_ENTRY_BYTE_LENGTH,
  PVOX_HEADER_BYTE_LENGTH,
  PVOX_MODEL_REQUEST_POLICY_ID,
  PVOX_PAGE_SIZE_BYTES,
  PVOX_ROOT_HASH_DOMAIN,
  canonicalizeModelRequestSemanticProfileV1,
  type ModelRequestSpecV2,
} from "../src/pvox-model-resolution.js";

const digest = (character: string): string => character.repeat(64);
const sha256 = (value: Uint8Array): string => createHash("sha256").update(value).digest("hex");

const headerInput = () => ({
  sectionCount: 2,
  artifactByteLength: 65_536,
  directoryByteOffset: 256,
  directoryByteLength: 2 * PVOX_DIRECTORY_ENTRY_BYTE_LENGTH,
  pageCount: 1,
  maximumHierarchyDepth: 8,
  geometryMode: "mixed" as const,
  fixedPointFractionBits: 20,
  quantizedBounds: [-1_048_576n, -524_288n, -262_144n, 1_048_576n, 2_097_152n, 3_145_728n] as const,
  directoryStartPage: 0,
  compilationInputHash: digest("3"),
  runtimeRequestProfileHash: digest("4"),
  directoryHash: digest("5"),
});
const createHeader = (): Uint8Array => encodePvoxRootHeaderV1(headerInput());

const ROOT_SECTION_HASHES = Object.freeze([
  Object.freeze({ sectionType: 0x100, sectionVersion: 1, sectionHash: digest("6") }),
  Object.freeze({ sectionType: 0x200, sectionVersion: 2, sectionHash: digest("7") }),
]);

describe("PVOX fixed-width hash-preimage codec", () => {
  it("encodes unsigned and signed integers in canonical little-endian widths", () => {
    expect([...encodePvoxU16LeV1(0x1234)]).toEqual([0x34, 0x12]);
    expect([...encodePvoxU32LeV1(0x1234_5678)]).toEqual([0x78, 0x56, 0x34, 0x12]);
    expect([...encodePvoxU64LeV1(0x0102_0304_0506_0708n)]).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
    expect([...encodePvoxI64LeV1(-2n)]).toEqual([0xfe, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
    expect([...encodePvoxCanonicalUtf8V1("hé")]).toEqual([3, 0, 0, 0, 0x68, 0xc3, 0xa9]);
    expect(() => encodePvoxU32LeV1(-1)).toThrow(/u32/u);
    expect(() => encodePvoxU64LeV1(0x1_0000_0000_0000_0000n)).toThrow(/64-bit/u);
  });

  it("matches immutable SHA-256 vectors for section, directory, and page-set preimages", () => {
    const section = encodePvoxSectionHashPreimageV1(0x4544_4f4e, 1, Uint8Array.from([0, 1, 2, 255]));
    const directoryBytes = Uint8Array.from({ length: 256 }, (_, index) => (index * 17 + 3) % 256);
    const directory = encodePvoxDirectoryHashPreimageV1(2, directoryBytes);
    const pageSet = encodePvoxPageSetHashPreimageV1([
      { pageIndex: 0, byteOffset: 0, byteLength: 65_536, pageSha256: digest("1") },
      { pageIndex: 1, byteOffset: 65_536, byteLength: 65_536, pageSha256: digest("2") },
    ]);

    expect(sha256(section)).toBe("02671578e9d3383637324922377fa06cb7a4ece29960c6ab0be7f3d8e27c6c9d");
    expect(sha256(directory)).toBe("7e7c48cf7bbb6545840c0359d9380e2031d2789c9bcb29c3579b3dc3c3c90802");
    expect(sha256(pageSet)).toBe("368a527e98bd5427520428b8fba6c95c09913536ca94347b1a363b2eaa855053");
    expect(() => encodePvoxDirectoryHashPreimageV1(1, directoryBytes)).toThrow(/exactly/u);
    expect(() => encodePvoxPageSetHashPreimageV1([
      { pageIndex: 1, byteOffset: 0, byteLength: 1, pageSha256: digest("1") },
    ])).toThrow(/contiguous/u);
    expect(() => encodePvoxPageSetHashPreimageV1([
      { pageIndex: 0, byteOffset: 0, byteLength: 123, pageSha256: digest("1") },
    ])).toThrow(/64-KiB|page size|65,?536/u);
  });

  it("matches immutable SHA-256 vectors for binary, capability, physical, and evaluation closures", () => {
    const binary = encodePvoxBinaryClosureHashPreimageV1({
      sourceContentHash: digest("0"),
      canonicalDocumentHash: digest("1"),
      compilationInputHash: digest("2"),
      runtimeRequestProfileHash: digest("3"),
      artifactSha256: digest("4"),
      rootHash: digest("5"),
      directoryHash: digest("6"),
      pageSetHash: digest("7"),
    });
    const capabilityAssessments = PVOX_CAPABILITIES.map((capability, index) => ({
      capability,
      evidenceHash: digest("9abcdef01"[index]!),
    }));
    const capabilities = encodePvoxCapabilitySetHashPreimageV1(digest("8"), capabilityAssessments);
    const inventoryInput = {
      inventoryVersion: "plasius.pvox-physical-region-inventory/1",
      subjectBinaryClosureHash: digest("b"),
      validationEvidenceHash: digest("f"),
      entries: [
        { regionIndex: 0, physicalPaletteIndex: 2, regionId: "frame", materialId: "steel" },
        { regionIndex: 1, physicalPaletteIndex: 7, regionId: "seat", materialId: "oak" },
      ],
    };
    const inventory = encodePvoxPhysicalInventoryHashPreimageV1(inventoryInput);
    const evidence = encodePvoxPhysicalEvidenceHashPreimageV1({
      physicalInventoryHash: digest("c"),
      orderedRegionMaterials: [
        { regionId: "frame", materialId: "steel" },
        { regionId: "seat", materialId: "oak" },
      ],
      orderedCanonicalEvidence: [
        { regionId: "frame", materialId: "steel", property: "density", evidenceHash: digest("d") },
        { regionId: "seat", materialId: "oak", property: "hardness", evidenceHash: digest("e") },
      ],
    });
    const evaluation = encodePvoxEvaluationClosureHashPreimageV1({
      fidelityEvidenceHash: digest("1"),
      physicalEvidenceHash: digest("2"),
      capabilitySetHash: digest("3"),
      renderEvidenceHash: digest("4"),
    });

    expect(sha256(binary)).toBe("2e6601ef445d179b975895778ca609e8b31e7734e44f17b1cd6535eb2b045b93");
    expect(sha256(capabilities)).toBe("cb581ff76d1189dc6097e6cd33e78673fd06a5419029464837d5c67a9367f7e0");
    expect(sha256(inventory)).toBe("75b5563540b61b6978a37e5921672ab86631310eafe55ee02d654de1b59413bc");
    expect(sha256(evidence)).toBe("c052e20d154fa39f82551c77274584a85c5ede2ad3d33910851a27a8f9255d85");
    expect(sha256(evaluation)).toBe("c74911840dd34e6b6fcea75053a52085b3d903748060e928b510d029ef1ffe43");

    expect(() => encodePvoxCapabilitySetHashPreimageV1(digest("8"), [...capabilityAssessments].reverse())).toThrow(/capabilit|canonical|order/u);
    expect(() => encodePvoxPhysicalInventoryHashPreimageV1({
      ...inventoryInput,
      entries: [...inventoryInput.entries].reverse(),
    })).toThrow(/contiguous|increasing/u);
    expect(() => encodePvoxPhysicalInventoryHashPreimageV1({
      ...inventoryInput,
      entries: [inventoryInput.entries[0]!, { ...inventoryInput.entries[1]!, regionIndex: 3 }],
    })).toThrow(/contiguous/u);
    expect(() => encodePvoxPhysicalEvidenceHashPreimageV1({
      physicalInventoryHash: digest("c"),
      orderedRegionMaterials: [
        { regionId: "frame", materialId: "steel" },
        { regionId: "seat", materialId: "oak" },
      ],
      orderedCanonicalEvidence: [
        { regionId: "seat", materialId: "oak", property: "hardness", evidenceHash: digest("e") },
        { regionId: "frame", materialId: "steel", property: "density", evidenceHash: digest("d") },
      ],
    })).toThrow(/physical|canonical|order/u);
  });

  it("matches immutable SHA-256 vectors for processing, assembly, and edit-overlay preimages", () => {
    const processing = encodePvoxProcessingClosureHashPreimageV1({
      binaryClosureHash: digest("0"),
      requestSemanticProfileHash: digest("1"),
      technicalProfile: { brickCount: 2, geometryMode: "solid" },
      pvoxValidationEvidenceHash: digest("2"),
      physicalInventoryValidationEvidenceHash: digest("3"),
      capabilitySetHash: digest("4"),
      physicalInventoryHash: digest("5"),
      physicalEvidenceHash: digest("6"),
      massPropertiesEvidenceHash: digest("7"),
      bondGraphEvidenceHash: digest("8"),
      interiorLayerEvidenceHash: digest("9"),
      compilerEvidenceHash: digest("a"),
      fidelityEvidenceHash: digest("b"),
    });
    const assembly = encodePvoxAssemblyClosureHashPreimageV1({
      ownBinaryClosureHash: digest("c"),
      orderedChildren: [{ instanceId: "root", contentHash: digest("d") }],
    });
    const overlay = encodePvoxEditOverlayRootHashPreimageV1({
      baseContentHash: digest("0"),
      basePageSetHash: digest("1"),
      placementId: "placement-1",
      gridVersion: "grid-v1",
      expectedRevision: 0,
      resultingRevision: 1,
      previousJournalHash: digest("0"),
      expectedRootHash: digest("2"),
      orderedPatches: [{
        fieldKind: "render-field",
        lodLevel: 0,
        partitionIndex: 0,
        hierarchyDepth: 8,
        mortonCode: "0000000000000001",
        expectedPageIndex: 0,
        expectedPageHash: digest("3"),
        operation: "insert",
        expectedBrickHash: digest("0"),
        resultingBrickHash: digest("4"),
        resultingPageHash: digest("5"),
      }],
    });

    expect(sha256(processing)).toBe("f84b8fb16fdb2a10cef756515754cc8881210baff82eaf7f3f29d759174ced7f");
    expect(sha256(assembly)).toBe("4129817e9e136930cb8d6fbe297bef6dada3a43784429969b55c0e6845f65650");
    expect(sha256(overlay)).toBe("72236f5d177c3ff731c3ef3f3ec9437f7d0b0caeb7333eefbd6b672c4a994c08");
  });

  it("requires complete, canonical, non-empty edit-overlay transitions", () => {
    const patch = {
      fieldKind: "render-field" as const,
      lodLevel: 0,
      partitionIndex: 0,
      hierarchyDepth: 8,
      mortonCode: "0000000000000001",
      expectedPageIndex: 0,
      expectedPageHash: digest("3"),
      operation: "insert" as const,
      expectedBrickHash: digest("0"),
      resultingBrickHash: digest("4"),
      resultingPageHash: digest("5"),
    };
    const input = {
      baseContentHash: digest("0"),
      basePageSetHash: digest("1"),
      placementId: "placement-1",
      gridVersion: "grid-v1",
      expectedRevision: 0,
      resultingRevision: 1,
      previousJournalHash: digest("0"),
      expectedRootHash: digest("2"),
      orderedPatches: [patch],
    };
    expect(() => encodePvoxEditOverlayRootHashPreimageV1({
      ...input,
      orderedPatches: [{ ...patch, resultingBrickHash: digest("0") }],
    })).toThrow(/insert|empty|non-empty/u);
    expect(() => encodePvoxEditOverlayRootHashPreimageV1({
      ...input,
      resultingRevision: 2,
    })).toThrow(/revision|sequential/u);
    expect(() => encodePvoxEditOverlayRootHashPreimageV1({
      ...input,
      orderedPatches: [
        { ...patch, mortonCode: "0000000000000002", expectedPageIndex: 1 },
        patch,
      ],
    })).toThrow(/canonical|order/u);
  });

  it("constructs the exact 256-byte root header and keeps root/closure hashes external", () => {
    const header = createHeader();

    expect(header).toHaveLength(PVOX_HEADER_BYTE_LENGTH);
    expect(sha256(header)).toBe("9068664a9f8d6d14b6d1b9671e0c39e411a1b55ac23998ef8a071a0598d9745e");
    expect([...header.slice(PVOX_ROOT_HEADER_COMPILATION_INPUT_HASH_OFFSET, PVOX_ROOT_HEADER_COMPILATION_INPUT_HASH_OFFSET + PVOX_SHA256_BYTE_LENGTH)])
      .toEqual([...new Uint8Array(PVOX_SHA256_BYTE_LENGTH).fill(0x33)]);
    expect([...header.slice(PVOX_ROOT_HEADER_RUNTIME_REQUEST_PROFILE_HASH_OFFSET, PVOX_ROOT_HEADER_RUNTIME_REQUEST_PROFILE_HASH_OFFSET + PVOX_SHA256_BYTE_LENGTH)])
      .toEqual([...new Uint8Array(PVOX_SHA256_BYTE_LENGTH).fill(0x44)]);
    expect([...header.slice(PVOX_ROOT_HEADER_DIRECTORY_HASH_OFFSET, PVOX_ROOT_HEADER_DIRECTORY_HASH_OFFSET + PVOX_SHA256_BYTE_LENGTH)])
      .toEqual([...new Uint8Array(PVOX_SHA256_BYTE_LENGTH).fill(0x55)]);
    expect(PVOX_ROOT_HEADER_LAYOUT_V1.rootHash).toEqual({ storage: "external" });
    expect(PVOX_ROOT_HEADER_LAYOUT_V1.binaryClosureHash).toEqual({ storage: "external" });
    expect(header.slice(PVOX_ROOT_HEADER_TRAILING_RESERVED_OFFSET).every((value) => value === 0)).toBe(true);
  });

  it("cross-checks header page accounting and quantized coordinate ceilings", () => {
    expect(() => encodePvoxRootHeaderV1({
      ...headerInput(),
      artifactByteLength: 2 * PVOX_PAGE_SIZE_BYTES,
    })).toThrow(/artifact|pageCount|page size/u);
    expect(() => encodePvoxRootHeaderV1({
      ...headerInput(),
      quantizedBounds: [-1n, -1n, -1n, 2n ** 61n, 1n, 1n],
    })).toThrow(/coordinate|bounds/u);

    const mismatchedPageCount = createHeader();
    new DataView(mismatchedPageCount.buffer).setUint32(PVOX_ROOT_HEADER_LAYOUT_V1.pageCount.offset, 2, true);
    expect(() => normalizePvoxRootHeaderForHashV1(mismatchedPageCount)).toThrow(/artifact|pageCount|page size/u);
  });

  it("hashes the directory digest exactly once as part of the normalized root header", () => {
    const header = createHeader();
    const preimage = encodePvoxRootHashPreimageV1(header, ROOT_SECTION_HASHES);
    const domainByteLength = new TextEncoder().encode(PVOX_ROOT_HASH_DOMAIN).byteLength;

    expect(preimage).toHaveLength(domainByteLength + PVOX_HEADER_BYTE_LENGTH + ROOT_SECTION_HASHES.length * (4 + 2 + PVOX_SHA256_BYTE_LENGTH));
    expect([...preimage.slice(domainByteLength + PVOX_ROOT_HEADER_DIRECTORY_HASH_OFFSET, domainByteLength + PVOX_ROOT_HEADER_DIRECTORY_HASH_OFFSET + PVOX_SHA256_BYTE_LENGTH)])
      .toEqual([...new Uint8Array(PVOX_SHA256_BYTE_LENGTH).fill(0x55)]);
    expect(sha256(preimage)).toBe("07eea07a11f8643206cf7b730156ac9e603b624ae925322f7b204d7943904ea0");
  });

  it("rejects nonzero reserved bytes instead of normalizing attacker-controlled data", () => {
    const inlineReserved = createHeader();
    inlineReserved[PVOX_ROOT_HEADER_INLINE_RESERVED_OFFSET] = 1;
    expect(() => normalizePvoxRootHeaderForHashV1(inlineReserved)).toThrow(/reserved bytes/u);

    const trailingReserved = createHeader();
    trailingReserved[PVOX_ROOT_HEADER_TRAILING_RESERVED_OFFSET] = 1;
    expect(() => encodePvoxRootHashPreimageV1(trailingReserved, ROOT_SECTION_HASHES)).toThrow(/reserved bytes/u);
  });

  it("changes the root vector when any bound directory or section digest changes", () => {
    const baseline = sha256(encodePvoxRootHashPreimageV1(createHeader(), ROOT_SECTION_HASHES));
    const mutatedHeader = createHeader();
    mutatedHeader[PVOX_ROOT_HEADER_DIRECTORY_HASH_OFFSET] = mutatedHeader[PVOX_ROOT_HEADER_DIRECTORY_HASH_OFFSET]! ^ 1;
    const mutatedSections = [ROOT_SECTION_HASHES[0]!, { ...ROOT_SECTION_HASHES[1]!, sectionHash: digest("8") }];

    expect(sha256(encodePvoxRootHashPreimageV1(mutatedHeader, ROOT_SECTION_HASHES))).not.toBe(baseline);
    expect(sha256(encodePvoxRootHashPreimageV1(createHeader(), mutatedSections))).not.toBe(baseline);
    expect(() => encodePvoxRootHashPreimageV1(createHeader(), [...ROOT_SECTION_HASHES].reverse())).toThrow(/strictly ordered/u);
  });

  it("rejects accessors in fixed-layout inputs without invoking them", () => {
    let getterCalls = 0;
    const binaryInput = {
      sourceContentHash: digest("0"),
      canonicalDocumentHash: digest("1"),
      compilationInputHash: digest("2"),
      runtimeRequestProfileHash: digest("3"),
      artifactSha256: digest("4"),
      rootHash: digest("5"),
      directoryHash: digest("6"),
      pageSetHash: digest("7"),
    };
    Object.defineProperty(binaryInput, "sourceContentHash", {
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return digest("0");
      },
    });
    expect(() => encodePvoxBinaryClosureHashPreimageV1(binaryInput)).toThrow(/data|accessor|properties/u);
    expect(getterCalls).toBe(0);

    const rootInput = headerInput() as Record<string, unknown>;
    Object.defineProperty(rootInput, "sectionCount", {
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return 2;
      },
    });
    expect(() => encodePvoxRootHeaderV1(rootInput as never)).toThrow(/data|accessor|properties/u);
    expect(getterCalls).toBe(0);
  });

  it("rejects unhashed fixed-input fields and malformed fixed tuples", () => {
    const binaryInput = {
      sourceContentHash: digest("0"),
      canonicalDocumentHash: digest("1"),
      compilationInputHash: digest("2"),
      runtimeRequestProfileHash: digest("3"),
      artifactSha256: digest("4"),
      rootHash: digest("5"),
      directoryHash: digest("6"),
      pageSetHash: digest("7"),
    };
    expect(() => encodePvoxBinaryClosureHashPreimageV1({
      ...binaryInput,
      unexpectedSecuritySubject: "not-hashed",
    } as never)).toThrow(/exactly|unexpected|key/u);
    expect(() => encodePvoxRootHeaderV1({
      ...headerInput(),
      quantizedBounds: headerInput().quantizedBounds.slice(0, 5),
    } as never)).toThrow(/six|quantizedBounds|component/u);
  });

  it("accepts only bounded byte arrays and governed assembly sizes", () => {
    const sectionView = new DataView(Uint8Array.from([1, 2, 3, 4]).buffer);
    const directoryView = new DataView(new ArrayBuffer(2 * PVOX_DIRECTORY_ENTRY_BYTE_LENGTH));
    expect(() => encodePvoxSectionHashPreimageV1(1, 1, sectionView as unknown as Uint8Array)).toThrow(/Uint8Array/u);
    expect(() => encodePvoxDirectoryHashPreimageV1(2, directoryView as unknown as Uint8Array)).toThrow(/Uint8Array/u);
    expect(() => encodePvoxAssemblyClosureHashPreimageV1({
      ownBinaryClosureHash: digest("1"),
      orderedChildren: Array.from({ length: PVOX_DEFAULT_LIMITS.maximumAssemblyChildren + 1 }, (_, index) => ({ index })),
    })).toThrow(/assembly|child|limit/u);
  });
});

describe("PVOX named JSON closure projections", () => {
  const confirmation = () => ({
    candidateId: "candidate-1",
    requestRevision: 2,
    bindingHash: digest("8"),
    bindingHashAttestation: { digest: digest("8") },
    nested: { z: 2, a: "é" },
  });

  it("uses a closed named omission list and matches its canonical SHA-256 vector", () => {
    expect(PVOX_NAMED_JSON_CLOSURE_SPECS_V1["confirmation-binding"].omittedJsonPointers)
      .toEqual(["/bindingHash", "/bindingHashAttestation"]);
    expect(canonicalizePvoxNamedJsonClosureV1("confirmation-binding", confirmation()))
      .toBe("{\"candidateId\":\"candidate-1\",\"nested\":{\"a\":\"é\",\"z\":2},\"requestRevision\":2}");
    expect(sha256(encodePvoxNamedJsonClosurePreimageV1("confirmation-binding", confirmation())))
      .toBe("c8c7df5cc06e5db1bc319b033edd72a7094f442cd17461275791fce04bf0e4d1");
  });

  it("uses the same request-semantic projection when optional selectors are omitted", () => {
    const request = {
      contractVersion: MODEL_RESOLUTION_V2_CONTRACT_VERSION,
      policyProfileId: PVOX_MODEL_REQUEST_POLICY_ID,
      requestSemanticProfileHash: digest("a"),
      query: "wooden chair",
      revision: 0,
      hardConstraints: {},
      softPreferences: {},
      exclusions: [],
      sourceIngestionLimits: PVOX_DEFAULT_SOURCE_INGESTION_LIMITS,
      pvoxRuntimeProfile: {
        profileId: "static-world-v1",
        fidelityProfileId: "props-furniture-v1",
        capabilityProfileId: "static-render-v1",
        geometryMode: "auto",
        requiredCapabilities: ["rendering"],
        limits: {
          maximumArtifactBytes: PVOX_DEFAULT_LIMITS.maximumArtifactBytes,
          maximumPages: PVOX_DEFAULT_LIMITS.maximumPages,
          maximumHierarchyDepth: PVOX_DEFAULT_LIMITS.maximumHierarchyDepth,
          maximumHierarchyNodes: PVOX_DEFAULT_LIMITS.maximumHierarchyNodes,
          maximumBricks: PVOX_DEFAULT_LIMITS.maximumBricks,
          maximumLogicalVoxels: PVOX_DEFAULT_LIMITS.maximumLogicalVoxels,
          maximumEncodedSurfaceSamples: PVOX_DEFAULT_LIMITS.maximumEncodedSurfaceSamples,
          maximumSurfaceProperties: PVOX_DEFAULT_LIMITS.maximumSurfaceProperties,
          maximumPhysicalPaletteRecords: PVOX_DEFAULT_LIMITS.maximumPhysicalProperties,
          maximumPhysicalEvidenceEntries: PVOX_DEFAULT_LIMITS.maximumPhysicalEvidenceEntries,
          maximumMaterialRegions: PVOX_DEFAULT_LIMITS.maximumMaterialRegions,
          maximumInteriorLayers: PVOX_DEFAULT_LIMITS.maximumInteriorLayers,
          maximumMassPropertyRecords: PVOX_DEFAULT_LIMITS.maximumMassPropertyRecords,
          maximumBondRecords: PVOX_DEFAULT_LIMITS.maximumBondRecords,
          maximumPartitions: PVOX_DEFAULT_LIMITS.maximumPartitions,
          maximumLodCount: PVOX_DEFAULT_LIMITS.maximumLodCount,
          maximumCpuResidentBytes: PVOX_DEFAULT_LIMITS.maximumCpuResidentBytes,
          maximumGpuResidentBytes: PVOX_DEFAULT_LIMITS.maximumGpuResidentBytes,
        },
      },
    } as const satisfies ModelRequestSpecV2;

    expect(canonicalizeModelRequestSemanticProfileV1(request))
      .toBe(canonicalizePvoxNamedJsonClosureV1("request-semantic-profile", request));
  });

  it("ignores only circular output fields and remains sensitive to subject mutations", () => {
    const baseline = sha256(encodePvoxNamedJsonClosurePreimageV1("confirmation-binding", confirmation()));
    expect(sha256(encodePvoxNamedJsonClosurePreimageV1("confirmation-binding", {
      ...confirmation(),
      bindingHash: digest("9"),
      bindingHashAttestation: { digest: digest("0") },
    }))).toBe(baseline);
    expect(sha256(encodePvoxNamedJsonClosurePreimageV1("confirmation-binding", {
      ...confirmation(),
      candidateId: "candidate-2",
    }))).not.toBe(baseline);
  });

  it("rejects accessors before invoking them and rejects non-JSON graph shapes", () => {
    let getterCalls = 0;
    const malicious = { candidateId: "candidate-1" } as Record<string, unknown>;
    Object.defineProperty(malicious, "requestRevision", {
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return 2;
      },
    });
    expect(() => encodePvoxNamedJsonClosurePreimageV1("confirmation-binding", malicious)).toThrow(/data properties/u);
    expect(getterCalls).toBe(0);

    const sparse = new Array<unknown>(2);
    sparse[0] = "one";
    expect(() => encodePvoxNamedJsonClosurePreimageV1("confirmation-binding", sparse)).toThrow(/dense/u);
  });
});
