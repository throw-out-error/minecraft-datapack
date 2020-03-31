import {hasIllegalCharsSlash,mkdirIfNotExist,jsonBeautify,getDirname,fs} from"./utility";
import {Condition} from "./predicate";

class LootTable {
    path:string;
    pools:LootPool[];
    /**
     * Creates a LootTable
     * @param {string} path The path of the loot table file relative to namespace/loot_tables (excluding the file extension)
     */
    constructor(path:string){
        if(hasIllegalCharsSlash(path))throw new Error("The names of loot tables can only contain the following characters 0-9, a-z, _, -, ., /");
        /** @type {string} The path of the loot table file relative to namespace/loot_tables */
        this.path=path;
        /** @type {LootPool[]} The loot tables list of pools */
        this.pools=[];
    }
    /**
     * Outputs the loot table file
     * @param {string} path The root path for the loot table to compile to
     */
    compile(path:string) {
        let tablePath=`${path}/${this.path}.json`;
        mkdirIfNotExist(getDirname(tablePath));
        fs.writeFileSync(tablePath,jsonBeautify({pools:this.pools.map(pool=>pool.compile())}));
    }
    /**
     * Appends a pool to the table
     * @param {LootPool} lootPool the loot pool to be added
     * @returns {LootPool} a reference to the added pool
     */
    addPool(lootPool:LootPool): LootPool {
        let copy=LootPool.copy(lootPool);
        this.pools.push(copy);
        return copy;
    }
    /**
     * Remove one of the loot pools from the table
     * @param {number} index The index of the pool to be deleted
     */
    deletePool(index:number){
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
    createPool(options:{rolls:{min:number,max:number}|number,bonusRolls:{min:number,max:number}|number}): LootPool {
        let pool=new LootPool(options);
        this.addPool(pool);
        return pool;
    }
    /**
     * Creates a copy of the loot table
     * @param {LootTable} lootTable 
     */
    static copy(lootTable: LootTable):LootTable{
        let copy=new LootTable("_");
        for(let key in {...lootTable})copy[key]=lootTable[key];
        return copy;
    }
}

class LootPool {
    rolls:{min:number,max:number}|number;
    bonusRolls:{min:number,max:number}|number;
    entries:LootEntry[];
    conditions:Condition[];
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
            bonus_rolls:this.bonusRolls,
            entries:this.entries.map(entry=>entry.compile()),
            conditions:this.conditions.map(condition=>condition.compile())
        };
    }
    /**
     * Adds an entry to the loot pool
     * @param {LootEntry} entry the entry to be added to the pool
     * @returns {LootEntry} returns a reference to the added loot entry
     */
    addEntry(entry:LootEntry):LootEntry{
        let copy=LootEntry.copy(entry)
        this.entries.push(copy);
        return copy;
    }
    /**
     * Adds a condition to the loot pool
     * @param {Condition} condition the condition to be added to the pool
     * @returns {Condition} returns a reference to the added condition
     */
    addCondition(condition:Condition):Condition{
        let copy=Condition.copy(condition)
        this.conditions.push(copy);
        return copy;
    }
    /**
     * Creates a copy of the loot pool
     * @param {LootPool} lootPool
     * @returns {LootPool} a copy of the loot pool 
     */
    static copy(lootPool:LootPool):LootPool{
        let copy=new LootPool({});
        for(let key in {...lootPool})copy[key]=lootPool[key];
        return copy;
    }
}

class LootEntry {
    type:'minecraft:item'|'minecraft:loot_table'|'minecraft:empty';
    conditions:Condition[];
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
    compile(): object {
        return {type:this.type,conditions:this.conditions.map(condition=>condition.compile())};
    }
    /**
     * Adds a condition to the loot pool
     * @param {Condition} condition the condition to be added to the pool
     * @returns {Condition} returns a reference to the added condition
     */
    addCondition(condition:Condition):Condition{
        let copy=Condition.copy(condition)
        this.conditions.push(copy);
        return copy;
    }
    /**
     * Creates a copy of the loot entry
     * @param {LootEntry} lootEntry
     * @returns {LootEntry} a copy of the loot entry 
     */
    static copy(lootEntry:LootEntry):LootEntry{
        let copy=new LootEntry(lootEntry.type);
        for(let key in {...lootEntry})copy[key]=lootEntry[key];
        return copy;
    }
}

class ItemEntry extends LootEntry {
    output:object;
    functions:LootFunction[];
    /**
     * Creates an ItemEntry
     * @param {object} options the configuration for the item entry
     * @param {string} options.name the name of the item in the entry
     * @param {number} [options.weight=1] the chance of this entry being picked from the pool proportional to the sum of all the entries weights in the pool
     * @param {number} [options.quality=1.0] the quality of the entry, the final weight of the entry = weight+quality*generic.luck
     */
    constructor(options){
        super('minecraft:item');
        /** @typedef {object} */
        this.output={name:options.name,weight:options.weight};
        /** @type {LootFunction[]} the entries array of functions */
        this.functions=[];
    }
    /**
     * Adds a function to the item entry
     * @param {LootFunction} lootFunction the function to be added 
     */
    addFunction(lootFunction:LootFunction){
        this.functions.push(lootFunction);
    }
    /**
     * Creates a function and adds it to the item entry
     * @param {object} options the configuration of the function to be added
     * @returns {LootFunction} the loot function created
     */
    createFunction(options:object):LootFunction{
        let funct=new LootFunction(options);
        this.functions.push(funct);
        return funct;
    }
    /**
     * Generates the data associated with the item entry
     * @returns {object|array} the generated json
     */
    //REEE
    compile():object {
        return {...this.output,...{functions:this.functions.map(f=>f.compile())}};
    }
}

class EmptyEntry extends LootEntry {
    output:object;
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
    output:object;
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
    options:object;
    conditions:Condition[];
    /**
     * Creates a LootFunction
     * @param {object} options the configuration of the loot function
     */
    constructor(options:object){
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
    addCondition(condition:Condition):Condition{
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
        for(let key in {...lootFunction})copy[key]=lootFunction[key];
        return copy;
    }
}
export {
    LootTable,
    LootPool,
    LootEntry,
    ItemEntry,
    EmptyEntry,
    LootTableEntry,
    LootFunction
}