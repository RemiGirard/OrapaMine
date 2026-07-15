# Contributing

Contributions are welcome when they preserve the cooperative deduction model, accessibility, and the dependency rules documented in `docs/architecture.md`.

## Setup

```bash
npm ci
npx playwright install chromium
npm run dev
```

## Before opening a pull request

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm run build:single
```

Keep domain rules independent of React and browser APIs. Put browser adapters in `infrastructure`, orchestration in `application`, and interaction/rendering code in `presentation`. Add focused tests for every changed behavior, with Playwright coverage for browser-only interactions.

Do not commit generated build directories, local environment files, recordings, or commercial game assets.
