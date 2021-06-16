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

  export interface SocketRequest {
    user?: {
      logged_in: boolean
      id: string
    }
  }

  export interface Socket {
    origin?: any
    noteId?: string
    request: SocketRequest | any
  }

}
