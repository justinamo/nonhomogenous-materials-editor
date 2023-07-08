var gridCellSize = 150; 
var inchesPerGridCell = 25;

var view = document.getElementById("view");
var viewHeight = 800; 
var viewWidth = 1000; 

var viewsizer = document.getElementById("viewsizer");
var viewsizerDragged = false; 
viewsizer.addEventListener("dragstart", (event) => {
  console.log("drag start");
  viewsizerDragged = true;
});
viewsizer.addEventListener("drag", (event) => {
  updateCanvasSize();
  drawGrid(gridCellSize, inchesPerGridCell);
});
viewsizer.addEventListener("dragend", (event) => {
  console.log("drag end");
  updateCanvasSize();
  drawGrid(gridCellSize, inchesPerGridCell);
  viewsizerDragged = false;
});

window.addEventListener("dragover", (event) => {
  if (viewsizerDragged) { 
    viewWidth = event.x - 50;
    viewHeight = event.y - 50;
    updateViewSize();
  };
});

function updateViewSize() {
  view.style.width = viewWidth + "px";
  view.style.height = viewHeight + "px";
}

canvas = document.getElementById("canvas");
canvasOffset = 40 

function updateCanvasSize() {
  canvas.width = viewWidth + canvasOffset * 2;
  canvas.height = viewHeight + canvasOffset * 2;
}

function drawGrid(cellSize, inchesPerCell) {
  if (canvas.getContext) {
    const ctx = canvas.getContext("2d");
    // unit label 
    ctx.fillText("in", 30, 30);

    // grid lines 
    ctx.beginPath();
    ctx.strokeStyle = "lightgray";
    ctx.lineWidth = 1;
    var linesToDraw_x = Math.floor(viewWidth / cellSize)
    var linesToDraw_y = Math.floor(viewHeight / cellSize)
    for (let i = 1; i <= linesToDraw_x; i++) {
      horizontalPosition = cellSize * i + canvasOffset;
      ctx.textAlign = "center";
      ctx.fillText(i * inchesPerCell, horizontalPosition, 30);
      ctx.moveTo(horizontalPosition, 0 + canvasOffset); 
      ctx.lineTo(horizontalPosition, viewHeight + canvasOffset);
    }
    for (let i = 1; i <= linesToDraw_y; i++) {
      verticalPosition = cellSize * i + canvasOffset;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(i * inchesPerCell, 35, verticalPosition);
      ctx.moveTo(0 + canvasOffset, verticalPosition); 
      ctx.lineTo(viewWidth + canvasOffset, verticalPosition);
    }
    ctx.closePath();
    ctx.stroke();
  }
}

updateCanvasSize(); 
drawGrid(gridCellSize, inchesPerGridCell);
