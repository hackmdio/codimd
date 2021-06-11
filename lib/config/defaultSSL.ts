import * as fs from "fs";

function getFile(path) {
  if (fs.existsSync(path)) {
    return path
  }
  return undefined
}

const defaultSSLConfig = {
  sslKeyPath: getFile('/run/secrets/key.pem'),
  sslCertPath: getFile('/run/secrets/cert.pem'),
  sslCAPath: getFile('/run/secrets/ca.pem') !== undefined ? [getFile('/run/secrets/ca.pem')] : [],
  dhParamPath: getFile('/run/secrets/dhparam.pem')
}

export = defaultSSLConfig
