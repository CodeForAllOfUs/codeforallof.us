function ajax(obj) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        var headers, header, data;

        if (typeof obj === 'string') {
            obj = {url: obj};
        }

        obj.type = obj.type || 'GET';
        headers = obj.headers || {};

        xhr.open(obj.type, obj.url, true);

        for (header in headers) {
            if (headers.hasOwnProperty(header)) {
                xhr.setRequestHeader(header, headers[header]);
            }
        }

        xhr.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status >= 200 && this.status < 400) {
                    resolve(JSON.parse(this.responseText));
                } else {
                    reject(this);
                }
            }
        };

        if (obj.type === 'POST') {
            xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
            data = JSON.stringify(obj.data);
            xhr.send(data);
        } else {
            xhr.send();
        }
    });
}

export default ajax;
