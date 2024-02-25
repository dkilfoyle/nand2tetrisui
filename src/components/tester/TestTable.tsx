import { useAtom } from "jotai";
import { useCallback, useMemo, useRef } from "react";

import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-quartz.css";
import { CellClassParams, ColDef, ModuleRegistry, RowDataUpdatedEvent } from "@ag-grid-community/core";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { Badge, Flex, HStack } from "@chakra-ui/react";
import { Bus, HIGH, LOW, Pin } from "@nand2tetris/web-ide/simulator/src/chip/chip";
import { chipAtom, testsAtom, selectedTestAtom, pinsDataAtom, getPinsData, selectedPartAtom } from "../../store/atoms";
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
  // const [activeTab] = useAtom(activeTabAtom);
  const [selectedTest] = useAtom(selectedTestAtom);

  const gridRef = useRef<AgGridReact<ITest>>(null);

  const compareRows = useMemo(() => {
    if (!chip) return [];
    if (!tests) return [];
    if (Object.keys(tests.ast.outputFormats).length == 0) return [];
    if (tests.chipName != chip.name) return [];
    const cmp = sourceCodes["./" + tests.tabName + ".cmp"];
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

    // output-list must specify every cmp file column in correct order
    // can include internal pins after cmp pins
    const oNames = Object.keys(tests.ast.outputFormats);
    if (cmpLines[0].some((cname, i) => oNames[i].startsWith(cname) == false)) {
      console.log("output-list must specify every cmp file column in correct order", oNames, cmpLines[0]);
      return [];
    }

    return cmpLines.slice(1).map((vals) => {
      const row: Record<string, string> = {};
      Object.keys(tests?.ast.outputFormats).forEach((name, i) => {
        // if (vals[i] == undefined) debugger;
        row[name] = vals[i];
      });
      return row;
    });
  }, [chip, tests]);

  const rowData = useMemo(() => {
    if (!tests) return [];
    if (!chip) return [];
    if (selectedTest == -1) return [];
    // const inputValues = new Map<string, number>(); // keep track of input pin assigned values
    const rows: Record<string, number | undefined | string>[] = [];
    chip.reset();
    const clock = Clock.get();
    clock.reset();

    // if clocked chip then run all statements from 0 to selectedtest
    const startStatement = chip.clocked ? 0 : selectedTest ?? 0;
    const endStatement = selectedTest ?? tests.ast.statements.length - 1;

    for (let iStatement = startStatement; iStatement <= endStatement; iStatement++) {
      if (iStatement > tests.ast.statements.length - 1) throw Error();
      const testStatement = tests.ast.statements[iStatement];
      let note = "";
      let outputed = false;
      for (const testOperation of testStatement.operations) {
        if (testOperation.opName == "set") {
          // inputValues.set(testOperation.assignment!.id, testOperation.assignment!.value);
          const pinOrBus = chip.get(testOperation.assignment!.id, testOperation.assignment!.index);
          const valueString = testOperation.assignment!.value;
          const value = valueString.startsWith("%B") ? parseInt(valueString.slice(2), 2) : parseInt(valueString);
          if (pinOrBus instanceof Bus) {
            pinOrBus.busVoltage = value;
          } else {
            pinOrBus?.pull(value === 0 ? LOW : HIGH);
          }
        } else if (testOperation.opName == "eval") {
          chip.eval();
        } else if (testOperation.opName == "output") {
          const row: Record<string, string> = {};
          [...chip.ins.entries(), ...chip.outs.entries(), ...chip.pins.entries()].forEach((pin) => {
            row[pin.name] =
              tests.ast.outputFormats[pin.name] == 2 ? pin.busVoltage.toString(2).padStart(pin.width, "0") : toDecimal(pin.busVoltage);
          });

          if (compareRows.length > 0) {
            const cmpRow = compareRows[rows.length];
            Object.entries(cmpRow).forEach(([key, val]) => {
              const pin = chip.outs.get(key) ?? chip.pins.get(key);

              if (pin && val !== undefined)
                if (tests.ast.outputFormats[key])
                  row[key + "_e"] = tests.ast.outputFormats[key] == 2 ? val.padStart(pin.width || 16, "0") : val;
                else row[key + "_e"] = val;
            });
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
        } else if (testOperation.opName == "expect") {
          const stringExpect = testOperation.assignment!.value;
          rows[rows.length - 1][testOperation.assignment!.id + "_e"] = stringExpect.slice(stringExpect.startsWith("%B") ? 2 : 0);
          // row[testOperation.assignment!.id + "_e"] = testOperation.assignment!.value;
        } else if (testOperation.opName == "note") {
          note = testOperation.note || "";
          if (outputed) rows[rows.length - 1].note = note;
        }
      }
    }

    setPinsData(getPinsData(selectedPart || chip));
    return rows;
  }, [tests, chip, selectedTest, setPinsData, selectedPart, compareRows]);

  const colDefs = useMemo<ColDef[]>(() => {
    const getColWidth = (pin: Pin) => {
      if (tests?.ast.outputFormats[pin.name] == 10) return 55;
      // if (tests?.outputFormats[pin.name] == 2) return 100;
      return Math.max(30, pin.width * 7);
    };
    const defs = [];
    if (!chip) return [];
    if (chip.clocked) defs.push({ field: "time", width: 50 });
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
            width: getColWidth(outPin),
            cellStyle: (params: CellClassParams) => {
              if (params.data[outPin.name + "_e"]?.startsWith("*")) return { backgroundColor: "#48BB78" };
              else if (params.data[outPin.name] != params.data[outPin.name + "_e"]) return { backgroundColor: "#F56565" };
              else return { backgroundColor: "#48BB78" };
            },
          },
          { field: outPin.name + "_e", headerName: "Exp", width: getColWidth(outPin) },
        ],
      });
    }
    // add any internal pins listed in output-list
    if (tests?.ast.outputFormats)
      Object.entries(tests?.ast.outputFormats).forEach(([pinName, pinWidth]) => {
        if (chip.pins.has(pinName))
          defs.push({
            field: pinName,
            width: pinWidth == 10 ? 55 : Math.max(30, pinWidth * 7),
          });
      });
    defs.push({ field: "note", width: 200 });
    return defs;
  }, [chip, tests?.ast.outputFormats]);

  // useEffect(() => {
  //   console.log("TestTable useEffect[pinTable]", pinTable);
  // }, [pinTable]);

  // useEffect(() => {
  //   console.log("TestTable useEffect[tests]", tests);
  // }, [tests]);

  const onSelectionChanged = useCallback(() => {
    if (!chip) return;
    const selectedRows = gridRef.current!.api.getSelectedRows();
    console.log("onselectionChange", selectedRows);
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
    let fail = 0;
    rowData.forEach((row) => {
      if (
        [...chip.outs.entries()].find(
          (out) => row[out.name + "_e"]?.toString().startsWith("*") == false && row[out.name] != row[out.name + "_e"]
        )
      ) {
        // console.log(row);
        // out = string, out_e = number
        fail++;
      } else pass++;
    });
    return [pass, fail];
  }, [chip, rowData]);

  return (
    <Flex direction="column" padding={2} gap={2} w="100%" h="100%">
      <HStack>
        <h2>Test Results</h2>
        {outcome[1] == 0 && (
          <span>
            Pass: <Badge colorScheme="green">{outcome[0]}</Badge> / <Badge colorScheme="purple">{outcome[1] + outcome[0]}</Badge>
          </span>
        )}
        {outcome[1] > 0 && (
          <span>
            Fail: <Badge colorScheme="red">{outcome[1]}</Badge> / <Badge colorScheme="purple">{outcome[1] + outcome[0]}</Badge>
          </span>
        )}
      </HStack>
      <AgGridReact
        className="ag-theme-quartz"
        ref={gridRef}
        rowData={rowData}
        columnDefs={colDefs}
        onSelectionChanged={onSelectionChanged}
        rowSelection="single"
        onRowDataUpdated={onRowDataUpdated}
        autoSizeStrategy={{ type: "fitCellContents" }}
      />
    </Flex>
  );
}
