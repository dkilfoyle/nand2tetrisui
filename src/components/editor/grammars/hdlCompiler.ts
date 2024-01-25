import type * as monacoT from "monaco-editor/esm/vs/editor/editor.api";
import { IAstChip, IAstWireEnd } from "./hdlInterface";
import { Chip, builtinChips } from "../simulator/builtins";
import _ from "lodash";
import { IToken } from "chevrotain";

interface IDevice {
  type: string;
  label: string;
  bits: number;
}

interface IConnection {
  name: string;
  from: { id: string; port: string };
  to: { id: string; port: string };
}

interface INetlist {
  devices: Record<string, IDevice>;
  connectors: IConnection[];
}

const getMarkerPositions = (startToken: IToken, endToken?: IToken) => {
  const eToken = endToken || startToken;
  return {
    startColumn: startToken.startColumn || 0,
    startLineNumber: startToken.startLine || 0,
    endColumn: eToken.endColumn ? eToken.endColumn + 1 : 0,
    endLineNumber: eToken.endLine || 0,
  };
};

const getIndices = (pin: IAstWireEnd): number[] => {
  if (!pin.subBus) return [-1];
  if (!pin.subBus.end) return [parseInt(pin.subBus.start.image)];
  return _.range(parseInt(pin.subBus.start.image), parseInt(pin.subBus.end.image));
};

const detectMultipleAssignment = (
  pin: IAstWireEnd,
  assignedPinIndexes: Map<string, Set<number>>,
  compileErrors: monacoT.editor.IMarkerData[]
) => {
  const assignedIndices = assignedPinIndexes.get(pin.name.image);

  if (!assignedIndices) {
    assignedPinIndexes.set(pin.name.image, new Set(getIndices(pin)));
    return false;
  }

  if (assignedIndices.has(-1)) {
    // already have assignment to full bus, can't overwrite this assignment
    compileErrors.push({
      message: `${pin.name.image} bus already fully assigned`,
      ...getMarkerPositions(pin.name),
      severity: 4,
    });
    return true;
  }

  if (pin.subBus) {
    getIndices(pin).forEach((index) => {
      if (assignedIndices.has(index)) {
        compileErrors.push({
          message: `Cannot write to pin ${pin.name.image} multiple times`,
          ...getMarkerPositions(pin.name),
          severity: 4,
        });
        return false;
      } else assignedIndices.add(index);
    });
  } else {
    assignedIndices.add(-1);
    return false;
  }
};

const detectBadInputSource = (rhs: IAstWireEnd, chip: Chip, compileErrors: monacoT.editor.IMarkerData[]) => {
  if (chip.isOutPin(rhs.name.image)) {
    compileErrors.push({
      message: `Cannot use output pin as input`,
      ...getMarkerPositions(rhs.name),
      severity: 4,
    });
    return true;
  } else if (!chip.isInPin(rhs.name.image) && rhs.subBus) {
    // rhs is an internal pin
    compileErrors.push({
      message:
        rhs.name.image == "true" || rhs.name.image == "false"
          ? `Cannot use sub bus of constant bus` // actually would be a syntax error eg false[1]
          : `Cannot use sub bus of internal pin as input`,
      ...getMarkerPositions(rhs.name),
      severity: 4,
    });
    return true;
  }
  return false;
};

const detectBadWriteTarget = (rhs: IAstWireEnd, chip: Chip, compileErrors: monacoT.editor.IMarkerData[]) => {
  if (chip.isInPin(rhs.name.image)) {
    // eg Or(out=chipinput)
    compileErrors.push({
      message: `Cannot write to chip input pin`,
      ...getMarkerPositions(rhs.name),
      severity: 4,
    });
    return true;
  }
  if (rhs.name.image == "true" || rhs.name.image == "false") {
    // eg Or(out=true)
    compileErrors.push({
      message: `Cannot write to constant bus`,
      ...getMarkerPositions(rhs.name),
      severity: 4,
    });
    return true;
  }
  return false;
};

export const compileHdl = (ast: IAstChip) => {
  const netlist: INetlist = { devices: {}, connectors: [] };
  const compileErrors: monacoT.editor.IMarkerData[] = [];

  ast.inPins.forEach((pin) => {
    const pinWidth = pin.width ? parseInt(pin.width.image) : 1;
    if (pinWidth != 1) throw Error("pinWidth > 1 not implemented");
    netlist.devices[pin.name.image] = { type: "Button", label: pin.name.image, bits: pinWidth };
  });

  ast.outPins.forEach((pin) => {
    const pinWidth = pin.width ? parseInt(pin.width.image) : 1;
    if (pinWidth != 1) throw Error("pinWidth > 1 not implemented");
    netlist.devices[pin.name.image] = { type: "Lamp", label: pin.name.image, bits: pinWidth };
  });

  //   IN a, b;    // 1-bit inputs
  // OUT sum,    // Right bit of a + b
  //     carry;  // Left bit of a + b

  // PARTS:
  // Not(in=a, out=nota);
  // Not(in=b, out=notb);
  // And(a=nota, b=b, out=nAB);
  // And(a=a, b=notb, out=AnB);
  // Or(a=nAB, b=AnB, out=sum);
  // And(a=a, b=b, out=carry);

  interface InternalPin {
    isDefined: boolean;
    firstUse: IToken;
  }

  const buildChip = new Chip(
    ast.name.image,
    ast.inPins.map((pin) => ({ name: pin.name.image, width: pin.width ? parseInt(pin.width.image) : 1 })),
    ast.outPins.map((pin) => ({ name: pin.name.image, width: pin.width ? parseInt(pin.width.image) : 1 }))
  );

  const internalPins: Map<string, InternalPin> = new Map();
  const outPins: Map<string, Set<number>> = new Map();

  ast.parts.forEach((part, part_num) => {
    const device: IDevice = { type: "unset", bits: 1, label: "unset" };
    switch (part.name.image) {
      case "Or":
      case "And":
      case "Nand":
      case "Xor":
      case "Not":
        device.type = part.name.image;
        device.bits = 1;
        device.label = part.name.image + part_num;
        break;
      default:
        throw Error(`${part.name.image} to device conversion not defined yet`);
    }
    netlist.devices[part.name.image + part_num] = device;

    const builtin = builtinChips.find((chip) => chip.name == part.name.image);
    if (!builtin) throw Error("Unable to find matching builtin " + part.name.image);
    const partChip = new Chip(builtin.name, builtin.inputs, builtin.outputs);

    // track which indexes for a pin have been assigned
    const inPins: Map<string, Set<number>> = new Map();

    part.wires.forEach((wire) => {
      const isRhsInternal = !(
        buildChip.isInPin(wire.rhs.name.image) ||
        buildChip.isOutPin(wire.rhs.name.image) ||
        wire.rhs.name.image == "true" ||
        wire.rhs.name.image == "false"
      );

      if (partChip.isInPin(wire.lhs.name.image)) {
        // inputing from rhs to chip input: lhs <= rhs
        if (detectMultipleAssignment(wire.lhs, inPins, compileErrors)) return { netlist: {}, compileErrors };
        if (detectBadInputSource(wire.rhs, buildChip, compileErrors)) return { netlist: {}, compileErrors };

        if (isRhsInternal) {
          const rhsInternalPinData = internalPins.get(wire.rhs.name.image);
          if (rhsInternalPinData == undefined) {
            // eg Not(in=blabla) // blabla is not yet targeted
            //    Or(out=blabla) // now blabla is targeted
            internalPins.set(wire.rhs.name.image, { isDefined: false, firstUse: wire.rhs.name });
          } else {
            rhsInternalPinData.firstUse =
              rhsInternalPinData.firstUse.startOffset < wire.rhs.name.startOffset ? rhsInternalPinData.firstUse : wire.rhs.name;
          }
        }
      } else if (partChip.isOutPin(wire.lhs.name.image)) {
        // outputing from chip output to rhs
        // eg Or(a=x, b=y, out=myrhs);
        if (detectBadWriteTarget(wire.rhs, buildChip, compileErrors)) return { netlist: compileErrors };
        if (buildChip.isOutPin(wire.rhs.name.image)) {
          // outputing from partchip out to buildchip out
          // eg Or(out=chipout)

          // eg Or(out=chipout)
          //    And(out=chipout)
          if (detectMultipleAssignment(wire.rhs, outPins, compileErrors)) return { netlist: compileErrors };
        }

        // if (rhsInternalPinData.isDefined) {
        //   compileErrors.push({
        //     message: chip.isOutPin(wire.rhs.name.image)
        //       ? `Cannot write to output pin ${wire.rhs.name.image} multiple times`
        //       : `Internal pin ${wire.rhs.name.image} already defined`,
        //     ...getMarkerPositions(wire.rhs.name),
        //     severity: 4,
        //   });
        //   return { netlist, compileErrors };
        // } else rhsInternalPinData.isDefined = true;
      }
    });
  });

  return { netlist: {}, compileErrors };
};
