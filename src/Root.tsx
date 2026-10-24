import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, MotionConfig } from "framer-motion";
import i18n, { tr } from "./i18n";
import Structures from "./App";
const Patterns = lazy(() => import("./Patterns"));
export function LanguageSwitch() {
  const { i18n } = useTranslation();
  return (
    <div className="language-switch" role="group" aria-label={tr("Language")}>
      {["en", "fr"].map((lang) => (
        <button
          key={lang}
          lang={lang}
          aria-pressed={i18n.resolvedLanguage === lang}
          onClick={() => i18n.changeLanguage(lang)}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
export default function Root() {
  const [hash, setHash] = useState(location.hash);
  const { t } = useTranslation();
  useEffect(() => {
    const change = () => {
      setHash(location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage || "en";
    document.title = `Structure Lab · ${t("Knowledge, in motion.")}`;
  }, [t]);
  const patterns = hash.startsWith("#/patterns");
  const structures = /^#\d+$/.test(hash) || hash.startsWith("#/structures");
  return (
    <MotionConfig reducedMotion="user">
      <div className="global-bar">
        <a className="global-brand" href="#/">
          s↗{" "}
          <span>
            structure<span className="brand-suffix">LAB</span>
          </span>
        </a>
        <nav aria-label={tr("Choose a lab")}>
          <a
            href="#/"
            aria-current={!structures && !patterns ? "page" : undefined}
          >
            {tr("Home")}
          </a>
          <a href="#1" aria-current={structures ? "page" : undefined}>
            {tr("Structures Lab")}
          </a>
          <a href="#/patterns" aria-current={patterns ? "page" : undefined}>
            {tr("Design Patterns Lab")}
          </a>
        </nav>
        <LanguageSwitch />
      </div>
      {patterns ? (
        <Suspense
          fallback={<p className="content">{tr("Loading code playground…")}</p>}
        >
          <Patterns route={hash} />
        </Suspense>
      ) : structures ? (
        <Structures />
      ) : (
        <main className="landing" id="main">
          <div className="landing-intro">
            <span className="eyebrow">{tr("Knowledge, in motion.")}</span>
            <h1>
              {tr("Learn by making things happen.")}
              <span>↗</span>
            </h1>
            <p>
              {tr(
                "Two labs. One place to turn abstract ideas into working intuition.",
              )}
            </p>
          </div>
          <div className="lab-cards">
            {[
              {
                id: "structures",
                href: "#1",
                title: "Structures Lab",
                heading: "Data, connected.",
                number: "01",
                description:
                  "Build intuition for arrays, trees, graphs and algorithms. Manipulate real data, step through execution, and test your understanding.",
                count: "17 interactive lessons",
              },
              {
                id: "patterns",
                href: "#/patterns",
                title: "Design Patterns Lab",
                heading: "Design, understood.",
                number: "02",
                description:
                  "Explore reusable solutions through living diagrams, executable examples and small experiments. From creation to collaboration.",
                count: "22 design patterns",
              },
            ].map((card, i) => (
              <motion.a
                key={card.id}
                href={card.href}
                className={`lab-card ${card.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="card-top">
                  <span className="eyebrow">
                    {card.number} / {tr(card.title)}
                  </span>
                  <span className="card-arrow">↗</span>
                </div>
                <div className="card-art" aria-hidden="true">
                  {i === 0 ? (
                    <div className="art-cells">
                      {[12, 28, 7, 36].map((n, j) => (
                        <span
                          key={n}
                          style={{
                            transform: `translateY(${j % 2 ? 12 : -12}px)`,
                          }}
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="art-pattern">
                      <span>Client</span>
                      <i>↓</i>
                      <div>
                        <span>Interface</span>
                        <span>Implementation</span>
                      </div>
                    </div>
                  )}
                </div>
                <h2>{tr(card.heading)}</h2>
                <p>{tr(card.description)}</p>
                <div className="card-bottom">
                  <span>{tr(card.count)}</span>
                  <strong>{tr("Explore the lab")} →</strong>
                </div>
              </motion.a>
            ))}
          </div>
          <p className="landing-footer">
            {tr("Interactive learning, at your pace.")}{" "}
            <span>React · TypeScript · JavaScript</span>
          </p>
        </main>
      )}
    </MotionConfig>
  );
}
