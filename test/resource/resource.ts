import * as fs from "fs";
import * as path from "path";

export const fromFile = (filePath: string) => fs.readFileSync(path.resolve(__dirname, filePath)).toString();

export const jsonFromFile = (filePath: string) => JSON.parse(
  fs.readFileSync(path.resolve(__dirname, filePath)).toString());
