import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { patterns, Pattern, example, challenges } from "./patternEngine";
import { execute } from "./execution";
import { language, tr } from "./i18n";
import PatternDiagram from "./PatternDiagram";
const CodeLab = lazy(() => import("./CodeLab"));
const categories = ["creational", "structural", "behavioral"] as const;
const title = (category: string) =>
  category.charAt(0).toUpperCase() + category.slice(1);
const descriptions = [
  "Create objects without coupling clients to concrete classes.",
  "Compose objects into flexible, useful structures.",
  "Make responsibilities and collaboration explicit.",
];
function readProgress(): Record<string, number> {
  try {
    const parsed = JSON.parse(
      localStorage.getItem("structure-lab-pattern-answers") || "{}",
    );
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}
function Experiment({ pattern }: { pattern: Pattern }) {
  const [amount, setAmount] = useState(3),
    [alternate, setAlternate] = useState(false),
    [output, setOutput] = useState<string[]>([]),
    [running, setRunning] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  const run = async () => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setRunning(true);
    try {
      setOutput(
        await execute(example(pattern, amount, alternate), controller.signal),
      );
    } catch (error) {
      if (!controller.signal.aborted) setOutput([(error as Error).message]);
    } finally {
      if (active.current === controller) setRunning(false);
    }
  };
  return (
    <div className="experiment">
      <span className="eyebrow">{tr("Experiment")}</span>
      <h2>
        {tr("Predict the output, change the inputs, then run the example.")}
      </h2>
      <div className="experiment-controls">
        <label>
          {tr("Input value")}: <strong>{amount}</strong>
          <input
            type="range"
            min="1"
            max="9"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={alternate}
            onChange={(e) => setAlternate(e.target.checked)}
          />
          {pattern.variant[language()]}
        </label>
      </div>
      <div className="button-row">
        <button className="primary" disabled={running} onClick={run}>
          {tr("Run experiment")}
        </button>
        <button
          onClick={() => {
            active.current?.abort();
            setRunning(false);
            setAmount(3);
            setAlternate(false);
            setOutput([]);
          }}
        >
          {tr("Reset")}
        </button>
      </div>
      <div className="console">
        <span className="eyebrow">{tr("CONSOLE")}</span>
        <pre role="log" aria-live="polite">
          {output.map(tr).join("\n") ||
            tr("Ready. Edit the JavaScript and press Run.")}
        </pre>
      </div>
    </div>
  );
}
export default function Patterns({ route }: { route: string }) {
  useTranslation();
  const lang = language();
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [answers, setAnswers] = useState(readProgress);
  const id = route.split("/")[2];
  const pattern = patterns.find((p) => p.id === id);
  const [tab, setTab] = useState("visual");
  useEffect(() => setTab("visual"), [id]);
  useEffect(() => {
    try {
      localStorage.setItem(
        "structure-lab-pattern-answers",
        JSON.stringify(answers),
      );
    } catch {
      /* Local storage is optional. */
    }
  }, [answers]);
  const completed = patterns.filter((p) => answers[p.id] === p.correct).length;
  const visible = patterns.filter(
    (p) =>
      (filter === "all" || filter === p.category) &&
      `${p.name.en} ${p.name.fr} ${p.intent[lang]}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
  );
  const selected = pattern ? answers[pattern.id] : undefined;
  return (
    <main className="patterns-page" id="main">
      <div className="patterns-top">
        <a className="back-link" href={pattern ? "#/patterns" : "#/"}>
          ← {tr(pattern ? "Back to catalog" : "Home")}
        </a>
        <span className="eyebrow">
          {completed} / 22 {tr("mastered")}
        </span>
      </div>
      {!pattern ? (
        <>
          <div className="catalog-intro">
            <span className="eyebrow">02 / {tr("Design Patterns Lab")}</span>
            <h1>
              {tr("Reusable ideas. Tangible understanding.")}
              <span>.</span>
            </h1>
            <p className="subtitle">
              {tr(
                "Explore 22 patterns through problems, relationships and running code.",
              )}
            </p>
          </div>
          <div className="catalog-toolbar">
            <label className="search-field">
              {tr("Search patterns")}
              <input
                type="search"
                placeholder={tr("Search by name or intent…")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div
              className="filter-pills"
              role="group"
              aria-label={tr("Catalog")}
            >
              {["all", ...categories].map((c) => (
                <button
                  key={c}
                  aria-pressed={filter === c}
                  onClick={() => setFilter(c)}
                >
                  {tr(c === "all" ? "All patterns" : title(c))}{" "}
                  <span>
                    {c === "all"
                      ? 22
                      : patterns.filter((p) => p.category === c).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <p className="result-count" role="status">
            {visible.length} {tr("pattern results")}
          </p>
          {!visible.length && (
            <div className="empty-state">
              <p>{tr("No patterns found. Try another search.")}</p>
              <button
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
              >
                {tr("Clear filters")}
              </button>
            </div>
          )}
          {categories.map((c, i) => {
            const list = visible.filter((p) => p.category === c);
            return (
              list.length > 0 && (
                <section className={`pattern-category ${c}`} key={c}>
                  <div className="category-heading">
                    <span className="category-icon">{["◇", "◈", "↔"][i]}</span>
                    <div>
                      <h2>{tr(title(c))}</h2>
                      <p>{tr(descriptions[i])}</p>
                    </div>
                    <span className="category-count">0{i + 1}</span>
                  </div>
                  <div className="pattern-grid">
                    {list.map((p, index) => (
                      <motion.a
                        className="pattern-card"
                        href={`#/patterns/${p.id}`}
                        key={p.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.025, 0.15) }}
                      >
                        <div className="pattern-card-meta">
                          <span>
                            {String(patterns.indexOf(p) + 1).padStart(2, "0")}
                          </span>
                          <span>
                            {answers[p.id] === p.correct ? "✓" : "↗"}
                          </span>
                        </div>
                        <h3>{p.name[lang]}</h3>
                        <p>{p.intent[lang]}</p>
                        <div className="mini-diagram" aria-hidden="true">
                          <i />
                          <b>→</b>
                          <i />
                          <b>→</b>
                          <i />
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </section>
              )
            );
          })}
          <button className="quiet" onClick={() => setAnswers({})}>
            {tr("Reset pattern progress")}
          </button>
          <p className="source-note">
            {tr(
              "Original lessons. Educational organization inspired by Refactoring.Guru.",
            )}{" "}
            <a
              href="https://refactoring.guru/design-patterns"
              target="_blank"
              rel="noreferrer"
            >
              Refactoring.Guru ↗
            </a>
          </p>
        </>
      ) : (
        <>
          <div className="lesson-meta">
            <span className={`eyebrow ${pattern.category}`}>
              {tr(title(pattern.category))}
            </span>
            <span className="eyebrow">
              {String(patterns.indexOf(pattern) + 1).padStart(2, "0")} / 22
            </span>
          </div>
          <h1>
            {pattern.name[lang]}
            <span>.</span>
          </h1>
          <p className="subtitle">{pattern.intent[lang]}</p>
          <div className="pattern-lesson-grid">
            <section className="lab">
              <div className="lab-heading">
                <div
                  className="tabs"
                  role="tablist"
                  aria-label={tr("Lesson view")}
                >
                  {[
                    ["visual", "◈ Visualize"],
                    ["code", "Code"],
                    ["practice", "Practice"],
                  ]
                    .filter(
                      ([key]) => key !== "practice" || challenges[pattern.id],
                    )
                    .map(([key, label]) => (
                      <button
                        role="tab"
                        aria-selected={tab === key}
                        key={key}
                        onClick={() => setTab(key)}
                      >
                        {tr(label)}
                      </button>
                    ))}
                </div>
                <span className="live-dot">{tr("LIVE LAB")}</span>
              </div>
              <div className="lab-body" key={pattern.id}>
                {tab === "visual" ? (
                  <>
                    <PatternDiagram key={pattern.id} pattern={pattern} />
                    <Experiment key={`exp-${pattern.id}`} pattern={pattern} />
                  </>
                ) : (
                  <Suspense fallback={<p>{tr("Loading code playground…")}</p>}>
                    <CodeLab
                      key={`${pattern.id}-${tab}`}
                      pattern={pattern}
                      practice={tab === "practice"}
                    />
                  </Suspense>
                )}
              </div>
            </section>
            <aside className="pattern-notes">
              {(["problem", "solution", "tradeoff"] as const).map(
                (field, i) => (
                  <section key={field}>
                    <span className="eyebrow">
                      {tr(["Problem", "Solution", "Trade-offs"][i])}
                    </span>
                    <p>{pattern[field][lang]}</p>
                  </section>
                ),
              )}
            </aside>
          </div>
          <section className="quiz" aria-label={tr("Lesson quiz")}>
            <span className="eyebrow">{tr("QUICK CHECK")}</span>
            <h2>{pattern.question[lang]}</h2>
            <div className="quiz-options">
              {pattern.answers[lang].map((a, i) => (
                <button
                  key={i}
                  aria-pressed={selected === i}
                  className={
                    selected === i
                      ? i === pattern.correct
                        ? "correct"
                        : "incorrect"
                      : ""
                  }
                  onClick={() =>
                    setAnswers((old) => ({ ...old, [pattern.id]: i }))
                  }
                >
                  <span>{String.fromCharCode(65 + i)}</span>
                  {a}
                </button>
              ))}
            </div>
            {selected !== undefined && (
              <p
                className={`feedback ${selected === pattern.correct ? "correct-text" : ""}`}
                role="status"
              >
                <strong>
                  {tr(
                    selected === pattern.correct ? "Correct. " : "Try again. ",
                  )}
                </strong>
                {pattern.explanation[lang]}
              </p>
            )}
          </section>
          <footer>
            <a
              href={
                patterns.indexOf(pattern) > 0
                  ? `#/patterns/${patterns[patterns.indexOf(pattern) - 1].id}`
                  : "#/patterns"
              }
            >
              ← {tr("Previous pattern")}
            </a>
            <span>
              {tr(
                selected === pattern.correct
                  ? "Completed"
                  : "Finish the lesson quiz to save completion.",
              )}
            </span>
            <a
              href={
                patterns.indexOf(pattern) < 21
                  ? `#/patterns/${patterns[patterns.indexOf(pattern) + 1].id}`
                  : "#/patterns"
              }
            >
              {tr(
                patterns.indexOf(pattern) < 21
                  ? "Next pattern →"
                  : "Back to catalog",
              )}
            </a>
          </footer>
        </>
      )}
    </main>
  );
}
