function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : r & 0x3 | 0x8;
        return v.toString(16);
    });
}

/**
 * This a base class for talking to the server
 */
class Service {
    constructor() {
        this.requestGroups = { length: 0 };
        this.maxRequests = 100;
    }

    runWorker(requestsToRun) {
        // clear things out
        window.clearTimeout(this.requestTimer);
        this.requestGroups = { length: 0 };
        this.requestTimer = undefined;

        // run the worker
        const worker = new Worker("js/base/worker.js");
        worker.onmessage = e => {
            const requests = e.data;
            requests.forEach(request => {
                const realRequest = requestsToRun[request.id];
                if (request.data instanceof Error) {
                    realRequest.reject(request.data);
                } else {
                    realRequest.resolve(request.data);
                }
            });
        };
        const workerRequests = Object.values(requestsToRun).filter(val => isNaN(val)).map(request => {
            return { method: request.method, url: request.url, id: request.id, data: request.data };
        });
        worker.postMessage(workerRequests);
    }
    /**
     * Action the request given based on the parameters
     * @param  {string} method The type of request, e.g. get, post, etc
     * @param  {string} url The URL to send the request to
     * @param  {object} data The data that will be included with the request
     */
    _doRequest(method, url, data) {
        return new Promise((resolve, reject) => {
            const id = guid();
            this.requestGroups[id] = { method: method, url: url, data: data, id: id,
                resolve: d => {
                    resolve(d);
                }, reject: e => {
                    reject(e);
                }
            };
            this.requestGroups.length++;

            if (this.requestTimer) {
                if (this.requestGroups.length >= this.maxRequests) {
                    // run it manually, clear the timeout ,start another one
                    this.runWorker(this.requestGroups);
                }
            }

            if (!this.requestTimer) {
                // first one through starts the timer and we try collect all within a period
                this.requestTimer = window.setTimeout(() => {
                    this.runWorker(this.requestGroups);
                }, 1);
            }
        });
    }

    /**
     * Post something to the server
     * @param  {string} url The URL to post to
     * @param  {Object} params A JSON array for things to post
     */
    post(url, params) {
        return this._doRequest("post", url, params);
    }
    /**
     * Send a get request to the URL given
     * @param  {string} url The URL To send the get to
     * @returns Promise A promise for when the request is done
     */
    get(url) {
        return this._doRequest("get", url);
    }
}

// export { Service };
// export default Service;