import Editor, { OnMount, useMonaco } from "@monaco-editor/react";
import { IRecognitionException } from "chevrotain";
import type * as monacoT from "monaco-editor/esm/vs/editor/editor.api";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseHdl } from "./grammars/hdlParser";
import { compileHdl } from "./grammars/hdlCompiler";

const example = `// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/03/a/RAM64.hdl
/**
 * Memory of sixty four 16-bit registers.
 * If load is asserted, the value of the register selected by
 * address is set to in; Otherwise, the value does not change.
 * The value of the selected register is emitted by out.
 */
CHIP RAM64 {
    IN in[16], load, address[6];
    OUT out[16];

    PARTS:
    DMux8Way(in=load, sel=address[3..5], 
        a=load0, 
        b=load1, 
        c=load2, 
        d=load3, 
        e=load4, 
        f=load5, 
        g=load6, 
        h=load7);

    RAM8(in=in, load=load0, address=address[0..2], out=r0); // 000 = 0
    RAM8(in=in, load=load1, address=address[0..2], out=r1); // 001 = 1
    RAM8(in=in, load=load2, address=address[0..2], out=r2); // 010 = 2
    RAM8(in=in, load=load3, address=address[0..2], out=r3); // 011 = 3
    RAM8(in=in, load=load4, address=address[0..2], out=r4); // 100 = 4
    RAM8(in=in, load=load5, address=address[0..2], out=r5); // 101 = 5
    RAM8(in=in, load=load6, address=address[0..2], out=r6); // 110 = 6
    RAM8(in=in, load=load7, address=address[0..2], out=r7); // 111 = 7

    Mux8Way16(a=r0, b=r1, c=r2, d=r3, e=r4, f=r5, g=r6, h=r7, sel=address[3..5], out=out);
}
`;

const example2 = `CHIP HalfAdder {
    IN a, b;    // 1-bit inputs
    OUT sum,    // Right bit of a + b 
        carry;  // Left bit of a + b

    PARTS:
    Not(in=a, out=nota);
    Not(in=b, out=notb);
    And(a=nota, b=b, out=nAB);
    And(a=a, b=notb, out=AnB);
    Or(a=nAB, b=AnB, out=sum);
    And(a=a, b=b, out=carry);

}`;

export function CodeEditor() {
  const editor = useRef<monacoT.editor.IStandaloneCodeEditor>();
  const monaco = useMonaco();
  const [errors, setErrors] = useState<monacoT.editor.IMarkerData[]>([]);
  const language = "hdl";

  // Add error markers on parse failure
  useEffect(() => {
    if (editor.current === undefined) return;
    if (monaco === null) return;
    const model = editor.current.getModel();
    if (model === null) return;
    // if (error === undefined) {
    //   monaco.editor.setModelMarkers(model, language, []);
    //   return;
    // }

    // const startPos = model.getPositionAt(5); //error.span.start);
    // const endPos = model.getPositionAt(10); //error.span.end);

    console.log(errors);

    monaco.editor.setModelMarkers(model, language, errors);
  }, [errors, editor, monaco, language]);

  const onMount: OnMount = useCallback((ed) => {
    editor.current = ed;
    editor.current?.onDidChangeCursorPosition((e) => {
      const index = editor.current?.getModel()?.getOffsetAt(e.position);
      if (index !== undefined) {
        onCursorPositionChange?.(index);
      }
    });
    console.log("onMount parse");
    const value = editor.current.getValue();
    const { ast, parseErrors } = parseHdl(value);
    if (parseErrors.length > 0) setErrors(parseErrors);
    else {
      const { netlist, compileErrors } = compileHdl(ast);
      setErrors(compileErrors);
    }
  }, []);

  const onCursorPositionChange = (index: number) => {
    // console.log("onCursorPositionChanged: index = ", index);
  };

  const onValueChange = (value: string | undefined) => {
    console.log("here is the current model value:", value);
    if (!value) return;
    const { ast, parseErrors } = parseHdl(value);
    if (parseErrors.length > 0) setErrors(parseErrors);
    else {
      const { netlist, compileErrors } = compileHdl(ast);
      setErrors(compileErrors);
    }
  };

  return <Editor language="hdl" value={example2} onChange={onValueChange} onMount={onMount} />;
}
