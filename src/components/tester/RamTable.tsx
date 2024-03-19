import { AgGridReact } from "@ag-grid-community/react";
import { Box, Flex, HStack, Radio, RadioGroup, VStack } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chipAtom, selectedPartAtom, symbolTableAtom, testFinishedTimeAtom } from "../../store/atoms";
import { ColDef, RowClassParams } from "@ag-grid-community/core";
import { RAM } from "@nand2tetris/web-ide/simulator/src/chip/builtins/sequential/ram.tsx";
import { FormatHeader } from "./FormatHeader";
import { NumberFormatter } from "./Formatter";

interface IRamRow {
  address: number;
  value: number;
}

export function RamTable() {
  const [part] = useAtom(selectedPartAtom);
  const [chip] = useAtom(chipAtom);
  const [testFinishedTime] = useAtom(testFinishedTimeAtom);
  const [symbolTable] = useAtom(symbolTableAtom);
  const [offset, setOffset] = useState("0");
  const gridRef = useRef<AgGridReact<IRamRow>>(null);

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      editable: false,
      filter: false,
      sortable: false,
    };
  }, []);

  const [colDefs] = useState<ColDef[]>([
    { field: "address", width: 100, headerComponent: FormatHeader, headerComponentParams: { format: "D" }, valueFormatter: NumberFormatter },
    { field: "value", width: 100, headerComponent: FormatHeader, headerComponentParams: { format: "D" }, valueFormatter: NumberFormatter },
    { field: "symbol", width: 150 },
  ]);

  const rowData = useMemo<IRamRow[]>(() => {
    console.log("updating RAM table @ time ", testFinishedTime);
    if (part && Object.prototype.hasOwnProperty.call(part, "_memory")) {
      const p = part as unknown as RAM;
      return Array.from(p.memory.map((address, value) => ({ address, value })));
    } else if (part && part.name == "Memory") {
      const p = [...part.parts.values()][2];
      if (p) {
        return Array.from(
          (p as unknown as RAM).memory.map((address, value) => ({
            address,
            value: value & 0xffff,
            symbol: symbolTable.getVarForAddress(address),
          }))
        );
      } else return [];
    } else return [];
  }, [part, symbolTable, testFinishedTime]);

  const onSelectionChanged = useCallback(() => {
    // const selectedRows = gridRef.current!.api.getSelectedRows();
    // console.log(selectedRows);
  }, []);

  useEffect(() => {
    gridRef.current?.api?.ensureIndexVisible(Number(offset), "top");
  }, [offset]);

  const getRowStyle = useCallback(
    (params: RowClassParams<IRamRow>) => {
      if (params.rowIndex == chip?.get("Memory", 0)?.busVoltage) return { backgroundColor: "#CC333344" };
    },
    [chip]
  );

  return (
    <Flex direction="column" h="100%" gap={2} p={2}>
      <RadioGroup onChange={setOffset} value={offset} size="sm">
        <HStack>
          <Radio value="0">Base</Radio>
          <Radio value="256">Stack</Radio>
        </HStack>
      </RadioGroup>
      <Box w="100%" h="100%" className="ag-theme-quartz">
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={colDefs}
          getRowStyle={getRowStyle}
          defaultColDef={defaultColDef}
          onSelectionChanged={onSelectionChanged}
          rowSelection="single"
          headerHeight={30}
        />
      </Box>
    </Flex>
  );
}
