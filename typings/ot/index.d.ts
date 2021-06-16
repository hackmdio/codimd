import SocketIO from "socket.io";
import EventEmitter from "events";

declare module 'ot' {

  export const version: number

  export type Operation = number | string

  export class TextOperation {
    static isRetain(op: Operation): boolean

    static isInsert(op: Operation): boolean

    static isDelete(op: Operation): boolean
  }

  export class EditorSocketIOServer extends EventEmitter {

    public isDirty: boolean
    public document: string
    public debug: boolean
    public operations: Operation[]

    constructor(
      document: string,
      operations: Operation[],
      docId: string,
      mayWrite: (
        socket: SocketIO.Socket,
        callback: (canEdit: boolean) => void) => void,
      operationCallback: (
        socket: SocketIO.Socket,
        operation: Operation[]) => void,
      operationEventCallback?: any)

    setLogger(logger): void

    debugLog(mes: string): void

    setDocumentMaxLength(number): void

    addClient(socket: SocketIO.Socket): void

    onOperation(socket: SocketIO.Server, revision, operation, selection)

    onGetOperations(socket, base, head)

    updateSelection(socket, selection)

    setName(socket, name)

    setColor(socket, color)

    getClient(clientId)

    onDisconnect(socket)
  }

}


