import { useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  ReactFlow,
  MarkerType,
  Controls,
  ConnectionMode,
  useNodesState,
  type ReactFlowInstance,
  type Node,
} from "@xyflow/react";
import { patternLayout } from "./diagramLayout";
import { diagramNodeTypes } from "./DiagramNode";
import { Pattern } from "./patternEngine";
import { tr } from "./i18n";
export default function PatternDiagram({ pattern }: { pattern: Pattern }) {
  const [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () =>
        setStep((s) => {
          if (s >= pattern.edges.length) {
            setPlaying(false);
            return s;
          }
          return s + 1;
        }),
      950,
    );
    return () => clearInterval(timer);
  }, [playing, pattern]);
  const active = pattern.edges[step - 1];
  const layout = useMemo(() => patternLayout(pattern), [pattern]);
  const [positions, setPositions, onNodesChange] = useNodesState(layout.nodes);
  const flow = useRef<Pick<ReactFlowInstance, "fitView"> | null>(null);
  const diagramContainer = useRef<HTMLDivElement | null>(null);
  const nodes = positions.map((n) => ({
    ...n,
    className:
      active && (String(active[0]) === n.id || String(active[1]) === n.id)
        ? "diagram-node active"
        : "diagram-node",
  }));
  const edges = layout.edges.map((e, i) => ({
    ...e,
    label: tr(e.label),
    animated: playing && step - 1 === i,
    style: {
      stroke: step - 1 === i ? "#bedf9e" : "#87aaa0",
      strokeWidth: step - 1 === i ? 2.5 : 1.6,
    },
    labelStyle: { fill: "#eef5ee", fontSize: 12, fontWeight: 500 },
    labelBgStyle: { fill: "#101e25", fillOpacity: 1 },
    labelBgPadding: [8, 5] as [number, number],
    labelBgBorderRadius: 5,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#a4c1b3" },
  }));
  return (
    <>
      <div className="diagram-toolbar">
        <span>{tr("Drag nodes to adjust the view.")}</span>
        <button
          onClick={() => {
            setPositions(layout.nodes);
            requestAnimationFrame(() =>
              flow.current?.fitView({
                padding: 0.14,
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
            flow.current?.fitView({ padding: 0.14, maxZoom: 1, minZoom: 0.7 })
          }
        >
          {tr("Fit diagram")}
        </button>
      </div>
      <div
        ref={diagramContainer}
        className="pattern-flow arranged-flow"
        aria-label={tr("Relationships")}
      >
        <div
          className="diagram-canvas"
          style={{
            minWidth: Math.max(620, layout.width),
            height: Math.max(460, layout.height),
          }}
        >
          <ReactFlow<Node>
            nodes={nodes}
            nodeTypes={diagramNodeTypes}
            connectionMode={ConnectionMode.Loose}
            onNodesChange={onNodesChange}
            onInit={(instance) => {
              flow.current = instance;
              requestAnimationFrame(() => {
                const container = diagramContainer.current;
                if (container)
                  container.scrollLeft =
                    (container.scrollWidth - container.clientWidth) / 2;
              });
            }}
            fitViewOptions={{ padding: 0.14, maxZoom: 1, minZoom: 0.7 }}
            edges={edges}
            fitView
            nodesConnectable={false}
            nodesDraggable
            minZoom={0.25}
            maxZoom={1.5}
            colorMode="dark"
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
      <div className="playback">
        <button
          onClick={() => {
            setStep(0);
            setPlaying(false);
          }}
        >
          {tr("Restart")}
        </button>
        <button
          disabled={step === 0}
          onClick={() => {
            setPlaying(false);
            setStep((s) => s - 1);
          }}
        >
          {tr("Back")}
        </button>
        <button
          className="primary"
          onClick={() => {
            if (step >= edges.length) setStep(0);
            setPlaying(!playing);
          }}
        >
          {tr(playing ? "Pause" : "Play")}
        </button>
        <button
          disabled={step === edges.length}
          onClick={() => {
            setPlaying(false);
            setStep((s) => s + 1);
          }}
        >
          {tr("Step")}
        </button>
        <span>
          {step} / {edges.length}
        </span>
      </div>
      <p className="status" role="status">
        {active
          ? `${pattern.roles[Number(active[0])]} → ${tr(String(active[2]))} → ${pattern.roles[Number(active[1])]}`
          : tr(
              "Explain each relationship before stepping through the diagram.",
            )}
      </p>
      <details className="diagram-text">
        <summary>{tr("Text view:")}</summary>
        <ul>
          {edges.map((e, i) => (
            <li key={i}>
              {pattern.roles[Number(e.source)]} → {e.label} →{" "}
              {pattern.roles[Number(e.target)]}
            </li>
          ))}
        </ul>
      </details>
      <p className="fine-print">
        {tr(
          "Simplified UML-like diagram; arrows show the labeled relationship.",
        )}
      </p>
    </>
  );
}
