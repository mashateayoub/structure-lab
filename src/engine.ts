export type Frame = {
  values: number[];
  active: number[];
  done: number[];
  message: string;
  frontier?: string[];
  visited?: string[];
};
export function parseNumbers(text: string): number[] {
  if (!text.trim()) return [];
  const parts = text.split(",");
  if (
    parts.length > 16 ||
    parts.some(
      (p) =>
        !p.trim() || !Number.isFinite(Number(p)) || Math.abs(Number(p)) > 999,
    )
  )
    throw new Error(
      "Use up to 16 comma-separated numbers between −999 and 999.",
    );
  return parts.map(Number);
}
export function searchTrace(
  input: number[],
  target: number,
  binary = false,
): Frame[] {
  const values = binary ? [...input].sort((a, b) => a - b) : [...input];
  const frames: Frame[] = [
    {
      values,
      active: [],
      done: [],
      message: binary
        ? "Binary search requires sorted data. We sorted a copy first."
        : "Linear search examines values from left to right.",
    },
  ];
  let lo = 0,
    hi = values.length - 1;
  while (lo <= hi) {
    const i = binary ? Math.floor((lo + hi) / 2) : lo;
    frames.push({
      values,
      active: [i],
      done: [],
      message: `Compare ${values[i]} at index ${i} with ${target}.${binary ? ` Search interval: ${lo}–${hi}.` : ""}`,
    });
    if (values[i] === target) {
      frames.push({
        values,
        active: [],
        done: [i],
        message: `Found ${target} at index ${i}.`,
      });
      return frames;
    }
    if (binary && values[i] > target) hi = i - 1;
    else lo = i + 1;
  }
  frames.push({
    values,
    active: [],
    done: [],
    message: `${target} was not found.`,
  });
  return frames;
}
export function sortTrace(
  input: number[],
  kind: "Bubble" | "Insertion",
): Frame[] {
  const a = [...input];
  const frames: Frame[] = [];
  const snap = (active: number[], message: string, done: number[] = []) =>
    frames.push({ values: [...a], active, done, message });
  snap([], `Start ${kind.toLowerCase()} sort.`);
  if (kind === "Bubble") {
    for (let end = a.length - 1; end > 0; end--) {
      let swapped = false;
      for (let i = 0; i < end; i++) {
        snap([i, i + 1], `Compare ${a[i]} and ${a[i + 1]}.`);
        if (a[i] > a[i + 1]) {
          [a[i], a[i + 1]] = [a[i + 1], a[i]];
          swapped = true;
          snap([i, i + 1], "Swap the out-of-order neighbors.");
        }
      }
      if (!swapped) break;
    }
  } else {
    for (let i = 1; i < a.length; i++) {
      let j = i;
      snap([i], `Insert ${a[i]} into the sorted prefix.`);
      while (j > 0 && a[j - 1] > a[j]) {
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        snap([j - 1, j], "Move the smaller value left.");
        j--;
      }
    }
  }
  snap(
    [],
    "Sorted! Every value is in ascending order.",
    a.map((_, i) => i),
  );
  return frames;
}
export type Link = { source: string; target: string };
export function traverse(
  ids: string[],
  edges: Link[],
  start: string,
  depth = false,
): Frame[] {
  if (!ids.includes(start)) return [];
  const frontier = [start],
    discovered = new Set([start]),
    visited: string[] = [],
    frames: Frame[] = [];
  const snap = (message: string) =>
    frames.push({
      values: [],
      active: [],
      done: [],
      frontier: [...frontier],
      visited: [...visited],
      message,
    });
  snap(
    `Begin at ${start}. Follow outgoing edges; disconnected nodes are not visited.`,
  );
  while (frontier.length) {
    const node = depth ? frontier.pop()! : frontier.shift()!;
    visited.push(node);
    const next = edges.filter((e) => e.source === node).map((e) => e.target);
    for (const id of depth ? [...next].reverse() : next)
      if (ids.includes(id) && !discovered.has(id)) {
        discovered.add(id);
        frontier.push(id);
      }
    snap(
      `Visit ${node}. ${depth ? "Stack (top on right)" : "Queue (front on left)"}: ${frontier.join(", ") || "empty"}.`,
    );
  }
  snap(`Complete: ${visited.join(" → ")}.`);
  return frames;
}
export type TreeItem = {
  id: string;
  value: number;
  left?: TreeItem;
  right?: TreeItem;
};
export function buildBST(values: number[]): TreeItem | undefined {
  let root: TreeItem | undefined;
  values.forEach((value) => {
    if (!root) {
      root = { id: String(value), value };
      return;
    }
    let node = root;
    while (true) {
      if (value === node.value) return;
      const side = value < node.value ? "left" : "right";
      if (!node[side]) {
        node[side] = { id: String(value), value };
        return;
      }
      node = node[side]!;
    }
  });
  return root;
}
export function treeLayout(root?: TreeItem) {
  const nodes: {
      id: string;
      data: { label: string };
      position: { x: number; y: number };
    }[] = [],
    edges: Link[] = [];
  let rank = 0;
  const visit = (node: TreeItem | undefined, depth: number) => {
    if (!node) return;
    visit(node.left, depth + 1);
    nodes.push({
      id: node.id,
      data: { label: String(node.value) },
      position: { x: rank++ * 95, y: depth * 100 },
    });
    for (const child of [node.left, node.right])
      if (child) edges.push({ source: node.id, target: child.id });
    visit(node.right, depth + 1);
  };
  visit(root, 0);
  return { nodes, edges };
}
