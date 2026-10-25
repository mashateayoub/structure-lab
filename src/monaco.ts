import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
// editor.api alone omits editor features such as the suggestion widget.
import "monaco-editor/esm/vs/editor/editor.all";
// The TS language service supplies IntelliSense; these supply syntax tokens.
import "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution";
import "monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution";
import "monaco-editor/esm/vs/language/typescript/monaco.contribution";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import TypeScriptWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

self.MonacoEnvironment = {
  getWorker(_id, label) {
    return label === "typescript" || label === "javascript"
      ? new TypeScriptWorker()
      : new EditorWorker();
  },
};

for (const defaults of [
  monaco.languages.typescript.javascriptDefaults,
  monaco.languages.typescript.typescriptDefaults,
]) {
  defaults.setEagerModelSync(true);
  defaults.setCompilerOptions({
    ...defaults.getCompilerOptions(),
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    allowNonTsExtensions: true,
  });
}

loader.config({ monaco });

export const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions =
  {
    minimap: { enabled: false },
    fontSize: 14,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: "on",
    accessibilitySupport: "on",
    quickSuggestions: { other: true, comments: false, strings: false },
    suggestOnTriggerCharacters: true,
    parameterHints: { enabled: true },
    tabCompletion: "on",
    acceptSuggestionOnEnter: "on",
    "semanticHighlighting.enabled": true,
  };
