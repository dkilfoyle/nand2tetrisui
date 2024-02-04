// import { useEffect, useState } from "react";
import { HdlEditor } from "./components/editor/HdlEditor";
import { Flex, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { registerLanguages } from "./components/editor/monarch/loader";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Schematic } from "./components/schematic/Schematic";
registerLanguages();

import HalfAdderHDL from "./examples/HalfAdder.hdl?raw";
import HalfAdderTST from "./examples/HalfAdder.tst?raw";
import { TstEditor } from "./components/editor/TstEditor";
import { TestTable } from "./components/tester/TestTable";

window.g = null;
window.i = null;

export default function App() {
  // const [text, setText] = useState('print("Hello world!")');
  return (
    <Flex h="100vh" w="100vw" p={3}>
      <PanelGroup direction="horizontal">
        <Panel defaultSize={50} minSize={20}>
          <Tabs display="flex" flexDir="column" w="100%" h="100%">
            <TabList>
              <Tab>HalfAdder</Tab>
              <Tab>Another</Tab>
            </TabList>
            <TabPanels flex="1">
              <TabPanel h="100%">
                <PanelGroup direction="vertical">
                  <Panel defaultSize={70} minSize={20} style={{ paddingBottom: "5px" }}>
                    <HdlEditor sourceCode={HalfAdderHDL}></HdlEditor>
                  </Panel>
                  <PanelResizeHandle style={{ height: "2px", background: "lightgray" }}></PanelResizeHandle>
                  <Panel defaultSize={30} minSize={20} style={{ paddingTop: "10px" }}>
                    <TstEditor sourceCode={HalfAdderTST}></TstEditor>
                  </Panel>
                </PanelGroup>
              </TabPanel>
              <TabPanel></TabPanel>
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
