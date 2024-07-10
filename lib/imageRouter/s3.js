'use strict'
const fs = require('fs')
const path = require('path')

const config = require('../config')
const { getImageMimeType } = require('../utils')
const logger = require('../logger')

const { S3Client } = require('@aws-sdk/client-s3-node/S3Client')
const { PutObjectCommand } = require('@aws-sdk/client-s3-node/commands/PutObjectCommand')

const credentials = {
  accessKeyId: config.s3.accessKeyId,
  secretAccessKey: config.s3.secretAccessKey
}

const s3 = new S3Client({
  credentials,
  region: config.s3.region,
  endpoint: config.s3.endpoint
})

exports.uploadImage = function (imagePath, callback) {
  if (!imagePath || typeof imagePath !== 'string') {
    callback(new Error('Image path is missing or wrong'), null)
    return
  }

  if (!callback || typeof callback !== 'function') {
    logger.error('Callback has to be a function')
    return
  }

  fs.readFile(imagePath, function (err, buffer) {
    if (err) {
      callback(new Error(err), null)
      return
    }
    const params = {
      Bucket: config.s3bucket,
      Key: path.join('uploads', path.basename(imagePath)),
      Body: buffer,
      ACL: 'public-read'
    }
    const mimeType = getImageMimeType(imagePath)
    if (mimeType) { params.ContentType = mimeType }

    const command = new PutObjectCommand(params)

    s3.send(command).then(data => {
      // default scheme settings to https
      let s3Endpoint = 'https://s3.amazonaws.com'
      if (config.s3.region && config.s3.region !== 'us-east-1') {
        s3Endpoint = `s3-${config.s3.region}.amazonaws.com`
      }
      // rewrite endpoint from config
      if (config.s3.endpoint) {
        s3Endpoint = config.s3.endpoint
      }
      if (config.s3.baseURL) {
        callback(null, `${config.s3.baseURL}/${params.Key}`)
      } else {
        callback(null, `${s3Endpoint}/${config.s3bucket}/${params.Key}`)
      }
    }).catch(err => {
      if (err) {
        callback(new Error(err), null)
      }
    })
  })
}
