# Verification — 16 October 2026

## Passed

- Node.js 20.20.2 / npm 10.8.2 dependency installation; exact resolutions saved in package-lock.json.
- `npm test`: **11 tests passed** covering empty/invalid inputs, signed numbers, duplicates, successful/unsuccessful searches, both sorting algorithms, cycle-safe BFS/DFS, disconnected vertices, and empty/skewed BSTs.
- `npm run build`: TypeScript strict checking and Vite production compilation passed.
- `TEST_PRODUCTION=1 npm run test:e2e`: **8 browser tests passed** against the compiled production build, using Chromium 156 on Linux (20.9 seconds).
- Browser coverage: all 17 lessons and quiz feedback; array and stack operations; Object/Map/Set and linked-list operations; binary search; sorting playback; full BFS/DFS visit order; graph selection during playback; BST insertion; directed-edge editing; complexity controls; presentation-mode exit; local Monaco loading; challenge execution; infinite-loop termination and subsequent recovery; quiz persistence; 390px mobile layout.
- Desktop (1440px) and mobile (390px) screenshots captured. Both layouts were visually inspected during development.
- The navigation smoke test reported no uncaught page errors across all lessons.

## Fixed during verification

- Isolated browser tests onto port 43817 so they cannot reuse an unrelated server on the usual preview port.
- Added explicit select labels and hid decorative navigation glyphs from accessible names.
- Fixed removal operations being unnecessarily blocked by an invalid add-value field.
- Decoupled graph traversal state from React Flow measurement/selection changes. Playback now resets only when topology, start vertex, or traversal type changes.

## Known limits

- Vite reports large chunks because Monaco includes its editor and JavaScript/TypeScript language worker. Monaco is lazy-loaded. Build output is approximately 9 MB uncompressed.
- Automated browser verification used Chromium; Firefox/Safari and a formal accessibility audit were not run.
- The teaching trace and code runner limitations are documented in README.md. This release does not require a backend or external editor CDN.

The release ZIP includes source, tests, configuration, lockfile, screenshots, and the verified dist/ build. node_modules, temporary browser files, and transient test reports are excluded. ZIP integrity and required entries were checked when packaging.

## Docker verification — 19 October 2026

- Built `Dockerfile` successfully on Linux/amd64 with Docker Engine 29.8.2 using `node:22-alpine` and `nginx:stable-alpine`.
- The image build passed all 11 unit tests, strict TypeScript checking, and Vite compilation.
- Started the runtime container on host port 43819 mapped to container port 8080. Nginx configuration validation passed; the process ran as UID 101 (`nginx`) and the Docker health check reported `healthy`.
- All 8 existing Playwright browser tests passed against the running Nginx container (17.7 seconds), including local Monaco workers, code execution, traversal playback and mobile layout.
- Additional HTTP checks confirmed app HTML, the JavaScript MIME type, immutable caching for hashed assets, revalidation for HTML, and real 404 responses for missing assets.
- The temporary verification container was stopped after testing. Build and run commands are in the README's Docker section.
