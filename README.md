# Structure Lab

A complete interactive JavaScript data structures presentation built with React, TypeScript, Vite, Framer Motion, Monaco Editor, and React Flow (`@xyflow/react`). No backend, account, API keys, or editor CDN required.

## Start

Install Node.js **20.19+ or 22.12+** and npm. Extract the archive, open a terminal in `structure-lab`, then:

```sh
npm ci
npm run dev
```

Open the local address printed by Vite (normally http://localhost:5173). Internet access is needed for the initial npm installation. After installation, the app and Monaco assets are served locally.

## Production

```sh
npm run build
npm run preview
```

Open the printed preview address (normally http://localhost:4173). Deploy the generated `dist/` directory to a static web host. A prebuilt `dist/` is also included in the release archive. Use an HTTP server; do not double-click `index.html` with a `file://` URL. Relative asset paths support hosting under a subdirectory. The deployment must allow same-origin workers and blob workers for the playground.

For a quick view of the included prebuilt app without installing npm dependencies, run `python3 -m http.server 8080 --directory dist` from the project folder and open http://localhost:8080 (requires Python 3).

## Docker

Build and run the production app with Docker; no local Node.js installation is required:

```sh
docker build -t structure-lab .
docker run --rm -p 8080:8080 --name structure-lab structure-lab
```

Open http://localhost:8080. Stop the foreground container with Ctrl+C. If port 8080 is occupied, use `-p 8081:8080` and open http://localhost:8081.

The multi-stage Dockerfile installs locked dependencies, runs the unit tests and production build, and copies only the compiled app into Nginx. The server runs as the unprivileged `nginx` user on port 8080 and includes an HTTP health check. Monaco and its workers are served from the same container. Image pulls and npm installation require internet access during the first build; runtime does not need an editor CDN. Base-image tags track Node 22 and stable Alpine Nginx updates; use `docker build --pull -t structure-lab .` to refresh them.

To run the existing browser tests against a running container (requires local npm dependencies and a Playwright browser):

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 npm run test:e2e
```

## What is included

| Module       | Interactive experience                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| Arrays       | Push, indexed read, insert, remove, clear                                                                   |
| Objects      | Set, read, delete string-key properties                                                                     |
| Map          | Set, get, delete string-key entries; object identity example in code                                        |
| Set          | Add, delete, membership, duplicate prevention                                                               |
| Stacks       | Push/pop and empty-stack feedback                                                                           |
| Queues       | Enqueue/dequeue and FIFO visualization                                                                      |
| Linked Lists | Prepend, append, remove head, reference arrows                                                              |
| Trees / BST  | Ordered insertion, duplicate handling, React Flow tree and inorder text view                                |
| Graphs       | Move nodes, add vertices, connect directed edges, keyboard edge editor                                      |
| Searching    | Linear and binary search, custom input and target                                                           |
| Sorting      | Bubble and insertion sort, custom input, comparisons and swaps                                              |
| BFS / DFS    | Queue/stack frontier, visited nodes, step/play/back/restart/speed controls                                  |
| Big O        | Input-size slider, five growth curves, linear/log axes, exact-count table                                   |
| Time & Space | Auxiliary-memory discussion and duplicate-detection trade-off                                               |
| Practice     | 17 mini-quizzes with explanations and local progress; runnable deduplication challenge with five test cases |

Use the sidebar or Previous/Next buttons to navigate. Left/right arrow keys also navigate outside form controls and the editor. Present hides the sidebar for a larger stage; Escape exits presentation mode. This is a layout mode, not browser fullscreen. URLs such as `#12` open a specific lesson.

Open **Code playground** on any lesson to edit and run its JavaScript. Monaco is lazy-loaded and locally bundled. The plain text editor is a keyboard-friendly alternative. The Practice lesson includes **Check challenge**, which tests a `unique(values)` function against five cases. Example solution: `return [...new Set(values)]`.

Quiz answers persist in localStorage. Use Reset quiz progress in Practice to clear them. Live demo state resets when changing lesson or switching away from the visual tab.

## Accessibility

Semantic controls, visible focus styles, input labels, a skip link, text status updates, quiz feedback, reduced-motion support, responsive layout, graph text equivalents, and a keyboard edge-creation form are included. The chart has an equivalent numeric table. Animation states use descriptions as well as colors. Browser tests cover a 390px mobile viewport. This is not a claim of a formal WCAG audit.

## Teaching and execution notes

- The visualizations use immutable React state. Linked-list boxes model nodes and links; the playground contains a real linked-node JavaScript example.
- The queue demo uses array `shift()` (O(n)). The BFS code example uses a head index to avoid that cost.
- BST is unbalanced: height can become n; it is not an AVL or red-black tree. Duplicate values are ignored.
- Graphs are directed. Edge insertion order determines neighbor order. BFS/DFS only visit vertices reachable from the chosen start. DFS marks discovered vertices when pushed.
- Arrays/trees are limited to 16 values and graphs to 12 vertices to keep slides legible. Numeric values must be finite and between −999 and 999.
- Binary search sorts a copy before tracing. The O(log n) claim applies to searching an already-sorted array, excluding preparation.
- Sort/search traces store snapshots. This teaching overhead is separate from the algorithm's auxiliary-space complexity. Graph trace generation filters an edge list and stores snapshots; the O(V+E) examples use adjacency lists.
- Typical Map/Set operations are described as O(1) with a caveat: JavaScript specifies average sublinear access, not a particular hash-table implementation.
- The runner executes synchronous JavaScript in a dedicated worker and terminates it after two seconds. It supports console output, not DOM access, imports, or persistent asynchronous tasks. It is not a hardened security sandbox: workers can access browser APIs such as network/storage. Run code you trust. The challenge checker is educational, not a secure grading service.
- Progress remains local to the current browser. No tracking or external fonts are used.

## Verify

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
# Optional: test the compiled build instead of the development server
TEST_PRODUCTION=1 npm run test:e2e
```

On Linux, Playwright may require browser system libraries; its installer will describe any missing dependencies. Tests run on port 43817 with a dedicated server. `tests/engine.test.ts` covers parsing, search, sorting, graph cycles/disconnected vertices, and BST invariants. `tests/browser/app.spec.ts` covers lesson navigation, mutations, animation, Monaco, code execution/timeouts, the challenge, mobile layout, and saved progress.

See `VERIFICATION.md` for results recorded for this release.

## Source map

- `src/App.tsx` — lesson shell, navigation, quiz persistence, presentation mode
- `src/lessons.ts` — lesson copy, examples, complexity notes, quizzes
- `src/Demos.tsx` — animated collection, algorithm, graph, tree, growth demos
- `src/engine.ts` — pure algorithm traces, parsing and tree layout
- `src/Playground.tsx` — local Monaco workers and bounded code runner
- `src/styles.css` — responsive visual design
- `tests/` — unit and browser verification

## Library documentation

- [React](https://react.dev/learn)
- [Vite](https://vite.dev/guide/)
- [Framer Motion](https://motion.dev/docs/react)
- [Monaco React integration](https://github.com/suren-atoyan/monaco-react)
- [React Flow](https://reactflow.dev/learn)

The project source is MIT licensed. Dependencies retain their own licenses. `package-lock.json` pins the resolved dependency tree.
