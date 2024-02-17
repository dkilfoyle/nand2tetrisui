import { useAtom } from "jotai";
import { NodeApi, Tree } from "react-arborist";
import useResizeObserver from "use-resize-observer";
import { activeTabAtom, openFilesAtom } from "../../store/atoms";
import { useCallback } from "react";
import { projects } from "../../examples/projects";

// const toChild = (x: string) => ({ name: x, id: x });

const fileTree = projects.map((project, i) => {
  return {
    id: project.id,
    name: project.name,
    children: projects[i].children.map((child) => ({ id: child, name: child })),
  };
});

function Node({ node, style, dragHandle }) {
  /* This node instance can do many things. See the API reference. */
  return (
    <div style={style} ref={dragHandle}>
      {node.isLeaf ? "" : "🗀 "}
      {node.data.name}
    </div>
  );
}

export function FileTree() {
  const { ref, height } = useResizeObserver();
  const [openFiles, setOpenFiles] = useAtom(openFilesAtom);
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);

  const onSelect = useCallback(
    (node: NodeApi) => {
      // console.log("onActivate", node);
      setOpenFiles([...openFiles, `${node.parent?.data.name}/${node.id}`]);
      setActiveTab(`${node.parent?.data.name}/${node.id}`);
    },
    [openFiles, setActiveTab, setOpenFiles]
  );

  return (
    <div ref={ref} style={{ minHeight: "0", height: "100%" }}>
      <Tree height={height} initialData={fileTree} onActivate={onSelect}>
        {Node}
      </Tree>
    </div>
  );
}
