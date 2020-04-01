import {
  hasIllegalCharsSlash,
  mkdirIfNotExist,
  jsonBeautify,
  getDirname,
  fs,
  itemArrayFromString,
  assumeMinecraft
} from "./utility";

class Recipe {
  type: "smelting" | "shapeless" | "shaped" | "stonecutting";
  path: string;
  file_contents: object;
  /**
   * Creates a Recipe
   * @param {string} path  The path of the recipe file relative to namespace/recipes (excluding the file extension)
   * @param {('smelting'|'stonecutting'|'shapless'|'shaped')} type The type of recipe
   */
  constructor(
    path: string,
    type: "smelting" | "shapeless" | "shaped" | "stonecutting"
  ) {
    /** @type {string} The type of recipe */
    this.type = type;
    if (hasIllegalCharsSlash(path))
      throw new Error(
        "The names of recipes can only contain the following characters 0-9, a-z, _, -, ., /"
      );
    /** @type {string} The path of the recipe file relative to namespace/recipes (excluding the file extension) */
    this.path = path;
    /** @type {object} The content of the file when it is compiled */
    this.file_contents = {};
  }
  /**
   * Outputs the recipe json file
   * @param {string} path The path of the namespace the recipe will compile to
   */
  compile(path: string) {
    let recipePath = `${path}/${this.path}.json`;
    mkdirIfNotExist(getDirname(recipePath));
    fs.writeFileSync(recipePath, jsonBeautify(this.file_contents));
  }
  /**
   * Creates a copy of the recipe
   * @param {Recipe} recipe
   */
  static copy(recipe: Recipe): Recipe {
    let copy = new Recipe("_", "shapeless");
    for (let key in { ...recipe }) copy[key] = recipe[key];
    return copy;
  }
}

class SmeltingRecipe extends Recipe {
  /**
   * Creates a SmeltingRecipe
   * @param {string} path  The path of the recipe file relative to namespace/recipes (excluding the file extension)
   * @param {object} options The configuration of the recipe
   * @param {string} options.ingredient The ingredient that needs to be smelted for the recipe, can also be a tag
   * @param {string} options.result The resulting item from the recipe
   * @param {number} options.experience The amount of experience gained from smelting
   * @param {('minecraft:smelting'|'minecraft:blasting'|'minecraft:smoking'|'minecraft:campfire_cooking'|'smelting')} [options.type='smelting'] The type of smelting recipe
   * @param {number} [options.cookingtime=200] The amount of time the item has to smelt
   */
  constructor(
    path: string,
    options: {
      type?:
        | "minecraft:smelting"
        | "minecraft:blasting"
        | "minecraft:campfire_cooking"
        | "smelting";
      ingredient: string;
      result: string;
      experience: number;
      cookingtime?: number;
    }
  ) {
    super(path, "smelting");
    /** @type {string} The contents of the outputted file */
    this.file_contents = {
      type: options.type || "minecraft:smelting",
      ingredient: itemArrayFromString(options.ingredient.split("||").map(assumeMinecraft).join("||")),
      result: options.result,
      experience: options.experience,
      cookingtime: options.cookingtime || 200,
    };
  }
}

class StonecutterRecipe extends Recipe {
  /**
   * Creates a StonecuttingRecipe
   * @param {string} path  The path of the recipe file relative to namespace/recipes (excluding the file extension)
   * @param {object} options The configuration of the recipe
   * @param {string} options.ingredient The stone block needed for the stonecutting
   * @param {string} options.result The resulting item from the stonecutting
   * @param {number} [options.count=1] The amount of the resulting item
   */
  constructor(
    path: string,
    options: { ingredient: string; result: string; count?: number }
  ) {
    super(path, "stonecutting");
    /** @type The contents of the outputted file */
    this.file_contents = {
      type: "minecraft:stonecutting",
      ingredient: itemArrayFromString(options.ingredient.split("||").map(assumeMinecraft).join("||")),
      result: options.result,
      count: options.count || 1,
    };
  }
}

class ShapelessCraftingRecipe extends Recipe {
  /**
   * Creates a ShaplessCraftingRecipe
   * @param {string} path  The path of the recipe file relative to namespace/recipes (excluding the file extension)
   * @param {object} options The configuration of the recipe
   * @param {string[]} options.ingredients The ingredients of the recipe, can be tags
   * @param {string} options.result The result of the crafting recipe
   * @param {number} [options.count=1] The number of resulting items
   */
  constructor(
    path: string,
    options: { ingredients: string[]; result: string; count?: number }
  ) {
    super(path, "shapeless");
    /** @type {string} The contents of the outputted file */
    this.file_contents = {
      type: "minecraft:crafting_shapeless",
      ingredients: options.ingredients.map((ingredient) =>
        itemArrayFromString(ingredient.split("||").map(assumeMinecraft).join("||"))
      ),
      result: {
        item: options.result,
        count: options.count || 1,
      },
    };
  }
}

class ShapedCraftingRecipe extends Recipe {
  /**
   * Creates a ShapedCraftingRecipe
   * @param {string} path  The path of the recipe file relative to namespace/recipes (excluding the file extension)
   * @param {object} options The configuration of the recipe
   * @param {string[]} options.pattern The 2d grid of items used in the recipe, use strings with a space ' ' to signify an empty slot
   * @param {object} options.key What the characters in the pattern will be replaced with in the crafting grid
   * @param {string} options.result The result of the crafting recipe
   * @param {number} [options.count=1] The amount of the resulting item
   */
  constructor(
    path: string,
    options: { pattern: string[]; key: object; result: string; count?: number }
  ) {
    super(path, "shaped");
    let key;
    for(let k in options.key)key[k]=assumeMinecraft(options.key[k]);
    this.file_contents = {
      type: "minecraft:crafting_shaped",
      pattern: options.pattern,
      key,
      result: {
        item: options.result,
        count: options.count || 1,
      },
    };
  }
}
export {
  Recipe,
  SmeltingRecipe,
  StonecutterRecipe,
  ShapelessCraftingRecipe,
  ShapedCraftingRecipe,
};
