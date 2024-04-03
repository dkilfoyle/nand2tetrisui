import { Span } from "../parserUtils";

interface IAstVmBase {
  astType:
    | "stackInstruction"
    | "opInstruction"
    | "labelInstruction"
    | "gotoInstruction"
    | "functionInstruction"
    | "callInstruction"
    | "returnInstruction";
  span: Span;
}

export interface IAstVm {
  instructions: IAstVmInstruction[];
}
export type IAstVmInstruction =
  | IAstVmStackInstruction
  | IAstVmOpInstruction
  | IAstVmGotoInstruction
  | IAstVmLabelInstruction
  | IAstVmFunctionInstruction
  | IAstVmReturnInstruction
  | IAstVmCallInstruction;

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

export interface IAstVmLabelInstruction extends IAstVmBase {
  astType: "labelInstruction";
  label: string;
}

export interface IAstVmGotoInstruction extends IAstVmBase {
  astType: "gotoInstruction";
  gotoType: "goto" | "if-goto";
  label: string;
}

export interface IAstVmFunctionInstruction extends IAstVmBase {
  astType: "functionInstruction";
  functionName: string;
  numLocals: number;
}

export interface IAstVmCallInstruction extends IAstVmBase {
  astType: "callInstruction";
  functionName: string;
  numArgs: number;
}

export interface IAstVmReturnInstruction extends IAstVmBase {
  astType: "returnInstruction";
  functionName: string;
}
