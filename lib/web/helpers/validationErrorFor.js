const i18n = require('i18n')

module.exports = function validationErrorFor (validationErrors, item) {
  if (!validationErrors) return ''

  return validationErrors.get(item).map((error) => {
    return `<div class="alert alert-danger" style="max-width: 400px; margin: 0 auto;">${i18n.__(error.path + '/' + error.message)}</div>`
  }).join('')
}
