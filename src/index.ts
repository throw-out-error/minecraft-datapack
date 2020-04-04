import { promises as fsPromises } from "fs";
import pth from "path";
import { mkdirIfNotExist } from "./utility";
import { Namespace } from "./namespace";

// Exports
export * from "@throw-out-error/minecraft-mcfunction";
export * from "./loot";
export * from "./namespace";
export * from "./predicate";
export * from "./recipes";
export * from "./tag";

export class Datapack {
  name: string;
  path: string;
  format: number;
  description: string;
  minecraft: Namespace;
  namespaces: object;
  /**
   * Creates a datapack
   * @param {string} name The name of the datapack
   * @param {string} path The root path of were the datapack will compile to eg. C:\Users\Ree will cause the datapack to compile to C:\Users\Ree\datapack_name
   * @param {object} options Additional information regarding variable names and the pack.mcmeta file
   * @param {number} [options.foramt=5] The datapack format version
   * @param {string} [options.description=name] The datapack's description
   */
  constructor(
    name: string,
    path: string,
    options: { format?: number; description?: string } = {}
  ) {
    /** @type {string} the name of the datapack */
    this.name = name;
    /** @type {string} the root folder the datapack will compile to */
    this.path = path;
    /** @type {number} the format version of the datapack */
    this.format = options.format || 5;
    /** @type {string} the description of the datapack */
    this.description = options.description || this.name;
    /** @type {Namespace} the datapacks minecraft folder */
    this.minecraft = new (class Minecraft extends Namespace {
      constructor() {
        super("minecraft_namespace");
        this.name = "minecraft";
      }
    })();
    /** @type {object} the namespaces the datapack will use */
    this.namespaces = {};
  }

  get mcmeta() {
    return {
      pack: {
        pack_format: this.format,
        description: this.description
      }
    };
  }

  /**
   * Output the files of the datapack
   */
  async compile(path: string) {
    const root = pth.join(path, this.name);
    mkdirIfNotExist(pth.join(root, "data"));
    await fsPromises.writeFile(
      pth.join(root, "pack.mcmeta"),
      JSON.stringify(this.mcmeta, null, 2)
    );

    const namespaces: Namespace[] = [
      this.minecraft,
      ...Object.values(this.namespaces)
    ];
    await Promise.all(namespaces.map(ns => ns.compile(root)));
  }

  /**
   * Add a namespace to the datapack, minecraft is added by default this.minecraft
   * @param {Namespace} namespace The namespace to be added
   * @returns {Namespace} a reference to the added namespace
   */
  addNamespace(namespace: Namespace): Namespace {
    if (Object.prototype.hasOwnProperty.call(this.namespaces, namespace.name))
      throw new Error(
        `The namespace ${namespace.name} has already been added to this datapack`
      );
    let copy = Namespace.copy(namespace);
    this.namespaces[namespace.name] = copy;
    return copy;
  }
  /**
   * Creates a namespace and appends it to the datapack
   * @param {string} name The name of the namespace
   * @returns {Namespace} a reference to the created namespace
   */
  createNamespace(name: string): Namespace {
    let namespace = new Namespace(name);
    this.addNamespace(namespace);
    return namespace;
  }
  /**
   * Removes the namespace from the datapack
   * @param {string} name The name of the namespace
   */
  deleteNamespace(name) {
    delete this.namespaces[name];
  }
}
