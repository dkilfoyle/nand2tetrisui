import { ValueFormatterParams } from "@ag-grid-community/core";

export type IFormat = "B" | "D" | "H";

export const NumberFormatter = (params: ValueFormatterParams) => {
  switch (params.colDef.headerComponentParams.format) {
    case "B":
      return "0b" + (params.value as number).toString(2).padStart(16, "0");
    case "D":
      return (params.value as number).toString(10);
    case "H":
      return "0x" + (params.value as number).toString(16).toUpperCase().padStart(4, "0");
    default:
      return "D";
  }
};
