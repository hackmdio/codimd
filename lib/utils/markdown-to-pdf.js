'use strict'

const puppeteer = require('puppeteer')
const markdownit = require('markdown-it')
const path = require('path')
const fs = require('fs')

// Configure markdown-it similar to frontend
function createMarkdownRenderer () {
  const md = markdownit('default', {
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
    highlight: function (str, lang) {
      try {
        const hljs = require('highlight.js')
        if (lang && hljs.getLanguage(lang)) {
          return '<pre class="hljs"><code>' +
                 hljs.highlight(lang, str, true).value +
                 '</code></pre>'
        }
      } catch (error) {
        // Fall back to no highlighting
      }
      return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
    }
  })

  // Add plugins commonly used in CodiMD
  try {
    md.use(require('markdown-it-abbr'))
    md.use(require('markdown-it-footnote'))
    md.use(require('markdown-it-deflist'))
    md.use(require('markdown-it-mark'))
    md.use(require('markdown-it-ins'))
    md.use(require('markdown-it-sub'))
    md.use(require('markdown-it-sup'))
  } catch (error) {
    // Some plugins may not be available, continue with basic rendering
    console.warn('Some markdown-it plugins not available:', error.message)
  }

  return md
}

async function convertMarkdownToPDF (markdown, outputPath, options = {}) {
  const md = createMarkdownRenderer()
  
  // Convert markdown to HTML
  const htmlContent = md.render(markdown)
  
  // Read highlight.js CSS
  const highlightCssPath = options.highlightCssPath || path.join(__dirname, '../../node_modules/highlight.js/styles/github-gist.css')
  let highlightCss = ''
  
  if (fs.existsSync(highlightCssPath)) {
    highlightCss = fs.readFileSync(highlightCssPath, 'utf8')
  }

  // Create full HTML document
  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>PDF Export</title>
    <style>
        ${highlightCss}
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        pre {
            background-color: #f6f8fa;
            border-radius: 6px;
            padding: 16px;
            overflow: auto;
        }
        
        code {
            background-color: #f6f8fa;
            border-radius: 3px;
            padding: 2px 4px;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }
        
        pre code {
            background-color: transparent;
            padding: 0;
        }
        
        h1, h2, h3, h4, h5, h6 {
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
        }
        
        blockquote {
            padding: 0 1em;
            color: #6a737d;
            border-left: 0.25em solid #dfe2e5;
            margin: 0;
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
        }
        
        th, td {
            border: 1px solid #dfe2e5;
            padding: 6px 13px;
        }
        
        th {
            background-color: #f6f8fa;
            font-weight: 600;
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`

  // Launch puppeteer and generate PDF
  let browser = null
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      timeout: 30000 // 30 second timeout
    })
    
    const page = await browser.newPage()
    
    // Set a timeout for page operations
    page.setDefaultTimeout(30000)
    
    await page.setContent(fullHtml, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    })
    
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      printBackground: true,
      timeout: 30000
    })
    
    return true
  } catch (error) {
    throw new Error(`PDF generation failed: ${error.message}`)
  } finally {
    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        console.warn('Failed to close browser:', closeError.message)
      }
    }
  }
}

module.exports = {
  convertMarkdownToPDF
}