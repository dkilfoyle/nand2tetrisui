import { EmbeddedActionsParser, ITokenConfig, Lexer, TokenType, createToken } from "chevrotain";
import { getTokenSpan } from "../parserUtils";

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

const ID = createToken({ name: "ID", pattern: /[a-zA-Z][a-zA-Z0-9_]*/ });
const INT = addToken({ name: "INT", pattern: /[0-9]+/ });

const keywords: Record<string, TokenType> = {};
const keywordsCategory = addToken({ name: "keywords", pattern: Lexer.NA });
["push", "pop", "function", "call", "return", "goto", "if-goto", "label"].forEach((kw) => {
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

import { Span } from "../parserUtils";

interface IAstVmBase {
  astType: "stackInstruction" | "opInstruction";
  span: Span;
}

export interface IAstVm {
  instructions: IAstVmInstruction[];
}
export type IAstVmInstruction = IAstVmStackInstruction | IAstVmOpInstruction;

export interface IAstVmStackInstruction extends IAstVmBase {
  astType: "stackInstruction";
  op: string;
  memorySegment: string;
  index: number;
}

export interface IAstVmOpInstruction extends IAstVmBase {
  astType: "opInstruction";
  op: string;
}

class VmParser extends EmbeddedActionsParser {
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
    return this.OR([{ ALT: () => this.SUBRULE(this.stackInstruction) }, { ALT: () => this.SUBRULE(this.opInstruction) }]);
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

export const parseVm = (asm: string) => {
  const lexResult = vmLexer.tokenize(asm);
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
