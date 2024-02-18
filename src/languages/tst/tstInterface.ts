import { Span } from "../parserUtils";

export interface IAstTst {
  statements: IAstTstStatement[];
  outputFormats: IAstTstOutputFormat;
}

export interface IAstTstStatement {
  operations: IAstTstOperation[];
  span: Span;
}

export interface IAstTstOperation {
  opName: string;
  assignment?: IAstTstOperationAssignment;
  note?: string;
  span: Span;
}

export interface IAstTstOperationAssignment {
  id: string;
  index?: number;
  value: string;
}

export interface IAstTstNumberValue {
  value: string;
  span: Span;
}

export type IAstTstOutputFormat = Record<string, number>;
