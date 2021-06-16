import SocketIO from "socket.io";
import {Note} from "../models";
import {ProcessQueue} from "./processQueue";
import {RealtimeClientUserData, RealtimeNoteData, RealtimeUserData} from "./realtime";

export interface RealtimeModule {
  disconnectProcessQueue: ProcessQueue

  queueForDisconnect(socket: SocketIO.Socket): void

  disconnectSocketOnNote(note: RealtimeNoteData): void

  getNotePool(): Record<string, RealtimeNoteData>

  getUserPool(): Record<string, RealtimeUserData>

  getUserFromUserPool(userId: string): RealtimeUserData | null

  getNoteFromNotePool(noteId: string): RealtimeNoteData | null

  checkViewPermission(req, note: RealtimeNoteData): boolean

  emitRefresh(socket: SocketIO.Socket): void

  emitUserStatus(socket: SocketIO.Socket): void

  updateUserData(socket: SocketIO.Socket, user: RealtimeUserData): void

  emitOnlineUsers(socket: SocketIO.Socket): void

  buildUserOutData(user: RealtimeUserData): RealtimeClientUserData

  emitCheck(note: RealtimeNoteData): void

  updateNote(note: RealtimeNoteData, callback: (err: Error | null, note: Note) => void): void

  io: SocketIO.Server
}

