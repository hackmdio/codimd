declare namespace SocketIO {
  export interface Server {
    set(key: string, val: any)
  }

  export interface Handshake {
    query: Record<"noteId" | string, string>
    headers: {
      referer?: string
    } | any
  }

  export interface Socket {
    origin?: any
    noteId?: string
  }

}
