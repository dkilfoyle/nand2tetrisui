import { HdlEditor } from "./editor/HdlEditor";
import { TstEditor } from "./editor/TstEditor";
import { sourceCodes } from "../examples/projects";
import { ISplitviewPanelProps, Orientation, SplitviewApi, SplitviewReact, SplitviewReadyEvent } from "dockview";
import { useCallback, useState } from "react";
import { AsmEditor } from "./editor/AsmEditor";

const components = {
  Code: (props: ISplitviewPanelProps<{ fileName: string; sourceCode: string }>) => {
    if (props.params.fileName.endsWith(".hdl"))
      return <HdlEditor name={props.params.fileName} sourceCode={sourceCodes["./" + props.params.fileName]}></HdlEditor>;
    if (props.params.fileName.endsWith(".asm"))
      return <AsmEditor name={props.params.fileName} sourceCode={sourceCodes["./" + props.params.fileName]}></AsmEditor>;
  },
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
        sourceCode={sourceCodes["./" + props.params.fileName.split(".")[0] + ".tst"]}
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
      id: props.fileName,
      component: "Code",
      params: {
        fileName: props.fileName,
        sourceCode: sourceCodes["./" + props.fileName],
      },
    });
    event.api.addPanel({
      id: "tst",
      component: "Tst",
      params: {
        fileName: props.fileName,
      },
    });
  };
  return <SplitviewReact components={components} onReady={onReady} orientation={Orientation.VERTICAL} />;
}
