
const { Note, ArchivedNoteAlias, sequelize } = require('../models');
const realtime = require('../realtime/realtime');

const forbiddenAlias = ['', 'new', 'me', 'history', '403', '404', '500', 'config'];
const sanitize = (alias) => {
  return alias.replace(/( |\/)/, '');
}

const asyncGetNote = async (originAliasOrNoteId) => {
  const noteId = await Note.parseNoteIdAsync(originAliasOrNoteId);
  const note = await Note.findOne({
    where: {
      id: noteId
    }
  })
  if (!note) {
    throw Error('Can\'t find the note.');
  }
  return note;
}

const asyncGetNoteIdForAliasConflict = async (alias) => {
  const sanitizedAlias = sanitize(alias);
  const p1 = Note.findOne({
    where: {
      alias: sanitizedAlias
    }
  });
  const p2 = ArchivedNoteAlias.findOne({
    where: {
      alias: sanitizedAlias
    }
  });
  const [conflictNote, conflictAarchivedAlias] = await Promise.all([p1, p2]);

  if (conflictNote) {
    return conflictNote.id
  }
  if (conflictAarchivedAlias) {
    return conflictAarchivedAlias.noteId
  }
  return null;
}

const asyncCheckAliasValid = async (originAliasOrNoteId, alias) => {
  const sanitizedAlias = sanitize(alias);
  if (forbiddenAlias.indexOf(sanitizedAlias) > -1) {
    return false;
  }

  const conflictNoteId = await asyncGetNoteIdForAliasConflict(alias)
    .catch((err) => { throw err });

  const note = await asyncGetNote(originAliasOrNoteId)
    .catch((err) => { throw err });

  return !conflictNoteId || conflictNoteId === note.id;
}

const asyncUpdateAlias = async (originAliasOrNoteId, alias) => {
  const sanitizedAlias = sanitize(alias);
  const note = await asyncGetNote(originAliasOrNoteId)
    .catch((err) => { throw err });

  const t = await sequelize.transaction();
  if (note.alias) {
    const archivedAlias = await ArchivedNoteAlias.findOne({
      where: {
        alias: note.alias,
      }
    })
      .catch(async err => { throw err })
    if (!archivedAlias) {
      await ArchivedNoteAlias.create({
        noteId: note.id,
        alias: note.alias
      }, { transaction: t })
        .catch(async err => {
          await t.rollback();
          throw Error('Add archived note alias failed. ' + err.message);
        })
    }
  }

  const updatedNote = await note.update({
    alias: sanitizedAlias,
    lastchangeAt: Date.now()
  }, { transaction: t })
    .catch(async err => {
      await t.rollback();
      throw Error('Write note content error. ' + err.message);
    })

  await t.commit();

  realtime.io.to(updatedNote.id)
    .emit('alias updated', {
      alias: updatedNote.alias
    });

  return true;
}

exports.sanitize = sanitize;
exports.asyncGetNote = asyncGetNote;
exports.asyncCheckAliasValid = asyncCheckAliasValid;
exports.asyncUpdateAlias = asyncUpdateAlias;
