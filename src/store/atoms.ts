import { atom } from "jotai";
import { IAstTst } from "../languages/tst/tstInterface";
import { ELKNode } from "../components/schematic/elkBuilder";
import { Chip } from "@nand2tetris/web-ide/simulator/src/chip/chip";
import { IAstChip } from "../languages/hdl/hdlInterface";

export const defaultFile = "Project05/CPU.hdl";

export const compiledChipAtom = atom<{ chip: Chip; ast: IAstChip } | undefined>(undefined);
compiledChipAtom.debugLabel = "compiledChip";

export const chipAtom = atom((get) => get(compiledChipAtom)?.chip);
chipAtom.debugLabel = "chip";

export const testsAtom = atom<{ ast: IAstTst; tabName: string; chipName: string } | null>(null);
testsAtom.debugLabel = "tests";

export const testBreakpointAtom = atom(-1);
testBreakpointAtom.debugLabel = "testBreakpoint";

export const selectedTestAtom = atom<number | null>(null);
selectedTestAtom.debugLabel = "selectedTest";

export const selectedPartAtom = atom<Chip | undefined>(undefined);
selectedPartAtom.debugLabel = "selectedPartAtom";

export const openFilesAtom = atom<string[]>([defaultFile]);
openFilesAtom.debugLabel = "openFiles";

export const activeTabAtom = atom<string>(defaultFile);
activeTabAtom.debugLabel = "activeTab";

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
