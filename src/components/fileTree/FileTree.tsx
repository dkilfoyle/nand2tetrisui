import { useAtom, useSetAtom } from "jotai";
import useResizeObserver from "use-resize-observer";
import { activeTabAtom, openFilesAtom } from "../../store/atoms";
import { useCallback } from "react";
import { projects } from "../../examples/projects";
import Tree from "rc-tree";

// const toChild = (x: string) => ({ name: x, id: x });

import "rc-tree/assets/index.css";
import { Key, TreeNodeProps } from "rc-tree/lib/interface";
import { Icon } from "@chakra-ui/react";
import { FcFolder } from "react-icons/fc";

interface IFileTreeNode {
  key: string;
  title: string;
  children?: IFileTreeNode[];
}

const fileTree: IFileTreeNode[] = projects.map((project, i) => {
  return {
    key: project.id,
    title: project.name,
    children: projects[i].children.map((child) => ({ key: `${project.name}/${child}`, title: child.substring(0, child.lastIndexOf(".")) })),
  };
});

export const AsmIcon = () => (
  <Icon viewBox="0 0 512 512">
    <g style={{ transform: "translate(0%, 0%) scale(60%)" }}>
      <g style={{ stroke: "blue", fill: "none", strokeWidth: "40px", strokeLinejoin: "round", strokeLinecap: "round" }}>
        <path d="M106,20 h100 v180 h-100 z" />
        <path d="M292,292 h100 v180 h-100 z" />
        <path d="M296,60 l40,-40 v180 m-50,0 h100" />
        <path d="M116,332 l40,-40 v180 m-50,0 h100" />
      </g>
    </g>
  </Icon>
);

export const HdlIcon = () => (
  <Icon viewBox="0 0 512 512">
    <g style={{ transform: "scale(60%)" }}>
      <g style={{ stroke: "red", fill: "none", strokeWidth: "25px", strokeLinejoin: "round", strokeLinecap: "round" }}>
        <path d="M12.5,12.5 h240 v120 h-120 v120 h-120 z m0,120 h20 m40,0 h0 m35,0 h25 v-120 " />
        <path d="M380,132.5 h120  M255,253 h245  M12.5,376 h486 M12.5,499 h486" />
        <path d="M12.5,380 v115 M132.5,380 v115 M253,255 v240 M376,132.5 v365 M500,132.5 v365 " />
      </g>
    </g>
  </Icon>
);

const getIcon = (props: TreeNodeProps) => {
  if (props.data?.key?.toString().endsWith(".asm")) return AsmIcon();
  else if (props.data?.key?.toString().endsWith("hdl")) return HdlIcon();
  else return <FcFolder />;
};

export function FileTree() {
  const { ref, height } = useResizeObserver();
  const [openFiles, setOpenFiles] = useAtom(openFilesAtom);
  const setActiveTab = useSetAtom(activeTabAtom);

  const onSelect = useCallback(
    (keys: Key[], info: any) => {
      if (!info.node.children && keys.length) {
        setActiveTab(keys[0] as string);
        setOpenFiles([...openFiles, keys[0] as string]);
      }
    },
    [openFiles, setActiveTab, setOpenFiles]
  );

  return (
    <div ref={ref} style={{ minHeight: "0", height: "100%", overflow: "auto" }}>
      <Tree treeData={fileTree} defaultExpandedKeys={["Project05", "Project06"]} showLine onSelect={onSelect} icon={getIcon}></Tree>
    </div>
  );
}
