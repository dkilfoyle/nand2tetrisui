import { Span } from "../parserUtils";

const compDisassembleLookup: Record<string, string> = {
  "0101010": "0",
  "0111111": "1",
  "0111010": "-1",
  "0001100": "D",
  "0110000": "A",
  "0001101": "!D",
  "0110001": "!A",
  "0001111": "-D",
  "0110011": "-A",
  "0011111": "D+1",
  "0110111": "A+1",
  "0001110": "D-1",
  "0110010": "A-1",
  "0000010": "D+A",
  "0010011": "D-A",
  "0000111": "A-D",
  "0000000": "D&A",
  "0010101": "D|A",
  "1101010": "",
  "1111111": "",
  "1111010": "",
  "1001100": "",
  "1110000": "M",
  "1001101": "",
  "1110001": "!M",
  "1001111": "",
  "1110011": "-M",
  "1011111": "",
  "1110111": "M+1",
  "1001110": "",
  "1110010": "M-1",
  "1000010": "D+M",
  "1010011": "D-M",
  "1000111": "M-D",
  "1000000": "D&M",
  "1010101": "D|M",
};

const compAssembleLookup = Object.entries(compDisassembleLookup).reduce<Record<string, string>>((wip, [key, value]) => {
  if (value !== "") wip[value] = key;
  return wip;
}, {});

const destDisassembleLookup = ["null", "M", "D", "DM", "A", "AM", "AD", "ADM"];
const destAssembleLookup = destDisassembleLookup.reduce<Record<string, string>>((wip, dest, i) => {
  wip[dest] = i.toString(2).padStart(3, "0");
  return wip;
}, {});

const jmpDisassembleLookup = ["null", "JGT", "JEQ", "JGE", "JLT", "JNE", "JLE", "JMP"];
const jmpAssembleLookup = jmpDisassembleLookup.reduce<Record<string, string>>((wip, jmp, i) => {
  wip[jmp] = i.toString(2).padStart(3, "0");
  return wip;
}, {});

export const disassemble = (instruction: string | number) => {
  if (typeof instruction == "number") instruction = instruction.toString(2).padStart(16, "0");
  if (instruction[15 - 15] == "0") return `@${parseInt(instruction, 2)}`;
  const [x1, x2, x3, a, c1, c2, c3, c4, c5, c6, d1, d2, d3, j1, j2, j3] = instruction;
  if (!(x1 == "1" && x2 == "1" && x3 == "1")) throw Error(`Can't disassemble invalid instruction ${instruction}`);
  const comp = compDisassembleLookup[a + c1 + c2 + c3 + c4 + c5 + c6];
  const dest = destDisassembleLookup[parseInt(d1 + d2 + d3, 2)];
  const jmp = jmpDisassembleLookup[parseInt(j1 + j2 + j3, 2)];

  let asm = dest == "null" ? `${comp}` : `${dest} = ${comp}`;
  if (jmp !== "null") asm += ` ; ${jmp}`;
  return asm;
};

const defaultSymbols = {
  R0: 0,
  R1: 1,
  R2: 2,
  R3: 3,
  R4: 4,
  R5: 5,
  R6: 6,
  R7: 7,
  R8: 8,
  R9: 9,
  R10: 10,
  R11: 11,
  R12: 12,
  R13: 13,
  R14: 13,
  R15: 15,
  Screen: 16384,
  KBD: 24576,
  SP: 0,
  LCL: 1,
  ARG: 2,
  THIS: 3,
  THAT: 4,
};

export const assemble = (ast: IAstAsm) => {
  const instructions: string[] = [];
  const symbols: Record<string, number> = defaultSymbols;

  // first pass: build symbol table for labels and vars
  let pc = 0;
  let vars = 16;
  ast.instructions.forEach((instruction) => {
    if (instruction.astType == "label") {
      symbols[instruction.label] = pc;
    } else if (instruction.astType == "aInstruction") {
      if (typeof instruction.value == "string") symbols[instruction.value] = vars++;
      pc++;
    } else if (instruction.astType == "cInstruction") {
      pc++;
    }
  });

  console.log("Symbol table:", symbols);

  // second pass: build instructions
  pc = 0;
  ast.instructions.forEach((instruction) => {
    if (instruction.astType == "aInstruction") {
      if (typeof instruction.value == "string") instructions.push(symbols[instruction.value].toString(2).padStart(16, "0"));
      instructions.push(instruction.value.toString(2).padStart(16, "0"));
      pc++;
    } else if (instruction.astType == "cInstruction") {
      // 111 acccccc ddd jjj
      let res = "111";
      res += compAssembleLookup[instruction.comp.value];
      res += destAssembleLookup[instruction.dest?.value || "null"];
      res += jmpAssembleLookup[instruction.jmp?.value || "null"];
      instructions.push(res);
      pc++;
    }
  });

  return { instructions, symbols };
};

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
