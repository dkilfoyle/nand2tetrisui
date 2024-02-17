import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-quartz.css";
import { CellClassParams, ColDef, ModuleRegistry, RowDataUpdatedEvent } from "@ag-grid-community/core";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { Badge, Box, Button, Flex, HStack } from "@chakra-ui/react";
import { Bus, HIGH, LOW } from "../editor/simulator/Chip";
import {
  chipAtom,
  testsAtom,
  selectedTestAtom,
  pinsDataAtom,
  getPinsData,
  selectedPartAtom,
  activeTabAtom,
  testBreakpointAtom,
} from "../../store/atoms";
import { Clock } from "@nand2tetris/web-ide/simulator/src/chip/clock.js";
import { sourceCodes } from "../../examples/projects";

import "./TestTable.css";

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
  const [testBreakpoint] = useAtom(testBreakpointAtom);

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

  const rowData = useMemo(() => {
    if (!tests) return [];
    if (!chip) return [];
    if (testBreakpoint == -1) return [];
    // const inputValues = new Map<string, number>(); // keep track of input pin assigned values
    const rows: Record<string, number | undefined | string>[] = [];
    chip.reset();
    const clock = Clock.get();
    clock.reset();

    for (let iStatement = 0; iStatement < testBreakpoint; iStatement++) {
      if (iStatement > tests.statements.length - 1) throw Error();
      const testStatement = tests.statements[iStatement];
      // const row: Record<string, number | undefined | { result: number; correct: boolean } | string> = {};
      // for (const inPin of chip?.ins.entries()) {
      //   row[inPin.name] = undefined;
      // }
      // for (const outPin of chip?.outs.entries()) {
      //   row[outPin.name] = undefined;
      //   row[outPin.name + "_e"] = undefined;
      // }
      let note = "";
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
          chip.eval();
        } else if (testOperation.opName == "output") {
          const row: Record<string, string> = {};
          for (const inPin of chip.ins.entries()) {
            row[inPin.name] = toDecimal(inPin.busVoltage);
          }
          for (const outPin of chip.outs.entries()) {
            row[outPin.name] = toDecimal(outPin.busVoltage);
          }
          if (compareRows.length > 0) {
            const cmpRow = compareRows[rows.length];
            Object.entries(cmpRow).forEach(([key, val]) => {
              row[key + "_e"] = val.toString();
            });
          }
          row.index = rows.length.toString();
          if (chip.clocked) row.time = clock.toString();
          row.note = note;
          rows.push(row);
        } else if (testOperation.opName == "tick") {
          chip.eval();
          clock.tick();
        } else if (testOperation.opName == "tock") {
          chip.eval();
          clock.tock();
        } else if (testOperation.opName == "expect") {
          rows[rows.length - 1][testOperation.assignment!.id + "_e"] = testOperation.assignment!.value;
          // row[testOperation.assignment!.id + "_e"] = testOperation.assignment!.value;
        } else if (testOperation.opName == "note") {
          note = testOperation.note || "";
        }
      }
    }
    // console.log(rows);
    return rows;
  }, [tests, chip, testBreakpoint, compareRows]);

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

  const onRowDataUpdated = useCallback(
    (event: RowDataUpdatedEvent<ITest>) => {
      if (!chip) return;
      const firstError = rowData.findIndex((row) => {
        return [...chip.outs.entries()].find((out) => row[out.name] != row[out.name + "_e"]);
      });
      // console.log("firstError", firstError);
      if (firstError >= 0) event.api.ensureIndexVisible(firstError);
    },
    [chip, rowData]
  );

  const outcome = useMemo(() => {
    if (!chip) return [0, 0];
    let pass = 0;
    const fail = 0;
    rowData.forEach((row) => {
      pass++;
    });
    return [pass, fail];
  }, [chip, rowData]);

  return (
    <Flex direction="column" padding={2} gap={2} w="100%" h="100%">
      <HStack>
        <h2>Test Results</h2>
        <span>
          Pass: <Badge colorScheme="green">{outcome[0]}</Badge>
        </span>
        <span>
          Fail: <Badge colorScheme="red">{outcome[1]}</Badge>
        </span>
        <span>
          Total: <Badge colorScheme="purple">{outcome[1] + outcome[0]}</Badge>
        </span>
      </HStack>
      <AgGridReact
        className="ag-theme-quartz"
        ref={gridRef}
        rowData={rowData}
        columnDefs={colDefs}
        onSelectionChanged={onSelectionChanged}
        rowSelection="single"
        onRowDataUpdated={onRowDataUpdated}
      />
    </Flex>
  );
}
