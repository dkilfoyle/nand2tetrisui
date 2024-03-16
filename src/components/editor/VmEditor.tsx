import Editor, { OnMount, useMonaco } from "@monaco-editor/react";
import type * as monacoT from "monaco-editor/esm/vs/editor/editor.api";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { activeTabAtom, compiledAsmAtom } from "../../store/atoms";
import { useDebouncedCallback } from "use-debounce";
import { parseVm } from "../../languages/vm/vmParser";
import { compileVm } from "../../languages/vm/vmCompiler";

export function VmEditor({ name, sourceCode }: { name: string; sourceCode: string }) {
  // const setSymbolTable = useSetAtom(symbolTableAtom);
  const editor = useRef<monacoT.editor.IStandaloneCodeEditor>();
  const monaco = useMonaco();
  const setCompiledAsm = useSetAtom(compiledAsmAtom);
  const [errors, setErrors] = useState<monacoT.editor.IMarkerData[]>([]);
  const [activeTab] = useAtom(activeTabAtom);
  // const [ast, setAst] = useState<IAstAsm>();

  // Add error markers on parse failure
  useEffect(() => {
    if (editor.current === undefined) return;
    if (monaco === null) return;
    const model = editor.current.getModel();
    if (model === null) return;
    monaco.editor.setModelMarkers(model, "vm", errors);
  }, [errors, editor, monaco, activeTab, name]);

  const parseAndCompile = useDebouncedCallback(
    useCallback(
      (code: string) => {
        const { ast, parseErrors } = parseVm(code);
        console.log("VmEditor parse", ast, parseErrors);
        if (parseErrors.length > 0) setErrors(parseErrors);
        else {
          // setAst(ast);
          const { asm, spans, compileErrors } = compileVm(ast);
          setErrors(compileErrors.map((e) => ({ message: e.message, ...e.span, severity: 4 })));
          if (compileErrors.length > 0) setCompiledAsm("// Compile Errors");
          else setCompiledAsm(asm.join("\n") + "\n");
        }
      },
      [setCompiledAsm]
    ),
    500
  );

  useEffect(() => {
    if (editor && editor.current && activeTab == name) {
      parseAndCompile(editor.current?.getValue());
    }
  }, [activeTab, editor, name, parseAndCompile]);

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
      parseAndCompile(value);
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
      const completionDisposable = monaco.languages.registerCompletionItemProvider("vm", {
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

  const onValueChange = useCallback(
    // TODO: Debounce
    (value: string | undefined) => {
      // console.log("here is the current model value:", value);
      if (!value) return;
      parseAndCompile(value);
    },
    [parseAndCompile]
  );

  return <Editor language="vm" value={sourceCode} onChange={onValueChange} onMount={onMount} />;
}
