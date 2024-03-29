// import { useEffect, useState } from "react";

import { DockviewApi, DockviewDefaultTab, DockviewReact, DockviewReadyEvent, IDockviewPanelHeaderProps, IDockviewPanelProps } from "dockview";

import { useEffect, useState } from "react";
import { Schematic } from "./components/schematic/Schematic";
import { TestTable } from "./components/tester/TestTable";
import { FileTree } from "./components/fileTree/FileTree";
import { PinTable } from "./components/tester/PinTable";
import { RamTable } from "./components/tester/RamTable";
import { FileTab } from "./components/FileTab";
import { useAtom, useSetAtom } from "jotai";
import { activeTabAtom, openFilesAtom } from "./store/atoms";
import { registerLanguages } from "./components/editor/monarch/loader";
registerLanguages();

window.g = null;
window.i = null;

import "dockview/dist/styles/dockview.css";
import { RomTable } from "./components/tester/RomTable";
import { ScreenPanel } from "./components/tester/ScreenPanel";
import { DockviewFileTab } from "./tabs";

const fileTree = (props: IDockviewPanelProps) => {
  props.api.setSize({ width: 175 });
  return <FileTree />;
};

const components = {
  // fileTree: () => <FileTree />,
  fileTree,
  schematic: () => <Schematic />,
  screenPanel: () => <ScreenPanel />,
  pinTable: () => <PinTable />,
  ramTable: () => <RamTable />,
  romTable: () => <RomTable />,
  testTable: () => <TestTable />,
  fileTab: (props: IDockviewPanelProps<{ fileName: string }>) => <FileTab fileName={props.params.fileName} />,
};

const tabComponents = {
  noclose: (props: IDockviewPanelHeaderProps) => <DockviewDefaultTab hideClose={true} {...props} />,
  fileTab: (props: IDockviewPanelHeaderProps) => <DockviewFileTab {...props}></DockviewFileTab>,
};

export default function App() {
  const [openFiles] = useAtom(openFilesAtom);
  const setActiveTab = useSetAtom(activeTabAtom);
  const [api, setApi] = useState<DockviewApi>();

  // useEffect(() => {
  //   setTabIndex(openFiles.findIndex((openFile) => openFile == activeTab));
  // }, [activeTab, openFiles, setTabIndex]);

  useEffect(() => {
    if (!api) return;
    const sidePanel = api.addPanel({
      id: "fileTree",
      component: "fileTree",
      title: "Files",
    });
    sidePanel.group.locked = true;
    sidePanel.group.header.hidden = true;
    sidePanel.api.group.api.setConstraints({ minimumWidth: 150, maximumWidth: 250 });

    const filesGroup = api.addGroup({ id: "filesGroup", referencePanel: sidePanel, direction: "right" });

    const simPanel = api.addPanel({
      id: "sim",
      title: "Schematic",
      component: "schematic",
      position: { referenceGroup: filesGroup, direction: "right" },
      tabComponent: "noclose",
    });

    api.addPanel({
      id: " pin",
      component: "pinTable",
      title: "Pins",
      position: { referencePanel: simPanel },
      tabComponent: "noclose",
    });
    api.addPanel({
      id: " ram",
      component: "ramTable",
      title: "Ram",
      position: { referencePanel: simPanel },
      tabComponent: "noclose",
    });
    api.addPanel({
      id: " rom",
      component: "romTable",
      title: "Rom",
      position: { referencePanel: simPanel },
      tabComponent: "noclose",
    });
    api.addPanel({
      id: " screen",
      component: "screenPanel",
      title: "Screen",
      position: { referencePanel: simPanel },
      tabComponent: "noclose",
    });

    api.addPanel({
      id: "tests",
      component: "testTable",
      title: "Tests",
      position: { referencePanel: simPanel, direction: "below" },
      tabComponent: "noclose",
    });

    api.getPanel("sim")?.api.setActive();
  }, [api]);

  useEffect(() => {
    if (!api) return;
    const filesGroup = api?.getGroup("filesGroup");
    // if (!filesGroup) throw Error();
    openFiles.forEach((f) => {
      if (!api.getPanel(f))
        api.addPanel({
          id: f,
          title: f,
          component: "fileTab",
          params: {
            fileName: f,
          },
          position: {
            referenceGroup: filesGroup!,
          },
          tabComponent: "fileTab",
        });
    });
  }, [api, openFiles]);

  useEffect(() => {
    if (!api) return () => {};

    const disposables = [
      api.onDidActivePanelChange((panel) => {
        if (panel?.group.id == "filesGroup") setActiveTab(panel.id);
      }),
    ];

    return () => {
      disposables.forEach((dispoable) => dispoable.dispose());
    };
  }, [api, setActiveTab]);

  const onReady = (event: DockviewReadyEvent) => {
    setApi(event.api);
  };

  return <DockviewReact components={components} tabComponents={tabComponents} onReady={onReady} className="dockview-theme-replit" />;
}
