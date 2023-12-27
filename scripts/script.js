window.oncontextmenu = () => false; // cancel default menu

const bgCanvas = document.querySelector(".background-canvas");
const drawCanvas = document.querySelector(".drawing-canvas");
const selectCanvas = document.querySelector(".select-canvas");
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
const fillButton = document.querySelector(".fill-button");
const selectButton = document.querySelector(".select-button");
const selectedArea = document.querySelector(".selected-area");
const canvasContainer = document.querySelector(".canvas-container");
const copySelectedButton = document.querySelector(".select-btn.copy");
const cutSelectedButton = document.querySelector(".select-btn.cut");
const pasteSelectedButton = document.querySelector(".select-btn.paste");

const canvasSize = 600;

const activeButtonColor = "rgba(0, 127, 0, 0.7)";
const shadowColor = "rgba(127, 127, 127, 0.5)";
let brushColor = "#000000";
let brushSize = 1;

function setCanvasSize(canvas, canvasSize) {
    canvas.width = canvasSize;
    canvas.height = canvasSize;
}

setCanvasSize(bgCanvas, canvasSize);
setCanvasSize(drawCanvas, canvasSize);
setCanvasSize(selectCanvas, canvasSize);
setCanvasSize(shadowCanvas, canvasSize);

const bgCtx = bgCanvas.getContext("2d");
const drawCtx = drawCanvas.getContext("2d");
const selectCtx = selectCanvas.getContext("2d");
const shadowCtx = shadowCanvas.getContext("2d");

bgCtx.fillStyle = "#E6E6E6";

selectCtx.setLineDash([5, 3]);
selectCtx.fillStyle = "#000000";
let isAboveSelectedArea = false;
let isSelectedMoving = false;

let pixelCount;
updateCanvasSize();
let pixelSize;
let fontSize;
setCanvas();

let isMouseDown = false;
let isTypingText = false;
let textValue = "";
let prevMode, mode;
let currentElem = pencilButton;
activateMode("pencil");
shadowCtx.fillStyle = shadowColor;

let selectWidth, selectHeight, selectTop, selectLeft;

let x, y;
let textCoords = { x, y };
let pathStart = { x, y };
let selectStart = { x, y };

const undoStack = [drawCanvas.toDataURL()];
let redoStack = [];
const canvasImage = new Image();

let selectedBuffer;
let copyBuffer;
const keysPressed = {};
let isTextCursorOn = false;
let textCursorInterval;
shadowCtx.fillText(textValue, 0, 0);

canvasContainer.addEventListener("mousemove", (e) => {
    if (
        (mode === "pencil" || mode === "eraser" || !isMouseDown) &&
        !isTypingText
    ) {
        if (!isAboveSelectedArea) {
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
    }

    if (isMouseDown) {
        draw(x, y, pixelSize, pixelSize);
    }

    x = pixelSize * roundToPixel(e.offsetX);
    y = pixelSize * roundToPixel(e.offsetY);

    if (isSelectedMoving) {
        drawCtx.clearRect(
            parseInt(selectedArea.style.left),
            parseInt(selectedArea.style.top),
            selectWidth,
            selectHeight
        );
        selectedArea.style.top =
            parseInt(selectedArea.style.top) + y - selectStart.y + "px";
        selectedArea.style.left =
            parseInt(selectedArea.style.left) + x - selectStart.x + "px";
        clear(selectCtx);
        selectCtx.strokeRect(
            parseInt(selectedArea.style.left),
            parseInt(selectedArea.style.top),
            selectWidth,
            selectHeight
        );
        drawCtx.putImageData(
            selectedBuffer,
            parseInt(selectedArea.style.left),
            parseInt(selectedArea.style.top)
        );
    }
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
    } else if (mode === "line") {
        clear(shadowCtx);

        drawPixelatedLine(shadowCtx, pathStart.x, pathStart.y, x, y, pixelSize);
    } else if (mode === "select") {
        clear(selectCtx);

        const width = x - pathStart.x;
        const height = y - pathStart.y;

        let localX, localY, localW, localH;
        if (width >= 0) {
            if (height >= 0) {
                localX = pathStart.x;
                localY = pathStart.y;
                localW = width + pixelSize;
                localH = height + pixelSize;
                selectHeight = Math.abs(height + pixelSize);
                selectTop = pathStart.y;
            } else {
                localX = pathStart.x;
                localY = pathStart.y + pixelSize;
                localW = width + pixelSize;
                localH = height - pixelSize;
                selectHeight = Math.abs(height - pixelSize);
                selectTop = pathStart.y + pixelSize - selectHeight;
            }
            selectLeft = pathStart.x;
            selectWidth = Math.abs(width + pixelSize);
        } else {
            if (height >= 0) {
                localX = pathStart.x + pixelSize;
                localY = pathStart.y;
                localW = width - pixelSize;
                localH = height + pixelSize;
                selectHeight = Math.abs(height + pixelSize);
                selectTop = pathStart.y;
            } else {
                localX = pathStart.x + pixelSize;
                localY = pathStart.y + pixelSize;
                localW = width - pixelSize;
                localH = height - pixelSize;
                selectHeight = Math.abs(height - pixelSize);
                selectTop = pathStart.y + pixelSize - selectHeight;
            }
            selectLeft = pathStart.x - Math.abs(width);
            selectWidth = Math.abs(width - pixelSize);
        }
        if (selectWidth > pixelSize || selectHeight > pixelSize) {
            selectCtx.strokeRect(localX, localY, localW, localH);
        }
    }
}

function roundToPixel(value) {
    return Math.floor(value / pixelSize);
}

shadowCanvas.addEventListener("mousedown", handleMouseDown);

function handleMouseDown(e) {
    redoStack = [];
    updateUndo();

    if (e.button === 2) {
        activateMode("eraser");
    }

    if (e.button === 0) {
        if (mode === "text") {
            if (isTypingText) {
                removeTextCursor();
                drawCtx.fillText(textValue, textCoords.x, textCoords.y);
                isTypingText = false;
                textValue = "";
                shadowCtx.fillStyle = shadowColor;
            } else {
                textCoords = { x, y };
                shadowCtx.fillStyle = brushColor;
                isTypingText = true;
                setTextCursor();
            }
        } else if (mode === "eyedropper") {
            const rgb = drawCtx.getImageData(x, y, 1, 1).data;
            colorPicker.value = rgbToHex(rgb[0], rgb[1], rgb[2]);
        } else if (mode === "square") {
            shadowCtx.strokeStyle = brushColor;
        } else if (mode === "circle" || mode === "line") {
            shadowCtx.fillStyle = brushColor;
        } else if (mode === "fill") {
            floodFill(drawCanvas, drawCtx, x, y, toRGBA(brushColor));
        }
    }

    pathStart = { x, y };
    draw(x, y, pixelSize, pixelSize);
    isMouseDown = true;
}

shadowCanvas.addEventListener("mouseup", handleMouseUp);

function handleMouseUp(e) {
    isMouseDown = false;

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
        activateMode("pencil");
    } else if (
        mode === "select" &&
        (selectWidth > pixelSize || selectHeight > pixelSize)
    ) {
        selectedArea.style.display = "block";
        selectedArea.style.top = selectTop + "px";
        selectedArea.style.left = selectLeft + "px";
        selectedArea.style.width = selectWidth + "px";
        selectedArea.style.height = selectHeight + "px";
    }
    if (e.button === 2) {
        activateMode(prevMode);
    }
}

function componentToHex(c) {
    const hex = c.toString(16);
    return ("0" + hex).slice(-2);
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

window.addEventListener("keydown", (e) => {
    keysPressed[e.key] = true;
    if (isTypingText) {
        if (e.key.length === 1 || e.key === "Space") {
            removeTextCursor();
            clear(shadowCtx);
            textValue += e.key.toUpperCase();
            shadowCtx.fillText(textValue, textCoords.x, textCoords.y);
            setTextCursor();
        } else if (e.key === "Backspace") {
            removeTextCursor();
            clear(shadowCtx);
            textValue = textValue.slice(0, -1);
            shadowCtx.fillText(textValue, textCoords.x, textCoords.y);
            setTextCursor();
        } else if (e.key === "Enter" || e.key === "Escape") {
            drawCtx.fillText(textValue, textCoords.x, textCoords.y);
            isTypingText = false;
            textValue = "";
            shadowCtx.fillStyle = shadowColor;
        }
    } else if (keysPressed["Control"]) {
        if (keysPressed["c"]) {
            handleCopy();
        } else if (keysPressed["x"]) {
            handleCut();
        } else if (keysPressed["v"]) {
            handlePaste();
        }
    }
});

window.addEventListener("keyup", (e) => {
    delete keysPressed[e.key];
});

function activateMode(modeName) {
    prevMode = mode;
    mode = modeName;
    currentElem.style.backgroundColor = "white";
    currentElem = elemByMode(mode);
    currentElem.style.backgroundColor = activeButtonColor;
}

function elemByMode(mode) {
    switch (mode) {
        case "pencil":
            return pencilButton;
        case "eraser":
            return eraserButton;
        case "line":
            return lineButton;
        case "square":
            return squareShapeButton;
        case "circle":
            return circleShapeButton;
        case "text":
            return drawTextButton;
        case "eyedropper":
            return eyedropperButton;
        case "fill":
            return fillButton;
        case "select":
            return selectButton;
    }
}

pencilButton.addEventListener("click", () => activateMode("pencil"));

eraserButton.addEventListener("click", () => activateMode("eraser"));

lineButton.addEventListener("click", () => activateMode("line"));

squareShapeButton.addEventListener("click", () => activateMode("square"));

circleShapeButton.addEventListener("click", () => activateMode("circle"));

drawTextButton.addEventListener("click", () => activateMode("text"));

eyedropperButton.addEventListener("click", () => activateMode("eyedropper"));

fillButton.addEventListener("click", () => activateMode("fill"));

selectButton.addEventListener("click", () => activateMode("select"));

function setLineWidth(width) {
    drawCtx.lineWidth = width;
    shadowCtx.lineWidth = width;
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
    setLineWidth(pixelSize * brushSize);
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

    updateBrushSize();
    updateFontSize();
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

function toRGBA(color) {
    var bigint = parseInt(color.slice(1), 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    return { r: r, g: g, b: b, a: 255 };
}

function floodFill(canvas, ctx, x, y, color) {
    pixelStack = [{ x: x, y: y }];
    pixels = ctx.getImageData(0, 0, canvasSize, canvasSize);
    var linearCoords = (y * canvasSize + x) * 4;
    prevColor = {
        r: pixels.data[linearCoords],
        g: pixels.data[linearCoords + 1],
        b: pixels.data[linearCoords + 2],
        a: pixels.data[linearCoords + 3],
    };

    if (
        prevColor.r == color.r &&
        prevColor.g == color.g &&
        prevColor.b == color.b &&
        prevColor.a == color.a
    ) {
        return;
    }

    while (pixelStack.length > 0) {
        newPixel = pixelStack.shift();
        x = newPixel.x;
        y = newPixel.y;

        linearCoords = (y * canvasSize + x) * 4;
        while (
            y-- >= 0 &&
            pixels.data[linearCoords] == prevColor.r &&
            pixels.data[linearCoords + 1] == prevColor.g &&
            pixels.data[linearCoords + 2] == prevColor.b &&
            pixels.data[linearCoords + 3] == prevColor.a
        ) {
            linearCoords -= canvasSize * 4;
        }
        linearCoords += canvasSize * 4;
        y++;

        var isReachedLeft = false;
        var isReachedRight = false;
        while (
            y++ < canvas.height &&
            pixels.data[linearCoords] == prevColor.r &&
            pixels.data[linearCoords + 1] == prevColor.g &&
            pixels.data[linearCoords + 2] == prevColor.b &&
            pixels.data[linearCoords + 3] == prevColor.a
        ) {
            pixels.data[linearCoords] = color.r;
            pixels.data[linearCoords + 1] = color.g;
            pixels.data[linearCoords + 2] = color.b;
            pixels.data[linearCoords + 3] = color.a;

            if (x > 0) {
                if (
                    pixels.data[linearCoords - 4] == prevColor.r &&
                    pixels.data[linearCoords - 4 + 1] == prevColor.g &&
                    pixels.data[linearCoords - 4 + 2] == prevColor.b &&
                    pixels.data[linearCoords - 4 + 3] == prevColor.a
                ) {
                    if (!isReachedLeft) {
                        pixelStack.push({ x: x - 1, y: y });
                        isReachedLeft = true;
                    }
                } else if (isReachedLeft) {
                    isReachedLeft = false;
                }
            }

            if (x < canvasSize - 1) {
                if (
                    pixels.data[linearCoords + 4] == prevColor.r &&
                    pixels.data[linearCoords + 4 + 1] == prevColor.g &&
                    pixels.data[linearCoords + 4 + 2] == prevColor.b &&
                    pixels.data[linearCoords + 4 + 3] == prevColor.a
                ) {
                    if (!isReachedRight) {
                        pixelStack.push({ x: x + 1, y: y });
                        isReachedRight = true;
                    }
                } else if (isReachedRight) {
                    isReachedRight = false;
                }
            }

            linearCoords += canvasSize * 4;
        }
    }

    ctx.putImageData(pixels, 0, 0);
}

selectedArea.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    isSelectedMoving = true;
    selectStart = { x, y };
    selectedBuffer = drawCtx.getImageData(
        selectLeft,
        selectTop,
        selectWidth,
        selectHeight
    );
});

selectedArea.addEventListener("mouseover", () => {
    isAboveSelectedArea = true;
});

selectedArea.addEventListener("mouseout", () => {
    isAboveSelectedArea = false;
});

selectedArea.addEventListener("mouseup", () => {
    isSelectedMoving = false;
});

window.addEventListener("mousedown", (e) => {
    clear(selectCtx);
    selectedArea.style.display = "none";
});

copySelectedButton.addEventListener("click", handleCopy);

cutSelectedButton.addEventListener("click", handleCut);

pasteSelectedButton.addEventListener("click", handlePaste);

function handleCopy() {
    copyBuffer = drawCtx.getImageData(
        selectLeft,
        selectTop,
        selectWidth,
        selectHeight
    );
}

function handleCut() {
    handleCopy();
    drawCtx.clearRect(selectLeft, selectTop, selectWidth, selectHeight);
}

function handlePaste() {
    drawCtx.putImageData(copyBuffer, selectLeft, selectTop);
}

function setTextCursor() {
    shadowCtx.fillStyle = shadowColor;
    textCursorInterval = setInterval(() => {
        let cursorX = textCoords.x + Math.round(shadowCtx.measureText(textValue).width);

        if (isTextCursorOn) {
            shadowCtx.clearRect(
                cursorX,
                textCoords.y,
                pixelSize,
                -pixelSize * fontSize
            );
            isTextCursorOn = false;
        } else {
            shadowCtx.fillRect(
                cursorX,
                textCoords.y,
                pixelSize,
                -pixelSize * fontSize
            );
            isTextCursorOn = true;
        }
    }, 500);
}

function removeTextCursor() {
    clearInterval(textCursorInterval);
    shadowCtx.fillStyle = brushColor;
}