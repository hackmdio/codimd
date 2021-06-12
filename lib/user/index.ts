import archiver from 'archiver'
import async from 'async'
import * as response from '../response'
import config from '../config'
import {Note, User} from '../models'
import {logger} from '../logger'
import {generateAvatar} from '../letter-avatars'

export async function getMe(req, res) {
  if (!req.isAuthenticated()) {
    return res.status(401).send({
      status: 'forbidden'
    })
  }

  const user = await User.findOne({
    where: {
      id: req.user.id
    }
  })

  if (!user) {
    return response.errorNotFound(req, res)
  }
  const profile = User.getProfile(user)

  res.send({
    status: 'ok',
    id: req.user.id,
    name: profile.name,
    photo: profile.photo
  })
}

export async function deleteUser(req, res) {
  if (!req.isAuthenticated()) {
    return response.errorForbidden(req, res)
  }

  const user = await User.findOne({
    where: {
      id: req.user.id
    }
  })

  if (!user) {
    return response.errorNotFound(req, res)
  }

  if (user.deleteToken !== req.params.token) {
    return response.errorForbidden(req, res)
  }

  await user.destroy()
  return res.redirect(config.serverURL + '/')
}

export function exportMyData(req, res) {
  if (!req.isAuthenticated()) {
    return response.errorForbidden(req, res)
  }

  const archive = archiver('zip', {
    zlib: {level: 3} // Sets the compression level.
  })

  res.setHeader('Content-Type', 'application/zip')
  res.attachment('archive.zip')
  archive.pipe(res)
  archive.on('error', function (err) {
    logger.error('export user data failed: ' + err)
    return response.errorInternalError(req, res)
  })

  User.findOne({
    where: {
      id: req.user.id
    }
  }).then(function (user) {
    Note.findAll({
      where: {
        ownerId: user.id
      }
    }).then(function (notes) {
      const filenames = {}
      async.each(notes, function (note, callback) {
        const basename = note.title.replace(/\//g, '-') // Prevent subdirectories
        let filename
        let suffix = 0
        do {
          if (suffix === 0) {
            filename = basename + '.md'
          } else {
            filename = basename + '-' + suffix + '.md'
          }
          suffix++
        } while (filenames[filename])
        filenames[filename] = true

        logger.debug('Write: ' + filename)
        archive.append(Buffer.from(note.content), {name: filename, date: note.lastchangeAt})
        callback(null, null)
      }, function (err) {
        if (err) {
          return response.errorInternalError(req, res)
        }

        archive.finalize()
      })
    })
  }).catch(function (err) {
    logger.error('export user data failed: ' + err)
    return response.errorInternalError(req, res)
  })
}

export function getMyAvatar(req, res) {
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.send(generateAvatar(req.params.username))
}
