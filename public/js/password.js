/* eslint-env browser, jquery */

function setUpSubmitEvent () {
  const form = document.getElementById('form')
  const location = window.location
  form.setAttribute('action', `${location.origin}/${location.pathname.split('/')[1]}/tryPassword`)
}

setUpSubmitEvent()
