"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
exports.fs = fs_1.default;
const path_1 = require("path");
exports.getDirname = path_1.dirname;
function jsonBeautify(object) {
    let json = JSON.stringify(object).split('');
    let indent = 0;
    for (let i = 0; i < json.length; i++) {
        let char = json[i];
        switch (char) {
            case '{':
            case '[':
                indent++;
                json.splice(i + 1, 0, '\n');
                for (let j = 0; j < indent; j++)
                    json.splice(i + j + 2, 0, '\t');
                break;
            case '}':
            case ']':
                indent--;
                json.splice(i, 0, '\n');
                for (let j = 0; j < indent; j++)
                    json.splice(i + j + 1, 0, '\t');
                i += indent + 1;
                break;
            case ',':
                json.splice(i + 1, 0, '\n');
                for (let j = 0; j < indent; j++)
                    json.splice(i + j + 2, 0, '\t');
                break;
        }
    }
    return json.join('');
}
exports.jsonBeautify = jsonBeautify;
function mkdirIfNotExist(path) {
    if (!fs_1.default.existsSync(path))
        fs_1.default.mkdirSync(path, { recursive: true });
}
exports.mkdirIfNotExist = mkdirIfNotExist;
function hasIllegalChars(s) {
    return s != s.replace(/[^0-9a-z_\-\.]/g, "");
}
exports.hasIllegalChars = hasIllegalChars;
function hasIllegalCharsSlash(s) {
    return s != s.replace(/[^0-9a-z_\-\.\/]/g, "");
}
exports.hasIllegalCharsSlash = hasIllegalCharsSlash;
function itemArrayFromString(s) {
    return s.split("||").map(s => s[0] == "#" ? { tag: s.slice(1) } : { item: s });
}
exports.itemArrayFromString = itemArrayFromString;
