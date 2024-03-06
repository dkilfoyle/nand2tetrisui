import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { base } from "./base";

export const AsmLanguage: monaco.languages.IMonarchLanguage = {
  defaultToken: "invalid",

  keywords: ["JMP", "JGE", "JLE", "JEQ", "JGT", "JLT"],

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

    comment: [
      [/[^/*]+/, "comment"],
      [/\/\*/, "comment", "@push"], // nested comment
      ["\\*/", "comment", "@pop"],
      [/[/*]/, "comment"],
    ],

    whitespace: [
      [/[ \t\r\n]+/, "white"],
      [/\/\*/, "comment", "@comment"],
      [/\/\/.*$/, "comment"],
    ],

    string: [
      [/[^\\"]+/, "string"],
      [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
    ],
  },
};
