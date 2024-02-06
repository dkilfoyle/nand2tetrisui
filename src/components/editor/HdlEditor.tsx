import Editor, { OnMount, useMonaco } from "@monaco-editor/react";
import type * as monacoT from "monaco-editor/esm/vs/editor/editor.api";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseHdl } from "./grammars/hdlParser";
import { compileHdl } from "./grammars/hdlCompiler";
import { Chip } from "./grammars/Chip";
import { elkAtom } from "../schematic/Schematic";
import { atom, useAtom } from "jotai";
import { ELKNode } from "../schematic/elkBuilder";

export const chipAtom = atom<Chip | undefined>(undefined);

export function HdlEditor({ sourceCode }: { sourceCode: string }) {
  const editor = useRef<monacoT.editor.IStandaloneCodeEditor>();
  const monaco = useMonaco();
  const [errors, setErrors] = useState<monacoT.editor.IMarkerData[]>([]);
  const language = "hdl";

  const [elk, setElk] = useAtom(elkAtom);
  const [chip, setChip] = useAtom(chipAtom);

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
      } as ELKNode);
    }
  }, [errors, editor, monaco, language]);

  useEffect(() => {
    console.log("HdlEditor useEffect: chip", chip);
  }, [chip]);

  const parseAndCompile = useCallback(
    (code: string) => {
      const { ast, parseErrors } = parseHdl(code);
      if (parseErrors.length > 0) setErrors(parseErrors);
      else {
        compileHdl(ast).then(({ chip, compileErrors, elk: newelk }) => {
          setErrors(compileErrors.map((e) => ({ message: e.message, ...e.span, severity: 4 })));
          if (compileErrors.length == 0) {
            setElk(newelk as ELKNode);
            setChip(chip);
          }
        });
      }
    },
    [setChip, setElk]
  );

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
      // console.log("here is the current model value:", value);
      if (!value) return;
      parseAndCompile(value);
    },
    [parseAndCompile]
  );

  return <Editor language="hdl" value={sourceCode} onChange={onValueChange} onMount={onMount} />;
}
