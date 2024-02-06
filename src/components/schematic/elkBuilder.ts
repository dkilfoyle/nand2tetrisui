import { Chip, Connection, Pin } from "../editor/grammars/Chip";

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
  children: ELKNode[];
  ports: ELKPort[];
  id: string;
  hwMeta: {
    cls: string | null;
    name: string;
    isExternalPort?: boolean;
    maxId: number;
    bodyText?: string;
  };
  properties: Record<string, any>;
}

export class ElkBuilder {
  pinPorts = new Map<string, { id: string; node: string; label: string }>(); // map chip input and internal pins to ports
  wires = new Array<ELKEdge>();
  idCounters: Record<string, number> = {
    And: 0,
    Or: 0,
    Xor: 0,
    Nand: 0,
    Not: 0,
    Nand16: 0,
    Not16: 0,
    And16: 0,
    Or16: 0,
    Or8Way: 0,
    XOr: 0,
    XOr16: 0,
    Mux: 0,
    Mux16: 0,
    Mux4Way16: 0,
    Mux8Way16: 0,
    DMux: 0,
    DMux4Way: 0,
    DMux8Way: 0,
    HalfAdder: 0,
    FullAdder: 0,
    Add16: 0,
    Inc16: 0,
    ALU: 0,
    ALUNoStat: 0,
    DFF: 0,
    Bit: 0,
    Register: 0,
    ARegister: 0,
    DRegister: 0,
    PC: 0,
    RAM8: 0,
    RAM64: 0,
    RAM512: 0,
    RAM4K: 0,
    RAM16K: 0,
    ROM32K: 0,
    Screen: 0,
    Keyboard: 0,
    CPU: 0,
    Computer: 0,
    Memory: 0,
  };
  partIds: string[] = [];
  maxId = 0;
  idMap = new Map<string, number>();

  constructor(public chip: Chip) {
    for (const pin of this.chip.ins.entries()) {
      this.pinPorts.set(pin.name, {
        id: `${this.chip.name}_${pin.name}`,
        node: `${this.chip.name}`,
        label: pin.name,
        // pin
      });
    }
  }

  wire(part: Chip, connections: Connection[]) {
    const partId = `${part.name}${this.idCounters[part.name]++}`;
    this.partIds.push(partId);
    for (const { to, from } of connections) {
      if (part.isOutPin(to.name)) {
        // Or(out=internal|chipout)
        if (this.chip.hasOut(from.name)) {
          // Or(out=chipout)
          this.wires.push({
            id: `${this.wires.length}`,
            source: partId,
            sourcePort: `${partId}_${to.name}`,
            target: `${this.chip.name}`,
            targetPort: `${this.chip.name}_${from.name}`,
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

        this.wires.push({
          id: `${this.wires.length}`,
          source: "_ALIAS_",
          sourcePort: from.name, // to be post-processed to this.ports.get(from.name)
          target: partId,
          targetPort: `${partId}_${to.name}`,
          hwMeta: { name: `${this.chip.name}_${from.name}` },
        });
      }
    }
  }

  getElkId = (name: string) => {
    this.idMap.set(name, this.maxId++);
    return name;
    // return `${this.maxId - 1}`;
  };

  partToNode = (part: Chip, partId: string): ELKNode => {
    const hwMeta = {
      cls: "Operator",
      maxId: 0,
      name: part.name.toUpperCase(),
      isExternalPort: false,
    };
    const id = this.getElkId(partId);
    const ports: ELKPort[] = [];
    [...part.ins.entries()].forEach((inPin, index) => {
      const pinId = `${partId}_${inPin.name}`;
      ports.push({
        id: this.getElkId(pinId),
        direction: "INPUT",
        properties: { index, side: "WEST" },
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
    return {
      id,
      hwMeta,
      ports,
      properties: {
        "org.eclipse.elk.layered.mergeEdges": 1,
        "org.eclipse.elk.portConstraints": "FIXED_ORDER",
      },
      edges: [],
      children: [],
    };
  };

  chipPinToNode(pin: Pin, index: number, portType: "INPUT" | "OUTPUT"): ELKNode {
    const pinId = `${this.chip.name}_${pin.name}`;
    return {
      hwMeta: { cls: null, isExternalPort: true, maxId: 0, name: pin.name },
      id: this.getElkId(pinId + "node"),
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
    };
  }

  chipToNode(chip: Chip): ELKNode {
    const hwMeta = {
      cls: null,
      maxId: 0,
      name: chip.name,
    };
    const chipid = this.getElkId(chip.name);
    const children: ELKNode[] = [];
    // chip ports to nodes with isExternalPort = true
    [...chip.ins.entries()].forEach((inPin, index) => {
      children.push(this.chipPinToNode(inPin, index, "INPUT"));
    });
    [...chip.outs.entries()].forEach((outPin, index) => {
      children.push(this.chipPinToNode(outPin, index, "OUTPUT"));
    });
    // chip parts to nodes
    [...chip.parts.values()].forEach((part, i) => {
      children.push(this.partToNode(part, this.partIds[i]));
    });
    return {
      id: chipid,
      hwMeta,
      children,
      edges: this.wires,
      ports: [],
      properties: {
        "org.eclipse.elk.layered.mergeEdges": 1,
        "org.eclipse.elk.portConstraints": "FIXED_ORDER",
      },
    };
  }

  getELK() {
    this.wires.forEach((wire) => {
      if (wire.source == "_ALIAS_") {
        wire.hwMeta.name = wire.sourcePort;
        const sourcePort = this.pinPorts.get(wire.sourcePort);
        if (!sourcePort) throw Error(`No source port entry found for alias ${wire.sourcePort}`);
        wire.source = sourcePort.node;
        wire.sourcePort = sourcePort.id;
      }
      if (wire.source == this.chip.name) {
        const sourcePinId = wire.sourcePort.split("_")[1];
        if (this.chip.hasIn(sourcePinId)) {
          wire.source = wire.sourcePort + "node";
        }
      }
      if (wire.target == this.chip.name) {
        const targetPinId = wire.targetPort.split("_")[1];
        if (this.chip.hasOut(targetPinId)) {
          wire.target = wire.targetPort + "node";
        }
      }
    });
    const elk = this.chipToNode(this.chip);
    return elk;
  }
}
