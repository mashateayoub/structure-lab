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
          {completed}
          <small> / {lessons.length}</small>
        </span>
        <h2>Concepts checked. Connections made.</h2>
        <p>
          Choose a lesson to revisit its quiz, or open the code challenge below.
        </p>
        <div className="practice-grid">
          {lessons.map((l, i) => (
            <button key={l.name} onClick={() => navigate(i)}>
              <span aria-hidden="true">
                {answers[l.name] === l.correct ? "✓" : "○"}
              </span>
              {l.name}
            </button>
          ))}
        </div>
        <div className="button-row">
          <button className="primary" onClick={() => setTab("code")}>
            {slide === 15 ? "Open coding challenge" : "Open JavaScript example"}
          </button>
          <button onClick={() => setAnswers({})}>Reset quiz progress</button>
        </div>
      </div>
    );
  return (
    <MotionConfig reducedMotion="user">
      <div className={`app ${present ? "present" : ""}`}>
        <a href="#main" className="skip">
          Skip to lesson
        </a>
        <aside className={menu ? "open" : ""}>
          <a className="brand" href="#1" onClick={() => navigate(0)}>
            <span className="brand-mark">
              s<span>↗</span>
            </span>
            <div>
              structure<span>LAB / JAVASCRIPT</span>
            </div>
          </a>
          <p className="sidebar-caption">YOUR LEARNING PATH</p>
          <nav aria-label="Lessons">
            {[...new Set(lessons.map((l) => l.group))].map((group, i) => (
              <div className="nav-group" key={group}>
                <p>
                  <span>0{i + 1}</span> {group}
                </p>
                {lessons.map((l, index) =>
                  l.group === group ? (
                    <button
                      aria-current={slide === index ? "step" : undefined}
                      className={slide === index ? "selected" : ""}
                      key={l.name}
                      onClick={() => navigate(index)}
                    >
                      {l.name}
                      <span aria-hidden="true">
                        {answers[l.name] === l.correct
                          ? "✓"
                          : slide === index
                            ? "↗"
                            : ""}
                      </span>
                    </button>
                  ) : null,
                )}
              </div>
            ))}
          </nav>
          <div className="sidebar-footer">
            <span>Knowledge, in motion.</span>
            <small>17 lessons · learn at your pace</small>
          </div>
        </aside>
        <main id="main">
          <header>
            <button
              className="menu-toggle"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              ☰ Lessons
            </button>
            <span className="breadcrumb">
              The interactive classroom <span>/</span> {lesson.group}
            </span>
            <div className="header-actions">
              <span className="progress-label">{completed} / 17 mastered</span>
              <button onClick={() => setPresent(!present)}>
                {present ? "Exit presentation" : "Present ↗"}
              </button>
            </div>
          </header>
          <div className="content">
            <div className="lesson-meta">
              <span className="eyebrow">{lesson.tag}</span>
              <span className="lesson-number">
                LESSON {String(slide + 1).padStart(2, "0")} <span>/ 17</span>
              </span>
            </div>
            <motion.div
              key={lesson.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1>
                {lesson.name}
                <span>.</span>
              </h1>
              <p className="subtitle">{lesson.description}</p>
            </motion.div>
            <div className="lesson-layout">
              <section className="lab">
                <div className="lab-heading">
                  <div className="tabs" role="tablist" aria-label="Lesson view">
                    <button
                      role="tab"
                      aria-selected={tab === "visual"}
                      onClick={() => setTab("visual")}
                    >
                      ◈ Visualize
                    </button>
                    <button
                      role="tab"
                      aria-selected={tab === "code"}
                      onClick={() => setTab("code")}
                    >
                      ⌘ Code playground
                    </button>
                  </div>
                  <span className="live-dot">LIVE LAB</span>
                </div>
                <div className="lab-body" key={lesson.name}>
                  {tab === "visual" ? (
                    demo
                  ) : (
                    <Suspense fallback={<p>Loading code playground…</p>}>
                      <Playground
                        initial={lesson.code}
                        challenge={slide === 15}
                      />
                    </Suspense>
                  )}
                </div>
              </section>
              <aside className="lesson-notes">
                <span className="eyebrow">THE IDEA</span>
                <h2>Build your intuition.</h2>
                <p>{lesson.concept}</p>
                <div className="complexity-note">
                  <small>TIME COMPLEXITY</small>
                  <strong>{lesson.time}</strong>
                </div>
                <div className="complexity-note">
                  <small>SPACE COMPLEXITY</small>
                  <strong>{lesson.space}</strong>
                </div>
                <p className="note">
                  Experiment first. Predict what happens next, then try it.
                </p>
              </aside>
            </div>
            <section className="quiz" aria-label="Lesson quiz">
              <div>
                <span className="eyebrow">QUICK CHECK</span>
                <h2>{lesson.question}</h2>
              </div>
              <div className="quiz-options">
                {lesson.answers.map((answer, i) => (
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
                    <span>{String.fromCharCode(65 + i)}</span>
                    {answer}
                  </button>
                ))}
              </div>
              {selected !== undefined && (
                <p
                  role="status"
                  className={
                    selected === lesson.correct
                      ? "feedback correct-text"
                      : "feedback"
                  }
                >
                  <strong>
                    {selected === lesson.correct ? "Correct. " : "Try again. "}
                  </strong>
                  {lesson.explanation}
                </p>
              )}
            </section>
            <footer>
              <button
                disabled={slide === 0}
                onClick={() => navigate(slide - 1)}
              >
                ← Previous
              </button>
              <span>Use ← → to move between lessons</span>
              <button
                className="primary"
                disabled={slide === lessons.length - 1}
                onClick={() => navigate(slide + 1)}
              >
                Next lesson →
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
