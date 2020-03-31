const {hasIllegalCharsSlash,mkdirIfNotExist,jsonBeautify,getDirname,fs,itemArrayFromString}=require("./utility");

class Recipe {
    /**
     * Creates a Recipe
     * @param {string} path  The path of the recipe file relative to namespace/recipes (excluding the file extension)
     * @param {('smelting'|'stonecutting'|'shapless'|'shaped')} type The type of recipe
     */
    constructor(path,type){
        /** @type {string} The type of recipe */
        this.type=type;
        if(hasIllegalCharsSlash(path))throw new Error("The names of recipes can only contain the following characters 0-9, a-z, _, -, ., /");
        /** @type {string} The path of the recipe file relative to namespace/recipes (excluding the file extension) */
        this.path=path;
        /** @type {string} The content of the file when it is compiled */
        this.file_contents={};
    }
    /**
     * Outputs the recipe json file
     * @param {string} path The path of the namespace the recipe will compile to 
     */
    compile(path){
        let recipePath=`${path}/${this.path}.json`
        mkdirIfNotExist(getDirname(recipePath));
        fs.writeFileSync(recipePath,jsonBeautify(this.file_contents));
    }
    /**
     * Creates a copy of the recipe
     * @param {Recipe} recipe 
     */
    static copy(recipe){
        let copy=new Recipe("_",{});
        for(let key in {...recipe})copy[key]=recipe[key];
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
     * @param {('minecraft:smelting'|'minecraft:blasting'|'minecraft:smoking'|'minecraft:campfire_cooking')} [options.type='smelting'] The type of smelting recipe
     * @param {number} [options.cookingtime=200] The amount of time the item has to smelt
     */
    constructor(path,options){
        super(path,'smelting');
        /** @type {string} The contents of the outputted file */
        this.file_contents={
            type:options.type||'minecraft:smelting',
            ingredient: itemArrayFromString(options.ingredient),
            result: options.result,
            experience: options.experience,
            cookingtime: options.cookingtime||200
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
    constructor(path,options){
        super(path,'stonecutting');
        /** @type The contents of the outputted file */
        this.file_contents={
            type:"minecraft:stonecutting",
            ingredient: itemArrayFromString(options.ingredient),
            result: options.result,
            count: options.count||1
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
    constructor(path,options){
        super(path,'shapless');
        /** @type {string} The contents of the outputted file */
        this.file_contents={
            type: "minecraft:crafting_shapeless",
            ingredients: options.ingredients.map(ingredient=>itemArrayFromString(ingredient)),
            result: {
                item: options.result,
                count: options.count||1
            }
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
    constructor(path,options){
        super(path,'shaped')
        this.file_contents={
            type: "minecraft:crafting_shaped",
            pattern: options.pattern,
            key: options.key,
            result: {
                item: options.result,
                count: options.count||1
            }
        };
    }
}
module.exports={
    Recipe,
    SmeltingRecipe,
    StonecutterRecipe,
    ShapelessCraftingRecipe,
    ShapedCraftingRecipe
}