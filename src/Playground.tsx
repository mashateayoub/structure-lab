import { useEffect, useRef, useState } from "react";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import "monaco-editor/esm/vs/language/typescript/monaco.contribution";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import TypeScriptWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
self.MonacoEnvironment = {
  getWorker(_id, label) {
    return label === "typescript" || label === "javascript"
      ? new TypeScriptWorker()
      : new EditorWorker();
  },
};
loader.config({ monaco });
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
          <span className="eyebrow">MAKE IT YOURS</span>
          <h2>JavaScript playground</h2>
        </div>
        <div className="button-row">
          <button onClick={() => setPlain(!plain)}>
            {plain ? "Monaco editor" : "Plain text editor"}
          </button>
          <button
            onClick={() => {
              stop();
              setRunning(false);
              setCode(initial);
              setOutput(["Example restored."]);
            }}
          >
            Reset code
          </button>
          <button className="primary" onClick={() => run()}>
            {running ? "Run again" : "Run code ▶"}
          </button>
          {challenge && (
            <button onClick={() => run(true)}>Check challenge</button>
          )}
        </div>
      </div>
      {plain ? (
        <textarea
          className="plain-editor"
          aria-label="JavaScript source"
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
            <p>Loading local editor… Use Plain text editor if needed.</p>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            accessibilitySupport: "on",
            ariaLabel: "JavaScript code editor",
          }}
        />
      )}
      <div className="console">
        <span className="eyebrow">CONSOLE</span>
        <pre role="log" aria-live="polite">
          {output.join("\n")}
        </pre>
      </div>
      <p className="fine-print">
        Runs synchronous JavaScript in a dedicated worker with a 2-second limit.
        No DOM or imports. Treat the playground as local code execution, not a
        security sandbox for untrusted programs.
      </p>
    </section>
  );
}
