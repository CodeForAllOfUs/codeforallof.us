// from jQuery source
function buildParams(prefix, obj, add) {
    var rbracket = /\[\]$/;
	var name;

	if (Array.isArray(obj)) {
		// Serialize array item.
        obj.forEach(function(v, i) {
            if (rbracket.test(prefix)) {
                // Treat each array item as a scalar.
                add(prefix, v);
            } else {
                // Item is non-scalar (array or object), encode its numeric index.
                buildParams(prefix + '[' + (typeof v === 'object' ? i : '') + ']', v, add);
            }
        });
	} else if (typeof obj === 'object') {
		// Serialize object item.
		for (name in obj) {
            if (obj.hasOwnProperty(name)) {
                buildParams(prefix + '[' + name + ']', obj[name], add);
            }
		}
	} else {
		// Serialize scalar item.
		add(prefix, obj);
	}
}

// Serialize an array of form elements or a set of
// key/values into a query string
// from jQuery source
function serializeParams(a) {
	var prefix;
    var r20 = /%20/g;
	var s = [];
	var add = function(key, value) {
        // If value is a function, invoke it and return its value
        value = typeof value === 'function' ? value() : (!value ? '' : value);
        s[s.length] = encodeURIComponent(key) + '=' + encodeURIComponent(value);
    };

	// If an array was passed in, assume that it is an array of form elements.
	if (Array.isArray(a)) {
		// Serialize the form elements
        a.forEach(function(obj) {
            add(obj.name, obj.value);
        });
	} else {
		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for (prefix in a) {
            if (a.hasOwnProperty(prefix)) {
                buildParams(prefix, a[prefix], add);
            }
		}
	}

	// Return the resulting serialization
	return s.join('&').replace(r20, '+');
}

function ajax(obj) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        var headers, header, data;

        if (typeof obj === 'string') {
            obj = {url: obj};
        }

        obj.type = obj.type || 'GET';
        headers = obj.headers || {};

        if (obj.type === 'GET' && obj.data) {
            obj.url = obj.url + '?' + serializeParams(obj.data);
        }

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
