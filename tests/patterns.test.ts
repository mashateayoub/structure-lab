import { describe, expect, it } from "vitest";
import {
  patterns,
  example,
  challenges,
  challengeSource,
} from "../src/patternEngine";
import ts from "typescript";
const run = (source: string) => {
  const lines: unknown[][] = [];
  new Function("console", source)({
    log: (...args: unknown[]) => lines.push(args),
  });
  return JSON.parse(JSON.stringify(lines));
};
describe("pattern curriculum", () => {
  it("covers exactly 22 categorized lessons with complete bilingual content and valid relationships", () => {
    expect(patterns).toHaveLength(22);
    expect(new Set(patterns.map((p) => p.id)).size).toBe(22);
    expect(
      ["creational", "structural", "behavioral"].map(
        (c) => patterns.filter((p) => p.category === c).length,
      ),
    ).toEqual([5, 7, 10]);
    for (const p of patterns) {
      for (const lang of ["en", "fr"] as const) {
        for (const field of [
          "name",
          "intent",
          "problem",
          "solution",
          "tradeoff",
          "question",
          "explanation",
          "variant",
        ] as const)
          expect(p[field][lang].length).toBeGreaterThan(0);
        expect(p.answers[lang]).toHaveLength(3);
        expect(p.answers[lang][p.correct]).toBeTruthy();
      }
      for (const [a, b] of p.edges) {
        expect(p.roles[Number(a)]).toBeTruthy();
        expect(p.roles[Number(b)]).toBeTruthy();
      }
    }
  });
  for (const p of patterns)
    it(`${p.name.en}: JS and transpiled TS agree in both modes across inputs`, () => {
      for (const amount of [1, 3, 7])
        for (const alternate of [false, true]) {
          const js = run(example(p, amount, alternate));
          expect(js.length).toBeGreaterThan(0);
          const compiled = ts.transpileModule(
            example(p, amount, alternate, true),
            {
              compilerOptions: {
                target: ts.ScriptTarget.ES2022,
                module: ts.ModuleKind.None,
              },
              reportDiagnostics: true,
            },
          );
          expect(compiled.diagnostics).toEqual([]);
          expect(run(compiled.outputText)).toEqual(js);
        }
    });
  for (const id of Object.keys(challenges))
    it(`${id}: challenge mutation produces observable failures`, () => {
      const p = patterns.find((p) => p.id === id)!;
      let mismatches = 0;
      for (const amount of [1, 3, 7])
        for (const alternate of [false, true]) {
          const pre = `const amount=${amount};const alternate=${alternate};\n`;
          const expected = run(pre + p.code);
          if (
            JSON.stringify(run(pre + challengeSource(p))) !==
            JSON.stringify(expected)
          )
            mismatches++;
        }
      expect(mismatches).toBeGreaterThan(0);
    });
  it("demonstrates behavioral differences, not just a playback counter", () => {
    const result = (id: string, alternate = false) =>
      run(example(patterns.find((p) => p.id === id)!, 3, alternate));
    expect(result("adapter")[0][0]).toEqual({ cents: 300, chargedUnits: 3 });
    expect(result("adapter", true)[0][0]).toEqual({
      cents: 300,
      chargedUnits: 300,
    });
    expect(result("proxy")[0][0]).toEqual({ requests: 3, actualLoads: 1 });
    expect(result("proxy", true)[0][0]).toEqual({
      requests: 3,
      actualLoads: 3,
    });
    expect(result("observer", true)[0][0]).toEqual(["display:3"]);
    expect(result("strategy")[0][0]).toBe(6);
    expect(result("strategy", true)[0][0]).toBe(17);
    expect(result("prototype")[0][0]).toEqual({ original: 12, clone: 3 });
    expect(result("prototype", true)[0][0]).toEqual({ original: 3, clone: 3 });
    expect(result("memento", true)[0][0]).toBe("Draft");
    expect(result("visitor", true)[0][0]).toBe("(3 + 2)");
  });
});
