import { atom } from "jotai";
import { atomWithImmer } from "jotai-immer";
import { Chip } from "../components/editor/simulator/Chip";
import { IAstTst } from "../components/editor/grammars/tstInterface";

export const chipAtom = atom<Chip | undefined>(undefined);
chipAtom.debugLabel = "chip";
export const testsAtom = atom<IAstTst | null>(null);
testsAtom.debugLabel = "tests";
export const selectedTestAtom = atom<number | null>(null);
selectedTestAtom.debugLabel = "selectedTest";
export const selectedPartAtom = atom<Chip | undefined>(undefined);
selectedPartAtom.debugLabel = "selectedPartAtom";

const defaultFile = "Project03/Bit";

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
