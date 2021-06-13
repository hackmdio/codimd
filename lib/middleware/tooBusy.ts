import {NextFunction, Request, Response} from "express";
import toobusy from "toobusy-js";

import config from "../config";
import * as response from "../response";

toobusy.maxLag(config.responseMaxLag)

export default function (req: Request, res: Response, next: NextFunction): void {
  if (toobusy()) {
    response.errorServiceUnavailable(req, res)
  } else {
    next()
  }
}
