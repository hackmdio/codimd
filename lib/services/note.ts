import DiffMatchPatch from "@hackmd/diff-match-patch";
import async from 'async'
import moment from "moment";
import {col, Op} from "sequelize";
import {Note} from "../models";
import * as models from '../models'
import {NoteAttributes} from "../models/note";

const dmp = new DiffMatchPatch()

export function checkAllNotesRevision(callback) {
  saveAllNotesRevision(function (err, notes) {
    if (err) return callback(err, null)
    if (!notes || notes.length <= 0) {
      return callback(null, notes)
    } else {
      checkAllNotesRevision(callback)
    }
  })
}

export function saveAllNotesRevision(callback: any): void {
  models.Note.findAll({
    // query all notes that need to save for revision
    where: {
      [Op.and]: [
        {
          lastchangeAt: {
            [Op.or]: {
              [Op.eq]: null,
              [Op.and]: {
                [Op.ne]: null,
                [Op.gt]: col('createdAt')
              }
            }
          }
        },
        {
          savedAt: {
            [Op.or]: {
              [Op.eq]: null,
              [Op.lt]: col('lastchangeAt')
            }
          }
        }
      ]
    }
  }).then(function (notes) {
    if (notes.length <= 0) return callback(null, notes)
    const savedNotes = []
    async.each(notes, function (note, _callback) {
      // revision saving policy: note not been modified for 5 mins or not save for 10 mins
      if (note.lastchangeAt && note.savedAt) {
        const lastchangeAt = moment(note.lastchangeAt)
        const savedAt = moment(note.savedAt)
        if (moment().isAfter(lastchangeAt.add(5, 'minutes'))) {
          savedNotes.push(note)
          models.Revision.saveNoteRevision(note, _callback)
        } else if (lastchangeAt.isAfter(savedAt.add(10, 'minutes'))) {
          savedNotes.push(note)
          models.Revision.saveNoteRevision(note, _callback)
        } else {
          return _callback(null, null)
        }
      } else {
        savedNotes.push(note)
        models.Revision.saveNoteRevision(note, _callback)
      }
    }, function (err) {
      if (err) {
        return callback(err, null)
      }
      // return null when no notes need saving at this moment but have delayed tasks to be done
      const result = ((savedNotes.length === 0) && (notes.length > savedNotes.length)) ? null : savedNotes
      return callback(null, result)
    })
  }).catch(function (err) {
    return callback(err, null)
  })
}

export async function syncNote(noteInFS, note): Promise<string> {
  const contentLength = noteInFS.content.length

  let note2 = await note.update({
    title: noteInFS.title,
    content: noteInFS.content,
    lastchangeAt: noteInFS.lastchangeAt
  })
  const revision = await models.Revision.saveNoteRevisionAsync(note2)
  // update authorship on after making revision of docs
  const patch = dmp.patch_fromText(revision.patch)
  const operations = models.Note.transformPatchToOperations(patch, contentLength)
  let authorship = note2.authorship
  for (let i = 0; i < operations.length; i++) {
    authorship = models.Note.updateAuthorshipByOperation(operations[i], null, authorship)
  }
  note2 = await note.update({
    authorship: authorship
  })
  return note2.id
}

export async function createNoteWithRevision(noteAttribute: NoteAttributes): Promise<Note> {
  const note = await Note.create(noteAttribute) as Note
  return new Promise((resolve, reject) => {
    models.Revision.saveNoteRevision(note, function (err) {
      if (err) {
        reject(err)
        return
      }
      resolve(note)
    })
  })
}
