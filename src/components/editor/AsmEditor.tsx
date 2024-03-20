import Editor, { OnMount, useMonaco } from "@monaco-editor/react";
import type * as monacoT from "monaco-editor/esm/vs/editor/editor.api";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { activeTabAtom, compiledHackAtom, compiledChipAtom, selectedPartAtom, symbolTableAtom, compiledAsmAtom } from "../../store/atoms";
import { parseAsm } from "../../languages/asm/asmParser";
import { useDebouncedCallback } from "use-debounce";
import { compileAsm } from "../../languages/asm/asmCompiler";
import { compileHdl } from "../../languages/hdl/hdlCompiler";
import { parseHdl } from "../../languages/hdl/hdlParser";
import { sourceCodes } from "../../examples/projects";
// import { ROM32K } from "@nand2tetris/web-ide/simulator/src/chip/builtins/computer/computer";

const computerAST = parseHdl(sourceCodes["./Project05/Computer.hdl"]);
const computer = await compileHdl(computerAST.ast);
// const rom = [...computer.chip.parts.values()].find((p) => p.name == "ROM32K") as ROM32K;

export function AsmEditor({ name, sourceCode, isCompiledViewer = false }: { name: string; sourceCode: string; isCompiledViewer?: boolean }) {
  const setCompiledChip = useSetAtom(compiledChipAtom);
  const setSelectedPart = useSetAtom(selectedPartAtom);
  const setCompiledHack = useSetAtom(compiledHackAtom);
  const setSymbolTable = useSetAtom(symbolTableAtom);
  const [compiledAsm] = useAtom(compiledAsmAtom);
  const editor = useRef<monacoT.editor.IStandaloneCodeEditor>();
  const monaco = useMonaco();
  // const cursorEvent = useRef<monacoT.IDisposable>();

  const [errors, setErrors] = useState<monacoT.editor.IMarkerData[]>([]);

  const [activeTab] = useAtom(activeTabAtom);
  // const [ast, setAst] = useState<IAstAsm>();

  // Add error markers on parse failure
  useEffect(() => {
    if (editor.current === undefined) return;
    if (monaco === null) return;
    const model = editor.current.getModel();
    if (model === null) return;
    monaco.editor.setModelMarkers(model, "asm", errors);
  }, [errors, editor, monaco, activeTab, name]);

  const parseAndCompile = useCallback(
    (code: string) => {
      const { ast, parseErrors } = parseAsm(code);
      // console.log(ast, parseErrors);
      if (parseErrors.length > 0) setErrors(parseErrors);
      else {
        // setAst(ast);
        const { instructions, symbolTable } = compileAsm(ast);
        setCompiledHack(instructions);
        setSymbolTable(symbolTable);
        // console.log(instructions, symbolTable);
        setCompiledChip({ chip: computer.chip, ast: computerAST.ast });
        setSelectedPart([...computer.chip.parts.values()].find((p) => p.name == "Memory"));
      }
    },
    [setCompiledHack, setCompiledChip, setSelectedPart, setSymbolTable]
  );

  useEffect(() => {
    if (editor && editor.current && activeTab == name && !isCompiledViewer) parseAndCompile(editor.current?.getValue());
  }, [activeTab, editor, isCompiledViewer, name, parseAndCompile]);

  useEffect(() => {
    if (editor && editor.current && activeTab.split(".")[0] == name.split(".")[0] && isCompiledViewer && compiledAsm) {
      editor.current.getModel()?.setValue(compiledAsm);
      parseAndCompile(compiledAsm);
    }
  }, [isCompiledViewer, compiledAsm, activeTab, editor, name, parseAndCompile]);

  // const onChangeCursorPosition = useCallback(
  //   (e: monacoT.editor.ICursorPositionChangedEvent) => {
  //     const index = editor.current?.getModel()?.getOffsetAt(e.position);
  //     if (index !== undefined && ast && chip) {
  //       const i = ast.parts.findIndex((part) => index > part.span.startOffset && index <= part.span.endOffset);
  //       if (i >= 0) setSelectedPart([...chip.parts][i]);
  //       else setSelectedPart(chip);
  //     } else setSelectedPart(undefined);
  //   },
  //   [ast, chip, setSelectedPart]
  // );

  // useEffect(() => {
  //   if (cursorEvent.current) cursorEvent?.current.dispose();
  //   cursorEvent.current = editor?.current?.onDidChangeCursorPosition(onChangeCursorPosition);
  // }, [onChangeCursorPosition]);

  const onMount: OnMount = useCallback(
    (ed) => {
      editor.current = ed;
      const value = editor.current.getValue();
      if (value !== "") parseAndCompile(value);
    },
    [parseAndCompile]
  );

  useEffect(() => {
    const symbolTable: Record<string, number> = { mylabel: 10 }; // todo get symbol table from compileAsm
    if (monaco) {
      // monaco.editor.quickSuggestions = true;
      editor.current?.updateOptions({ quickSuggestions: true });
      const hoverDisposable = monaco.languages.registerHoverProvider("asm", {
        provideHover: (model, position) => {
          const word = model.getWordAtPosition(position);
          if (!word) return;
          const value = symbolTable[word.word];
          if (value)
            return {
              contents: [{ value: `${value}` }],
            };
        },
      });
      const completionDisposable = monaco.languages.registerCompletionItemProvider("hdl", {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          // const line = model.getLineContent(position.lineNumber);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          const symbolSuggestions = Object.keys(symbolTable).map((symbol) => {
            return {
              label: symbol,
              kind: monaco.languages.CompletionItemKind.Variable,
              insertText: `${symbol}`,
              range: range,
            } as monacoT.languages.CompletionItem;
          });
          return { suggestions: symbolSuggestions };
        },
      });
      return () => {
        completionDisposable.dispose();
        hoverDisposable.dispose();
      };
    }
  }, [monaco]);

  const onValueChange = useDebouncedCallback(
    useCallback(
      (value: string | undefined) => {
        if (!value) return;
        parseAndCompile(value);
      },
      [parseAndCompile]
    ),
    500
  );

  return <Editor language="asm" value={sourceCode} onChange={onValueChange} onMount={onMount} />;
}
