
/**
 * This a base class for talking to the server
 */
class Service {
    /**
     * Action the request given based on the parameters
     * @param  {string} method The type of request, e.g. get, post, etc
     * @param  {string} url The URL to send the request to
     * @param  {object} data The data that will be included with the request
     */
    _doRequest(method : string, url: string, data : object) : Promise<any> {
          return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.addEventListener('load', ()=> this._parseResponse(xhr, resolve, reject));
            xhr.addEventListener('error', ()=> this._parseResponse(xhr, resolve, reject));
            xhr.addEventListener('onabort', () => reject());
            xhr.open(method, url);
	           
            xhr.send(data);
        });
    }
    /**
     * Parse the response back from the server into a more expected format
     * @param  {} xhr The XHR object of the request to get details out of
     * @param  {} resolve The resvole call for the request, will be called if it went alright
     * @param  {} reject The reject call for the request, will be called if an error occurred
     */
    _parseResponse(xhr, resolve, reject) {
        if ( xhr.status === 200 ) {
            var contentType = xhr.getResponseHeader('Content-Type').split(';').map((v) => v.trim()),
                response = xhr.responseText;

            if ( contentType.indexOf('application/json') != -1) {
                try {
                    response = JSON.parse(response);
                } catch(e) {
                    console.warn('Warning: Caught an error trying to parse JSON response', this.url, e.stack);
                    reject(e);
                }
            }
            resolve(response);
        } else {
            reject(xhr.status);
        }
    }
    /**
     * Post something to the server
     * @param  {string} url The URL to post to
     * @param  {Object} params A JSON array for things to post
     */
    post(url : string , params : Object) : Promise<any> {
        return this._doRequest("post", url, params);
    }
    /**
     * Send a get request to the URL given
     * @param  {string} url The URL To send the get to
     * @returns Promise A promise for when the request is done
     */
    get(url : string) : Promise<any> {
        return this._doRequest("get", url);
    }
}

// export { Service };
// export default Service;