import Editor, { OnMount, useMonaco } from "@monaco-editor/react";
import type * as monacoT from "monaco-editor/esm/vs/editor/editor.api";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseHdl } from "./grammars/hdlParser";
import { compileHdl } from "./grammars/hdlCompiler";
import { elkAtom } from "../schematic/Schematic";
import { useAtom } from "jotai";
import { ELKNode } from "../schematic/elkBuilder";
import { activeTabAtom, chipAtom, selectedPartAtom } from "../../store/atoms";
import { setAriaSetSize } from "@ag-grid-community/core/dist/esm/es6/utils/aria";
import { IAstChip } from "./grammars/hdlInterface";
import { Chip } from "./grammars/Chip";

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
