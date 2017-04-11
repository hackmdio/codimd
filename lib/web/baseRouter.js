'use strict'

const Router = require('express').Router

const response = require('../response')

const baseRouter = module.exports = Router()

// get index
baseRouter.get('/', response.showIndex)
// get 403 forbidden
baseRouter.get('/403', function (req, res) {
  response.errorForbidden(res)
})
// get 404 not found
baseRouter.get('/404', function (req, res) {
  response.errorNotFound(res)
})
// get 500 internal error
baseRouter.get('/500', function (req, res) {
  response.errorInternalError(res)
})

