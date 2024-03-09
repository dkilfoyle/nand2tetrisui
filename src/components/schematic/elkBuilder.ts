// import { Bus, Chip, Connection, Pin, PinSide } from "../../languages/hdl/Chip";
import { Bus, Chip, Connection, Pin, PinSide } from "@nand2tetris/web-ide/simulator/src/chip/chip";
import { REGISTRY } from "@nand2tetris/web-ide/simulator/src/chip/builtins";
import { compileHdlFromSource, createWire } from "../../languages/hdl/hdlCompiler";
import { sourceCodes, userDefinedChips } from "../../examples/projects";
import { IAstChip } from "../../languages/hdl/hdlInterface";
import { isErr, Ok } from "@davidsouther/jiffies/lib/esm/result.js";

interface ELKEdge {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
  hwMeta: {
    name: string;
    from: PinSide;
    to: PinSide;
  };
}

interface ELKPort {
  id: string;
  direction: "OUTPUT" | "INPUT";
  properties: { index: number; side: "EAST" | "WEST" | "NORTH" | "SOUTH" };
  hwMeta: {
    name: string;
    connectedAsParent: boolean;
    level: number;
    cssClass: string;
    cssStyle: string;
    pin: Pin;
  };
  children: ELKPort[];
}

export interface ELKNode {
  edges?: ELKEdge[] | undefined;
  _edges?: ELKEdge[] | undefined;
  children?: ELKNode[] | undefined;
  _children?: ELKNode[] | undefined;
  ports: ELKPort[];
  id: string;
  hwMeta: {
    cls: string | null;
    name: string;
    isExternalPort?: boolean;
    maxId: number;
    bodyText?: string;
  };
  properties: Record<string, number | string>;
}

export const compileElk = (chip: Chip, ast: IAstChip, chipid: string, embedded = false) => {
  return new ElkBuilder(chip, ast, chipid, embedded).getELK();
};

export const compileElkFromSource = async (code: string, chipid: string, embedded = true) => {
  const compileResult = await compileHdlFromSource(code); // TODO: Cache
  if (isErr(compileResult)) {
    throw Error("Unable to compile from source");
  }

  const { chip, ast } = Ok(compileResult);
  const elkBuilder = new ElkBuilder(chip, ast, chipid, embedded);
  return { elk: await elkBuilder.getELK(), pinMap: elkBuilder.pinMap };
};

export class ElkBuilder {
  pinPorts = new Map<string, { id: string; node: string; label: string }>(); // map chip input and internal pins to ports
  wires = new Array<ELKEdge>();
  idCounters: Record<string, number> = {};
  partIds: string[] = [];
  maxId = 0;
  static edgeCount = 0;
  idMap = new Map<string, number>();
  useTrue = false;
  useFalse = false;
  pinMap = new Map<string, Pin>();

  constructor(public chip: Chip, private ast: IAstChip, private chipid: string, private embedded = false) {
    [...REGISTRY.keys(), ...userDefinedChips].forEach((name) => {
      this.idCounters[name] = 0;
    });

    for (const pin of this.chip.ins.entries()) {
      this.pinPorts.set(pin.name, {
        id: `${this.chipid}_${pin.name}`,
        node: `${this.chipid}`,
        label: pin.name,
        // pin
      });
    }
  }

  wire(part: Chip, connections: Connection[]) {
    if (!part.name) throw Error(`No part name ${part}`);
    const partId = `${this.chipid}_${part.name}${this.idCounters[part.name]++}`;
    this.partIds.push(partId);
    for (const { to, from } of connections) {
      if (part.isOutPin(to.name)) {
        // Or(out=internal|chipout)
        if (this.chip.hasOut(from.name)) {
          // Or(out=chipout)
          this.wires.push({
            id: (ElkBuilder.edgeCount++).toString(), //`${this.wires.length}`,
            source: partId,
            sourcePort: `${partId}_${to.name}`,
            target: `${this.chipid}`,
            targetPort: `${this.chipid}_${from.name}`,
            hwMeta: { name: `${partId}_${to.name}`, from: to, to: from },
          });
        } else if (this.chip.hasIn(from.name)) {
          throw Error();
        } else {
          // Or(out=myinternal)
          // map myinternal to alias Or.out
          this.pinPorts.set(from.name, {
            id: `${partId}_${to.name}`,
            node: partId,
            label: to.name,
          });
        }
      } else if (part.isInPin(to.name)) {
        // Or(a=x)
        // to=a
        // build a wire from -> to

        if (from.name == "true" || from.name == "false") {
          // Or(a=false)
          // to = a
          // from = false
          if (from.name == "true") this.useTrue = true;
          if (from.name == "false") this.useFalse = true;

          this.wires.push({
            id: (ElkBuilder.edgeCount++).toString(), //`${this.wires.length}`,
            source: `${this.chipid}_${from.name}:ext`,
            sourcePort: `${this.chipid}_${from.name}`,
            target: partId,
            targetPort: `${partId}_${to.name}`,
            hwMeta: { name: `${this.chipid}_${from.name}`, from, to },
          });
        } else {
          // if from.width > to.width

          this.wires.push({
            id: (ElkBuilder.edgeCount++).toString(), //`${this.wires.length}`,
            source: "_ALIAS_",
            sourcePort: from.name, // to be post-processed to this.ports.get(from.name)
            target: partId,
            targetPort: `${partId}_${to.name}`,
            hwMeta: { name: this.pinSideToString(from), from, to },
          });
        }
      }
    }
  }

  pinSideToString = (pinSide: PinSide) => {
    let name = pinSide.name;
    if (pinSide.width) {
      if (pinSide.width == 1) name += `[${pinSide.start}]`;
      else name += `[${pinSide.start + pinSide.width! - 1}: ${pinSide.start}]`;
    }
    return name;
  };

  getElkId = (name: string) => {
    this.idMap.set(name, this.maxId++);
    return name;
    // return `${this.maxId - 1}`;
  };

  getPartPorts = (part: Chip, partId: string): ELKPort[] => {
    const ports: ELKPort[] = [];
    [...part.ins.entries()].forEach((inPin, index) => {
      const pinId = `${partId}_${inPin.name}`;
      this.pinMap.set(pinId, inPin);
      ports.push({
        id: this.getElkId(pinId),
        direction: "INPUT",
        properties: part.name!.startsWith("Mux") && inPin.name == "sel" ? { index: 0, side: "SOUTH" } : { index, side: "WEST" },
        hwMeta: { name: inPin.name, connectedAsParent: false, level: 0, pin: inPin, cssClass: "inPortDefault", cssStyle: "border-width:0" },
        children: [],
      });
    });
    [...part.outs.entries()].forEach((outPin, index) => {
      const pinId = `${partId}_${outPin.name}`;
      this.pinMap.set(pinId, outPin);
      ports.push({
        id: this.getElkId(pinId),
        direction: "OUTPUT",
        properties: { index, side: "EAST" },
        hwMeta: { name: outPin.name, connectedAsParent: false, level: 0, pin: outPin, cssClass: "outPortDefault", cssStyle: "border-width:0" },
        children: [],
      });
    });
    return ports;
  };

  partToNode = (part: Chip, partId: string): ELKNode => {
    if (!part.name) throw Error(`No part name ${part}`);
    const hwMeta = {
      cls: "Operator",
      maxId: 100000,
      name: part.name.startsWith("Mux") ? "MUX" : part.name.toUpperCase(),
      // isExternalPort: false,
    };
    const id = this.getElkId(partId);
    return {
      id,
      hwMeta,
      ports: this.getPartPorts(part, id),
      properties: {
        "org.eclipse.elk.layered.mergeEdges": 1,
        "org.eclipse.elk.portConstraints": "FIXED_ORDER",
      },
      edges: [],
      children: undefined,
    };
  };

  chipPinToNode(pin: Pin, index: number, portType: "INPUT" | "OUTPUT"): ELKNode {
    const pinId = `${this.chip.name}_${pin.name}`;
    this.pinMap.set(pinId, pin);
    return {
      hwMeta: { cls: null, isExternalPort: true, maxId: 0, name: pin.name },
      id: this.getElkId(pinId + ":ext"),
      ports: [
        {
          id: this.getElkId(pinId),
          direction: portType == "INPUT" ? "OUTPUT" : "INPUT",
          properties: { index: 0, side: portType == "INPUT" ? "EAST" : "WEST" },
          hwMeta: { connectedAsParent: false, level: 0, name: pin.name, pin, cssClass: "chipPortDefault", cssStyle: "border-width:0" },
          children: [],
        },
      ],
      properties: {
        "org.eclipse.elk.layered.mergeEdges": 1,
        "org.eclipse.elk.portConstraints": "FIXED_ORDER",
      },
      edges: [],
      children: undefined,
    };
  }

  constToNode(value: string): ELKNode {
    const constPin = new Bus(value);
    constPin.busVoltage = value == "true" ? 1 : 0;
    this.pinMap.set(`${this.chipid}_${value}`, constPin);
    return {
      hwMeta: { cls: null, isExternalPort: true, maxId: 0, name: value },
      id: `${this.chipid}_${value}:ext`,
      ports: [
        {
          id: `${this.chipid}_${value}`,
          direction: "OUTPUT",
          properties: { index: 0, side: "EAST" },
          hwMeta: {
            connectedAsParent: false,
            level: 0,
            name: value,
            pin: constPin,
            cssClass: "chipPortDefault",
            cssStyle: "border-width:0",
          },
          children: [],
        },
      ],
      properties: {
        "org.eclipse.elk.layered.mergeEdges": 1,
        "org.eclipse.elk.portConstraints": "FIXED_ORDER",
      },
      edges: [],
      children: undefined,
    };
  }

  async chipToNode(chip: Chip): Promise<ELKNode> {
    if (!chip.name) throw Error(`No chip name ${chip}`);
    const hwMeta = {
      cls: null,
      maxId: 0,
      name: chip.name,
    };
    const children: ELKNode[] = [];
    if (this.useTrue) children.push(this.constToNode("true"));
    if (this.useFalse) children.push(this.constToNode("false"));

    const ports: ELKPort[] = [];
    if (this.embedded) {
      ports.push(...this.getPartPorts(chip, this.chipid));
    } else {
      // chip ports to nodes with isExternalPort = true
      [...chip.ins.entries()].forEach((inPin, index) => {
        children.push(this.chipPinToNode(inPin, index, "INPUT"));
      });
      [...chip.outs.entries()].forEach((outPin, index) => {
        children.push(this.chipPinToNode(outPin, index, "OUTPUT"));
      });
    }

    const doEmbed = (part: Chip): boolean => {
      // allow 1 level embedding
      const filename = Object.keys(sourceCodes).find((path) => path.includes(part.name! + ".hdl"));
      return !this.embedded && filename !== undefined && !filename.includes("Project01");
    };

    // chip parts to nodes
    const chipPartsWithId = [...chip.parts.values()].map((part, i) => ({ part, id: this.partIds[i] }));

    chipPartsWithId
      .filter((p) => !doEmbed(p.part))
      .forEach((p) => {
        children.push(this.partToNode(p.part, p.id));
      });

    const embedPromises = chipPartsWithId
      .filter((p) => doEmbed(p.part))
      .map(async (p) => {
        const filename = Object.keys(sourceCodes).find((path) => path.includes(p.part.name! + ".hdl"));
        if (!filename) throw Error("Unable to find source code for " + p.part.name);
        const res = await compileElkFromSource(sourceCodes[filename], p.id, true);
        return res;
      });

    await Promise.all(embedPromises).then((subGraphs) => {
      subGraphs.forEach((sg) => {
        children.push(sg.elk);
        this.pinMap = new Map([...this.pinMap, ...sg.pinMap]);
      });
    });

    const res = {
      id: this.chipid,
      hwMeta,
      // children: undefined,
      // _children: undefined,
      // edges: this.wires,
      ports,
      properties: {
        "org.eclipse.elk.layered.mergeEdges": 1,
        "org.eclipse.elk.portConstraints": "FIXED_ORDER",
      },
    };
    if (this.embedded) return { ...res, _children: children, _edges: this.wires };
    else return { ...res, children, edges: this.wires };
  }

  // findPort(elk: ELKNode, portId: string) {
  //   const extport = elk.children?.find((node) => node.id == portId + ":ext");
  //   if (extport) return extport.ports[0];
  //   let foundport: ELKPort;
  //   elk.children?.find((node) =>
  //     node.ports.find((port) => {
  //       if (port.id == portId) {
  //         foundport = port;
  //         return true;
  //       } else return false;
  //     })
  //   );
  // }

  async getELK() {
    // console.log("ELK", this);

    this.ast.parts.forEach((part, i) => {
      const partWires: Connection[] = [];
      for (const { lhs, rhs } of part.wires) {
        const newWire = createWire(lhs, rhs);
        partWires.push(newWire);
      }
      this.wire([...this.chip.parts.values()][i], partWires);
    });

    const elk = await this.chipToNode(this.chip);

    const sliceWires: ELKEdge[] = [];
    const newWires: ELKEdge[] = [];

    const getSliceString = (pinSide: PinSide) => {
      if (pinSide.width && pinSide.width > 1) {
        return `[${pinSide.start + pinSide.width - 1}:${pinSide.start}]`;
      } else return `[${pinSide.start}]`;
    };

    this.wires.forEach((wire) => {
      if (wire.source == "_ALIAS_") {
        // wire.hwMeta.name = wire.sourcePort;
        const sourcePort = this.pinPorts.get(wire.sourcePort);
        if (!sourcePort) throw Error(`No source port entry found for alias ${wire.sourcePort}`);
        wire.source = sourcePort.node;
        wire.sourcePort = sourcePort.id;
      }
      if (wire.source == this.chip.name && !this.embedded) {
        const sourcePinId = wire.sourcePort.split("_")[1];
        if (this.chip.hasIn(sourcePinId)) {
          wire.source = wire.sourcePort + ":ext";
        }
      }
      if (wire.target == this.chip.name && !this.embedded) {
        const targetPinId = wire.targetPort.split("_")[1];
        if (this.chip.hasOut(targetPinId)) {
          wire.target = wire.targetPort + ":ext";
        }
      }
      if (wire.hwMeta.from.width != wire.hwMeta.to.width) {
        // console.log("Slicer needed:", wire);
        // Create new wire from wire.source/port to sourcePort:slice_in if does not exist
        // change this wire to use sourcePort:slice[start]
        const sliceNodeId = `${wire.sourcePort}:slice`;
        const slicePortId = `${sliceNodeId}${getSliceString(wire.hwMeta.from)}`;
        // if (sliceNodeId == "CPU_PC0_out:slice") debugger;
        this.pinMap.set(slicePortId, this.pinMap.get(wire.sourcePort)!);
        if (!newWires.find((newWire) => newWire.targetPort == `${sliceNodeId}_in`)) {
          const newWire = { ...wire, target: sliceNodeId, targetPort: `${sliceNodeId}_in`, id: (ElkBuilder.edgeCount++).toString() };
          const sourcePortSplit = wire.sourcePort.split("_"); // CPUControl_AGregister0_out
          const pinName = sourcePortSplit.pop();
          // if (!this.pinMap.get(wire.sourcePort)) debugger;
          // newWire.hwMeta.name = pinName + `[${this.pinMap.get(wire.sourcePort).width - 1}:0]` || wire.sourcePort;
          newWire.hwMeta.name = pinName + getSliceString(newWire.hwMeta.from);
          newWires.push(newWire);
        }
        wire.source = sliceNodeId;
        wire.sourcePort = slicePortId; // todo [start+width-1, start]
        sliceWires.push(wire);
      }
    });
    this.wires.push(...newWires);

    const sliceNodes: Record<string, ELKNode> = {};
    sliceWires.forEach((wire) => {
      const pin = this.pinMap.get(wire.sourcePort); // this.findPort(elk, wire.sourcePort.substr(0, wire.sourcePort.indexOf(":")))?.hwMeta.pin;
      if (!pin) throw Error("Unable to find pin for port " + wire.sourcePort);

      if (!sliceNodes[wire.source]) {
        sliceNodes[wire.source] = {
          hwMeta: { cls: "Operator", maxId: 2000, name: "SLICE" },
          id: wire.source,
          ports: [
            {
              hwMeta: { connectedAsParent: false, level: 0, name: "", cssClass: "", cssStyle: "", pin },
              direction: "INPUT",
              id: `${wire.source}_in`,
              children: [],
              properties: { index: 0, side: "WEST" },
            },
          ],
          children: undefined,
          edges: [],
          properties: {
            "org.eclipse.elk.layered.mergeEdges": 1,
            "org.eclipse.elk.portConstraints": "FIXED_ORDER",
          },
        };
      }
      const sliceNode = sliceNodes[wire.source];
      if (!sliceNode.ports.find((slicerPort) => slicerPort.id == wire.sourcePort))
        sliceNode.ports.push({
          hwMeta: { connectedAsParent: false, level: 0, name: getSliceString(wire.hwMeta.from), cssClass: "", cssStyle: "", pin },
          direction: "OUTPUT",
          id: `${wire.sourcePort}`, // todo [start+width-1, start]
          children: [],
          properties: { index: sliceNode.ports.length, side: "EAST" },
        });
    });

    Object.values(sliceNodes).forEach((sliceNode) => {
      sliceNode.ports.sort((a, b) => parseInt(b.hwMeta.name.slice(1, -1)) - parseInt(a.hwMeta.name.slice(1, -1)));
      sliceNode.ports.filter((port) => port.direction == "OUTPUT").forEach((port, i) => (port.properties.index = i));
    });

    if (this.embedded) {
      elk._children?.push(...Object.values(sliceNodes));
      elk._edges = this.wires;
    } else {
      elk.children?.push(...Object.values(sliceNodes));
      elk.edges = this.wires;
    }

    return elk;
  }
}
