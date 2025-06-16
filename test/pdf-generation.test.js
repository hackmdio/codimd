/* eslint-env node, mocha */
'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const os = require('os')

describe('PDF Generation', function () {
  let convertMarkdownToPDF

  before(function () {
    // Import the PDF conversion function
    const markdownToPdf = require('../lib/utils/markdown-to-pdf')
    convertMarkdownToPDF = markdownToPdf.convertMarkdownToPDF
  })

  describe('Module Structure', function () {
    it('should export convertMarkdownToPDF function', function () {
      assert(typeof convertMarkdownToPDF === 'function', 'convertMarkdownToPDF should be a function')
    })

    it('should have required dependencies', function () {
      const packagePath = path.join(__dirname, '../package.json')
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))

      assert(packageJson.dependencies['playwright-chromium'], 'playwright-chromium should be in dependencies')
      assert(!packageJson.dependencies['markdown-pdf'], 'markdown-pdf should not be in dependencies')
    })
  })

  describe('PDF Conversion', function () {
    const testMarkdown = `# Test Document

This is a **test** document with some content.

## Code Block
\`\`\`javascript
console.log('Hello World');
\`\`\`

- List item 1
- List item 2

> This is a blockquote

| Column 1 | Column 2 |
|----------|----------|
| Value 1  | Value 2  |
`

    let tempDir
    let outputPath

    beforeEach(function () {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-test-'))
      outputPath = path.join(tempDir, 'test-output.pdf')
    })

    afterEach(function () {
      // Clean up temp files
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath)
      }
      if (fs.existsSync(tempDir)) {
        fs.rmdirSync(tempDir)
      }
    })

    it('should convert markdown to PDF successfully', async function () {
      this.timeout(30000) // Increase timeout for PDF generation

      const result = await convertMarkdownToPDF(testMarkdown, outputPath)

      assert(result === true, 'convertMarkdownToPDF should return true on success')
      assert(fs.existsSync(outputPath), 'PDF file should be created')

      const stats = fs.statSync(outputPath)
      assert(stats.size > 0, 'PDF file should not be empty')
    })

    it('should handle empty markdown', async function () {
      this.timeout(30000)

      const result = await convertMarkdownToPDF('', outputPath)

      assert(result === true, 'Should handle empty markdown')
      assert(fs.existsSync(outputPath), 'PDF file should be created even for empty content')
    })

    it('should handle markdown with special characters', async function () {
      this.timeout(30000)

      const specialMarkdown = `# Special Characters

This has **special** characters: & < > " '

\`\`\`html
<div class="test">Hello & Goodbye</div>
\`\`\`
`

      const result = await convertMarkdownToPDF(specialMarkdown, outputPath)

      assert(result === true, 'Should handle special characters')
      assert(fs.existsSync(outputPath), 'PDF file should be created')
    })

    it('should throw error for invalid output path', async function () {
      this.timeout(30000)

      const invalidPath = '/nonexistent/directory/test.pdf'

      try {
        await convertMarkdownToPDF(testMarkdown, invalidPath)
        assert.fail('Should throw error for invalid path')
      } catch (error) {
        assert(error instanceof Error, 'Should throw an Error')
        assert(error.message.includes('PDF generation failed'), 'Error should mention PDF generation failure')
      }
    })
  })
})
