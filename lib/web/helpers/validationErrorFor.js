module.exports = function validationErrorFor(validationErrors, item) {
  if (!validationErrors) return ''

  return validationErrors.get(item).map((error) => {
    return `<div class="alert alert-danger" style="max-width: 400px; margin: 0 auto;">${error.path}: ${error.message}.</div>`
  }).join('')
}
