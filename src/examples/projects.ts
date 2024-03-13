import { hasBuiltinChip } from "@nand2tetris/web-ide/simulator/src/chip/builtins/index";

export const sourceCodes = {
  ...import.meta.glob(["./Debug/*.hdl", "./Debug/*.tst"], { as: "raw", eager: true }),
  ...import.meta.glob(["./Project01/*.hdl", "./Project01/*.tst"], { as: "raw", eager: true }),
  ...import.meta.glob(["./Project02/*.hdl", "./Project02/*.tst"], { as: "raw", eager: true }),
  ...import.meta.glob(["./Project03/*.hdl", "./Project03/*.tst", "./Project03/*.cmp"], { as: "raw", eager: true }),
  ...import.meta.glob(["./Project05/*.hdl", "./Project05/*.tst", "./Project05/*.cmp", "./Project05/*.hack"], { as: "raw", eager: true }),
  ...import.meta.glob(["./Project06/*.asm", "./Project06/*.tst", "./Project06/*.cmp"], { as: "raw", eager: true }),
  ...import.meta.glob(["./Project07/*.vm", "./Project07/*.tst", "./Project07/*.cmp"], { as: "raw", eager: true }),
};

export const projects = [
  { id: "Debug", name: "Debug", children: ["Debug", "Lander"] },
  {
    id: "Project01",
    name: "Project01",
    children: [
      "Nand.hdl",
      "Not.hdl",
      "And.hdl",
      "Or.hdl",
      "Xor.hdl",
      "Mux.hdl",
      "DMux.hdl",
      "Not16.hdl",
      "And16.hdl",
      "Or16.hdl",
      "Mux16.hdl",
      "Or8Way.hdl",
      "Mux4Way16.hdl",
      "Mux8Way16.hdl",
      "DMux4Way.hdl",
      "DMux8Way.hdl",
    ],
  },
  { id: "Project02", name: "Project02", children: ["HalfAdder.hdl", "FullAdder.hdl", "Add16.hdl", "Inc16.hdl", "ALU.hdl"] },
  {
    id: "Project03",
    name: "Project03",
    children: ["DFF.hdl", "Bit.hdl", "Register.hdl", "RAM8.hdl", "RAM64.hdl", "RAM512.hdl", "RAM4K.hdl", "RAM16K.hdl", "PC.hdl"],
  },
  { id: "Project05", name: "Project05", children: ["Memory.hdl", "Controller.hdl", "CPU.hdl", "CPUControl.hdl", "Computer.hdl"] },
  { id: "Project06", name: "Project06", children: ["Max.asm", "Add.asm", "Rect.asm"] },
  { id: "Project07", name: "Project07", children: ["SimpleAdd.vm", "StackTest.vm", "BasicTest.vm", "PointerTest.vm", "StaticTest.vm"] },
];

// console.log("Pre-compiling userdefined chips...");
export const userDefinedChips = Object.keys(sourceCodes)
  .filter((path) => path.endsWith(".hdl"))
  .map((path) => path.substring(path.lastIndexOf("/") + 1, path.indexOf(".hdl")))
  .filter((chip) => !hasBuiltinChip(chip));
