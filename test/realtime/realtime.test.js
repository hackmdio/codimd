'use strict'

/* eslint-env node, mocha */

const mock = require('mock-require')
const assert = require('assert')

describe('realtime', function () {
  describe('checkViewPermission', function () {
    // role -> guest, loggedInUser, loggedInOwner
    const viewPermission = {
      freely: [true, true, true],
      editable: [true, true, true],
      limited: [false, true, true],
      locked: [true, true, true],
      protected: [false, true, true],
      private: [false, false, true]
    }
    const loggedInUserId = 'user1_id'
    const ownerUserId = 'user2_id'
    const guestReq = {}
    const loggedInUserReq = {
      user: {
        id: loggedInUserId,
        logged_in: true
      }
    }
    const loggedInOwnerReq = {
      user: {
        id: ownerUserId,
        logged_in: true
      }
    }

    const note = {
      owner: ownerUserId
    }

    let realtime

    beforeEach(() => {
      mock('../../lib/logger', {
        error: () => {
        }
      })
      mock('../../lib/history', {})
      mock('../../lib/models', {
        Note: {
          parseNoteTitle: (data) => (data)
        }
      })
      mock('../../lib/config', {})
      realtime = require('../../lib/realtime/realtime')
    })

    Object.keys(viewPermission).forEach(function (permission) {
      describe(permission, function () {
        beforeEach(() => {
          note.permission = permission
        })
        it('guest permission test', function () {
          assert(realtime.checkViewPermission(guestReq, note) === viewPermission[permission][0])
        })
        it('loggedIn User permission test', function () {
          assert(realtime.checkViewPermission(loggedInUserReq, note) === viewPermission[permission][1])
        })
        it('loggedIn Owner permission test', function () {
          assert(realtime.checkViewPermission(loggedInOwnerReq, note) === viewPermission[permission][2])
        })
      })
    })
  })
})
