const COLOR_PICKER = document.getElementById("cell-color");
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
    GRID = [];

    const pixelsRowsWrapper = document.getElementById("wrapper");
    const mainDiv = document.getElementsByTagName("main")[0];
    const backgroundColorPicker = document.getElementById("background-color");

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
            const pixel = new Pixel(document.createElement("div"), pixelSize, backgroundColorPicker.value);
            GRID[row][column] = pixel;
            currentArray.appendChild(pixel.dom);
        }

        pixelsRowsWrapper.appendChild(currentArray);
    }
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


function processInputFile(text) {
    const textArray = text.split('\n');
    const newArray = new Array(textArray.length - 1);

    textArray.forEach((row, index) => {
        if (index != newArray.length) {
            const result = row.trim().split(" ");
            newArray[index] = result;
        }
    });

    const mainDiv = document.getElementsByTagName("main")[0];
    const pixelsRowsWrapper = document.getElementById("wrapper");

    GRID = [];
    const height = newArray.length;
    const width = newArray[0].length;

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
            const pixel = new Pixel(document.createElement("div"), pixelSize, sandwichIntToHex(newArray[row][column]));
            GRID[row][column] = pixel;
            currentArray.appendChild(pixel.dom);
        }

        pixelsRowsWrapper.appendChild(currentArray);
    }
}

function handleImportationButtonClick() {
    // Check if file upload APIs are supported
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        function handleFileSelect(evt) {
            var file = evt.target.files[0];
            file.text().then((value) => processInputFile(value));
        }

        // Create an invisible file upload button
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.style.display = "none";

        document.body.appendChild(fileInput);

        // Add an event listener and trigger it
        fileInput.addEventListener('change', handleFileSelect, false);
        fileInput.click();
    } else {
        // Alert the user
        alert("Votre navigateur ne suporte pas les APIs nécessaires");
    }
}

/**
 * Main function
 */
function main() {
    const generateButton = document.getElementById("generate-button");
    const importButton = document.getElementById("import-button");
    const exportButton = document.getElementById("export-button");

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
    importButton.addEventListener("click", () => handleImportationButtonClick());
    exportButton.addEventListener("click", () => handleExportButtonClick(height, width));
}

main();