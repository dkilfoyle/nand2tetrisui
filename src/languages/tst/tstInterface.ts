import { Span } from "../parserUtils";

export interface IAstTst {
  commands: IAstTstCommand[];
  outputFormats: IAstTstOutputFormat;
}

export type IAstTstCommand = IAstTstStatement | IAstTstRepeat | IAstTstWhile;

export interface IAstTstRepeat {
  commandName: "repeat";
  n: number;
  statements: IAstTstStatement[];
  span: Span;
}

export interface IAstTstWhile {
  commandName: "while";
  condition: { lhs: string; compareOp: string; rhs: string };
  statements: IAstTstStatement[];
  span: Span;
}

export interface IAstTstStatement {
  commandName: "statement";
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
