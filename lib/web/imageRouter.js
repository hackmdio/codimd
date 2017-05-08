'use strict'
var fs = require('fs')
var url = require('url')
var path = require('path')

const Router = require('express').Router
const formidable = require('formidable')
var imgur = require('imgur')

const config = require('../config')
const logger = require('../logger')
const response = require('../response')

const imageRouter = module.exports = Router()

// upload image
imageRouter.post('/uploadimage', function (req, res) {
  var form = new formidable.IncomingForm()

  form.keepExtensions = true

  if (config.imageUploadType === 'filesystem') {
    form.uploadDir = 'public/uploads'
  }

  form.parse(req, function (err, fields, files) {
    if (err || !files.image || !files.image.path) {
      response.errorForbidden(res)
    } else {
      if (config.debug) { logger.info('SERVER received uploadimage: ' + JSON.stringify(files.image)) }

      try {
        switch (config.imageUploadType) {
          case 'filesystem':
            res.send({
              link: url.resolve(config.serverurl + '/', files.image.path.match(/^public\/(.+$)/)[1])
            })

            break

          case 's3':
            var AWS = require('aws-sdk')
            var awsConfig = new AWS.Config(config.s3)
            var s3 = new AWS.S3(awsConfig)
            const {getImageMimeType} = require('../utils')
            fs.readFile(files.image.path, function (err, buffer) {
              if (err) {
                logger.error(err)
                res.status(500).end('upload image error')
                return
              }
              var params = {
                Bucket: config.s3bucket,
                Key: path.join('uploads', path.basename(files.image.path)),
                Body: buffer
              }

              var mimeType = getImageMimeType(files.image.path)
              if (mimeType) { params.ContentType = mimeType }

              s3.putObject(params, function (err, data) {
                if (err) {
                  logger.error(err)
                  res.status(500).end('upload image error')
                  return
                }
                res.send({
                  link: `https://s3-${config.s3.region}.amazonaws.com/${config.s3bucket}/${params.Key}`
                })
              })
            })
            break
          case 'imgur':
          default:
            imgur.setClientId(config.imgur.clientID)
            imgur.uploadFile(files.image.path)
              .then(function (json) {
                if (config.debug) { logger.info('SERVER uploadimage success: ' + JSON.stringify(json)) }
                res.send({
                  link: json.data.link.replace(/^http:\/\//i, 'https://')
                })
              })
              .catch(function (err) {
                logger.error(err)
                return res.status(500).end('upload image error')
              })
            break
        }
      } catch (err) {
        logger.error(err)
        return res.status(500).end('upload image error')
      }
    }
  })
})
