var gridCellSize = 150; 
var inchesPerGridCell = 25;
var originOffsetX = 0; 
var originOffsetY = 0; 
var canvasDragStartX = null; 
var canvasDragStartY = null; 

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
    };
    if (canvasDragged) {
      originOffsetX = event.x - canvasDragStartX;
      originOffsetY = event.y - canvasDragStartY;
      clearCanvas();
      drawGrid(gridCellSize, inchesPerGridCell);
    };
  });

  window.addEventListener("mouseup", (event) => {
    if (viewsizerDragged) { 
      updateCanvasSize();
      drawGrid(gridCellSize, inchesPerGridCell);
    };
    viewsizerDragged = false;
    if (canvasDragged) {
      clearCanvas();
      drawGrid(gridCellSize, inchesPerGridCell);
    };
    canvasDragged = false; 
  }); 

  updateCanvasSize(); 
  drawGrid(gridCellSize, inchesPerGridCell);

};

function updateViewSize() {
  view.style.width = viewWidth + "Math.abspx";
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
    ctx.fillText("in", 30, 30);
    console.log(originOffsetX, originOffsetY);

    // grid lines and axes
    ctx.beginPath();
    ctx.strokeStyle = "lightgray";
    ctx.lineWidth = 1;
    var linesToDraw_x = Math.floor(viewWidth + Math.abs(originOffsetX % cellSize) / cellSize)
    var linesToDraw_y = Math.floor(viewHeight + Math.abs(originOffsetY % cellSize) / cellSize)
    for (let i = 1; i <= linesToDraw_x; i++) {
      horizontalPosition = cellSize * i + canvasOffset + (originOffsetX % cellSize);
      ctx.textAlign = "center";
      iOffset = originOffsetX > 0 ? Math.floor(originOffsetX / cellSize) : Math.ceil(originOffsetX / cellSize)
      ctx.fillText((i - iOffset) * inchesPerCell, horizontalPosition, 30);
      ctx.moveTo(horizontalPosition, 0 + canvasOffset); 
      ctx.lineTo(horizontalPosition, viewHeight + canvasOffset);
    };
    for (let i = 1; i <= linesToDraw_y; i++) {
      verticalPosition = cellSize * i + canvasOffset + (originOffsetY % cellSize);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      iOffset = originOffsetY > 0 ? Math.floor(originOffsetY / cellSize) : Math.ceil(originOffsetY / cellSize)
      ctx.fillText((i - iOffset) * inchesPerCell, 35, verticalPosition);
      ctx.moveTo(0 + canvasOffset, verticalPosition); 
      ctx.lineTo(viewWidth + canvasOffset, verticalPosition);
    };
    ctx.closePath();
    ctx.stroke();
  };
};

startup();
