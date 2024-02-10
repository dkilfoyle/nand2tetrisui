import { AgGridReact } from "@ag-grid-community/react";
import { Box } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { selectedPartAtom } from "../../store/atoms";
import { Pin } from "../editor/grammars/Chip";
import { ColDef } from "@ag-grid-community/core";

interface IPinRow {
  group: string;
  pin: Pin;
}

export function PinTable() {
  const [part] = useAtom(selectedPartAtom);
  const gridRef = useRef<AgGridReact<IPinRow>>(null);
  const [colDefs] = useState<ColDef[]>([{ field: "group", width: 100 }, { field: "pin.name", width: 100 }, { field: "pin.busVoltage" }]);

  const pinData = useMemo<IPinRow[]>(() => {
    const rows: IPinRow[] = [];
    if (!part) return rows;
    debugger;
    for (const pin of part.ins.entries()) {
      rows.push({ group: "Input", pin });
    }
    for (const pin of part.pins.entries()) {
      rows.push({ group: "Internal", pin });
    }
    for (const pin of part.outs.entries()) {
      rows.push({ group: "Output", pin });
    }
    console.log(rows);
    return rows;
  }, [part]);

  const onSelectionChanged = useCallback(() => {
    const selectedRows = gridRef.current!.api.getSelectedRows();
    console.log(selectedRows);
  }, []);

  return (
    <Box padding={5} w="100%" h="100%" className="ag-theme-quartz">
      <AgGridReact ref={gridRef} rowData={pinData} columnDefs={colDefs} onSelectionChanged={onSelectionChanged} rowSelection="single" />
    </Box>
  );
}
