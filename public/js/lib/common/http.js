/* eslint-env browser, jquery */
/* global Cookies */

export function checkIfHttp () {
  if (window.location.protocol === 'http:') {
    $('#http-warning').removeClass('hidden')
  }
}
