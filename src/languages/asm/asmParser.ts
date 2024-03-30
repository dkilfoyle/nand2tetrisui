import { EmbeddedActionsParser, ITokenConfig, Lexer, TokenType, createToken } from "chevrotain";
import {
  IAstAsm,
  IAstAsmAInstruction,
  IAstAsmCInstruction,
  IAstAsmComp,
  IAstAsmDest,
  IAstAsmInstruction,
  IAstAsmJmp,
  IAstAsmLabel,
} from "./asmInterface";
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

const ID = createToken({ name: "ID", pattern: /[a-zA-Z][a-zA-Z0-9_.]*/ });

const LParen = addToken({ name: "LParen", label: "(", pattern: /\(/ });
const RParen = addToken({ name: "RParen", label: ")", pattern: /\)/ });
const SemiColon = addToken({ name: "SemiColon", label: ";", pattern: /;/ });
const Equals = addToken({ name: "Equals", pattern: /=/ });
const Plus = addToken({ name: "Plus", pattern: /\+/ });
const Minus = addToken({ name: "Minus", pattern: /-/ });
const And = addToken({ name: "And", pattern: /&/ });
const Or = addToken({ name: "Or", pattern: /\|/ });
const Not = addToken({ name: "Not", pattern: /!/ });
const At = addToken({ name: "At", pattern: /@/ });
const Zero = addToken({ name: "Zero", pattern: /0/ });
const One = addToken({ name: "One", pattern: /1/ });
const OtherDigit = addToken({ name: "OtherDigit", pattern: /[2-9]/ });

const keywords: Record<string, TokenType> = {};
const keywordsCategory = addToken({ name: "keywords", pattern: Lexer.NA });

// ObOtherDigitt.keys(sourceCodes).filter(fn => fn.en2sWih(".hdl")).forEach(fn => {
//   const chipName =
// })

["ADM", "AMD", "AD", "AM", "DM", "MD", "A", "D", "M", "JGT", "JEQ", "JGE", "JLT", "JNE", "JLE", "JMP"].forEach((kw) => {
  keywords[kw] = addToken({ name: kw, pattern: kw, longer_alt: ID, categories: [keywordsCategory] });
});
allTokens.push(ID);
const asmLexer = new Lexer(allTokens);

class AsmParser extends EmbeddedActionsParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  public asm = this.RULE("asm", () => {
    const instructions: IAstAsmInstruction[] = [];
    this.AT_LEAST_ONE(() => instructions.push(this.SUBRULE(this.instruction)));
    return { instructions } as IAstAsm;
  });

  public instruction = this.RULE("instruction", () => {
    return this.OR([
      { ALT: () => this.SUBRULE(this.label) },
      { ALT: () => this.SUBRULE(this.aInstruction) },
      { ALT: () => this.SUBRULE(this.cInstruction) },
    ]);
  });

  label = this.RULE("label", () => {
    this.CONSUME(LParen);
    const idToken = this.CONSUME(ID);
    this.CONSUME(RParen);
    return { astType: "label", label: idToken.image, span: getTokenSpan(idToken) } as IAstAsmLabel;
  });

  aInstruction = this.RULE("aInstruction", () => {
    const attoken = this.CONSUME(At);
    let numorstr: number | string = "invalid";
    this.OR([{ ALT: () => (numorstr = this.SUBRULE(this.int).value) }, { ALT: () => (numorstr = this.CONSUME(ID).image) }]);
    return {
      value: numorstr,
      span: getTokenSpan(attoken),
      astType: "aInstruction",
    } as IAstAsmAInstruction;
  });

  cInstruction = this.RULE("cInstruction", () => {
    // dest? = comp ; jmp?
    const dest = this.OPTION(() => this.SUBRULE(this.dest));
    const comp = this.SUBRULE(this.comp);
    const jmp = this.OPTION2(() => this.SUBRULE(this.jmp));
    return {
      astType: "cInstruction",
      dest,
      comp,
      jmp,
      span: mergeSpans(dest?.span || comp.span, jmp?.span || undefined),
    } as IAstAsmCInstruction;
  });

  int = this.RULE("int", () => {
    return this.OR([{ ALT: () => this.SUBRULE(this.zeroInt) }, { ALT: () => this.SUBRULE(this.nonZeroInt) }]);
  });

  zeroInt = this.RULE("zeroInt", () => {
    const z = this.CONSUME(Zero);
    return { value: 0, span: getTokenSpan(z) };
  });

  nonZeroInt = this.RULE("nonZeroInt", () => {
    let digits = "";
    const first = this.OR([{ ALT: () => this.CONSUME(One) }, { ALT: () => this.CONSUME(OtherDigit) }]);
    digits += first.image;
    let last;
    this.MANY(() => {
      last = this.OR2([{ ALT: () => this.CONSUME(Zero) }, { ALT: () => this.CONSUME2(One) }, { ALT: () => this.CONSUME2(OtherDigit) }]);
      digits += last.image;
    });
    return { value: parseInt(digits), span: getTokenSpan(first, last) };
  });

  dest = this.RULE("dest", () => {
    const dest = this.OR([
      { ALT: () => this.CONSUME(keywords.A) },
      { ALT: () => this.CONSUME(keywords.D) },
      { ALT: () => this.CONSUME(keywords.M) },
      { ALT: () => this.CONSUME(keywords.DM) },
      { ALT: () => this.CONSUME(keywords.MD) },
      { ALT: () => this.CONSUME(keywords.AD) },
      { ALT: () => this.CONSUME(keywords.AMD) },
      { ALT: () => this.CONSUME(keywords.AM) },
      { ALT: () => this.CONSUME(keywords.ADM) },
    ]);
    this.CONSUME(Equals);
    return { value: dest.image, span: getTokenSpan(dest) } as IAstAsmDest;
  });

  comp = this.RULE("comp", () => {
    const unary = this.OPTION(() => this.OR([{ ALT: () => this.CONSUME(Minus) }, { ALT: () => this.CONSUME(Not) }]));
    const lhs = this.SUBRULE(this.term);
    const rhs = this.OPTION2(() => {
      const op = this.OR2([
        { ALT: () => this.CONSUME(Plus) },
        { ALT: () => this.CONSUME2(Minus) },
        { ALT: () => this.CONSUME(And) },
        { ALT: () => this.CONSUME(Or) },
      ]);
      const term = this.SUBRULE(this.nonZeroTerm);
      return { value: op.image + term.value, span: mergeSpans(getTokenSpan(op), term.span) };
    });
    return { value: (unary?.image || "") + lhs.value + (rhs ? rhs.value : ""), span: mergeSpans(lhs.span, rhs?.span) } as IAstAsmComp;
  });

  term = this.RULE("term", () => {
    const term = this.OR([
      { ALT: () => this.CONSUME(keywords.A) },
      { ALT: () => this.CONSUME(keywords.D) },
      { ALT: () => this.CONSUME(keywords.M) },
      { ALT: () => this.CONSUME(Zero) },
      { ALT: () => this.CONSUME(One) },
    ]);
    return { value: term.image, span: getTokenSpan(term) };
  });

  nonZeroTerm = this.RULE("nonZeroTerm", () => {
    const term = this.OR([
      { ALT: () => this.CONSUME(keywords.A) },
      { ALT: () => this.CONSUME(keywords.D) },
      { ALT: () => this.CONSUME(keywords.M) },
      { ALT: () => this.CONSUME(One) },
    ]);
    return { value: term.image, span: getTokenSpan(term) };
  });

  jmp = this.RULE("jmp", () => {
    this.CONSUME(SemiColon);
    const jmp = this.OR([
      { ALT: () => this.CONSUME(keywords.JGT) },
      { ALT: () => this.CONSUME(keywords.JLT) },
      { ALT: () => this.CONSUME(keywords.JGE) },
      { ALT: () => this.CONSUME(keywords.JLE) },
      { ALT: () => this.CONSUME(keywords.JEQ) },
      { ALT: () => this.CONSUME(keywords.JMP) },
    ]);
    return { value: jmp.image, span: getTokenSpan(jmp) } as IAstAsmJmp;
  });
}

const asmParser = new AsmParser();

export const parseAsm = (asm: string) => {
  const lexResult = asmLexer.tokenize(asm);
  asmParser.input = lexResult.tokens;
  const ast = asmParser.asm();
  return {
    ast,
    parseErrors: asmParser.errors.map((error) => ({
      message: error.message,
      startColumn: error.token.startColumn || 0,
      startLineNumber: error.token.startLine || 0,
      endColumn: error.token.endColumn ? error.token.endColumn + 1 : 0,
      endLineNumber: error.token.endLine || 0,
      severity: 8,
    })),
  };
};
