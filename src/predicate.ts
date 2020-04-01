class Condition {
  options: object
  /**
   * @param {object} options the configuration of the loot condition
   */
  constructor(options: object) {
    this.options = options
  }
  compile() {
    return this.options
  }
  /**
   * Creates a copy of the loot condition
   * @param {Condition} Condition
   */
  static copy(condition: Condition) {
    let copy = new Condition({})
    for (let key in { ...Condition }) copy[key] = condition[key]
    return copy
  }
}

export { Condition }
