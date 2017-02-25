/* eslint-env browser, jquery */
/* global serverurl */

import {
    checkIfAuth
} from './lib/common/login'

export function getFolders (callback) {
  checkIfAuth(
        () => {
          getFoldersFromServer(callback)
        },
        () => {
          // This feature is only available for authenticated user.
        }
    )
}

function getFoldersFromServer (callback) {
  $.get(`${serverurl}/folders`)
        .done((data) => {
          if (data.folders) {
            callback(data.folders)
          }
        })
        .fail((xhr, status, error) => {
          console.error(xhr.responseText)
        })
}

export function getNotes (folderId, callback) {
  checkIfAuth(
        () => {
          getNotesFromServer(folderId, callback)
        },
        () => {
          // This feature is only available for authenticated user.
        }
    )
}

function getNotesFromServer (folderId, callback) {
  $.get(`${serverurl}/folders/${folderId}/notes`)
        .done((data) => {
          if (data.notes) {
            callback(data.notes)
          }
        })
        .fail((xhr, status, error) => {
          console.error(xhr.responseText)
        })
}

export function deleteFolder (folderId, callback) {
  checkIfAuth(
        () => {
          deleteFolderInServer(folderId, callback)
        },
        () => {
          // This feature is only available for authenticated user.
        }
    )
}

function deleteFolderInServer (folderId, callback) {
  $.get(`${serverurl}/folders/${folderId}/delete`)
        .done((data) => {
          callback(data)
        })
        .fail((xhr, status, error) => {
          console.error(xhr.responseText)
        })
}

export function renameFolder (folderId, newName, callback) {
  checkIfAuth(
        () => {
          renameFolderInServer(folderId, newName, callback)
        },
        () => {
          // This feature is only available for authenticated user.
        }
    )
}

function renameFolderInServer (folderId, newName, callback) {
  $.get(`${serverurl}/folders/${folderId}/rename/${newName}`)
        .done((data) => {
          callback(data)
        })
        .fail((xhr, status, error) => {
          console.error(xhr.responseText)
        })
}

export function newNote (folderId, callback) {
  checkIfAuth(
        () => {
          newNoteInServer(folderId, callback)
        },
        () => {
          // This feature is only available for authenticated user.
        }
    )
}

function newNoteInServer (folderId, callback) {
  $.get(`${serverurl}/folders/${folderId}/new/note`)
        .done((data) => {
          if (data.note) {
            callback(data.note)
          }
        })
        .fail((xhr, status, error) => {
          console.error(xhr.responseText)
        })
}

export function moveNote (noteId, folderId, callback) {
  checkIfAuth(
        () => {
          moveNoteInServer(noteId, folderId, callback)
        },
        () => {
          // This feature is only available for authenticated user.
        }
    )
}

function moveNoteInServer (noteId, folderId, callback) {
  $.get(`${serverurl}/${noteId}/move/${folderId}`)
        .done((data) => {
          callback(data)
        })
        .fail((xhr, status, error) => {
          console.error(xhr.responseText)
        })
}

export function searchKeyword (keyword, callback) {
  checkIfAuth(
        () => {
          searchKeywordInServer(keyword, callback)
        },
        () => {
          // This feature is only available for authenticated user.
        }
    )
}

function searchKeywordInServer (keyword, callback) {
  $.get(`${serverurl}/search/${keyword}`)
        .done((data) => {
          callback(data)
        })
        .fail((xhr, status, error) => {
          console.error(xhr.responseText)
        })
}
