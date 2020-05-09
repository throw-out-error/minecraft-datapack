import { promises as fsPromises } from "fs";
import pth from "path";
import { mkdirIfNotExist } from "./utility";
import { Namespace, NamespaceObject, compile as compileNS } from "./namespace";

// Exports
export * from "@throw-out-error/minecraft-mcfunction";
export * from "./loot";
export * from "./namespace";
export * from "./predicate";
export * from "./recipes";
export * from "./tag";

type Format = 5;
interface McMeta {
  pack: {
    pack_format: Format;
    description: string;
  };
}

export class Datapack<T extends string> {
  name: string;
  format: Format;
  description: string;
  minecraft: NamespaceObject<"minecraft">;
  namespaces: { [name in T]?: NamespaceObject<name> };

  /**
   * Creates a datapack
   * @param {string} name The name of the datapack
   * @param {object} options Additional information regarding variable names and the pack.mcmeta file
   * @param {Format} [options.format=5] The datapack format version
   * @param {string} [options.description=name] The datapack's description
   */
  constructor(
    name: string,
    { format, description }: { format?: Format; description?: string } = {}
  ) {
    /** @type {string} the name of the datapack */
    this.name = name;
    this.format = format ?? 5;
    this.description = description ?? name;

    this.minecraft = { name: "minecraft" };

    /** @type {object} the namespaces the datapack will use */
    this.namespaces = {};
  }

  get meta(): McMeta {
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
  async compile(dest: string) {
    const root = pth.join(dest, this.name);
    const compiling: any[] = [];

    mkdirIfNotExist(root);
    compiling.push(
      fsPromises.writeFile(
        pth.join(root, "pack.mcmeta"),
        JSON.stringify(this.meta, null, 2)
      )
    );

    compiling.push(compileNS(this.minecraft, root));
    for (let ns of Object.values(this.namespaces) as NamespaceObject<T>[]) {
      compiling.push(compileNS(ns, root));
    }

    await Promise.all(compiling);
  }

  /**
   * Add a namespace to the datapack, minecraft is added by default this.minecraft
   * @param {NamespaceObject} namespace The namespace to be added
   * @returns {NamespaceObject} a reference to the added namespace
   */
  addNamespace(namespace: NamespaceObject<T>): NamespaceObject<T> {
    if (Object.prototype.hasOwnProperty.call(this.namespaces, namespace.name))
      throw new Error(
        `The namespace ${namespace.name} has already been added to this datapack`
      );
    this.namespaces[namespace.name] = namespace;
    return namespace;
  }
  /**
   * Creates a namespace and appends it to the datapack
   * @param {string} name The name of the namespace
   * @returns {Namespace} a reference to the created namespace
   */
  createNamespace(name: T): Namespace<T> {
    const namespace = new Namespace(name);
    this.addNamespace(namespace);
    return namespace;
  }
  /**
   * Removes the namespace from the datapack
   * @param {string} name The name of the namespace
   */
  deleteNamespace(name: T) {
    delete this.namespaces[name];
  }
}
