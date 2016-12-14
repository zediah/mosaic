// import Service from './base/service';

class MosaicService extends Service {
    // configurable set up on whether caching should be turned on or not
    // for demonstration purposes I imagine, or if caching was cheating...
    isCaching: boolean;
    // cache of elements we've seen
    elementCache;
    // mapping of currently requested colour elements
    // this way we can piggy back onto existing requests 
    pendingRequests;

    constructor() {
        super();
        this.isCaching = true;
        this.elementCache = {};
        this.pendingRequests = {};
    }
    /**
     * Get the tile from the server that corresponds to the 
     * colour given
     * @param  {string} colour The colour the SVG tile should be
     * @returns Promise The SVG tile of the colour specified
     */
    getTile(colour: string) : Promise<Node> {
        if (!this.isCaching) {
            return this._getTileFromServer(colour);
        } 

        // we must be caching, so use em
        if (this.elementCache[colour]) {
            return Promise.resolve(this.elementCache[colour].cloneNode(true));
        } else if (this.pendingRequests[colour]) {
            // Try piggy back onto existing requests for the same colour if it exists
            return this.pendingRequests[colour].then(svgElement => {
                return svgElement.cloneNode(true)
            });
        } else {
            // we have no record of an SVG for this colour, have to load it 
            // from the server
            const loadPromise = this._getTileFromServer(colour).then(element => {
                this.elementCache[colour] = element;
                // make sure we return a cloned one, that way we can re-use the version in the cache without
                // fear of it being removed/used/modified in some way
                return element.cloneNode(true);
            });

            // Set up our request to the server in the pending area, so others can piggy back
            this.pendingRequests[colour] = loadPromise;
            return loadPromise;
        }
    }
    /**
     * Retrieve the SVG tile element from the server for the colour given
     * @param  {string} colour The colour the SVG element should be
     */
    _getTileFromServer(colour: string) : Promise<Node> {
         return this.get(`/color/${colour}`).then(svgString => {
            var parser = new DOMParser();
            return parser.parseFromString(svgString, "image/svg+xml").documentElement;
        });
    }
}

const MosaicServiceInstance = new MosaicService();
// const instance = new MosaicService();

// export { MosaicService };
// export default instance;