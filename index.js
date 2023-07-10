var gridCellSize = 150; 
var inchesPerGridCell = 5;
var originOffsetX = 0; 
var originOffsetY = 0; 
var canvasDragStartX = null; 
var canvasDragStartY = null; 

var plateData; 
var plateWidthInInches = 12;
var plateHeightInInches = 19; 

var view = document.getElementById("view");
var viewHeight = 800; 
var viewWidth = 1000; 

var viewsizer = document.getElementById("viewsizer");
var viewsizerDragged = false; 

canvas = document.getElementById("canvas");
canvasOffset = 40;
var canvasDragged = false; 

function startup() { 
  view.addEventListener("mousedown", (event) => {
    canvasDragStartX = event.x - originOffsetX; 
    canvasDragStartY = event.y - originOffsetY; 
    canvasDragged = true; 
  });

  viewsizer.addEventListener("mousedown", (event) => {
    viewsizerDragged = true;
  });

  window.addEventListener("mousemove", (event) => {
    event.preventDefault();
    if (viewsizerDragged) { 
      viewWidth = event.x - 50;
      viewHeight = event.y - 50;
      updateViewSize();
      updateCanvasSize();
      drawGrid(gridCellSize, inchesPerGridCell);
      drawPlate();
    };
    if (canvasDragged && !viewsizerDragged) {
      originOffsetX = event.x - canvasDragStartX;
      originOffsetY = event.y - canvasDragStartY;
      clearCanvas();
      drawGrid(gridCellSize, inchesPerGridCell);
      drawPlate();
    };
  });

  window.addEventListener("mouseup", (event) => {
    if (viewsizerDragged) { 
      updateCanvasSize();
      drawGrid(gridCellSize, inchesPerGridCell);
      drawPlate();
    };
    viewsizerDragged = false;
    if (canvasDragged) {
      clearCanvas();
      drawGrid(gridCellSize, inchesPerGridCell);
      drawPlate(); 
    };
    canvasDragged = false; 
  }); 

  updateCanvasSize(); 
  drawGrid(gridCellSize, inchesPerGridCell);

  var reader = new FileReader(); 
  reader.addEventListener("load", (event) => {
    var image = new Image(); 
    image.src = reader.result; 
    console.log("appending");
    plateData = image; 
    drawPlate(); 
  });

  var photoInput = document.getElementById("photo-input"); 
  photoInput.addEventListener("change", (event) => {
    if (photoInput.files && photoInput.files[0]) { 
      photo = photoInput.files[0]; 
      reader.readAsDataURL(photo);
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

function drawPlate() { 
  if (canvas.getContext) {
    const ctx = canvas.getContext("2d");
    dx = Math.max(originOffsetX + canvasOffset, canvasOffset); 
    dy = Math.max(originOffsetY + canvasOffset, canvasOffset); 
    gridWidth = plateWidthInInches / inchesPerGridCell * gridCellSize; 
    gridHeight = plateHeightInInches / inchesPerGridCell * gridCellSize; 
    sx = Math.max(0, -originOffsetX) * plateData.width / gridWidth;
    sy = Math.max(0, -originOffsetY) * plateData.height / gridHeight;
    sWidth = Math.min(gridWidth, viewWidth + canvasOffset - dx) * plateData.width / gridWidth;
    sHeight = Math.min(gridHeight, viewHeight + canvasOffset - dy) * plateData.height / gridHeight;
    dWidth = Math.min(gridWidth, viewWidth + canvasOffset - dx);
    dHeight = Math.min(gridHeight, viewHeight + canvasOffset - dy);
    ctx.drawImage(plateData, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight); 
  };
};

startup();
