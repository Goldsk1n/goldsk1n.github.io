window.oncontextmenu = () => false; // cancel default menu

const bgCanvas = document.querySelector(".background-canvas");
const drawCanvas = document.querySelector(".drawing-canvas");
const shadowCanvas = document.querySelector(".shadow-canvas");
const pencilButton = document.querySelector(".pencil-button");
const eraserButton = document.querySelector(".eraser-button");
const colorPicker = document.querySelector(".color-picker");
const saveButton = document.querySelector(".save-button");
const popupContainer = document.querySelector(".popup-container");
const savePopup = document.querySelector(".save-popup");
const closePopup = document.querySelectorAll(".close-popup");
const saveFile = document.querySelector(".save-file");
const fileName = document.querySelector(".file-name");
const brushRange = document.querySelector(".brush-range");
const brushSizeLabel = document.querySelector(".brush-size");
const squareShapeButton = document.querySelector(".square-shape-button");
const circleShapeButton = document.querySelector(".circle-shape-button");
const drawTextButton = document.querySelector(".draw-text-button");
const fontRange = document.querySelector(".font-range");
const fontSizeLabel = document.querySelector(".font-size");
const clearButton = document.querySelector(".clear-button");
const newFileButton = document.querySelector(".new-file-button");
const newFilePopup = document.querySelector(".new-file-popup");
const canvasRange = document.querySelector(".canvas-range");
const canvasSizeLabel = document.querySelector(".canvas-size");
const drawNewButton = document.querySelector(".draw-new-button");
const undoButton = document.querySelector(".undo-button");
const redoButton = document.querySelector(".redo-button");
const lineButton = document.querySelector(".line-button");
const eyedropperButton = document.querySelector(".eyedropper-button");

const canvasSize = 600;

const activeButtonColor = "rgba(0, 127, 0, 0.7)";
const shadowColor = "rgba(127, 127, 127, 0.4)";
let brushColor = "#000000";
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

bgCtx.fillStyle = "#E6E6E6";

let pixelCount;
updateCanvasSize();
let pixelSize;
setCanvas();

setLineWidth();
updateBrushSize();

let fontSize;
updateFontSize();

let isMouseDown = false;
let isTypingText = false;
let textValue = "";
let mode;
pencilOn();
shadowCtx.fillStyle = shadowColor;

let x, y;
let textCoords = { x, y };
let pathStart = { x, y };

const undoStack = [drawCanvas.toDataURL()];
let redoStack = [];
const canvasImage = new Image();

shadowCanvas.addEventListener("mousemove", (e) => {
    if (
        (mode === "pencil" || mode === "eraser" || !isMouseDown) &&
        !isTypingText
    ) {
        clear(shadowCtx);
        shadowCtx.fillRect(
            pixelSize *
                Math.ceil((x - (pixelSize * brushSize) / 2) / pixelSize),
            pixelSize *
                Math.ceil((y - (pixelSize * brushSize) / 2) / pixelSize),
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

shadowCanvas.addEventListener("mouseout", () => {
    if (!isTypingText) {
        clear(shadowCtx);
    }
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
        clear(shadowCtx);

        shadowCtx.strokeRect(
            pathStart.x + pixelSize / 2,
            pathStart.y + pixelSize / 2,
            x - pathStart.x,
            y - pathStart.y
        );
    } else if (mode === "circle") {
        clear(shadowCtx);

        drawPixelatedCircle(
            shadowCtx,
            pathStart.x,
            pathStart.y,
            Math.max(x - pathStart.x, y - pathStart.y),
            pixelSize * brushSize
        );
    }
}

function roundToPixel(value) {
    return Math.floor(value / pixelSize);
}

shadowCanvas.addEventListener("mousedown", (e) => {
    redoStack = [];
    updateUndo();

    if (mode === "text") {
        if (isTypingText) {
            drawCtx.fillText(textValue, textCoords.x, textCoords.y);
            isTypingText = false;
            textValue = "";
            shadowCtx.fillStyle = shadowColor;
        } else {
            textCoords = { x, y };
            shadowCtx.fillStyle = brushColor;
            isTypingText = true;
        }
    } else if (mode === "eyedropper") {
        const rgb = drawCtx.getImageData(x, y, 1, 1).data;
        colorPicker.value = rgbToHex(rgb[0], rgb[1], rgb[2]);
    } else if (mode === "square") {
        shadowCtx.strokeStyle = brushColor;
    } else if (mode === "circle" || mode === "line") {
        shadowCtx.fillStyle = brushColor;
    }

    if (e.button === 2) {
        eraserOn();
    }

    pathStart = { x, y };
    draw(x, y, pixelSize, pixelSize);
    isMouseDown = true;
});

function componentToHex(c) {
    const hex = c.toString(16);
    return ("0" + hex).slice(-2);
};

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
};

shadowCanvas.addEventListener("mouseup", (e) => {
    isMouseDown = false;

    if (e.button === 2) {
        mode === "pencil";
        pencilOn();
    }
    if (mode === "square") {
        clear(shadowCtx);
        drawCtx.strokeRect(
            pathStart.x + pixelSize / 2,
            pathStart.y + pixelSize / 2,
            x - pathStart.x,
            y - pathStart.y
        );
        shadowCtx.strokeStyle = shadowColor;
    } else if (mode === "circle") {
        clear(shadowCtx);
        drawPixelatedCircle(
            drawCtx,
            pathStart.x,
            pathStart.y,
            Math.max(x - pathStart.x, y - pathStart.y),
            pixelSize * brushSize
        );
        shadowCtx.fillStyle = shadowColor;
    } else if (mode === "line") {
        clear(shadowCtx);
        drawPixelatedLine(drawCtx, pathStart.x, pathStart.y, x, y, pixelSize);
        shadowCtx.fillStyle = shadowColor;
    } else if (mode === "eyedropper") {
        pencilOn();
    }
});

window.addEventListener("keydown", (e) => {
    if (isTypingText) {
        if (e.key.length === 1 || e.key === "Space") {
            clear(shadowCtx);
            textValue += e.key.toUpperCase();
            shadowCtx.fillText(textValue, textCoords.x, textCoords.y);
        } else if (e.key === "Backspace") {
            clear(shadowCtx);
            textValue = textValue.slice(0, -1);
            shadowCtx.fillText(textValue, textCoords.x, textCoords.y);
        } else if (e.key === "Enter" || e.key === "Escape") {
            drawCtx.fillText(textValue, textCoords.x, textCoords.y);
            isTypingText = false;
            textValue = "";
            shadowCtx.fillStyle = shadowColor;
        }
    }
});

eraserButton.addEventListener("click", eraserOn);

function eraserOn() {
    mode = "eraser";
    pencilButton.style.backgroundColor = "white";
    eraserButton.style.backgroundColor = activeButtonColor;
    squareShapeButton.style.backgroundColor = "white";
    drawTextButton.style.backgroundColor = "white";
    lineButton.style.backgroundColor = "white";
    eyedropperButton.style.backgroundColor = "white";
}

pencilButton.addEventListener("click", (e) => pencilOn());

squareShapeButton.addEventListener("click", () => {
    mode = "square";
    pencilButton.style.backgroundColor = "white";
    eraserButton.style.backgroundColor = "white";
    squareShapeButton.style.backgroundColor = activeButtonColor;
    circleShapeButton.style.backgroundColor = "white";
    drawTextButton.style.backgroundColor = "white";
    lineButton.style.backgroundColor = "white";
    eyedropperButton.style.backgroundColor = "white";
});

circleShapeButton.addEventListener("click", () => {
    mode = "circle";
    pencilButton.style.backgroundColor = "white";
    eraserButton.style.backgroundColor = "white";
    squareShapeButton.style.backgroundColor = "white";
    circleShapeButton.style.backgroundColor = activeButtonColor;
    drawTextButton.style.backgroundColor = "white";
    lineButton.style.backgroundColor = "white";
    eyedropperButton.style.backgroundColor = "white";
});

drawTextButton.addEventListener("click", () => {
    mode = "text";
    pencilButton.style.backgroundColor = "white";
    eraserButton.style.backgroundColor = "white";
    squareShapeButton.style.backgroundColor = "white";
    circleShapeButton.style.backgroundColor = "white";
    drawTextButton.style.backgroundColor = activeButtonColor;
    lineButton.style.backgroundColor = "white";
    eyedropperButton.style.backgroundColor = "white";
});

function pencilOn() {
    mode = "pencil";
    pencilButton.style.backgroundColor = activeButtonColor;
    eraserButton.style.backgroundColor = "white";
    squareShapeButton.style.backgroundColor = "white";
    circleShapeButton.style.backgroundColor = "white";
    drawTextButton.style.backgroundColor = "white";
    lineButton.style.backgroundColor = "white";
    eyedropperButton.style.backgroundColor = "white";
}

function setLineWidth() {
    drawCtx.lineWidth = pixelSize * brushSize;
    shadowCtx.lineWidth = pixelSize * brushSize;
}

colorPicker.addEventListener("change", () => {
    brushColor = colorPicker.value;
    drawCtx.fillStyle = brushColor;
    drawCtx.strokeStyle = brushColor;
});

saveButton.addEventListener("click", () => {
    popupContainer.style.display = "flex";
    savePopup.style.display = "block";
});

newFileButton.addEventListener("click", () => {
    popupContainer.style.display = "flex";
    newFilePopup.style.display = "flex";
});

closePopup.forEach((node) =>
    node.addEventListener("click", (e) => closeModal(e))
);

function closeModal(e) {
    popupContainer.style.display = "none";
    e.target.parentElement.style.display = "none";
}

saveFile.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `${fileName.value}.png`;
    link.href = drawCanvas.toDataURL();
    link.click();
    link.delete;
});

brushRange.addEventListener("input", updateBrushSize);
fontRange.addEventListener("input", updateFontSize);
canvasRange.addEventListener("input", updateCanvasSize);

function updateBrushSize() {
    brushSize = brushRange.value;
    brushSizeLabel.textContent = brushSize;
    setLineWidth();
}

function updateFontSize() {
    fontSize = fontRange.value;
    fontSizeLabel.textContent = fontSize;
    shadowCtx.font = `${fontSize * pixelSize * 2}px Pixel5x5`;
    drawCtx.font = `${fontSize * pixelSize * 2}px Pixel5x5`;
}

function updateCanvasSize() {
    pixelCount = canvasRange.value;
    canvasSizeLabel.textContent = pixelCount;
}

function drawPixelatedCircle(ctx, centerX, centerY, radius, pixelSize) {
    let x = radius;
    let y = 0;
    let radiusError = 1 - x;

    while (x >= y) {
        drawPixelQuadrants(ctx, centerX, centerY, x, y, pixelSize);

        y += pixelSize / brushSize;

        if (radiusError < 0) {
            radiusError += 2 * y + pixelSize;
        } else {
            x -= pixelSize / brushSize;
            radiusError += 2 * (y - x) + pixelSize;
        }
    }
}

function drawPixelQuadrants(ctx, centerX, centerY, x, y, pixelSize) {
    drawPixel(ctx, centerX + x, centerY + y, pixelSize);
    drawPixel(ctx, centerX - x, centerY + y, pixelSize);
    drawPixel(ctx, centerX + x, centerY - y, pixelSize);
    drawPixel(ctx, centerX - x, centerY - y, pixelSize);

    if (x != y) {
        drawPixel(ctx, centerX + y, centerY + x, pixelSize);
        drawPixel(ctx, centerX - y, centerY + x, pixelSize);
        drawPixel(ctx, centerX + y, centerY - x, pixelSize);
        drawPixel(ctx, centerX - y, centerY - x, pixelSize);
    }
}

function drawPixel(ctx, x, y, pixelSize) {
    ctx.fillRect(x, y, pixelSize, pixelSize);
}

clearButton.addEventListener("click", () => {
    clear(drawCtx);
});

drawNewButton.addEventListener("click", (e) => {
    clear(drawCtx);
    clear(bgCtx);

    setCanvas();

    closeModal(e);
});

function clear(ctx) {
    ctx.clearRect(0, 0, canvasSize, canvasSize);
}

function setCanvas() {
    pixelSize = canvasSize / pixelCount;

    for (let i = 0; i < pixelCount; i++) {
        const startPoint = i % 2;
        for (let j = startPoint; j < canvasSize; j += 2) {
            bgCtx.fillRect(i * pixelSize, j * pixelSize, pixelSize, pixelSize);
        }
    }
}

undoButton.addEventListener("click", handleUndo);
redoButton.addEventListener("click", handleRedo);

function handleUndo() {
    if (undoStack.length > 0) {
        const prevCanvas = undoStack.pop();
        redoStack.push(drawCanvas.toDataURL());
        canvasImage.src = prevCanvas;
    }
}

function handleRedo() {
    if (redoStack.length > 0) {
        updateUndo();
        console.log("b");
        const nextCanvas = redoStack.pop();
        canvasImage.src = nextCanvas;
    }
}

function updateUndo() {
    undoStack.push(drawCanvas.toDataURL());
}

canvasImage.addEventListener("load", () => {
    clear(drawCtx);
    drawCtx.drawImage(canvasImage, 0, 0, canvasSize, canvasSize);
});

lineButton.addEventListener("click", () => {
    mode = "line";
    pencilButton.style.backgroundColor = "white";
    eraserButton.style.backgroundColor = "white";
    squareShapeButton.style.backgroundColor = "white";
    circleShapeButton.style.backgroundColor = "white";
    drawTextButton.style.backgroundColor = "white";
    lineButton.style.backgroundColor = activeButtonColor;
    eyedropperButton.style.backgroundColor = "white";
});

function drawPixelatedLine(ctx, x1, y1, x2, y2, pixelSize) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? pixelSize : -pixelSize;
    const sy = y1 < y2 ? pixelSize : -pixelSize;
    let err = dx - dy;

    while (true) {
        ctx.fillRect(x1, y1, pixelSize * brushSize, pixelSize * brushSize);

        if (x1 === x2 && y1 === y2) {
            break;
        }

        const err2 = 2 * err;

        if (err2 > -dy) {
            err -= dy;
            x1 += sx;
        }

        if (err2 < dx) {
            err += dx;
            y1 += sy;
        }
    }
}

eyedropperButton.addEventListener("click", () => handleEyedropper());

function handleEyedropper() {
    mode = "eyedropper";
    pencilButton.style.backgroundColor = "white";
    eraserButton.style.backgroundColor = "white";
    squareShapeButton.style.backgroundColor = "white";
    circleShapeButton.style.backgroundColor = "white";
    drawTextButton.style.backgroundColor = "white";
    lineButton.style.backgroundColor = "white";
    eyedropperButton.style.backgroundColor = activeButtonColor;
}
