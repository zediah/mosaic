var _this = this;

/**
 * Parse the response back from the server into a more expected format
 * @param  {} xhr The XHR object of the request to get details out of
 * @param  {} resolve The resvole call for the request, will be called if it went alright
 * @param  {} reject The reject call for the request, will be called if an error occurred
 */
function parseResponse(xhr, resolve, reject) {
    if (xhr.status === 200) {
        var contentType = xhr.getResponseHeader('Content-Type').split(';').map(v => v.trim()),
            response = xhr.responseText;

        if (contentType.indexOf('application/json') != -1) {
            try {
                response = JSON.parse(response);
            } catch (e) {
                console.warn('Warning: Caught an error trying to parse JSON response', this.url, e.stack);
                reject(e);
            }
        }
        resolve(response);
    } else {
        reject(xhr.status);
    }
}

onmessage = oEvent => {
    const requests = oEvent.data;

    const promises = requests.map(request => {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.addEventListener('load', () => _this.parseResponse(xhr, resolve, reject));
            xhr.addEventListener('error', () => _this.parseResponse(xhr, resolve, reject));
            xhr.addEventListener('onabort', () => reject());
            xhr.open(request.method, request.url);

            xhr.send(request.data);
        }).then(data => {
            request.data = data;
            return request;
        }).catch(e => {
            request.data = e;
            return request;
        });
    });

    Promise.all(promises).then(results => {
        postMessage(results);
    });
};