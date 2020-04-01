import { getDirname, mkdirIfNotExist, fs, assumeMinecraft } from './utility'
class Function {
  commands: Command[]
  path: string
  /**
   * @param {string} path the path of the file relative to namspace/functions
   */
  constructor(path: string) {
    this.path = path
    this.commands = []
  }
  compile(path: string) {
    let functionPath = `${path}/${this.path}.mcfunction`
    mkdirIfNotExist(getDirname(functionPath))
    fs.writeFileSync(
      functionPath,
      this.commands.map(c => c.compile()).join('\n')
    )
  }
  /**
   * Add a command to the function
   * @param {Command} command the command to be added
   */
  addCommand(command: Command) {
    this.commands.push(command)
    return this
  }
  /**
   * Copies the function
   * @param {Function} funct the function to be copied
   * @returns {Function} a reference to the function
   */
  static copy(funct: Function): Function {
    let copy = new Function('_')
    for (let key in { ...funct }) copy[key] = funct[key]
    return copy
  }
}

class Command {
  method: string
  params: Array<Value | string | Selector>
  /**
   * @param {string} method the command to be executed
   * @param {Array<Value|string|Selector>} params the parameters to be passed to the command
   */
  constructor(method: string, params: Array<Value | string | Selector>) {
    this.method = method
    this.params = params
  }
  /**
   * Outputs the command as a string
   */
  compile(): string {
    return `${this.method} ${this.params
      .map(p => (p instanceof Value || p instanceof Selector ? p.compile() : p))
      .join(' ')}`
  }
}

class Selector {
    target:string;
    filter:{[key:string]:string};
    /**
     * @param {'entity'|'closest player'|'random player'|'self'|'all players'|'e'|'p'|'r'|'s'|'a'} target the target(s) the selctor will pick
     * @param {object} filter the filter to determine whether or not the target or which targets will be selected
     */
    constructor(target:'entity'|'closest player'|'random player'|'self'|'all players'|'e'|'p'|'r'|'s'|'a',filter:{[key:string]:string}={}) {
        switch(target){
            case 'entity':
            case 'e':
                this.target='e'
                break;
            case 'closest player':
            case 'p':
                this.target='p';
                break;
            case 'random player':
            case 'r':
                this.target='r';
                break;
            case 'self':
            case 's':
                this.target='s';
                break;
            case 'all players':
            case 'a':
                this.target='a';
                break;
            default:
                throw new Error(`Invalid selector type ${target}`);
        }
        this.filter=filter;
    }
    /**
     * Outputs the selector as a string
     * @returns {string}
     */
    compile():string{
        return `@${this.target}[${Object.keys(this.filter).map(s=>`${s}=${this.filter[s]}`).join()}]`;
    }
}

class Value {
  type: string
  value: string
  /**
   * @param {string} type the type of the value
   * @param {any} value the value that will be cast to a string
   */
  constructor(
    type: 'int' | 'float' | 'double' | 'long' | 'string',
    value: any
  ) {
    if (['int', 'float', 'double', 'long'].includes(type)) {
      this.type = type
      this.value = value.toString()
    } else {
      this.type = 'string'
      this.value = `"${value}"`
    }
  }
  /**
   * Outputs the value as a string
   */
  compile(): string {
    return (
      this.value +
      (['int', 'float', 'double', 'long'].includes(this.type)
        ? this.type.slice(0, 1)
        : '')
    )
  }
}

class ValueArray {
  type: string
  values: Value[]
  /**
   * @param {string} type the type of array to be created
   * @param {Value[]} values the elements of the array
   */
  constructor(type: string, values?: Value[]) {
    this.type = type
    this.values = values || []
    for (let v of this.values)
      if (v.type != this.type)
        throw new Error(
          `Error: can't pass value of type ${v.type} to value array of type ${this.type}`
        )
  }
  /**
   * Output the value array as a string
   */
  compile(): string {
    return `[${this.values.map(v => v.compile()).join(', ')}]`
  }
}

export { Function, Command, Selector, Value, ValueArray }
