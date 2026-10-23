# ADR 0008: Package-Owned Issue Tracking

- Status: Accepted
- Date: 2026-10-23
- Tracking: site Task 1169; package Task 47; parent Feature 1153 / Epic 1147

## Context

GitHub Issues are enabled in `Plasius-LTD/asset-contracts`, but the README says
otherwise and `package.json` directs npm bug reports to the site repository.
That stale routing obscures package ownership. Feature 1153 also needs explicit
package Tasks for model resource contracts before implementation begins.

## Decision

Use this repository's enabled Issues for package bugs, support, and implementation
Tasks. Set `bugs.url` to `https://github.com/Plasius-LTD/asset-contracts/issues`
and document the same route in the published README. Confidential vulnerability
reports continue through `SECURITY.md`.

The organisation `Plasius-LTD-site` Project governs work definition, acceptance,
ownership, priority, and status. Epics, Features, and Stories remain in the site
repository. Package implementation Tasks are native children of their owning
Feature and Project members. Preserve historical issues and their links rather
than migrating or duplicating them.

Feature 1153 owns four follow-ups: package Tasks 48 (resource descriptors), 49
(conversion diagnostics), 50 (texture/resource roles), and 51 (promotion manifest
resource closure). The README links each exact Task. They begin as unassigned
Backlog/P2/M Project work; their live Project fields remain authoritative.
They must reuse and qualify existing public contracts and implement only
evidenced gaps. Completed GPU/model-resolution contracts and separate animation
and shader ABI Tasks retain their own scope.

These Tasks inherit `gpu.model.conversion.enabled`, evaluated by the backend
remote control plane for canonical adapter adoption. This documentation and
metadata change adds no runtime evaluation, capability, or flag mutation. Future
runtime Tasks must document enabled, disabled, and rollback behavior.

## Alternatives

Continuing the alternate site tracker would preserve stale routing and conflict
with the repository-owned implementation Task policy. Disabling package Issues
would unnecessarily change an already working tracker. Migrating historical
issues would break continuity without helping the requested follow-up work.

## Test and release implications

Regression tests compare npm bug metadata with the owning repository, verify
active README support/security links, and require all four follow-up links.
Verify Issues remain enabled and read back each Project field and native parent.
Run the existing frozen-install, tests, coverage, lint, types, build, package,
privacy, and dependency gates; no source/API or dependency-version change is
needed. npm's lockfile does not store `bugs.url`, so it need not change for this
metadata correction.

The support URL is public package metadata. Use a patch release through the
existing PR, exact-main push CI, and hosted `cd.yml` / `production` npm OIDC path
from ADR 0007. Verify registry support metadata, published documentation, package
integrity/provenance, and ESM/CJS/declarations. Do not assume a documentation-only
release exemption. A routing rollback is an ordinary reviewed metadata release;
it must not remove existing issues or reopen the disabled-tracker claim.
