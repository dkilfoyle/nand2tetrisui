// import { useEffect, useState } from "react";
import { HdlEditor } from "./components/editor/HdlEditor";
import { Flex, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { registerLanguages } from "./components/editor/monarch/loader";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Schematic } from "./components/schematic/Schematic";
registerLanguages();

import { TestTable } from "./components/tester/TestTable";
import { FileTree } from "./components/files/FileTree";
import { useAtom } from "jotai";
import { FileTab } from "./components/FileTab";
import { openFilesAtom } from "./store/atoms";

window.g = null;
window.i = null;

export default function App() {
  const [openFiles] = useAtom(openFilesAtom);
  return (
    <Flex h="100vh" w="100vw" p={3}>
      <PanelGroup direction="horizontal">
        <Panel defaultSize={10}>
          <FileTree />
        </Panel>
        <PanelResizeHandle style={{ width: "2px", background: "lightgray" }}></PanelResizeHandle>
        <Panel defaultSize={50} minSize={20}>
          <Tabs display="flex" flexDir="column" w="100%" h="100%">
            <TabList>
              {openFiles.map((f) => (
                <Tab>{f}</Tab>
              ))}
            </TabList>
            <TabPanels flex="1">
              {openFiles.map((f) => (
                <FileTab fileName={f}></FileTab>
              ))}
            </TabPanels>
          </Tabs>
        </Panel>
        <PanelResizeHandle style={{ width: "2px", background: "lightgray" }}></PanelResizeHandle>

        <Panel>
          <PanelGroup direction="vertical">
            <Panel defaultSize={60} minSize={20}>
              <Schematic></Schematic>
            </Panel>
            <PanelResizeHandle style={{ height: "2px", background: "lightgray" }}></PanelResizeHandle>
            <Panel defaultSize={40} minSize={20}>
              <TestTable></TestTable>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </Flex>
  );
}
