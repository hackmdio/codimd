import {saveAs} from 'file-saver'
import $ from 'jquery'
import List from 'list.js'
import unescapeHTML from 'lodash/unescape'
import moment from 'moment'

import '../css/cover.css'
import '../css/site.css'

import {
  clearDuplicatedHistory,
  clearServerHistoryAsync,
  deleteServerHistoryAsync,
  getHistory,
  getHistoryAsync,
  getStorageHistory,
  NoteHistory,
  parseHistory,
  parseServerToHistory,
  parseStorageToHistory,
  postHistoryToServerAsync,
  removeHistory,
  saveHistory,
  saveStorageHistoryToServer
} from './history'

import {
  checkIfAuth,
  clearLoginState,
  getLoginState,
  getLoginUserProfile, isLogin,
  resetCheckAuth,
  setLoginStateChangeEvent
} from './lib/common/login'
import {serverurl} from "./lib/config";

import {initializeLocaleDropdown} from "./locale";

initializeLocaleDropdown()

setLoginStateChangeEvent(pageInit)

void pageInit()

async function pageInit() {
  try {
    const profile = await getLoginUserProfile()
    $('.ui-signin').hide()
    $('.ui-or').hide()
    $('.ui-welcome').show()
    if (profile.photo) $('.ui-avatar').prop('src', profile.photo).show()
    else $('.ui-avatar').prop('src', '').hide()
    $('.ui-name').html(profile.name)
    $('.ui-signout').show()
    navSection.historyPageBtn.trigger('click')
    parseServerToHistory(historyList, parseHistoryCallback)
  } catch (err) {
    $('.ui-signin').show()
    $('.ui-or').show()
    $('.ui-welcome').hide()
    $('.ui-avatar').prop('src', '').hide()
    $('.ui-name').html('')
    $('.ui-signout').hide()
    parseStorageToHistory(historyList, parseHistoryCallback)
  }
}

// prevent empty link change hash
$('a[href="#"]').on('click', function (e) {
  e.preventDefault()
})

/**
 * masthead nav section
 */
const navSection = {
  introPageBtn: $('.ui-home'),
  historyPageBtn: $('.ui-history'),
  deleteUserModalCancel: $('.ui-delete-user-modal-cancel'),
  logoutBtn: $('.ui-logout')
}
const introSection = $('#home')
const historySection = $('#history')

navSection.introPageBtn.on('click', function (e) {
  if (!introSection.is(':visible')) {
    $('.section:visible').hide()
    introSection.fadeIn()
  }
})

navSection.historyPageBtn.on('click', () => {
  if (!historySection.is(':visible')) {
    $('.section:visible').hide()
    historySection.fadeIn()
  }
})

navSection.deleteUserModalCancel.on('click', () => {
  $('.ui-delete-user').parent().removeClass('active')
})

navSection.logoutBtn.on('click', () => {
  clearLoginState()
  location.href = `${serverurl}/logout`
})

/**
 * History Section
 */

const options: List.ListOptions = {
  valueNames: ['id', 'text', 'timestamp', 'fromNow', 'time', 'tags', 'pinned'],
  item: `<li class="col-xs-12 col-sm-6 col-md-6 col-lg-4">
          <span class="id" style="display:none;"></span>
          <a href="#">
            <div class="item">
              <div class="ui-history-pin fa fa-thumb-tack fa-fw"></div>
              <div class="ui-history-close fa fa-close fa-fw" data-toggle="modal" data-target=".delete-history-modal"></div>
              <div class="content">
                <h4 class="text"></h4>
                <p>
                  <i><i class="fa fa-clock-o"></i> visited </i><i class="fromNow"></i>
                  <br>
                  <i class="timestamp" style="display:none;"></i>
                  <i class="time"></i>
                </p>
                <p class="tags"></p>
              </div>
            </div>
          </a>
        </li>`,
  page: 18,
  pagination: {
    outerWindow: 1
  }
}
const historyList = new List('history', options)

/**
 * History Tool Bar
 */
const historyListContainer = $('#history-list')
const historyPagination = $('.pagination')
const historyToolbar = {
  importFromBrowserBtn: $('.ui-import-from-browser'),
  clearHistoryBtn: $('.ui-clear-history'),
  saveHistoryBtn: $('.ui-save-history'),
  openHistoryFile: $('.ui-open-history'),
  tagFilter: $('.ui-use-tags')
}

/**
 * clear all history
 */
historyToolbar.clearHistoryBtn.on('click', () => {
  $('.ui-delete-history-modal-msg').text('Do you really want to clear all history?')
  $('.ui-delete-history-modal-item').html('There is no turning back.')
  isClearAllHistory = true
  deleteHistoryModalTargetId = null
})

historyToolbar.importFromBrowserBtn.on('click', () => {
  saveStorageHistoryToServer(() => {
    parseStorageToHistory(historyList, parseHistoryCallback)
  })
})

historyToolbar.saveHistoryBtn.on('click', async function () {
  const history = JSON.stringify(await getHistoryAsync())
  const blob = new Blob([history], {
    type: 'application/json;charset=utf-8'
  })
  saveAs(blob, `codimd_history_${moment().format('YYYYMMDDHHmmss')}`, true)
})

historyToolbar.openHistoryFile.on('change', function (e) {
  const files = e.target.files || e.dataTransfer.files
  const file = files[0]
  const reader = new FileReader()
  reader.onload = () => {
    const notehistory = JSON.parse(reader.result)
    // console.log(notehistory);
    if (!reader.result) return
    getHistory(data => {
      let mergedata = data.concat(notehistory)
      mergedata = clearDuplicatedHistory(mergedata)
      saveHistory(mergedata)
      parseHistory(historyList, parseHistoryCallback)
    })
    historyToolbar.openHistoryFile.replaceWith(historyToolbar.openHistoryFile.val('').clone(true))
  }
  reader.readAsText(file)
})

$('.ui-refresh-history').on('click', () => {
  const lastTags = historyToolbar.tagFilter.select2('val')
  historyToolbar.tagFilter.select2('val', '')
  historyList.filter()
  const lastKeyword = $('.search').val()
  $('.search').val('')
  historyList.search()
  historyListContainer.slideUp('fast')
  historyPagination.hide()

  resetCheckAuth()
  historyList.clear()
  parseHistory(historyList, (list, notehistory) => {
    parseHistoryCallback(list, notehistory)
    historyToolbar.tagFilter.select2('val', lastTags)
    historyToolbar.tagFilter.trigger('change')
    historyList.search(lastKeyword)
    $('.search').val(lastKeyword)
    refreshHistoryUIElementVisibility()
    historyListContainer.slideDown('fast')
  })
})


let filtertags = []
historyToolbar.tagFilter.select2({
  placeholder: historyToolbar.tagFilter.attr('placeholder'),
  multiple: true,
  data() {
    return {
      results: filtertags
    }
  }
})
$('.select2-input').css('width', 'inherit')
buildTagsFilter([])

function buildTagsFilter(tags) {
  for (let i = 0; i < tags.length; i++) {
    tags[i] = {
      id: i,
      text: unescapeHTML(tags[i])
    }
  }
  filtertags = tags
}


historyToolbar.tagFilter.on('change', function () {
  const tags = []
  const data = $(this).select2('data')
  for (let i = 0; i < data.length; i++) {
    tags.push(data[i].text)
  }
  if (tags.length > 0) {
    historyList.filter(item => {
      const values = item.values()
      if (!values.tags) return false
      let found = false
      for (let i = 0; i < tags.length; i++) {
        if (values.tags.includes(tags[i])) {
          found = true
          break
        }
      }
      return found
    })
  } else {
    historyList.filter()
  }
  refreshHistoryUIElementVisibility()
})

$('.search').on('keyup', () => {
  refreshHistoryUIElementVisibility()
})


// ----------------------------------------------------------------------------------------------------------------

function refreshHistoryUIElementVisibility() {
  if (historyListContainer.children().length > 0) {
    historyPagination.show()
    $('.ui-nohistory').hide()
    historyToolbar.importFromBrowserBtn.hide()
    return
  }
  historyPagination.hide()
  $('.ui-nohistory').slideDown()
  getStorageHistory(data => {
    if (data && data.length > 0 && getLoginState() && historyList.items.length === 0) {
      historyToolbar.importFromBrowserBtn.slideDown()
    }
  })
}

function parseHistoryCallback(list, notehistory) {
  refreshHistoryUIElementVisibility()
  // sort by pinned then timestamp
  list.sort('', {
    sortFunction(a, b) {
      const notea = a.values()
      const noteb = b.values()
      if (notea.pinned && !noteb.pinned) {
        return -1
      } else if (!notea.pinned && noteb.pinned) {
        return 1
      } else {
        if (notea.timestamp > noteb.timestamp) {
          return -1
        } else if (notea.timestamp < noteb.timestamp) {
          return 1
        } else {
          return 0
        }
      }
    }
  })
  // parse filter tags
  const filtertags = []
  for (let i = 0, l = list.items.length; i < l; i++) {
    const tags = list.items[i]._values.tags
    if (tags && tags.length > 0) {
      for (let j = 0; j < tags.length; j++) {
        // push info filtertags if not found
        let found = false
        if (filtertags.includes(tags[j])) {
          found = true
        }
        if (!found) {
          filtertags.push(tags[j])
        }
      }
    }
  }
  buildTagsFilter(filtertags)
}

// update items whenever list updated
historyList.on('updated', function (e) {
  for (let i = 0, l = e.items.length; i < l; i++) {
    const item = e.items[i]
    if (item.visible()) {
      const itemEl = $(item.elm)
      const values = item._values
      const a = itemEl.find('a')
      const pin = itemEl.find('.ui-history-pin')
      const tagsEl = itemEl.find('.tags')
      // parse link to element a
      a.attr('href', `${serverurl}/${values.id}`)
      // parse pinned
      if (values.pinned) {
        pin.addClass('active')
      } else {
        pin.removeClass('active')
      }
      // parse tags
      const tags = values.tags
      if (tags && tags.length > 0 && tagsEl.children().length <= 0) {
        const labels: string[] = []
        for (let j = 0; j < tags.length; j++) {
          // push into the item label
          labels.push(`<span class='label label-default'>${tags[j]}</span>`)
        }
        tagsEl.html(labels.join(' '))
      }
    }
  }
  $('.ui-history-close').off('click')
  $('.ui-history-close').on('click', onHistoryCloseClick)
  $('.ui-history-pin').off('click')
  $('.ui-history-pin').on('click', historyPinClick)
})

/**
 * Delete History Modal
 */
let isClearAllHistory: boolean = false
let deleteHistoryModalTargetId: string | null = null

function onHistoryCloseClick(this: HTMLElement, e) {
  e.preventDefault()
  const id: string = $(this).closest('a').siblings('span').html()
  const value: NoteHistory = historyList.get('id', id)[0].values()
  $('.ui-delete-history-modal-msg').text('Do you really want to delete below history?')
  $('.ui-delete-history-modal-item').html(`<i class="fa fa-file-text"></i> ${value.text}<br><i class="fa fa-clock-o"></i> ${value.time}`)
  isClearAllHistory = false
  deleteHistoryModalTargetId = id
}

$('.ui-delete-history-modal-confirm').on('click', async function () {
  if (await isLogin()) {
    if (isClearAllHistory) {
      await clearServerHistoryAsync()
    } else {
      if (deleteHistoryModalTargetId) {
        await deleteServerHistoryAsync(deleteHistoryModalTargetId)
      }
    }
    refreshHistoryUIElementVisibility()
    $('.delete-history-modal').modal('hide')
    deleteHistoryModalTargetId = null
    isClearAllHistory = false
  } else {
    if (isClearAllHistory) {
      saveHistory([])
      historyList.clear()
      refreshHistoryUIElementVisibility()
      deleteHistoryModalTargetId = null
    } else {
      if (!deleteHistoryModalTargetId) return
      getHistory(notehistory => {
        const newnotehistory = removeHistory(deleteHistoryModalTargetId, notehistory)
        saveHistory(newnotehistory)
        historyList.remove('id', deleteHistoryModalTargetId)
        refreshHistoryUIElementVisibility()
        deleteHistoryModalTargetId = null
      })
    }
    $('.delete-history-modal').modal('hide')
    isClearAllHistory = false
  }
})

/**
 * Pin History
 */

function historyPinClick(e) {
  e.preventDefault()
  const $this = $(this)
  const id = $this.closest('a').siblings('span').html()
  const item = historyList.get('id', id)[0]
  const values = item._values
  let pinned = values.pinned
  if (!values.pinned) {
    pinned = true
    item._values.pinned = true
  } else {
    pinned = false
    item._values.pinned = false
  }
  checkIfAuth(() => {
    postHistoryToServerAsync(id, {pinned})
      .then(() => {
        if (pinned) {
          $this.addClass('active')
        } else {
          $this.removeClass('active')
        }
      })
      .catch(err => {
        console.error(err)
      })
  }, () => {
    getHistory(notehistory => {
      for (let i = 0; i < notehistory.length; i++) {
        if (notehistory[i].id === id) {
          notehistory[i].pinned = pinned
          break
        }
      }
      saveHistory(notehistory)
      if (pinned) {
        $this.addClass('active')
      } else {
        $this.removeClass('active')
      }
    })
  })
}

// auto update item fromNow every minutes
setInterval(updateItemFromNow, 60000)

function updateItemFromNow() {
  const items = $('.item').toArray()
  for (let i = 0; i < items.length; i++) {
    const item = $(items[i])
    const timestamp = parseInt(item.find('.timestamp').text())
    item.find('.fromNow').text(moment(timestamp).fromNow())
  }
}
