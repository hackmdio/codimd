'use strict'
import * as path from "path";

import azure from "azure-storage";

import config from "../config";
import {logger} from "../logger";

export function uploadImage(imagePath: string, callback?: (err: Error | null, url ?: string) => void): void {
  if (!imagePath || typeof imagePath !== 'string') {
    callback(new Error('Image path is missing or wrong'), null)
    return
  }

  if (!callback || typeof callback !== 'function') {
    logger.error('Callback has to be a function')
    return
  }

  const azureBlobService = azure.createBlobService(config.azure.connectionString)

  azureBlobService.createContainerIfNotExists(config.azure.container, {publicAccessLevel: 'blob'}, function (err) {
    if (err) {
      callback(new Error(err.message), null)
    } else {
      azureBlobService.createBlockBlobFromLocalFile(config.azure.container, path.basename(imagePath), imagePath, function (err, result) {
        if (err) {
          callback(new Error(err.message), null)
        } else {
          callback(null, azureBlobService.getUrl(config.azure.container, result.name))
        }
      })
    }
  })
}
