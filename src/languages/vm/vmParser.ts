import { EmbeddedActionsParser, ITokenConfig, Lexer, TokenType, createToken } from "chevrotain";
import { getTokenSpan } from "../parserUtils";
import {
  IAstVmInstruction,
  IAstVm,
  IAstVmStackInstruction,
  IAstVmOpInstruction,
  IAstVmCallInstruction,
  IAstVmFunctionInstruction,
  IAstVmGotoInstruction,
  IAstVmLabelInstruction,
  IAstVmReturnInstruction,
} from "./vmInterface";

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

const ID = createToken({ name: "ID", pattern: /[a-zA-Z][a-zA-Z0-9_$.]*/ });
const INT = addToken({ name: "INT", pattern: /[0-9]+/ });

const keywords: Record<string, TokenType> = {};
const keywordsCategory = addToken({ name: "keywords", pattern: Lexer.NA });
["push", "pop", "function", "call", "return", "if-goto", "goto", "label"].forEach((kw) => {
  keywords[kw] = addToken({ name: kw, pattern: kw, longer_alt: ID, categories: [keywordsCategory] });
});

const segments: Record<string, TokenType> = {};
const segmentsCategory = addToken({ name: "segments", pattern: Lexer.NA });
["argument", "local", "static", "constant", "this", "that", "pointer", "temp"].forEach((kw) => {
  segments[kw] = addToken({ name: kw, pattern: kw, longer_alt: ID, categories: [segmentsCategory] });
});

const operations: Record<string, TokenType> = {};
const operationsCategory = addToken({ name: "operations", pattern: Lexer.NA });
["add", "sub", "neg", "eq", "lt", "gt", "and", "or", "not"].forEach((kw) => {
  operations[kw] = addToken({ name: kw, pattern: kw, longer_alt: ID, categories: [operationsCategory] });
});

allTokens.push(ID);
const vmLexer = new Lexer(allTokens);

class VmParser extends EmbeddedActionsParser {
  public currentFunctionName = "";

  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  public root = this.RULE("root", () => {
    const instructions: IAstVmInstruction[] = [];
    this.AT_LEAST_ONE(() => instructions.push(this.SUBRULE(this.instruction)));
    return { instructions } as IAstVm;
  });

  public instruction = this.RULE("instruction", () => {
    return this.OR([
      { ALT: () => this.SUBRULE(this.stackInstruction) },
      { ALT: () => this.SUBRULE(this.opInstruction) },
      { ALT: () => this.SUBRULE(this.labelInstruction) },
      { ALT: () => this.SUBRULE(this.gotoInstruction) },
      { ALT: () => this.SUBRULE(this.callInstruction) },
      { ALT: () => this.SUBRULE(this.functionInstruction) },
      { ALT: () => this.SUBRULE(this.returnInstruction) },
    ]);
  });

  returnInstruction = this.RULE("returnInstruction", () => {
    const returnkw = this.CONSUME(keywords["return"]);
    const fn = this.currentFunctionName;
    this.currentFunctionName = "";
    return {
      astType: "returnInstruction",
      functionName: fn,
      span: getTokenSpan(returnkw),
    } as IAstVmReturnInstruction;
  });

  functionInstruction = this.RULE("functionInstruction", () => {
    const functionkw = this.CONSUME(keywords["function"]);
    const functionName = this.CONSUME(ID);
    this.currentFunctionName = functionName.image;
    const numLocals = this.CONSUME(INT);
    return {
      astType: "functionInstruction",
      functionName: functionName.image,
      numLocals: parseInt(numLocals.image),
      span: getTokenSpan(functionkw, numLocals),
    } as IAstVmFunctionInstruction;
  });

  callInstruction = this.RULE("callInstruction", () => {
    const callkw = this.CONSUME(keywords["call"]);
    const callName = this.CONSUME(ID);
    const numArgs = this.CONSUME(INT);
    return {
      astType: "callInstruction",
      functionName: callName.image,
      numArgs: parseInt(numArgs.image),
      span: getTokenSpan(callkw, callName),
    } as IAstVmCallInstruction;
  });

  labelInstruction = this.RULE("labelInstruction", () => {
    const labelkw = this.CONSUME(keywords["label"]);
    const labelName = this.CONSUME(ID);
    return {
      astType: "labelInstruction",
      label: labelName.image,
      span: getTokenSpan(labelkw, labelName),
    } as IAstVmLabelInstruction;
  });

  gotoInstruction = this.RULE("gotoInstruction", () => {
    const goto = this.OR([{ ALT: () => this.CONSUME(keywords["if-goto"]) }, { ALT: () => this.CONSUME(keywords["goto"]) }]);
    const labelName = this.CONSUME(ID);
    return {
      astType: "gotoInstruction",
      label: labelName.image,
      gotoType: goto.image,
      span: getTokenSpan(goto, labelName),
    } as IAstVmGotoInstruction;
  });

  stackInstruction = this.RULE("stackInstruction", () => {
    const pushpopToken = this.OR([{ ALT: () => this.CONSUME(keywords["push"]) }, { ALT: () => this.CONSUME(keywords["pop"]) }]);
    const segment = this.SUBRULE(this.memorySegment);
    const index = this.CONSUME(INT);

    return {
      astType: "stackInstruction",
      op: pushpopToken.image,
      memorySegment: segment.segment,
      index: parseInt(index.image),
      span: getTokenSpan(pushpopToken, index),
    } as IAstVmStackInstruction;
  });

  opInstruction = this.RULE("opInstruction", () => {
    const op = this.OR([
      { ALT: () => this.CONSUME(operations["add"]) },
      { ALT: () => this.CONSUME(operations["sub"]) },
      { ALT: () => this.CONSUME(operations["eq"]) },
      { ALT: () => this.CONSUME(operations["gt"]) },
      { ALT: () => this.CONSUME(operations["lt"]) },
      { ALT: () => this.CONSUME(operations["and"]) },
      { ALT: () => this.CONSUME(operations["or"]) },
      { ALT: () => this.CONSUME(operations["not"]) },
      { ALT: () => this.CONSUME(operations["neg"]) },
    ]);

    return {
      astType: "opInstruction",
      op: op.image,
      span: getTokenSpan(op),
    } as IAstVmOpInstruction;
  });

  memorySegment = this.RULE("memorySegment", () => {
    const segment = this.OR([
      { ALT: () => this.CONSUME(segments["argument"]) },
      { ALT: () => this.CONSUME(segments["local"]) },
      { ALT: () => this.CONSUME(segments["static"]) },
      { ALT: () => this.CONSUME(segments["constant"]) },
      { ALT: () => this.CONSUME(segments["this"]) },
      { ALT: () => this.CONSUME(segments["that"]) },
      { ALT: () => this.CONSUME(segments["pointer"]) },
      { ALT: () => this.CONSUME(segments["temp"]) },
    ]);

    return {
      segment: segment.image,
      span: getTokenSpan(segment),
    };
  });
}

const vmParser = new VmParser();

export const parseVm = (vm: string) => {
  const lexResult = vmLexer.tokenize(vm);
  vmParser.input = lexResult.tokens;
  const ast = vmParser.root();
  return {
    ast,
    parseErrors: vmParser.errors.map((error) => ({
      message: error.message,
      startColumn: error.token.startColumn || 0,
      startLineNumber: error.token.startLine || 0,
      endColumn: error.token.endColumn ? error.token.endColumn + 1 : 0,
      endLineNumber: error.token.endLine || 0,
      severity: 8,
    })),
  };
};
