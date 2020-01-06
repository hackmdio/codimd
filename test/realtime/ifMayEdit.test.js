/* eslint-env node, mocha */
'use strict'

const assert = require('assert')
const mock = require('mock-require')
const sinon = require('sinon')

const { createFakeLogger } = require('../testDoubles/loggerFake')
const realtimeJobStub = require('../testDoubles/realtimeJobStub')
const { removeLibModuleCache, makeMockSocket } = require('./utils')

describe('realtime#ifMayEdit', function () {
  let modelsStub
  beforeEach(() => {
    removeLibModuleCache()
    mock('../../lib/config', {})
    mock('../../lib/logger', createFakeLogger())
    mock('../../lib/models', modelsStub)
    mock('../../lib/realtimeUpdateDirtyNoteJob', realtimeJobStub)
    mock('../../lib/realtimeCleanDanglingUserJob', realtimeJobStub)
    mock('../../lib/realtimeSaveRevisionJob', realtimeJobStub)
  })

  afterEach(() => {
    mock.stopAll()
    sinon.restore()
  })

  const Role = {
    Guest: 'guest',
    LoggedIn: 'LoggedIn',
    Owner: 'Owner'
  }

  const Permission = {
    Freely: 'freely',
    Editable: 'editable',
    Limited: 'limited',
    Locked: 'locked',
    Protected: 'protected',
    Private: 'private'
  }

  const testcases = [
    { role: Role.Guest, permission: Permission.Freely, canEdit: true },
    { role: Role.LoggedIn, permission: Permission.Freely, canEdit: true },
    { role: Role.Owner, permission: Permission.Freely, canEdit: true },
    { role: Role.Guest, permission: Permission.Editable, canEdit: false },
    { role: Role.LoggedIn, permission: Permission.Editable, canEdit: true },
    { role: Role.Owner, permission: Permission.Editable, canEdit: true },
    { role: Role.Guest, permission: Permission.Limited, canEdit: false },
    { role: Role.LoggedIn, permission: Permission.Limited, canEdit: true },
    { role: Role.Owner, permission: Permission.Limited, canEdit: true },
    { role: Role.Guest, permission: Permission.Locked, canEdit: false },
    { role: Role.LoggedIn, permission: Permission.Locked, canEdit: false },
    { role: Role.Owner, permission: Permission.Locked, canEdit: true },
    { role: Role.Guest, permission: Permission.Protected, canEdit: false },
    { role: Role.LoggedIn, permission: Permission.Protected, canEdit: false },
    { role: Role.Owner, permission: Permission.Protected, canEdit: true },
    { role: Role.Guest, permission: Permission.Private, canEdit: false },
    { role: Role.LoggedIn, permission: Permission.Private, canEdit: false },
    { role: Role.Owner, permission: Permission.Private, canEdit: true }
  ]

  const noteOwnerId = 'owner'
  const loggedInUserId = 'user1'
  const noteId = 'noteId'

  testcases.forEach((tc) => {
    it(`${tc.role} ${tc.canEdit ? 'can' : 'can\'t'} edit note with permission ${tc.permission}`, function () {
      const client = makeMockSocket()
      const note = {
        permission: tc.permission,
        owner: noteOwnerId
      }
      if (tc.role === Role.LoggedIn) {
        client.request.user.logged_in = true
        client.request.user.id = loggedInUserId
      } else if (tc.role === Role.Owner) {
        client.request.user.logged_in = true
        client.request.user.id = noteOwnerId
      }
      client.noteId = noteId
      const realtime = require('../../lib/realtime/realtime')
      realtime.getNotePool()[noteId] = note
      const callback = sinon.stub()
      realtime.ifMayEdit(client, callback)
      assert(callback.calledOnce)
      assert(callback.lastCall.args[0] === tc.canEdit)
    })
  })

  it('should set lsatchangeuser to null if guest edit operation', function () {
    const note = {
      permission: Permission.Freely
    }
    const client = makeMockSocket()
    client.noteId = noteId
    const callback = sinon.stub()
    client.origin = 'operation'
    const realtime = require('../../lib/realtime/realtime')
    realtime.getNotePool()[noteId] = note
    realtime.ifMayEdit(client, callback)
    assert(callback.calledOnce)
    assert(callback.lastCall.args[0])
    assert(note.lastchangeuser === null)
  })

  it('should set lastchangeuser to logged_in user id if user edit', function () {
    const note = {
      permission: Permission.Freely
    }
    const client = makeMockSocket()
    client.noteId = noteId
    client.request.user.logged_in = true
    client.request.user.id = loggedInUserId
    const callback = sinon.stub()
    client.origin = 'operation'
    const realtime = require('../../lib/realtime/realtime')
    realtime.getNotePool()[noteId] = note
    realtime.ifMayEdit(client, callback)
    assert(callback.calledOnce)
    assert(callback.lastCall.args[0])
    assert(note.lastchangeuser === loggedInUserId)
  })
})
