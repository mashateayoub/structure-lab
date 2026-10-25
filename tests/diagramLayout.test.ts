import { expect, it } from "vitest";
import { patterns } from "../src/patternEngine";
import { patternLayout, arrangeGraph } from "../src/diagramLayout";
import { buildBST, treeLayout } from "../src/engine";
for (const pattern of patterns)
  it(`${pattern.id}: spaced nodes and distinct connection ports`, () => {
    const { nodes, edges } = patternLayout(pattern);
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i].position,
          b = nodes[j].position;
        expect(Math.abs(a.x - b.x) >= 240 || Math.abs(a.y - b.y) >= 130).toBe(
          true,
        );
      }
    const used = new Set<string>();
    for (const e of edges) {
      for (const [id, handle] of [
        [e.source, e.sourceHandle],
        [e.target, e.targetHandle],
      ]) {
        expect(used.has(id + handle)).toBe(false);
        used.add(id + handle);
      }
    }
  });
it("graph arrangement preserves cycles, disconnected vertices and edge order", () => {
  const nodes = ["A", "B", "C", "D"].map((id) => ({
    id,
    data: { label: id },
    position: { x: 0, y: 0 },
  }));
  const edges = [
    { source: "A", target: "B" },
    { source: "B", target: "C" },
    { source: "C", target: "A" },
  ];
  const before = JSON.stringify(edges),
    out = arrangeGraph(nodes, edges);
  expect(out.map((n) => n.id)).toEqual(["A", "B", "C", "D"]);
  expect(JSON.stringify(edges)).toBe(before);
  expect(out[1].position.y).toBeGreaterThan(out[0].position.y);
  expect(out[2].position.y).toBeGreaterThan(out[1].position.y);
  expect(new Set(out.map((n) => `${n.position.x},${n.position.y}`)).size).toBe(
    4,
  );
});
it("tidy trees keep siblings apart and parents centered over two children", () => {
  for (const values of [
    [40, 20, 60, 10, 30, 50, 70],
    [40, 10, 60, 5, 20, 15, 18, 17, 80],
    [1, 2, 3, 4, 5],
  ]) {
    const tree = buildBST(values),
      { nodes } = treeLayout(tree);
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++)
        if (nodes[i].position.y === nodes[j].position.y)
          expect(
            Math.abs(nodes[i].position.x - nodes[j].position.x),
          ).toBeGreaterThanOrEqual(140);
    if (tree?.left && tree.right) {
      const x = (id: string) => nodes.find((n) => n.id === id)!.position.x;
      expect(x(tree.id)).toBe((x(tree.left.id) + x(tree.right.id)) / 2);
    }
  }
});
