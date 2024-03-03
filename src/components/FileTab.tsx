import { HdlEditor } from "./editor/HdlEditor";
import { TstEditor } from "./editor/TstEditor";
import { sourceCodes } from "../examples/projects";
import { ISplitviewPanelProps, Orientation, SplitviewApi, SplitviewReact, SplitviewReadyEvent } from "dockview";
import { useCallback, useState } from "react";

const components = {
  Hdl: (props: ISplitviewPanelProps<{ fileName: string; sourceCode: string }>) => (
    <HdlEditor name={props.params.fileName} sourceCode={sourceCodes["./" + props.params.fileName + ".hdl"]}></HdlEditor>
  ),
  Tst: (props: ISplitviewPanelProps<{ fileName: string; sourceCode: string }>) => {
    const [expanded, setExpanded] = useState(true);
    const [savedSize, setSavedSize] = useState<number | undefined>(undefined);
    const onExpandToggle = useCallback(() => {
      setExpanded(!expanded);
      if (expanded) {
        const tstPanel = props.containerApi?.getPanel("tst");
        setSavedSize(tstPanel?.api.height);
        props.containerApi?.getPanel("tst")?.api.setSize({ size: 34 });
      } else props.containerApi?.getPanel("tst")?.api.setSize({ size: savedSize! });
    }, [expanded, props.containerApi, savedSize]);
    return (
      <TstEditor
        name={props.params.fileName}
        sourceCode={sourceCodes["./" + props.params.fileName + ".tst"]}
        expanded={expanded}
        onExpandToggle={onExpandToggle}></TstEditor>
    );
  },
};

export function FileTab(props: { fileName: string }) {
  const [api, setApi] = useState<SplitviewApi>();

  const onReady = (event: SplitviewReadyEvent) => {
    setApi(event.api);
    event.api.addPanel({
      id: "hdl",
      component: "Hdl",
      params: {
        fileName: props.fileName,
        sourceCode: sourceCodes["./" + props.fileName + ".hdl"],
      },
    });
    event.api.addPanel({
      id: "tst",
      component: "Tst",
      params: {
        fileName: props.fileName,
        sourceCode: sourceCodes["./" + props.fileName + ".tst"],
      },
    });
  };
  return <SplitviewReact components={components} onReady={onReady} orientation={Orientation.VERTICAL} />;
}
