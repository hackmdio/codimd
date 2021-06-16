import {Application, NextFunction, Request, Response} from "express";
import {promisify} from "util";

import request from "request";

import {logger} from "../../logger";
import config from "../../config";

let lastCheckAt

const VERSION_CHECK_ENDPOINT = 'https://evangelion.codimd.dev/'
const CHECK_TIMEOUT = 1000 * 60 * 60 * 24 // 1 day

const rp = promisify(request)

/**
 * @param {Express.Application|Express.Request} ctx
 */
export async function checkVersion(ctx: Request | Application):Promise<void> {
  if (lastCheckAt && (lastCheckAt + CHECK_TIMEOUT > Date.now())) {
    return
  }

  // update lastCheckAt whether the check would fail or not
  lastCheckAt = Date.now()

  try {
    const {statusCode, body: data} = await rp({
      url: `${VERSION_CHECK_ENDPOINT}?v=${config.version}`,
      method: 'GET',
      json: true,
      timeout: 3000
    })

    if (statusCode !== 200 || data.status === 'error') {
      logger.warn('Version check failed.')
      return
    }

    const locals = ctx.locals ? ctx.locals : (ctx as Request).app.locals

    locals.versionInfo.latest = data.latest
    locals.versionInfo.versionItem = data.latest ? null : data.versionItem

    if (!data.latest) {
      const {version, link} = data.versionItem

      logger.info(`Your CodiMD version is out of date! The latest version is ${version}. Please see what's new on ${link}.`)
    }
  } catch (err) {
    // ignore and skip version check
    logger.warn('Version check failed.')
    logger.warn(err)
  }
}

export function versionCheckMiddleware(req: Request, res: Response, next: NextFunction): void {
  checkVersion(req)
    .then(() => {
      next()
    })
    .catch((err) => {
      logger.error(err)
      next()
    })
}
