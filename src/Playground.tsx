import { tr } from "./i18n";
import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { editorOptions } from "./monaco";
const workerSource = `
self.onmessage = async ({ data }) => {
  const lines = [];
  const format = value => { if (typeof value === 'string') return value; if (value === undefined) return 'undefined'; try { if(value instanceof Map) return 'Map ' + JSON.stringify([...value]); if(value instanceof Set) return 'Set ' + JSON.stringify([...value]); return JSON.stringify(value); } catch { return String(value); } };
  const log = (...args) => { if(lines.length < 100) lines.push(args.map(format).join(' ').slice(0,2000)); };
  try {
    const fn = new Function('console', data.code + (data.challenge ? '\\n; return typeof unique === "function" ? unique : null;' : ''));
    const result = fn({ log, info: log, warn: log, error: log });
    if(data.challenge) {
      if(typeof result !== 'function') throw new Error('Define a function named unique(values).');
      const cases = [[3,3,1,2,1], [], [0,0,-1,-1,2], [9,8,7], [4,4,4]];
      let passed=0;
      for(const input of cases) { const got=result([...input]); const expected=[...new Set(input)]; const ok=JSON.stringify(got)===JSON.stringify(expected); if(ok)passed++; log((ok?'PASS':'FAIL')+' '+JSON.stringify(input)+' → '+format(got)+'; expected '+JSON.stringify(expected)); }
      log(passed+'/'+cases.length+' challenge tests passed.');
    }
    self.postMessage({ lines: lines.length ? lines : ['Finished. Use console.log() to display a value.'] });
  } catch(error) { self.postMessage({ lines: [...lines, 'Error: ' + error.message] }); }
};`;
export default function Playground({
  initial,
  challenge = false,
}: {
  initial: string;
  challenge?: boolean;
}) {
  const [code, setCode] = useState(initial),
    [output, setOutput] = useState<string[]>([
      "Ready. Edit the JavaScript and press Run.",
    ]),
    [running, setRunning] = useState(false),
    [plain, setPlain] = useState(false);
  const active = useRef<{
    worker: Worker;
    url: string;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);
  function stop() {
    if (active.current) {
      active.current.worker.terminate();
      URL.revokeObjectURL(active.current.url);
      clearTimeout(active.current.timer);
      active.current = null;
    }
  }
  useEffect(() => () => stop(), []);
  const previousInitial = useRef(initial);
  useEffect(() => {
    setCode((current) =>
      current === previousInitial.current ? initial : current,
    );
    previousInitial.current = initial;
  }, [initial]);
  function run(test = false) {
    stop();
    setRunning(true);
    setOutput(["Running…"]);
    const url = URL.createObjectURL(
      new Blob([workerSource], { type: "text/javascript" }),
    );
    const worker = new Worker(url);
    const finish = (lines: string[]) => {
      stop();
      setRunning(false);
      setOutput(lines);
    };
    const timer = setTimeout(
      () => finish(["Stopped after 2 seconds. Check for an infinite loop."]),
      2000,
    );
    active.current = { worker, url, timer };
    worker.onmessage = (e) => finish(e.data.lines);
    worker.onerror = (e) => {
      e.preventDefault();
      finish([`Error: ${e.message}`]);
    };
    worker.postMessage({ code, challenge: test });
  }
  return (
    <section className="playground">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{tr("MAKE IT YOURS")}</span>
          <h2>{tr("JavaScript playground")}</h2>
        </div>
        <div className="button-row">
          <button onClick={() => setPlain(!plain)}>
            {tr(plain ? "Monaco editor" : "Plain text editor")}
          </button>
          <button
            onClick={() => {
              stop();
              setRunning(false);
              setCode(initial);
              setOutput(["Example restored."]);
            }}
          >
            {tr("Reset code")}
          </button>
          <button className="primary" onClick={() => run()}>
            {tr(running ? "Run again" : "Run code ▶")}
          </button>
          {tr(
            challenge && (
              <button onClick={() => run(true)}>{tr("Check challenge")}</button>
            ),
          )}
        </div>
      </div>
      {tr(
        plain ? (
          <textarea
            className="plain-editor"
            aria-label={tr("JavaScript source")}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
          />
        ) : (
          <Editor
            height="300px"
            language="javascript"
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v || "")}
            loading={
              <p>
                {tr("Loading local editor… Use Plain text editor if needed.")}
              </p>
            }
            options={{
              ...editorOptions,
              ariaLabel: "JavaScript code editor",
            }}
          />
        ),
      )}
      <div className="console">
        <span className="eyebrow">{tr("CONSOLE")}</span>
        <pre role="log" aria-live="polite">
          {tr(output.join("\n"))}
        </pre>
      </div>
      <p className="fine-print">
        {tr(
          "Runs synchronous JavaScript in a dedicated worker with a 2-second limit. No DOM or imports. Treat the playground as local code execution, not a security sandbox for untrusted programs.",
        )}
      </p>
    </section>
  );
}
