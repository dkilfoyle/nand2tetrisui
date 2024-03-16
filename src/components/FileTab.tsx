import { HdlEditor } from "./editor/HdlEditor";
import { TstEditor } from "./editor/TstEditor";
import { sourceCodes } from "../examples/projects";
import { GridviewApi, GridviewReact, GridviewReadyEvent, IGridviewPanelProps, Orientation } from "dockview";
import { useCallback, useEffect, useState } from "react";
import { AsmEditor } from "./editor/AsmEditor";
import { VmEditor } from "./editor/VmEditor";
import { compiledAsmAtom } from "../store/atoms";
import { useAtom } from "jotai";

const components = {
  Code: (props: IGridviewPanelProps<{ fileName: string; sourceCode: string }>) => {
    if (props.params.fileName.endsWith(".hdl"))
      return <HdlEditor name={props.params.fileName} sourceCode={props.params.sourceCode}></HdlEditor>;
    else if (props.params.fileName.endsWith(".asm"))
      return (
        <AsmEditor
          name={props.params.fileName}
          sourceCode={props.params.sourceCode}
          isCompiledViewer={props.params.sourceCode == ""}></AsmEditor>
      );
    else if (props.params.fileName.endsWith(".vm"))
      return <VmEditor name={props.params.fileName} sourceCode={props.params.sourceCode}></VmEditor>;
  },
  Tst: (props: IGridviewPanelProps<{ fileName: string; sourceCode: string }>) => {
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
  const [api, setApi] = useState<GridviewApi>();
  const [compiledAsm] = useAtom(compiledAsmAtom);

  // useEffect(() => {
  //   if (api && props.fileName?.endsWith(".vm")) {
  //     const asmFileName = props.fileName.split(".")[0] + ".asm";
  //     const panel = api?.getPanel(asmFileName);
  //     if (!panel) return;
  //     panel.api.updateParameters({ fileName: asmFileName, sourceCode: compiledAsm });
  //   }
  // }, [api, compiledAsm, props.fileName]);

  const onReady = (event: GridviewReadyEvent) => {
    setApi(event.api);
    event.api.addPanel({
      id: "tst",
      component: "Tst",
      params: {
        fileName: props.fileName,
        sourceCode: sourceCodes["./" + props.fileName.split(".")[0] + ".tst"],
      },
      size: 20,
    });
    event.api.addPanel({
      id: props.fileName,
      component: "Code",
      params: {
        fileName: props.fileName,
        sourceCode: sourceCodes["./" + props.fileName],
      },
    });
    if (props.fileName.endsWith(".vm"))
      event.api.addPanel({
        id: props.fileName.split(".")[0] + ".asm",
        component: "Code",
        params: {
          fileName: props.fileName.split(".")[0] + ".asm",
          sourceCode: "",
        },
        position: { referencePanel: props.fileName, direction: "right" },
      });
  };
  return <GridviewReact components={components} onReady={onReady} orientation={Orientation.VERTICAL} />;
}
