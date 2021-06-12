import * as fs from "fs";
import * as path from "path";
import {noop} from 'lodash'

import {Router} from "express";
import formidable from "formidable";
import readChunk from "read-chunk";
import imageType from "image-type";
import mime from "mime-types";

import config from "../config";
import {logger} from "../logger";
import * as response from "../response";

const imageRouter = Router()
export = imageRouter

function checkImageValid(filepath) {
  const buffer = readChunk.sync(filepath, 0, 12)
  /** @type {{ ext: string, mime: string } | null} */
  const mimetypeFromBuf = imageType(buffer)
  const mimeTypeFromExt = mime.lookup(path.extname(filepath))

  return mimetypeFromBuf && config.allowedUploadMimeTypes.includes(mimetypeFromBuf.mime) &&
    mimeTypeFromExt && config.allowedUploadMimeTypes.includes(mimeTypeFromExt)
}

// upload image
imageRouter.post('/uploadimage', function (req, res) {
  const form = new formidable.IncomingForm()

  form.keepExtensions = true

  form.parse(req, function (err, fields, files) {
    if (err || !files.image || !files.image.path) {
      response.errorForbidden(req, res)
    } else {
      if (config.debug) {
        logger.info('SERVER received uploadimage: ' + JSON.stringify(files.image))
      }

      if (!checkImageValid(files.image.path)) {
        return response.errorForbidden(req, res)
      }

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const uploadProvider = require('./' + config.imageUploadType)
      uploadProvider.uploadImage(files.image.path, function (err, url) {
        // remove temporary upload file, and ignore any error
        fs.unlink(files.image.path, noop)
        if (err !== null) {
          logger.error(err)
          return res.status(500).end('upload image error')
        }
        res.send({
          link: url
        })
      })
    }
  })
})
