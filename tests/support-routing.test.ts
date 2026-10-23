import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  repository: { url: string };
  bugs: { url: string };
};
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const repositoryUrl = manifest.repository.url.replace(/^git\+/u, "").replace(/\.git$/u, "");
const issueTracker = `${repositoryUrl}/issues`;

describe("package support routing", () => {
  it("routes npm bug reports to the owning package repository", () => {
    expect(manifest.bugs.url).toBe(issueTracker);
  });

  it("documents an active package tracker while keeping security reporting private", () => {
    const support = readme.split("## Support\n")[1]?.split("\n## ")[0] ?? "";
    expect(support).toContain(`](${issueTracker})`);
    expect(support).not.toMatch(/issues disabled/iu);
    expect(support).toContain("[SECURITY.md](./SECURITY.md)");
  });

  it("provides package-owned follow-ups for all four model contract concerns", () => {
    for (const issue of [48, 49, 50, 51]) {
      expect(readme).toContain(`](${issueTracker}/${issue})`);
    }
  });
});
