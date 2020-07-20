import Papa from 'papaparse'
import escapeHTML from 'lodash/escape'

const safeParse = d => {
  try {
    return JSON.parse(d)
  } catch (err) {
    return d
  }
}

export function renderCSVPreview (csv, options = {}, attr = '') {
  const opt = Object.keys(options).reduce((acc, key) => {
    return Object.assign(acc, {
      [key]: safeParse(options[key])
    })
  }, {})

  const results = Papa.parse(csv.trim(), opt)

  if (opt.header) {
    const fields = results.meta.fields
    return `<table ${attr}>
      <thead>
        <tr>
          ${fields.map(f => `<th>${escapeHTML(f)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${results.data.map(d => `<tr>
          ${fields.map(f => `<td>${escapeHTML(d[f])}</td>`).join('')}
        </tr>`).join('')}
      </tbody>
    </table>`
  } else {
    return `<table ${attr}>
      <tbody>
        ${results.data.map(d => `<tr>
          ${d.map(f => `<td>${escapeHTML(f)}</td>`).join('')}
        </tr>`).join('')}
      </tbody>
    </table>`
  }
}
