"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Condition {
    /**
     * @param {object} options the configuration of the loot condition
     */
    constructor(options) {
        this.options = options;
    }
    compile() {
        return this.options;
    }
    /**
     * Creates a copy of the loot condition
     * @param {Condition} Condition
     */
    static copy(condition) {
        let copy = new Condition({});
        for (let key in { ...Condition })
            copy[key] = condition[key];
        return copy;
    }
}
exports.Condition = Condition;
class Predicate {
}
