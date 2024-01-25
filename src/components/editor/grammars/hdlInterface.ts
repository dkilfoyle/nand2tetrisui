import { IToken } from "chevrotain";

export interface IAstChip {
  name: IToken;
  inPins: IAstPin[];
  outPins: IAstPin[];
  parts: IAstPart[];
}

export interface IAstPin {
  name: IToken;
  width: IToken | undefined;
}

export interface IAstPart {
  name: IToken;
  wires: IAstWire[];
}

export interface IAstWire {
  lhs: IAstWireEnd;
  rhs: IAstWireEnd;
}

export interface IAstWireEnd {
  name: IToken;
  subBus?: IAstSubBus;
}

export interface IAstSubBus {
  start: IToken;
  end?: IToken;
}
