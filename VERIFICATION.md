# Verification — 24 October 2026

The existing Structures Lab repository was updated in place. This release adds the two-lab landing page, 22-pattern Design Patterns Lab, and English/French support across both labs.

## Results

- `npm test`: **67 tests passed** (11 existing algorithm/structure tests, 30 pattern curriculum/example/exercise tests, 2 localization tests, and 24 layout tests).
- `npm run build`: **passed**, including strict TypeScript checking of application code and a Vite production build.
- All 22 JavaScript examples and their transpiled TypeScript versions were exercised with inputs 1, 3, and 7 in both modes (132 JS/TS result comparisons).
- Semantic TypeScript checks on the 22 generated TypeScript examples passed with the editor's non-strict implicit-parameter typing settings; application source uses the project's strict TypeScript configuration.
- **17 Playwright browser tests passed against the production build** served at `http://127.0.0.1:43818`, using the installed Google Chrome browser on Linux.
- The earlier 13-test browser suite also passed against the development server; the two added editor checks were verified against production.
- Dependency installation after upgrading the development test runner to Vitest 4.1.12 reported **0 vulnerabilities**.
- `git diff --check`: passed.

## Diagram readability update

All 22 patterns use deliberate role-based placement, spaced connection ports, rounded right-angle routes, readable node sizes, and opaque label backgrounds. Reverse and long delegation routes are kept outside the main hierarchy. Custom nodes support dragging, with Auto arrange and Fit diagram controls. Trees center parents over child subtrees and keep same-level nodes at least 140 layout pixels apart. Graph arrangement handles cycles and disconnected vertices without changing edge order, topology, or traversal state. Sequence diagrams retain a single horizontally scrollable row; large graph diagrams scroll inside their panel and initially center the view on narrow screens.

Browser geometry checks verified that initial node boxes and relationship labels do not overlap in any of the 22 patterns, in both English and French. Checks also verified graph dragging, restoring arrangement during a traversal without resetting progress, and mobile overflow behavior. Screenshots include `preview-pattern-diagram.png` and `preview-tree-mobile.png`.

## Browser coverage

- All original structure lessons and quizzes, collection mutations, stack underflow, keyed collections, linked lists, tree insertion, graph editing, BFS/DFS, sorting/search playback, performance controls, and presentation mode.
- Monaco syntax highlighting and automatic language-service completions are verified in both labs, including JavaScript and TypeScript. The checks measure rendered token colors, type a member-access dot, select an actual method suggestion, and confirm the inserted completion.
- Local Monaco loading, JavaScript execution, deduplication challenge grading, two-second termination of infinite loops, and mobile navigation/progress persistence.
- Both landing cards, all 22 catalog entries, category filters, bilingual search, and empty search recovery.
- Every pattern lesson in both English and French: correct title, diagram nodes, relationship stepping, actual experiment execution in both modes, quiz feedback, and persisted completion.
- Pattern JavaScript/TypeScript editor execution, failing and repaired code exercises, and timeout behavior.
- French browser-default detection, persisted explicit English selection, FR → EN switching in catalog/details, retained structure quiz progress, and translated dynamic feedback.
- Landing, catalog, pattern detail, and structure lesson layouts at 390px width, including French labels, without horizontal overflow.

Screenshots were inspected for the dark landing page and responsive presentation. Browser page-error listeners reported no uncaught errors during the full pattern and structure walkthroughs.

## Scope and limits

- Pattern diagrams are simplified relationship maps with labeled arrows, animation, stepping, and text equivalents, not exhaustive formal UML.
- All 22 patterns have interactive runnable demonstrations, JS/TS examples and quizzes. Six have code repair exercises: Adapter, Composite, Proxy, Command, Observer, and Strategy.
- The 22-pattern catalog matches the requested reference. Interpreter, from the original 23-pattern GoF book, is not part of that reference catalog.
- TypeScript is transpiled locally. Code identifiers and runtime values remain stable across languages; application explanations and feedback are localized.
- The editor/compiler worker assets are large and emit non-failing Vite chunk-size warnings. Editor and compiler loading is deferred until needed.
- Workers provide bounded synchronous execution, not security isolation for hostile code.
- Docker deployment files are retained from the existing project. The Docker image was not rebuilt for this release; current verification used local Node and the production Vite output.

The release package includes source, tests, configuration, dependency lockfile, updated screenshots, and the production `dist/` build. Dependencies, repository metadata, scratch files, and transient test reports are excluded.
