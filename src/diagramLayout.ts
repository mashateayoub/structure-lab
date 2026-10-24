import { Position, type Node } from "@xyflow/react";
import type { Pattern } from "./patternEngine";

// Deliberate role-based layouts keep inheritance, delegation and return paths apart.
const patternPositions: Record<string, [number, number][]> = {
  "factory-method": [
    [170, 0],
    [0, 180],
    [340, 180],
    [170, 360],
  ],
  "abstract-factory": [
    [170, 0],
    [170, 160],
    [0, 320],
    [340, 320],
    [170, 480],
  ],
  singleton: [
    [0, 0],
    [170, 200],
    [340, 0],
  ],
  bridge: [
    [170, 0],
    [170, 160],
    [0, 340],
    [340, 340],
  ],
  composite: [
    [170, 0],
    [170, 170],
    [0, 360],
    [340, 360],
  ],
  decorator: [
    [170, 0],
    [170, 510],
    [170, 340],
    [170, 170],
  ],
  facade: [
    [300, 0],
    [300, 160],
    [0, 350],
    [300, 350],
    [600, 350],
  ],
  flyweight: [
    [170, 0],
    [0, 180],
    [340, 180],
    [170, 360],
  ],
  mediator: [
    [170, 0],
    [170, 170],
    [0, 350],
    [340, 350],
  ],
  memento: [
    [0, 0],
    [340, 180],
    [0, 360],
  ],
  observer: [
    [170, 0],
    [170, 160],
    [0, 340],
    [340, 340],
  ],
  state: [
    [170, 0],
    [170, 160],
    [0, 350],
    [340, 350],
  ],
  strategy: [
    [170, 0],
    [170, 160],
    [0, 340],
    [340, 340],
  ],
  "template-method": [
    [170, 0],
    [170, 160],
    [0, 340],
    [340, 340],
  ],
  visitor: [
    [170, 0],
    [170, 160],
    [0, 330],
    [340, 330],
    [170, 500],
  ],
};
export const sides = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
];
export function connectionSides(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  if (a.y === b.y)
    return a.x < b.x
      ? [Position.Right, Position.Left]
      : [Position.Left, Position.Right];
  return a.y < b.y
    ? [Position.Bottom, Position.Top]
    : [Position.Top, Position.Bottom];
}
export function patternLayout(pattern: Pattern) {
  const positions =
    patternPositions[pattern.id] ||
    pattern.roles.map((_, i) => [170, i * 170] as [number, number]);
  const nodes: Node[] = pattern.roles.map((label, i) => ({
    id: String(i),
    type: "readable",
    position: { x: positions[i][0], y: positions[i][1] },
    data: { label, ports: [] },
    style: { width: 200, height: 64 },
  }));
  const ports: Record<
    string,
    { id: string; side: Position; offset: number }[]
  > = Object.fromEntries(nodes.map((n) => [n.id, []]));
  const edges = pattern.edges.map(([source, target, label], i) => {
    const s = String(source),
      t = String(target);
    let [from, to] = connectionSides(
      nodes[Number(source)].position,
      nodes[Number(target)].position,
    );
    // Keep reverse/composite links and long wrapper delegation outside the hierarchy.
    if (pattern.id === "composite" && i === 3) from = to = Position.Right;
    if (pattern.id === "memento" && i === 2) from = to = Position.Left;
    if (pattern.id === "decorator" && i === 0) from = to = Position.Left;
    const sourceHandle = `edge-${i}-source`,
      targetHandle = `edge-${i}-target`;
    ports[s].push({ id: sourceHandle, side: from, offset: 50 });
    ports[t].push({ id: targetHandle, side: to, offset: 50 });
    return {
      id: String(i),
      source: s,
      target: t,
      sourceHandle,
      targetHandle,
      label: String(label),
      type: "smoothstep",
      pathOptions: { borderRadius: 12, offset: 36 },
    };
  });
  for (const node of nodes) {
    for (const side of sides) {
      const group = ports[node.id].filter((p) => p.side === side);
      group.forEach(
        (port, i) => (port.offset = ((i + 1) * 100) / (group.length + 1)),
      );
    }
    node.data.ports = ports[node.id];
  }
  return {
    nodes,
    edges,
    width: Math.max(...positions.map((p) => p[0])) + 280,
    height: Math.max(...positions.map((p) => p[1])) + 160,
  };
}
/** Cycle-safe breadth layers; preserves graph topology and traversal order. */
export function arrangeGraph(
  nodes: Node[],
  edges: { source: string; target: string }[],
): Node[] {
  const ids = new Set(nodes.map((n) => n.id)),
    depth = new Map<string, number>();
  const incoming = new Set(
    edges
      .filter((e) => ids.has(e.source) && ids.has(e.target))
      .map((e) => e.target),
  );
  const roots = nodes.filter((n) => !incoming.has(n.id));
  const queue = (roots.length ? roots : [nodes[0]])
    .filter(Boolean)
    .map((n) => n.id);
  queue.forEach((id) => depth.set(id, 0));
  let head = 0;
  for (const seed of [...queue, ...nodes.map((n) => n.id)]) {
    if (!depth.has(seed)) {
      depth.set(seed, 0);
      queue.push(seed);
    }
    while (head < queue.length) {
      const id = queue[head++];
      for (const e of edges)
        if (e.source === id && ids.has(e.target) && !depth.has(e.target)) {
          depth.set(e.target, depth.get(id)! + 1);
          queue.push(e.target);
        }
    }
  }
  const levels = new Map<number, Node[]>();
  for (const n of nodes) {
    const d = depth.get(n.id)!;
    levels.set(d, [...(levels.get(d) || []), n]);
  }
  const widest = Math.max(1, ...[...levels.values()].map((row) => row.length));
  return nodes.map((n) => {
    const d = depth.get(n.id)!,
      row = levels.get(d)!;
    return {
      ...n,
      type: "readable",
      position: {
        x: ((widest - row.length) / 2 + row.indexOf(n)) * 160,
        y: d * 150,
      },
      style: { ...n.style, width: 80, height: 54 },
    };
  });
}
