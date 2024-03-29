import { AgGridReact } from "@ag-grid-community/react";
import { Box, Flex, HStack, Radio, RadioGroup } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chipAtom, selectedPartAtom, symbolTableAtom } from "../../store/atoms";
import { ColDef, RowClassParams } from "@ag-grid-community/core";
import { RAM } from "@nand2tetris/web-ide/simulator/src/chip/builtins/sequential/ram.tsx";
import { FormatHeader } from "./FormatHeader";
import { NumberFormatter } from "./Formatter";
import { SymbolTable } from "../../languages/asm/SymbolTable";
import { Chip } from "@nand2tetris/web-ide/simulator/src/chip/chip";
import { useClockFrame } from "../../utils/clockframe";

interface IRamRow {
  address: number;
  value: number;
}

const colDefs: ColDef[] = [
  { field: "address", width: 100, headerComponent: FormatHeader, headerComponentParams: { format: "D" }, valueFormatter: NumberFormatter },
  { field: "value", width: 100, headerComponent: FormatHeader, headerComponentParams: { format: "D" }, valueFormatter: NumberFormatter },
  { field: "symbol", width: 150 },
];

const getRamData = (part: Chip | undefined, symbolTable: SymbolTable) => {
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
};

export function RamTable() {
  const [part] = useAtom(selectedPartAtom);
  const [chip] = useAtom(chipAtom);
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

  // const rowData = useMemo<IRamRow[]>(() => {}, [part, symbolTable, testFinishedTime]);

  const drawRows = useCallback(() => {
    // TODO lazy load
    if (gridRef.current && gridRef.current.api) {
      const rowData = getRamData(part, symbolTable);
      gridRef.current.api.updateGridOptions({ rowData });
    }
  }, [part, symbolTable]);

  useEffect(() => {
    drawRows();
    gridRef.current?.api?.ensureIndexVisible(getTopIndex(offset, chip), "top");
  }, [drawRows, chip]); // don't add offset as dependency

  useClockFrame(() => {
    drawRows();
    gridRef.current?.api?.ensureIndexVisible(getTopIndex(offset, chip), "top");
  });

  useEffect(() => {
    setTimeout(() => gridRef.current?.api?.ensureIndexVisible(getTopIndex(offset, chip), "top"), 0);
  }, [offset, chip]);

  const onSelectionChanged = useCallback(() => {
    // const selectedRows = gridRef.current!.api.getSelectedRows();
    // console.log(selectedRows);
  }, []);

  const getTopIndex = (offset: string, chip: Chip | undefined) => {
    if (!chip) return 0;
    switch (offset) {
      case "0":
        return 0;
      case "256":
        return 256;
      case "sp":
        return chip?.get("Memory", 0)?.busVoltage ?? 0;
      case "lcl":
        return chip?.get("Memory", 1)?.busVoltage ?? 0;
      case "arg":
        return chip?.get("Memory", 2)?.busVoltage ?? 0;
      case "this":
        return chip?.get("Memory", 3)?.busVoltage ?? 0;
      case "that":
        return chip?.get("Memory", 4)?.busVoltage ?? 0;
      default:
        throw Error();
    }
  };

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
          <Radio value="0">0</Radio>
          <Radio value="256">256</Radio>
          <Radio value="sp">SP</Radio>
          <Radio value="lcl">LCL</Radio>
          <Radio value="arg">ARG</Radio>
          <Radio value="this">THIS</Radio>
          <Radio value="that">THAT</Radio>
        </HStack>
      </RadioGroup>
      <Box w="100%" h="100%" className="ag-theme-quartz">
        <AgGridReact
          ref={gridRef}
          // rowData={rowData}
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
