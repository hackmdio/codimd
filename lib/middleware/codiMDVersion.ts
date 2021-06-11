import * as config from "../config";
import {Request, Response} from "express";

export = function (req: Request, res: Response, next) {
  res.set({
    'CodiMD-Version': config.version
  })
  return next()
}
