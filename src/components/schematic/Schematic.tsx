import { Box } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { ELKNode } from "../editor/grammars/elkBuilder";
import { atom, useAtom } from "jotai";
import "d3-hwschematic/dist/d3-hwschematic.css";

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

export function Schematic() {
  const hwSchematic = useRef();
  const schematicRef = useRef<SVGSVGElement>(null);
  const [elk, setElk] = useAtom(elkAtom);

  useEffect(() => {
    console.log("ELK:", elk);
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

  return <svg id="schemmaticsvg" width={"100%"} height={"100%"} ref={schematicRef}></svg>;
}
