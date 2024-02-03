// import { useEffect, useState } from "react";
import { CodeEditor } from "./components/editor/CodeEditor";
import { Divider, Flex, Heading, Tab, TabList, TabPanel, TabPanels, Tabs, VStack } from "@chakra-ui/react";
import { registerLanguages } from "./components/editor/monarch/loader";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Schematic } from "./components/schematic/Schematic";
registerLanguages();

import HalfAdder from "./examples/HalfAdder.hdl?raw";

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
                    <CodeEditor sourceCode={HalfAdder}></CodeEditor>
                  </Panel>
                  <PanelResizeHandle style={{ height: "2px", background: "lightgray" }}></PanelResizeHandle>
                  <Panel defaultSize={30} minSize={20} style={{ paddingTop: "10px" }}>
                    <CodeEditor sourceCode={HalfAdder}></CodeEditor>
                  </Panel>
                </PanelGroup>
              </TabPanel>
              <TabPanel></TabPanel>
            </TabPanels>
          </Tabs>
        </Panel>
        <PanelResizeHandle style={{ width: "2px", background: "lightgray" }}></PanelResizeHandle>
        <Panel>
          <Schematic></Schematic>
        </Panel>
      </PanelGroup>
    </Flex>
  );
}
