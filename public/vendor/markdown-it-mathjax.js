// modified from https://github.com/classeur/markdown-it-mathjax

(function(root, factory) {
	if (typeof exports === 'object') {
		module.exports = factory()
	} else {
		root.markdownitMathjax = factory()
	}
})(this, function() {
	function math(state, silent) {
        if (state.md.meta.mathjax === false) {
            return false
        }
		var startMathPos = state.pos
		if (state.src.charCodeAt(startMathPos) !== 0x5C /* \ */) {
			return false
		}
		var match = state.src.slice(++startMathPos).match(/^(?:\\\[|\\\(|begin\{([^}]*)\})/)
		if (!match) {
			return false
		}
		startMathPos += match[0].length
		var type, endMarker, includeMarkers
		if (match[0] === '\\[') {
			type = 'display_math'
			endMarker = '\\\\]'
		} else if (match[0] === '\\(') {
			type = 'inline_math'
			endMarker = '\\\\)'
		} else if (match[1]) {
			type = 'math'
			endMarker = '\\end{' + match[1] + '}'
			includeMarkers = true
		}
		var endMarkerPos = state.src.indexOf(endMarker, startMathPos)
		if (endMarkerPos === -1) {
			return false
		}
		var nextPos = endMarkerPos + endMarker.length
		if (!silent) {
			var token = state.push(type + '_open', 'span', 1);
            token.attrs = [ ['class', 'mathjax raw'] ];
            token = state.push(type, '', 0);
			token.content = includeMarkers ?
				state.src.slice(state.pos, nextPos) : state.src.slice(startMathPos, endMarkerPos)
            token = state.push(type + '_close', 'span', -1);
		}
		state.pos = nextPos
		return true
	}

	function texMath(state, silent) {
        if (state.md.meta.mathjax === false) {
            return false
        }
		var startMathPos = state.pos
		if (state.src.charCodeAt(startMathPos) !== 0x24 /* $ */) {
			return false
		}

		// Parse tex math according to http://pandoc.org/README.html#math
		var endMarker = '$'
		var afterStartMarker = state.src.charCodeAt(++startMathPos)
		if (afterStartMarker === 0x24 /* $ */) {
			endMarker = '$$'
			if (state.src.charCodeAt(++startMathPos) === 0x24 /* $ */) {
				// 3 markers are too much
				return false
			}
		} else {
			// Skip if opening $ is succeeded by a space character
			if (afterStartMarker === 0x20 /* space */ || afterStartMarker === 0x09 /* \t */ || afterStartMarker === 0x0a /* \n */) {
				return false
			}
		}
		var endMarkerPos = state.src.indexOf(endMarker, startMathPos)
		if (endMarkerPos === -1) {
			return false
		}
		if (state.src.charCodeAt(endMarkerPos - 1) === 0x5C /* \ */) {
			return false
		}
		var nextPos = endMarkerPos + endMarker.length
		if (endMarker.length === 1) {
			// Skip if $ is preceded by a space character
			var beforeEndMarker = state.src.charCodeAt(endMarkerPos - 1)
			if (beforeEndMarker === 0x20 /* space */ || beforeEndMarker === 0x09 /* \t */ || beforeEndMarker === 0x0a /* \n */) {
				return false
			}
			// Skip if closing $ is succeeded by a digit (eg $5 $10 ...)
			var suffix = state.src.charCodeAt(nextPos)
			if (suffix >= 0x30 && suffix < 0x3A) {
				return false
			}
		}

		if (!silent) {
            var type = endMarker.length === 1 ? 'inline_math' : 'display_math';
			var token = state.push(type + '_open', 'span', 1)
            token.attrs = [ ['class', 'mathjax raw'] ]
            token = state.push(type, '', 0);
			token.content = state.src.slice(startMathPos, endMarkerPos);
            token = state.push(type + '_close', 'span', -1);
		}
		state.pos = nextPos
		return true
	}

	function escapeHtml(html) {
		return html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ')
	}

	return function(md) {
		md.inline.ruler.before('escape', 'math', math)
		md.inline.ruler.push('texMath', texMath)
		md.renderer.rules.math = function(tokens, idx) {
			return escapeHtml(tokens[idx].content)
		}
		md.renderer.rules.inline_math = function(tokens, idx) {
			return '\\(' + escapeHtml(tokens[idx].content) + '\\)'
		}
		md.renderer.rules.display_math = function(tokens, idx) {
			return '\\[' + escapeHtml(tokens[idx].content) + '\\]'
		}
	}
})
