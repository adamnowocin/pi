(function (global) {

    var handlers = {};
    var events = {};
    var routes = {};
    var bindings = {};
    var cache = {};
    var addedFiles = {};
    var addedComponent = {};

    var core = function (el, context) {

        var element = {};

        element.selectOne = function () {
            if (typeof el === 'string') {
                return getContext().querySelector(el);
            } else {
                return el;
            }
        };

        element.select = function () {
            if (typeof el === 'string') {
                return getContext().querySelectorAll(el);
            } else {
                return [el];
            }
        };

        element.iterate = function (callback) {
            core.iterate(element.select(el), function (obj) {
                if (typeof callback === 'function') {
                    callback(obj);
                }
            });
        };

        element.show = function () {
            element.iterate(function (obj) {
                obj.style.display = 'block';
            });
        };

        element.hide = function () {
            element.iterate(function (obj) {
                obj.style.display = 'none';
            });
        };

        element.addClass = function (name) {
            element.iterate(function (obj) {
                obj.classList.add(name);
            });
        };

        element.removeClass = function (name) {
            element.iterate(function (obj) {
                obj.classList.remove(name);
            });
        };

        element.css = function (key, value) {
            element.iterate(function (obj) {
                obj.style[key] = value;
            });
        };

        element.html = function (value) {
            if (value !== undefined) {
                element.iterate(function (obj) {
                    obj.innerHTML = value;
                });
            } else {
                var obj = element.selectOne(el);
                return obj ? obj.innerHTML : null;
            }
        };

        element.append = function (value) {
            element.iterate(function (obj) {
                obj.innerHTML = obj.innerHTML + value;
            });
        };

        element.prepend = function (value) {
            element.iterate(function (obj) {
                obj.innerHTML = value + obj.innerHTML;
            });
        };

        element.remove = function () {
            element.iterate(function (obj) {
                obj.remove();
            });
        };

        element.val = function (value) {
            if (value !== undefined) {
                element.iterate(function (obj) {
                    obj.value = value;
                });
            } else {
                var obj = element.selectOne(el);
                return obj ? obj.value : null;
            }
        };

        element.attr = function (key, value) {
            if (value !== undefined) {
                element.iterate(function (obj) {
                    obj.setAttribute(key, value);
                });
            } else {
                var obj = element.selectOne(el);
                return obj ? obj.getAttribute(key) : null;
            }
        };

        element.data = function (key, value) {
            if (value !== undefined) {
                element.iterate(function (obj) {
                    obj.dataset[key] = value;
                });
            } else if (key !== undefined) {
                var obj = element.selectOne(el);
                return obj ? obj.dataset[key] : null;
            } else {
                var obj = element.selectOne(el);
                return obj ? obj.dataset : null;
            }
        };

        element.removeAttr = function (key) {
            element.iterate(function (obj) {
                obj.removeAttribute(key);
            });
        };

        element.on = function (event, callback) {
            element.iterate(function (obj) {
                obj.addEventListener(event, callback);
            });
        };

        element.off = function (event, callback) {
            element.iterate(function (obj) {
                obj.removeEventListener(event, callback);
            });
        };

        element.click = function (callback) {
            element.on('click', callback);
        };

        element.template = function (data) {
            var parsedTemplate = element.selectOne(el).innerHTML;
            core.each(data, function (key, value) {
                parsedTemplate = parsedTemplate.replace('{{' + key + '}}', value);
            });
            return parsedTemplate;
        };

        element.parent = function () {
            return element.selectOne(el).parentElement;
        }

        element.parents = function (match) {
            var obj = element.selectOne(el);
            while ((obj = obj.parentElement)) {
                if (obj.matches ? obj.matches(match) : obj.msMatchesSelector(match)) {
                    return obj;
                }
            }
            return null;
        }

        element.upload = function (options) {
            if (!options) {
                return;
            }
            element.on('change', function () {
                if (!this.files || !this.files[0]) {
                    return;
                }
                if (typeof options.start === 'function') {
                    options.start(this.files[0]);
                }
                var xhr = new XMLHttpRequest();
                if (xhr.upload) {
                    xhr.upload.onprogress = function (e) {
                        var done = e.position || e.loaded;
                        var total = e.totalSize || e.total;
                        if (typeof options.progress === 'function') {
                            options.progress(Math.floor(done / total * 1000) / 10);
                        }
                    };
                }
                xhr.open('post', options.url, true);
                handleXhrResponse(xhr, options.success, options.error);
                setHeaders(xhr, options.headers);
                var formData = new FormData();
                formData.append(options.field ? options.field : 'file', this.files[0]);
                xhr.send(formData);
            }, false);
        };

        function getContext() {
            if (context) {
                return typeof context === 'string' ? document.querySelector(context) : context;
            } else {
                return document;
            }
        }

        return element;
    };

    core.iterate = function (data, callback) {
        if (!data || !data.length) {
            return;
        }
        for (var i = 0; i < data.length; i++) {
            if (typeof callback === 'function') {
                callback(data[i], i);
            }
        }
    };

    core.each = function (data, callback) {
        if (!data) {
            return;
        }
        for (var key in data) {
            if (data.hasOwnProperty(key) && typeof callback === 'function') {
                callback(key, data[key]);
            }
        }
    };

    core.trim = function (str) {
        return str && (typeof str === 'string') ? str.replace(/^\s+/, '').replace(/\s+$/, '') : '';
    };

    core.token = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (Math.random() * 16) | 0;
            var v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    };

    core.http = {};

    core.http.uri = function (path, params) {
        var uri = '';
        core.iterate(path, function (value) {
            uri += '/' + value;
        });
        var parts = '';
        core.each(params, function (key, value) {
            parts += (parts === '' ? '?' : '&') + key + '=' + escape(value);
        });
        return uri + parts;
    };

    core.http.get = function (options) {
        request('GET', options);
    };
    core.http.post = function (options) {
        request('POST', options);
    };
    core.http.put = function (options) {
        request('PUT', options);
    };
    core.http.delete = function (options) {
        request('DELETE', options);
    };

    core.ready = function (callback) {
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof callback === 'function') {
                callback();
            }
            handleHashChange();
        });
    };

    core.navigate = function (params) {
        document.location.hash = '#' + params.join('/');
    }

    core.handle = function (name, callback) {
        if (name && typeof callback === 'function') {
            handlers[name] = callback;
        }
    }

    core.runHandler = function (name, element, context) {
        if (handlers[name]) {
            handlers[name](element, context);
        }
    }

    core.subscribe = function (name, callback) {
        if (name && typeof callback === 'function') {
            if (!events[name]) {
                events[name] = [];
            }
            events[name].push(callback);
            return events[name].length - 1;
        }
        return -1;
    }

    core.unsubscribe = function (name, index) {
        if (events[name] && events[name][index]) {
            events[name][index] = null;
        }
    }

    core.emit = function (name, params) {
        if (events[name]) {
            core.iterate(events[name], function (cb) {
                if (typeof cb === 'function') {
                    cb(params);
                }
            });
        }
    }

    core.addRoute = function (name, callback) {
        if (name && typeof callback === 'function') {
            routes['#' + name] = callback;
        }
    }

    core.load = function (root, path, error) {
        var template = path + '/component.html';
        if (cache[template]) {
            initComponentTemplate(root, path, cache[template]);
            emitComponentInit(path, root);
            return;
        }
        getComponent(root, path, error);
    }

    function getComponentContext(root) {
        return core('[data-pi-component="' + root + '"]').selectOne();
    }

    function emitComponentInit(path, root) {
        core.runHandler('init:' + path, root, getComponentContext(root));
    }

    function getComponent(root, path, error) {
        if (addedComponent[path] === 1) {
            var eventName = 'html.loaded:' + path;
            var index = core.subscribe(eventName, function () {
                initComponentTemplate(root, path, cache[path + '/component.html']);
                initComponentData(root, path);
                core.unsubscribe(eventName, index);
            });
            return;
        }
        if (addedComponent[path] === 2) {
            initComponentTemplate(root, path, cache[path + '/component.html']);
            initComponentData(root, path);
            return;
        }
        addedComponent[path] = 1;
        core.http.get({
            url: path + '/component.html',
            noCredentials: true,
            success: function (res) {
                initComponentTemplate(root, path, res);
                core.emit('html.loaded:' + path);
                addedComponent[path] = 2;
                initComponentData(root, path);
            },
            error: function (code, response) {
                if (typeof error === 'function') {
                    error(code, response);
                }
            }
        });
    }

    function initComponentTemplate(root, path, res) {
        core(getComponentContext(root)).html(res);
        cache[path + '/component.html'] = res;
    }

    function initComponentData(root, path) {
        if (addedFiles[path] === 1) {
            var eventName = 'script.loaded:' + path;
            var index = core.subscribe(eventName, function () {
                emitComponentInit(path, root);
                core.unsubscribe(eventName, index);
            });
            return;
        }
        if (addedFiles[path] === 2) {
            emitComponentInit(path, root);
            return;
        }
        addedFiles[path] = 1;
        var script = document.createElement('script');
        script.onload = function () {
            addedFiles[path] = 2;
            core.emit('script.loaded:' + path);
            emitComponentInit(path, root);
        };
        script.src = path + '/component.js';
        document.body.appendChild(script);
        var style = document.createElement('link');
        style.rel = 'stylesheet';
        style.type = 'text/css';
        style.href = path + '/component.css';
        document.body.appendChild(style);
    }

    function request(method, options) {
        if (!options || !options.url || typeof options.url !== 'string') {
            return;
        }
        var url = options.url;
        var data = null;
        if (options.data) {
            if (options.type === 'plain') {
                data = options.data;
            } else {
                data = JSON.stringify(options.data);
            }
        }

        var xhr = new XMLHttpRequest();
        xhr.open(method, options.url, true);
        if (!options.noCredentials) {
            xhr.withCredentials = true;
        }
        setHeaders(xhr, options.headers);
        handleXhrResponse(xhr, options.success, options.error);
        xhr.send(data);
    }

    function handleXhrResponse(xhr, success, error) {
        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    var responseData;
                    try {
                        responseData = JSON.parse(xhr.response);
                    } catch (e) {
                        responseData = xhr.response;
                    }
                    if (typeof success === 'function') {
                        success(responseData);
                    }
                } else {
                    if (typeof error === 'function') {
                        error(xhr.status, xhr.response);
                    }
                }
            }
        }
    }

    function setHeaders(xhr, headers) {
        if (headers) {
            core.each(headers, function (key, value) {
                xhr.setRequestHeader(key, value);
            })
        }
    }

    function addDataEventListener(event) {
        var dataField = 'pi' + event.charAt(0).toUpperCase() + event.slice(1);
        document.addEventListener(event, function (ev) {
            if (ev.target.dataset && ev.target.dataset[dataField]) {
                if (handlers[ev.target.dataset[dataField]]) {
                    var context = pi(ev.target).parents('[data-pi-component]');
                    handlers[ev.target.dataset[dataField]](ev.target, context);
                }
            }
        });
    }

    [
        'click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mousemove', 'mouseout', 'dragstart', 'drag', 'dragenter',
        'dragleave', 'dragover', 'drop', 'dragend', 'keydown', 'keypress', 'keyup', 'change'
    ].map(function (ev) {
        addDataEventListener(ev);
    });

    function handleHashChange() {
        var parts = document.location.hash.split('/');
        if (routes[parts[0]]) {
            routes[parts[0]](parts);
        }
    }

    window.onhashchange = handleHashChange;

    global.pi = core;

})(window);