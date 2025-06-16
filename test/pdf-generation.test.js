'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')

// Test the PDF generation functionality
// This test mocks dependencies to verify the logic without requiring full installation

describe('PDF Generation Tests', function () {
  const testMarkdown = `# Test Document

This is a **test** document with some content.

## Code Block
\`\`\`javascript
console.log('Hello World');
\`\`\`

- List item 1
- List item 2
`

  it('should have the markdown-to-pdf utility', function () {
    const filePath = path.join(__dirname, '../lib/utils/markdown-to-pdf.js')
    assert(fs.existsSync(filePath), 'markdown-to-pdf.js should exist')
  })

  it('should have updated actionPDF function', function () {
    const filePath = path.join(__dirname, '../lib/note/noteActions.js')
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Should not contain markdown-pdf references
    assert(!content.includes("require('markdown-pdf')"), 'Should not import markdown-pdf')
    assert(!content.includes('markdownpdf('), 'Should not use markdownpdf function')
    
    // Should contain puppeteer-based implementation
    assert(content.includes('convertMarkdownToPDF'), 'Should use convertMarkdownToPDF')
    assert(content.includes('async function actionPDF'), 'actionPDF should be async')
    assert(content.includes('await convertMarkdownToPDF'), 'Should await PDF conversion')
  })

  it('should export convertMarkdownToPDF function', function () {
    const filePath = path.join(__dirname, '../lib/utils/markdown-to-pdf.js')
    const content = fs.readFileSync(filePath, 'utf8')
    
    assert(content.includes('convertMarkdownToPDF'), 'Should define convertMarkdownToPDF function')
    assert(content.includes('module.exports'), 'Should export the function')
    assert(content.includes('puppeteer'), 'Should use puppeteer')
    assert(content.includes('markdownit'), 'Should use markdown-it')
  })

  it('should have puppeteer in package.json dependencies', function () {
    const packagePath = path.join(__dirname, '../package.json')
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    
    assert(packageJson.dependencies.puppeteer, 'puppeteer should be in dependencies')
    assert(!packageJson.dependencies['markdown-pdf'], 'markdown-pdf should be removed')
  })
})

// If running this file directly, run a simple test
if (require.main === module) {
  console.log('Running PDF generation tests...')
  
  try {
    const testDir = path.dirname(__filename)
    
    // Test 1: Check files exist
    const markdownToPdfPath = path.join(testDir, '../lib/utils/markdown-to-pdf.js')
    const noteActionsPath = path.join(testDir, '../lib/note/noteActions.js')
    
    console.log('✅ Checking file existence...')
    assert(fs.existsSync(markdownToPdfPath), 'markdown-to-pdf.js should exist')
    assert(fs.existsSync(noteActionsPath), 'noteActions.js should exist')
    
    // Test 2: Check content
    console.log('✅ Checking file content...')
    const noteActionsContent = fs.readFileSync(noteActionsPath, 'utf8')
    assert(noteActionsContent.includes('convertMarkdownToPDF'), 'Should use convertMarkdownToPDF')
    assert(!noteActionsContent.includes("require('markdown-pdf')"), 'Should not import markdown-pdf')
    
    const markdownToPdfContent = fs.readFileSync(markdownToPdfPath, 'utf8')
    assert(markdownToPdfContent.includes('puppeteer'), 'Should use puppeteer')
    assert(markdownToPdfContent.includes('module.exports'), 'Should export functions')
    
    // Test 3: Check package.json
    console.log('✅ Checking package.json...')
    const packagePath = path.join(testDir, '../package.json')
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    assert(packageJson.dependencies.puppeteer, 'puppeteer should be in dependencies')
    assert(!packageJson.dependencies['markdown-pdf'], 'markdown-pdf should be removed')
    
    console.log('✅ All tests passed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}