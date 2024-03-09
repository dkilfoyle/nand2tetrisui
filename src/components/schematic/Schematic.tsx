import { useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import "d3-hwschematic/dist/d3-hwschematic.css";
import "./schematic.css";
import { compiledChipAtom, selectedTestAtom } from "../../store/atoms";
import { Button, Checkbox, Flex, Spacer } from "@chakra-ui/react";
import { ELKNode, compileElk } from "./elkBuilder";

export function Schematic() {
  const hwSchematic = useRef();
  const schematicRef = useRef<SVGSVGElement>(null);
  const [selectedTest] = useAtom(selectedTestAtom);
  const [compiledChip] = useAtom(compiledChipAtom);
  const [autoDraw, setAutoDraw] = useState(true);
  const [elk, setElk] = useState<ELKNode>();

  useEffect(() => {
    if (compiledChip && autoDraw) compileElk(compiledChip.chip, compiledChip.ast, compiledChip.chip.name!).then((elk) => setElk(elk));
    else
      setElk({
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
  }, [compiledChip, autoDraw]);

  useEffect(() => {
    console.log("Binding ELK:", elk);
    if (hwSchematic.current)
      hwSchematic.current.bindData(elk).then(
        () => {},
        (e) => {
          // hwSchematic.setErrorText(e);
          console.log("hwscheme error", e);
          throw e;
        }
      );
  }, [elk]);

  useEffect(() => {
    if (!schematicRef) return;
    const svg = d3.select(schematicRef.current);

    // .attr("width", "200px").attr("height", "200px");
    hwSchematic.current = new d3.HwSchematic(svg);
    const zoom = d3.zoom();
    zoom.on("zoom", (ev) => {
      hwSchematic.current.root.attr("transform", ev.transform);
    });

    // disable zoom on doubleclick
    // because it interferes with component expanding/collapsing
    svg.call(zoom).on("dblclick.zoom", null);
  }, [schematicRef]);

  useEffect(() => {
    if (!compiledChip) return;
    if (selectedTest == undefined) return;
    // console.log("selected Test output", selectedTest);
    // for (const pin of chip.outs.entries()) {
    //   console.log(pin.name, pin.voltage());
    // }
    if (elk.children)
      elk.children.forEach((child) => {
        child.ports.forEach((port) => {
          port.hwMeta.cssClass = port.hwMeta.pin.voltage() == 0 ? "portLow" : "portHigh";
        });
      });
    if (hwSchematic.current) {
      // console.log("resetting elk");
      hwSchematic.current.bindData(elk).then(
        () => {},
        (e) => {
          // hwSchematic.setErrorText(e);
          console.log("hwscheme error", e);
          throw e;
        }
      );
    }
  }, [compiledChip, elk, selectedTest, hwSchematic]);

  return (
    <Flex direction="column" h="100%">
      <Flex direction="row" p="5px" gap="5px">
        <Spacer />
        <Checkbox isChecked={autoDraw} onChange={(e) => setAutoDraw(e.target.checked)} size="sm">
          Auto
        </Checkbox>
      </Flex>
      <svg id="schemmaticsvg" width={"100%"} height={"100%"} ref={schematicRef}></svg>;
    </Flex>
  );
}
