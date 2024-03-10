import { ColDef } from "@ag-grid-community/core";
import { CustomHeaderProps } from "@ag-grid-community/react";
import { Button } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { IFormat } from "./Formatter";

const nextFormat: Record<IFormat, IFormat> = {
  B: "D",
  D: "H",
  H: "B",
};

export interface MyCustomHeaderProps extends CustomHeaderProps {
  format: IFormat;
}

export const FormatHeader = (props: MyCustomHeaderProps) => {
  const [format, setFormat] = useState<"B" | "D" | "H">(props.format);

  const toggle = useCallback(() => {
    const newFormat = nextFormat[format];
    setFormat(newFormat);
    const colDefs = props.api.getColumnDefs();
    const colId = props.column.getColId();
    const col = colDefs?.find((cd) => (cd as ColDef).colId == colId) as ColDef;
    col.headerComponentParams.format = newFormat;
    props.api.setGridOption("columnDefs", colDefs);
  }, [format, props.api]);

  return (
    <div>
      {props.displayName}
      <Button size="xs" variant="outline" aria-label={"toggle format"} ml={1} onClick={toggle}>
        <span style={{ fontSize: 8 }}>{format}</span>
      </Button>
    </div>
  );
};
