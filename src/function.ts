import { mkdirIfNotExist } from "./utility";
import fs from "fs";
import { dirname as getDirname } from "path";

export class Function {
  commands: Command[];
  path: string;
  /**
   * @param {string} path the path of the file relative to namspace/functions
   */
  constructor(path: string) {
    this.path = path;
    this.commands = [];
  }
  compile(path: string) {
    let functionPath = `${path}/${this.path}.mcfunction`;
    mkdirIfNotExist(getDirname(functionPath));
    fs.writeFileSync(
      functionPath,
      this.commands.map((c) => c.compile()).join("\n")
    );
  }
  /**
   * Add a command to the function
   * @param {Command} command the command to be added
   */
  addCommand(command: Command) {
    this.commands.push(command);
    return this;
  }
  /**
   * Copies the function
   * @param {Function} funct the function to be copied
   * @returns {Function} a reference to the function
   */
  static copy(funct: Function): Function {
    let copy = new Function("_");
    for (let key in { ...funct }) copy[key] = funct[key];
    return copy;
  }
}

export class Command {
  method: string;
  params: Array<Value | string>;
  /**
   * @param {string} method the command to be executed
   * @param {Array<Value|string|Selector>} params the parameters to be passed to the command
   */
  constructor(method: string, params: Array<Value | string>) {
    this.method = method;
    this.params = params;
  }
  /**
   * Outputs the command as a string
   */
  compile(): string {
    return `${this.method} ${this.params
      .map((p) => (p instanceof Value ? p.compile() : p))
      .join(" ")}`;
  }
}

export class Value {
  type: string;
  value: string;
  /**
   * @param {string} type the type of the value
   * @param {any} value the value that will be cast to a string
   */
  constructor(
    type: "int" | "float" | "double" | "long" | "string",
    value: any
  ) {
    if (["int", "float", "double", "long"].includes(type)) {
      this.type = type;
      this.value = value.toString();
    } else {
      this.type = "string";
      this.value = `"${value}"`;
    }
  }
  /**
   * Outputs the value as a string
   */
  compile(): string {
    return (
      this.value +
      (["int", "float", "double", "long"].includes(this.type)
        ? this.type.slice(0, 1)
        : "")
    );
  }
}

export class ValueArray {
  type: string;
  values: Value[];
  /**
   * @param {string} type the type of array to be created
   * @param {Value[]} values the elements of the array
   */
  constructor(type: string, values?: Value[]) {
    this.type = type;
    this.values = values || [];
    for (let v of this.values)
      if (v.type != this.type)
        throw new Error(
          `Error: can't pass value of type ${v.type} to value array of type ${this.type}`
        );
  }
  /**
   * Output the value array as a string
   */
  compile(): string {
    return `[${this.values.map((v) => v.compile()).join(", ")}]`;
  }
}
