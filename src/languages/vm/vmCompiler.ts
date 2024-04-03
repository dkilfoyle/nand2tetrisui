import { CompilationError, Span } from "../parserUtils";
import {
  IAstVm,
  IAstVmCallInstruction,
  IAstVmFunctionInstruction,
  IAstVmInstruction,
  IAstVmOpInstruction,
  IAstVmStackInstruction,
} from "./vmInterface";

const printVmInstruction = (i: IAstVmInstruction) => {
  switch (i.astType) {
    case "stackInstruction":
      return `${i.op} ${i.memorySegment} ${i.index}`;
    case "opInstruction":
      return `${i.op}`;
    case "gotoInstruction":
      return `${i.gotoType} ${i.label}`;
    case "labelInstruction":
      return `${i.label}`;
    case "functionInstruction":
      return `function ${i.functionName} ${i.numLocals}`;
    case "callInstruction":
      return `call ${i.functionName}`;
    case "returnInstruction":
      return `return (from function ${i.functionName})`;
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
  public compileWarnings: CompilationError[] = [];
  public startLine: number = 0;
  public boolCount: number = 0;
  public fnCalls: Record<string, number> = {};

  constructor(public filename: string, public ast: IAstVm, public commentLevel: number) {}

  write(s: string | string[]) {
    const ss = Array.isArray(s) == false ? [s] : s;
    ss.forEach((line) => {
      if (line.startsWith("(")) this.asm.push(line);
      else this.asm.push(`  ${line}`);
    });
  }

  compile() {
    this.validateInstructions();
    if (this.compileErrors.length > 0) return { asm: [], spans: [], compileErrors: this.compileErrors, compileWarnings: this.compileWarnings };
    // this.sComment("Init SP to 256");
    // this.write("@256");
    // this.write("D=A");
    // this.write("@SP");
    // this.write("M=D");

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
        case "functionInstruction":
          this.writeFunctionInstruction(i);
          break;
        case "returnInstruction":
          this.writeReturnInstruction();
          break;
        case "callInstruction":
          this.writeCallInstruction(i);
          break;
      }
      this.endSpan();
    });
    return { asm: this.asm, spans: this.spans, compileErrors: this.compileErrors, compileWarnings: this.compileWarnings };
  }

  writeReturnInstruction() {
    // stack was                  will be
    // ...callerStackValues       ...callerStackValues
    // arg0                       return value
    // arg1
    // ...
    // argN-1
    // retAddress
    // saved LCL
    // saved ARG
    // saved THIS
    // saved THAT
    // local 0 <== LCL
    // local 1
    // ...
    // local n-1
    // callee stack
    // ....
    // return value
    // SP
    this.iiComment("save LCL (end of frame) in temporary var R13");
    this.write("@LCL");
    this.write("D=M");
    this.write("@R13");
    this.write("M=D");

    this.iiComment("save ret addr in temp var R14");
    this.write("@5");
    this.write("A=D-A"); // A = LCL - 5
    this.write("D=M");
    this.write("@R14");
    this.write("M=D");

    this.iiComment("Reposition ret val for the callee");
    this.write("@SP");
    this.write("A=M-1");
    this.write("D=M"); // retrieve return value from top of stack
    this.write("@ARG");
    this.write("A=M");
    this.write("M=D"); // reposition return value for the caller where Arg0 was

    this.iiComment("Reposition SP for the callee");
    this.write("D=A+1");
    this.write("@SP");
    this.write("M=D"); // reposition stack pointer for the caller @ old Arg0+1

    this.iiComment("Restore THAT");
    this.write("@R13"); // A = LCL
    this.write("AM=M-1"); // A = (R13-=1)
    this.write("D=M");
    this.write("@THAT");
    this.write("M=D"); //  restore THAT (that segment) for the calle);

    this.iiComment("Restore THIS");
    this.write("@R13");
    this.write("AM=M-1");
    this.write("D=M");
    this.write("@THIS");
    this.write("M=D"); //  THIS (this segment) for the calle);

    this.iiComment("Restore ARG");
    this.write("@R13");
    this.write("AM=M-1");
    this.write("D=M");
    this.write("@ARG");
    this.write("M=D"); // restore ARG (argument segment) for the calle);

    this.iiComment("Restore LCL");
    this.write("@R13");
    this.write("AM=M-1");
    this.write("D=M");
    this.write("@LCL");
    this.write("M=D"); //  restore LCL (local segment) for the calle);

    this.iiComment("JMP to return address");
    this.write("@R14");
    this.write("A=M");
    this.write("0;JMP"); //  to the return addres);
  }

  writeFunctionInstruction(i: IAstVmFunctionInstruction) {
    // stack will look like
    // ...callerStackValues
    // arg0
    // arg1
    // ...
    // argN-1
    // retAddress
    // saved LCL
    // saved ARG
    // saved THIS
    // saved THAT
    // <== SP

    this.write(`(${i.functionName})`);
    this.iiComment("fn prolog: set LCL = current SP");
    this.write("@SP");
    this.write("D=M");
    this.write("@LCL");
    this.write("M=D");
    this.iiComment(`fn prolong: init ${i.numLocals} local vars to 0`);
    for (let localCount = 0; localCount < i.numLocals; localCount++) {
      this.write("@0");
      this.write("D=A");
      this.write("@SP");
      this.write("M=M+1");
      this.write("A=M-1");
      this.write("M=D");
    }
  }

  pushSegmentPointer(segment: "LCL" | "ARG" | "THIS" | "THAT") {
    this.iiComment(`Push ${segment} pointer to stack`);
    this.write([`@${segment}`, "D=M", "@SP", "M=M+1", "A=M-1", "M=D"]);
  }

  writeCallInstruction(i: IAstVmCallInstruction) {
    if (!this.fnCalls[i.functionName]) this.fnCalls[i.functionName] = 0;
    else this.fnCalls[i.functionName] += 1;
    const returnAddress = `${i.functionName}$ret.${this.fnCalls[i.functionName]}`;

    this.iiComment("Push return address to stack");
    this.write(`@${returnAddress}`);
    this.write(["D=A", "@SP", "M=M+1", "A=M-1", "M=D"]);
    this.pushSegmentPointer("LCL");
    this.pushSegmentPointer("ARG");
    this.pushSegmentPointer("THIS");
    this.pushSegmentPointer("THAT");
    this.iiComment("Reposition ARG and LCL");

    this.write([
      `@${5 + i.numArgs}`, // number to subtract from SP to get to ARG
      "D=A",
      "@SP",
      "D=M-D",
      "@ARG",
      "M=D", // reposition ARG
      "@SP",
      "D=M",
      "@LCL",
      "M=D", // reposition LCL
      `@${i.functionName}`,
      "0;JMP", // call function (transfer control to callee)
      `(${returnAddress})`,
    ]); // # inject return address label into the code
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
    if (i.astType == "labelInstruction") return;
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
      } else if (i.astType == "returnInstruction") {
        if (i.functionName == "") this.compileErrors.push({ message: "return without preceeding function", span: i.span });
      } else if (i.astType == "functionInstruction") {
        const findRet = this.ast.instructions.some((ii) => ii.astType == "returnInstruction" && ii.functionName == i.functionName);
        if (!findRet) this.compileWarnings.push({ message: "No matching return", span: i.span });
      }
    });
  }
}
