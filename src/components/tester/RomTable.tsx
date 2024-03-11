import { AgGridReact } from "@ag-grid-community/react";
import { Box } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useCallback, useMemo, useRef, useState } from "react";
import { chipAtom, selectedPartAtom, testFinishedTimeAtom } from "../../store/atoms";
import { ColDef } from "@ag-grid-community/core";
import { RAM } from "@nand2tetris/web-ide/simulator/src/chip/builtins/sequential/ram.tsx";
import { disassemble } from "../../languages/asm/asmCompiler";
import { ROM32K } from "@nand2tetris/web-ide/simulator/src/chip/builtins/computer/computer";
import { NumberFormatter } from "./Formatter";

interface IRomRow {
  address: number;
  value: string;
  asm: string;
}

export function RomTable() {
  const [part] = useAtom(selectedPartAtom);
  const [chip] = useAtom(chipAtom);
  const gridRef = useRef<AgGridReact<IRomRow>>(null);
  const [testFinishedTime] = useAtom(testFinishedTimeAtom);

  const [colDefs] = useState<ColDef[]>([
    { field: "address", width: 100, headerComponentParams: { format: "D" }, valueFormatter: NumberFormatter },
    { field: "value", width: 100, headerComponentParams: { format: "B" }, valueFormatter: NumberFormatter },
    { field: "asm", width: 200 },
  ]);

  const rowData = useMemo<IRomRow[]>(() => {
    console.log("updating ROM table @ time ", testFinishedTime);
    if (part && Object.prototype.hasOwnProperty.call(part, "_memory")) {
      const p = part as unknown as RAM;
      return Array.from(
        p.memory.map((address, value) => ({ address, value: (value & 0xffff).toString(2).padStart(16, "0"), asm: disassemble(value & 0xffff) }))
      );
    } else if (chip && chip.name == "Computer") {
      const rom = [...chip.parts.values()].find((p) => p.name == "ROM32K") as ROM32K;
      if (rom)
        return Array.from(
          rom.memory.map((address, value) => ({
            address,
            value: (value & 0xffff).toString(2).padStart(16, "0"),
            asm: disassemble(value & 0xffff),
          }))
        );
      else return [];
    } else return [];
  }, [part, chip, testFinishedTime]);

  const onSelectionChanged = useCallback(() => {
    // const selectedRows = gridRef.current!.api.getSelectedRows();
    // console.log(selectedRows);
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
