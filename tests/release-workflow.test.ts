import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(new URL("../.github/workflows/cd.yml", import.meta.url), "utf8");
const ciWorkflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
const releasePrepareWorkflow = readFileSync(
  new URL("../.github/workflows/release-prepare.yml", import.meta.url),
  "utf8",
);

function jobBlock(source: string, jobName: string): string {
  const jobsStart = source.indexOf("\njobs:\n");
  const marker = `\n  ${jobName}:\n`;
  const start = source.indexOf(marker, jobsStart);

  expect(jobsStart).toBeGreaterThanOrEqual(0);
  expect(start).toBeGreaterThanOrEqual(0);

  const remainder = source.slice(start + marker.length);
  const nextJob = remainder.search(/\n {2}[0-9A-Za-z_-]+:\n/u);
  return nextJob === -1 ? remainder : remainder.slice(0, nextJob);
}

function namedStepBlocks(source: string, stepName: string): string[] {
  const marker = `      - name: ${stepName}\n`;
  const blocks: string[] = [];
  let cursor = 0;

  while (true) {
    const start = source.indexOf(marker, cursor);
    if (start === -1) return blocks;

    const nextStep = source.indexOf("\n      - name:", start + marker.length);
    blocks.push(nextStep === -1 ? source.slice(start) : source.slice(start, nextStep));
    cursor = nextStep === -1 ? source.length : nextStep + 1;
  }
}

describe("npm release trust boundary", () => {
  it("uses hosted production OIDC publication without a write token", () => {
    expect(workflow).toContain("runs-on: ubuntu-latest");
    expect(workflow).toContain("environment: production");
    expect(workflow).toContain("id-token: write");
    expect(workflow).toContain("npm publish");
    expect(workflow).toContain("--provenance");
    expect(workflow).not.toMatch(/NPM_TOKEN|NODE_AUTH_TOKEN/u);
  });

  it("requires exact-main successful push CI and a supported runtime", () => {
    expect(workflow).toContain("Enforce exact-main successful CI");
    expect(workflow).toContain("refs/remotes/origin/main");
    expect(workflow).toContain("-f branch=main");
    expect(workflow).toContain("-f event=push");
    expect(workflow).toContain('-f head_sha="${EXPECTED_SHA}"');
    expect(workflow).toContain('conclusion == "success"');
    expect(workflow).toContain("Verify release runtime");
    expect(workflow).toContain('ACTUAL_NODE%%.*');
    expect(workflow).toContain('"11.5.1"');
  });

  it("always enforces the private-artifact policy before packaging", () => {
    const privacySteps = namedStepBlocks(workflow, "Verify private artifact policy");

    expect(privacySteps).toHaveLength(1);
    expect(privacySteps[0]).toContain("run: npm run privacy:check");
    expect(privacySteps[0]).not.toMatch(/^\s+if:/mu);
  });

  it("admits release preparation in a separate credential-free job", () => {
    const validation = jobBlock(releasePrepareWorkflow, "validate_release_admission");
    const prepare = jobBlock(releasePrepareWorkflow, "prepare");
    const validationPosition = releasePrepareWorkflow.indexOf(
      "\n  validate_release_admission:\n",
    );
    const preparePosition = releasePrepareWorkflow.indexOf("\n  prepare:\n");

    expect(validationPosition).toBeLessThan(preparePosition);
    expect(validation).toContain("permissions:\n      contents: read");
    expect(validation).toContain("persist-credentials: false");
    expect(validation).toContain("run: npm run privacy:check");
    expect(validation).not.toMatch(
      /create-github-app-token|RELEASE_PREP_APP_PRIVATE_KEY|GH_TOKEN|environment:/u,
    );

    expect(prepare).toContain("needs: validate_release_admission");
    expect(prepare).not.toContain("npm run privacy:check");
  });

  it("never persists credentials while checking out an exact workflow commit", () => {
    const exactCommitCheckouts = namedStepBlocks(workflow, "Checkout exact workflow commit");

    expect(exactCommitCheckouts).toHaveLength(2);
    for (const checkout of exactCommitCheckouts) {
      expect(checkout).toContain("persist-credentials: false");
    }
  });

  it("creates the immutable release tag through the scoped GitHub API", () => {
    const tagSteps = namedStepBlocks(
      workflow,
      "Ensure release tag points at exact main commit",
    );

    expect(tagSteps).toHaveLength(1);
    expect(tagSteps[0]).toContain('GH_TOKEN: ${{ github.token }}');
    expect(tagSteps[0]).toContain("--method POST");
    expect(tagSteps[0]).toContain('"repos/${GITHUB_REPOSITORY}/git/refs"');
    expect(tagSteps[0]).toContain('-f ref="refs/tags/${TAG}"');
    expect(tagSteps[0]).toContain('-f sha="${EXPECTED_SHA}"');
    expect(tagSteps[0]).not.toMatch(/git push[^\n]*refs\/tags/u);
    expect(workflow).not.toContain('git push origin "refs/tags/${TAG}"');
  });

  it("disables repository-controlled Git hooks in privileged release preparation", () => {
    const prepareStep = namedStepBlocks(
      releasePrepareWorkflow,
      "Prepare and land release metadata",
    );

    expect(prepareStep).toHaveLength(1);
    expect(prepareStep[0]).toContain('GIT_CONFIG_COUNT: "1"');
    expect(prepareStep[0]).toContain("GIT_CONFIG_KEY_0: core.hooksPath");
    expect(prepareStep[0]).toContain("GIT_CONFIG_VALUE_0: /dev/null");
  });

  it("permits a published package to resume an incomplete prepared release", () => {
    const prepareStep = namedStepBlocks(
      releasePrepareWorkflow,
      "Prepare and land release metadata",
    );

    expect(prepareStep).toHaveLength(1);
    expect(prepareStep[0]).toContain('REUSING_INCOMPLETE_RELEASE="false"');
    expect(prepareStep[0]).toContain('REUSING_INCOMPLETE_RELEASE="true"');
    expect(prepareStep[0]).toContain(
      'if [ "${BUMP}" != "none" ] && [ "${PUBLISHED}" = "true" ] && [ "${REUSING_INCOMPLETE_RELEASE}" != "true" ]; then',
    );
  });

  it("runs same-repository pull requests on explicit trusted runners only", () => {
    expect(ciWorkflow).toContain("pull_request:");
    expect(
      ciWorkflow.match(/runs-on:\n {6}group: Public CI - Quarantined/gu),
    ).toHaveLength(2);
    expect(
      ciWorkflow.match(/labels: \[self-hosted, Linux, X64\]/gu),
    ).toHaveLength(2);
    expect(ciWorkflow).toContain("github.event.pull_request.head.repo.full_name == github.repository");
    expect(ciWorkflow).not.toContain("pull_request_target");
    expect(ciWorkflow).not.toContain("fromJSON(vars.");
  });
});
