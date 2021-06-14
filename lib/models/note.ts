// external modules
import DiffMatchPatch from "@hackmd/diff-match-patch";
import LZString from "@hackmd/lz-string";
import metaMarked from "@hackmd/meta-marked";
import async from "async";
import base64url from "base64url";
import cheerio from "cheerio";
import * as fs from "fs";
import markdownIt from "markdown-it";
import moment, {Moment} from "moment";

// ot
import ot from "ot";
import * as path from "path";
import {DataTypes, Model} from "sequelize";
import shortId from "shortid";

// core
import config from "../config";
import {logger} from "../logger";
import {createNoteWithRevision, syncNote} from "../services/note";
import {stripTags} from "../string";
import {Authorship, ModelObj, MySequelize, NoteAttributes, NoteMeta, UserModel} from "./baseModel";

const md = markdownIt()
export const dmp = new DiffMatchPatch()
// permission types
const permissionTypes = ['freely', 'editable', 'limited', 'locked', 'protected', 'private']

interface ParsedMeta {
  markdown: string,
  meta: Record<string, string>
}

export class Note extends Model<NoteAttributes> implements NoteAttributes {
  alias: string;
  authorship: Authorship[];
  content: string;
  id: string;
  lastchangeAt: Date | Moment;
  permission: string;
  savedAt: Date;
  shortid: string;
  title: string;
  viewcount: number;
  createdAt: Date

  ownerId: string

  lastchangeuserId?: string
  owner?: UserModel;
  lastchangeuser?: UserModel;

  static initialize(sequelize: MySequelize): void {
    Note.init({
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      shortid: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        defaultValue: shortId.generate
      },
      alias: {
        type: DataTypes.STRING,
        unique: true
      },
      permission: {
        type: DataTypes.ENUM,
        values: permissionTypes
      },
      viewcount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      title: {
        type: DataTypes.TEXT,
        get: function () {
          return sequelize.processData(this.getDataValue('title'), '')
        },
        set: function (value) {
          this.setDataValue('title', sequelize.stripNullByte(value))
        }
      },
      content: {
        type: DataTypes.TEXT({length: 'long'}),
        get: function () {
          return sequelize.processData(this.getDataValue('content'), '')
        },
        set: function (value) {
          this.setDataValue('content', sequelize.stripNullByte(value))
        }
      },
      authorship: {
        type: DataTypes.TEXT({length: 'long'}),
        get: function () {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return sequelize.processData(this.getDataValue('authorship'), [], JSON.parse)
        },
        set: function (value) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          this.setDataValue('authorship', JSON.stringify(value))
        }
      },
      lastchangeAt: {
        type: DataTypes.DATE
      },
      savedAt: {
        type: DataTypes.DATE
      }
    }, {
      sequelize,
      paranoid: false
    })

    Note.addHook('beforeCreate', function (note: Note): Promise<void> {
      return new Promise(function (resolve) {
        // if no content specified then use default note
        if (!note.content) {
          let filePath = config.defaultNotePath

          if (note.alias) {
            const notePathInDocPath = path.join(config.docsPath, path.basename(note.alias) + '.md')
            if (Note.checkFileExist(notePathInDocPath)) {
              filePath = notePathInDocPath
            }
          }

          if (Note.checkFileExist(filePath)) {
            const noteInFS = readFileSystemNote(filePath)
            note.title = noteInFS.title
            note.content = noteInFS.content
            if (filePath !== config.defaultNotePath) {
              note.createdAt = (noteInFS.lastchangeAt as Moment).toDate()
              note.lastchangeAt = (noteInFS.lastchangeAt as Moment).toDate()
            }
          }
        }
        // if no permission specified and have owner then give default permission in config, else default permission is freely
        if (!note.permission) {
          if (note.ownerId) {
            note.permission = config.defaultPermission
          } else {
            note.permission = 'freely'
          }
        }
        return resolve()
      })
    })
  }

  static associate(models: ModelObj): void {
    Note.belongsTo(models.User, {
      foreignKey: 'ownerId',
      as: 'owner',
      constraints: false,
      onDelete: 'CASCADE',
      hooks: true
    })
    Note.belongsTo(models.User, {
      foreignKey: 'lastchangeuserId',
      as: 'lastchangeuser',
      constraints: false
    })
    Note.hasMany(models.Revision, {
      foreignKey: 'noteId',
      constraints: false
    })
    Note.hasMany(models.Author, {
      foreignKey: 'noteId',
      as: 'authors',
      constraints: false
    })
  }


  static checkFileExist(filePath: string): boolean {
    try {
      return fs.statSync(filePath).isFile()
    } catch (err) {
      return false
    }
  }

  static encodeNoteId(id: string): string {
    // remove dashes in UUID and encode in url-safe base64
    const str = id.replace(/-/g, '')
    const hexStr = Buffer.from(str, 'hex')
    return base64url.encode(hexStr)
  }

  static decodeNoteId(encodedId: string): string {
    // decode from url-safe base64
    const id = base64url.toBuffer(encodedId).toString('hex')
    // add dashes between the UUID string parts
    const idParts = []
    idParts.push(id.substr(0, 8))
    idParts.push(id.substr(8, 4))
    idParts.push(id.substr(12, 4))
    idParts.push(id.substr(16, 4))
    idParts.push(id.substr(20, 12))
    return idParts.join('-')
  }

  static checkNoteIdValid(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const result = id.match(uuidRegex)
    if (result && result.length === 1) {
      return true
    } else {
      return false
    }
  }

  static parseNoteIdAsync(noteId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      Note.parseNoteId(noteId, (err, id) => {
        if (err) {
          return reject(err)
        }
        resolve(id)
      })
    })
  }

  static parseNoteId(noteId: string, callback: (err: Error | null, id: string) => void): void {
    async.series({
      parseNoteIdByAlias: function (_callback) {
        // try to parse note id by alias (e.g. doc)
        Note.findOne({
          where: {
            alias: noteId
          }
        }).then(async function (note) {
          const filePath = path.join(config.docsPath, path.basename(noteId) + '.md')
          if (Note.checkFileExist(filePath)) {
            try {
              if (note) {
                // if doc in filesystem have newer modified time than last change time
                // then will update the doc in db
                const noteInFS = readFileSystemNote(filePath)
                if (shouldSyncNote(note, noteInFS)) {
                  const noteId = await syncNote(noteInFS, note)
                  return callback(null, noteId)
                }
              } else {
                // create new note with alias, and will sync md file in beforeCreateHook
                const note = await createNoteWithRevision({
                  alias: noteId,
                  ownerId: null,
                  permission: 'locked'
                })
                return callback(null, note.id)
              }
            } catch (err) {
              return _callback(err, null)
            }
          }
          if (!note) {
            return _callback(null, null)
          }
          return callback(null, note.id)
        }).catch(function (err) {
          return _callback(err, null)
        })
      },
      // parse note id by LZString is deprecated, here for compability
      parseNoteIdByLZString: function (_callback) {
        // Calculate minimal string length for an UUID that is encoded
        // base64 encoded and optimize comparsion by using -1
        // this should make a lot of LZ-String parsing errors obsolete
        // as we can assume that a nodeId that is 48 chars or longer is a
        // noteID.
        const base64UuidLength = ((4 * 36) / 3) - 1
        if (!(noteId.length > base64UuidLength)) {
          return _callback(null, null)
        }
        // try to parse note id by LZString Base64
        try {
          const id = LZString.decompressFromBase64(noteId)
          if (id && Note.checkNoteIdValid(id)) {
            return callback(null, id)
          } else {
            return _callback(null, null)
          }
        } catch (err) {
          if (err.message === 'Cannot read property \'charAt\' of undefined') {
            logger.warning('Looks like we can not decode "' + noteId + '" with LZString. Can be ignored.')
          } else {
            logger.error(err)
          }
          return _callback(null, null)
        }
      },
      parseNoteIdByBase64Url: function (_callback) {
        // try to parse note id by base64url
        try {
          const id = Note.decodeNoteId(noteId)
          if (id && Note.checkNoteIdValid(id)) {
            return callback(null, id)
          } else {
            return _callback(null, null)
          }
        } catch (err) {
          logger.error(err)
          return _callback(null, null)
        }
      },
      parseNoteIdByShortId: function (_callback) {
        // try to parse note id by shortId
        try {
          if (shortId.isValid(noteId)) {
            Note.findOne({
              where: {
                shortid: noteId
              }
            }).then(function (note) {
              if (!note) return _callback(null, null)
              return callback(null, note.id)
            }).catch(function (err) {
              return _callback(err, null)
            })
          } else {
            return _callback(null, null)
          }
        } catch (err) {
          return _callback(err, null)
        }
      }
    }, function (err) {
      if (err) {
        logger.error(err)
        return callback(err, null)
      }
      return callback(null, null)
    })
  }

  static parseNoteInfo(body: string): Partial<NoteMeta> {
    const parsed = Note.extractMeta(body)
    const $ = cheerio.load(md.render(parsed.markdown))
    return {
      title: Note.extractNoteTitle(parsed.meta, $),
      tags: Note.extractNoteTags(parsed.meta, $)
    }
  }

  static parseNoteTitle(body: string): string {
    const parsed = Note.extractMeta(body)
    const $ = cheerio.load(md.render(parsed.markdown))
    return Note.extractNoteTitle(parsed.meta, $)
  }

  static extractNoteTitle(meta: Record<string, string>, $: cheerio.Root): string {
    let title = ''
    if (meta.title && (typeof meta.title === 'string' || typeof meta.title === 'number')) {
      title = meta.title
    } else {
      const h1s = $('h1')
      if (h1s.length > 0 && h1s.first().text().split('\n').length === 1) {
        title = stripTags(h1s.first().text())
      }
    }
    if (!title) title = 'Untitled'
    return title
  }

  static generateDescription(markdown: string): string {
    return markdown.substr(0, 100).replace(/(?:\r\n|\r|\n)/g, ' ')
  }

  static decodeTitle(title: string): string {
    return title || 'Untitled'
  }

  static generateWebTitle(title: string): string {
    title = !title || title === 'Untitled' ? 'CodiMD - Collaborative markdown notes' : title + ' - CodiMD'
    return title
  }

  static extractNoteTags(meta: Record<string, string>, $: cheerio.Root): string[] {
    const tags = []
    const rawtags = []
    let metaTags
    if (meta.tags && (typeof meta.tags === 'string' || typeof meta.tags === 'number')) {
      metaTags = ('' + meta.tags).split(',')
    } else if (meta.tags && (Array.isArray(meta.tags))) {
      metaTags = meta.tags
    }
    if (metaTags) {
      for (let i = 0; i < metaTags.length; i++) {
        const text = metaTags[i].trim()
        if (text) rawtags.push(text)
      }
    } else {
      const h6s = $('h6')
      h6s.each(function (key, value) {
        if (/^tags/gmi.test($(value).text())) {
          const codes = $(value).find('code')
          for (let i = 0; i < codes.length; i++) {
            const text = stripTags($(codes[i]).text().trim())
            if (text) rawtags.push(text)
          }
        }
      })
    }
    for (let i = 0; i < rawtags.length; i++) {
      let found = false
      for (let j = 0; j < tags.length; j++) {
        if (tags[j] === rawtags[i]) {
          found = true
          break
        }
      }
      if (!found) {
        tags.push(rawtags[i])
      }
    }
    return tags
  }

  static extractMeta(content: string): ParsedMeta {
    let obj = null
    try {
      obj = metaMarked(content)
      if (!obj.markdown) obj.markdown = ''
      if (!obj.meta) obj.meta = {}
    } catch (err) {
      obj = {
        markdown: content,
        meta: {}
      }
    }
    return obj
  }

  static parseMeta(meta: Record<string, string>): Partial<NoteMeta> {
    const _meta: Partial<NoteMeta> = {}
    if (meta) {
      if (meta.title && (typeof meta.title === 'string' || typeof meta.title === 'number')) {
        _meta.title = meta.title
      }
      if (meta.description && (typeof meta.description === 'string' || typeof meta.description === 'number')) {
        _meta.description = meta.description
      }
      if (meta.robots && (typeof meta.robots === 'string' || typeof meta.robots === 'number')) {
        _meta.robots = meta.robots
      }
      if (meta.GA && (typeof meta.GA === 'string' || typeof meta.GA === 'number')) {
        _meta.GA = meta.GA
      }
      if (meta.disqus && (typeof meta.disqus === 'string' || typeof meta.disqus === 'number')) {
        _meta.disqus = meta.disqus
      }
      if (meta.slideOptions && (typeof meta.slideOptions === 'object')) {
        _meta.slideOptions = meta.slideOptions
      }
    }
    return _meta
  }

  static updateAuthorshipByOperation(operation: (string|number)[], userId: string, authorships: Authorship[]): Authorship[] {
    let index = 0
    const timestamp = Date.now()
    for (let i = 0; i < operation.length; i++) {
      const op = operation[i]
      if (ot.TextOperation.isRetain(op)) {
        index += op as number
      } else if (ot.TextOperation.isInsert(op)) {
        const opStart = index
        const opEnd = index + (op as string).length
        let inserted = false
        // authorship format: [userId, startPos, endPos, createdAt, updatedAt]
        if (authorships.length <= 0) authorships.push([userId, opStart, opEnd, timestamp, timestamp])
        else {
          for (let j = 0; j < authorships.length; j++) {
            const authorship = authorships[j]
            if (!inserted) {
              const nextAuthorship = authorships[j + 1] || -1
              if ((nextAuthorship !== -1 && nextAuthorship[1] >= opEnd) || j >= authorships.length - 1) {
                if (authorship[1] < opStart && authorship[2] > opStart) {
                  // divide
                  const postLength = authorship[2] - opStart
                  authorship[2] = opStart
                  authorship[4] = timestamp
                  authorships.splice(j + 1, 0, [userId, opStart, opEnd, timestamp, timestamp])
                  authorships.splice(j + 2, 0, [authorship[0], opEnd, opEnd + postLength, authorship[3], timestamp])
                  j += 2
                  inserted = true
                } else if (authorship[1] >= opStart) {
                  authorships.splice(j, 0, [userId, opStart, opEnd, timestamp, timestamp])
                  j += 1
                  inserted = true
                } else if (authorship[2] <= opStart) {
                  authorships.splice(j + 1, 0, [userId, opStart, opEnd, timestamp, timestamp])
                  j += 1
                  inserted = true
                }
              }
            }
            if (authorship[1] >= opStart) {
              authorship[1] += (op as string).length
              authorship[2] += (op as string).length
            }
          }
        }
        index += (op as string).length
      } else if (ot.TextOperation.isDelete(op)) {
        const opStart = index
        const opEnd = index - (op as number)
        if (operation.length === 1) {
          authorships = []
        } else if (authorships.length > 0) {
          for (let j = 0; j < authorships.length; j++) {
            const authorship = authorships[j]
            if (authorship[1] >= opStart && authorship[1] <= opEnd && authorship[2] >= opStart && authorship[2] <= opEnd) {
              authorships.splice(j, 1)
              j -= 1
            } else if (authorship[1] < opStart && authorship[1] < opEnd && authorship[2] > opStart && authorship[2] > opEnd) {
              authorship[2] += op as number
              authorship[4] = timestamp
            } else if (authorship[2] >= opStart && authorship[2] <= opEnd) {
              authorship[2] = opStart
              authorship[4] = timestamp
            } else if (authorship[1] >= opStart && authorship[1] <= opEnd) {
              authorship[1] = opEnd
              authorship[4] = timestamp
            }
            if (authorship[1] >= opEnd) {
              authorship[1] += op as number
              authorship[2] += op as number
            }
          }
        }
        index += (op as number)
      }
    }
    // merge
    for (let j = 0; j < authorships.length; j++) {
      const authorship = authorships[j]
      for (let k = j + 1; k < authorships.length; k++) {
        const nextAuthorship = authorships[k]
        if (nextAuthorship && authorship[0] === nextAuthorship[0] && authorship[2] === nextAuthorship[1]) {
          const minTimestamp = Math.min(authorship[3], nextAuthorship[3])
          const maxTimestamp = Math.max(authorship[3], nextAuthorship[3])
          authorships.splice(j, 1, [authorship[0], authorship[1], nextAuthorship[2], minTimestamp, maxTimestamp])
          authorships.splice(k, 1)
          j -= 1
          break
        }
      }
    }
    // clear
    for (let j = 0; j < authorships.length; j++) {
      const authorship = authorships[j]
      if (!authorship[0]) {
        authorships.splice(j, 1)
        j -= 1
      }
    }
    return authorships
  }

  static transformPatchToOperations(patch: Patch[], contentLength: number): (number | string)[][] {
    const operations = []
    if (patch.length > 0) {
      // calculate original content length
      for (let j = patch.length - 1; j >= 0; j--) {
        const p = patch[j]
        for (let i = 0; i < p.diffs.length; i++) {
          const diff = p.diffs[i]
          switch (diff[0]) {
            case 1: // insert
              contentLength -= diff[1].length
              break
            case -1: // delete
              contentLength += diff[1].length
              break
          }
        }
      }
      // generate operations
      let bias = 0
      let lengthBias = 0
      for (let j = 0; j < patch.length; j++) {
        const operation = []
        const p = patch[j]
        let currIndex = p.start1
        const currLength = contentLength - bias
        for (let i = 0; i < p.diffs.length; i++) {
          const diff = p.diffs[i]
          switch (diff[0]) {
            case 0: // retain
              if (i === 0) {
                // first
                operation.push(currIndex + diff[1].length)
              } else if (i !== p.diffs.length - 1) {
                // mid
                operation.push(diff[1].length)
              } else {
                // last
                operation.push(currLength + lengthBias - currIndex)
              }
              currIndex += diff[1].length
              break
            case 1: // insert
              operation.push(diff[1])
              lengthBias += diff[1].length
              currIndex += diff[1].length
              break
            case -1: // delete
              operation.push(-diff[1].length)
              bias += diff[1].length
              currIndex += diff[1].length
              break
          }
        }
        operations.push(operation)
      }
    }
    return operations
  }
}

function readFileSystemNote(filePath: string): Partial<Note> {
  const fsModifiedTime = moment(fs.statSync(filePath).mtime)
  const content = fs.readFileSync(filePath, 'utf8')

  return {
    lastchangeAt: fsModifiedTime,
    title: Note.parseNoteTitle(content),
    content: content
  }
}

function shouldSyncNote(note, noteInFS) {
  const dbModifiedTime = moment(note.lastchangeAt || note.createdAt)
  return noteInFS.lastchangeAt.isAfter(dbModifiedTime) && note.content !== noteInFS.content
}

