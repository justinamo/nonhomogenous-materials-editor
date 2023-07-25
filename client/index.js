var gridCellSize = 150; 
var inchesPerGridCell = 3;
var originOffsetX = 0; 
var originOffsetY = 0; 
var canvasDragStartX = null; 
var canvasDragStartY = null; 

var plateData; 
var plateWidthInInches;
var plateHeightInInches; 

var svgData; 
var svgWidthInInches;
var svgHeightInInches;
var svgOffsetX = 0;
var svgOffsetY = 0;
var svgDragStartX = null;
var svgDragStartY = null; 
var svgDragged = false; 

var intersectionData; 

var view = document.getElementById("view");
var viewHeight = 800; 
var viewWidth = 1000; 

var viewsizer = document.getElementById("viewsizer");
var viewsizerDragged = false; 

canvas = document.getElementById("canvas");
canvasOffset = 40;
var canvasDragged = false; 

async function upload(formData, url, response_handler) {
  try {
    const response = await fetch("http://localhost:8080/" + url, {
      method: "PUT",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: formData,
    });
    const result = await response_handler(response); 
    console.log("Success:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

function processIntersectionResponse(response) {
  var blob = response.blob().then((blob) => {
    var url = URL.createObjectURL(blob); 
    var image = new Image(); 
    image.src = url; 
    intersectionData = image; 

    document.getElementById("loading-svg").style.display = "none";
    image.onload = function(e) {
      clearCanvas(); 
      draw();
    };
  });
};

function getIntersection() {
  formData = new FormData(); 
  formData.append("svgStartX", svgOffsetX / gridCellSize * inchesPerGridCell) 
  formData.append("svgStartY", svgOffsetY / gridCellSize * inchesPerGridCell) 
  formData.append("svgWidth", svgWidthInInches); 
  formData.append("svgHeight", svgHeightInInches); 
  formData.append("plateWidth", plateWidthInInches); 
  formData.append("plateHeight", plateHeightInInches); 
  upload(formData, "intersection", processIntersectionResponse); 
};

function startup() { 
  view.addEventListener("mousedown", (event) => {
    svgWidthPx = svgWidthInInches / inchesPerGridCell * gridCellSize; 
    svgHeightPx = svgHeightInInches / inchesPerGridCell * gridCellSize; 
    x = event.offsetX - canvasOffset;
    y = event.offsetY - canvasOffset;
    pointerOnSvg = svgData && 
      ((originOffsetX + svgOffsetX) < x && x < (originOffsetX + svgOffsetX + svgWidthPx) &&
       (originOffsetY + svgOffsetY) < y && y < (originOffsetY + svgOffsetY + svgHeightPx)
      );
    if (pointerOnSvg) {
      console.log("pointer on svg");
      intersectionData = undefined; 
      clearCanvas(); 
      draw();
      svgDragStartX = event.x - svgOffsetX; 
      svgDragStartY = event.y - svgOffsetY; 
      svgDragged = true; 
    } else {
      canvasDragStartX = event.x - originOffsetX; 
      canvasDragStartY = event.y - originOffsetY; 
      canvasDragged = true; 
    }
  });

  viewsizer.addEventListener("mousedown", (event) => {
    viewsizerDragged = true;
  });

  window.addEventListener("mousemove", (event) => {
    event.preventDefault();
    if (viewsizerDragged) { 
      viewWidth = event.offsetX - 50;
      viewHeight = event.offsetY - 50;
      updateViewSize();
      updateCanvasSize();
      draw(); 
    } else if (svgDragged) {
      svgOffsetX = event.x - svgDragStartX;
      svgOffsetY = event.y - svgDragStartY; 
      clearCanvas();
      draw(); 
    } else if (canvasDragged) {
      originOffsetX = event.x - canvasDragStartX;
      originOffsetY = event.y - canvasDragStartY;
      clearCanvas();
      draw(); 
    };
  });

  window.addEventListener("mouseup", (event) => {
    if (viewsizerDragged) { 
      updateCanvasSize();
      draw();
    };
    viewsizerDragged = false;
    if (svgDragged) {
      document.getElementById("loading-svg").style.display = "inline";
      getIntersection(); 
      clearCanvas();
      draw(); 
    };
    svgDragged = false; 
    if (canvasDragged) {
      clearCanvas();
      draw(); 
    };
    canvasDragged = false; 
  }); 

  updateCanvasSize(); 
  drawGrid(gridCellSize, inchesPerGridCell);

  var plateReader = new FileReader(); 
  plateReader.addEventListener("load", (event) => {
    var image = new Image(); 
    image.src = plateReader.result; 
    plateData = image; 
    plateWidthInInches = parseFloat(document.getElementById("width-input").value);
    plateHeightInInches = parseFloat(document.getElementById("height-input").value);
    clearCanvas();
    draw(); 
  });

  function processPlateResponse(response) {
    return response; 
  };

  var photoInput = document.getElementById("photo-input"); 
  photoInput.addEventListener("change", (event) => {
    if (photoInput.files && photoInput.files[0]) { 
      var photo = photoInput.files[0]; 
      const formData = new FormData(); 
      formData.append("plate", photo); 
      var response = upload(formData, "plate", processPlateResponse);
      plateReader.readAsDataURL(photo);
    };
  });

  var header = document.querySelector("header");
  function processSvgResponse(response) { 
    var blob = response.blob().then((blob) => {
      return blob.text();
    }).then((text) => {
      var parser = new DOMParser(); 
      var svgDoc = parser.parseFromString(text, "image/svg+xml");
      svgData = svgDoc; 
      var viewBox = svgDoc.querySelector("svg").getAttribute("viewBox"); 
      document.getElementById("viewbox").innerText = "viewBox: " + viewBox; 
      var width = viewBox.split(" ")[2];
      var height = viewBox.split(" ")[3];
      svgWidthInInches = width / document.getElementById("vupi-input").value;
      svgHeightInInches = height / document.getElementById("vupi-input").value;
      getIntersection();
      clearCanvas();
      draw();
    }); 
  };

  var svgInput = document.getElementById("svg-input"); 
  svgInput.addEventListener("change", (event) => {
    if (svgInput.files && svgInput.files[0]) { 
      document.getElementById("loading-svg").style.display = "inline";
      var svgFile = svgInput.files[0]; 

      var formData = new FormData(); 
      formData.append("svg", svgFile); 
      var vupi = document.getElementById("vupi-input").value;
      if (!vupi) {
	window.alert("Please type in viewBox units per square inch.");
      } else if (!plateData) {
	window.alert("Please upload plate first.");
      } else {
	formData.append("viewBoxUnitsPerInch", parseFloat(vupi));
	upload(formData, "svg", processSvgResponse)
      };
      
    };
  });
};

function updateViewSize() {
  view.style.width = viewWidth + "px";
  view.style.height = viewHeight + "px";
};

function updateCanvasSize() {
  canvas.width = viewWidth + canvasOffset * 2;
  canvas.height = viewHeight + canvasOffset * 2;
};

function clearCanvas() { 
  if (canvas.getContext) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
};

function drawGrid(cellSize, inchesPerCell) {
  if (canvas.getContext) {
    const ctx = canvas.getContext("2d");
    // unit label 
    ctx.textAlign = "start"; 
    ctx.textBaseline = "alphabetic";
    ctx.fillText("in", 30, 30);

    // grid lines and axes
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = "lightgray";
    ctx.lineWidth = 1;

    var linesToDrawX = Math.floor((viewWidth - (originOffsetX % cellSize)) / cellSize);
    var linesToDrawY = Math.floor((viewHeight - (originOffsetY % cellSize)) / cellSize);

    for (let i = originOffsetX > 0 ? 0 : 1 ; i <= linesToDrawX; i++) {
      horizontalPosition = cellSize * i + canvasOffset + (originOffsetX % cellSize);
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      var digit_i = originOffsetX >= 0 ? i : i - 1;
      ctx.fillText((digit_i - Math.floor(originOffsetX / cellSize)) * inchesPerCell, horizontalPosition, 30);
      ctx.moveTo(horizontalPosition, 0 + canvasOffset); 
      ctx.lineTo(horizontalPosition, viewHeight + canvasOffset);
    };

    for (let i = originOffsetY > 0 ? 0 : 1; i <= linesToDrawY; i++) {
      verticalPosition = cellSize * i + canvasOffset + (originOffsetY % cellSize);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      var digit_i = originOffsetY >= 0 ? i : i - 1;
      ctx.fillText((digit_i - Math.floor(originOffsetY / cellSize)) * inchesPerCell, 35, verticalPosition);
      ctx.moveTo(0 + canvasOffset, verticalPosition); 
      ctx.lineTo(viewWidth + canvasOffset, verticalPosition);
    };

    ctx.closePath();
    ctx.stroke();
  };
};

function drawRect(ctx, dx, dy, dWidth, dHeight, offsetX, offsetY, strokeStyle, lineDash) { 
  rx = Math.min(dx, canvasOffset + viewWidth); 
  ry = Math.min(dy, canvasOffset + viewHeight); 
  rectWidth = Math.max(Math.min(dWidth, gridWidth + offsetX), 0);
  rectHeight = Math.max(Math.min(dHeight, gridHeight + offsetY), 0);
  ctx.beginPath();
  ctx.rect(rx, ry, rectWidth, rectHeight);
  ctx.strokeStyle = strokeStyle;
  if (lineDash) { 
    ctx.setLineDash(lineDash);
  };
  ctx.stroke();
  ctx.closePath();
};

function inToGridCoordUnits(n_inches) {
  return n_inches / inchesPerGridCell * gridCellSize;
};

function drawImage(ctx, offsetX, offsetY, imageData, imageWidthInInches, imageHeightInInches, draw=true) { 
  dx = Math.max(offsetX + canvasOffset, canvasOffset); 
  dy = Math.max(offsetY + canvasOffset, canvasOffset); 
  gridWidth = imageWidthInInches / inchesPerGridCell * gridCellSize; 
  gridHeight = imageHeightInInches / inchesPerGridCell * gridCellSize; 
  sx = Math.max(0, -offsetX) * imageData.width / gridWidth;
  sy = Math.max(0, -offsetY) * imageData.height / gridHeight;
  sWidth = Math.min(gridWidth, viewWidth + canvasOffset - dx) * imageData.width / gridWidth;
  sHeight = Math.min(gridHeight, viewHeight + canvasOffset - dy) * imageData.height / gridHeight;
  dWidth = Math.min(gridWidth, viewWidth + canvasOffset - dx);
  dHeight = Math.min(gridHeight, viewHeight + canvasOffset - dy);
  if (draw) {
    ctx.drawImage(imageData, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight); 
  };

  return { dx, dy, dWidth, dHeight }
};

function drawPlate() { 
  if (canvas.getContext && plateData) {
    const ctx = canvas.getContext("2d");
    offsetX = originOffsetX;
    offsetY = originOffsetY; 
    d = drawImage(ctx, offsetX, offsetY, plateData, plateWidthInInches, plateHeightInInches); 
    drawRect(ctx, d.dx, d.dy, d.dWidth, d.dHeight, offsetX, offsetY, "black", []);
  };
};

function drawSvg() { 
  if (canvas.getContext && svgData) { 
    const ctx = canvas.getContext("2d");
    offsetX = svgOffsetX + originOffsetX;
    offsetY = svgOffsetY + originOffsetY;
    ctx.translate(offsetX + canvasOffset, offsetY + canvasOffset); 
    var vupi = document.getElementById("vupi-input").value;
    var scaleFactor = 1 / vupi * (gridCellSize / inchesPerGridCell);
    ctx.scale(scaleFactor, scaleFactor); 
    ctx.strokeStyle = "black"; 
    ctx.strokeWidth = 1;
    svgData.querySelectorAll("path").forEach((path) => {
      path2d = new Path2D(path.getAttribute("d")); 
      ctx.stroke(path2d); 
    });
    ctx.resetTransform(); 
    d = drawImage(ctx, offsetX, offsetY, svgData, svgWidthInInches, svgHeightInInches, false);
    drawRect(ctx, d.dx, d.dy, d.dWidth, d.dHeight, offsetX, offsetY, "gray", [5]);
  };
};

function drawIntersection() { 
  if (canvas.getContext && intersectionData) {
    console.log("drawing intersection");
    const ctx = canvas.getContext("2d");
    console.log(intersectionData);
    drawImage(ctx, originOffsetX, originOffsetY, intersectionData, plateWidthInInches, plateHeightInInches);
  };
};

function draw() {
  drawGrid(gridCellSize, inchesPerGridCell);
  drawPlate();
  drawSvg(); 
  drawIntersection(); 
};

startup();
