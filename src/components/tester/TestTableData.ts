import { Bus, HIGH, LOW, Pin, Chip } from "@nand2tetris/web-ide/simulator/src/chip/chip";
import { ROM32K } from "@nand2tetris/web-ide/simulator/src/chip/builtins/computer/computer";
import { Clock } from "@nand2tetris/web-ide/simulator/src/chip/clock";
import { sourceCodes } from "../../examples/projects";
import { CellClassParams, ColDef } from "@ag-grid-community/core";
import { IAstTstCommand, IAstTstOutputFormat } from "../../languages/tst/tstInterface";
import { ITests } from "../../store/atoms";

export type ITest = Record<string, string>;
export interface ITestsOutcome {
  pass: number;
  fail: number;
}

const toDecimal = (i: number): string => {
  i = i & 0xffff;
  if (i === 0x8000) {
    return "-32768";
  }
  if (i & 0x8000) {
    i = (~i + 1) & 0x7fff;
    return `-${i}`;
  }
  return `${i}`;
};

const getChipPart = (chip: Chip, partName: string) => {
  let res: Chip | undefined;
  [...chip.parts.values()].find((p) => {
    if (p.name == partName) {
      res = p;
      return true;
    }
    const recurse = getChipPart(p, partName);
    if (recurse) {
      res = recurse;
      return true;
    }
  });
  return res;
};

export const getColDefs = (chip: Chip | undefined, outputFormats: IAstTstOutputFormat[] | undefined) => {
  if (!chip) return [];
  if (!outputFormats) return [];
  const getColWidth = (pin: Pin) => {
    if (outputFormats.find((of) => of.pinName == pin.name)?.radix == 10) return 75;
    // if (tests?.outputFormats[pin.name] == 2) return 100;
    return Math.max(30, pin.width * 7);
  };
  const defs = [];

  if (chip.clocked) defs.push({ field: "time", width: 55 });
  for (const inPin of chip.ins.entries()) {
    defs.push({ field: inPin.name, width: getColWidth(inPin) });
  }
  for (const outPin of chip.outs.entries()) {
    defs.push({
      headerName: outPin.name,
      children: [
        {
          field: outPin.name,
          headerName: "Out",
          // width: getColWidth(outPin),
          cellStyle: (params: CellClassParams) => {
            if (params.data[outPin.name + "_e"]?.startsWith("*")) return { textColor: "lightgrey" };
            if (params.data[outPin.name + "_e"] == undefined) return;
            if (params.data[outPin.name] != params.data[outPin.name + "_e"]) return { backgroundColor: "#F56565" };
            return { backgroundColor: "#cef7ce" };
          },
        },
        // { field: outPin.name + "_e", headerName: "Exp", width: getColWidth(outPin) },
      ],
    });
  }
  // add any internal pins or computer parts listed in output-list
  if (outputFormats)
    outputFormats.forEach((opf) => {
      if (chip.pins.has(opf.pinName))
        defs.push({
          field: opf.pinName,
          width: opf.radix == 10 ? 55 : Math.max(30, opf.radix * 7),
        });
      if (["ARegister", "DRegister", "PC", "RAM16K", "Memory", "RAM"].includes(opf.pinName)) {
        const name = `${opf.pinName}${opf.index !== undefined ? `[${opf.index}]` : ""}`;
        defs.push({
          field: name,
          width: name.length * 8,
          cellStyle: (params: CellClassParams) => {
            if (params.data[name + "_e"]?.startsWith("*")) return { backgroundColor: "#48BB78" };
            if (params.data[name + "_e"] == undefined) return { textColor: "#48BB78" };
            if (params.data[name] != params.data[name + "_e"]) return { backgroundColor: "#CC333344" };
            return { textColor: "#cef7ce" };
          },
        });
      }
    });
  defs.push({ field: "note" });
  return defs as ColDef[];
};

export const getCompareRows = (chip: Chip | undefined, tests: ITests | null) => {
  if (!chip) return [];
  if (!tests) return [];
  if (Object.keys(tests.ast.outputFormats).length == 0) return [];
  if (tests.chipName != chip.name) return [];
  const cmp = sourceCodes["./" + tests.tabName.split(".")[0] + ".cmp"];
  if (!cmp) return [];
  const cmpLines = cmp
    .split("\n")
    .filter((l) => l.length > 0)
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((x) => x.trim())
    );

  const colNames = cmpLines[0];
  return cmpLines.slice(1).map((vals) => {
    const row: Record<string, string> = {};
    colNames.forEach((colName, i) => {
      const of = tests?.ast.outputFormats.find((of) => `${of.pinName}${of.index !== undefined ? `[${of.index}]` : ""}`.startsWith(colName));
      if (of) row[of.pinName + (of.index !== undefined ? `[${of.index}]` : "")] = vals[i];
    });
    return row;
  });
};

export const getRowData = (
  chip: Chip | undefined,
  compiledHack: string[] | null,
  tests: ITests | null,
  compareRows: ITest[],
  autoUpdate: boolean,
  selectedTest: number | null
) => {
  if (!tests) return [];
  if (!chip) return [];
  if (!autoUpdate) return [];
  if (tests.chipName !== chip.name) return [];
  // const inputValues = new Map<string, number>(); // keep track of input pin assigned values
  chip.reset();
  const clock = Clock.get();
  clock.reset();
  // if (!selectedTest) {
  //   clock.frame();
  //   return [];
  // }
  const rows: Record<string, number | undefined | string>[] = [];

  // if clocked chip then run all statements from 0 to selectedtest
  const startCommand = chip.clocked ? 0 : selectedTest ?? 0;
  const endCommand = selectedTest ?? tests.ast.commands.length - 1;

  const processCommands = (commands: IAstTstCommand[]) => {
    commands.forEach((testCommand) => {
      let note = "";
      let outputed = false;
      if (testCommand.commandName == "statement")
        for (const testOperation of testCommand.operations) {
          if (testOperation.opName == "set") {
            // inputValues.set(testOperation.assignment!.id, testOperation.assignment!.value);
            const pinOrBus = chip.get(testOperation.assignment!.id, testOperation.assignment!.index);
            const valueString = testOperation.assignment!.value;
            const value = valueString.startsWith("%B")
              ? parseInt(valueString.slice(2), 2)
              : valueString.startsWith("%X")
              ? parseInt(valueString.slice(2), 16)
              : parseInt(valueString);
            // if (testOperation.assignment.id == "Memory") debugger;
            if (pinOrBus instanceof Bus) {
              pinOrBus.busVoltage = value;
            } else if (Object.getOwnPropertyNames(pinOrBus).includes("ram")) {
              pinOrBus!.busVoltage = value;
            } else {
              pinOrBus?.pull(value === 0 ? LOW : HIGH);
            }
          } else if (testOperation.opName == "eval") {
            chip.eval();
          } else if (testOperation.opName == "output") {
            const row: Record<string, string> = {};
            const cmpRow = compareRows[rows.length];
            [...chip.ins.entries(), ...chip.outs.entries(), ...chip.pins.entries()].forEach((pin) => {
              row[pin.name] =
                tests.ast.outputFormats.find((opf) => opf.pinName == pin.name)?.radix == 2
                  ? pin.busVoltage.toString(2).padStart(pin.width, "0")
                  : toDecimal(pin.busVoltage);

              //const of = tests.ast.outputFormats.find((of) => of.pinName == pin.name);
              if (cmpRow) row[pin.name + "_e"] = cmpRow[pin.name];
            });

            // look for outputformat is a part name
            if (chip.name == "Computer") {
              if (chip.parts.size == 0) {
                // builtin computer
                tests.ast.outputFormats.forEach((opf) => {
                  if (["ARegister", "DRegister", "PC", "RAM16K"].includes(opf.pinName)) {
                    const pinName = `${opf.pinName}${opf.index != undefined ? `[${opf.index}]` : ""}`;
                    const pin = chip.get(opf.pinName, opf.index);
                    row[pinName] = pin ? toDecimal(pin.busVoltage) : "?";
                    if (cmpRow) row[pinName + "_e"] = cmpRow[pinName];
                  }
                });
              } else {
                tests.ast.outputFormats.forEach((opf) => {
                  const pinName = `${opf.pinName}${opf.index != undefined ? `[${opf.index}]` : ""}`;
                  if (opf.pinName == "ARegister" || opf.pinName == "DRegister" || opf.pinName == "PC") {
                    const cpu = getChipPart(chip, "CPU");
                    if (!cpu) throw Error();
                    const pin = cpu.get(opf.pinName, opf.index);
                    row[opf.pinName] = pin ? toDecimal(pin.busVoltage) : "?";
                    if (cmpRow) row[pinName + "_e"] = cmpRow[pinName];
                  }
                  if (["Memory", "RAM16K", "RAM"].includes(opf.pinName)) {
                    // all aliases for chip.memory.RAM16K
                    const memory = getChipPart(chip, "Memory");
                    if (!memory) throw Error();
                    const pin = memory.get("RAM16K", opf.index);
                    row[`${opf.pinName}[${opf.index}]`] = pin ? toDecimal(pin.busVoltage) : "?";
                    if (cmpRow) row[pinName + "_e"] = cmpRow[pinName];
                  }
                });
              }
            }

            row.index = rows.length.toString();
            if (chip.clocked) row.time = clock.toString();
            row.note = note;
            rows.push(row);
            outputed = true;
          } else if (testOperation.opName == "tick") {
            chip.eval();
            clock.tick();
          } else if (testOperation.opName == "tock") {
            chip.eval();
            clock.tock();
          } else if (testOperation.opName == "vmstep") {
            const getPC = () => {};
            while (getPC() != endPC) {
              chip.eval();
              clock.tick();
              chip.eval();
              clock.tock();
            }
            clock.frame();
          } else if (testOperation.opName == "expect") {
            const stringExpect = testOperation.assignment!.value;
            rows[rows.length - 1][testOperation.assignment!.id + "_e"] = stringExpect.slice(stringExpect.startsWith("%B") ? 2 : 0);
            // row[testOperation.assignment!.id + "_e"] = testOperation.assignment!.value;
          } else if (testOperation.opName == "note") {
            note = testOperation.note || "";
            if (outputed) rows[rows.length - 1].note = note;
          } else if (testOperation.opName == "loadROM") {
            const rom = [...chip.parts.values()].find((p) => p.name == "ROM32K") as ROM32K;
            // const rom = (chip as MyComputer).rom;
            if (!rom) throw Error("Trying to loadROM but no ROM32K part found");
            if (!testOperation.assignment?.value) throw Error("loadROM missing filename");
            const path = tests.tabName.substring(0, tests.tabName.lastIndexOf("/"));
            const fn = `./${path}/${testOperation.assignment.value}`;
            // console.log("loading ROM32K", fn);
            const source = sourceCodes[fn];
            if (!source) throw Error("Source code for ROM not found: ");
            if (fn.endsWith(".hack"))
              source
                .split("\n")
                .filter((line) => line.trim() != "")
                .map((i) => parseInt(i.replaceAll(" ", ""), 2) & 0xffff)
                .forEach((v, i) => (rom.at(i).busVoltage = v));
            else if (fn.endsWith(".asm") || fn.endsWith(".vm")) {
              if (compiledHack)
                compiledHack.forEach((instr, i) => {
                  rom.at(i).busVoltage = parseInt(instr, 2) & 0xffff;
                });
            }
          }
        }
      if (testCommand.commandName == "repeat") {
        for (let i = 0; i < testCommand.n; i++) {
          processCommands(testCommand.statements);
        }
        console.log(`Repeated ${testCommand.n} times`);
      }
    });
  };
  processCommands(tests.ast.commands.slice(startCommand, endCommand + 1));
  Clock.get().frame();
  return rows;
};

export const getOutcome = (chip: Chip | undefined, rowData: Record<string, string | number | undefined>[]) => {
  if (!chip) return { pass: 0, fail: 0 };
  let pass = 0;
  let fail = 0;
  rowData.forEach((row) => {
    if (
      [...chip.outs.entries()].find((out) => row[out.name + "_e"]?.toString().startsWith("*") == false && row[out.name] != row[out.name + "_e"])
    ) {
      // console.log(row);
      // out = string, out_e = number
      fail++;
    } else pass++;
  });
  return { pass, fail };
};
