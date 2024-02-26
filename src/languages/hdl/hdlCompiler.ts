import { isErr, Ok, Err, Result } from "@davidsouther/jiffies/lib/esm/result.js";
// import { Chip, Connection } from "./Chip";
import { getBuiltinChip, hasBuiltinChip } from "@nand2tetris/web-ide/simulator/src/chip/builtins/index";
import { Connection } from "@nand2tetris/web-ide/simulator/src/chip/chip";
import { Chip } from "@nand2tetris/web-ide/simulator/src/chip/chip";
import { IAstChip, IAstPart, IAstPinParts } from "./hdlInterface";
// import { ElkBuilder } from "../../components/schematic/elkBuilder";
import { CompilationError, Span } from "../parserUtils";
import { sourceCodes } from "../../examples/projects";
import { parseHdl } from "./hdlParser";
// import { ElkBuilder } from "../../components/schematic/elkBuilder";

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

interface InternalPin {
  isDefined: boolean;
  firstUse: Span;
}

function isConstant(pinName: string): boolean {
  return pinName === "false" || pinName === "true" || pinName === "0" || pinName === "1";
}

export function createWire(lhs: IAstPinParts, rhs: IAstPinParts): Connection {
  return {
    to: {
      name: lhs.name,
      start: lhs.start ?? 0,
      width: pinWidth(lhs.start ?? 0, lhs.end), // lhs[0] = x
      // subbed: lhs.start == undefined ? false : true,
    },
    from: {
      name: rhs.name,
      start: rhs.start ?? 0,
      width: pinWidth(rhs.start ?? 0, rhs.end),
      // subbed: rhs.start == undefined ? false : true,
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

class ChipBuilder {
  private chip: Chip;
  private internalPins: Map<string, InternalPin> = new Map();
  private inPins: Map<string, Set<number>> = new Map();
  private outPins: Map<string, Set<number>> = new Map();
  private compileErrors: CompilationError[] = [];
  // private elkBuilder: ElkBuilder;
  constructor(private ast: IAstChip) {
    this.chip = new Chip(
      ast.inPins.map((pin) => ({ pin: pin.name, width: pin.width })),
      ast.outPins.map((pin) => ({ pin: pin.name, width: pin.width })),
      ast.name,
      [],
      [] // todo: parse clocked pinlist
    );
    // this.elkBuilder = new ElkBuilder(this.chip);
  }
  Err() {
    if (this.compileErrors.length == 0) throw Error();
    return { chip: this.chip, compileErrors: this.compileErrors }; //, elk: undefined };
  }
  Ok() {
    if (this.compileErrors.length > 0) throw Error();
    return { chip: this.chip, compileErrors: this.compileErrors }; //, elk: this.elkBuilder.getELK() };
  }
  async loadChip(name: string): Promise<Result<Chip>> {
    if (hasBuiltinChip(name)) return getBuiltinChip(name);
    const path = Object.keys(sourceCodes).find((fn) => fn.includes("/" + name + ".hdl"));
    if (!path) return Err(new Error(`Could not load source chip ${path}`));
    // TODO: Cache compilation of userDefinedChips
    const code = sourceCodes[path];
    const { ast, parseErrors } = parseHdl(code);
    if (parseErrors.length > 0) return Err(new Error("Parse errors in source chip"));
    const { chip, compileErrors } = await compileHdl(ast);
    if (compileErrors.length > 0) {
      return Err(new Error("Compile errors in source chip" + compileErrors[0].message));
    }
    return Ok(chip);
  }
  async build() {
    this.compileErrors = [];
    // this.elkBuilder = new ElkBuilder(this.chip);
    for (const part of this.ast.parts) {
      const builtin = await this.loadChip(part.name); // todo hdl can reference user defined chips from virtual fs
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
    if (!this.validateInternalPins()) return this.Err();
    return this.Ok();
  }

  private wirePart(part: IAstPart, partChip: Chip) {
    this.inPins.clear();
    const partWires: Connection[] = [];
    for (const { lhs, rhs } of part.wires) {
      if (!this.validateWire(partChip, lhs, rhs)) return false;
      const newWire = createWire(lhs, rhs);
      partWires.push(newWire);
    }
    try {
      this.chip.wire(partChip, partWires);
      // this.elkBuilder.wire(partChip, partWires);
      return true;
    } catch (e) {
      const err = e as CompilationError;
      this.compileErrors.push({ message: err.message, span: part.span });
      return false;
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
      this.compileErrors.push({ message: `${lhs.name} is not a defined input or output for ${partChip.name}`, span: lhs.span });
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
  private validateInternalPins() {
    for (const [name, pinData] of this.internalPins) {
      if (!pinData.isDefined) {
        this.compileErrors.push({
          message:
            name.toLowerCase() == "true" || name.toLowerCase() == "false"
              ? `The constants ${name.toLowerCase()} must be in lower-case`
              : `Undefined internal pin name: ${name}`,
          span: pinData.firstUse,
        });
        return false;
      }
    }
    return true;
  }
}
