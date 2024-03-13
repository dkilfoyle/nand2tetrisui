import { SymbolTable } from "./SymbolTable";
import { IAstAsm } from "./asmInterface";

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

const destDisassembleLookup: Record<string, string> = {
  "000": "null",
  "001": "M",
  "010": "D",
  "011": "MD",
  "100": "A",
  "101": "AM",
  "110": "AD",
  "111": "AMD",
};
const destAssembleLookup: Record<string, string> = {
  null: "000",
  M: "001",
  D: "010",
  MD: "011",
  DM: "011",
  A: "100",
  AM: "101",
  AD: "110",
  AMD: "111",
  ADM: "111",
};

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
  const dest = destDisassembleLookup[d1 + d2 + d3];
  const jmp = jmpDisassembleLookup[parseInt(j1 + j2 + j3, 2)];

  let asm = dest == "null" ? `${comp}` : `${dest} = ${comp}`;
  if (jmp !== "null") asm += ` ; ${jmp}`;
  return asm;
};

export const compileAsm = (ast: IAstAsm) => {
  const instructions: string[] = [];

  // first pass: build symbol table for labels and vars
  let pc = 0;
  const symbolTable = new SymbolTable();
  ast.instructions.forEach((instruction) => {
    if (instruction.astType == "label") {
      symbolTable.addLabel(instruction.label, pc);
    } else if (instruction.astType == "aInstruction") {
      if (typeof instruction.value == "string") symbolTable.addSymbol(instruction.value);
      pc++;
    } else if (instruction.astType == "cInstruction") {
      pc++;
    }
  });
  symbolTable.finishFirstPass();

  // second pass: build instructions
  pc = 0;
  ast.instructions.forEach((instruction) => {
    if (instruction.astType == "aInstruction") {
      if (typeof instruction.value == "string") {
        const symbol = symbolTable.get(instruction.value);
        if (!symbol) throw Error(`${instruction.value} missing in symbol table`);
        if (!symbol.value) throw Error(`${instruction.value} value missing in symbol table`);
        instructions.push(symbol.value.toString(2).padStart(16, "0"));
      } else instructions.push(instruction.value.toString(2).padStart(16, "0"));
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

  return { instructions, symbolTable };
};
