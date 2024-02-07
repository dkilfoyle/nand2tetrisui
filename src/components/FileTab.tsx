import { TabPanel } from "@chakra-ui/react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { HdlEditor } from "./editor/HdlEditor";
import { TstEditor } from "./editor/TstEditor";

import HalfAdderHDL from "../examples/HalfAdder.hdl?raw";
import HalfAdderTST from "../examples/HalfAdder.tst?raw";

const sources: Record<string, string> = {
  HalfAdder: HalfAdderHDL,
};

const tests: Record<string, string> = {
  HalfAdder: HalfAdderTST,
};

export function FileTab(props: { fileName: string }) {
  return (
    <TabPanel h="100%">
      <PanelGroup direction="vertical">
        <Panel defaultSize={70} minSize={20} style={{ paddingBottom: "5px" }}>
          <HdlEditor sourceCode={sources[props.fileName]}></HdlEditor>
        </Panel>
        <PanelResizeHandle style={{ height: "2px", background: "lightgray" }}></PanelResizeHandle>
        <Panel defaultSize={30} minSize={20} style={{ paddingTop: "10px" }}>
          <TstEditor sourceCode={tests[props.fileName]}></TstEditor>
        </Panel>
      </PanelGroup>
    </TabPanel>
  );
}
