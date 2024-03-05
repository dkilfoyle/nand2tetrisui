import { Span } from "../parserUtils";

interface IAstAsmBase {
  astType: "label" | "aInstruction" | "cInstruction" | "dest" | "comp" | "jmp";
  span: Span;
}

export interface IAstAsm {
  instructions: IAstAsmInstruction[];
}
export type IAstAsmInstruction = IAstAsmLabel | IAstAsmAInstruction | IAstAsmCInstruction;
export interface IAstAsmLabel extends IAstAsmBase {
  astType: "label";
  label: string;
}
export interface IAstAsmAInstruction extends IAstAsmBase {
  astType: "aInstruction";
  value: string | number;
}
export interface IAstAsmCInstruction extends IAstAsmBase {
  // dest = comp ; jmp
  astType: "cInstruction";
  dest?: IAstAsmDest;
  comp: IAstAsmComp;
  jmp?: IAstAsmJmp;
}
export interface IAstAsmDest extends IAstAsmBase {
  astType: "dest";
  value: string;
}
export interface IAstAsmComp extends IAstAsmBase {
  astType: "comp";
  value: string;
}
export interface IAstAsmJmp extends IAstAsmBase {
  astType: "jmp";
  value: string;
}
