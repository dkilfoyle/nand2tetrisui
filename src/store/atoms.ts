import { atom } from "jotai";
import { Chip } from "../components/editor/grammars/Chip";
import { IAstTst } from "../components/editor/grammars/tstInterface";

export const chipAtom = atom<Chip | undefined>(undefined);
export const testsAtom = atom<IAstTst | null>(null);
export const selectedTestAtom = atom<number | null>(null);

export const openFilesAtom = atom<string[]>(["Project01/HalfAdder"]);
export const activeTabAtom = atom<string>("Project01/HalfAdder");
