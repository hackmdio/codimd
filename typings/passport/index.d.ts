declare namespace Express {
  export interface User {
    id?: string
  }

  export interface Request {
    locals?: Record<string, string>
  }
}
