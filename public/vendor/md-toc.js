/* eslint-env browser, jquery */
/**
 * md-toc.js v1.0.2
 * https://github.com/yijian166/md-toc.js
 */

(function (window) {
  function Toc (id, options) {
    this.el = document.getElementById(id)
    if (!this.el) return
    this.options = options || {}
    this.tocLevel = parseInt(options.level) || 0
    this.tocClass = options['class'] || 'toc'
    this.ulClass = options['ulClass']
    this.tocTop = parseInt(options.top) || 0
    this.elChilds = this.el.children
    this.process = options['process']
    if (!this.elChilds.length) return
    this._init()
  }

  Toc.prototype._init = function () {
    this._collectTitleElements()
    this._createTocContent()
    this._showToc()
  }

  Toc.prototype._collectTitleElements = function () {
    this._elTitlesNames = []
    this.elTitleElements = []
    for (var i = 1; i < 6; i++) {
      if (this.el.getElementsByTagName('h' + i).length) {
        this._elTitlesNames.push('h' + i)
      }
    }

    this._elTitlesNames.length = this._elTitlesNames.length > this.tocLevel ? this.tocLevel : this._elTitlesNames.length

    for (var j = 0; j < this.elChilds.length; j++) {
      this._elChildName = this.elChilds[j].tagName.toLowerCase()
      if (this._elTitlesNames.toString().match(this._elChildName)) {
        this.elTitleElements.push(this.elChilds[j])
      }
    }
  }

  Toc.prototype._createTocContent = function recursiveToc(level = 0, titleElements = [], titleNames = [], ulClass = undefined, index = 0) {
    // Inititalize our elements from the toc object
    // which is only available on level 0
    if (level === 0) {
      titleElements = this.elTitleElements
      titleNames = this._elTitlesNames
      ulClass = this.ulClass
    }
    // No need to do anything for an empty ToC
    if (!titleElements.length) return

    var content = '<ul'
    if (ulClass) {
      content += ' class="' + ulClass + '"'
    }
    content += '>\n'
    var iterTag = titleNames[level]
    var recurse = false
    var openTag = false

    for (var element; element = titleElements.shift();) {
      var elementTag = element.tagName.toLowerCase()

      // We only care about tags on our level to add them as list item
      if (elementTag == iterTag) {
        // Let's do some cleaning
        var elementTitle = element.textContent.replace(/"/g, '&quot;')
        var elementText = (typeof this.process === 'function' ? this.process(element) : element.innerHTML).replace(/<(?:.|\n)*?>/gm, '')
        var id = element.getAttribute('id')
        if (!id) {
          element.setAttribute('id', 'tip' + ++index)
          id = '#tip' + index
        } else {
          id = '#' + id
        }
        if (openTag) {
          content += '</li>\n'
          openTag = false
        }
        content += '<li><a href="' + id + '" title="'+ elementTitle +'">' + elementText + '</a>'
        // Reset recursion. We need it for the next subsections
        recurse = false
        openTag = true
      // Check if the current element has a lower level than ours, if so, we have to go down the rabbithole!
      } else if (!recurse && titleNames.indexOf(elementTag.toLowerCase()) > level) {
        recurse = true
        if (!openTag) {
          content += '<li class="invisable-node">'
          openTag = true
        }
        // This element is for the lower lever, we have to re-add it before we send the list down there.
        titleElements.unshift(element)
        // Let's call ourself and get to the next level
        content += recursiveToc(level + 1, titleElements, titleNames, ulClass, index)
      } else {
        // When we end up here, met a higher level element
        // This is not our business so back into the list with the element and let's end this loop
        titleElements.unshift(element)
        break
      }
    }

    if (openTag) {
      content += '</li>\n'
    }
    content += '</ul>\n'

    // Set ToC content of the level 0 everything else pass things to the upper level!
    if (level === 0) {
      this.tocContent = content
    } else {
      return content
    }
  }

  Toc.prototype._showToc = function () {
    this.toc = document.createElement('div')
    this.toc.innerHTML = this.tocContent
    this.toc.setAttribute('class', this.tocClass)
    if (!this.options.targetId) {
      this.el.appendChild(this.toc)
    } else {
      document.getElementById(this.options.targetId).appendChild(this.toc)
    }
    var self = this
    if (this.tocTop > -1) {
      window.onscroll = function () {
        var t = document.documentElement.scrollTop || document.body.scrollTop
        if (t < self.tocTop) {
          self.toc.setAttribute('style', 'position:absolute;top:' + self.tocTop + 'px;')
        } else {
          self.toc.setAttribute('style', 'position:fixed;top:10px;')
        }
      }
    }
  }
  window.Toc = Toc
})(window)
