import { CompilationError, Span } from "../parserUtils";
import { IAstVm, IAstVmInstruction, IAstVmOpInstruction } from "./vmParser";

const printVmInstruction = (i: IAstVmInstruction) => {
  if (i.astType == "stackInstruction") {
    return `${i.op} ${i.memorySegment} ${i.index}`;
  } else if (i.astType == "opInstruction") {
    return `${i.op}`;
  }
};

const validateInstructions = (instructions: IAstVmInstruction[]) => {
  const compileErrors: CompilationError[] = [];
  instructions.forEach((i) => {
    if (i.astType == "stackInstruction") {
      if (i.memorySegment == "constant") {
        if (i.index > 32767) compileErrors.push({ message: "Exceeds maximum constant (32767)", span: i.span });
        if (i.op == "pop") compileErrors.push({ message: "Cannot pop to constant segment", span: i.span });
      }
      if (i.memorySegment == "temp") {
        if (i.index > 7) compileErrors.push({ message: "Exceeds maximum temp segment size (7)", span: i.span });
      }
      if (i.memorySegment == "static") {
        if (i.index > 240) compileErrors.push({ message: "Exceeds maximum static segment size (240)", span: i.span });
      }
    }
  });
  return compileErrors;
};

const seg2ptr: Record<string, string> = {
  static: "16",
  local: "LCL",
  this: "THIS",
  that: "THAT",
  temp: "R5",
  argument: "ARG",
};

// commentLevel 0 = no comments
// commentLevel 1 = structural comments
// commentLevel 2 = per vm instruction comments
// commentLevel 3 = per asm instruction comments

export const compileVm = (ast: IAstVm, commentLevel = 3) => {
  return new VmCompiler(ast, commentLevel).compile();
};

class VmCompiler {
  public asm: string[] = [];
  public spans: Span[] = [];
  public compileErrors: CompilationError[] = [];
  public startLine: number = 0;
  public boolCount: number = 0;

  constructor(public ast: IAstVm, public commentLevel: number) {}

  pushD() {
    this.iiComment("push D");
    this.asm.push("@SP");
    this.asm.push("A=M");
    this.asm.push("M=D");
    this.iiComment("SP++");
    this.asm.push("@SP");
    this.asm.push("M=M+1");
  }

  popM() {
    this.iiComment("pop M");
    this.asm.push("@SP");
    this.asm.push("M=M-1");
    this.asm.push("@SP");
    this.asm.push("A=M");
  }

  popD() {
    this.iiComment("pop D");
    this.asm.push("@SP");
    this.asm.push("M=M-1");
    this.asm.push("@SP");
    this.asm.push("A=M");
    this.asm.push("D=M");
  }

  pushConstant(x: number) {
    this.iiComment(`Load D = ${x}`);
    this.asm.push(`@${x}`);
    this.asm.push("D=A");
    this.pushD();
  }

  compile() {
    const compileErrors = validateInstructions(this.ast.instructions);
    if (compileErrors.length > 0) return { asm: [], spans: [], compileErrors };
    this.sComment("Init SP to 256");
    this.asm.push("@256");
    this.asm.push("D=A");
    this.asm.push("@SP");
    this.asm.push("M=D");

    this.ast.instructions.forEach((i) => {
      this.startSpan();
      this.iComment(i);
      if (i.astType == "stackInstruction") {
        if (i.op == "push") {
          if (i.memorySegment == "constant") {
            // push constant 7
            // @7
            // D=A
            // @SP
            // M=D // push D=7 onto stack
            // M=M+1
            this.pushConstant(i.index);
          } else {
            // push segment i
            // @segment
            // D=A
            // @i
            // A=D+A
            // D=M
            this.iiComment(`D = RAM[${seg2ptr[i.memorySegment]} + ${i.index}]`);
            this.asm.push(`@${seg2ptr[i.memorySegment]}`);
            this.asm.push("D=A");
            this.asm.push(`@${i.index}`);
            this.asm.push("A=D+A");
            this.asm.push("D=M");
            this.pushD();
          }
        }
        if (i.op == "pop") {
          if (i.memorySegment == "constant") throw Error("Should have been caught by validation");
          this.iiComment(`addr(R13)=segment+i`);
          this.asm.push(`@${seg2ptr[i.memorySegment]}`);
          this.asm.push("D=A");
          this.asm.push(`@${i.index}`);
          this.asm.push("D=D+A");
          this.asm.push("@R13");
          this.asm.push("M=D");
          this.iiComment(`SP--`);
          this.asm.push("@SP");
          this.asm.push("M=M-1");
          this.iiComment(`RAM[addr] = RAM[SP]`);
          this.asm.push("@SP");
          this.asm.push("D=A");
          this.asm.push("@R13");
          this.asm.push("M=D");
          this.asm.push("A=D");
        }
      } else if (i.astType == "opInstruction") {
        if (["add", "sub", "and", "or", "eq", "gt", "lt"].includes(i.op)) {
          // binary operation
          this.popD();
          this.popM();
          this.iiComment(`D=D ${i.op} M`);
          switch (i.op) {
            case "add":
              this.asm.push("M=D+M");
              break;
            case "sub":
              this.asm.push("M=D-M");
              break;
            case "and":
              this.asm.push("M=D&M");
              break;
            case "or":
              this.asm.push("M=D|M");
              break;
            case "eq":
            case "lt":
            case "gt":
              this.booleanOp(i);
              break;
            default:
              throw Error(`VM operation ${i.op} not implemented in compiler`); // TODO: eq,gt,lt op
          }
        } else {
          // unary operation
          this.popM();
          this.iiComment(`D=${i.op} M`);
          switch (i.op) {
            case "neg":
              this.asm.push("D=-M");
              break;
            case "not":
              this.asm.push("D=!M");
              break;
            default:
              throw Error();
          }
        }
      }
    });
    return { asm: this.asm, spans: this.spans, compileErrors: this.compileErrors };
  }

  booleanOp(i: IAstVmOpInstruction) {
    const jump = `J${i.op.toUpperCase()}`;
    this.asm.push("D=M-D");
    this.asm.push(`@BOOL${this.boolCount}T`);
    this.asm.push(`D; ${jump}`);
    // else
    this.pushConstant(0);
    this.asm.push(`@BOOL${this.boolCount}X`);
    this.asm.push("0;JMP");
    this.asm.push(`(BOOL${this.boolCount}T)`);
    this.asm.push("@1");
    this.asm.push("AD=-A");
    this.pushD();
    this.asm.push(`(BOOL${this.boolCount}X)`);
    this.boolCount++;
  }

  sComment(c: string) {
    if (this.commentLevel > 0) this.asm.push("// " + c);
  }

  iComment(i: IAstVmInstruction) {
    if (this.commentLevel > 1) this.asm.push("// " + printVmInstruction(i));
  }

  iiComment(c: string) {
    if (this.commentLevel > 2) this.asm.push("// - " + c);
  }

  startSpan() {
    this.startLine = this.asm.length;
  }

  endSpan() {
    this.spans.push({
      startOffset: 0,
      endOffset: 0,
      startColumn: 0,
      endColumn: this.asm[this.asm.length - 1].length,
      startLineNumber: this.startLine,
      endLineNumber: this.asm.length,
    });
  }

  validateInstructions() {
    this.ast.instructions.forEach((i) => {
      if (i.astType == "stackInstruction") {
        if (i.memorySegment == "constant") {
          if (i.index > 32767) this.compileErrors.push({ message: "Exceeds maximum constant (32767)", span: i.span });
          if (i.op == "pop") this.compileErrors.push({ message: "Cannot pop to constant segment", span: i.span });
        }
        if (i.memorySegment == "temp") {
          if (i.index > 7) this.compileErrors.push({ message: "Exceeds maximum temp segment size (7)", span: i.span });
        }
        if (i.memorySegment == "static") {
          if (i.index > 240) this.compileErrors.push({ message: "Exceeds maximum static segment size (240)", span: i.span });
        }
      }
    });
  }
}
