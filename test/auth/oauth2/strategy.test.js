/* eslint-env node, mocha */
'use strict'

const assert = require('assert')
const chance = require('chance')()

const { extractProfileAttribute } = require('../../../lib/auth/oauth2/strategy')

describe('OAuth2CustomStrategy', function () {
  describe('#extractProfileAttribute', function () {
    const data = {
      user: {
        email: chance.email()
      },
      arrayData: [
        {
          email: chance.email()
        },
        {
          email: chance.email()
        }
      ]
    }

    it('should parse normal attribute correctly', function () {
      assert(extractProfileAttribute(data, 'user.email') === data.user.email)
    })

    it('should return undefined when nested object key not exists', function () {
      assert(extractProfileAttribute(data, 'user.profile') === undefined)
    })

    it('should return undefined when whole object key not exists', function () {
      assert(extractProfileAttribute(data, 'profile.email') === undefined)
    })

    it('should return attribute in array correct', function () {
      assert(extractProfileAttribute(data, 'arrayData[0].email') === data.arrayData[0].email)
      assert(extractProfileAttribute(data, 'arrayData[1].email') === data.arrayData[1].email)
    })

    it('should return undefined when array index out of bound', function () {
      assert(extractProfileAttribute(data, 'arrayData[3].email') === undefined)
    })

    it('should return undefined when array key not exists', function () {
      assert(extractProfileAttribute(data, 'notExistsArray[5].email') === undefined)
    })

    it('should return undefined when data is undefined', function () {
      assert(extractProfileAttribute(undefined, 'email') === undefined)
      assert(extractProfileAttribute(null, 'email') === undefined)
      assert(extractProfileAttribute({}, 'email') === undefined)
    })
  })
})
