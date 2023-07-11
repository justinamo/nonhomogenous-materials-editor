var gridCellSize = 150; 
var inchesPerGridCell = 4;
var originOffsetX = 0; 
var originOffsetY = 0; 
var canvasDragStartX = null; 
var canvasDragStartY = null; 

var plateData; 
var plateWidthInInches;
var plateHeightInInches; 
var readingPlate = false;

var svgData; 
var readingSvg = false;

var view = document.getElementById("view");
var viewHeight = 800; 
var viewWidth = 1000; 

var viewsizer = document.getElementById("viewsizer");
var viewsizerDragged = false; 

canvas = document.getElementById("canvas");
canvasOffset = 40;
var canvasDragged = false; 

async function upload(formData, url) {
  try {
    const response = await fetch("http://localhost:8080/" + url, {
      method: "PUT",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: formData,
    });
    const result = await response.json();
    console.log("Success:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

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
      draw(); 
    };
    if (canvasDragged && !viewsizerDragged) {
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

  var svgReader = new FileReader(); 
  svgReader.addEventListener("load", (event) => {
    var image = new Image(); 
    image.src = svgReader.result; 
    svgData = image; 
    draw(); 
  });

  var photoInput = document.getElementById("photo-input"); 
  photoInput.addEventListener("change", (event) => {
    if (photoInput.files && photoInput.files[0]) { 
      var photo = photoInput.files[0]; 
      plateReader.readAsDataURL(photo);
    };
  });

  var svgInput = document.getElementById("svg-input"); 
  svgInput.addEventListener("change", (event) => {
    if (svgInput.files && svgInput.files[0]) { 
      var svg = svgInput.files[0]; 

      const formData = new FormData(); 
      formData.append("svg", svg); 
      upload(formData, "svg").then(() => {
	console.log("success");
      }, () => {
	console.log("failure");
      });
      //svgReader.readAsDataURL(svg);
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

function drawImage(ctx, imageData) { 
  dx = Math.max(originOffsetX + canvasOffset, canvasOffset); 
  dy = Math.max(originOffsetY + canvasOffset, canvasOffset); 
  // TODO: should handle other widths in addition to plate width
  gridWidth = plateWidthInInches / inchesPerGridCell * gridCellSize; 
  gridHeight = plateHeightInInches / inchesPerGridCell * gridCellSize; 
  sx = Math.max(0, -originOffsetX) * imageData.width / gridWidth;
  sy = Math.max(0, -originOffsetY) * imageData.height / gridHeight;
  sWidth = Math.min(gridWidth, viewWidth + canvasOffset - dx) * imageData.width / gridWidth;
  sHeight = Math.min(gridHeight, viewHeight + canvasOffset - dy) * imageData.height / gridHeight;
  dWidth = Math.min(gridWidth, viewWidth + canvasOffset - dx);
  dHeight = Math.min(gridHeight, viewHeight + canvasOffset - dy);
  ctx.drawImage(imageData, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight); 
};

function drawPlate() { 
  if (canvas.getContext && plateData) {
    const ctx = canvas.getContext("2d");
    drawImage(ctx, plateData); 
    rx = Math.min(dx, canvasOffset + viewWidth); 
    ry = Math.min(dy, canvasOffset + viewHeight); 
    rectWidth = Math.max(Math.min(dWidth, gridWidth + originOffsetX), 0);
    rectHeight = Math.max(Math.min(dHeight, gridHeight + originOffsetY), 0);
    ctx.beginPath();
    ctx.rect(rx, ry, rectWidth, rectHeight);
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.closePath();
  };
};

function drawSvg() { 
  if (canvas.getContext && svgData) { 
    const ctx = canvas.getContext("2d");
    drawImage(ctx, svgData);
  };
};

function draw() {
  drawGrid(gridCellSize, inchesPerGridCell);
  drawPlate();
  drawSvg(); 
};

startup();
