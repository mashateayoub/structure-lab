import data from "./patterns.json";
export const patterns = data;
export type Pattern = (typeof patterns)[number];
export type Locale = "en" | "fr";
export function example(
  pattern: Pattern,
  amount = 3,
  alternate = false,
  typescript = false,
) {
  const prelude = typescript
    ? `type ExperimentInput = { amount: number; alternate: boolean };\nconst input: ExperimentInput = { amount: ${amount}, alternate: ${alternate} };\nconst { amount, alternate } = input;\n`
    : `const amount = ${amount};\nconst alternate = ${alternate};\n`;
  // Function scope keeps experiments independent and gives TS examples a typed input boundary.
  let body = pattern.code;
  if (typescript) {
    body = body.replace(
      "const listeners = new Set();",
      "const listeners = new Set<(n: number) => void>();",
    );
    body = body.replace(
      "createNotifier() { throw",
      "createNotifier(): { send: (n: number) => string } { throw",
    );
    const fields: Record<string, string> = {
      ReportBuilder: 'sections: string[]; heading = "";',
      Configuration: "static instance: { limit: number } | undefined;",
      Remote: "device: { setVolume: (n: number) => unknown };",
      Playlist: "values: number[];",
      Shipping: "strategy: (weight: number) => number;",
    };
    for (const [name, fieldsText] of Object.entries(fields))
      body = body.replace(
        `class ${name} {`,
        `class ${name} {\n  ${fieldsText}`,
      );
    if (pattern.id === "template-method")
      body = body.replace(
        "parse(raw) { throw",
        "parse(raw): (string | number)[] { throw",
      );
  }
  return prelude + "\n" + body;
}
export const challenges: Record<
  string,
  { en: string; fr: string; from: string; to: string }
> = {
  adapter: {
    en: "Repair the cents-to-units conversion. Both modes must keep their documented behavior.",
    fr: "Réparez la conversion des centimes en unités. Les deux modes doivent conserver leur comportement documenté.",
    from: "cents / 100",
    to: "cents",
  },
  strategy: {
    en: "Repair standard shipping: each unit of weight costs 2. Keep express pricing unchanged.",
    fr: "Réparez le tarif standard : chaque unité de poids coûte 2. Conservez le tarif express.",
    from: "weight * 2",
    to: "weight * 3",
  },
  composite: {
    en: "Repair the bundle accumulator so nested items contribute their full price.",
    fr: "Réparez l’accumulateur du lot pour additionner le prix complet des éléments imbriqués.",
    from: "sum + c.total()",
    to: "sum",
  },
  observer: {
    en: "Repair unsubscribe so the alert listener is removed in alternative mode.",
    fr: "Réparez le désabonnement pour retirer l’alerte en mode alternatif.",
    from: "listeners.delete(fn)",
    to: "listeners.has(fn)",
  },
  proxy: {
    en: "Repair cache lookup so repeated image requests only load the image once.",
    fr: "Réparez la recherche du cache pour charger une seule fois une image demandée plusieurs fois.",
    from: "!cache.has(key)",
    to: "true",
  },
  command: {
    en: "Repair undo so executing then undoing restores the original document value.",
    fr: "Réparez l’annulation pour restaurer la valeur initiale après exécution puis annulation.",
    from: "document.value -= amount",
    to: "document.value += amount",
  },
};
export function challengeSource(pattern: Pattern) {
  const c = challenges[pattern.id];
  return c ? pattern.code.replace(c.from, c.to) : pattern.code;
}
