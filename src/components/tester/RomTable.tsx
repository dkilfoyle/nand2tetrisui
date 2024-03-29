import { AgGridReact } from "@ag-grid-community/react";
import { Box, Flex, HStack, Radio, RadioGroup } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chipAtom, selectedPartAtom, symbolTableAtom } from "../../store/atoms";
import { ColDef, RowClassParams } from "@ag-grid-community/core";
import { RAM } from "@nand2tetris/web-ide/simulator/src/chip/builtins/sequential/ram.tsx";
import { disassemble } from "../../languages/asm/asmCompiler";
import { ROM32K } from "@nand2tetris/web-ide/simulator/src/chip/builtins/computer/computer";
import { NumberFormatter } from "./Formatter";
import { FormatHeader } from "./FormatHeader";
import { useClockFrame } from "../../utils/clockframe";
import { SymbolTable } from "../../languages/asm/SymbolTable";
import { Chip } from "@nand2tetris/web-ide/simulator/src/chip/chip";

interface IRomRow {
  address: number;
  value: number;
  asm: string;
  label: string;
}

const getRomData = (part: Chip | undefined, chip: Chip | undefined, symbolTable: SymbolTable) => {
  if (part && Object.prototype.hasOwnProperty.call(part, "_memory")) {
    const p = part as unknown as RAM;
    return Array.from(
      p.memory.map((address, value) => ({
        address,
        value: value & 0xfff,
        asm: disassemble(value & 0xffff),
        label: symbolTable.getLabelForAddress(address),
      }))
    );
  } else if (chip && chip.name == "Computer") {
    const rom = [...chip.parts.values()].find((p) => p.name == "ROM32K") as ROM32K;
    if (rom)
      return Array.from(
        rom.memory.map((address, value) => ({
          address,
          value: value & 0xffff,
          asm: disassemble(value & 0xffff),
          label: symbolTable.getLabelForAddress(address),
        }))
      );
    else return [];
  } else return [];
};

const getPC = (chip: Chip | undefined) => {
  if (!chip) return 0;
  const pc1 = chip?.get("PC");
  if (pc1) return pc1.busVoltage;
  const pc2 = [...chip.parts.values()].find((p) => p.name == "CPU")?.get("PC");
  if (pc2) return pc2.busVoltage;
  return 0;
};

export function RomTable() {
  const [part] = useAtom(selectedPartAtom);
  const [chip] = useAtom(chipAtom);
  const gridRef = useRef<AgGridReact<IRomRow>>(null);
  const [symbolTable] = useAtom(symbolTableAtom);
  const [offset, setOffset] = useState("base");
  const [pc, setPc] = useState(0);

  const [colDefs] = useState<ColDef[]>([
    { field: "address", width: 90, headerComponent: FormatHeader, headerComponentParams: { format: "D" }, valueFormatter: NumberFormatter },
    { field: "value", width: 120, headerComponent: FormatHeader, headerComponentParams: { format: "B" }, valueFormatter: NumberFormatter },
    { field: "asm", width: 120, headerComponent: undefined },
    { field: "label", width: 100 },
  ]);

  const topRow = useMemo(() => {
    if (offset == "base") return 0;
    else return pc;
  }, [offset, pc]);

  const drawRows = useCallback(() => {
    // TODO lazy load
    if (gridRef.current && gridRef.current.api) {
      const rowData = getRomData(part, chip, symbolTable);
      gridRef.current!.api.updateGridOptions({ rowData });
    }
  }, [part, chip, symbolTable]);

  useEffect(() => {
    drawRows();
  }, [drawRows, chip]);

  useClockFrame(() => {
    setPc(getPC(chip));
    drawRows();
  });

  useEffect(() => {
    if (gridRef.current && gridRef.current.api) setTimeout(() => gridRef.current!.api?.ensureIndexVisible(topRow, "middle"), 0);
  }, [topRow]);

  const onSelectionChanged = useCallback(() => {
    // const selectedRows = gridRef.current!.api.getSelectedRows();
    // console.log(selectedRows);
  }, []);

  const getRowStyle = useCallback(
    (params: RowClassParams<IRomRow>) => {
      if (pc == params.rowIndex) return { backgroundColor: "#CC333344" };
    },
    [pc]
  );

  useEffect(() => {
    if (offset == "pc") gridRef.current?.api?.ensureIndexVisible(pc, "top");
    if (offset == "base") gridRef.current?.api?.ensureIndexVisible(0, "top");
  }, [pc, offset]);

  return (
    <Flex direction="column" h="100%" gap={2} p={2}>
      <RadioGroup onChange={setOffset} value={offset} size="sm">
        <HStack>
          <Radio value="base">Base</Radio>
          <Radio value="pc">PC</Radio>
          <span>{pc}</span>
        </HStack>
      </RadioGroup>
      <Box w="100%" h="100%" className="ag-theme-quartz">
        <AgGridReact
          ref={gridRef}
          // rowData={rowData}
          getRowStyle={getRowStyle}
          columnDefs={colDefs}
          onSelectionChanged={onSelectionChanged}
          rowSelection="single"
        />
      </Box>
    </Flex>
  );
}
