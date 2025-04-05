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

/**
 * Generate a script tag to fix CSS ordering issues in development mode
 * @param {Array<string>} selectors - CSS selectors for elements that should come after Vite's CSS
 * @param {string} nonce - CSP nonce to allow script execution
 * @returns {string} - Script tag for reordering CSS
 */
function generateCssOrderFixer (selectors, nonce = '') {
  if (process.env.NODE_ENV === 'production') {
    return '' // No need for this in production
  }

  const selectorsJson = JSON.stringify(selectors)
  const nonceAttr = nonce ? ` nonce="${nonce}"` : ''

  return `<script${nonceAttr}>
  // Function to run the fix
  function attemptFixCssOrder() {
    const head = document.head;
    const cssSelectors = ${selectorsJson};
    
    // Find all target elements
    const targetElements = cssSelectors
      .map(selector => head.querySelector(selector))
      .filter(el => el !== null);
    
    if (targetElements.length) {
      // Find all vite-injected styles
      const viteStyles = Array.from(head.querySelectorAll('style'))
        .filter(style => style.dataset.viteDevId);
      
      // Find the first target element to place vite styles before
      const firstTarget = targetElements[0];
      
      // Move all vite styles before the first target element
      if (viteStyles.length > 0) {
        viteStyles.forEach(style => {
          head.insertBefore(style, firstTarget);
        });
      }
    }
  }

  // Run immediately when DOM content is loaded
  document.addEventListener("DOMContentLoaded", attemptFixCssOrder);
  
  // Also run after a delay to catch any styles injected after DOMContentLoaded
  setTimeout(attemptFixCssOrder, 500);
  
  // Run again after 2 seconds to catch any delayed style injections
  setTimeout(attemptFixCssOrder, 2000);
  
  // Monitor for Vite HMR updates and reapply when they happen
  window.addEventListener('vite:beforeUpdate', () => {
    setTimeout(attemptFixCssOrder, 100);
  });
</script>`
}

module.exports = {
  getViteAssets,
  generateTags,
  generateCssOrderFixer
}
