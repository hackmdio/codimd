/* eslint-env node, mocha */

'use strict'

const assert = require('assert')
const mock = require('mock-require')

describe('generateAvatarURL() gravatar enabled', function () {
  let avatars
  beforeEach(function () {
    // Reset config to make sure we don't influence other tests
    const testconfig = {
      allowGravatar: true,
      serverURL: 'http://localhost:3000',
      port: 3000
    }
    mock('../lib/config', testconfig)
    avatars = mock.reRequire('../lib/letter-avatars')
  })

  it('should return correct urls', function () {
    assert.strictEqual(avatars.generateAvatarURL('Daan Sprenkels', 'hello@dsprenkels.com', true), 'https://www.gravatar.com/avatar/d41b5f3508cc3f31865566a47dd0336b?s=400')
    assert.strictEqual(avatars.generateAvatarURL('Daan Sprenkels', 'hello@dsprenkels.com', false), 'https://www.gravatar.com/avatar/d41b5f3508cc3f31865566a47dd0336b?s=96')
  })

  it('should return correct urls for names with spaces', function () {
    assert.strictEqual(avatars.generateAvatarURL('Daan Sprenkels'), 'http://localhost:3000/user/Daan%20Sprenkels/avatar.svg')
  })
})

describe('generateAvatarURL() gravatar disabled', function () {
  let avatars
  beforeEach(function () {
    // Reset config to make sure we don't influence other tests
    const testconfig = {
      allowGravatar: false,
      serverURL: 'http://localhost:3000',
      port: 3000
    }
    mock('../lib/config', testconfig)
    avatars = mock.reRequire('../lib/letter-avatars')
  })

  it('should return correct urls', function () {
    assert.strictEqual(avatars.generateAvatarURL('Daan Sprenkels', 'hello@dsprenkels.com', true), 'http://localhost:3000/user/Daan%20Sprenkels/avatar.svg')
    assert.strictEqual(avatars.generateAvatarURL('Daan Sprenkels', 'hello@dsprenkels.com', false), 'http://localhost:3000/user/Daan%20Sprenkels/avatar.svg')
  })

  it('should return correct urls for names with spaces', function () {
    assert.strictEqual(avatars.generateAvatarURL('Daan Sprenkels'), 'http://localhost:3000/user/Daan%20Sprenkels/avatar.svg')
  })
})
