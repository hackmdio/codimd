import {Moment} from "moment";
import {Sequelize, Model, ModelCtor} from "sequelize";

export type MySequelize = Sequelize & {
  processData?: any
  stripNullByte?: any
}

export type BaseModel = {
  name: string;
  initialize(sequelize: Sequelize): void
  associate(models: ModelObj): void
}

export type UserModel = Model<UserAttributes> & UserAttributes
export type AuthorModel = Model<AuthorAttributes> & AuthorAttributes
export type RevisionModel = Model<RevisionAttributes> & RevisionAttributes
export type NoteModel = Model<NoteAttributes> & NoteAttributes

export type ModelObj = {
  ['Author']: ModelCtor<AuthorModel>
  ['Note']: ModelCtor<NoteModel>
  ['User']: ModelCtor<UserModel>
  ['Revision']: ModelCtor<RevisionModel>
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
  lastchangeAt?: Date | Moment
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

export interface NoteMeta {
  title: string
  tags: string[]

  description: string
  robots: string
  GA: string
  disqus: string
  // eslint-disable-next-line
  slideOptions: any
  image: string
}

