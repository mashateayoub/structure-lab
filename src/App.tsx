import i18n, { tr } from "./i18n";
import { lazy, Suspense, useEffect, useState } from "react";
import { MotionConfig, motion } from "framer-motion";
import { lessons } from "./lessons";
import { Algorithm, Collection, Complexity, GraphDemo } from "./Demos";
const Playground = lazy(() => import("./Playground"));
function loadAnswers(): Record<string, number> {
  try {
    const value = JSON.parse(
      localStorage.getItem("structure-lab-answers") || "{}",
    );
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  } catch {
    return {};
  }
}
function initialSlide() {
  const index = Number(location.hash.slice(1));
  return Number.isInteger(index) && index >= 1 && index <= lessons.length
    ? index - 1
    : 0;
}
export default function App() {
  const [slide, setSlide] = useState(initialSlide),
    [tab, setTab] = useState<"visual" | "code">("visual"),
    [answers, setAnswers] = useState(loadAnswers),
    [present, setPresent] = useState(false),
    [menu, setMenu] = useState(false);
  const lesson = lessons[slide],
    selected = answers[lesson.name],
    completed = lessons.filter((l) => answers[l.name] === l.correct).length;
  const navigate = (n: number) => {
    setSlide(Math.max(0, Math.min(lessons.length - 1, n)));
    setMenu(false);
  };
  useEffect(() => {
    const onHash = () => {
      if (/^#\d+$/.test(location.hash)) setSlide(initialSlide());
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    history.replaceState(null, "", `#${slide + 1}`);
  }, [slide]);
  useEffect(() => {
    try {
      localStorage.setItem("structure-lab-answers", JSON.stringify(answers));
    } catch {
      /* Storage is optional. */
    }
  }, [answers]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (
        el.closest(
          'input,textarea,select,[contenteditable="true"],.monaco-editor',
        ) ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey
      )
        return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setSlide((s) => Math.min(lessons.length - 1, s + 1));
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSlide((s) => Math.max(0, s - 1));
      }
      if (e.key === "Escape") setPresent(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  function quiz(index: number) {
    setAnswers((a) => ({ ...a, [lesson.name]: index }));
  }
  const demo =
    slide <= 6 ? (
      <Collection name={lesson.name} />
    ) : slide === 7 || slide === 8 || slide === 11 || slide === 12 ? (
      <GraphDemo name={lesson.name} />
    ) : slide === 9 || slide === 10 ? (
      <Algorithm sort={slide === 10} />
    ) : slide === 13 || slide === 14 ? (
      <Complexity space={slide === 14} />
    ) : (
      <div className="practice-stage">
        <span className="large-number">
          {tr(completed)}
          <small>
            {tr("/")}
            {tr(lessons.length)}
          </small>
        </span>
        <h2>{tr("Concepts checked. Connections made.")}</h2>
        <p>
          {tr(
            "Choose a lesson to revisit its quiz, or open the code challenge below.",
          )}
        </p>
        <div className="practice-grid">
          {tr(
            lessons.map((l, i) => (
              <button key={l.name} onClick={() => navigate(i)}>
                <span aria-hidden="true">
                  {tr(answers[l.name] === l.correct ? "✓" : "○")}
                </span>
                {tr(l.name)}
              </button>
            )),
          )}
        </div>
        <div className="button-row">
          <button className="primary" onClick={() => setTab("code")}>
            {tr(
              slide === 15
                ? "Open coding challenge"
                : "Open JavaScript example",
            )}
          </button>
          <button onClick={() => setAnswers({})}>
            {tr("Reset quiz progress")}
          </button>
        </div>
      </div>
    );
  return (
    <MotionConfig reducedMotion="user">
      <div className={`app ${present ? "present" : ""}`}>
        <a
          href="#main"
          className="skip"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("main")?.focus();
          }}
        >
          {tr("Skip to lesson")}
        </a>
        <aside className={menu ? "open" : ""}>
          <a className="brand" href="#1" onClick={() => navigate(0)}>
            <span className="brand-mark">
              {tr("s")}
              <span>{tr("↗")}</span>
            </span>
            <div>
              {tr("structure")}
              <span>{tr("LAB / JAVASCRIPT")}</span>
            </div>
          </a>
          <p className="sidebar-caption">{tr("YOUR LEARNING PATH")}</p>
          <nav aria-label={tr("Lessons")}>
            {tr(
              [...new Set(lessons.map((l) => l.group))].map((group, i) => (
                <div className="nav-group" key={group}>
                  <p>
                    <span>
                      {tr("0")}
                      {tr(i + 1)}
                    </span>{" "}
                    {tr(group)}
                  </p>
                  {tr(
                    lessons.map((l, index) =>
                      l.group === group ? (
                        <button
                          aria-current={slide === index ? "step" : undefined}
                          className={slide === index ? "selected" : ""}
                          key={l.name}
                          onClick={() => navigate(index)}
                        >
                          {tr(l.name)}
                          <span aria-hidden="true">
                            {tr(
                              answers[l.name] === l.correct
                                ? "✓"
                                : slide === index
                                  ? "↗"
                                  : "",
                            )}
                          </span>
                        </button>
                      ) : null,
                    ),
                  )}
                </div>
              )),
            )}
          </nav>
          <div className="sidebar-footer">
            <span>{tr("Knowledge, in motion.")}</span>
            <small>{tr("17 lessons · learn at your pace")}</small>
          </div>
        </aside>
        <main id="main" tabIndex={-1}>
          <header>
            <button
              className="menu-toggle"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {tr("☰ Lessons")}
            </button>
            <span className="breadcrumb">
              {tr("The interactive classroom")}
              <span>{tr("/")}</span> {tr(lesson.group)}
            </span>
            <div className="header-actions">
              <span className="progress-label">
                {i18n.t("{{n}} / 17 mastered", { n: completed })}
              </span>
              <button onClick={() => setPresent(!present)}>
                {tr(present ? "Exit presentation" : "Present ↗")}
              </button>
            </div>
          </header>
          <div className="content">
            <div className="lesson-meta">
              <span className="eyebrow">{tr(lesson.tag)}</span>
              <span className="lesson-number">
                {i18n.t("LESSON {{n}}", {
                  n: String(slide + 1).padStart(2, "0"),
                })}{" "}
                <span>{tr("/ 17")}</span>
              </span>
            </div>
            <motion.div
              key={lesson.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1>
                {tr(lesson.name)}
                <span>{tr(".")}</span>
              </h1>
              <p className="subtitle">{tr(lesson.description)}</p>
            </motion.div>
            <div className="lesson-layout">
              <section className="lab">
                <div className="lab-heading">
                  <div
                    className="tabs"
                    role="tablist"
                    aria-label={tr("Lesson view")}
                  >
                    <button
                      role="tab"
                      aria-selected={tab === "visual"}
                      onClick={() => setTab("visual")}
                    >
                      {tr("◈ Visualize")}
                    </button>
                    <button
                      role="tab"
                      aria-selected={tab === "code"}
                      onClick={() => setTab("code")}
                    >
                      {tr("⌘ Code playground")}
                    </button>
                  </div>
                  <span className="live-dot">{tr("LIVE LAB")}</span>
                </div>
                <div className="lab-body" key={lesson.name}>
                  {tr(
                    tab === "visual" ? (
                      demo
                    ) : (
                      <Suspense
                        fallback={<p>{tr("Loading code playground…")}</p>}
                      >
                        <Playground
                          initial={tr(lesson.code)}
                          challenge={slide === 15}
                        />
                      </Suspense>
                    ),
                  )}
                </div>
              </section>
              <aside className="lesson-notes">
                <span className="eyebrow">{tr("THE IDEA")}</span>
                <h2>{tr("Build your intuition.")}</h2>
                <p>{tr(lesson.concept)}</p>
                <div className="complexity-note">
                  <small>{tr("TIME COMPLEXITY")}</small>
                  <strong>{tr(lesson.time)}</strong>
                </div>
                <div className="complexity-note">
                  <small>{tr("SPACE COMPLEXITY")}</small>
                  <strong>{tr(lesson.space)}</strong>
                </div>
                <p className="note">
                  {tr(
                    "Experiment first. Predict what happens next, then try it.",
                  )}
                </p>
              </aside>
            </div>
            <section className="quiz" aria-label={tr("Lesson quiz")}>
              <div>
                <span className="eyebrow">{tr("QUICK CHECK")}</span>
                <h2>{tr(lesson.question)}</h2>
              </div>
              <div className="quiz-options">
                {tr(
                  lesson.answers.map((answer, i) => (
                    <button
                      key={answer}
                      aria-pressed={selected === i}
                      className={
                        selected === i
                          ? i === lesson.correct
                            ? "correct"
                            : "incorrect"
                          : ""
                      }
                      onClick={() => quiz(i)}
                    >
                      <span>{tr(String.fromCharCode(65 + i))}</span>
                      {tr(answer)}
                    </button>
                  )),
                )}
              </div>
              {tr(
                selected !== undefined && (
                  <p
                    role="status"
                    className={
                      selected === lesson.correct
                        ? "feedback correct-text"
                        : "feedback"
                    }
                  >
                    <strong>
                      {tr(
                        selected === lesson.correct
                          ? "Correct. "
                          : "Try again. ",
                      )}
                    </strong>
                    {tr(lesson.explanation)}
                  </p>
                ),
              )}
            </section>
            <footer>
              <button
                disabled={slide === 0}
                onClick={() => navigate(slide - 1)}
              >
                {tr("← Previous")}
              </button>
              <span>{tr("Use ← → to move between lessons")}</span>
              <button
                className="primary"
                disabled={slide === lessons.length - 1}
                onClick={() => navigate(slide + 1)}
              >
                {tr("Next lesson →")}
              </button>
            </footer>
            <div
              className="bottom-progress"
              aria-label={`Lesson ${slide + 1} of 17`}
            >
              <div
                style={{ width: `${((slide + 1) / lessons.length) * 100}%` }}
              />
            </div>
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}
