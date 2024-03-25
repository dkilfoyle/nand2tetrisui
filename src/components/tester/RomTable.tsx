import { AgGridReact } from "@ag-grid-community/react";
import { Box, Flex, HStack, Radio, RadioGroup } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chipAtom, selectedPartAtom, symbolTableAtom, testFinishedTimeAtom } from "../../store/atoms";
import { ColDef, RowClassParams } from "@ag-grid-community/core";
import { RAM } from "@nand2tetris/web-ide/simulator/src/chip/builtins/sequential/ram.tsx";
import { disassemble } from "../../languages/asm/asmCompiler";
import { ROM32K } from "@nand2tetris/web-ide/simulator/src/chip/builtins/computer/computer";
import { NumberFormatter } from "./Formatter";
import { FormatHeader } from "./FormatHeader";

interface IRomRow {
  address: number;
  value: number;
  asm: string;
  label: string;
}

export function RomTable() {
  const [part] = useAtom(selectedPartAtom);
  const [chip] = useAtom(chipAtom);
  const gridRef = useRef<AgGridReact<IRomRow>>(null);
  const [testFinishedTime] = useAtom(testFinishedTimeAtom);
  const [symbolTable] = useAtom(symbolTableAtom);
  const [offset, setOffset] = useState("base");

  const [colDefs] = useState<ColDef[]>([
    { field: "address", width: 90, headerComponent: FormatHeader, headerComponentParams: { format: "D" }, valueFormatter: NumberFormatter },
    { field: "value", width: 120, headerComponent: FormatHeader, headerComponentParams: { format: "B" }, valueFormatter: NumberFormatter },
    { field: "asm", width: 120, headerComponent: undefined },
    { field: "label", width: 100 },
  ]);

  const rowData = useMemo<IRomRow[]>(() => {
    console.log("updating ROM table @ time ", testFinishedTime);
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
  }, [part, chip, testFinishedTime, symbolTable]);
  // TODO: replace testFinishedTime dependency with useClockFrame

  const onSelectionChanged = useCallback(() => {
    // const selectedRows = gridRef.current!.api.getSelectedRows();
    // console.log(selectedRows);
  }, []);

  // useEffect(() => {
  //   console.log("PinTable", part);
  // }, [part]);

  const PC = useMemo(() => {
    if (!chip) return undefined;
    const pc1 = chip?.get("PC");
    if (pc1) return pc1.busVoltage;
    const pc2 = [...chip.parts.values()].find((p) => p.name == "CPU")?.get("PC");
    console.log(pc2?.busVoltage);
    if (pc2) return pc2.busVoltage;
    return undefined;
  }, [chip, testFinishedTime]);

  const getRowStyle = useCallback(
    (params: RowClassParams<IRomRow>) => {
      if (!PC) return;
      if (PC == params.rowIndex) return { backgroundColor: "#CC333344" };
    },
    [PC]
  );

  useEffect(() => {
    if (offset == "pc" && PC) gridRef.current?.api?.ensureIndexVisible(PC, "top");
    if (offset == "base") gridRef.current?.api?.ensureIndexVisible(0, "top");
  }, [PC, offset]);

  return (
    <Flex direction="column" h="100%" gap={2} p={2}>
      <RadioGroup onChange={setOffset} value={offset} size="sm">
        <HStack>
          <Radio value="base">Base</Radio>
          <Radio value="pc">PC</Radio>
        </HStack>
      </RadioGroup>
      <Box w="100%" h="100%" className="ag-theme-quartz">
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          getRowStyle={getRowStyle}
          columnDefs={colDefs}
          onSelectionChanged={onSelectionChanged}
          rowSelection="single"
        />
      </Box>
    </Flex>
  );
}
