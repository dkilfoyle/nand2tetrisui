interface ISymbol {
  name: string;
  type: "label" | "var" | "unknown";
  value: number | undefined;
}

export class SymbolTable {
  public symbols: ISymbol[];

  constructor() {
    this.symbols = [
      { name: "R0", value: 0, type: "var" },
      { name: "R1", value: 1, type: "var" },
      { name: "R2", value: 2, type: "var" },
      { name: "R3", value: 3, type: "var" },
      { name: "R4", value: 4, type: "var" },
      { name: "R5", value: 5, type: "var" },
      { name: "R6", value: 6, type: "var" },
      { name: "R7", value: 7, type: "var" },
      { name: "R8", value: 8, type: "var" },
      { name: "R9", value: 9, type: "var" },
      { name: "R10", value: 10, type: "var" },
      { name: "R11", value: 11, type: "var" },
      { name: "R12", value: 12, type: "var" },
      { name: "R13", value: 13, type: "var" },
      { name: "R14", value: 14, type: "var" },
      { name: "R15", value: 15, type: "var" },
      { name: "SCREEN", value: 16384, type: "var" },
      { name: "KBD", value: 24576, type: "var" },
      { name: "SP", value: 0, type: "var" },
      { name: "LCL", value: 1, type: "var" },
      { name: "ARG", value: 2, type: "var" },
      { name: "THIS", value: 3, type: "var" },
      { name: "THAT", value: 4, type: "var" },
    ];
  }

  has(name: string) {
    return this.symbols.some((s) => s.name == name);
  }

  get(name: string) {
    return this.symbols.find((s) => s.name == name);
  }

  addSymbol(name: string) {
    const s = this.get(name);
    if (!s) this.symbols.push({ name, value: undefined, type: "unknown" });
  }

  addLabel(name: string, pc: number) {
    const s = this.get(name);
    if (s) {
      s!.type = "label";
      s!.value = pc;
    } else {
      this.symbols.push({ name, type: "label", value: pc });
    }
  }

  finishFirstPass() {
    this.symbols
      .filter((s) => s.type == "unknown")
      .forEach((s, i) => {
        s.type = "var";
        s.value = 16 + i;
      });
  }

  getVars() {
    return this.symbols.filter((s) => s.type == "var");
  }

  getLabels() {
    return this.symbols.filter((s) => s.type == "label");
  }

  getVarForAddress(address: number) {
    const s = this.symbols.find((s) => s.type == "var" && s.value == address);
    return s ? s.name : "";
  }
  getLabelForAddress(address: number) {
    const s = this.symbols.find((s) => s.type == "label" && s.value == address);
    return s ? s.name : "";
  }
}
