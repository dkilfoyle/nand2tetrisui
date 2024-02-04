import { useAtom } from "jotai";
import { testsAtom } from "../editor/TstEditor";
import { useEffect, useMemo } from "react";
import { chipAtom } from "../editor/HdlEditor";

export function TestTable() {
  const [tests, setTests] = useAtom(testsAtom);
  const [chip, setChip] = useAtom(chipAtom);

  const pinTable = useMemo(() => {
    console.log("pinTable", tests);
    if (!tests) return [];
    const inputValues = new Map<string, number>(); // keep track of input pin assigned values
    const rows: Record<string, number>[] = [];

    for (const testStatement of tests.statements) {
      const row: Record<string, number> = {};
      for (const testOperation of testStatement.operations) {
        if (testOperation.opName == "set") inputValues.set(testOperation.assignment!.id, testOperation.assignment!.value);
        else if (testOperation.opName == "eval") {
          for (const [id, value] of inputValues.entries()) {
            row[id] = value;
          }
          if (!chip) throw Error();
          // TODO: Run simulation with inputvalues
          // get output values
          for (const outPin of chip.outs.entries()) {
            row[outPin.name] = outPin.voltage();
          }
        } else if (testOperation.opName == "expect") {
          row[testOperation.assignment!.id + "_expect"] = testOperation.assignment!.value;
        }
      }
      rows.push(row);
    }
    return rows;
  }, [tests, chip]);

  useEffect(() => {
    console.log("TestTable useEffect[pinTable]", pinTable);
  }, [pinTable]);

  useEffect(() => {
    console.log("TestTable useEffect[tests]", tests);
  }, [tests]);

  return <></>;
}
