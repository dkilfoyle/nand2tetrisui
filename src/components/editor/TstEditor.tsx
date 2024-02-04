import Editor, { OnMount, useMonaco } from "@monaco-editor/react";
import type * as monacoT from "monaco-editor/esm/vs/editor/editor.api";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseHdl } from "./grammars/hdlParser";
import { compileHdl } from "./grammars/hdlCompiler";
import { Chip } from "./grammars/Chip";
import { elkAtom } from "../schematic/Schematic";
import { useAtom } from "jotai";
import { checkTst, parseTst } from "./grammars/tstParser";
import { chipAtom } from "./HdlEditor";

export function TstEditor({ sourceCode }: { sourceCode: string }) {
  const editor = useRef<monacoT.editor.IStandaloneCodeEditor>();
  const monaco = useMonaco();
  const [errors, setErrors] = useState<monacoT.editor.IMarkerData[]>([]);

  const [elk, setElk] = useAtom(elkAtom);
  const [chip, setChip] = useAtom(chipAtom);

  // Add error markers on parse failure
  // useEffect(() => {
  //   if (editor.current === undefined) return;
  //   if (monaco === null) return;
  //   const model = editor.current.getModel();
  //   if (model === null) return;
  //   monaco.editor.setModelMarkers(model, language, errors);
  //   if (errors.length > 0) {
  //     setElk({
  //       id: "0",
  //       hwMeta: { maxId: 0, bodyText: errors[0].message, name: "error", cls: null },
  //       ports: [],
  //       edges: [],
  //       children: [],
  //       properties: {
  //         "org.eclipse.elk.portConstraints": "FIXED_ORDER", // can be also "FREE" or other value accepted by ELK
  //         "org.eclipse.elk.layered.mergeEdges": 1,
  //       },
  //     });
  //   }
  // }, [errors, editor, monaco, language]);

  useEffect(() => {
    console.log(chip);
  }, [chip]);

  const onMount: OnMount = useCallback((ed) => {
    editor.current = ed;
    editor.current?.onDidChangeCursorPosition((e) => {
      const index = editor.current?.getModel()?.getOffsetAt(e.position);
      if (index !== undefined) {
        onCursorPositionChange?.(index);
      }
    });
    const value = editor.current.getValue();
    const { ast, parseErrors } = parseTst(value);
    console.log("tst ast:", ast);
    if (parseErrors.length > 0) setErrors(parseErrors);
    else {
      const checkErrors = checkTst(ast, chip);
      if (checkErrors.length > 0) setErrors(errors.map((e) => ({ message: e.message, ...e.span, severity: 4 })));
    }
  }, []);

  const onCursorPositionChange = (index: number) => {
    // console.log("onCursorPositionChanged: index = ", index);
  };

  const onValueChange = (value: string | undefined) => {
    // console.log("here is the current model value:", value);
    if (!value) return;
    const { ast, parseErrors } = parseTst(value);
    console.log("tst ast:", ast);
    if (parseErrors.length > 0) setErrors(parseErrors);
    else {
      const checkErrors = checkTst(ast, chip);
      if (checkErrors.length > 0) setErrors(errors.map((e) => ({ message: e.message, ...e.span, severity: 4 })));
    }
  };

  // return (
  //   <HStack w="100%" h="100%">
  //     <Editor language="hdl" value={example2} onChange={onValueChange} onMount={onMount} />
  //     <Box minW="400px">
  //       <svg id="schemmaticsvg" width={"400px"} height={"400px"} ref={schematicRef}></svg>
  //     </Box>
  //   </HStack>
  // );
  return <Editor language="tst" value={sourceCode} onChange={onValueChange} onMount={onMount} />;
}
