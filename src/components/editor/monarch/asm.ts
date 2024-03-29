import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { base } from "./base";

export const AsmLanguage: monaco.languages.IMonarchLanguage = {
  defaultToken: "invalid",

  keywords: ["JMP", "JGE", "JLE", "JEQ", "JGT", "JLT"],

  // C# style strings
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  // The main tokenizer for our languages
  tokenizer: {
    root: [
      // Output Formats
      [/%[BDSX]\d+\.\d+\.\d+/, "keyword"],

      // identifiers and keywords
      [/ROM32K/, "keyword"],
      [/[a-zA-Z-]+/, { cases: { "@keywords": "identifier", "@default": "identifier" } }],

      // numbers
      [/%X[0-9a-fA-F]+/, "number.hex"],
      [/(%D)?\d+/, "number"],
      [/%B[01]+/, "number"],

      [/@\s*[a-zA-Z_\$][\w\$]*/, "keyword"],

      // whitespace
      { include: "@whitespace" },

      [/[{}]/, "@bracket"],
      [/<>/, "operator"],
      [/[[\].]/, "operator"],

      // strings
      [/"([^"\\]|\\.)*$/, "string.invalid"], // non-teminated string
      [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],

      // delimiter: after number because of .\d floats
      [/[;:!,]/, "delimiter"],
    ],

    ...base.tokenizer,
  },
};
