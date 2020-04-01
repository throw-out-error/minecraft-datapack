import fs from "fs";
export function jsonBeautify(object: object | Array<any>): string {
  let json: string[] = JSON.stringify(object).split("");
  let indent: number = 0;
  for (let i: number = 0; i < json.length; i++) {
    let char: string = json[i];
    switch (char) {
      case "{":
      case "[":
        indent++;
        json.splice(i + 1, 0, "\n");
        for (let j: number = 0; j < indent; j++)
          json.splice(i + j + 2, 0, "\t");
        break;
      case "}":
      case "]":
        indent--;
        json.splice(i, 0, "\n");
        for (let j: number = 0; j < indent; j++)
          json.splice(i + j + 1, 0, "\t");
        i += indent + 1;
        break;
      case ",":
        json.splice(i + 1, 0, "\n");
        for (let j: number = 0; j < indent; j++)
          json.splice(i + j + 2, 0, "\t");
        break;
    }
  }
  return json.join("");
}

export function mkdirIfNotExist(path: string) {
  if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
}

export function hasIllegalChars(s: string): boolean {
  return s != s.replace(/[^0-9a-z_\-.]/g, "");
}

export function hasIllegalCharsSlash(s: string): boolean {
  return s != s.replace(/[^0-9a-z_\-./]/g, "");
}

export function itemArrayFromString(s: string): Array<any> {
  return s
    .split("||")
    .map((s) => (s[0] == "#" ? { tag: s.slice(1) } : { item: s }));
}

export function assumeMinecraft(s: string): string {
  return s.includes(":") ? s : `minecraft:${s}`;
}
