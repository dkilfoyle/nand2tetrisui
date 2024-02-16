import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-quartz.css";
import { CellClassParams, ColDef, ModuleRegistry } from "@ag-grid-community/core";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { Box } from "@chakra-ui/react";
import { Bus, HIGH, LOW } from "../editor/simulator/Chip";
import { chipAtom, testsAtom, selectedTestAtom, pinsDataAtom, getPinsData, selectedPartAtom, activeTabAtom } from "../../store/atoms";
import { Clock } from "@nand2tetris/web-ide/simulator/src/chip/clock.js";
import { sourceCodes } from "../../examples/projects";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

type ITest = Record<string, any>;

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

export function TestTable() {
  const [tests] = useAtom(testsAtom);
  const [chip] = useAtom(chipAtom);
  const [selectedPart] = useAtom(selectedPartAtom);
  const [, setSelectedTest] = useAtom(selectedTestAtom);
  const [, setPinsData] = useAtom(pinsDataAtom);
  const [activeTab] = useAtom(activeTabAtom);

  const gridRef = useRef<AgGridReact<ITest>>(null);

  const compareRows = useMemo(() => {
    if (!chip) return [];
    const cmp = sourceCodes["./" + activeTab + ".cmp"];
    if (!cmp) return [];
    const cmpLines = cmp.split("\n");
    const names = cmpLines[0]
      .split("|")
      .slice(1, -1)
      .map((x) => x.trimStart().trimEnd());
    return cmpLines.slice(1).map((line) => {
      const row: Record<string, number> = {};
      const vals = line
        .split("|")
        .slice(1, -1)
        .map((x) => x.trimStart().trimEnd());
      names.forEach((name, i) => {
        row[name] = parseInt(vals[i]);
      });
      return row;
    });
  }, [chip]);

  const pinTable = useMemo(() => {
    if (!tests) return [];
    if (!chip) return [];
    // const inputValues = new Map<string, number>(); // keep track of input pin assigned values
    const rows: Record<string, number | undefined | string>[] = [];
    chip.reset();
    const clock = Clock.get();
    clock.reset();

    let iStatement = 0;

    for (const testStatement of tests.statements) {
      const row: Record<string, number | undefined | { result: number; correct: boolean } | string> = {};
      for (const inPin of chip?.ins.entries()) {
        row[inPin.name] = undefined;
      }
      for (const outPin of chip?.outs.entries()) {
        row[outPin.name] = undefined;
        row[outPin.name + "_e"] = undefined;
      }
      for (const testOperation of testStatement.operations) {
        if (testOperation.opName == "set") {
          // inputValues.set(testOperation.assignment!.id, testOperation.assignment!.value);
          const pinOrBus = chip.get(testOperation.assignment!.id, testOperation.assignment!.index);
          const value = testOperation.assignment!.value;
          if (pinOrBus instanceof Bus) {
            pinOrBus.busVoltage = value;
          } else {
            pinOrBus?.pull(value === 0 ? LOW : HIGH);
          }
        } else if (testOperation.opName == "eval") {
          for (const inPin of chip.ins.entries()) {
            row[inPin.name] = toDecimal(inPin.busVoltage);
          }
          chip.eval();
          // TODO: Run simulation with inputvalues
          // get output values
          for (const outPin of chip.outs.entries()) {
            row[outPin.name] = toDecimal(outPin.busVoltage);
          }
        } else if (testOperation.opName == "output") {
          for (const inPin of chip.ins.entries()) {
            row[inPin.name] = toDecimal(inPin.busVoltage);
          }
          for (const outPin of chip.outs.entries()) {
            row[outPin.name] = toDecimal(outPin.busVoltage);
          }
          if (compareRows.length > iStatement) {
            const cmpRow = compareRows[iStatement];
            Object.entries(cmpRow).forEach(([key, val]) => {
              row[key + "_e"] = val;
            });
          }
        } else if (testOperation.opName == "tick") {
          chip.eval();
          clock.tick();
          row["time"] = clock.toString();
        } else if (testOperation.opName == "tock") {
          chip.eval();
          clock.tock();
          row["time"] = clock.toString();
        } else if (testOperation.opName == "expect") {
          row[testOperation.assignment!.id + "_e"] = testOperation.assignment!.value;
        } else if (testOperation.opName == "note") {
          row.note = testOperation.note;
        }
      }

      row.index = iStatement++;
      rows.push(row);
    }
    // console.log(rows);
    return rows;
  }, [tests, chip, compareRows]);

  const colDefs = useMemo<ColDef[]>(() => {
    const defs = [];
    if (!chip) return [];
    if (chip.clocked) defs.push({ field: "time", width: 50 });
    for (const inPin of chip?.ins.entries()) {
      defs.push({ field: inPin.name, width: 70 });
    }
    for (const outPin of chip?.outs.entries()) {
      defs.push({
        headerName: outPin.name,
        children: [
          {
            field: outPin.name,
            headerName: "Out",
            width: 80,
            cellStyle: (params: CellClassParams) => {
              if (params.data[outPin.name] != params.data[outPin.name + "_e"]) return { backgroundColor: "#F56565" };
              else return { backgroundColor: "#48BB78" };
            },
          },
          { field: outPin.name + "_e", headerName: "Exp", width: 80 },
        ],
      });
    }
    defs.push({ field: "note" });
    // console.log(defs);
    return defs;
  }, [chip]);

  // useEffect(() => {
  //   console.log("TestTable useEffect[pinTable]", pinTable);
  // }, [pinTable]);

  // useEffect(() => {
  //   console.log("TestTable useEffect[tests]", tests);
  // }, [tests]);

  const onSelectionChanged = useCallback(() => {
    if (!chip) return;
    const selectedRows = gridRef.current!.api.getSelectedRows();
    if (selectedRows.length == 0) {
      setSelectedTest(null);
      return;
    }
    if (selectedRows.length > 0) {
      // TODO: Instead of rerunning store a copy of pinstates at end of every test statement
      chip?.reset();
      for (const inPin of chip?.ins.entries()) {
        inPin.busVoltage = selectedRows[0][inPin.name];
        // inPin.pull(selectedRows[0][inPin.name]);
      }
      chip.eval();
      setPinsData(getPinsData(selectedPart || chip));
      setSelectedTest(selectedRows[0].index);
    } else setSelectedTest(null);
  }, [chip, selectedPart, setPinsData, setSelectedTest]);

  return (
    <Box padding={5} w="100%" h="100%" className="ag-theme-quartz">
      <AgGridReact ref={gridRef} rowData={pinTable} columnDefs={colDefs} onSelectionChanged={onSelectionChanged} rowSelection="single" />
    </Box>
  );
}
