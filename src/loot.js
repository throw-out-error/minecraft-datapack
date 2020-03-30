const getDirname=require("path").dirname;
const mkdirIfNotExist=path=>{if(!fs.existsSync(path))fs.mkdirSync(path,{recursive:true});};
const jsonBeautify=require("./jsonBeautify");

const Condition=require("./predicate").Condition;

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
        /** @type {Condition[]} an array of the pools conditions */
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
        /** @type {Condition[]} the conditions of the entry */
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
        /** @type {Condition[]} */
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
module.exports={
    LootTable,
    LootPool,
    LootEntry,
    ItemEntry,
    EmptyEntry,
    LootTableEntry,
    LootFunction
}