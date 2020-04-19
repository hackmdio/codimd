import './lightbox.css'

let images = []
let currentImage = null
let currentIndexIndex = 0

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

    const hideContainer = (e) => {
      e.stopPropagation()
      lightBoxContainer.classList.remove('show')
      document.body.classList.remove('no-scroll')
    }

    lightBoxContainer.querySelector('.lightbox-control-previous').addEventListener('click', (e) => {
      e.stopPropagation()
      switchImage(-1)
    })
    lightBoxContainer.querySelector('.lightbox-control-next').addEventListener('click', (e) => {
      e.stopPropagation()
      switchImage(1)
    })
    lightBoxContainer.querySelector('.lightbox-control-close').addEventListener('click', hideContainer)
    lightBoxContainer.addEventListener('click', hideContainer)

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

  lightBoxContainer.querySelector('.lightbox-inner').innerHTML = `<img src="${src}" alt="${alt}">`
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

const init = () => {
  const markdownBody = document.querySelector('.markdown-body')
  if (!markdownBody) {
    return
  }

  markdownBody.addEventListener('click', function (e) {
    if (e.target.nodeName === 'IMG' && e.target.classList.contains('md-image')) {
      onClickImage(e.target)
      e.stopPropagation()
    }
  })
}

init()
