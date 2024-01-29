import Editor, { OnMount, useMonaco } from "@monaco-editor/react";
import type * as monacoT from "monaco-editor/esm/vs/editor/editor.api";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseHdl } from "./grammars/hdlParser";
// import { compileHdl } from "./grammars/hdlCompiler";

import { Box, HStack } from "@chakra-ui/react";
// import LayoutFlow from "../schematic/LayoutFlow";

import "d3-hwschematic/dist/d3-hwschematic.css";
import { compileHdl } from "./grammars/hdlCompiler";

const graph = {
  children: [
    {
      _children: [
        {
          hwMeta: {
            cls: "Operator",
            maxId: 14,
            name: "LATCHED_MUX",
          },
          id: "2",
          ports: [
            {
              children: [],
              direction: "OUTPUT",
              hwMeta: {
                connectedAsParent: false,
                level: 0,
                name: "",
              },
              id: "9",
              properties: {
                index: 0,
                side: "EAST",
              },
            },
            {
              children: [],
              direction: "INPUT",
              hwMeta: {
                connectedAsParent: false,
                level: 0,
                name: "",
              },
              id: "10",
              properties: {
                index: 1,
                side: "SOUTH",
              },
            },
            {
              children: [],
              direction: "INPUT",
              hwMeta: {
                connectedAsParent: false,
                level: 0,
                name: "",
              },
              id: "11",
              properties: {
                index: 2,
                side: "WEST",
              },
            },
          ],
          properties: {
            "org.eclipse.elk.layered.mergeEdges": 1,
            "org.eclipse.elk.portConstraints": "FIXED_ORDER",
          },
        },
      ],
      _edges: [
        {
          hwMeta: {
            name: "dout",
          },
          id: "15",
          source: "2",
          sourcePort: "9",
          target: "1",
          targetPort: "6",
        },
        {
          hwMeta: {
            name: "en",
          },
          id: "16",
          source: "1",
          sourcePort: "7",
          target: "2",
          targetPort: "10",
        },
        {
          hwMeta: {
            name: "din",
          },
          id: "17",
          source: "1",
          sourcePort: "8",
          target: "2",
          targetPort: "11",
        },
      ],
      hwMeta: {
        bodyText: "If(en._eq(1),\n    dout(din)\n)",
        cls: "Process",
        maxId: 17,
        name: null,
      },
      id: "1",
      ports: [
        {
          children: [],
          direction: "OUTPUT",
          hwMeta: {
            connectedAsParent: false,
            level: 0,
            name: "dout",
          },
          id: "6",
          properties: {
            index: 0,
            side: "EAST",
          },
        },
        {
          children: [],
          direction: "INPUT",
          hwMeta: {
            connectedAsParent: false,
            level: 0,
            name: "en",
          },
          id: "7",
          properties: {
            index: 1,
            side: "WEST",
          },
        },
        {
          children: [],
          direction: "INPUT",
          hwMeta: {
            connectedAsParent: false,
            level: 0,
            name: "din",
          },
          id: "8",
          properties: {
            index: 2,
            side: "WEST",
          },
        },
      ],
      properties: {
        "org.eclipse.elk.layered.mergeEdges": 1,
        "org.eclipse.elk.portConstraints": "FIXED_ORDER",
      },
    },
    {
      hwMeta: {
        cls: null,
        isExternalPort: true,
        maxId: 17,
        name: "din",
      },
      id: "3",
      ports: [
        {
          children: [],
          direction: "OUTPUT",
          hwMeta: {
            connectedAsParent: false,
            level: 0,
            name: "din",
          },
          id: "12",
          properties: {
            index: 0,
            side: "EAST",
          },
        },
      ],
      properties: {
        "org.eclipse.elk.layered.mergeEdges": 1,
        "org.eclipse.elk.portConstraints": "FIXED_ORDER",
      },
    },
    {
      hwMeta: {
        cls: null,
        isExternalPort: true,
        maxId: 17,
        name: "dout",
      },
      id: "4",
      ports: [
        {
          children: [],
          direction: "INPUT",
          hwMeta: {
            connectedAsParent: false,
            level: 0,
            name: "dout",
          },
          id: "13",
          properties: {
            index: 0,
            side: "WEST",
          },
        },
      ],
      properties: {
        "org.eclipse.elk.layered.mergeEdges": 1,
        "org.eclipse.elk.portConstraints": "FIXED_ORDER",
      },
    },
    {
      hwMeta: {
        cls: null,
        isExternalPort: true,
        maxId: 17,
        name: "en",
      },
      id: "5",
      ports: [
        {
          children: [],
          direction: "OUTPUT",
          hwMeta: {
            connectedAsParent: false,
            level: 0,
            name: "en",
          },
          id: "14",
          properties: {
            index: 0,
            side: "EAST",
          },
        },
      ],
      properties: {
        "org.eclipse.elk.layered.mergeEdges": 1,
        "org.eclipse.elk.portConstraints": "FIXED_ORDER",
      },
    },
  ],
  edges: [
    {
      hwMeta: {
        name: "dout",
      },
      id: "18",
      source: "1",
      sourcePort: "6",
      target: "4",
      targetPort: "13",
    },
    {
      hwMeta: {
        name: "en",
      },
      id: "19",
      source: "5",
      sourcePort: "14",
      target: "1",
      targetPort: "7",
    },
    {
      hwMeta: {
        name: "din",
      },
      id: "20",
      source: "3",
      sourcePort: "12",
      target: "1",
      targetPort: "8",
    },
  ],
  hwMeta: {
    cls: null,
    maxId: 20,
    name: "Latch",
  },
  ports: [],
  properties: {
    "org.eclipse.elk.layered.mergeEdges": 1,
    "org.eclipse.elk.portConstraints": "FIXED_ORDER",
  },
};

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
    Not(in=a, outz=nota);
    //Not(in=b, out=notb);
    //And(a=nota, b=b, out=nAB);
    //And(a=a, b=notb, out=AnB);
    //Or(a=nAB, b=AnB, out=sum);
    //And(a=a, b=b, out=carry);

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

    // console.log(errors);

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
    console.log(ast, errors);
    if (parseErrors.length > 0) setErrors(parseErrors);
    else {
      compileHdl(ast).then(({ chip, compileErrors }) => {
        setErrors(compileErrors.map((e) => ({ message: e.message, ...e.span, severity: 4 })));
        console.log(chip, compileErrors);
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
    console.log(ast);
    if (parseErrors.length > 0) setErrors(parseErrors);
    else {
      compileHdl(ast).then(({ chip, compileErrors }) => {
        setErrors(compileErrors);
        console.log(chip);
      });
    }
  };

  const schematicRef = useRef<SVGSVGElement>();

  useEffect(() => {
    const svg = d3.select(schematicRef.current);

    // .attr("width", "200px").attr("height", "200px");
    const hwSchematic = new d3.HwSchematic(svg);
    const zoom = d3.zoom();
    zoom.on("zoom", function applyTransform(ev) {
      hwSchematic.root.attr("transform", ev.transform);
    });

    // disable zoom on doubleclick
    // because it interferes with component expanding/collapsing
    svg.call(zoom).on("dblclick.zoom", null);

    hwSchematic.bindData(graph).then(
      () => {},
      (e) => {
        hwSchematic.setErrorText(e);
        throw e;
      }
    );
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
