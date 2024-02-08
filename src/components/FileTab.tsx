import { TabPanel } from "@chakra-ui/react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { HdlEditor } from "./editor/HdlEditor";
import { TstEditor } from "./editor/TstEditor";

import { sourceCodes } from "../examples/projects";

export function FileTab(props: { fileName: string }) {
  return (
    <TabPanel h="100%">
      <PanelGroup direction="vertical">
        <Panel defaultSize={70} minSize={20} style={{ paddingBottom: "5px" }}>
          <HdlEditor name={props.fileName} sourceCode={sourceCodes["./" + props.fileName + ".hdl"]}></HdlEditor>
        </Panel>
        <PanelResizeHandle style={{ height: "2px", background: "lightgray" }}></PanelResizeHandle>
        <Panel defaultSize={30} minSize={20} style={{ paddingTop: "10px" }}>
          <TstEditor name={props.fileName} sourceCode={sourceCodes["./" + props.fileName + ".tst"]}></TstEditor>
        </Panel>
      </PanelGroup>
    </TabPanel>
  );
}
