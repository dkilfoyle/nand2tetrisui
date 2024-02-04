import Editor, { OnMount, useMonaco } from "@monaco-editor/react";
import type * as monacoT from "monaco-editor/esm/vs/editor/editor.api";
import { useCallback, useEffect, useRef, useState } from "react";
import { atom, useAtom } from "jotai";
import { checkTst, parseTst } from "./grammars/tstParser";
import { chipAtom } from "./HdlEditor";
import { IAstTst } from "./grammars/tstInterface";

export const testsAtom = atom<IAstTst | null>(null);

export function TstEditor({ sourceCode }: { sourceCode: string }) {
  const editor = useRef<monacoT.editor.IStandaloneCodeEditor>();
  const monaco = useMonaco();
  const [errors, setErrors] = useState<monacoT.editor.IMarkerData[]>([]);

  const [tests, setTests] = useAtom(testsAtom);
  const [chip, setChip] = useAtom(chipAtom);

  //Add error markers on parse failure
  useEffect(() => {
    if (editor.current === undefined) return;
    if (monaco === null) return;
    const model = editor.current.getModel();
    if (model === null) return;
    monaco.editor.setModelMarkers(model, "tst", errors);
    if (errors.length > 0) {
      // set table to []
    }
  }, [errors, editor, monaco]);

  const parseAndCompile = useCallback(
    (code: string) => {
      const { ast, parseErrors } = parseTst(code);
      console.log("tst ast:", ast, chip, parseErrors);
      if (parseErrors.length > 0) setErrors(parseErrors);
      else {
        if (chip) {
          const checkErrors = checkTst(ast, chip);
          setErrors(checkErrors.map((e) => ({ message: e.message, ...e.span, severity: 4 })));
          if (checkErrors.length == 0) {
            console.log("TstEditor setTests:", ast);
            setTests(ast);
          }
        }
      }
    },
    [chip, setTests]
  );

  useEffect(() => {
    console.log("TstEditor useEffect[chip]", chip);
    if (editor && editor.current) {
      const value = editor.current.getValue();
      parseAndCompile(value);
    }
  }, [chip, parseAndCompile]);

  const onMount: OnMount = useCallback(
    (ed) => {
      editor.current = ed;
      editor.current?.onDidChangeCursorPosition((e) => {
        const index = editor.current?.getModel()?.getOffsetAt(e.position);
        if (index !== undefined) {
          onCursorPositionChange?.(index);
        }
      });
      const value = editor.current.getValue();
      parseAndCompile(value);
    },
    [parseAndCompile]
  );

  const onCursorPositionChange = (index: number) => {
    // console.log("onCursorPositionChanged: index = ", index);
  };

  const onValueChange = useCallback(
    (value: string | undefined) => {
      if (!value) return;
      parseAndCompile(value);
    },
    [parseAndCompile]
  );

  return <Editor language="tst" value={sourceCode} onChange={onValueChange} onMount={onMount} />;
}
