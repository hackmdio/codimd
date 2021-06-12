import * as fs from 'fs'
import * as path from 'path'
import * as config from '../config'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {User} from '../models'
import {logger} from '../logger'
import {Request, Response} from "express";


export async function showIndex(req: Request, res: Response) {
  const isLogin = req.isAuthenticated()
  const deleteToken = ''

  const data = {
    signin: isLogin,
    infoMessage: req.flash('info'),
    errorMessage: req.flash('error'),
    privacyStatement: fs.existsSync(path.join(config.docsPath, 'privacy.md')),
    termsOfUse: fs.existsSync(path.join(config.docsPath, 'terms-of-use.md')),
    deleteToken: deleteToken
  }

  if (!isLogin) {
    return res.render('index.ejs', data)
  }

  const user = await User.findOne({
    where: {
      id: (req.user as any).id
    }
  })
  if (user) {
    data.deleteToken = user.deleteToken
    return res.render('index.ejs', data)
  }

  logger.error(`error: user not found with id ${(req.user as any).id}`)
  return res.render('index.ejs', data)
}
