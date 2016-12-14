

class TileGroup {
    /**
     * Allow creator of tile groups to specify it's properties on construction
     * @param  {number} x The X coordinate this tile is for
     * @param  {number} y The Y coordinate this tile is for
     * @param  {Array<iPixel>=[]} pixels An array of 'pixels' to default it to
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
        //this.pixels = pixels;
        this.count = 0;
        this.red = 0;
        this.green = 0;
        this.blue = 0;
        this.alpha = 0;
    }
    /**
     * Add a pixel to the group. Accepts single or multiple.
     * It's up to you to make sure they're the correct set/unique!
     * @param  {iPixel} ...pixel The pixel/pixels to be added to this group.
     */


    // other implementation
    add(...pixels) {
        // don't add if it's undefined...
        if (pixels) this.pixels.push(...pixels);
    }
    /**
     * Calculate the average colour of all the pixels in the current group
     * based on their RGBA values
     * @returns string An RGBA string that will be the average colour
     */
    getAverageColour() {
        // let [ redTotal, greenTotal, blueTotal, alphaTotal ] = [0, 0, 0, 0];

        // this.pixels.forEach(pixel => {
        //     redTotal += pixel.red;
        //     greenTotal += pixel.green;
        //     blueTotal += pixel.blue;
        //     alphaTotal += pixel.alpha;
        // });

        // const numberOfPixels = this.pixels.length;
        // const averageRed = Math.floor(redTotal / numberOfPixels);
        // const averageGreen = Math.floor(greenTotal / numberOfPixels);
        // const averageBlue = Math.floor(blueTotal / numberOfPixels);
        // const averageAlpha = Math.floor(alphaTotal / numberOfPixels);

        const numberOfPixels = this.count;
        const averageRed = Math.floor(this.red / numberOfPixels);
        const averageGreen = Math.floor(this.green / numberOfPixels);
        const averageBlue = Math.floor(this.blue / numberOfPixels);
        const averageAlpha = Math.floor(this.alpha / numberOfPixels);

        return `${ this.toHex(averageRed) }${ this.toHex(averageGreen) }${ this.toHex(averageBlue) }${ this.toHex(averageAlpha) }`;
    }

    /**
     * Converts the number given into a hex number that will always be at least
     * 2 characters and will pad with a '0'. This is to be used for constructing colour strings.
     * @param  {number} value The value to convert
     * @returns string The string value of the number in hex
     */
    toHex(value) {
        // convert to hex and ensure it's always 2 characters
        return ("0" + value.toString(16)).substr(-2);
    }
}

// export { TileGroup };
// export default TileGroup; 
// describes what a 'pixel's information should look like