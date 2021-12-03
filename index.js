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

/**
 * Generates a grid from the selected color
 * @param {int} height The grid's height
 * @param {int} width The grid's width
 */
function handleGenerateButtonClick(height, width) {
    const backgroundColorPicker = document.getElementById("background-color");

    generateAndFillGrid(height, width, function (row, column) {
        return backgroundColorPicker.value;
    });
}


/**
 * Opens a prompt allowing the user to download the file
 * @param {str} buffer The generated file content
 */
function generateFileAndSave(buffer) {
    const blob = new Blob([buffer], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "sandwichGrid.txt";

    document.body.appendChild(downloadLink);
    downloadLink.click();

    // Remove the element
    setTimeout(function () {
        document.body.removeChild(downloadLink);
        window.URL.revokeObjectURL(url);
    }, 0);
}

/**
 * Exports the current grid to a string
 * @param {int} height The grid's height
 * @param {int} width The grid's width
 */
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

/**
 * Parses an imported file's content
 * @param {str} text An imported file's content
 */
function preprocessInput(text) {
    function deleteRow(arr, row) {
        arr = arr.slice(0); // Make copy
        arr.splice(row - 1, 1);
        return arr;
    }

    const textArray = text.split('\n');
    let newArray = new Array(textArray.length - 1);

    let currentSize = 0;

    textArray.forEach((row, index) => {
        const result = row.trim().split(" ");
        newArray[index] = result;
    });

    // Find normal line size
    newArray.forEach((row) => {
        if (row.length > currentSize) {
            currentSize = row.length;
        }
    });

    let iterator = 0;
    let running = true;

    // Remove parasites
    while (iterator < newArray.length && running) {
        let row = newArray[iterator];
        if (row.length != currentSize) {
            newArray = deleteRow(newArray, iterator + 1);
            running = false;
        }
        iterator++;
    }

    return newArray;
}

/**
 * Generates and displays a grid
 * @param {int} height The height of the grid
 * @param {int} width The width of the grid
 * @param {function(int row, int column)} cellFiller 
 */
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


/**
 * Generates a grid from an imported file
 * @param {str} text The content of a file
 */
function processInputFile(text) {
    const dataArray = preprocessInput(text);

    const height = dataArray.length;
    const width = dataArray[0].length;

    generateAndFillGrid(height, width, function (row, column) {
        return sandwichIntToHex(dataArray[row][column]);
    });
}

/**
 * Open a file picker to import and read a file
 */
function handleImportationButtonClick() {
    // Check if file upload APIs are supported
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        function handleFileSelect(evt) {
            const file = evt.target.files[0];
            const reader = new FileReader();

            // Read the imported file
            reader.onload = function (e) {
                if (e.target.result) {
                    processInputFile(e.target.result);
                } else {
                    ERROR_FIELD.innerHTML = "Impossible de lire le fichier. Essayez d'utiliser un autre navigateur";
                    setTimeout(function () {
                        ERROR_FIELD.innerHTML = "";
                    }, 5000);
                }
            }

            // Do not execute the function if the fil is empty
            if (file) {
                reader.readAsText(file);
            }
        }

        // Create an invisible file upload button
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.style.display = "none";

        document.body.appendChild(fileInput);

        // Add an event listener and trigger it
        fileInput.addEventListener('change', handleFileSelect, false);
        fileInput.click();

        // setTimeout(function () {
        //     document.body.removeChild(fileInput);
        // }, 0);
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
    importButton.addEventListener("click", () => handleImportationButtonClick());
    exportButton.addEventListener("click", () => {
        height = parseInt(heightInput.value);
        width = parseInt(widthInput.value);
        handleExportButtonClick(height, width);
    });
}

main();