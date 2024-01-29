import ELK, { ElkNode } from "elkjs/lib/elk.bundled.js";
import { useCallback } from "react";
import ReactFlow, { ReactFlowProvider, Node, Edge, Panel, useNodesState, useEdgesState, useReactFlow } from "reactflow";

import "reactflow/dist/style.css";
const initialNodes: Node[] = [
  { id: "1", position: { x: 0, y: 0 }, data: { label: "1" } },
  { id: "2", position: { x: 0, y: 10 }, data: { label: "2" } },
];
const initialEdges: Edge[] = [{ id: "e1-2", source: "1", target: "2" }];

const elk = new ELK({ algorithms: ["layered"] });

const useLayoutedElements = () => {
  const { getNodes, setNodes, getEdges, fitView } = useReactFlow();
  const defaultOptions = {
    "elk.algorithm": "layered",
    "elk.layered.spacing.nodeNodeBetweenLayers": 20,
    "elk.spacing.nodeNode": 80,
  };

  const getLayoutedElements = useCallback((options) => {
    const layoutOptions = { ...defaultOptions, ...options };
    const graph: ElkNode = {
      id: "root",
      layoutOptions: layoutOptions,
      children: getNodes(),
      edges: getEdges(),
    };

    elk.layout(graph).then(({ children }) => {
      // By mutating the children in-place we saves ourselves from creating a
      // needless copy of the nodes array.
      console.log(graph.edges);
      children.forEach((node) => {
        node.position = { x: node.x, y: node.y };
        console.log(node.edges);
      });

      setNodes(children);
      window.requestAnimationFrame(() => {
        fitView();
      });
    });
  }, []);

  return { getLayoutedElements };
};

const LayoutFlow = () => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const { getLayoutedElements } = useLayoutedElements();

  return (
    <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView>
      <Panel position="top-right">
        <button onClick={() => getLayoutedElements({ "elk.algorithm": "layered", "elk.direction": "DOWN" })}>vertical layout</button>
        <button onClick={() => getLayoutedElements({ "elk.algorithm": "layered", "elk.direction": "RIGHT" })}>horizontal layout</button>
        <button
          onClick={() =>
            getLayoutedElements({
              "elk.algorithm": "org.eclipse.elk.radial",
            })
          }>
          radial layout
        </button>
        <button
          onClick={() =>
            getLayoutedElements({
              "elk.algorithm": "org.eclipse.elk.force",
            })
          }>
          force layout
        </button>
      </Panel>
    </ReactFlow>
  );
};

export default function () {
  return (
    <ReactFlowProvider>
      <LayoutFlow />
    </ReactFlowProvider>
  );
}
