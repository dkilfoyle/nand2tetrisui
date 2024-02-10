import { atom } from "jotai";
import { Chip } from "../components/editor/grammars/Chip";
import { IAstTst } from "../components/editor/grammars/tstInterface";

export const chipAtom = atom<Chip | undefined>(undefined);
chipAtom.debugLabel = "chip";
export const testsAtom = atom<IAstTst | null>(null);
testsAtom.debugLabel = "tests";
export const selectedTestAtom = atom<number | null>(null);
selectedTestAtom.debugLabel = "selectedTest";
export const selectedPartAtom = atom<Chip | undefined>(undefined);
selectedPartAtom.debugLabel = "selectedPartAtom";

const defaultFile = "Debug/BugMux";

export const openFilesAtom = atom<string[]>([defaultFile]);
openFilesAtom.debugLabel = "openFiles";
export const activeTabAtom = atom<string>(defaultFile);
activeTabAtom.debugLabel = "activeTab";
