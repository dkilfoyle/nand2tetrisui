import { atom } from "jotai";
import { IAstTst } from "../languages/tst/tstInterface";
import { ELKNode } from "../components/schematic/elkBuilder";
import { Chip } from "@nand2tetris/web-ide/simulator/src/chip/chip";
import { IAstChip } from "../languages/hdl/hdlInterface";
import { SymbolTable } from "../languages/asm/SymbolTable";
import { IAstVm } from "../languages/vm/vmParser";
import { Span } from "../languages/parserUtils";

export const defaultFile = "Project07/BasicTest.vm";

export const compiledChipAtom = atom<{ chip: Chip; ast: IAstChip } | undefined>(undefined);
compiledChipAtom.debugLabel = "compiledChip";

export const chipAtom = atom((get) => get(compiledChipAtom)?.chip);
chipAtom.debugLabel = "chip";

export const compiledHackAtom = atom<string[] | null>(null);
compiledHackAtom.debugLabel = "compiledHack";

export const compiledAsmAtom = atom<string | null>(null);
compiledAsmAtom.debugLabel = "compiledAsm";

export const symbolTableAtom = atom<SymbolTable>(new SymbolTable());
symbolTableAtom.debugLabel = "symbolTable";

export const testFinishedTimeAtom = atom<number>(0);
testFinishedTimeAtom.debugLabel = "testFinishedTime";

export interface ITests {
  ast: IAstTst;
  tabName: string;
  chipName: string;
}

export const testsAtom = atom<ITests | null>(null);
testsAtom.debugLabel = "tests";

export const testBreakpointAtom = atom(-2);
testBreakpointAtom.debugLabel = "testBreakpoint";

export const selectedTestAtom = atom<number | null>(null);
selectedTestAtom.debugLabel = "selectedTest";

export const selectedPartAtom = atom<Chip | undefined>(undefined);
selectedPartAtom.debugLabel = "selectedPartAtom";

export const openFilesAtom = atom<string[]>([defaultFile]);
openFilesAtom.debugLabel = "openFiles";

export const activeTabAtom = atom<string>(defaultFile);
activeTabAtom.debugLabel = "activeTab";

export const vmAstAtom = atom<IAstVm | undefined>(undefined);
vmAstAtom.debugLabel = "vmAst";

export const vmSpansAtom = atom<Span[]>([]);
vmAstAtom.debugLabel = "vmSpans";

export const vmCurInstructionAtom = atom(-1);
vmCurInstructionAtom.debugLabel = "vmCurInstruction";

export const hackSpansAtom = atom<Span[]>([]);
hackSpansAtom.debugLabel = "hackSpans";

interface IPinData {
  group: string;
  pinName: string;
  pinVoltage: number;
}

export const getPinsData = (chip: Chip): IPinData[] => {
  const result: IPinData[] = [
    ...[...chip.ins.entries()].map((pin) => ({ group: "Input", pinName: pin.name, pinVoltage: pin.busVoltage })),
    ...[...chip.pins.entries()].map((pin) => ({ group: "Internal", pinName: pin.name, pinVoltage: pin.busVoltage })),
    ...[...chip.outs.entries()].map((pin) => ({ group: "Output", pinName: pin.name, pinVoltage: pin.busVoltage })),
  ];
  return result;
};

export const pinsDataAtom = atom<IPinData[]>([]);
pinsDataAtom.debugLabel = "pinsData";

export const elkAtom = atom<ELKNode>({
  id: "0",
  hwMeta: { maxId: 0, bodyText: "Empty Elk", name: "error", cls: null },
  ports: [],
  edges: [],
  children: [],
  properties: {
    "org.eclipse.elk.portConstraints": "FIXED_ORDER", // can be also "FREE" or other value accepted by ELK
    "org.eclipse.elk.layered.mergeEdges": 1,
  },
});
elkAtom.debugLabel = "elkAtom";
