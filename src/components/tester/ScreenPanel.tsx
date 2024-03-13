import { useAtom } from "jotai";
import { chipAtom } from "../../store/atoms";
import { useEffect, useState } from "react";
import { ScreenMemory } from "@nand2tetris/web-ide/components/src/chips/screen";
import { Chip } from "@nand2tetris/web-ide/simulator/src/chip/chip";
import { RAM } from "@nand2tetris/web-ide/simulator/src/chip/builtins/sequential/ram";
import { Screen } from "./Screen";
import { Clock } from "@nand2tetris/web-ide/simulator/src/chip/clock";
import { getBuiltinChip } from "@nand2tetris/web-ide/simulator/src/chip/builtins/index";
import { Ok, Result, isOk } from "@davidsouther/jiffies/lib/esm/result";

class ComputerScreen implements ScreenMemory {
  constructor(public chip: Chip) {
    if (!(chip.name == "Computer" || chip.name == "Memory")) throw Error();
  }
  get(idx: number) {
    return this.chip.get("Screen", idx)?.busVoltage || 0;
  }
}

class RedScreen implements ScreenMemory {
  constructor() {}
  get(idx: number) {
    return 10;
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
  const [memory, setMemory] = useState<ScreenMemory>(new RedScreen());

  useEffect(() => {
    if (chip && chip.name) {
      if (chip.name == "Computer") {
        if (chip.parts.size == 0)
          //builin
          setMemory(new ComputerScreen(chip));
        // user
        else {
          const memoryPart = [...chip.parts.values()].find((p) => p.name == "Memory");
          if (memoryPart) {
            const screenPart = [...memoryPart.parts.values()].find((p) => p.name == "Screen");
            if (screenPart) setMemory((screenPart as RAM).memory);
          }
          // if (memoryPart) setMemory(new ComputerScreen(memoryPart));
          // else throw Error();
        }
      }
      if (chip.name == "Memory") {
        if (chip.parts.size == 0) {
          setMemory(new ComputerScreen(chip));
        } else {
          const screenPart = [...chip.parts.values()].find((p) => p.name == "Screen");
          if (screenPart) {
            console.log("Setting screen memory", screenPart as RAM);
            setMemory((screenPart as RAM).memory);
          }
        }
      }
    }
  }, [chip]);

  return <Screen memory={memory} frame={Clock.get().toString()} />;
}
