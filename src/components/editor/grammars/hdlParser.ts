import { EmbeddedActionsParser, IToken, ITokenConfig, Lexer, TokenType, createToken } from "chevrotain";
import { builtinChips } from "../simulator/builtins";
import { IAstPin, IAstChip, IAstPart, IAstWire, IAstWireEnd } from "./hdlInterface";

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
const ChipToken = addToken({ name: "Chip", pattern: /CHIP/, longer_alt: ID });
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
const INT = addToken({ name: "INT", pattern: /[0-9]+/ });

const chips: Record<string, TokenType> = {};
const chipsCategory = addToken({ name: "chips", pattern: Lexer.NA });
builtinChips.forEach((chip) => {
  chips[chip.name] = addToken({ name: chip.name, pattern: chip.name, longer_alt: ID, categories: [chipsCategory] });
});
allTokens.push(ID);
const hdlLexer = new Lexer(allTokens);

class HdlParser extends EmbeddedActionsParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  public chip = this.RULE("chip", () => {
    let name = this.CONSUME(ChipToken);
    this.OR([
      {
        ALT: () => {
          name = this.CONSUME(ID);
        },
      },
      {
        ALT: () => {
          name = this.CONSUME(chipsCategory);
        },
      },
    ]);
    this.CONSUME(LCurly);
    let inPins: IAstPin[] = [];
    let outPins: IAstPin[] = [];
    this.OPTION(() => {
      inPins = this.SUBRULE(this.inList);
    });
    this.OPTION2(() => {
      outPins = this.SUBRULE(this.outList);
    });
    const parts = this.SUBRULE(this.partList);
    this.CONSUME(RCurly);
    return { name, inPins, outPins, parts } as IAstChip;
  });

  // PINS
  inList = this.RULE("inList", () => {
    this.CONSUME(In);
    const pins = this.SUBRULE(this.pinList);
    this.CONSUME(SemiColon);
    return pins;
  });
  outList = this.RULE("outList", () => {
    this.CONSUME(Out);
    const pins = this.SUBRULE(this.pinList);
    this.CONSUME(SemiColon);
    return pins;
  });
  pinList = this.RULE("pinList", () => {
    const pins: IAstPin[] = [];
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => {
        pins.push(this.SUBRULE(this.pinDecl));
      },
    });
    return pins;
  });
  pinDecl = this.RULE("pinDecl", () => {
    const name = this.CONSUME(ID);
    let width: IToken | undefined;
    this.OPTION(() => {
      width = this.SUBRULE(this.pinWidth);
    });
    return { name, width };
  });
  pinWidth = this.RULE("pinWidth", () => {
    this.CONSUME(LSquare);
    const width = this.CONSUME(INT);
    this.CONSUME(RSquare);
    return width;
  });

  // PARTS
  partList = this.RULE("partList", () => {
    const parts: IAstPart[] = [];
    this.CONSUME(Parts);
    this.MANY(() => {
      parts.push(this.SUBRULE(this.part));
    });
    return parts;
  });
  part = this.RULE("part", () => {
    const name = this.CONSUME(chipsCategory);
    this.CONSUME(LParen);
    const wires = this.SUBRULE(this.wires);
    this.CONSUME(RParen);
    this.CONSUME(SemiColon);
    return { name, wires };
  });
  wires = this.RULE("wires", () => {
    const wires: IAstWire[] = [];
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => {
        wires.push(this.SUBRULE(this.wire));
      },
    });
    return wires;
  });
  wire = this.RULE("wire", () => {
    const lhs = this.SUBRULE(this.wireSide);
    let rhs: IAstWireEnd = { name: this.CONSUME(Equals) };
    this.OR([
      { ALT: () => (rhs = this.SUBRULE2(this.wireSide)) },
      { ALT: () => (rhs = { name: this.CONSUME(True) }) },
      { ALT: () => (rhs = { name: this.CONSUME(False) }) },
    ]);
    return { lhs, rhs } as IAstWire;
  });
  wireSide = this.RULE("wireSide", () => {
    const name = this.CONSUME(ID);
    let subBus;
    this.OPTION(() => {
      subBus = this.SUBRULE(this.subBus);
    });
    return { name, subBus } as IAstWireEnd;
  });
  subBus = this.RULE("subBus", () => {
    this.CONSUME(LSquare);
    const i = this.CONSUME(INT);
    let j;
    this.OPTION(() => (j = this.SUBRULE(this.subBusRest)));
    this.CONSUME(RSquare);
    return { start: i, end: j };
  });
  subBusRest = this.RULE("subBusRest", () => {
    this.CONSUME(Rest);
    const j = this.CONSUME(INT);
    return j;
  });
}

const hdlParser = new HdlParser();

export const parseHdl = (hdl: string) => {
  const lexResult = hdlLexer.tokenize(hdl);
  hdlParser.input = lexResult.tokens;
  const ast = hdlParser.chip();
  return {
    ast,
    parseErrors: hdlParser.errors.map((error) => ({
      message: error.message,
      startColumn: error.token.startColumn || 0,
      startLineNumber: error.token.startLine || 0,
      endColumn: error.token.endColumn ? error.token.endColumn + 1 : 0,
      endLineNumber: error.token.endLine || 0,
      severity: 8,
    })),
  };
};
