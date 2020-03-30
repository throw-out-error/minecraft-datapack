const fs=require("fs");

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

const recipes=require("./recipes");
const Recipe=recipes.Recipe;
const loot=require("./loot");
const LootTable=loot.LootTable;
const predicate=require("./predicate");
const Tag=require("./tag");

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

module.exports={
    Datapack,
    Namespace,
    Tag,
    recipes,
    loot,
    predicate
};