export function parseFenceCodeParams (lang) {
  const attrMatch = lang.match(/{(.*)}/)
  const params = {}
  if (attrMatch && attrMatch.length >= 2) {
    const attrs = attrMatch[1]
    const paraMatch = attrs.match(/([#.](\S+?)\s)|((\S+?)\s*=\s*("(.+?)"|'(.+?)'|\[[^\]]*\]|\{[}]*\}|(\S+)))/g)
    paraMatch && paraMatch.forEach(param => {
      param = param.trim()
      if (param[0] === '#') {
        params.id = param.slice(1)
      } else if (param[0] === '.') {
        if (params.class) params.class = []
        params.class = params.class.concat(param.slice(1))
      } else {
        const offset = param.indexOf('=')
        const id = param.substring(0, offset).trim().toLowerCase()
        let val = param.substring(offset + 1).trim()
        const valStart = val[0]
        const valEnd = val[val.length - 1]
        if (['"', "'"].indexOf(valStart) !== -1 && ['"', "'"].indexOf(valEnd) !== -1 && valStart === valEnd) {
          val = val.substring(1, val.length - 1)
        }
        if (id === 'class') {
          if (params.class) params.class = []
          params.class = params.class.concat(val)
        } else {
          params[id] = val
        }
      }
    })
  }
  return params
}

export function serializeParamToAttribute (params) {
  if (Object.getOwnPropertyNames(params).length === 0) {
    return ''
  } else {
    return ` data-params="${escape(JSON.stringify(params))}"`
  }
}

/**
 * @param {HTMLElement} elem
 */
export function deserializeParamAttributeFromElement (elem) {
  const params = elem.getAttribute('data-params')
  if (params) {
    return JSON.parse(unescape(params))
  } else {
    return {}
  }
}
