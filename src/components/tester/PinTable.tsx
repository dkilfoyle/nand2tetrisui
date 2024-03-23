import { AgGridReact } from "@ag-grid-community/react";
import { Box, Button, Flex, HStack, Menu, MenuButton, MenuItem, MenuList, Radio, RadioGroup } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useCallback, useMemo, useRef, useState } from "react";
import { chipAtom, selectedPartAtom, selectedTestAtom } from "../../store/atoms";
import { ColDef, ValueGetterParams } from "@ag-grid-community/core";
import { Pin } from "@nand2tetris/web-ide/simulator/src/chip/chip";
import { ChevronDownIcon } from "@chakra-ui/icons";

interface IPinRow {
  group: string;
  pin: Pin;
}

export function PinTable() {
  const [part, setPart] = useAtom(selectedPartAtom);
  const [chip] = useAtom(chipAtom);
  const [selectedTest] = useAtom(selectedTestAtom);
  // const [pinsData] = useAtom(pinsDataAtom);
  const gridRef = useRef<AgGridReact<IPinRow>>(null);
  const [colDefs] = useState<ColDef[]>([
    { field: "group", width: 100 },
    { headerName: "pin.name", valueGetter: (params: ValueGetterParams) => `${params.data.pin.name}[${params.data.pin.width}]`, width: 100 },
    { field: "pin.busVoltage" },
  ]);

  const pinsData = useMemo<IPinRow[]>(() => {
    const rows: IPinRow[] = [];
    if (!part) return rows;
    for (const pin of part.ins.entries()) {
      rows.push({ group: "Input", pin });
    }
    for (const pin of part.pins.entries()) {
      rows.push({ group: "Internal", pin });
    }
    for (const pin of part.outs.entries()) {
      rows.push({ group: "Output", pin });
    }
    return rows;
  }, [part]);

  const onSelectionChanged = useCallback(() => {
    // const selectedRows = gridRef.current!.api.getSelectedRows();
    // console.log(selectedRows);
  }, []);

  // useEffect(() => {
  //   console.log("PinTable", part);
  // }, [part]);

  return (
    <Flex h="100%" p={2} gap={2} flexDir="column">
      <RadioGroup
        onChange={(next) => {
          if (chip) setPart([...chip.parts.values()].find((p) => p.name == next));
        }}
        value={part?.name}
        size="sm">
        <HStack>
          {[...(chip?.parts.values() ?? [])].map((p) => (
            <Radio value={p.name} key={p.name}>
              {p.name}
            </Radio>
          ))}
        </HStack>
      </RadioGroup>
      <Box className="ag-theme-quartz" flex="1">
        <AgGridReact ref={gridRef} rowData={pinsData} columnDefs={colDefs} onSelectionChanged={onSelectionChanged} rowSelection="single" />
      </Box>
    </Flex>
    // <Box padding={5} w="100%" h="100%" className="ag-theme-quartz">
    //   <HStack>

    //   </HStack>
    // </Box>
  );
}
