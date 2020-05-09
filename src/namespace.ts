import pth from "path";
import { mkdirIfNotExist, hasIllegalChars } from "./utility";
import { Tag } from "./tag";
import { Recipe } from "./recipes";
import { LootTable } from "./loot";
import { McFunction } from "@throw-out-error/minecraft-mcfunction";

const dataCategories: string[] = [
  "functions",
  "tags/blocks",
  "tags/items",
  "tags/functions",
  "recipes",
  "loot_tables",
  "predicates"
];

export class Namespace {
  name: string;
  blockTags: { [key: string]: Tag };
  itemTags: { [key: string]: Tag };
  functionTags: { [key: string]: Tag };
  recipes: { [key: string]: Recipe };
  lootTables: { [key: string]: LootTable };
  functions: { [key: string]: McFunction };
  /**
   * Creates a namespace
   * @param {string} name The name of the namespace
   */
  constructor(name: string) {
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
    /** @type {object} the dictionary of block tag files */
    this.blockTags = {};
    /** @type {object} the dictionary of item tag files */
    this.itemTags = {};
    /** @type {object} the dictionary of function tag files */
    this.functionTags = {};
    /** @type {object} the dictionary of recipe files */
    this.recipes = {};
    /** @type {object} the dictionary of loot table files */
    this.lootTables = {};
    /** @type {object} the dictionary of mcfunction files */
    this.functions = {};
  }
  /**
   * Outputs the namespace's files
   * @param {string} root The root path where the namespace will compile
   */
  async compile(root: string) {
    const namespacePath = pth.join(root, "data", this.name);

    mkdirIfNotExist(namespacePath);
    dataCategories.forEach(category => {
      mkdirIfNotExist(pth.join(namespacePath, category));
    });

    const compiling: (Promise<any> | void)[] = [];

    const tagsPath = pth.join(namespacePath, "tags");
    ["block", "item", "function"].forEach(type => {
      const tags = this[type + "Tags"];
      for (let tag of Object.values<Tag>(tags)) {
        compiling.push(tag.compile(tagsPath));
      }
    });

    const recipePath = pth.join(namespacePath, "recipes");
    for (let recipe of Object.values(this.recipes)) {
      compiling.push(recipe.compile(recipePath));
    }

    const tablePath = pth.join(namespacePath, "loot_tables");
    for (let table of Object.values(this.lootTables)) {
      compiling.push(table.compile(tablePath));
    }

    const functionPath = pth.join(namespacePath, "functions");
    for (let funct of Object.values(this.functions)) {
      compiling.push(funct.compile(functionPath));
    }

    return Promise.all(compiling);
  }
  /**
   * Add a tag to the namespace
   * @param {Tag} tag The tag to be added
   * @returns {Tag} a reference to the added tag
   */
  addTag(tag: Tag): Tag {
    if (Object.prototype.hasOwnProperty.call(this[`${tag.type}Tags`], tag.path))
      throw new Error(
        `The tag ${tag.type}/${tag.path} has already been added to this namespace`
      );
    let copy = Tag.copy(tag);
    this[`${tag.type}Tags`][tag.path] = copy;
    return copy;
  }
  /**
   * Create a tag and add it to the namespace
   * @param {string} path The path of the tag file relative to namespace/tags/type (excluding the file extension)
   * @param {('block'|'item'|'function')} type The type of tag
   * @param {string[]} [values=[]]
   * @returns {Tag} a reference to the created tag
   */
  createTag(
    path: string,
    type: "block" | "item" | "function",
    values?: string[]
  ): Tag {
    let tag = new Tag(path, type, values || []);
    this.addTag(tag);
    return tag;
  }
  /**
   * Delete a tag
   * @param {string} path The path of the tag file relative to namespace/tags/type (excluding the file extension) to be deleted
   * @param {('block'|'item'|'function')} type The type of tag to be deleted
   */
  deleteTag(path, type) {
    delete this[`${type}Tags`][path];
  }
  /**
   * Add a recipe to the namespace
   * @param {Recipe} recipe The recipe to be added
   * @returns {Recipe} a reference to the added recipe
   */
  addRecipe(recipe: Recipe): Recipe {
    if (Object.prototype.hasOwnProperty.call(this.recipes, recipe.path))
      throw new Error(
        `The recipe ${recipe.path} has already been added to this namespace`
      );
    let copy = Recipe.copy(recipe);
    this.recipes[recipe.path] = copy;
    return copy;
  }
  /**
   * Delete a recipe
   * @param {string} path The path of the recipe file relative to namespace/recipes (excluding the file extension) to be deleted
   */
  deleteRecipe(path) {
    delete this.recipes[path];
  }
  /**
   * Add a loot table to the namespace
   * @param {LootTable} lootTable The loot table to be added
   * @returns {LootTable} a reference to the added loot table
   */
  addLootTable(lootTable: LootTable): LootTable {
    if (Object.prototype.hasOwnProperty.call(this.lootTables, lootTable.path))
      throw new Error(
        `This name space already has the loot table ${lootTable.path}`
      );
    let copy = LootTable.copy(lootTable);
    this.lootTables[lootTable.path] = copy;
    return copy;
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

    if (this.functions[functOrSource.name]) {
      throw Error("Duplicate function name");
    }
    this.functions[functOrSource.name] = functOrSource;

    return functOrSource;
  }
  /**
   * Creates a copy of the namespace
   * @param {Namespace} namespace the namespace to be copied
   * @returns {Namespace} a copy of the namespace
   */
  static copy(namespace: Namespace): Namespace {
    let copy = new Namespace("_");
    for (let key in { ...namespace }) copy[key] = namespace[key];
    return copy;
  }
}
