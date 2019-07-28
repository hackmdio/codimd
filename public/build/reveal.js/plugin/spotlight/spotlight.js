var RevealSpotlight = window.RevealSpotlight || (function () {

  //configs
  var spotlightSize;
  var toggleOnMouseDown;
  var spotlightOnKeyPressAndHold;
  var presentingCursor;
  var spotlightCursor;
  var initialPresentationMode;
  var disablingUserSelect;
  var fadeInAndOut;
  var style;
  var lockPointerInsideCanvas;
  var getMousePos;

  var drawBoard;
  var isSpotlightOn = true;
  var isCursorOn = true;

  var lastMouseMoveEvent;

  function onRevealJsReady(event) {
    configure();
    drawBoard = setupCanvas();

    addWindowResizeListener();

    addMouseMoveListener();

    if (toggleOnMouseDown) {
      addMouseToggleSpotlightListener();
    }

    if (spotlightOnKeyPressAndHold) {
      addKeyPressAndHoldSpotlightListener(spotlightOnKeyPressAndHold);
    }

    setCursor(!initialPresentationMode);
    setSpotlight(false);
  }

  function configure() {
    var config = Reveal.getConfig().spotlight || {};
    spotlightSize = config.size || 60;
    presentingCursor = config.presentingCursor || "none";
    spotlightCursor = config.spotlightCursor || "none";
    var useAsPointer = config.useAsPointer || false;
    var pointerColor = config.pointerColor || 'red';
    lockPointerInsideCanvas = config.lockPointerInsideCanvas || false;

    if(lockPointerInsideCanvas){
      getMousePos = getMousePosByMovement;
    } else {
      getMousePos = getMousePosByBoundingClientRect;
    }

    // If using as pointer draw a transparent background and
    // the mouse pointer in the specified color or default
    var pointerStyle = {
      backgroundFillStyle : "rgba(0, 0, 0, 0)",
      mouseFillStyle : pointerColor
    };

    var spotlightStyle = {
      backgroundFillStyle : "#000000A8",
      mouseFillStyle : "#FFFFFFFF"
    };

    style = useAsPointer ? pointerStyle : spotlightStyle;

    if (config.hasOwnProperty("toggleSpotlightOnMouseDown")) {
      toggleOnMouseDown = config.toggleSpotlightOnMouseDown;
    } else {
      toggleOnMouseDown = true;
    }

    if (config.hasOwnProperty("initialPresentationMode")) {
      initialPresentationMode = config.initialPresentationMode;
    } else {
      initialPresentationMode = toggleOnMouseDown;
    }

    if (config.hasOwnProperty("spotlightOnKeyPressAndHold")) {
      spotlightOnKeyPressAndHold = config.spotlightOnKeyPressAndHold;
    } else {
      spotlightOnKeyPressAndHold = false;
    }

    if (config.hasOwnProperty("disablingUserSelect")) {
      disablingUserSelect = config.disablingUserSelect;
    } else {
      disablingUserSelect = true;
    }

    if (config.hasOwnProperty("fadeInAndOut")) {
      fadeInAndOut = config.fadeInAndOut;
    } else {
      fadeInAndOut = false;
    }
  }

  function setupCanvas() {
    var container = document.createElement('div');
    container.id = "spotlight";
    container.style.cssText = "position:absolute;top:0;left:0;bottom:0;right:0;z-index:99;";
    if (fadeInAndOut) {
      container.style.cssText += "transition: " + fadeInAndOut + "ms opacity;";
    }

    var canvas = document.createElement('canvas');
    var context = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    container.appendChild(canvas);
    document.body.appendChild(container);
    container.style.opacity = 0;
    container.style['pointer-events'] = 'none';
    return {
      container,
      canvas,
      context
    }
  }

  function addWindowResizeListener() {
    window.addEventListener('resize', function (e) {
      var canvas = drawBoard.canvas;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }, false);
  }

  function addMouseMoveListener() {
    document.body.addEventListener('mousemove', function (e) {
      if(isSpotlightOn) {
        showSpotlight(e);
      }
      lastMouseMoveEvent = e;
    }, false);
  }

  function addMouseToggleSpotlightListener() {

    window.addEventListener("mousedown", function (e) {
      if (!isCursorOn) {
        setSpotlight(true, e);
      }
    }, false);

    window.addEventListener("mouseup", function (e) {
      if (!isCursorOn) {
        setSpotlight(false, e);
      }
    }, false);
  }

  function addKeyPressAndHoldSpotlightListener(keyCode) {

    window.addEventListener("keydown", function (e) {
      if (!isCursorOn && !isSpotlightOn && e.keyCode === keyCode) {
        setSpotlight(true, lastMouseMoveEvent);
      }
    }, false);

    window.addEventListener("keyup", function (e) {
      if (!isCursorOn && e.keyCode === keyCode) {
        setSpotlight(false);
      }
    }, false);
  }

  function toggleSpotlight() {
    setSpotlight(!isSpotlightOn, lastMouseMoveEvent);
  }

  function setSpotlight(isOn, mouseEvt) {
    isSpotlightOn = isOn;
    var container = drawBoard.container;
    if (isOn) {
      if (lockPointerInsideCanvas && document.pointerLockElement != drawBoard.canvas) {
        drawBoard.canvas.requestPointerLock();
      }
      container.style.opacity = 1;
      container.style['pointer-events'] = null;
      document.body.style.cursor = spotlightCursor;
      if (mouseEvt) {
        showSpotlight(mouseEvt);
      }
    } else {
      container.style.opacity = 0;
      container.style['pointer-events'] = 'none';
      document.body.style.cursor = presentingCursor;
    }
  }

  function togglePresentationMode() {
    setCursor(!isCursorOn);
  }

  function setCursor(isOn) {
    isCursorOn = isOn;
    if (isOn) {
      if (disablingUserSelect) {
        document.body.style.userSelect = null;
      }
      document.body.style.cursor = null;
    } else {
      if (disablingUserSelect) {
        document.body.style.userSelect = "none";
      }
      document.body.style.cursor = presentingCursor;
    }
  }

  function showSpotlight(mouseEvt) {
    var canvas = drawBoard.canvas;
    var context = drawBoard.context;
    var mousePos = getMousePos(canvas, mouseEvt);

    context.clearRect(0, 0, canvas.width, canvas.height);

    // Create a canvas mask
    var maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;

    var maskCtx = maskCanvas.getContext('2d');

    maskCtx.fillStyle = style.backgroundFillStyle;
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskCtx.globalCompositeOperation = 'xor';

    maskCtx.fillStyle = style.mouseFillStyle;
    maskCtx.arc(mousePos.x, mousePos.y, spotlightSize, 0, 2 * Math.PI);
    maskCtx.fill();

    context.drawImage(maskCanvas, 0, 0);
  }

  var mX = 0;
  var mY = 0;

  function getMousePosByMovement(canvas, evt) {
    var movementX = evt.movementX || 0;
    var movementY = evt.movementY || 0;
    mX += movementX;
    mY += movementY;

    if (mX > canvas.clientWidth) {
      mX = canvas.clientWidth;
    }
    if (mY > canvas.clientHeight) {
      mY = canvas.clientHeight;
    }
    if (mX < 0) {
      mX = 0;
    }
    if (mY < 0) {
      mY = 0;
    }

    return {
      x: mX,
      y: mY
    };
  }

  function getMousePosByBoundingClientRect(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }

  Reveal.addEventListener('ready', onRevealJsReady);

  this.toggleSpotlight = toggleSpotlight;
  this.togglePresentationMode = togglePresentationMode;
  return this;
})();
