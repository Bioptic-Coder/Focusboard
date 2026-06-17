# Repository Guidelines

## Project Structure & Module Organization
Focusboard is a React 19, TypeScript, Vite, and Tailwind CSS v4 PWA. Application code lives in `src/`; `src/App.tsx` coordinates the dashboard, `src/components/` holds shared UI, and `src/components/widgets/` contains individual widgets. Tests are colocated as `*.test.tsx`. Shared test setup and browser API mocks live in `src/test/setup.ts`. Static PWA assets are in `public/`, including `manifest.json`, `sw.js`, and icons. Build output goes to `dist/` and should not be edited directly.

## Build, Test, and Development Commands
- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the local Vite dev server.
- `npm run dev -- --host`: expose the dev server on the local network for iPad testing.
- `npm run build`: run TypeScript builds, then produce the production Vite bundle.
- `npm run lint`: run ESLint across the repository.
- `npx vitest run`: run the Vitest suite once; use `npx vitest` for watch mode.
- `npm run preview`: serve the production build locally.
- `docker compose up --build -d`: build and serve the app at `http://localhost:8080`.

## Coding Style & Naming Conventions
Use TypeScript, functional React components, hooks, and semantic JSX. Name components and widget files in `PascalCase`, for example `ClockWidget.tsx`; mirror test names as `ClockWidget.test.tsx`. Prefer relative sizing (`rem`, `em`, `%`, `vh`, `vw`) so global zoom scales cleanly. Use CSS custom properties from `src/index.css` for theme-aware colors. Keep controls keyboard and screen-reader accessible.

## Testing Guidelines
Use Vitest, React Testing Library, `jsdom`, and the shared setup file in `src/test/setup.ts`. Place new tests next to the component they cover. Mock reused browser-only APIs, persistence, or audio behavior in setup. Run `npx vitest run` and `npm run build` after behavioral changes.

## Commit & Pull Request Guidelines
Recent history uses concise imperative commits, often with Conventional Commit prefixes such as `feat:`, `fix:`, `docs:`, and `test:`. Keep each commit focused. Pull requests should describe the user-facing change, list verification commands run, link related issues when applicable, and include screenshots or recordings for visual dashboard changes.

## Security & Configuration Tips
Focusboard is designed to work offline. Do not add runtime dependencies on external scripts, fonts, media, or unauthenticated network assets. Keep persistent widget state and user settings in `localStorage`, and preserve PWA behavior in `public/manifest.json`, `public/sw.js`, and `index.html`.
