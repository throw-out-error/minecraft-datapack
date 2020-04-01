class Command {
    method:string;
    params:Array<Value|string>;
    /**
     * @param {string} method the command to be executed
     * @param {Array<Value|string>} params the parameters to be passed to the command
     */
    constructor(method:string,params:Array<Value|string>){
        this.method=method;
        this.params=params;
    }
    /**
     * Outputs the command as a string
     */
    compile(): string {
        return `${this.method} ${this.params.map(p=>p instanceof Value?p.compile():p).join(" ")}`;
    }
}
class Value {
    suffix:string;
    value:string;
    /**
     * @param {string} type the type of the value
     * @param {any} value the value that will be cast to a string
     */
    constructor(type:'int'|'float'|'double'|'long'|'string',value:any){
        if(['int','float','double','long'].includes(type)){
            this.suffix=type.slice(0,1);
            this.value=value.toString();
        }
        else {
            this.suffix='';
            this.value=`"${value}"`;
        }
    }
    /**
     * Outputs the value as a string
     */
    compile(): string {
        return this.value+this.suffix;
    }
}
export {
    Command,
    Value
}