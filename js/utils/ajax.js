function ajax(obj) {
    return new Promise(function (resolve, reject) {
        var data;
        var xhr = new XMLHttpRequest();
        xhr.open(obj.type, obj.url, true);

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
