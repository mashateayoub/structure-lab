import { describe, expect, it } from "vitest";
import {
  buildBST,
  parseNumbers,
  searchTrace,
  sortTrace,
  traverse,
  treeLayout,
} from "../src/engine";
describe("data parsing", () => {
  it("handles empty and signed values", () => {
    expect(parseNumbers("")).toEqual([]);
    expect(parseNumbers("-2, 0, 1.5")).toEqual([-2, 0, 1.5]);
  });
  it("rejects malformed or huge input", () => {
    for (const value of [
      "2,,3",
      "NaN",
      "Infinity",
      "1000",
      Array(18).fill("1").join(","),
    ])
      expect(() => parseNumbers(value)).toThrow();
  });
});
describe("search traces", () => {
  for (const binary of [false, true]) {
    it(`finds present values and reports absent values (binary=${binary})`, () => {
      const input = [9, -2, 4, 4, 0];
      const frames = searchTrace(input, 4, binary);
      const final = frames.at(-1)!;
      expect(final.values[final.done[0]]).toBe(4);
      expect(searchTrace(input, 88, binary).at(-1)!.message).toContain(
        "not found",
      );
      expect(searchTrace([], 0, binary).at(-1)!.message).toContain("not found");
      expect(input).toEqual([9, -2, 4, 4, 0]);
    });
  }
});
describe("sorting", () => {
  for (const algorithm of ["Bubble", "Insertion"] as const) {
    it(`${algorithm} sorts without mutating input and retains independent snapshots`, () => {
      for (const input of [
        [],
        [1],
        [3, 3, -2, 0],
        [5, 4, 3, 2, 1],
        [1, 2, 3],
      ]) {
        const before = [...input],
          frames = sortTrace(input, algorithm);
        expect(frames.at(-1)!.values).toEqual([...input].sort((a, b) => a - b));
        expect(input).toEqual(before);
        expect(frames[0].values).toEqual(before);
      }
    });
  }
});
describe("traversals", () => {
  const ids = ["A", "B", "C", "D", "X"];
  const edges = [
    { source: "A", target: "B" },
    { source: "A", target: "C" },
    { source: "B", target: "D" },
    { source: "D", target: "A" },
  ];
  it("BFS visits in layers, handles cycles and excludes disconnected nodes", () => {
    expect(traverse(ids, edges, "A").at(-1)!.visited).toEqual([
      "A",
      "B",
      "C",
      "D",
    ]);
  });
  it("DFS uses stack order and skips revisits", () => {
    expect(traverse(ids, edges, "A", true).at(-1)!.visited).toEqual([
      "A",
      "B",
      "D",
      "C",
    ]);
  });
  it("handles missing and isolated roots", () => {
    expect(traverse(ids, edges, "missing")).toEqual([]);
    expect(traverse(ids, edges, "X").at(-1)!.visited).toEqual(["X"]);
  });
});
describe("BST", () => {
  it("inserts with ordering, skips duplicates, lays out in sorted order", () => {
    const tree = buildBST([40, 20, 60, 10, 30, 20]);
    expect(tree?.left?.right?.value).toBe(30);
    const layout = treeLayout(tree);
    expect(layout.nodes.map((n) => Number(n.id))).toEqual([10, 20, 30, 40, 60]);
    expect(layout.edges).toHaveLength(4);
  });
  it("handles empty and skewed trees", () => {
    expect(treeLayout(buildBST([])).nodes).toEqual([]);
    expect(buildBST([1, 2, 3])?.right?.right?.value).toBe(3);
  });
});
