import Editor, { OnMount, useMonaco } from "@monaco-editor/react";
import type * as monacoT from "monaco-editor/esm/vs/editor/editor.api";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseHdl } from "./grammars/hdlParser";

import { Box, HStack } from "@chakra-ui/react";

import "d3-hwschematic/dist/d3-hwschematic.css";
import { compileHdl } from "./grammars/hdlCompiler";
import { ELKNode } from "./grammars/elkBuilder";
import { Chip } from "./grammars/Chip";

const example2 = `CHIP HalfAdder {
    IN x, y;    // 1-bit inputs
    OUT sum,    // Right bit of a + b 
        carry;  // Left bit of a + b

    PARTS:
    	Xor(a=x,b=y,out=sum);
	    And(a=x,b=y,out=carry);
}`;

export function CodeEditor() {
  const editor = useRef<monacoT.editor.IStandaloneCodeEditor>();
  const monaco = useMonaco();
  const [errors, setErrors] = useState<monacoT.editor.IMarkerData[]>([]);
  const language = "hdl";
  const hwSchematic = useRef();
  const schematicRef = useRef<SVGSVGElement>();
  const [elk, setElk] = useState<ELKNode>();
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
    console.log("ELK:", elk);
    if (hwSchematic.current)
      hwSchematic.current.bindData(elk).then(
        () => {},
        (e) => {
          // hwSchematic.setErrorText(e);
          console.log("hwscheme error", e);
          throw e;
        }
      );
  }, [elk]);

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

  useEffect(() => {
    const svg = d3.select(schematicRef.current);

    // .attr("width", "200px").attr("height", "200px");
    hwSchematic.current = new d3.HwSchematic(svg);
    const zoom = d3.zoom();
    zoom.on("zoom", function applyTransform(ev) {
      hwSchematic.current.root.attr("transform", ev.transform);
    });

    // disable zoom on doubleclick
    // because it interferes with component expanding/collapsing
    svg.call(zoom).on("dblclick.zoom", null);
  }, [schematicRef]);

  return (
    <HStack w="100%" h="100%">
      <Editor language="hdl" value={example2} onChange={onValueChange} onMount={onMount} />
      {/* <LayoutFlow></LayoutFlow> */}
      <Box minW="400px">
        <svg id="schemmaticsvg" width={"400px"} height={"400px"} ref={schematicRef}></svg>
      </Box>
    </HStack>
  );
}
