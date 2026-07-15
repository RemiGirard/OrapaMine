# Orapa Mine Cooperative

A landscape-first cooperative deduction game built with TanStack Start, React, and TypeScript.
The family asks for perimeter light clues and manipulates whole glass pieces on one shared answer
board.

## Run

```bash
npm install
npm run dev
```

The development server runs at `http://127.0.0.1:3000`.

## Single HTML

```bash
npm run build:single
```

This creates the self-contained `dist-single/orapa-mine.html` with the application JavaScript
and CSS embedded in the file.

## Verify

```bash
npm run typecheck
npm run test
npm run test:e2e
npm run lint
npm run build
npm run build:single
```

`npm run format` applies Prettier and ESLint fixes.

Playwright starts an isolated game server on `127.0.0.1:4173`. Install its
browser once with `npx playwright install chromium`; set
`PLAYWRIGHT_USE_SYSTEM_CHROME=1` to run the same suite against installed Chrome.

## Structure

The game lives in `src/modules/orapa-mine`:

- `domain`: pure board, mineral, optics, question, and family-solution rules.
- `application`: immutable use cases and session transitions.
- `infrastructure`: browser implementations of application ports.
- `presentation`: React feature components and colocated CSS modules.

See [docs/architecture.md](docs/architecture.md) for dependency rules and feature ownership,
[docs/orapa-mine-rules.md](docs/orapa-mine-rules.md) for the implemented rule model, and
[docs/reference-use-cases.md](docs/reference-use-cases.md) for the verified workflows.
