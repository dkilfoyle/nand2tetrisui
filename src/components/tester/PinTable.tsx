import { AgGridReact } from "@ag-grid-community/react";
import { Box } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { selectedPartAtom, selectedTestAtom } from "../../store/atoms";
import { Pin } from "../editor/simulator/Chip";
import { ColDef } from "@ag-grid-community/core";

interface IPinRow {
  group: string;
  pin: Pin;
}

export function PinTable() {
  const [part] = useAtom(selectedPartAtom);
  const [selectedTest] = useAtom(selectedTestAtom);
  // const [pinsData] = useAtom(pinsDataAtom);
  const gridRef = useRef<AgGridReact<IPinRow>>(null);
  const [colDefs] = useState<ColDef[]>([{ field: "group", width: 100 }, { field: "pin.name", width: 100 }, { field: "pin.busVoltage" }]);

  const pinsData = useMemo<IPinRow[]>(() => {
    const rows: IPinRow[] = [];
    if (!part) return rows;
    console.log(selectedTest);
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
  }, [part, selectedTest]);

  const onSelectionChanged = useCallback(() => {
    // const selectedRows = gridRef.current!.api.getSelectedRows();
    // console.log(selectedRows);
  }, []);

  // useEffect(() => {
  //   console.log("PinTable", part);
  // }, [part]);

  return (
    <Box padding={5} w="100%" h="100%" className="ag-theme-quartz">
      <AgGridReact ref={gridRef} rowData={pinsData} columnDefs={colDefs} onSelectionChanged={onSelectionChanged} rowSelection="single" />
    </Box>
  );
}
