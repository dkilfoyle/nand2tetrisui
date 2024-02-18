import { useAtom, useSetAtom } from "jotai";
import useResizeObserver from "use-resize-observer";
import { activeTabAtom, openFilesAtom } from "../../store/atoms";
import { useCallback } from "react";
import { projects } from "../../examples/projects";
import Tree from "rc-tree";

// const toChild = (x: string) => ({ name: x, id: x });

import "rc-tree/assets/index.css";
import { Key } from "rc-tree/lib/interface";

interface IFileTreeNode {
  key: string;
  title: string;
  children?: IFileTreeNode[];
}

const fileTree: IFileTreeNode[] = projects.map((project, i) => {
  return {
    key: project.id,
    title: project.name,
    children: projects[i].children.map((child) => ({ key: `${project.name}/${child}`, title: child })),
  };
});

export function FileTree() {
  const { ref, height } = useResizeObserver();
  const [openFiles, setOpenFiles] = useAtom(openFilesAtom);
  const setActiveTab = useSetAtom(activeTabAtom);

  const onSelect = useCallback(
    (keys: Key[], info: any) => {
      if (!info.node.children && keys.length) {
        setOpenFiles([...openFiles, keys[0] as string]);
        setActiveTab(keys[0] as string);
      }
    },
    [openFiles, setActiveTab, setOpenFiles]
  );

  return (
    <div ref={ref} style={{ minHeight: "0", height: "100%" }}>
      <Tree treeData={fileTree} defaultExpandAll showLine onSelect={onSelect}></Tree>
    </div>
  );
}
