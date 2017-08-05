'use strict'

const path = require('path')
const assert = require('assert')

const ConfigBuilder = require('../lib/config/ConfigBuilder')

let configBuilder = new ConfigBuilder().SetConfigFile(path.join(__dirname, 'artifacts/config01.json'))

let testConfig = configBuilder.SetEnv('test').Build();
let devConfig = configBuilder.SetEnv('development').Build();
let prodConfig = configBuilder.SetEnv('production').Build();

assert(testConfig.port === 3001, 'test Config is not ok')
assert(devConfig.port === 3002, 'dev Config is not ok')
assert(prodConfig.port === 3003, 'prod Config is not ok')

