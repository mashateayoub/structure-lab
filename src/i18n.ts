import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import fr from "./fr.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: Object.fromEntries(Object.keys(fr).map(key => [key, key])) }, fr: { translation: fr } },
    fallbackLng: "en",
    supportedLngs: ["en", "fr"],
    load: "languageOnly",
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "structure-lab-language",
    },
  });
const templates: [RegExp, string][] = [
  [/^Set (.+) to (.+)\.$/, "Clé $1 définie à $2."],
  [/^Deleted (.+)\.$/, "$1 supprimé."],
  [/^Key (.+) does not exist\.$/, "La clé $1 n’existe pas."],
  [/^Added (.+) at the end\.$/, "$1 ajouté à la fin."],
  [/^New head is (.+)\.$/, "La nouvelle tête est $1."],
  [
    /^(.+) is already present; no duplicate added\.$/,
    "$1 est déjà présent ; aucun doublon ajouté.",
  ],
  [/^Added unique value (.+)\.$/, "Valeur unique $1 ajoutée."],
  [/^(.+) is in the Set\.$/, "$1 appartient au Set."],
  [/^(.+) is not in the Set\.$/, "$1 n’appartient pas au Set."],
  [/^(.+) is not present\.$/, "$1 est absent."],
  [/^Popped (.+) from the top\.$/, "$1 dépilé depuis le sommet."],
  [/^Removed (.+) from the front\.$/, "$1 retiré du début."],
  [
    /^Enter an index from 0 to (\d+)(; collection is empty)?\.$/,
    "Saisissez un indice de 0 à $1.",
  ],
  [/^Index (.+) contains (.+)\.$/, "L’indice $1 contient $2."],
  [
    /^Inserted (.+) at index (.+); later values shift right\.$/,
    "$1 inséré à l’indice $2 ; les valeurs suivantes sont décalées.",
  ],
  [/^Removed (.+) at index (.+)\.$/, "$1 retiré à l’indice $2."],
  [
    /^Inserted (.+)\. Follow smaller-left, larger-right comparisons from the root\.$/,
    "$1 inséré. Depuis la racine : plus petit à gauche, plus grand à droite.",
  ],
  [
    /^Added (.+)\. Connect a bottom handle to another node’s top handle\.$/,
    "$1 ajouté. Reliez sa poignée inférieure à la poignée supérieure d’un autre nœud.",
  ],
  [
    /^Compare (.+) at index (.+) with (.+)\. Search interval: (.+)\.$/,
    "Comparer $1 à l’indice $2 avec $3. Intervalle de recherche : $4.",
  ],
  [
    /^Compare (.+) at index (.+) with (.+)\.$/,
    "Comparer $1 à l’indice $2 avec $3.",
  ],
  [/^Found (.+) at index (.+)\.$/, "$1 trouvé à l’indice $2."],
  [/^(.+) was not found\.$/, "$1 introuvable."],
  [/^Start bubble sort\.$/, "Début du tri à bulles."],
  [/^Start insertion sort\.$/, "Début du tri par insertion."],
  [/^Compare (.+) and (.+)\.$/, "Comparer $1 et $2."],
  [
    /^Insert (.+) into the sorted prefix\.$/,
    "Insérer $1 dans le préfixe trié.",
  ],
  [
    /^Begin at (.+)\. Follow outgoing edges; disconnected nodes are not visited\.$/,
    "Départ : $1. Suivez les arcs sortants ; les nœuds déconnectés ne sont pas visités.",
  ],
  [
    /^Visit (.+)\. Stack \(top on right\): (.+)\.$/,
    "Visiter $1. Pile (sommet à droite) : $2.",
  ],
  [
    /^Visit (.+)\. Queue \(front on left\): (.+)\.$/,
    "Visiter $1. File (début à gauche) : $2.",
  ],
  [/^Complete: (.+)\.$/, "Terminé : $1."],
  [/^node (\d+)$/, "nœud $1"],
  [/^Lesson (\d+) of 17$/, "Leçon $1 sur 17"],
  [/^(\d+) \/ 17 mastered$/, "$1 / 17 maîtrisés"],
  [/^Error: (.+)$/, "Erreur : $1"],
  [/^(\d+)\/(\d+) challenge tests passed\.$/, "$1/$2 tests du défi réussis."],
  [/^(.+); expected (.+)$/, "$1 ; attendu $2"],
];
/** Translate display values only. IDs, action dispatch and persisted keys stay stable. */
export function tr<T>(value: T): T {
  if (Array.isArray(value)) return value.map(tr) as T;
  if (typeof value !== "string" || !i18n.resolvedLanguage?.startsWith("fr"))
    return value;
  const exact = i18n.t(value);
  if (exact !== value) return exact as T;
  if (value.includes("\n")) return value.split("\n").map(tr).join("\n") as T;
  if (value.startsWith("Error: ")) return `Erreur : ${tr(value.slice(7))}` as T;
  if (/^(PASS|FAIL) /.test(value)) return value.replace(/^PASS /, "RÉUSSI ").replace(/^FAIL /, "ÉCHEC ").replace("; expected ", "; attendu ") as T;
  for (const [expression, replacement] of templates) {
    if (expression.test(value))
      return value
        .replace(expression, replacement)
        .replace(/\bempty\b/g, "vide") as T;
  }
  // Preserve whitespace around inline JSX labels.
  const trimmed = value.trim();
  if (trimmed !== value && i18n.t(trimmed) !== trimmed)
    return value.replace(trimmed, i18n.t(trimmed)) as T;
  return value;
}
export const language = () =>
  i18n.resolvedLanguage?.startsWith("fr") ? "fr" : "en";
export default i18n;
