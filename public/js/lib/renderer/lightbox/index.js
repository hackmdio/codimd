import './lightbox.css'

let images = []
/** @type {HTMLImageElement} */
let currentImage = null
let currentIndexIndex = 0

let hideContainer

function findOrCreateLightboxContainer () {
  const lightboxContainerSelector = '.lightbox-container'

  let lightBoxContainer = document.querySelector(lightboxContainerSelector)
  if (!lightBoxContainer) {
    lightBoxContainer = document.createElement('div')
    lightBoxContainer.className = 'lightbox-container'

    lightBoxContainer.innerHTML = `
      <i class="fa fa-chevron-left lightbox-control-previous" aria-hidden="true"></i>
      <i class="fa fa-chevron-right lightbox-control-next" aria-hidden="true"></i>
      <i class="fa fa-close lightbox-control-close" aria-hidden="true"></i>

      <div class="lightbox-inner">
      </div>
    `

    addImageZoomListener(lightBoxContainer)

    hideContainer = () => {
      lightBoxContainer.classList.remove('show')
      document.body.classList.remove('no-scroll')
      currentImage = null
    }

    lightBoxContainer.querySelector('.lightbox-control-previous').addEventListener('click', (e) => {
      e.stopPropagation()
      switchImage(-1)
    })
    lightBoxContainer.querySelector('.lightbox-control-next').addEventListener('click', (e) => {
      e.stopPropagation()
      switchImage(1)
    })
    lightBoxContainer.querySelector('.lightbox-control-close').addEventListener('click', (e) => {
      e.stopPropagation()
      hideContainer()
    })
    lightBoxContainer.addEventListener('click', (e) => {
      e.stopPropagation()
      hideContainer()
    })

    document.body.appendChild(lightBoxContainer)
  }

  return lightBoxContainer
}

function switchImage (dir) {
  const lightBoxContainer = findOrCreateLightboxContainer()

  currentIndexIndex += dir
  if (currentIndexIndex >= images.length) {
    currentIndexIndex = 0
  } else if (currentIndexIndex < 0) {
    currentIndexIndex = images.length - 1
  }

  const img = images[currentIndexIndex]

  setImageInner(img, lightBoxContainer)
}

function setImageInner (img, lightBoxContainer) {
  const src = img.getAttribute('src')
  const alt = img.getAttribute('alt')

  lightBoxContainer.querySelector('.lightbox-inner').innerHTML = `<img src="${src}" alt="${alt}" draggable="false">`
  addImageDragListener(lightBoxContainer.querySelector('.lightbox-inner img'))
}

function onClickImage (img) {
  const lightBoxContainer = findOrCreateLightboxContainer()

  setImageInner(img, lightBoxContainer)

  lightBoxContainer.classList.add('show')
  document.body.classList.add('no-scroll')

  currentImage = img
  updateLightboxImages()
}

function updateLightboxImages () {
  images = [...document.querySelectorAll('.markdown-body img.md-image')]

  if (currentImage) {
    currentIndexIndex = images.findIndex(image => image === currentImage)
  }
}

function addImageZoomListener (container) {
  container.addEventListener('wheel', function (e) {
    // normalize scroll position as percentage
    e.preventDefault()

    /** @type {HTMLImageElement} */
    const image = container.querySelector('img')

    if (!image) {
      return
    }

    let scale = image.getBoundingClientRect().width / image.offsetWidth
    scale += e.deltaY * -0.01

    // Restrict scale
    scale = Math.min(Math.max(0.125, scale), 4)

    var transformValue = `scale(${scale})`

    image.style.WebkitTransform = transformValue
    image.style.MozTransform = transformValue
    image.style.OTransform = transformValue
    image.style.transform = transformValue
  })
}

/**
 * @param {HTMLImageElement} image
 */
function addImageDragListener (image) {
  let moved = false
  let pos = []

  const container = findOrCreateLightboxContainer()
  const inner = container.querySelector('.lightbox-inner')

  const onMouseDown = (evt) => {
    moved = true

    const { left, top } = image.getBoundingClientRect()

    pos = [
      evt.pageX - left,
      evt.pageY - top
    ]
  }
  image.addEventListener('mousedown', onMouseDown)
  inner.addEventListener('mousedown', onMouseDown)

  const onMouseMove = (evt) => {
    if (!moved) {
      return
    }

    image.style.left = `${evt.pageX - pos[0]}px`
    image.style.top = `${evt.pageY - pos[1]}px`
    image.style.position = 'absolute'
  }
  image.addEventListener('mousemove', onMouseMove)
  inner.addEventListener('mousemove', onMouseMove)

  const onMouseUp = () => {
    moved = false
    pos = []
  }
  image.addEventListener('mouseup', onMouseUp)
  inner.addEventListener('mouseup', onMouseUp)

  inner.addEventListener('click', (e) => {
    e.stopPropagation()
  })
  image.addEventListener('click', (e) => {
    e.stopPropagation()
  })
}

const init = () => {
  const markdownBody = document.querySelector('.markdown-body')
  if (!markdownBody) {
    return
  }

  markdownBody.addEventListener('click', function (e) {
    const img = e.target
    if (img.nodeName === 'IMG' && img.classList.contains('md-image')) {
      onClickImage(img)
      e.stopPropagation()
    }
  })

  window.addEventListener('keydown', function (e) {
    if (!currentImage) {
      return
    }

    if (e.key === 'ArrowRight') {
      switchImage(1)
      e.stopPropagation()
    } else if (e.key === 'ArrowLeft') {
      switchImage(-1)
      e.stopPropagation()
    } else if (e.key === 'Escape') {
      if (hideContainer) {
        hideContainer()
        e.stopPropagation()
      }
    }
  })
}

init()
