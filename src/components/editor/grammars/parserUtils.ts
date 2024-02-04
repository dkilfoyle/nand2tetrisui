import { IToken } from "chevrotain";

export interface Span {
  startColumn: number;
  startLineNumber: number;
  endColumn: number;
  endLineNumber: number;
  startOffset: number;
  endOffset: number;
}

export const getTokenSpan = (startToken: IToken, endToken?: IToken): Span => {
  const span = {
    startColumn: startToken.startColumn || 0,
    startLineNumber: startToken.startLine || 0,
    endColumn: (endToken || startToken).endColumn || 0,
    endLineNumber: (endToken || startToken).endLine || 0,
    startOffset: startToken.startOffset || 0,
    endOffset: (endToken || startToken).endOffset || 0,
  };
  span.endColumn++;
  return span;
};

export const mergeSpans = (s1: Span, s2?: Span) => {
  if (!s2) return s1;
  return {
    startColumn: s1.startOffset <= s2.startOffset ? s1.startColumn : s2.startColumn,
    startLineNumber: Math.min(s1.startLineNumber, s2.startLineNumber),
    startOffset: Math.min(s1.startOffset, s2.startOffset),
    endColumn: s1.endOffset >= s2.endOffset ? s1.endColumn : s2.endColumn,
    endLineNumber: Math.max(s1.endLineNumber, s2.endLineNumber),
    endOffset: Math.max(s1.endOffset, s2.endOffset),
  };
};
