import { AgGridReact } from "@ag-grid-community/react";
import { Box } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useCallback, useMemo, useRef, useState } from "react";
import { selectedPartAtom, testFinishedTimeAtom } from "../../store/atoms";
import { ColDef } from "@ag-grid-community/core";
import { RAM } from "@nand2tetris/web-ide/simulator/src/chip/builtins/sequential/ram.tsx";
import { FormatHeader } from "./FormatHeader";
import { NumberFormatter } from "./Formatter";

interface IRamRow {
  address: number;
  value: number;
}

export function RamTable() {
  const [part] = useAtom(selectedPartAtom);
  const [testFinishedTime] = useAtom(testFinishedTimeAtom);
  const gridRef = useRef<AgGridReact<IRamRow>>(null);

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      editable: false,
      filter: false,
      sortable: false,
    };
  }, []);

  const [colDefs] = useState<ColDef[]>([
    { field: "address", width: 100, headerComponentParams: { format: "D" }, valueFormatter: NumberFormatter },
    { field: "value", width: 100, headerComponentParams: { format: "D" }, valueFormatter: NumberFormatter },
  ]);

  const rowData = useMemo<IRamRow[]>(() => {
    console.log("updating RAM table @ time ", testFinishedTime);
    if (part && Object.prototype.hasOwnProperty.call(part, "_memory")) {
      const p = part as unknown as RAM;
      return Array.from(p.memory.map((address, value) => ({ address, value })));
    } else if (part && part.name == "Memory") {
      const p = [...part.parts.values()][2];
      if (p) {
        return Array.from((p as unknown as RAM).memory.map((address, value) => ({ address, value })));
      } else return [];
    } else return [];
  }, [part, testFinishedTime]);

  const onSelectionChanged = useCallback(() => {
    // const selectedRows = gridRef.current!.api.getSelectedRows();
    // console.log(selectedRows);
  }, []);

  // useEffect(() => {
  //   console.log("PinTable", part);
  // }, [part]);

  const components = useMemo<{
    [p: string]: any;
  }>(() => {
    return {
      agColumnHeader: FormatHeader,
    };
  }, []);

  return (
    <Box padding={5} w="100%" h="100%" className="ag-theme-quartz">
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
        components={components}
        onSelectionChanged={onSelectionChanged}
        rowSelection="single"
        headerHeight={30}
      />
    </Box>
  );
}
