import {Request, Response} from "express";
import config from "../config";

import {responseError} from "../response";

export function errorForbidden(req: Request, res: Response): void {
  if (req.user) {
    return responseError(res, 403, 'Forbidden', 'oh no.')
  }

  req.flash('error', 'You are not allowed to access this page. Maybe try logging in?')
  res.redirect(config.serverURL + '/')
}

export function errorNotFound(req: Request, res: Response): void {
  responseError(res, 404, 'Not Found', 'oops.')
}

export function errorInternalError(req: Request, res: Response): void {
  responseError(res, 500, 'Internal Error', 'wtf.')
}
