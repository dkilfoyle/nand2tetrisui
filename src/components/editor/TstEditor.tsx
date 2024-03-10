import Editor, { OnMount, useMonaco } from "@monaco-editor/react";
import type * as monacoT from "monaco-editor/esm/vs/editor/editor.api";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { checkTst, parseTst } from "../../languages/tst/tstParser";

import "./TstEditor.css";
import { activeTabAtom, chipAtom, selectedTestAtom, testsAtom } from "../../store/atoms";
import { Button, Flex, IconButton, Spacer } from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";

export function TstEditor({
  name,
  sourceCode,
  expanded,
  onExpandToggle,
}: {
  name: string;
  sourceCode: string;
  expanded: boolean;
  onExpandToggle: () => void;
}) {
  const editor = useRef<monacoT.editor.IStandaloneCodeEditor>();
  const monaco = useMonaco();
  const [errors, setErrors] = useState<monacoT.editor.IMarkerData[]>([]);
  const [decorations, setDecorations] = useState<monacoT.editor.IEditorDecorationsCollection | null>(null);

  const [tests, setTests] = useAtom(testsAtom);
  const [chip] = useAtom(chipAtom);
  const [activeTab] = useAtom(activeTabAtom);
  const [selectedTest, setSelectedTest] = useAtom(selectedTestAtom);

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
            setTests({ ast, tabName: activeTab, chipName: chip.name! });
            // console.log("Output formats", ast.outputFormats);
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
    if (selectedTest == null || tests == null || selectedTest == -1) {
      decorations?.clear();
      return;
    }
    const statement = tests?.ast.commands[selectedTest];
    decorations.set([
      {
        range: new monaco.Range(statement.span.startLineNumber, 1, statement.span.endLineNumber, 1),
        options: {
          isWholeLine: true,
          className: "selectedTestStatement",
        },
      },
    ]);
    editor.current?.revealLineInCenter(statement.span.startLineNumber);
  }, [decorations, monaco, selectedTest, tests]);

  const onMount: OnMount = useCallback(
    (ed) => {
      editor.current = ed;
      // editor.current?.onDidChangeCursorPosition((e) => {
      //   const index = editor.current?.getModel()?.getOffsetAt(e.position);
      //   if (index !== undefined) {
      //     onCursorPositionChange?.(index);
      //   }
      // });
      setDecorations(editor.current.createDecorationsCollection([]));
      const value = editor.current.getValue();
      parseAndCompile(value);
    },
    [parseAndCompile]
  );

  // const onCursorPositionChange = (index: number) => {
  //   // console.log("onCursorPositionChanged: index = ", index);
  // };

  const onValueChange = useCallback(
    (value: string | undefined) => {
      if (!value) return;
      parseAndCompile(value);
    },
    [parseAndCompile]
  );

  const onStep = useCallback(() => {
    if (selectedTest !== null) setSelectedTest(selectedTest + 1);
  }, [setSelectedTest, selectedTest]);

  const onRun = useCallback(() => {
    if (tests !== null && tests.ast.commands.length > 0) setSelectedTest(tests.ast.commands.length - 1);
  }, [setSelectedTest, tests]);

  const onReset = useCallback(() => {
    setSelectedTest(-1);
  }, [setSelectedTest]);

  return (
    <Flex direction="column" h="100%" bg="white">
      <Flex p="5px" gap="5px">
        <Button size="xs" onClick={onReset}>
          Reset
        </Button>
        <Button
          size="xs"
          onClick={onStep}
          isDisabled={tests == null || tests.ast.commands.length == 0 || selectedTest == null || selectedTest == tests.ast.commands.length - 1}>
          Step
        </Button>
        <Button size="xs" onClick={onRun} isDisabled={tests == null || selectedTest == null || tests.ast.commands.length == 0}>
          Run
        </Button>
        <span>{expanded}</span>
        <Spacer></Spacer>
        <IconButton
          size="xs"
          icon={expanded ? <ChevronDownIcon /> : <ChevronUpIcon />}
          aria-label="down"
          variant="ghost"
          onClick={onExpandToggle}
        />
      </Flex>
      <Editor language="tst" value={sourceCode} onChange={onValueChange} onMount={onMount} />
    </Flex>
  );
}
