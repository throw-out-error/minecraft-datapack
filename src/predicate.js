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

class Predicate {

}

module.exports={
    Condition
}