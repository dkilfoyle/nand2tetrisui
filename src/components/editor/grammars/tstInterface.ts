import { Span } from "./parserUtils";

export interface IAstTst {
  statements: IAstTstStatement[];
}

export interface IAstTstStatement {
  operations: IAstTstOperation[];
  span: Span;
}

export interface IAstTstOperation {
  opName: "set" | "expect" | "eval" | "note";
  assignment?: IAstTstOperationAssignment;
  note?: string;
  span: Span;
}

export interface IAstTstOperationAssignment {
  id: string;
  index?: number;
  value: number;
}

export interface IAstTstNumberValue {
  value: number;
  span: Span;
}
