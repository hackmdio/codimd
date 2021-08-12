/* eslint-env browser, jquery */

function setUpSubmitEvent () {
  const form = document.getElementById('form')
  form.setAttribute('action', window.location.origin + window.location.pathname + '/tryPassword')
}

setUpSubmitEvent()
