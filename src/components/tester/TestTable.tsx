import { useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-quartz.css";
import { ModuleRegistry } from "@ag-grid-community/core";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { Badge, Checkbox, Flex, Spacer } from "@chakra-ui/react";
import { chipAtom, testsAtom, selectedTestAtom, pinsDataAtom, getPinsData, selectedPartAtom, compiledHackAtom } from "../../store/atoms";

import "./TestTable.css";
import { ITest, ITestsOutcome, getColDefs, getCompareRows, getOutcome, getRowData } from "./TestTableData";
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export function TestTable() {
  const [tests] = useAtom(testsAtom);
  const [chip] = useAtom(chipAtom);
  const [selectedPart] = useAtom(selectedPartAtom);
  const [, setSelectedTest] = useAtom(selectedTestAtom);
  const [, setPinsData] = useAtom(pinsDataAtom);
  const [selectedTest] = useAtom(selectedTestAtom);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [outcome, setOutcome] = useState<ITestsOutcome>({ pass: 0, fail: 0 });
  const [compiledHack] = useAtom(compiledHackAtom);

  const gridRef = useRef<AgGridReact<ITest>>(null);

  useEffect(() => {
    if (!gridRef.current?.api) return;
    const compareRows = getCompareRows(chip, tests);
    const colDefs = getColDefs(chip, tests?.ast.outputFormats);
    const rowData = getRowData(chip, compiledHack, tests, compareRows, autoUpdate, selectedTest);
    const outcome = getOutcome(chip, rowData);
    setOutcome(outcome);
    if (selectedPart) setPinsData(getPinsData(selectedPart || chip));
    console.log("UPDATING", rowData, colDefs);
    gridRef.current!.api.updateGridOptions({ rowData, columnDefs: colDefs });
  }, [gridRef, autoUpdate, chip, selectedPart, selectedTest, setPinsData, tests, compiledHack]);

  const onSelectionChanged = useCallback(() => {
    if (!chip) return;
    const selectedRows = gridRef.current!.api.getSelectedRows();
    // console.log("onselectionChange", selectedRows);
    if (selectedRows.length > 0) {
      // // TODO: Instead of rerunning store a copy of pinstates at end of every test statement
      // chip?.reset();
      // for (const inPin of chip?.ins.entries()) {
      //   inPin.busVoltage = selectedRows[0][inPin.name];
      //   // inPin.pull(selectedRows[0][inPin.name]);
      // }
      // chip.eval();
      // setPinsData(getPinsData(selectedPart || chip));
      setSelectedTest(parseInt(selectedRows[0].index));
    }
  }, [chip, setSelectedTest]);

  // const onRowDataUpdated = useCallback(
  //   (event: RowDataUpdatedEvent<ITest>) => {
  //     if (!chip) return;
  //     const firstError = rowData.findIndex((row) => {
  //       return [...chip.outs.entries()].find((out) => row[out.name] != row[out.name + "_e"]);
  //     });
  //     // console.log("firstError", firstError);
  //     if (firstError >= 0) event.api.ensureIndexVisible(firstError);
  //   },
  //   [chip, rowData]
  // );

  return (
    <Flex direction="column" padding={2} gap={2} w="100%" h="100%">
      <Flex gap={2}>
        <h2>Test Results</h2>
        {outcome.fail == 0 && (
          <span>
            Pass: <Badge colorScheme="green">{outcome.pass}</Badge> / <Badge colorScheme="purple">{outcome.fail + outcome.pass}</Badge>
          </span>
        )}
        {outcome.fail > 0 && (
          <span>
            Fail: <Badge colorScheme="red">{outcome.fail}</Badge> / <Badge colorScheme="purple">{outcome.fail + outcome.pass}</Badge>
          </span>
        )}
        <Spacer />
        <Checkbox size="sm" isChecked={autoUpdate} onChange={(e) => setAutoUpdate(e.target.checked)}>
          Auto
        </Checkbox>
      </Flex>
      <AgGridReact
        className="ag-theme-quartz"
        ref={gridRef}
        // rowData={[{ time: "10" }]}
        // columnDefs={[{ field: "time" }]}
        onSelectionChanged={onSelectionChanged}
        rowSelection="single"
        // onRowDataUpdated={onRowDataUpdated}
        // autoSizeStrategy={{ type: "fitProvidedWidth", width: 10 }}
      />
    </Flex>
  );
}
