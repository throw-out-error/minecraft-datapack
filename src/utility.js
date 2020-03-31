const fs=require("fs");
module.exports={
    jsonBeautify:object=>{
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
    },
    getDirname:require("path").dirname,
    mkdirIfNotExist:path=>{if(!fs.existsSync(path))fs.mkdirSync(path,{recursive:true});},
    hasIllegalChars:s=>s!=s.replace(/[^0-9a-z_\-\.]/g,""),
    hasIllegalCharsSlash:s=>s!=s.replace(/[^0-9a-z_\-\.\/]/g,""),
    itemArrayFromString:s=>s.split("||").map(s=>s[0]=="#"?{tag:s.slice(1)}:{item:s}),
    fs
}