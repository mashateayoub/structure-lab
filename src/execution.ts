/** A fresh worker for every run. Terminated on completion, cancellation or timeout. */
export function execute(code: string, signal?: AbortSignal): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const source = `self.onmessage = ({data}) => {
   const lines=[];
   const format = value => typeof value === 'string' ? value : value === undefined ? 'undefined' : value instanceof Map ? JSON.stringify([...value]) : value instanceof Set ? JSON.stringify([...value]) : JSON.stringify(value);
   const log=(...args)=>{if(lines.length<100) lines.push(args.map(format).join(' ').slice(0,2000));};
   try { new Function('console', data)({log,info:log,warn:log,error:log}); self.postMessage({lines}); }
   catch(error){ self.postMessage({error:error.message}); }
  };`;
    const url = URL.createObjectURL(
      new Blob([source], { type: "text/javascript" }),
    );
    const worker = new Worker(url);
    let settled = false;
    const finish = (lines?: string[], error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      signal?.removeEventListener("abort", abort);
      error
        ? reject(error)
        : resolve(
            lines?.length
              ? lines
              : ["Finished. Use console.log() to display a value."],
          );
    };
    const abort = () => finish(undefined, new Error("Cancelled"));
    const timer = setTimeout(
      () =>
        finish(
          undefined,
          new Error("Stopped after 2 seconds. Check for an infinite loop."),
        ),
      2000,
    );
    worker.onmessage = ({ data }) =>
      finish(data.lines, data.error ? new Error(data.error) : undefined);
    worker.onerror = (e) => {
      e.preventDefault();
      finish(undefined, new Error(e.message));
    };
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
    else worker.postMessage(code);
  });
}
