/* eslint-env browser, jquery */
/* global Cookies */

import $ from 'jquery'
import Cookies from 'js-cookie'

const userLang = navigator.language || navigator.userLanguage
const userLangCode = userLang.split('-')[0]

let lang = 'en'
let supportLangs: string[] = []

function reloadLanguageFromCookie () {
  if (Cookies.get('locale')) {
    lang = Cookies.get('locale') as string
    if (lang === 'zh') {
      lang = 'zh-TW'
    }
  } else if (supportLangs.indexOf(userLang) !== -1) {
    lang = supportLangs[supportLangs.indexOf(userLang)]
  } else if (supportLangs.indexOf(userLangCode) !== -1) {
    lang = supportLangs[supportLangs.indexOf(userLangCode)]
  }
}

function fillSupportLanguageArrayFromDropdownOptions () {
  const $langOptions = $('.ui-locale option');
  $langOptions.each(function () {
    supportLangs.push($(this).val() as string)
  })
}

export function initializeLocaleDropdown() {
  const $locale = $('.ui-locale')

  fillSupportLanguageArrayFromDropdownOptions()
  reloadLanguageFromCookie()

  $locale.val(lang)
  $('select.ui-locale option[value="' + lang + '"]').attr('selected', 'selected')

  $locale.on('change', function () {
    Cookies.set('locale', $(this).val() as string, {
      expires: 365
    })
    window.location.reload()
  })
}
