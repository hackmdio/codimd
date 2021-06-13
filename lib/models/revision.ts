// external modules
import {Model, Op, DataTypes} from "sequelize";
import moment from "moment";
import * as  childProcess from "child_process";
import shortId from "shortid";
import * as  path from "path";
import * as  util from "util";

// core
import config from "../config";
import logger from "../logger";
import {MySequelize, RevisionAttributes} from "./baseModel";

let dmpWorker = createDmpWorker()
const dmpCallbackCache = {}

function createDmpWorker() {
  const worker = childProcess.fork(path.resolve(__dirname, '../workers/dmpWorker.js'), {
    stdio: 'ignore'
  })
  if (config.debug) logger.info('dmp worker process started')
  worker.on('message', function (data) {
    if (!data || !data.msg || !data.cacheKey) {
      logger.error('dmp worker error: not enough data on message')
      return
    }
    const cacheKey = data.cacheKey
    switch (data.msg) {
      case 'error':
        dmpCallbackCache[cacheKey](data.error, null)
        break
      case 'check':
        dmpCallbackCache[cacheKey](null, data.result)
        break
    }
    delete dmpCallbackCache[cacheKey]
  })
  worker.on('close', function (code) {
    dmpWorker = null
    if (config.debug) logger.info('dmp worker process exited with code ' + code)
  })
  return worker
}

function sendDmpWorker(data, callback) {
  if (!dmpWorker) dmpWorker = createDmpWorker()
  const cacheKey = Date.now() + '_' + shortId.generate()
  dmpCallbackCache[cacheKey] = callback
  data = Object.assign(data, {
    cacheKey: cacheKey
  })
  dmpWorker.send(data)
}


export class Revision extends Model<RevisionAttributes> implements RevisionAttributes {
  authorship: string;
  content: string;
  id: string;
  lastContent: string;
  length: number;
  patch: string;

  public readonly createdAt ?: number

  static initialize(sequelize: MySequelize): void {
    Revision.init({
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      patch: {
        type: DataTypes.TEXT({length: 'long'}),
        get: function () {
          return sequelize.processData(this.getDataValue('patch'), '')
        },
        set: function (value) {
          this.setDataValue('patch', sequelize.stripNullByte(value))
        }
      },
      lastContent: {
        type: DataTypes.TEXT({length: 'long'}),
        get: function () {
          return sequelize.processData(this.getDataValue('lastContent'), '')
        },
        set: function (value) {
          this.setDataValue('lastContent', sequelize.stripNullByte(value))
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
      length: {
        type: DataTypes.INTEGER
      },
      authorship: {
        type: DataTypes.TEXT({length: 'long'}),
        get: function () {
          return sequelize.processData(this.getDataValue('authorship'), [], JSON.parse)
        },
        set: function (value: string | null) {
          this.setDataValue('authorship', value ? JSON.stringify(value) : value)
        }
      }
    }, {sequelize})
  }

  static associate(models: any): void {
    Revision.belongsTo(models.Note, {
      foreignKey: 'noteId',
      as: 'note',
      constraints: false,
      onDelete: 'CASCADE',
      hooks: true
    })
  }


  static getNoteRevisions(note, callback) {
    Revision.findAll({
      where: {
        noteId: note.id
      },
      order: [['createdAt', 'DESC']]
    }).then(function (revisions) {
      const data = []
      for (let i = 0, l = revisions.length; i < l; i++) {
        const revision = revisions[i]
        data.push({
          time: moment(revision.createdAt).valueOf(),
          length: revision.length
        })
      }
      callback(null, data)
    }).catch(function (err) {
      callback(err, null)
    })
  }

  static getPatchedNoteRevisionByTime(note, time, callback) {
    // find all revisions to prepare for all possible calculation
    Revision.findAll({
      where: {
        noteId: note.id
      },
      order: [['createdAt', 'DESC']]
    }).then(function (revisions) {
      if (revisions.length <= 0) return callback(null, null)
      // measure target revision position
      Revision.count({
        where: {
          noteId: note.id,
          createdAt: {
            [Op.gte]: time
          }
        },
      }).then(function (count) {
        if (count <= 0) return callback(null, null)
        sendDmpWorker({
          msg: 'get revision',
          revisions: revisions,
          count: count
        }, callback)
      }).catch(function (err) {
        return callback(err, null)
      })
    }).catch(function (err) {
      return callback(err, null)
    })
  }

  static saveNoteRevision(note, callback) {
    Revision.findAll({
      where: {
        noteId: note.id
      },
      order: [['createdAt', 'DESC']]
    }).then(function (revisions) {
      if (revisions.length <= 0) {
        // if no revision available
        Revision.create({
          noteId: note.id,
          lastContent: note.content ? note.content : '',
          length: note.content ? note.content.length : 0,
          authorship: note.authorship
        }).then(function (revision) {
          Revision.finishSaveNoteRevision(note, revision, callback)
        }).catch(function (err) {
          return callback(err, null)
        })
      } else {
        const latestRevision = revisions[0]
        const lastContent = latestRevision.content || latestRevision.lastContent
        const content = note.content
        sendDmpWorker({
          msg: 'create patch',
          lastDoc: lastContent,
          currDoc: content
        }, function (err, patch) {
          if (err) logger.error('save note revision error', err)
          if (!patch) {
            // if patch is empty (means no difference) then just update the latest revision updated time
            latestRevision.changed('updatedAt', true)
            latestRevision.update({
              updatedAt: Date.now()
            }).then(function (revision) {
              Revision.finishSaveNoteRevision(note, revision, callback)
            }).catch(function (err) {
              return callback(err, null)
            })
          } else {
            Revision.create({
              noteId: note.id,
              patch: patch,
              content: note.content,
              length: note.content.length,
              authorship: note.authorship
            }).then(function (revision) {
              // clear last revision content to reduce db size
              latestRevision.update({
                content: null
              }).then(function () {
                Revision.finishSaveNoteRevision(note, revision, callback)
              }).catch(function (err) {
                return callback(err, null)
              })
            }).catch(function (err) {
              return callback(err, null)
            })
          }
        })
      }
    }).catch(function (err) {
      return callback(err, null)
    })
  }

  static saveNoteRevisionAsync = util.promisify(Revision.saveNoteRevision) as (note) => Promise<Revision>

  static finishSaveNoteRevision(note, revision, callback) {
    note.update({
      savedAt: revision.updatedAt
    }).then(function () {
      return callback(null, revision)
    }).catch(function (err) {
      return callback(err, null)
    })
  }

}
