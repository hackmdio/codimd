import * as toobusy from "toobusy-js";

import * as config from "../config";
import * as response from "../response";

toobusy.maxLag(config.responseMaxLag)

export default function (req, res, next) {
  if (toobusy()) {
    response.errorServiceUnavailable(req, res)
  } else {
    next()
  }
}
