import {NextFunction, Request, Response} from "express";
import * as fs from "fs";
import * as path from "path";

import mime from "mime-types";
import bodyParser from "body-parser";
import {MySequelize} from "./models/baseModel";

export function isSQLite(sequelize: MySequelize): boolean {
  return sequelize.options.dialect === 'sqlite'
}

export function getImageMimeType(imagePath: string): string | boolean {
  return mime.lookup(path.extname(imagePath))
}

export function isRevealTheme(theme: string): string | undefined {
  if (fs.existsSync(path.join(__dirname, '..', 'public', 'build', 'reveal.js', 'css', 'theme', theme + '.css'))) {
    return theme
  }
  return undefined
}

export function wrap<T>(innerHandler: (req?: Request, res?: Response, next?: NextFunction) => Promise<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    innerHandler(req, res)
      .catch(err => next(err));
  }
}

// create application/x-www-form-urlencoded parser
export const urlencodedParser = bodyParser.urlencoded({
  extended: false,
  limit: 1024 * 1024 * 10 // 10 mb
})

// create text/markdown parser
export const markdownParser = bodyParser.text({
  inflate: true,
  type: ['text/plain', 'text/markdown'],
  limit: 1024 * 1024 * 10 // 10 mb
})
