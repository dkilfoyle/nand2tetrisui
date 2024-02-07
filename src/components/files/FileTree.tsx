import { useAtom } from "jotai";
import { NodeApi, Tree } from "react-arborist";
import useResizeObserver from "use-resize-observer";
import { openFilesAtom } from "../../store/atoms";
import { useCallback } from "react";

const toChild = (x: string) => ({ name: x, id: x });

const projects = [
  {
    id: "Project01",
    name: "Project01",
    children: [
      "Nand",
      "Not",
      "And",
      "Or",
      "Xor",
      "Mux",
      "DMux",
      "Not16",
      "And16",
      "Or16",
      "Mux16",
      "Or8Way",
      "Mux4Way16",
      "Mux8Way16",
      "DMux4Way",
      "DMux8Way",
    ].map(toChild),
  },
  { id: "Project02", name: "Project02", children: ["HalfAdder", "FullAdder", "Add16", "Inc16", "ALU"].map(toChild) },
  { id: "Project03", name: "Project02", children: ["DFF", "Bit", "Register", "RAM8", "RAM64", "RAM512", "RAM4K", "RAM16K", "PC"].map(toChild) },
];

export function FileTree() {
  const { ref, height } = useResizeObserver();
  const [openFiles, setOpenFiles] = useAtom(openFilesAtom);
  const onSelect = useCallback((node: NodeApi) => {
    console.log("onActivate", node);
    setOpenFiles([...openFiles, node.id]);
  }, []);
  return (
    <div ref={ref} style={{ minHeight: "0", height: "100%" }}>
      <Tree height={height} initialData={projects} onActivate={onSelect}></Tree>
    </div>
  );
}
