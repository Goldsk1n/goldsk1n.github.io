window.oncontextmenu = () => false; // cancel default menu

const bgCanvas = document.querySelector(".background-canvas");
const drawCanvas = document.querySelector(".drawing-canvas");
const shadowCanvas = document.querySelector(".shadow-canvas");
const pencilButton = document.querySelector(".pencil-button");
const eraserButton = document.querySelector(".eraser-button");
const colorPicker = document.querySelector(".color-picker");
const saveButton = document.querySelector(".save-button");
const popupContainer = document.querySelector(".popup-container");
const closePopup = document.querySelector(".close-popup");
const saveFile = document.querySelector(".save-file");
const fileName = document.querySelector(".file-name");
const brushRange = document.querySelector(".brush-range");
const brushSizeLabel = document.querySelector(".brush-size");
const squareShapeButton = document.querySelector(".square-shape-button");

const canvasSize = 600;

let activeButtonColor = "rgba(0, 127, 0, 0.7)";
let brushColor = "#000000";
let strokeColor = "#000000";
let brushSize = 1;

function setCanvasSize(canvas, canvasSize) {
    canvas.width = canvasSize;
    canvas.height = canvasSize;
}

setCanvasSize(bgCanvas, canvasSize);
setCanvasSize(drawCanvas, canvasSize);
setCanvasSize(shadowCanvas, canvasSize);

const bgCtx = bgCanvas.getContext("2d");
const drawCtx = drawCanvas.getContext("2d");
const shadowCtx = shadowCanvas.getContext("2d");

const pixelCount = 50;

const pixelSize = canvasSize / pixelCount;
setLineWidth();
updateBrushSize();

bgCtx.fillStyle = "#E6E6E6";
for (let i = 0; i < pixelCount; i++) {
    const startPoint = i % 2;
    for (let j = startPoint; j < canvasSize; j += 2) {
        bgCtx.fillRect(i * pixelSize, j * pixelSize, pixelSize, pixelSize);
    }
}

let isMouseDown = false;
let mode;
pencilOn();
shadowCtx.fillStyle = "rgba(127, 127, 127, 0.4)";

let x, y;
let pathStart = { x, y };

shadowCanvas.addEventListener("mousemove", (e) => {
    if (mode !== "square" || !isMouseDown) {
        shadowCtx.clearRect(0, 0, canvasSize, canvasSize);
        shadowCtx.fillRect(
            pixelSize * Math.ceil((x - (pixelSize * brushSize) / 2) / pixelSize),
            pixelSize * Math.ceil((y - (pixelSize * brushSize) / 2) / pixelSize),
            pixelSize * brushSize,
            pixelSize * brushSize
        );
    }

    if (isMouseDown) {
        draw(x, y, pixelSize, pixelSize);
    }

    x = pixelSize * roundToPixel(e.offsetX);
    y = pixelSize * roundToPixel(e.offsetY);

    
});

function draw(x, y, pixelSize, pixelSize) {
    if (mode === "pencil") {
        drawCtx.fillRect(
            pixelSize *
                Math.ceil((x - (pixelSize * brushSize) / 2) / pixelSize),
            pixelSize *
                Math.ceil((y - (pixelSize * brushSize) / 2) / pixelSize),
            pixelSize * brushSize,
            pixelSize * brushSize
        );
    } else if (mode === "eraser") {
        drawCtx.clearRect(
            pixelSize *
                Math.ceil((x - (pixelSize * brushSize) / 2) / pixelSize),
            pixelSize *
                Math.ceil((y - (pixelSize * brushSize) / 2) / pixelSize),
            pixelSize * brushSize,
            pixelSize * brushSize
        );
    } else if (mode === "square") {
        shadowCtx.clearRect(0,0,canvasSize,canvasSize);

        shadowCtx.strokeRect(
            pathStart.x + pixelSize / 2,
            pathStart.y + pixelSize / 2,
            x - pathStart.x,
            y - pathStart.y
        );
    }
}

function roundToPixel(value) {
    return Math.floor(value / pixelSize);
}

shadowCanvas.addEventListener("mousedown", (e) => {
    if(mode === "square") {
        shadowCtx.strokeStyle = brushColor;
    }
    pathStart = { x, y };
    draw(x, y, pixelSize, pixelSize);
    isMouseDown = true;
});

shadowCanvas.addEventListener("mouseup", (e) => {
    if(mode === "square") {
        shadowCtx.clearRect(0,0,canvasSize,canvasSize);
        drawCtx.strokeRect(
            pathStart.x + pixelSize / 2,
            pathStart.y + pixelSize / 2,
            x - pathStart.x,
            y - pathStart.y
        );
        shadowCtx.fillStyle = "rgba(127, 127, 127, 0.4)";
    }
    isMouseDown = false;
});

eraserButton.addEventListener("click", () => {
    mode = "eraser";
    pencilButton.style.backgroundColor = "white";
    eraserButton.style.backgroundColor = activeButtonColor;
    squareShapeButton.style.backgroundColor = "white";
});

pencilButton.addEventListener("click", (e) => pencilOn());

squareShapeButton.addEventListener("click", () => {
    mode = "square";
    pencilButton.style.backgroundColor = "white";
    eraserButton.style.backgroundColor = "white";
    squareShapeButton.style.backgroundColor = activeButtonColor;
});

function setLineWidth() {
    drawCtx.lineWidth = pixelSize * brushSize;
    shadowCtx.lineWidth = pixelSize * brushSize;
}

function pencilOn() {
    mode = "pencil";
    pencilButton.style.backgroundColor = activeButtonColor;
    eraserButton.style.backgroundColor = "white";
    squareShapeButton.style.backgroundColor = "white";
}

colorPicker.addEventListener("change", () => {
    brushColor = colorPicker.value;
    strokeColor = colorPicker.value;
    drawCtx.fillStyle = brushColor;
    drawCtx.strokeStyle = strokeColor;
});

saveButton.addEventListener("click", () => {
    popupContainer.style.display = "flex";
});

closePopup.addEventListener("click", () => {
    popupContainer.style.display = "none";
});

saveFile.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `${fileName.value}.png`;
    link.href = drawCanvas.toDataURL();
    link.click();
    link.delete;
});

brushRange.addEventListener("input", updateBrushSize);

function updateBrushSize() {
    brushSize = brushRange.value;
    brushSizeLabel.textContent = brushSize;
    setLineWidth();
}
