const getDirname=require("path").dirname;
const mkdirIfNotExist=path=>{if(!fs.existsSync(path))fs.mkdirSync(path,{recursive:true});};
const jsonBeautify=require("./jsonBeautify");
const hasIllegalCharsSlash=s=>s!=s.replace(/[^0-9a-z_\-\.\/]/g,"");


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
module.exports=Tag;