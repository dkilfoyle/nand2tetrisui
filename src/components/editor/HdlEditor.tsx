import Editor, { OnMount, useMonaco } from "@monaco-editor/react";
import type * as monacoT from "monaco-editor/esm/vs/editor/editor.api";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseHdl } from "../../languages/hdl/hdlParser";
import { compileHdl } from "../../languages/hdl/hdlCompiler";
import { useAtom } from "jotai";
import { ELKNode } from "../schematic/elkBuilder";
import { activeTabAtom, chipAtom, elkAtom, selectedPartAtom } from "../../store/atoms";
import { IAstChip } from "../../languages/hdl/hdlInterface";
import { IBuiltinChip, builtinChips } from "../../languages/hdl/builtins";

const buildChipDetail = (chip: IBuiltinChip) => {
  const inputs = chip.inputs.map((input) => `${input.name}[${input.width}]`).join(", ");
  const outputs = chip.outputs.map((output) => `${output.name}[${output.width}]`).join(", ");
  return `${chip.name}(${inputs}${outputs.length > 0 ? ", " : ""}${outputs})`;
};

const buildChipDocumentation = (chip: IBuiltinChip) => {
  return buildChipDetail(chip) + "\n\n" + chip.documentation;
};

export function HdlEditor({ name, sourceCode }: { name: string; sourceCode: string }) {
  const editor = useRef<monacoT.editor.IStandaloneCodeEditor>();
  const monaco = useMonaco();
  const cursorEvent = useRef<monacoT.IDisposable>();

  const [errors, setErrors] = useState<monacoT.editor.IMarkerData[]>([]);
  const language = "hdl";

  const [elk, setElk] = useAtom(elkAtom);
  const [chip, setChip] = useAtom(chipAtom);
  const [selectedPart, setSelectedPart] = useAtom(selectedPartAtom);
  const [activeTab] = useAtom(activeTabAtom);
  const [ast, setAst] = useState<IAstChip>();

  // Add error markers on parse failure
  useEffect(() => {
    if (editor.current === undefined) return;
    if (monaco === null) return;
    const model = editor.current.getModel();
    if (model === null) return;
    monaco.editor.setModelMarkers(model, language, errors);
    if (errors.length > 0 && activeTab == name) {
      setElk({
        id: "0",
        hwMeta: { maxId: 0, bodyText: errors[0].message, name: "error", cls: null },
        ports: [],
        edges: [],
        children: [],
        properties: {
          "org.eclipse.elk.portConstraints": "FIXED_ORDER", // can be also "FREE" or other value accepted by ELK
          "org.eclipse.elk.layered.mergeEdges": 1,
        },
      } as ELKNode);
    }
  }, [errors, editor, monaco, language, setElk, activeTab, name]);

  const parseAndCompile = useCallback(
    (code: string) => {
      const { ast, parseErrors } = parseHdl(code);
      if (parseErrors.length > 0) setErrors(parseErrors);
      else {
        setAst(ast);
        compileHdl(ast).then(({ chip: newchip, compileErrors, elk: newelk }) => {
          setErrors(compileErrors.map((e) => ({ message: e.message, ...e.span, severity: 4 })));
          if (compileErrors.length == 0 && activeTab == name) {
            setElk(newelk as ELKNode);
            setChip(newchip);
          }
        });
      }
    },
    [activeTab, name, setChip, setElk]
  );

  useEffect(() => {
    if (editor && editor.current && activeTab == name) {
      parseAndCompile(editor.current?.getValue());
    }
  }, [activeTab, editor, name, parseAndCompile]);

  const onChangeCursorPosition = useCallback(
    (e: monacoT.editor.ICursorPositionChangedEvent) => {
      const index = editor.current?.getModel()?.getOffsetAt(e.position);
      if (index !== undefined && ast && chip) {
        const i = ast.parts.findIndex((part) => index > part.span.startOffset && index <= part.span.endOffset);
        if (i >= 0) setSelectedPart([...chip.parts][i]);
        else setSelectedPart(chip);
      } else setSelectedPart(undefined);
    },
    [ast, chip, setSelectedPart]
  );

  useEffect(() => {
    if (cursorEvent.current) cursorEvent?.current.dispose();
    cursorEvent.current = editor?.current?.onDidChangeCursorPosition(onChangeCursorPosition);
  }, [onChangeCursorPosition]);

  const onMount: OnMount = useCallback(
    (ed) => {
      editor.current = ed;
      const value = editor.current.getValue();
      parseAndCompile(value);
    },
    [parseAndCompile]
  );

  useEffect(() => {
    if (monaco) {
      monaco.editor.quickSuggestions = true;
      const hoverDisposable = monaco.languages.registerHoverProvider("hdl", {
        provideHover: (model, position, token) => {
          const word = model.getWordAtPosition(position);
          if (!word) return;
          const builtin = builtinChips.find((builtin) => builtin.name == word.word);
          if (builtin)
            return {
              contents: [{ value: `Builtin: ${builtin.name}` }, { value: buildChipDetail(builtin) }],
            };
        },
      });
      const completionDisposable = monaco.languages.registerCompletionItemProvider("hdl", {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const line = model.getLineContent(position.lineNumber);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          const partSuggestions = Object.values(builtinChips).map((chip) => {
            const inputs = chip.inputs.map((input, n) => `${input.name}=$${n + 1}`).join(", ");
            const outputs = chip.outputs.map((output, n) => `${output.name}=$${n + 1}`).join(", ");
            return {
              label: chip.name,
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: `${chip.name}(${inputs}${outputs.length ? ", " : ""}${outputs});`,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: chip.documentation,
              detail: buildChipDetail(chip),
              // detail: "bla bla",
              range: range,
            } as monacoT.languages.CompletionItem;
          });
          const chipSuggestions = (
            chip ? [...chip.ins.entries(), ...chip.pins.entries(), ...chip.outs.entries()] : []
          ).map<monacoT.languages.CompletionItem>((pin) => ({
            label: pin.name,
            kind: monaco.languages.CompletionItemKind.Variable,
            range: range,
            insertText: pin.name,
            detail: chip?.ins.has(pin.name) ? "Input" : chip?.outs.has(pin.name) ? "Output" : "Internal",
          }));
          console.log(chipSuggestions);

          return { suggestions: line.includes("(") ? chipSuggestions : partSuggestions };
        },
      });
      return () => {
        completionDisposable.dispose();
        hoverDisposable.dispose();
      };
    }
  }, [monaco, chip]);

  const onValueChange = useCallback(
    // TODO: Debounce
    (value: string | undefined) => {
      // console.log("here is the current model value:", value);
      if (!value) return;
      parseAndCompile(value);
    },
    [parseAndCompile]
  );

  return <Editor language="hdl" value={sourceCode} onChange={onValueChange} onMount={onMount} />;
}
