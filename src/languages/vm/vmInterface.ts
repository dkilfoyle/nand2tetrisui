import { Span } from "../parserUtils";

interface IAstVmBase {
  astType: "stackInstruction" | "opInstruction" | "labelInstruction" | "gotoInstruction";
  span: Span;
}

export interface IAstVm {
  instructions: IAstVmInstruction[];
}
export type IAstVmInstruction = IAstVmStackInstruction | IAstVmOpInstruction | IAstVmGotoInstruction | IAstVmLabelInstruction;

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
