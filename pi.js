(function (global) {

  var core;

  // ---------------------- element --------------------

  core = function (el, context) {

    var element = {};

    element.selectOne = function () {
      return typeof el === 'string' ? getContext().querySelector(el) : el;
    };

    element.select = function () {
      return typeof el === 'string' ? getContext().querySelectorAll(el) : [el];
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

    element.toggleClass = function (name) {
      element.iterate(function (obj) {
        obj.classList.toggle(name);
      });
    };

    element.hasClass = function (name) {
      var result = false;
      var obj = core.selectOne();
      if (!obj) {
        return false;
      }
      core.iterate(obj.classList, function (className) {
        if (className === name) {
          result = true;
        }
      });
      return result;
    };

    element.is = function (match) {
      var obj = element.selectOne(el);
      return obj.matches ? obj.matches(match) : obj.msMatchesSelector(match);
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
      } else {
        var obj = element.selectOne(el);
        if (obj) {
          return key !== undefined ? obj.dataset[key] : obj.dataset;
        } else {
          return null;
        }
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

    element.template = function (data, sanitize) {
      var html = element.html() || '';
      core.each(data, function (key, value) {
        html = html.replace('{{' + key + '}}', sanitize ? encodeEntities(value) : value);
      });
      return html;
    };

    element.parent = function () {
      return element.selectOne(el).parentElement;
    };

    element.parents = function (match) {
      var obj = element.selectOne(el);
      while (obj = obj.parentElement) {
        if (obj.matches ? obj.matches(match) : obj.msMatchesSelector(match)) {
          return obj;
        }
      }
      return null;
    };

    element.upload = function (options) {
      if (!options) {
        return;
      }

      element.on('change', function (e) {
        sendFiles(e);
      }, false);

      if (options.dropzone) {
        core(document).on('dragover', function (e) {
          e.preventDefault();
        }, false);
        core(options.dropzone).on('drop', function (e) {
          sendFiles(e);
        }, false);
      }

      function sendFiles(e) {
        e.preventDefault();
        var files = e.target.files || e.dataTransfer.files;
        if (!files || !files[0]) {
          return;
        }
        for (var i = 0, file; file = files[i]; i++) {
          if (typeof options.start === 'function') {
            options.start(file);
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
          if (options.data && typeof options.data === 'function') {
            core.each(options.data(), function (key, value) {
              formData.append(key, value);
            });
          } else if (options.data) {
            core.each(options.data, function (key, value) {
              formData.append(key, value);
            });
          }
          formData.append(options.field ? options.field : 'file', file);
          xhr.send(formData);
        }
      }
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

  // ---------------------- tools --------------------

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
    return str && typeof str === 'string' ? str.replace(/^\s+/, '').replace(/\s+$/, '') : '';
  };

  core.sanitize = function (value) {
    return encodeEntities(value);
  };

  core.token = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  core.create = function (tagName) {
    return document.createElement(tagName);
  };

  core.ready = function (callback) {
    document.addEventListener('DOMContentLoaded', function () {
      if (typeof callback === 'function') {
        callback();
      }
      handleHashChange();
    });
  };

  core.log = function (type, message, obj) {
    if (global.console && typeof global.console[type] === 'function') {
      if (obj) {
        global.console[type](message, obj);
      } else {
        global.console[type](message);
      }
    }
  };

  function encodeEntities(value) {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value !== 'string') {
      core.log('warn', 'Wrong encode value: ', value);
      return '';
    }
    return value.replace(/&/g, '&amp;').replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function (value) {
      var hi = value.charCodeAt(0);
      var low = value.charCodeAt(1);
      return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
    }).replace(/([^#-~ |!])/g, function (value) {
      return '&#' + value.charCodeAt(0) + ';';
    }).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ---------------------- storage --------------------

  var storage = {};
  core.storage = {};

  core.storage.get = function (key) {
    return typeof storage[key] !== 'undefined' ? storage[key] : null;
  };

  core.storage.set = function (key, value) {
    storage[key] = value;
  };

  // ---------------------- http --------------------

  core.httpClient = {};

  core.httpClient.uri = function (path, params) {
    var uri = '';
    var parts = '';
    core.iterate(path, function (value) {
      uri += '/' + value;
    });
    core.each(params, function (key, value) {
      parts += ('' === parts ? '?' : '&') + key + '=' + encodeURIComponent(value);
    });
    return uri + parts;
  };

  core.httpClient.get = function (options) {
    core.httpClient.request('GET', options);
  };

  core.httpClient.post = function (options) {
    core.httpClient.request('POST', options);
  };

  core.httpClient.put = function (options) {
    core.httpClient.request('PUT', options);
  };

  core.httpClient.delete = function (options) {
    core.httpClient.request('DELETE', options);
  };

  core.httpClient.request = function (method, options) {
    if (!options || !options.url || typeof options.url !== 'string') {
      return;
    }
    var data = null;
    if (options.data) {
      data = 'plain' === options.type ? options.data : JSON.stringify(options.data);
    }
    var xhr = new XMLHttpRequest();
    xhr.open(method, options.url, true);
    if (!options.noCredentials) {
      xhr.withCredentials = true;
    }
    setHeaders(xhr, options.headers);
    handleXhrResponse(xhr, options.success, options.error);
    xhr.send(data);
  };

  function handleXhrResponse(xhr, success, error) {
    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
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
    core.each(headers, function (key, value) {
      xhr.setRequestHeader(key, value);
    })
  }

  // ---------------------- route --------------------

  var routes = {};

  core.route = function (name, callback) {
    if (name && typeof callback === 'function') {
      routes['#' + name] = callback;
    }
  };

  core.route.navigate = function (params) {
    document.location.hash = '#' + params.join('/');
  };

  function handleHashChange() {
    var parts = document.location.hash.split('/');
    if (routes[parts[0]]) {
      routes[parts[0]](parts);
    }
  }

  window.onhashchange = handleHashChange;

  // ---------------------- events --------------------

  var events = {};

  core.subscribe = function (name, callback, overwrite) {
    var index = -1;
    if (name && typeof callback === 'function') {
      if (!events[name] || overwrite) {
        events[name] = [];
      }
      index = events[name].push(callback) - 1;
    }
    return index;
  };

  core.unsubscribe = function (name, index) {
    if (events[name] && events[name][index]) {
      events[name][index] = null;
    }
  };

  core.emit = function (name, params) {
    core.iterate(events[name], function (cb) {
      if (typeof cb === 'function') {
        cb(params);
      }
    });
  };

  // ---------------------- element event handler --------------------

  var handlers = {};

  core.handle = function (name, callback) {
    if (name && typeof callback === 'function') {
      handlers[name] = callback;
    }
  };

  function addDataEventListener(event) {
    var dataField = 'pi' + event.charAt(0).toUpperCase() + event.slice(1);
    document.addEventListener(event, function (ev) {
      var dataset = ev.target.dataset;
      if (dataset && dataset[dataField] && handlers[dataset[dataField]]) {
        handlers[dataset[dataField]](ev, ev.target, pi(ev.target).parents('[data-pi-component]'));
      }
    });
  }

  ['click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mousemove', 'mouseout', 'dragstart', 'drag', 'dragenter',
    'dragleave', 'dragover', 'drop', 'dragend', 'keydown', 'keypress', 'keyup', 'change', 'contextmenu'
  ].map(function (ev) {
    addDataEventListener(ev);
  });

  // ---------------------- internal emmiter --------------------

  var internalEvents = {};
  var internalEmmiter = {};

  internalEmmiter.subscribe = function (event, cb) {
    if (!internalEvents[event]) {
      internalEvents[event] = [];
    }
    if (typeof cb === 'function') {
      internalEvents[event].push(cb);
    }
  };

  internalEmmiter.emit = function (event, data) {
    if (internalEvents[event]) {
      core.iterate(internalEvents[event], function (cb) {
        if (typeof cb === 'function') {
          cb(data);
        }
      });
      delete internalEvents[event];
    }
  };

  // ---------------------- script loader --------------------

  var loadedScriptsState = {};
  core.loadJS = function (path, callback) {
    internalEmmiter.subscribe('script-loaded:' + path, callback);
    if (loadedScriptsState[path] === 1) {
      return;
    }
    if (loadedScriptsState[path] === 2) {
      internalEmmiter.emit('script-loaded:' + path);
      return;
    }
    loadedScriptsState[path] = 1;
    var script = document.createElement('script');
    script.onload = function () {
      loadedScriptsState[path] = 2;
      internalEmmiter.emit('script-loaded:' + path);
    };
    script.src = path + '.js';
    document.body.appendChild(script);
  };

  // ---------------------- css loader --------------------

  var loadedCssFiles = {};
  core.loadCSS = function (path) {
    if (loadedCssFiles[path]) {
      return;
    }
    loadedCssFiles[path] = true;
    var style = document.createElement('link');
    style.rel = 'stylesheet';
    style.type = 'text/css';
    style.href = path;
    document.body.appendChild(style);
  };

  // ---------------------- template loader --------------------

  var loadedTemplateState = {};
  var templateCache = {};
  core.loadHTML = function (path, callback, error) {
    internalEmmiter.subscribe('template-loaded:' + path, callback);
    if (loadedTemplateState[path] === 2) {
      internalEmmiter.emit('template-loaded:' + path, templateCache[path]);
      return;
    }
    if (loadedTemplateState[path] === 1) {
      return;
    }
    loadedTemplateState[path] = 1;
    core.httpClient.get({
      url: path,
      noCredentials: true,
      success: function (res) {
        templateCache[path] = res;
        loadedTemplateState[path] = 2;
        internalEmmiter.emit('template-loaded:' + path, templateCache[path]);
      },
      error: function (code, response) {
        if (typeof error === 'function') {
          error(code, response);
        }
      }
    });
  };

  // ---------------------- framework --------------------

  var services = {};
  var components = {};

  core.service = function (name, path, body) {
    services[path] = { name: name, body: body };
    internalEmmiter.emit('service-loaded:' + path);
  };

  core.component = function (options) {
    if (!options || !options.path || !options.init || components[options.path]) {
      core.log('error', 'Error while creating component - missing configuration');
      return;
    }
    components[options.path] = options;
    internalEmmiter.emit('component-loaded:' + options.path);
  };

  core.loadComponent = function (root, path) {
    if (components[path]) {
      initComponent(root, components[path]);
    } else {
      internalEmmiter.subscribe('component-loaded:' + path, function () {
        initComponent(root, components[path]);
      });
      core.loadJS(path + '/component');
    }
  };

  function initComponent(root, configuration) {
    if (!root) {
      core.log('error', 'Error while loading component - root can not be empty');
      return;
    }
    if (!configuration) {
      core.log('error', 'Error while loading "' + root + '" component - missing configuration');
      return;
    }
    var imports = {};
    var servicesLoaded = 0;
    var servicesCount = configuration.import ? configuration.import.length : 0;
    var templateReady = false;

    function checkLoadState() {
      if (servicesLoaded === servicesCount && templateReady) {
        configuration.init(imports, core('[data-pi-component="' + root + '"]').selectOne());
      }
    }

    if (servicesCount) {
      core.iterate(configuration.import, function (path) {
        if (services[path]) {
          imports[services[path].name] = services[path].body;
          servicesLoaded += 1;
          checkLoadState();
        } else {
          internalEmmiter.subscribe('service-loaded:' + path, function () {
            imports[services[path].name] = services[path].body;
            servicesLoaded += 1;
            checkLoadState();
          });
          core.loadJS(path);
        }
      });
    }

    core.loadCSS(configuration.path + '/' + configuration.styles);
    core.loadHTML(configuration.path + '/' + configuration.templateUrl, function (html) {
      var el = core('[data-pi-component="' + root + '"]').selectOne();
      core('[data-pi-component="' + root + '"]').html(html);
      templateReady = true;
      checkLoadState();
    });

  }

  // ----------------------------------------------------------------

  global.pi = core;

})(window);