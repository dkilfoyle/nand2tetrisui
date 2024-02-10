import { loader } from "@monaco-editor/react";
import { CmpLanguage } from "./cmp";
import { HdlLanguage } from "./hdl";
import { TstLanguage } from "./tst";
import { builtinChips } from "../simulator/builtins";
import type * as monacoT from "monaco-editor/esm/vs/editor/editor.api";

const LANGUAGES = {
  hdl: HdlLanguage,
  cmp: CmpLanguage,
  tst: TstLanguage,
};

export async function registerLanguages() {
  const { languages } = await loader.init();
  for (const [id, language] of Object.entries(LANGUAGES)) {
    languages.register({ id });
    languages.setMonarchTokensProvider(id, language);
  }

  languages.registerCompletionItemProvider("hdl", {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      const suggestions = Object.values(builtinChips).map((chip) => {
        const inputs = chip.inputs.map((input, n) => `${input.name}=$${n + 1}`).join(", ");
        const outputs = chip.outputs.map((output, n) => `${output.name}=$${n + 1}`).join(", ");
        return {
          label: chip.name,
          kind: languages.CompletionItemKind.Snippet,
          insertText: `${chip.name}(${inputs} ${outputs});`,
          insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: chip.documentation,
          // detail: "bla bla",
          range: range,
        } as monacoT.languages.CompletionItem;
      });
      return { suggestions: suggestions };
    },
  });
}
