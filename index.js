const COLOR_PICKER = document.getElementById("cell-color");
const ERROR_FIELD = document.getElementById("error-message");

let GRID = [];
let IS_MOUSE_DOWN = false;

// Thank you Erick Petrucelli (https://stackoverflow.com/a/3627747)
const rgb2hex = (rgb) => {
    const hexArray = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/).slice(1).map(n => parseInt(n, 10).toString(16).padStart(2, '0'));

    const tmp = hexArray[0];
    hexArray[0] = hexArray[2];
    hexArray[2] = tmp;

    return `0x${hexArray.join('')}`
}


/**
 * Pixel class
 */
class Pixel {
    constructor(dom, pixelSize, backgroundColor) {
        this.dom = dom;
        this.dom.style.backgroundColor = backgroundColor;
        this.dom.style.height = `${pixelSize}px`;
        this.dom.style.width = `${pixelSize}px`;
        this.dom.style.border = "grey 1px solid";

        // Drag fix for chromium
        this.dom.draggable = false;

        // Drag fix for Firefox
        this.dom.addEventListener("dragstart", (event) => {
            event.preventDefault();
        });

        this.dom.addEventListener("click", () => this.changeColor());
        this.dom.addEventListener("mouseover", () => {
            if (IS_MOUSE_DOWN) this.changeColor();
        });
    }

    changeColor() {
        this.dom.style.backgroundColor = COLOR_PICKER.value;
    }
}


function handleGenerateButtonClick(height, width) {
    const backgroundColorPicker = document.getElementById("background-color");

    generateAndFillGrid(height, width, function (row, column) {
        return backgroundColorPicker.value;
    });
}


function generateFileAndSave(buffer) {
    const blob = new Blob([buffer], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "sandwichGrid.txt";

    document.body.appendChild(downloadLink);
    downloadLink.click();

    setTimeout(function () {
        document.body.removeChild(downloadLink);
        window.URL.revokeObjectURL(url);
    }, 0);
}


function handleExportButtonClick(height, width) {
    let buffer = "";

    for (let row = 0; row < height; row++) {
        for (let column = 0; column < width; column++) {
            buffer += parseInt(Number(rgb2hex(GRID[row][column].dom.style.backgroundColor)), 10) + " ";
        }
        buffer += "\n";
    }

    generateFileAndSave(buffer);
}


/**
 * Converts a integer used by Sandwich to a hex string
 * 
 * @param {str} text A string containing a integer representing a color
 * @returns A hex string preceded by a #
 */
function sandwichIntToHex(text) {
    const hexString = parseInt(text).toString(16).padStart(6, 0);

    return "#" + [hexString.substr(4, 6)
        , hexString.substr(2, 2),
        , hexString.substr(0, 2)].join('');
}


function preprocessInput(text) {
    function deleteRow(arr, row) {
        arr = arr.slice(0); // make copy
        arr.splice(row - 1, 1);
        return arr;
    }

    const textArray = text.split('\n');
    const newArray = new Array(textArray.length - 1);

    let currentSize = 0;

    textArray.forEach((row, index) => {
        if (row.length > currentSize) {
            currentSize = row.length;
        }

        const result = row.trim().split(" ");
        newArray[index] = result;
    });

    newArray.forEach((row, index) => {
        if (row.length != currentSize) {
            deleteRow(newArray, index);
        }
    });

    return newArray;
}


function generateAndFillGrid(height, width, cellFiller) {
    GRID = [];

    const pixelsRowsWrapper = document.getElementById("wrapper");
    const mainDiv = document.getElementsByTagName("main")[0];

    // Calculate pixel size
    const max = (height > width) ? height : width;
    const pixelSize = mainDiv.clientHeight / max;

    // Empty the wrapper
    pixelsRowsWrapper.innerHTML = "";

    for (let row = 0; row < height; row++) {
        GRID[row] = new Array(width).fill(undefined);

        const currentArray = document.createElement("div");
        currentArray.className = "row";

        for (let column = 0; column < width; column++) {
            const pixel = new Pixel(document.createElement("div"), pixelSize, cellFiller(row, column));
            GRID[row][column] = pixel;
            currentArray.appendChild(pixel.dom);
        }

        pixelsRowsWrapper.appendChild(currentArray);
    }
}


function processInputFile(text) {
    const dataArray = preprocessInput(text);

    const height = newArray.length;
    const width = newArray[0].length;

    generateAndFillGrid(height, width, function (row, column) {
        return dataArray[row][column];
    });
}


async function handleImportationButtonClick() {
    // Check if file upload APIs are supported
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        [fileHandle] = await window.showOpenFilePicker();

        if (fileHandle.kind === 'file') {
          console.log({fileHandle});
        }
    } else {
        // Alert the user
        alert("Votre navigateur ne suporte pas les APIs nécessaires");
    }
}


/**
 * Main function
 */
function main() {
    // Find main buttons
    const generateButton = document.getElementById("generate-button");
    const importButton = document.getElementById("import-button");
    const exportButton = document.getElementById("export-button");

    // Find input boxes
    const widthInput = document.getElementById("width-input-box");
    const heightInput = document.getElementById("height-input-box");

    let height = 0;
    let width = 0;

    // Handle events used to color the cells
    document.addEventListener("mousedown", () => IS_MOUSE_DOWN = true);
    document.addEventListener("mouseup", () => IS_MOUSE_DOWN = false);

    // Handle grid generation
    generateButton.addEventListener("click", () => {
        height = parseInt(heightInput.value);
        width = parseInt(widthInput.value);
        handleGenerateButtonClick(height, width);
    });

    // Handle file importation and grid exportation
    importButton.addEventListener("click", async () => await handleImportationButtonClick());
    exportButton.addEventListener("click", () => handleExportButtonClick(height, width));
}

main();