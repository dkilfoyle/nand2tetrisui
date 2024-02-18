import { AgGridReact } from "@ag-grid-community/react";
import { Box } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useCallback, useMemo, useRef, useState } from "react";
import { selectedPartAtom } from "../../store/atoms";
import { ColDef } from "@ag-grid-community/core";
import { RAM } from "@nand2tetris/web-ide/simulator/src/chip/builtins/sequential/ram.tsx";

interface IRamRow {
  address: number;
  value: number;
}

export function RamTable() {
  const [part] = useAtom(selectedPartAtom);
  const gridRef = useRef<AgGridReact<IRamRow>>(null);

  const [colDefs] = useState<ColDef[]>([
    { field: "address", width: 100 },
    { field: "value", width: 100 },
  ]);

  const rowData = useMemo<IRamRow[]>(() => {
    if (part && Object.prototype.hasOwnProperty.call(part, "_memory")) {
      const p = part as unknown as RAM;
      return Array.from(p.memory.map((address, value) => ({ address, value })));
    } else return [];
  }, [part]);

  const onSelectionChanged = useCallback(() => {
    // const selectedRows = gridRef.current!.api.getSelectedRows();
    console.log(selectedRows);
  }, []);

  // useEffect(() => {
  //   console.log("PinTable", part);
  // }, [part]);

  return (
    <Box padding={5} w="100%" h="100%" className="ag-theme-quartz">
      <AgGridReact ref={gridRef} rowData={rowData} columnDefs={colDefs} onSelectionChanged={onSelectionChanged} rowSelection="single" />
    </Box>
  );
}
