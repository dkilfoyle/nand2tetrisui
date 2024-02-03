import Editor, { OnMount, useMonaco } from "@monaco-editor/react";
import type * as monacoT from "monaco-editor/esm/vs/editor/editor.api";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseHdl } from "./grammars/hdlParser";
import { compileHdl } from "./grammars/hdlCompiler";
import { Chip } from "./grammars/Chip";
import { elkAtom } from "../schematic/Schematic";
import { useAtom } from "jotai";

export function CodeEditor({ sourceCode }: { sourceCode: string }) {
  const editor = useRef<monacoT.editor.IStandaloneCodeEditor>();
  const monaco = useMonaco();
  const [errors, setErrors] = useState<monacoT.editor.IMarkerData[]>([]);
  const language = "hdl";

  const [elk, setElk] = useAtom(elkAtom);
  const [chip, setChip] = useState<Chip>();

  // Add error markers on parse failure
  useEffect(() => {
    if (editor.current === undefined) return;
    if (monaco === null) return;
    const model = editor.current.getModel();
    if (model === null) return;
    monaco.editor.setModelMarkers(model, language, errors);
    if (errors.length > 0) {
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
      });
    }
  }, [errors, editor, monaco, language]);

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
    const { ast, parseErrors } = parseHdl(value);
    if (parseErrors.length > 0) setErrors(parseErrors);
    else {
      compileHdl(ast).then(({ chip, compileErrors, elk: newelk }) => {
        setErrors(compileErrors.map((e) => ({ message: e.message, ...e.span, severity: 4 })));
        if (compileErrors.length == 0) {
          setElk(newelk);
          setChip(chip);
        }
      });
    }
  }, []);

  const onCursorPositionChange = (index: number) => {
    // console.log("onCursorPositionChanged: index = ", index);
  };

  const onValueChange = (value: string | undefined) => {
    // console.log("here is the current model value:", value);
    if (!value) return;
    const { ast, parseErrors } = parseHdl(value);
    if (parseErrors.length > 0) setErrors(parseErrors);
    else {
      compileHdl(ast).then(({ chip, compileErrors, elk: newelk }) => {
        setErrors(compileErrors.map((e) => ({ message: e.message, ...e.span, severity: 4 })));
        console.log(compileErrors.length == 0, elk);
        if (compileErrors.length == 0) {
          setElk(newelk);
          setChip(chip);
        }
      });
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
  return <Editor language="hdl" value={sourceCode} onChange={onValueChange} onMount={onMount} />;
}
