# Portfolio Rated

React + TypeScript frontend for Login → Portfolio → Report.

## Run the full app

With this repository beside `portfolio-rated-backend`:

```sh
docker compose -f ../portfolio-rated-backend/docker-compose.yml up --build -d
```

Open http://localhost:8080. Local login:
`demo@example.com` / `local-portfolio-password`.

## Frontend development

Keep the Compose API running, then:

```sh
npm ci
npm run dev
```

Node 24 is used by the Docker build. Vite proxies `/api` to localhost:8000.
The production frontend is served by nginx with the same API paths.

## Structure

- `src/App.tsx`: session restoration and three views using React state.
- `src/api/client.ts`: fetch, request timeout, cookie credentials and error boundary.
- `src/api/portfolio.ts`: portfolio API calls and runtime response validation.
- `src/features/auth/`: sign-in UI and session API.
- `src/features/portfolio/`: input, report, TypeScript contract and Zod validation.
- `src/config.ts`: public browser configuration.
- `tests/`: component and API-boundary tests.
- `e2e/`: Playwright test against the built Compose application.

There is no client-side auth token storage, mock authentication, router dependency
or global state library. Reloading restores the latest saved report from the API;
unsaved edits are kept only in memory. The three views do not have separate URLs.

The report shows actual allocation statistics calculated by the backend. It does
not display invented risk ratings or inferred market exposure.

## Quality gates

```sh
npm run lint
npm run format:check
npm run test:run
npm run build
```

With Compose running:

```sh
npx playwright install chromium
npm run test:e2e
```

Playwright is a development dependency only. The browser test saves a report in
the local account, verifies refresh persistence and checks a mobile viewport.
