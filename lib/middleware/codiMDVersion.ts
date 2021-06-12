import * as config from "../config";
import {Request, Response} from "express";

export default function (req: Request, res: Response, next) {
  res.set({
    'CodiMD-Version': config.version
  })
  return next()
}
