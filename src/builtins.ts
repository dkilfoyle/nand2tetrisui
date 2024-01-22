export const builtinChips = {
  Not16: {
    name: "Not16",
    inputs: [
      { name: "a", width: 16 },
      { name: "b", width: 16 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  Not: { name: "Not", inputs: [{ name: "in", width: 1 }], outputs: [{ name: "out", width: 1 }] },

  Nand16: {
    name: "Nand16",
    inputs: [
      { name: "a", width: 16 },
      { name: "b", width: 16 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  Nand: {
    name: "Nand",
    inputs: [
      { name: "a", width: 1 },
      { name: "b", width: 1 },
    ],
    outputs: [{ name: "out", width: 1 }],
  },
  Or16: {
    name: "Or16",
    inputs: [
      { name: "a", width: 16 },
      { name: "b", width: 16 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  Or8Way: {
    name: "Or8Way",
    inputs: [{ name: "in", width: 16 }],
    outputs: [{ name: "out", width: 1 }],
  },
  Or: {
    name: "Or",
    inputs: [
      { name: "a", width: 1 },
      { name: "b", width: 1 },
    ],
    outputs: [{ name: "out", width: 1 }],
  },
  And16: {
    name: "And16",
    inputs: [
      { name: "a", width: 16 },
      { name: "b", width: 16 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  And: {
    name: "And",
    inputs: [
      { name: "a", width: 1 },
      { name: "b", width: 1 },
    ],
    outputs: [{ name: "out", width: 1 }],
  },
  Xor16: {
    name: "Xor16",
    inputs: [
      { name: "a", width: 16 },
      { name: "b", width: 16 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  Xor: {
    name: "Xor",
    inputs: [
      { name: "a", width: 1 },
      { name: "b", width: 1 },
    ],
    outputs: [{ name: "out", width: 1 }],
  },
  Mux16: {
    name: "Mux16",
    inputs: [
      { name: "a", width: 16 },
      { name: "b", width: 16 },
      { name: "sel", width: 1 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  Mux4Way16: {
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
  Mux8Way16: {
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
  Mux: {
    name: "Mux",
    documentation: `Multiplexor:
 if (sel == 0) out = a, else out = b`,
    inputs: [
      { name: "a", width: 1 },
      { name: "b", width: 1 },
    ],
    outputs: [{ name: "out", width: 1 }],
  },
  DMux4Way: {
    name: "DMux4Way",
    documentation: `4-way demultiplexor:
 [a, b, c, d] = [in, 0, 0, 0] if sel == 00
                [0, in, 0, 0] if sel == 01
                [0, 0, in, 0] if sel == 10
                [0, 0, 0, in] if sel == 11
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
  DMux8Way: {
    name: "DMux8Way",
    documentation: `4-way demultiplexor:
 [a, b..., g, h] = [in, 0, 0, 0, 0, 0, 0, 0 ] if sel == 000
                   ...
                   [0,  0, 0, 0, 0, 0, 0, in] if sel == 111
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
  DMux: {
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
  Add16: {
    name: "Add16",
    inputs: [
      { name: "a", width: 16 },
      { name: "b", width: 16 },
    ],
    outputs: [{ name: "out", width: 16 }],
  },
  Inc16: {
    name: "Inc16",
    inputs: [{ name: "in", width: 16 }],
    outputs: [{ name: "out", width: 16 }],
  },
  HalfAdder: {
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
  FullAdder: {
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
};
