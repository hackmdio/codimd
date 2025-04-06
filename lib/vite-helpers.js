const fs = require('fs')
const path = require('path')

let manifest = null

// Configuration for manual CSS ordering
const CSS_ORDER_CONFIG = {
  cover: [
    'bootstrap',
    'site',
    'cover'
  ],
  // Add other entry points and their CSS orders as needed
  index: [
    'bootstrap',
    'slide-preview',
    'extra',
    'site',
    'index'
  ]
};

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
    const manifestPath = path.resolve(__dirname, '../public/build/.vite/manifest.json')
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
function getViteAssets(entryName) {
  const manifestData = readManifest();
  const assets = { js: [], css: [] };
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const entryKey = `public/js/${entryName}.js`;
    const entryChunk = manifestData[entryKey];

    if (entryChunk) {
      processChunk(entryChunk, manifestData, assets);
    } else {
      console.warn(`Vite manifest entry not found for: ${entryKey}`);
    }
  } else {
    assets.js.push(`/.vite/@vite/client`);
    assets.js.push(`/.vite/public/js/${entryName}.js`);
  }

  // Apply manual CSS ordering if configured
  if (CSS_ORDER_CONFIG[entryName]) {
    const orderedCss = [];
    CSS_ORDER_CONFIG[entryName].forEach(cssChunkName => {
      const matchingCss = assets.css.find(css => css.includes(cssChunkName));
      if (matchingCss) {
        orderedCss.push(matchingCss);
      } else {
        console.warn(`Configured CSS chunk not found: ${cssChunkName} for entry: ${entryName}`);
      }
    });
    // Add any remaining CSS assets not specified in the config
    assets.css.forEach(css => {
      if (!orderedCss.includes(css)) {
        orderedCss.push(css);
      }
    });
    assets.css = orderedCss;
  }

  return assets;
}

function processChunk(chunk, manifestData, assets) {
  if (chunk.file && !assets.js.includes(`/build/${chunk.file}`)) {
    assets.js.push(`/build/${chunk.file}`);
  }
  if (chunk.css) {
    chunk.css.forEach(cssFile => {
      if (!assets.css.includes(`/build/${cssFile}`)) {
        assets.css.push(`/build/${cssFile}`);
      }
    });
  }
  if (chunk.imports) {
    chunk.imports.forEach(importKey => {
      const importChunk = manifestData[importKey];
      if (importChunk) {
        if (importChunk.file && importChunk.file.endsWith('.js')) {
          if (!assets.js.includes(`/build/${importChunk.file}`)) {
            assets.js.push(`/build/${importChunk.file}`);
          }
        }
        if (importChunk.css) {
          importChunk.css.forEach(cssFile => {
            if (!assets.css.includes(`/build/${cssFile}`)) {
              assets.css.push(`/build/${cssFile}`);
            }
          });
        }
        processChunk(importChunk, manifestData, assets);
      }
    });
  }
}

// Helper to generate HTML tags
function generateTags (assets) {
  let cssTags = ''
  let jsTags = ''
  // const isProduction = process.env.NODE_ENV === 'production'

  assets.css.forEach(href => {
    cssTags += `<link rel="stylesheet" href="${href}">\n`
  })

  assets.js.forEach(src => {
    // All scripts in dev mode should be modules
    // const typeAttr = !isProduction ? ' type="module"' : ''
    const typeAttr = ' type="module"'
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
