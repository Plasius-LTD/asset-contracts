const ASSET_VERSION_PATTERN = /^[0-9A-Za-z][0-9A-Za-z._-]{0,127}$/u;

const MUTABLE_VERSION_ALIASES = new Set([
  "latest",
  "current",
  "stable",
  "preview",
  "default",
  "production",
  "canary",
  "next",
  "head",
  "main",
]);

const X_WILDCARD_SEGMENT_PATTERN = /^(?:[vV])?[xX](?:\.|-|$)|\.[xX](?:\.|-|$)/u;
const IMMUTABLE_VERSION_ERROR_MESSAGE =
  "Immutable asset version must be an exact token up to 128 characters; mutable aliases, ranges, wildcards, and URLs are not allowed.";

/**
 * Validates the legacy asset-version token grammar.
 *
 * This intentionally permits workflow labels such as `latest`; callers that
 * identify immutable assets must use {@link assertImmutableAssetVersion}.
 */
export function assertAssetVersion(value: unknown): string {
  if (typeof value !== "string" || !ASSET_VERSION_PATTERN.test(value)) {
    throw new Error("Asset version must be a non-empty token up to 128 characters.");
  }
  return value;
}

/**
 * Validates an immutable, reproducible asset version.
 *
 * The error is deliberately constant and does not interpolate untrusted input,
 * keeping diagnostics stable and bounded at storage and runtime boundaries.
 */
export function assertImmutableAssetVersion(value: unknown): string {
  if (typeof value !== "string"
    || !ASSET_VERSION_PATTERN.test(value)
    || MUTABLE_VERSION_ALIASES.has(value.toLowerCase())
    || X_WILDCARD_SEGMENT_PATTERN.test(value)) {
    throw new Error(IMMUTABLE_VERSION_ERROR_MESSAGE);
  }
  return value;
}
