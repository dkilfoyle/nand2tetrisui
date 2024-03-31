import { CompilationError, Span } from "../parserUtils";
import { IAstVm, IAstVmInstruction, IAstVmOpInstruction, IAstVmStackInstruction } from "./vmInterface";

const printVmInstruction = (i: IAstVmInstruction) => {
  if (i.astType == "stackInstruction") {
    return `${i.op} ${i.memorySegment} ${i.index}`;
  } else if (i.astType == "opInstruction") {
    return `${i.op}`;
  } else if (i.astType == "gotoInstruction") {
    return `${i.gotoType} ${i.label}`;
  } else if (i.astType == "labelInstruction") {
    return `${i.label}`;
  }
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

export const compileVm = (filename: string, ast: IAstVm, commentLevel = 3) => {
  return new VmCompiler(filename, ast, commentLevel).compile();
};

class VmCompiler {
  public asm: string[] = [];
  public spans: Span[] = [];
  public compileErrors: CompilationError[] = [];
  public startLine: number = 0;
  public boolCount: number = 0;

  constructor(public filename: string, public ast: IAstVm, public commentLevel: number) {}

  write(s: string) {
    if (s.startsWith("(")) this.asm.push(s);
    else this.asm.push(`  ${s}`);
  }

  compile() {
    this.validateInstructions();
    if (this.compileErrors.length > 0) return { asm: [], spans: [], compileErrors: this.compileErrors };
    this.sComment("Init SP to 256");
    this.write("@256");
    this.write("D=A");
    this.write("@SP");
    this.write("M=D");

    this.ast.instructions.forEach((i) => {
      this.write("");
      this.startSpan();
      this.iComment(i);
      switch (i.astType) {
        case "stackInstruction":
          this.writeStackInstruction(i);
          break;
        case "opInstruction":
          this.writeArithmeticInstruction(i);
          break;
        case "labelInstruction":
          this.write(`(${i.label})`);
          break;
        case "gotoInstruction":
          if (i.gotoType == "goto") {
            this.write(`@${i.label}`);
            this.write("0;JMP");
          } else {
            this.write("@SP");
            this.write("AM=M-1");
            this.write("D=M");
            this.write(`@${i.label}`);
            this.write("D;JNE");
          }
          break;
      }
      this.endSpan();
    });
    return { asm: this.asm, spans: this.spans, compileErrors: this.compileErrors };
  }

  writeStackInstruction(i: IAstVmStackInstruction) {
    if (i.op == "push") {
      switch (i.memorySegment) {
        case "constant":
          this.pushConstant(i.index);
          break;
        case "local":
        case "argument":
        case "this":
        case "that":
        case "temp":
          this.moveSegmentToD(seg2ptr[i.memorySegment], i.index);
          this.pushD();
          break;
        case "static":
          this.write(`@${this.filename}.${i.index}`);
          this.write("D=M");
          this.pushD();
          break;
        case "pointer":
          this.write(i.index == 0 ? "@THIS" : "@THAT");
          this.write("D=M");
          this.pushD();
          break;
      }
    }
    if (i.op == "pop") {
      switch (i.memorySegment) {
        case "local":
        case "argument":
        case "this":
        case "that":
        case "temp":
          this.popD();
          this.moveDToSegment(seg2ptr[i.memorySegment], i.index);
          break;
        case "static":
          this.popD();
          this.write(`@${this.filename}.${i.index}`);
          this.write("M=D");
          break;
        case "pointer":
          this.popD();
          this.write(i.index == 0 ? "@THIS" : "@THAT");
          this.write("M=D");
          break;
        case "constant":
          throw Error("Pop constant should have been caught by validation");
      }
    }
  }

  writeArithmeticInstruction(i: IAstVmOpInstruction) {
    if (["add", "sub", "and", "or", "eq", "gt", "lt"].includes(i.op)) {
      // binary operation
      this.iiComment("pop D,M"); // but SP only -1
      this.write("@SP");
      this.write("M=M-1");
      this.write("A=M");
      this.write("D=M");
      this.write("A=A-1");
      switch (i.op) {
        case "add":
          this.write("D=D+M");
          break;
        case "sub":
          this.write("D=M-D");
          break;
        case "and":
          this.write("D=D&M");
          break;
        case "or":
          this.write("M=D|M");
          break;
        case "eq":
        case "lt":
        case "gt": {
          const jump = `J${i.op.toUpperCase()}`;
          this.write("D=M-D");
          this.write(`@BOOL${this.boolCount}`);
          this.write(`D; ${jump}`);
          this.write("D=0");
          this.write(`@ENDBOOL${this.boolCount}`);
          this.write("0;JMP");
          this.write(`(BOOL${this.boolCount})`);
          this.write("D=-1");
          this.write(`(ENDBOOL${this.boolCount})`);
          this.write("@SP");
          this.write("A=M-1");
          this.boolCount++;
          break;
        }
        default:
          throw Error(`VM operation ${i.op} not implemented in compiler`);
      }
      this.write("M=D"); // write answer to stack
    } else {
      // unary operation
      this.write("@SP");
      this.write("A=M");
      this.write("A=A-1");
      switch (i.op) {
        case "neg":
          this.write("M=-M");
          break;
        case "not":
          this.write("M=!M");
          break;
        default:
          throw Error();
      }
    }
  }

  pushD() {
    this.iiComment("push D");
    this.write("@SP");
    this.write("M=M+1");
    this.write("A=M-1");
    this.write("M=D");
  }

  popD() {
    this.iiComment("pop D");
    this.write("@SP");
    this.write("M=M-1");
    this.write("A=M");
    this.write("D=M");
  }

  pushConstant(x: number) {
    this.iiComment(`Load D = ${x}`);
    this.write(`@${x}`);
    this.write("D=A");
    this.pushD();
  }

  moveSegmentToD(segment: string, index: number) {
    this.iiComment(`Move ${segment}[${index}] to D`);
    this.write(`@${index}`);
    this.write("D=A");
    this.write(`@${segment}`);
    this.write(`A=D+${segment == "R5" ? "A" : "M"}`);
    this.write("D=M");
  }

  moveDToSegment(segment: string, index: number) {
    this.iiComment(`Move D to ${segment}[${index}]`);
    this.write("@R13");
    this.write("M=D"); // save value of D
    this.write(`@${index}`);
    this.write("D=A");
    this.write(`@${segment}`);
    this.write(`D=D+${segment == "R5" ? "A" : "M"}`); // D = target address
    this.write("@R14");
    this.write("M=D"); // save target addres to R14
    this.write("@R13");
    this.write("D=M"); // retrieve original value of D
    this.write("@R14");
    this.write("A=M"); // set address to target stored in R14
    this.write("M=D");
  }

  sComment(c: string) {
    if (this.commentLevel > 0) this.write("// " + c);
  }

  iComment(i: IAstVmInstruction) {
    if (this.commentLevel > 1) this.write("// " + printVmInstruction(i));
  }

  iiComment(c: string) {
    if (this.commentLevel > 2) this.write("// - " + c);
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
      startLineNumber: this.startLine + 1,
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
      } else if (i.astType == "gotoInstruction") {
        const findLabel = this.ast.instructions.some((ii) => {
          if (ii.astType == "labelInstruction") {
            if (i.label == ii.label) return true;
          }
          return false;
        });
        if (!findLabel) this.compileErrors.push({ message: "No matching label", span: i.span });
      }
    });
  }
}
