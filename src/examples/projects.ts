export const sourceCodes = {
  ...import.meta.glob(["./Project01/*.hdl", "./Project01/*.tst"], { as: "raw", eager: true }),
  ...import.meta.glob(["./Project02/*.hdl", "./Project02/*.tst"], { as: "raw", eager: true }),
  ...import.meta.glob(["./Project03/*.hdl", "./Project03/*.tst"], { as: "raw", eager: true }),
};

export const projects = [
  {
    id: "Project01",
    name: "Project01",
    children: [
      "Nand",
      "Not",
      "And",
      "Or",
      "Xor",
      "Mux",
      "DMux",
      "Not16",
      "And16",
      "Or16",
      "Mux16",
      "Or8Way",
      "Mux4Way16",
      "Mux8Way16",
      "DMux4Way",
      "DMux8Way",
    ],
  },
  { id: "Project02", name: "Project02", children: ["HalfAdder", "FullAdder", "Add16", "Inc16", "ALU"] },
  { id: "Project03", name: "Project02", children: ["DFF", "Bit", "Register", "RAM8", "RAM64", "RAM512", "RAM4K", "RAM16K", "PC"] },
];
