export interface Span {
  startColumn: number;
  startLineNumber: number;
  endColumn: number;
  endLineNumber: number;
  startOffset: number;
  endOffset: number;
}

export interface IAstChip {
  name: string;
  inPins: IAstPinDeclaration[];
  outPins: IAstPinDeclaration[];
  parts: IAstPart[];
}

export interface IAstPinDeclaration {
  name: string;
  width: number;
}

export interface IAstPart {
  name: string;
  wires: IAstWire[];
  span: Span;
}

export interface IAstWire {
  lhs: IAstPinParts;
  rhs: IAstPinParts;
}

export interface IAstPinParts {
  name: string;
  start?: number;
  end?: number;
  span: Span;
}
