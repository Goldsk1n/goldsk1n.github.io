window.oncontextmenu = () => false; // cancel default menu

const bgCanvas = document.querySelector(".background-canvas");
const drawCanvas = document.querySelector(".drawing-canvas");
const selectCanvas = document.querySelector(".select-canvas");
const shadowCanvas = document.querySelector(".shadow-canvas");
const pencilButton = document.querySelector(".pencil-button");
const eraserButton = document.querySelector(".eraser-button");
const primaryColorPicker = document.querySelector(".color-picker.primary");
const secondaryColorPicker = document.querySelector(".color-picker.secondary");
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
const sprayButton = document.querySelector(".spray-button");
const sprayRange = document.querySelector(".spray-range");
const spraySizeLabel = document.querySelector(".spray-size");
const magicWandButton = document.querySelector(".magic-wand-button");
const rbEraseCheckbox = document.querySelector("#rb-erase-checkbox");
const fillCheckbox = document.querySelector("#fill-checkbox");
const centerCheckbox = document.querySelector("#center-checkbox");
const ratioCheckbox = document.querySelector("#ratio-checkbox");
const buttonGroup = document.querySelectorAll(".button-group button");
const toolOptionName = document.querySelector(".tool-option-name");
const toolOptions = document.querySelectorAll(".tool-options label");
const rbEraseLabel = document.querySelector(".rb-erase-label");
const ratioLabel = document.querySelector(".ratio-label");
const fillLabel = document.querySelector(".fill-label");
const centerLabel = document.querySelector(".center-label");
const brushRangeContainer = document.querySelector(".brush-range-container");
const fontRangeContainer = document.querySelector(".font-range-container");
const sprayRangeContainer = document.querySelector(".spray-range-container");

const canvasSize = 600;

const activeButtonColor = "rgba(0, 127, 0, 0.7)";
const shadowColor = "rgba(127, 127, 127, 0.5)";
let primaryColor = "#000000";
let secondaryColor = "#000000";
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
activateMode(currentElem);
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

let spraySize;
updateSpraySize();
let sprayInterval;

let isCenterModeOn = false;
let isFillShapeOn = false;
let isRightClickEraseOn = false;
let isCircleRatioOn = false;

canvasContainer.addEventListener("mousemove", (e) => {
    if (
        (mode === pencilButton || mode === eraserButton || !isMouseDown) &&
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

    x = roundToPixel(e.offsetX);
    y = roundToPixel(e.offsetY);

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
    if (mode === pencilButton) {
        drawCtx.fillRect(
            pixelSize *
                Math.ceil((x - (pixelSize * brushSize) / 2) / pixelSize),
            pixelSize *
                Math.ceil((y - (pixelSize * brushSize) / 2) / pixelSize),
            pixelSize * brushSize,
            pixelSize * brushSize
        );
    } else if (mode === eraserButton) {
        drawCtx.clearRect(
            pixelSize *
                Math.ceil((x - (pixelSize * brushSize) / 2) / pixelSize),
            pixelSize *
                Math.ceil((y - (pixelSize * brushSize) / 2) / pixelSize),
            pixelSize * brushSize,
            pixelSize * brushSize
        );
    } else if (mode === squareShapeButton) {
        clear(shadowCtx);

        let startX = pathStart.x,
            startY = pathStart.y;
        if (isCenterModeOn) {
            startX -= x - pathStart.x;
            startY -= y - pathStart.y;
        }

        if (isFillShapeOn) {
            shadowCtx.fillRect(
                startX,
                startY,
                x - pathStart.x + pixelSize,
                y - pathStart.y + pixelSize
            );
        } else {
            shadowCtx.strokeRect(
                startX + pixelSize / 2,
                startY + pixelSize / 2,
                x - startX,
                y - startY
            );
        }
    } else if (mode === circleShapeButton) {
        clear(shadowCtx);

        let startX = pathStart.x,
            startY = pathStart.y;

        let pathX = x - pathStart.x;
        let pathY = y - pathStart.y;

        let radX, radY;

        if (isCircleRatioOn) {
            let maxRad = Math.max(Math.abs(pathX), Math.abs(pathY));

            radX = (pathX > 0) ? maxRad : -maxRad;
            radY = (pathY > 0) ? maxRad : -maxRad;
        } else {
            radX = pathX;
            radY = pathY;
        }

        if (!isCenterModeOn) {
            radX /= 2;
            radY /= 2;
            startX += radX;
            startY += radY;
        }

        drawPixelatedEllipse(
            shadowCtx,
            startX,
            startY,
            Math.abs(radX),
            Math.abs(radY),
            pixelSize * brushSize
        );
    } else if (mode === lineButton) {
        clear(shadowCtx);

        drawPixelatedLine(shadowCtx, pathStart.x, pathStart.y, x, y, pixelSize);
    } else if (mode === selectButton) {
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
    return Math.floor(value / pixelSize) * pixelSize;
}

shadowCanvas.addEventListener("mousedown", handleMouseDown);

function handleMouseDown(e) {
    redoStack = [];
    updateUndo();

    let currColor;
    let currColorPicker;

    switch (e.button) {
        case 0:
            currColor = primaryColor;
            currColorPicker = primaryColorPicker;
            break;
        case 2:
            currColor = secondaryColor;
            currColorPicker = secondaryColorPicker;
            break;
    }

    drawCtx.fillStyle = currColor;
    drawCtx.strokeStyle = currColor;

    if (e.button === 2 && isRightClickEraseOn && mode == pencilButton) {
        activateMode(eraserButton);
    } else {
        if (mode === drawTextButton) {
            if (isTypingText) {
                removeTextCursor();
                drawCtx.fillText(textValue, textCoords.x, textCoords.y);
                isTypingText = false;
                textValue = "";
                shadowCtx.fillStyle = shadowColor;
            } else {
                textCoords = { x, y };
                shadowCtx.fillStyle = currColor;
                isTypingText = true;
                setTextCursor();
            }
        } else if (mode === eyedropperButton) {
            const rgb = drawCtx.getImageData(x, y, 1, 1).data;
            currColorPicker.value = rgbToHex(rgb[0], rgb[1], rgb[2]);
        } else if (mode === squareShapeButton || mode === circleShapeButton || mode === lineButton) {
            shadowCtx.strokeStyle = currColor;
            shadowCtx.fillStyle = currColor;
        } else if (mode === fillButton) {
            floodFill(drawCanvas, drawCtx, x, y, toRGBA(currColor));
        } else if (mode === sprayButton) {
            clear(shadowCtx);
            sprayInterval = setInterval(drawSpray, 20);
        }
    }

    pathStart = { x, y };
    draw(x, y, pixelSize, pixelSize);
    isMouseDown = true;
}

function drawSpray() {
    let angle, radius, offset, localX, localY;
    for (let i = 0; i < 10; i++) {
        angle = Math.random() * 360;
        radius = spraySize * pixelSize;
        offset = Math.random() * radius;
        localX = roundToPixel(Math.cos(angle) * offset);
        localY = roundToPixel(Math.sin(angle) * offset);
        drawCtx.fillRect(x + localX, y + localY, pixelSize, pixelSize);
    }
}

shadowCanvas.addEventListener("mouseup", handleMouseUp);

function handleMouseUp(e) {
    isMouseDown = false;

    if (mode === squareShapeButton) {
        clear(shadowCtx);
        let startX = pathStart.x,
            startY = pathStart.y;
        if (isCenterModeOn) {
            startX -= x - pathStart.x;
            startY -= y - pathStart.y;
        }

        if (isFillShapeOn) {
            drawCtx.fillRect(
                startX,
                startY,
                x - pathStart.x + pixelSize,
                y - pathStart.y + pixelSize
            );
        } else {
            drawCtx.strokeRect(
                startX + pixelSize / 2,
                startY + pixelSize / 2,
                x - startX,
                y - startY
            );
        }

        shadowCtx.strokeStyle = shadowColor;
        shadowCtx.fillStyle = shadowColor;
    } else if (mode === circleShapeButton) {
        clear(shadowCtx);

        let startX = pathStart.x,
            startY = pathStart.y;

        let pathX = x - pathStart.x;
        let pathY = y - pathStart.y;

        let radX, radY;

        if (isCircleRatioOn) {
            let maxRad = Math.max(Math.abs(pathX), Math.abs(pathY));

            radX = (pathX > 0) ? maxRad : -maxRad;
            radY = (pathY > 0) ? maxRad : -maxRad;
        } else {
            radX = pathX;
            radY = pathY;
        }

        if (!isCenterModeOn) {
            radX /= 2;
            radY /= 2;
            startX += radX;
            startY += radY;
        }

        drawPixelatedEllipse(
            drawCtx,
            startX,
            startY,
            Math.abs(radX),
            Math.abs(radY),
            pixelSize * brushSize
        );

        shadowCtx.strokeStyle = shadowColor;
        shadowCtx.fillStyle = shadowColor;
    } else if (mode === lineButton) {
        clear(shadowCtx);
        drawPixelatedLine(drawCtx, pathStart.x, pathStart.y, x, y, pixelSize);
        shadowCtx.strokeStyle = shadowColor;
        shadowCtx.fillStyle = shadowColor;
    } else if (mode === eyedropperButton) {
        activateMode(pencilButton);
    } else if (
        mode === selectButton &&
        (selectWidth > pixelSize || selectHeight > pixelSize)
    ) {
        selectedArea.style.display = "block";
        selectedArea.style.top = selectTop + "px";
        selectedArea.style.left = selectLeft + "px";
        selectedArea.style.width = selectWidth + "px";
        selectedArea.style.height = selectHeight + "px";
    } else if (mode === sprayButton) {
        clearInterval(sprayInterval);
    }
    if (e.button === 2 && isRightClickEraseOn && mode == eraserButton) {
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

function activateMode(modeButton) {
    prevMode = mode;
    mode = modeButton;
    currentElem.style.backgroundColor = "white";
    currentElem = mode;
    currentElem.style.backgroundColor = activeButtonColor;
    toolOptionName.innerText = modeButton.title;

    toolOptions.forEach(v => v.style.display = "none");

    switch(modeButton) {
        case pencilButton:
            brushRangeContainer.style.display = "block";
            rbEraseLabel.style.display = "block";
            break;
        case circleShapeButton:
            brushRangeContainer.style.display = "block";
            centerLabel.style.display = "block";
            ratioLabel.style.display = "block";
            break;
        case squareShapeButton:
            brushRangeContainer.style.display = "block";
            centerLabel.style.display = "block";
            fillLabel.style.display = "block";
            break;
        case sprayButton:
            sprayRangeContainer.style.display = "block";
            break;
        case drawTextButton:
            fontRangeContainer.style.display = "block";
            break;
        case lineButton:
        case eraserButton:
            brushRangeContainer.style.display = "block";
            break;
    }
}

for(const button of buttonGroup) {
    button.addEventListener("click", (e) => activateMode(e.currentTarget));
}

function setLineWidth(width) {
    drawCtx.lineWidth = width;
    shadowCtx.lineWidth = width;
}

primaryColorPicker.addEventListener("change", () => {
    primaryColor = primaryColorPicker.value;
});

secondaryColorPicker.addEventListener("change", () => {
    secondaryColor = secondaryColorPicker.value;
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
sprayRange.addEventListener("input", updateSpraySize);

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

function updateSpraySize() {
    spraySize = sprayRange.value;
    spraySizeLabel.textContent = spraySize;
}

function updateCanvasSize() {
    pixelCount = canvasRange.value;
    canvasSizeLabel.textContent = pixelCount;
}

function drawPixelatedEllipse(ctx, xc, yc, a, b, pixelSize) {
    const a2 = a * a;
    const b2 = b * b;
    const twoa2 = 2 * a2;
    const twob2 = 2 * b2;
    let p;
    let x = 0,
        y = b;
    let px = 0,
        py = twoa2 * y;

    /* Region 1 */
    p = Math.round(b2 - a2 * b + 0.25 * a2);
    while (px < py) {
        x++;
        px += twob2;
        if (p < 0) p += b2 + px;
        else {
            y--;
            py -= twoa2;
            p += b2 + px - py;
        }
        drawPixelQuadrants(ctx, xc, yc, x, y, pixelSize);
    }

    /* Region 2 */
    p = Math.round(
        b2 * (x + 0.5) * (x + 0.5) + a2 * (y - 1) * (y - 1) - a2 * b2
    );
    while (y > 0) {
        y--;
        py -= twoa2;
        if (p > 0) p += a2 - py;
        else {
            x++;
            px += twob2;
            p += a2 - py + px;
        }
        drawPixelQuadrants(ctx, xc, yc, x, y, pixelSize);
    }
}

function drawPixelQuadrants(ctx, centerX, centerY, x, y, pixelSize) {
    drawPixel(ctx, centerX + x, centerY + y, pixelSize);
    drawPixel(ctx, centerX - x, centerY + y, pixelSize);
    drawPixel(ctx, centerX + x, centerY - y, pixelSize);
    drawPixel(ctx, centerX - x, centerY - y, pixelSize);
}

function drawPixel(ctx, x, y, pixelSize) {
    ctx.fillRect(
        circlePointToPixel(x),
        circlePointToPixel(y),
        pixelSize,
        pixelSize
    );
}

function circlePointToPixel(value) {
    return Math.round(value / pixelSize) * pixelSize;
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
        let cursorX =
            textCoords.x + Math.round(shadowCtx.measureText(textValue).width);

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
    shadowCtx.fillStyle = primaryColor;
}

rbEraseCheckbox.addEventListener("change", () => {
    isRightClickEraseOn = !isRightClickEraseOn;
});

fillCheckbox.addEventListener("change", () => {
    isFillShapeOn = !isFillShapeOn;
});

centerCheckbox.addEventListener("change", () => {
    isCenterModeOn = !isCenterModeOn;
});

ratioCheckbox.addEventListener("change", () => {
    isCircleRatioOn = !isCircleRatioOn;
});