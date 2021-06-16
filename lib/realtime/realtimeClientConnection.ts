'use strict'

import {get} from "lodash";
import {Socket} from "socket.io";

import config from "../config";
import {Note} from "../models";
import {logger} from "../logger";
import {RealtimeNoteData, RealtimeUserData} from "./realtime";
import {RealtimeModule} from "./realtime-types";

export type CursorData = {line: number, ch: number}

export interface UserStatus {
  idle: boolean
  type: 'xs' | 'sm' | 'md' | 'lg'
}

export class RealtimeClientConnection {
  private socket: Socket;
  private realtime: RealtimeModule;

  constructor(socket: Socket) {
    this.socket = socket
    this.realtime = require('./realtime')
  }

  registerEventHandler(): void {
    // received client refresh request
    this.socket.on('refresh', this.refreshEventHandler.bind(this))
    // received user status
    this.socket.on('user status', this.userStatusEventHandler.bind(this))
    // when a new client disconnect
    this.socket.on('disconnect', this.disconnectEventHandler.bind(this))
    // received cursor focus
    this.socket.on('cursor focus', this.cursorFocusEventHandler.bind(this))
    // received cursor activity
    this.socket.on('cursor activity', this.cursorActivityEventHandler.bind(this))
    // received cursor blur
    this.socket.on('cursor blur', this.cursorBlurEventHandler.bind(this))
    // check version
    this.socket.on('version', this.checkVersionEventHandler.bind(this))
    // received sync of online users request
    this.socket.on('online users', this.onlineUsersEventHandler.bind(this))
    // reveiced when user logout or changed
    this.socket.on('user changed', this.userChangedEventHandler.bind(this))
    // delete a note
    this.socket.on('delete', this.deleteNoteEventHandler.bind(this))
    // received note permission change request
    this.socket.on('permission', this.permissionChangeEventHandler.bind(this))
  }

  isUserLoggedIn(): boolean {
    return this.socket.request.user && this.socket.request.user.logged_in
  }

  isNoteAndUserExists(): boolean {
    const note = this.realtime.getNoteFromNotePool(this.socket.noteId)
    const user = this.realtime.getUserFromUserPool(this.socket.id)
    return !!(note && user)
  }

  isNoteOwner(): boolean {
    const note = this.getCurrentNote()
    return get(note, 'owner') === this.getCurrentLoggedInUserId()
  }

  isAnonymousEnable(): boolean {
    // TODO: move this method to config module
    return config.allowAnonymous || config.allowAnonymousEdits
  }

  getAvailablePermissions(): string[] {
    // TODO: move this method to config module
    const availablePermission = Object.assign({}, config.permission)
    if (!config.allowAnonymous && !config.allowAnonymousViews) {
      delete availablePermission.freely
      delete availablePermission.editable
      delete availablePermission.locked
    } else if (!config.allowAnonymous && !config.allowAnonymousEdits) {
      delete availablePermission.freely
    }
    return availablePermission
  }

  getCurrentUser(): RealtimeUserData {
    if (!this.socket.id) return
    return this.realtime.getUserFromUserPool(this.socket.id)
  }

  getCurrentLoggedInUserId(): string {
    return get(this.socket, 'request.user.id')
  }

  getCurrentNote(): RealtimeNoteData {
    if (!this.socket.noteId) return
    return this.realtime.getNoteFromNotePool(this.socket.noteId)
  }

  getNoteChannel(): Socket {
    return this.socket.broadcast.to(this.socket.noteId)
  }

  async destroyNote(id: string): Promise<number> {
    return Note.destroy({
      where: {id: id}
    })
  }

  async changeNotePermission(newPermission: string): Promise<void> {
    const [changedRows] = await Note.update({
      permission: newPermission
    }, {
      where: {
        id: this.getCurrentNote().id
      }
    })
    if (changedRows !== 1) {
      throw new Error(`updated permission failed, cannot set permission ${newPermission} to note ${this.getCurrentNote().id}`)
    }
  }

  notifyPermissionChanged(): void {
    this.realtime.io.to(this.getCurrentNote().id).emit('permission', {
      permission: this.getCurrentNote().permission
    })
    this.getCurrentNote().socks.forEach((sock) => {
      if (sock) {
        if (!this.realtime.checkViewPermission(sock.request, this.getCurrentNote())) {
          sock.emit('info', {
            code: 403
          })
          setTimeout(function () {
            sock.disconnect(true)
          }, 0)
        }
      }
    })
  }

  refreshEventHandler(): void {
    this.realtime.emitRefresh(this.socket)
  }

  checkVersionEventHandler(): void {
    this.socket.emit('version', {
      version: config.fullversion,
      minimumCompatibleVersion: config.minimumCompatibleVersion
    })
  }

  userStatusEventHandler(data: UserStatus): void {
    if (!this.isNoteAndUserExists()) return
    const user = this.getCurrentUser()
    if (config.debug) {
      logger.info('SERVER received [' + this.socket.noteId + '] user status from [' + this.socket.id + ']: ' + JSON.stringify(data))
    }
    if (data) {
      user.idle = data.idle
      user.type = data.type
    }
    this.realtime.emitUserStatus(this.socket)
  }

  userChangedEventHandler(): void {
    logger.info('user changed')

    const note = this.getCurrentNote()
    if (!note) return
    const user = note.users[this.socket.id]
    if (!user) return

    this.realtime.updateUserData(this.socket, user)
    this.realtime.emitOnlineUsers(this.socket)
  }

  onlineUsersEventHandler(): void {
    if (!this.isNoteAndUserExists()) return

    const currentNote = this.getCurrentNote()

    const currentNoteOnlineUserList = Object.keys(currentNote.users)
      .map(key => this.realtime.buildUserOutData(currentNote.users[key]))

    this.socket.emit('online users', {
      users: currentNoteOnlineUserList
    })
  }

  cursorFocusEventHandler(data: CursorData): void {
    if (!this.isNoteAndUserExists()) return
    const user = this.getCurrentUser()
    user.cursor = data
    const out = this.realtime.buildUserOutData(user)
    this.getNoteChannel().emit('cursor focus', out)
  }

  cursorActivityEventHandler(data: CursorData): void {
    if (!this.isNoteAndUserExists()) return
    const user = this.getCurrentUser()
    user.cursor = data
    const out = this.realtime.buildUserOutData(user)
    this.getNoteChannel().emit('cursor activity', out)
  }

  cursorBlurEventHandler(): void {
    if (!this.isNoteAndUserExists()) return
    const user = this.getCurrentUser()
    user.cursor = null
    this.getNoteChannel().emit('cursor blur', {
      id: this.socket.id
    })
  }

  deleteNoteEventHandler(): void {
    // need login to do more actions
    if (this.isUserLoggedIn() && this.isNoteAndUserExists()) {
      const note = this.getCurrentNote()
      // Only owner can delete note
      if (note.owner && note.owner === this.getCurrentLoggedInUserId()) {
        this.destroyNote(note.id)
          .then((successRows) => {
            if (!successRows) return
            this.realtime.disconnectSocketOnNote(note)
          })
          .catch(function (err) {
            return logger.error('delete note failed: ' + err)
          })
      }
    }
  }

  permissionChangeEventHandler(permission: string): void {
    if (!this.isUserLoggedIn()) return
    if (!this.isNoteAndUserExists()) return

    const note = this.getCurrentNote()
    // Only owner can change permission
    if (!this.isNoteOwner()) return
    if (!(permission in this.getAvailablePermissions())) return

    this.changeNotePermission(permission)
      .then(() => {
        note.permission = permission
        this.notifyPermissionChanged()
      })
      .catch(err => logger.error('update note permission failed: ' + err))
  }

  disconnectEventHandler(): void {
    if (this.realtime.disconnectProcessQueue.checkTaskIsInQueue(this.socket.id)) {
      return
    }
    this.realtime.queueForDisconnect(this.socket)
  }
}
