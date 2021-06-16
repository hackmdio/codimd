import * as fs from "fs";
import * as path from "path";

import Minio from "minio";

import config from "../config";
import {getImageMimeType} from "../utils";
import {logger} from "../logger";

const minioClient = new Minio.Client({
  endPoint: config.minio.endPoint,
  port: config.minio.port,
  useSSL: config.minio.secure,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey
})

export function uploadImage(imagePath: string, callback: (err: Error | null, url?: string) => void): void {
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
      callback(err, null)
      return
    }

    const key = path.join('uploads', path.basename(imagePath))
    const protocol = config.minio.secure ? 'https' : 'http'

    minioClient.putObject(config.s3bucket, key, buffer, buffer.length, {
      ContentType: getImageMimeType(imagePath)
    }, function (err) {
      if (err) {
        callback(err, null)
        return
      }
      const hidePort = [80, 443].includes(config.minio.port)
      const urlPort = hidePort ? '' : `:${config.minio.port}`
      callback(null, `${protocol}://${config.minio.endPoint}${urlPort}/${config.s3bucket}/${key}`)
    })
  })
}
