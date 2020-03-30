const fs=require("fs");
const getDirname=require("path").dirname;

const mkdirIfNotExist=path=>{if(!fs.existsSync(path))fs.mkdirSync(path,{recursive:true});};
const dataCategories=[
    "functions",
    "tags/blocks",
    "tags/items",
    "tags/functions",
    "recipes",
    "loot_tables",
    "predicates"
];
const hasIllegalChars=s=>s!=s.replace(/[^0-9a-z_\-\.]/g,"");
const hasIllegalCharsSlash=s=>s!=s.replace(/[^0-9a-z_\-\.\/]/g,"");
const itemArrayFromString=s=>s.split("||").map(s=>s[0]=="#"?{tag:s.slice(1)}:{item:s});
const jsonBeautify=object=>{
    let json=JSON.stringify(object).split('');
    let indent=0;
    for(let i=0;i<json.length;i++){
        let char=json[i];
        switch(char){
            case '{':
            case '[':
                indent++
                json.splice(i+1,0,'\n');
                for(let j=0;j<indent;j++)json.splice(i+j+2,0,'\t');
                break;
            case '}':
            case ']':
                indent--
                json.splice(i,0,'\n');
                for(let j=0;j<indent;j++)json.splice(i+j+1,0,'\t');
                i+=indent+1
                break;
            case ',':
                json.splice(i+1,0,'\n');
                for(let j=0;j<indent;j++)json.splice(i+j+2,0,'\t');
                break;
        }
    }
    return json.join('');
}

class Datapack {
    /**
     * Creates a datapack
     * @param {string} name The name of the datapack
     * @param {string} path The root path of were the datapack will compile to eg. C:\Users\Ree will cause the datapack to compile to C:\Users\Ree\datapack_name
     * @param {object} options Additional information regarding variable names and the pack.mcmeta file
     * @param {number} [options.foramt=5] The datapack format version
     * @param {string} [options.description=name] The datapack's description
     * @param {string} [options.globalNamespace=A filtered version of the name] The global namespace used for scoreboards, entity tags, data storage, etc. in the datapack. Content in sub folders will use the namespace global_namespace.folder_name
     * @param {string} [options.coreFunctionNamespace="core"] The namespace used for the core functionality of the classes function compiler, used for storing files used for all non-vanilla functionality added to the mcfunctions by the class
     */
    constructor(name,path,options){
        /** @type {string} the name of the datapack */
        this.name=name;
        /** @type {string} the root folder the datapack will compile to */
        this.path=path;
        /** @type {string} the namespace used for scoreboards, entity tags, data storage, etc. in the datapack */
        this.globalNamespace=options.globalNamespace||name.toLowerCase().replace(/\s/g,"_").replace(/[^0-9a-z_\-\.]/g,"");
        /** @type {number} the format version of the datapack */
        this.format=options.format||5;
        /** @type {string} the description of the datapack */
        this.description=options.description||this.name;
        /** @type {string} the name of the core namespace for functions */
        if(hasIllegalChars(options.coreFunctionNamespace||""))throw new Error("Namespace names can only contain the following characters 0-9, a-z, _, -, .");
        this.coreFunctionNamespace=options.coreFunctionNamespace||'core';
        /** @type {Namespace} the datapacks minecraft folder */
        this.minecraft=new (class Minecraft extends Namespace{
            constructor(){
                super("minecraft_namespace");
                this.name="minecraft";
            }
        })();
        /** @type {Namespace[]} the namespaces the datapack will use */
        this.namespaces={};
    }
    /**
     * Output the files of the datapack
     */
    compile(){
        mkdirIfNotExist(`${this.path}/${this.name}/data`);
        fs.writeFileSync(`${this.path}/${this.name}/pack.mcmeta`,`{\n\t"pack":{\n\t\t"pack_format":${this.format},\n\t\t"description":${JSON.stringify(this.description)}\n\t}\n}`);
        this.minecraft.compile(`${this.path}/${this.name}`);
        for(let namespace in this.namespaces)this.namespaces[namespace].compile(`${this.path}/${this.name}`);
    }
    /**
     * Add a namespace to the datapack, minecraft is added by default this.minecraft
     * @param {Namespace} namespace The namespace to be added
     * @returns {Namespace} a reference to the added namespace
     */
    addNamespace(namespace){
        if(this.namespaces.hasOwnProperty(namespace.name))throw new Error(`The namespace ${namespace.name} has already been added to this datapack`);
        let copy=Namespace.copy(namespace);
        this.namespaces[namespace.name]=copy;
        return copy;
    }
    /**
     * Creates a namespace and appends it to the datapack
     * @param {string} name The name of the namespace
     * @returns {Namespace} a reference to the created namespace 
     */
    createNamespace(name){
        let namespace=new Namespace(name)
        this.addNamespace(namespace);
        return namespace
    }
    /**
     * Removes the namespace from the datapack
     * @param {string} name The name of the namespace 
     */
    deleteNamespace(name){
        delete this.namespaces[name];
    }
}

class Namespace {
    /**
     * Creates a namespace
     * @param {string} name The name of the namespace
     */
    constructor(name){
        if(hasIllegalChars(name))throw new Error("Namespace names can only contain the following characters 0-9, a-z, _, -, .");
        if(name=="minecraft")throw new Error("The Datapack class creates the minecraft namespace by default, datapack.minecraft, adding it a second time will cause it to be overridden")
        /** @type {string} the name of the namespace */
        this.name=name;
        /** @type {object} the dictionary of block tag files */
        this.blockTags={};
        /** @type {object} the dictionary of item tag files */
        this.itemTags={};
        /** @type {object} the dictionary of function tag files */
        this.functionTags={};
        /** @type {object} the dictionary of recipe files */
        this.recipes={};
        /** @type {object} the dictionary of loot table files */
        this.lootTables={};
    }
    /**
     * Outputs the namespace's files
     * @param {string} path The root path where the namespace will compile
     */
    compile(path){
        let namespacePath=`${path}/data/${this.name}`
        mkdirIfNotExist(namespacePath);
        dataCategories.forEach(category=>{
            mkdirIfNotExist(`${namespacePath}/${category}`);
        });
        ['block','item','function'].forEach(type=>{
            for(let tag in this[`${type}Tags`])this[`${type}Tags`][tag].compile(`${namespacePath}/tags`);
        });
        for(let recipe in this.recipes)this.recipes[recipe].compile(`${namespacePath}/recipes`);
        for(let table in this.lootTables)this.lootTables[table].compile(`${namespacePath}/loot_tables`);
    }
    /**
     * Add a tag to the namespace
     * @param {Tag} tag The tag to be added
     * @returns {Tag} a reference to the added tag 
     */
    addTag(tag){
        if(this[`${tag.type}Tags`].hasOwnProperty(tag.path))throw new Error(`The tag ${tag.type}/${tag.path} has already been added to this namespace`);
        let copy=Tag.copy(tag);
        this[`${tag.type}Tags`][tag.path]=copy;
        return copy;
    }
    /**
     * Create a tag and add it to the namespace
     * @param {string} path The path of the tag file relative to namespace/tags/type (excluding the file extension)
     * @param {('block'|'item'|'function')} type The type of tag
     * @param {string[]} [values=[]] 
     * @returns {Tag} a reference to the created tag
     */
    createTag(path,type,values){
        let tag=new Tag(path,type,values||[]);
        this.addTag(tag);
        return tag;
    }
    /**
     * Delete a tag
     * @param {string} path The path of the tag file relative to namespace/tags/type (excluding the file extension) to be deleted
     * @param {('block'|'item'|'function')} type The type of tag to be deleted
     */
    deleteTag(path,type){
        delete this.tags[`${type}/${path}`];
    }
    /**
     * Add a recipe to the namespace
     * @param {Recipe} recipe The recipe to be added
     * @returns {Recipe} a reference to the added recipe
     */
    addRecipe(recipe){
        if(this.recipes.hasOwnProperty(recipe.path))throw new Error(`The recipe ${recipe.path} has already been added to this namespace`)
        let copy=Recipe.copy(recipe);
        this.recipes[recipe.path]=copy;
        return copy;
    }
    /**
     * Delete a recipe
     * @param {string} path The path of the recipe file relative to namespace/recipes (excluding the file extension) to be deleted
     */
    deleteRecipe(path){
        delete this.recipes[path];
    }
    /**
     * Add a loot table to the namespace
     * @param {LootTable} lootTable The loot table to be added
     * @returns {LootTable} a reference to the added loot table
     */
    addLootTable(lootTable){
        if(this.lootTables.hasOwnProperty(lootTable.path))throw new Error(`This name space already has the loot table ${path}`);
        let copy=LootTable.copy(lootTable);
        this.lootTables[lootTable.path]=copy;
        return copy;
    }
    /**
     * Create a loot table then add it to the namespace
     * @param {string} path the path of the loot table to be created 
     * @returns {LootTable} a reference to the created pool
     */
    createLootTable(path){
        let lootTable=new LootTable(path)
        this.addLootTable(lootTable);
        return lootTable;
    }
    /**
     * Creates a copy of the namespace
     * @param {Namespace} namespace the namespace to be copied
     * @returns {Namespace} a copy of the namespace
     */
    static copy(namespace){
        let copy=new Namespace("_");
        for(key in {...namespace})copy[key]=namespace[key];
        return copy;
    }
}

class Tag {
    /**
     * Creates a tag
     * @param {string} path The path of the tag file relative to namspace/tags/type (excluding the file extension)
     * @param {('block'|'item'|'function')} type The type of tag
     * @param {string[]} [values=[]] the values in the tag
     */
    constructor(path,type,values){
        if(hasIllegalCharsSlash(path))throw new Error("The names of tags can only contain the following characters 0-9, a-z, _, -, ., /")
        /** @type {string} the path the tag will output to, eg. "fun/red" would point to tags/type/fun/red */
        this.path=path;
        if(!['block','item','function'].includes(type))throw new Error(`${type} is not a valid tag type`);
        /** @type {string} the type of tag it is */
        this.type=type;
        /** @type {string[]} the values of the tag */
        this.values=values||[];
    }
    /**
     * Outputs the tag file
     * @param {string} path The path of the namespace where the file will compile to
     */
    compile(path){
        let tagPath=`${path}/${this.type}s/${this.path}.json`
        mkdirIfNotExist(getDirname(tagPath));
        fs.writeFileSync(tagPath,jsonBeautify({values:this.values}));
    }
    /**
     * Adds a value to the tag
     * @param {string} value the value to be added
     */
    addValue(value){
        this.values.push(value);
    }
    /**
     * Removes a value from the tag
     * @param {string} value the value to be removed
     */
    deleteValue(value){
        while(this.values.indexOf(value)+1){
            this.values.splice(this.values.indexOf(value));
        }
    }
    /**
     * Returns a copy of the tag
     * @param {Tag} tag the tag to be copied 
     * @returns {Tag} the copy of the tag
     */
    static copy(tag){
        let copy=new Tag("_","block");
        for(let key in {...tag})copy[key]=tag[key];
        return copy;
    }
}

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

class LootTable {
    /**
     * Creates a LootTable
     * @param {string} path The path of the loot table file relative to namespace/loot_tables (excluding the file extension)
     */
    constructor(path){
        /** @type {string} The path of the loot table file relative to namespace/loot_tables */
        this.path=path;
        /** @type {LootPool[]} The loot tables list of pools */
        this.pools=[];
    }
    /**
     * Outputs the loot table file
     * @param {string} path The root path for the loot table to compile to
     */
    compile(path){
        let tablePath=`${path}/${this.path}.json`;
        mkdirIfNotExist(getDirname(tablePath));
        fs.writeFileSync(tablePath,jsonBeautify({pools:this.pools.map(pool=>pool.compile())}));
    }
    /**
     * Appends a pool to the table
     * @param {LootPool} lootPool the loot pool to be added
     * @returns {LootPool} a reference to the added pool
     */
    addPool(lootPool){
        let copy=LootPool.copy(lootPool);
        this.pools.push(copy);
        return copy;
    }
    /**
     * Remove one of the loot pools from the table
     * @param {number} index The index of the pool to be deleted
     */
    deletePool(index){
        this.pools.splice(index);
    }
    /**
     * Creates a loot pool and adds it to the loot table
     * @param {object} options The configuration for the pool
     * @param {(object|number)} options.rolls The range of the amount of entries the pool will choose
     * @param {number} options.rolls.min The minimum amount of entries chosen
     * @param {number} options.rolls.max The maximum amount of entries chosen
     * @param {(object|number)} options.bonusRolls The range of the amount of bonus rolls due to luck (it get's multiplied by the players generic.luck attribute)
     * @param {number} options.bonusRolls.min The minimum amount of bonus rolls (it get's multiplied by the players generic.luck attribute)
     * @param {number} options.bonusRolls.max The maximum amount of bonus rolls (it get's multiplied by the players generic.luck attribute)
     * @returns {LootPool} a reference to the added loot pool
     */
    createPool(options){
        let pool=new LootPool(options);
        this.addPool(pool);
        return pool;
    }
    /**
     * Creates a copy of the loot table
     * @param {LootTable} lootTable 
     */
    static copy(lootTable){
        let copy=new LootTable("_");
        for(key in {...lootTable})copy[key]=lootTable[key];
        return copy;
    }
}

class LootPool {
    /**
     * Creates a LootPool
     * @param {object} options The configuration for the pool
     * @param {number} options.rolls The range of the amount of entries the pool will choose
     * @param {object} options.rolls A range of entries the pool will choose
     * @param {number} options.rolls.min The minimum amount of entries chosen
     * @param {number} options.rolls.max The maximum amount of entries chosen
     * @param {number} options.bonusRolls The amount of bonus rolls due to luck (it get's multiplied by the players generic.luck attribute)
     * @param {object} options.bonusRolls The range of bonus rolls due to luck (it get's multiplied by the players generic.luck attribute)
     * @param {number} options.bonusRolls.min The minimum amount of bonus rolls (it get's multiplied by the players generic.luck attribute)
     * @param {number} options.bonusRolls.max The maximum amount of bonus rolls (it get's multiplied by the players generic.luck attribute)
     */
    constructor(options){
        /** @type {(object|number)} the amount of rolls the pool will have in the table */
        this.rolls=options.rolls;
        /** @type {(object|number)} the amount of bonus rolls the pool will have in the table */
        this.bonusRolls=options.bonusRolls;
        /** @type {LootEntry[]} an array of the pools entries*/
        this.entries=[];
        /** @type {LootCondition[]} an array of the pools conditions */
        this.conditions=[];
    }
    /**
     * Generates the data associated with the pool
     * @returns {object|array} the generated json
     */
    compile(){
        return {
            rolls:this.rolls,
            bonus_rools:this.bonusRolls,
            entries:this.entries.map(entry=>entry.compile()),
            conditions:this.conditions.map(condition=>condition.compile())
        };
    }
    /**
     * Adds an entry to the loot pool
     * @param {LootEntry} entry the entry to be added to the pool
     * @returns {LootEntry} returns a reference to the added loot entry
     */
    addEntry(entry){
        let copy=LootEntry.copy(entry)
        this.entries.push(copy);
        return copy;
    }
    /**
     * Adds a condition to the loot pool
     * @param {Condition} condition the condition to be added to the pool
     * @returns {Condition} returns a reference to the added condition
     */
    addCondition(condition){
        let copy=Condition.copy(condition)
        this.conditions.push(copy);
        return copy;
    }
    /**
     * Creates a copy of the loot pool
     * @param {LootPool} lootPool
     * @returns {LootPool} a copy of the loot pool 
     */
    static copy(lootPool){
        let copy=new LootPool({});
        for(key in {...lootPool})copy[key]=lootPool[key];
        return copy;
    }
}

class LootEntry {
    /**
     * Creates a LootEntry
     * @param {('minecraft:item'|'minecraft:loot_table'|'minecraft:empty')} type the type of loot entry 
     */
    constructor(type){
        /** @type {('minecraft:item'|'minecraft:loot_table'|'minecraft:empty')} the type of loot entry*/
        this.type=type;
        /** @type {LootCondition[]} the conditions of the entry */
        this.conditions=[];
    }
    /**
     * Generates the data associated with the entry
     * @returns {object|array} the generated json
     */
    compile(){
        return {type:this.type,conditions:this.conditions.map(condition=>condition.compile())};
    }
    /**
     * Adds a condition to the loot pool
     * @param {Condition} condition the condition to be added to the pool
     * @returns {Condition} returns a reference to the added condition
     */
    addCondition(condition){
        let copy=Condition.copy(condition)
        this.conditions.push(copy);
        return copy;
    }
    /**
     * Creates a copy of the loot entry
     * @param {LootEntry} lootEntry
     * @returns {LootEntry} a copy of the loot entry 
     */
    static copy(lootEntry){
        let copy=new LootEntry(lootEntry.type);
        for(key in {...lootEntry})copy[key]=lootEntry[key];
        return copy;
    }
}

class ItemEntry extends LootEntry {
    /**
     * Creates an ItemEntry
     * @param {object} options the configuration for the item entry
     * @param {string} options.name the name of the item in the entry
     * @param {number} [options.weight=1] the chance of this entry being picked from the pool proportional to the sum of all the entries weights in the pool
     * @param {number} [options.quality=1.0] the quality of the entry, the final weight of the entry = weight+quality*generic.luck
     */
    constructor(options){
        super('minecraft:item');
        this.output={...this.output,...{name:options.name,weight:options.weight}};
        /** @type {LootFunction[]} the entries array of functions */
        this.functions=[];
    }
    /**
     * Adds a function to the item entry
     * @param {LootFunction} lootFunction the function to be added 
     */
    addFunction(lootFunction){
        this.functions.push(lootFunction);
    }
    /**
     * Creates a function and adds it to the item entry
     * @param {object} options the configuration of the function to be added
     * @returns {LootFunction} the loot function created
     */
    createFunction(options){
        let funct=new LootFunction(options);
        this.functions.push(funct);
        return funct;
    }
    /**
     * Generates the data associated with the item entry
     * @returns {object|array} the generated json
     */
    compile(){
        return {...this.output,...{functions:this.functions.map(f=>f.compile())}};
    }
}

class EmptyEntry extends LootEntry {
    /**
     * Creates an EmptyEntry
     * @param {object} options the configuration for the empty entry
     * @param {number} [options.weight=1] the chance of this entry being picked from the pool proportional to the sum of all the entries weights in the pool
     * @param {number} [options.quality=1.0] the quality of the entry, the final weight of the entry = weight+quality*generic.luck
     */
    constructor(options){
        super('minecraft:empty');
        this.output={...this.output,...{weight:options.weight||1,quality:options.quality||1}};
    }
}

class LootTableEntry extends LootEntry {
    /**
     * Creates a LootTableEntry
     * @param {object} options the configuration of the loot table entry
     * @param {string} options.name the name of the loot table the entry will use. recursion will be blocked(if a loot table points to it's self then the loot table is selected it won't generate items)
     * @param {number} [options.weight=1] the chance of this entry being picked from the pool proportional to the sum of all the entries weights in the pool
     * @param {number} [options.quality=1.0] the quality of the entry, the final weight of the entry = weight+quality*generic.luck
     */
    constructor(options){
        super("minecraft:loot_table");
        this.output={...this.output,...{weight:options.weight||1,quality:options.quality||1}}
    }
}

class LootFunction {
    /**
     * Creates a LootFunction
     * @param {object} options the configuration of the loot function
     */
    constructor(options){
        /** @type {object} the configuration of the function */
        this.options=options;
        /** @type {LootCondition[]} */
        this.conditions=[];
    }
    /**
     * Generates the data associated with the function
     * @returns {object|array} the generated json
     */
    compile(){
        return {...this.options,...{condition:this.conditions.map(condition=>condition.compile())}}
    }
    /**
     * Adds a condition to the loot pool
     * @param {Condition} condition the condition to be added to the pool
     * @returns {Condition} returns a reference to the added condition
     */
    addCondition(condition){
        let copy=Condition.copy(condition)
        this.conditions.push(copy);
        return copy;
    }
    /**
     * Creates a copy of the loot function
     * @param {LootFunction} lootFunction
     * @returns {LootFunction} a copy of the loot function 
     */
    static copy(lootFunction) {
        let copy=new lootFunction({});
        for(key in {...lootFunction})copy[key]=lootFunction[key];
        return copy;
    }
}

class Condition {
    /**
     * @param {object} options the configuration of the loot condition
     */
    constructor(options){
        this.options=options;
    }
    compile(){
        return this.options;
    }
    /**
     * Creates a copy of the loot condition
     * @param {LootCondition} lootCondition 
     */
    static copy(lootCondition){
        let copy=new lootCondition({});
        for(key in {...lootFunction})copy[key]=lootFunction[key];
        return copy;
    }
}

module.exports={
    Datapack,
    Namespace,
    Tag,
    recipes:{
        SmeltingRecipe,
        StonecutterRecipe,
        ShapelessCraftingRecipe,
        ShapedCraftingRecipe,
        Recipe
    },
    loot:{
        LootTable,
        LootPool,
        ItemEntry,
        EmptyEntry,
        LootTableEntry,
        LootEntry,
        LootFunction
    },
    predicate:{
        Condition
    }
};