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
  edges: ELKEdge[];
  children: ELKNode[] | undefined;
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
  const compileResult = await compileHdlFromSource(code);
  if (isErr(compileResult)) throw Error("Unable to compile from source");
  const { chip, ast } = Ok(compileResult);
  return new ElkBuilder(chip, ast, chipid, embedded).getELK();
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
            hwMeta: { name: `${partId}_${to.name}` },
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
            hwMeta: { name: `${this.chipid}_${from.name}` },
          });
        } else {
          this.wires.push({
            id: (ElkBuilder.edgeCount++).toString(), //`${this.wires.length}`,
            source: "_ALIAS_",
            sourcePort: from.name, // to be post-processed to this.ports.get(from.name)
            target: partId,
            targetPort: `${partId}_${to.name}`,
            hwMeta: { name: this.pinSideToString(from) },
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

  chipToNode(chip: Chip): ELKNode {
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
    // chip parts to nodes
    [...chip.parts.values()].forEach(async (part, i) => {
      if (part.parts.size > 0) {
        //children.push(this.chipToNode(part, this.partIds[i], true));
        //TODO:
        // parse part source to get ast
        const filename = Object.keys(sourceCodes).find((path) => path.includes(part.name!));
        if (!filename) throw Error("Unable to find source code for " + part.name);
        const subelk = await compileElkFromSource(sourceCodes[filename], this.partIds[i], true);
        children.push(subelk);
        // children.push(this.partToNode(part, this.partIds[i]));
      } else children.push(this.partToNode(part, this.partIds[i]));
    });
    return {
      id: this.chipid,
      hwMeta,
      children,
      edges: this.wires,
      ports,
      properties: {
        "org.eclipse.elk.layered.mergeEdges": 1,
        "org.eclipse.elk.portConstraints": "FIXED_ORDER",
      },
    };
  }

  getELK() {
    // console.log("ELK", this);
    this.ast.parts.forEach((part, i) => {
      const partWires: Connection[] = [];
      for (const { lhs, rhs } of part.wires) {
        const newWire = createWire(lhs, rhs);
        partWires.push(newWire);
      }
      this.wire([...this.chip.parts.values()][i], partWires);
    });

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
    });
    const elk = this.chipToNode(this.chip);
    console.log("elk: ", elk);
    return elk;
  }
}
