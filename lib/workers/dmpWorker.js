'use strict'
// external modules
var DiffMatchPatch = require('@hackmd/diff-match-patch')
var dmp = new DiffMatchPatch()

// core
var config = require('../config')
var logger = require('../logger')

process.on('message', function (data) {
  if (!data || !data.msg || !data.cacheKey) {
    return logger.error('dmp worker error: not enough data')
  }
  switch (data.msg) {
    case 'create patch':
      if (!Object.hasOwnProperty.call(data, 'lastDoc') || !Object.hasOwnProperty.call(data, 'currDoc')) {
        return logger.error('dmp worker error: not enough data on create patch')
      }
      try {
        var patch = createPatch(data.lastDoc, data.currDoc)
        process.send({
          msg: 'check',
          result: patch,
          cacheKey: data.cacheKey
        })
      } catch (err) {
        logger.error('dmp worker error', err)
        process.send({
          msg: 'error',
          error: err,
          cacheKey: data.cacheKey
        })
      }
      break
    case 'get revision':
      if (!Object.hasOwnProperty.call(data, 'revisions') || !Object.hasOwnProperty.call(data, 'count')) {
        return logger.error('dmp worker error: not enough data on get revision')
      }
      try {
        var result = getRevision(data.revisions, data.count)
        process.send({
          msg: 'check',
          result: result,
          cacheKey: data.cacheKey
        })
      } catch (err) {
        logger.error('dmp worker error', err)
        process.send({
          msg: 'error',
          error: err,
          cacheKey: data.cacheKey
        })
      }
      break
  }
})

function createPatch (lastDoc, currDoc) {
  var msStart = (new Date()).getTime()
  var diff = dmp.diff_main(lastDoc, currDoc)
  var patch = dmp.patch_make(lastDoc, diff)
  patch = dmp.patch_toText(patch)
  var msEnd = (new Date()).getTime()
  if (config.debug) {
    logger.info(patch)
    logger.info((msEnd - msStart) + 'ms')
  }
  return patch
}

function getRevision (revisions, count) {
  var msStart = (new Date()).getTime()
  var startContent = null
  var lastPatch = []
  var applyPatches = []
  var authorship = []
  if (count <= Math.round(revisions.length / 2)) {
    // start from top to target
    for (let i = 0; i < count; i++) {
      const revision = revisions[i]
      if (i === 0) {
        startContent = revision.content || revision.lastContent
      }
      if (i !== count - 1) {
        const patch = dmp.patch_fromText(revision.patch)
        applyPatches = applyPatches.concat(patch)
      }
      lastPatch = revision.patch
      authorship = revision.authorship
    }
    // swap DIFF_INSERT and DIFF_DELETE to achieve unpatching
    for (let i = 0, l = applyPatches.length; i < l; i++) {
      for (let j = 0, m = applyPatches[i].diffs.length; j < m; j++) {
        var diff = applyPatches[i].diffs[j]
        if (diff[0] === DiffMatchPatch.DIFF_INSERT) { diff[0] = DiffMatchPatch.DIFF_DELETE } else if (diff[0] === DiffMatchPatch.DIFF_DELETE) { diff[0] = DiffMatchPatch.DIFF_INSERT }
      }
    }
  } else {
    // start from bottom to target
    var l = revisions.length - 1
    for (var i = l; i >= count - 1; i--) {
      const revision = revisions[i]
      if (i === l) {
        startContent = revision.lastContent
        authorship = revision.authorship
      }
      if (revision.patch) {
        const patch = dmp.patch_fromText(revision.patch)
        applyPatches = applyPatches.concat(patch)
      }
      lastPatch = revision.patch
      authorship = revision.authorship
    }
  }
  try {
    var finalContent = dmp.patch_apply(applyPatches, startContent)[0]
  } catch (err) {
    throw new Error(err)
  }
  var data = {
    content: finalContent,
    patch: dmp.patch_fromText(lastPatch),
    authorship: authorship
  }
  var msEnd = (new Date()).getTime()
  if (config.debug) {
    logger.info((msEnd - msStart) + 'ms')
  }
  return data
}

// log uncaught exception
process.on('uncaughtException', function (err) {
  logger.error('An uncaught exception has occured.')
  logger.error(err)
  logger.error('Process will exit now.')
  process.exit(1)
})
