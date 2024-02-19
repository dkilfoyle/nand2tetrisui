import { loader } from "@monaco-editor/react";
import { CmpLanguage } from "./cmp";
import { HdlLanguage } from "./hdl";
import { TstLanguage } from "./tst";
import { IBuiltinChip, builtinChips } from "../simulator/builtins";
import type * as monacoT from "monaco-editor/esm/vs/editor/editor.api";

const LANGUAGES = {
  hdl: HdlLanguage,
  cmp: CmpLanguage,
  tst: TstLanguage,
};

function escapeMarkdownSyntaxTokens(text: string): string {
  // escape markdown syntax tokens: http://daringfireball.net/projects/markdown/syntax#backslash
  return text.replace(/[\\`*_{}[\]()#+\-!]/g, "\\$&");
}

function appendMarkdown(current: string, append: string): string {
  return (
    current +
    escapeMarkdownSyntaxTokens(append)
      .replace(/([ \t]+)/g, (_match, g1) => "&nbsp;".repeat(g1.length))
      .replace(/>/gm, "\\>")
      .replace(/\n/g, "\n\n")
  );
}

const buildChipDocumentation = (chip: IBuiltinChip) => {
  const inputs = chip.inputs.map((input) => `${input.name}[${input.width}]`).join(", ");
  const outputs = chip.outputs.map((output) => `${output.name}[${output.width}]`).join(", ");
  return appendMarkdown(
    `**${chip.name}(${inputs}${outputs.length > 0 ? ", " : ""}${outputs})**`,
    `
${chip.documentation || ""}`
  );
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
        console.log(buildChipDocumentation(chip));
        return {
          label: chip.name,
          kind: languages.CompletionItemKind.Snippet,
          insertText: `${chip.name}(${inputs} ${outputs});`,
          insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: { value: buildChipDocumentation(chip), kind: "markdown" },
          // detail: "bla bla",
          range: range,
        } as monacoT.languages.CompletionItem;
      });
      return { suggestions: suggestions };
    },
  });
}
