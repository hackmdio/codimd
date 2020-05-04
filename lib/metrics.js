'use strict'

const { Router } = require('express')

const { wrap } = require('./utils')

// load controller
const statusController = require('./status')
const appRouter = Router()

// register route
appRouter.get('/status', wrap(statusController.getStatus))
appRouter.get('/metrics/codimd', wrap(statusController.getMetrics))

exports.router = appRouter
