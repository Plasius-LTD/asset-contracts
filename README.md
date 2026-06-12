# @plasius/asset-contracts

Canonical contracts for Plasius asset jobs, manifests, screenshot plans, reviews, and promotion records.

## Install

```bash
npm install @plasius/asset-contracts
```

## Scope

This package is part of the unified AI asset pipeline package family. It is scaffolded from the @plasius/schema package template and owns the asset contracts boundary described in the Plasius asset pipeline design.

The exported surface covers:

- asset id and version validation helpers
- asset job metadata contracts
- manifest and file descriptor contracts
- screenshot plan definitions
- review findings and review report contracts
- immutable promotion record contracts

## Feature Flag

- `asset.pipeline.unified-ai-assets.enabled`

## Related Documents

- plasius-ltd-site `docs/Design/unified-ai-asset-pipeline.md`
- plasius-ltd-site `docs/adrs/adr-0084-unified-ai-asset-pipeline-packages.md`
- plasius-ltd-site `docs/tdrs/tdr-0004-unified-ai-asset-pipeline.md`

## Development

```bash
npm install
npm run build
npm test
npm run test:coverage
npm run pack:check
```

## Governance

- Security policy: [SECURITY.md](./SECURITY.md)
- Code of conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- ADRs: [docs/adrs](./docs/adrs)
- CLA and legal docs: [legal](./legal)

## License

Apache-2.0
