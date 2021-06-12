import {Router} from "express";
import {wrap} from "./utils";

// load controller
import * as statusController from "./status";

const appRouter = Router()

// register route
appRouter.get('/status', wrap(statusController.getStatus))
appRouter.get('/metrics/codimd', wrap(statusController.getMetrics))

exports.router = appRouter
