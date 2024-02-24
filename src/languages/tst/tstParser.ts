import { EmbeddedActionsParser, IToken, ITokenConfig, Lexer, TokenType, createToken } from "chevrotain";
import { getTokenSpan, mergeSpans } from "../parserUtils";
import { IAstTst, IAstTstNumberValue, IAstTstOperation, IAstTstOutputFormat, IAstTstStatement } from "./tstInterface";
import { Chip } from "../hdl/Chip";

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

const IdToken = createToken({ name: "ID", pattern: /[a-zA-Z][a-zA-Z0-9]*/ });
const KeywordTokens = ["output-list", "set", "expect", "eval", "note", "output", "tick", "tock"].reduce(
  (keywordDict: Record<string, TokenType>, keyword) => {
    const t = addToken({ name: keyword, pattern: RegExp(keyword), longer_alt: IdToken });
    keywordDict[keyword] = t;
    return keywordDict;
  },
  {}
);

const StringToken = addToken({ name: "String", pattern: /"[^<"]*"|'[^<']*'/ });
// const FalseToken = addToken({ name: "True", pattern: /true/, longer_alt: IdToken });
// const TrueToken = addToken({ name: "False", pattern: /false/, longer_alt: IdToken });
// const LCurlyToken = addToken({ name: "LCurly", label: "{", pattern: /{/ });
// const RCurlyToken = addToken({ name: "RCurly", label: "}", pattern: /}/ });
// const LParenToken = addToken({ name: "LParen", label: "(", pattern: /\(/ });
// const RParenToken = addToken({ name: "RParen", label: ")", pattern: /\)/ });
const LSquareToken = addToken({ name: "LSquare", label: "[", pattern: /\[/ });
const RSquareToken = addToken({ name: "RSquare", label: "]", pattern: /\]/ });
const CommaToken = addToken({ name: "Comma", label: ",", pattern: /,/ });
const SemiColonToken = addToken({ name: "SemiColon", label: ";", pattern: /;/ });
// const EqualsToken = addToken({ name: "Equals", pattern: /=/ });
const BinaryToken = addToken({ name: "BinaryToken", pattern: /%B/ });
// const PercentToken = addToken({ name: "PercentToken", pattern: /%/, longer_alt: BinaryToken });
// const HexToken = addToken({ name: "HexToken", pattern: /%X/ });
const MinusToken = addToken({ name: "MinusToken", pattern: /-/ });
const DecimalToken = addToken({ name: "DecimalToken", pattern: /%D/ });
const String2Token = addToken({ name: "String2Token", pattern: /%S/ });
const IntegerToken = addToken({ name: "Integer", pattern: /[0-9]+/ });
const PeriodToken = addToken({ name: "Period", pattern: /\./ });
allTokens.push(IdToken);
const tstLexer = new Lexer(allTokens);

class TstParser extends EmbeddedActionsParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  public tests = this.RULE("tests", () => {
    let outputFormats: IAstTstOutputFormat = {};
    this.OPTION(() => {
      outputFormats = this.SUBRULE(this.outputStatement);
    });

    const statements: IAstTstStatement[] = [];
    this.AT_LEAST_ONE(() => {
      const statement = this.SUBRULE(this.tstStatement);
      statements.push(statement);
    });
    return { statements, outputFormats };
  });

  outputStatement = this.RULE("outputStatement", () => {
    this.CONSUME(KeywordTokens["output-list"]);
    const formats: IAstTstOutputFormat = {};
    this.AT_LEAST_ONE(() => {
      const { pinName, radix } = this.SUBRULE(this.formatEntry);
      formats[pinName] = radix;
    });
    this.CONSUME(SemiColonToken);
    return formats;
  });

  formatEntry = this.RULE("formatEntry", () => {
    const id = this.CONSUME(IdToken);
    const binary = this.OR([
      { ALT: () => this.CONSUME(BinaryToken) },
      { ALT: () => this.CONSUME(String2Token) },
      { ALT: () => this.CONSUME(DecimalToken) },
    ]);
    this.OPTION2(() => {
      this.CONSUME(IntegerToken);
      this.CONSUME(PeriodToken);
      this.CONSUME2(IntegerToken);
      this.CONSUME2(PeriodToken);
      this.CONSUME3(IntegerToken);
    });
    return { pinName: id.image, radix: binary.image == "%B" ? 2 : binary.image == "%D" ? 10 : undefined };
  });

  numberValue = this.RULE("numberValue", () => {
    let val: IAstTstNumberValue | undefined;
    this.OR([
      { ALT: () => (val = this.SUBRULE(this.binaryNumber)) },
      // { ALT: () => (val = this.SUBRULE(this.hexNumber)) },
      { ALT: () => (val = this.SUBRULE(this.decimalNumber)) },
    ]);
    if (val == undefined) throw Error();
    return val as IAstTstNumberValue;
  });

  binaryNumber = this.RULE("binaryNumber", () => {
    const b = this.CONSUME(BinaryToken);
    let val = "";
    let digit = b;
    this.AT_LEAST_ONE(() => {
      digit = this.CONSUME(IntegerToken); // TODO: Lexer for binary vs integer
      val += digit.image;
    });
    return { value: "%B" + val, span: mergeSpans(getTokenSpan(b), getTokenSpan(digit)) } as IAstTstNumberValue;
  });

  decimalNumber = this.RULE("decimalNumber", () => {
    let a: IToken | undefined;
    let minus: IToken | undefined;
    this.OPTION(() => (a = this.CONSUME(DecimalToken)));
    this.OPTION2(() => (minus = this.CONSUME2(MinusToken)));
    const b = this.CONSUME3(IntegerToken);
    return { value: (minus ? "-" : "") + b.image, span: mergeSpans(getTokenSpan(a ?? minus ?? b), getTokenSpan(b)) };
  });

  tstStatement = this.RULE("statement", () => {
    const operations: IAstTstOperation[] = [];
    this.AT_LEAST_ONE_SEP({
      SEP: CommaToken,
      DEF: () => operations.push(this.SUBRULE(this.tstOperation)),
    });
    this.CONSUME(SemiColonToken);
    return { operations, span: mergeSpans(operations[0].span, operations[operations.length - 1].span) };
  });

  tstOperation = this.RULE("tstOperation", (): IAstTstOperation => {
    let op: IAstTstOperation | undefined;
    this.OR([
      { ALT: () => (op = this.SUBRULE(this.tstSetOperation)) },
      { ALT: () => (op = this.SUBRULE(this.tstExpectOperation)) },
      { ALT: () => (op = this.SUBRULE(this.tstEvalOperation)) },
      { ALT: () => (op = this.SUBRULE(this.tstClockOperation)) },
      { ALT: () => (op = this.SUBRULE(this.tstOutputOperation)) },
      { ALT: () => (op = this.SUBRULE(this.tstNoteOperation)) },
    ]);
    return op!;
  });

  tstClockOperation = this.RULE("tstClockOperation", () => {
    let ticktock: IToken;
    this.OR([{ ALT: () => (ticktock = this.CONSUME(KeywordTokens.tick)) }, { ALT: () => (ticktock = this.CONSUME(KeywordTokens.tock)) }]);
    return { opName: ticktock!.image, span: getTokenSpan(ticktock!) };
  });

  tstOutputOperation = this.RULE("tstOutputOperation", () => {
    const o = this.CONSUME(KeywordTokens.output);
    return { opName: "output", span: getTokenSpan(o) };
  });

  tstNoteOperation = this.RULE("tstNoteOperation", (): IAstTstOperation => {
    const nt = this.CONSUME(KeywordTokens.note);
    const str = this.CONSUME(StringToken);
    return {
      opName: "note",
      note: str.image.substring(1, str.image.length - 1),
      span: getTokenSpan(nt, str),
    };
  });

  tstSetOperation = this.RULE("tstSetOperation", (): IAstTstOperation => {
    const s = this.CONSUME(KeywordTokens.set);
    const id = this.CONSUME(IdToken);
    const index = this.OPTION(() => this.SUBRULE(this.index));
    const val = this.SUBRULE(this.numberValue); // todo: binary/hex/dec
    return {
      opName: "set",
      assignment: { id: id.image, index, value: val.value },
      span: mergeSpans(getTokenSpan(s), val.span),
    };
  });

  tstExpectOperation = this.RULE("tstExpectOperation", (): IAstTstOperation => {
    const s = this.CONSUME(KeywordTokens.expect);
    const id = this.CONSUME(IdToken);
    const index = this.OPTION(() => this.SUBRULE(this.index));
    const val = this.SUBRULE(this.numberValue); // todo: binary/hex/dec
    return {
      opName: "expect",
      assignment: { id: id.image, index, value: val.value },
      span: mergeSpans(getTokenSpan(s), val.span),
    };
  });

  tstEvalOperation = this.RULE("tstEvalOperation", (): IAstTstOperation => {
    const e = this.CONSUME(KeywordTokens.eval);
    return {
      opName: "eval",
      span: getTokenSpan(e),
    };
  });

  index = this.RULE("index", () => {
    this.CONSUME(LSquareToken);
    const value = this.SUBRULE(this.value);
    this.CONSUME(RSquareToken);
    return value;
  });

  value = this.RULE("value", () => {
    const v = this.CONSUME(IntegerToken);
    return parseInt(v.image);
  });
}

const tstParser = new TstParser();

export const parseTst = (tst: string) => {
  const lexResult = tstLexer.tokenize(tst);
  tstParser.input = lexResult.tokens;
  const ast = tstParser.tests();
  return {
    ast,
    parseErrors: tstParser.errors.map((error) => ({
      message: error.message,
      startColumn: error.token.startColumn || 0,
      startLineNumber: error.token.startLine || 0,
      endColumn: error.token.endColumn ? error.token.endColumn + 1 : 0,
      endLineNumber: error.token.endLine || 0,
      severity: 8,
    })),
  };
};

export const checkTst = (ast: IAstTst, chip: Chip) => {
  if (!chip) {
    console.log("not chip");
    return [];
  }
  for (const statment of ast.statements) {
    for (const operation of statment.operations) {
      if (operation.opName == "set") {
        if (!chip.hasIn(operation.assignment!.id)) return [{ message: "Set target is not a chip input", span: operation.span }];
      } else if (operation.opName == "expect") {
        if (!chip.hasOut(operation.assignment!.id)) return [{ message: "Expect target is not a chip out", span: operation.span }];
      }
    }
  }
  return [];
};
