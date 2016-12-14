

/** 
 * An application that is the primary entry point to the mosaic html
 * It's this classes job to set up the DOM such that it will handle 
 * being able to upload an image file, process this file and turn it into a mosaic
 * This is tightly linked to the HTML and assumes certain elements exists
 */
class MosaicApp {
    /**
     * Given an file that is an image, will turn the image into a canvas
     * @param  {File} imageFile The file that will be made into a canvas
     * @returns Promise<HTMLCanvasElement> Returns a promise that will resolve when the canvas was succesfully created
     */
    buildCanvas(imageSource) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement("canvas");
            const canvasContext = canvas.getContext('2d');
            const imageElement = new Image();
            imageElement.onload = () => {
                canvas.width = imageElement.width;
                canvas.height = imageElement.height;
                canvasContext.drawImage(imageElement, 0, 0);
                resolve(canvas);
            };
            imageElement.onerror = e => reject(e);
            imageElement.src = imageSource;
        });
    }

    /**
     * Load the image for the file given
     * @param  {File} imageFile The image to load
     * @returns Promise returns a promise with the image source data passed
     */
    loadImage(imageFile) {
        return new Promise((resolve, reject) => {
            if (!imageFile) reject("No image provided");

            // make sure it's an image..
            if (!imageFile.type) reject("Image provided was not an image type we know how to handle");

            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(e);
            reader.readAsDataURL(imageFile);
        });
    }

    /**
     * Given a canvas, will group all the pixels in the canvas into tile groups
     * based on the tile width/height settings in the constants
     * @param  {HTMLCanvasElement} canvas The canvas to process
     */
    buildTileGroups(canvas) {
        // now we process the canvas
        const canvasContext = canvas.getContext('2d');
        const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);

        // Is a map of tile groups and all their pixels
        // I would use a 'map' but in JS it's not actually any faster at 
        // looking at keys than iterating through the entire list. So an object is 
        // therefore the most effecient type of map for this purpose.
        const tileGroups = {};

        // Lets keep a count of the current pixel we're on
        // we'll use this to deteremine what tile we're up to
        let [xPixelCount, yPixelCount] = [0, 0];

        // the data is one giant array where each 4 values in the array represent a single pixels 
        // RGBA values. So we have to create our 'pixel' objects and then place them into the group 
        imageData.data.forEach((colourData, index) => {
            const xTile = Math.floor(xPixelCount / TILE_WIDTH);
            const yTile = Math.floor(yPixelCount / TILE_HEIGHT);

            // try get the group, create it if we don't have one already for this coord
            let tileGroup = tileGroups[yTile] ? tileGroups[yTile][xTile] : undefined;
            if (!tileGroup) {
                tileGroup = new TileGroup(xTile, yTile);
                if (!tileGroups[yTile]) {
                    tileGroups[yTile] = {};
                }
                tileGroups[yTile][xTile] = tileGroup;
            }

            const colourIndex = index % 4;
            switch (colourIndex) {
                case 0:
                    tileGroup.red += colourData;
                    break;
                case 1:
                    tileGroup.green += colourData;
                    break;
                case 2:
                    tileGroup.blue += colourData;
                    break;
                case 3:
                    tileGroup.alpha += colourData;
                    break;
            }

            if (colourIndex == 3) {
                tileGroup.count++;
                xPixelCount++;
                // see if we reached the end
                if (xPixelCount >= imageData.width) {
                    // we've moved to the next row
                    yPixelCount++;
                    xPixelCount = 0;
                }
            }
        });

        return tileGroups;
    }

    /**
     * Render a single row of tiles to the DOM
     * @param  {Array<any>} tiles The tiles to render
     */
    renderTileRow(tiles) {
        window.requestAnimationFrame(() => {
            const orderedData = tiles.sort((g1, g2) => g1.group.x - g2.group.x);
            const mosaicContainer = document.querySelector("#mosaic-container");
            // now we create the actual element that'll go on the page
            const fragment = document.createDocumentFragment();
            const divElement = document.createElement("div");
            divElement.setAttribute("class", "mosaic-row");
            //mosaicContainer.appendChild(divElement);
            orderedData.forEach(tileTuple => {
                divElement.appendChild(tileTuple.tile);
            });
            fragment.appendChild(divElement);
            mosaicContainer.appendChild(fragment);
        });
    }

    /**
     * Process the full set of tile groups by retreiving the SVG
     * element for each and then render them one row at a time
     * to the DOM
     * @param  {} tileGroups
     */
    renderTileGroups(tileGroups) {
        return new Promise((resolve, reject) => {
            let rollingY = 0;
            const rowManager = {};
            const promises = [];

            // ordering relies heavily on tileGroups being sorted correctly
            // as it assumes it always goes rows -> columns...probably something to improve
            Object.values(tileGroups).forEach(rowGroup => {
                const loadPromises = Object.values(rowGroup).map(tileGroup => {
                    const colour = tileGroup.getAverageColour();
                    return MosaicServiceInstance.getTile(colour).then(svgElement => {
                        // make sure we keep the two connected as order is defined by
                        // by the row coordinate on the tile group 
                        return { group: tileGroup, tile: svgElement };
                    });
                });

                const allPromise = Promise.all(loadPromises).then(tileRow => {
                    // attempting to make sure that the rows also render from top to bottom
                    // this is done by keeping track of the last thing rendered
                    // and if one of our loads for a later row returns earlier than the current/next to
                    // to be rendered row - it provides a function to call to render it
                    // and row we're actually up to will always see if this function exists
                    // and call it if it does (which in turn, will attempt to d the same thing)
                    // thus, it all stays in order from top to bottom.
                    const thisY = tileRow[0].group.y - 1;
                    const renderFunc = () => {
                        this.renderTileRow(tileRow);
                        rollingY++;
                        // see if the number ahead of us is ready
                        const nextRender = rowManager[rollingY];
                        if (nextRender) nextRender();
                    };
                    if (thisY === rollingY) {
                        renderFunc();
                    } else {
                        rowManager[thisY] = renderFunc;
                    }
                });

                promises.push(allPromise);
            });

            Promise.all(promises).then(() => {
                resolve();
            });
        });
    }

    onFileChange(files) {
        if (files.length > 1) {
            // show an error message, only accepting one file at the moment 
            return false;
        }

        // clear the mosaic container so we can re-use it
        const container = document.querySelector("#mosaic-container");
        const loader = document.querySelector("#loader");
        if (container.children.length > 0) {
            // I'm told this is the fastest way to clear a node
            const containerClone = container.cloneNode(false);
            container.parentNode.replaceChild(containerClone, container);
        }

        loader.innerHTML = "Uploading your image...";
        loader.classList.remove('hide');

        const file = files.item(0);
        this.loadImage(file).then(imageSource => {
            loader.innerHTML = "Building a canvas from your image...";
            return this.buildCanvas(imageSource);
        }).then(canvas => {
            loader.innerHTML = "Determining colours of tiles...";
            return this.buildTileGroups(canvas);
        }).then(tileGroups => {
            loader.innerHTML = "Fetching tiles a row at a time...";
            return this.renderTileGroups(tileGroups);
        }).then(() => {
            loader.classList.add('hide');
        }).catch(error => {
            loader.innerHTML = "Something went wrong! See console.";
            console.error(error);
        });
    }

    /** 
     * Start the app
     * This will do the bindings and do whatever set up is required
     */
    start() {
        const fileInput = document.querySelector("#input-image");
        fileInput.addEventListener("change", e => {
            this.onFileChange(e.target.files);
        });
    }
}

// const instance = new MosaicApp();

// export { MosaicApp };
// export default instance;
// import MosaicService from "./mosaicService";
// import MosaicConstants from "./mosaicConstants";
// import TileGroup from "./tileGroup";