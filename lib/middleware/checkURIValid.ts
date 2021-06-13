import {NextFunction, Request, Response} from "express";
import {logger} from '../logger'
import * as response from "../response";

export default function (req: Request, res: Response, next: NextFunction): void {
  try {
    decodeURIComponent(req.path)
  } catch (err) {
    logger.error(err)
    return response.errorBadRequest(req, res)
  }
  next()
}
