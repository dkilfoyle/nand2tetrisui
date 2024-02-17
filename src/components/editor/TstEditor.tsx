import Editor, { OnMount, useMonaco } from "@monaco-editor/react";
import type * as monacoT from "monaco-editor/esm/vs/editor/editor.api";
import { useCallback, useEffect, useRef, useState } from "react";
import { atom, useAtom } from "jotai";
import { checkTst, parseTst } from "./grammars/tstParser";
import { IAstTst } from "./grammars/tstInterface";

import "./TstEditor.css";
import { activeTabAtom, chipAtom, selectedTestAtom, testBreakpointAtom, testsAtom } from "../../store/atoms";
import { Box, Button, Flex, HStack } from "@chakra-ui/react";

export function TstEditor({ name, sourceCode }: { name: string; sourceCode: string }) {
  const editor = useRef<monacoT.editor.IStandaloneCodeEditor>();
  const monaco = useMonaco();
  const [errors, setErrors] = useState<monacoT.editor.IMarkerData[]>([]);
  const [decorations, setDecorations] = useState<monacoT.editor.IEditorDecorationsCollection | null>(null);

  const [tests, setTests] = useAtom(testsAtom);
  const [chip, setChip] = useAtom(chipAtom);
  const [selectedTest] = useAtom(selectedTestAtom);
  const [activeTab] = useAtom(activeTabAtom);
  const [testBreakpoint, setTestBreakpoint] = useAtom(testBreakpointAtom);

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
      // console.log("tst ast:", ast, chip, parseErrors);
      if (parseErrors.length > 0) setErrors(parseErrors);
      else {
        if (chip) {
          const checkErrors = checkTst(ast, chip);
          setErrors(checkErrors.map((e) => ({ message: e.message, ...e.span, severity: 4 })));
          if (checkErrors.length == 0 && activeTab == name) {
            // console.log("TstEditor setTests:", ast);
            setTests(ast);
          }
        }
      }
    },
    [activeTab, chip, name, setTests]
  );

  useEffect(() => {
    if (editor && editor.current && activeTab == name) {
      parseAndCompile(editor.current?.getValue());
    }
  }, [activeTab, editor, name, parseAndCompile]);

  useEffect(() => {
    // console.log("TstEditor useEffect[chip]", chip);
    if (editor && editor.current) {
      const value = editor.current.getValue();
      parseAndCompile(value);
    }
  }, [chip, parseAndCompile]);

  useEffect(() => {
    if (!monaco || !decorations) return;
    // console.log("tstEditor useEffect[selectedTest]", monaco, selectedTest, tests, editor.current);
    if (selectedTest == null || tests == null) {
      decorations?.clear();
      return;
    }
    const statement = tests?.statements[selectedTest];
    decorations.set([
      {
        range: new monaco.Range(statement.span.startLineNumber, 1, statement.span.endLineNumber, 1),
        options: {
          isWholeLine: true,
          className: "selectedTestStatement",
        },
      },
    ]);
  }, [decorations, monaco, selectedTest, tests]);

  const onMount: OnMount = useCallback(
    (ed) => {
      editor.current = ed;
      editor.current?.onDidChangeCursorPosition((e) => {
        const index = editor.current?.getModel()?.getOffsetAt(e.position);
        if (index !== undefined) {
          onCursorPositionChange?.(index);
        }
      });
      setDecorations(editor.current.createDecorationsCollection([]));
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

  const onStep = useCallback(() => {
    setTestBreakpoint(testBreakpoint + 1);
  }, [setTestBreakpoint, testBreakpoint]);

  const onRun = useCallback(() => {
    if (!tests) return;
    setTestBreakpoint(tests.statements.length ?? -1);
  }, [setTestBreakpoint, tests]);

  const onReset = useCallback(() => {
    setTestBreakpoint(-1);
  }, [setTestBreakpoint]);

  return (
    <Flex direction="column" h="100%" gap="5px">
      <HStack>
        <Button size="sm" onReset={onReset}>
          Reset
        </Button>
        <Button size="sm" onClick={onStep}>
          Step
        </Button>
        <Button size="sm" onClick={onRun}>
          Run
        </Button>
      </HStack>
      <Editor language="tst" value={sourceCode} onChange={onValueChange} onMount={onMount} />
    </Flex>
  );
}
