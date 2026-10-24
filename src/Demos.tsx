import i18n, { tr } from "./i18n";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  addEdge,
  useEdgesState,
  useNodesState,
  ConnectionMode,
  type ReactFlowInstance,
} from "@xyflow/react";
import type { Connection, Node, Edge } from "@xyflow/react";
import {
  buildBST,
  parseNumbers,
  searchTrace,
  sortTrace,
  traverse,
  treeLayout,
} from "./engine";
import type { Frame } from "./engine";
import { arrangeGraph, connectionSides } from "./diagramLayout";
import { diagramNodeTypes } from "./DiagramNode";

export function Cells({
  values,
  active = [],
  done = [],
  linked = false,
}: {
  values: number[];
  active?: number[];
  done?: number[];
  linked?: boolean;
}) {
  return (
    <div
      className={linked ? "cells linked-cells" : "cells"}
      role="list"
      aria-label={tr("Current values")}
    >
      <AnimatePresence initial={false}>
        {tr(
          values.map((value, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="cell-group"
              key={`${i}-${value}`}
              role="listitem"
            >
              <div
                className={`cell ${active.includes(i) ? "active" : ""} ${done.includes(i) ? "done" : ""}`}
              >
                {tr(value)}
              </div>
              <small>
                {tr(linked ? (i === 0 ? "head" : `node ${i}`) : `[${i}]`)}
              </small>
              {tr(
                linked && (
                  <span className="link-arrow">
                    {tr(i === values.length - 1 ? "→ ∅" : "→")}
                  </span>
                ),
              )}
            </motion.div>
          )),
        )}
      </AnimatePresence>
      {tr(
        !values.length && (
          <p className="empty">
            {tr("Empty collection. Add a value to begin.")}
          </p>
        ),
      )}
    </div>
  );
}
export function Collection({ name }: { name: string }) {
  const [values, setValues] = useState([12, 28, 7, 36, 19]);
  const [entries, setEntries] = useState<[string, string][]>([
    ["name", "Ada"],
    ["role", "Explorer"],
  ]);
  const [value, setValue] = useState("42"),
    [key, setKey] = useState("level"),
    [index, setIndex] = useState("2"),
    [message, setMessage] = useState(
      "Change the data and watch the structure respond.",
    ),
    [active, setActive] = useState<number[]>([]);
  const keyed = name === "Objects" || name === "Map";
  const linked = name === "Linked Lists";
  function act(action: string) {
    setActive([]);
    if (keyed) {
      if (!key.trim()) {
        setMessage("Enter a key first.");
        return;
      }
      const store = new Map(entries);
      if (action === "Set") {
        if (store.size >= 16 && !store.has(key)) {
          setMessage("Keep this demo to 16 entries.");
          return;
        }
        store.set(key, value);
        setMessage(`Set ${JSON.stringify(key)} to ${JSON.stringify(value)}.`);
      }
      if (action === "Delete") {
        setMessage(
          store.delete(key) ? `Deleted ${key}.` : `Key ${key} does not exist.`,
        );
      }
      if (action === "Get")
        setMessage(
          store.has(key)
            ? `${key} → ${store.get(key)}`
            : `Key ${key} does not exist.`,
        );
      setEntries([...store]);
      return;
    }
    const n = Number(value);
    if (
      [
        "Push",
        "Enqueue",
        "Append",
        "Prepend",
        "Add",
        "Has",
        "Delete",
        "Insert",
      ].includes(action) &&
      (!value.trim() || !Number.isFinite(n) || Math.abs(n) > 999)
    ) {
      setMessage("Enter a number between −999 and 999.");
      return;
    }
    if (
      ["Push", "Enqueue", "Append", "Prepend", "Add", "Insert"].includes(
        action,
      ) &&
      values.length >= 16
    ) {
      setMessage("Keep this demo to 16 values.");
      return;
    }
    const a = [...values];
    let msg = "";
    if (["Push", "Enqueue", "Append"].includes(action)) {
      a.push(n);
      msg = `Added ${n} at the end.`;
      setActive([a.length - 1]);
    }
    if (action === "Prepend") {
      a.unshift(n);
      msg = `New head is ${n}.`;
      setActive([0]);
    }
    if (action === "Add") {
      if (a.includes(n)) msg = `${n} is already present; no duplicate added.`;
      else {
        a.push(n);
        msg = `Added unique value ${n}.`;
      }
    }
    if (action === "Has") {
      msg = `${n} ${a.includes(n) ? "is" : "is not"} in the Set.`;
      setActive(a.flatMap((v, i) => (v === n ? [i] : [])));
    }
    if (action === "Delete") {
      const at = a.indexOf(n);
      if (at >= 0) a.splice(at, 1);
      msg = at >= 0 ? `Deleted ${n}.` : `${n} is not present.`;
    }
    if (action === "Pop") {
      msg = a.length
        ? `Popped ${a.pop()} from the top.`
        : "The stack is empty; nothing to pop.";
    }
    if (action === "Dequeue" || action === "Remove head") {
      msg = a.length
        ? `Removed ${a.shift()} from the front.`
        : "The collection is empty.";
    }
    if (action === "Read" || action === "Insert" || action === "Remove at") {
      const i = Number(index),
        max = action === "Insert" ? a.length : a.length - 1;
      if (!index.trim() || !Number.isInteger(i) || i < 0 || i > max) {
        setMessage(
          `Enter an index from 0 to ${Math.max(0, max)}${a.length ? "" : "; collection is empty"}.`,
        );
        return;
      }
      if (action === "Read") {
        msg = `Index ${i} contains ${a[i]}.`;
        setActive([i]);
      }
      if (action === "Insert") {
        a.splice(i, 0, n);
        msg = `Inserted ${n} at index ${i}; later values shift right.`;
        setActive([i]);
      }
      if (action === "Remove at") {
        msg = `Removed ${a.splice(i, 1)[0]} at index ${i}.`;
      }
    }
    setValues(a);
    setMessage(msg);
  }
  const actions = keyed
    ? ["Set", "Get", "Delete"]
    : name === "Stacks"
      ? ["Push", "Pop"]
      : name === "Queues"
        ? ["Enqueue", "Dequeue"]
        : name === "Set"
          ? ["Add", "Has", "Delete"]
          : linked
            ? ["Prepend", "Append", "Remove head"]
            : ["Push", "Read", "Insert", "Remove at"];
  return (
    <>
      <div className="demo-toolbar">
        <label>
          {tr(keyed ? "Value" : "Number")}
          <input
            aria-label={tr("Value")}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={60}
          />
        </label>
        {tr(
          keyed && (
            <label>
              {tr("Key")}
              <input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                maxLength={40}
              />
            </label>
          ),
        )}
        {tr(
          name === "Arrays" && (
            <label>
              {tr("Index")}
              <input
                value={index}
                onChange={(e) => setIndex(e.target.value)}
                type="number"
                min="0"
                max="16"
              />
            </label>
          ),
        )}
        {tr(
          actions.map((a) => (
            <button key={a} onClick={() => act(a)}>
              {tr(a)}
            </button>
          )),
        )}
        <button
          className="quiet"
          onClick={() => {
            setValues([]);
            setEntries([]);
            setActive([]);
            setMessage("Collection cleared.");
          }}
        >
          {tr("Clear")}
        </button>
      </div>
      <div className="collection-stage">
        {tr(
          keyed ? (
            <div className="entries">
              {tr(
                entries.length ? (
                  entries.map(([k, v]) => (
                    <motion.div layout className="entry" key={k}>
                      <code>{tr(k)}</code>
                      <span>{tr("→")}</span>
                      <strong>{tr(v)}</strong>
                    </motion.div>
                  ))
                ) : (
                  <p>{tr("Empty collection.")}</p>
                ),
              )}
            </div>
          ) : (
            <>
              <Cells values={values} active={active} linked={linked} />
              {tr(
                name === "Stacks" && (
                  <p className="annotation">
                    {i18n.t("BOTTOM ← {{n}} items → TOP", { n: values.length })}
                  </p>
                ),
              )}
              {tr(
                name === "Queues" && (
                  <p className="annotation">
                    {i18n.t("FRONT ← {{n}} items ← BACK", { n: values.length })}
                  </p>
                ),
              )}
            </>
          ),
        )}
      </div>
      <p className="status" role="status">
        {tr(message)}
      </p>
    </>
  );
}
function usePlayback(frames: Frame[]) {
  const [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(650);
  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [frames]);
  useEffect(() => {
    if (!playing) return;
    if (step >= frames.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), speed);
    return () => clearTimeout(t);
  }, [playing, step, frames.length, speed]);
  return {
    step,
    playing,
    speed,
    setSpeed,
    setPlaying,
    setStep,
    frame: frames[Math.min(step, frames.length - 1)],
  };
}
type Playback = ReturnType<typeof usePlayback>;
function PlaybackControls({ p, count }: { p: Playback; count: number }) {
  return (
    <div className="playback">
      <button
        aria-label={tr("Restart animation")}
        onClick={() => {
          p.setStep(0);
          p.setPlaying(false);
        }}
      >
        {tr("↺ Restart")}
      </button>
      <button
        disabled={p.step === 0}
        onClick={() => {
          p.setPlaying(false);
          p.setStep((s) => s - 1);
        }}
      >
        {tr("Back")}
      </button>
      <button
        className="primary"
        disabled={count < 2}
        onClick={() => {
          if (p.step >= count - 1) p.setStep(0);
          p.setPlaying(!p.playing);
        }}
      >
        {tr(p.playing ? "Pause" : "Play")}
      </button>
      <button
        disabled={p.step >= count - 1}
        onClick={() => {
          p.setPlaying(false);
          p.setStep((s) => s + 1);
        }}
      >
        {tr("Step")}
      </button>
      <span className="step-count">
        {tr(Math.min(p.step + 1, count))}
        {tr("/")}
        {tr(count)}
      </span>
      <label>
        {tr("Step delay")}
        <select
          aria-label={tr("Step delay")}
          value={p.speed}
          onChange={(e) => p.setSpeed(Number(e.target.value))}
        >
          <option value="1200">{tr("Slow")}</option>
          <option value="650">{tr("Normal")}</option>
          <option value="200">{tr("Fast")}</option>
        </select>
      </label>
    </div>
  );
}
export function Algorithm({ sort = false }: { sort?: boolean }) {
  const [input, setInput] = useState("12, 28, 7, 36, 19"),
    [values, setValues] = useState([12, 28, 7, 36, 19]),
    [target, setTarget] = useState("19"),
    [needle, setNeedle] = useState(19),
    [mode, setMode] = useState(sort ? "Bubble" : "Linear"),
    [error, setError] = useState("");
  const frames = useMemo(
    () =>
      sort
        ? sortTrace(values, mode as "Bubble" | "Insertion")
        : searchTrace(values, needle, mode === "Binary"),
    [values, needle, mode, sort],
  );
  const p = usePlayback(frames);
  return (
    <>
      <div className="demo-toolbar">
        <label className="grow">
          {tr("Values (comma-separated)")}
          <input value={input} onChange={(e) => setInput(e.target.value)} />
        </label>
        {tr(
          !sort && (
            <label>
              {tr("Target")}
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </label>
          ),
        )}
        <label>
          {tr("Algorithm")}
          <select
            aria-label={tr("Algorithm")}
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            {tr(
              (sort ? ["Bubble", "Insertion"] : ["Linear", "Binary"]).map(
                (v) => <option key={v}>{tr(v)}</option>,
              ),
            )}
          </select>
        </label>
        <button
          onClick={() => {
            try {
              const a = parseNumbers(input);
              if (!target.trim() || !Number.isFinite(Number(target)))
                throw new Error("Enter a numeric target.");
              setValues(a);
              setNeedle(Number(target));
              setError("");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          {tr("Apply data")}
        </button>
      </div>
      {tr(
        error && (
          <p role="alert" className="error">
            {tr(error)}
          </p>
        ),
      )}
      <div className="algorithm-stage">
        <Cells
          values={p.frame?.values || []}
          active={p.frame?.active}
          done={p.frame?.done}
        />
        <div className="bars" aria-hidden="true">
          {tr(
            p.frame?.values.map((v, i) => (
              <motion.div
                key={i}
                animate={{
                  height: Math.max(
                    8,
                    (Math.abs(v) / Math.max(1, ...values.map(Math.abs))) * 100,
                  ),
                }}
                className={p.frame.active.includes(i) ? "highlight" : ""}
              >
                <span>{tr(v)}</span>
              </motion.div>
            )),
          )}
        </div>
      </div>
      <p className="status" role="status">
        {tr(p.frame?.message)}
      </p>
      <PlaybackControls p={p} count={frames.length} />
      <p className="fine-print">
        {tr(
          "Amber = current comparison · green = confirmed result. Bar heights show absolute magnitude; labels retain sign. Trace snapshots use extra memory for teaching.",
        )}
      </p>
    </>
  );
}
const graphSeed: Node[] = ["A", "B", "C", "D", "E", "F"].map((id) => ({
  id,
  data: { label: id },
  position: { x: 0, y: 0 },
}));
const initialEdges = [
  ["A", "B"],
  ["A", "C"],
  ["B", "D"],
  ["B", "E"],
  ["C", "F"],
].map(([source, target]) => ({
  id: `${source}-${target}`,
  source,
  target,
  markerEnd: { type: MarkerType.ArrowClosed },
}));
const initialNodes = arrangeGraph(graphSeed, initialEdges);
export function GraphDemo({ name }: { name: string }) {
  const tree = name === "Trees / BST";
  const flow = useRef<Pick<ReactFlowInstance, "fitView"> | null>(null);
  const diagramContainer = useRef<HTMLDivElement | null>(null);
  const [treeValues, setTreeValues] = useState([40, 20, 60, 10, 30, 50, 70]),
    [input, setInput] = useState("25"),
    [message, setMessage] = useState(""),
    [start, setStart] = useState("A");
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes),
    [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const layout = useMemo(() => treeLayout(buildBST(treeValues)), [treeValues]);
  // React Flow also updates nodes for measurement, selection and dragging.
  // Only topology changes should invalidate an in-progress traversal.
  const topology = JSON.stringify({
    ids: nodes.map((n) => n.id),
    edges: edges.map(({ source, target }) => ({ source, target })),
  });
  const frames = useMemo(() => {
    const graph = JSON.parse(topology) as {
      ids: string[];
      edges: { source: string; target: string }[];
    };
    return traverse(graph.ids, graph.edges, start, name === "DFS");
  }, [topology, start, name]);
  const p = usePlayback(frames);
  const walk = name === "BFS" || name === "DFS";
  const visibleNodes: Node[] = (tree ? layout.nodes : nodes).map((n) => ({
    ...n,
    type: "readable",
    className: "diagram-node structure-node",
    style: {
      width: 80,
      height: 54,
      background:
        walk && p.frame?.visited?.includes(n.id) ? "#294d3a" : "#193038",
      border:
        walk && p.frame?.frontier?.includes(n.id)
          ? "2px solid #d7b477"
          : "1px solid #70958b",
      color: "#edf5eb",
    },
  }));
  const visibleEdges = (
    tree ? layout.edges.map((e, i) => ({ ...e, id: String(i) })) : edges
  ).map((e) => {
    const source = visibleNodes.find((n) => n.id === e.source),
      target = visibleNodes.find((n) => n.id === e.target);
    const [from, to] =
      source && target
        ? connectionSides(source.position, target.position)
        : ["bottom", "top"];
    return {
      ...e,
      type: "smoothstep",
      sourceHandle: from,
      targetHandle: to,
      markerEnd: { type: MarkerType.ArrowClosed, color: "#91b4a5" },
      style: { stroke: "#91b4a5", strokeWidth: 1.8 },
      pathOptions: { borderRadius: 10, offset: 28 },
    };
  });
  const diagramWidth = Math.max(
    560,
    ...visibleNodes.map((n) => n.position.x + 150),
  );
  const diagramHeight = Math.max(
    440,
    ...visibleNodes.map((n) => n.position.y + 140),
  );
  const connect = (connection: Connection) => {
    if (connection.source === connection.target) {
      setMessage("This demo skips self-loops.");
      return;
    }
    setEdges((es) =>
      addEdge(
        { ...connection, markerEnd: { type: MarkerType.ArrowClosed } },
        es,
      ),
    );
  };
  return (
    <>
      <div className="demo-toolbar">
        {tr(
          tree ? (
            <>
              <label>
                {tr("Insert value")}
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  type="number"
                />
              </label>
              <button
                onClick={() => {
                  try {
                    const vals = parseNumbers(input);
                    if (vals.length !== 1) throw new Error("Enter one value.");
                    if (treeValues.length >= 16)
                      throw new Error("Maximum 16 tree nodes.");
                    if (treeValues.includes(vals[0]))
                      setMessage(
                        "Duplicate ignored: BST values are unique here.",
                      );
                    else {
                      setTreeValues([...treeValues, ...vals]);
                      setMessage(
                        `Inserted ${vals[0]}. Follow smaller-left, larger-right comparisons from the root.`,
                      );
                    }
                  } catch (e) {
                    setMessage((e as Error).message);
                  }
                }}
              >
                {tr("Insert node")}
              </button>
              <button
                onClick={() => {
                  setTreeValues([]);
                  setMessage("Empty tree. Insert a root.");
                }}
              >
                {tr("Clear tree")}
              </button>
              <button
                onClick={() => {
                  setTreeValues([40, 20, 60, 10, 30, 50, 70]);
                  setMessage("Tree reset.");
                }}
              >
                {tr("Reset tree")}
              </button>
            </>
          ) : (
            <>
              <label>
                {tr("Start vertex")}
                <select
                  aria-label={tr("Start vertex")}
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                >
                  {tr(nodes.map((n) => <option key={n.id}>{tr(n.id)}</option>))}
                </select>
              </label>
              <button
                disabled={nodes.length >= 12}
                onClick={() => {
                  const id = String.fromCharCode(65 + nodes.length);
                  setNodes((ns) =>
                    arrangeGraph(
                      [
                        ...ns,
                        {
                          id,
                          data: { label: id },
                          position: {
                            x: 80 * (ns.length % 5),
                            y: 350 + Math.floor(ns.length / 5) * 90,
                          },
                        },
                      ],
                      edges,
                    ),
                  );
                  setMessage(
                    `Added ${id}. Connect a bottom handle to another node’s top handle.`,
                  );
                }}
              >
                {tr("Add vertex")}
              </button>
              <button
                onClick={() => {
                  setEdges([]);
                  setMessage(
                    "Edges cleared. Connect nodes using their handles.",
                  );
                }}
              >
                {tr("Clear edges")}
              </button>
              <button
                onClick={() => {
                  setNodes(initialNodes);
                  setEdges(initialEdges);
                  setStart("A");
                  setMessage("Graph reset.");
                }}
              >
                {tr("Reset graph")}
              </button>
            </>
          ),
        )}
      </div>
      <div className="diagram-toolbar">
        <span>{tr("Scroll or zoom to inspect the diagram.")}</span>
        <button
          onClick={() => {
            if (!tree) setNodes((ns) => arrangeGraph(ns, edges));
            requestAnimationFrame(() =>
              flow.current?.fitView({
                padding: 0.18,
                maxZoom: 1,
                minZoom: 0.7,
              }),
            );
          }}
        >
          {tr("Auto arrange")}
        </button>
        <button
          onClick={() =>
            flow.current?.fitView({ padding: 0.18, maxZoom: 1, minZoom: 0.7 })
          }
        >
          {tr("Fit diagram")}
        </button>
      </div>
      <div
        ref={diagramContainer}
        className="flow-stage arranged-flow"
        aria-label={tr(
          tree ? "Binary search tree diagram" : "Directed graph diagram",
        )}
      >
        <div
          className="diagram-canvas"
          style={{ minWidth: diagramWidth, height: diagramHeight }}
        >
          <ReactFlow<Node>
            nodeTypes={diagramNodeTypes}
            connectionMode={ConnectionMode.Loose}
            onInit={(instance) => {
              flow.current = instance;
              requestAnimationFrame(() => {
                const container = diagramContainer.current;
                if (container)
                  container.scrollLeft =
                    (container.scrollWidth - container.clientWidth) / 2;
              });
            }}
            fitViewOptions={{ padding: 0.18, maxZoom: 1, minZoom: 0.7 }}
            colorMode="dark"
            key={tree ? treeValues.join(",") : "graph"}
            nodes={visibleNodes}
            edges={visibleEdges}
            onNodesChange={tree ? undefined : onNodesChange}
            onEdgesChange={tree ? undefined : onEdgesChange}
            onConnect={tree ? undefined : connect}
            nodesConnectable={!tree}
            nodesDraggable={!tree}
            deleteKeyCode={null}
            fitView
            minZoom={0.2}
            maxZoom={2}
            ariaLabelConfig={{
              "controls.zoomIn.ariaLabel": tr("Zoom in"),
              "controls.zoomOut.ariaLabel": tr("Zoom out"),
              "controls.fitView.ariaLabel": tr("Fit view"),
            }}
          >
            <Background color="#385149" gap={24} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </div>
      {tr(
        !tree && (
          <details className="accessible-graph">
            <summary>
              {tr("Keyboard-friendly edge editor and text view")}
            </summary>
            <EdgeEditor
              ids={nodes.map((n) => n.id)}
              onAdd={(s, t) =>
                connect({
                  source: s,
                  target: t,
                  sourceHandle: null,
                  targetHandle: null,
                })
              }
            />
            <p>
              {tr("Vertices:")}
              {tr(nodes.map((n) => n.id).join(", "))}
              {tr(". Edges:")}
              {tr(" ")}
              {tr(
                edges.map((e) => `${e.source} → ${e.target}`).join("; ") ||
                  "none",
              )}
              {tr(".")}
            </p>
          </details>
        ),
      )}
      {tr(
        tree && (
          <p className="fine-print">
            {tr("Text view:")}
            {tr(" ")}
            {tr(
              layout.edges.map((e) => `${e.source} → ${e.target}`).join("; ") ||
                "No child edges.",
            )}
            {tr(" ")}
            {tr("Inorder:")}
            {tr([...treeValues].sort((a, b) => a - b).join(", ") || "empty")}
            {tr(".")}
          </p>
        ),
      )}
      {tr(
        walk ? (
          <>
            <p className="status" role="status">
              {tr(p.frame?.message)}
            </p>
            <div className="traversal-state">
              <span>
                {tr("Visited:")}
                {tr(" ")}
                <strong>{tr(p.frame?.visited?.join(" → ") || "none")}</strong>
              </span>
              <span>
                {tr(name === "DFS" ? "Stack" : "Queue")}
                {tr(":")}
                {tr(" ")}
                <strong>{tr(p.frame?.frontier?.join(", ") || "empty")}</strong>
              </span>
            </div>
            <PlaybackControls p={p} count={frames.length} />
            <p className="fine-print">
              {tr(
                "*The teaching trace filters the edge list per vertex and copies snapshots. Its overhead differs from the O(V + E) adjacency-list implementation in the playground.",
              )}
            </p>
          </>
        ) : (
          <p className="status" role="status">
            {tr(
              message ||
                (tree
                  ? "Insert a value to see how the hierarchy changes."
                  : "Drag nodes to arrange the network. Connect handles to add directed edges."),
            )}
          </p>
        ),
      )}
    </>
  );
}
function EdgeEditor({
  ids,
  onAdd,
}: {
  ids: string[];
  onAdd: (s: string, t: string) => void;
}) {
  const [source, setSource] = useState("A"),
    [target, setTarget] = useState("B");
  return (
    <div className="demo-toolbar">
      <label>
        {tr("From")}
        <select
          aria-label={tr("From")}
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          {tr(ids.map((id) => <option key={id}>{tr(id)}</option>))}
        </select>
      </label>
      <label>
        {tr("To")}
        <select
          aria-label={tr("To")}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        >
          {tr(ids.map((id) => <option key={id}>{tr(id)}</option>))}
        </select>
      </label>
      <button
        onClick={() =>
          onAdd(
            ids.includes(source) ? source : ids[0],
            ids.includes(target) ? target : ids[0],
          )
        }
      >
        {tr("Connect vertices")}
      </button>
    </div>
  );
}
export function Complexity({ space = false }: { space?: boolean }) {
  const [n, setN] = useState(16),
    [log, setLog] = useState(true);
  const curves = [
    { name: "O(1)", f: (_: number) => 1, color: "#4a6c88" },
    { name: "O(log n)", f: (x: number) => Math.log2(x), color: "#a4731f" },
    { name: "O(n)", f: (x: number) => x, color: "#258573" },
    {
      name: "O(n log n)",
      f: (x: number) => x * Math.log2(x),
      color: "#8b64a4",
    },
    { name: "O(n²)", f: (x: number) => x * x, color: "#c15b45" },
  ];
  const scale = (y: number) =>
    log ? Math.log10(y + 1) / Math.log10(4097) : y / 4096;
  return (
    <>
      <div className="demo-toolbar">
        <label className="grow">
          {tr("Input size n =")}
          {tr(n)}
          <input
            type="range"
            min="2"
            max="64"
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
          />
        </label>
        <label>
          {tr("Vertical scale")}
          <select
            aria-label={tr("Vertical scale")}
            value={log ? "log" : "linear"}
            onChange={(e) => setLog(e.target.value === "log")}
          >
            <option value="log">{tr("Logarithmic")}</option>
            <option value="linear">{tr("Linear")}</option>
          </select>
        </label>
      </div>
      <svg
        viewBox="0 0 650 270"
        role="img"
        aria-label={tr(
          "Growth comparison chart. Exact values appear in the table below.",
        )}
        className="chart"
      >
        <path d="M45 15V230H620" fill="none" stroke="#a9bab3" />
        {tr(
          [0, 0.25, 0.5, 0.75, 1].map((t) => (
            <g key={t}>
              <line
                x1="45"
                x2="620"
                y1={230 - t * 210}
                y2={230 - t * 210}
                stroke="#dce5e0"
              />
              <text x="40" y={234 - t * 210} textAnchor="end" fontSize="10">
                {tr(Math.round(log ? Math.pow(4097, t) - 1 : t * 4096))}
              </text>
            </g>
          )),
        )}
        {tr(
          curves.map((c) => (
            <path
              key={c.name}
              d={Array.from(
                { length: 63 },
                (_, i) =>
                  `${i ? "L" : "M"}${45 + ((i + 2) / 64) * 570},${230 - scale(c.f(i + 2)) * 210}`,
              ).join(" ")}
              fill="none"
              stroke={c.color}
              strokeWidth="2.5"
            />
          )),
        )}
        <line
          x1={45 + (n / 64) * 570}
          x2={45 + (n / 64) * 570}
          y1="15"
          y2="230"
          stroke="#132e2b"
          strokeDasharray="4 4"
        />
        <text x="50" y="256" fontSize="12">
          {tr("2")}
        </text>
        <text x="600" y="256" fontSize="12">
          {tr("64")}
        </text>
        <text x="280" y="256" fontSize="12">
          {tr("Input size n")}
        </text>
      </svg>
      <table>
        <caption>
          {i18n.t("Idealized {{kind}} counts at n = {{n}}", {
            kind: tr(space ? "time and memory" : "operation"),
            n,
          })}
        </caption>
        <thead>
          <tr>
            <th>{tr("Growth")}</th>
            <th>{tr("Count")}</th>
            <th>{tr("Example")}</th>
          </tr>
        </thead>
        <tbody>
          {tr(
            curves.map((c, i) => (
              <tr key={c.name}>
                <th style={{ color: c.color }}>{tr(c.name)}</th>
                <td>{tr(Math.ceil(c.f(n)).toLocaleString())}</td>
                <td>
                  {tr(
                    [
                      "Array index lookup",
                      "Binary search comparisons",
                      "Linear scan / copied array",
                      "Efficient comparison sorting",
                      "All pairs comparison",
                    ][i],
                  )}
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
      {tr(
        space && (
          <div className="tradeoff">
            <strong>{i18n.t("Duplicate detection at n = {{n}}", { n })}</strong>
            <p>
              {i18n.t(
                "Nested pairs: up to {{n}} comparisons, O(1) auxiliary space.",
                { n: (n * (n - 1)) / 2 },
              )}
            </p>
            <p>
              {i18n.t(
                "Set membership: up to {{n}} checks and {{n}} inserts, typically O(n) total time, up to {{n}} extra entries: O(n) space.",
                { n },
              )}
            </p>
          </div>
        ),
      )}
      <p className="fine-print">
        {tr(
          "Base-2 logarithms; illustrative formulas, not benchmarks. The selected vertical scale changes how growth looks, not the underlying counts.",
        )}
      </p>
    </>
  );
}
