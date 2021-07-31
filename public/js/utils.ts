import base64url from 'base64url'

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function checkNoteIdValid (id) {
  const result = id.match(uuidRegex)
  return !!(result && result.length === 1)
}

export function encodeNoteId (id) {
  // remove dashes in UUID and encode in url-safe base64
  const str = id.replace(/-/g, '')
  const hexStr = Buffer.from(str, 'hex')
  return base64url.encode(hexStr)
}

export function decodeNoteId (encodedId) {
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
