import pth from "path";
import { promises as fs, createWriteStream } from "fs";
import { mkdirIfNotExist, hasIllegalChars } from "./utility";
import { TagObject, Tag } from "./tag";
import { Recipe } from "./recipes";
import { LootTable } from "./loot";
import { McFunction } from "@throw-out-error/minecraft-mcfunction";
import stream, { Readable } from "stream";
import { promisify } from "util";
const pipeline = promisify(stream.pipeline);

interface Tags {
  blocks?: { [tag: string]: TagObject };
  entityTypes?: { [tag: string]: TagObject };
  fluid?: { [tag: string]: TagObject };
  functions?: { [tag: string]: TagObject };
  items?: { [tag: string]: TagObject };
}
type TagType = keyof Tags;
const tagTypes: TagType[] = [
  "blocks",
  "entityTypes",
  "fluid",
  "functions",
  "items"
];

async function waitForGenerator(gen: AsyncGenerator) {
  while (!(await gen.next()).done) {}
}

export interface NamespaceObject<T extends string = string> {
  name: T;
  advancements?: {};
  functions?: { [name: string]: McFunction };
  lootTables?: { [name: string]: LootTable };
  predicates?: {};
  recipes?: { [name: string]: Recipe };
  structures?: {};
  tags?: Tags;
}

export async function compile(namespace: NamespaceObject, root: string) {
  const namespacePath = pth.join(root, "data", namespace.name);
  const compiling: any[] = [];

  const allTags = namespace?.tags;
  if (allTags) {
    tagTypes.forEach(type => {
      const tags = Object.entries<TagObject>(allTags?.[type] ?? {});
      if (!tags.length) return;

      const dir = pth.join(namespacePath, "tags", type);
      mkdirIfNotExist(dir);

      for (let [name, { replace, values }] of tags) {
        let tagPath = pth.join(dir, name);
        if (!pth.extname(tagPath)) tagPath += ".json";

        const tag: TagObject = { values };
        if (replace) tag.replace = true;

        compiling.push(fs.writeFile(tagPath, JSON.stringify(tag)));
      }
    });
  }

  const recipes = Object.entries<Recipe>(namespace?.recipes ?? {});
  if (recipes.length) {
    const dir = pth.join(namespacePath, "recipes");
    for (let [name, recipe] of recipes) {
      name;
      compiling.push(recipe.compile(dir));
    }
  }

  const lootTables = Object.entries<LootTable>(namespace?.lootTables ?? {});
  if (lootTables.length) {
    const dir = pth.join(namespacePath, "loot_tables");
    for (let [name, lootTable] of lootTables) {
      name;
      compiling.push(lootTable.compile(dir));
    }
  }

  const functions = Object.values<McFunction>(namespace?.functions ?? {});
  if (functions.length) {
    const dir = pth.join(namespacePath, "functions");
    mkdirIfNotExist(dir);
    for (let fun of functions) {
      const writeStream = createWriteStream(
        pth.join(dir, `${fun.name}.mcfunction`)
      );
      const readStream = Readable.from(fun.compile());

      compiling.push(pipeline(readStream, writeStream));
    }
  }

  return Promise.all(compiling);
}

export class Namespace<T extends string = string> implements NamespaceObject {
  name: T;
  advancements?: {};
  functions?: { [name: string]: McFunction };
  lootTables?: { [name: string]: LootTable };
  predicates?: {};
  recipes?: { [name: string]: Recipe };
  structures?: {};
  tags?: Tags;
  /**
   * Creates a namespace
   * @param {string} name The name of the namespace
   */
  constructor(name: T) {
    if (hasIllegalChars(name))
      throw new Error(
        "Namespace names can only contain the following characters 0-9, a-z, _, -, ."
      );
    if (name == "minecraft")
      throw new Error(
        "The Datapack class creates the minecraft namespace by default, datapack.minecraft, adding it a second time will cause it to be overridden"
      );
    /** @type {string} the name of the namespace */
    this.name = name;
  }
  /**
   * Outputs the namespace's files
   * @param {string} root The root path of the datapack the namespace should compile into
   */
  async compile(root: string) {
    return compile(this, root);
  }

  /**
   * Add a tag to the namespace
   * @param {Tag} tag The tag to be added
   * @returns {TagObject} a reference to the added tag
   */
  addTag(tag: Tag): Tag {
    const type = (tag.type + "s") as TagType;
    if (this?.tags?.[type]?.[tag.path]) {
      throw new Error(
        `The tag ${tag.type}/${tag.path} has already been added to this namespace`
      );
    }
    let tags = this.tags;
    if (!tags) tags = this.tags = {};
    let tagType = tags[type];
    if (!tagType) tagType = tags[type] = {};
    tagType[tag.path] = tag;

    return tag;
  }
  /**
   * Create a tag and add it to the namespace
   * @param {string} path The path of the tag file relative to namespace/tags/type (excluding the file extension)
   * @param {TagType} type The type of tag
   * @param {string[]} [values=[]]
   * @returns {TagObject} a reference to the created tag
   */
  createTag(path: string, type: TagType, values?: string[]): TagObject {
    const tag = { values: values ?? [] };

    let tags = this.tags;
    if (!tags) tags = this.tags = {};
    let tagType = tags[type];
    if (!tagType) tagType = tags[type] = {};
    tagType[path] = tag;

    return tag;
  }
  /**
   * Delete a tag
   * @param {string} path The path of the tag file relative to namespace/tags/type (excluding the file extension) to be deleted
   * @param {TagType} type The type of tag to be deleted
   */
  deleteTag(path: string, type: TagType) {
    delete this.tags?.[type]?.[path];
  }
  /**
   * Add a recipe to the namespace
   * @param {Recipe} recipe The recipe to be added
   * @returns {Recipe} a reference to the added recipe
   */
  addRecipe(recipe: Recipe): Recipe {
    if (this.recipes?.[recipe.path]) {
      throw new Error(
        `The recipe ${recipe.path} has already been added to this namespace`
      );
    }

    let recipes = this.recipes;
    if (!recipes) recipes = this.recipes = {};
    recipes[recipe.path] = recipe;
    return recipe;
  }
  /**
   * Delete a recipe
   * @param {string} path The path of the recipe file relative to namespace/recipes (excluding the file extension) to be deleted
   */
  deleteRecipe(path: string) {
    delete this.recipes?.[path];
  }
  /**
   * Add a loot table to the namespace
   * @param {LootTable} lootTable The loot table to be added
   * @returns {LootTable} a reference to the added loot table
   */
  addLootTable(lootTable: LootTable): LootTable {
    if (this?.lootTables?.[lootTable.path]) {
      throw new Error(
        `This name space already has the loot table ${lootTable.path}`
      );
    }

    let lootTables = this.lootTables;
    if (!lootTables) lootTables = this.lootTables = {};
    lootTables[lootTable.path] = lootTable;
    return lootTable;
  }
  /**
   * Create a loot table then add it to the namespace
   * @param {string} path the path of the loot table to be created
   * @returns {LootTable} a reference to the created pool
   */
  createLootTable(path: string): LootTable {
    let lootTable = new LootTable(path);
    this.addLootTable(lootTable);
    return lootTable;
  }

  addFunction(funct: McFunction): McFunction;
  addFunction(source: () => void): McFunction;
  addFunction(functOrSource: McFunction | (() => void)): McFunction {
    if (typeof functOrSource === "function") {
      functOrSource = new McFunction(functOrSource);
    }

    let functions = this.functions;
    if (!functions) functions = this.functions = {};

    if (functions[functOrSource.name]) {
      throw Error("Duplicate function name");
    }
    functions[functOrSource.name] = functOrSource;

    return functOrSource;
  }
  /**
   * Creates a copy of the namespace
   * @param {Namespace} namespace the namespace to be copied
   * @returns {Namespace} a copy of the namespace
   * @deprecated Just why??
   */
  static copy(namespace: Namespace): Namespace {
    let copy = new Namespace("_");
    for (let key in { ...namespace }) copy[key] = namespace[key];
    return copy;
  }
}
