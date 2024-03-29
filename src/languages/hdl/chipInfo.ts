export interface IChipInfo {
  name: string;
  documentation?: string;
  inputs: { name: string; width: number }[];
  outputs: { name: string; width: number }[];
}

// export class Chip {
//   constructor(public name: string, public inputs: IPin[], public outputs: IPin[]) {}
//   isInPin(pinName: string) {
//     return this.inputs.find((input) => input.name == pinName);
//   }
//   isOutPin(pinName: string) {
//     return this.outputs.find((output) => output.name == pinName);
//   }
// }

export const chipInfo: IChipInfo[] = [
  {
    name: "Not16",
    inputs: [
      { name: "a", width: 16 },
      { name: "b", width: 16 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  { name: "Not", inputs: [{ name: "in", width: 1 }], outputs: [{ name: "out", width: 1 }] },

  {
    name: "Nand16",
    inputs: [
      { name: "a", width: 16 },
      { name: "b", width: 16 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "Nand",
    inputs: [
      { name: "a", width: 1 },
      { name: "b", width: 1 },
    ],
    outputs: [{ name: "out", width: 1 }],
  },
  {
    name: "Or16",
    inputs: [
      { name: "a", width: 16 },
      { name: "b", width: 16 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "Or8Way",
    inputs: [{ name: "in", width: 16 }],
    outputs: [{ name: "out", width: 1 }],
  },
  {
    name: "Or",
    inputs: [
      { name: "a", width: 1 },
      { name: "b", width: 1 },
    ],
    outputs: [{ name: "out", width: 1 }],
  },
  {
    name: "And16",
    inputs: [
      { name: "a", width: 16 },
      { name: "b", width: 16 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "And",
    inputs: [
      { name: "a", width: 1 },
      { name: "b", width: 1 },
    ],
    outputs: [{ name: "out", width: 1 }],
  },
  {
    name: "Xor16",
    inputs: [
      { name: "a", width: 16 },
      { name: "b", width: 16 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "Xor",
    inputs: [
      { name: "a", width: 1 },
      { name: "b", width: 1 },
    ],
    outputs: [{ name: "out", width: 1 }],
  },
  {
    name: "Mux16",
    inputs: [
      { name: "a", width: 16 },
      { name: "b", width: 16 },
      { name: "sel", width: 1 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "Mux4Way16",
    inputs: [
      { name: "a", width: 16 },
      { name: "b", width: 16 },
      { name: "c", width: 16 },
      { name: "d", width: 16 },
      { name: "sel", width: 2 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "Mux8Way16",
    inputs: [
      { name: "a", width: 16 },
      { name: "b", width: 16 },
      { name: "c", width: 16 },
      { name: "d", width: 16 },
      { name: "e", width: 16 },
      { name: "f", width: 16 },
      { name: "g", width: 16 },
      { name: "h", width: 16 },
      { name: "sel", width: 3 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "Mux",
    documentation: "Multiplexor:\nif (sel == 0) out = a\nif (sel == 1) out = b",
    inputs: [
      { name: "a", width: 1 },
      { name: "b", width: 1 },
      { name: "sel", width: 1 },
    ],
    outputs: [{ name: "out", width: 1 }],
  },
  {
    name: "DMux4Way",
    documentation: `4-way demultiplexor:
if sel == 00 => [in, 0,  0,  0]
if sel == 01 => [0,  in, 0,  0]
if sel == 10 => [0,  0,  in, 0]
if sel == 11 => [0,  0,  0,  in]
`,
    inputs: [
      { name: "in", width: 1 },
      { name: "sel", width: 2 },
    ],
    outputs: [
      { name: "a", width: 1 },
      { name: "b", width: 1 },
      { name: "c", width: 1 },
      { name: "d", width: 1 },
    ],
  },
  {
    name: "DMux8Way",
    documentation: `4-way demultiplexor:
if sel == 000 => [in, 0, 0, 0, 0, 0, 0, 0 ]
...
if sel == 111 => [0,  0, 0, 0, 0, 0, 0, in]
`,
    inputs: [
      { name: "in", width: 1 },
      { name: "sel", width: 3 },
    ],
    outputs: [
      { name: "a", width: 1 },
      { name: "b", width: 1 },
      { name: "c", width: 1 },
      { name: "d", width: 1 },
      { name: "e", width: 1 },
      { name: "f", width: 1 },
      { name: "g", width: 1 },
      { name: "h", width: 1 },
    ],
  },
  {
    name: "DMux",
    documentation: `Demultiplexor:
 [a, b] = [in, 0] if sel == 0
          [0, in] if sel == 1`,
    inputs: [
      { name: "in", width: 1 },
      { name: "sel", width: 1 },
    ],
    outputs: [
      { name: "a", width: 1 },
      { name: "b", width: 1 },
    ],
  },
  {
    name: "Add16",
    inputs: [
      { name: "a", width: 16 },
      { name: "b", width: 16 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "Inc16",
    inputs: [{ name: "in", width: 16 }],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "HalfAdder",
    inputs: [
      { name: "a", width: 1 },
      { name: "b", width: 1 },
    ],
    outputs: [
      { name: "sum", width: 1 },
      { name: "carry", width: 1 },
    ],
  },
  {
    name: "FullAdder",
    inputs: [
      { name: "a", width: 1 },
      { name: "b", width: 1 },
      { name: "c", width: 1 },
    ],
    outputs: [
      { name: "sum", width: 1 },
      { name: "carry", width: 1 },
    ],
  },
  {
    name: "ALU",
    documentation: `Manipulates the x and y inputs
 if (zx == 1) sets x = 0        16-bit constant
 if (nx == 1) sets x = !x       bitwise not
 if (zy == 1) sets y = 0        16-bit constant
 if (ny == 1) sets y = !y       bitwise not
 if (f == 1)  sets out = x + y  integer 2's complement addition
 if (f == 0)  sets out = x & y  bitwise and
 if (no == 1) sets out = !out   bitwise not

 zr = out == 0 ? 1 : 0
 ng = out < 0 ? 1 : 0
    `,
    inputs: [
      { name: "x", width: 16 },
      { name: "y", width: 16 },
      { name: "zx", width: 1 },
      { name: "nx", width: 1 },
      { name: "zy", width: 1 },
      { name: "ny", width: 1 },
      { name: "f", width: 1 },
      { name: "no", width: 1 },
    ],
    outputs: [
      { name: "out", width: 16 },
      { name: "zr", width: 1 },
      { name: "ng", width: 1 },
    ],
  },

  {
    name: "DFF",
    inputs: [{ name: "in", width: 1 }],
    outputs: [{ name: "out", width: 1 }],
  },
  {
    name: "Bit",
    inputs: [
      { name: "in", width: 1 },
      { name: "load", width: 1 },
    ],
    outputs: [{ name: "out", width: 1 }],
  },
  {
    name: "ARegister",
    inputs: [
      { name: "in", width: 16 },
      { name: "load", width: 1 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "DRegister",
    inputs: [
      { name: "in", width: 16 },
      { name: "load", width: 1 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "Register",
    inputs: [
      { name: "in", width: 16 },
      { name: "load", width: 1 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "PC",
    inputs: [
      { name: "in", width: 16 },
      { name: "inc", width: 1 },
      { name: "load", width: 1 },
      { name: "rest", width: 1 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "RAM8",
    inputs: [
      { name: "in", width: 16 },
      { name: "load", width: 1 },
      { name: "address", width: 3 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "RAM64",
    inputs: [
      { name: "in", width: 16 },
      { name: "load", width: 1 },
      { name: "address", width: 6 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "RAM512",
    inputs: [
      { name: "in", width: 16 },
      { name: "load", width: 1 },
      { name: "address", width: 9 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "RAM4K",
    inputs: [
      { name: "in", width: 16 },
      { name: "load", width: 1 },
      { name: "address", width: 11 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "RAM16K",
    inputs: [
      { name: "in", width: 16 },
      { name: "load", width: 1 },
      { name: "address", width: 12 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },

  {
    name: "Screen",
    inputs: [
      { name: "in", width: 16 },
      { name: "load", width: 1 },
      { name: "address", width: 12 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "Keyboard",
    inputs: [],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "Controller",
    inputs: [
      { name: "instruction", width: 16 },
      { name: "zr", width: 1 },
      { name: "ng", width: 1 },
    ],
    outputs: [
      { name: "writeM", width: 1 },
      { name: "loadA", width: 1 },
      { name: "loadD", width: 1 },
      { name: "loadPC", width: 1 },
      { name: "selA", width: 1 },
      { name: "selY", width: 1 },
    ],
  },
  {
    name: "CPU",
    inputs: [
      { name: "inM", width: 16 },
      { name: "instruction", width: 16 },
      { name: "reset", width: 1 },
    ],
    outputs: [
      { name: "outM", width: 16 },
      { name: "writeM", width: 1 },
      { name: "addressM", width: 15 },
      { name: "pc", width: 15 },
    ],
  },
  {
    name: "Memory",
    inputs: [
      { name: "in", width: 16 },
      { name: "load", width: 1 },
      { name: "address", width: 15 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "ROM32K",
    inputs: [{ name: "address", width: 15 }],
    outputs: [{ name: "out", width: 16 }],
  },
  {
    name: "Debug",
    inputs: [
      { name: "x", width: 1 },
      { name: "y", width: 1 },
    ],
    outputs: [{ name: "z", width: 1 }],
  },
  {
    name: "Lander",
    inputs: [
      { name: "i", width: 1 },
      { name: "j", width: 1 },
    ],
    outputs: [{ name: "k", width: 1 }],
  },
  // "ROM32K",
  // "Screen",
  // "Keyboard",
  // "CPU",
  // "Computer",
  // "Memory",
];
