import Editor, { OnMount, useMonaco } from "@monaco-editor/react";
import type * as monacoT from "monaco-editor/esm/vs/editor/editor.api";

import { useCallback, useEffect, useRef, useState } from "react";

import { CstParser, IRecognitionException, ITokenConfig, Lexer, TokenType, createToken } from "chevrotain";
import { useEditableControls } from "@chakra-ui/react";

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

const allTokens: TokenType[] = [];
const addToken = (options: ITokenConfig) => {
  const newToken = createToken(options);
  allTokens.push(newToken);
  return newToken;
};
addToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

addToken({
  name: "CommentSingle",
  pattern: /\/\/.*/,
  group: Lexer.SKIPPED,
});

addToken({
  name: "Comment",
  pattern: /\/\*(\*(?!\/)|[^*])*\*\//,
  group: Lexer.SKIPPED,
  // note that comments could span multiple lines.
  // forgetting to enable this flag will cause inaccuracies in the lexer location tracking.
  line_breaks: true,
});

const ID = createToken({ name: "ID", pattern: /[a-zA-Z][a-zA-Z0-9]*/ });
const Chip = addToken({ name: "Chip", pattern: /CHIP/, longer_alt: ID });
const In = addToken({ name: "In", pattern: /IN/, longer_alt: ID });
const Out = addToken({ name: "Out", pattern: /OUT/, longer_alt: ID });
const False = addToken({ name: "True", pattern: /true/, longer_alt: ID });
const True = addToken({ name: "False", pattern: /false/, longer_alt: ID });
const Parts = addToken({ name: "Parts", pattern: /PARTS:/ });
const LCurly = addToken({ name: "LCurly", label: "{", pattern: /{/ });
const RCurly = addToken({ name: "RCurly", label: "}", pattern: /}/ });
const LParen = addToken({ name: "LParen", label: "(", pattern: /\(/ });
const RParen = addToken({ name: "RParen", label: ")", pattern: /\)/ });
const LSquare = addToken({ name: "LSquare", label: "[", pattern: /\[/ });
const RSquare = addToken({ name: "RSquare", label: "]", pattern: /\]/ });
const Comma = addToken({ name: "Comma", label: ",", pattern: /,/ });
const SemiColon = addToken({ name: "SemiColon", label: ";", pattern: /;/ });
const Equals = addToken({ name: "Equals", pattern: /=/ });
const Rest = addToken({ name: "Rest", pattern: /\.\./ });
const LessThan = addToken({ name: "LessThan", pattern: /</ });
const Plus = addToken({ name: "Plus", pattern: /\+/ });
const Minus = addToken({ name: "Minus", pattern: /-/ });
const INT = addToken({ name: "INT", pattern: /[0-9]+/ });

const chipNames = [
  "HalfAdder",
  "FullAdder",
  "ALU",
  "ALUNoStat",
  "DFF",
  "Bit",
  "Register",
  "ARegister",
  "DRegister",
  "PC",
  "RAM8",
  "RAM64",
  "RAM512",
  "RAM4K",
  "RAM16K",
  "ROM32K",
  "Screen",
  "Keyboard",
  "CPU",
  "Computer",
  "Memory",
];
const chips: Record<string, TokenType> = {};
const chipsCategory = addToken({ name: "chips", pattern: Lexer.NA });
chipNames.forEach((chipName) => {
  chips[chipName] = addToken({ name: chipName, pattern: chipName, longer_alt: ID, categories: [chipsCategory] });
});
allTokens.push(ID);
const hdlLexer = new Lexer(allTokens);

class HdlParser extends CstParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  public root = this.RULE("root", () => {
    this.SUBRULE(this.chip);
  });
  chip = this.RULE("chip", () => {
    this.CONSUME(Chip);
    this.OR([
      {
        ALT: () => {
          this.CONSUME(ID);
        },
      },
      {
        ALT: () => {
          this.CONSUME(chipsCategory);
        },
      },
    ]);
    this.CONSUME(LCurly);
    this.SUBRULE(this.chipBody);
    this.CONSUME(RCurly);
  });
  identifier = this.RULE("identifier", () => {
    this.CONSUME(ID);
  });
  chipBody = this.RULE("chipBody", () => {
    this.OPTION(() => {
      this.SUBRULE(this.inList);
    });
    this.OPTION2(() => {
      this.SUBRULE(this.outList);
    });
    this.SUBRULE(this.partList);
  });
  inList = this.RULE("inList", () => {
    this.CONSUME(In);
    this.SUBRULE(this.pinList);
    this.CONSUME(SemiColon);
  });
  outList = this.RULE("outList", () => {
    this.CONSUME(Out);
    this.SUBRULE(this.pinList);
    this.CONSUME(SemiColon);
  });
  pinList = this.RULE("pinList", () => {
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => {
        this.SUBRULE(this.pinDecl);
      },
    });
  });
  pinDecl = this.RULE("pinDecl", () => {
    this.CONSUME(ID);
    this.OPTION(() => {
      this.SUBRULE(this.pinWidth);
    });
  });
  pinWidth = this.RULE("pinWidth", () => {
    this.CONSUME(LSquare);
    this.CONSUME(INT);
    this.CONSUME(RSquare);
  });
  partList = this.RULE("partList", () => {
    this.CONSUME(Parts);
    // this.MANY(() => {
    //   this.SUBRULE(this.part);
    // });
    this.MANY(() => {
      this.SUBRULE(this.part);
    });
  });
  part = this.RULE("part", () => {
    this.CONSUME(chipsCategory);
    this.CONSUME(LParen);
    this.SUBRULE(this.wires);
    this.CONSUME(RParen);
    this.CONSUME(SemiColon);
  });
  wires = this.RULE("wires", () => {
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => {
        this.SUBRULE(this.wire);
      },
    });
  });
  wire = this.RULE("wire", () => {
    this.SUBRULE(this.wireSide);
    this.CONSUME(Equals);
    this.OR([{ ALT: () => this.SUBRULE2(this.wireSide) }, { ALT: () => this.CONSUME(True) }, { ALT: () => this.CONSUME(False) }]);
  });
  wireSide = this.RULE("wireSide", () => {
    this.CONSUME(ID);
    this.OPTION(() => {
      this.SUBRULE(this.subBus);
    });
  });
  subBus = this.RULE("subBus", () => {
    this.CONSUME(LSquare);
    this.CONSUME(INT);
    this.OPTION(() => this.SUBRULE(this.subBusRest));
    this.CONSUME(RSquare);
  });
  subBusRest = this.RULE("subBusRest", () => {
    this.CONSUME(Rest);
    this.CONSUME(INT);
  });
}

const hdlParser = new HdlParser();

export function CodeEditor() {
  const editor = useRef<monacoT.editor.IStandaloneCodeEditor>();
  const monaco = useMonaco();
  const [errors, setErrors] = useState<IRecognitionException[]>([]);
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

    monaco.editor.setModelMarkers(
      model,
      language,
      errors.map((error) => ({
        message: error.message,
        startColumn: error.token.startColumn || 0,
        startLineNumber: error.token.startLine || 0,
        endColumn: error.token.endColumn ? error.token.endColumn + 1 : 0,
        endLineNumber: error.token.endLine || 0,
        severity: 8,
      }))
    );
  }, [errors, editor, monaco, language]);

  const onMount: OnMount = useCallback((ed) => {
    editor.current = ed;
    editor.current?.onDidChangeCursorPosition((e) => {
      const index = editor.current?.getModel()?.getOffsetAt(e.position);
      if (index !== undefined) {
        onCursorPositionChange?.(index);
      }
    });
    console.l;

    console.log("onMount parse");
    const lexResult = hdlLexer.tokenize(editor.current.getValue());
    hdlParser.input = lexResult.tokens;
    const cst = hdlParser.root();
    console.log(hdlParser.errors);
    setErrors(hdlParser.errors);
  }, []);

  const onCursorPositionChange = (index: number) => {
    // console.log("onCursorPositionChanged: index = ", index);
  };

  const onValueChange = (value: string | undefined) => {
    console.log("here is the current model value:", value);
    if (!value) return;
    const lexResult = hdlLexer.tokenize(value);
    hdlParser.input = lexResult.tokens;
    const cst = hdlParser.root();
    console.log(hdlParser.errors);
    setErrors(hdlParser.errors);
  };

  return <Editor language="hdl" value={example} onChange={onValueChange} onMount={onMount} />;
}
