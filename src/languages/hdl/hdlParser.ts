import { EmbeddedActionsParser, ITokenConfig, Lexer, TokenType, createToken } from "chevrotain";
import { builtinChips } from "../../components/editor/simulator/builtins";
import { IAstChip, IAstPart, IAstWire, IAstPinDeclaration, IAstPinParts } from "./hdlInterface";
import { getTokenSpan, mergeSpans } from "../parserUtils";

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
    this.CONSUME(ChipToken);
    let name = "";
    this.OR([
      {
        ALT: () => {
          name = this.CONSUME(ID).image;
        },
      },
      {
        ALT: () => {
          name = this.CONSUME(chipsCategory).image;
        },
      },
    ]);
    this.CONSUME(LCurly);
    let inPins: IAstPinDeclaration[] = [];
    let outPins: IAstPinDeclaration[] = [];
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
    const pins: IAstPinDeclaration[] = [];
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => {
        pins.push(this.SUBRULE(this.pinDecl));
      },
    });
    return pins;
  });
  pinDecl = this.RULE("pinDecl", () => {
    const name = this.CONSUME(ID).image;
    let width = 1;
    this.OPTION(() => {
      width = this.SUBRULE(this.pinWidth);
    });
    return { name, width } as IAstPinDeclaration;
  });
  pinWidth = this.RULE("pinWidth", () => {
    this.CONSUME(LSquare);
    const width = this.CONSUME(INT).image;
    this.CONSUME(RSquare);
    return parseInt(width);
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
    const closeSemi = this.CONSUME(SemiColon);
    return {
      name: name.image,
      wires,
      span: getTokenSpan(name, closeSemi),
    } as IAstPart;
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
    const lhs = this.SUBRULE(this.pinParts);
    this.CONSUME(Equals);
    const rhs = this.OR([{ ALT: () => this.SUBRULE2(this.pinParts) }, { ALT: () => this.SUBRULE3(this.boolean) }]);
    return { lhs, rhs } as IAstWire;
  });
  boolean = this.RULE("boolean", () => {
    const name = this.OR([
      {
        ALT: () => this.CONSUME(True),
      },
      { ALT: () => this.CONSUME(False) },
    ]);
    return {
      name: name.image,
      start: undefined,
      end: undefined,
      span: getTokenSpan(name),
    };
  });
  pinParts = this.RULE("pinParts", () => {
    const name = this.CONSUME(ID);
    const subBus = this.OPTION(() => this.SUBRULE(this.subBus));
    return {
      name: name.image,
      start: subBus?.start,
      end: subBus?.end ?? subBus?.start,
      span: mergeSpans(getTokenSpan(name), subBus?.span),
    } as IAstPinParts;
  });
  subBus = this.RULE("subBus", () => {
    const ls = this.CONSUME(LSquare);
    const i = this.CONSUME(INT);
    const j = this.OPTION(() => this.SUBRULE(this.subBusRest));
    const rs = this.CONSUME(RSquare);
    return { start: parseInt(i.image), end: j ? parseInt(j.image) : undefined, span: getTokenSpan(ls, rs) };
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
