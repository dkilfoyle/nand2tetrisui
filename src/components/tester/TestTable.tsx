import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-quartz.css";
import { CellClassParams, ColDef, ModuleRegistry } from "@ag-grid-community/core";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { Box } from "@chakra-ui/react";
import { Bus, HIGH, LOW } from "../editor/grammars/Chip";
import { chipAtom, testsAtom, selectedTestAtom, pinsDataAtom, getPinsData, selectedPartAtom } from "../../store/atoms";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

type ITest = Record<string, any>;

export function TestTable() {
  const [tests] = useAtom(testsAtom);
  const [chip] = useAtom(chipAtom);
  const [selectedPart] = useAtom(selectedPartAtom);
  const [, setSelectedTest] = useAtom(selectedTestAtom);
  const [, setPinsData] = useAtom(pinsDataAtom);

  const gridRef = useRef<AgGridReact<ITest>>(null);

  const pinTable = useMemo(() => {
    if (!tests) return [];
    if (!chip) return [];
    // const inputValues = new Map<string, number>(); // keep track of input pin assigned values
    const rows: Record<string, number | undefined | string>[] = [];
    chip.reset();

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
            row[inPin.name] = inPin.busVoltage;
          }
          chip.eval();
          // TODO: Run simulation with inputvalues
          // get output values
          for (const outPin of chip.outs.entries()) {
            row[outPin.name] = outPin.busVoltage;
          }
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
  }, [tests, chip]);

  const colDefs = useMemo<ColDef[]>(() => {
    const defs = [];
    if (!chip) return [];
    for (const inPin of chip?.ins.entries()) {
      defs.push({ field: inPin.name, width: 50 });
    }
    for (const outPin of chip?.outs.entries()) {
      defs.push({
        headerName: outPin.name,
        children: [
          {
            field: outPin.name,
            headerName: "Out",
            width: 70,
            cellStyle: (params: CellClassParams) => {
              if (params.data[outPin.name] != params.data[outPin.name + "_e"]) return { backgroundColor: "#F56565" };
              else return { backgroundColor: "#48BB78" };
            },
          },
          { field: outPin.name + "_e", headerName: "Exp", width: 70 },
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
