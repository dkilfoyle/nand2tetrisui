import { CompilationError, Span } from "../parserUtils";
import { IAstVm, IAstVmInstruction } from "./vmParser";

const printVmInstruction = (i: IAstVmInstruction) => {
  if (i.astType == "stackInstruction") {
    return `${i.op} ${i.memorySegment} ${i.index}`;
  } else if (i.astType == "opInstruction") {
    return `${i.op}`;
  }
  return "No print for " + i.astType;
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
  const asm: string[] = [];
  const spans: Span[] = [];

  const compileErrors = validateInstructions(ast.instructions);
  if (compileErrors.length > 0) return { asm: [], spans: [], compileErrors };

  const sComment = (c: string) => {
    if (commentLevel > 0) asm.push("// " + c);
  };
  const iComment = (i: IAstVmInstruction) => {
    if (commentLevel > 1) asm.push("// " + printVmInstruction(i));
  };
  const iiComment = (c: string) => {
    if (commentLevel > 2) asm.push("// - " + c);
  };
  const addSpan = (startLine: number) => {
    spans.push({
      startOffset: 0,
      endOffset: 0,
      startColumn: 0,
      endColumn: asm[asm.length - 1].length,
      startLineNumber: startLine,
      endLineNumber: asm.length,
    });
  };

  sComment("Init SP to 256");
  asm.push("@256");
  asm.push("D=A");
  asm.push("@SP");
  asm.push("M=D");

  ast.instructions.forEach((i) => {
    const startLine = asm.length;
    iComment(i);
    if (i.astType == "stackInstruction") {
      if (i.op == "push") {
        if (i.memorySegment == "constant") {
          // push constant 7
          // @7
          // D=A
          // @SP
          // M=D // push D=7 onto stack
          // M=M+1
          iiComment(`D = ${i.index}`);
          asm.push(`@${i.index}`);
          asm.push("D=A");
        } else {
          // push segment i
          // @segment
          // D=A
          // @i
          // A=D+A
          // D=M
          iiComment(`D = RAM[${seg2ptr[i.memorySegment]} + ${i.index}]`);
          asm.push(`@${seg2ptr[i.memorySegment]}`);
          asm.push("D=A");
          asm.push(`@${i.index}`);
          asm.push("A=D+A");
          asm.push("D=M");
        }
        iiComment("RAM[SP] = D");
        asm.push("@SP");
        asm.push("A=M");
        asm.push("M=D");
        iiComment("SP++");
        asm.push("@SP");
        asm.push("M=M+1");
      }
      if (i.op == "pop") {
        if (i.memorySegment == "constant") throw Error("Should have been caught by validation");
        iiComment(`addr(R13)=segment+i`);
        asm.push(`@${seg2ptr[i.memorySegment]}`);
        asm.push("D=A");
        asm.push(`@${i.index}`);
        asm.push("D=D+A");
        asm.push("@R13");
        asm.push("M=D");
        iiComment(`SP--`);
        asm.push("@SP");
        asm.push("M=M-1");
        iiComment(`RAM[addr] = RAM[SP]`);
        asm.push("@SP");
        asm.push("D=A");
        asm.push("@R13");
        asm.push("M=D");
        asm.push("A=D");
      }
    } else if (i.astType == "opInstruction") {
      if (["add", "sub", "and", "or", "eq", "gt", "lt"].includes(i.op)) {
        // binary operation
        iiComment("D=pop");
        asm.push("@SP");
        asm.push("M=M-1");
        asm.push("@SP");
        asm.push("A=M");
        asm.push("D=M");
        iiComment("M=pop");
        asm.push("@SP");
        asm.push("M=M-1");
        asm.push("@SP");
        asm.push("A=M");
        iiComment(`D=D ${i.op} M`);
        switch (i.op) {
          case "add":
            asm.push("M=D+M");
            break;
          case "sub":
            asm.push("M=D-M");
            break;
          case "and":
            asm.push("M=D&M");
            break;
          case "or":
            asm.push("M=D|M");
            break;
          default:
            throw Error(`VM operation ${i.op} not implemented in compiler`); // TODO: eq,gt,lt op
        }
      } else {
        // unary operation
        iiComment("D=pop");
        asm.push("@SP");
        asm.push("M=M-1");
        asm.push("@SP");
        iiComment(`D=${i.op} D`);
        switch (i.op) {
          case "neg":
            asm.push("D=-M");
            break;
          case "not":
            asm.push("D=!M");
            break;
          default:
            throw Error();
        }
      }
    }

    addSpan(startLine);
  });

  return { asm, spans, compileErrors };
};
