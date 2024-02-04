import { useAtom } from "jotai";
import { testsAtom } from "../editor/TstEditor";
import { useEffect, useMemo } from "react";
import { chipAtom } from "../editor/HdlEditor";

import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-quartz.css";
import { ModuleRegistry } from "@ag-grid-community/core";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { Box } from "@chakra-ui/react";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

export function TestTable() {
  const [tests, setTests] = useAtom(testsAtom);
  const [chip, setChip] = useAtom(chipAtom);

  const pinTable = useMemo(() => {
    if (!tests) return [];
    const inputValues = new Map<string, number>(); // keep track of input pin assigned values
    const rows: Record<string, number | undefined>[] = [];

    for (const testStatement of tests.statements) {
      const row: Record<string, number | undefined | { result: number; correct: boolean }> = {};
      for (const inPin of chip?.ins.entries()) {
        row[inPin.name] = undefined;
      }
      for (const outPin of chip?.outs.entries()) {
        row[outPin.name] = undefined;
        row[outPin.name + "_e"] = undefined;
      }
      for (const testOperation of testStatement.operations) {
        if (testOperation.opName == "set") inputValues.set(testOperation.assignment!.id, testOperation.assignment!.value);
        else if (testOperation.opName == "eval") {
          for (const [id, value] of inputValues.entries()) {
            row[id] = value;
          }
          if (!chip) throw Error();
          // TODO: Run simulation with inputvalues
          // get output values
          for (const outPin of chip.outs.entries()) {
            row[outPin.name] = outPin.voltage();
          }
        } else if (testOperation.opName == "expect") {
          row[testOperation.assignment!.id + "_e"] = testOperation.assignment!.value;
        }
      }
      rows.push(row);
    }
    console.log(rows);
    return rows;
  }, [tests, chip]);

  const colDefs = useMemo(() => {
    const defs = [];
    if (!chip) return;
    for (const inPin of chip?.ins.entries()) {
      defs.push({ field: inPin.name, width: 50 });
    }
    for (const outPin of chip?.outs.entries()) {
      defs.push({
        headerName: outPin.name,
        children: [
          { field: outPin.name, headerName: "Out", width: 70 },
          { field: outPin.name + "_e", headerName: "Expect", width: 70 },
        ],
      });
    }
    console.log(defs);
    return defs;
  }, [chip]);

  // useEffect(() => {
  //   console.log("TestTable useEffect[pinTable]", pinTable);
  // }, [pinTable]);

  // useEffect(() => {
  //   console.log("TestTable useEffect[tests]", tests);
  // }, [tests]);

  return (
    <Box padding={5} w="100%" h="100%">
      <AgGridReact rowData={pinTable} columnDefs={colDefs} />
    </Box>
  );
}
