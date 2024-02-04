import { EmbeddedActionsParser, ITokenConfig, Lexer, TokenType, createToken } from "chevrotain";
import { CompilationError, getTokenSpan, mergeSpans } from "./parserUtils";
import { IAstTst, IAstTstOperation, IAstTstStatement } from "./tstInterface";
import { Chip } from "./Chip";

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
const SetToken = addToken({ name: "Set", pattern: /set/, longer_alt: IdToken });
const ExpectToken = addToken({ name: "Expect", pattern: /expect/, longer_alt: IdToken });
const EvalToken = addToken({ name: "Eval", pattern: /eval/, longer_alt: IdToken });
const FalseToken = addToken({ name: "True", pattern: /true/, longer_alt: IdToken });
const TrueToken = addToken({ name: "False", pattern: /false/, longer_alt: IdToken });
const LCurlyToken = addToken({ name: "LCurly", label: "{", pattern: /{/ });
const RCurlyToken = addToken({ name: "RCurly", label: "}", pattern: /}/ });
const LParenToken = addToken({ name: "LParen", label: "(", pattern: /\(/ });
const RParenToken = addToken({ name: "RParen", label: ")", pattern: /\)/ });
const LSquareToken = addToken({ name: "LSquare", label: "[", pattern: /\[/ });
const RSquareToken = addToken({ name: "RSquare", label: "]", pattern: /\]/ });
const CommaToken = addToken({ name: "Comma", label: ",", pattern: /,/ });
const SemiColonToken = addToken({ name: "SemiColon", label: ";", pattern: /;/ });
const EqualsToken = addToken({ name: "Equals", pattern: /=/ });
const IntegerToken = addToken({ name: "Integer", pattern: /[0-9]+/ });
allTokens.push(IdToken);
const tstLexer = new Lexer(allTokens);

class TstParser extends EmbeddedActionsParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  public tests = this.RULE("tests", () => {
    const statements: IAstTstStatement[] = [];
    this.AT_LEAST_ONE(() => {
      const statement = this.SUBRULE(this.tstStatement);
      statements.push(statement);
    });
    return { statements };
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

  tstOperation = this.RULE("tstOperation", () => {
    let op: IAstTstOperation;
    this.OR([
      { ALT: () => (op = this.SUBRULE(this.tstSetOperation)) },
      { ALT: () => (op = this.SUBRULE(this.tstExpectOperation)) },
      { ALT: () => (op = this.SUBRULE(this.tstEvalOperation)) },
    ]);
    return op;
  });

  tstSetOperation = this.RULE("tstSetOperation", () => {
    const s = this.CONSUME(SetToken);
    const id = this.CONSUME(IdToken);
    const index = this.OPTION(() => this.SUBRULE(this.index));
    const value = this.CONSUME(IntegerToken); // todo: binary/hex/dec
    return {
      opName: "set",
      assignment: { id: id.image, index, value: parseInt(value.image) },
      span: mergeSpans(getTokenSpan(s), getTokenSpan(value)),
    } as IAstTstOperation;
  });

  tstExpectOperation = this.RULE("tstExpectOperation", () => {
    const s = this.CONSUME(ExpectToken);
    const id = this.CONSUME(IdToken);
    const index = this.OPTION(() => this.SUBRULE(this.index));
    const value = this.CONSUME(IntegerToken); // todo: binary/hex/dec
    return {
      opName: "expect",
      assignment: { id: id.image, index, value: parseInt(value.image) },
      span: getTokenSpan(s, value),
    } as IAstTstOperation;
  });

  tstEvalOperation = this.RULE("tstEvalOperation", () => {
    const e = this.CONSUME(EvalToken);
    return {
      opName: "eval",
      span: getTokenSpan(e),
    } as IAstTstOperation;
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
