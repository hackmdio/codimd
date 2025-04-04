const fs = require('fs')
const path = require('path')

let manifest = null

// Read manifest in production
// In development, Vite handles asset injection via its dev server middleware
function readManifest () {
  if (process.env.NODE_ENV !== 'production') {
    return {} // No manifest needed in dev
  }
  if (manifest) {
    return manifest
  }
  try {
    const manifestPath = path.resolve(__dirname, '../public/build/manifest.json')
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      return manifest
    } else {
      console.error('Vite manifest.json not found! Run `npm run build`.')
      return {}
    }
  } catch (err) {
    console.error('Error reading Vite manifest.json:', err)
    return {}
  }
}

// Helper function to get asset paths for an entry point
function getViteAssets (entryName) {
  const manifestData = readManifest()
  const assets = { js: [], css: [] }
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    const entryKey = `public/js/${entryName}.js` // Assuming entry points are in public/js
    const entryChunk = manifestData[entryKey]

    if (entryChunk) {
      // Add the main entry JS file
      if (entryChunk.file) {
        assets.js.push(`/build/${entryChunk.file}`)
      }
      // Add CSS files associated with the entry
      if (entryChunk.css) {
        entryChunk.css.forEach(cssFile => assets.css.push(`/build/${cssFile}`))
      }
      // Add JS imports (dynamic imports, vendor chunks) - might need refinement based on actual manifest structure
      if (entryChunk.imports) {
        entryChunk.imports.forEach(importKey => {
          const importChunk = manifestData[importKey]
          if (importChunk && importChunk.file && importChunk.file.endsWith('.js')) {
            assets.js.push(`/build/${importChunk.file}`)
          }
          // Also check for CSS associated with imported chunks
          if (importChunk && importChunk.css) {
            importChunk.css.forEach(cssFile => {
              // Avoid duplicates
              if (!assets.css.includes(`/build/${cssFile}`)) {
                assets.css.push(`/build/${cssFile}`)
              }
            })
          }
        })
      }
    } else {
      console.warn(`Vite manifest entry not found for: ${entryKey}`)
    }
  } else {
    // In development, Vite handles everything through its dev server
    assets.js.push(`/@vite/client`) // Vite HMR client
    // Request the actual file path relative to the project root
    assets.js.push(`/public/js/${entryName}.js`)
  }

  return assets
}

// Helper to generate HTML tags
function generateTags (assets) {
  let cssTags = ''
  let jsTags = ''
  const isProduction = process.env.NODE_ENV === 'production'

  assets.css.forEach(href => {
    cssTags += `<link rel="stylesheet" href="${href}">\n`
  })

  assets.js.forEach(src => {
    // All scripts in dev mode should be modules
    const typeAttr = !isProduction ? ' type="module"' : ''
    jsTags += `<script src="${src}"${typeAttr}></script>\n`
  })

  return { cssTags, jsTags }
}

module.exports = {
  getViteAssets,
  generateTags
}
