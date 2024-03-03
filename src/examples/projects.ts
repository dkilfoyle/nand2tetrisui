import { hasBuiltinChip } from "@nand2tetris/web-ide/simulator/src/chip/builtins/index";

export const sourceCodes = {
  ...import.meta.glob(["./Debug/*.hdl", "./Debug/*.tst"], { as: "raw", eager: true }),
  ...import.meta.glob(["./Project01/*.hdl", "./Project01/*.tst"], { as: "raw", eager: true }),
  ...import.meta.glob(["./Project02/*.hdl", "./Project02/*.tst"], { as: "raw", eager: true }),
  ...import.meta.glob(["./Project03/*.hdl", "./Project03/*.tst", "./Project03/*.cmp"], { as: "raw", eager: true }),
  ...import.meta.glob(["./Project05/*.hdl", "./Project05/*.tst", "./Project05/*.cmp"], { as: "raw", eager: true }),
};

export const projects = [
  { id: "Debug", name: "Debug", children: ["Debug", "Lander"] },
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
  { id: "Project03", name: "Project03", children: ["DFF", "Bit", "Register", "RAM8", "RAM64", "RAM512", "RAM4K", "RAM16K", "PC"] },
  { id: "Project05", name: "Project05", children: ["Memory", "Controller", "CPU", "CPUControl", "Computer"] },
];

// console.log("Pre-compiling userdefined chips...");
export const userDefinedChips = Object.keys(sourceCodes)
  .filter((path) => path.endsWith(".hdl"))
  .map((path) => path.substring(path.lastIndexOf("/") + 1, path.indexOf(".hdl")))
  .filter((chip) => !hasBuiltinChip(chip));
