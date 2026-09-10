I'm building a small but production-quality portfolio analysis application primarily as a strong engineering/portfolio project. The product itself should remain intentionally simple; code quality, architecture, testing, security, deployment and maintainability matter more than feature count.

OVERALL SYSTEM

Frontend:

- React
- TypeScript
- Vite
- ESLint
- Prettier
- Vitest
- React Testing Library
- Zod where runtime/client-side validation is useful
- Native fetch unless there is a concrete reason to introduce another HTTP client

Backend will be a separate repository:

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic
- PostgreSQL
- pytest

Infrastructure will eventually be:

- Dockerized frontend/backend
- GCP
- Cloud Run
- Cloud SQL/PostgreSQL
- HTTPS Load Balancer
- Artifact Registry
- Secret Manager
- GitHub Actions CI/CD
- dev/staging/prod environments
- likely Terraform later
- custom domain
- production routing approximately:
  / -> frontend
  /api/* -> backend
  so frontend/backend can operate through the same origin.

Do NOT prematurely introduce Kubernetes, microservices, Kafka, Redis, Redux, GraphQL, complex state management, etc.

FRONTEND REPOSITORY

Current repository is intentionally bare bones:

portfolio-rated-frontend/
├── docs/
├── public/
├── src/
│ ├── assets/
│ ├── App.css
│ ├── App.tsx
│ ├── index.css
│ └── main.tsx
├── tests/
│ ├── App.test.tsx
│ └── setup.ts
├── .gitignore
├── .prettierignore
├── .prettierrc
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── README.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts

Vitest setup is in:
tests/setup.ts

Tests currently live in the top-level tests/ directory.

Quality gates should remain:

npm run lint
npm run format:check
npm run test:run
npm run build

ARCHITECTURAL PRINCIPLES

Keep this client LIGHT.

Do not generate a giant enterprise-style folder hierarchy.

Do not create generic abstractions/folders merely because they are common in tutorials.

Prefer feature-oriented structure where useful.

Likely initial structure:

src/
├── api/
│ ├── client.ts
│ └── portfolio.ts
├── components/
│ └── [only genuinely shared components]
├── features/
│ ├── auth/
│ └── portfolio/
│ ├── components/
│ ├── schemas.ts
│ └── types.ts
├── App.tsx
├── config.ts
├── index.css
└── main.tsx

Tests can remain under:

tests/
├── App.test.tsx
└── setup.ts

Add further files/directories only when they solve an actual problem.

Avoid "AI-generated architecture": no unnecessary factories, wrappers, providers, hooks, services, helpers, repositories, utility layers, etc.

Code should look like something an experienced developer deliberately wrote.

FRONTEND SECURITY PRINCIPLES

- Never put secrets/API keys in VITE_* environment variables.
- Treat everything shipped to the browser as public.
- Client validation is for UX; backend validation remains authoritative.
- Validate important inputs.
- Avoid dangerouslySetInnerHTML.
- Don't persist sensitive information unnecessarily.
- Don't expose technical/backend errors directly to users.
- Use HTTPS in deployed environments.
- Eventually configure appropriate security headers/CSP at infrastructure/web-server level.
- Keep dependencies minimal.

CONFIGURATION

Use a central config boundary rather than accessing import.meta.env throughout the application.

Example concept:

src/config.ts

const apiUrl = import.meta.env.VITE_API_URL

export const config = {
apiUrl,
} as const

Eventually production should preferably use same-origin /api routing.

CURRENT PRODUCT FLOW

Implement the first functional frontend.

The desired flow is:

1. Authentication page
2. Portfolio input page
3. Portfolio report page

Keep authentication lightweight for now. The real backend/auth implementation will come later.

The UI should nevertheless be structured so real authentication can replace the temporary implementation without rewriting the entire application.

PAGE 1 — AUTH

Create a minimal login screen.

Something approximately like:

Portfolio Rated

[ Email ]
[ Password ]

[ Sign in ]

No social login, registration flow, password recovery, giant auth framework, etc. yet.

For the current frontend-only implementation, use a clearly identified development/mock authentication boundary rather than pretending authentication is secure.

Do NOT hard-code something that could accidentally be mistaken for production authentication.

After successful mock login, navigate to the portfolio input screen.

PAGE 2 — PORTFOLIO INPUT

The core UI should allow the user to construct a portfolio.

Example:

Portfolio
──────────────────────────────────────

Ticker / Asset Allocation

[ AVWC ] [ 60 ] %
[ AVWS ] [ 25 ] %
[ AVEM ] [ 15 ] %

                 [ + Add position ]

Total allocation: 100%

                 [ Analyse portfolio ]

Requirements:

- dynamically add/remove positions
- ticker/asset field
- allocation percentage
- validation
- allocations must total 100% before analysis
- sensible maximum number of positions
- clear validation messages
- keyboard accessible
- good semantic HTML
- no unnecessary complexity

Use Zod for the portfolio validation if appropriate.

Define explicit TypeScript types for the eventual backend contract.

Something conceptually similar to:

interface PortfolioPosition {
ticker: string
allocation: number
}

interface PortfolioAnalysisRequest {
positions: PortfolioPosition[]
}

PAGE 3 — REPORT

After submission, show a report screen.

For now this can use deterministic MOCK DATA behind a clearly defined API boundary because the FastAPI backend isn't connected yet.

Example:

Portfolio Rating

82 / 100

Diversification 91
Concentration 88
Risk 76
Geographic Exposure 74

Observations

- Portfolio is strongly diversified across developed markets.
- Largest position represents 60% of portfolio.
- Emerging market exposure is relatively small.

[ Edit portfolio ]

Design this so replacing the mock implementation with:

POST /api/v1/portfolio/analyse

later is straightforward.

Do not spread fake API logic throughout React components.

DESIGN DIRECTION

The application should look deliberately designed but restrained.

Think:

- professional financial tooling
- clean SaaS/dashboard
- subtle institutional/terminal influence
- excellent spacing and typography
- restrained neutral palette
- strong hierarchy
- responsive
- accessible
- no visual clutter

Avoid stereotypical AI-generated UI:

- no excessive gradients
- no giant glowing hero section
- no glassmorphism everywhere
- no dozens of rounded cards
- no unnecessary icons
- no marketing copy
- no excessive animations
- no fake statistics
- no huge border radii
- no emoji
- no "Unlock the power of your portfolio" copy
- no needless dashboard sidebar for three screens

The application should feel more like a small professional financial tool than a startup landing-page template.

CSS Modules or simple well-structured CSS are preferred. Do not introduce a large component/UI framework just to build these three screens.

TESTING

Add meaningful tests around user-visible behavior rather than implementation details.

At minimum cover:

- login flow
- portfolio screen renders after login
- adding a portfolio position
- removing a position
- invalid allocation is rejected
- total allocation != 100% prevents analysis
- valid portfolio can be submitted
- resulting report is displayed
- edit portfolio returns to the input screen

Prefer queries such as:

screen.getByRole(...)
screen.getByLabelText(...)

rather than brittle selectors.

Don't chase arbitrary test coverage percentages.

IMPLEMENTATION APPROACH

First inspect the existing repository and configuration before changing anything.

Preserve the existing ESLint/Prettier/Vitest/TypeScript setup unless there is an actual problem.

Then:

1. Remove the default Vite demo UI/assets that are no longer necessary.
2. Establish the minimal application structure.
3. Implement lightweight navigation between auth -> portfolio -> report.
4. Implement mock auth behind an explicit boundary.
5. Implement portfolio types/schema.
6. Implement portfolio input UI.
7. Implement mock portfolio analysis behind the API boundary.
8. Implement report UI.
9. Add meaningful tests.
10. Run and fix:
    npm run lint
    npm run format:check
    npm run test:run
    npm run build

Do not add dependencies without explaining what concrete problem they solve.

If routing between these three views can reasonably remain simple without React Router, keep it simple. If you believe React Router is justified, explain why before adding it.

Likewise, do not add Redux or another global state library. React's built-in state is sufficient at this stage.
