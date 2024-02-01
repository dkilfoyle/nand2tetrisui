import { Err, isErr, isOk, Ok, Result } from "@davidsouther/jiffies/lib/esm/result.js";
import { Chip, Connection, Pin } from "./Chip";
import { getBuiltinChip, hasBuiltinChip } from "@nand2tetris/web-ide/simulator/src/chip/builtins/index";
import { IAstChip, IAstPart, IAstPinParts, Span } from "./hdlInterface";

export const compileHdl = async (ast: IAstChip) => {
  return await new ChipBuilder(ast).build();
};

function pinWidth(start: number, end: number | undefined): number | undefined {
  if (end === undefined) {
    return undefined;
  }
  if (end >= start) {
    return end - start + 1;
  }
  if (start > 0 && end === 0) {
    return 1;
  }
  throw new Error(`Bus specification has start > end (${start} > ${end})`);
}

export interface CompilationError {
  message: string;
  span: Span;
}

interface InternalPin {
  isDefined: boolean;
  firstUse: Span;
}

function isConstant(pinName: string): boolean {
  return pinName === "false" || pinName === "true" || pinName === "0" || pinName === "1";
}

function createWire(lhs: IAstPinParts, rhs: IAstPinParts): Connection {
  return {
    to: {
      name: lhs.name,
      start: lhs.start ?? 0,
      width: pinWidth(lhs.start ?? 0, lhs.end),
    },
    from: {
      name: rhs.name,
      start: rhs.start ?? 0,
      width: pinWidth(rhs.start ?? 0, rhs.end),
    },
  };
}

function getBusIndices(pin: IAstPinParts): number[] {
  if (pin.start != undefined && pin.end != undefined) {
    const indices = [];
    for (let i = pin.start; i <= pin.end; i++) {
      indices.push(i);
    }
    return indices;
  }
  return [-1];
}

function checkMultipleAssignments(pin: IAstPinParts, assignedIndexes: Map<string, Set<number>>, compileErrors: CompilationError[]) {
  let errorIndex: number | undefined = undefined; // -1 stands for the whole bus width
  const indices = assignedIndexes.get(pin.name);
  if (!indices) {
    assignedIndexes.set(pin.name, new Set(getBusIndices(pin)));
  } else {
    if (indices.has(-1)) {
      errorIndex = pin.start ?? -1;
    } else if (pin.start !== undefined && pin.end !== undefined) {
      for (const i of getBusIndices(pin)) {
        if (indices.has(i)) {
          errorIndex = i;
        }
        indices.add(i);
      }
    } else {
      indices.add(-1);
    }
  }
  if (errorIndex != undefined) {
    compileErrors.push({
      message: `Cannot write to pin ${pin.name}${errorIndex != -1 ? `[${errorIndex}]` : ""} multiple times`,
      span: pin.span,
    });
    return false;
  }
  return true;
}

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
    // pin: Pin;
  };
}

interface ELKNode {
  edges: ELKEdge[];
  children: ELKNode[];
  ports: ELKPort[];
  id: string;
  hwMeta: {
    cls: string;
    name: string;
    isExternalPort: boolean;
  };
  properties: Record<string, any>;
}

class ElkBuilder {
  pinPorts = new Map<string, { id: string; node: string; label: string }>(); // map chip input and internal pins to ports
  wires = new Array<ELKEdge>();
  idCounters: Record<string, number> = {
    And: 0,
    Or: 0,
  };
  partIds: string[] = [];

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

  getELK() {
    console.log(this);
    this.wires.forEach((wire) => {
      if (wire.source == "_ALIAS_") {
        wire.hwMeta.name = wire.sourcePort;
        const sourcePort = this.pinPorts.get(wire.sourcePort);
        if (!sourcePort) throw Error(`No source port entry found for alias ${wire.sourcePort}`);
        wire.source = sourcePort.node;
        wire.sourcePort = sourcePort.id;
      }
    });

    const ports: ELKPort[] = [];
    for (const inPin of this.chip.ins.entries()) {
      ports.push({
        id: `${this.chip.name}_${inPin.name}`,
        direction: "OUTPUT",
        properties: { index: 0, side: "WEST" },
        hwMeta: { name: inPin.name, connectedAsParent: false },
      });
    }
    for (const outPin of this.chip.outs.entries()) {
      ports.push({
        id: `${this.chip.name}_${outPin.name}`,
        direction: "INPUT",
        properties: { index: 0, side: "EAST" },
        hwMeta: { name: outPin.name, connectedAsParent: false },
      });
    }

    const children: ELKNode[] = [];
    [...this.chip.parts].forEach((part, i) => {
      const partId = this.partIds[i];
      const partPorts: ELKPort[] = [];
      for (const pin of part.ins.entries()) {
        partPorts.push({
          id: `${partId}_${pin.name}`,
          direction: "OUTPUT",
          properties: { index: 0, side: "EAST" },
          hwMeta: { connectedAsParent: false, name: pin.name },
        });
      }
      for (const pin of part.outs.entries()) {
        partPorts.push({
          id: `${partId}_${pin.name}`,
          direction: "INPUT",
          properties: { index: 0, side: "WEST" },
          hwMeta: { connectedAsParent: false, name: pin.name },
        });
      }
      children.push({
        id: this.partIds[i],
        hwMeta: {
          cls: "Operator",
          name: part.name,
          isExternalPort: false,
        },
        properties: {
          "org.eclipse.elk.layered.mergeEdges": 1,
          "org.eclipse.elk.portConstraints": "FIXED_ORDER",
        },
        ports: partPorts,
        children: [],
        edges: [],
      });
    });

    return {
      id: this.chip.name,
      hwMeta: {
        name: this.chip.name,
        maxId: 100,
      },
      properties: {
        "org.eclipse.elk.layered.mergeEdges": 1,
        "org.eclipse.elk.portConstraints": "FIXED_ORDER",
      },
      ports,
      edges: this.wires,
      children,
    };
  }
}

// const getElkPorts = (chip: Chip, chipId: string) => {
//   const ports: ELKPort[] = [];
//   [...chip.ins.entries()].forEach((inPin, i) => {
//     ports.push({
//       id: `${chipId}_${inPin.name}`,
//       label: inPin.name,
//       node: chipId,
//       direction: "OUTPUT",
//       properties: { index: i, side: "WEST" },
//       hwMeta: { name: chip.name, connectedAsParent: false },
//     });
//   });
//   [...chip.outs.entries()].forEach((outPin, i) => {
//     ports.push({
//       id: `${chipId}_${outPin.name}`,
//       label: outPin.name,
//       node: chipId,
//       direction: "INPUT",
//       properties: { index: i, side: "EAST" },
//       hwMeta: { name: chip.name, connectedAsParent: false },
//     });
//   });
//   return ports;
// }

// const getElkEdges = (chip: Chip, chipId: string) => {
//   const edges: ELKEdge[] = [];
//    [...chip.outs.entries()].forEach((outPin, i) => {
//     edges.push({
//       id: outPin.name,
//       source: chipId,
//       sourcePort: `${chipId}_${outPin.name}`,
//       target:
//       targetPort: string
//       })
//    });

// }

// const elkBuilder = (chip: Chip) => {
//   const elk: ELKNode = {
//     hwMeta: {
//       cls: "topchip",
//       name: chip.name,
//       isExternalPort: false,
//     },
//     id: chip.name,
//     edges: [],
//     ports: [],
//     children: [],
//   };
//   elk.ports = getElkPorts(chip);

//   const idCounters:Record<string,number> = {
//     And: 0,
//     Or: 0,
//   };
//   [...chip.parts.values()].forEach((part,i) => {
//     const id = `${part.name}${idCounters[part.name]++}`
//     const ports = getElkPorts(part);
//     const edges = getElkEdges(part, id);

//   })
//   return elk;
// };

class ChipBuilder {
  private chip: Chip;
  private internalPins: Map<string, InternalPin> = new Map();
  private inPins: Map<string, Set<number>> = new Map();
  private outPins: Map<string, Set<number>> = new Map();
  private compileErrors: CompilationError[] = [];
  private elkBuilder: ElkBuilder;
  constructor(private ast: IAstChip) {
    this.chip = new Chip(
      ast.inPins.map((pin) => ({ pin: pin.name, width: pin.width })),
      ast.outPins.map((pin) => ({ pin: pin.name, width: pin.width })),
      ast.name,
      [],
      []
    );
    this.elkBuilder = new ElkBuilder(this.chip);
  }
  Err() {
    if (this.compileErrors.length == 0) throw Error();
    return { chip: this.chip, compileErrors: this.compileErrors };
  }
  Ok() {
    if (this.compileErrors.length > 0) throw Error();
    return { chip: this.chip, compileErrors: this.compileErrors, elk: this.elkBuilder.getELK() };
  }
  build() {
    this.compileErrors = [];
    this.elkBuilder = new ElkBuilder(this.chip);
    for (const part of this.ast.parts) {
      const builtin = getBuiltinChip(part.name); // todo hdl can reference user defined chips from virtual fs
      if (isErr(builtin)) {
        this.compileErrors.push({ message: `Unknown part name ${part.name}`, span: part.span });
        return this.Err();
      }
      if (part.name == this.chip.name) {
        this.compileErrors.push({ message: `Cannot use chip ${part.name} to implement itself`, span: part.span });
        return this.Err();
      }
      const partChip = Ok(builtin);
      if (!this.wirePart(part, partChip)) return this.Err();
    }
    // if (!this.validateInternalPins()) return this.Err();
    console.log(this.elkBuilder.getELK());
    return this.Ok();
  }

  private wirePart(part: IAstPart, partChip: Chip) {
    const wires: Connection[] = [];
    this.inPins.clear();
    for (const { lhs, rhs } of part.wires) {
      if (!this.validateWire(partChip, lhs, rhs)) return false;
      wires.push(createWire(lhs, rhs));
    }
    try {
      this.chip.wire(partChip, wires);
      this.elkBuilder.wire(partChip, wires);
      // TODO: this.elk.wire(partChip, wires)
      return true;
    } catch (e) {
      console.log(e);
      const err = e as CompilationError;
      this.compileErrors.push(err);
      return;
    }
  }

  private validateWire(partChip: Chip, lhs: IAstPinParts, rhs: IAstPinParts) {
    if (partChip.isInPin(lhs.name)) {
      // eg Or(a=x) lhs(a) is an input
      return this.validateInputWire(lhs, rhs);
    } else if (partChip.isOutPin(lhs.name)) {
      // eg Or(out=myOrOut) lhs(out) is an output
      return this.validateOutputWire(rhs);
    } else {
      this.compileErrors.push({ message: `${lhs.name} is not a defined intput or output for ${partChip.name}`, span: lhs.span });
      return false;
    }
  }

  private isInternal(pinName: string): boolean {
    return !(this.chip.isInPin(pinName) || this.chip.isOutPin(pinName) || isConstant(pinName));
  }

  private validateInputWire(lhs: IAstPinParts, rhs: IAstPinParts) {
    if (!this.validateInputSource(rhs)) return false;
    if (!checkMultipleAssignments(lhs, this.inPins, this.compileErrors)) return false;
    // track internal pin use to detect undefined pins
    if (this.isInternal(rhs.name)) {
      // eg And(a=x, b=y, out=myInternalPin)
      //    Or(a=myInternalPin)
      const pinData = this.internalPins.get(rhs.name);
      if (pinData == undefined) {
        // eg Or(a=myInternalPin) - set myInternalPin firstUse here but undefined at this point
        //    And(a=x, b=y, out=myInternalPin)
        this.internalPins.set(rhs.name, { isDefined: false, firstUse: rhs.span });
      } else {
        // eg And(a=x, b=y, out=myInternalPin)
        //    Or(a=myInternalPin) - myInternalPin is already defined but this is first use
        pinData.firstUse = pinData.firstUse.startOffset < rhs.span.startOffset ? pinData.firstUse : rhs.span;
      }
    }
    return true;
  }

  private validateInputSource(rhs: IAstPinParts) {
    // IN x,y; OUT z;
    if (this.chip.isOutPin(rhs.name)) {
      // Can't have Or(a=z)
      this.compileErrors.push({
        message: "Cannot use output pin as own input source",
        span: rhs.span,
      });
      return false;
    } else if (!this.chip.isInPin(rhs.name) && rhs.start != undefined) {
      // if not chip output or chip input then must be constant or internal pin
      // Cant have Or(a=true[1])
      // Cant have Or(a=myinternalpin[2])
      this.compileErrors.push({
        message: isConstant(rhs.name) ? `Cannot use sub bus of constant bus` : `Cannot use sub bus of internal pin ${rhs.name} as input`,
        span: rhs.span,
      });
      return false;
    }
    // TODO: what's to stop doing Or(a=b) or Or(a=out)
    return true;
  }

  private validateOutputWire(rhs: IAstPinParts) {
    if (!this.validateWriteTarget(rhs)) return false;
    // wire is of form out=outpin or out=internalpin
    if (this.chip.isOutPin(rhs.name)) {
      // wire is of for out=chipoutpin
      if (!checkMultipleAssignments(rhs, this.outPins, this.compileErrors)) {
        // Cant do Or(out=z); And(out=z);
        return false;
      }
    } else {
      // rhs is internal pin
      // Or(out=myinternalpin)
      if (rhs.start !== undefined || rhs.end !== undefined) {
        // Cannto do Or(a=)
        this.compileErrors.push({
          message: `Cannot write to sub bus of internal pin ${rhs.name}`,
          span: rhs.span,
        });
        return false;
      }
      // track internal pin creation to detect undefined pins
      const pinData = this.internalPins.get(rhs.name);
      if (pinData == undefined) {
        this.internalPins.set(rhs.name, {
          isDefined: true,
          firstUse: rhs.span,
        });
      } else {
        if (pinData.isDefined) {
          this.compileErrors.push({
            message: `Internal pin ${rhs.name} already defined`,
            span: rhs.span,
          });
          return false;
        }
        pinData.isDefined = true;
      }
    }
    return true;
  }
  private validateWriteTarget(rhs: IAstPinParts) {
    if (this.chip.isInPin(rhs.name)) {
      // Cannot Or(out=x)
      this.compileErrors.push({
        message: `Cannot write to chip input ${rhs.name}`,
        span: rhs.span,
      });
      return false;
    }
    if (isConstant(rhs.name)) {
      this.compileErrors.push({
        message: `Cannot write to constant`,
        span: rhs.span,
      });
      return false;
    }
    // TODO: Cannot write to part input
    // if (partChip.isInPin(rhs.name)) {
    //   this.compileErrors.push({
    //     message: `Cannot write to part input/output`,
    //     span: rhs.span,
    //   });
    //   return false;
    // }
    return true;
  }
}
