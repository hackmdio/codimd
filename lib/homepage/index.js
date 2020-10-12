'use strict'

const fs = require('fs')
const path = require('path')
const config = require('../config')
const { User } = require('../models')
const logger = require('../logger')

exports.showIndex = async (req, res) => {
  const isLogin = req.isAuthenticated()
  const deleteToken = ''
  const templateFile = config.homeTemplatePath || 'index.ejs'

  const data = {
    signin: isLogin,
    infoMessage: req.flash('info'),
    errorMessage: req.flash('error'),
    privacyStatement: fs.existsSync(path.join(config.docsPath, 'privacy.md')),
    termsOfUse: fs.existsSync(path.join(config.docsPath, 'terms-of-use.md')),
    deleteToken: deleteToken
  }

  if (!isLogin) {
    return res.render(templateFile, data)
  }

  const user = await User.findOne({
    where: {
      id: req.user.id
    }
  })
  if (user) {
    data.deleteToken = user.deleteToken
    return res.render(templateFile, data)
  }

  logger.error(`error: user not found with id ${req.user.id}`)
  return res.render(templateFile, data)
}
