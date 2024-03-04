import { useAtom } from "jotai";
import { chipAtom } from "../../store/atoms";
import { useEffect, useState } from "react";
import { Screen, ScreenMemory } from "@nand2tetris/web-ide/components/src/chips/screen";
import { Chip } from "@nand2tetris/web-ide/simulator/src/chip/chip";
import { RAM } from "@nand2tetris/web-ide/simulator/src/chip/builtins/sequential/ram";

class ComputerScreen implements ScreenMemory {
  constructor(public chip: Chip) {
    if (!(chip.name == "Computer" || chip.name == "Memory")) throw Error();
  }
  get(idx: number) {
    return this.chip.get("Screen", idx)?.busVoltage || 0;
  }
}

// class MemoryScreen implements ScreenMemory {
//   constructor(public chip:Chip) {
//     if (chip.name !== "Memory") throw Error()
//   }
// get(idx:number) {
//   return this.chip.
// }
// }

export function ScreenPanel() {
  const [chip] = useAtom(chipAtom);
  const [memory, setMemory] = useState<ScreenMemory>();

  useEffect(() => {
    if (chip && chip.name) {
      if (chip.name == "Computer") {
        if (chip.parts.size == 0)
          //builin
          setMemory(new ComputerScreen(chip));
        // user
        else {
          const memoryPart = [...chip.parts.values()].find((p) => p.name == "Memory");
          if (memoryPart) setMemory(new ComputerScreen(memoryPart));
          else throw Error();
        }
      }
      if (chip.name == "Memory") {
        if (chip.parts.size == 0) {
        } else {
          const screenPart = [...chip.parts.values()].find((p) => p.name == "Screen");
          if (screenPart) setMemory((screenPart as RAM).memory);
        }
      }
    }
  }, [chip]);
  return memory !== undefined ? <Screen memory={memory} /> : <div />;
}
