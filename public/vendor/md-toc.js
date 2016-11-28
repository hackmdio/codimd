/**
 * md-toc.js v1.0.2
 * https://github.com/yijian166/md-toc.js
 */

(function (window) {
    function Toc(id, options) {
        this.el = document.getElementById(id);
        if (!this.el) return;
        this.options = options || {};
        this.tocLevel = parseInt(options.level) || 0;
        this.tocClass = options['class'] || 'toc';
        this.ulClass = options['ulClass'];
        this.tocTop = parseInt(options.top) || 0;
        this.elChilds = this.el.children;
        this.process = options['process'];
        if (!this.elChilds.length) return;
        this._init();
    }

    Toc.prototype._init = function () {
        this._collectTitleElements();
        this._createTocContent();
        this._showToc();
    };

    Toc.prototype._collectTitleElements = function () {
        this._elTitlesNames = [],
            this.elTitleElements = [];
        for (var i = 1; i < 7; i++) {
            if (this.el.getElementsByTagName('h' + i).length) {
                this._elTitlesNames.push('h' + i);
            }
        }

        this._elTitlesNames.length = this._elTitlesNames.length > this.tocLevel ? this.tocLevel : this._elTitlesNames.length;

        for (var j = 0; j < this.elChilds.length; j++) {
            this._elChildName = this.elChilds[j].tagName.toLowerCase();
            if (this._elTitlesNames.toString().match(this._elChildName)) {
                this.elTitleElements.push(this.elChilds[j]);
            }
        }
    };

    Toc.prototype._createTocContent = function () {
        this._elTitleElementsLen = this.elTitleElements.length;
        if (!this._elTitleElementsLen) return;
        this.tocContent = '';
        this._tempLists = [];

        var url = location.origin + location.pathname;
        for (var i = 0; i < this._elTitleElementsLen; i++) {
            var j = i + 1;
            this._elTitleElement = this.elTitleElements[i];
            this._elTitleElementName = this._elTitleElement.tagName;
            this._elTitleElementText = (typeof this.process === 'function' ? this.process(this._elTitleElement) : this._elTitleElement.innerHTML).replace(/<(?:.|\n)*?>/gm, '');
            var id = this._elTitleElement.getAttribute('id');
            if (!id) {
                this._elTitleElement.setAttribute('id', 'tip' + i);
                id = '#tip' + i;
            } else {
                id = '#' + id;
            }

            this.tocContent += '<li><a href="' + id + '">' + this._elTitleElementText + '</a>';

            if (j != this._elTitleElementsLen) {
                this._elNextTitleElementName = this.elTitleElements[j].tagName;
                if (this._elTitleElementName != this._elNextTitleElementName) {
                    var checkColse = false,
                        y = 1;
                    for (var t = this._tempLists.length - 1; t >= 0; t--) {
                        if (this._tempLists[t].tagName == this._elNextTitleElementName) {
                            checkColse = true;
                            break;
                        }
                        y++;
                    }
                    if (checkColse) {
                        this.tocContent += new Array(y + 1).join('</li></ul>');
                        this._tempLists.length = this._tempLists.length - y;
                    } else {
                        this._tempLists.push(this._elTitleElement);
                        if (this.ulClass)
                            this.tocContent += '<ul class="' + this.ulClass + '">';
                        else
                            this.tocContent += '<ul>';
                    }
                } else {
                    this.tocContent += '</li>';
                }
            } else {
                if (this._tempLists.length) {
                    this.tocContent += new Array(this._tempLists.length + 1).join('</li></ul>');
                } else {
                    this.tocContent += '</li>';
                }
            }
        }
        if (this.ulClass)
            this.tocContent = '<ul class="' + this.ulClass + '">' + this.tocContent + '</ul>';
        else
            this.tocContent = '<ul>' + this.tocContent + '</ul>';
    };

    Toc.prototype._showToc = function () {
        this.toc = document.createElement('div');
        this.toc.innerHTML = this.tocContent;
        this.toc.setAttribute('class', this.tocClass);
        if (!this.options.targetId) {
            this.el.appendChild(this.toc);
        } else {
            document.getElementById(this.options.targetId).appendChild(this.toc);
        }
        var self = this;
        if (this.tocTop > -1) {
            window.onscroll = function () {
                var t = document.documentElement.scrollTop || document.body.scrollTop;
                if (t < self.tocTop) {
                    self.toc.setAttribute('style', 'position:absolute;top:' + self.tocTop + 'px;');
                } else {
                    self.toc.setAttribute('style', 'position:fixed;top:10px;');
                }
            }
        }
    };
    window.Toc = Toc;
})(window);