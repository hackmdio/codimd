import {Sequelize, Model} from "sequelize";

export type MySequelize = Sequelize & {
  processData?: any
  stripNullByte?: any
}

export type BaseModel<T> = {
  name: string;
  initialize(sequelize: Sequelize): void
  associate(models: any): void
}

export function StaticImplements<T>(t: T) {
  return t;
}

export interface BaseModelStatic extends Model {
  initialize(sequelize: Sequelize): void

  associate(models: any): void
}

export interface AuthorAttributes {
  id: string
  color: string
}

export interface NoteAttributes {
  id?: string
  shortid?: string
  alias?: string
  permission?: string
  viewcount?: number
  title?: string
  content?: string
  authorship?: string
  lastchangeAt?: Date
  savedAt?: Date

  ownerId?: string
}

export interface RevisionAttributes {
  id: string
  patch: string
  lastContent: string
  content: string
  length: number
  authorship: string
}

export interface BaseProfile {
  provider: string
}

export interface GenericProfile extends BaseProfile {
  provider: string
  displayName?: string
  username?: string
  id?: string
  photos?: { value: string }[]
  avatarUrl?: string
  emails?: string[]
  photo?: string
  email?: string
}

export interface DropboxProfile extends BaseProfile {
  provider: 'dropbox'
  emails?: { value: string }[]
}

export interface UserProfile {
  name: string
  photo: string
  biggerphoto: string
}

export interface UserAttributes {
  id: string
  profileid?: string
  profile?: string
  history?: string
  accessToken?: string
  refreshToken?: string
  deleteToken?: string
  email?: string
  password?: string
}
