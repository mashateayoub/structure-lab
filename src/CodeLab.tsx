import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { editorOptions } from "./monaco";
import { execute } from "./execution";
import { Pattern, example, challenges, challengeSource } from "./patternEngine";
import { language, tr } from "./i18n";
export default function CodeLab({
  pattern,
  practice = false,
}: {
  pattern: Pattern;
  practice?: boolean;
}) {
  const [mode, setMode] = useState<"javascript" | "typescript">("javascript");
  const [code, setCode] = useState(
    practice ? challengeSource(pattern) : example(pattern),
  );
  const [plain, setPlain] = useState(false),
    [running, setRunning] = useState(false),
    [output, setOutput] = useState<string[]>([]),
    [show, setShow] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  const reset = (next = mode) => {
    active.current?.abort();
    setRunning(false);
    setCode(
      practice
        ? challengeSource(pattern)
        : example(pattern, 3, false, next === "typescript"),
    );
    setOutput([]);
  };
  async function run(check = false) {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setRunning(true);
    setOutput(["Running…"]);
    try {
      let source = code;
      if (mode === "typescript" && !practice) {
        const ts = await import("typescript");
        source = ts.transpileModule(code, {
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.None,
          },
        }).outputText;
      }
      if (check) {
        const lines = [];
        let passed = 0;
        for (const amount of [1, 3, 7])
          for (const alternate of [false, true]) {
            const prefix = `const amount=${amount};const alternate=${alternate};\n`;
            const actual = await execute(prefix + source, controller.signal);
            const expected = await execute(
              prefix + pattern.code,
              controller.signal,
            );
            const ok = JSON.stringify(actual) === JSON.stringify(expected);
            if (ok) passed++;
            lines.push(
              `${ok ? "✓" : "✗"} ${amount} / ${tr(alternate ? "Enable alternative" : "Example")}: ${actual.join(" | ")}`,
            );
          }
        lines.push(
          `${passed}/6`,
          tr(
            passed === 6
              ? "Challenge checks passed."
              : "Check the output and try again.",
          ),
        );
        setOutput(lines);
      } else
        setOutput(
          await execute(
            (practice ? "const amount=3;const alternate=false;\n" : "") +
              source,
            controller.signal,
          ),
        );
    } catch (error) {
      if (!controller.signal.aborted) setOutput([tr((error as Error).message)]);
    } finally {
      if (active.current === controller) setRunning(false);
    }
  }
  const challenge = challenges[pattern.id];
  return (
    <section className="playground">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">
            {tr(practice ? "Challenge" : "MAKE IT YOURS")}
          </span>
          <h2>
            {tr(
              practice
                ? "Practice"
                : mode === "typescript"
                  ? "TypeScript playground"
                  : "JavaScript playground",
            )}
          </h2>
        </div>
        <div className="button-row">
          {!practice && (
            <label>
              {tr("Code")}
              <select
                aria-label={tr("Code")}
                value={mode}
                onChange={(e) => {
                  const v = e.target.value as typeof mode;
                  setMode(v);
                  reset(v);
                }}
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
              </select>
            </label>
          )}
          <button onClick={() => setPlain(!plain)}>
            {tr(plain ? "Monaco editor" : "Plain text editor")}
          </button>
          <button onClick={() => reset()}>{tr("Reset code")}</button>
          <button className="primary" disabled={running} onClick={() => run()}>
            {tr("Run code ▶")}
          </button>
          {practice && (
            <button disabled={running} onClick={() => run(true)}>
              {tr("Run checks")}
            </button>
          )}
        </div>
      </div>
      {practice && <p>{challenge[language()]}</p>}
      {plain ? (
        <textarea
          className="plain-editor"
          aria-label={tr(
            mode === "typescript" ? "TypeScript source" : "JavaScript source",
          )}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
        />
      ) : (
        <Editor
          height="370px"
          theme="vs-dark"
          language={mode}
          value={code}
          onChange={(v) => setCode(v || "")}
          options={{
            ...editorOptions,
            ariaLabel: tr(
              mode === "typescript"
                ? "TypeScript code editor"
                : "JavaScript code editor",
            ),
          }}
        />
      )}
      <div className="console">
        <span className="eyebrow">{tr("CONSOLE")}</span>
        <pre role="log" aria-live="polite">
          {output.map(tr).join("\n")}
        </pre>
      </div>
      {practice && (
        <>
          <button onClick={() => setShow(!show)}>
            {tr(show ? "Hide solution" : "Show solution")}
          </button>
          {show && <pre className="solution-code">{pattern.code}</pre>}
        </>
      )}
      <p className="fine-print">
        {tr(
          "Examples use stable technical identifiers; lesson prose and feedback follow your language.",
        )}
      </p>
      <p className="fine-print">
        {tr(
          "Runs synchronous JavaScript in a dedicated worker with a 2-second limit. No DOM or imports. Treat the playground as local code execution, not a security sandbox for untrusted programs.",
        )}
      </p>
    </section>
  );
}
