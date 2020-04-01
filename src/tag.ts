import fs from "fs";
import { dirname as getDirname } from "path";
import {
  hasIllegalCharsSlash,
  mkdirIfNotExist,
  jsonBeautify,
  assumeMinecraft,
} from "./utility";

/**
 * @class
 * @alias module:tag
 */
export class Tag {
  path: string;
  type: "block" | "item" | "function";
  values: string[];
  /**
   * Creates a tag
   * @param {string} path The path of the tag file relative to namspace/tags/type (excluding the file extension)
   * @param {('block'|'item'|'function')} type The type of tag
   * @param {string[]} [values=[]] the values in the tag
   */
  constructor(
    path: string,
    type: "block" | "item" | "function",
    values?: string[]
  ) {
    if (hasIllegalCharsSlash(path))
      throw new Error(
        "The names of tags can only contain the following characters 0-9, a-z, _, -, ., /"
      );
    /** @type {string} the path the tag will output to, eg. "fun/red" would point to tags/type/fun/red */
    this.path = path;
    if (!["block", "item", "function"].includes(type))
      throw new Error(`${type} is not a valid tag type`);
    /** @type {string} the type of tag it is */
    this.type = type;
    /** @type {string[]} the values of the tag */
    this.values = (values || []).map(assumeMinecraft);
  }
  /**
   * Outputs the tag file
   * @param {string} path The path of the namespace where the file will compile to
   */
  compile(path: string) {
    let tagPath = `${path}/${this.type}s/${this.path}.json`;
    mkdirIfNotExist(getDirname(tagPath));
    fs.writeFileSync(tagPath, jsonBeautify({ values: this.values }));
  }
  /**
   * Adds a value to the tag
   * @param {string} value the value to be added
   */
  addValue(value: string) {
    this.values.push(assumeMinecraft(value));
  }
  /**
   * Removes a value from the tag
   * @param {string} value the value to be removed
   */
  deleteValue(value: string) {
    while (this.values.indexOf(value) + 1) {
      this.values.splice(this.values.indexOf(value));
    }
  }
  /**
   * Returns a copy of the tag
   * @param {Tag} tag the tag to be copied
   * @returns {Tag} the copy of the tag
   */
  static copy(tag: Tag): Tag {
    let copy = new Tag("_", "block");
    for (let key in { ...tag }) copy[key] = tag[key];
    return copy;
  }
}
