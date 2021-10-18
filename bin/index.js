require("./sourcemap-register.js")
/******/ ;(() => {
    // webpackBootstrap
    /******/ var __webpack_modules__ = {
        /***/ 6545: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            module.exports = __nccwpck_require__(2618)

            /***/
        },

        /***/ 8104: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            var utils = __nccwpck_require__(328)
            var settle = __nccwpck_require__(3211)
            var buildFullPath = __nccwpck_require__(1934)
            var buildURL = __nccwpck_require__(646)
            var http = __nccwpck_require__(8605)
            var https = __nccwpck_require__(7211)
            var httpFollow = __nccwpck_require__(7707).http
            var httpsFollow = __nccwpck_require__(7707).https
            var url = __nccwpck_require__(8835)
            var zlib = __nccwpck_require__(8761)
            var VERSION = __nccwpck_require__(4322).version
            var createError = __nccwpck_require__(5226)
            var enhanceError = __nccwpck_require__(1516)
            var defaults = __nccwpck_require__(8190)
            var Cancel = __nccwpck_require__(8875)

            var isHttps = /https:?/

            /**
             *
             * @param {http.ClientRequestArgs} options
             * @param {AxiosProxyConfig} proxy
             * @param {string} location
             */
            function setProxy(options, proxy, location) {
                options.hostname = proxy.host
                options.host = proxy.host
                options.port = proxy.port
                options.path = location

                // Basic proxy authorization
                if (proxy.auth) {
                    var base64 = Buffer.from(
                        proxy.auth.username + ":" + proxy.auth.password,
                        "utf8",
                    ).toString("base64")
                    options.headers["Proxy-Authorization"] = "Basic " + base64
                }

                // If a proxy is used, any redirects must also pass through the proxy
                options.beforeRedirect = function beforeRedirect(redirection) {
                    redirection.headers.host = redirection.host
                    setProxy(redirection, proxy, redirection.href)
                }
            }

            /*eslint consistent-return:0*/
            module.exports = function httpAdapter(config) {
                return new Promise(function dispatchHttpRequest(resolvePromise, rejectPromise) {
                    var onCanceled
                    function done() {
                        if (config.cancelToken) {
                            config.cancelToken.unsubscribe(onCanceled)
                        }

                        if (config.signal) {
                            config.signal.removeEventListener("abort", onCanceled)
                        }
                    }
                    var resolve = function resolve(value) {
                        done()
                        resolvePromise(value)
                    }
                    var reject = function reject(value) {
                        done()
                        rejectPromise(value)
                    }
                    var data = config.data
                    var headers = config.headers
                    var headerNames = {}

                    Object.keys(headers).forEach(function storeLowerName(name) {
                        headerNames[name.toLowerCase()] = name
                    })

                    // Set User-Agent (required by some servers)
                    // See https://github.com/axios/axios/issues/69
                    if ("user-agent" in headerNames) {
                        // User-Agent is specified; handle case where no UA header is desired
                        if (!headers[headerNames["user-agent"]]) {
                            delete headers[headerNames["user-agent"]]
                        }
                        // Otherwise, use specified value
                    } else {
                        // Only set header if it hasn't been set in config
                        headers["User-Agent"] = "axios/" + VERSION
                    }

                    if (data && !utils.isStream(data)) {
                        if (Buffer.isBuffer(data)) {
                            // Nothing to do...
                        } else if (utils.isArrayBuffer(data)) {
                            data = Buffer.from(new Uint8Array(data))
                        } else if (utils.isString(data)) {
                            data = Buffer.from(data, "utf-8")
                        } else {
                            return reject(
                                createError(
                                    "Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream",
                                    config,
                                ),
                            )
                        }

                        // Add Content-Length header if data exists
                        if (!headerNames["content-length"]) {
                            headers["Content-Length"] = data.length
                        }
                    }

                    // HTTP basic authentication
                    var auth = undefined
                    if (config.auth) {
                        var username = config.auth.username || ""
                        var password = config.auth.password || ""
                        auth = username + ":" + password
                    }

                    // Parse url
                    var fullPath = buildFullPath(config.baseURL, config.url)
                    var parsed = url.parse(fullPath)
                    var protocol = parsed.protocol || "http:"

                    if (!auth && parsed.auth) {
                        var urlAuth = parsed.auth.split(":")
                        var urlUsername = urlAuth[0] || ""
                        var urlPassword = urlAuth[1] || ""
                        auth = urlUsername + ":" + urlPassword
                    }

                    if (auth && headerNames.authorization) {
                        delete headers[headerNames.authorization]
                    }

                    var isHttpsRequest = isHttps.test(protocol)
                    var agent = isHttpsRequest ? config.httpsAgent : config.httpAgent

                    var options = {
                        path: buildURL(parsed.path, config.params, config.paramsSerializer).replace(
                            /^\?/,
                            "",
                        ),
                        method: config.method.toUpperCase(),
                        headers: headers,
                        agent: agent,
                        agents: { http: config.httpAgent, https: config.httpsAgent },
                        auth: auth,
                    }

                    if (config.socketPath) {
                        options.socketPath = config.socketPath
                    } else {
                        options.hostname = parsed.hostname
                        options.port = parsed.port
                    }

                    var proxy = config.proxy
                    if (!proxy && proxy !== false) {
                        var proxyEnv = protocol.slice(0, -1) + "_proxy"
                        var proxyUrl = process.env[proxyEnv] || process.env[proxyEnv.toUpperCase()]
                        if (proxyUrl) {
                            var parsedProxyUrl = url.parse(proxyUrl)
                            var noProxyEnv = process.env.no_proxy || process.env.NO_PROXY
                            var shouldProxy = true

                            if (noProxyEnv) {
                                var noProxy = noProxyEnv.split(",").map(function trim(s) {
                                    return s.trim()
                                })

                                shouldProxy = !noProxy.some(function proxyMatch(proxyElement) {
                                    if (!proxyElement) {
                                        return false
                                    }
                                    if (proxyElement === "*") {
                                        return true
                                    }
                                    if (
                                        proxyElement[0] === "." &&
                                        parsed.hostname.substr(
                                            parsed.hostname.length - proxyElement.length,
                                        ) === proxyElement
                                    ) {
                                        return true
                                    }

                                    return parsed.hostname === proxyElement
                                })
                            }

                            if (shouldProxy) {
                                proxy = {
                                    host: parsedProxyUrl.hostname,
                                    port: parsedProxyUrl.port,
                                    protocol: parsedProxyUrl.protocol,
                                }

                                if (parsedProxyUrl.auth) {
                                    var proxyUrlAuth = parsedProxyUrl.auth.split(":")
                                    proxy.auth = {
                                        username: proxyUrlAuth[0],
                                        password: proxyUrlAuth[1],
                                    }
                                }
                            }
                        }
                    }

                    if (proxy) {
                        options.headers.host =
                            parsed.hostname + (parsed.port ? ":" + parsed.port : "")
                        setProxy(
                            options,
                            proxy,
                            protocol +
                                "//" +
                                parsed.hostname +
                                (parsed.port ? ":" + parsed.port : "") +
                                options.path,
                        )
                    }

                    var transport
                    var isHttpsProxy =
                        isHttpsRequest && (proxy ? isHttps.test(proxy.protocol) : true)
                    if (config.transport) {
                        transport = config.transport
                    } else if (config.maxRedirects === 0) {
                        transport = isHttpsProxy ? https : http
                    } else {
                        if (config.maxRedirects) {
                            options.maxRedirects = config.maxRedirects
                        }
                        transport = isHttpsProxy ? httpsFollow : httpFollow
                    }

                    if (config.maxBodyLength > -1) {
                        options.maxBodyLength = config.maxBodyLength
                    }

                    if (config.insecureHTTPParser) {
                        options.insecureHTTPParser = config.insecureHTTPParser
                    }

                    // Create the request
                    var req = transport.request(options, function handleResponse(res) {
                        if (req.aborted) return

                        // uncompress the response body transparently if required
                        var stream = res

                        // return the last request in case of redirects
                        var lastRequest = res.req || req

                        // if no content, is HEAD request or decompress disabled we should not decompress
                        if (
                            res.statusCode !== 204 &&
                            lastRequest.method !== "HEAD" &&
                            config.decompress !== false
                        ) {
                            switch (res.headers["content-encoding"]) {
                                /*eslint default-case:0*/
                                case "gzip":
                                case "compress":
                                case "deflate":
                                    // add the unzipper to the body stream processing pipeline
                                    stream = stream.pipe(zlib.createUnzip())

                                    // remove the content-encoding in order to not confuse downstream operations
                                    delete res.headers["content-encoding"]
                                    break
                            }
                        }

                        var response = {
                            status: res.statusCode,
                            statusText: res.statusMessage,
                            headers: res.headers,
                            config: config,
                            request: lastRequest,
                        }

                        if (config.responseType === "stream") {
                            response.data = stream
                            settle(resolve, reject, response)
                        } else {
                            var responseBuffer = []
                            var totalResponseBytes = 0
                            stream.on("data", function handleStreamData(chunk) {
                                responseBuffer.push(chunk)
                                totalResponseBytes += chunk.length

                                // make sure the content length is not over the maxContentLength if specified
                                if (
                                    config.maxContentLength > -1 &&
                                    totalResponseBytes > config.maxContentLength
                                ) {
                                    stream.destroy()
                                    reject(
                                        createError(
                                            "maxContentLength size of " +
                                                config.maxContentLength +
                                                " exceeded",
                                            config,
                                            null,
                                            lastRequest,
                                        ),
                                    )
                                }
                            })

                            stream.on("error", function handleStreamError(err) {
                                if (req.aborted) return
                                reject(enhanceError(err, config, null, lastRequest))
                            })

                            stream.on("end", function handleStreamEnd() {
                                var responseData = Buffer.concat(responseBuffer)
                                if (config.responseType !== "arraybuffer") {
                                    responseData = responseData.toString(config.responseEncoding)
                                    if (
                                        !config.responseEncoding ||
                                        config.responseEncoding === "utf8"
                                    ) {
                                        responseData = utils.stripBOM(responseData)
                                    }
                                }

                                response.data = responseData
                                settle(resolve, reject, response)
                            })
                        }
                    })

                    // Handle errors
                    req.on("error", function handleRequestError(err) {
                        if (req.aborted && err.code !== "ERR_FR_TOO_MANY_REDIRECTS") return
                        reject(enhanceError(err, config, null, req))
                    })

                    // Handle request timeout
                    if (config.timeout) {
                        // This is forcing a int timeout to avoid problems if the `req` interface doesn't handle other types.
                        var timeout = parseInt(config.timeout, 10)

                        if (isNaN(timeout)) {
                            reject(
                                createError(
                                    "error trying to parse `config.timeout` to int",
                                    config,
                                    "ERR_PARSE_TIMEOUT",
                                    req,
                                ),
                            )

                            return
                        }

                        // Sometime, the response will be very slow, and does not respond, the connect event will be block by event loop system.
                        // And timer callback will be fired, and abort() will be invoked before connection, then get "socket hang up" and code ECONNRESET.
                        // At this time, if we have a large number of request, nodejs will hang up some socket on background. and the number will up and up.
                        // And then these socket which be hang up will devoring CPU little by little.
                        // ClientRequest.setTimeout will be fired on the specify milliseconds, and can make sure that abort() will be fired after connect.
                        req.setTimeout(timeout, function handleRequestTimeout() {
                            req.abort()
                            var transitional = config.transitional || defaults.transitional
                            reject(
                                createError(
                                    "timeout of " + timeout + "ms exceeded",
                                    config,
                                    transitional.clarifyTimeoutError ? "ETIMEDOUT" : "ECONNABORTED",
                                    req,
                                ),
                            )
                        })
                    }

                    if (config.cancelToken || config.signal) {
                        // Handle cancellation
                        // eslint-disable-next-line func-names
                        onCanceled = function (cancel) {
                            if (req.aborted) return

                            req.abort()
                            reject(
                                !cancel || (cancel && cancel.type)
                                    ? new Cancel("canceled")
                                    : cancel,
                            )
                        }

                        config.cancelToken && config.cancelToken.subscribe(onCanceled)
                        if (config.signal) {
                            config.signal.aborted
                                ? onCanceled()
                                : config.signal.addEventListener("abort", onCanceled)
                        }
                    }

                    // Send the request
                    if (utils.isStream(data)) {
                        data.on("error", function handleStreamError(err) {
                            reject(enhanceError(err, config, null, req))
                        }).pipe(req)
                    } else {
                        req.end(data)
                    }
                })
            }

            /***/
        },

        /***/ 3454: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            var utils = __nccwpck_require__(328)
            var settle = __nccwpck_require__(3211)
            var cookies = __nccwpck_require__(1545)
            var buildURL = __nccwpck_require__(646)
            var buildFullPath = __nccwpck_require__(1934)
            var parseHeaders = __nccwpck_require__(6455)
            var isURLSameOrigin = __nccwpck_require__(3608)
            var createError = __nccwpck_require__(5226)
            var defaults = __nccwpck_require__(8190)
            var Cancel = __nccwpck_require__(8875)

            module.exports = function xhrAdapter(config) {
                return new Promise(function dispatchXhrRequest(resolve, reject) {
                    var requestData = config.data
                    var requestHeaders = config.headers
                    var responseType = config.responseType
                    var onCanceled
                    function done() {
                        if (config.cancelToken) {
                            config.cancelToken.unsubscribe(onCanceled)
                        }

                        if (config.signal) {
                            config.signal.removeEventListener("abort", onCanceled)
                        }
                    }

                    if (utils.isFormData(requestData)) {
                        delete requestHeaders["Content-Type"] // Let the browser set it
                    }

                    var request = new XMLHttpRequest()

                    // HTTP basic authentication
                    if (config.auth) {
                        var username = config.auth.username || ""
                        var password = config.auth.password
                            ? unescape(encodeURIComponent(config.auth.password))
                            : ""
                        requestHeaders.Authorization = "Basic " + btoa(username + ":" + password)
                    }

                    var fullPath = buildFullPath(config.baseURL, config.url)
                    request.open(
                        config.method.toUpperCase(),
                        buildURL(fullPath, config.params, config.paramsSerializer),
                        true,
                    )

                    // Set the request timeout in MS
                    request.timeout = config.timeout

                    function onloadend() {
                        if (!request) {
                            return
                        }
                        // Prepare the response
                        var responseHeaders =
                            "getAllResponseHeaders" in request
                                ? parseHeaders(request.getAllResponseHeaders())
                                : null
                        var responseData =
                            !responseType || responseType === "text" || responseType === "json"
                                ? request.responseText
                                : request.response
                        var response = {
                            data: responseData,
                            status: request.status,
                            statusText: request.statusText,
                            headers: responseHeaders,
                            config: config,
                            request: request,
                        }

                        settle(
                            function _resolve(value) {
                                resolve(value)
                                done()
                            },
                            function _reject(err) {
                                reject(err)
                                done()
                            },
                            response,
                        )

                        // Clean up request
                        request = null
                    }

                    if ("onloadend" in request) {
                        // Use onloadend if available
                        request.onloadend = onloadend
                    } else {
                        // Listen for ready state to emulate onloadend
                        request.onreadystatechange = function handleLoad() {
                            if (!request || request.readyState !== 4) {
                                return
                            }

                            // The request errored out and we didn't get a response, this will be
                            // handled by onerror instead
                            // With one exception: request that using file: protocol, most browsers
                            // will return status as 0 even though it's a successful request
                            if (
                                request.status === 0 &&
                                !(request.responseURL && request.responseURL.indexOf("file:") === 0)
                            ) {
                                return
                            }
                            // readystate handler is calling before onerror or ontimeout handlers,
                            // so we should call onloadend on the next 'tick'
                            setTimeout(onloadend)
                        }
                    }

                    // Handle browser request cancellation (as opposed to a manual cancellation)
                    request.onabort = function handleAbort() {
                        if (!request) {
                            return
                        }

                        reject(createError("Request aborted", config, "ECONNABORTED", request))

                        // Clean up request
                        request = null
                    }

                    // Handle low level network errors
                    request.onerror = function handleError() {
                        // Real errors are hidden from us by the browser
                        // onerror should only fire if it's a network error
                        reject(createError("Network Error", config, null, request))

                        // Clean up request
                        request = null
                    }

                    // Handle timeout
                    request.ontimeout = function handleTimeout() {
                        var timeoutErrorMessage = config.timeout
                            ? "timeout of " + config.timeout + "ms exceeded"
                            : "timeout exceeded"
                        var transitional = config.transitional || defaults.transitional
                        if (config.timeoutErrorMessage) {
                            timeoutErrorMessage = config.timeoutErrorMessage
                        }
                        reject(
                            createError(
                                timeoutErrorMessage,
                                config,
                                transitional.clarifyTimeoutError ? "ETIMEDOUT" : "ECONNABORTED",
                                request,
                            ),
                        )

                        // Clean up request
                        request = null
                    }

                    // Add xsrf header
                    // This is only done if running in a standard browser environment.
                    // Specifically not if we're in a web worker, or react-native.
                    if (utils.isStandardBrowserEnv()) {
                        // Add xsrf header
                        var xsrfValue =
                            (config.withCredentials || isURLSameOrigin(fullPath)) &&
                            config.xsrfCookieName
                                ? cookies.read(config.xsrfCookieName)
                                : undefined

                        if (xsrfValue) {
                            requestHeaders[config.xsrfHeaderName] = xsrfValue
                        }
                    }

                    // Add headers to the request
                    if ("setRequestHeader" in request) {
                        utils.forEach(requestHeaders, function setRequestHeader(val, key) {
                            if (
                                typeof requestData === "undefined" &&
                                key.toLowerCase() === "content-type"
                            ) {
                                // Remove Content-Type if data is undefined
                                delete requestHeaders[key]
                            } else {
                                // Otherwise add header to the request
                                request.setRequestHeader(key, val)
                            }
                        })
                    }

                    // Add withCredentials to request if needed
                    if (!utils.isUndefined(config.withCredentials)) {
                        request.withCredentials = !!config.withCredentials
                    }

                    // Add responseType to request if needed
                    if (responseType && responseType !== "json") {
                        request.responseType = config.responseType
                    }

                    // Handle progress if needed
                    if (typeof config.onDownloadProgress === "function") {
                        request.addEventListener("progress", config.onDownloadProgress)
                    }

                    // Not all browsers support upload events
                    if (typeof config.onUploadProgress === "function" && request.upload) {
                        request.upload.addEventListener("progress", config.onUploadProgress)
                    }

                    if (config.cancelToken || config.signal) {
                        // Handle cancellation
                        // eslint-disable-next-line func-names
                        onCanceled = function (cancel) {
                            if (!request) {
                                return
                            }
                            reject(
                                !cancel || (cancel && cancel.type)
                                    ? new Cancel("canceled")
                                    : cancel,
                            )
                            request.abort()
                            request = null
                        }

                        config.cancelToken && config.cancelToken.subscribe(onCanceled)
                        if (config.signal) {
                            config.signal.aborted
                                ? onCanceled()
                                : config.signal.addEventListener("abort", onCanceled)
                        }
                    }

                    if (!requestData) {
                        requestData = null
                    }

                    // Send the request
                    request.send(requestData)
                })
            }

            /***/
        },

        /***/ 2618: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            var utils = __nccwpck_require__(328)
            var bind = __nccwpck_require__(7065)
            var Axios = __nccwpck_require__(8178)
            var mergeConfig = __nccwpck_require__(4831)
            var defaults = __nccwpck_require__(8190)

            /**
             * Create an instance of Axios
             *
             * @param {Object} defaultConfig The default config for the instance
             * @return {Axios} A new instance of Axios
             */
            function createInstance(defaultConfig) {
                var context = new Axios(defaultConfig)
                var instance = bind(Axios.prototype.request, context)

                // Copy axios.prototype to instance
                utils.extend(instance, Axios.prototype, context)

                // Copy context to instance
                utils.extend(instance, context)

                // Factory for creating new instances
                instance.create = function create(instanceConfig) {
                    return createInstance(mergeConfig(defaultConfig, instanceConfig))
                }

                return instance
            }

            // Create the default instance to be exported
            var axios = createInstance(defaults)

            // Expose Axios class to allow class inheritance
            axios.Axios = Axios

            // Expose Cancel & CancelToken
            axios.Cancel = __nccwpck_require__(8875)
            axios.CancelToken = __nccwpck_require__(1587)
            axios.isCancel = __nccwpck_require__(4057)
            axios.VERSION = __nccwpck_require__(4322).version

            // Expose all/spread
            axios.all = function all(promises) {
                return Promise.all(promises)
            }
            axios.spread = __nccwpck_require__(4850)

            // Expose isAxiosError
            axios.isAxiosError = __nccwpck_require__(650)

            module.exports = axios

            // Allow use of default import syntax in TypeScript
            module.exports.default = axios

            /***/
        },

        /***/ 8875: /***/ (module) => {
            "use strict"

            /**
             * A `Cancel` is an object that is thrown when an operation is canceled.
             *
             * @class
             * @param {string=} message The message.
             */
            function Cancel(message) {
                this.message = message
            }

            Cancel.prototype.toString = function toString() {
                return "Cancel" + (this.message ? ": " + this.message : "")
            }

            Cancel.prototype.__CANCEL__ = true

            module.exports = Cancel

            /***/
        },

        /***/ 1587: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            var Cancel = __nccwpck_require__(8875)

            /**
             * A `CancelToken` is an object that can be used to request cancellation of an operation.
             *
             * @class
             * @param {Function} executor The executor function.
             */
            function CancelToken(executor) {
                if (typeof executor !== "function") {
                    throw new TypeError("executor must be a function.")
                }

                var resolvePromise

                this.promise = new Promise(function promiseExecutor(resolve) {
                    resolvePromise = resolve
                })

                var token = this

                // eslint-disable-next-line func-names
                this.promise.then(function (cancel) {
                    if (!token._listeners) return

                    var i
                    var l = token._listeners.length

                    for (i = 0; i < l; i++) {
                        token._listeners[i](cancel)
                    }
                    token._listeners = null
                })

                // eslint-disable-next-line func-names
                this.promise.then = function (onfulfilled) {
                    var _resolve
                    // eslint-disable-next-line func-names
                    var promise = new Promise(function (resolve) {
                        token.subscribe(resolve)
                        _resolve = resolve
                    }).then(onfulfilled)

                    promise.cancel = function reject() {
                        token.unsubscribe(_resolve)
                    }

                    return promise
                }

                executor(function cancel(message) {
                    if (token.reason) {
                        // Cancellation has already been requested
                        return
                    }

                    token.reason = new Cancel(message)
                    resolvePromise(token.reason)
                })
            }

            /**
             * Throws a `Cancel` if cancellation has been requested.
             */
            CancelToken.prototype.throwIfRequested = function throwIfRequested() {
                if (this.reason) {
                    throw this.reason
                }
            }

            /**
             * Subscribe to the cancel signal
             */

            CancelToken.prototype.subscribe = function subscribe(listener) {
                if (this.reason) {
                    listener(this.reason)
                    return
                }

                if (this._listeners) {
                    this._listeners.push(listener)
                } else {
                    this._listeners = [listener]
                }
            }

            /**
             * Unsubscribe from the cancel signal
             */

            CancelToken.prototype.unsubscribe = function unsubscribe(listener) {
                if (!this._listeners) {
                    return
                }
                var index = this._listeners.indexOf(listener)
                if (index !== -1) {
                    this._listeners.splice(index, 1)
                }
            }

            /**
             * Returns an object that contains a new `CancelToken` and a function that, when called,
             * cancels the `CancelToken`.
             */
            CancelToken.source = function source() {
                var cancel
                var token = new CancelToken(function executor(c) {
                    cancel = c
                })
                return {
                    token: token,
                    cancel: cancel,
                }
            }

            module.exports = CancelToken

            /***/
        },

        /***/ 4057: /***/ (module) => {
            "use strict"

            module.exports = function isCancel(value) {
                return !!(value && value.__CANCEL__)
            }

            /***/
        },

        /***/ 8178: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            var utils = __nccwpck_require__(328)
            var buildURL = __nccwpck_require__(646)
            var InterceptorManager = __nccwpck_require__(3214)
            var dispatchRequest = __nccwpck_require__(5062)
            var mergeConfig = __nccwpck_require__(4831)
            var validator = __nccwpck_require__(1632)

            var validators = validator.validators
            /**
             * Create a new instance of Axios
             *
             * @param {Object} instanceConfig The default config for the instance
             */
            function Axios(instanceConfig) {
                this.defaults = instanceConfig
                this.interceptors = {
                    request: new InterceptorManager(),
                    response: new InterceptorManager(),
                }
            }

            /**
             * Dispatch a request
             *
             * @param {Object} config The config specific for this request (merged with this.defaults)
             */
            Axios.prototype.request = function request(config) {
                /*eslint no-param-reassign:0*/
                // Allow for axios('example/url'[, config]) a la fetch API
                if (typeof config === "string") {
                    config = arguments[1] || {}
                    config.url = arguments[0]
                } else {
                    config = config || {}
                }

                config = mergeConfig(this.defaults, config)

                // Set config.method
                if (config.method) {
                    config.method = config.method.toLowerCase()
                } else if (this.defaults.method) {
                    config.method = this.defaults.method.toLowerCase()
                } else {
                    config.method = "get"
                }

                var transitional = config.transitional

                if (transitional !== undefined) {
                    validator.assertOptions(
                        transitional,
                        {
                            silentJSONParsing: validators.transitional(validators.boolean),
                            forcedJSONParsing: validators.transitional(validators.boolean),
                            clarifyTimeoutError: validators.transitional(validators.boolean),
                        },
                        false,
                    )
                }

                // filter out skipped interceptors
                var requestInterceptorChain = []
                var synchronousRequestInterceptors = true
                this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
                    if (
                        typeof interceptor.runWhen === "function" &&
                        interceptor.runWhen(config) === false
                    ) {
                        return
                    }

                    synchronousRequestInterceptors =
                        synchronousRequestInterceptors && interceptor.synchronous

                    requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected)
                })

                var responseInterceptorChain = []
                this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
                    responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected)
                })

                var promise

                if (!synchronousRequestInterceptors) {
                    var chain = [dispatchRequest, undefined]

                    Array.prototype.unshift.apply(chain, requestInterceptorChain)
                    chain = chain.concat(responseInterceptorChain)

                    promise = Promise.resolve(config)
                    while (chain.length) {
                        promise = promise.then(chain.shift(), chain.shift())
                    }

                    return promise
                }

                var newConfig = config
                while (requestInterceptorChain.length) {
                    var onFulfilled = requestInterceptorChain.shift()
                    var onRejected = requestInterceptorChain.shift()
                    try {
                        newConfig = onFulfilled(newConfig)
                    } catch (error) {
                        onRejected(error)
                        break
                    }
                }

                try {
                    promise = dispatchRequest(newConfig)
                } catch (error) {
                    return Promise.reject(error)
                }

                while (responseInterceptorChain.length) {
                    promise = promise.then(
                        responseInterceptorChain.shift(),
                        responseInterceptorChain.shift(),
                    )
                }

                return promise
            }

            Axios.prototype.getUri = function getUri(config) {
                config = mergeConfig(this.defaults, config)
                return buildURL(config.url, config.params, config.paramsSerializer).replace(
                    /^\?/,
                    "",
                )
            }

            // Provide aliases for supported request methods
            utils.forEach(["delete", "get", "head", "options"], function forEachMethodNoData(
                method,
            ) {
                /*eslint func-names:0*/
                Axios.prototype[method] = function (url, config) {
                    return this.request(
                        mergeConfig(config || {}, {
                            method: method,
                            url: url,
                            data: (config || {}).data,
                        }),
                    )
                }
            })

            utils.forEach(["post", "put", "patch"], function forEachMethodWithData(method) {
                /*eslint func-names:0*/
                Axios.prototype[method] = function (url, data, config) {
                    return this.request(
                        mergeConfig(config || {}, {
                            method: method,
                            url: url,
                            data: data,
                        }),
                    )
                }
            })

            module.exports = Axios

            /***/
        },

        /***/ 3214: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            var utils = __nccwpck_require__(328)

            function InterceptorManager() {
                this.handlers = []
            }

            /**
             * Add a new interceptor to the stack
             *
             * @param {Function} fulfilled The function to handle `then` for a `Promise`
             * @param {Function} rejected The function to handle `reject` for a `Promise`
             *
             * @return {Number} An ID used to remove interceptor later
             */
            InterceptorManager.prototype.use = function use(fulfilled, rejected, options) {
                this.handlers.push({
                    fulfilled: fulfilled,
                    rejected: rejected,
                    synchronous: options ? options.synchronous : false,
                    runWhen: options ? options.runWhen : null,
                })
                return this.handlers.length - 1
            }

            /**
             * Remove an interceptor from the stack
             *
             * @param {Number} id The ID that was returned by `use`
             */
            InterceptorManager.prototype.eject = function eject(id) {
                if (this.handlers[id]) {
                    this.handlers[id] = null
                }
            }

            /**
             * Iterate over all the registered interceptors
             *
             * This method is particularly useful for skipping over any
             * interceptors that may have become `null` calling `eject`.
             *
             * @param {Function} fn The function to call for each interceptor
             */
            InterceptorManager.prototype.forEach = function forEach(fn) {
                utils.forEach(this.handlers, function forEachHandler(h) {
                    if (h !== null) {
                        fn(h)
                    }
                })
            }

            module.exports = InterceptorManager

            /***/
        },

        /***/ 1934: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            var isAbsoluteURL = __nccwpck_require__(1301)
            var combineURLs = __nccwpck_require__(7189)

            /**
             * Creates a new URL by combining the baseURL with the requestedURL,
             * only when the requestedURL is not already an absolute URL.
             * If the requestURL is absolute, this function returns the requestedURL untouched.
             *
             * @param {string} baseURL The base URL
             * @param {string} requestedURL Absolute or relative URL to combine
             * @returns {string} The combined full path
             */
            module.exports = function buildFullPath(baseURL, requestedURL) {
                if (baseURL && !isAbsoluteURL(requestedURL)) {
                    return combineURLs(baseURL, requestedURL)
                }
                return requestedURL
            }

            /***/
        },

        /***/ 5226: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            var enhanceError = __nccwpck_require__(1516)

            /**
             * Create an Error with the specified message, config, error code, request and response.
             *
             * @param {string} message The error message.
             * @param {Object} config The config.
             * @param {string} [code] The error code (for example, 'ECONNABORTED').
             * @param {Object} [request] The request.
             * @param {Object} [response] The response.
             * @returns {Error} The created error.
             */
            module.exports = function createError(message, config, code, request, response) {
                var error = new Error(message)
                return enhanceError(error, config, code, request, response)
            }

            /***/
        },

        /***/ 5062: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            var utils = __nccwpck_require__(328)
            var transformData = __nccwpck_require__(9812)
            var isCancel = __nccwpck_require__(4057)
            var defaults = __nccwpck_require__(8190)
            var Cancel = __nccwpck_require__(8875)

            /**
             * Throws a `Cancel` if cancellation has been requested.
             */
            function throwIfCancellationRequested(config) {
                if (config.cancelToken) {
                    config.cancelToken.throwIfRequested()
                }

                if (config.signal && config.signal.aborted) {
                    throw new Cancel("canceled")
                }
            }

            /**
             * Dispatch a request to the server using the configured adapter.
             *
             * @param {object} config The config that is to be used for the request
             * @returns {Promise} The Promise to be fulfilled
             */
            module.exports = function dispatchRequest(config) {
                throwIfCancellationRequested(config)

                // Ensure headers exist
                config.headers = config.headers || {}

                // Transform request data
                config.data = transformData.call(
                    config,
                    config.data,
                    config.headers,
                    config.transformRequest,
                )

                // Flatten headers
                config.headers = utils.merge(
                    config.headers.common || {},
                    config.headers[config.method] || {},
                    config.headers,
                )

                utils.forEach(
                    ["delete", "get", "head", "post", "put", "patch", "common"],
                    function cleanHeaderConfig(method) {
                        delete config.headers[method]
                    },
                )

                var adapter = config.adapter || defaults.adapter

                return adapter(config).then(
                    function onAdapterResolution(response) {
                        throwIfCancellationRequested(config)

                        // Transform response data
                        response.data = transformData.call(
                            config,
                            response.data,
                            response.headers,
                            config.transformResponse,
                        )

                        return response
                    },
                    function onAdapterRejection(reason) {
                        if (!isCancel(reason)) {
                            throwIfCancellationRequested(config)

                            // Transform response data
                            if (reason && reason.response) {
                                reason.response.data = transformData.call(
                                    config,
                                    reason.response.data,
                                    reason.response.headers,
                                    config.transformResponse,
                                )
                            }
                        }

                        return Promise.reject(reason)
                    },
                )
            }

            /***/
        },

        /***/ 1516: /***/ (module) => {
            "use strict"

            /**
             * Update an Error with the specified config, error code, and response.
             *
             * @param {Error} error The error to update.
             * @param {Object} config The config.
             * @param {string} [code] The error code (for example, 'ECONNABORTED').
             * @param {Object} [request] The request.
             * @param {Object} [response] The response.
             * @returns {Error} The error.
             */
            module.exports = function enhanceError(error, config, code, request, response) {
                error.config = config
                if (code) {
                    error.code = code
                }

                error.request = request
                error.response = response
                error.isAxiosError = true

                error.toJSON = function toJSON() {
                    return {
                        // Standard
                        message: this.message,
                        name: this.name,
                        // Microsoft
                        description: this.description,
                        number: this.number,
                        // Mozilla
                        fileName: this.fileName,
                        lineNumber: this.lineNumber,
                        columnNumber: this.columnNumber,
                        stack: this.stack,
                        // Axios
                        config: this.config,
                        code: this.code,
                        status: this.response && this.response.status ? this.response.status : null,
                    }
                }
                return error
            }

            /***/
        },

        /***/ 4831: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            var utils = __nccwpck_require__(328)

            /**
             * Config-specific merge-function which creates a new config-object
             * by merging two configuration objects together.
             *
             * @param {Object} config1
             * @param {Object} config2
             * @returns {Object} New object resulting from merging config2 to config1
             */
            module.exports = function mergeConfig(config1, config2) {
                // eslint-disable-next-line no-param-reassign
                config2 = config2 || {}
                var config = {}

                function getMergedValue(target, source) {
                    if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
                        return utils.merge(target, source)
                    } else if (utils.isPlainObject(source)) {
                        return utils.merge({}, source)
                    } else if (utils.isArray(source)) {
                        return source.slice()
                    }
                    return source
                }

                // eslint-disable-next-line consistent-return
                function mergeDeepProperties(prop) {
                    if (!utils.isUndefined(config2[prop])) {
                        return getMergedValue(config1[prop], config2[prop])
                    } else if (!utils.isUndefined(config1[prop])) {
                        return getMergedValue(undefined, config1[prop])
                    }
                }

                // eslint-disable-next-line consistent-return
                function valueFromConfig2(prop) {
                    if (!utils.isUndefined(config2[prop])) {
                        return getMergedValue(undefined, config2[prop])
                    }
                }

                // eslint-disable-next-line consistent-return
                function defaultToConfig2(prop) {
                    if (!utils.isUndefined(config2[prop])) {
                        return getMergedValue(undefined, config2[prop])
                    } else if (!utils.isUndefined(config1[prop])) {
                        return getMergedValue(undefined, config1[prop])
                    }
                }

                // eslint-disable-next-line consistent-return
                function mergeDirectKeys(prop) {
                    if (prop in config2) {
                        return getMergedValue(config1[prop], config2[prop])
                    } else if (prop in config1) {
                        return getMergedValue(undefined, config1[prop])
                    }
                }

                var mergeMap = {
                    url: valueFromConfig2,
                    method: valueFromConfig2,
                    data: valueFromConfig2,
                    baseURL: defaultToConfig2,
                    transformRequest: defaultToConfig2,
                    transformResponse: defaultToConfig2,
                    paramsSerializer: defaultToConfig2,
                    timeout: defaultToConfig2,
                    timeoutMessage: defaultToConfig2,
                    withCredentials: defaultToConfig2,
                    adapter: defaultToConfig2,
                    responseType: defaultToConfig2,
                    xsrfCookieName: defaultToConfig2,
                    xsrfHeaderName: defaultToConfig2,
                    onUploadProgress: defaultToConfig2,
                    onDownloadProgress: defaultToConfig2,
                    decompress: defaultToConfig2,
                    maxContentLength: defaultToConfig2,
                    maxBodyLength: defaultToConfig2,
                    transport: defaultToConfig2,
                    httpAgent: defaultToConfig2,
                    httpsAgent: defaultToConfig2,
                    cancelToken: defaultToConfig2,
                    socketPath: defaultToConfig2,
                    responseEncoding: defaultToConfig2,
                    validateStatus: mergeDirectKeys,
                }

                utils.forEach(
                    Object.keys(config1).concat(Object.keys(config2)),
                    function computeConfigValue(prop) {
                        var merge = mergeMap[prop] || mergeDeepProperties
                        var configValue = merge(prop)
                        ;(utils.isUndefined(configValue) && merge !== mergeDirectKeys) ||
                            (config[prop] = configValue)
                    },
                )

                return config
            }

            /***/
        },

        /***/ 3211: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            var createError = __nccwpck_require__(5226)

            /**
             * Resolve or reject a Promise based on response status.
             *
             * @param {Function} resolve A function that resolves the promise.
             * @param {Function} reject A function that rejects the promise.
             * @param {object} response The response.
             */
            module.exports = function settle(resolve, reject, response) {
                var validateStatus = response.config.validateStatus
                if (!response.status || !validateStatus || validateStatus(response.status)) {
                    resolve(response)
                } else {
                    reject(
                        createError(
                            "Request failed with status code " + response.status,
                            response.config,
                            null,
                            response.request,
                            response,
                        ),
                    )
                }
            }

            /***/
        },

        /***/ 9812: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            var utils = __nccwpck_require__(328)
            var defaults = __nccwpck_require__(8190)

            /**
             * Transform the data for a request or a response
             *
             * @param {Object|String} data The data to be transformed
             * @param {Array} headers The headers for the request or response
             * @param {Array|Function} fns A single function or Array of functions
             * @returns {*} The resulting transformed data
             */
            module.exports = function transformData(data, headers, fns) {
                var context = this || defaults
                /*eslint no-param-reassign:0*/
                utils.forEach(fns, function transform(fn) {
                    data = fn.call(context, data, headers)
                })

                return data
            }

            /***/
        },

        /***/ 8190: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            var utils = __nccwpck_require__(328)
            var normalizeHeaderName = __nccwpck_require__(6240)
            var enhanceError = __nccwpck_require__(1516)

            var DEFAULT_CONTENT_TYPE = {
                "Content-Type": "application/x-www-form-urlencoded",
            }

            function setContentTypeIfUnset(headers, value) {
                if (!utils.isUndefined(headers) && utils.isUndefined(headers["Content-Type"])) {
                    headers["Content-Type"] = value
                }
            }

            function getDefaultAdapter() {
                var adapter
                if (typeof XMLHttpRequest !== "undefined") {
                    // For browsers use XHR adapter
                    adapter = __nccwpck_require__(3454)
                } else if (
                    typeof process !== "undefined" &&
                    Object.prototype.toString.call(process) === "[object process]"
                ) {
                    // For node use HTTP adapter
                    adapter = __nccwpck_require__(8104)
                }
                return adapter
            }

            function stringifySafely(rawValue, parser, encoder) {
                if (utils.isString(rawValue)) {
                    try {
                        ;(parser || JSON.parse)(rawValue)
                        return utils.trim(rawValue)
                    } catch (e) {
                        if (e.name !== "SyntaxError") {
                            throw e
                        }
                    }
                }

                return (encoder || JSON.stringify)(rawValue)
            }

            var defaults = {
                transitional: {
                    silentJSONParsing: true,
                    forcedJSONParsing: true,
                    clarifyTimeoutError: false,
                },

                adapter: getDefaultAdapter(),

                transformRequest: [
                    function transformRequest(data, headers) {
                        normalizeHeaderName(headers, "Accept")
                        normalizeHeaderName(headers, "Content-Type")

                        if (
                            utils.isFormData(data) ||
                            utils.isArrayBuffer(data) ||
                            utils.isBuffer(data) ||
                            utils.isStream(data) ||
                            utils.isFile(data) ||
                            utils.isBlob(data)
                        ) {
                            return data
                        }
                        if (utils.isArrayBufferView(data)) {
                            return data.buffer
                        }
                        if (utils.isURLSearchParams(data)) {
                            setContentTypeIfUnset(
                                headers,
                                "application/x-www-form-urlencoded;charset=utf-8",
                            )
                            return data.toString()
                        }
                        if (
                            utils.isObject(data) ||
                            (headers && headers["Content-Type"] === "application/json")
                        ) {
                            setContentTypeIfUnset(headers, "application/json")
                            return stringifySafely(data)
                        }
                        return data
                    },
                ],

                transformResponse: [
                    function transformResponse(data) {
                        var transitional = this.transitional || defaults.transitional
                        var silentJSONParsing = transitional && transitional.silentJSONParsing
                        var forcedJSONParsing = transitional && transitional.forcedJSONParsing
                        var strictJSONParsing = !silentJSONParsing && this.responseType === "json"

                        if (
                            strictJSONParsing ||
                            (forcedJSONParsing && utils.isString(data) && data.length)
                        ) {
                            try {
                                return JSON.parse(data)
                            } catch (e) {
                                if (strictJSONParsing) {
                                    if (e.name === "SyntaxError") {
                                        throw enhanceError(e, this, "E_JSON_PARSE")
                                    }
                                    throw e
                                }
                            }
                        }

                        return data
                    },
                ],

                /**
                 * A timeout in milliseconds to abort a request. If set to 0 (default) a
                 * timeout is not created.
                 */
                timeout: 0,

                xsrfCookieName: "XSRF-TOKEN",
                xsrfHeaderName: "X-XSRF-TOKEN",

                maxContentLength: -1,
                maxBodyLength: -1,

                validateStatus: function validateStatus(status) {
                    return status >= 200 && status < 300
                },

                headers: {
                    common: {
                        Accept: "application/json, text/plain, */*",
                    },
                },
            }

            utils.forEach(["delete", "get", "head"], function forEachMethodNoData(method) {
                defaults.headers[method] = {}
            })

            utils.forEach(["post", "put", "patch"], function forEachMethodWithData(method) {
                defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE)
            })

            module.exports = defaults

            /***/
        },

        /***/ 4322: /***/ (module) => {
            module.exports = {
                version: "0.23.0",
            }

            /***/
        },

        /***/ 7065: /***/ (module) => {
            "use strict"

            module.exports = function bind(fn, thisArg) {
                return function wrap() {
                    var args = new Array(arguments.length)
                    for (var i = 0; i < args.length; i++) {
                        args[i] = arguments[i]
                    }
                    return fn.apply(thisArg, args)
                }
            }

            /***/
        },

        /***/ 646: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            var utils = __nccwpck_require__(328)

            function encode(val) {
                return encodeURIComponent(val)
                    .replace(/%3A/gi, ":")
                    .replace(/%24/g, "$")
                    .replace(/%2C/gi, ",")
                    .replace(/%20/g, "+")
                    .replace(/%5B/gi, "[")
                    .replace(/%5D/gi, "]")
            }

            /**
             * Build a URL by appending params to the end
             *
             * @param {string} url The base of the url (e.g., http://www.google.com)
             * @param {object} [params] The params to be appended
             * @returns {string} The formatted url
             */
            module.exports = function buildURL(url, params, paramsSerializer) {
                /*eslint no-param-reassign:0*/
                if (!params) {
                    return url
                }

                var serializedParams
                if (paramsSerializer) {
                    serializedParams = paramsSerializer(params)
                } else if (utils.isURLSearchParams(params)) {
                    serializedParams = params.toString()
                } else {
                    var parts = []

                    utils.forEach(params, function serialize(val, key) {
                        if (val === null || typeof val === "undefined") {
                            return
                        }

                        if (utils.isArray(val)) {
                            key = key + "[]"
                        } else {
                            val = [val]
                        }

                        utils.forEach(val, function parseValue(v) {
                            if (utils.isDate(v)) {
                                v = v.toISOString()
                            } else if (utils.isObject(v)) {
                                v = JSON.stringify(v)
                            }
                            parts.push(encode(key) + "=" + encode(v))
                        })
                    })

                    serializedParams = parts.join("&")
                }

                if (serializedParams) {
                    var hashmarkIndex = url.indexOf("#")
                    if (hashmarkIndex !== -1) {
                        url = url.slice(0, hashmarkIndex)
                    }

                    url += (url.indexOf("?") === -1 ? "?" : "&") + serializedParams
                }

                return url
            }

            /***/
        },

        /***/ 7189: /***/ (module) => {
            "use strict"

            /**
             * Creates a new URL by combining the specified URLs
             *
             * @param {string} baseURL The base URL
             * @param {string} relativeURL The relative URL
             * @returns {string} The combined URL
             */
            module.exports = function combineURLs(baseURL, relativeURL) {
                return relativeURL
                    ? baseURL.replace(/\/+$/, "") + "/" + relativeURL.replace(/^\/+/, "")
                    : baseURL
            }

            /***/
        },

        /***/ 1545: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            var utils = __nccwpck_require__(328)

            module.exports = utils.isStandardBrowserEnv()
                ? // Standard browser envs support document.cookie
                  (function standardBrowserEnv() {
                      return {
                          write: function write(name, value, expires, path, domain, secure) {
                              var cookie = []
                              cookie.push(name + "=" + encodeURIComponent(value))

                              if (utils.isNumber(expires)) {
                                  cookie.push("expires=" + new Date(expires).toGMTString())
                              }

                              if (utils.isString(path)) {
                                  cookie.push("path=" + path)
                              }

                              if (utils.isString(domain)) {
                                  cookie.push("domain=" + domain)
                              }

                              if (secure === true) {
                                  cookie.push("secure")
                              }

                              document.cookie = cookie.join("; ")
                          },

                          read: function read(name) {
                              var match = document.cookie.match(
                                  new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"),
                              )
                              return match ? decodeURIComponent(match[3]) : null
                          },

                          remove: function remove(name) {
                              this.write(name, "", Date.now() - 86400000)
                          },
                      }
                  })()
                : // Non standard browser env (web workers, react-native) lack needed support.
                  (function nonStandardBrowserEnv() {
                      return {
                          write: function write() {},
                          read: function read() {
                              return null
                          },
                          remove: function remove() {},
                      }
                  })()

            /***/
        },

        /***/ 1301: /***/ (module) => {
            "use strict"

            /**
             * Determines whether the specified URL is absolute
             *
             * @param {string} url The URL to test
             * @returns {boolean} True if the specified URL is absolute, otherwise false
             */
            module.exports = function isAbsoluteURL(url) {
                // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
                // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
                // by any combination of letters, digits, plus, period, or hyphen.
                return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url)
            }

            /***/
        },

        /***/ 650: /***/ (module) => {
            "use strict"

            /**
             * Determines whether the payload is an error thrown by Axios
             *
             * @param {*} payload The value to test
             * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
             */
            module.exports = function isAxiosError(payload) {
                return typeof payload === "object" && payload.isAxiosError === true
            }

            /***/
        },

        /***/ 3608: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            var utils = __nccwpck_require__(328)

            module.exports = utils.isStandardBrowserEnv()
                ? // Standard browser envs have full support of the APIs needed to test
                  // whether the request URL is of the same origin as current location.
                  (function standardBrowserEnv() {
                      var msie = /(msie|trident)/i.test(navigator.userAgent)
                      var urlParsingNode = document.createElement("a")
                      var originURL

                      /**
                       * Parse a URL to discover it's components
                       *
                       * @param {String} url The URL to be parsed
                       * @returns {Object}
                       */
                      function resolveURL(url) {
                          var href = url

                          if (msie) {
                              // IE needs attribute set twice to normalize properties
                              urlParsingNode.setAttribute("href", href)
                              href = urlParsingNode.href
                          }

                          urlParsingNode.setAttribute("href", href)

                          // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
                          return {
                              href: urlParsingNode.href,
                              protocol: urlParsingNode.protocol
                                  ? urlParsingNode.protocol.replace(/:$/, "")
                                  : "",
                              host: urlParsingNode.host,
                              search: urlParsingNode.search
                                  ? urlParsingNode.search.replace(/^\?/, "")
                                  : "",
                              hash: urlParsingNode.hash
                                  ? urlParsingNode.hash.replace(/^#/, "")
                                  : "",
                              hostname: urlParsingNode.hostname,
                              port: urlParsingNode.port,
                              pathname:
                                  urlParsingNode.pathname.charAt(0) === "/"
                                      ? urlParsingNode.pathname
                                      : "/" + urlParsingNode.pathname,
                          }
                      }

                      originURL = resolveURL(window.location.href)

                      /**
                       * Determine if a URL shares the same origin as the current location
                       *
                       * @param {String} requestURL The URL to test
                       * @returns {boolean} True if URL shares the same origin, otherwise false
                       */
                      return function isURLSameOrigin(requestURL) {
                          var parsed = utils.isString(requestURL)
                              ? resolveURL(requestURL)
                              : requestURL
                          return (
                              parsed.protocol === originURL.protocol &&
                              parsed.host === originURL.host
                          )
                      }
                  })()
                : // Non standard browser envs (web workers, react-native) lack needed support.
                  (function nonStandardBrowserEnv() {
                      return function isURLSameOrigin() {
                          return true
                      }
                  })()

            /***/
        },

        /***/ 6240: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            var utils = __nccwpck_require__(328)

            module.exports = function normalizeHeaderName(headers, normalizedName) {
                utils.forEach(headers, function processHeader(value, name) {
                    if (
                        name !== normalizedName &&
                        name.toUpperCase() === normalizedName.toUpperCase()
                    ) {
                        headers[normalizedName] = value
                        delete headers[name]
                    }
                })
            }

            /***/
        },

        /***/ 6455: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            var utils = __nccwpck_require__(328)

            // Headers whose duplicates are ignored by node
            // c.f. https://nodejs.org/api/http.html#http_message_headers
            var ignoreDuplicateOf = [
                "age",
                "authorization",
                "content-length",
                "content-type",
                "etag",
                "expires",
                "from",
                "host",
                "if-modified-since",
                "if-unmodified-since",
                "last-modified",
                "location",
                "max-forwards",
                "proxy-authorization",
                "referer",
                "retry-after",
                "user-agent",
            ]

            /**
             * Parse headers into an object
             *
             * ```
             * Date: Wed, 27 Aug 2014 08:58:49 GMT
             * Content-Type: application/json
             * Connection: keep-alive
             * Transfer-Encoding: chunked
             * ```
             *
             * @param {String} headers Headers needing to be parsed
             * @returns {Object} Headers parsed into an object
             */
            module.exports = function parseHeaders(headers) {
                var parsed = {}
                var key
                var val
                var i

                if (!headers) {
                    return parsed
                }

                utils.forEach(headers.split("\n"), function parser(line) {
                    i = line.indexOf(":")
                    key = utils.trim(line.substr(0, i)).toLowerCase()
                    val = utils.trim(line.substr(i + 1))

                    if (key) {
                        if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
                            return
                        }
                        if (key === "set-cookie") {
                            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val])
                        } else {
                            parsed[key] = parsed[key] ? parsed[key] + ", " + val : val
                        }
                    }
                })

                return parsed
            }

            /***/
        },

        /***/ 4850: /***/ (module) => {
            "use strict"

            /**
             * Syntactic sugar for invoking a function and expanding an array for arguments.
             *
             * Common use case would be to use `Function.prototype.apply`.
             *
             *  ```js
             *  function f(x, y, z) {}
             *  var args = [1, 2, 3];
             *  f.apply(null, args);
             *  ```
             *
             * With `spread` this example can be re-written.
             *
             *  ```js
             *  spread(function(x, y, z) {})([1, 2, 3]);
             *  ```
             *
             * @param {Function} callback
             * @returns {Function}
             */
            module.exports = function spread(callback) {
                return function wrap(arr) {
                    return callback.apply(null, arr)
                }
            }

            /***/
        },

        /***/ 1632: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            var VERSION = __nccwpck_require__(4322).version

            var validators = {}

            // eslint-disable-next-line func-names
            ;["object", "boolean", "number", "function", "string", "symbol"].forEach(function (
                type,
                i,
            ) {
                validators[type] = function validator(thing) {
                    return typeof thing === type || "a" + (i < 1 ? "n " : " ") + type
                }
            })

            var deprecatedWarnings = {}

            /**
             * Transitional option validator
             * @param {function|boolean?} validator - set to false if the transitional option has been removed
             * @param {string?} version - deprecated version / removed since version
             * @param {string?} message - some message with additional info
             * @returns {function}
             */
            validators.transitional = function transitional(validator, version, message) {
                function formatMessage(opt, desc) {
                    return (
                        "[Axios v" +
                        VERSION +
                        "] Transitional option '" +
                        opt +
                        "'" +
                        desc +
                        (message ? ". " + message : "")
                    )
                }

                // eslint-disable-next-line func-names
                return function (value, opt, opts) {
                    if (validator === false) {
                        throw new Error(
                            formatMessage(
                                opt,
                                " has been removed" + (version ? " in " + version : ""),
                            ),
                        )
                    }

                    if (version && !deprecatedWarnings[opt]) {
                        deprecatedWarnings[opt] = true
                        // eslint-disable-next-line no-console
                        console.warn(
                            formatMessage(
                                opt,
                                " has been deprecated since v" +
                                    version +
                                    " and will be removed in the near future",
                            ),
                        )
                    }

                    return validator ? validator(value, opt, opts) : true
                }
            }

            /**
             * Assert object's properties type
             * @param {object} options
             * @param {object} schema
             * @param {boolean?} allowUnknown
             */

            function assertOptions(options, schema, allowUnknown) {
                if (typeof options !== "object") {
                    throw new TypeError("options must be an object")
                }
                var keys = Object.keys(options)
                var i = keys.length
                while (i-- > 0) {
                    var opt = keys[i]
                    var validator = schema[opt]
                    if (validator) {
                        var value = options[opt]
                        var result = value === undefined || validator(value, opt, options)
                        if (result !== true) {
                            throw new TypeError("option " + opt + " must be " + result)
                        }
                        continue
                    }
                    if (allowUnknown !== true) {
                        throw Error("Unknown option " + opt)
                    }
                }
            }

            module.exports = {
                assertOptions: assertOptions,
                validators: validators,
            }

            /***/
        },

        /***/ 328: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            var bind = __nccwpck_require__(7065)

            // utils is a library of generic helper functions non-specific to axios

            var toString = Object.prototype.toString

            /**
             * Determine if a value is an Array
             *
             * @param {Object} val The value to test
             * @returns {boolean} True if value is an Array, otherwise false
             */
            function isArray(val) {
                return toString.call(val) === "[object Array]"
            }

            /**
             * Determine if a value is undefined
             *
             * @param {Object} val The value to test
             * @returns {boolean} True if the value is undefined, otherwise false
             */
            function isUndefined(val) {
                return typeof val === "undefined"
            }

            /**
             * Determine if a value is a Buffer
             *
             * @param {Object} val The value to test
             * @returns {boolean} True if value is a Buffer, otherwise false
             */
            function isBuffer(val) {
                return (
                    val !== null &&
                    !isUndefined(val) &&
                    val.constructor !== null &&
                    !isUndefined(val.constructor) &&
                    typeof val.constructor.isBuffer === "function" &&
                    val.constructor.isBuffer(val)
                )
            }

            /**
             * Determine if a value is an ArrayBuffer
             *
             * @param {Object} val The value to test
             * @returns {boolean} True if value is an ArrayBuffer, otherwise false
             */
            function isArrayBuffer(val) {
                return toString.call(val) === "[object ArrayBuffer]"
            }

            /**
             * Determine if a value is a FormData
             *
             * @param {Object} val The value to test
             * @returns {boolean} True if value is an FormData, otherwise false
             */
            function isFormData(val) {
                return typeof FormData !== "undefined" && val instanceof FormData
            }

            /**
             * Determine if a value is a view on an ArrayBuffer
             *
             * @param {Object} val The value to test
             * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
             */
            function isArrayBufferView(val) {
                var result
                if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
                    result = ArrayBuffer.isView(val)
                } else {
                    result = val && val.buffer && val.buffer instanceof ArrayBuffer
                }
                return result
            }

            /**
             * Determine if a value is a String
             *
             * @param {Object} val The value to test
             * @returns {boolean} True if value is a String, otherwise false
             */
            function isString(val) {
                return typeof val === "string"
            }

            /**
             * Determine if a value is a Number
             *
             * @param {Object} val The value to test
             * @returns {boolean} True if value is a Number, otherwise false
             */
            function isNumber(val) {
                return typeof val === "number"
            }

            /**
             * Determine if a value is an Object
             *
             * @param {Object} val The value to test
             * @returns {boolean} True if value is an Object, otherwise false
             */
            function isObject(val) {
                return val !== null && typeof val === "object"
            }

            /**
             * Determine if a value is a plain Object
             *
             * @param {Object} val The value to test
             * @return {boolean} True if value is a plain Object, otherwise false
             */
            function isPlainObject(val) {
                if (toString.call(val) !== "[object Object]") {
                    return false
                }

                var prototype = Object.getPrototypeOf(val)
                return prototype === null || prototype === Object.prototype
            }

            /**
             * Determine if a value is a Date
             *
             * @param {Object} val The value to test
             * @returns {boolean} True if value is a Date, otherwise false
             */
            function isDate(val) {
                return toString.call(val) === "[object Date]"
            }

            /**
             * Determine if a value is a File
             *
             * @param {Object} val The value to test
             * @returns {boolean} True if value is a File, otherwise false
             */
            function isFile(val) {
                return toString.call(val) === "[object File]"
            }

            /**
             * Determine if a value is a Blob
             *
             * @param {Object} val The value to test
             * @returns {boolean} True if value is a Blob, otherwise false
             */
            function isBlob(val) {
                return toString.call(val) === "[object Blob]"
            }

            /**
             * Determine if a value is a Function
             *
             * @param {Object} val The value to test
             * @returns {boolean} True if value is a Function, otherwise false
             */
            function isFunction(val) {
                return toString.call(val) === "[object Function]"
            }

            /**
             * Determine if a value is a Stream
             *
             * @param {Object} val The value to test
             * @returns {boolean} True if value is a Stream, otherwise false
             */
            function isStream(val) {
                return isObject(val) && isFunction(val.pipe)
            }

            /**
             * Determine if a value is a URLSearchParams object
             *
             * @param {Object} val The value to test
             * @returns {boolean} True if value is a URLSearchParams object, otherwise false
             */
            function isURLSearchParams(val) {
                return typeof URLSearchParams !== "undefined" && val instanceof URLSearchParams
            }

            /**
             * Trim excess whitespace off the beginning and end of a string
             *
             * @param {String} str The String to trim
             * @returns {String} The String freed of excess whitespace
             */
            function trim(str) {
                return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, "")
            }

            /**
             * Determine if we're running in a standard browser environment
             *
             * This allows axios to run in a web worker, and react-native.
             * Both environments support XMLHttpRequest, but not fully standard globals.
             *
             * web workers:
             *  typeof window -> undefined
             *  typeof document -> undefined
             *
             * react-native:
             *  navigator.product -> 'ReactNative'
             * nativescript
             *  navigator.product -> 'NativeScript' or 'NS'
             */
            function isStandardBrowserEnv() {
                if (
                    typeof navigator !== "undefined" &&
                    (navigator.product === "ReactNative" ||
                        navigator.product === "NativeScript" ||
                        navigator.product === "NS")
                ) {
                    return false
                }
                return typeof window !== "undefined" && typeof document !== "undefined"
            }

            /**
             * Iterate over an Array or an Object invoking a function for each item.
             *
             * If `obj` is an Array callback will be called passing
             * the value, index, and complete array for each item.
             *
             * If 'obj' is an Object callback will be called passing
             * the value, key, and complete object for each property.
             *
             * @param {Object|Array} obj The object to iterate
             * @param {Function} fn The callback to invoke for each item
             */
            function forEach(obj, fn) {
                // Don't bother if no value provided
                if (obj === null || typeof obj === "undefined") {
                    return
                }

                // Force an array if not already something iterable
                if (typeof obj !== "object") {
                    /*eslint no-param-reassign:0*/
                    obj = [obj]
                }

                if (isArray(obj)) {
                    // Iterate over array values
                    for (var i = 0, l = obj.length; i < l; i++) {
                        fn.call(null, obj[i], i, obj)
                    }
                } else {
                    // Iterate over object keys
                    for (var key in obj) {
                        if (Object.prototype.hasOwnProperty.call(obj, key)) {
                            fn.call(null, obj[key], key, obj)
                        }
                    }
                }
            }

            /**
             * Accepts varargs expecting each argument to be an object, then
             * immutably merges the properties of each object and returns result.
             *
             * When multiple objects contain the same key the later object in
             * the arguments list will take precedence.
             *
             * Example:
             *
             * ```js
             * var result = merge({foo: 123}, {foo: 456});
             * console.log(result.foo); // outputs 456
             * ```
             *
             * @param {Object} obj1 Object to merge
             * @returns {Object} Result of all merge properties
             */
            function merge(/* obj1, obj2, obj3, ... */) {
                var result = {}
                function assignValue(val, key) {
                    if (isPlainObject(result[key]) && isPlainObject(val)) {
                        result[key] = merge(result[key], val)
                    } else if (isPlainObject(val)) {
                        result[key] = merge({}, val)
                    } else if (isArray(val)) {
                        result[key] = val.slice()
                    } else {
                        result[key] = val
                    }
                }

                for (var i = 0, l = arguments.length; i < l; i++) {
                    forEach(arguments[i], assignValue)
                }
                return result
            }

            /**
             * Extends object a by mutably adding to it the properties of object b.
             *
             * @param {Object} a The object to be extended
             * @param {Object} b The object to copy properties from
             * @param {Object} thisArg The object to bind function to
             * @return {Object} The resulting value of object a
             */
            function extend(a, b, thisArg) {
                forEach(b, function assignValue(val, key) {
                    if (thisArg && typeof val === "function") {
                        a[key] = bind(val, thisArg)
                    } else {
                        a[key] = val
                    }
                })
                return a
            }

            /**
             * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
             *
             * @param {string} content with BOM
             * @return {string} content value without BOM
             */
            function stripBOM(content) {
                if (content.charCodeAt(0) === 0xfeff) {
                    content = content.slice(1)
                }
                return content
            }

            module.exports = {
                isArray: isArray,
                isArrayBuffer: isArrayBuffer,
                isBuffer: isBuffer,
                isFormData: isFormData,
                isArrayBufferView: isArrayBufferView,
                isString: isString,
                isNumber: isNumber,
                isObject: isObject,
                isPlainObject: isPlainObject,
                isUndefined: isUndefined,
                isDate: isDate,
                isFile: isFile,
                isBlob: isBlob,
                isFunction: isFunction,
                isStream: isStream,
                isURLSearchParams: isURLSearchParams,
                isStandardBrowserEnv: isStandardBrowserEnv,
                forEach: forEach,
                merge: merge,
                extend: extend,
                trim: trim,
                stripBOM: stripBOM,
            }

            /***/
        },

        /***/ 8222: /***/ (module, exports, __nccwpck_require__) => {
            /* eslint-env browser */

            /**
             * This is the web browser implementation of `debug()`.
             */

            exports.formatArgs = formatArgs
            exports.save = save
            exports.load = load
            exports.useColors = useColors
            exports.storage = localstorage()
            exports.destroy = (() => {
                let warned = false

                return () => {
                    if (!warned) {
                        warned = true
                        console.warn(
                            "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.",
                        )
                    }
                }
            })()

            /**
             * Colors.
             */

            exports.colors = [
                "#0000CC",
                "#0000FF",
                "#0033CC",
                "#0033FF",
                "#0066CC",
                "#0066FF",
                "#0099CC",
                "#0099FF",
                "#00CC00",
                "#00CC33",
                "#00CC66",
                "#00CC99",
                "#00CCCC",
                "#00CCFF",
                "#3300CC",
                "#3300FF",
                "#3333CC",
                "#3333FF",
                "#3366CC",
                "#3366FF",
                "#3399CC",
                "#3399FF",
                "#33CC00",
                "#33CC33",
                "#33CC66",
                "#33CC99",
                "#33CCCC",
                "#33CCFF",
                "#6600CC",
                "#6600FF",
                "#6633CC",
                "#6633FF",
                "#66CC00",
                "#66CC33",
                "#9900CC",
                "#9900FF",
                "#9933CC",
                "#9933FF",
                "#99CC00",
                "#99CC33",
                "#CC0000",
                "#CC0033",
                "#CC0066",
                "#CC0099",
                "#CC00CC",
                "#CC00FF",
                "#CC3300",
                "#CC3333",
                "#CC3366",
                "#CC3399",
                "#CC33CC",
                "#CC33FF",
                "#CC6600",
                "#CC6633",
                "#CC9900",
                "#CC9933",
                "#CCCC00",
                "#CCCC33",
                "#FF0000",
                "#FF0033",
                "#FF0066",
                "#FF0099",
                "#FF00CC",
                "#FF00FF",
                "#FF3300",
                "#FF3333",
                "#FF3366",
                "#FF3399",
                "#FF33CC",
                "#FF33FF",
                "#FF6600",
                "#FF6633",
                "#FF9900",
                "#FF9933",
                "#FFCC00",
                "#FFCC33",
            ]

            /**
             * Currently only WebKit-based Web Inspectors, Firefox >= v31,
             * and the Firebug extension (any Firefox version) are known
             * to support "%c" CSS customizations.
             *
             * TODO: add a `localStorage` variable to explicitly enable/disable colors
             */

            // eslint-disable-next-line complexity
            function useColors() {
                // NB: In an Electron preload script, document will be defined but not fully
                // initialized. Since we know we're in Chrome, we'll just detect this case
                // explicitly
                if (
                    typeof window !== "undefined" &&
                    window.process &&
                    (window.process.type === "renderer" || window.process.__nwjs)
                ) {
                    return true
                }

                // Internet Explorer and Edge do not support colors.
                if (
                    typeof navigator !== "undefined" &&
                    navigator.userAgent &&
                    navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)
                ) {
                    return false
                }

                // Is webkit? http://stackoverflow.com/a/16459606/376773
                // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
                return (
                    (typeof document !== "undefined" &&
                        document.documentElement &&
                        document.documentElement.style &&
                        document.documentElement.style.WebkitAppearance) ||
                    // Is firebug? http://stackoverflow.com/a/398120/376773
                    (typeof window !== "undefined" &&
                        window.console &&
                        (window.console.firebug ||
                            (window.console.exception && window.console.table))) ||
                    // Is firefox >= v31?
                    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
                    (typeof navigator !== "undefined" &&
                        navigator.userAgent &&
                        navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) &&
                        parseInt(RegExp.$1, 10) >= 31) ||
                    // Double check webkit in userAgent just in case we are in a worker
                    (typeof navigator !== "undefined" &&
                        navigator.userAgent &&
                        navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/))
                )
            }

            /**
             * Colorize log arguments if enabled.
             *
             * @api public
             */

            function formatArgs(args) {
                args[0] =
                    (this.useColors ? "%c" : "") +
                    this.namespace +
                    (this.useColors ? " %c" : " ") +
                    args[0] +
                    (this.useColors ? "%c " : " ") +
                    "+" +
                    module.exports.humanize(this.diff)

                if (!this.useColors) {
                    return
                }

                const c = "color: " + this.color
                args.splice(1, 0, c, "color: inherit")

                // The final "%c" is somewhat tricky, because there could be other
                // arguments passed either before or after the %c, so we need to
                // figure out the correct index to insert the CSS into
                let index = 0
                let lastC = 0
                args[0].replace(/%[a-zA-Z%]/g, (match) => {
                    if (match === "%%") {
                        return
                    }
                    index++
                    if (match === "%c") {
                        // We only are interested in the *last* %c
                        // (the user may have provided their own)
                        lastC = index
                    }
                })

                args.splice(lastC, 0, c)
            }

            /**
             * Invokes `console.debug()` when available.
             * No-op when `console.debug` is not a "function".
             * If `console.debug` is not available, falls back
             * to `console.log`.
             *
             * @api public
             */
            exports.log = console.debug || console.log || (() => {})

            /**
             * Save `namespaces`.
             *
             * @param {String} namespaces
             * @api private
             */
            function save(namespaces) {
                try {
                    if (namespaces) {
                        exports.storage.setItem("debug", namespaces)
                    } else {
                        exports.storage.removeItem("debug")
                    }
                } catch (error) {
                    // Swallow
                    // XXX (@Qix-) should we be logging these?
                }
            }

            /**
             * Load `namespaces`.
             *
             * @return {String} returns the previously persisted debug modes
             * @api private
             */
            function load() {
                let r
                try {
                    r = exports.storage.getItem("debug")
                } catch (error) {
                    // Swallow
                    // XXX (@Qix-) should we be logging these?
                }

                // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
                if (!r && typeof process !== "undefined" && "env" in process) {
                    r = process.env.DEBUG
                }

                return r
            }

            /**
             * Localstorage attempts to return the localstorage.
             *
             * This is necessary because safari throws
             * when a user disables cookies/localstorage
             * and you attempt to access it.
             *
             * @return {LocalStorage}
             * @api private
             */

            function localstorage() {
                try {
                    // TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
                    // The Browser also has localStorage in the global context.
                    return localStorage
                } catch (error) {
                    // Swallow
                    // XXX (@Qix-) should we be logging these?
                }
            }

            module.exports = __nccwpck_require__(6243)(exports)

            const { formatters } = module.exports

            /**
             * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
             */

            formatters.j = function (v) {
                try {
                    return JSON.stringify(v)
                } catch (error) {
                    return "[UnexpectedJSONParseError]: " + error.message
                }
            }

            /***/
        },

        /***/ 6243: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            /**
             * This is the common logic for both the Node.js and web browser
             * implementations of `debug()`.
             */

            function setup(env) {
                createDebug.debug = createDebug
                createDebug.default = createDebug
                createDebug.coerce = coerce
                createDebug.disable = disable
                createDebug.enable = enable
                createDebug.enabled = enabled
                createDebug.humanize = __nccwpck_require__(900)
                createDebug.destroy = destroy

                Object.keys(env).forEach((key) => {
                    createDebug[key] = env[key]
                })

                /**
                 * The currently active debug mode names, and names to skip.
                 */

                createDebug.names = []
                createDebug.skips = []

                /**
                 * Map of special "%n" handling functions, for the debug "format" argument.
                 *
                 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
                 */
                createDebug.formatters = {}

                /**
                 * Selects a color for a debug namespace
                 * @param {String} namespace The namespace string for the for the debug instance to be colored
                 * @return {Number|String} An ANSI color code for the given namespace
                 * @api private
                 */
                function selectColor(namespace) {
                    let hash = 0

                    for (let i = 0; i < namespace.length; i++) {
                        hash = (hash << 5) - hash + namespace.charCodeAt(i)
                        hash |= 0 // Convert to 32bit integer
                    }

                    return createDebug.colors[Math.abs(hash) % createDebug.colors.length]
                }
                createDebug.selectColor = selectColor

                /**
                 * Create a debugger with the given `namespace`.
                 *
                 * @param {String} namespace
                 * @return {Function}
                 * @api public
                 */
                function createDebug(namespace) {
                    let prevTime
                    let enableOverride = null
                    let namespacesCache
                    let enabledCache

                    function debug(...args) {
                        // Disabled?
                        if (!debug.enabled) {
                            return
                        }

                        const self = debug

                        // Set `diff` timestamp
                        const curr = Number(new Date())
                        const ms = curr - (prevTime || curr)
                        self.diff = ms
                        self.prev = prevTime
                        self.curr = curr
                        prevTime = curr

                        args[0] = createDebug.coerce(args[0])

                        if (typeof args[0] !== "string") {
                            // Anything else let's inspect with %O
                            args.unshift("%O")
                        }

                        // Apply any `formatters` transformations
                        let index = 0
                        args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
                            // If we encounter an escaped % then don't increase the array index
                            if (match === "%%") {
                                return "%"
                            }
                            index++
                            const formatter = createDebug.formatters[format]
                            if (typeof formatter === "function") {
                                const val = args[index]
                                match = formatter.call(self, val)

                                // Now we need to remove `args[index]` since it's inlined in the `format`
                                args.splice(index, 1)
                                index--
                            }
                            return match
                        })

                        // Apply env-specific formatting (colors, etc.)
                        createDebug.formatArgs.call(self, args)

                        const logFn = self.log || createDebug.log
                        logFn.apply(self, args)
                    }

                    debug.namespace = namespace
                    debug.useColors = createDebug.useColors()
                    debug.color = createDebug.selectColor(namespace)
                    debug.extend = extend
                    debug.destroy = createDebug.destroy // XXX Temporary. Will be removed in the next major release.

                    Object.defineProperty(debug, "enabled", {
                        enumerable: true,
                        configurable: false,
                        get: () => {
                            if (enableOverride !== null) {
                                return enableOverride
                            }
                            if (namespacesCache !== createDebug.namespaces) {
                                namespacesCache = createDebug.namespaces
                                enabledCache = createDebug.enabled(namespace)
                            }

                            return enabledCache
                        },
                        set: (v) => {
                            enableOverride = v
                        },
                    })

                    // Env-specific initialization logic for debug instances
                    if (typeof createDebug.init === "function") {
                        createDebug.init(debug)
                    }

                    return debug
                }

                function extend(namespace, delimiter) {
                    const newDebug = createDebug(
                        this.namespace +
                            (typeof delimiter === "undefined" ? ":" : delimiter) +
                            namespace,
                    )
                    newDebug.log = this.log
                    return newDebug
                }

                /**
                 * Enables a debug mode by namespaces. This can include modes
                 * separated by a colon and wildcards.
                 *
                 * @param {String} namespaces
                 * @api public
                 */
                function enable(namespaces) {
                    createDebug.save(namespaces)
                    createDebug.namespaces = namespaces

                    createDebug.names = []
                    createDebug.skips = []

                    let i
                    const split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/)
                    const len = split.length

                    for (i = 0; i < len; i++) {
                        if (!split[i]) {
                            // ignore empty strings
                            continue
                        }

                        namespaces = split[i].replace(/\*/g, ".*?")

                        if (namespaces[0] === "-") {
                            createDebug.skips.push(new RegExp("^" + namespaces.substr(1) + "$"))
                        } else {
                            createDebug.names.push(new RegExp("^" + namespaces + "$"))
                        }
                    }
                }

                /**
                 * Disable debug output.
                 *
                 * @return {String} namespaces
                 * @api public
                 */
                function disable() {
                    const namespaces = [
                        ...createDebug.names.map(toNamespace),
                        ...createDebug.skips.map(toNamespace).map((namespace) => "-" + namespace),
                    ].join(",")
                    createDebug.enable("")
                    return namespaces
                }

                /**
                 * Returns true if the given mode name is enabled, false otherwise.
                 *
                 * @param {String} name
                 * @return {Boolean}
                 * @api public
                 */
                function enabled(name) {
                    if (name[name.length - 1] === "*") {
                        return true
                    }

                    let i
                    let len

                    for (i = 0, len = createDebug.skips.length; i < len; i++) {
                        if (createDebug.skips[i].test(name)) {
                            return false
                        }
                    }

                    for (i = 0, len = createDebug.names.length; i < len; i++) {
                        if (createDebug.names[i].test(name)) {
                            return true
                        }
                    }

                    return false
                }

                /**
                 * Convert regexp to namespace
                 *
                 * @param {RegExp} regxep
                 * @return {String} namespace
                 * @api private
                 */
                function toNamespace(regexp) {
                    return regexp
                        .toString()
                        .substring(2, regexp.toString().length - 2)
                        .replace(/\.\*\?$/, "*")
                }

                /**
                 * Coerce `val`.
                 *
                 * @param {Mixed} val
                 * @return {Mixed}
                 * @api private
                 */
                function coerce(val) {
                    if (val instanceof Error) {
                        return val.stack || val.message
                    }
                    return val
                }

                /**
                 * XXX DO NOT USE. This is a temporary stub function.
                 * XXX It WILL be removed in the next major release.
                 */
                function destroy() {
                    console.warn(
                        "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.",
                    )
                }

                createDebug.enable(createDebug.load())

                return createDebug
            }

            module.exports = setup

            /***/
        },

        /***/ 8237: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            /**
             * Detect Electron renderer / nwjs process, which is node, but we should
             * treat as a browser.
             */

            if (
                typeof process === "undefined" ||
                process.type === "renderer" ||
                process.browser === true ||
                process.__nwjs
            ) {
                module.exports = __nccwpck_require__(8222)
            } else {
                module.exports = __nccwpck_require__(5332)
            }

            /***/
        },

        /***/ 5332: /***/ (module, exports, __nccwpck_require__) => {
            /**
             * Module dependencies.
             */

            const tty = __nccwpck_require__(3867)
            const util = __nccwpck_require__(1669)

            /**
             * This is the Node.js implementation of `debug()`.
             */

            exports.init = init
            exports.log = log
            exports.formatArgs = formatArgs
            exports.save = save
            exports.load = load
            exports.useColors = useColors
            exports.destroy = util.deprecate(() => {},
            "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.")

            /**
             * Colors.
             */

            exports.colors = [6, 2, 3, 4, 5, 1]

            try {
                // Optional dependency (as in, doesn't need to be installed, NOT like optionalDependencies in package.json)
                // eslint-disable-next-line import/no-extraneous-dependencies
                const supportsColor = __nccwpck_require__(9318)

                if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
                    exports.colors = [
                        20,
                        21,
                        26,
                        27,
                        32,
                        33,
                        38,
                        39,
                        40,
                        41,
                        42,
                        43,
                        44,
                        45,
                        56,
                        57,
                        62,
                        63,
                        68,
                        69,
                        74,
                        75,
                        76,
                        77,
                        78,
                        79,
                        80,
                        81,
                        92,
                        93,
                        98,
                        99,
                        112,
                        113,
                        128,
                        129,
                        134,
                        135,
                        148,
                        149,
                        160,
                        161,
                        162,
                        163,
                        164,
                        165,
                        166,
                        167,
                        168,
                        169,
                        170,
                        171,
                        172,
                        173,
                        178,
                        179,
                        184,
                        185,
                        196,
                        197,
                        198,
                        199,
                        200,
                        201,
                        202,
                        203,
                        204,
                        205,
                        206,
                        207,
                        208,
                        209,
                        214,
                        215,
                        220,
                        221,
                    ]
                }
            } catch (error) {
                // Swallow - we only care if `supports-color` is available; it doesn't have to be.
            }

            /**
             * Build up the default `inspectOpts` object from the environment variables.
             *
             *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
             */

            exports.inspectOpts = Object.keys(process.env)
                .filter((key) => {
                    return /^debug_/i.test(key)
                })
                .reduce((obj, key) => {
                    // Camel-case
                    const prop = key
                        .substring(6)
                        .toLowerCase()
                        .replace(/_([a-z])/g, (_, k) => {
                            return k.toUpperCase()
                        })

                    // Coerce string value into JS value
                    let val = process.env[key]
                    if (/^(yes|on|true|enabled)$/i.test(val)) {
                        val = true
                    } else if (/^(no|off|false|disabled)$/i.test(val)) {
                        val = false
                    } else if (val === "null") {
                        val = null
                    } else {
                        val = Number(val)
                    }

                    obj[prop] = val
                    return obj
                }, {})

            /**
             * Is stdout a TTY? Colored output is enabled when `true`.
             */

            function useColors() {
                return "colors" in exports.inspectOpts
                    ? Boolean(exports.inspectOpts.colors)
                    : tty.isatty(process.stderr.fd)
            }

            /**
             * Adds ANSI color escape codes if enabled.
             *
             * @api public
             */

            function formatArgs(args) {
                const { namespace: name, useColors } = this

                if (useColors) {
                    const c = this.color
                    const colorCode = "\u001B[3" + (c < 8 ? c : "8;5;" + c)
                    const prefix = `  ${colorCode};1m${name} \u001B[0m`

                    args[0] = prefix + args[0].split("\n").join("\n" + prefix)
                    args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\u001B[0m")
                } else {
                    args[0] = getDate() + name + " " + args[0]
                }
            }

            function getDate() {
                if (exports.inspectOpts.hideDate) {
                    return ""
                }
                return new Date().toISOString() + " "
            }

            /**
             * Invokes `util.format()` with the specified arguments and writes to stderr.
             */

            function log(...args) {
                return process.stderr.write(util.format(...args) + "\n")
            }

            /**
             * Save `namespaces`.
             *
             * @param {String} namespaces
             * @api private
             */
            function save(namespaces) {
                if (namespaces) {
                    process.env.DEBUG = namespaces
                } else {
                    // If you set a process.env field to null or undefined, it gets cast to the
                    // string 'null' or 'undefined'. Just delete instead.
                    delete process.env.DEBUG
                }
            }

            /**
             * Load `namespaces`.
             *
             * @return {String} returns the previously persisted debug modes
             * @api private
             */

            function load() {
                return process.env.DEBUG
            }

            /**
             * Init logic for `debug` instances.
             *
             * Create a new `inspectOpts` object in case `useColors` is set
             * differently for a particular `debug` instance.
             */

            function init(debug) {
                debug.inspectOpts = {}

                const keys = Object.keys(exports.inspectOpts)
                for (let i = 0; i < keys.length; i++) {
                    debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]]
                }
            }

            module.exports = __nccwpck_require__(6243)(exports)

            const { formatters } = module.exports

            /**
             * Map %o to `util.inspect()`, all on a single line.
             */

            formatters.o = function (v) {
                this.inspectOpts.colors = this.useColors
                return util
                    .inspect(v, this.inspectOpts)
                    .split("\n")
                    .map((str) => str.trim())
                    .join(" ")
            }

            /**
             * Map %O to `util.inspect()`, allowing multiple lines if needed.
             */

            formatters.O = function (v) {
                this.inspectOpts.colors = this.useColors
                return util.inspect(v, this.inspectOpts)
            }

            /***/
        },

        /***/ 1133: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            var debug

            module.exports = function () {
                if (!debug) {
                    try {
                        /* eslint global-require: off */
                        debug = __nccwpck_require__(8237)("follow-redirects")
                    } catch (error) {
                        /* */
                    }
                    if (typeof debug !== "function") {
                        debug = function () {
                            /* */
                        }
                    }
                }
                debug.apply(null, arguments)
            }

            /***/
        },

        /***/ 7707: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            var url = __nccwpck_require__(8835)
            var URL = url.URL
            var http = __nccwpck_require__(8605)
            var https = __nccwpck_require__(7211)
            var Writable = __nccwpck_require__(2413).Writable
            var assert = __nccwpck_require__(2357)
            var debug = __nccwpck_require__(1133)

            // Create handlers that pass events from native requests
            var events = ["abort", "aborted", "connect", "error", "socket", "timeout"]
            var eventHandlers = Object.create(null)
            events.forEach(function (event) {
                eventHandlers[event] = function (arg1, arg2, arg3) {
                    this._redirectable.emit(event, arg1, arg2, arg3)
                }
            })

            // Error types with codes
            var RedirectionError = createErrorType("ERR_FR_REDIRECTION_FAILURE", "")
            var TooManyRedirectsError = createErrorType(
                "ERR_FR_TOO_MANY_REDIRECTS",
                "Maximum number of redirects exceeded",
            )
            var MaxBodyLengthExceededError = createErrorType(
                "ERR_FR_MAX_BODY_LENGTH_EXCEEDED",
                "Request body larger than maxBodyLength limit",
            )
            var WriteAfterEndError = createErrorType(
                "ERR_STREAM_WRITE_AFTER_END",
                "write after end",
            )

            // An HTTP(S) request that can be redirected
            function RedirectableRequest(options, responseCallback) {
                // Initialize the request
                Writable.call(this)
                this._sanitizeOptions(options)
                this._options = options
                this._ended = false
                this._ending = false
                this._redirectCount = 0
                this._redirects = []
                this._requestBodyLength = 0
                this._requestBodyBuffers = []

                // Attach a callback if passed
                if (responseCallback) {
                    this.on("response", responseCallback)
                }

                // React to responses of native requests
                var self = this
                this._onNativeResponse = function (response) {
                    self._processResponse(response)
                }

                // Perform the first request
                this._performRequest()
            }
            RedirectableRequest.prototype = Object.create(Writable.prototype)

            RedirectableRequest.prototype.abort = function () {
                abortRequest(this._currentRequest)
                this.emit("abort")
            }

            // Writes buffered data to the current native request
            RedirectableRequest.prototype.write = function (data, encoding, callback) {
                // Writing is not allowed if end has been called
                if (this._ending) {
                    throw new WriteAfterEndError()
                }

                // Validate input and shift parameters if necessary
                if (!(typeof data === "string" || (typeof data === "object" && "length" in data))) {
                    throw new TypeError("data should be a string, Buffer or Uint8Array")
                }
                if (typeof encoding === "function") {
                    callback = encoding
                    encoding = null
                }

                // Ignore empty buffers, since writing them doesn't invoke the callback
                // https://github.com/nodejs/node/issues/22066
                if (data.length === 0) {
                    if (callback) {
                        callback()
                    }
                    return
                }
                // Only write when we don't exceed the maximum body length
                if (this._requestBodyLength + data.length <= this._options.maxBodyLength) {
                    this._requestBodyLength += data.length
                    this._requestBodyBuffers.push({ data: data, encoding: encoding })
                    this._currentRequest.write(data, encoding, callback)
                }
                // Error when we exceed the maximum body length
                else {
                    this.emit("error", new MaxBodyLengthExceededError())
                    this.abort()
                }
            }

            // Ends the current native request
            RedirectableRequest.prototype.end = function (data, encoding, callback) {
                // Shift parameters if necessary
                if (typeof data === "function") {
                    callback = data
                    data = encoding = null
                } else if (typeof encoding === "function") {
                    callback = encoding
                    encoding = null
                }

                // Write data if needed and end
                if (!data) {
                    this._ended = this._ending = true
                    this._currentRequest.end(null, null, callback)
                } else {
                    var self = this
                    var currentRequest = this._currentRequest
                    this.write(data, encoding, function () {
                        self._ended = true
                        currentRequest.end(null, null, callback)
                    })
                    this._ending = true
                }
            }

            // Sets a header value on the current native request
            RedirectableRequest.prototype.setHeader = function (name, value) {
                this._options.headers[name] = value
                this._currentRequest.setHeader(name, value)
            }

            // Clears a header value on the current native request
            RedirectableRequest.prototype.removeHeader = function (name) {
                delete this._options.headers[name]
                this._currentRequest.removeHeader(name)
            }

            // Global timeout for all underlying requests
            RedirectableRequest.prototype.setTimeout = function (msecs, callback) {
                var self = this

                // Destroys the socket on timeout
                function destroyOnTimeout(socket) {
                    socket.setTimeout(msecs)
                    socket.removeListener("timeout", socket.destroy)
                    socket.addListener("timeout", socket.destroy)
                }

                // Sets up a timer to trigger a timeout event
                function startTimer(socket) {
                    if (self._timeout) {
                        clearTimeout(self._timeout)
                    }
                    self._timeout = setTimeout(function () {
                        self.emit("timeout")
                        clearTimer()
                    }, msecs)
                    destroyOnTimeout(socket)
                }

                // Stops a timeout from triggering
                function clearTimer() {
                    if (self._timeout) {
                        clearTimeout(self._timeout)
                        self._timeout = null
                    }
                    if (callback) {
                        self.removeListener("timeout", callback)
                    }
                    if (!self.socket) {
                        self._currentRequest.removeListener("socket", startTimer)
                    }
                }

                // Attach callback if passed
                if (callback) {
                    this.on("timeout", callback)
                }

                // Start the timer if or when the socket is opened
                if (this.socket) {
                    startTimer(this.socket)
                } else {
                    this._currentRequest.once("socket", startTimer)
                }

                // Clean up on events
                this.on("socket", destroyOnTimeout)
                this.once("response", clearTimer)
                this.once("error", clearTimer)

                return this
            }

            // Proxy all other public ClientRequest methods
            ;["flushHeaders", "getHeader", "setNoDelay", "setSocketKeepAlive"].forEach(function (
                method,
            ) {
                RedirectableRequest.prototype[method] = function (a, b) {
                    return this._currentRequest[method](a, b)
                }
            })

            // Proxy all public ClientRequest properties
            ;["aborted", "connection", "socket"].forEach(function (property) {
                Object.defineProperty(RedirectableRequest.prototype, property, {
                    get: function () {
                        return this._currentRequest[property]
                    },
                })
            })

            RedirectableRequest.prototype._sanitizeOptions = function (options) {
                // Ensure headers are always present
                if (!options.headers) {
                    options.headers = {}
                }

                // Since http.request treats host as an alias of hostname,
                // but the url module interprets host as hostname plus port,
                // eliminate the host property to avoid confusion.
                if (options.host) {
                    // Use hostname if set, because it has precedence
                    if (!options.hostname) {
                        options.hostname = options.host
                    }
                    delete options.host
                }

                // Complete the URL object when necessary
                if (!options.pathname && options.path) {
                    var searchPos = options.path.indexOf("?")
                    if (searchPos < 0) {
                        options.pathname = options.path
                    } else {
                        options.pathname = options.path.substring(0, searchPos)
                        options.search = options.path.substring(searchPos)
                    }
                }
            }

            // Executes the next native request (initial or redirect)
            RedirectableRequest.prototype._performRequest = function () {
                // Load the native protocol
                var protocol = this._options.protocol
                var nativeProtocol = this._options.nativeProtocols[protocol]
                if (!nativeProtocol) {
                    this.emit("error", new TypeError("Unsupported protocol " + protocol))
                    return
                }

                // If specified, use the agent corresponding to the protocol
                // (HTTP and HTTPS use different types of agents)
                if (this._options.agents) {
                    var scheme = protocol.substr(0, protocol.length - 1)
                    this._options.agent = this._options.agents[scheme]
                }

                // Create the native request
                var request = (this._currentRequest = nativeProtocol.request(
                    this._options,
                    this._onNativeResponse,
                ))
                this._currentUrl = url.format(this._options)

                // Set up event handlers
                request._redirectable = this
                for (var e = 0; e < events.length; e++) {
                    request.on(events[e], eventHandlers[events[e]])
                }

                // End a redirected request
                // (The first request must be ended explicitly with RedirectableRequest#end)
                if (this._isRedirect) {
                    // Write the request entity and end.
                    var i = 0
                    var self = this
                    var buffers = this._requestBodyBuffers
                    ;(function writeNext(error) {
                        // Only write if this request has not been redirected yet
                        /* istanbul ignore else */
                        if (request === self._currentRequest) {
                            // Report any write errors
                            /* istanbul ignore if */
                            if (error) {
                                self.emit("error", error)
                            }
                            // Write the next buffer if there are still left
                            else if (i < buffers.length) {
                                var buffer = buffers[i++]
                                /* istanbul ignore else */
                                if (!request.finished) {
                                    request.write(buffer.data, buffer.encoding, writeNext)
                                }
                            }
                            // End the request if `end` has been called on us
                            else if (self._ended) {
                                request.end()
                            }
                        }
                    })()
                }
            }

            // Processes a response from the current native request
            RedirectableRequest.prototype._processResponse = function (response) {
                // Store the redirected response
                var statusCode = response.statusCode
                if (this._options.trackRedirects) {
                    this._redirects.push({
                        url: this._currentUrl,
                        headers: response.headers,
                        statusCode: statusCode,
                    })
                }

                // RFC7231§6.4: The 3xx (Redirection) class of status code indicates
                // that further action needs to be taken by the user agent in order to
                // fulfill the request. If a Location header field is provided,
                // the user agent MAY automatically redirect its request to the URI
                // referenced by the Location field value,
                // even if the specific status code is not understood.
                var location = response.headers.location
                if (
                    location &&
                    this._options.followRedirects !== false &&
                    statusCode >= 300 &&
                    statusCode < 400
                ) {
                    // Abort the current request
                    abortRequest(this._currentRequest)
                    // Discard the remainder of the response to avoid waiting for data
                    response.destroy()

                    // RFC7231§6.4: A client SHOULD detect and intervene
                    // in cyclical redirections (i.e., "infinite" redirection loops).
                    if (++this._redirectCount > this._options.maxRedirects) {
                        this.emit("error", new TooManyRedirectsError())
                        return
                    }

                    // RFC7231§6.4: Automatic redirection needs to done with
                    // care for methods not known to be safe, […]
                    // RFC7231§6.4.2–3: For historical reasons, a user agent MAY change
                    // the request method from POST to GET for the subsequent request.
                    if (
                        ((statusCode === 301 || statusCode === 302) &&
                            this._options.method === "POST") ||
                        // RFC7231§6.4.4: The 303 (See Other) status code indicates that
                        // the server is redirecting the user agent to a different resource […]
                        // A user agent can perform a retrieval request targeting that URI
                        // (a GET or HEAD request if using HTTP) […]
                        (statusCode === 303 && !/^(?:GET|HEAD)$/.test(this._options.method))
                    ) {
                        this._options.method = "GET"
                        // Drop a possible entity and headers related to it
                        this._requestBodyBuffers = []
                        removeMatchingHeaders(/^content-/i, this._options.headers)
                    }

                    // Drop the Host header, as the redirect might lead to a different host
                    var previousHostName =
                        removeMatchingHeaders(/^host$/i, this._options.headers) ||
                        url.parse(this._currentUrl).hostname

                    // Create the redirected request
                    var redirectUrl = url.resolve(this._currentUrl, location)
                    debug("redirecting to", redirectUrl)
                    this._isRedirect = true
                    var redirectUrlParts = url.parse(redirectUrl)
                    Object.assign(this._options, redirectUrlParts)

                    // Drop the Authorization header if redirecting to another host
                    if (redirectUrlParts.hostname !== previousHostName) {
                        removeMatchingHeaders(/^authorization$/i, this._options.headers)
                    }

                    // Evaluate the beforeRedirect callback
                    if (typeof this._options.beforeRedirect === "function") {
                        var responseDetails = { headers: response.headers }
                        try {
                            this._options.beforeRedirect.call(null, this._options, responseDetails)
                        } catch (err) {
                            this.emit("error", err)
                            return
                        }
                        this._sanitizeOptions(this._options)
                    }

                    // Perform the redirected request
                    try {
                        this._performRequest()
                    } catch (cause) {
                        var error = new RedirectionError(
                            "Redirected request failed: " + cause.message,
                        )
                        error.cause = cause
                        this.emit("error", error)
                    }
                } else {
                    // The response is not a redirect; return it as-is
                    response.responseUrl = this._currentUrl
                    response.redirects = this._redirects
                    this.emit("response", response)

                    // Clean up
                    this._requestBodyBuffers = []
                }
            }

            // Wraps the key/value object of protocols with redirect functionality
            function wrap(protocols) {
                // Default settings
                var exports = {
                    maxRedirects: 21,
                    maxBodyLength: 10 * 1024 * 1024,
                }

                // Wrap each protocol
                var nativeProtocols = {}
                Object.keys(protocols).forEach(function (scheme) {
                    var protocol = scheme + ":"
                    var nativeProtocol = (nativeProtocols[protocol] = protocols[scheme])
                    var wrappedProtocol = (exports[scheme] = Object.create(nativeProtocol))

                    // Executes a request, following redirects
                    function request(input, options, callback) {
                        // Parse parameters
                        if (typeof input === "string") {
                            var urlStr = input
                            try {
                                input = urlToOptions(new URL(urlStr))
                            } catch (err) {
                                /* istanbul ignore next */
                                input = url.parse(urlStr)
                            }
                        } else if (URL && input instanceof URL) {
                            input = urlToOptions(input)
                        } else {
                            callback = options
                            options = input
                            input = { protocol: protocol }
                        }
                        if (typeof options === "function") {
                            callback = options
                            options = null
                        }

                        // Set defaults
                        options = Object.assign(
                            {
                                maxRedirects: exports.maxRedirects,
                                maxBodyLength: exports.maxBodyLength,
                            },
                            input,
                            options,
                        )
                        options.nativeProtocols = nativeProtocols

                        assert.equal(options.protocol, protocol, "protocol mismatch")
                        debug("options", options)
                        return new RedirectableRequest(options, callback)
                    }

                    // Executes a GET request, following redirects
                    function get(input, options, callback) {
                        var wrappedRequest = wrappedProtocol.request(input, options, callback)
                        wrappedRequest.end()
                        return wrappedRequest
                    }

                    // Expose the properties on the wrapped protocol
                    Object.defineProperties(wrappedProtocol, {
                        request: {
                            value: request,
                            configurable: true,
                            enumerable: true,
                            writable: true,
                        },
                        get: { value: get, configurable: true, enumerable: true, writable: true },
                    })
                })
                return exports
            }

            /* istanbul ignore next */
            function noop() {
                /* empty */
            }

            // from https://github.com/nodejs/node/blob/master/lib/internal/url.js
            function urlToOptions(urlObject) {
                var options = {
                    protocol: urlObject.protocol,
                    hostname: urlObject.hostname.startsWith("[")
                        ? /* istanbul ignore next */
                          urlObject.hostname.slice(1, -1)
                        : urlObject.hostname,
                    hash: urlObject.hash,
                    search: urlObject.search,
                    pathname: urlObject.pathname,
                    path: urlObject.pathname + urlObject.search,
                    href: urlObject.href,
                }
                if (urlObject.port !== "") {
                    options.port = Number(urlObject.port)
                }
                return options
            }

            function removeMatchingHeaders(regex, headers) {
                var lastValue
                for (var header in headers) {
                    if (regex.test(header)) {
                        lastValue = headers[header]
                        delete headers[header]
                    }
                }
                return lastValue
            }

            function createErrorType(code, defaultMessage) {
                function CustomError(message) {
                    Error.captureStackTrace(this, this.constructor)
                    this.message = message || defaultMessage
                }
                CustomError.prototype = new Error()
                CustomError.prototype.constructor = CustomError
                CustomError.prototype.name = "Error [" + code + "]"
                CustomError.prototype.code = code
                return CustomError
            }

            function abortRequest(request) {
                for (var e = 0; e < events.length; e++) {
                    request.removeListener(events[e], eventHandlers[events[e]])
                }
                request.on("error", noop)
                request.abort()
            }

            // Exports
            module.exports = wrap({ http: http, https: https })
            module.exports.wrap = wrap

            /***/
        },

        /***/ 4766: /***/ (__unused_webpack_module, exports, __nccwpck_require__) => {
            "use strict"

            Object.defineProperty(exports, "__esModule", { value: true })
            exports.getApplicativeComposition = exports.getApplicativeMonoid = void 0
            /**
             * The `Applicative` type class extends the `Apply` type class with a `of` function, which can be used to create values
             * of type `f a` from values of type `a`.
             *
             * Where `Apply` provides the ability to lift functions of two or more arguments to functions whose arguments are
             * wrapped using `f`, and `Functor` provides the ability to lift functions of one argument, `pure` can be seen as the
             * function which lifts functions of _zero_ arguments. That is, `Applicative` functors support a lifting operation for
             * any number of function arguments.
             *
             * Instances must satisfy the following laws in addition to the `Apply` laws:
             *
             * 1. Identity: `A.ap(A.of(a => a), fa) <-> fa`
             * 2. Homomorphism: `A.ap(A.of(ab), A.of(a)) <-> A.of(ab(a))`
             * 3. Interchange: `A.ap(fab, A.of(a)) <-> A.ap(A.of(ab => ab(a)), fab)`
             *
             * Note. `Functor`'s `map` can be derived: `A.map(x, f) = A.ap(A.of(f), x)`
             *
             * @since 2.0.0
             */
            var Apply_1 = __nccwpck_require__(205)
            var function_1 = __nccwpck_require__(6985)
            var Functor_1 = __nccwpck_require__(5533)
            function getApplicativeMonoid(F) {
                var f = Apply_1.getApplySemigroup(F)
                return function (M) {
                    return {
                        concat: f(M).concat,
                        empty: F.of(M.empty),
                    }
                }
            }
            exports.getApplicativeMonoid = getApplicativeMonoid
            /** @deprecated */
            function getApplicativeComposition(F, G) {
                var map = Functor_1.getFunctorComposition(F, G).map
                var _ap = Apply_1.ap(F, G)
                return {
                    map: map,
                    of: function (a) {
                        return F.of(G.of(a))
                    },
                    ap: function (fgab, fga) {
                        return function_1.pipe(fgab, _ap(fga))
                    },
                }
            }
            exports.getApplicativeComposition = getApplicativeComposition

            /***/
        },

        /***/ 205: /***/ (__unused_webpack_module, exports, __nccwpck_require__) => {
            "use strict"

            Object.defineProperty(exports, "__esModule", { value: true })
            exports.sequenceS = exports.sequenceT = exports.getApplySemigroup = exports.apS = exports.apSecond = exports.apFirst = exports.ap = void 0
            var function_1 = __nccwpck_require__(6985)
            function ap(F, G) {
                return function (fa) {
                    return function (fab) {
                        return F.ap(
                            F.map(fab, function (gab) {
                                return function (ga) {
                                    return G.ap(gab, ga)
                                }
                            }),
                            fa,
                        )
                    }
                }
            }
            exports.ap = ap
            function apFirst(A) {
                return function (second) {
                    return function (first) {
                        return A.ap(
                            A.map(first, function (a) {
                                return function () {
                                    return a
                                }
                            }),
                            second,
                        )
                    }
                }
            }
            exports.apFirst = apFirst
            function apSecond(A) {
                return function (second) {
                    return function (first) {
                        return A.ap(
                            A.map(first, function () {
                                return function (b) {
                                    return b
                                }
                            }),
                            second,
                        )
                    }
                }
            }
            exports.apSecond = apSecond
            function apS(F) {
                return function (name, fb) {
                    return function (fa) {
                        return F.ap(
                            F.map(fa, function (a) {
                                return function (b) {
                                    var _a
                                    return Object.assign({}, a, ((_a = {}), (_a[name] = b), _a))
                                }
                            }),
                            fb,
                        )
                    }
                }
            }
            exports.apS = apS
            function getApplySemigroup(F) {
                return function (S) {
                    return {
                        concat: function (first, second) {
                            return F.ap(
                                F.map(first, function (x) {
                                    return function (y) {
                                        return S.concat(x, y)
                                    }
                                }),
                                second,
                            )
                        },
                    }
                }
            }
            exports.getApplySemigroup = getApplySemigroup
            function curried(f, n, acc) {
                return function (x) {
                    var combined = Array(acc.length + 1)
                    for (var i = 0; i < acc.length; i++) {
                        combined[i] = acc[i]
                    }
                    combined[acc.length] = x
                    return n === 0 ? f.apply(null, combined) : curried(f, n - 1, combined)
                }
            }
            var tupleConstructors = {
                1: function (a) {
                    return [a]
                },
                2: function (a) {
                    return function (b) {
                        return [a, b]
                    }
                },
                3: function (a) {
                    return function (b) {
                        return function (c) {
                            return [a, b, c]
                        }
                    }
                },
                4: function (a) {
                    return function (b) {
                        return function (c) {
                            return function (d) {
                                return [a, b, c, d]
                            }
                        }
                    }
                },
                5: function (a) {
                    return function (b) {
                        return function (c) {
                            return function (d) {
                                return function (e) {
                                    return [a, b, c, d, e]
                                }
                            }
                        }
                    }
                },
            }
            function getTupleConstructor(len) {
                if (!tupleConstructors.hasOwnProperty(len)) {
                    tupleConstructors[len] = curried(function_1.tuple, len - 1, [])
                }
                return tupleConstructors[len]
            }
            function sequenceT(F) {
                return function () {
                    var args = []
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i]
                    }
                    var len = args.length
                    var f = getTupleConstructor(len)
                    var fas = F.map(args[0], f)
                    for (var i = 1; i < len; i++) {
                        fas = F.ap(fas, args[i])
                    }
                    return fas
                }
            }
            exports.sequenceT = sequenceT
            function getRecordConstructor(keys) {
                var len = keys.length
                switch (len) {
                    case 1:
                        return function (a) {
                            var _a
                            return (_a = {}), (_a[keys[0]] = a), _a
                        }
                    case 2:
                        return function (a) {
                            return function (b) {
                                var _a
                                return (_a = {}), (_a[keys[0]] = a), (_a[keys[1]] = b), _a
                            }
                        }
                    case 3:
                        return function (a) {
                            return function (b) {
                                return function (c) {
                                    var _a
                                    return (
                                        (_a = {}),
                                        (_a[keys[0]] = a),
                                        (_a[keys[1]] = b),
                                        (_a[keys[2]] = c),
                                        _a
                                    )
                                }
                            }
                        }
                    case 4:
                        return function (a) {
                            return function (b) {
                                return function (c) {
                                    return function (d) {
                                        var _a
                                        return (
                                            (_a = {}),
                                            (_a[keys[0]] = a),
                                            (_a[keys[1]] = b),
                                            (_a[keys[2]] = c),
                                            (_a[keys[3]] = d),
                                            _a
                                        )
                                    }
                                }
                            }
                        }
                    case 5:
                        return function (a) {
                            return function (b) {
                                return function (c) {
                                    return function (d) {
                                        return function (e) {
                                            var _a
                                            return (
                                                (_a = {}),
                                                (_a[keys[0]] = a),
                                                (_a[keys[1]] = b),
                                                (_a[keys[2]] = c),
                                                (_a[keys[3]] = d),
                                                (_a[keys[4]] = e),
                                                _a
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    default:
                        return curried(
                            function () {
                                var args = []
                                for (var _i = 0; _i < arguments.length; _i++) {
                                    args[_i] = arguments[_i]
                                }
                                var r = {}
                                for (var i = 0; i < len; i++) {
                                    r[keys[i]] = args[i]
                                }
                                return r
                            },
                            len - 1,
                            [],
                        )
                }
            }
            function sequenceS(F) {
                return function (r) {
                    var keys = Object.keys(r)
                    var len = keys.length
                    var f = getRecordConstructor(keys)
                    var fr = F.map(r[keys[0]], f)
                    for (var i = 1; i < len; i++) {
                        fr = F.ap(fr, r[keys[i]])
                    }
                    return fr
                }
            }
            exports.sequenceS = sequenceS

            /***/
        },

        /***/ 3834: /***/ function (__unused_webpack_module, exports, __nccwpck_require__) {
            "use strict"

            var __createBinding =
                (this && this.__createBinding) ||
                (Object.create
                    ? function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          Object.defineProperty(o, k2, {
                              enumerable: true,
                              get: function () {
                                  return m[k]
                              },
                          })
                      }
                    : function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          o[k2] = m[k]
                      })
            var __setModuleDefault =
                (this && this.__setModuleDefault) ||
                (Object.create
                    ? function (o, v) {
                          Object.defineProperty(o, "default", { enumerable: true, value: v })
                      }
                    : function (o, v) {
                          o["default"] = v
                      })
            var __importStar =
                (this && this.__importStar) ||
                function (mod) {
                    if (mod && mod.__esModule) return mod
                    var result = {}
                    if (mod != null)
                        for (var k in mod)
                            if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
                                __createBinding(result, mod, k)
                    __setModuleDefault(result, mod)
                    return result
                }
            Object.defineProperty(exports, "__esModule", { value: true })
            exports.lefts = exports.rights = exports.reverse = exports.modifyAt = exports.deleteAt = exports.updateAt = exports.insertAt = exports.copy = exports.findLastIndex = exports.findLastMap = exports.findLast = exports.findFirstMap = exports.findFirst = exports.findIndex = exports.dropLeftWhile = exports.dropRight = exports.dropLeft = exports.spanLeft = exports.takeLeftWhile = exports.takeRight = exports.takeLeft = exports.init = exports.tail = exports.last = exports.head = exports.lookup = exports.isOutOfBound = exports.size = exports.scanRight = exports.scanLeft = exports.chainWithIndex = exports.foldRight = exports.matchRight = exports.matchRightW = exports.foldLeft = exports.matchLeft = exports.matchLeftW = exports.match = exports.matchW = exports.fromEither = exports.fromOption = exports.fromPredicate = exports.replicate = exports.makeBy = exports.appendW = exports.append = exports.prependW = exports.prepend = exports.isNonEmpty = exports.isEmpty = void 0
            exports.traverseWithIndex = exports.sequence = exports.traverse = exports.reduceRightWithIndex = exports.reduceRight = exports.reduceWithIndex = exports.reduce = exports.foldMapWithIndex = exports.foldMap = exports.duplicate = exports.extend = exports.filterWithIndex = exports.alt = exports.altW = exports.partitionMapWithIndex = exports.partitionMap = exports.partitionWithIndex = exports.partition = exports.filter = exports.separate = exports.compact = exports.filterMap = exports.filterMapWithIndex = exports.mapWithIndex = exports.flatten = exports.chain = exports.ap = exports.map = exports.zero = exports.of = exports.difference = exports.intersection = exports.union = exports.concat = exports.concatW = exports.comprehension = exports.fromOptionK = exports.chunksOf = exports.splitAt = exports.chop = exports.sortBy = exports.uniq = exports.elem = exports.rotate = exports.intersperse = exports.prependAll = exports.unzip = exports.zip = exports.zipWith = exports.sort = void 0
            exports.some = exports.every = exports.unsafeDeleteAt = exports.unsafeUpdateAt = exports.unsafeInsertAt = exports.fromEitherK = exports.FromEither = exports.filterE = exports.ChainRecBreadthFirst = exports.chainRecBreadthFirst = exports.ChainRecDepthFirst = exports.chainRecDepthFirst = exports.Witherable = exports.TraversableWithIndex = exports.Traversable = exports.FoldableWithIndex = exports.Foldable = exports.FilterableWithIndex = exports.Filterable = exports.Compactable = exports.Extend = exports.Alternative = exports.guard = exports.Zero = exports.Alt = exports.Unfoldable = exports.Monad = exports.chainFirst = exports.Chain = exports.Applicative = exports.apSecond = exports.apFirst = exports.Apply = exports.FunctorWithIndex = exports.Pointed = exports.flap = exports.Functor = exports.getDifferenceMagma = exports.getIntersectionSemigroup = exports.getUnionMonoid = exports.getUnionSemigroup = exports.getOrd = exports.getEq = exports.getMonoid = exports.getSemigroup = exports.getShow = exports.URI = exports.unfold = exports.wilt = exports.wither = void 0
            exports.array = exports.prependToAll = exports.snoc = exports.cons = exports.empty = exports.range = exports.apS = exports.bind = exports.bindTo = exports.Do = exports.exists = void 0
            var Apply_1 = __nccwpck_require__(205)
            var Chain_1 = __nccwpck_require__(2372)
            var FromEither_1 = __nccwpck_require__(1964)
            var function_1 = __nccwpck_require__(6985)
            var Functor_1 = __nccwpck_require__(5533)
            var _ = __importStar(__nccwpck_require__(1840))
            var NEA = __importStar(__nccwpck_require__(240))
            var RA = __importStar(__nccwpck_require__(4234))
            var Separated_1 = __nccwpck_require__(5877)
            var Witherable_1 = __nccwpck_require__(4384)
            var Zero_1 = __nccwpck_require__(9734)
            // -------------------------------------------------------------------------------------
            // refinements
            // -------------------------------------------------------------------------------------
            /**
             * Test whether an array is empty
             *
             * @example
             * import { isEmpty } from 'fp-ts/Array'
             *
             * assert.strictEqual(isEmpty([]), true)
             *
             * @category refinements
             * @since 2.0.0
             */
            var isEmpty = function (as) {
                return as.length === 0
            }
            exports.isEmpty = isEmpty
            /**
             * Test whether an array is non empty narrowing down the type to `NonEmptyArray<A>`
             *
             * @category refinements
             * @since 2.0.0
             */
            exports.isNonEmpty = NEA.isNonEmpty
            // -------------------------------------------------------------------------------------
            // constructors
            // -------------------------------------------------------------------------------------
            /**
             * Prepend an element to the front of a `Array`, creating a new `NonEmptyArray`.
             *
             * @example
             * import { prepend } from 'fp-ts/Array'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(pipe([2, 3, 4], prepend(1)), [1, 2, 3, 4])
             *
             * @category constructors
             * @since 2.10.0
             */
            exports.prepend = NEA.prepend
            /**
             * Less strict version of [`prepend`](#prepend).
             *
             * @category constructors
             * @since 2.11.0
             */
            exports.prependW = NEA.prependW
            /**
             * Append an element to the end of a `Array`, creating a new `NonEmptyArray`.
             *
             * @example
             * import { append } from 'fp-ts/Array'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(pipe([1, 2, 3], append(4)), [1, 2, 3, 4])
             *
             * @category constructors
             * @since 2.10.0
             */
            exports.append = NEA.append
            /**
             * Less strict version of [`append`](#append).
             *
             * @category constructors
             * @since 2.11.0
             */
            exports.appendW = NEA.appendW
            /**
             * Return a `Array` of length `n` with element `i` initialized with `f(i)`.
             *
             * **Note**. `n` is normalized to a non negative integer.
             *
             * @example
             * import { makeBy } from 'fp-ts/Array'
             *
             * const double = (n: number): number => n * 2
             * assert.deepStrictEqual(makeBy(5, double), [0, 2, 4, 6, 8])
             *
             * @category constructors
             * @since 2.0.0
             */
            var makeBy = function (n, f) {
                return n <= 0 ? [] : NEA.makeBy(f)(n)
            }
            exports.makeBy = makeBy
            /**
             * Create a `Array` containing a value repeated the specified number of times.
             *
             * **Note**. `n` is normalized to a non negative integer.
             *
             * @example
             * import { replicate } from 'fp-ts/Array'
             *
             * assert.deepStrictEqual(replicate(3, 'a'), ['a', 'a', 'a'])
             *
             * @category constructors
             * @since 2.0.0
             */
            var replicate = function (n, a) {
                return exports.makeBy(n, function () {
                    return a
                })
            }
            exports.replicate = replicate
            function fromPredicate(predicate) {
                return function (a) {
                    return predicate(a) ? [a] : []
                }
            }
            exports.fromPredicate = fromPredicate
            // -------------------------------------------------------------------------------------
            // natural transformations
            // -------------------------------------------------------------------------------------
            /**
             * @category natural transformations
             * @since 2.11.0
             */
            var fromOption = function (ma) {
                return _.isNone(ma) ? [] : [ma.value]
            }
            exports.fromOption = fromOption
            /**
             * @category natural transformations
             * @since 2.11.0
             */
            var fromEither = function (e) {
                return _.isLeft(e) ? [] : [e.right]
            }
            exports.fromEither = fromEither
            // -------------------------------------------------------------------------------------
            // destructors
            // -------------------------------------------------------------------------------------
            /**
             * Less strict version of [`match`](#match).
             *
             * @category destructors
             * @since 2.11.0
             */
            var matchW = function (onEmpty, onNonEmpty) {
                return function (as) {
                    return exports.isNonEmpty(as) ? onNonEmpty(as) : onEmpty()
                }
            }
            exports.matchW = matchW
            /**
             * Less strict version of [`match`](#match).
             *
             * @category destructors
             * @since 2.11.0
             */
            exports.match = exports.matchW
            /**
             * Less strict version of [`matchLeft`](#matchleft).
             *
             * @category destructors
             * @since 2.11.0
             */
            var matchLeftW = function (onEmpty, onNonEmpty) {
                return function (as) {
                    return exports.isNonEmpty(as)
                        ? onNonEmpty(NEA.head(as), NEA.tail(as))
                        : onEmpty()
                }
            }
            exports.matchLeftW = matchLeftW
            /**
             * Break an `Array` into its first element and remaining elements.
             *
             * @example
             * import { matchLeft } from 'fp-ts/Array'
             *
             * const len: <A>(as: Array<A>) => number = matchLeft(() => 0, (_, tail) => 1 + len(tail))
             * assert.strictEqual(len([1, 2, 3]), 3)
             *
             * @category destructors
             * @since 2.10.0
             */
            exports.matchLeft = exports.matchLeftW
            /**
             * Alias of [`matchLeft`](#matchleft).
             *
             * @category destructors
             * @since 2.0.0
             */
            exports.foldLeft = exports.matchLeft
            /**
             * Less strict version of [`matchRight`](#matchright).
             *
             * @category destructors
             * @since 2.11.0
             */
            var matchRightW = function (onEmpty, onNonEmpty) {
                return function (as) {
                    return exports.isNonEmpty(as)
                        ? onNonEmpty(NEA.init(as), NEA.last(as))
                        : onEmpty()
                }
            }
            exports.matchRightW = matchRightW
            /**
             * Break an `Array` into its initial elements and the last element.
             *
             * @category destructors
             * @since 2.10.0
             */
            exports.matchRight = exports.matchRightW
            /**
             * Alias of [`matchRight`](#matchright).
             *
             * @category destructors
             * @since 2.0.0
             */
            exports.foldRight = exports.matchRight
            // -------------------------------------------------------------------------------------
            // combinators
            // -------------------------------------------------------------------------------------
            /**
             * @category combinators
             * @since 2.7.0
             */
            var chainWithIndex = function (f) {
                return function (as) {
                    var out = []
                    for (var i = 0; i < as.length; i++) {
                        out.push.apply(out, f(i, as[i]))
                    }
                    return out
                }
            }
            exports.chainWithIndex = chainWithIndex
            /**
             * Same as `reduce` but it carries over the intermediate steps
             *
             * @example
             * import { scanLeft } from 'fp-ts/Array'
             *
             * assert.deepStrictEqual(scanLeft(10, (b, a: number) => b - a)([1, 2, 3]), [10, 9, 7, 4])
             *
             * @category combinators
             * @since 2.0.0
             */
            var scanLeft = function (b, f) {
                return function (as) {
                    var len = as.length
                    var out = new Array(len + 1)
                    out[0] = b
                    for (var i = 0; i < len; i++) {
                        out[i + 1] = f(out[i], as[i])
                    }
                    return out
                }
            }
            exports.scanLeft = scanLeft
            /**
             * Fold an array from the right, keeping all intermediate results instead of only the final result
             *
             * @example
             * import { scanRight } from 'fp-ts/Array'
             *
             * assert.deepStrictEqual(scanRight(10, (a: number, b) => b - a)([1, 2, 3]), [4, 5, 7, 10])
             *
             * @category combinators
             * @since 2.0.0
             */
            var scanRight = function (b, f) {
                return function (as) {
                    var len = as.length
                    var out = new Array(len + 1)
                    out[len] = b
                    for (var i = len - 1; i >= 0; i--) {
                        out[i] = f(as[i], out[i + 1])
                    }
                    return out
                }
            }
            exports.scanRight = scanRight
            /**
             * Calculate the number of elements in a `Array`.
             *
             * @since 2.10.0
             */
            var size = function (as) {
                return as.length
            }
            exports.size = size
            /**
             * Test whether an array contains a particular index
             *
             * @since 2.0.0
             */
            exports.isOutOfBound = NEA.isOutOfBound
            // TODO: remove non-curried overloading in v3
            /**
             * This function provides a safe way to read a value at a particular index from an array
             *
             * @example
             * import { lookup } from 'fp-ts/Array'
             * import { some, none } from 'fp-ts/Option'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(pipe([1, 2, 3], lookup(1)), some(2))
             * assert.deepStrictEqual(pipe([1, 2, 3], lookup(3)), none)
             *
             * @since 2.0.0
             */
            exports.lookup = RA.lookup
            /**
             * Get the first element in an array, or `None` if the array is empty
             *
             * @example
             * import { head } from 'fp-ts/Array'
             * import { some, none } from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(head([1, 2, 3]), some(1))
             * assert.deepStrictEqual(head([]), none)
             *
             * @category destructors
             * @since 2.0.0
             */
            exports.head = RA.head
            /**
             * Get the last element in an array, or `None` if the array is empty
             *
             * @example
             * import { last } from 'fp-ts/Array'
             * import { some, none } from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(last([1, 2, 3]), some(3))
             * assert.deepStrictEqual(last([]), none)
             *
             * @category destructors
             * @since 2.0.0
             */
            exports.last = RA.last
            /**
             * Get all but the first element of an array, creating a new array, or `None` if the array is empty
             *
             * @example
             * import { tail } from 'fp-ts/Array'
             * import { some, none } from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(tail([1, 2, 3]), some([2, 3]))
             * assert.deepStrictEqual(tail([]), none)
             *
             * @category destructors
             * @since 2.0.0
             */
            var tail = function (as) {
                return exports.isNonEmpty(as) ? _.some(NEA.tail(as)) : _.none
            }
            exports.tail = tail
            /**
             * Get all but the last element of an array, creating a new array, or `None` if the array is empty
             *
             * @example
             * import { init } from 'fp-ts/Array'
             * import { some, none } from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(init([1, 2, 3]), some([1, 2]))
             * assert.deepStrictEqual(init([]), none)
             *
             * @category destructors
             * @since 2.0.0
             */
            var init = function (as) {
                return exports.isNonEmpty(as) ? _.some(NEA.init(as)) : _.none
            }
            exports.init = init
            /**
             * Keep only a max number of elements from the start of an `Array`, creating a new `Array`.
             *
             * **Note**. `n` is normalized to a non negative integer.
             *
             * @example
             * import { takeLeft } from 'fp-ts/Array'
             *
             * assert.deepStrictEqual(takeLeft(2)([1, 2, 3]), [1, 2])
             *
             * @category combinators
             * @since 2.0.0
             */
            var takeLeft = function (n) {
                return function (as) {
                    return exports.isOutOfBound(n, as) ? exports.copy(as) : as.slice(0, n)
                }
            }
            exports.takeLeft = takeLeft
            /**
             * Keep only a max number of elements from the end of an `Array`, creating a new `Array`.
             *
             * **Note**. `n` is normalized to a non negative integer.
             *
             * @example
             * import { takeRight } from 'fp-ts/Array'
             *
             * assert.deepStrictEqual(takeRight(2)([1, 2, 3, 4, 5]), [4, 5])
             *
             * @category combinators
             * @since 2.0.0
             */
            var takeRight = function (n) {
                return function (as) {
                    return exports.isOutOfBound(n, as)
                        ? exports.copy(as)
                        : n === 0
                        ? []
                        : as.slice(-n)
                }
            }
            exports.takeRight = takeRight
            function takeLeftWhile(predicate) {
                return function (as) {
                    var out = []
                    for (var _i = 0, as_1 = as; _i < as_1.length; _i++) {
                        var a = as_1[_i]
                        if (!predicate(a)) {
                            break
                        }
                        out.push(a)
                    }
                    return out
                }
            }
            exports.takeLeftWhile = takeLeftWhile
            var spanLeftIndex = function (as, predicate) {
                var l = as.length
                var i = 0
                for (; i < l; i++) {
                    if (!predicate(as[i])) {
                        break
                    }
                }
                return i
            }
            function spanLeft(predicate) {
                return function (as) {
                    var _a = exports.splitAt(spanLeftIndex(as, predicate))(as),
                        init = _a[0],
                        rest = _a[1]
                    return { init: init, rest: rest }
                }
            }
            exports.spanLeft = spanLeft
            /**
             * Drop a max number of elements from the start of an `Array`, creating a new `Array`.
             *
             * **Note**. `n` is normalized to a non negative integer.
             *
             * @example
             * import { dropLeft } from 'fp-ts/Array'
             *
             * assert.deepStrictEqual(dropLeft(2)([1, 2, 3]), [3])
             *
             * @category combinators
             * @since 2.0.0
             */
            var dropLeft = function (n) {
                return function (as) {
                    return n <= 0 || exports.isEmpty(as)
                        ? exports.copy(as)
                        : n >= as.length
                        ? []
                        : as.slice(n, as.length)
                }
            }
            exports.dropLeft = dropLeft
            /**
             * Drop a max number of elements from the end of an `Array`, creating a new `Array`.
             *
             * **Note**. `n` is normalized to a non negative integer.
             *
             * @example
             * import { dropRight } from 'fp-ts/Array'
             *
             * assert.deepStrictEqual(dropRight(2)([1, 2, 3, 4, 5]), [1, 2, 3])
             *
             * @category combinators
             * @since 2.0.0
             */
            var dropRight = function (n) {
                return function (as) {
                    return n <= 0 || exports.isEmpty(as)
                        ? exports.copy(as)
                        : n >= as.length
                        ? []
                        : as.slice(0, as.length - n)
                }
            }
            exports.dropRight = dropRight
            function dropLeftWhile(predicate) {
                return function (as) {
                    return as.slice(spanLeftIndex(as, predicate))
                }
            }
            exports.dropLeftWhile = dropLeftWhile
            /**
             * Find the first index for which a predicate holds
             *
             * @example
             * import { findIndex } from 'fp-ts/Array'
             * import { some, none } from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(findIndex((n: number) => n === 2)([1, 2, 3]), some(1))
             * assert.deepStrictEqual(findIndex((n: number) => n === 2)([]), none)
             *
             * @since 2.0.0
             */
            exports.findIndex = RA.findIndex
            function findFirst(predicate) {
                return RA.findFirst(predicate)
            }
            exports.findFirst = findFirst
            /**
             * Find the first element returned by an option based selector function
             *
             * @example
             * import { findFirstMap } from 'fp-ts/Array'
             * import { some, none } from 'fp-ts/Option'
             *
             * interface Person {
             *   readonly name: string
             *   readonly age?: number
             * }
             *
             * const persons: Array<Person> = [{ name: 'John' }, { name: 'Mary', age: 45 }, { name: 'Joey', age: 28 }]
             *
             * // returns the name of the first person that has an age
             * assert.deepStrictEqual(findFirstMap((p: Person) => (p.age === undefined ? none : some(p.name)))(persons), some('Mary'))
             *
             * @category destructors
             * @since 2.0.0
             */
            exports.findFirstMap = RA.findFirstMap
            function findLast(predicate) {
                return RA.findLast(predicate)
            }
            exports.findLast = findLast
            /**
             * Find the last element returned by an option based selector function
             *
             * @example
             * import { findLastMap } from 'fp-ts/Array'
             * import { some, none } from 'fp-ts/Option'
             *
             * interface Person {
             *   readonly name: string
             *   readonly age?: number
             * }
             *
             * const persons: Array<Person> = [{ name: 'John' }, { name: 'Mary', age: 45 }, { name: 'Joey', age: 28 }]
             *
             * // returns the name of the last person that has an age
             * assert.deepStrictEqual(findLastMap((p: Person) => (p.age === undefined ? none : some(p.name)))(persons), some('Joey'))
             *
             * @category destructors
             * @since 2.0.0
             */
            exports.findLastMap = RA.findLastMap
            /**
             * Returns the index of the last element of the list which matches the predicate
             *
             * @example
             * import { findLastIndex } from 'fp-ts/Array'
             * import { some, none } from 'fp-ts/Option'
             *
             * interface X {
             *   readonly a: number
             *   readonly b: number
             * }
             * const xs: Array<X> = [{ a: 1, b: 0 }, { a: 1, b: 1 }]
             * assert.deepStrictEqual(findLastIndex((x: { readonly a: number }) => x.a === 1)(xs), some(1))
             * assert.deepStrictEqual(findLastIndex((x: { readonly a: number }) => x.a === 4)(xs), none)
             *
             *
             * @since 2.0.0
             */
            exports.findLastIndex = RA.findLastIndex
            /**
             * @category combinators
             * @since 2.0.0
             */
            var copy = function (as) {
                return as.slice()
            }
            exports.copy = copy
            /**
             * Insert an element at the specified index, creating a new array, or returning `None` if the index is out of bounds
             *
             * @example
             * import { insertAt } from 'fp-ts/Array'
             * import { some } from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(insertAt(2, 5)([1, 2, 3, 4]), some([1, 2, 5, 3, 4]))
             *
             * @since 2.0.0
             */
            var insertAt = function (i, a) {
                return function (as) {
                    return i < 0 || i > as.length
                        ? _.none
                        : _.some(exports.unsafeInsertAt(i, a, as))
                }
            }
            exports.insertAt = insertAt
            /**
             * Change the element at the specified index, creating a new array, or returning `None` if the index is out of bounds
             *
             * @example
             * import { updateAt } from 'fp-ts/Array'
             * import { some, none } from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(updateAt(1, 1)([1, 2, 3]), some([1, 1, 3]))
             * assert.deepStrictEqual(updateAt(1, 1)([]), none)
             *
             * @since 2.0.0
             */
            var updateAt = function (i, a) {
                return exports.modifyAt(i, function () {
                    return a
                })
            }
            exports.updateAt = updateAt
            /**
             * Delete the element at the specified index, creating a new array, or returning `None` if the index is out of bounds
             *
             * @example
             * import { deleteAt } from 'fp-ts/Array'
             * import { some, none } from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(deleteAt(0)([1, 2, 3]), some([2, 3]))
             * assert.deepStrictEqual(deleteAt(1)([]), none)
             *
             * @since 2.0.0
             */
            var deleteAt = function (i) {
                return function (as) {
                    return exports.isOutOfBound(i, as)
                        ? _.none
                        : _.some(exports.unsafeDeleteAt(i, as))
                }
            }
            exports.deleteAt = deleteAt
            /**
             * Apply a function to the element at the specified index, creating a new array, or returning `None` if the index is out
             * of bounds
             *
             * @example
             * import { modifyAt } from 'fp-ts/Array'
             * import { some, none } from 'fp-ts/Option'
             *
             * const double = (x: number): number => x * 2
             * assert.deepStrictEqual(modifyAt(1, double)([1, 2, 3]), some([1, 4, 3]))
             * assert.deepStrictEqual(modifyAt(1, double)([]), none)
             *
             * @since 2.0.0
             */
            var modifyAt = function (i, f) {
                return function (as) {
                    return exports.isOutOfBound(i, as)
                        ? _.none
                        : _.some(exports.unsafeUpdateAt(i, f(as[i]), as))
                }
            }
            exports.modifyAt = modifyAt
            /**
             * Reverse an array, creating a new array
             *
             * @example
             * import { reverse } from 'fp-ts/Array'
             *
             * assert.deepStrictEqual(reverse([1, 2, 3]), [3, 2, 1])
             *
             * @category combinators
             * @since 2.0.0
             */
            var reverse = function (as) {
                return exports.isEmpty(as) ? [] : as.slice().reverse()
            }
            exports.reverse = reverse
            /**
             * Extracts from an array of `Either` all the `Right` elements. All the `Right` elements are extracted in order
             *
             * @example
             * import { rights } from 'fp-ts/Array'
             * import { right, left } from 'fp-ts/Either'
             *
             * assert.deepStrictEqual(rights([right(1), left('foo'), right(2)]), [1, 2])
             *
             * @category combinators
             * @since 2.0.0
             */
            var rights = function (as) {
                var r = []
                for (var i = 0; i < as.length; i++) {
                    var a = as[i]
                    if (a._tag === "Right") {
                        r.push(a.right)
                    }
                }
                return r
            }
            exports.rights = rights
            /**
             * Extracts from an array of `Either` all the `Left` elements. All the `Left` elements are extracted in order
             *
             * @example
             * import { lefts } from 'fp-ts/Array'
             * import { left, right } from 'fp-ts/Either'
             *
             * assert.deepStrictEqual(lefts([right(1), left('foo'), right(2)]), ['foo'])
             *
             * @category combinators
             * @since 2.0.0
             */
            var lefts = function (as) {
                var r = []
                for (var i = 0; i < as.length; i++) {
                    var a = as[i]
                    if (a._tag === "Left") {
                        r.push(a.left)
                    }
                }
                return r
            }
            exports.lefts = lefts
            /**
             * Sort the elements of an array in increasing order, creating a new array
             *
             * @example
             * import { sort } from 'fp-ts/Array'
             * import * as N from 'fp-ts/number'
             *
             * assert.deepStrictEqual(sort(N.Ord)([3, 2, 1]), [1, 2, 3])
             *
             * @category combinators
             * @since 2.0.0
             */
            var sort = function (O) {
                return function (as) {
                    return as.length <= 1 ? exports.copy(as) : as.slice().sort(O.compare)
                }
            }
            exports.sort = sort
            /**
             * Apply a function to pairs of elements at the same index in two arrays, collecting the results in a new array. If one
             * input array is short, excess elements of the longer array are discarded.
             *
             * @example
             * import { zipWith } from 'fp-ts/Array'
             *
             * assert.deepStrictEqual(zipWith([1, 2, 3], ['a', 'b', 'c', 'd'], (n, s) => s + n), ['a1', 'b2', 'c3'])
             *
             * @category combinators
             * @since 2.0.0
             */
            var zipWith = function (fa, fb, f) {
                var fc = []
                var len = Math.min(fa.length, fb.length)
                for (var i = 0; i < len; i++) {
                    fc[i] = f(fa[i], fb[i])
                }
                return fc
            }
            exports.zipWith = zipWith
            function zip(as, bs) {
                if (bs === undefined) {
                    return function (bs) {
                        return zip(bs, as)
                    }
                }
                return exports.zipWith(as, bs, function (a, b) {
                    return [a, b]
                })
            }
            exports.zip = zip
            /**
             * The function is reverse of `zip`. Takes an array of pairs and return two corresponding arrays
             *
             * @example
             * import { unzip } from 'fp-ts/Array'
             *
             * assert.deepStrictEqual(unzip([[1, 'a'], [2, 'b'], [3, 'c']]), [[1, 2, 3], ['a', 'b', 'c']])
             *
             * @since 2.0.0
             */
            var unzip = function (as) {
                var fa = []
                var fb = []
                for (var i = 0; i < as.length; i++) {
                    fa[i] = as[i][0]
                    fb[i] = as[i][1]
                }
                return [fa, fb]
            }
            exports.unzip = unzip
            /**
             * Prepend an element to every member of an array
             *
             * @example
             * import { prependAll } from 'fp-ts/Array'
             *
             * assert.deepStrictEqual(prependAll(9)([1, 2, 3, 4]), [9, 1, 9, 2, 9, 3, 9, 4])
             *
             * @category combinators
             * @since 2.10.0
             */
            var prependAll = function (middle) {
                var f = NEA.prependAll(middle)
                return function (as) {
                    return exports.isNonEmpty(as) ? f(as) : []
                }
            }
            exports.prependAll = prependAll
            /**
             * Places an element in between members of an array
             *
             * @example
             * import { intersperse } from 'fp-ts/Array'
             *
             * assert.deepStrictEqual(intersperse(9)([1, 2, 3, 4]), [1, 9, 2, 9, 3, 9, 4])
             *
             * @category combinators
             * @since 2.9.0
             */
            var intersperse = function (middle) {
                var f = NEA.intersperse(middle)
                return function (as) {
                    return exports.isNonEmpty(as) ? f(as) : exports.copy(as)
                }
            }
            exports.intersperse = intersperse
            /**
             * Rotate a `Array` by `n` steps.
             *
             * @example
             * import { rotate } from 'fp-ts/Array'
             *
             * assert.deepStrictEqual(rotate(2)([1, 2, 3, 4, 5]), [4, 5, 1, 2, 3])
             *
             * @category combinators
             * @since 2.0.0
             */
            var rotate = function (n) {
                var f = NEA.rotate(n)
                return function (as) {
                    return exports.isNonEmpty(as) ? f(as) : exports.copy(as)
                }
            }
            exports.rotate = rotate
            // TODO: remove non-curried overloading in v3
            /**
             * Test if a value is a member of an array. Takes a `Eq<A>` as a single
             * argument which returns the function to use to search for a value of type `A` in
             * an array of type `Array<A>`.
             *
             * @example
             * import { elem } from 'fp-ts/Array'
             * import * as N from 'fp-ts/number'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.strictEqual(pipe([1, 2, 3], elem(N.Eq)(2)), true)
             * assert.strictEqual(pipe([1, 2, 3], elem(N.Eq)(0)), false)
             *
             * @since 2.0.0
             */
            exports.elem = RA.elem
            /**
             * Remove duplicates from an array, keeping the first occurrence of an element.
             *
             * @example
             * import { uniq } from 'fp-ts/Array'
             * import * as N from 'fp-ts/number'
             *
             * assert.deepStrictEqual(uniq(N.Eq)([1, 2, 1]), [1, 2])
             *
             * @category combinators
             * @since 2.0.0
             */
            var uniq = function (E) {
                var f = NEA.uniq(E)
                return function (as) {
                    return exports.isNonEmpty(as) ? f(as) : exports.copy(as)
                }
            }
            exports.uniq = uniq
            /**
             * Sort the elements of an array in increasing order, where elements are compared using first `ords[0]`, then `ords[1]`,
             * etc...
             *
             * @example
             * import { sortBy } from 'fp-ts/Array'
             * import { contramap } from 'fp-ts/Ord'
             * import * as S from 'fp-ts/string'
             * import * as N from 'fp-ts/number'
             * import { pipe } from 'fp-ts/function'
             *
             * interface Person {
             *   readonly name: string
             *   readonly age: number
             * }
             * const byName = pipe(S.Ord, contramap((p: Person) => p.name))
             * const byAge = pipe(N.Ord, contramap((p: Person) => p.age))
             *
             * const sortByNameByAge = sortBy([byName, byAge])
             *
             * const persons = [{ name: 'a', age: 1 }, { name: 'b', age: 3 }, { name: 'c', age: 2 }, { name: 'b', age: 2 }]
             * assert.deepStrictEqual(sortByNameByAge(persons), [
             *   { name: 'a', age: 1 },
             *   { name: 'b', age: 2 },
             *   { name: 'b', age: 3 },
             *   { name: 'c', age: 2 }
             * ])
             *
             * @category combinators
             * @since 2.0.0
             */
            var sortBy = function (ords) {
                var f = NEA.sortBy(ords)
                return function (as) {
                    return exports.isNonEmpty(as) ? f(as) : exports.copy(as)
                }
            }
            exports.sortBy = sortBy
            /**
             * A useful recursion pattern for processing an array to produce a new array, often used for "chopping" up the input
             * array. Typically chop is called with some function that will consume an initial prefix of the array and produce a
             * value and the rest of the array.
             *
             * @example
             * import { Eq } from 'fp-ts/Eq'
             * import * as A from 'fp-ts/Array'
             * import * as N from 'fp-ts/number'
             * import { pipe } from 'fp-ts/function'
             *
             * const group = <A>(S: Eq<A>): ((as: Array<A>) => Array<Array<A>>) => {
             *   return A.chop(as => {
             *     const { init, rest } = pipe(as, A.spanLeft((a: A) => S.equals(a, as[0])))
             *     return [init, rest]
             *   })
             * }
             * assert.deepStrictEqual(group(N.Eq)([1, 1, 2, 3, 3, 4]), [[1, 1], [2], [3, 3], [4]])
             *
             * @category combinators
             * @since 2.0.0
             */
            var chop = function (f) {
                var g = NEA.chop(f)
                return function (as) {
                    return exports.isNonEmpty(as) ? g(as) : []
                }
            }
            exports.chop = chop
            /**
             * Splits an `Array` into two pieces, the first piece has max `n` elements.
             *
             * @example
             * import { splitAt } from 'fp-ts/Array'
             *
             * assert.deepStrictEqual(splitAt(2)([1, 2, 3, 4, 5]), [[1, 2], [3, 4, 5]])
             *
             * @category combinators
             * @since 2.0.0
             */
            var splitAt = function (n) {
                return function (as) {
                    return n >= 1 && exports.isNonEmpty(as)
                        ? NEA.splitAt(n)(as)
                        : exports.isEmpty(as)
                        ? [exports.copy(as), []]
                        : [[], exports.copy(as)]
                }
            }
            exports.splitAt = splitAt
            /**
             * Splits an array into length-`n` pieces. The last piece will be shorter if `n` does not evenly divide the length of
             * the array. Note that `chunksOf(n)([])` is `[]`, not `[[]]`. This is intentional, and is consistent with a recursive
             * definition of `chunksOf`; it satisfies the property that
             *
             * ```ts
             * chunksOf(n)(xs).concat(chunksOf(n)(ys)) == chunksOf(n)(xs.concat(ys)))
             * ```
             *
             * whenever `n` evenly divides the length of `xs`.
             *
             * @example
             * import { chunksOf } from 'fp-ts/Array'
             *
             * assert.deepStrictEqual(chunksOf(2)([1, 2, 3, 4, 5]), [[1, 2], [3, 4], [5]])
             *
             * @category combinators
             * @since 2.0.0
             */
            var chunksOf = function (n) {
                var f = NEA.chunksOf(n)
                return function (as) {
                    return exports.isNonEmpty(as) ? f(as) : []
                }
            }
            exports.chunksOf = chunksOf
            /**
             * @category combinators
             * @since 2.11.0
             */
            var fromOptionK = function (f) {
                return function () {
                    var a = []
                    for (var _i = 0; _i < arguments.length; _i++) {
                        a[_i] = arguments[_i]
                    }
                    return exports.fromOption(f.apply(void 0, a))
                }
            }
            exports.fromOptionK = fromOptionK
            function comprehension(input, f, g) {
                if (g === void 0) {
                    g = function () {
                        return true
                    }
                }
                var go = function (scope, input) {
                    return exports.isNonEmpty(input)
                        ? function_1.pipe(
                              NEA.head(input),
                              exports.chain(function (x) {
                                  return go(
                                      function_1.pipe(scope, exports.append(x)),
                                      NEA.tail(input),
                                  )
                              }),
                          )
                        : g.apply(void 0, scope)
                        ? [f.apply(void 0, scope)]
                        : []
                }
                return go([], input)
            }
            exports.comprehension = comprehension
            /**
             * @category combinators
             * @since 2.11.0
             */
            var concatW = function (second) {
                return function (first) {
                    return exports.isEmpty(first)
                        ? exports.copy(second)
                        : exports.isEmpty(second)
                        ? exports.copy(first)
                        : first.concat(second)
                }
            }
            exports.concatW = concatW
            /**
             * @category combinators
             * @since 2.11.0
             */
            exports.concat = exports.concatW
            function union(E) {
                var unionE = NEA.union(E)
                return function (first, second) {
                    if (second === undefined) {
                        var unionE_1 = union(E)
                        return function (second) {
                            return unionE_1(second, first)
                        }
                    }
                    return exports.isNonEmpty(first) && exports.isNonEmpty(second)
                        ? unionE(second)(first)
                        : exports.isNonEmpty(first)
                        ? exports.copy(first)
                        : exports.copy(second)
                }
            }
            exports.union = union
            function intersection(E) {
                var elemE = exports.elem(E)
                return function (xs, ys) {
                    if (ys === undefined) {
                        var intersectionE_1 = intersection(E)
                        return function (ys) {
                            return intersectionE_1(ys, xs)
                        }
                    }
                    return xs.filter(function (a) {
                        return elemE(a, ys)
                    })
                }
            }
            exports.intersection = intersection
            function difference(E) {
                var elemE = exports.elem(E)
                return function (xs, ys) {
                    if (ys === undefined) {
                        var differenceE_1 = difference(E)
                        return function (ys) {
                            return differenceE_1(ys, xs)
                        }
                    }
                    return xs.filter(function (a) {
                        return !elemE(a, ys)
                    })
                }
            }
            exports.difference = difference
            // -------------------------------------------------------------------------------------
            // non-pipeables
            // -------------------------------------------------------------------------------------
            var _map = function (fa, f) {
                return function_1.pipe(fa, exports.map(f))
            }
            /* istanbul ignore next */
            var _mapWithIndex = function (fa, f) {
                return function_1.pipe(fa, exports.mapWithIndex(f))
            }
            var _ap = function (fab, fa) {
                return function_1.pipe(fab, exports.ap(fa))
            }
            var _chain = function (ma, f) {
                return function_1.pipe(ma, exports.chain(f))
            }
            /* istanbul ignore next */
            var _filter = function (fa, predicate) {
                return function_1.pipe(fa, exports.filter(predicate))
            }
            /* istanbul ignore next */
            var _filterMap = function (fa, f) {
                return function_1.pipe(fa, exports.filterMap(f))
            }
            /* istanbul ignore next */
            var _partition = function (fa, predicate) {
                return function_1.pipe(fa, exports.partition(predicate))
            }
            /* istanbul ignore next */
            var _partitionMap = function (fa, f) {
                return function_1.pipe(fa, exports.partitionMap(f))
            }
            /* istanbul ignore next */
            var _partitionWithIndex = function (fa, predicateWithIndex) {
                return function_1.pipe(fa, exports.partitionWithIndex(predicateWithIndex))
            }
            /* istanbul ignore next */
            var _partitionMapWithIndex = function (fa, f) {
                return function_1.pipe(fa, exports.partitionMapWithIndex(f))
            }
            /* istanbul ignore next */
            var _alt = function (fa, that) {
                return function_1.pipe(fa, exports.alt(that))
            }
            var _reduce = function (fa, b, f) {
                return function_1.pipe(fa, exports.reduce(b, f))
            }
            /* istanbul ignore next */
            var _foldMap = function (M) {
                var foldMapM = exports.foldMap(M)
                return function (fa, f) {
                    return function_1.pipe(fa, foldMapM(f))
                }
            }
            /* istanbul ignore next */
            var _reduceRight = function (fa, b, f) {
                return function_1.pipe(fa, exports.reduceRight(b, f))
            }
            /* istanbul ignore next */
            var _reduceWithIndex = function (fa, b, f) {
                return function_1.pipe(fa, exports.reduceWithIndex(b, f))
            }
            /* istanbul ignore next */
            var _foldMapWithIndex = function (M) {
                var foldMapWithIndexM = exports.foldMapWithIndex(M)
                return function (fa, f) {
                    return function_1.pipe(fa, foldMapWithIndexM(f))
                }
            }
            /* istanbul ignore next */
            var _reduceRightWithIndex = function (fa, b, f) {
                return function_1.pipe(fa, exports.reduceRightWithIndex(b, f))
            }
            /* istanbul ignore next */
            var _filterMapWithIndex = function (fa, f) {
                return function_1.pipe(fa, exports.filterMapWithIndex(f))
            }
            /* istanbul ignore next */
            var _filterWithIndex = function (fa, predicateWithIndex) {
                return function_1.pipe(fa, exports.filterWithIndex(predicateWithIndex))
            }
            /* istanbul ignore next */
            var _extend = function (fa, f) {
                return function_1.pipe(fa, exports.extend(f))
            }
            /* istanbul ignore next */
            var _traverse = function (F) {
                var traverseF = exports.traverse(F)
                return function (ta, f) {
                    return function_1.pipe(ta, traverseF(f))
                }
            }
            /* istanbul ignore next */
            var _traverseWithIndex = function (F) {
                var traverseWithIndexF = exports.traverseWithIndex(F)
                return function (ta, f) {
                    return function_1.pipe(ta, traverseWithIndexF(f))
                }
            }
            var _chainRecDepthFirst = RA._chainRecDepthFirst
            var _chainRecBreadthFirst = RA._chainRecBreadthFirst
            // -------------------------------------------------------------------------------------
            // type class members
            // -------------------------------------------------------------------------------------
            /**
             * @category Pointed
             * @since 2.0.0
             */
            exports.of = NEA.of
            /**
             * @category Zero
             * @since 2.7.0
             */
            var zero = function () {
                return []
            }
            exports.zero = zero
            /**
             * `map` can be used to turn functions `(a: A) => B` into functions `(fa: F<A>) => F<B>` whose argument and return types
             * use the type constructor `F` to represent some computational context.
             *
             * @category Functor
             * @since 2.0.0
             */
            var map = function (f) {
                return function (fa) {
                    return fa.map(function (a) {
                        return f(a)
                    })
                }
            }
            exports.map = map
            /**
             * Apply a function to an argument under a type constructor.
             *
             * @category Apply
             * @since 2.0.0
             */
            var ap = function (fa) {
                return exports.chain(function (f) {
                    return function_1.pipe(fa, exports.map(f))
                })
            }
            exports.ap = ap
            /**
             * Composes computations in sequence, using the return value of one computation to determine the next computation.
             *
             * @category Monad
             * @since 2.0.0
             */
            var chain = function (f) {
                return function (ma) {
                    return function_1.pipe(
                        ma,
                        exports.chainWithIndex(function (_, a) {
                            return f(a)
                        }),
                    )
                }
            }
            exports.chain = chain
            /**
             * Derivable from `Chain`.
             *
             * @category combinators
             * @since 2.5.0
             */
            exports.flatten =
                /*#__PURE__*/
                exports.chain(function_1.identity)
            /**
             * @category FunctorWithIndex
             * @since 2.0.0
             */
            var mapWithIndex = function (f) {
                return function (fa) {
                    return fa.map(function (a, i) {
                        return f(i, a)
                    })
                }
            }
            exports.mapWithIndex = mapWithIndex
            /**
             * @category FilterableWithIndex
             * @since 2.0.0
             */
            var filterMapWithIndex = function (f) {
                return function (fa) {
                    var out = []
                    for (var i = 0; i < fa.length; i++) {
                        var optionB = f(i, fa[i])
                        if (_.isSome(optionB)) {
                            out.push(optionB.value)
                        }
                    }
                    return out
                }
            }
            exports.filterMapWithIndex = filterMapWithIndex
            /**
             * @category Filterable
             * @since 2.0.0
             */
            var filterMap = function (f) {
                return exports.filterMapWithIndex(function (_, a) {
                    return f(a)
                })
            }
            exports.filterMap = filterMap
            /**
             * @category Compactable
             * @since 2.0.0
             */
            exports.compact =
                /*#__PURE__*/
                exports.filterMap(function_1.identity)
            /**
             * @category Compactable
             * @since 2.0.0
             */
            var separate = function (fa) {
                var left = []
                var right = []
                for (var _i = 0, fa_1 = fa; _i < fa_1.length; _i++) {
                    var e = fa_1[_i]
                    if (e._tag === "Left") {
                        left.push(e.left)
                    } else {
                        right.push(e.right)
                    }
                }
                return Separated_1.separated(left, right)
            }
            exports.separate = separate
            /**
             * @category Filterable
             * @since 2.0.0
             */
            var filter = function (predicate) {
                return function (as) {
                    return as.filter(predicate)
                }
            }
            exports.filter = filter
            /**
             * @category Filterable
             * @since 2.0.0
             */
            var partition = function (predicate) {
                return exports.partitionWithIndex(function (_, a) {
                    return predicate(a)
                })
            }
            exports.partition = partition
            /**
             * @category FilterableWithIndex
             * @since 2.0.0
             */
            var partitionWithIndex = function (predicateWithIndex) {
                return function (as) {
                    var left = []
                    var right = []
                    for (var i = 0; i < as.length; i++) {
                        var b = as[i]
                        if (predicateWithIndex(i, b)) {
                            right.push(b)
                        } else {
                            left.push(b)
                        }
                    }
                    return Separated_1.separated(left, right)
                }
            }
            exports.partitionWithIndex = partitionWithIndex
            /**
             * @category Filterable
             * @since 2.0.0
             */
            var partitionMap = function (f) {
                return exports.partitionMapWithIndex(function (_, a) {
                    return f(a)
                })
            }
            exports.partitionMap = partitionMap
            /**
             * @category FilterableWithIndex
             * @since 2.0.0
             */
            var partitionMapWithIndex = function (f) {
                return function (fa) {
                    var left = []
                    var right = []
                    for (var i = 0; i < fa.length; i++) {
                        var e = f(i, fa[i])
                        if (e._tag === "Left") {
                            left.push(e.left)
                        } else {
                            right.push(e.right)
                        }
                    }
                    return Separated_1.separated(left, right)
                }
            }
            exports.partitionMapWithIndex = partitionMapWithIndex
            /**
             * Less strict version of [`alt`](#alt).
             *
             * @category Alt
             * @since 2.9.0
             */
            var altW = function (that) {
                return function (fa) {
                    return fa.concat(that())
                }
            }
            exports.altW = altW
            /**
             * Identifies an associative operation on a type constructor. It is similar to `Semigroup`, except that it applies to
             * types of kind `* -> *`.
             *
             * @category Alt
             * @since 2.0.0
             */
            exports.alt = exports.altW
            /**
             * @category FilterableWithIndex
             * @since 2.0.0
             */
            var filterWithIndex = function (predicateWithIndex) {
                return function (as) {
                    return as.filter(function (b, i) {
                        return predicateWithIndex(i, b)
                    })
                }
            }
            exports.filterWithIndex = filterWithIndex
            /**
             * @category Extend
             * @since 2.0.0
             */
            var extend = function (f) {
                return function (wa) {
                    return wa.map(function (_, i) {
                        return f(wa.slice(i))
                    })
                }
            }
            exports.extend = extend
            /**
             * Derivable from `Extend`.
             *
             * @category combinators
             * @since 2.0.0
             */
            exports.duplicate =
                /*#__PURE__*/
                exports.extend(function_1.identity)
            /**
             * @category Foldable
             * @since 2.0.0
             */
            exports.foldMap = RA.foldMap
            /**
             * @category FoldableWithIndex
             * @since 2.0.0
             */
            exports.foldMapWithIndex = RA.foldMapWithIndex
            /**
             * @category Foldable
             * @since 2.0.0
             */
            exports.reduce = RA.reduce
            /**
             * @category FoldableWithIndex
             * @since 2.0.0
             */
            exports.reduceWithIndex = RA.reduceWithIndex
            /**
             * @category Foldable
             * @since 2.0.0
             */
            exports.reduceRight = RA.reduceRight
            /**
             * @category FoldableWithIndex
             * @since 2.0.0
             */
            exports.reduceRightWithIndex = RA.reduceRightWithIndex
            /**
             * @category Traversable
             * @since 2.6.3
             */
            var traverse = function (F) {
                var traverseWithIndexF = exports.traverseWithIndex(F)
                return function (f) {
                    return traverseWithIndexF(function (_, a) {
                        return f(a)
                    })
                }
            }
            exports.traverse = traverse
            /**
             * @category Traversable
             * @since 2.6.3
             */
            var sequence = function (F) {
                return function (ta) {
                    return _reduce(ta, F.of(exports.zero()), function (fas, fa) {
                        return F.ap(
                            F.map(fas, function (as) {
                                return function (a) {
                                    return function_1.pipe(as, exports.append(a))
                                }
                            }),
                            fa,
                        )
                    })
                }
            }
            exports.sequence = sequence
            /**
             * @category TraversableWithIndex
             * @since 2.6.3
             */
            var traverseWithIndex = function (F) {
                return function (f) {
                    return exports.reduceWithIndex(F.of(exports.zero()), function (i, fbs, a) {
                        return F.ap(
                            F.map(fbs, function (bs) {
                                return function (b) {
                                    return function_1.pipe(bs, exports.append(b))
                                }
                            }),
                            f(i, a),
                        )
                    })
                }
            }
            exports.traverseWithIndex = traverseWithIndex
            /**
             * @category Witherable
             * @since 2.6.5
             */
            var wither = function (F) {
                var _witherF = _wither(F)
                return function (f) {
                    return function (fa) {
                        return _witherF(fa, f)
                    }
                }
            }
            exports.wither = wither
            /**
             * @category Witherable
             * @since 2.6.5
             */
            var wilt = function (F) {
                var _wiltF = _wilt(F)
                return function (f) {
                    return function (fa) {
                        return _wiltF(fa, f)
                    }
                }
            }
            exports.wilt = wilt
            /**
             * Creates an `Array` from the results of `f(b)`, where `b` is an initial value.
             * `unfold` stops when `f` returns `Option.none`.
             * @example
             * import { unfold } from 'fp-ts/Array'
             * import { some, none } from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(
             *   unfold(5, (n) => (n > 0 ? some([n, n - 1]) : none)),
             *   [5, 4, 3, 2, 1]
             * )
             *
             * @category Unfoldable
             * @since 2.6.6
             */
            var unfold = function (b, f) {
                var out = []
                var bb = b
                while (true) {
                    var mt = f(bb)
                    if (_.isSome(mt)) {
                        var _a = mt.value,
                            a = _a[0],
                            b_1 = _a[1]
                        out.push(a)
                        bb = b_1
                    } else {
                        break
                    }
                }
                return out
            }
            exports.unfold = unfold
            // -------------------------------------------------------------------------------------
            // instances
            // -------------------------------------------------------------------------------------
            /**
             * @category instances
             * @since 2.0.0
             */
            exports.URI = "Array"
            /**
             * @category instances
             * @since 2.0.0
             */
            exports.getShow = RA.getShow
            /**
             * @category instances
             * @since 2.10.0
             */
            var getSemigroup = function () {
                return {
                    concat: function (first, second) {
                        return first.concat(second)
                    },
                }
            }
            exports.getSemigroup = getSemigroup
            /**
             * Returns a `Monoid` for `Array<A>`
             *
             * @example
             * import { getMonoid } from 'fp-ts/Array'
             *
             * const M = getMonoid<number>()
             * assert.deepStrictEqual(M.concat([1, 2], [3, 4]), [1, 2, 3, 4])
             *
             * @category instances
             * @since 2.0.0
             */
            var getMonoid = function () {
                return {
                    concat: exports.getSemigroup().concat,
                    empty: [],
                }
            }
            exports.getMonoid = getMonoid
            /**
             * Derives an `Eq` over the `Array` of a given element type from the `Eq` of that type. The derived `Eq` defines two
             * arrays as equal if all elements of both arrays are compared equal pairwise with the given `E`. In case of arrays of
             * different lengths, the result is non equality.
             *
             * @example
             * import * as S from 'fp-ts/string'
             * import { getEq } from 'fp-ts/Array'
             *
             * const E = getEq(S.Eq)
             * assert.strictEqual(E.equals(['a', 'b'], ['a', 'b']), true)
             * assert.strictEqual(E.equals(['a'], []), false)
             *
             * @category instances
             * @since 2.0.0
             */
            exports.getEq = RA.getEq
            /**
             * Derives an `Ord` over the `Array` of a given element type from the `Ord` of that type. The ordering between two such
             * arrays is equal to: the first non equal comparison of each arrays elements taken pairwise in increasing order, in
             * case of equality over all the pairwise elements; the longest array is considered the greatest, if both arrays have
             * the same length, the result is equality.
             *
             * @example
             * import { getOrd } from 'fp-ts/Array'
             * import * as S from 'fp-ts/string'
             *
             * const O = getOrd(S.Ord)
             * assert.strictEqual(O.compare(['b'], ['a']), 1)
             * assert.strictEqual(O.compare(['a'], ['a']), 0)
             * assert.strictEqual(O.compare(['a'], ['b']), -1)
             *
             * @category instances
             * @since 2.0.0
             */
            exports.getOrd = RA.getOrd
            /**
             * @category instances
             * @since 2.11.0
             */
            var getUnionSemigroup = function (E) {
                var unionE = union(E)
                return {
                    concat: function (first, second) {
                        return unionE(second)(first)
                    },
                }
            }
            exports.getUnionSemigroup = getUnionSemigroup
            /**
             * @category instances
             * @since 2.11.0
             */
            var getUnionMonoid = function (E) {
                return {
                    concat: exports.getUnionSemigroup(E).concat,
                    empty: [],
                }
            }
            exports.getUnionMonoid = getUnionMonoid
            /**
             * @category instances
             * @since 2.11.0
             */
            var getIntersectionSemigroup = function (E) {
                var intersectionE = intersection(E)
                return {
                    concat: function (first, second) {
                        return intersectionE(second)(first)
                    },
                }
            }
            exports.getIntersectionSemigroup = getIntersectionSemigroup
            /**
             * @category instances
             * @since 2.11.0
             */
            var getDifferenceMagma = function (E) {
                var differenceE = difference(E)
                return {
                    concat: function (first, second) {
                        return differenceE(second)(first)
                    },
                }
            }
            exports.getDifferenceMagma = getDifferenceMagma
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Functor = {
                URI: exports.URI,
                map: _map,
            }
            /**
             * Derivable from `Functor`.
             *
             * @category combinators
             * @since 2.10.0
             */
            exports.flap =
                /*#__PURE__*/
                Functor_1.flap(exports.Functor)
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Pointed = {
                URI: exports.URI,
                of: exports.of,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.FunctorWithIndex = {
                URI: exports.URI,
                map: _map,
                mapWithIndex: _mapWithIndex,
            }
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Apply = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
            }
            /**
             * Combine two effectful actions, keeping only the result of the first.
             *
             * Derivable from `Apply`.
             *
             * @category combinators
             * @since 2.5.0
             */
            exports.apFirst =
                /*#__PURE__*/
                Apply_1.apFirst(exports.Apply)
            /**
             * Combine two effectful actions, keeping only the result of the second.
             *
             * Derivable from `Apply`.
             *
             * @category combinators
             * @since 2.5.0
             */
            exports.apSecond =
                /*#__PURE__*/
                Apply_1.apSecond(exports.Apply)
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Applicative = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                of: exports.of,
            }
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Chain = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                chain: _chain,
            }
            /**
             * Composes computations in sequence, using the return value of one computation to determine the next computation and
             * keeping only the result of the first.
             *
             * Derivable from `Chain`.
             *
             * @category combinators
             * @since 2.0.0
             */
            exports.chainFirst =
                /*#__PURE__*/
                Chain_1.chainFirst(exports.Chain)
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Monad = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                of: exports.of,
                chain: _chain,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Unfoldable = {
                URI: exports.URI,
                unfold: exports.unfold,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Alt = {
                URI: exports.URI,
                map: _map,
                alt: _alt,
            }
            /**
             * @category instances
             * @since 2.11.0
             */
            exports.Zero = {
                URI: exports.URI,
                zero: exports.zero,
            }
            /**
             * @category constructors
             * @since 2.11.0
             */
            exports.guard =
                /*#__PURE__*/
                Zero_1.guard(exports.Zero, exports.Pointed)
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Alternative = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                of: exports.of,
                alt: _alt,
                zero: exports.zero,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Extend = {
                URI: exports.URI,
                map: _map,
                extend: _extend,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Compactable = {
                URI: exports.URI,
                compact: exports.compact,
                separate: exports.separate,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Filterable = {
                URI: exports.URI,
                map: _map,
                compact: exports.compact,
                separate: exports.separate,
                filter: _filter,
                filterMap: _filterMap,
                partition: _partition,
                partitionMap: _partitionMap,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.FilterableWithIndex = {
                URI: exports.URI,
                map: _map,
                mapWithIndex: _mapWithIndex,
                compact: exports.compact,
                separate: exports.separate,
                filter: _filter,
                filterMap: _filterMap,
                partition: _partition,
                partitionMap: _partitionMap,
                partitionMapWithIndex: _partitionMapWithIndex,
                partitionWithIndex: _partitionWithIndex,
                filterMapWithIndex: _filterMapWithIndex,
                filterWithIndex: _filterWithIndex,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Foldable = {
                URI: exports.URI,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.FoldableWithIndex = {
                URI: exports.URI,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                reduceWithIndex: _reduceWithIndex,
                foldMapWithIndex: _foldMapWithIndex,
                reduceRightWithIndex: _reduceRightWithIndex,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Traversable = {
                URI: exports.URI,
                map: _map,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                traverse: _traverse,
                sequence: exports.sequence,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.TraversableWithIndex = {
                URI: exports.URI,
                map: _map,
                mapWithIndex: _mapWithIndex,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                reduceWithIndex: _reduceWithIndex,
                foldMapWithIndex: _foldMapWithIndex,
                reduceRightWithIndex: _reduceRightWithIndex,
                traverse: _traverse,
                sequence: exports.sequence,
                traverseWithIndex: _traverseWithIndex,
            }
            var _wither = Witherable_1.witherDefault(exports.Traversable, exports.Compactable)
            var _wilt = Witherable_1.wiltDefault(exports.Traversable, exports.Compactable)
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Witherable = {
                URI: exports.URI,
                map: _map,
                compact: exports.compact,
                separate: exports.separate,
                filter: _filter,
                filterMap: _filterMap,
                partition: _partition,
                partitionMap: _partitionMap,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                traverse: _traverse,
                sequence: exports.sequence,
                wither: _wither,
                wilt: _wilt,
            }
            /**
             * @category ChainRec
             * @since 2.11.0
             */
            exports.chainRecDepthFirst = RA.chainRecDepthFirst
            /**
             * @category instances
             * @since 2.11.0
             */
            exports.ChainRecDepthFirst = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                chain: _chain,
                chainRec: _chainRecDepthFirst,
            }
            /**
             * @category ChainRec
             * @since 2.11.0
             */
            exports.chainRecBreadthFirst = RA.chainRecBreadthFirst
            /**
             * @category instances
             * @since 2.11.0
             */
            exports.ChainRecBreadthFirst = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                chain: _chain,
                chainRec: _chainRecBreadthFirst,
            }
            /**
             * Filter values inside a context.
             *
             * @since 2.11.0
             */
            exports.filterE =
                /*#__PURE__*/
                Witherable_1.filterE(exports.Witherable)
            /**
             * @category instances
             * @since 2.11.0
             */
            exports.FromEither = {
                URI: exports.URI,
                fromEither: exports.fromEither,
            }
            /**
             * @category combinators
             * @since 2.11.0
             */
            exports.fromEitherK =
                /*#__PURE__*/
                FromEither_1.fromEitherK(exports.FromEither)
            // -------------------------------------------------------------------------------------
            // unsafe
            // -------------------------------------------------------------------------------------
            /**
             * @category unsafe
             * @since 2.0.0
             */
            exports.unsafeInsertAt = NEA.unsafeInsertAt
            /**
             * @category unsafe
             * @since 2.0.0
             */
            var unsafeUpdateAt = function (i, a, as) {
                return exports.isNonEmpty(as) ? NEA.unsafeUpdateAt(i, a, as) : []
            }
            exports.unsafeUpdateAt = unsafeUpdateAt
            /**
             * @category unsafe
             * @since 2.0.0
             */
            var unsafeDeleteAt = function (i, as) {
                var xs = as.slice()
                xs.splice(i, 1)
                return xs
            }
            exports.unsafeDeleteAt = unsafeDeleteAt
            // -------------------------------------------------------------------------------------
            // utils
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.9.0
             */
            exports.every = RA.every
            /**
             * @since 2.9.0
             */
            var some = function (predicate) {
                return function (as) {
                    return as.some(predicate)
                }
            }
            exports.some = some
            /**
             * Alias of [`some`](#some)
             *
             * @since 2.11.0
             */
            exports.exists = exports.some
            // -------------------------------------------------------------------------------------
            // do notation
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.9.0
             */
            exports.Do =
                /*#__PURE__*/
                exports.of(_.emptyRecord)
            /**
             * @since 2.8.0
             */
            exports.bindTo =
                /*#__PURE__*/
                Functor_1.bindTo(exports.Functor)
            /**
             * @since 2.8.0
             */
            exports.bind =
                /*#__PURE__*/
                Chain_1.bind(exports.Chain)
            // -------------------------------------------------------------------------------------
            // pipeable sequence S
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.8.0
             */
            exports.apS =
                /*#__PURE__*/
                Apply_1.apS(exports.Apply)
            // -------------------------------------------------------------------------------------
            // deprecated
            // -------------------------------------------------------------------------------------
            // tslint:disable: deprecation
            /**
             * Use `NonEmptyArray` module instead.
             *
             * @category constructors
             * @since 2.0.0
             * @deprecated
             */
            exports.range = NEA.range
            /**
             * Use a new `[]` instead.
             *
             * @since 2.0.0
             * @deprecated
             */
            exports.empty = []
            /**
             * Use `prepend` instead.
             *
             * @category constructors
             * @since 2.0.0
             * @deprecated
             */
            exports.cons = NEA.cons
            /**
             * Use `append` instead.
             *
             * @category constructors
             * @since 2.0.0
             * @deprecated
             */
            exports.snoc = NEA.snoc
            /**
             * Use `prependAll` instead
             *
             * @category combinators
             * @since 2.9.0
             * @deprecated
             */
            exports.prependToAll = exports.prependAll
            /**
             * Use small, specific instances instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.array = {
                URI: exports.URI,
                compact: exports.compact,
                separate: exports.separate,
                map: _map,
                ap: _ap,
                of: exports.of,
                chain: _chain,
                filter: _filter,
                filterMap: _filterMap,
                partition: _partition,
                partitionMap: _partitionMap,
                mapWithIndex: _mapWithIndex,
                partitionMapWithIndex: _partitionMapWithIndex,
                partitionWithIndex: _partitionWithIndex,
                filterMapWithIndex: _filterMapWithIndex,
                filterWithIndex: _filterWithIndex,
                alt: _alt,
                zero: exports.zero,
                unfold: exports.unfold,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                traverse: _traverse,
                sequence: exports.sequence,
                reduceWithIndex: _reduceWithIndex,
                foldMapWithIndex: _foldMapWithIndex,
                reduceRightWithIndex: _reduceRightWithIndex,
                traverseWithIndex: _traverseWithIndex,
                extend: _extend,
                wither: _wither,
                wilt: _wilt,
            }

            /***/
        },

        /***/ 2372: /***/ (__unused_webpack_module, exports) => {
            "use strict"

            Object.defineProperty(exports, "__esModule", { value: true })
            exports.bind = exports.chainFirst = void 0
            function chainFirst(M) {
                return function (f) {
                    return function (first) {
                        return M.chain(first, function (a) {
                            return M.map(f(a), function () {
                                return a
                            })
                        })
                    }
                }
            }
            exports.chainFirst = chainFirst
            function bind(M) {
                return function (name, f) {
                    return function (ma) {
                        return M.chain(ma, function (a) {
                            return M.map(f(a), function (b) {
                                var _a
                                return Object.assign({}, a, ((_a = {}), (_a[name] = b), _a))
                            })
                        })
                    }
                }
            }
            exports.bind = bind

            /***/
        },

        /***/ 5322: /***/ (__unused_webpack_module, exports) => {
            "use strict"

            Object.defineProperty(exports, "__esModule", { value: true })
            exports.tailRec = void 0
            /**
             * @since 2.0.0
             */
            var tailRec = function (startWith, f) {
                var ab = f(startWith)
                while (ab._tag === "Left") {
                    ab = f(ab.left)
                }
                return ab.right
            }
            exports.tailRec = tailRec

            /***/
        },

        /***/ 7534: /***/ function (__unused_webpack_module, exports, __nccwpck_require__) {
            "use strict"

            var __createBinding =
                (this && this.__createBinding) ||
                (Object.create
                    ? function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          Object.defineProperty(o, k2, {
                              enumerable: true,
                              get: function () {
                                  return m[k]
                              },
                          })
                      }
                    : function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          o[k2] = m[k]
                      })
            var __setModuleDefault =
                (this && this.__setModuleDefault) ||
                (Object.create
                    ? function (o, v) {
                          Object.defineProperty(o, "default", { enumerable: true, value: v })
                      }
                    : function (o, v) {
                          o["default"] = v
                      })
            var __importStar =
                (this && this.__importStar) ||
                function (mod) {
                    if (mod && mod.__esModule) return mod
                    var result = {}
                    if (mod != null)
                        for (var k in mod)
                            if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
                                __createBinding(result, mod, k)
                    __setModuleDefault(result, mod)
                    return result
                }
            Object.defineProperty(exports, "__esModule", { value: true })
            exports.fold = exports.match = exports.foldW = exports.matchW = exports.isRight = exports.isLeft = exports.fromOption = exports.fromPredicate = exports.FromEither = exports.MonadThrow = exports.throwError = exports.ChainRec = exports.Extend = exports.extend = exports.Alt = exports.alt = exports.altW = exports.Bifunctor = exports.mapLeft = exports.bimap = exports.Traversable = exports.sequence = exports.traverse = exports.Foldable = exports.reduceRight = exports.foldMap = exports.reduce = exports.Monad = exports.Chain = exports.chain = exports.chainW = exports.Applicative = exports.Apply = exports.ap = exports.apW = exports.Pointed = exports.of = exports.Functor = exports.map = exports.getAltValidation = exports.getApplicativeValidation = exports.getWitherable = exports.getFilterable = exports.getCompactable = exports.getSemigroup = exports.getEq = exports.getShow = exports.URI = exports.right = exports.left = void 0
            exports.getValidation = exports.getValidationMonoid = exports.getValidationSemigroup = exports.getApplyMonoid = exports.getApplySemigroup = exports.either = exports.stringifyJSON = exports.parseJSON = exports.sequenceArray = exports.traverseArray = exports.traverseArrayWithIndex = exports.traverseReadonlyArrayWithIndex = exports.traverseReadonlyNonEmptyArrayWithIndex = exports.ApT = exports.apSW = exports.apS = exports.bindW = exports.bind = exports.bindTo = exports.Do = exports.exists = exports.elem = exports.toError = exports.toUnion = exports.chainNullableK = exports.fromNullableK = exports.tryCatchK = exports.tryCatch = exports.fromNullable = exports.orElse = exports.orElseW = exports.swap = exports.filterOrElseW = exports.filterOrElse = exports.chainOptionK = exports.fromOptionK = exports.duplicate = exports.flatten = exports.flattenW = exports.chainFirstW = exports.chainFirst = exports.apSecond = exports.apFirst = exports.flap = exports.getOrElse = exports.getOrElseW = void 0
            var Applicative_1 = __nccwpck_require__(4766)
            var Apply_1 = __nccwpck_require__(205)
            var Chain_1 = __nccwpck_require__(2372)
            var ChainRec_1 = __nccwpck_require__(5322)
            var FromEither_1 = __nccwpck_require__(1964)
            var function_1 = __nccwpck_require__(6985)
            var Functor_1 = __nccwpck_require__(5533)
            var _ = __importStar(__nccwpck_require__(1840))
            var Separated_1 = __nccwpck_require__(5877)
            var Witherable_1 = __nccwpck_require__(4384)
            // -------------------------------------------------------------------------------------
            // constructors
            // -------------------------------------------------------------------------------------
            /**
             * Constructs a new `Either` holding a `Left` value. This usually represents a failure, due to the right-bias of this
             * structure.
             *
             * @category constructors
             * @since 2.0.0
             */
            exports.left = _.left
            /**
             * Constructs a new `Either` holding a `Right` value. This usually represents a successful value due to the right bias
             * of this structure.
             *
             * @category constructors
             * @since 2.0.0
             */
            exports.right = _.right
            // -------------------------------------------------------------------------------------
            // non-pipeables
            // -------------------------------------------------------------------------------------
            var _map = function (fa, f) {
                return function_1.pipe(fa, exports.map(f))
            }
            var _ap = function (fab, fa) {
                return function_1.pipe(fab, exports.ap(fa))
            }
            /* istanbul ignore next */
            var _chain = function (ma, f) {
                return function_1.pipe(ma, exports.chain(f))
            }
            /* istanbul ignore next */
            var _reduce = function (fa, b, f) {
                return function_1.pipe(fa, exports.reduce(b, f))
            }
            /* istanbul ignore next */
            var _foldMap = function (M) {
                return function (fa, f) {
                    var foldMapM = exports.foldMap(M)
                    return function_1.pipe(fa, foldMapM(f))
                }
            }
            /* istanbul ignore next */
            var _reduceRight = function (fa, b, f) {
                return function_1.pipe(fa, exports.reduceRight(b, f))
            }
            var _traverse = function (F) {
                var traverseF = exports.traverse(F)
                return function (ta, f) {
                    return function_1.pipe(ta, traverseF(f))
                }
            }
            var _bimap = function (fa, f, g) {
                return function_1.pipe(fa, exports.bimap(f, g))
            }
            var _mapLeft = function (fa, f) {
                return function_1.pipe(fa, exports.mapLeft(f))
            }
            /* istanbul ignore next */
            var _alt = function (fa, that) {
                return function_1.pipe(fa, exports.alt(that))
            }
            /* istanbul ignore next */
            var _extend = function (wa, f) {
                return function_1.pipe(wa, exports.extend(f))
            }
            var _chainRec = function (a, f) {
                return ChainRec_1.tailRec(f(a), function (e) {
                    return exports.isLeft(e)
                        ? exports.right(exports.left(e.left))
                        : exports.isLeft(e.right)
                        ? exports.left(f(e.right.left))
                        : exports.right(exports.right(e.right.right))
                })
            }
            // -------------------------------------------------------------------------------------
            // instances
            // -------------------------------------------------------------------------------------
            /**
             * @category instances
             * @since 2.0.0
             */
            exports.URI = "Either"
            /**
             * @category instances
             * @since 2.0.0
             */
            var getShow = function (SE, SA) {
                return {
                    show: function (ma) {
                        return exports.isLeft(ma)
                            ? "left(" + SE.show(ma.left) + ")"
                            : "right(" + SA.show(ma.right) + ")"
                    },
                }
            }
            exports.getShow = getShow
            /**
             * @category instances
             * @since 2.0.0
             */
            var getEq = function (EL, EA) {
                return {
                    equals: function (x, y) {
                        return (
                            x === y ||
                            (exports.isLeft(x)
                                ? exports.isLeft(y) && EL.equals(x.left, y.left)
                                : exports.isRight(y) && EA.equals(x.right, y.right))
                        )
                    },
                }
            }
            exports.getEq = getEq
            /**
             * Semigroup returning the left-most non-`Left` value. If both operands are `Right`s then the inner values are
             * concatenated using the provided `Semigroup`
             *
             * @example
             * import { getSemigroup, left, right } from 'fp-ts/Either'
             * import { SemigroupSum } from 'fp-ts/number'
             *
             * const S = getSemigroup<string, number>(SemigroupSum)
             * assert.deepStrictEqual(S.concat(left('a'), left('b')), left('a'))
             * assert.deepStrictEqual(S.concat(left('a'), right(2)), right(2))
             * assert.deepStrictEqual(S.concat(right(1), left('b')), right(1))
             * assert.deepStrictEqual(S.concat(right(1), right(2)), right(3))
             *
             * @category instances
             * @since 2.0.0
             */
            var getSemigroup = function (S) {
                return {
                    concat: function (x, y) {
                        return exports.isLeft(y)
                            ? x
                            : exports.isLeft(x)
                            ? y
                            : exports.right(S.concat(x.right, y.right))
                    },
                }
            }
            exports.getSemigroup = getSemigroup
            /**
             * Builds a `Compactable` instance for `Either` given `Monoid` for the left side.
             *
             * @category instances
             * @since 2.10.0
             */
            var getCompactable = function (M) {
                var empty = exports.left(M.empty)
                return {
                    URI: exports.URI,
                    _E: undefined,
                    compact: function (ma) {
                        return exports.isLeft(ma)
                            ? ma
                            : ma.right._tag === "None"
                            ? empty
                            : exports.right(ma.right.value)
                    },
                    separate: function (ma) {
                        return exports.isLeft(ma)
                            ? Separated_1.separated(ma, ma)
                            : exports.isLeft(ma.right)
                            ? Separated_1.separated(exports.right(ma.right.left), empty)
                            : Separated_1.separated(empty, exports.right(ma.right.right))
                    },
                }
            }
            exports.getCompactable = getCompactable
            /**
             * Builds a `Filterable` instance for `Either` given `Monoid` for the left side
             *
             * @category instances
             * @since 2.10.0
             */
            var getFilterable = function (M) {
                var empty = exports.left(M.empty)
                var _a = exports.getCompactable(M),
                    compact = _a.compact,
                    separate = _a.separate
                var filter = function (ma, predicate) {
                    return exports.isLeft(ma) ? ma : predicate(ma.right) ? ma : empty
                }
                var partition = function (ma, p) {
                    return exports.isLeft(ma)
                        ? Separated_1.separated(ma, ma)
                        : p(ma.right)
                        ? Separated_1.separated(empty, exports.right(ma.right))
                        : Separated_1.separated(exports.right(ma.right), empty)
                }
                return {
                    URI: exports.URI,
                    _E: undefined,
                    map: _map,
                    compact: compact,
                    separate: separate,
                    filter: filter,
                    filterMap: function (ma, f) {
                        if (exports.isLeft(ma)) {
                            return ma
                        }
                        var ob = f(ma.right)
                        return ob._tag === "None" ? empty : exports.right(ob.value)
                    },
                    partition: partition,
                    partitionMap: function (ma, f) {
                        if (exports.isLeft(ma)) {
                            return Separated_1.separated(ma, ma)
                        }
                        var e = f(ma.right)
                        return exports.isLeft(e)
                            ? Separated_1.separated(exports.right(e.left), empty)
                            : Separated_1.separated(empty, exports.right(e.right))
                    },
                }
            }
            exports.getFilterable = getFilterable
            /**
             * Builds `Witherable` instance for `Either` given `Monoid` for the left side
             *
             * @category instances
             * @since 2.0.0
             */
            var getWitherable = function (M) {
                var F_ = exports.getFilterable(M)
                var C = exports.getCompactable(M)
                return {
                    URI: exports.URI,
                    _E: undefined,
                    map: _map,
                    compact: F_.compact,
                    separate: F_.separate,
                    filter: F_.filter,
                    filterMap: F_.filterMap,
                    partition: F_.partition,
                    partitionMap: F_.partitionMap,
                    traverse: _traverse,
                    sequence: exports.sequence,
                    reduce: _reduce,
                    foldMap: _foldMap,
                    reduceRight: _reduceRight,
                    wither: Witherable_1.witherDefault(exports.Traversable, C),
                    wilt: Witherable_1.wiltDefault(exports.Traversable, C),
                }
            }
            exports.getWitherable = getWitherable
            /**
             * @category instances
             * @since 2.7.0
             */
            var getApplicativeValidation = function (SE) {
                return {
                    URI: exports.URI,
                    _E: undefined,
                    map: _map,
                    ap: function (fab, fa) {
                        return exports.isLeft(fab)
                            ? exports.isLeft(fa)
                                ? exports.left(SE.concat(fab.left, fa.left))
                                : fab
                            : exports.isLeft(fa)
                            ? fa
                            : exports.right(fab.right(fa.right))
                    },
                    of: exports.of,
                }
            }
            exports.getApplicativeValidation = getApplicativeValidation
            /**
             * @category instances
             * @since 2.7.0
             */
            var getAltValidation = function (SE) {
                return {
                    URI: exports.URI,
                    _E: undefined,
                    map: _map,
                    alt: function (me, that) {
                        if (exports.isRight(me)) {
                            return me
                        }
                        var ea = that()
                        return exports.isLeft(ea) ? exports.left(SE.concat(me.left, ea.left)) : ea
                    },
                }
            }
            exports.getAltValidation = getAltValidation
            /**
             * @category instance operations
             * @since 2.0.0
             */
            var map = function (f) {
                return function (fa) {
                    return exports.isLeft(fa) ? fa : exports.right(f(fa.right))
                }
            }
            exports.map = map
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Functor = {
                URI: exports.URI,
                map: _map,
            }
            /**
             * @category instance operations
             * @since 2.7.0
             */
            exports.of = exports.right
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Pointed = {
                URI: exports.URI,
                of: exports.of,
            }
            /**
             * Less strict version of [`ap`](#ap).
             *
             * @category instance operations
             * @since 2.8.0
             */
            var apW = function (fa) {
                return function (fab) {
                    return exports.isLeft(fab)
                        ? fab
                        : exports.isLeft(fa)
                        ? fa
                        : exports.right(fab.right(fa.right))
                }
            }
            exports.apW = apW
            /**
             * Apply a function to an argument under a type constructor.
             *
             * @category instance operations
             * @since 2.0.0
             */
            exports.ap = exports.apW
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Apply = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Applicative = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                of: exports.of,
            }
            /**
             * Less strict version of [`chain`](#chain).
             *
             * @category instance operations
             * @since 2.6.0
             */
            var chainW = function (f) {
                return function (ma) {
                    return exports.isLeft(ma) ? ma : f(ma.right)
                }
            }
            exports.chainW = chainW
            /**
             * Composes computations in sequence, using the return value of one computation to determine the next computation.
             *
             * @category instance operations
             * @since 2.0.0
             */
            exports.chain = exports.chainW
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Chain = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                chain: _chain,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Monad = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                of: exports.of,
                chain: _chain,
            }
            /**
             * Left-associative fold of a structure.
             *
             * @example
             * import { pipe } from 'fp-ts/function'
             * import * as E from 'fp-ts/Either'
             *
             * const startWith = 'prefix'
             * const concat = (a: string, b: string) => `${a}:${b}`
             *
             * assert.deepStrictEqual(
             *   pipe(E.right('a'), E.reduce(startWith, concat)),
             *   'prefix:a'
             * )
             *
             * assert.deepStrictEqual(
             *   pipe(E.left('e'), E.reduce(startWith, concat)),
             *   'prefix'
             * )
             *
             * @category instance operations
             * @since 2.0.0
             */
            var reduce = function (b, f) {
                return function (fa) {
                    return exports.isLeft(fa) ? b : f(b, fa.right)
                }
            }
            exports.reduce = reduce
            /**
             * Map each element of the structure to a monoid, and combine the results.
             *
             * @example
             * import { pipe } from 'fp-ts/function'
             * import * as E from 'fp-ts/Either'
             * import * as S from 'fp-ts/string'
             *
             * const yell = (a: string) => `${a}!`
             *
             * assert.deepStrictEqual(
             *   pipe(E.right('a'), E.foldMap(S.Monoid)(yell)),
             *   'a!'
             * )
             *
             * assert.deepStrictEqual(
             *   pipe(E.left('e'), E.foldMap(S.Monoid)(yell)),
             *   S.Monoid.empty
             * )
             *
             * @category instance operations
             * @since 2.0.0
             */
            var foldMap = function (M) {
                return function (f) {
                    return function (fa) {
                        return exports.isLeft(fa) ? M.empty : f(fa.right)
                    }
                }
            }
            exports.foldMap = foldMap
            /**
             * Right-associative fold of a structure.
             *
             * @example
             * import { pipe } from 'fp-ts/function'
             * import * as E from 'fp-ts/Either'
             *
             * const startWith = 'postfix'
             * const concat = (a: string, b: string) => `${a}:${b}`
             *
             * assert.deepStrictEqual(
             *   pipe(E.right('a'), E.reduceRight(startWith, concat)),
             *   'a:postfix'
             * )
             *
             * assert.deepStrictEqual(
             *   pipe(E.left('e'), E.reduceRight(startWith, concat)),
             *   'postfix'
             * )
             *
             * @category instance operations
             * @since 2.0.0
             */
            var reduceRight = function (b, f) {
                return function (fa) {
                    return exports.isLeft(fa) ? b : f(fa.right, b)
                }
            }
            exports.reduceRight = reduceRight
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Foldable = {
                URI: exports.URI,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
            }
            /**
             * Map each element of a structure to an action, evaluate these actions from left to right, and collect the results.
             *
             * @example
             * import { pipe } from 'fp-ts/function'
             * import * as RA from 'fp-ts/ReadonlyArray'
             * import * as E from 'fp-ts/Either'
             * import * as O from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(
             *   pipe(E.right(['a']), E.traverse(O.Applicative)(RA.head)),
             *   O.some(E.right('a'))
             *  )
             *
             * assert.deepStrictEqual(
             *   pipe(E.right([]), E.traverse(O.Applicative)(RA.head)),
             *   O.none
             * )
             *
             * @category instance operations
             * @since 2.6.3
             */
            var traverse = function (F) {
                return function (f) {
                    return function (ta) {
                        return exports.isLeft(ta)
                            ? F.of(exports.left(ta.left))
                            : F.map(f(ta.right), exports.right)
                    }
                }
            }
            exports.traverse = traverse
            /**
             * Evaluate each monadic action in the structure from left to right, and collect the results.
             *
             * @example
             * import { pipe } from 'fp-ts/function'
             * import * as E from 'fp-ts/Either'
             * import * as O from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(
             *   pipe(E.right(O.some('a')), E.sequence(O.Applicative)),
             *   O.some(E.right('a'))
             *  )
             *
             * assert.deepStrictEqual(
             *   pipe(E.right(O.none), E.sequence(O.Applicative)),
             *   O.none
             * )
             *
             * @category instance operations
             * @since 2.6.3
             */
            var sequence = function (F) {
                return function (ma) {
                    return exports.isLeft(ma)
                        ? F.of(exports.left(ma.left))
                        : F.map(ma.right, exports.right)
                }
            }
            exports.sequence = sequence
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Traversable = {
                URI: exports.URI,
                map: _map,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                traverse: _traverse,
                sequence: exports.sequence,
            }
            /**
             * Map a pair of functions over the two type arguments of the bifunctor.
             *
             * @category instance operations
             * @since 2.0.0
             */
            var bimap = function (f, g) {
                return function (fa) {
                    return exports.isLeft(fa)
                        ? exports.left(f(fa.left))
                        : exports.right(g(fa.right))
                }
            }
            exports.bimap = bimap
            /**
             * Map a function over the first type argument of a bifunctor.
             *
             * @category instance operations
             * @since 2.0.0
             */
            var mapLeft = function (f) {
                return function (fa) {
                    return exports.isLeft(fa) ? exports.left(f(fa.left)) : fa
                }
            }
            exports.mapLeft = mapLeft
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Bifunctor = {
                URI: exports.URI,
                bimap: _bimap,
                mapLeft: _mapLeft,
            }
            /**
             * Less strict version of [`alt`](#alt).
             *
             * @category instance operations
             * @since 2.9.0
             */
            var altW = function (that) {
                return function (fa) {
                    return exports.isLeft(fa) ? that() : fa
                }
            }
            exports.altW = altW
            /**
             * Identifies an associative operation on a type constructor. It is similar to `Semigroup`, except that it applies to
             * types of kind `* -> *`.
             *
             * @category instance operations
             * @since 2.0.0
             */
            exports.alt = exports.altW
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Alt = {
                URI: exports.URI,
                map: _map,
                alt: _alt,
            }
            /**
             * @category instance operations
             * @since 2.0.0
             */
            var extend = function (f) {
                return function (wa) {
                    return exports.isLeft(wa) ? wa : exports.right(f(wa))
                }
            }
            exports.extend = extend
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Extend = {
                URI: exports.URI,
                map: _map,
                extend: _extend,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.ChainRec = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                chain: _chain,
                chainRec: _chainRec,
            }
            /**
             * @category instance operations
             * @since 2.6.3
             */
            exports.throwError = exports.left
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.MonadThrow = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                of: exports.of,
                chain: _chain,
                throwError: exports.throwError,
            }
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.FromEither = {
                URI: exports.URI,
                fromEither: function_1.identity,
            }
            /**
             * @example
             * import { fromPredicate, left, right } from 'fp-ts/Either'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(
             *   pipe(
             *     1,
             *     fromPredicate(
             *       (n) => n > 0,
             *       () => 'error'
             *     )
             *   ),
             *   right(1)
             * )
             * assert.deepStrictEqual(
             *   pipe(
             *     -1,
             *     fromPredicate(
             *       (n) => n > 0,
             *       () => 'error'
             *     )
             *   ),
             *   left('error')
             * )
             *
             * @category constructors
             * @since 2.0.0
             */
            exports.fromPredicate =
                /*#__PURE__*/
                FromEither_1.fromPredicate(exports.FromEither)
            // -------------------------------------------------------------------------------------
            // natural transformations
            // -------------------------------------------------------------------------------------
            /**
             * @example
             * import * as E from 'fp-ts/Either'
             * import { pipe } from 'fp-ts/function'
             * import * as O from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(
             *   pipe(
             *     O.some(1),
             *     E.fromOption(() => 'error')
             *   ),
             *   E.right(1)
             * )
             * assert.deepStrictEqual(
             *   pipe(
             *     O.none,
             *     E.fromOption(() => 'error')
             *   ),
             *   E.left('error')
             * )
             *
             * @category natural transformations
             * @since 2.0.0
             */
            exports.fromOption =
                /*#__PURE__*/
                FromEither_1.fromOption(exports.FromEither)
            // -------------------------------------------------------------------------------------
            // refinements
            // -------------------------------------------------------------------------------------
            /**
             * Returns `true` if the either is an instance of `Left`, `false` otherwise.
             *
             * @category refinements
             * @since 2.0.0
             */
            exports.isLeft = _.isLeft
            /**
             * Returns `true` if the either is an instance of `Right`, `false` otherwise.
             *
             * @category refinements
             * @since 2.0.0
             */
            exports.isRight = _.isRight
            // -------------------------------------------------------------------------------------
            // destructors
            // -------------------------------------------------------------------------------------
            /**
             * Less strict version of [`match`](#match).
             *
             * @category destructors
             * @since 2.10.0
             */
            var matchW = function (onLeft, onRight) {
                return function (ma) {
                    return exports.isLeft(ma) ? onLeft(ma.left) : onRight(ma.right)
                }
            }
            exports.matchW = matchW
            /**
             * Alias of [`matchW`](#matchw).
             *
             * @category destructors
             * @since 2.10.0
             */
            exports.foldW = exports.matchW
            /**
             * Takes two functions and an `Either` value, if the value is a `Left` the inner value is applied to the first function,
             * if the value is a `Right` the inner value is applied to the second function.
             *
             * @example
             * import { match, left, right } from 'fp-ts/Either'
             * import { pipe } from 'fp-ts/function'
             *
             * function onLeft(errors: Array<string>): string {
             *   return `Errors: ${errors.join(', ')}`
             * }
             *
             * function onRight(value: number): string {
             *   return `Ok: ${value}`
             * }
             *
             * assert.strictEqual(
             *   pipe(
             *     right(1),
             *     match(onLeft, onRight)
             *   ),
             *   'Ok: 1'
             * )
             * assert.strictEqual(
             *   pipe(
             *     left(['error 1', 'error 2']),
             *     match(onLeft, onRight)
             *   ),
             *   'Errors: error 1, error 2'
             * )
             *
             * @category destructors
             * @since 2.10.0
             */
            exports.match = exports.matchW
            /**
             * Alias of [`match`](#match).
             *
             * @category destructors
             * @since 2.0.0
             */
            exports.fold = exports.match
            /**
             * Less strict version of [`getOrElse`](#getorelse).
             *
             * @category destructors
             * @since 2.6.0
             */
            var getOrElseW = function (onLeft) {
                return function (ma) {
                    return exports.isLeft(ma) ? onLeft(ma.left) : ma.right
                }
            }
            exports.getOrElseW = getOrElseW
            /**
             * Returns the wrapped value if it's a `Right` or a default value if is a `Left`.
             *
             * @example
             * import { getOrElse, left, right } from 'fp-ts/Either'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(
             *   pipe(
             *     right(1),
             *     getOrElse(() => 0)
             *   ),
             *   1
             * )
             * assert.deepStrictEqual(
             *   pipe(
             *     left('error'),
             *     getOrElse(() => 0)
             *   ),
             *   0
             * )
             *
             * @category destructors
             * @since 2.0.0
             */
            exports.getOrElse = exports.getOrElseW
            // -------------------------------------------------------------------------------------
            // combinators
            // -------------------------------------------------------------------------------------
            /**
             * Derivable from `Functor`.
             *
             * @category combinators
             * @since 2.10.0
             */
            exports.flap =
                /*#__PURE__*/
                Functor_1.flap(exports.Functor)
            /**
             * Combine two effectful actions, keeping only the result of the first.
             *
             * Derivable from `Apply`.
             *
             * @category combinators
             * @since 2.0.0
             */
            exports.apFirst =
                /*#__PURE__*/
                Apply_1.apFirst(exports.Apply)
            /**
             * Combine two effectful actions, keeping only the result of the second.
             *
             * Derivable from `Apply`.
             *
             * @category combinators
             * @since 2.0.0
             */
            exports.apSecond =
                /*#__PURE__*/
                Apply_1.apSecond(exports.Apply)
            /**
             * Composes computations in sequence, using the return value of one computation to determine the next computation and
             * keeping only the result of the first.
             *
             * Derivable from `Chain`.
             *
             * @category combinators
             * @since 2.0.0
             */
            exports.chainFirst =
                /*#__PURE__*/
                Chain_1.chainFirst(exports.Chain)
            /**
             * Less strict version of [`chainFirst`](#chainfirst)
             *
             * Derivable from `Chain`.
             *
             * @category combinators
             * @since 2.8.0
             */
            exports.chainFirstW = exports.chainFirst
            /**
             * Less strict version of [`flatten`](#flatten).
             *
             * @category combinators
             * @since 2.11.0
             */
            exports.flattenW =
                /*#__PURE__*/
                exports.chainW(function_1.identity)
            /**
             * The `flatten` function is the conventional monad join operator. It is used to remove one level of monadic structure, projecting its bound argument into the outer level.
             *
             * Derivable from `Chain`.
             *
             * @example
             * import * as E from 'fp-ts/Either'
             *
             * assert.deepStrictEqual(E.flatten(E.right(E.right('a'))), E.right('a'))
             * assert.deepStrictEqual(E.flatten(E.right(E.left('e'))), E.left('e'))
             * assert.deepStrictEqual(E.flatten(E.left('e')), E.left('e'))
             *
             * @category combinators
             * @since 2.0.0
             */
            exports.flatten = exports.flattenW
            /**
             * Derivable from `Extend`.
             *
             * @category combinators
             * @since 2.0.0
             */
            exports.duplicate =
                /*#__PURE__*/
                exports.extend(function_1.identity)
            /**
             * @category combinators
             * @since 2.10.0
             */
            exports.fromOptionK =
                /*#__PURE__*/
                FromEither_1.fromOptionK(exports.FromEither)
            /**
             * @category combinators
             * @since 2.11.0
             */
            exports.chainOptionK =
                /*#__PURE__*/
                FromEither_1.chainOptionK(exports.FromEither, exports.Chain)
            /**
             * @example
             * import * as E from 'fp-ts/Either'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(
             *   pipe(
             *     E.right(1),
             *     E.filterOrElse(
             *       (n) => n > 0,
             *       () => 'error'
             *     )
             *   ),
             *   E.right(1)
             * )
             * assert.deepStrictEqual(
             *   pipe(
             *     E.right(-1),
             *     E.filterOrElse(
             *       (n) => n > 0,
             *       () => 'error'
             *     )
             *   ),
             *   E.left('error')
             * )
             * assert.deepStrictEqual(
             *   pipe(
             *     E.left('a'),
             *     E.filterOrElse(
             *       (n) => n > 0,
             *       () => 'error'
             *     )
             *   ),
             *   E.left('a')
             * )
             *
             * @category combinators
             * @since 2.0.0
             */
            exports.filterOrElse =
                /*#__PURE__*/
                FromEither_1.filterOrElse(exports.FromEither, exports.Chain)
            /**
             * Less strict version of [`filterOrElse`](#filterorelse).
             *
             * @category combinators
             * @since 2.9.0
             */
            exports.filterOrElseW = exports.filterOrElse
            /**
             * Returns a `Right` if is a `Left` (and vice versa).
             *
             * @category combinators
             * @since 2.0.0
             */
            var swap = function (ma) {
                return exports.isLeft(ma) ? exports.right(ma.left) : exports.left(ma.right)
            }
            exports.swap = swap
            /**
             * Less strict version of [`orElse`](#orelse).
             *
             * @category combinators
             * @since 2.10.0
             */
            var orElseW = function (onLeft) {
                return function (ma) {
                    return exports.isLeft(ma) ? onLeft(ma.left) : ma
                }
            }
            exports.orElseW = orElseW
            /**
             * Useful for recovering from errors.
             *
             * @category combinators
             * @since 2.0.0
             */
            exports.orElse = exports.orElseW
            // -------------------------------------------------------------------------------------
            // interop
            // -------------------------------------------------------------------------------------
            /**
             * Takes a default and a nullable value, if the value is not nully, turn it into a `Right`, if the value is nully use
             * the provided default as a `Left`.
             *
             * @example
             * import { fromNullable, left, right } from 'fp-ts/Either'
             *
             * const parse = fromNullable('nully')
             *
             * assert.deepStrictEqual(parse(1), right(1))
             * assert.deepStrictEqual(parse(null), left('nully'))
             *
             * @category interop
             * @since 2.0.0
             */
            var fromNullable = function (e) {
                return function (a) {
                    return a == null ? exports.left(e) : exports.right(a)
                }
            }
            exports.fromNullable = fromNullable
            /**
             * Constructs a new `Either` from a function that might throw.
             *
             * See also [`tryCatchK`](#trycatchk).
             *
             * @example
             * import * as E from 'fp-ts/Either'
             *
             * const unsafeHead = <A>(as: ReadonlyArray<A>): A => {
             *   if (as.length > 0) {
             *     return as[0]
             *   } else {
             *     throw new Error('empty array')
             *   }
             * }
             *
             * const head = <A>(as: ReadonlyArray<A>): E.Either<Error, A> =>
             *   E.tryCatch(() => unsafeHead(as), e => (e instanceof Error ? e : new Error('unknown error')))
             *
             * assert.deepStrictEqual(head([]), E.left(new Error('empty array')))
             * assert.deepStrictEqual(head([1, 2, 3]), E.right(1))
             *
             * @category interop
             * @since 2.0.0
             */
            var tryCatch = function (f, onThrow) {
                try {
                    return exports.right(f())
                } catch (e) {
                    return exports.left(onThrow(e))
                }
            }
            exports.tryCatch = tryCatch
            /**
             * Converts a function that may throw to one returning a `Either`.
             *
             * @category interop
             * @since 2.10.0
             */
            var tryCatchK = function (f, onThrow) {
                return function () {
                    var a = []
                    for (var _i = 0; _i < arguments.length; _i++) {
                        a[_i] = arguments[_i]
                    }
                    return exports.tryCatch(function () {
                        return f.apply(void 0, a)
                    }, onThrow)
                }
            }
            exports.tryCatchK = tryCatchK
            /**
             * @category interop
             * @since 2.9.0
             */
            var fromNullableK = function (e) {
                var from = exports.fromNullable(e)
                return function (f) {
                    return function_1.flow(f, from)
                }
            }
            exports.fromNullableK = fromNullableK
            /**
             * @category interop
             * @since 2.9.0
             */
            var chainNullableK = function (e) {
                var from = exports.fromNullableK(e)
                return function (f) {
                    return exports.chain(from(f))
                }
            }
            exports.chainNullableK = chainNullableK
            /**
             * @category interop
             * @since 2.10.0
             */
            exports.toUnion =
                /*#__PURE__*/
                exports.foldW(function_1.identity, function_1.identity)
            // -------------------------------------------------------------------------------------
            // utils
            // -------------------------------------------------------------------------------------
            /**
             * Default value for the `onError` argument of `tryCatch`
             *
             * @since 2.0.0
             */
            function toError(e) {
                return e instanceof Error ? e : new Error(String(e))
            }
            exports.toError = toError
            function elem(E) {
                return function (a, ma) {
                    if (ma === undefined) {
                        var elemE_1 = elem(E)
                        return function (ma) {
                            return elemE_1(a, ma)
                        }
                    }
                    return exports.isLeft(ma) ? false : E.equals(a, ma.right)
                }
            }
            exports.elem = elem
            /**
             * Returns `false` if `Left` or returns the result of the application of the given predicate to the `Right` value.
             *
             * @example
             * import { exists, left, right } from 'fp-ts/Either'
             *
             * const gt2 = exists((n: number) => n > 2)
             *
             * assert.strictEqual(gt2(left('a')), false)
             * assert.strictEqual(gt2(right(1)), false)
             * assert.strictEqual(gt2(right(3)), true)
             *
             * @since 2.0.0
             */
            var exists = function (predicate) {
                return function (ma) {
                    return exports.isLeft(ma) ? false : predicate(ma.right)
                }
            }
            exports.exists = exists
            // -------------------------------------------------------------------------------------
            // do notation
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.9.0
             */
            exports.Do =
                /*#__PURE__*/
                exports.of(_.emptyRecord)
            /**
             * @since 2.8.0
             */
            exports.bindTo =
                /*#__PURE__*/
                Functor_1.bindTo(exports.Functor)
            /**
             * @since 2.8.0
             */
            exports.bind =
                /*#__PURE__*/
                Chain_1.bind(exports.Chain)
            /**
             * @since 2.8.0
             */
            exports.bindW = exports.bind
            // -------------------------------------------------------------------------------------
            // pipeable sequence S
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.8.0
             */
            exports.apS =
                /*#__PURE__*/
                Apply_1.apS(exports.Apply)
            /**
             * @since 2.8.0
             */
            exports.apSW = exports.apS
            // -------------------------------------------------------------------------------------
            // sequence T
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.11.0
             */
            exports.ApT =
                /*#__PURE__*/
                exports.of(_.emptyReadonlyArray)
            // -------------------------------------------------------------------------------------
            // array utils
            // -------------------------------------------------------------------------------------
            /**
             * Equivalent to `ReadonlyNonEmptyArray#traverseWithIndex(Applicative)`.
             *
             * @since 2.11.0
             */
            var traverseReadonlyNonEmptyArrayWithIndex = function (f) {
                return function (as) {
                    var e = f(0, _.head(as))
                    if (exports.isLeft(e)) {
                        return e
                    }
                    var out = [e.right]
                    for (var i = 1; i < as.length; i++) {
                        var e_1 = f(i, as[i])
                        if (exports.isLeft(e_1)) {
                            return e_1
                        }
                        out.push(e_1.right)
                    }
                    return exports.right(out)
                }
            }
            exports.traverseReadonlyNonEmptyArrayWithIndex = traverseReadonlyNonEmptyArrayWithIndex
            /**
             * Equivalent to `ReadonlyArray#traverseWithIndex(Applicative)`.
             *
             * @since 2.11.0
             */
            var traverseReadonlyArrayWithIndex = function (f) {
                var g = exports.traverseReadonlyNonEmptyArrayWithIndex(f)
                return function (as) {
                    return _.isNonEmpty(as) ? g(as) : exports.ApT
                }
            }
            exports.traverseReadonlyArrayWithIndex = traverseReadonlyArrayWithIndex
            /**
             * @since 2.9.0
             */
            exports.traverseArrayWithIndex = exports.traverseReadonlyArrayWithIndex
            /**
             * @since 2.9.0
             */
            var traverseArray = function (f) {
                return exports.traverseReadonlyArrayWithIndex(function (_, a) {
                    return f(a)
                })
            }
            exports.traverseArray = traverseArray
            /**
             * @since 2.9.0
             */
            exports.sequenceArray =
                /*#__PURE__*/
                exports.traverseArray(function_1.identity)
            /**
             * Use [`parse`](./Json.ts.html#parse) instead.
             *
             * @category constructors
             * @since 2.0.0
             * @deprecated
             */
            function parseJSON(s, onError) {
                return exports.tryCatch(function () {
                    return JSON.parse(s)
                }, onError)
            }
            exports.parseJSON = parseJSON
            /**
             * Use [`stringify`](./Json.ts.html#stringify) instead.
             *
             * @category constructors
             * @since 2.0.0
             * @deprecated
             */
            var stringifyJSON = function (u, onError) {
                return exports.tryCatch(function () {
                    var s = JSON.stringify(u)
                    if (typeof s !== "string") {
                        throw new Error("Converting unsupported structure to JSON")
                    }
                    return s
                }, onError)
            }
            exports.stringifyJSON = stringifyJSON
            /**
             * Use small, specific instances instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.either = {
                URI: exports.URI,
                map: _map,
                of: exports.of,
                ap: _ap,
                chain: _chain,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                traverse: _traverse,
                sequence: exports.sequence,
                bimap: _bimap,
                mapLeft: _mapLeft,
                alt: _alt,
                extend: _extend,
                chainRec: _chainRec,
                throwError: exports.throwError,
            }
            /**
             * Use [`getApplySemigroup`](./Apply.ts.html#getapplysemigroup) instead.
             *
             * Semigroup returning the left-most `Left` value. If both operands are `Right`s then the inner values
             * are concatenated using the provided `Semigroup`
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.getApplySemigroup =
                /*#__PURE__*/
                Apply_1.getApplySemigroup(exports.Apply)
            /**
             * Use [`getApplicativeMonoid`](./Applicative.ts.html#getapplicativemonoid) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.getApplyMonoid =
                /*#__PURE__*/
                Applicative_1.getApplicativeMonoid(exports.Applicative)
            /**
             * Use [`getApplySemigroup`](./Apply.ts.html#getapplysemigroup) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            var getValidationSemigroup = function (SE, SA) {
                return Apply_1.getApplySemigroup(exports.getApplicativeValidation(SE))(SA)
            }
            exports.getValidationSemigroup = getValidationSemigroup
            /**
             * Use [`getApplicativeMonoid`](./Applicative.ts.html#getapplicativemonoid) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            var getValidationMonoid = function (SE, MA) {
                return Applicative_1.getApplicativeMonoid(exports.getApplicativeValidation(SE))(MA)
            }
            exports.getValidationMonoid = getValidationMonoid
            /**
             * Use [`getApplicativeValidation`](#getapplicativevalidation) and [`getAltValidation`](#getaltvalidation) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            function getValidation(SE) {
                var ap = exports.getApplicativeValidation(SE).ap
                var alt = exports.getAltValidation(SE).alt
                return {
                    URI: exports.URI,
                    _E: undefined,
                    map: _map,
                    of: exports.of,
                    chain: _chain,
                    bimap: _bimap,
                    mapLeft: _mapLeft,
                    reduce: _reduce,
                    foldMap: _foldMap,
                    reduceRight: _reduceRight,
                    extend: _extend,
                    traverse: _traverse,
                    sequence: exports.sequence,
                    chainRec: _chainRec,
                    throwError: exports.throwError,
                    ap: ap,
                    alt: alt,
                }
            }
            exports.getValidation = getValidation

            /***/
        },

        /***/ 6964: /***/ (__unused_webpack_module, exports, __nccwpck_require__) => {
            "use strict"

            Object.defineProperty(exports, "__esModule", { value: true })
            exports.eqDate = exports.eqNumber = exports.eqString = exports.eqBoolean = exports.eq = exports.strictEqual = exports.getStructEq = exports.getTupleEq = exports.Contravariant = exports.getMonoid = exports.getSemigroup = exports.eqStrict = exports.URI = exports.contramap = exports.tuple = exports.struct = exports.fromEquals = void 0
            var function_1 = __nccwpck_require__(6985)
            // -------------------------------------------------------------------------------------
            // constructors
            // -------------------------------------------------------------------------------------
            /**
             * @category constructors
             * @since 2.0.0
             */
            var fromEquals = function (equals) {
                return {
                    equals: function (x, y) {
                        return x === y || equals(x, y)
                    },
                }
            }
            exports.fromEquals = fromEquals
            // -------------------------------------------------------------------------------------
            // combinators
            // -------------------------------------------------------------------------------------
            /**
             * @category combinators
             * @since 2.10.0
             */
            var struct = function (eqs) {
                return exports.fromEquals(function (first, second) {
                    for (var key in eqs) {
                        if (!eqs[key].equals(first[key], second[key])) {
                            return false
                        }
                    }
                    return true
                })
            }
            exports.struct = struct
            /**
             * Given a tuple of `Eq`s returns a `Eq` for the tuple
             *
             * @example
             * import { tuple } from 'fp-ts/Eq'
             * import * as S from 'fp-ts/string'
             * import * as N from 'fp-ts/number'
             * import * as B from 'fp-ts/boolean'
             *
             * const E = tuple(S.Eq, N.Eq, B.Eq)
             * assert.strictEqual(E.equals(['a', 1, true], ['a', 1, true]), true)
             * assert.strictEqual(E.equals(['a', 1, true], ['b', 1, true]), false)
             * assert.strictEqual(E.equals(['a', 1, true], ['a', 2, true]), false)
             * assert.strictEqual(E.equals(['a', 1, true], ['a', 1, false]), false)
             *
             * @category combinators
             * @since 2.10.0
             */
            var tuple = function () {
                var eqs = []
                for (var _i = 0; _i < arguments.length; _i++) {
                    eqs[_i] = arguments[_i]
                }
                return exports.fromEquals(function (first, second) {
                    return eqs.every(function (E, i) {
                        return E.equals(first[i], second[i])
                    })
                })
            }
            exports.tuple = tuple
            // -------------------------------------------------------------------------------------
            // non-pipeables
            // -------------------------------------------------------------------------------------
            /* istanbul ignore next */
            var contramap_ = function (fa, f) {
                return function_1.pipe(fa, exports.contramap(f))
            }
            // -------------------------------------------------------------------------------------
            // type class members
            // -------------------------------------------------------------------------------------
            /**
             * @category Contravariant
             * @since 2.0.0
             */
            var contramap = function (f) {
                return function (fa) {
                    return exports.fromEquals(function (x, y) {
                        return fa.equals(f(x), f(y))
                    })
                }
            }
            exports.contramap = contramap
            // -------------------------------------------------------------------------------------
            // instances
            // -------------------------------------------------------------------------------------
            /**
             * @category instances
             * @since 2.0.0
             */
            exports.URI = "Eq"
            /**
             * @category instances
             * @since 2.5.0
             */
            exports.eqStrict = {
                equals: function (a, b) {
                    return a === b
                },
            }
            var empty = {
                equals: function () {
                    return true
                },
            }
            /**
             * @category instances
             * @since 2.10.0
             */
            var getSemigroup = function () {
                return {
                    concat: function (x, y) {
                        return exports.fromEquals(function (a, b) {
                            return x.equals(a, b) && y.equals(a, b)
                        })
                    },
                }
            }
            exports.getSemigroup = getSemigroup
            /**
             * @category instances
             * @since 2.6.0
             */
            var getMonoid = function () {
                return {
                    concat: exports.getSemigroup().concat,
                    empty: empty,
                }
            }
            exports.getMonoid = getMonoid
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Contravariant = {
                URI: exports.URI,
                contramap: contramap_,
            }
            // -------------------------------------------------------------------------------------
            // deprecated
            // -------------------------------------------------------------------------------------
            /**
             * Use [`tuple`](#tuple) instead.
             *
             * @category combinators
             * @since 2.0.0
             * @deprecated
             */
            exports.getTupleEq = exports.tuple
            /**
             * Use [`struct`](#struct) instead.
             *
             * @category combinators
             * @since 2.0.0
             * @deprecated
             */
            exports.getStructEq = exports.struct
            /**
             * Use [`eqStrict`](#eqstrict) instead
             *
             * @since 2.0.0
             * @deprecated
             */
            exports.strictEqual = exports.eqStrict.equals
            /**
             * Use small, specific instances instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.eq = exports.Contravariant
            /**
             * Use [`Eq`](./boolean.ts.html#eq) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.eqBoolean = exports.eqStrict
            /**
             * Use [`Eq`](./string.ts.html#eq) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.eqString = exports.eqStrict
            /**
             * Use [`Eq`](./number.ts.html#eq) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.eqNumber = exports.eqStrict
            /**
             * Use [`Eq`](./Date.ts.html#eq) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.eqDate = {
                equals: function (first, second) {
                    return first.valueOf() === second.valueOf()
                },
            }

            /***/
        },

        /***/ 1964: /***/ function (__unused_webpack_module, exports, __nccwpck_require__) {
            "use strict"

            /**
             * The `FromEither` type class represents those data types which support errors.
             *
             * @since 2.10.0
             */
            var __createBinding =
                (this && this.__createBinding) ||
                (Object.create
                    ? function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          Object.defineProperty(o, k2, {
                              enumerable: true,
                              get: function () {
                                  return m[k]
                              },
                          })
                      }
                    : function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          o[k2] = m[k]
                      })
            var __setModuleDefault =
                (this && this.__setModuleDefault) ||
                (Object.create
                    ? function (o, v) {
                          Object.defineProperty(o, "default", { enumerable: true, value: v })
                      }
                    : function (o, v) {
                          o["default"] = v
                      })
            var __importStar =
                (this && this.__importStar) ||
                function (mod) {
                    if (mod && mod.__esModule) return mod
                    var result = {}
                    if (mod != null)
                        for (var k in mod)
                            if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
                                __createBinding(result, mod, k)
                    __setModuleDefault(result, mod)
                    return result
                }
            Object.defineProperty(exports, "__esModule", { value: true })
            exports.filterOrElse = exports.chainEitherK = exports.fromEitherK = exports.chainOptionK = exports.fromOptionK = exports.fromPredicate = exports.fromOption = void 0
            var function_1 = __nccwpck_require__(6985)
            var _ = __importStar(__nccwpck_require__(1840))
            function fromOption(F) {
                return function (onNone) {
                    return function (ma) {
                        return F.fromEither(_.isNone(ma) ? _.left(onNone()) : _.right(ma.value))
                    }
                }
            }
            exports.fromOption = fromOption
            function fromPredicate(F) {
                return function (predicate, onFalse) {
                    return function (a) {
                        return F.fromEither(predicate(a) ? _.right(a) : _.left(onFalse(a)))
                    }
                }
            }
            exports.fromPredicate = fromPredicate
            function fromOptionK(F) {
                var fromOptionF = fromOption(F)
                return function (onNone) {
                    var from = fromOptionF(onNone)
                    return function (f) {
                        return function_1.flow(f, from)
                    }
                }
            }
            exports.fromOptionK = fromOptionK
            function chainOptionK(F, M) {
                var fromOptionKF = fromOptionK(F)
                return function (onNone) {
                    var from = fromOptionKF(onNone)
                    return function (f) {
                        return function (ma) {
                            return M.chain(ma, from(f))
                        }
                    }
                }
            }
            exports.chainOptionK = chainOptionK
            function fromEitherK(F) {
                return function (f) {
                    return function_1.flow(f, F.fromEither)
                }
            }
            exports.fromEitherK = fromEitherK
            function chainEitherK(F, M) {
                var fromEitherKF = fromEitherK(F)
                return function (f) {
                    return function (ma) {
                        return M.chain(ma, fromEitherKF(f))
                    }
                }
            }
            exports.chainEitherK = chainEitherK
            function filterOrElse(F, M) {
                return function (predicate, onFalse) {
                    return function (ma) {
                        return M.chain(ma, function (a) {
                            return F.fromEither(predicate(a) ? _.right(a) : _.left(onFalse(a)))
                        })
                    }
                }
            }
            exports.filterOrElse = filterOrElse

            /***/
        },

        /***/ 5533: /***/ (__unused_webpack_module, exports, __nccwpck_require__) => {
            "use strict"

            Object.defineProperty(exports, "__esModule", { value: true })
            exports.getFunctorComposition = exports.bindTo = exports.flap = exports.map = void 0
            /**
             * A `Functor` is a type constructor which supports a mapping operation `map`.
             *
             * `map` can be used to turn functions `a -> b` into functions `f a -> f b` whose argument and return types use the type
             * constructor `f` to represent some computational context.
             *
             * Instances must satisfy the following laws:
             *
             * 1. Identity: `F.map(fa, a => a) <-> fa`
             * 2. Composition: `F.map(fa, a => bc(ab(a))) <-> F.map(F.map(fa, ab), bc)`
             *
             * @since 2.0.0
             */
            var function_1 = __nccwpck_require__(6985)
            function map(F, G) {
                return function (f) {
                    return function (fa) {
                        return F.map(fa, function (ga) {
                            return G.map(ga, f)
                        })
                    }
                }
            }
            exports.map = map
            function flap(F) {
                return function (a) {
                    return function (fab) {
                        return F.map(fab, function (f) {
                            return f(a)
                        })
                    }
                }
            }
            exports.flap = flap
            function bindTo(F) {
                return function (name) {
                    return function (fa) {
                        return F.map(fa, function (a) {
                            var _a
                            return (_a = {}), (_a[name] = a), _a
                        })
                    }
                }
            }
            exports.bindTo = bindTo
            /** @deprecated */
            function getFunctorComposition(F, G) {
                var _map = map(F, G)
                return {
                    map: function (fga, f) {
                        return function_1.pipe(fga, _map(f))
                    },
                }
            }
            exports.getFunctorComposition = getFunctorComposition

            /***/
        },

        /***/ 179: /***/ (__unused_webpack_module, exports) => {
            "use strict"

            /**
             * A `Magma` is a pair `(A, concat)` in which `A` is a non-empty set and `concat` is a binary operation on `A`
             *
             * See [Semigroup](https://gcanti.github.io/fp-ts/modules/Semigroup.ts.html) for some instances.
             *
             * @since 2.0.0
             */
            Object.defineProperty(exports, "__esModule", { value: true })
            exports.concatAll = exports.endo = exports.filterSecond = exports.filterFirst = exports.reverse = void 0
            // -------------------------------------------------------------------------------------
            // combinators
            // -------------------------------------------------------------------------------------
            /**
             * The dual of a `Magma`, obtained by swapping the arguments of `concat`.
             *
             * @example
             * import { reverse, concatAll } from 'fp-ts/Magma'
             * import * as N from 'fp-ts/number'
             *
             * const subAll = concatAll(reverse(N.MagmaSub))(0)
             *
             * assert.deepStrictEqual(subAll([1, 2, 3]), 2)
             *
             * @category combinators
             * @since 2.11.0
             */
            var reverse = function (M) {
                return {
                    concat: function (first, second) {
                        return M.concat(second, first)
                    },
                }
            }
            exports.reverse = reverse
            /**
             * @category combinators
             * @since 2.11.0
             */
            var filterFirst = function (predicate) {
                return function (M) {
                    return {
                        concat: function (first, second) {
                            return predicate(first) ? M.concat(first, second) : second
                        },
                    }
                }
            }
            exports.filterFirst = filterFirst
            /**
             * @category combinators
             * @since 2.11.0
             */
            var filterSecond = function (predicate) {
                return function (M) {
                    return {
                        concat: function (first, second) {
                            return predicate(second) ? M.concat(first, second) : first
                        },
                    }
                }
            }
            exports.filterSecond = filterSecond
            /**
             * @category combinators
             * @since 2.11.0
             */
            var endo = function (f) {
                return function (M) {
                    return {
                        concat: function (first, second) {
                            return M.concat(f(first), f(second))
                        },
                    }
                }
            }
            exports.endo = endo
            // -------------------------------------------------------------------------------------
            // utils
            // -------------------------------------------------------------------------------------
            /**
             * Given a sequence of `as`, concat them and return the total.
             *
             * If `as` is empty, return the provided `startWith` value.
             *
             * @example
             * import { concatAll } from 'fp-ts/Magma'
             * import * as N from 'fp-ts/number'
             *
             * const subAll = concatAll(N.MagmaSub)(0)
             *
             * assert.deepStrictEqual(subAll([1, 2, 3]), -6)
             *
             * @since 2.11.0
             */
            var concatAll = function (M) {
                return function (startWith) {
                    return function (as) {
                        return as.reduce(function (a, acc) {
                            return M.concat(a, acc)
                        }, startWith)
                    }
                }
            }
            exports.concatAll = concatAll

            /***/
        },

        /***/ 240: /***/ function (__unused_webpack_module, exports, __nccwpck_require__) {
            "use strict"

            var __createBinding =
                (this && this.__createBinding) ||
                (Object.create
                    ? function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          Object.defineProperty(o, k2, {
                              enumerable: true,
                              get: function () {
                                  return m[k]
                              },
                          })
                      }
                    : function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          o[k2] = m[k]
                      })
            var __setModuleDefault =
                (this && this.__setModuleDefault) ||
                (Object.create
                    ? function (o, v) {
                          Object.defineProperty(o, "default", { enumerable: true, value: v })
                      }
                    : function (o, v) {
                          o["default"] = v
                      })
            var __importStar =
                (this && this.__importStar) ||
                function (mod) {
                    if (mod && mod.__esModule) return mod
                    var result = {}
                    if (mod != null)
                        for (var k in mod)
                            if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
                                __createBinding(result, mod, k)
                    __setModuleDefault(result, mod)
                    return result
                }
            var __spreadArray =
                (this && this.__spreadArray) ||
                function (to, from) {
                    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
                        to[j] = from[i]
                    return to
                }
            Object.defineProperty(exports, "__esModule", { value: true })
            exports.mapWithIndex = exports.map = exports.flatten = exports.duplicate = exports.extend = exports.chain = exports.ap = exports.alt = exports.altW = exports.chunksOf = exports.splitAt = exports.chop = exports.chainWithIndex = exports.foldMap = exports.foldMapWithIndex = exports.intersperse = exports.prependAll = exports.unzip = exports.zip = exports.zipWith = exports.of = exports.copy = exports.modifyAt = exports.updateAt = exports.insertAt = exports.sort = exports.groupBy = exports.group = exports.reverse = exports.concat = exports.concatW = exports.unappend = exports.unprepend = exports.range = exports.replicate = exports.makeBy = exports.fromArray = exports.fromReadonlyNonEmptyArray = exports.rotate = exports.union = exports.sortBy = exports.uniq = exports.unsafeUpdateAt = exports.unsafeInsertAt = exports.append = exports.appendW = exports.prepend = exports.prependW = exports.isOutOfBound = exports.isNonEmpty = void 0
            exports.filterWithIndex = exports.filter = exports.groupSort = exports.updateLast = exports.modifyLast = exports.updateHead = exports.modifyHead = exports.matchRight = exports.matchLeft = exports.concatAll = exports.max = exports.min = exports.init = exports.last = exports.tail = exports.head = exports.apS = exports.bind = exports.bindTo = exports.Do = exports.Comonad = exports.Alt = exports.TraversableWithIndex = exports.Traversable = exports.FoldableWithIndex = exports.Foldable = exports.Monad = exports.chainFirst = exports.Chain = exports.Applicative = exports.apSecond = exports.apFirst = exports.Apply = exports.FunctorWithIndex = exports.Pointed = exports.flap = exports.Functor = exports.getUnionSemigroup = exports.getEq = exports.getSemigroup = exports.getShow = exports.URI = exports.extract = exports.traverseWithIndex = exports.sequence = exports.traverse = exports.reduceRightWithIndex = exports.reduceRight = exports.reduceWithIndex = exports.reduce = void 0
            exports.nonEmptyArray = exports.fold = exports.prependToAll = exports.snoc = exports.cons = exports.unsnoc = exports.uncons = void 0
            var Apply_1 = __nccwpck_require__(205)
            var Chain_1 = __nccwpck_require__(2372)
            var function_1 = __nccwpck_require__(6985)
            var Functor_1 = __nccwpck_require__(5533)
            var _ = __importStar(__nccwpck_require__(1840))
            var Ord_1 = __nccwpck_require__(6685)
            var RNEA = __importStar(__nccwpck_require__(8630))
            // -------------------------------------------------------------------------------------
            // internal
            // -------------------------------------------------------------------------------------
            /**
             * @internal
             */
            var isNonEmpty = function (as) {
                return as.length > 0
            }
            exports.isNonEmpty = isNonEmpty
            /**
             * @internal
             */
            var isOutOfBound = function (i, as) {
                return i < 0 || i >= as.length
            }
            exports.isOutOfBound = isOutOfBound
            /**
             * @internal
             */
            var prependW = function (head) {
                return function (tail) {
                    return __spreadArray([head], tail)
                }
            }
            exports.prependW = prependW
            /**
             * @internal
             */
            exports.prepend = exports.prependW
            /**
             * @internal
             */
            var appendW = function (end) {
                return function (init) {
                    return __spreadArray(__spreadArray([], init), [end])
                }
            }
            exports.appendW = appendW
            /**
             * @internal
             */
            exports.append = exports.appendW
            /**
             * @internal
             */
            var unsafeInsertAt = function (i, a, as) {
                if (exports.isNonEmpty(as)) {
                    var xs = exports.fromReadonlyNonEmptyArray(as)
                    xs.splice(i, 0, a)
                    return xs
                }
                return [a]
            }
            exports.unsafeInsertAt = unsafeInsertAt
            /**
             * @internal
             */
            var unsafeUpdateAt = function (i, a, as) {
                var xs = exports.fromReadonlyNonEmptyArray(as)
                xs[i] = a
                return xs
            }
            exports.unsafeUpdateAt = unsafeUpdateAt
            /**
             * Remove duplicates from a `NonEmptyArray`, keeping the first occurrence of an element.
             *
             * @example
             * import { uniq } from 'fp-ts/NonEmptyArray'
             * import * as N from 'fp-ts/number'
             *
             * assert.deepStrictEqual(uniq(N.Eq)([1, 2, 1]), [1, 2])
             *
             * @category combinators
             * @since 2.11.0
             */
            var uniq = function (E) {
                return function (as) {
                    if (as.length === 1) {
                        return exports.copy(as)
                    }
                    var out = [exports.head(as)]
                    var rest = exports.tail(as)
                    var _loop_1 = function (a) {
                        if (
                            out.every(function (o) {
                                return !E.equals(o, a)
                            })
                        ) {
                            out.push(a)
                        }
                    }
                    for (var _i = 0, rest_1 = rest; _i < rest_1.length; _i++) {
                        var a = rest_1[_i]
                        _loop_1(a)
                    }
                    return out
                }
            }
            exports.uniq = uniq
            /**
             * Sort the elements of a `NonEmptyArray` in increasing order, where elements are compared using first `ords[0]`, then `ords[1]`,
             * etc...
             *
             * @example
             * import * as NEA from 'fp-ts/NonEmptyArray'
             * import { contramap } from 'fp-ts/Ord'
             * import * as S from 'fp-ts/string'
             * import * as N from 'fp-ts/number'
             * import { pipe } from 'fp-ts/function'
             *
             * interface Person {
             *   name: string
             *   age: number
             * }
             *
             * const byName = pipe(S.Ord, contramap((p: Person) => p.name))
             *
             * const byAge = pipe(N.Ord, contramap((p: Person) => p.age))
             *
             * const sortByNameByAge = NEA.sortBy([byName, byAge])
             *
             * const persons: NEA.NonEmptyArray<Person> = [
             *   { name: 'a', age: 1 },
             *   { name: 'b', age: 3 },
             *   { name: 'c', age: 2 },
             *   { name: 'b', age: 2 }
             * ]
             *
             * assert.deepStrictEqual(sortByNameByAge(persons), [
             *   { name: 'a', age: 1 },
             *   { name: 'b', age: 2 },
             *   { name: 'b', age: 3 },
             *   { name: 'c', age: 2 }
             * ])
             *
             * @category combinators
             * @since 2.11.0
             */
            var sortBy = function (ords) {
                if (exports.isNonEmpty(ords)) {
                    var M = Ord_1.getMonoid()
                    return exports.sort(ords.reduce(M.concat, M.empty))
                }
                return exports.copy
            }
            exports.sortBy = sortBy
            /**
             * @category combinators
             * @since 2.11.0
             */
            var union = function (E) {
                var uniqE = exports.uniq(E)
                return function (second) {
                    return function (first) {
                        return uniqE(function_1.pipe(first, concat(second)))
                    }
                }
            }
            exports.union = union
            /**
             * Rotate a `NonEmptyArray` by `n` steps.
             *
             * @example
             * import { rotate } from 'fp-ts/NonEmptyArray'
             *
             * assert.deepStrictEqual(rotate(2)([1, 2, 3, 4, 5]), [4, 5, 1, 2, 3])
             * assert.deepStrictEqual(rotate(-2)([1, 2, 3, 4, 5]), [3, 4, 5, 1, 2])
             *
             * @category combinators
             * @since 2.11.0
             */
            var rotate = function (n) {
                return function (as) {
                    var len = as.length
                    var m = Math.round(n) % len
                    if (exports.isOutOfBound(Math.abs(m), as) || m === 0) {
                        return exports.copy(as)
                    }
                    if (m < 0) {
                        var _a = exports.splitAt(-m)(as),
                            f = _a[0],
                            s = _a[1]
                        return function_1.pipe(s, concat(f))
                    } else {
                        return exports.rotate(m - len)(as)
                    }
                }
            }
            exports.rotate = rotate
            // -------------------------------------------------------------------------------------
            // constructors
            // -------------------------------------------------------------------------------------
            /**
             * @category constructors
             * @since 2.10.0
             */
            exports.fromReadonlyNonEmptyArray = _.fromReadonlyNonEmptyArray
            /**
             * Builds a `NonEmptyArray` from an `Array` returning `none` if `as` is an empty array
             *
             * @category constructors
             * @since 2.0.0
             */
            var fromArray = function (as) {
                return exports.isNonEmpty(as) ? _.some(as) : _.none
            }
            exports.fromArray = fromArray
            /**
             * Return a `NonEmptyArray` of length `n` with element `i` initialized with `f(i)`.
             *
             * **Note**. `n` is normalized to a natural number.
             *
             * @example
             * import { makeBy } from 'fp-ts/NonEmptyArray'
             * import { pipe } from 'fp-ts/function'
             *
             * const double = (n: number): number => n * 2
             * assert.deepStrictEqual(pipe(5, makeBy(double)), [0, 2, 4, 6, 8])
             *
             * @category constructors
             * @since 2.11.0
             */
            var makeBy = function (f) {
                return function (n) {
                    var j = Math.max(0, Math.floor(n))
                    var out = [f(0)]
                    for (var i = 1; i < j; i++) {
                        out.push(f(i))
                    }
                    return out
                }
            }
            exports.makeBy = makeBy
            /**
             * Create a `NonEmptyArray` containing a value repeated the specified number of times.
             *
             * **Note**. `n` is normalized to a natural number.
             *
             * @example
             * import { replicate } from 'fp-ts/NonEmptyArray'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(pipe(3, replicate('a')), ['a', 'a', 'a'])
             *
             * @category constructors
             * @since 2.11.0
             */
            var replicate = function (a) {
                return exports.makeBy(function () {
                    return a
                })
            }
            exports.replicate = replicate
            /**
             * Create a `NonEmptyArray` containing a range of integers, including both endpoints.
             *
             * @example
             * import { range } from 'fp-ts/NonEmptyArray'
             *
             * assert.deepStrictEqual(range(1, 5), [1, 2, 3, 4, 5])
             *
             * @category constructors
             * @since 2.11.0
             */
            var range = function (start, end) {
                return start <= end
                    ? exports.makeBy(function (i) {
                          return start + i
                      })(end - start + 1)
                    : [start]
            }
            exports.range = range
            // -------------------------------------------------------------------------------------
            // destructors
            // -------------------------------------------------------------------------------------
            /**
             * Return the tuple of the `head` and the `tail`.
             *
             * @example
             * import { unprepend } from 'fp-ts/NonEmptyArray'
             *
             * assert.deepStrictEqual(unprepend([1, 2, 3]), [1, [2, 3]])
             *
             * @category destructors
             * @since 2.9.0
             */
            var unprepend = function (as) {
                return [exports.head(as), exports.tail(as)]
            }
            exports.unprepend = unprepend
            /**
             * Return the tuple of the `init` and the `last`.
             *
             * @example
             * import { unappend } from 'fp-ts/NonEmptyArray'
             *
             * assert.deepStrictEqual(unappend([1, 2, 3, 4]), [[1, 2, 3], 4])
             *
             * @category destructors
             * @since 2.9.0
             */
            var unappend = function (as) {
                return [exports.init(as), exports.last(as)]
            }
            exports.unappend = unappend
            function concatW(second) {
                return function (first) {
                    return first.concat(second)
                }
            }
            exports.concatW = concatW
            function concat(x, y) {
                return y
                    ? x.concat(y)
                    : function (y) {
                          return y.concat(x)
                      }
            }
            exports.concat = concat
            /**
             * @category combinators
             * @since 2.0.0
             */
            var reverse = function (as) {
                return __spreadArray([exports.last(as)], as.slice(0, -1).reverse())
            }
            exports.reverse = reverse
            function group(E) {
                return function (as) {
                    var len = as.length
                    if (len === 0) {
                        return []
                    }
                    var out = []
                    var head = as[0]
                    var nea = [head]
                    for (var i = 1; i < len; i++) {
                        var a = as[i]
                        if (E.equals(a, head)) {
                            nea.push(a)
                        } else {
                            out.push(nea)
                            head = a
                            nea = [head]
                        }
                    }
                    out.push(nea)
                    return out
                }
            }
            exports.group = group
            /**
             * Splits an array into sub-non-empty-arrays stored in an object, based on the result of calling a `string`-returning
             * function on each element, and grouping the results according to values returned
             *
             * @example
             * import { groupBy } from 'fp-ts/NonEmptyArray'
             *
             * assert.deepStrictEqual(groupBy((s: string) => String(s.length))(['a', 'b', 'ab']), {
             *   '1': ['a', 'b'],
             *   '2': ['ab']
             * })
             *
             * @category combinators
             * @since 2.0.0
             */
            var groupBy = function (f) {
                return function (as) {
                    var out = {}
                    for (var _i = 0, as_1 = as; _i < as_1.length; _i++) {
                        var a = as_1[_i]
                        var k = f(a)
                        if (out.hasOwnProperty(k)) {
                            out[k].push(a)
                        } else {
                            out[k] = [a]
                        }
                    }
                    return out
                }
            }
            exports.groupBy = groupBy
            /**
             * @category combinators
             * @since 2.0.0
             */
            var sort = function (O) {
                return function (as) {
                    return as.slice().sort(O.compare)
                }
            }
            exports.sort = sort
            /**
             * @category combinators
             * @since 2.0.0
             */
            var insertAt = function (i, a) {
                return function (as) {
                    return i < 0 || i > as.length
                        ? _.none
                        : _.some(exports.unsafeInsertAt(i, a, as))
                }
            }
            exports.insertAt = insertAt
            /**
             * @category combinators
             * @since 2.0.0
             */
            var updateAt = function (i, a) {
                return exports.modifyAt(i, function () {
                    return a
                })
            }
            exports.updateAt = updateAt
            /**
             * @category combinators
             * @since 2.0.0
             */
            var modifyAt = function (i, f) {
                return function (as) {
                    return exports.isOutOfBound(i, as)
                        ? _.none
                        : _.some(exports.unsafeUpdateAt(i, f(as[i]), as))
                }
            }
            exports.modifyAt = modifyAt
            /**
             * @category combinators
             * @since 2.0.0
             */
            exports.copy = exports.fromReadonlyNonEmptyArray
            /**
             * @category Pointed
             * @since 2.0.0
             */
            var of = function (a) {
                return [a]
            }
            exports.of = of
            /**
             * @category combinators
             * @since 2.5.1
             */
            var zipWith = function (as, bs, f) {
                var cs = [f(as[0], bs[0])]
                var len = Math.min(as.length, bs.length)
                for (var i = 1; i < len; i++) {
                    cs[i] = f(as[i], bs[i])
                }
                return cs
            }
            exports.zipWith = zipWith
            function zip(as, bs) {
                if (bs === undefined) {
                    return function (bs) {
                        return zip(bs, as)
                    }
                }
                return exports.zipWith(as, bs, function (a, b) {
                    return [a, b]
                })
            }
            exports.zip = zip
            /**
             * @category combinators
             * @since 2.5.1
             */
            var unzip = function (abs) {
                var fa = [abs[0][0]]
                var fb = [abs[0][1]]
                for (var i = 1; i < abs.length; i++) {
                    fa[i] = abs[i][0]
                    fb[i] = abs[i][1]
                }
                return [fa, fb]
            }
            exports.unzip = unzip
            /**
             * Prepend an element to every member of an array
             *
             * @example
             * import { prependAll } from 'fp-ts/NonEmptyArray'
             *
             * assert.deepStrictEqual(prependAll(9)([1, 2, 3, 4]), [9, 1, 9, 2, 9, 3, 9, 4])
             *
             * @category combinators
             * @since 2.10.0
             */
            var prependAll = function (middle) {
                return function (as) {
                    var out = [middle, as[0]]
                    for (var i = 1; i < as.length; i++) {
                        out.push(middle, as[i])
                    }
                    return out
                }
            }
            exports.prependAll = prependAll
            /**
             * Places an element in between members of an array
             *
             * @example
             * import { intersperse } from 'fp-ts/NonEmptyArray'
             *
             * assert.deepStrictEqual(intersperse(9)([1, 2, 3, 4]), [1, 9, 2, 9, 3, 9, 4])
             *
             * @category combinators
             * @since 2.9.0
             */
            var intersperse = function (middle) {
                return function (as) {
                    var rest = exports.tail(as)
                    return exports.isNonEmpty(rest)
                        ? function_1.pipe(
                              rest,
                              exports.prependAll(middle),
                              exports.prepend(exports.head(as)),
                          )
                        : exports.copy(as)
                }
            }
            exports.intersperse = intersperse
            /**
             * @category combinators
             * @since 2.0.0
             */
            exports.foldMapWithIndex = RNEA.foldMapWithIndex
            /**
             * @category combinators
             * @since 2.0.0
             */
            exports.foldMap = RNEA.foldMap
            /**
             * @category combinators
             * @since 2.10.0
             */
            var chainWithIndex = function (f) {
                return function (as) {
                    var out = exports.fromReadonlyNonEmptyArray(f(0, exports.head(as)))
                    for (var i = 1; i < as.length; i++) {
                        out.push.apply(out, f(i, as[i]))
                    }
                    return out
                }
            }
            exports.chainWithIndex = chainWithIndex
            /**
             * @category combinators
             * @since 2.10.0
             */
            var chop = function (f) {
                return function (as) {
                    var _a = f(as),
                        b = _a[0],
                        rest = _a[1]
                    var out = [b]
                    var next = rest
                    while (exports.isNonEmpty(next)) {
                        var _b = f(next),
                            b_1 = _b[0],
                            rest_2 = _b[1]
                        out.push(b_1)
                        next = rest_2
                    }
                    return out
                }
            }
            exports.chop = chop
            /**
             * Splits a `NonEmptyArray` into two pieces, the first piece has max `n` elements.
             *
             * @category combinators
             * @since 2.10.0
             */
            var splitAt = function (n) {
                return function (as) {
                    var m = Math.max(1, n)
                    return m >= as.length
                        ? [exports.copy(as), []]
                        : [
                              function_1.pipe(as.slice(1, m), exports.prepend(exports.head(as))),
                              as.slice(m),
                          ]
                }
            }
            exports.splitAt = splitAt
            /**
             * @category combinators
             * @since 2.10.0
             */
            var chunksOf = function (n) {
                return exports.chop(exports.splitAt(n))
            }
            exports.chunksOf = chunksOf
            // -------------------------------------------------------------------------------------
            // non-pipeables
            // -------------------------------------------------------------------------------------
            /* istanbul ignore next */
            var _map = function (fa, f) {
                return function_1.pipe(fa, exports.map(f))
            }
            /* istanbul ignore next */
            var _mapWithIndex = function (fa, f) {
                return function_1.pipe(fa, exports.mapWithIndex(f))
            }
            /* istanbul ignore next */
            var _ap = function (fab, fa) {
                return function_1.pipe(fab, exports.ap(fa))
            }
            /* istanbul ignore next */
            var _chain = function (ma, f) {
                return function_1.pipe(ma, exports.chain(f))
            }
            /* istanbul ignore next */
            var _extend = function (wa, f) {
                return function_1.pipe(wa, exports.extend(f))
            }
            /* istanbul ignore next */
            var _reduce = function (fa, b, f) {
                return function_1.pipe(fa, exports.reduce(b, f))
            }
            /* istanbul ignore next */
            var _foldMap = function (M) {
                var foldMapM = exports.foldMap(M)
                return function (fa, f) {
                    return function_1.pipe(fa, foldMapM(f))
                }
            }
            /* istanbul ignore next */
            var _reduceRight = function (fa, b, f) {
                return function_1.pipe(fa, exports.reduceRight(b, f))
            }
            /* istanbul ignore next */
            var _traverse = function (F) {
                var traverseF = exports.traverse(F)
                return function (ta, f) {
                    return function_1.pipe(ta, traverseF(f))
                }
            }
            /* istanbul ignore next */
            var _alt = function (fa, that) {
                return function_1.pipe(fa, exports.alt(that))
            }
            /* istanbul ignore next */
            var _reduceWithIndex = function (fa, b, f) {
                return function_1.pipe(fa, exports.reduceWithIndex(b, f))
            }
            /* istanbul ignore next */
            var _foldMapWithIndex = function (M) {
                var foldMapWithIndexM = exports.foldMapWithIndex(M)
                return function (fa, f) {
                    return function_1.pipe(fa, foldMapWithIndexM(f))
                }
            }
            /* istanbul ignore next */
            var _reduceRightWithIndex = function (fa, b, f) {
                return function_1.pipe(fa, exports.reduceRightWithIndex(b, f))
            }
            /* istanbul ignore next */
            var _traverseWithIndex = function (F) {
                var traverseWithIndexF = exports.traverseWithIndex(F)
                return function (ta, f) {
                    return function_1.pipe(ta, traverseWithIndexF(f))
                }
            }
            // -------------------------------------------------------------------------------------
            // type class members
            // -------------------------------------------------------------------------------------
            /**
             * Less strict version of [`alt`](#alt).
             *
             * @category Alt
             * @since 2.9.0
             */
            var altW = function (that) {
                return function (as) {
                    return function_1.pipe(as, concatW(that()))
                }
            }
            exports.altW = altW
            /**
             * Identifies an associative operation on a type constructor. It is similar to `Semigroup`, except that it applies to
             * types of kind `* -> *`.
             *
             * @category Alt
             * @since 2.6.2
             */
            exports.alt = exports.altW
            /**
             * Apply a function to an argument under a type constructor.
             *
             * @category Apply
             * @since 2.0.0
             */
            var ap = function (as) {
                return exports.chain(function (f) {
                    return function_1.pipe(as, exports.map(f))
                })
            }
            exports.ap = ap
            /**
             * Composes computations in sequence, using the return value of one computation to determine the next computation.
             *
             * @category Monad
             * @since 2.0.0
             */
            var chain = function (f) {
                return exports.chainWithIndex(function (_, a) {
                    return f(a)
                })
            }
            exports.chain = chain
            /**
             * @category Extend
             * @since 2.0.0
             */
            var extend = function (f) {
                return function (as) {
                    var next = exports.tail(as)
                    var out = [f(as)]
                    while (exports.isNonEmpty(next)) {
                        out.push(f(next))
                        next = exports.tail(next)
                    }
                    return out
                }
            }
            exports.extend = extend
            /**
             * Derivable from `Extend`.
             *
             * @category combinators
             * @since 2.5.0
             */
            exports.duplicate =
                /*#__PURE__*/
                exports.extend(function_1.identity)
            /**
             * Derivable from `Chain`.
             *
             * @category combinators
             * @since 2.5.0
             */
            exports.flatten =
                /*#__PURE__*/
                exports.chain(function_1.identity)
            /**
             * `map` can be used to turn functions `(a: A) => B` into functions `(fa: F<A>) => F<B>` whose argument and return types
             * use the type constructor `F` to represent some computational context.
             *
             * @category Functor
             * @since 2.0.0
             */
            var map = function (f) {
                return exports.mapWithIndex(function (_, a) {
                    return f(a)
                })
            }
            exports.map = map
            /**
             * @category FunctorWithIndex
             * @since 2.0.0
             */
            var mapWithIndex = function (f) {
                return function (as) {
                    var out = [f(0, exports.head(as))]
                    for (var i = 1; i < as.length; i++) {
                        out.push(f(i, as[i]))
                    }
                    return out
                }
            }
            exports.mapWithIndex = mapWithIndex
            /**
             * @category Foldable
             * @since 2.0.0
             */
            exports.reduce = RNEA.reduce
            /**
             * @category FoldableWithIndex
             * @since 2.0.0
             */
            exports.reduceWithIndex = RNEA.reduceWithIndex
            /**
             * @category Foldable
             * @since 2.0.0
             */
            exports.reduceRight = RNEA.reduceRight
            /**
             * @category FoldableWithIndex
             * @since 2.0.0
             */
            exports.reduceRightWithIndex = RNEA.reduceRightWithIndex
            /**
             * @since 2.6.3
             */
            var traverse = function (F) {
                var traverseWithIndexF = exports.traverseWithIndex(F)
                return function (f) {
                    return traverseWithIndexF(function (_, a) {
                        return f(a)
                    })
                }
            }
            exports.traverse = traverse
            /**
             * @since 2.6.3
             */
            var sequence = function (F) {
                return exports.traverseWithIndex(F)(function (_, a) {
                    return a
                })
            }
            exports.sequence = sequence
            /**
             * @since 2.6.3
             */
            var traverseWithIndex = function (F) {
                return function (f) {
                    return function (as) {
                        var out = F.map(f(0, exports.head(as)), exports.of)
                        for (var i = 1; i < as.length; i++) {
                            out = F.ap(
                                F.map(out, function (bs) {
                                    return function (b) {
                                        return function_1.pipe(bs, exports.append(b))
                                    }
                                }),
                                f(i, as[i]),
                            )
                        }
                        return out
                    }
                }
            }
            exports.traverseWithIndex = traverseWithIndex
            /**
             * @since 2.7.0
             */
            exports.extract = RNEA.head
            // -------------------------------------------------------------------------------------
            // instances
            // -------------------------------------------------------------------------------------
            /**
             * @category instances
             * @since 2.0.0
             */
            exports.URI = "NonEmptyArray"
            /**
             * @category instances
             * @since 2.0.0
             */
            exports.getShow = RNEA.getShow
            /**
             * Builds a `Semigroup` instance for `NonEmptyArray`
             *
             * @category instances
             * @since 2.0.0
             */
            var getSemigroup = function () {
                return {
                    concat: concat,
                }
            }
            exports.getSemigroup = getSemigroup
            /**
             * @example
             * import { getEq } from 'fp-ts/NonEmptyArray'
             * import * as N from 'fp-ts/number'
             *
             * const E = getEq(N.Eq)
             * assert.strictEqual(E.equals([1, 2], [1, 2]), true)
             * assert.strictEqual(E.equals([1, 2], [1, 3]), false)
             *
             * @category instances
             * @since 2.0.0
             */
            exports.getEq = RNEA.getEq
            /**
             * @category combinators
             * @since 2.11.0
             */
            var getUnionSemigroup = function (E) {
                var unionE = exports.union(E)
                return {
                    concat: function (first, second) {
                        return unionE(second)(first)
                    },
                }
            }
            exports.getUnionSemigroup = getUnionSemigroup
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Functor = {
                URI: exports.URI,
                map: _map,
            }
            /**
             * Derivable from `Functor`.
             *
             * @category combinators
             * @since 2.10.0
             */
            exports.flap =
                /*#__PURE__*/
                Functor_1.flap(exports.Functor)
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Pointed = {
                URI: exports.URI,
                of: exports.of,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.FunctorWithIndex = {
                URI: exports.URI,
                map: _map,
                mapWithIndex: _mapWithIndex,
            }
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Apply = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
            }
            /**
             * Combine two effectful actions, keeping only the result of the first.
             *
             * Derivable from `Apply`.
             *
             * @category combinators
             * @since 2.5.0
             */
            exports.apFirst =
                /*#__PURE__*/
                Apply_1.apFirst(exports.Apply)
            /**
             * Combine two effectful actions, keeping only the result of the second.
             *
             * Derivable from `Apply`.
             *
             * @category combinators
             * @since 2.5.0
             */
            exports.apSecond =
                /*#__PURE__*/
                Apply_1.apSecond(exports.Apply)
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Applicative = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                of: exports.of,
            }
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Chain = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                chain: _chain,
            }
            /**
             * Composes computations in sequence, using the return value of one computation to determine the next computation and
             * keeping only the result of the first.
             *
             * Derivable from `Chain`.
             *
             * @category combinators
             * @since 2.5.0
             */
            exports.chainFirst =
                /*#__PURE__*/
                Chain_1.chainFirst(exports.Chain)
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Monad = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                of: exports.of,
                chain: _chain,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Foldable = {
                URI: exports.URI,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.FoldableWithIndex = {
                URI: exports.URI,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                reduceWithIndex: _reduceWithIndex,
                foldMapWithIndex: _foldMapWithIndex,
                reduceRightWithIndex: _reduceRightWithIndex,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Traversable = {
                URI: exports.URI,
                map: _map,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                traverse: _traverse,
                sequence: exports.sequence,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.TraversableWithIndex = {
                URI: exports.URI,
                map: _map,
                mapWithIndex: _mapWithIndex,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                traverse: _traverse,
                sequence: exports.sequence,
                reduceWithIndex: _reduceWithIndex,
                foldMapWithIndex: _foldMapWithIndex,
                reduceRightWithIndex: _reduceRightWithIndex,
                traverseWithIndex: _traverseWithIndex,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Alt = {
                URI: exports.URI,
                map: _map,
                alt: _alt,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Comonad = {
                URI: exports.URI,
                map: _map,
                extend: _extend,
                extract: exports.extract,
            }
            // -------------------------------------------------------------------------------------
            // do notation
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.9.0
             */
            exports.Do =
                /*#__PURE__*/
                exports.of(_.emptyRecord)
            /**
             * @since 2.8.0
             */
            exports.bindTo =
                /*#__PURE__*/
                Functor_1.bindTo(exports.Functor)
            /**
             * @since 2.8.0
             */
            exports.bind =
                /*#__PURE__*/
                Chain_1.bind(exports.Chain)
            // -------------------------------------------------------------------------------------
            // pipeable sequence S
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.8.0
             */
            exports.apS =
                /*#__PURE__*/
                Apply_1.apS(exports.Apply)
            // -------------------------------------------------------------------------------------
            // utils
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.0.0
             */
            exports.head = RNEA.head
            /**
             * @since 2.0.0
             */
            var tail = function (as) {
                return as.slice(1)
            }
            exports.tail = tail
            /**
             * @since 2.0.0
             */
            exports.last = RNEA.last
            /**
             * Get all but the last element of a non empty array, creating a new array.
             *
             * @example
             * import { init } from 'fp-ts/NonEmptyArray'
             *
             * assert.deepStrictEqual(init([1, 2, 3]), [1, 2])
             * assert.deepStrictEqual(init([1]), [])
             *
             * @since 2.2.0
             */
            var init = function (as) {
                return as.slice(0, -1)
            }
            exports.init = init
            /**
             * @since 2.0.0
             */
            exports.min = RNEA.min
            /**
             * @since 2.0.0
             */
            exports.max = RNEA.max
            /**
             * @since 2.10.0
             */
            var concatAll = function (S) {
                return function (as) {
                    return as.reduce(S.concat)
                }
            }
            exports.concatAll = concatAll
            /**
             * Break an `Array` into its first element and remaining elements.
             *
             * @category destructors
             * @since 2.11.0
             */
            var matchLeft = function (f) {
                return function (as) {
                    return f(exports.head(as), exports.tail(as))
                }
            }
            exports.matchLeft = matchLeft
            /**
             * Break an `Array` into its initial elements and the last element.
             *
             * @category destructors
             * @since 2.11.0
             */
            var matchRight = function (f) {
                return function (as) {
                    return f(exports.init(as), exports.last(as))
                }
            }
            exports.matchRight = matchRight
            /**
             * Apply a function to the head, creating a new `NonEmptyArray`.
             *
             * @since 2.11.0
             */
            var modifyHead = function (f) {
                return function (as) {
                    return __spreadArray([f(exports.head(as))], exports.tail(as))
                }
            }
            exports.modifyHead = modifyHead
            /**
             * Change the head, creating a new `NonEmptyArray`.
             *
             * @category combinators
             * @since 2.11.0
             */
            var updateHead = function (a) {
                return exports.modifyHead(function () {
                    return a
                })
            }
            exports.updateHead = updateHead
            /**
             * Apply a function to the last element, creating a new `NonEmptyArray`.
             *
             * @since 2.11.0
             */
            var modifyLast = function (f) {
                return function (as) {
                    return function_1.pipe(exports.init(as), exports.append(f(exports.last(as))))
                }
            }
            exports.modifyLast = modifyLast
            /**
             * Change the last element, creating a new `NonEmptyArray`.
             *
             * @category combinators
             * @since 2.11.0
             */
            var updateLast = function (a) {
                return exports.modifyLast(function () {
                    return a
                })
            }
            exports.updateLast = updateLast
            function groupSort(O) {
                var sortO = exports.sort(O)
                var groupO = group(O)
                return function (as) {
                    return exports.isNonEmpty(as) ? groupO(sortO(as)) : []
                }
            }
            exports.groupSort = groupSort
            function filter(predicate) {
                return exports.filterWithIndex(function (_, a) {
                    return predicate(a)
                })
            }
            exports.filter = filter
            /**
             * Use [`filterWithIndex`](./Array.ts.html#filterwithindex) instead.
             *
             * @category combinators
             * @since 2.0.0
             * @deprecated
             */
            var filterWithIndex = function (predicate) {
                return function (as) {
                    return exports.fromArray(
                        as.filter(function (a, i) {
                            return predicate(i, a)
                        }),
                    )
                }
            }
            exports.filterWithIndex = filterWithIndex
            /**
             * Use [`unprepend`](#unprepend) instead.
             *
             * @category destructors
             * @since 2.9.0
             * @deprecated
             */
            exports.uncons = exports.unprepend
            /**
             * Use [`unappend`](#unappend) instead.
             *
             * @category destructors
             * @since 2.9.0
             * @deprecated
             */
            exports.unsnoc = exports.unappend
            function cons(head, tail) {
                return tail === undefined
                    ? exports.prepend(head)
                    : function_1.pipe(tail, exports.prepend(head))
            }
            exports.cons = cons
            /**
             * Use [`append`](./Array.ts.html#append) instead.
             *
             * @category constructors
             * @since 2.0.0
             * @deprecated
             */
            var snoc = function (init, end) {
                return function_1.pipe(init, exports.append(end))
            }
            exports.snoc = snoc
            /**
             * Use [`prependAll`](#prependall) instead.
             *
             * @category combinators
             * @since 2.9.0
             * @deprecated
             */
            exports.prependToAll = exports.prependAll
            /**
             * Use [`concatAll`](#concatall) instead.
             *
             * @since 2.5.0
             * @deprecated
             */
            exports.fold = RNEA.concatAll
            /**
             * Use small, specific instances instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.nonEmptyArray = {
                URI: exports.URI,
                of: exports.of,
                map: _map,
                mapWithIndex: _mapWithIndex,
                ap: _ap,
                chain: _chain,
                extend: _extend,
                extract: exports.extract,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                traverse: _traverse,
                sequence: exports.sequence,
                reduceWithIndex: _reduceWithIndex,
                foldMapWithIndex: _foldMapWithIndex,
                reduceRightWithIndex: _reduceRightWithIndex,
                traverseWithIndex: _traverseWithIndex,
                alt: _alt,
            }

            /***/
        },

        /***/ 2569: /***/ function (__unused_webpack_module, exports, __nccwpck_require__) {
            "use strict"

            var __createBinding =
                (this && this.__createBinding) ||
                (Object.create
                    ? function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          Object.defineProperty(o, k2, {
                              enumerable: true,
                              get: function () {
                                  return m[k]
                              },
                          })
                      }
                    : function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          o[k2] = m[k]
                      })
            var __setModuleDefault =
                (this && this.__setModuleDefault) ||
                (Object.create
                    ? function (o, v) {
                          Object.defineProperty(o, "default", { enumerable: true, value: v })
                      }
                    : function (o, v) {
                          o["default"] = v
                      })
            var __importStar =
                (this && this.__importStar) ||
                function (mod) {
                    if (mod && mod.__esModule) return mod
                    var result = {}
                    if (mod != null)
                        for (var k in mod)
                            if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
                                __createBinding(result, mod, k)
                    __setModuleDefault(result, mod)
                    return result
                }
            Object.defineProperty(exports, "__esModule", { value: true })
            exports.fromEither = exports.MonadThrow = exports.throwError = exports.Witherable = exports.wilt = exports.wither = exports.Traversable = exports.sequence = exports.traverse = exports.Filterable = exports.partitionMap = exports.partition = exports.filterMap = exports.filter = exports.Compactable = exports.separate = exports.compact = exports.Extend = exports.extend = exports.Alternative = exports.guard = exports.Zero = exports.zero = exports.Alt = exports.alt = exports.altW = exports.Foldable = exports.reduceRight = exports.foldMap = exports.reduce = exports.Monad = exports.Chain = exports.chain = exports.Applicative = exports.Apply = exports.ap = exports.Pointed = exports.of = exports.Functor = exports.map = exports.getMonoid = exports.getOrd = exports.getEq = exports.getShow = exports.URI = exports.getRight = exports.getLeft = exports.fromPredicate = exports.some = exports.none = void 0
            exports.getLastMonoid = exports.getFirstMonoid = exports.getApplyMonoid = exports.getApplySemigroup = exports.option = exports.mapNullable = exports.getRefinement = exports.sequenceArray = exports.traverseArray = exports.traverseArrayWithIndex = exports.traverseReadonlyArrayWithIndex = exports.traverseReadonlyNonEmptyArrayWithIndex = exports.ApT = exports.apS = exports.bind = exports.bindTo = exports.Do = exports.exists = exports.elem = exports.toUndefined = exports.toNullable = exports.chainNullableK = exports.fromNullableK = exports.tryCatchK = exports.tryCatch = exports.fromNullable = exports.chainEitherK = exports.fromEitherK = exports.duplicate = exports.chainFirst = exports.flatten = exports.apSecond = exports.apFirst = exports.flap = exports.getOrElse = exports.getOrElseW = exports.fold = exports.match = exports.foldW = exports.matchW = exports.isNone = exports.isSome = exports.FromEither = void 0
            var Applicative_1 = __nccwpck_require__(4766)
            var Apply_1 = __nccwpck_require__(205)
            var Chain_1 = __nccwpck_require__(2372)
            var FromEither_1 = __nccwpck_require__(1964)
            var function_1 = __nccwpck_require__(6985)
            var Functor_1 = __nccwpck_require__(5533)
            var _ = __importStar(__nccwpck_require__(1840))
            var Predicate_1 = __nccwpck_require__(6382)
            var Semigroup_1 = __nccwpck_require__(6339)
            var Separated_1 = __nccwpck_require__(5877)
            var Witherable_1 = __nccwpck_require__(4384)
            var Zero_1 = __nccwpck_require__(9734)
            // -------------------------------------------------------------------------------------
            // constructors
            // -------------------------------------------------------------------------------------
            /**
             * `None` doesn't have a constructor, instead you can use it directly as a value. Represents a missing value.
             *
             * @category constructors
             * @since 2.0.0
             */
            exports.none = _.none
            /**
             * Constructs a `Some`. Represents an optional value that exists.
             *
             * @category constructors
             * @since 2.0.0
             */
            exports.some = _.some
            function fromPredicate(predicate) {
                return function (a) {
                    return predicate(a) ? exports.some(a) : exports.none
                }
            }
            exports.fromPredicate = fromPredicate
            /**
             * Returns the `Left` value of an `Either` if possible.
             *
             * @example
             * import { getLeft, none, some } from 'fp-ts/Option'
             * import { right, left } from 'fp-ts/Either'
             *
             * assert.deepStrictEqual(getLeft(right(1)), none)
             * assert.deepStrictEqual(getLeft(left('a')), some('a'))
             *
             * @category constructors
             * @since 2.0.0
             */
            var getLeft = function (ma) {
                return ma._tag === "Right" ? exports.none : exports.some(ma.left)
            }
            exports.getLeft = getLeft
            /**
             * Returns the `Right` value of an `Either` if possible.
             *
             * @example
             * import { getRight, none, some } from 'fp-ts/Option'
             * import { right, left } from 'fp-ts/Either'
             *
             * assert.deepStrictEqual(getRight(right(1)), some(1))
             * assert.deepStrictEqual(getRight(left('a')), none)
             *
             * @category constructors
             * @since 2.0.0
             */
            var getRight = function (ma) {
                return ma._tag === "Left" ? exports.none : exports.some(ma.right)
            }
            exports.getRight = getRight
            // -------------------------------------------------------------------------------------
            // non-pipeables
            // -------------------------------------------------------------------------------------
            var _map = function (fa, f) {
                return function_1.pipe(fa, exports.map(f))
            }
            var _ap = function (fab, fa) {
                return function_1.pipe(fab, exports.ap(fa))
            }
            var _chain = function (ma, f) {
                return function_1.pipe(ma, exports.chain(f))
            }
            var _reduce = function (fa, b, f) {
                return function_1.pipe(fa, exports.reduce(b, f))
            }
            var _foldMap = function (M) {
                var foldMapM = exports.foldMap(M)
                return function (fa, f) {
                    return function_1.pipe(fa, foldMapM(f))
                }
            }
            var _reduceRight = function (fa, b, f) {
                return function_1.pipe(fa, exports.reduceRight(b, f))
            }
            var _traverse = function (F) {
                var traverseF = exports.traverse(F)
                return function (ta, f) {
                    return function_1.pipe(ta, traverseF(f))
                }
            }
            /* istanbul ignore next */
            var _alt = function (fa, that) {
                return function_1.pipe(fa, exports.alt(that))
            }
            var _filter = function (fa, predicate) {
                return function_1.pipe(fa, exports.filter(predicate))
            }
            /* istanbul ignore next */
            var _filterMap = function (fa, f) {
                return function_1.pipe(fa, exports.filterMap(f))
            }
            /* istanbul ignore next */
            var _extend = function (wa, f) {
                return function_1.pipe(wa, exports.extend(f))
            }
            /* istanbul ignore next */
            var _partition = function (fa, predicate) {
                return function_1.pipe(fa, exports.partition(predicate))
            }
            /* istanbul ignore next */
            var _partitionMap = function (fa, f) {
                return function_1.pipe(fa, exports.partitionMap(f))
            }
            // -------------------------------------------------------------------------------------
            // instances
            // -------------------------------------------------------------------------------------
            /**
             * @category instances
             * @since 2.0.0
             */
            exports.URI = "Option"
            /**
             * @category instances
             * @since 2.0.0
             */
            var getShow = function (S) {
                return {
                    show: function (ma) {
                        return exports.isNone(ma) ? "none" : "some(" + S.show(ma.value) + ")"
                    },
                }
            }
            exports.getShow = getShow
            /**
             * @example
             * import { none, some, getEq } from 'fp-ts/Option'
             * import * as N from 'fp-ts/number'
             *
             * const E = getEq(N.Eq)
             * assert.strictEqual(E.equals(none, none), true)
             * assert.strictEqual(E.equals(none, some(1)), false)
             * assert.strictEqual(E.equals(some(1), none), false)
             * assert.strictEqual(E.equals(some(1), some(2)), false)
             * assert.strictEqual(E.equals(some(1), some(1)), true)
             *
             * @category instances
             * @since 2.0.0
             */
            var getEq = function (E) {
                return {
                    equals: function (x, y) {
                        return (
                            x === y ||
                            (exports.isNone(x)
                                ? exports.isNone(y)
                                : exports.isNone(y)
                                ? false
                                : E.equals(x.value, y.value))
                        )
                    },
                }
            }
            exports.getEq = getEq
            /**
             * The `Ord` instance allows `Option` values to be compared with
             * `compare`, whenever there is an `Ord` instance for
             * the type the `Option` contains.
             *
             * `None` is considered to be less than any `Some` value.
             *
             *
             * @example
             * import { none, some, getOrd } from 'fp-ts/Option'
             * import * as N from 'fp-ts/number'
             *
             * const O = getOrd(N.Ord)
             * assert.strictEqual(O.compare(none, none), 0)
             * assert.strictEqual(O.compare(none, some(1)), -1)
             * assert.strictEqual(O.compare(some(1), none), 1)
             * assert.strictEqual(O.compare(some(1), some(2)), -1)
             * assert.strictEqual(O.compare(some(1), some(1)), 0)
             *
             * @category instances
             * @since 2.0.0
             */
            var getOrd = function (O) {
                return {
                    equals: exports.getEq(O).equals,
                    compare: function (x, y) {
                        return x === y
                            ? 0
                            : exports.isSome(x)
                            ? exports.isSome(y)
                                ? O.compare(x.value, y.value)
                                : 1
                            : -1
                    },
                }
            }
            exports.getOrd = getOrd
            /**
             * Monoid returning the left-most non-`None` value. If both operands are `Some`s then the inner values are
             * concatenated using the provided `Semigroup`
             *
             * | x       | y       | concat(x, y)       |
             * | ------- | ------- | ------------------ |
             * | none    | none    | none               |
             * | some(a) | none    | some(a)            |
             * | none    | some(b) | some(b)            |
             * | some(a) | some(b) | some(concat(a, b)) |
             *
             * @example
             * import { getMonoid, some, none } from 'fp-ts/Option'
             * import { SemigroupSum } from 'fp-ts/number'
             *
             * const M = getMonoid(SemigroupSum)
             * assert.deepStrictEqual(M.concat(none, none), none)
             * assert.deepStrictEqual(M.concat(some(1), none), some(1))
             * assert.deepStrictEqual(M.concat(none, some(1)), some(1))
             * assert.deepStrictEqual(M.concat(some(1), some(2)), some(3))
             *
             * @category instances
             * @since 2.0.0
             */
            var getMonoid = function (S) {
                return {
                    concat: function (x, y) {
                        return exports.isNone(x)
                            ? y
                            : exports.isNone(y)
                            ? x
                            : exports.some(S.concat(x.value, y.value))
                    },
                    empty: exports.none,
                }
            }
            exports.getMonoid = getMonoid
            /**
             * @category instance operations
             * @since 2.0.0
             */
            var map = function (f) {
                return function (fa) {
                    return exports.isNone(fa) ? exports.none : exports.some(f(fa.value))
                }
            }
            exports.map = map
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Functor = {
                URI: exports.URI,
                map: _map,
            }
            /**
             * @category instance operations
             * @since 2.7.0
             */
            exports.of = exports.some
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Pointed = {
                URI: exports.URI,
                of: exports.of,
            }
            /**
             * @category instance operations
             * @since 2.0.0
             */
            var ap = function (fa) {
                return function (fab) {
                    return exports.isNone(fab)
                        ? exports.none
                        : exports.isNone(fa)
                        ? exports.none
                        : exports.some(fab.value(fa.value))
                }
            }
            exports.ap = ap
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Apply = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Applicative = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                of: exports.of,
            }
            /**
             * Composes computations in sequence, using the return value of one computation to determine the next computation.
             *
             * @category instance operations
             * @since 2.0.0
             */
            var chain = function (f) {
                return function (ma) {
                    return exports.isNone(ma) ? exports.none : f(ma.value)
                }
            }
            exports.chain = chain
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Chain = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                chain: _chain,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Monad = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                of: exports.of,
                chain: _chain,
            }
            /**
             * @category instance operations
             * @since 2.0.0
             */
            var reduce = function (b, f) {
                return function (fa) {
                    return exports.isNone(fa) ? b : f(b, fa.value)
                }
            }
            exports.reduce = reduce
            /**
             * @category instance operations
             * @since 2.0.0
             */
            var foldMap = function (M) {
                return function (f) {
                    return function (fa) {
                        return exports.isNone(fa) ? M.empty : f(fa.value)
                    }
                }
            }
            exports.foldMap = foldMap
            /**
             * @category instance operations
             * @since 2.0.0
             */
            var reduceRight = function (b, f) {
                return function (fa) {
                    return exports.isNone(fa) ? b : f(fa.value, b)
                }
            }
            exports.reduceRight = reduceRight
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Foldable = {
                URI: exports.URI,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
            }
            /**
             * Less strict version of [`alt`](#alt).
             *
             * @category instance operations
             * @since 2.9.0
             */
            var altW = function (that) {
                return function (fa) {
                    return exports.isNone(fa) ? that() : fa
                }
            }
            exports.altW = altW
            /**
             * Identifies an associative operation on a type constructor. It is similar to `Semigroup`, except that it applies to
             * types of kind `* -> *`.
             *
             * In case of `Option` returns the left-most non-`None` value.
             *
             * @example
             * import * as O from 'fp-ts/Option'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(
             *   pipe(
             *     O.some('a'),
             *     O.alt(() => O.some('b'))
             *   ),
             *   O.some('a')
             * )
             * assert.deepStrictEqual(
             *   pipe(
             *     O.none,
             *     O.alt(() => O.some('b'))
             *   ),
             *   O.some('b')
             * )
             *
             * @category instance operations
             * @since 2.0.0
             */
            exports.alt = exports.altW
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Alt = {
                URI: exports.URI,
                map: _map,
                alt: _alt,
            }
            /**
             * @category instance operations
             * @since 2.7.0
             */
            var zero = function () {
                return exports.none
            }
            exports.zero = zero
            /**
             * @category instances
             * @since 2.11.0
             */
            exports.Zero = {
                URI: exports.URI,
                zero: exports.zero,
            }
            /**
             * @category constructors
             * @since 2.11.0
             */
            exports.guard =
                /*#__PURE__*/
                Zero_1.guard(exports.Zero, exports.Pointed)
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Alternative = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                of: exports.of,
                alt: _alt,
                zero: exports.zero,
            }
            /**
             * @category instance operations
             * @since 2.0.0
             */
            var extend = function (f) {
                return function (wa) {
                    return exports.isNone(wa) ? exports.none : exports.some(f(wa))
                }
            }
            exports.extend = extend
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Extend = {
                URI: exports.URI,
                map: _map,
                extend: _extend,
            }
            /**
             * @category instance operations
             * @since 2.0.0
             */
            exports.compact =
                /*#__PURE__*/
                exports.chain(function_1.identity)
            var defaultSeparated =
                /*#__PURE__*/
                Separated_1.separated(exports.none, exports.none)
            /**
             * @category instance operations
             * @since 2.0.0
             */
            var separate = function (ma) {
                return exports.isNone(ma)
                    ? defaultSeparated
                    : Separated_1.separated(exports.getLeft(ma.value), exports.getRight(ma.value))
            }
            exports.separate = separate
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Compactable = {
                URI: exports.URI,
                compact: exports.compact,
                separate: exports.separate,
            }
            /**
             * @category instance operations
             * @since 2.0.0
             */
            var filter = function (predicate) {
                return function (fa) {
                    return exports.isNone(fa)
                        ? exports.none
                        : predicate(fa.value)
                        ? fa
                        : exports.none
                }
            }
            exports.filter = filter
            /**
             * @category instance operations
             * @since 2.0.0
             */
            var filterMap = function (f) {
                return function (fa) {
                    return exports.isNone(fa) ? exports.none : f(fa.value)
                }
            }
            exports.filterMap = filterMap
            /**
             * @category instance operations
             * @since 2.0.0
             */
            var partition = function (predicate) {
                return function (fa) {
                    return Separated_1.separated(
                        _filter(fa, Predicate_1.not(predicate)),
                        _filter(fa, predicate),
                    )
                }
            }
            exports.partition = partition
            /**
             * @category instance operations
             * @since 2.0.0
             */
            var partitionMap = function (f) {
                return function_1.flow(exports.map(f), exports.separate)
            }
            exports.partitionMap = partitionMap
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Filterable = {
                URI: exports.URI,
                map: _map,
                compact: exports.compact,
                separate: exports.separate,
                filter: _filter,
                filterMap: _filterMap,
                partition: _partition,
                partitionMap: _partitionMap,
            }
            /**
             * @category instance operations
             * @since 2.6.3
             */
            var traverse = function (F) {
                return function (f) {
                    return function (ta) {
                        return exports.isNone(ta)
                            ? F.of(exports.none)
                            : F.map(f(ta.value), exports.some)
                    }
                }
            }
            exports.traverse = traverse
            /**
             * @category instance operations
             * @since 2.6.3
             */
            var sequence = function (F) {
                return function (ta) {
                    return exports.isNone(ta) ? F.of(exports.none) : F.map(ta.value, exports.some)
                }
            }
            exports.sequence = sequence
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Traversable = {
                URI: exports.URI,
                map: _map,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                traverse: _traverse,
                sequence: exports.sequence,
            }
            var _wither =
                /*#__PURE__*/
                Witherable_1.witherDefault(exports.Traversable, exports.Compactable)
            var _wilt =
                /*#__PURE__*/
                Witherable_1.wiltDefault(exports.Traversable, exports.Compactable)
            /**
             * @category instance operations
             * @since 2.6.5
             */
            var wither = function (F) {
                var _witherF = _wither(F)
                return function (f) {
                    return function (fa) {
                        return _witherF(fa, f)
                    }
                }
            }
            exports.wither = wither
            /**
             * @category instance operations
             * @since 2.6.5
             */
            var wilt = function (F) {
                var _wiltF = _wilt(F)
                return function (f) {
                    return function (fa) {
                        return _wiltF(fa, f)
                    }
                }
            }
            exports.wilt = wilt
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Witherable = {
                URI: exports.URI,
                map: _map,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                traverse: _traverse,
                sequence: exports.sequence,
                compact: exports.compact,
                separate: exports.separate,
                filter: _filter,
                filterMap: _filterMap,
                partition: _partition,
                partitionMap: _partitionMap,
                wither: _wither,
                wilt: _wilt,
            }
            /**
             * @category instance operations
             * @since 2.7.0
             */
            var throwError = function () {
                return exports.none
            }
            exports.throwError = throwError
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.MonadThrow = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                of: exports.of,
                chain: _chain,
                throwError: exports.throwError,
            }
            /**
             * Transforms an `Either` to an `Option` discarding the error.
             *
             * Alias of [getRight](#getright)
             *
             * @category natural transformations
             * @since 2.0.0
             */
            exports.fromEither = exports.getRight
            /**
             * @category instances
             * @since 2.11.0
             */
            exports.FromEither = {
                URI: exports.URI,
                fromEither: exports.fromEither,
            }
            // -------------------------------------------------------------------------------------
            // refinements
            // -------------------------------------------------------------------------------------
            /**
             * Returns `true` if the option is an instance of `Some`, `false` otherwise.
             *
             * @example
             * import { some, none, isSome } from 'fp-ts/Option'
             *
             * assert.strictEqual(isSome(some(1)), true)
             * assert.strictEqual(isSome(none), false)
             *
             * @category refinements
             * @since 2.0.0
             */
            exports.isSome = _.isSome
            /**
             * Returns `true` if the option is `None`, `false` otherwise.
             *
             * @example
             * import { some, none, isNone } from 'fp-ts/Option'
             *
             * assert.strictEqual(isNone(some(1)), false)
             * assert.strictEqual(isNone(none), true)
             *
             * @category refinements
             * @since 2.0.0
             */
            var isNone = function (fa) {
                return fa._tag === "None"
            }
            exports.isNone = isNone
            // -------------------------------------------------------------------------------------
            // destructors
            // -------------------------------------------------------------------------------------
            /**
             * Less strict version of [`match`](#match).
             *
             * @category destructors
             * @since 2.10.0
             */
            var matchW = function (onNone, onSome) {
                return function (ma) {
                    return exports.isNone(ma) ? onNone() : onSome(ma.value)
                }
            }
            exports.matchW = matchW
            /**
             * Alias of [`matchW`](#matchw).
             *
             * @category destructors
             * @since 2.10.0
             */
            exports.foldW = exports.matchW
            /**
             * Takes a (lazy) default value, a function, and an `Option` value, if the `Option` value is `None` the default value is
             * returned, otherwise the function is applied to the value inside the `Some` and the result is returned.
             *
             * @example
             * import { some, none, match } from 'fp-ts/Option'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.strictEqual(
             *   pipe(
             *     some(1),
             *     match(() => 'a none', a => `a some containing ${a}`)
             *   ),
             *   'a some containing 1'
             * )
             *
             * assert.strictEqual(
             *   pipe(
             *     none,
             *     match(() => 'a none', a => `a some containing ${a}`)
             *   ),
             *   'a none'
             * )
             *
             * @category destructors
             * @since 2.10.0
             */
            exports.match = exports.matchW
            /**
             * Alias of [`match`](#match).
             *
             * @category destructors
             * @since 2.0.0
             */
            exports.fold = exports.match
            /**
             * Less strict version of [`getOrElse`](#getorelse).
             *
             * @category destructors
             * @since 2.6.0
             */
            var getOrElseW = function (onNone) {
                return function (ma) {
                    return exports.isNone(ma) ? onNone() : ma.value
                }
            }
            exports.getOrElseW = getOrElseW
            /**
             * Extracts the value out of the structure, if it exists. Otherwise returns the given default value
             *
             * @example
             * import { some, none, getOrElse } from 'fp-ts/Option'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.strictEqual(
             *   pipe(
             *     some(1),
             *     getOrElse(() => 0)
             *   ),
             *   1
             * )
             * assert.strictEqual(
             *   pipe(
             *     none,
             *     getOrElse(() => 0)
             *   ),
             *   0
             * )
             *
             * @category destructors
             * @since 2.0.0
             */
            exports.getOrElse = exports.getOrElseW
            // -------------------------------------------------------------------------------------
            // combinators
            // -------------------------------------------------------------------------------------
            /**
             * Derivable from `Functor`.
             *
             * @category combinators
             * @since 2.10.0
             */
            exports.flap =
                /*#__PURE__*/
                Functor_1.flap(exports.Functor)
            /**
             * Combine two effectful actions, keeping only the result of the first.
             *
             * Derivable from `Apply`.
             *
             * @category combinators
             * @since 2.0.0
             */
            exports.apFirst =
                /*#__PURE__*/
                Apply_1.apFirst(exports.Apply)
            /**
             * Combine two effectful actions, keeping only the result of the second.
             *
             * Derivable from `Apply`.
             *
             * @category combinators
             * @since 2.0.0
             */
            exports.apSecond =
                /*#__PURE__*/
                Apply_1.apSecond(exports.Apply)
            /**
             * Derivable from `Chain`.
             *
             * @category combinators
             * @since 2.0.0
             */
            exports.flatten = exports.compact
            /**
             * Composes computations in sequence, using the return value of one computation to determine the next computation and
             * keeping only the result of the first.
             *
             * Derivable from `Chain`.
             *
             * @category combinators
             * @since 2.0.0
             */
            exports.chainFirst =
                /*#__PURE__*/
                Chain_1.chainFirst(exports.Chain)
            /**
             * Derivable from `Extend`.
             *
             * @category combinators
             * @since 2.0.0
             */
            exports.duplicate =
                /*#__PURE__*/
                exports.extend(function_1.identity)
            /**
             * @category combinators
             * @since 2.11.0
             */
            exports.fromEitherK =
                /*#__PURE__*/
                FromEither_1.fromEitherK(exports.FromEither)
            /**
             * @category combinators
             * @since 2.11.0
             */
            exports.chainEitherK =
                /*#__PURE__*/
                FromEither_1.chainEitherK(exports.FromEither, exports.Chain)
            // -------------------------------------------------------------------------------------
            // interop
            // -------------------------------------------------------------------------------------
            /**
             * Constructs a new `Option` from a nullable type. If the value is `null` or `undefined`, returns `None`, otherwise
             * returns the value wrapped in a `Some`.
             *
             * @example
             * import { none, some, fromNullable } from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(fromNullable(undefined), none)
             * assert.deepStrictEqual(fromNullable(null), none)
             * assert.deepStrictEqual(fromNullable(1), some(1))
             *
             * @category interop
             * @since 2.0.0
             */
            var fromNullable = function (a) {
                return a == null ? exports.none : exports.some(a)
            }
            exports.fromNullable = fromNullable
            /**
             * Transforms an exception into an `Option`. If `f` throws, returns `None`, otherwise returns the output wrapped in a
             * `Some`.
             *
             * See also [`tryCatchK`](#trycatchk).
             *
             * @example
             * import { none, some, tryCatch } from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(
             *   tryCatch(() => {
             *     throw new Error()
             *   }),
             *   none
             * )
             * assert.deepStrictEqual(tryCatch(() => 1), some(1))
             *
             * @category interop
             * @since 2.0.0
             */
            var tryCatch = function (f) {
                try {
                    return exports.some(f())
                } catch (e) {
                    return exports.none
                }
            }
            exports.tryCatch = tryCatch
            /**
             * Converts a function that may throw to one returning a `Option`.
             *
             * @category interop
             * @since 2.10.0
             */
            var tryCatchK = function (f) {
                return function () {
                    var a = []
                    for (var _i = 0; _i < arguments.length; _i++) {
                        a[_i] = arguments[_i]
                    }
                    return exports.tryCatch(function () {
                        return f.apply(void 0, a)
                    })
                }
            }
            exports.tryCatchK = tryCatchK
            /**
             * Returns a *smart constructor* from a function that returns a nullable value.
             *
             * @example
             * import { fromNullableK, none, some } from 'fp-ts/Option'
             *
             * const f = (s: string): number | undefined => {
             *   const n = parseFloat(s)
             *   return isNaN(n) ? undefined : n
             * }
             *
             * const g = fromNullableK(f)
             *
             * assert.deepStrictEqual(g('1'), some(1))
             * assert.deepStrictEqual(g('a'), none)
             *
             * @category interop
             * @since 2.9.0
             */
            var fromNullableK = function (f) {
                return function_1.flow(f, exports.fromNullable)
            }
            exports.fromNullableK = fromNullableK
            /**
             * This is `chain` + `fromNullable`, useful when working with optional values.
             *
             * @example
             * import { some, none, fromNullable, chainNullableK } from 'fp-ts/Option'
             * import { pipe } from 'fp-ts/function'
             *
             * interface Employee {
             *   readonly company?: {
             *     readonly address?: {
             *       readonly street?: {
             *         readonly name?: string
             *       }
             *     }
             *   }
             * }
             *
             * const employee1: Employee = { company: { address: { street: { name: 'high street' } } } }
             *
             * assert.deepStrictEqual(
             *   pipe(
             *     fromNullable(employee1.company),
             *     chainNullableK(company => company.address),
             *     chainNullableK(address => address.street),
             *     chainNullableK(street => street.name)
             *   ),
             *   some('high street')
             * )
             *
             * const employee2: Employee = { company: { address: { street: {} } } }
             *
             * assert.deepStrictEqual(
             *   pipe(
             *     fromNullable(employee2.company),
             *     chainNullableK(company => company.address),
             *     chainNullableK(address => address.street),
             *     chainNullableK(street => street.name)
             *   ),
             *   none
             * )
             *
             * @category interop
             * @since 2.9.0
             */
            var chainNullableK = function (f) {
                return function (ma) {
                    return exports.isNone(ma) ? exports.none : exports.fromNullable(f(ma.value))
                }
            }
            exports.chainNullableK = chainNullableK
            /**
             * Extracts the value out of the structure, if it exists. Otherwise returns `null`.
             *
             * @example
             * import { some, none, toNullable } from 'fp-ts/Option'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.strictEqual(
             *   pipe(
             *     some(1),
             *     toNullable
             *   ),
             *   1
             * )
             * assert.strictEqual(
             *   pipe(
             *     none,
             *     toNullable
             *   ),
             *   null
             * )
             *
             * @category interop
             * @since 2.0.0
             */
            exports.toNullable =
                /*#__PURE__*/
                exports.match(function_1.constNull, function_1.identity)
            /**
             * Extracts the value out of the structure, if it exists. Otherwise returns `undefined`.
             *
             * @example
             * import { some, none, toUndefined } from 'fp-ts/Option'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.strictEqual(
             *   pipe(
             *     some(1),
             *     toUndefined
             *   ),
             *   1
             * )
             * assert.strictEqual(
             *   pipe(
             *     none,
             *     toUndefined
             *   ),
             *   undefined
             * )
             *
             * @category interop
             * @since 2.0.0
             */
            exports.toUndefined =
                /*#__PURE__*/
                exports.match(function_1.constUndefined, function_1.identity)
            function elem(E) {
                return function (a, ma) {
                    if (ma === undefined) {
                        var elemE_1 = elem(E)
                        return function (ma) {
                            return elemE_1(a, ma)
                        }
                    }
                    return exports.isNone(ma) ? false : E.equals(a, ma.value)
                }
            }
            exports.elem = elem
            /**
             * Returns `true` if the predicate is satisfied by the wrapped value
             *
             * @example
             * import { some, none, exists } from 'fp-ts/Option'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.strictEqual(
             *   pipe(
             *     some(1),
             *     exists(n => n > 0)
             *   ),
             *   true
             * )
             * assert.strictEqual(
             *   pipe(
             *     some(1),
             *     exists(n => n > 1)
             *   ),
             *   false
             * )
             * assert.strictEqual(
             *   pipe(
             *     none,
             *     exists(n => n > 0)
             *   ),
             *   false
             * )
             *
             * @since 2.0.0
             */
            var exists = function (predicate) {
                return function (ma) {
                    return exports.isNone(ma) ? false : predicate(ma.value)
                }
            }
            exports.exists = exists
            // -------------------------------------------------------------------------------------
            // do notation
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.9.0
             */
            exports.Do =
                /*#__PURE__*/
                exports.of(_.emptyRecord)
            /**
             * @since 2.8.0
             */
            exports.bindTo =
                /*#__PURE__*/
                Functor_1.bindTo(exports.Functor)
            /**
             * @since 2.8.0
             */
            exports.bind =
                /*#__PURE__*/
                Chain_1.bind(exports.Chain)
            // -------------------------------------------------------------------------------------
            // pipeable sequence S
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.8.0
             */
            exports.apS =
                /*#__PURE__*/
                Apply_1.apS(exports.Apply)
            // -------------------------------------------------------------------------------------
            // sequence T
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.11.0
             */
            exports.ApT =
                /*#__PURE__*/
                exports.of(_.emptyReadonlyArray)
            // -------------------------------------------------------------------------------------
            // array utils
            // -------------------------------------------------------------------------------------
            /**
             * Equivalent to `ReadonlyNonEmptyArray#traverseWithIndex(Applicative)`.
             *
             * @since 2.11.0
             */
            var traverseReadonlyNonEmptyArrayWithIndex = function (f) {
                return function (as) {
                    var o = f(0, _.head(as))
                    if (exports.isNone(o)) {
                        return exports.none
                    }
                    var out = [o.value]
                    for (var i = 1; i < as.length; i++) {
                        var o_1 = f(i, as[i])
                        if (exports.isNone(o_1)) {
                            return exports.none
                        }
                        out.push(o_1.value)
                    }
                    return exports.some(out)
                }
            }
            exports.traverseReadonlyNonEmptyArrayWithIndex = traverseReadonlyNonEmptyArrayWithIndex
            /**
             * Equivalent to `ReadonlyArray#traverseWithIndex(Applicative)`.
             *
             * @since 2.11.0
             */
            var traverseReadonlyArrayWithIndex = function (f) {
                var g = exports.traverseReadonlyNonEmptyArrayWithIndex(f)
                return function (as) {
                    return _.isNonEmpty(as) ? g(as) : exports.ApT
                }
            }
            exports.traverseReadonlyArrayWithIndex = traverseReadonlyArrayWithIndex
            /**
             * @since 2.9.0
             */
            exports.traverseArrayWithIndex = exports.traverseReadonlyArrayWithIndex
            /**
             * @since 2.9.0
             */
            var traverseArray = function (f) {
                return exports.traverseReadonlyArrayWithIndex(function (_, a) {
                    return f(a)
                })
            }
            exports.traverseArray = traverseArray
            /**
             * @since 2.9.0
             */
            exports.sequenceArray =
                /*#__PURE__*/
                exports.traverseArray(function_1.identity)
            // -------------------------------------------------------------------------------------
            // deprecated
            // -------------------------------------------------------------------------------------
            // tslint:disable: deprecation
            /**
             * Use `Refinement` module instead.
             *
             * @since 2.0.0
             * @deprecated
             */
            function getRefinement(getOption) {
                return function (a) {
                    return exports.isSome(getOption(a))
                }
            }
            exports.getRefinement = getRefinement
            /**
             * Use [`chainNullableK`](#chainnullablek) instead.
             *
             * @category combinators
             * @since 2.0.0
             * @deprecated
             */
            exports.mapNullable = exports.chainNullableK
            /**
             * Use small, specific instances instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.option = {
                URI: exports.URI,
                map: _map,
                of: exports.of,
                ap: _ap,
                chain: _chain,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                traverse: _traverse,
                sequence: exports.sequence,
                zero: exports.zero,
                alt: _alt,
                extend: _extend,
                compact: exports.compact,
                separate: exports.separate,
                filter: _filter,
                filterMap: _filterMap,
                partition: _partition,
                partitionMap: _partitionMap,
                wither: _wither,
                wilt: _wilt,
                throwError: exports.throwError,
            }
            /**
             * Use [`getApplySemigroup`](./Apply.ts.html#getapplysemigroup) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.getApplySemigroup =
                /*#__PURE__*/
                Apply_1.getApplySemigroup(exports.Apply)
            /**
             * Use [`getApplicativeMonoid`](./Applicative.ts.html#getapplicativemonoid) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.getApplyMonoid =
                /*#__PURE__*/
                Applicative_1.getApplicativeMonoid(exports.Applicative)
            /**
             * Use
             *
             * ```ts
             * import { first } from 'fp-ts/Semigroup'
             * import { getMonoid } from 'fp-ts/Option'
             *
             * getMonoid(first())
             * ```
             *
             * instead.
             *
             * Monoid returning the left-most non-`None` value
             *
             * | x       | y       | concat(x, y) |
             * | ------- | ------- | ------------ |
             * | none    | none    | none         |
             * | some(a) | none    | some(a)      |
             * | none    | some(b) | some(b)      |
             * | some(a) | some(b) | some(a)      |
             *
             * @example
             * import { getFirstMonoid, some, none } from 'fp-ts/Option'
             *
             * const M = getFirstMonoid<number>()
             * assert.deepStrictEqual(M.concat(none, none), none)
             * assert.deepStrictEqual(M.concat(some(1), none), some(1))
             * assert.deepStrictEqual(M.concat(none, some(2)), some(2))
             * assert.deepStrictEqual(M.concat(some(1), some(2)), some(1))
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            var getFirstMonoid = function () {
                return exports.getMonoid(Semigroup_1.first())
            }
            exports.getFirstMonoid = getFirstMonoid
            /**
             * Use
             *
             * ```ts
             * import { last } from 'fp-ts/Semigroup'
             * import { getMonoid } from 'fp-ts/Option'
             *
             * getMonoid(last())
             * ```
             *
             * instead.
             *
             * Monoid returning the right-most non-`None` value
             *
             * | x       | y       | concat(x, y) |
             * | ------- | ------- | ------------ |
             * | none    | none    | none         |
             * | some(a) | none    | some(a)      |
             * | none    | some(b) | some(b)      |
             * | some(a) | some(b) | some(b)      |
             *
             * @example
             * import { getLastMonoid, some, none } from 'fp-ts/Option'
             *
             * const M = getLastMonoid<number>()
             * assert.deepStrictEqual(M.concat(none, none), none)
             * assert.deepStrictEqual(M.concat(some(1), none), some(1))
             * assert.deepStrictEqual(M.concat(none, some(2)), some(2))
             * assert.deepStrictEqual(M.concat(some(1), some(2)), some(2))
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            var getLastMonoid = function () {
                return exports.getMonoid(Semigroup_1.last())
            }
            exports.getLastMonoid = getLastMonoid

            /***/
        },

        /***/ 6685: /***/ (__unused_webpack_module, exports, __nccwpck_require__) => {
            "use strict"

            Object.defineProperty(exports, "__esModule", { value: true })
            exports.ordDate = exports.ordNumber = exports.ordString = exports.ordBoolean = exports.ord = exports.getDualOrd = exports.getTupleOrd = exports.between = exports.clamp = exports.max = exports.min = exports.geq = exports.leq = exports.gt = exports.lt = exports.equals = exports.trivial = exports.Contravariant = exports.getMonoid = exports.getSemigroup = exports.URI = exports.contramap = exports.reverse = exports.tuple = exports.fromCompare = exports.equalsDefault = void 0
            var Eq_1 = __nccwpck_require__(6964)
            var function_1 = __nccwpck_require__(6985)
            // -------------------------------------------------------------------------------------
            // defaults
            // -------------------------------------------------------------------------------------
            /**
             * @category defaults
             * @since 2.10.0
             */
            var equalsDefault = function (compare) {
                return function (first, second) {
                    return first === second || compare(first, second) === 0
                }
            }
            exports.equalsDefault = equalsDefault
            // -------------------------------------------------------------------------------------
            // constructors
            // -------------------------------------------------------------------------------------
            /**
             * @category constructors
             * @since 2.0.0
             */
            var fromCompare = function (compare) {
                return {
                    equals: exports.equalsDefault(compare),
                    compare: function (first, second) {
                        return first === second ? 0 : compare(first, second)
                    },
                }
            }
            exports.fromCompare = fromCompare
            // -------------------------------------------------------------------------------------
            // combinators
            // -------------------------------------------------------------------------------------
            /**
             * Given a tuple of `Ord`s returns an `Ord` for the tuple.
             *
             * @example
             * import { tuple } from 'fp-ts/Ord'
             * import * as B from 'fp-ts/boolean'
             * import * as S from 'fp-ts/string'
             * import * as N from 'fp-ts/number'
             *
             * const O = tuple(S.Ord, N.Ord, B.Ord)
             * assert.strictEqual(O.compare(['a', 1, true], ['b', 2, true]), -1)
             * assert.strictEqual(O.compare(['a', 1, true], ['a', 2, true]), -1)
             * assert.strictEqual(O.compare(['a', 1, true], ['a', 1, false]), 1)
             *
             * @category combinators
             * @since 2.10.0
             */
            var tuple = function () {
                var ords = []
                for (var _i = 0; _i < arguments.length; _i++) {
                    ords[_i] = arguments[_i]
                }
                return exports.fromCompare(function (first, second) {
                    var i = 0
                    for (; i < ords.length - 1; i++) {
                        var r = ords[i].compare(first[i], second[i])
                        if (r !== 0) {
                            return r
                        }
                    }
                    return ords[i].compare(first[i], second[i])
                })
            }
            exports.tuple = tuple
            /**
             * @category combinators
             * @since 2.10.0
             */
            var reverse = function (O) {
                return exports.fromCompare(function (first, second) {
                    return O.compare(second, first)
                })
            }
            exports.reverse = reverse
            // -------------------------------------------------------------------------------------
            // non-pipeables
            // -------------------------------------------------------------------------------------
            /* istanbul ignore next */
            var contramap_ = function (fa, f) {
                return function_1.pipe(fa, exports.contramap(f))
            }
            // -------------------------------------------------------------------------------------
            // type class members
            // -------------------------------------------------------------------------------------
            /**
             * @category Contravariant
             * @since 2.0.0
             */
            var contramap = function (f) {
                return function (fa) {
                    return exports.fromCompare(function (first, second) {
                        return fa.compare(f(first), f(second))
                    })
                }
            }
            exports.contramap = contramap
            // -------------------------------------------------------------------------------------
            // instances
            // -------------------------------------------------------------------------------------
            /**
             * @category instances
             * @since 2.0.0
             */
            exports.URI = "Ord"
            /**
             * @category instances
             * @since 2.0.0
             */
            var getSemigroup = function () {
                return {
                    concat: function (first, second) {
                        return exports.fromCompare(function (a, b) {
                            var ox = first.compare(a, b)
                            return ox !== 0 ? ox : second.compare(a, b)
                        })
                    },
                }
            }
            exports.getSemigroup = getSemigroup
            /**
             * Returns a `Monoid` such that:
             *
             * - its `concat(ord1, ord2)` operation will order first by `ord1`, and then by `ord2`
             * - its `empty` value is an `Ord` that always considers compared elements equal
             *
             * @example
             * import { sort } from 'fp-ts/Array'
             * import { contramap, reverse, getMonoid } from 'fp-ts/Ord'
             * import * as S from 'fp-ts/string'
             * import * as B from 'fp-ts/boolean'
             * import { pipe } from 'fp-ts/function'
             * import { concatAll } from 'fp-ts/Monoid'
             * import * as N from 'fp-ts/number'
             *
             * interface User {
             *   readonly id: number
             *   readonly name: string
             *   readonly age: number
             *   readonly rememberMe: boolean
             * }
             *
             * const byName = pipe(
             *   S.Ord,
             *   contramap((p: User) => p.name)
             * )
             *
             * const byAge = pipe(
             *   N.Ord,
             *   contramap((p: User) => p.age)
             * )
             *
             * const byRememberMe = pipe(
             *   B.Ord,
             *   contramap((p: User) => p.rememberMe)
             * )
             *
             * const M = getMonoid<User>()
             *
             * const users: Array<User> = [
             *   { id: 1, name: 'Guido', age: 47, rememberMe: false },
             *   { id: 2, name: 'Guido', age: 46, rememberMe: true },
             *   { id: 3, name: 'Giulio', age: 44, rememberMe: false },
             *   { id: 4, name: 'Giulio', age: 44, rememberMe: true }
             * ]
             *
             * // sort by name, then by age, then by `rememberMe`
             * const O1 = concatAll(M)([byName, byAge, byRememberMe])
             * assert.deepStrictEqual(sort(O1)(users), [
             *   { id: 3, name: 'Giulio', age: 44, rememberMe: false },
             *   { id: 4, name: 'Giulio', age: 44, rememberMe: true },
             *   { id: 2, name: 'Guido', age: 46, rememberMe: true },
             *   { id: 1, name: 'Guido', age: 47, rememberMe: false }
             * ])
             *
             * // now `rememberMe = true` first, then by name, then by age
             * const O2 = concatAll(M)([reverse(byRememberMe), byName, byAge])
             * assert.deepStrictEqual(sort(O2)(users), [
             *   { id: 4, name: 'Giulio', age: 44, rememberMe: true },
             *   { id: 2, name: 'Guido', age: 46, rememberMe: true },
             *   { id: 3, name: 'Giulio', age: 44, rememberMe: false },
             *   { id: 1, name: 'Guido', age: 47, rememberMe: false }
             * ])
             *
             * @category instances
             * @since 2.4.0
             */
            var getMonoid = function () {
                return {
                    concat: exports.getSemigroup().concat,
                    empty: exports.fromCompare(function () {
                        return 0
                    }),
                }
            }
            exports.getMonoid = getMonoid
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Contravariant = {
                URI: exports.URI,
                contramap: contramap_,
            }
            // -------------------------------------------------------------------------------------
            // utils
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.11.0
             */
            exports.trivial = {
                equals: function_1.constTrue,
                compare:
                    /*#__PURE__*/
                    function_1.constant(0),
            }
            /**
             * @since 2.11.0
             */
            var equals = function (O) {
                return function (second) {
                    return function (first) {
                        return first === second || O.compare(first, second) === 0
                    }
                }
            }
            exports.equals = equals
            // TODO: curry in v3
            /**
             * Test whether one value is _strictly less than_ another
             *
             * @since 2.0.0
             */
            var lt = function (O) {
                return function (first, second) {
                    return O.compare(first, second) === -1
                }
            }
            exports.lt = lt
            // TODO: curry in v3
            /**
             * Test whether one value is _strictly greater than_ another
             *
             * @since 2.0.0
             */
            var gt = function (O) {
                return function (first, second) {
                    return O.compare(first, second) === 1
                }
            }
            exports.gt = gt
            // TODO: curry in v3
            /**
             * Test whether one value is _non-strictly less than_ another
             *
             * @since 2.0.0
             */
            var leq = function (O) {
                return function (first, second) {
                    return O.compare(first, second) !== 1
                }
            }
            exports.leq = leq
            // TODO: curry in v3
            /**
             * Test whether one value is _non-strictly greater than_ another
             *
             * @since 2.0.0
             */
            var geq = function (O) {
                return function (first, second) {
                    return O.compare(first, second) !== -1
                }
            }
            exports.geq = geq
            // TODO: curry in v3
            /**
             * Take the minimum of two values. If they are considered equal, the first argument is chosen
             *
             * @since 2.0.0
             */
            var min = function (O) {
                return function (first, second) {
                    return first === second || O.compare(first, second) < 1 ? first : second
                }
            }
            exports.min = min
            // TODO: curry in v3
            /**
             * Take the maximum of two values. If they are considered equal, the first argument is chosen
             *
             * @since 2.0.0
             */
            var max = function (O) {
                return function (first, second) {
                    return first === second || O.compare(first, second) > -1 ? first : second
                }
            }
            exports.max = max
            /**
             * Clamp a value between a minimum and a maximum
             *
             * @since 2.0.0
             */
            var clamp = function (O) {
                var minO = exports.min(O)
                var maxO = exports.max(O)
                return function (low, hi) {
                    return function (a) {
                        return maxO(minO(a, hi), low)
                    }
                }
            }
            exports.clamp = clamp
            /**
             * Test whether a value is between a minimum and a maximum (inclusive)
             *
             * @since 2.0.0
             */
            var between = function (O) {
                var ltO = exports.lt(O)
                var gtO = exports.gt(O)
                return function (low, hi) {
                    return function (a) {
                        return ltO(a, low) || gtO(a, hi) ? false : true
                    }
                }
            }
            exports.between = between
            // -------------------------------------------------------------------------------------
            // deprecated
            // -------------------------------------------------------------------------------------
            // tslint:disable: deprecation
            /**
             * Use [`tuple`](#tuple) instead.
             *
             * @category combinators
             * @since 2.0.0
             * @deprecated
             */
            exports.getTupleOrd = exports.tuple
            /**
             * Use [`reverse`](#reverse) instead.
             *
             * @category combinators
             * @since 2.0.0
             * @deprecated
             */
            exports.getDualOrd = exports.reverse
            /**
             * Use [`Contravariant`](#contravariant) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.ord = exports.Contravariant
            // default compare for primitive types
            function compare(first, second) {
                return first < second ? -1 : first > second ? 1 : 0
            }
            var strictOrd = {
                equals: Eq_1.eqStrict.equals,
                compare: compare,
            }
            /**
             * Use [`Ord`](./boolean.ts.html#ord) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.ordBoolean = strictOrd
            /**
             * Use [`Ord`](./string.ts.html#ord) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.ordString = strictOrd
            /**
             * Use [`Ord`](./number.ts.html#ord) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.ordNumber = strictOrd
            /**
             * Use [`Ord`](./Date.ts.html#ord) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.ordDate =
                /*#__PURE__*/
                function_1.pipe(
                    exports.ordNumber,
                    /*#__PURE__*/
                    exports.contramap(function (date) {
                        return date.valueOf()
                    }),
                )

            /***/
        },

        /***/ 6382: /***/ (__unused_webpack_module, exports, __nccwpck_require__) => {
            "use strict"

            Object.defineProperty(exports, "__esModule", { value: true })
            exports.and = exports.or = exports.not = exports.Contravariant = exports.getMonoidAll = exports.getSemigroupAll = exports.getMonoidAny = exports.getSemigroupAny = exports.URI = exports.contramap = void 0
            var function_1 = __nccwpck_require__(6985)
            // -------------------------------------------------------------------------------------
            // type class members
            // -------------------------------------------------------------------------------------
            var contramap_ = function (predicate, f) {
                return function_1.pipe(predicate, exports.contramap(f))
            }
            /**
             * @category Contravariant
             * @since 2.11.0
             */
            var contramap = function (f) {
                return function (predicate) {
                    return function_1.flow(f, predicate)
                }
            }
            exports.contramap = contramap
            // -------------------------------------------------------------------------------------
            // instances
            // -------------------------------------------------------------------------------------
            /**
             * @category instances
             * @since 2.11.0
             */
            exports.URI = "Predicate"
            /**
             * @category instances
             * @since 2.11.0
             */
            var getSemigroupAny = function () {
                return {
                    concat: function (first, second) {
                        return function_1.pipe(first, exports.or(second))
                    },
                }
            }
            exports.getSemigroupAny = getSemigroupAny
            /**
             * @category instances
             * @since 2.11.0
             */
            var getMonoidAny = function () {
                return {
                    concat: exports.getSemigroupAny().concat,
                    empty: function_1.constFalse,
                }
            }
            exports.getMonoidAny = getMonoidAny
            /**
             * @category instances
             * @since 2.11.0
             */
            var getSemigroupAll = function () {
                return {
                    concat: function (first, second) {
                        return function_1.pipe(first, exports.and(second))
                    },
                }
            }
            exports.getSemigroupAll = getSemigroupAll
            /**
             * @category instances
             * @since 2.11.0
             */
            var getMonoidAll = function () {
                return {
                    concat: exports.getSemigroupAll().concat,
                    empty: function_1.constTrue,
                }
            }
            exports.getMonoidAll = getMonoidAll
            /**
             * @category instances
             * @since 2.11.0
             */
            exports.Contravariant = {
                URI: exports.URI,
                contramap: contramap_,
            }
            // -------------------------------------------------------------------------------------
            // utils
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.11.0
             */
            var not = function (predicate) {
                return function (a) {
                    return !predicate(a)
                }
            }
            exports.not = not
            /**
             * @since 2.11.0
             */
            var or = function (second) {
                return function (first) {
                    return function (a) {
                        return first(a) || second(a)
                    }
                }
            }
            exports.or = or
            /**
             * @since 2.11.0
             */
            var and = function (second) {
                return function (first) {
                    return function (a) {
                        return first(a) && second(a)
                    }
                }
            }
            exports.and = and

            /***/
        },

        /***/ 4234: /***/ function (__unused_webpack_module, exports, __nccwpck_require__) {
            "use strict"

            var __createBinding =
                (this && this.__createBinding) ||
                (Object.create
                    ? function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          Object.defineProperty(o, k2, {
                              enumerable: true,
                              get: function () {
                                  return m[k]
                              },
                          })
                      }
                    : function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          o[k2] = m[k]
                      })
            var __setModuleDefault =
                (this && this.__setModuleDefault) ||
                (Object.create
                    ? function (o, v) {
                          Object.defineProperty(o, "default", { enumerable: true, value: v })
                      }
                    : function (o, v) {
                          o["default"] = v
                      })
            var __importStar =
                (this && this.__importStar) ||
                function (mod) {
                    if (mod && mod.__esModule) return mod
                    var result = {}
                    if (mod != null)
                        for (var k in mod)
                            if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
                                __createBinding(result, mod, k)
                    __setModuleDefault(result, mod)
                    return result
                }
            var __spreadArray =
                (this && this.__spreadArray) ||
                function (to, from) {
                    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
                        to[j] = from[i]
                    return to
                }
            Object.defineProperty(exports, "__esModule", { value: true })
            exports.sort = exports.lefts = exports.rights = exports.reverse = exports.modifyAt = exports.deleteAt = exports.updateAt = exports.insertAt = exports.findLastIndex = exports.findLastMap = exports.findLast = exports.findFirstMap = exports.findFirst = exports.findIndex = exports.dropLeftWhile = exports.dropRight = exports.dropLeft = exports.spanLeft = exports.takeLeftWhile = exports.takeRight = exports.takeLeft = exports.init = exports.tail = exports.last = exports.head = exports.lookup = exports.isOutOfBound = exports.size = exports.scanRight = exports.scanLeft = exports.chainWithIndex = exports.foldRight = exports.matchRight = exports.matchRightW = exports.foldLeft = exports.matchLeft = exports.matchLeftW = exports.match = exports.matchW = exports.fromEither = exports.fromOption = exports.fromPredicate = exports.replicate = exports.makeBy = exports.appendW = exports.append = exports.prependW = exports.prepend = exports.isNonEmpty = exports.isEmpty = void 0
            exports.sequence = exports.traverse = exports.reduceRightWithIndex = exports.reduceRight = exports.reduceWithIndex = exports.foldMap = exports.reduce = exports.foldMapWithIndex = exports.duplicate = exports.extend = exports.filterWithIndex = exports.partitionMapWithIndex = exports.partitionMap = exports.partitionWithIndex = exports.partition = exports.compact = exports.filterMap = exports.filterMapWithIndex = exports.filter = exports.separate = exports.mapWithIndex = exports.map = exports.flatten = exports.chain = exports.ap = exports.alt = exports.altW = exports.zero = exports.of = exports._chainRecBreadthFirst = exports._chainRecDepthFirst = exports.difference = exports.intersection = exports.union = exports.concat = exports.concatW = exports.comprehension = exports.fromOptionK = exports.chunksOf = exports.splitAt = exports.chop = exports.sortBy = exports.uniq = exports.elem = exports.rotate = exports.intersperse = exports.prependAll = exports.unzip = exports.zip = exports.zipWith = void 0
            exports.toArray = exports.unsafeDeleteAt = exports.unsafeUpdateAt = exports.unsafeInsertAt = exports.fromEitherK = exports.FromEither = exports.filterE = exports.Witherable = exports.ChainRecBreadthFirst = exports.chainRecBreadthFirst = exports.ChainRecDepthFirst = exports.chainRecDepthFirst = exports.TraversableWithIndex = exports.Traversable = exports.FoldableWithIndex = exports.Foldable = exports.FilterableWithIndex = exports.Filterable = exports.Compactable = exports.Extend = exports.Alternative = exports.guard = exports.Zero = exports.Alt = exports.Unfoldable = exports.chainFirst = exports.Monad = exports.Chain = exports.Applicative = exports.apSecond = exports.apFirst = exports.Apply = exports.FunctorWithIndex = exports.Pointed = exports.flap = exports.Functor = exports.getDifferenceMagma = exports.getIntersectionSemigroup = exports.getUnionMonoid = exports.getUnionSemigroup = exports.getOrd = exports.getEq = exports.getMonoid = exports.getSemigroup = exports.getShow = exports.URI = exports.unfold = exports.wilt = exports.wither = exports.traverseWithIndex = void 0
            exports.readonlyArray = exports.prependToAll = exports.snoc = exports.cons = exports.range = exports.apS = exports.bind = exports.bindTo = exports.Do = exports.exists = exports.some = exports.every = exports.empty = exports.fromArray = void 0
            var Apply_1 = __nccwpck_require__(205)
            var Chain_1 = __nccwpck_require__(2372)
            var Eq_1 = __nccwpck_require__(6964)
            var FromEither_1 = __nccwpck_require__(1964)
            var function_1 = __nccwpck_require__(6985)
            var Functor_1 = __nccwpck_require__(5533)
            var _ = __importStar(__nccwpck_require__(1840))
            var N = __importStar(__nccwpck_require__(52))
            var Ord_1 = __nccwpck_require__(6685)
            var RNEA = __importStar(__nccwpck_require__(8630))
            var Separated_1 = __nccwpck_require__(5877)
            var Witherable_1 = __nccwpck_require__(4384)
            var Zero_1 = __nccwpck_require__(9734)
            // -------------------------------------------------------------------------------------
            // refinements
            // -------------------------------------------------------------------------------------
            /**
             * Test whether a `ReadonlyArray` is empty.
             *
             * @example
             * import { isEmpty } from 'fp-ts/ReadonlyArray'
             *
             * assert.strictEqual(isEmpty([]), true)
             *
             * @category refinements
             * @since 2.5.0
             */
            var isEmpty = function (as) {
                return as.length === 0
            }
            exports.isEmpty = isEmpty
            /**
             * Test whether a `ReadonlyArray` is non empty.
             *
             * @category refinements
             * @since 2.5.0
             */
            exports.isNonEmpty = RNEA.isNonEmpty
            // -------------------------------------------------------------------------------------
            // constructors
            // -------------------------------------------------------------------------------------
            /**
             * Prepend an element to the front of a `ReadonlyArray`, creating a new `ReadonlyNonEmptyArray`.
             *
             * @example
             * import { prepend } from 'fp-ts/ReadonlyArray'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(pipe([2, 3, 4], prepend(1)), [1, 2, 3, 4])
             *
             * @category constructors
             * @since 2.10.0
             */
            exports.prepend = RNEA.prepend
            /**
             * Less strict version of [`prepend`](#prepend).
             *
             * @category constructors
             * @since 2.11.0
             */
            exports.prependW = RNEA.prependW
            /**
             * Append an element to the end of a `ReadonlyArray`, creating a new `ReadonlyNonEmptyArray`.
             *
             * @example
             * import { append } from 'fp-ts/ReadonlyArray'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(pipe([1, 2, 3], append(4)), [1, 2, 3, 4])
             *
             * @category constructors
             * @since 2.10.0
             */
            exports.append = RNEA.append
            /**
             * Less strict version of [`append`](#append).
             *
             * @category constructors
             * @since 2.11.0
             */
            exports.appendW = RNEA.appendW
            /**
             * Return a `ReadonlyArray` of length `n` with element `i` initialized with `f(i)`.
             *
             * **Note**. `n` is normalized to a non negative integer.
             *
             * @example
             * import { makeBy } from 'fp-ts/ReadonlyArray'
             *
             * const double = (n: number): number => n * 2
             * assert.deepStrictEqual(makeBy(5, double), [0, 2, 4, 6, 8])
             *
             * @category constructors
             * @since 2.5.0
             */
            var makeBy = function (n, f) {
                return n <= 0 ? exports.empty : RNEA.makeBy(f)(n)
            }
            exports.makeBy = makeBy
            /**
             * Create a `ReadonlyArray` containing a value repeated the specified number of times.
             *
             * **Note**. `n` is normalized to a non negative integer.
             *
             * @example
             * import { replicate } from 'fp-ts/ReadonlyArray'
             *
             * assert.deepStrictEqual(replicate(3, 'a'), ['a', 'a', 'a'])
             *
             * @category constructors
             * @since 2.5.0
             */
            var replicate = function (n, a) {
                return exports.makeBy(n, function () {
                    return a
                })
            }
            exports.replicate = replicate
            function fromPredicate(predicate) {
                return function (a) {
                    return predicate(a) ? [a] : exports.empty
                }
            }
            exports.fromPredicate = fromPredicate
            // -------------------------------------------------------------------------------------
            // natural transformations
            // -------------------------------------------------------------------------------------
            /**
             * @category natural transformations
             * @since 2.11.0
             */
            var fromOption = function (ma) {
                return _.isNone(ma) ? exports.empty : [ma.value]
            }
            exports.fromOption = fromOption
            /**
             * Transforms an `Either` to a `ReadonlyArray`.
             *
             * @category natural transformations
             * @since 2.11.0
             */
            var fromEither = function (e) {
                return _.isLeft(e) ? exports.empty : [e.right]
            }
            exports.fromEither = fromEither
            // -------------------------------------------------------------------------------------
            // destructors
            // -------------------------------------------------------------------------------------
            /**
             * Less strict version of [`match`](#match).
             *
             * @category destructors
             * @since 2.11.0
             */
            var matchW = function (onEmpty, onNonEmpty) {
                return function (as) {
                    return exports.isNonEmpty(as) ? onNonEmpty(as) : onEmpty()
                }
            }
            exports.matchW = matchW
            /**
             * @category destructors
             * @since 2.11.0
             */
            exports.match = exports.matchW
            /**
             * Less strict version of [`matchLeft`](#matchleft).
             *
             * @category destructors
             * @since 2.11.0
             */
            var matchLeftW = function (onEmpty, onNonEmpty) {
                return function (as) {
                    return exports.isNonEmpty(as)
                        ? onNonEmpty(RNEA.head(as), RNEA.tail(as))
                        : onEmpty()
                }
            }
            exports.matchLeftW = matchLeftW
            /**
             * Break a `ReadonlyArray` into its first element and remaining elements.
             *
             * @example
             * import { matchLeft } from 'fp-ts/ReadonlyArray'
             *
             * const len: <A>(as: ReadonlyArray<A>) => number = matchLeft(() => 0, (_, tail) => 1 + len(tail))
             * assert.strictEqual(len([1, 2, 3]), 3)
             *
             * @category destructors
             * @since 2.10.0
             */
            exports.matchLeft = exports.matchLeftW
            /**
             * Alias of [`matchLeft`](#matchleft).
             *
             * @category destructors
             * @since 2.5.0
             */
            exports.foldLeft = exports.matchLeft
            /**
             * Less strict version of [`matchRight`](#matchright).
             *
             * @category destructors
             * @since 2.11.0
             */
            var matchRightW = function (onEmpty, onNonEmpty) {
                return function (as) {
                    return exports.isNonEmpty(as)
                        ? onNonEmpty(RNEA.init(as), RNEA.last(as))
                        : onEmpty()
                }
            }
            exports.matchRightW = matchRightW
            /**
             * Break a `ReadonlyArray` into its initial elements and the last element.
             *
             * @category destructors
             * @since 2.10.0
             */
            exports.matchRight = exports.matchRightW
            /**
             * Alias of [`matchRight`](#matchright).
             *
             * @category destructors
             * @since 2.5.0
             */
            exports.foldRight = exports.matchRight
            // -------------------------------------------------------------------------------------
            // combinators
            // -------------------------------------------------------------------------------------
            /**
             * @category combinators
             * @since 2.7.0
             */
            var chainWithIndex = function (f) {
                return function (as) {
                    if (exports.isEmpty(as)) {
                        return exports.empty
                    }
                    var out = []
                    for (var i = 0; i < as.length; i++) {
                        out.push.apply(out, f(i, as[i]))
                    }
                    return out
                }
            }
            exports.chainWithIndex = chainWithIndex
            /**
             * Same as `reduce` but it carries over the intermediate steps.
             *
             * @example
             * import { scanLeft } from 'fp-ts/ReadonlyArray'
             *
             * assert.deepStrictEqual(scanLeft(10, (b, a: number) => b - a)([1, 2, 3]), [10, 9, 7, 4])
             *
             * @category combinators
             * @since 2.5.0
             */
            var scanLeft = function (b, f) {
                return function (as) {
                    var len = as.length
                    var out = new Array(len + 1)
                    out[0] = b
                    for (var i = 0; i < len; i++) {
                        out[i + 1] = f(out[i], as[i])
                    }
                    return out
                }
            }
            exports.scanLeft = scanLeft
            /**
             * Fold an array from the right, keeping all intermediate results instead of only the final result
             *
             * @example
             * import { scanRight } from 'fp-ts/ReadonlyArray'
             *
             * assert.deepStrictEqual(scanRight(10, (a: number, b) => b - a)([1, 2, 3]), [4, 5, 7, 10])
             *
             * @category combinators
             * @since 2.5.0
             */
            var scanRight = function (b, f) {
                return function (as) {
                    var len = as.length
                    var out = new Array(len + 1)
                    out[len] = b
                    for (var i = len - 1; i >= 0; i--) {
                        out[i] = f(as[i], out[i + 1])
                    }
                    return out
                }
            }
            exports.scanRight = scanRight
            /**
             * Calculate the number of elements in a `ReadonlyArray`.
             *
             * @since 2.10.0
             */
            var size = function (as) {
                return as.length
            }
            exports.size = size
            /**
             * Test whether an array contains a particular index
             *
             * @since 2.5.0
             */
            exports.isOutOfBound = RNEA.isOutOfBound
            function lookup(i, as) {
                return as === undefined
                    ? function (as) {
                          return lookup(i, as)
                      }
                    : exports.isOutOfBound(i, as)
                    ? _.none
                    : _.some(as[i])
            }
            exports.lookup = lookup
            /**
             * Get the first element in an array, or `None` if the array is empty
             *
             * @example
             * import { head } from 'fp-ts/ReadonlyArray'
             * import { some, none } from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(head([1, 2, 3]), some(1))
             * assert.deepStrictEqual(head([]), none)
             *
             * @since 2.5.0
             */
            var head = function (as) {
                return exports.isNonEmpty(as) ? _.some(RNEA.head(as)) : _.none
            }
            exports.head = head
            /**
             * Get the last element in an array, or `None` if the array is empty
             *
             * @example
             * import { last } from 'fp-ts/ReadonlyArray'
             * import { some, none } from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(last([1, 2, 3]), some(3))
             * assert.deepStrictEqual(last([]), none)
             *
             * @since 2.5.0
             */
            var last = function (as) {
                return exports.isNonEmpty(as) ? _.some(RNEA.last(as)) : _.none
            }
            exports.last = last
            /**
             * Get all but the first element of an array, creating a new array, or `None` if the array is empty
             *
             * @example
             * import { tail } from 'fp-ts/ReadonlyArray'
             * import { some, none } from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(tail([1, 2, 3]), some([2, 3]))
             * assert.deepStrictEqual(tail([]), none)
             *
             * @since 2.5.0
             */
            var tail = function (as) {
                return exports.isNonEmpty(as) ? _.some(RNEA.tail(as)) : _.none
            }
            exports.tail = tail
            /**
             * Get all but the last element of an array, creating a new array, or `None` if the array is empty
             *
             * @example
             * import { init } from 'fp-ts/ReadonlyArray'
             * import { some, none } from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(init([1, 2, 3]), some([1, 2]))
             * assert.deepStrictEqual(init([]), none)
             *
             * @since 2.5.0
             */
            var init = function (as) {
                return exports.isNonEmpty(as) ? _.some(RNEA.init(as)) : _.none
            }
            exports.init = init
            /**
             * Keep only a max number of elements from the start of an `ReadonlyArray`, creating a new `ReadonlyArray`.
             *
             * **Note**. `n` is normalized to a non negative integer.
             *
             * @example
             * import * as RA from 'fp-ts/ReadonlyArray'
             * import { pipe } from 'fp-ts/function'
             *
             * const input: ReadonlyArray<number> = [1, 2, 3]
             * assert.deepStrictEqual(pipe(input, RA.takeLeft(2)), [1, 2])
             *
             * // out of bounds
             * assert.strictEqual(pipe(input, RA.takeLeft(4)), input)
             * assert.strictEqual(pipe(input, RA.takeLeft(-1)), input)
             *
             * @category combinators
             * @since 2.5.0
             */
            var takeLeft = function (n) {
                return function (as) {
                    return exports.isOutOfBound(n, as)
                        ? as
                        : n === 0
                        ? exports.empty
                        : as.slice(0, n)
                }
            }
            exports.takeLeft = takeLeft
            /**
             * Keep only a max number of elements from the end of an `ReadonlyArray`, creating a new `ReadonlyArray`.
             *
             * **Note**. `n` is normalized to a non negative integer.
             *
             * @example
             * import * as RA from 'fp-ts/ReadonlyArray'
             * import { pipe } from 'fp-ts/function'
             *
             * const input: ReadonlyArray<number> = [1, 2, 3]
             * assert.deepStrictEqual(pipe(input, RA.takeRight(2)), [2, 3])
             *
             * // out of bounds
             * assert.strictEqual(pipe(input, RA.takeRight(4)), input)
             * assert.strictEqual(pipe(input, RA.takeRight(-1)), input)
             *
             * @category combinators
             * @since 2.5.0
             */
            var takeRight = function (n) {
                return function (as) {
                    return exports.isOutOfBound(n, as) ? as : n === 0 ? exports.empty : as.slice(-n)
                }
            }
            exports.takeRight = takeRight
            function takeLeftWhile(predicate) {
                return function (as) {
                    var out = []
                    for (var _i = 0, as_1 = as; _i < as_1.length; _i++) {
                        var a = as_1[_i]
                        if (!predicate(a)) {
                            break
                        }
                        out.push(a)
                    }
                    var len = out.length
                    return len === as.length ? as : len === 0 ? exports.empty : out
                }
            }
            exports.takeLeftWhile = takeLeftWhile
            var spanLeftIndex = function (as, predicate) {
                var l = as.length
                var i = 0
                for (; i < l; i++) {
                    if (!predicate(as[i])) {
                        break
                    }
                }
                return i
            }
            function spanLeft(predicate) {
                return function (as) {
                    var _a = exports.splitAt(spanLeftIndex(as, predicate))(as),
                        init = _a[0],
                        rest = _a[1]
                    return { init: init, rest: rest }
                }
            }
            exports.spanLeft = spanLeft
            /**
             * Drop a max number of elements from the start of an `ReadonlyArray`, creating a new `ReadonlyArray`.
             *
             * **Note**. `n` is normalized to a non negative integer.
             *
             * @example
             * import * as RA from 'fp-ts/ReadonlyArray'
             * import { pipe } from 'fp-ts/function'
             *
             * const input: ReadonlyArray<number> = [1, 2, 3]
             * assert.deepStrictEqual(pipe(input, RA.dropLeft(2)), [3])
             * assert.strictEqual(pipe(input, RA.dropLeft(0)), input)
             * assert.strictEqual(pipe(input, RA.dropLeft(-1)), input)
             *
             * @category combinators
             * @since 2.5.0
             */
            var dropLeft = function (n) {
                return function (as) {
                    return n <= 0 || exports.isEmpty(as)
                        ? as
                        : n >= as.length
                        ? exports.empty
                        : as.slice(n, as.length)
                }
            }
            exports.dropLeft = dropLeft
            /**
             * Drop a max number of elements from the end of an `ReadonlyArray`, creating a new `ReadonlyArray`.
             *
             * **Note**. `n` is normalized to a non negative integer.
             *
             * @example
             * import * as RA from 'fp-ts/ReadonlyArray'
             * import { pipe } from 'fp-ts/function'
             *
             * const input: ReadonlyArray<number> = [1, 2, 3]
             * assert.deepStrictEqual(pipe(input, RA.dropRight(2)), [1])
             * assert.strictEqual(pipe(input, RA.dropRight(0)), input)
             * assert.strictEqual(pipe(input, RA.dropRight(-1)), input)
             *
             * @category combinators
             * @since 2.5.0
             */
            var dropRight = function (n) {
                return function (as) {
                    return n <= 0 || exports.isEmpty(as)
                        ? as
                        : n >= as.length
                        ? exports.empty
                        : as.slice(0, as.length - n)
                }
            }
            exports.dropRight = dropRight
            function dropLeftWhile(predicate) {
                return function (as) {
                    var i = spanLeftIndex(as, predicate)
                    return i === 0 ? as : i === as.length ? exports.empty : as.slice(i)
                }
            }
            exports.dropLeftWhile = dropLeftWhile
            /**
             * Find the first index for which a predicate holds
             *
             * @example
             * import { findIndex } from 'fp-ts/ReadonlyArray'
             * import { some, none } from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(findIndex((n: number) => n === 2)([1, 2, 3]), some(1))
             * assert.deepStrictEqual(findIndex((n: number) => n === 2)([]), none)
             *
             * @since 2.5.0
             */
            var findIndex = function (predicate) {
                return function (as) {
                    for (var i = 0; i < as.length; i++) {
                        if (predicate(as[i])) {
                            return _.some(i)
                        }
                    }
                    return _.none
                }
            }
            exports.findIndex = findIndex
            function findFirst(predicate) {
                return function (as) {
                    for (var i = 0; i < as.length; i++) {
                        if (predicate(as[i])) {
                            return _.some(as[i])
                        }
                    }
                    return _.none
                }
            }
            exports.findFirst = findFirst
            /**
             * Find the first element returned by an option based selector function
             *
             * @example
             * import { findFirstMap } from 'fp-ts/ReadonlyArray'
             * import { some, none } from 'fp-ts/Option'
             *
             * interface Person {
             *   readonly name: string
             *   readonly age?: number
             * }
             *
             * const persons: ReadonlyArray<Person> = [{ name: 'John' }, { name: 'Mary', age: 45 }, { name: 'Joey', age: 28 }]
             *
             * // returns the name of the first person that has an age
             * assert.deepStrictEqual(findFirstMap((p: Person) => (p.age === undefined ? none : some(p.name)))(persons), some('Mary'))
             *
             * @since 2.5.0
             */
            var findFirstMap = function (f) {
                return function (as) {
                    for (var i = 0; i < as.length; i++) {
                        var out = f(as[i])
                        if (_.isSome(out)) {
                            return out
                        }
                    }
                    return _.none
                }
            }
            exports.findFirstMap = findFirstMap
            function findLast(predicate) {
                return function (as) {
                    for (var i = as.length - 1; i >= 0; i--) {
                        if (predicate(as[i])) {
                            return _.some(as[i])
                        }
                    }
                    return _.none
                }
            }
            exports.findLast = findLast
            /**
             * Find the last element returned by an option based selector function
             *
             * @example
             * import { findLastMap } from 'fp-ts/ReadonlyArray'
             * import { some, none } from 'fp-ts/Option'
             *
             * interface Person {
             *   readonly name: string
             *   readonly age?: number
             * }
             *
             * const persons: ReadonlyArray<Person> = [{ name: 'John' }, { name: 'Mary', age: 45 }, { name: 'Joey', age: 28 }]
             *
             * // returns the name of the last person that has an age
             * assert.deepStrictEqual(findLastMap((p: Person) => (p.age === undefined ? none : some(p.name)))(persons), some('Joey'))
             *
             * @since 2.5.0
             */
            var findLastMap = function (f) {
                return function (as) {
                    for (var i = as.length - 1; i >= 0; i--) {
                        var out = f(as[i])
                        if (_.isSome(out)) {
                            return out
                        }
                    }
                    return _.none
                }
            }
            exports.findLastMap = findLastMap
            /**
             * Returns the index of the last element of the list which matches the predicate
             *
             * @example
             * import { findLastIndex } from 'fp-ts/ReadonlyArray'
             * import { some, none } from 'fp-ts/Option'
             *
             * interface X {
             *   readonly a: number
             *   readonly b: number
             * }
             * const xs: ReadonlyArray<X> = [{ a: 1, b: 0 }, { a: 1, b: 1 }]
             * assert.deepStrictEqual(findLastIndex((x: { readonly a: number }) => x.a === 1)(xs), some(1))
             * assert.deepStrictEqual(findLastIndex((x: { readonly a: number }) => x.a === 4)(xs), none)
             *
             *
             * @since 2.5.0
             */
            var findLastIndex = function (predicate) {
                return function (as) {
                    for (var i = as.length - 1; i >= 0; i--) {
                        if (predicate(as[i])) {
                            return _.some(i)
                        }
                    }
                    return _.none
                }
            }
            exports.findLastIndex = findLastIndex
            /**
             * Insert an element at the specified index, creating a new array, or returning `None` if the index is out of bounds
             *
             * @example
             * import { insertAt } from 'fp-ts/ReadonlyArray'
             * import { some } from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(insertAt(2, 5)([1, 2, 3, 4]), some([1, 2, 5, 3, 4]))
             *
             * @since 2.5.0
             */
            var insertAt = function (i, a) {
                return function (as) {
                    return i < 0 || i > as.length ? _.none : _.some(RNEA.unsafeInsertAt(i, a, as))
                }
            }
            exports.insertAt = insertAt
            /**
             * Change the element at the specified index, creating a new array, or returning `None` if the index is out of bounds
             *
             * @example
             * import { updateAt } from 'fp-ts/ReadonlyArray'
             * import { some, none } from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(updateAt(1, 1)([1, 2, 3]), some([1, 1, 3]))
             * assert.deepStrictEqual(updateAt(1, 1)([]), none)
             *
             * @since 2.5.0
             */
            var updateAt = function (i, a) {
                return exports.modifyAt(i, function () {
                    return a
                })
            }
            exports.updateAt = updateAt
            /**
             * Delete the element at the specified index, creating a new array, or returning `None` if the index is out of bounds
             *
             * @example
             * import { deleteAt } from 'fp-ts/ReadonlyArray'
             * import { some, none } from 'fp-ts/Option'
             *
             * assert.deepStrictEqual(deleteAt(0)([1, 2, 3]), some([2, 3]))
             * assert.deepStrictEqual(deleteAt(1)([]), none)
             *
             * @since 2.5.0
             */
            var deleteAt = function (i) {
                return function (as) {
                    return exports.isOutOfBound(i, as)
                        ? _.none
                        : _.some(exports.unsafeDeleteAt(i, as))
                }
            }
            exports.deleteAt = deleteAt
            /**
             * Apply a function to the element at the specified index, creating a new array, or returning `None` if the index is out
             * of bounds
             *
             * @example
             * import { modifyAt } from 'fp-ts/ReadonlyArray'
             * import { some, none } from 'fp-ts/Option'
             *
             * const double = (x: number): number => x * 2
             * assert.deepStrictEqual(modifyAt(1, double)([1, 2, 3]), some([1, 4, 3]))
             * assert.deepStrictEqual(modifyAt(1, double)([]), none)
             *
             * @since 2.5.0
             */
            var modifyAt = function (i, f) {
                return function (as) {
                    return exports.isOutOfBound(i, as)
                        ? _.none
                        : _.some(exports.unsafeUpdateAt(i, f(as[i]), as))
                }
            }
            exports.modifyAt = modifyAt
            /**
             * Reverse an array, creating a new array
             *
             * @example
             * import { reverse } from 'fp-ts/ReadonlyArray'
             *
             * assert.deepStrictEqual(reverse([1, 2, 3]), [3, 2, 1])
             *
             * @category combinators
             * @since 2.5.0
             */
            var reverse = function (as) {
                return as.length <= 1 ? as : as.slice().reverse()
            }
            exports.reverse = reverse
            /**
             * Extracts from an array of `Either` all the `Right` elements. All the `Right` elements are extracted in order
             *
             * @example
             * import { rights } from 'fp-ts/ReadonlyArray'
             * import { right, left } from 'fp-ts/Either'
             *
             * assert.deepStrictEqual(rights([right(1), left('foo'), right(2)]), [1, 2])
             *
             * @category combinators
             * @since 2.5.0
             */
            var rights = function (as) {
                var r = []
                for (var i = 0; i < as.length; i++) {
                    var a = as[i]
                    if (a._tag === "Right") {
                        r.push(a.right)
                    }
                }
                return r
            }
            exports.rights = rights
            /**
             * Extracts from an array of `Either` all the `Left` elements. All the `Left` elements are extracted in order
             *
             * @example
             * import { lefts } from 'fp-ts/ReadonlyArray'
             * import { left, right } from 'fp-ts/Either'
             *
             * assert.deepStrictEqual(lefts([right(1), left('foo'), right(2)]), ['foo'])
             *
             * @category combinators
             * @since 2.5.0
             */
            var lefts = function (as) {
                var r = []
                for (var i = 0; i < as.length; i++) {
                    var a = as[i]
                    if (a._tag === "Left") {
                        r.push(a.left)
                    }
                }
                return r
            }
            exports.lefts = lefts
            /**
             * Sort the elements of an array in increasing order, creating a new array
             *
             * @example
             * import { sort } from 'fp-ts/ReadonlyArray'
             * import * as N from 'fp-ts/number'
             *
             * assert.deepStrictEqual(sort(N.Ord)([3, 2, 1]), [1, 2, 3])
             *
             * @category combinators
             * @since 2.5.0
             */
            var sort = function (O) {
                return function (as) {
                    return as.length <= 1 ? as : as.slice().sort(O.compare)
                }
            }
            exports.sort = sort
            // TODO: curry and make data-last in v3
            /**
             * Apply a function to pairs of elements at the same index in two arrays, collecting the results in a new array. If one
             * input array is short, excess elements of the longer array are discarded.
             *
             * @example
             * import { zipWith } from 'fp-ts/ReadonlyArray'
             *
             * assert.deepStrictEqual(zipWith([1, 2, 3], ['a', 'b', 'c', 'd'], (n, s) => s + n), ['a1', 'b2', 'c3'])
             *
             * @category combinators
             * @since 2.5.0
             */
            var zipWith = function (fa, fb, f) {
                var fc = []
                var len = Math.min(fa.length, fb.length)
                for (var i = 0; i < len; i++) {
                    fc[i] = f(fa[i], fb[i])
                }
                return fc
            }
            exports.zipWith = zipWith
            function zip(as, bs) {
                if (bs === undefined) {
                    return function (bs) {
                        return zip(bs, as)
                    }
                }
                return exports.zipWith(as, bs, function (a, b) {
                    return [a, b]
                })
            }
            exports.zip = zip
            /**
             * The function is reverse of `zip`. Takes an array of pairs and return two corresponding arrays
             *
             * @example
             * import { unzip } from 'fp-ts/ReadonlyArray'
             *
             * assert.deepStrictEqual(unzip([[1, 'a'], [2, 'b'], [3, 'c']]), [[1, 2, 3], ['a', 'b', 'c']])
             *
             * @category combinators
             * @since 2.5.0
             */
            var unzip = function (as) {
                var fa = []
                var fb = []
                for (var i = 0; i < as.length; i++) {
                    fa[i] = as[i][0]
                    fb[i] = as[i][1]
                }
                return [fa, fb]
            }
            exports.unzip = unzip
            /**
             * Prepend an element to every member of an array
             *
             * @example
             * import { prependAll } from 'fp-ts/ReadonlyArray'
             *
             * assert.deepStrictEqual(prependAll(9)([1, 2, 3, 4]), [9, 1, 9, 2, 9, 3, 9, 4])
             *
             * @category combinators
             * @since 2.10.0
             */
            var prependAll = function (middle) {
                var f = RNEA.prependAll(middle)
                return function (as) {
                    return exports.isNonEmpty(as) ? f(as) : as
                }
            }
            exports.prependAll = prependAll
            /**
             * Places an element in between members of an array
             *
             * @example
             * import { intersperse } from 'fp-ts/ReadonlyArray'
             *
             * assert.deepStrictEqual(intersperse(9)([1, 2, 3, 4]), [1, 9, 2, 9, 3, 9, 4])
             *
             * @category combinators
             * @since 2.9.0
             */
            var intersperse = function (middle) {
                var f = RNEA.intersperse(middle)
                return function (as) {
                    return exports.isNonEmpty(as) ? f(as) : as
                }
            }
            exports.intersperse = intersperse
            /**
             * Rotate a `ReadonlyArray` by `n` steps.
             *
             * @example
             * import { rotate } from 'fp-ts/ReadonlyArray'
             *
             * assert.deepStrictEqual(rotate(2)([1, 2, 3, 4, 5]), [4, 5, 1, 2, 3])
             *
             * @category combinators
             * @since 2.5.0
             */
            var rotate = function (n) {
                var f = RNEA.rotate(n)
                return function (as) {
                    return exports.isNonEmpty(as) ? f(as) : as
                }
            }
            exports.rotate = rotate
            function elem(E) {
                return function (a, as) {
                    if (as === undefined) {
                        var elemE_1 = elem(E)
                        return function (as) {
                            return elemE_1(a, as)
                        }
                    }
                    var predicate = function (element) {
                        return E.equals(element, a)
                    }
                    var i = 0
                    for (; i < as.length; i++) {
                        if (predicate(as[i])) {
                            return true
                        }
                    }
                    return false
                }
            }
            exports.elem = elem
            /**
             * Remove duplicates from an array, keeping the first occurrence of an element.
             *
             * @example
             * import { uniq } from 'fp-ts/ReadonlyArray'
             * import * as N from 'fp-ts/number'
             *
             * assert.deepStrictEqual(uniq(N.Eq)([1, 2, 1]), [1, 2])
             *
             * @category combinators
             * @since 2.5.0
             */
            var uniq = function (E) {
                var f = RNEA.uniq(E)
                return function (as) {
                    return exports.isNonEmpty(as) ? f(as) : as
                }
            }
            exports.uniq = uniq
            /**
             * Sort the elements of an array in increasing order, where elements are compared using first `ords[0]`, then `ords[1]`,
             * etc...
             *
             * @example
             * import { sortBy } from 'fp-ts/ReadonlyArray'
             * import { contramap } from 'fp-ts/Ord'
             * import * as S from 'fp-ts/string'
             * import * as N from 'fp-ts/number'
             * import { pipe } from 'fp-ts/function'
             *
             * interface Person {
             *   readonly name: string
             *   readonly age: number
             * }
             * const byName = pipe(S.Ord, contramap((p: Person) => p.name))
             * const byAge = pipe(N.Ord, contramap((p: Person) => p.age))
             *
             * const sortByNameByAge = sortBy([byName, byAge])
             *
             * const persons = [{ name: 'a', age: 1 }, { name: 'b', age: 3 }, { name: 'c', age: 2 }, { name: 'b', age: 2 }]
             * assert.deepStrictEqual(sortByNameByAge(persons), [
             *   { name: 'a', age: 1 },
             *   { name: 'b', age: 2 },
             *   { name: 'b', age: 3 },
             *   { name: 'c', age: 2 }
             * ])
             *
             * @category combinators
             * @since 2.5.0
             */
            var sortBy = function (ords) {
                var f = RNEA.sortBy(ords)
                return function (as) {
                    return exports.isNonEmpty(as) ? f(as) : as
                }
            }
            exports.sortBy = sortBy
            /**
             * A useful recursion pattern for processing a `ReadonlyArray` to produce a new `ReadonlyArray`, often used for "chopping" up the input
             * `ReadonlyArray`. Typically `chop` is called with some function that will consume an initial prefix of the `ReadonlyArray` and produce a
             * value and the tail of the `ReadonlyArray`.
             *
             * @example
             * import { Eq } from 'fp-ts/Eq'
             * import * as RA from 'fp-ts/ReadonlyArray'
             * import * as N from 'fp-ts/number'
             * import { pipe } from 'fp-ts/function'
             *
             * const group = <A>(S: Eq<A>): ((as: ReadonlyArray<A>) => ReadonlyArray<ReadonlyArray<A>>) => {
             *   return RA.chop(as => {
             *     const { init, rest } = pipe(as, RA.spanLeft((a: A) => S.equals(a, as[0])))
             *     return [init, rest]
             *   })
             * }
             * assert.deepStrictEqual(group(N.Eq)([1, 1, 2, 3, 3, 4]), [[1, 1], [2], [3, 3], [4]])
             *
             * @category combinators
             * @since 2.5.0
             */
            var chop = function (f) {
                var g = RNEA.chop(f)
                return function (as) {
                    return exports.isNonEmpty(as) ? g(as) : exports.empty
                }
            }
            exports.chop = chop
            /**
             * Splits a `ReadonlyArray` into two pieces, the first piece has max `n` elements.
             *
             * @example
             * import { splitAt } from 'fp-ts/ReadonlyArray'
             *
             * assert.deepStrictEqual(splitAt(2)([1, 2, 3, 4, 5]), [[1, 2], [3, 4, 5]])
             *
             * @category combinators
             * @since 2.5.0
             */
            var splitAt = function (n) {
                return function (as) {
                    return n >= 1 && exports.isNonEmpty(as)
                        ? RNEA.splitAt(n)(as)
                        : exports.isEmpty(as)
                        ? [as, exports.empty]
                        : [exports.empty, as]
                }
            }
            exports.splitAt = splitAt
            /**
             * Splits a `ReadonlyArray` into length-`n` pieces. The last piece will be shorter if `n` does not evenly divide the length of
             * the `ReadonlyArray`. Note that `chunksOf(n)([])` is `[]`, not `[[]]`. This is intentional, and is consistent with a recursive
             * definition of `chunksOf`; it satisfies the property that:
             *
             * ```ts
             * chunksOf(n)(xs).concat(chunksOf(n)(ys)) == chunksOf(n)(xs.concat(ys)))
             * ```
             *
             * whenever `n` evenly divides the length of `as`.
             *
             * @example
             * import { chunksOf } from 'fp-ts/ReadonlyArray'
             *
             * assert.deepStrictEqual(chunksOf(2)([1, 2, 3, 4, 5]), [[1, 2], [3, 4], [5]])
             *
             * @category combinators
             * @since 2.5.0
             */
            var chunksOf = function (n) {
                var f = RNEA.chunksOf(n)
                return function (as) {
                    return exports.isNonEmpty(as) ? f(as) : exports.empty
                }
            }
            exports.chunksOf = chunksOf
            /**
             * @category combinators
             * @since 2.11.0
             */
            var fromOptionK = function (f) {
                return function () {
                    var a = []
                    for (var _i = 0; _i < arguments.length; _i++) {
                        a[_i] = arguments[_i]
                    }
                    return exports.fromOption(f.apply(void 0, a))
                }
            }
            exports.fromOptionK = fromOptionK
            function comprehension(input, f, g) {
                if (g === void 0) {
                    g = function () {
                        return true
                    }
                }
                var go = function (scope, input) {
                    return exports.isNonEmpty(input)
                        ? function_1.pipe(
                              RNEA.head(input),
                              exports.chain(function (x) {
                                  return go(
                                      function_1.pipe(scope, exports.append(x)),
                                      RNEA.tail(input),
                                  )
                              }),
                          )
                        : g.apply(void 0, scope)
                        ? [f.apply(void 0, scope)]
                        : exports.empty
                }
                return go(exports.empty, input)
            }
            exports.comprehension = comprehension
            /**
             * @category combinators
             * @since 2.11.0
             */
            var concatW = function (second) {
                return function (first) {
                    return exports.isEmpty(first)
                        ? second
                        : exports.isEmpty(second)
                        ? first
                        : first.concat(second)
                }
            }
            exports.concatW = concatW
            /**
             * @category combinators
             * @since 2.11.0
             */
            exports.concat = exports.concatW
            function union(E) {
                var unionE = RNEA.union(E)
                return function (first, second) {
                    if (second === undefined) {
                        var unionE_1 = union(E)
                        return function (second) {
                            return unionE_1(second, first)
                        }
                    }
                    return exports.isNonEmpty(first) && exports.isNonEmpty(second)
                        ? unionE(second)(first)
                        : exports.isNonEmpty(first)
                        ? first
                        : second
                }
            }
            exports.union = union
            function intersection(E) {
                var elemE = elem(E)
                return function (xs, ys) {
                    if (ys === undefined) {
                        var intersectionE_1 = intersection(E)
                        return function (ys) {
                            return intersectionE_1(ys, xs)
                        }
                    }
                    return xs.filter(function (a) {
                        return elemE(a, ys)
                    })
                }
            }
            exports.intersection = intersection
            function difference(E) {
                var elemE = elem(E)
                return function (xs, ys) {
                    if (ys === undefined) {
                        var differenceE_1 = difference(E)
                        return function (ys) {
                            return differenceE_1(ys, xs)
                        }
                    }
                    return xs.filter(function (a) {
                        return !elemE(a, ys)
                    })
                }
            }
            exports.difference = difference
            // -------------------------------------------------------------------------------------
            // non-pipeables
            // -------------------------------------------------------------------------------------
            var _map = function (fa, f) {
                return function_1.pipe(fa, exports.map(f))
            }
            var _mapWithIndex = function (fa, f) {
                return function_1.pipe(fa, exports.mapWithIndex(f))
            }
            var _ap = function (fab, fa) {
                return function_1.pipe(fab, exports.ap(fa))
            }
            var _chain = function (ma, f) {
                return function_1.pipe(ma, exports.chain(f))
            }
            var _filter = function (fa, predicate) {
                return function_1.pipe(fa, exports.filter(predicate))
            }
            var _filterMap = function (fa, f) {
                return function_1.pipe(fa, exports.filterMap(f))
            }
            var _partition = function (fa, predicate) {
                return function_1.pipe(fa, exports.partition(predicate))
            }
            var _partitionMap = function (fa, f) {
                return function_1.pipe(fa, exports.partitionMap(f))
            }
            var _partitionWithIndex = function (fa, predicateWithIndex) {
                return function_1.pipe(fa, exports.partitionWithIndex(predicateWithIndex))
            }
            var _partitionMapWithIndex = function (fa, f) {
                return function_1.pipe(fa, exports.partitionMapWithIndex(f))
            }
            var _alt = function (fa, that) {
                return function_1.pipe(fa, exports.alt(that))
            }
            var _reduce = function (fa, b, f) {
                return function_1.pipe(fa, exports.reduce(b, f))
            }
            var _foldMap = function (M) {
                var foldMapM = exports.foldMap(M)
                return function (fa, f) {
                    return function_1.pipe(fa, foldMapM(f))
                }
            }
            var _reduceRight = function (fa, b, f) {
                return function_1.pipe(fa, exports.reduceRight(b, f))
            }
            var _reduceWithIndex = function (fa, b, f) {
                return function_1.pipe(fa, exports.reduceWithIndex(b, f))
            }
            var _foldMapWithIndex = function (M) {
                var foldMapWithIndexM = exports.foldMapWithIndex(M)
                return function (fa, f) {
                    return function_1.pipe(fa, foldMapWithIndexM(f))
                }
            }
            var _reduceRightWithIndex = function (fa, b, f) {
                return function_1.pipe(fa, exports.reduceRightWithIndex(b, f))
            }
            var _filterMapWithIndex = function (fa, f) {
                return function_1.pipe(fa, exports.filterMapWithIndex(f))
            }
            var _filterWithIndex = function (fa, predicateWithIndex) {
                return function_1.pipe(fa, exports.filterWithIndex(predicateWithIndex))
            }
            var _extend = function (fa, f) {
                return function_1.pipe(fa, exports.extend(f))
            }
            var _traverse = function (F) {
                var traverseF = exports.traverse(F)
                return function (ta, f) {
                    return function_1.pipe(ta, traverseF(f))
                }
            }
            /* istanbul ignore next */
            var _traverseWithIndex = function (F) {
                var traverseWithIndexF = exports.traverseWithIndex(F)
                return function (ta, f) {
                    return function_1.pipe(ta, traverseWithIndexF(f))
                }
            }
            /** @internal */
            var _chainRecDepthFirst = function (a, f) {
                return function_1.pipe(a, exports.chainRecDepthFirst(f))
            }
            exports._chainRecDepthFirst = _chainRecDepthFirst
            /** @internal */
            var _chainRecBreadthFirst = function (a, f) {
                return function_1.pipe(a, exports.chainRecBreadthFirst(f))
            }
            exports._chainRecBreadthFirst = _chainRecBreadthFirst
            // -------------------------------------------------------------------------------------
            // type class members
            // -------------------------------------------------------------------------------------
            /**
             * @category Pointed
             * @since 2.5.0
             */
            exports.of = RNEA.of
            /**
             * @category Zero
             * @since 2.7.0
             */
            var zero = function () {
                return exports.empty
            }
            exports.zero = zero
            /**
             * Less strict version of [`alt`](#alt).
             *
             * @category Alt
             * @since 2.9.0
             */
            var altW = function (that) {
                return function (fa) {
                    return fa.concat(that())
                }
            }
            exports.altW = altW
            /**
             * Identifies an associative operation on a type constructor. It is similar to `Semigroup`, except that it applies to
             * types of kind `* -> *`.
             *
             * @category Alt
             * @since 2.5.0
             */
            exports.alt = exports.altW
            /**
             * Apply a function to an argument under a type constructor.
             *
             * @category Apply
             * @since 2.5.0
             */
            var ap = function (fa) {
                return exports.chain(function (f) {
                    return function_1.pipe(fa, exports.map(f))
                })
            }
            exports.ap = ap
            /**
             * Composes computations in sequence, using the return value of one computation to determine the next computation.
             *
             * @category Monad
             * @since 2.5.0
             */
            var chain = function (f) {
                return function (ma) {
                    return function_1.pipe(
                        ma,
                        exports.chainWithIndex(function (_, a) {
                            return f(a)
                        }),
                    )
                }
            }
            exports.chain = chain
            /**
             * Derivable from `Chain`.
             *
             * @category combinators
             * @since 2.5.0
             */
            exports.flatten =
                /*#__PURE__*/
                exports.chain(function_1.identity)
            /**
             * `map` can be used to turn functions `(a: A) => B` into functions `(fa: F<A>) => F<B>` whose argument and return types
             * use the type constructor `F` to represent some computational context.
             *
             * @category Functor
             * @since 2.5.0
             */
            var map = function (f) {
                return function (fa) {
                    return fa.map(function (a) {
                        return f(a)
                    })
                }
            }
            exports.map = map
            /**
             * @category FunctorWithIndex
             * @since 2.5.0
             */
            var mapWithIndex = function (f) {
                return function (fa) {
                    return fa.map(function (a, i) {
                        return f(i, a)
                    })
                }
            }
            exports.mapWithIndex = mapWithIndex
            /**
             * @category Compactable
             * @since 2.5.0
             */
            var separate = function (fa) {
                var left = []
                var right = []
                for (var _i = 0, fa_1 = fa; _i < fa_1.length; _i++) {
                    var e = fa_1[_i]
                    if (e._tag === "Left") {
                        left.push(e.left)
                    } else {
                        right.push(e.right)
                    }
                }
                return Separated_1.separated(left, right)
            }
            exports.separate = separate
            /**
             * @category Filterable
             * @since 2.5.0
             */
            var filter = function (predicate) {
                return function (as) {
                    return as.filter(predicate)
                }
            }
            exports.filter = filter
            /**
             * @category FilterableWithIndex
             * @since 2.5.0
             */
            var filterMapWithIndex = function (f) {
                return function (fa) {
                    var out = []
                    for (var i = 0; i < fa.length; i++) {
                        var optionB = f(i, fa[i])
                        if (_.isSome(optionB)) {
                            out.push(optionB.value)
                        }
                    }
                    return out
                }
            }
            exports.filterMapWithIndex = filterMapWithIndex
            /**
             * @category Filterable
             * @since 2.5.0
             */
            var filterMap = function (f) {
                return exports.filterMapWithIndex(function (_, a) {
                    return f(a)
                })
            }
            exports.filterMap = filterMap
            /**
             * @category Compactable
             * @since 2.5.0
             */
            exports.compact =
                /*#__PURE__*/
                exports.filterMap(function_1.identity)
            /**
             * @category Filterable
             * @since 2.5.0
             */
            var partition = function (predicate) {
                return exports.partitionWithIndex(function (_, a) {
                    return predicate(a)
                })
            }
            exports.partition = partition
            /**
             * @category FilterableWithIndex
             * @since 2.5.0
             */
            var partitionWithIndex = function (predicateWithIndex) {
                return function (as) {
                    var left = []
                    var right = []
                    for (var i = 0; i < as.length; i++) {
                        var a = as[i]
                        if (predicateWithIndex(i, a)) {
                            right.push(a)
                        } else {
                            left.push(a)
                        }
                    }
                    return Separated_1.separated(left, right)
                }
            }
            exports.partitionWithIndex = partitionWithIndex
            /**
             * @category Filterable
             * @since 2.5.0
             */
            var partitionMap = function (f) {
                return exports.partitionMapWithIndex(function (_, a) {
                    return f(a)
                })
            }
            exports.partitionMap = partitionMap
            /**
             * @category FilterableWithIndex
             * @since 2.5.0
             */
            var partitionMapWithIndex = function (f) {
                return function (fa) {
                    var left = []
                    var right = []
                    for (var i = 0; i < fa.length; i++) {
                        var e = f(i, fa[i])
                        if (e._tag === "Left") {
                            left.push(e.left)
                        } else {
                            right.push(e.right)
                        }
                    }
                    return Separated_1.separated(left, right)
                }
            }
            exports.partitionMapWithIndex = partitionMapWithIndex
            /**
             * @category FilterableWithIndex
             * @since 2.5.0
             */
            var filterWithIndex = function (predicateWithIndex) {
                return function (as) {
                    return as.filter(function (a, i) {
                        return predicateWithIndex(i, a)
                    })
                }
            }
            exports.filterWithIndex = filterWithIndex
            /**
             * @category Extend
             * @since 2.5.0
             */
            var extend = function (f) {
                return function (wa) {
                    return wa.map(function (_, i) {
                        return f(wa.slice(i))
                    })
                }
            }
            exports.extend = extend
            /**
             * Derivable from `Extend`.
             *
             * @category combinators
             * @since 2.5.0
             */
            exports.duplicate =
                /*#__PURE__*/
                exports.extend(function_1.identity)
            /**
             * @category FoldableWithIndex
             * @since 2.5.0
             */
            var foldMapWithIndex = function (M) {
                return function (f) {
                    return function (fa) {
                        return fa.reduce(function (b, a, i) {
                            return M.concat(b, f(i, a))
                        }, M.empty)
                    }
                }
            }
            exports.foldMapWithIndex = foldMapWithIndex
            /**
             * @category Foldable
             * @since 2.5.0
             */
            var reduce = function (b, f) {
                return exports.reduceWithIndex(b, function (_, b, a) {
                    return f(b, a)
                })
            }
            exports.reduce = reduce
            /**
             * @category Foldable
             * @since 2.5.0
             */
            var foldMap = function (M) {
                var foldMapWithIndexM = exports.foldMapWithIndex(M)
                return function (f) {
                    return foldMapWithIndexM(function (_, a) {
                        return f(a)
                    })
                }
            }
            exports.foldMap = foldMap
            /**
             * @category FoldableWithIndex
             * @since 2.5.0
             */
            var reduceWithIndex = function (b, f) {
                return function (fa) {
                    var len = fa.length
                    var out = b
                    for (var i = 0; i < len; i++) {
                        out = f(i, out, fa[i])
                    }
                    return out
                }
            }
            exports.reduceWithIndex = reduceWithIndex
            /**
             * @category Foldable
             * @since 2.5.0
             */
            var reduceRight = function (b, f) {
                return exports.reduceRightWithIndex(b, function (_, a, b) {
                    return f(a, b)
                })
            }
            exports.reduceRight = reduceRight
            /**
             * @category FoldableWithIndex
             * @since 2.5.0
             */
            var reduceRightWithIndex = function (b, f) {
                return function (fa) {
                    return fa.reduceRight(function (b, a, i) {
                        return f(i, a, b)
                    }, b)
                }
            }
            exports.reduceRightWithIndex = reduceRightWithIndex
            /**
             * @category Traversable
             * @since 2.6.3
             */
            var traverse = function (F) {
                var traverseWithIndexF = exports.traverseWithIndex(F)
                return function (f) {
                    return traverseWithIndexF(function (_, a) {
                        return f(a)
                    })
                }
            }
            exports.traverse = traverse
            /**
             * @category Traversable
             * @since 2.6.3
             */
            var sequence = function (F) {
                return function (ta) {
                    return _reduce(ta, F.of(exports.zero()), function (fas, fa) {
                        return F.ap(
                            F.map(fas, function (as) {
                                return function (a) {
                                    return function_1.pipe(as, exports.append(a))
                                }
                            }),
                            fa,
                        )
                    })
                }
            }
            exports.sequence = sequence
            /**
             * @category TraversableWithIndex
             * @since 2.6.3
             */
            var traverseWithIndex = function (F) {
                return function (f) {
                    return exports.reduceWithIndex(F.of(exports.zero()), function (i, fbs, a) {
                        return F.ap(
                            F.map(fbs, function (bs) {
                                return function (b) {
                                    return function_1.pipe(bs, exports.append(b))
                                }
                            }),
                            f(i, a),
                        )
                    })
                }
            }
            exports.traverseWithIndex = traverseWithIndex
            /**
             * @category Witherable
             * @since 2.6.5
             */
            var wither = function (F) {
                var _witherF = _wither(F)
                return function (f) {
                    return function (fa) {
                        return _witherF(fa, f)
                    }
                }
            }
            exports.wither = wither
            /**
             * @category Witherable
             * @since 2.6.5
             */
            var wilt = function (F) {
                var _wiltF = _wilt(F)
                return function (f) {
                    return function (fa) {
                        return _wiltF(fa, f)
                    }
                }
            }
            exports.wilt = wilt
            /**
             * @category Unfoldable
             * @since 2.6.6
             */
            var unfold = function (b, f) {
                var out = []
                var bb = b
                while (true) {
                    var mt = f(bb)
                    if (_.isSome(mt)) {
                        var _a = mt.value,
                            a = _a[0],
                            b_1 = _a[1]
                        out.push(a)
                        bb = b_1
                    } else {
                        break
                    }
                }
                return out
            }
            exports.unfold = unfold
            // -------------------------------------------------------------------------------------
            // instances
            // -------------------------------------------------------------------------------------
            /**
             * @category instances
             * @since 2.5.0
             */
            exports.URI = "ReadonlyArray"
            /**
             * @category instances
             * @since 2.5.0
             */
            var getShow = function (S) {
                return {
                    show: function (as) {
                        return "[" + as.map(S.show).join(", ") + "]"
                    },
                }
            }
            exports.getShow = getShow
            /**
             * @category instances
             * @since 2.5.0
             */
            var getSemigroup = function () {
                return {
                    concat: function (first, second) {
                        return exports.isEmpty(first)
                            ? second
                            : exports.isEmpty(second)
                            ? first
                            : first.concat(second)
                    },
                }
            }
            exports.getSemigroup = getSemigroup
            /**
             * Returns a `Monoid` for `ReadonlyArray<A>`.
             *
             * @example
             * import { getMonoid } from 'fp-ts/ReadonlyArray'
             *
             * const M = getMonoid<number>()
             * assert.deepStrictEqual(M.concat([1, 2], [3, 4]), [1, 2, 3, 4])
             *
             * @category instances
             * @since 2.5.0
             */
            var getMonoid = function () {
                return {
                    concat: exports.getSemigroup().concat,
                    empty: exports.empty,
                }
            }
            exports.getMonoid = getMonoid
            /**
             * Derives an `Eq` over the `ReadonlyArray` of a given element type from the `Eq` of that type. The derived `Eq` defines two
             * arrays as equal if all elements of both arrays are compared equal pairwise with the given `E`. In case of arrays of
             * different lengths, the result is non equality.
             *
             * @example
             * import * as S from 'fp-ts/string'
             * import { getEq } from 'fp-ts/ReadonlyArray'
             *
             * const E = getEq(S.Eq)
             * assert.strictEqual(E.equals(['a', 'b'], ['a', 'b']), true)
             * assert.strictEqual(E.equals(['a'], []), false)
             *
             * @category instances
             * @since 2.5.0
             */
            var getEq = function (E) {
                return Eq_1.fromEquals(function (xs, ys) {
                    return (
                        xs.length === ys.length &&
                        xs.every(function (x, i) {
                            return E.equals(x, ys[i])
                        })
                    )
                })
            }
            exports.getEq = getEq
            /**
             * Derives an `Ord` over the `ReadonlyArray` of a given element type from the `Ord` of that type. The ordering between two such
             * arrays is equal to: the first non equal comparison of each arrays elements taken pairwise in increasing order, in
             * case of equality over all the pairwise elements; the longest array is considered the greatest, if both arrays have
             * the same length, the result is equality.
             *
             * @example
             * import { getOrd } from 'fp-ts/ReadonlyArray'
             * import * as S from 'fp-ts/string'
             *
             * const O = getOrd(S.Ord)
             * assert.strictEqual(O.compare(['b'], ['a']), 1)
             * assert.strictEqual(O.compare(['a'], ['a']), 0)
             * assert.strictEqual(O.compare(['a'], ['b']), -1)
             *
             *
             * @category instances
             * @since 2.5.0
             */
            var getOrd = function (O) {
                return Ord_1.fromCompare(function (a, b) {
                    var aLen = a.length
                    var bLen = b.length
                    var len = Math.min(aLen, bLen)
                    for (var i = 0; i < len; i++) {
                        var ordering = O.compare(a[i], b[i])
                        if (ordering !== 0) {
                            return ordering
                        }
                    }
                    return N.Ord.compare(aLen, bLen)
                })
            }
            exports.getOrd = getOrd
            /**
             * @category instances
             * @since 2.11.0
             */
            var getUnionSemigroup = function (E) {
                var unionE = union(E)
                return {
                    concat: function (first, second) {
                        return unionE(second)(first)
                    },
                }
            }
            exports.getUnionSemigroup = getUnionSemigroup
            /**
             * @category instances
             * @since 2.11.0
             */
            var getUnionMonoid = function (E) {
                return {
                    concat: exports.getUnionSemigroup(E).concat,
                    empty: exports.empty,
                }
            }
            exports.getUnionMonoid = getUnionMonoid
            /**
             * @category instances
             * @since 2.11.0
             */
            var getIntersectionSemigroup = function (E) {
                var intersectionE = intersection(E)
                return {
                    concat: function (first, second) {
                        return intersectionE(second)(first)
                    },
                }
            }
            exports.getIntersectionSemigroup = getIntersectionSemigroup
            /**
             * @category instances
             * @since 2.11.0
             */
            var getDifferenceMagma = function (E) {
                var differenceE = difference(E)
                return {
                    concat: function (first, second) {
                        return differenceE(second)(first)
                    },
                }
            }
            exports.getDifferenceMagma = getDifferenceMagma
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Functor = {
                URI: exports.URI,
                map: _map,
            }
            /**
             * Derivable from `Functor`.
             *
             * @category combinators
             * @since 2.10.0
             */
            exports.flap =
                /*#__PURE__*/
                Functor_1.flap(exports.Functor)
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Pointed = {
                URI: exports.URI,
                of: exports.of,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.FunctorWithIndex = {
                URI: exports.URI,
                map: _map,
                mapWithIndex: _mapWithIndex,
            }
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Apply = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
            }
            /**
             * Combine two effectful actions, keeping only the result of the first.
             *
             * Derivable from `Apply`.
             *
             * @category combinators
             * @since 2.5.0
             */
            exports.apFirst =
                /*#__PURE__*/
                Apply_1.apFirst(exports.Apply)
            /**
             * Combine two effectful actions, keeping only the result of the second.
             *
             * Derivable from `Apply`.
             *
             * @category combinators
             * @since 2.5.0
             */
            exports.apSecond =
                /*#__PURE__*/
                Apply_1.apSecond(exports.Apply)
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Applicative = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                of: exports.of,
            }
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Chain = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                chain: _chain,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Monad = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                of: exports.of,
                chain: _chain,
            }
            /**
             * Composes computations in sequence, using the return value of one computation to determine the next computation and
             * keeping only the result of the first.
             *
             * Derivable from `Chain`.
             *
             * @category combinators
             * @since 2.5.0
             */
            exports.chainFirst =
                /*#__PURE__*/
                Chain_1.chainFirst(exports.Chain)
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Unfoldable = {
                URI: exports.URI,
                unfold: exports.unfold,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Alt = {
                URI: exports.URI,
                map: _map,
                alt: _alt,
            }
            /**
             * @category instances
             * @since 2.11.0
             */
            exports.Zero = {
                URI: exports.URI,
                zero: exports.zero,
            }
            /**
             * @category constructors
             * @since 2.11.0
             */
            exports.guard =
                /*#__PURE__*/
                Zero_1.guard(exports.Zero, exports.Pointed)
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Alternative = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                of: exports.of,
                alt: _alt,
                zero: exports.zero,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Extend = {
                URI: exports.URI,
                map: _map,
                extend: _extend,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Compactable = {
                URI: exports.URI,
                compact: exports.compact,
                separate: exports.separate,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Filterable = {
                URI: exports.URI,
                map: _map,
                compact: exports.compact,
                separate: exports.separate,
                filter: _filter,
                filterMap: _filterMap,
                partition: _partition,
                partitionMap: _partitionMap,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.FilterableWithIndex = {
                URI: exports.URI,
                map: _map,
                mapWithIndex: _mapWithIndex,
                compact: exports.compact,
                separate: exports.separate,
                filter: _filter,
                filterMap: _filterMap,
                partition: _partition,
                partitionMap: _partitionMap,
                partitionMapWithIndex: _partitionMapWithIndex,
                partitionWithIndex: _partitionWithIndex,
                filterMapWithIndex: _filterMapWithIndex,
                filterWithIndex: _filterWithIndex,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Foldable = {
                URI: exports.URI,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.FoldableWithIndex = {
                URI: exports.URI,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                reduceWithIndex: _reduceWithIndex,
                foldMapWithIndex: _foldMapWithIndex,
                reduceRightWithIndex: _reduceRightWithIndex,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Traversable = {
                URI: exports.URI,
                map: _map,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                traverse: _traverse,
                sequence: exports.sequence,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.TraversableWithIndex = {
                URI: exports.URI,
                map: _map,
                mapWithIndex: _mapWithIndex,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                reduceWithIndex: _reduceWithIndex,
                foldMapWithIndex: _foldMapWithIndex,
                reduceRightWithIndex: _reduceRightWithIndex,
                traverse: _traverse,
                sequence: exports.sequence,
                traverseWithIndex: _traverseWithIndex,
            }
            /**
             * @category ChainRec
             * @since 2.11.0
             */
            var chainRecDepthFirst = function (f) {
                return function (a) {
                    var todo = __spreadArray([], f(a))
                    var out = []
                    while (todo.length > 0) {
                        var e = todo.shift()
                        if (_.isLeft(e)) {
                            todo.unshift.apply(todo, f(e.left))
                        } else {
                            out.push(e.right)
                        }
                    }
                    return out
                }
            }
            exports.chainRecDepthFirst = chainRecDepthFirst
            /**
             * @category instances
             * @since 2.11.0
             */
            exports.ChainRecDepthFirst = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                chain: _chain,
                chainRec: exports._chainRecDepthFirst,
            }
            /**
             * @category ChainRec
             * @since 2.11.0
             */
            var chainRecBreadthFirst = function (f) {
                return function (a) {
                    var initial = f(a)
                    var todo = []
                    var out = []
                    function go(e) {
                        if (_.isLeft(e)) {
                            f(e.left).forEach(function (v) {
                                return todo.push(v)
                            })
                        } else {
                            out.push(e.right)
                        }
                    }
                    for (var _i = 0, initial_1 = initial; _i < initial_1.length; _i++) {
                        var e = initial_1[_i]
                        go(e)
                    }
                    while (todo.length > 0) {
                        go(todo.shift())
                    }
                    return out
                }
            }
            exports.chainRecBreadthFirst = chainRecBreadthFirst
            /**
             * @category instances
             * @since 2.11.0
             */
            exports.ChainRecBreadthFirst = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                chain: _chain,
                chainRec: exports._chainRecBreadthFirst,
            }
            var _wither = Witherable_1.witherDefault(exports.Traversable, exports.Compactable)
            var _wilt = Witherable_1.wiltDefault(exports.Traversable, exports.Compactable)
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Witherable = {
                URI: exports.URI,
                map: _map,
                compact: exports.compact,
                separate: exports.separate,
                filter: _filter,
                filterMap: _filterMap,
                partition: _partition,
                partitionMap: _partitionMap,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                traverse: _traverse,
                sequence: exports.sequence,
                wither: _wither,
                wilt: _wilt,
            }
            /**
             * Filter values inside a context.
             *
             * @example
             * import { pipe } from 'fp-ts/function'
             * import * as RA from 'fp-ts/ReadonlyArray'
             * import * as T from 'fp-ts/Task'
             *
             * const filterE = RA.filterE(T.ApplicativePar)
             * async function test() {
             *   assert.deepStrictEqual(
             *     await pipe(
             *       [-1, 2, 3],
             *       filterE((n) => T.of(n > 0))
             *     )(),
             *     [2, 3]
             *   )
             * }
             * test()
             *
             * @since 2.11.0
             */
            exports.filterE =
                /*#__PURE__*/
                Witherable_1.filterE(exports.Witherable)
            /**
             * @category instances
             * @since 2.11.0
             */
            exports.FromEither = {
                URI: exports.URI,
                fromEither: exports.fromEither,
            }
            /**
             * @category combinators
             * @since 2.11.0
             */
            exports.fromEitherK =
                /*#__PURE__*/
                FromEither_1.fromEitherK(exports.FromEither)
            // -------------------------------------------------------------------------------------
            // unsafe
            // -------------------------------------------------------------------------------------
            /**
             * @category unsafe
             * @since 2.5.0
             */
            exports.unsafeInsertAt = RNEA.unsafeInsertAt
            /**
             * @category unsafe
             * @since 2.5.0
             */
            var unsafeUpdateAt = function (i, a, as) {
                return exports.isNonEmpty(as) ? RNEA.unsafeUpdateAt(i, a, as) : as
            }
            exports.unsafeUpdateAt = unsafeUpdateAt
            /**
             * @category unsafe
             * @since 2.5.0
             */
            var unsafeDeleteAt = function (i, as) {
                var xs = as.slice()
                xs.splice(i, 1)
                return xs
            }
            exports.unsafeDeleteAt = unsafeDeleteAt
            // -------------------------------------------------------------------------------------
            // interop
            // -------------------------------------------------------------------------------------
            /**
             * @category interop
             * @since 2.5.0
             */
            var toArray = function (as) {
                return as.slice()
            }
            exports.toArray = toArray
            /**
             * @category interop
             * @since 2.5.0
             */
            var fromArray = function (as) {
                return exports.isEmpty(as) ? exports.empty : as.slice()
            }
            exports.fromArray = fromArray
            // -------------------------------------------------------------------------------------
            // utils
            // -------------------------------------------------------------------------------------
            /**
             * An empty array
             *
             * @since 2.5.0
             */
            exports.empty = RNEA.empty
            /**
             * Check if a predicate holds true for every array member.
             *
             * @example
             * import { every } from 'fp-ts/ReadonlyArray'
             * import { pipe } from 'fp-ts/function'
             *
             * const isPositive = (n: number): boolean => n > 0
             *
             * assert.deepStrictEqual(pipe([1, 2, 3], every(isPositive)), true)
             * assert.deepStrictEqual(pipe([1, 2, -3], every(isPositive)), false)
             *
             * @since 2.9.0
             */
            var every = function (predicate) {
                return function (as) {
                    return as.every(predicate)
                }
            }
            exports.every = every
            /**
             * Check if a predicate holds true for any array member.
             *
             * @example
             * import { some } from 'fp-ts/ReadonlyArray'
             * import { pipe } from 'fp-ts/function'
             *
             * const isPositive = (n: number): boolean => n > 0
             *
             * assert.deepStrictEqual(pipe([-1, -2, 3], some(isPositive)), true)
             * assert.deepStrictEqual(pipe([-1, -2, -3], some(isPositive)), false)
             *
             * @since 2.9.0
             */
            var some = function (predicate) {
                return function (as) {
                    return as.some(predicate)
                }
            }
            exports.some = some
            /**
             * Alias of [`some`](#some)
             *
             * @since 2.11.0
             */
            exports.exists = exports.some
            // -------------------------------------------------------------------------------------
            // do notation
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.9.0
             */
            exports.Do =
                /*#__PURE__*/
                exports.of(_.emptyRecord)
            /**
             * @since 2.8.0
             */
            exports.bindTo =
                /*#__PURE__*/
                Functor_1.bindTo(exports.Functor)
            /**
             * @since 2.8.0
             */
            exports.bind =
                /*#__PURE__*/
                Chain_1.bind(exports.Chain)
            // -------------------------------------------------------------------------------------
            // pipeable sequence S
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.8.0
             */
            exports.apS =
                /*#__PURE__*/
                Apply_1.apS(exports.Apply)
            // -------------------------------------------------------------------------------------
            // deprecated
            // -------------------------------------------------------------------------------------
            // tslint:disable: deprecation
            /**
             * Use `ReadonlyNonEmptyArray` module instead.
             *
             * @category constructors
             * @since 2.5.0
             * @deprecated
             */
            exports.range = RNEA.range
            /**
             * Use [`prepend`](#prepend) instead.
             *
             * @category constructors
             * @since 2.5.0
             * @deprecated
             */
            exports.cons = RNEA.cons
            /**
             * Use [`append`](#append) instead.
             *
             * @category constructors
             * @since 2.5.0
             * @deprecated
             */
            exports.snoc = RNEA.snoc
            /**
             * Use [`prependAll`](#prependall) instead.
             *
             * @category combinators
             * @since 2.9.0
             * @deprecated
             */
            exports.prependToAll = exports.prependAll
            /**
             * Use small, specific instances instead.
             *
             * @category instances
             * @since 2.5.0
             * @deprecated
             */
            exports.readonlyArray = {
                URI: exports.URI,
                compact: exports.compact,
                separate: exports.separate,
                map: _map,
                ap: _ap,
                of: exports.of,
                chain: _chain,
                filter: _filter,
                filterMap: _filterMap,
                partition: _partition,
                partitionMap: _partitionMap,
                mapWithIndex: _mapWithIndex,
                partitionMapWithIndex: _partitionMapWithIndex,
                partitionWithIndex: _partitionWithIndex,
                filterMapWithIndex: _filterMapWithIndex,
                filterWithIndex: _filterWithIndex,
                alt: _alt,
                zero: exports.zero,
                unfold: exports.unfold,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                traverse: _traverse,
                sequence: exports.sequence,
                reduceWithIndex: _reduceWithIndex,
                foldMapWithIndex: _foldMapWithIndex,
                reduceRightWithIndex: _reduceRightWithIndex,
                traverseWithIndex: _traverseWithIndex,
                extend: _extend,
                wither: _wither,
                wilt: _wilt,
            }

            /***/
        },

        /***/ 8630: /***/ function (__unused_webpack_module, exports, __nccwpck_require__) {
            "use strict"

            var __createBinding =
                (this && this.__createBinding) ||
                (Object.create
                    ? function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          Object.defineProperty(o, k2, {
                              enumerable: true,
                              get: function () {
                                  return m[k]
                              },
                          })
                      }
                    : function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          o[k2] = m[k]
                      })
            var __setModuleDefault =
                (this && this.__setModuleDefault) ||
                (Object.create
                    ? function (o, v) {
                          Object.defineProperty(o, "default", { enumerable: true, value: v })
                      }
                    : function (o, v) {
                          o["default"] = v
                      })
            var __importStar =
                (this && this.__importStar) ||
                function (mod) {
                    if (mod && mod.__esModule) return mod
                    var result = {}
                    if (mod != null)
                        for (var k in mod)
                            if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
                                __createBinding(result, mod, k)
                    __setModuleDefault(result, mod)
                    return result
                }
            var __spreadArray =
                (this && this.__spreadArray) ||
                function (to, from) {
                    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
                        to[j] = from[i]
                    return to
                }
            Object.defineProperty(exports, "__esModule", { value: true })
            exports.reduceRight = exports.foldMap = exports.reduce = exports.mapWithIndex = exports.map = exports.flatten = exports.duplicate = exports.extend = exports.chain = exports.ap = exports.alt = exports.altW = exports.of = exports.chunksOf = exports.splitAt = exports.chop = exports.chainWithIndex = exports.intersperse = exports.prependAll = exports.unzip = exports.zip = exports.zipWith = exports.modifyAt = exports.updateAt = exports.sort = exports.groupBy = exports.group = exports.reverse = exports.concat = exports.concatW = exports.fromArray = exports.unappend = exports.unprepend = exports.range = exports.replicate = exports.makeBy = exports.fromReadonlyArray = exports.rotate = exports.union = exports.sortBy = exports.uniq = exports.unsafeUpdateAt = exports.unsafeInsertAt = exports.append = exports.appendW = exports.prepend = exports.prependW = exports.isOutOfBound = exports.isNonEmpty = exports.empty = void 0
            exports.uncons = exports.filterWithIndex = exports.filter = exports.groupSort = exports.updateLast = exports.modifyLast = exports.updateHead = exports.modifyHead = exports.matchRight = exports.matchLeft = exports.concatAll = exports.max = exports.min = exports.init = exports.last = exports.tail = exports.head = exports.apS = exports.bind = exports.bindTo = exports.Do = exports.Comonad = exports.Alt = exports.TraversableWithIndex = exports.Traversable = exports.FoldableWithIndex = exports.Foldable = exports.Monad = exports.chainFirst = exports.Chain = exports.Applicative = exports.apSecond = exports.apFirst = exports.Apply = exports.FunctorWithIndex = exports.Pointed = exports.flap = exports.Functor = exports.getUnionSemigroup = exports.getEq = exports.getSemigroup = exports.getShow = exports.URI = exports.extract = exports.traverseWithIndex = exports.sequence = exports.traverse = exports.reduceRightWithIndex = exports.foldMapWithIndex = exports.reduceWithIndex = void 0
            exports.readonlyNonEmptyArray = exports.fold = exports.prependToAll = exports.insertAt = exports.snoc = exports.cons = exports.unsnoc = void 0
            var Apply_1 = __nccwpck_require__(205)
            var Chain_1 = __nccwpck_require__(2372)
            var Eq_1 = __nccwpck_require__(6964)
            var function_1 = __nccwpck_require__(6985)
            var Functor_1 = __nccwpck_require__(5533)
            var _ = __importStar(__nccwpck_require__(1840))
            var Ord_1 = __nccwpck_require__(6685)
            var Se = __importStar(__nccwpck_require__(6339))
            // -------------------------------------------------------------------------------------
            // internal
            // -------------------------------------------------------------------------------------
            /**
             * @internal
             */
            exports.empty = _.emptyReadonlyArray
            /**
             * @internal
             */
            exports.isNonEmpty = _.isNonEmpty
            /**
             * @internal
             */
            var isOutOfBound = function (i, as) {
                return i < 0 || i >= as.length
            }
            exports.isOutOfBound = isOutOfBound
            /**
             * @internal
             */
            var prependW = function (head) {
                return function (tail) {
                    return __spreadArray([head], tail)
                }
            }
            exports.prependW = prependW
            /**
             * @internal
             */
            exports.prepend = exports.prependW
            /**
             * @internal
             */
            var appendW = function (end) {
                return function (init) {
                    return __spreadArray(__spreadArray([], init), [end])
                }
            }
            exports.appendW = appendW
            /**
             * @internal
             */
            exports.append = exports.appendW
            /**
             * @internal
             */
            var unsafeInsertAt = function (i, a, as) {
                if (exports.isNonEmpty(as)) {
                    var xs = _.fromReadonlyNonEmptyArray(as)
                    xs.splice(i, 0, a)
                    return xs
                }
                return [a]
            }
            exports.unsafeInsertAt = unsafeInsertAt
            /**
             * @internal
             */
            var unsafeUpdateAt = function (i, a, as) {
                if (as[i] === a) {
                    return as
                } else {
                    var xs = _.fromReadonlyNonEmptyArray(as)
                    xs[i] = a
                    return xs
                }
            }
            exports.unsafeUpdateAt = unsafeUpdateAt
            /**
             * Remove duplicates from a `ReadonlyNonEmptyArray`, keeping the first occurrence of an element.
             *
             * @example
             * import { uniq } from 'fp-ts/ReadonlyNonEmptyArray'
             * import * as N from 'fp-ts/number'
             *
             * assert.deepStrictEqual(uniq(N.Eq)([1, 2, 1]), [1, 2])
             *
             * @category combinators
             * @since 2.11.0
             */
            var uniq = function (E) {
                return function (as) {
                    if (as.length === 1) {
                        return as
                    }
                    var out = [exports.head(as)]
                    var rest = exports.tail(as)
                    var _loop_1 = function (a) {
                        if (
                            out.every(function (o) {
                                return !E.equals(o, a)
                            })
                        ) {
                            out.push(a)
                        }
                    }
                    for (var _i = 0, rest_1 = rest; _i < rest_1.length; _i++) {
                        var a = rest_1[_i]
                        _loop_1(a)
                    }
                    return out
                }
            }
            exports.uniq = uniq
            /**
             * Sort the elements of a `ReadonlyNonEmptyArray` in increasing order, where elements are compared using first `ords[0]`, then `ords[1]`,
             * etc...
             *
             * @example
             * import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
             * import { contramap } from 'fp-ts/Ord'
             * import * as S from 'fp-ts/string'
             * import * as N from 'fp-ts/number'
             * import { pipe } from 'fp-ts/function'
             *
             * interface Person {
             *   name: string
             *   age: number
             * }
             *
             * const byName = pipe(S.Ord, contramap((p: Person) => p.name))
             *
             * const byAge = pipe(N.Ord, contramap((p: Person) => p.age))
             *
             * const sortByNameByAge = RNEA.sortBy([byName, byAge])
             *
             * const persons: RNEA.ReadonlyNonEmptyArray<Person> = [
             *   { name: 'a', age: 1 },
             *   { name: 'b', age: 3 },
             *   { name: 'c', age: 2 },
             *   { name: 'b', age: 2 }
             * ]
             *
             * assert.deepStrictEqual(sortByNameByAge(persons), [
             *   { name: 'a', age: 1 },
             *   { name: 'b', age: 2 },
             *   { name: 'b', age: 3 },
             *   { name: 'c', age: 2 }
             * ])
             *
             * @category combinators
             * @since 2.11.0
             */
            var sortBy = function (ords) {
                if (exports.isNonEmpty(ords)) {
                    var M = Ord_1.getMonoid()
                    return exports.sort(ords.reduce(M.concat, M.empty))
                }
                return function_1.identity
            }
            exports.sortBy = sortBy
            /**
             * @category combinators
             * @since 2.11.0
             */
            var union = function (E) {
                var uniqE = exports.uniq(E)
                return function (second) {
                    return function (first) {
                        return uniqE(function_1.pipe(first, concat(second)))
                    }
                }
            }
            exports.union = union
            /**
             * Rotate a `ReadonlyNonEmptyArray` by `n` steps.
             *
             * @example
             * import { rotate } from 'fp-ts/ReadonlyNonEmptyArray'
             *
             * assert.deepStrictEqual(rotate(2)([1, 2, 3, 4, 5]), [4, 5, 1, 2, 3])
             * assert.deepStrictEqual(rotate(-2)([1, 2, 3, 4, 5]), [3, 4, 5, 1, 2])
             *
             * @category combinators
             * @since 2.11.0
             */
            var rotate = function (n) {
                return function (as) {
                    var len = as.length
                    var m = Math.round(n) % len
                    if (exports.isOutOfBound(Math.abs(m), as) || m === 0) {
                        return as
                    }
                    if (m < 0) {
                        var _a = exports.splitAt(-m)(as),
                            f = _a[0],
                            s = _a[1]
                        return function_1.pipe(s, concat(f))
                    } else {
                        return exports.rotate(m - len)(as)
                    }
                }
            }
            exports.rotate = rotate
            // -------------------------------------------------------------------------------------
            // constructors
            // -------------------------------------------------------------------------------------
            /**
             * Return a `ReadonlyNonEmptyArray` from a `ReadonlyArray` returning `none` if the input is empty.
             *
             * @category constructors
             * @since 2.5.0
             */
            var fromReadonlyArray = function (as) {
                return exports.isNonEmpty(as) ? _.some(as) : _.none
            }
            exports.fromReadonlyArray = fromReadonlyArray
            /**
             * Return a `ReadonlyNonEmptyArray` of length `n` with element `i` initialized with `f(i)`.
             *
             * **Note**. `n` is normalized to a natural number.
             *
             * @example
             * import { makeBy } from 'fp-ts/ReadonlyNonEmptyArray'
             * import { pipe } from 'fp-ts/function'
             *
             * const double = (n: number): number => n * 2
             * assert.deepStrictEqual(pipe(5, makeBy(double)), [0, 2, 4, 6, 8])
             *
             * @category constructors
             * @since 2.11.0
             */
            var makeBy = function (f) {
                return function (n) {
                    var j = Math.max(0, Math.floor(n))
                    var out = [f(0)]
                    for (var i = 1; i < j; i++) {
                        out.push(f(i))
                    }
                    return out
                }
            }
            exports.makeBy = makeBy
            /**
             * Create a `ReadonlyNonEmptyArray` containing a value repeated the specified number of times.
             *
             * **Note**. `n` is normalized to a natural number.
             *
             * @example
             * import { replicate } from 'fp-ts/ReadonlyNonEmptyArray'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(pipe(3, replicate('a')), ['a', 'a', 'a'])
             *
             * @category constructors
             * @since 2.11.0
             */
            var replicate = function (a) {
                return exports.makeBy(function () {
                    return a
                })
            }
            exports.replicate = replicate
            /**
             * Create a `ReadonlyNonEmptyArray` containing a range of integers, including both endpoints.
             *
             * @example
             * import { range } from 'fp-ts/ReadonlyNonEmptyArray'
             *
             * assert.deepStrictEqual(range(1, 5), [1, 2, 3, 4, 5])
             *
             * @category constructors
             * @since 2.11.0
             */
            var range = function (start, end) {
                return start <= end
                    ? exports.makeBy(function (i) {
                          return start + i
                      })(end - start + 1)
                    : [start]
            }
            exports.range = range
            // -------------------------------------------------------------------------------------
            // destructors
            // -------------------------------------------------------------------------------------
            /**
             * Return the tuple of the `head` and the `tail`.
             *
             * @example
             * import { unprepend } from 'fp-ts/ReadonlyNonEmptyArray'
             *
             * assert.deepStrictEqual(unprepend([1, 2, 3, 4]), [1, [2, 3, 4]])
             *
             * @category destructors
             * @since 2.9.0
             */
            var unprepend = function (as) {
                return [exports.head(as), exports.tail(as)]
            }
            exports.unprepend = unprepend
            /**
             * Return the tuple of the `init` and the `last`.
             *
             * @example
             * import { unappend } from 'fp-ts/ReadonlyNonEmptyArray'
             *
             * assert.deepStrictEqual(unappend([1, 2, 3, 4]), [[1, 2, 3], 4])
             *
             * @category destructors
             * @since 2.9.0
             */
            var unappend = function (as) {
                return [exports.init(as), exports.last(as)]
            }
            exports.unappend = unappend
            // -------------------------------------------------------------------------------------
            // interop
            // -------------------------------------------------------------------------------------
            /**
             * @category interop
             * @since 2.5.0
             */
            var fromArray = function (as) {
                return exports.fromReadonlyArray(as.slice())
            }
            exports.fromArray = fromArray
            function concatW(second) {
                return function (first) {
                    return first.concat(second)
                }
            }
            exports.concatW = concatW
            function concat(x, y) {
                return y
                    ? x.concat(y)
                    : function (y) {
                          return y.concat(x)
                      }
            }
            exports.concat = concat
            /**
             * @category combinators
             * @since 2.5.0
             */
            var reverse = function (as) {
                return as.length === 1
                    ? as
                    : __spreadArray([exports.last(as)], as.slice(0, -1).reverse())
            }
            exports.reverse = reverse
            function group(E) {
                return function (as) {
                    var len = as.length
                    if (len === 0) {
                        return exports.empty
                    }
                    var out = []
                    var head = as[0]
                    var nea = [head]
                    for (var i = 1; i < len; i++) {
                        var a = as[i]
                        if (E.equals(a, head)) {
                            nea.push(a)
                        } else {
                            out.push(nea)
                            head = a
                            nea = [head]
                        }
                    }
                    out.push(nea)
                    return out
                }
            }
            exports.group = group
            /**
             * Splits an array into sub-non-empty-arrays stored in an object, based on the result of calling a `string`-returning
             * function on each element, and grouping the results according to values returned
             *
             * @example
             * import { groupBy } from 'fp-ts/ReadonlyNonEmptyArray'
             *
             * assert.deepStrictEqual(groupBy((s: string) => String(s.length))(['a', 'b', 'ab']), {
             *   '1': ['a', 'b'],
             *   '2': ['ab']
             * })
             *
             * @category combinators
             * @since 2.5.0
             */
            var groupBy = function (f) {
                return function (as) {
                    var out = {}
                    for (var _i = 0, as_1 = as; _i < as_1.length; _i++) {
                        var a = as_1[_i]
                        var k = f(a)
                        if (out.hasOwnProperty(k)) {
                            out[k].push(a)
                        } else {
                            out[k] = [a]
                        }
                    }
                    return out
                }
            }
            exports.groupBy = groupBy
            /**
             * @category combinators
             * @since 2.5.0
             */
            var sort = function (O) {
                return function (as) {
                    return as.length === 1 ? as : as.slice().sort(O.compare)
                }
            }
            exports.sort = sort
            /**
             * @category combinators
             * @since 2.5.0
             */
            var updateAt = function (i, a) {
                return exports.modifyAt(i, function () {
                    return a
                })
            }
            exports.updateAt = updateAt
            /**
             * @category combinators
             * @since 2.5.0
             */
            var modifyAt = function (i, f) {
                return function (as) {
                    return exports.isOutOfBound(i, as)
                        ? _.none
                        : _.some(exports.unsafeUpdateAt(i, f(as[i]), as))
                }
            }
            exports.modifyAt = modifyAt
            /**
             * @category combinators
             * @since 2.5.1
             */
            var zipWith = function (as, bs, f) {
                var cs = [f(as[0], bs[0])]
                var len = Math.min(as.length, bs.length)
                for (var i = 1; i < len; i++) {
                    cs[i] = f(as[i], bs[i])
                }
                return cs
            }
            exports.zipWith = zipWith
            function zip(as, bs) {
                if (bs === undefined) {
                    return function (bs) {
                        return zip(bs, as)
                    }
                }
                return exports.zipWith(as, bs, function (a, b) {
                    return [a, b]
                })
            }
            exports.zip = zip
            /**
             * @category combinators
             * @since 2.5.1
             */
            var unzip = function (abs) {
                var fa = [abs[0][0]]
                var fb = [abs[0][1]]
                for (var i = 1; i < abs.length; i++) {
                    fa[i] = abs[i][0]
                    fb[i] = abs[i][1]
                }
                return [fa, fb]
            }
            exports.unzip = unzip
            /**
             * Prepend an element to every member of a `ReadonlyNonEmptyArray`.
             *
             * @example
             * import { prependAll } from 'fp-ts/ReadonlyNonEmptyArray'
             *
             * assert.deepStrictEqual(prependAll(9)([1, 2, 3, 4]), [9, 1, 9, 2, 9, 3, 9, 4])
             *
             * @category combinators
             * @since 2.10.0
             */
            var prependAll = function (middle) {
                return function (as) {
                    var out = [middle, as[0]]
                    for (var i = 1; i < as.length; i++) {
                        out.push(middle, as[i])
                    }
                    return out
                }
            }
            exports.prependAll = prependAll
            /**
             * Places an element in between members of a `ReadonlyNonEmptyArray`.
             *
             * @example
             * import { intersperse } from 'fp-ts/ReadonlyNonEmptyArray'
             *
             * assert.deepStrictEqual(intersperse(9)([1, 2, 3, 4]), [1, 9, 2, 9, 3, 9, 4])
             *
             * @category combinators
             * @since 2.9.0
             */
            var intersperse = function (middle) {
                return function (as) {
                    var rest = exports.tail(as)
                    return exports.isNonEmpty(rest)
                        ? function_1.pipe(
                              rest,
                              exports.prependAll(middle),
                              exports.prepend(exports.head(as)),
                          )
                        : as
                }
            }
            exports.intersperse = intersperse
            /**
             * @category combinators
             * @since 2.10.0
             */
            var chainWithIndex = function (f) {
                return function (as) {
                    var out = _.fromReadonlyNonEmptyArray(f(0, exports.head(as)))
                    for (var i = 1; i < as.length; i++) {
                        out.push.apply(out, f(i, as[i]))
                    }
                    return out
                }
            }
            exports.chainWithIndex = chainWithIndex
            /**
             * A useful recursion pattern for processing a `ReadonlyNonEmptyArray` to produce a new `ReadonlyNonEmptyArray`, often used for "chopping" up the input
             * `ReadonlyNonEmptyArray`. Typically `chop` is called with some function that will consume an initial prefix of the `ReadonlyNonEmptyArray` and produce a
             * value and the tail of the `ReadonlyNonEmptyArray`.
             *
             * @category combinators
             * @since 2.10.0
             */
            var chop = function (f) {
                return function (as) {
                    var _a = f(as),
                        b = _a[0],
                        rest = _a[1]
                    var out = [b]
                    var next = rest
                    while (exports.isNonEmpty(next)) {
                        var _b = f(next),
                            b_1 = _b[0],
                            rest_2 = _b[1]
                        out.push(b_1)
                        next = rest_2
                    }
                    return out
                }
            }
            exports.chop = chop
            /**
             * Splits a `ReadonlyNonEmptyArray` into two pieces, the first piece has max `n` elements.
             *
             * @category combinators
             * @since 2.10.0
             */
            var splitAt = function (n) {
                return function (as) {
                    var m = Math.max(1, n)
                    return m >= as.length
                        ? [as, exports.empty]
                        : [
                              function_1.pipe(as.slice(1, m), exports.prepend(exports.head(as))),
                              as.slice(m),
                          ]
                }
            }
            exports.splitAt = splitAt
            /**
             * Splits a `ReadonlyNonEmptyArray` into length-`n` pieces. The last piece will be shorter if `n` does not evenly divide the length of
             * the `ReadonlyNonEmptyArray`.
             *
             * @category combinators
             * @since 2.10.0
             */
            var chunksOf = function (n) {
                return exports.chop(exports.splitAt(n))
            }
            exports.chunksOf = chunksOf
            // -------------------------------------------------------------------------------------
            // non-pipeables
            // -------------------------------------------------------------------------------------
            var _map = function (fa, f) {
                return function_1.pipe(fa, exports.map(f))
            }
            /* istanbul ignore next */
            var _mapWithIndex = function (fa, f) {
                return function_1.pipe(fa, exports.mapWithIndex(f))
            }
            var _ap = function (fab, fa) {
                return function_1.pipe(fab, exports.ap(fa))
            }
            var _chain = function (ma, f) {
                return function_1.pipe(ma, exports.chain(f))
            }
            /* istanbul ignore next */
            var _extend = function (wa, f) {
                return function_1.pipe(wa, exports.extend(f))
            }
            /* istanbul ignore next */
            var _reduce = function (fa, b, f) {
                return function_1.pipe(fa, exports.reduce(b, f))
            }
            /* istanbul ignore next */
            var _foldMap = function (M) {
                var foldMapM = exports.foldMap(M)
                return function (fa, f) {
                    return function_1.pipe(fa, foldMapM(f))
                }
            }
            /* istanbul ignore next */
            var _reduceRight = function (fa, b, f) {
                return function_1.pipe(fa, exports.reduceRight(b, f))
            }
            /* istanbul ignore next */
            var _traverse = function (F) {
                var traverseF = exports.traverse(F)
                return function (ta, f) {
                    return function_1.pipe(ta, traverseF(f))
                }
            }
            /* istanbul ignore next */
            var _alt = function (fa, that) {
                return function_1.pipe(fa, exports.alt(that))
            }
            /* istanbul ignore next */
            var _reduceWithIndex = function (fa, b, f) {
                return function_1.pipe(fa, exports.reduceWithIndex(b, f))
            }
            /* istanbul ignore next */
            var _foldMapWithIndex = function (M) {
                var foldMapWithIndexM = exports.foldMapWithIndex(M)
                return function (fa, f) {
                    return function_1.pipe(fa, foldMapWithIndexM(f))
                }
            }
            /* istanbul ignore next */
            var _reduceRightWithIndex = function (fa, b, f) {
                return function_1.pipe(fa, exports.reduceRightWithIndex(b, f))
            }
            /* istanbul ignore next */
            var _traverseWithIndex = function (F) {
                var traverseWithIndexF = exports.traverseWithIndex(F)
                return function (ta, f) {
                    return function_1.pipe(ta, traverseWithIndexF(f))
                }
            }
            // -------------------------------------------------------------------------------------
            // type class members
            // -------------------------------------------------------------------------------------
            /**
             * @category Pointed
             * @since 2.5.0
             */
            exports.of = _.singleton
            /**
             * Less strict version of [`alt`](#alt).
             *
             * @category Alt
             * @since 2.9.0
             */
            var altW = function (that) {
                return function (as) {
                    return function_1.pipe(as, concatW(that()))
                }
            }
            exports.altW = altW
            /**
             * Identifies an associative operation on a type constructor. It is similar to `Semigroup`, except that it applies to
             * types of kind `* -> *`.
             *
             * @category Alt
             * @since 2.6.2
             */
            exports.alt = exports.altW
            /**
             * @category Apply
             * @since 2.5.0
             */
            var ap = function (as) {
                return exports.chain(function (f) {
                    return function_1.pipe(as, exports.map(f))
                })
            }
            exports.ap = ap
            /**
             * Composes computations in sequence, using the return value of one computation to determine the next computation.
             *
             * @category Monad
             * @since 2.5.0
             */
            var chain = function (f) {
                return exports.chainWithIndex(function (_, a) {
                    return f(a)
                })
            }
            exports.chain = chain
            /**
             * @category Extend
             * @since 2.5.0
             */
            var extend = function (f) {
                return function (as) {
                    var next = exports.tail(as)
                    var out = [f(as)]
                    while (exports.isNonEmpty(next)) {
                        out.push(f(next))
                        next = exports.tail(next)
                    }
                    return out
                }
            }
            exports.extend = extend
            /**
             * Derivable from `Extend`.
             *
             * @category combinators
             * @since 2.5.0
             */
            exports.duplicate =
                /*#__PURE__*/
                exports.extend(function_1.identity)
            /**
             * Derivable from `Chain`.
             *
             * @category combinators
             * @since 2.5.0
             */
            exports.flatten =
                /*#__PURE__*/
                exports.chain(function_1.identity)
            /**
             * `map` can be used to turn functions `(a: A) => B` into functions `(fa: F<A>) => F<B>` whose argument and return types
             * use the type constructor `F` to represent some computational context.
             *
             * @category Functor
             * @since 2.5.0
             */
            var map = function (f) {
                return exports.mapWithIndex(function (_, a) {
                    return f(a)
                })
            }
            exports.map = map
            /**
             * @category FunctorWithIndex
             * @since 2.5.0
             */
            var mapWithIndex = function (f) {
                return function (as) {
                    var out = [f(0, exports.head(as))]
                    for (var i = 1; i < as.length; i++) {
                        out.push(f(i, as[i]))
                    }
                    return out
                }
            }
            exports.mapWithIndex = mapWithIndex
            /**
             * @category Foldable
             * @since 2.5.0
             */
            var reduce = function (b, f) {
                return exports.reduceWithIndex(b, function (_, b, a) {
                    return f(b, a)
                })
            }
            exports.reduce = reduce
            /**
             * **Note**. The constraint is relaxed: a `Semigroup` instead of a `Monoid`.
             *
             * @category Foldable
             * @since 2.5.0
             */
            var foldMap = function (S) {
                return function (f) {
                    return function (as) {
                        return as.slice(1).reduce(function (s, a) {
                            return S.concat(s, f(a))
                        }, f(as[0]))
                    }
                }
            }
            exports.foldMap = foldMap
            /**
             * @category Foldable
             * @since 2.5.0
             */
            var reduceRight = function (b, f) {
                return exports.reduceRightWithIndex(b, function (_, b, a) {
                    return f(b, a)
                })
            }
            exports.reduceRight = reduceRight
            /**
             * @category FoldableWithIndex
             * @since 2.5.0
             */
            var reduceWithIndex = function (b, f) {
                return function (as) {
                    return as.reduce(function (b, a, i) {
                        return f(i, b, a)
                    }, b)
                }
            }
            exports.reduceWithIndex = reduceWithIndex
            /**
             * **Note**. The constraint is relaxed: a `Semigroup` instead of a `Monoid`.
             *
             * @category FoldableWithIndex
             * @since 2.5.0
             */
            var foldMapWithIndex = function (S) {
                return function (f) {
                    return function (as) {
                        return as.slice(1).reduce(function (s, a, i) {
                            return S.concat(s, f(i + 1, a))
                        }, f(0, as[0]))
                    }
                }
            }
            exports.foldMapWithIndex = foldMapWithIndex
            /**
             * @category FoldableWithIndex
             * @since 2.5.0
             */
            var reduceRightWithIndex = function (b, f) {
                return function (as) {
                    return as.reduceRight(function (b, a, i) {
                        return f(i, a, b)
                    }, b)
                }
            }
            exports.reduceRightWithIndex = reduceRightWithIndex
            /**
             * @category Traversable
             * @since 2.6.3
             */
            var traverse = function (F) {
                var traverseWithIndexF = exports.traverseWithIndex(F)
                return function (f) {
                    return traverseWithIndexF(function (_, a) {
                        return f(a)
                    })
                }
            }
            exports.traverse = traverse
            /**
             * @category Traversable
             * @since 2.6.3
             */
            var sequence = function (F) {
                return exports.traverseWithIndex(F)(function_1.SK)
            }
            exports.sequence = sequence
            /**
             * @category TraversableWithIndex
             * @since 2.6.3
             */
            var traverseWithIndex = function (F) {
                return function (f) {
                    return function (as) {
                        var out = F.map(f(0, exports.head(as)), exports.of)
                        for (var i = 1; i < as.length; i++) {
                            out = F.ap(
                                F.map(out, function (bs) {
                                    return function (b) {
                                        return function_1.pipe(bs, exports.append(b))
                                    }
                                }),
                                f(i, as[i]),
                            )
                        }
                        return out
                    }
                }
            }
            exports.traverseWithIndex = traverseWithIndex
            /**
             * @category Comonad
             * @since 2.6.3
             */
            exports.extract = _.head
            // -------------------------------------------------------------------------------------
            // instances
            // -------------------------------------------------------------------------------------
            /**
             * @category instances
             * @since 2.5.0
             */
            exports.URI = "ReadonlyNonEmptyArray"
            /**
             * @category instances
             * @since 2.5.0
             */
            var getShow = function (S) {
                return {
                    show: function (as) {
                        return "[" + as.map(S.show).join(", ") + "]"
                    },
                }
            }
            exports.getShow = getShow
            /**
             * Builds a `Semigroup` instance for `ReadonlyNonEmptyArray`
             *
             * @category instances
             * @since 2.5.0
             */
            var getSemigroup = function () {
                return {
                    concat: concat,
                }
            }
            exports.getSemigroup = getSemigroup
            /**
             * @example
             * import { getEq } from 'fp-ts/ReadonlyNonEmptyArray'
             * import * as N from 'fp-ts/number'
             *
             * const E = getEq(N.Eq)
             * assert.strictEqual(E.equals([1, 2], [1, 2]), true)
             * assert.strictEqual(E.equals([1, 2], [1, 3]), false)
             *
             * @category instances
             * @since 2.5.0
             */
            var getEq = function (E) {
                return Eq_1.fromEquals(function (xs, ys) {
                    return (
                        xs.length === ys.length &&
                        xs.every(function (x, i) {
                            return E.equals(x, ys[i])
                        })
                    )
                })
            }
            exports.getEq = getEq
            /**
             * @category combinators
             * @since 2.11.0
             */
            var getUnionSemigroup = function (E) {
                var unionE = exports.union(E)
                return {
                    concat: function (first, second) {
                        return unionE(second)(first)
                    },
                }
            }
            exports.getUnionSemigroup = getUnionSemigroup
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Functor = {
                URI: exports.URI,
                map: _map,
            }
            /**
             * Derivable from `Functor`.
             *
             * @category combinators
             * @since 2.10.0
             */
            exports.flap =
                /*#__PURE__*/
                Functor_1.flap(exports.Functor)
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Pointed = {
                URI: exports.URI,
                of: exports.of,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.FunctorWithIndex = {
                URI: exports.URI,
                map: _map,
                mapWithIndex: _mapWithIndex,
            }
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Apply = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
            }
            /**
             * Combine two effectful actions, keeping only the result of the first.
             *
             * Derivable from `Apply`.
             *
             * @category combinators
             * @since 2.5.0
             */
            exports.apFirst =
                /*#__PURE__*/
                Apply_1.apFirst(exports.Apply)
            /**
             * Combine two effectful actions, keeping only the result of the second.
             *
             * Derivable from `Apply`.
             *
             * @category combinators
             * @since 2.5.0
             */
            exports.apSecond =
                /*#__PURE__*/
                Apply_1.apSecond(exports.Apply)
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Applicative = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                of: exports.of,
            }
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Chain = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                chain: _chain,
            }
            /**
             * Composes computations in sequence, using the return value of one computation to determine the next computation and
             * keeping only the result of the first.
             *
             * Derivable from `Chain`.
             *
             * @category combinators
             * @since 2.5.0
             */
            exports.chainFirst =
                /*#__PURE__*/
                Chain_1.chainFirst(exports.Chain)
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Monad = {
                URI: exports.URI,
                map: _map,
                ap: _ap,
                of: exports.of,
                chain: _chain,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Foldable = {
                URI: exports.URI,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.FoldableWithIndex = {
                URI: exports.URI,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                reduceWithIndex: _reduceWithIndex,
                foldMapWithIndex: _foldMapWithIndex,
                reduceRightWithIndex: _reduceRightWithIndex,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Traversable = {
                URI: exports.URI,
                map: _map,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                traverse: _traverse,
                sequence: exports.sequence,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.TraversableWithIndex = {
                URI: exports.URI,
                map: _map,
                mapWithIndex: _mapWithIndex,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                traverse: _traverse,
                sequence: exports.sequence,
                reduceWithIndex: _reduceWithIndex,
                foldMapWithIndex: _foldMapWithIndex,
                reduceRightWithIndex: _reduceRightWithIndex,
                traverseWithIndex: _traverseWithIndex,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Alt = {
                URI: exports.URI,
                map: _map,
                alt: _alt,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Comonad = {
                URI: exports.URI,
                map: _map,
                extend: _extend,
                extract: exports.extract,
            }
            // -------------------------------------------------------------------------------------
            // do notation
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.9.0
             */
            exports.Do =
                /*#__PURE__*/
                exports.of(_.emptyRecord)
            /**
             * @since 2.8.0
             */
            exports.bindTo =
                /*#__PURE__*/
                Functor_1.bindTo(exports.Functor)
            /**
             * @since 2.8.0
             */
            exports.bind =
                /*#__PURE__*/
                Chain_1.bind(exports.Chain)
            // -------------------------------------------------------------------------------------
            // pipeable sequence S
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.8.0
             */
            exports.apS =
                /*#__PURE__*/
                Apply_1.apS(exports.Apply)
            // -------------------------------------------------------------------------------------
            // utils
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.5.0
             */
            exports.head = exports.extract
            /**
             * @since 2.5.0
             */
            exports.tail = _.tail
            /**
             * @since 2.5.0
             */
            var last = function (as) {
                return as[as.length - 1]
            }
            exports.last = last
            /**
             * Get all but the last element of a non empty array, creating a new array.
             *
             * @example
             * import { init } from 'fp-ts/ReadonlyNonEmptyArray'
             *
             * assert.deepStrictEqual(init([1, 2, 3]), [1, 2])
             * assert.deepStrictEqual(init([1]), [])
             *
             * @since 2.5.0
             */
            var init = function (as) {
                return as.slice(0, -1)
            }
            exports.init = init
            /**
             * @since 2.5.0
             */
            var min = function (O) {
                var S = Se.min(O)
                return function (as) {
                    return as.reduce(S.concat)
                }
            }
            exports.min = min
            /**
             * @since 2.5.0
             */
            var max = function (O) {
                var S = Se.max(O)
                return function (as) {
                    return as.reduce(S.concat)
                }
            }
            exports.max = max
            /**
             * @since 2.10.0
             */
            var concatAll = function (S) {
                return function (as) {
                    return as.reduce(S.concat)
                }
            }
            exports.concatAll = concatAll
            /**
             * Break a `ReadonlyArray` into its first element and remaining elements.
             *
             * @category destructors
             * @since 2.11.0
             */
            var matchLeft = function (f) {
                return function (as) {
                    return f(exports.head(as), exports.tail(as))
                }
            }
            exports.matchLeft = matchLeft
            /**
             * Break a `ReadonlyArray` into its initial elements and the last element.
             *
             * @category destructors
             * @since 2.11.0
             */
            var matchRight = function (f) {
                return function (as) {
                    return f(exports.init(as), exports.last(as))
                }
            }
            exports.matchRight = matchRight
            /**
             * Apply a function to the head, creating a new `ReadonlyNonEmptyArray`.
             *
             * @since 2.11.0
             */
            var modifyHead = function (f) {
                return function (as) {
                    return __spreadArray([f(exports.head(as))], exports.tail(as))
                }
            }
            exports.modifyHead = modifyHead
            /**
             * Change the head, creating a new `ReadonlyNonEmptyArray`.
             *
             * @category combinators
             * @since 2.11.0
             */
            var updateHead = function (a) {
                return exports.modifyHead(function () {
                    return a
                })
            }
            exports.updateHead = updateHead
            /**
             * Apply a function to the last element, creating a new `ReadonlyNonEmptyArray`.
             *
             * @since 2.11.0
             */
            var modifyLast = function (f) {
                return function (as) {
                    return function_1.pipe(exports.init(as), exports.append(f(exports.last(as))))
                }
            }
            exports.modifyLast = modifyLast
            /**
             * Change the last element, creating a new `ReadonlyNonEmptyArray`.
             *
             * @category combinators
             * @since 2.11.0
             */
            var updateLast = function (a) {
                return exports.modifyLast(function () {
                    return a
                })
            }
            exports.updateLast = updateLast
            function groupSort(O) {
                var sortO = exports.sort(O)
                var groupO = group(O)
                return function (as) {
                    return exports.isNonEmpty(as) ? groupO(sortO(as)) : exports.empty
                }
            }
            exports.groupSort = groupSort
            function filter(predicate) {
                return exports.filterWithIndex(function (_, a) {
                    return predicate(a)
                })
            }
            exports.filter = filter
            /**
             * Use [`filterWithIndex`](./ReadonlyArray.ts.html#filterwithindex) instead.
             *
             * @category combinators
             * @since 2.5.0
             * @deprecated
             */
            var filterWithIndex = function (predicate) {
                return function (as) {
                    return exports.fromReadonlyArray(
                        as.filter(function (a, i) {
                            return predicate(i, a)
                        }),
                    )
                }
            }
            exports.filterWithIndex = filterWithIndex
            /**
             * Use [`unprepend`](#unprepend) instead.
             *
             * @category destructors
             * @since 2.10.0
             * @deprecated
             */
            exports.uncons = exports.unprepend
            /**
             * Use [`unappend`](#unappend) instead.
             *
             * @category destructors
             * @since 2.10.0
             * @deprecated
             */
            exports.unsnoc = exports.unappend
            function cons(head, tail) {
                return tail === undefined
                    ? exports.prepend(head)
                    : function_1.pipe(tail, exports.prepend(head))
            }
            exports.cons = cons
            /**
             * Use [`append`](./ReadonlyArray.ts.html#append) instead.
             *
             * @category constructors
             * @since 2.5.0
             * @deprecated
             */
            var snoc = function (init, end) {
                return function_1.pipe(init, concat([end]))
            }
            exports.snoc = snoc
            /**
             * Use [`insertAt`](./ReadonlyArray.ts.html#insertat) instead.
             *
             * @category combinators
             * @since 2.5.0
             * @deprecated
             */
            var insertAt = function (i, a) {
                return function (as) {
                    return i < 0 || i > as.length
                        ? _.none
                        : _.some(exports.unsafeInsertAt(i, a, as))
                }
            }
            exports.insertAt = insertAt
            /**
             * Use [`prependAll`](#prependall) instead.
             *
             * @category combinators
             * @since 2.9.0
             * @deprecated
             */
            exports.prependToAll = exports.prependAll
            /**
             * Use [`concatAll`](#concatall) instead.
             *
             * @since 2.5.0
             * @deprecated
             */
            exports.fold = exports.concatAll
            /**
             * Use small, specific instances instead.
             *
             * @category instances
             * @since 2.5.0
             * @deprecated
             */
            exports.readonlyNonEmptyArray = {
                URI: exports.URI,
                of: exports.of,
                map: _map,
                mapWithIndex: _mapWithIndex,
                ap: _ap,
                chain: _chain,
                extend: _extend,
                extract: exports.extract,
                reduce: _reduce,
                foldMap: _foldMap,
                reduceRight: _reduceRight,
                traverse: _traverse,
                sequence: exports.sequence,
                reduceWithIndex: _reduceWithIndex,
                foldMapWithIndex: _foldMapWithIndex,
                reduceRightWithIndex: _reduceRightWithIndex,
                traverseWithIndex: _traverseWithIndex,
                alt: _alt,
            }

            /***/
        },

        /***/ 1897: /***/ function (__unused_webpack_module, exports, __nccwpck_require__) {
            "use strict"

            var __createBinding =
                (this && this.__createBinding) ||
                (Object.create
                    ? function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          Object.defineProperty(o, k2, {
                              enumerable: true,
                              get: function () {
                                  return m[k]
                              },
                          })
                      }
                    : function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          o[k2] = m[k]
                      })
            var __setModuleDefault =
                (this && this.__setModuleDefault) ||
                (Object.create
                    ? function (o, v) {
                          Object.defineProperty(o, "default", { enumerable: true, value: v })
                      }
                    : function (o, v) {
                          o["default"] = v
                      })
            var __importStar =
                (this && this.__importStar) ||
                function (mod) {
                    if (mod && mod.__esModule) return mod
                    var result = {}
                    if (mod != null)
                        for (var k in mod)
                            if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
                                __createBinding(result, mod, k)
                    __setModuleDefault(result, mod)
                    return result
                }
            Object.defineProperty(exports, "__esModule", { value: true })
            exports._reduceWithIndex = exports._partitionMap = exports._partition = exports._filterMap = exports._filter = exports._reduceRight = exports._foldMap = exports._reduce = exports._mapWithIndex = exports._map = exports.difference = exports.intersection = exports.union = exports.elem = exports.some = exports.every = exports.fromFoldableMap = exports.fromFoldable = exports.filterWithIndex = exports.filterMapWithIndex = exports.partitionWithIndex = exports.partitionMapWithIndex = exports.wilt = exports.wither = exports.sequence = exports.traverse = exports.traverseWithIndex = exports.singleton = exports.reduceRightWithIndex = exports.foldMapWithIndex = exports.reduceWithIndex = exports.map = exports.mapWithIndex = exports.empty = exports.lookup = exports.isSubrecord = exports.pop = exports.modifyAt = exports.updateAt = exports.deleteAt = exports.has = exports.upsertAt = exports.toUnfoldable = exports.toReadonlyArray = exports.collect = exports.keys = exports.isEmpty = exports.size = exports.toRecord = exports.fromRecord = void 0
            exports.readonlyRecord = exports.hasOwnProperty = exports.insertAt = exports.Witherable = exports.TraversableWithIndex = exports.Traversable = exports.FoldableWithIndex = exports.Foldable = exports.getDifferenceMagma = exports.getIntersectionSemigroup = exports.getUnionMonoid = exports.getUnionSemigroup = exports.getWitherable = exports.getTraversableWithIndex = exports.getTraversable = exports.FilterableWithIndex = exports.Filterable = exports.Compactable = exports.getFoldableWithIndex = exports.getFoldable = exports.FunctorWithIndex = exports.flap = exports.Functor = exports.getMonoid = exports.getEq = exports.getShow = exports.URI = exports.separate = exports.compact = exports.reduceRight = exports.foldMap = exports.reduce = exports.partitionMap = exports.partition = exports.filterMap = exports.filter = exports._sequence = exports._traverse = exports._filterWithIndex = exports._filterMapWithIndex = exports._partitionWithIndex = exports._partitionMapWithIndex = exports._reduceRightWithIndex = exports._foldMapWithIndex = void 0
            var Eq_1 = __nccwpck_require__(6964)
            var function_1 = __nccwpck_require__(6985)
            var Functor_1 = __nccwpck_require__(5533)
            var _ = __importStar(__nccwpck_require__(1840))
            var Separated_1 = __nccwpck_require__(5877)
            var S = __importStar(__nccwpck_require__(5189))
            var Witherable_1 = __nccwpck_require__(4384)
            // -------------------------------------------------------------------------------------
            // interop
            // -------------------------------------------------------------------------------------
            /**
             * @category interop
             * @since 2.5.0
             */
            var fromRecord = function (r) {
                return Object.assign({}, r)
            }
            exports.fromRecord = fromRecord
            /**
             * @category interop
             * @since 2.5.0
             */
            var toRecord = function (r) {
                return Object.assign({}, r)
            }
            exports.toRecord = toRecord
            /**
             * Calculate the number of key/value pairs in a `ReadonlyRecord`,
             *
             * @since 2.5.0
             */
            var size = function (r) {
                return Object.keys(r).length
            }
            exports.size = size
            /**
             * Test whether a `ReadonlyRecord` is empty.
             *
             * @since 2.5.0
             */
            var isEmpty = function (r) {
                for (var k in r) {
                    if (_.has.call(r, k)) {
                        return false
                    }
                }
                return true
            }
            exports.isEmpty = isEmpty
            var keys_ = function (O) {
                return function (r) {
                    return Object.keys(r).sort(O.compare)
                }
            }
            /**
             * @since 2.5.0
             */
            exports.keys =
                /*#__PURE__*/
                keys_(S.Ord)
            function collect(O) {
                if (typeof O === "function") {
                    return collect(S.Ord)(O)
                }
                var keysO = keys_(O)
                return function (f) {
                    return function (r) {
                        var out = []
                        for (var _i = 0, _a = keysO(r); _i < _a.length; _i++) {
                            var key = _a[_i]
                            out.push(f(key, r[key]))
                        }
                        return out
                    }
                }
            }
            exports.collect = collect
            /**
             * Get a sorted `ReadonlyArray` of the key/value pairs contained in a `ReadonlyRecord`.
             *
             * @since 2.5.0
             */
            exports.toReadonlyArray =
                /*#__PURE__*/
                collect(S.Ord)(function (k, a) {
                    return [k, a]
                })
            function toUnfoldable(U) {
                return function (r) {
                    var sas = exports.toReadonlyArray(r)
                    var len = sas.length
                    return U.unfold(0, function (b) {
                        return b < len ? _.some([sas[b], b + 1]) : _.none
                    })
                }
            }
            exports.toUnfoldable = toUnfoldable
            /**
             * Insert or replace a key/value pair in a `ReadonlyRecord`.
             *
             * @category combinators
             * @since 2.10.0
             */
            var upsertAt = function (k, a) {
                return function (r) {
                    if (_.has.call(r, k) && r[k] === a) {
                        return r
                    }
                    var out = Object.assign({}, r)
                    out[k] = a
                    return out
                }
            }
            exports.upsertAt = upsertAt
            /**
             * Test whether or not a key exists in a `ReadonlyRecord`.
             *
             * Note. This function is not pipeable because is a `Refinement`.
             *
             * @since 2.10.0
             */
            var has = function (k, r) {
                return _.has.call(r, k)
            }
            exports.has = has
            function deleteAt(k) {
                return function (r) {
                    if (!_.has.call(r, k)) {
                        return r
                    }
                    var out = Object.assign({}, r)
                    delete out[k]
                    return out
                }
            }
            exports.deleteAt = deleteAt
            /**
             * @since 2.5.0
             */
            var updateAt = function (k, a) {
                return function (r) {
                    if (!exports.has(k, r)) {
                        return _.none
                    }
                    if (r[k] === a) {
                        return _.some(r)
                    }
                    var out = Object.assign({}, r)
                    out[k] = a
                    return _.some(out)
                }
            }
            exports.updateAt = updateAt
            /**
             * @since 2.5.0
             */
            var modifyAt = function (k, f) {
                return function (r) {
                    if (!exports.has(k, r)) {
                        return _.none
                    }
                    var next = f(r[k])
                    if (next === r[k]) {
                        return _.some(r)
                    }
                    var out = Object.assign({}, r)
                    out[k] = next
                    return _.some(out)
                }
            }
            exports.modifyAt = modifyAt
            function pop(k) {
                var deleteAtk = deleteAt(k)
                return function (r) {
                    var oa = lookup(k, r)
                    return _.isNone(oa) ? _.none : _.some([oa.value, deleteAtk(r)])
                }
            }
            exports.pop = pop
            function isSubrecord(E) {
                return function (me, that) {
                    if (that === undefined) {
                        var isSubrecordE_1 = isSubrecord(E)
                        return function (that) {
                            return isSubrecordE_1(that, me)
                        }
                    }
                    for (var k in me) {
                        if (!_.has.call(that, k) || !E.equals(me[k], that[k])) {
                            return false
                        }
                    }
                    return true
                }
            }
            exports.isSubrecord = isSubrecord
            function lookup(k, r) {
                if (r === undefined) {
                    return function (r) {
                        return lookup(k, r)
                    }
                }
                return _.has.call(r, k) ? _.some(r[k]) : _.none
            }
            exports.lookup = lookup
            /**
             * @since 2.5.0
             */
            exports.empty = {}
            function mapWithIndex(f) {
                return function (r) {
                    var out = {}
                    for (var k in r) {
                        if (_.has.call(r, k)) {
                            out[k] = f(k, r[k])
                        }
                    }
                    return out
                }
            }
            exports.mapWithIndex = mapWithIndex
            function map(f) {
                return mapWithIndex(function (_, a) {
                    return f(a)
                })
            }
            exports.map = map
            function reduceWithIndex() {
                var args = []
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i]
                }
                if (args.length === 2) {
                    return reduceWithIndex(S.Ord).apply(void 0, args)
                }
                var keysO = keys_(args[0])
                return function (b, f) {
                    return function (fa) {
                        var out = b
                        var ks = keysO(fa)
                        var len = ks.length
                        for (var i = 0; i < len; i++) {
                            var k = ks[i]
                            out = f(k, out, fa[k])
                        }
                        return out
                    }
                }
            }
            exports.reduceWithIndex = reduceWithIndex
            function foldMapWithIndex(O) {
                if ("compare" in O) {
                    var keysO_1 = keys_(O)
                    return function (M) {
                        return function (f) {
                            return function (fa) {
                                var out = M.empty
                                var ks = keysO_1(fa)
                                var len = ks.length
                                for (var i = 0; i < len; i++) {
                                    var k = ks[i]
                                    out = M.concat(out, f(k, fa[k]))
                                }
                                return out
                            }
                        }
                    }
                }
                return foldMapWithIndex(S.Ord)(O)
            }
            exports.foldMapWithIndex = foldMapWithIndex
            function reduceRightWithIndex() {
                var args = []
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i]
                }
                if (args.length === 2) {
                    return reduceRightWithIndex(S.Ord).apply(void 0, args)
                }
                var keysO = keys_(args[0])
                return function (b, f) {
                    return function (fa) {
                        var out = b
                        var ks = keysO(fa)
                        var len = ks.length
                        for (var i = len - 1; i >= 0; i--) {
                            var k = ks[i]
                            out = f(k, fa[k], out)
                        }
                        return out
                    }
                }
            }
            exports.reduceRightWithIndex = reduceRightWithIndex
            /**
             * Create a `ReadonlyRecord` with one key/value pair.
             *
             * @category constructors
             * @since 2.5.0
             */
            var singleton = function (k, a) {
                var _a
                return (_a = {}), (_a[k] = a), _a
            }
            exports.singleton = singleton
            function traverseWithIndex(F) {
                var traverseWithIndexOF = _traverseWithIndex(S.Ord)(F)
                return function (f) {
                    return function (ta) {
                        return traverseWithIndexOF(ta, f)
                    }
                }
            }
            exports.traverseWithIndex = traverseWithIndex
            function traverse(F) {
                var traverseOF = exports._traverse(S.Ord)(F)
                return function (f) {
                    return function (ta) {
                        return traverseOF(ta, f)
                    }
                }
            }
            exports.traverse = traverse
            function sequence(F) {
                return exports._sequence(S.Ord)(F)
            }
            exports.sequence = sequence
            /**
             * @category Witherable
             * @since 2.6.5
             */
            var wither = function (F) {
                var traverseF = traverse(F)
                return function (f) {
                    return function (fa) {
                        return F.map(function_1.pipe(fa, traverseF(f)), exports.compact)
                    }
                }
            }
            exports.wither = wither
            /**
             * @category Witherable
             * @since 2.6.5
             */
            var wilt = function (F) {
                var traverseF = traverse(F)
                return function (f) {
                    return function (fa) {
                        return F.map(function_1.pipe(fa, traverseF(f)), exports.separate)
                    }
                }
            }
            exports.wilt = wilt
            function partitionMapWithIndex(f) {
                return function (r) {
                    var left = {}
                    var right = {}
                    for (var k in r) {
                        if (_.has.call(r, k)) {
                            var e = f(k, r[k])
                            switch (e._tag) {
                                case "Left":
                                    left[k] = e.left
                                    break
                                case "Right":
                                    right[k] = e.right
                                    break
                            }
                        }
                    }
                    return Separated_1.separated(left, right)
                }
            }
            exports.partitionMapWithIndex = partitionMapWithIndex
            function partitionWithIndex(predicateWithIndex) {
                return function (r) {
                    var left = {}
                    var right = {}
                    for (var k in r) {
                        if (_.has.call(r, k)) {
                            var a = r[k]
                            if (predicateWithIndex(k, a)) {
                                right[k] = a
                            } else {
                                left[k] = a
                            }
                        }
                    }
                    return Separated_1.separated(left, right)
                }
            }
            exports.partitionWithIndex = partitionWithIndex
            function filterMapWithIndex(f) {
                return function (r) {
                    var out = {}
                    for (var k in r) {
                        if (_.has.call(r, k)) {
                            var ob = f(k, r[k])
                            if (_.isSome(ob)) {
                                out[k] = ob.value
                            }
                        }
                    }
                    return out
                }
            }
            exports.filterMapWithIndex = filterMapWithIndex
            function filterWithIndex(predicateWithIndex) {
                return function (fa) {
                    var out = {}
                    var changed = false
                    for (var key in fa) {
                        if (_.has.call(fa, key)) {
                            var a = fa[key]
                            if (predicateWithIndex(key, a)) {
                                out[key] = a
                            } else {
                                changed = true
                            }
                        }
                    }
                    return changed ? out : fa
                }
            }
            exports.filterWithIndex = filterWithIndex
            function fromFoldable(M, F) {
                var fromFoldableMapM = fromFoldableMap(M, F)
                return function (fka) {
                    return fromFoldableMapM(fka, function_1.identity)
                }
            }
            exports.fromFoldable = fromFoldable
            function fromFoldableMap(M, F) {
                return function (ta, f) {
                    return F.reduce(ta, {}, function (r, a) {
                        var _a = f(a),
                            k = _a[0],
                            b = _a[1]
                        r[k] = _.has.call(r, k) ? M.concat(r[k], b) : b
                        return r
                    })
                }
            }
            exports.fromFoldableMap = fromFoldableMap
            /**
             * @since 2.5.0
             */
            function every(predicate) {
                return function (r) {
                    for (var k in r) {
                        if (!predicate(r[k])) {
                            return false
                        }
                    }
                    return true
                }
            }
            exports.every = every
            /**
             * @since 2.5.0
             */
            function some(predicate) {
                return function (r) {
                    for (var k in r) {
                        if (predicate(r[k])) {
                            return true
                        }
                    }
                    return false
                }
            }
            exports.some = some
            function elem(E) {
                return function (a, fa) {
                    if (fa === undefined) {
                        var elemE_1 = elem(E)
                        return function (fa) {
                            return elemE_1(a, fa)
                        }
                    }
                    for (var k in fa) {
                        if (E.equals(fa[k], a)) {
                            return true
                        }
                    }
                    return false
                }
            }
            exports.elem = elem
            /**
             * @category combinators
             * @since 2.11.0
             */
            var union = function (M) {
                return function (second) {
                    return function (first) {
                        if (exports.isEmpty(first)) {
                            return second
                        }
                        if (exports.isEmpty(second)) {
                            return first
                        }
                        var out = {}
                        for (var k in first) {
                            if (exports.has(k, second)) {
                                out[k] = M.concat(first[k], second[k])
                            } else {
                                out[k] = first[k]
                            }
                        }
                        for (var k in second) {
                            if (!exports.has(k, out)) {
                                out[k] = second[k]
                            }
                        }
                        return out
                    }
                }
            }
            exports.union = union
            /**
             * @category combinators
             * @since 2.11.0
             */
            var intersection = function (M) {
                return function (second) {
                    return function (first) {
                        if (exports.isEmpty(first) || exports.isEmpty(second)) {
                            return exports.empty
                        }
                        var out = {}
                        for (var k in first) {
                            if (exports.has(k, second)) {
                                out[k] = M.concat(first[k], second[k])
                            }
                        }
                        return out
                    }
                }
            }
            exports.intersection = intersection
            /**
             * @category combinators
             * @since 2.11.0
             */
            var difference = function (second) {
                return function (first) {
                    if (exports.isEmpty(first)) {
                        return second
                    }
                    if (exports.isEmpty(second)) {
                        return first
                    }
                    var out = {}
                    for (var k in first) {
                        if (!exports.has(k, second)) {
                            out[k] = first[k]
                        }
                    }
                    for (var k in second) {
                        if (!exports.has(k, first)) {
                            out[k] = second[k]
                        }
                    }
                    return out
                }
            }
            exports.difference = difference
            // -------------------------------------------------------------------------------------
            // non-pipeables
            // -------------------------------------------------------------------------------------
            /** @internal */
            var _map = function (fa, f) {
                return function_1.pipe(fa, map(f))
            }
            exports._map = _map
            /** @internal */
            /* istanbul ignore next */
            var _mapWithIndex = function (fa, f) {
                return function_1.pipe(fa, mapWithIndex(f))
            }
            exports._mapWithIndex = _mapWithIndex
            /** @internal */
            /* istanbul ignore next */
            var _reduce = function (O) {
                var reduceO = reduce(O)
                return function (fa, b, f) {
                    return function_1.pipe(fa, reduceO(b, f))
                }
            }
            exports._reduce = _reduce
            /** @internal */
            var _foldMap = function (O) {
                return function (M) {
                    var foldMapM = foldMap(O)(M)
                    return function (fa, f) {
                        return function_1.pipe(fa, foldMapM(f))
                    }
                }
            }
            exports._foldMap = _foldMap
            /** @internal */
            /* istanbul ignore next */
            var _reduceRight = function (O) {
                var reduceRightO = reduceRight(O)
                return function (fa, b, f) {
                    return function_1.pipe(fa, reduceRightO(b, f))
                }
            }
            exports._reduceRight = _reduceRight
            /** @internal */
            /* istanbul ignore next */
            var _filter = function (fa, predicate) {
                return function_1.pipe(fa, exports.filter(predicate))
            }
            exports._filter = _filter
            /** @internal */
            /* istanbul ignore next */
            var _filterMap = function (fa, f) {
                return function_1.pipe(fa, exports.filterMap(f))
            }
            exports._filterMap = _filterMap
            /** @internal */
            /* istanbul ignore next */
            var _partition = function (fa, predicate) {
                return function_1.pipe(fa, exports.partition(predicate))
            }
            exports._partition = _partition
            /** @internal */
            /* istanbul ignore next */
            var _partitionMap = function (fa, f) {
                return function_1.pipe(fa, exports.partitionMap(f))
            }
            exports._partitionMap = _partitionMap
            /** @internal */
            /* istanbul ignore next */
            var _reduceWithIndex = function (O) {
                var reduceWithIndexO = reduceWithIndex(O)
                return function (fa, b, f) {
                    return function_1.pipe(fa, reduceWithIndexO(b, f))
                }
            }
            exports._reduceWithIndex = _reduceWithIndex
            /** @internal */
            var _foldMapWithIndex = function (O) {
                var foldMapWithIndexO = foldMapWithIndex(O)
                return function (M) {
                    var foldMapWithIndexM = foldMapWithIndexO(M)
                    return function (fa, f) {
                        return function_1.pipe(fa, foldMapWithIndexM(f))
                    }
                }
            }
            exports._foldMapWithIndex = _foldMapWithIndex
            /** @internal */
            /* istanbul ignore next */
            var _reduceRightWithIndex = function (O) {
                var reduceRightWithIndexO = reduceRightWithIndex(O)
                return function (fa, b, f) {
                    return function_1.pipe(fa, reduceRightWithIndexO(b, f))
                }
            }
            exports._reduceRightWithIndex = _reduceRightWithIndex
            /** @internal */
            /* istanbul ignore next */
            var _partitionMapWithIndex = function (fa, f) {
                return function_1.pipe(fa, partitionMapWithIndex(f))
            }
            exports._partitionMapWithIndex = _partitionMapWithIndex
            /** @internal */
            /* istanbul ignore next */
            var _partitionWithIndex = function (fa, predicateWithIndex) {
                return function_1.pipe(fa, partitionWithIndex(predicateWithIndex))
            }
            exports._partitionWithIndex = _partitionWithIndex
            /** @internal */
            /* istanbul ignore next */
            var _filterMapWithIndex = function (fa, f) {
                return function_1.pipe(fa, filterMapWithIndex(f))
            }
            exports._filterMapWithIndex = _filterMapWithIndex
            /** @internal */
            /* istanbul ignore next */
            var _filterWithIndex = function (fa, predicateWithIndex) {
                return function_1.pipe(fa, filterWithIndex(predicateWithIndex))
            }
            exports._filterWithIndex = _filterWithIndex
            /** @internal */
            var _traverse = function (O) {
                var traverseWithIndexO = _traverseWithIndex(O)
                return function (F) {
                    var traverseWithIndexOF = traverseWithIndexO(F)
                    return function (ta, f) {
                        return traverseWithIndexOF(ta, function_1.flow(function_1.SK, f))
                    }
                }
            }
            exports._traverse = _traverse
            /** @internal */
            var _sequence = function (O) {
                var traverseO = exports._traverse(O)
                return function (F) {
                    var traverseOF = traverseO(F)
                    return function (ta) {
                        return traverseOF(ta, function_1.identity)
                    }
                }
            }
            exports._sequence = _sequence
            var _traverseWithIndex = function (O) {
                return function (F) {
                    var keysO = keys_(O)
                    return function (ta, f) {
                        var ks = keysO(ta)
                        if (ks.length === 0) {
                            return F.of(exports.empty)
                        }
                        var fr = F.of({})
                        var _loop_1 = function (key) {
                            fr = F.ap(
                                F.map(fr, function (r) {
                                    return function (b) {
                                        r[key] = b
                                        return r
                                    }
                                }),
                                f(key, ta[key]),
                            )
                        }
                        for (var _i = 0, ks_1 = ks; _i < ks_1.length; _i++) {
                            var key = ks_1[_i]
                            _loop_1(key)
                        }
                        return fr
                    }
                }
            }
            // -------------------------------------------------------------------------------------
            // type class members
            // -------------------------------------------------------------------------------------
            /**
             * @category Filterable
             * @since 2.5.0
             */
            var filter = function (predicate) {
                return filterWithIndex(function (_, a) {
                    return predicate(a)
                })
            }
            exports.filter = filter
            /**
             * @category Filterable
             * @since 2.5.0
             */
            var filterMap = function (f) {
                return filterMapWithIndex(function (_, a) {
                    return f(a)
                })
            }
            exports.filterMap = filterMap
            /**
             * @category Filterable
             * @since 2.5.0
             */
            var partition = function (predicate) {
                return partitionWithIndex(function (_, a) {
                    return predicate(a)
                })
            }
            exports.partition = partition
            /**
             * @category Filterable
             * @since 2.5.0
             */
            var partitionMap = function (f) {
                return partitionMapWithIndex(function (_, a) {
                    return f(a)
                })
            }
            exports.partitionMap = partitionMap
            function reduce() {
                var args = []
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i]
                }
                if (args.length === 1) {
                    var reduceWithIndexO_1 = reduceWithIndex(args[0])
                    return function (b, f) {
                        return reduceWithIndexO_1(b, function (_, b, a) {
                            return f(b, a)
                        })
                    }
                }
                return reduce(S.Ord).apply(void 0, args)
            }
            exports.reduce = reduce
            function foldMap(O) {
                if ("compare" in O) {
                    var foldMapWithIndexO_1 = foldMapWithIndex(O)
                    return function (M) {
                        var foldMapWithIndexM = foldMapWithIndexO_1(M)
                        return function (f) {
                            return foldMapWithIndexM(function (_, a) {
                                return f(a)
                            })
                        }
                    }
                }
                return foldMap(S.Ord)(O)
            }
            exports.foldMap = foldMap
            function reduceRight() {
                var args = []
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i]
                }
                if (args.length === 1) {
                    var reduceRightWithIndexO_1 = reduceRightWithIndex(args[0])
                    return function (b, f) {
                        return reduceRightWithIndexO_1(b, function (_, b, a) {
                            return f(b, a)
                        })
                    }
                }
                return reduceRight(S.Ord).apply(void 0, args)
            }
            exports.reduceRight = reduceRight
            /**
             * @category Compactable
             * @since 2.5.0
             */
            var compact = function (r) {
                var out = {}
                for (var k in r) {
                    if (_.has.call(r, k)) {
                        var oa = r[k]
                        if (_.isSome(oa)) {
                            out[k] = oa.value
                        }
                    }
                }
                return out
            }
            exports.compact = compact
            /**
             * @category Compactable
             * @since 2.5.0
             */
            var separate = function (r) {
                var left = {}
                var right = {}
                for (var k in r) {
                    if (_.has.call(r, k)) {
                        var e = r[k]
                        if (_.isLeft(e)) {
                            left[k] = e.left
                        } else {
                            right[k] = e.right
                        }
                    }
                }
                return Separated_1.separated(left, right)
            }
            exports.separate = separate
            // -------------------------------------------------------------------------------------
            // instances
            // -------------------------------------------------------------------------------------
            /**
             * @category instances
             * @since 2.5.0
             */
            exports.URI = "ReadonlyRecord"
            function getShow(O) {
                if ("compare" in O) {
                    return function (S) {
                        return {
                            show: function (r) {
                                var elements = collect(O)(function (k, a) {
                                    return JSON.stringify(k) + ": " + S.show(a)
                                })(r).join(", ")
                                return elements === "" ? "{}" : "{ " + elements + " }"
                            },
                        }
                    }
                }
                return getShow(S.Ord)(O)
            }
            exports.getShow = getShow
            function getEq(E) {
                var isSubrecordE = isSubrecord(E)
                return Eq_1.fromEquals(function (x, y) {
                    return isSubrecordE(x)(y) && isSubrecordE(y)(x)
                })
            }
            exports.getEq = getEq
            function getMonoid(S) {
                return {
                    concat: function (first, second) {
                        if (exports.isEmpty(first)) {
                            return second
                        }
                        if (exports.isEmpty(second)) {
                            return first
                        }
                        var r = Object.assign({}, first)
                        for (var k in second) {
                            if (_.has.call(second, k)) {
                                r[k] = _.has.call(first, k)
                                    ? S.concat(first[k], second[k])
                                    : second[k]
                            }
                        }
                        return r
                    },
                    empty: exports.empty,
                }
            }
            exports.getMonoid = getMonoid
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Functor = {
                URI: exports.URI,
                map: exports._map,
            }
            /**
             * Derivable from `Functor`.
             *
             * @category combinators
             * @since 2.10.0
             */
            exports.flap =
                /*#__PURE__*/
                Functor_1.flap(exports.Functor)
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.FunctorWithIndex = {
                URI: exports.URI,
                map: exports._map,
                mapWithIndex: exports._mapWithIndex,
            }
            /**
             * @category instances
             * @since 2.11.0
             */
            var getFoldable = function (O) {
                return {
                    URI: exports.URI,
                    reduce: exports._reduce(O),
                    foldMap: exports._foldMap(O),
                    reduceRight: exports._reduceRight(O),
                }
            }
            exports.getFoldable = getFoldable
            /**
             * @category instances
             * @since 2.11.0
             */
            var getFoldableWithIndex = function (O) {
                return {
                    URI: exports.URI,
                    reduce: exports._reduce(O),
                    foldMap: exports._foldMap(O),
                    reduceRight: exports._reduceRight(O),
                    reduceWithIndex: exports._reduceWithIndex(O),
                    foldMapWithIndex: exports._foldMapWithIndex(O),
                    reduceRightWithIndex: exports._reduceRightWithIndex(O),
                }
            }
            exports.getFoldableWithIndex = getFoldableWithIndex
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Compactable = {
                URI: exports.URI,
                compact: exports.compact,
                separate: exports.separate,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Filterable = {
                URI: exports.URI,
                map: exports._map,
                compact: exports.compact,
                separate: exports.separate,
                filter: exports._filter,
                filterMap: exports._filterMap,
                partition: exports._partition,
                partitionMap: exports._partitionMap,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.FilterableWithIndex = {
                URI: exports.URI,
                map: exports._map,
                mapWithIndex: exports._mapWithIndex,
                compact: exports.compact,
                separate: exports.separate,
                filter: exports._filter,
                filterMap: exports._filterMap,
                partition: exports._partition,
                partitionMap: exports._partitionMap,
                filterMapWithIndex: exports._filterMapWithIndex,
                filterWithIndex: exports._filterWithIndex,
                partitionMapWithIndex: exports._partitionMapWithIndex,
                partitionWithIndex: exports._partitionWithIndex,
            }
            /**
             * @category instances
             * @since 2.11.0
             */
            var getTraversable = function (O) {
                return {
                    URI: exports.URI,
                    map: exports._map,
                    reduce: exports._reduce(O),
                    foldMap: exports._foldMap(O),
                    reduceRight: exports._reduceRight(O),
                    traverse: exports._traverse(O),
                    sequence: exports._sequence(O),
                }
            }
            exports.getTraversable = getTraversable
            /**
             * @category instances
             * @since 2.11.0
             */
            var getTraversableWithIndex = function (O) {
                return {
                    URI: exports.URI,
                    map: exports._map,
                    mapWithIndex: exports._mapWithIndex,
                    reduce: exports._reduce(O),
                    foldMap: exports._foldMap(O),
                    reduceRight: exports._reduceRight(O),
                    reduceWithIndex: exports._reduceWithIndex(O),
                    foldMapWithIndex: exports._foldMapWithIndex(O),
                    reduceRightWithIndex: exports._reduceRightWithIndex(O),
                    traverse: exports._traverse(O),
                    sequence: exports._sequence(O),
                    traverseWithIndex: _traverseWithIndex(O),
                }
            }
            exports.getTraversableWithIndex = getTraversableWithIndex
            /**
             * @category instances
             * @since 2.11.0
             */
            var getWitherable = function (O) {
                var T = exports.getTraversable(O)
                return {
                    URI: exports.URI,
                    map: exports._map,
                    reduce: exports._reduce(O),
                    foldMap: exports._foldMap(O),
                    reduceRight: exports._reduceRight(O),
                    traverse: T.traverse,
                    sequence: T.sequence,
                    compact: exports.compact,
                    separate: exports.separate,
                    filter: exports._filter,
                    filterMap: exports._filterMap,
                    partition: exports._partition,
                    partitionMap: exports._partitionMap,
                    wither: Witherable_1.witherDefault(T, exports.Compactable),
                    wilt: Witherable_1.wiltDefault(T, exports.Compactable),
                }
            }
            exports.getWitherable = getWitherable
            /**
             * @category instances
             * @since 2.11.0
             */
            var getUnionSemigroup = function (S) {
                var unionS = exports.union(S)
                return {
                    concat: function (first, second) {
                        return unionS(second)(first)
                    },
                }
            }
            exports.getUnionSemigroup = getUnionSemigroup
            /**
             * @category instances
             * @since 2.11.0
             */
            var getUnionMonoid = function (S) {
                return {
                    concat: exports.getUnionSemigroup(S).concat,
                    empty: exports.empty,
                }
            }
            exports.getUnionMonoid = getUnionMonoid
            /**
             * @category instances
             * @since 2.11.0
             */
            var getIntersectionSemigroup = function (S) {
                var intersectionS = exports.intersection(S)
                return {
                    concat: function (first, second) {
                        return intersectionS(second)(first)
                    },
                }
            }
            exports.getIntersectionSemigroup = getIntersectionSemigroup
            /**
             * @category instances
             * @since 2.11.0
             */
            var getDifferenceMagma = function () {
                return {
                    concat: function (first, second) {
                        return exports.difference(second)(first)
                    },
                }
            }
            exports.getDifferenceMagma = getDifferenceMagma
            // -------------------------------------------------------------------------------------
            // deprecated
            // -------------------------------------------------------------------------------------
            // tslint:disable: deprecation
            /**
             * Use `getFoldable` instead.
             *
             * @category instances
             * @since 2.7.0
             * @deprecated
             */
            exports.Foldable = {
                URI: exports.URI,
                reduce:
                    /*#__PURE__*/
                    exports._reduce(S.Ord),
                foldMap:
                    /*#__PURE__*/
                    exports._foldMap(S.Ord),
                reduceRight:
                    /*#__PURE__*/
                    exports._reduceRight(S.Ord),
            }
            /**
             * Use `getFoldableWithIndex` instead.
             *
             * @category instances
             * @since 2.7.0
             * @deprecated
             */
            exports.FoldableWithIndex = {
                URI: exports.URI,
                reduce:
                    /*#__PURE__*/
                    exports._reduce(S.Ord),
                foldMap:
                    /*#__PURE__*/
                    exports._foldMap(S.Ord),
                reduceRight:
                    /*#__PURE__*/
                    exports._reduceRight(S.Ord),
                reduceWithIndex:
                    /*#__PURE__*/
                    exports._reduceWithIndex(S.Ord),
                foldMapWithIndex:
                    /*#__PURE__*/
                    exports._foldMapWithIndex(S.Ord),
                reduceRightWithIndex:
                    /*#__PURE__*/
                    exports._reduceRightWithIndex(S.Ord),
            }
            /**
             * Use `getTraversable` instead.
             *
             * @category instances
             * @since 2.7.0
             * @deprecated
             */
            exports.Traversable = {
                URI: exports.URI,
                map: exports._map,
                reduce:
                    /*#__PURE__*/
                    exports._reduce(S.Ord),
                foldMap:
                    /*#__PURE__*/
                    exports._foldMap(S.Ord),
                reduceRight:
                    /*#__PURE__*/
                    exports._reduceRight(S.Ord),
                traverse:
                    /*#__PURE__*/
                    exports._traverse(S.Ord),
                sequence: sequence,
            }
            /**
             * Use `getTraversableWithIndex` instead.
             *
             * @category instances
             * @since 2.7.0
             * @deprecated
             */
            exports.TraversableWithIndex = {
                URI: exports.URI,
                map: exports._map,
                mapWithIndex: exports._mapWithIndex,
                reduce:
                    /*#__PURE__*/
                    exports._reduce(S.Ord),
                foldMap:
                    /*#__PURE__*/
                    exports._foldMap(S.Ord),
                reduceRight:
                    /*#__PURE__*/
                    exports._reduceRight(S.Ord),
                reduceWithIndex:
                    /*#__PURE__*/
                    exports._reduceWithIndex(S.Ord),
                foldMapWithIndex:
                    /*#__PURE__*/
                    exports._foldMapWithIndex(S.Ord),
                reduceRightWithIndex:
                    /*#__PURE__*/
                    exports._reduceRightWithIndex(S.Ord),
                traverse:
                    /*#__PURE__*/
                    exports._traverse(S.Ord),
                sequence: sequence,
                traverseWithIndex:
                    /*#__PURE__*/
                    _traverseWithIndex(S.Ord),
            }
            var _wither =
                /*#__PURE__*/
                Witherable_1.witherDefault(exports.Traversable, exports.Compactable)
            var _wilt =
                /*#__PURE__*/
                Witherable_1.wiltDefault(exports.Traversable, exports.Compactable)
            /**
             * Use `getWitherable` instead.
             *
             * @category instances
             * @since 2.7.0
             * @deprecated
             */
            exports.Witherable = {
                URI: exports.URI,
                map: exports._map,
                reduce:
                    /*#__PURE__*/
                    exports._reduce(S.Ord),
                foldMap:
                    /*#__PURE__*/
                    exports._foldMap(S.Ord),
                reduceRight:
                    /*#__PURE__*/
                    exports._reduceRight(S.Ord),
                traverse:
                    /*#__PURE__*/
                    exports._traverse(S.Ord),
                sequence: sequence,
                compact: exports.compact,
                separate: exports.separate,
                filter: exports._filter,
                filterMap: exports._filterMap,
                partition: exports._partition,
                partitionMap: exports._partitionMap,
                wither: _wither,
                wilt: _wilt,
            }
            /**
             * Use [`upsertAt`](#upsertat) instead.
             *
             * @category combinators
             * @since 2.5.0
             * @deprecated
             */
            exports.insertAt = exports.upsertAt
            function hasOwnProperty(k, r) {
                return _.has.call(r === undefined ? this : r, k)
            }
            exports.hasOwnProperty = hasOwnProperty
            /**
             * Use small, specific instances instead.
             *
             * @category instances
             * @since 2.5.0
             * @deprecated
             */
            exports.readonlyRecord = {
                URI: exports.URI,
                map: exports._map,
                reduce:
                    /*#__PURE__*/
                    exports._reduce(S.Ord),
                foldMap:
                    /*#__PURE__*/
                    exports._foldMap(S.Ord),
                reduceRight:
                    /*#__PURE__*/
                    exports._reduceRight(S.Ord),
                traverse:
                    /*#__PURE__*/
                    exports._traverse(S.Ord),
                sequence: sequence,
                compact: exports.compact,
                separate: exports.separate,
                filter: exports._filter,
                filterMap: exports._filterMap,
                partition: exports._partition,
                partitionMap: exports._partitionMap,
                mapWithIndex: exports._mapWithIndex,
                reduceWithIndex:
                    /*#__PURE__*/
                    exports._reduceWithIndex(S.Ord),
                foldMapWithIndex:
                    /*#__PURE__*/
                    exports._foldMapWithIndex(S.Ord),
                reduceRightWithIndex:
                    /*#__PURE__*/
                    exports._reduceRightWithIndex(S.Ord),
                filterMapWithIndex: exports._filterMapWithIndex,
                filterWithIndex: exports._filterWithIndex,
                partitionMapWithIndex: exports._partitionMapWithIndex,
                partitionWithIndex: exports._partitionWithIndex,
                traverseWithIndex:
                    /*#__PURE__*/
                    _traverseWithIndex(S.Ord),
                wither: _wither,
                wilt: _wilt,
            }

            /***/
        },

        /***/ 2653: /***/ function (__unused_webpack_module, exports, __nccwpck_require__) {
            "use strict"

            var __assign =
                (this && this.__assign) ||
                function () {
                    __assign =
                        Object.assign ||
                        function (t) {
                            for (var s, i = 1, n = arguments.length; i < n; i++) {
                                s = arguments[i]
                                for (var p in s)
                                    if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p]
                            }
                            return t
                        }
                    return __assign.apply(this, arguments)
                }
            var __createBinding =
                (this && this.__createBinding) ||
                (Object.create
                    ? function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          Object.defineProperty(o, k2, {
                              enumerable: true,
                              get: function () {
                                  return m[k]
                              },
                          })
                      }
                    : function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          o[k2] = m[k]
                      })
            var __setModuleDefault =
                (this && this.__setModuleDefault) ||
                (Object.create
                    ? function (o, v) {
                          Object.defineProperty(o, "default", { enumerable: true, value: v })
                      }
                    : function (o, v) {
                          o["default"] = v
                      })
            var __importStar =
                (this && this.__importStar) ||
                function (mod) {
                    if (mod && mod.__esModule) return mod
                    var result = {}
                    if (mod != null)
                        for (var k in mod)
                            if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
                                __createBinding(result, mod, k)
                    __setModuleDefault(result, mod)
                    return result
                }
            Object.defineProperty(exports, "__esModule", { value: true })
            exports.getMonoid = exports.getEq = exports.getShow = exports.URI = exports.separate = exports.compact = exports.reduceRight = exports.foldMap = exports.reduce = exports.partitionMap = exports.partition = exports.filterMap = exports.filter = exports.difference = exports.intersection = exports.union = exports.elem = exports.some = exports.every = exports.fromFoldableMap = exports.fromFoldable = exports.filterWithIndex = exports.filterMapWithIndex = exports.partitionWithIndex = exports.partitionMapWithIndex = exports.wilt = exports.wither = exports.sequence = exports.traverse = exports.traverseWithIndex = exports.singleton = exports.reduceRightWithIndex = exports.foldMapWithIndex = exports.reduceWithIndex = exports.map = exports.mapWithIndex = exports.lookup = exports.isSubrecord = exports.pop = exports.modifyAt = exports.updateAt = exports.deleteAt = exports.has = exports.upsertAt = exports.toUnfoldable = exports.toArray = exports.collect = exports.keys = exports.isEmpty = exports.size = void 0
            exports.record = exports.hasOwnProperty = exports.insertAt = exports.empty = exports.Witherable = exports.TraversableWithIndex = exports.Traversable = exports.FoldableWithIndex = exports.Foldable = exports.getDifferenceMagma = exports.getIntersectionSemigroup = exports.getUnionMonoid = exports.getUnionSemigroup = exports.getWitherable = exports.getTraversableWithIndex = exports.getTraversable = exports.FilterableWithIndex = exports.Filterable = exports.Compactable = exports.getFoldableWithIndex = exports.getFoldable = exports.FunctorWithIndex = exports.flap = exports.Functor = void 0
            var function_1 = __nccwpck_require__(6985)
            var Functor_1 = __nccwpck_require__(5533)
            var _ = __importStar(__nccwpck_require__(1840))
            var RR = __importStar(__nccwpck_require__(1897))
            var S = __importStar(__nccwpck_require__(5189))
            var Witherable_1 = __nccwpck_require__(4384)
            // -------------------------------------------------------------------------------------
            // model
            // -------------------------------------------------------------------------------------
            /**
             * Calculate the number of key/value pairs in a `Record`.
             *
             * @since 2.0.0
             */
            exports.size = RR.size
            /**
             * Test whether a `Record` is empty.
             *
             * @since 2.0.0
             */
            exports.isEmpty = RR.isEmpty
            var keys_ = function (O) {
                return function (r) {
                    return Object.keys(r).sort(O.compare)
                }
            }
            /**
             * @since 2.0.0
             */
            exports.keys =
                /*#__PURE__*/
                keys_(S.Ord)
            function collect(O) {
                if (typeof O === "function") {
                    return collect(S.Ord)(O)
                }
                var keysO = keys_(O)
                return function (f) {
                    return function (r) {
                        var out = []
                        for (var _i = 0, _a = keysO(r); _i < _a.length; _i++) {
                            var key = _a[_i]
                            out.push(f(key, r[key]))
                        }
                        return out
                    }
                }
            }
            exports.collect = collect
            /**
             * Get a sorted `Array` of the key/value pairs contained in a `Record`.
             *
             * @since 2.0.0
             */
            exports.toArray =
                /*#__PURE__*/
                collect(S.Ord)(function (k, a) {
                    return [k, a]
                })
            function toUnfoldable(U) {
                return function (r) {
                    var sas = exports.toArray(r)
                    var len = sas.length
                    return U.unfold(0, function (b) {
                        return b < len ? _.some([sas[b], b + 1]) : _.none
                    })
                }
            }
            exports.toUnfoldable = toUnfoldable
            /**
             * Insert or replace a key/value pair in a `Record`.
             *
             * @category combinators
             * @since 2.10.0
             */
            exports.upsertAt = RR.upsertAt
            /**
             * Test whether or not a key exists in a `Record`.
             *
             * Note. This function is not pipeable because is a `Refinement`.
             *
             * @since 2.10.0
             */
            exports.has = RR.has
            function deleteAt(k) {
                return function (r) {
                    if (!_.has.call(r, k)) {
                        return r
                    }
                    var out = Object.assign({}, r)
                    delete out[k]
                    return out
                }
            }
            exports.deleteAt = deleteAt
            /**
             * @since 2.0.0
             */
            var updateAt = function (k, a) {
                return exports.modifyAt(k, function () {
                    return a
                })
            }
            exports.updateAt = updateAt
            /**
             * @since 2.0.0
             */
            var modifyAt = function (k, f) {
                return function (r) {
                    if (!exports.has(k, r)) {
                        return _.none
                    }
                    var out = Object.assign({}, r)
                    out[k] = f(r[k])
                    return _.some(out)
                }
            }
            exports.modifyAt = modifyAt
            function pop(k) {
                var deleteAtk = deleteAt(k)
                return function (r) {
                    var oa = exports.lookup(k, r)
                    return _.isNone(oa) ? _.none : _.some([oa.value, deleteAtk(r)])
                }
            }
            exports.pop = pop
            // TODO: remove non-curried overloading in v3
            /**
             * Test whether one `Record` contains all of the keys and values contained in another `Record`.
             *
             * @since 2.0.0
             */
            exports.isSubrecord = RR.isSubrecord
            // TODO: remove non-curried overloading in v3
            /**
             * Lookup the value for a key in a `Record`.
             *
             * @since 2.0.0
             */
            exports.lookup = RR.lookup
            /**
             * Map a `Record` passing the keys to the iterating function.
             *
             * @since 2.0.0
             */
            exports.mapWithIndex = RR.mapWithIndex
            /**
             * Map a `Record` passing the values to the iterating function.
             *
             * @since 2.0.0
             */
            exports.map = RR.map
            function reduceWithIndex() {
                var args = []
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i]
                }
                return args.length === 1
                    ? RR.reduceWithIndex(args[0])
                    : RR.reduceWithIndex(S.Ord).apply(void 0, args)
            }
            exports.reduceWithIndex = reduceWithIndex
            function foldMapWithIndex(O) {
                return "compare" in O ? RR.foldMapWithIndex(O) : RR.foldMapWithIndex(S.Ord)(O)
            }
            exports.foldMapWithIndex = foldMapWithIndex
            function reduceRightWithIndex() {
                var args = []
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i]
                }
                return args.length === 1
                    ? RR.reduceRightWithIndex(args[0])
                    : RR.reduceRightWithIndex(S.Ord).apply(void 0, args)
            }
            exports.reduceRightWithIndex = reduceRightWithIndex
            /**
             * Create a `Record` with one key/value pair.
             *
             * @since 2.0.0
             */
            exports.singleton = RR.singleton
            function traverseWithIndex(F) {
                return RR.traverseWithIndex(F)
            }
            exports.traverseWithIndex = traverseWithIndex
            function traverse(F) {
                return RR.traverse(F)
            }
            exports.traverse = traverse
            function sequence(F) {
                return RR.sequence(F)
            }
            exports.sequence = sequence
            /**
             * @category Witherable
             * @since 2.6.5
             */
            var wither = function (F) {
                var traverseF = traverse(F)
                return function (f) {
                    return function (fa) {
                        return F.map(function_1.pipe(fa, traverseF(f)), exports.compact)
                    }
                }
            }
            exports.wither = wither
            /**
             * @category Witherable
             * @since 2.6.5
             */
            var wilt = function (F) {
                var traverseF = traverse(F)
                return function (f) {
                    return function (fa) {
                        return F.map(function_1.pipe(fa, traverseF(f)), exports.separate)
                    }
                }
            }
            exports.wilt = wilt
            /**
             * @since 2.0.0
             */
            exports.partitionMapWithIndex = RR.partitionMapWithIndex
            function partitionWithIndex(predicateWithIndex) {
                return RR.partitionWithIndex(predicateWithIndex)
            }
            exports.partitionWithIndex = partitionWithIndex
            /**
             * @since 2.0.0
             */
            exports.filterMapWithIndex = RR.filterMapWithIndex
            function filterWithIndex(predicateWithIndex) {
                return RR.filterWithIndex(predicateWithIndex)
            }
            exports.filterWithIndex = filterWithIndex
            function fromFoldable(M, F) {
                return RR.fromFoldable(M, F)
            }
            exports.fromFoldable = fromFoldable
            function fromFoldableMap(M, F) {
                return RR.fromFoldableMap(M, F)
            }
            exports.fromFoldableMap = fromFoldableMap
            /**
             * @since 2.0.0
             */
            exports.every = RR.every
            /**
             * @since 2.0.0
             */
            exports.some = RR.some
            // TODO: remove non-curried overloading in v3
            /**
             * @since 2.0.0
             */
            exports.elem = RR.elem
            /**
             * @category combinators
             * @since 2.11.0
             */
            var union = function (M) {
                var unionM = RR.union(M)
                return function (second) {
                    return function (first) {
                        if (exports.isEmpty(first)) {
                            return __assign({}, second)
                        }
                        if (exports.isEmpty(second)) {
                            return __assign({}, first)
                        }
                        return unionM(second)(first)
                    }
                }
            }
            exports.union = union
            /**
             * @category combinators
             * @since 2.11.0
             */
            var intersection = function (M) {
                return function (second) {
                    return function (first) {
                        if (exports.isEmpty(first) || exports.isEmpty(second)) {
                            return {}
                        }
                        return RR.intersection(M)(second)(first)
                    }
                }
            }
            exports.intersection = intersection
            /**
             * @category combinators
             * @since 2.11.0
             */
            var difference = function (second) {
                return function (first) {
                    if (exports.isEmpty(first)) {
                        return __assign({}, second)
                    }
                    if (exports.isEmpty(second)) {
                        return __assign({}, first)
                    }
                    return RR.difference(second)(first)
                }
            }
            exports.difference = difference
            // -------------------------------------------------------------------------------------
            // non-pipeables
            // -------------------------------------------------------------------------------------
            var _map = RR._map
            var _mapWithIndex = RR._mapWithIndex
            var _reduce = RR._reduce
            var _foldMap = RR._foldMap
            var _reduceRight = RR._reduceRight
            var _filter = RR._filter
            var _filterMap = RR._filterMap
            var _partition = RR._partition
            var _partitionMap = RR._partitionMap
            var _reduceWithIndex = RR._reduceWithIndex
            var _foldMapWithIndex = RR._foldMapWithIndex
            var _reduceRightWithIndex = RR._reduceRightWithIndex
            var _partitionMapWithIndex = RR._partitionMapWithIndex
            var _partitionWithIndex = RR._partitionWithIndex
            var _filterMapWithIndex = RR._filterMapWithIndex
            var _filterWithIndex = RR._filterWithIndex
            var _traverse = RR._traverse
            var _sequence = RR._sequence
            var _traverseWithIndex = function (O) {
                return function (F) {
                    var keysO = keys_(O)
                    return function (ta, f) {
                        var ks = keysO(ta)
                        if (ks.length === 0) {
                            return F.of({})
                        }
                        var fr = F.of({})
                        var _loop_1 = function (key) {
                            fr = F.ap(
                                F.map(fr, function (r) {
                                    return function (b) {
                                        r[key] = b
                                        return r
                                    }
                                }),
                                f(key, ta[key]),
                            )
                        }
                        for (var _i = 0, ks_1 = ks; _i < ks_1.length; _i++) {
                            var key = ks_1[_i]
                            _loop_1(key)
                        }
                        return fr
                    }
                }
            }
            // -------------------------------------------------------------------------------------
            // type class members
            // -------------------------------------------------------------------------------------
            /**
             * @category Filterable
             * @since 2.0.0
             */
            exports.filter = RR.filter
            /**
             * @category Filterable
             * @since 2.0.0
             */
            exports.filterMap = RR.filterMap
            /**
             * @category Filterable
             * @since 2.0.0
             */
            exports.partition = RR.partition
            /**
             * @category Filterable
             * @since 2.0.0
             */
            exports.partitionMap = RR.partitionMap
            function reduce() {
                var args = []
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i]
                }
                return args.length === 1 ? RR.reduce(args[0]) : RR.reduce(S.Ord).apply(void 0, args)
            }
            exports.reduce = reduce
            function foldMap(O) {
                return "compare" in O ? RR.foldMap(O) : RR.foldMap(S.Ord)(O)
            }
            exports.foldMap = foldMap
            function reduceRight() {
                var args = []
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i]
                }
                return args.length === 1
                    ? RR.reduceRight(args[0])
                    : RR.reduceRight(S.Ord).apply(void 0, args)
            }
            exports.reduceRight = reduceRight
            /**
             * @category Compactable
             * @since 2.0.0
             */
            exports.compact = RR.compact
            /**
             * @category Compactable
             * @since 2.0.0
             */
            exports.separate = RR.separate
            // -------------------------------------------------------------------------------------
            // instances
            // -------------------------------------------------------------------------------------
            /**
             * @category instances
             * @since 2.0.0
             */
            exports.URI = "Record"
            function getShow(O) {
                return "compare" in O ? RR.getShow(O) : RR.getShow(S.Ord)(O)
            }
            exports.getShow = getShow
            /**
             * @category instances
             * @since 2.0.0
             */
            exports.getEq = RR.getEq
            /**
             * Returns a `Monoid` instance for `Record`s given a `Semigroup` instance for their values.
             *
             * @example
             * import { SemigroupSum } from 'fp-ts/number'
             * import { getMonoid } from 'fp-ts/Record'
             *
             * const M = getMonoid(SemigroupSum)
             * assert.deepStrictEqual(M.concat({ foo: 123 }, { foo: 456 }), { foo: 579 })
             *
             * @category instances
             * @since 2.0.0
             */
            exports.getMonoid = RR.getMonoid
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Functor = {
                URI: exports.URI,
                map: _map,
            }
            /**
             * Derivable from `Functor`.
             *
             * @category combinators
             * @since 2.10.0
             */
            exports.flap =
                /*#__PURE__*/
                Functor_1.flap(exports.Functor)
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.FunctorWithIndex = {
                URI: exports.URI,
                map: _map,
                mapWithIndex: _mapWithIndex,
            }
            /**
             * @category instances
             * @since 2.11.0
             */
            var getFoldable = function (O) {
                return {
                    URI: exports.URI,
                    reduce: _reduce(O),
                    foldMap: _foldMap(O),
                    reduceRight: _reduceRight(O),
                }
            }
            exports.getFoldable = getFoldable
            /**
             * @category instances
             * @since 2.11.0
             */
            var getFoldableWithIndex = function (O) {
                return {
                    URI: exports.URI,
                    reduce: _reduce(O),
                    foldMap: _foldMap(O),
                    reduceRight: _reduceRight(O),
                    reduceWithIndex: _reduceWithIndex(O),
                    foldMapWithIndex: _foldMapWithIndex(O),
                    reduceRightWithIndex: _reduceRightWithIndex(O),
                }
            }
            exports.getFoldableWithIndex = getFoldableWithIndex
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Compactable = {
                URI: exports.URI,
                compact: exports.compact,
                separate: exports.separate,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.Filterable = {
                URI: exports.URI,
                map: _map,
                compact: exports.compact,
                separate: exports.separate,
                filter: _filter,
                filterMap: _filterMap,
                partition: _partition,
                partitionMap: _partitionMap,
            }
            /**
             * @category instances
             * @since 2.7.0
             */
            exports.FilterableWithIndex = {
                URI: exports.URI,
                map: _map,
                mapWithIndex: _mapWithIndex,
                compact: exports.compact,
                separate: exports.separate,
                filter: _filter,
                filterMap: _filterMap,
                partition: _partition,
                partitionMap: _partitionMap,
                filterMapWithIndex: _filterMapWithIndex,
                filterWithIndex: _filterWithIndex,
                partitionMapWithIndex: _partitionMapWithIndex,
                partitionWithIndex: _partitionWithIndex,
            }
            /**
             * @category instances
             * @since 2.11.0
             */
            var getTraversable = function (O) {
                return {
                    URI: exports.URI,
                    map: _map,
                    reduce: _reduce(O),
                    foldMap: _foldMap(O),
                    reduceRight: _reduceRight(O),
                    traverse: _traverse(O),
                    sequence: _sequence(O),
                }
            }
            exports.getTraversable = getTraversable
            /**
             * @category instances
             * @since 2.11.0
             */
            var getTraversableWithIndex = function (O) {
                return {
                    URI: exports.URI,
                    map: _map,
                    mapWithIndex: _mapWithIndex,
                    reduce: _reduce(O),
                    foldMap: _foldMap(O),
                    reduceRight: _reduceRight(O),
                    reduceWithIndex: _reduceWithIndex(O),
                    foldMapWithIndex: _foldMapWithIndex(O),
                    reduceRightWithIndex: _reduceRightWithIndex(O),
                    traverse: _traverse(O),
                    sequence: _sequence(O),
                    traverseWithIndex: _traverseWithIndex(O),
                }
            }
            exports.getTraversableWithIndex = getTraversableWithIndex
            /**
             * @category instances
             * @since 2.11.0
             */
            var getWitherable = function (O) {
                var T = exports.getTraversable(O)
                return {
                    URI: exports.URI,
                    map: _map,
                    reduce: _reduce(O),
                    foldMap: _foldMap(O),
                    reduceRight: _reduceRight(O),
                    traverse: T.traverse,
                    sequence: T.sequence,
                    compact: exports.compact,
                    separate: exports.separate,
                    filter: _filter,
                    filterMap: _filterMap,
                    partition: _partition,
                    partitionMap: _partitionMap,
                    wither: Witherable_1.witherDefault(T, exports.Compactable),
                    wilt: Witherable_1.wiltDefault(T, exports.Compactable),
                }
            }
            exports.getWitherable = getWitherable
            /**
             * @category instances
             * @since 2.11.0
             */
            var getUnionSemigroup = function (S) {
                var unionS = exports.union(S)
                return {
                    concat: function (first, second) {
                        return unionS(second)(first)
                    },
                }
            }
            exports.getUnionSemigroup = getUnionSemigroup
            /**
             * @category instances
             * @since 2.11.0
             */
            var getUnionMonoid = function (S) {
                return {
                    concat: exports.getUnionSemigroup(S).concat,
                    empty: {},
                }
            }
            exports.getUnionMonoid = getUnionMonoid
            /**
             * @category instances
             * @since 2.11.0
             */
            var getIntersectionSemigroup = function (S) {
                var intersectionS = exports.intersection(S)
                return {
                    concat: function (first, second) {
                        return intersectionS(second)(first)
                    },
                }
            }
            exports.getIntersectionSemigroup = getIntersectionSemigroup
            /**
             * @category instances
             * @since 2.11.0
             */
            var getDifferenceMagma = function () {
                return {
                    concat: function (first, second) {
                        return exports.difference(second)(first)
                    },
                }
            }
            exports.getDifferenceMagma = getDifferenceMagma
            // -------------------------------------------------------------------------------------
            // deprecated
            // -------------------------------------------------------------------------------------
            // tslint:disable: deprecation
            /**
             * Use `getFoldable` instead.
             *
             * @category instances
             * @since 2.7.0
             * @deprecated
             */
            exports.Foldable = {
                URI: exports.URI,
                reduce:
                    /*#__PURE__*/
                    _reduce(S.Ord),
                foldMap:
                    /*#__PURE__*/
                    _foldMap(S.Ord),
                reduceRight:
                    /*#__PURE__*/
                    _reduceRight(S.Ord),
            }
            /**
             * Use `getFoldableWithIndex` instead.
             *
             * @category instances
             * @since 2.7.0
             * @deprecated
             */
            exports.FoldableWithIndex = {
                URI: exports.URI,
                reduce:
                    /*#__PURE__*/
                    _reduce(S.Ord),
                foldMap:
                    /*#__PURE__*/
                    _foldMap(S.Ord),
                reduceRight:
                    /*#__PURE__*/
                    _reduceRight(S.Ord),
                reduceWithIndex:
                    /*#__PURE__*/
                    _reduceWithIndex(S.Ord),
                foldMapWithIndex:
                    /*#__PURE__*/
                    _foldMapWithIndex(S.Ord),
                reduceRightWithIndex:
                    /*#__PURE__*/
                    _reduceRightWithIndex(S.Ord),
            }
            /**
             * Use `getTraversable` instead.
             *
             * @category instances
             * @since 2.7.0
             * @deprecated
             */
            exports.Traversable = {
                URI: exports.URI,
                map: _map,
                reduce:
                    /*#__PURE__*/
                    _reduce(S.Ord),
                foldMap:
                    /*#__PURE__*/
                    _foldMap(S.Ord),
                reduceRight:
                    /*#__PURE__*/
                    _reduceRight(S.Ord),
                traverse:
                    /*#__PURE__*/
                    _traverse(S.Ord),
                sequence: sequence,
            }
            /**
             * Use the `getTraversableWithIndex` instead.
             *
             * @category instances
             * @since 2.7.0
             * @deprecated
             */
            exports.TraversableWithIndex = {
                URI: exports.URI,
                map: _map,
                mapWithIndex: _mapWithIndex,
                reduce:
                    /*#__PURE__*/
                    _reduce(S.Ord),
                foldMap:
                    /*#__PURE__*/
                    _foldMap(S.Ord),
                reduceRight:
                    /*#__PURE__*/
                    _reduceRight(S.Ord),
                reduceWithIndex:
                    /*#__PURE__*/
                    _reduceWithIndex(S.Ord),
                foldMapWithIndex:
                    /*#__PURE__*/
                    _foldMapWithIndex(S.Ord),
                reduceRightWithIndex:
                    /*#__PURE__*/
                    _reduceRightWithIndex(S.Ord),
                traverse:
                    /*#__PURE__*/
                    _traverse(S.Ord),
                sequence: sequence,
                traverseWithIndex:
                    /*#__PURE__*/
                    _traverseWithIndex(S.Ord),
            }
            var _wither =
                /*#__PURE__*/
                Witherable_1.witherDefault(exports.Traversable, exports.Compactable)
            var _wilt =
                /*#__PURE__*/
                Witherable_1.wiltDefault(exports.Traversable, exports.Compactable)
            /**
             * Use `getWitherable` instead.
             *
             * @category instances
             * @since 2.7.0
             * @deprecated
             */
            exports.Witherable = {
                URI: exports.URI,
                map: _map,
                reduce:
                    /*#__PURE__*/
                    _reduce(S.Ord),
                foldMap:
                    /*#__PURE__*/
                    _foldMap(S.Ord),
                reduceRight:
                    /*#__PURE__*/
                    _reduceRight(S.Ord),
                traverse:
                    /*#__PURE__*/
                    _traverse(S.Ord),
                sequence: sequence,
                compact: exports.compact,
                separate: exports.separate,
                filter: _filter,
                filterMap: _filterMap,
                partition: _partition,
                partitionMap: _partitionMap,
                wither: _wither,
                wilt: _wilt,
            }
            /**
             * Use a new `{}` instead.
             *
             * @since 2.0.0
             * @deprecated
             */
            exports.empty = {}
            /**
             * Use [`upsertAt`](#upsertat) instead.
             *
             * @since 2.0.0
             * @deprecated
             */
            exports.insertAt = exports.upsertAt
            /**
             * Use [`has`](#has) instead.
             *
             * @since 2.0.0
             * @deprecated
             */
            exports.hasOwnProperty = RR.hasOwnProperty
            /**
             * Use small, specific instances instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.record = {
                URI: exports.URI,
                map: _map,
                reduce:
                    /*#__PURE__*/
                    _reduce(S.Ord),
                foldMap:
                    /*#__PURE__*/
                    _foldMap(S.Ord),
                reduceRight:
                    /*#__PURE__*/
                    _reduceRight(S.Ord),
                traverse:
                    /*#__PURE__*/
                    _traverse(S.Ord),
                sequence: sequence,
                compact: exports.compact,
                separate: exports.separate,
                filter: _filter,
                filterMap: _filterMap,
                partition: _partition,
                partitionMap: _partitionMap,
                mapWithIndex: _mapWithIndex,
                reduceWithIndex:
                    /*#__PURE__*/
                    _reduceWithIndex(S.Ord),
                foldMapWithIndex:
                    /*#__PURE__*/
                    _foldMapWithIndex(S.Ord),
                reduceRightWithIndex:
                    /*#__PURE__*/
                    _reduceRightWithIndex(S.Ord),
                filterMapWithIndex: _filterMapWithIndex,
                filterWithIndex: _filterWithIndex,
                partitionMapWithIndex: _partitionMapWithIndex,
                partitionWithIndex: _partitionWithIndex,
                traverseWithIndex:
                    /*#__PURE__*/
                    _traverseWithIndex(S.Ord),
                wither: _wither,
                wilt: _wilt,
            }

            /***/
        },

        /***/ 6339: /***/ function (__unused_webpack_module, exports, __nccwpck_require__) {
            "use strict"

            var __createBinding =
                (this && this.__createBinding) ||
                (Object.create
                    ? function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          Object.defineProperty(o, k2, {
                              enumerable: true,
                              get: function () {
                                  return m[k]
                              },
                          })
                      }
                    : function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          o[k2] = m[k]
                      })
            var __setModuleDefault =
                (this && this.__setModuleDefault) ||
                (Object.create
                    ? function (o, v) {
                          Object.defineProperty(o, "default", { enumerable: true, value: v })
                      }
                    : function (o, v) {
                          o["default"] = v
                      })
            var __importStar =
                (this && this.__importStar) ||
                function (mod) {
                    if (mod && mod.__esModule) return mod
                    var result = {}
                    if (mod != null)
                        for (var k in mod)
                            if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
                                __createBinding(result, mod, k)
                    __setModuleDefault(result, mod)
                    return result
                }
            Object.defineProperty(exports, "__esModule", { value: true })
            exports.semigroupProduct = exports.semigroupSum = exports.semigroupString = exports.getFunctionSemigroup = exports.semigroupAny = exports.semigroupAll = exports.fold = exports.getIntercalateSemigroup = exports.getMeetSemigroup = exports.getJoinSemigroup = exports.getDualSemigroup = exports.getStructSemigroup = exports.getTupleSemigroup = exports.getFirstSemigroup = exports.getLastSemigroup = exports.getObjectSemigroup = exports.semigroupVoid = exports.concatAll = exports.last = exports.first = exports.intercalate = exports.tuple = exports.struct = exports.reverse = exports.constant = exports.max = exports.min = void 0
            /**
             * If a type `A` can form a `Semigroup` it has an **associative** binary operation.
             *
             * ```ts
             * interface Semigroup<A> {
             *   readonly concat: (x: A, y: A) => A
             * }
             * ```
             *
             * Associativity means the following equality must hold for any choice of `x`, `y`, and `z`.
             *
             * ```ts
             * concat(x, concat(y, z)) = concat(concat(x, y), z)
             * ```
             *
             * A common example of a semigroup is the type `string` with the operation `+`.
             *
             * ```ts
             * import { Semigroup } from 'fp-ts/Semigroup'
             *
             * const semigroupString: Semigroup<string> = {
             *   concat: (x, y) => x + y
             * }
             *
             * const x = 'x'
             * const y = 'y'
             * const z = 'z'
             *
             * semigroupString.concat(x, y) // 'xy'
             *
             * semigroupString.concat(x, semigroupString.concat(y, z)) // 'xyz'
             *
             * semigroupString.concat(semigroupString.concat(x, y), z) // 'xyz'
             * ```
             *
             * *Adapted from https://typelevel.org/cats*
             *
             * @since 2.0.0
             */
            var function_1 = __nccwpck_require__(6985)
            var _ = __importStar(__nccwpck_require__(1840))
            var M = __importStar(__nccwpck_require__(179))
            var Or = __importStar(__nccwpck_require__(6685))
            // -------------------------------------------------------------------------------------
            // constructors
            // -------------------------------------------------------------------------------------
            /**
             * Get a semigroup where `concat` will return the minimum, based on the provided order.
             *
             * @example
             * import * as N from 'fp-ts/number'
             * import * as S from 'fp-ts/Semigroup'
             *
             * const S1 = S.min(N.Ord)
             *
             * assert.deepStrictEqual(S1.concat(1, 2), 1)
             *
             * @category constructors
             * @since 2.10.0
             */
            var min = function (O) {
                return {
                    concat: Or.min(O),
                }
            }
            exports.min = min
            /**
             * Get a semigroup where `concat` will return the maximum, based on the provided order.
             *
             * @example
             * import * as N from 'fp-ts/number'
             * import * as S from 'fp-ts/Semigroup'
             *
             * const S1 = S.max(N.Ord)
             *
             * assert.deepStrictEqual(S1.concat(1, 2), 2)
             *
             * @category constructors
             * @since 2.10.0
             */
            var max = function (O) {
                return {
                    concat: Or.max(O),
                }
            }
            exports.max = max
            /**
             * @category constructors
             * @since 2.10.0
             */
            var constant = function (a) {
                return {
                    concat: function () {
                        return a
                    },
                }
            }
            exports.constant = constant
            // -------------------------------------------------------------------------------------
            // combinators
            // -------------------------------------------------------------------------------------
            /**
             * The dual of a `Semigroup`, obtained by swapping the arguments of `concat`.
             *
             * @example
             * import { reverse } from 'fp-ts/Semigroup'
             * import * as S from 'fp-ts/string'
             *
             * assert.deepStrictEqual(reverse(S.Semigroup).concat('a', 'b'), 'ba')
             *
             * @category combinators
             * @since 2.10.0
             */
            exports.reverse = M.reverse
            /**
             * Given a struct of semigroups returns a semigroup for the struct.
             *
             * @example
             * import { struct } from 'fp-ts/Semigroup'
             * import * as N from 'fp-ts/number'
             *
             * interface Point {
             *   readonly x: number
             *   readonly y: number
             * }
             *
             * const S = struct<Point>({
             *   x: N.SemigroupSum,
             *   y: N.SemigroupSum
             * })
             *
             * assert.deepStrictEqual(S.concat({ x: 1, y: 2 }, { x: 3, y: 4 }), { x: 4, y: 6 })
             *
             * @category combinators
             * @since 2.10.0
             */
            var struct = function (semigroups) {
                return {
                    concat: function (first, second) {
                        var r = {}
                        for (var k in semigroups) {
                            if (_.has.call(semigroups, k)) {
                                r[k] = semigroups[k].concat(first[k], second[k])
                            }
                        }
                        return r
                    },
                }
            }
            exports.struct = struct
            /**
             * Given a tuple of semigroups returns a semigroup for the tuple.
             *
             * @example
             * import { tuple } from 'fp-ts/Semigroup'
             * import * as B from 'fp-ts/boolean'
             * import * as N from 'fp-ts/number'
             * import * as S from 'fp-ts/string'
             *
             * const S1 = tuple(S.Semigroup, N.SemigroupSum)
             * assert.deepStrictEqual(S1.concat(['a', 1], ['b', 2]), ['ab', 3])
             *
             * const S2 = tuple(S.Semigroup, N.SemigroupSum, B.SemigroupAll)
             * assert.deepStrictEqual(S2.concat(['a', 1, true], ['b', 2, false]), ['ab', 3, false])
             *
             * @category combinators
             * @since 2.10.0
             */
            var tuple = function () {
                var semigroups = []
                for (var _i = 0; _i < arguments.length; _i++) {
                    semigroups[_i] = arguments[_i]
                }
                return {
                    concat: function (first, second) {
                        return semigroups.map(function (s, i) {
                            return s.concat(first[i], second[i])
                        })
                    },
                }
            }
            exports.tuple = tuple
            /**
             * Between each pair of elements insert `middle`.
             *
             * @example
             * import { intercalate } from 'fp-ts/Semigroup'
             * import * as S from 'fp-ts/string'
             * import { pipe } from 'fp-ts/function'
             *
             * const S1 = pipe(S.Semigroup, intercalate(' + '))
             *
             * assert.strictEqual(S1.concat('a', 'b'), 'a + b')
             *
             * @category combinators
             * @since 2.10.0
             */
            var intercalate = function (middle) {
                return function (S) {
                    return {
                        concat: function (x, y) {
                            return S.concat(x, S.concat(middle, y))
                        },
                    }
                }
            }
            exports.intercalate = intercalate
            // -------------------------------------------------------------------------------------
            // instances
            // -------------------------------------------------------------------------------------
            /**
             * Always return the first argument.
             *
             * @example
             * import * as S from 'fp-ts/Semigroup'
             *
             * assert.deepStrictEqual(S.first<number>().concat(1, 2), 1)
             *
             * @category instances
             * @since 2.10.0
             */
            var first = function () {
                return { concat: function_1.identity }
            }
            exports.first = first
            /**
             * Always return the last argument.
             *
             * @example
             * import * as S from 'fp-ts/Semigroup'
             *
             * assert.deepStrictEqual(S.last<number>().concat(1, 2), 2)
             *
             * @category instances
             * @since 2.10.0
             */
            var last = function () {
                return {
                    concat: function (_, y) {
                        return y
                    },
                }
            }
            exports.last = last
            // -------------------------------------------------------------------------------------
            // utils
            // -------------------------------------------------------------------------------------
            /**
             * Given a sequence of `as`, concat them and return the total.
             *
             * If `as` is empty, return the provided `startWith` value.
             *
             * @example
             * import { concatAll } from 'fp-ts/Semigroup'
             * import * as N from 'fp-ts/number'
             *
             * const sum = concatAll(N.SemigroupSum)(0)
             *
             * assert.deepStrictEqual(sum([1, 2, 3]), 6)
             * assert.deepStrictEqual(sum([]), 0)
             *
             * @since 2.10.0
             */
            exports.concatAll = M.concatAll
            // -------------------------------------------------------------------------------------
            // deprecated
            // -------------------------------------------------------------------------------------
            /**
             * Use `void` module instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.semigroupVoid = exports.constant(undefined)
            /**
             * Use [`getAssignSemigroup`](./struct.ts.html#getAssignSemigroup) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            var getObjectSemigroup = function () {
                return {
                    concat: function (first, second) {
                        return Object.assign({}, first, second)
                    },
                }
            }
            exports.getObjectSemigroup = getObjectSemigroup
            /**
             * Use [`last`](#last) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.getLastSemigroup = exports.last
            /**
             * Use [`first`](#first) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.getFirstSemigroup = exports.first
            /**
             * Use [`tuple`](#tuple) instead.
             *
             * @category combinators
             * @since 2.0.0
             * @deprecated
             */
            exports.getTupleSemigroup = exports.tuple
            /**
             * Use [`struct`](#struct) instead.
             *
             * @category combinators
             * @since 2.0.0
             * @deprecated
             */
            exports.getStructSemigroup = exports.struct
            /**
             * Use [`reverse`](#reverse) instead.
             *
             * @category combinators
             * @since 2.0.0
             * @deprecated
             */
            exports.getDualSemigroup = exports.reverse
            /**
             * Use [`max`](#max) instead.
             *
             * @category constructors
             * @since 2.0.0
             * @deprecated
             */
            exports.getJoinSemigroup = exports.max
            /**
             * Use [`min`](#min) instead.
             *
             * @category constructors
             * @since 2.0.0
             * @deprecated
             */
            exports.getMeetSemigroup = exports.min
            /**
             * Use [`intercalate`](#intercalate) instead.
             *
             * @category combinators
             * @since 2.5.0
             * @deprecated
             */
            exports.getIntercalateSemigroup = exports.intercalate
            function fold(S) {
                var concatAllS = exports.concatAll(S)
                return function (startWith, as) {
                    return as === undefined ? concatAllS(startWith) : concatAllS(startWith)(as)
                }
            }
            exports.fold = fold
            /**
             * Use [`SemigroupAll`](./boolean.ts.html#SemigroupAll) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.semigroupAll = {
                concat: function (x, y) {
                    return x && y
                },
            }
            /**
             * Use [`SemigroupAny`](./boolean.ts.html#SemigroupAny) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.semigroupAny = {
                concat: function (x, y) {
                    return x || y
                },
            }
            /**
             * Use [`getSemigroup`](./function.ts.html#getSemigroup) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.getFunctionSemigroup = function_1.getSemigroup
            /**
             * Use [`Semigroup`](./string.ts.html#Semigroup) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.semigroupString = {
                concat: function (x, y) {
                    return x + y
                },
            }
            /**
             * Use [`SemigroupSum`](./number.ts.html#SemigroupSum) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.semigroupSum = {
                concat: function (x, y) {
                    return x + y
                },
            }
            /**
             * Use [`SemigroupProduct`](./number.ts.html#SemigroupProduct) instead.
             *
             * @category instances
             * @since 2.0.0
             * @deprecated
             */
            exports.semigroupProduct = {
                concat: function (x, y) {
                    return x * y
                },
            }

            /***/
        },

        /***/ 5877: /***/ (__unused_webpack_module, exports, __nccwpck_require__) => {
            "use strict"

            /**
             * ```ts
             * interface Separated<E, A> {
             *    readonly left: E
             *    readonly right: A
             * }
             * ```
             *
             * Represents a result of separating a whole into two parts.
             *
             * @since 2.10.0
             */
            Object.defineProperty(exports, "__esModule", { value: true })
            exports.right = exports.left = exports.flap = exports.Functor = exports.Bifunctor = exports.URI = exports.bimap = exports.mapLeft = exports.map = exports.separated = void 0
            var function_1 = __nccwpck_require__(6985)
            var Functor_1 = __nccwpck_require__(5533)
            // -------------------------------------------------------------------------------------
            // constructors
            // -------------------------------------------------------------------------------------
            /**
             * @category constructors
             * @since 2.10.0
             */
            var separated = function (left, right) {
                return { left: left, right: right }
            }
            exports.separated = separated
            // -------------------------------------------------------------------------------------
            // non-pipeables
            // -------------------------------------------------------------------------------------
            var _map = function (fa, f) {
                return function_1.pipe(fa, exports.map(f))
            }
            var _mapLeft = function (fa, f) {
                return function_1.pipe(fa, exports.mapLeft(f))
            }
            var _bimap = function (fa, g, f) {
                return function_1.pipe(fa, exports.bimap(g, f))
            }
            // -------------------------------------------------------------------------------------
            // type class members
            // -------------------------------------------------------------------------------------
            /**
             * `map` can be used to turn functions `(a: A) => B` into functions `(fa: F<A>) => F<B>` whose argument and return types
             * use the type constructor `F` to represent some computational context.
             *
             * @category Functor
             * @since 2.10.0
             */
            var map = function (f) {
                return function (fa) {
                    return exports.separated(exports.left(fa), f(exports.right(fa)))
                }
            }
            exports.map = map
            /**
             * Map a function over the first type argument of a bifunctor.
             *
             * @category Bifunctor
             * @since 2.10.0
             */
            var mapLeft = function (f) {
                return function (fa) {
                    return exports.separated(f(exports.left(fa)), exports.right(fa))
                }
            }
            exports.mapLeft = mapLeft
            /**
             * Map a pair of functions over the two type arguments of the bifunctor.
             *
             * @category Bifunctor
             * @since 2.10.0
             */
            var bimap = function (f, g) {
                return function (fa) {
                    return exports.separated(f(exports.left(fa)), g(exports.right(fa)))
                }
            }
            exports.bimap = bimap
            // -------------------------------------------------------------------------------------
            // instances
            // -------------------------------------------------------------------------------------
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.URI = "Separated"
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Bifunctor = {
                URI: exports.URI,
                mapLeft: _mapLeft,
                bimap: _bimap,
            }
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Functor = {
                URI: exports.URI,
                map: _map,
            }
            /**
             * Derivable from `Functor`.
             *
             * @category combinators
             * @since 2.10.0
             */
            exports.flap =
                /*#__PURE__*/
                Functor_1.flap(exports.Functor)
            // -------------------------------------------------------------------------------------
            // utils
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.10.0
             */
            var left = function (s) {
                return s.left
            }
            exports.left = left
            /**
             * @since 2.10.0
             */
            var right = function (s) {
                return s.right
            }
            exports.right = right

            /***/
        },

        /***/ 4384: /***/ function (__unused_webpack_module, exports, __nccwpck_require__) {
            "use strict"

            var __createBinding =
                (this && this.__createBinding) ||
                (Object.create
                    ? function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          Object.defineProperty(o, k2, {
                              enumerable: true,
                              get: function () {
                                  return m[k]
                              },
                          })
                      }
                    : function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          o[k2] = m[k]
                      })
            var __setModuleDefault =
                (this && this.__setModuleDefault) ||
                (Object.create
                    ? function (o, v) {
                          Object.defineProperty(o, "default", { enumerable: true, value: v })
                      }
                    : function (o, v) {
                          o["default"] = v
                      })
            var __importStar =
                (this && this.__importStar) ||
                function (mod) {
                    if (mod && mod.__esModule) return mod
                    var result = {}
                    if (mod != null)
                        for (var k in mod)
                            if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
                                __createBinding(result, mod, k)
                    __setModuleDefault(result, mod)
                    return result
                }
            Object.defineProperty(exports, "__esModule", { value: true })
            exports.filterE = exports.witherDefault = exports.wiltDefault = void 0
            var _ = __importStar(__nccwpck_require__(1840))
            function wiltDefault(T, C) {
                return function (F) {
                    var traverseF = T.traverse(F)
                    return function (wa, f) {
                        return F.map(traverseF(wa, f), C.separate)
                    }
                }
            }
            exports.wiltDefault = wiltDefault
            function witherDefault(T, C) {
                return function (F) {
                    var traverseF = T.traverse(F)
                    return function (wa, f) {
                        return F.map(traverseF(wa, f), C.compact)
                    }
                }
            }
            exports.witherDefault = witherDefault
            function filterE(W) {
                return function (F) {
                    var witherF = W.wither(F)
                    return function (predicate) {
                        return function (ga) {
                            return witherF(ga, function (a) {
                                return F.map(predicate(a), function (b) {
                                    return b ? _.some(a) : _.none
                                })
                            })
                        }
                    }
                }
            }
            exports.filterE = filterE

            /***/
        },

        /***/ 9734: /***/ (__unused_webpack_module, exports) => {
            "use strict"

            Object.defineProperty(exports, "__esModule", { value: true })
            exports.guard = void 0
            function guard(F, P) {
                return function (b) {
                    return b ? P.of(undefined) : F.zero()
                }
            }
            exports.guard = guard

            /***/
        },

        /***/ 6985: /***/ (__unused_webpack_module, exports) => {
            "use strict"

            Object.defineProperty(exports, "__esModule", { value: true })
            exports.getEndomorphismMonoid = exports.not = exports.SK = exports.hole = exports.pipe = exports.untupled = exports.tupled = exports.absurd = exports.decrement = exports.increment = exports.tuple = exports.flow = exports.flip = exports.constVoid = exports.constUndefined = exports.constNull = exports.constFalse = exports.constTrue = exports.constant = exports.unsafeCoerce = exports.identity = exports.apply = exports.getRing = exports.getSemiring = exports.getMonoid = exports.getSemigroup = exports.getBooleanAlgebra = void 0
            // -------------------------------------------------------------------------------------
            // instances
            // -------------------------------------------------------------------------------------
            /**
             * @category instances
             * @since 2.10.0
             */
            var getBooleanAlgebra = function (B) {
                return function () {
                    return {
                        meet: function (x, y) {
                            return function (a) {
                                return B.meet(x(a), y(a))
                            }
                        },
                        join: function (x, y) {
                            return function (a) {
                                return B.join(x(a), y(a))
                            }
                        },
                        zero: function () {
                            return B.zero
                        },
                        one: function () {
                            return B.one
                        },
                        implies: function (x, y) {
                            return function (a) {
                                return B.implies(x(a), y(a))
                            }
                        },
                        not: function (x) {
                            return function (a) {
                                return B.not(x(a))
                            }
                        },
                    }
                }
            }
            exports.getBooleanAlgebra = getBooleanAlgebra
            /**
             * Unary functions form a semigroup as long as you can provide a semigroup for the codomain.
             *
             * @example
             * import { Predicate, getSemigroup } from 'fp-ts/function'
             * import * as B from 'fp-ts/boolean'
             *
             * const f: Predicate<number> = (n) => n <= 2
             * const g: Predicate<number> = (n) => n >= 0
             *
             * const S1 = getSemigroup(B.SemigroupAll)<number>()
             *
             * assert.deepStrictEqual(S1.concat(f, g)(1), true)
             * assert.deepStrictEqual(S1.concat(f, g)(3), false)
             *
             * const S2 = getSemigroup(B.SemigroupAny)<number>()
             *
             * assert.deepStrictEqual(S2.concat(f, g)(1), true)
             * assert.deepStrictEqual(S2.concat(f, g)(3), true)
             *
             * @category instances
             * @since 2.10.0
             */
            var getSemigroup = function (S) {
                return function () {
                    return {
                        concat: function (f, g) {
                            return function (a) {
                                return S.concat(f(a), g(a))
                            }
                        },
                    }
                }
            }
            exports.getSemigroup = getSemigroup
            /**
             * Unary functions form a monoid as long as you can provide a monoid for the codomain.
             *
             * @example
             * import { Predicate } from 'fp-ts/Predicate'
             * import { getMonoid } from 'fp-ts/function'
             * import * as B from 'fp-ts/boolean'
             *
             * const f: Predicate<number> = (n) => n <= 2
             * const g: Predicate<number> = (n) => n >= 0
             *
             * const M1 = getMonoid(B.MonoidAll)<number>()
             *
             * assert.deepStrictEqual(M1.concat(f, g)(1), true)
             * assert.deepStrictEqual(M1.concat(f, g)(3), false)
             *
             * const M2 = getMonoid(B.MonoidAny)<number>()
             *
             * assert.deepStrictEqual(M2.concat(f, g)(1), true)
             * assert.deepStrictEqual(M2.concat(f, g)(3), true)
             *
             * @category instances
             * @since 2.10.0
             */
            var getMonoid = function (M) {
                var getSemigroupM = exports.getSemigroup(M)
                return function () {
                    return {
                        concat: getSemigroupM().concat,
                        empty: function () {
                            return M.empty
                        },
                    }
                }
            }
            exports.getMonoid = getMonoid
            /**
             * @category instances
             * @since 2.10.0
             */
            var getSemiring = function (S) {
                return {
                    add: function (f, g) {
                        return function (x) {
                            return S.add(f(x), g(x))
                        }
                    },
                    zero: function () {
                        return S.zero
                    },
                    mul: function (f, g) {
                        return function (x) {
                            return S.mul(f(x), g(x))
                        }
                    },
                    one: function () {
                        return S.one
                    },
                }
            }
            exports.getSemiring = getSemiring
            /**
             * @category instances
             * @since 2.10.0
             */
            var getRing = function (R) {
                var S = exports.getSemiring(R)
                return {
                    add: S.add,
                    mul: S.mul,
                    one: S.one,
                    zero: S.zero,
                    sub: function (f, g) {
                        return function (x) {
                            return R.sub(f(x), g(x))
                        }
                    },
                }
            }
            exports.getRing = getRing
            // -------------------------------------------------------------------------------------
            // utils
            // -------------------------------------------------------------------------------------
            /**
             * @since 2.11.0
             */
            var apply = function (a) {
                return function (f) {
                    return f(a)
                }
            }
            exports.apply = apply
            /**
             * @since 2.0.0
             */
            function identity(a) {
                return a
            }
            exports.identity = identity
            /**
             * @since 2.0.0
             */
            exports.unsafeCoerce = identity
            /**
             * @since 2.0.0
             */
            function constant(a) {
                return function () {
                    return a
                }
            }
            exports.constant = constant
            /**
             * A thunk that returns always `true`.
             *
             * @since 2.0.0
             */
            exports.constTrue =
                /*#__PURE__*/
                constant(true)
            /**
             * A thunk that returns always `false`.
             *
             * @since 2.0.0
             */
            exports.constFalse =
                /*#__PURE__*/
                constant(false)
            /**
             * A thunk that returns always `null`.
             *
             * @since 2.0.0
             */
            exports.constNull =
                /*#__PURE__*/
                constant(null)
            /**
             * A thunk that returns always `undefined`.
             *
             * @since 2.0.0
             */
            exports.constUndefined =
                /*#__PURE__*/
                constant(undefined)
            /**
             * A thunk that returns always `void`.
             *
             * @since 2.0.0
             */
            exports.constVoid = exports.constUndefined
            /**
             * Flips the order of the arguments of a function of two arguments.
             *
             * @since 2.0.0
             */
            function flip(f) {
                return function (b, a) {
                    return f(a, b)
                }
            }
            exports.flip = flip
            function flow(ab, bc, cd, de, ef, fg, gh, hi, ij) {
                switch (arguments.length) {
                    case 1:
                        return ab
                    case 2:
                        return function () {
                            return bc(ab.apply(this, arguments))
                        }
                    case 3:
                        return function () {
                            return cd(bc(ab.apply(this, arguments)))
                        }
                    case 4:
                        return function () {
                            return de(cd(bc(ab.apply(this, arguments))))
                        }
                    case 5:
                        return function () {
                            return ef(de(cd(bc(ab.apply(this, arguments)))))
                        }
                    case 6:
                        return function () {
                            return fg(ef(de(cd(bc(ab.apply(this, arguments))))))
                        }
                    case 7:
                        return function () {
                            return gh(fg(ef(de(cd(bc(ab.apply(this, arguments)))))))
                        }
                    case 8:
                        return function () {
                            return hi(gh(fg(ef(de(cd(bc(ab.apply(this, arguments))))))))
                        }
                    case 9:
                        return function () {
                            return ij(hi(gh(fg(ef(de(cd(bc(ab.apply(this, arguments)))))))))
                        }
                }
                return
            }
            exports.flow = flow
            /**
             * @since 2.0.0
             */
            function tuple() {
                var t = []
                for (var _i = 0; _i < arguments.length; _i++) {
                    t[_i] = arguments[_i]
                }
                return t
            }
            exports.tuple = tuple
            /**
             * @since 2.0.0
             */
            function increment(n) {
                return n + 1
            }
            exports.increment = increment
            /**
             * @since 2.0.0
             */
            function decrement(n) {
                return n - 1
            }
            exports.decrement = decrement
            /**
             * @since 2.0.0
             */
            function absurd(_) {
                throw new Error("Called `absurd` function which should be uncallable")
            }
            exports.absurd = absurd
            /**
             * Creates a tupled version of this function: instead of `n` arguments, it accepts a single tuple argument.
             *
             * @example
             * import { tupled } from 'fp-ts/function'
             *
             * const add = tupled((x: number, y: number): number => x + y)
             *
             * assert.strictEqual(add([1, 2]), 3)
             *
             * @since 2.4.0
             */
            function tupled(f) {
                return function (a) {
                    return f.apply(void 0, a)
                }
            }
            exports.tupled = tupled
            /**
             * Inverse function of `tupled`
             *
             * @since 2.4.0
             */
            function untupled(f) {
                return function () {
                    var a = []
                    for (var _i = 0; _i < arguments.length; _i++) {
                        a[_i] = arguments[_i]
                    }
                    return f(a)
                }
            }
            exports.untupled = untupled
            function pipe(a, ab, bc, cd, de, ef, fg, gh, hi) {
                switch (arguments.length) {
                    case 1:
                        return a
                    case 2:
                        return ab(a)
                    case 3:
                        return bc(ab(a))
                    case 4:
                        return cd(bc(ab(a)))
                    case 5:
                        return de(cd(bc(ab(a))))
                    case 6:
                        return ef(de(cd(bc(ab(a)))))
                    case 7:
                        return fg(ef(de(cd(bc(ab(a))))))
                    case 8:
                        return gh(fg(ef(de(cd(bc(ab(a)))))))
                    case 9:
                        return hi(gh(fg(ef(de(cd(bc(ab(a))))))))
                    default:
                        var ret = arguments[0]
                        for (var i = 1; i < arguments.length; i++) {
                            ret = arguments[i](ret)
                        }
                        return ret
                }
            }
            exports.pipe = pipe
            /**
             * Type hole simulation
             *
             * @since 2.7.0
             */
            exports.hole = absurd
            /**
             * @since 2.11.0
             */
            var SK = function (_, b) {
                return b
            }
            exports.SK = SK
            /**
             * Use `Predicate` module instead.
             *
             * @since 2.0.0
             * @deprecated
             */
            function not(predicate) {
                return function (a) {
                    return !predicate(a)
                }
            }
            exports.not = not
            /**
             * Use `Endomorphism` module instead.
             *
             * @category instances
             * @since 2.10.0
             * @deprecated
             */
            var getEndomorphismMonoid = function () {
                return {
                    concat: function (first, second) {
                        return flow(first, second)
                    },
                    empty: identity,
                }
            }
            exports.getEndomorphismMonoid = getEndomorphismMonoid

            /***/
        },

        /***/ 1840: /***/ function (__unused_webpack_module, exports) {
            "use strict"

            var __spreadArray =
                (this && this.__spreadArray) ||
                function (to, from) {
                    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
                        to[j] = from[i]
                    return to
                }
            Object.defineProperty(exports, "__esModule", { value: true })
            exports.fromReadonlyNonEmptyArray = exports.has = exports.emptyRecord = exports.emptyReadonlyArray = exports.tail = exports.head = exports.isNonEmpty = exports.singleton = exports.right = exports.left = exports.isRight = exports.isLeft = exports.some = exports.none = exports.isSome = exports.isNone = void 0
            // -------------------------------------------------------------------------------------
            // Option
            // -------------------------------------------------------------------------------------
            /** @internal */
            var isNone = function (fa) {
                return fa._tag === "None"
            }
            exports.isNone = isNone
            /** @internal */
            var isSome = function (fa) {
                return fa._tag === "Some"
            }
            exports.isSome = isSome
            /** @internal */
            exports.none = { _tag: "None" }
            /** @internal */
            var some = function (a) {
                return { _tag: "Some", value: a }
            }
            exports.some = some
            // -------------------------------------------------------------------------------------
            // Either
            // -------------------------------------------------------------------------------------
            /** @internal */
            var isLeft = function (ma) {
                return ma._tag === "Left"
            }
            exports.isLeft = isLeft
            /** @internal */
            var isRight = function (ma) {
                return ma._tag === "Right"
            }
            exports.isRight = isRight
            /** @internal */
            var left = function (e) {
                return { _tag: "Left", left: e }
            }
            exports.left = left
            /** @internal */
            var right = function (a) {
                return { _tag: "Right", right: a }
            }
            exports.right = right
            // -------------------------------------------------------------------------------------
            // ReadonlyNonEmptyArray
            // -------------------------------------------------------------------------------------
            /** @internal */
            var singleton = function (a) {
                return [a]
            }
            exports.singleton = singleton
            /** @internal */
            var isNonEmpty = function (as) {
                return as.length > 0
            }
            exports.isNonEmpty = isNonEmpty
            /** @internal */
            var head = function (as) {
                return as[0]
            }
            exports.head = head
            /** @internal */
            var tail = function (as) {
                return as.slice(1)
            }
            exports.tail = tail
            // -------------------------------------------------------------------------------------
            // empty
            // -------------------------------------------------------------------------------------
            /** @internal */
            exports.emptyReadonlyArray = []
            /** @internal */
            exports.emptyRecord = {}
            // -------------------------------------------------------------------------------------
            // Record
            // -------------------------------------------------------------------------------------
            /** @internal */
            exports.has = Object.prototype.hasOwnProperty
            // -------------------------------------------------------------------------------------
            // NonEmptyArray
            // -------------------------------------------------------------------------------------
            /** @internal */
            var fromReadonlyNonEmptyArray = function (as) {
                return __spreadArray([as[0]], as.slice(1))
            }
            exports.fromReadonlyNonEmptyArray = fromReadonlyNonEmptyArray

            /***/
        },

        /***/ 52: /***/ (__unused_webpack_module, exports) => {
            "use strict"

            Object.defineProperty(exports, "__esModule", { value: true })
            exports.Field = exports.MonoidProduct = exports.MonoidSum = exports.SemigroupProduct = exports.SemigroupSum = exports.MagmaSub = exports.Show = exports.Bounded = exports.Ord = exports.Eq = exports.isNumber = void 0
            // -------------------------------------------------------------------------------------
            // refinements
            // -------------------------------------------------------------------------------------
            /**
             * @category refinements
             * @since 2.11.0
             */
            var isNumber = function (u) {
                return typeof u === "number"
            }
            exports.isNumber = isNumber
            // -------------------------------------------------------------------------------------
            // instances
            // -------------------------------------------------------------------------------------
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Eq = {
                equals: function (first, second) {
                    return first === second
                },
            }
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Ord = {
                equals: exports.Eq.equals,
                compare: function (first, second) {
                    return first < second ? -1 : first > second ? 1 : 0
                },
            }
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Bounded = {
                equals: exports.Eq.equals,
                compare: exports.Ord.compare,
                top: Infinity,
                bottom: -Infinity,
            }
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Show = {
                show: function (n) {
                    return JSON.stringify(n)
                },
            }
            /**
             * @category instances
             * @since 2.11.0
             */
            exports.MagmaSub = {
                concat: function (first, second) {
                    return first - second
                },
            }
            /**
             * `number` semigroup under addition.
             *
             * @example
             * import { SemigroupSum } from 'fp-ts/number'
             *
             * assert.deepStrictEqual(SemigroupSum.concat(2, 3), 5)
             *
             * @category instances
             * @since 2.10.0
             */
            exports.SemigroupSum = {
                concat: function (first, second) {
                    return first + second
                },
            }
            /**
             * `number` semigroup under multiplication.
             *
             * @example
             * import { SemigroupProduct } from 'fp-ts/number'
             *
             * assert.deepStrictEqual(SemigroupProduct.concat(2, 3), 6)
             *
             * @category instances
             * @since 2.10.0
             */
            exports.SemigroupProduct = {
                concat: function (first, second) {
                    return first * second
                },
            }
            /**
             * `number` monoid under addition.
             *
             * The `empty` value is `0`.
             *
             * @example
             * import { MonoidSum } from 'fp-ts/number'
             *
             * assert.deepStrictEqual(MonoidSum.concat(2, MonoidSum.empty), 2)
             *
             * @category instances
             * @since 2.10.0
             */
            exports.MonoidSum = {
                concat: exports.SemigroupSum.concat,
                empty: 0,
            }
            /**
             * `number` monoid under multiplication.
             *
             * The `empty` value is `1`.
             *
             * @example
             * import { MonoidProduct } from 'fp-ts/number'
             *
             * assert.deepStrictEqual(MonoidProduct.concat(2, MonoidProduct.empty), 2)
             *
             * @category instances
             * @since 2.10.0
             */
            exports.MonoidProduct = {
                concat: exports.SemigroupProduct.concat,
                empty: 1,
            }
            /**
             * @category instances
             * @since 2.10.0
             */
            exports.Field = {
                add: exports.SemigroupSum.concat,
                zero: 0,
                mul: exports.SemigroupProduct.concat,
                one: 1,
                sub: exports.MagmaSub.concat,
                degree: function (_) {
                    return 1
                },
                div: function (first, second) {
                    return first / second
                },
                mod: function (first, second) {
                    return first % second
                },
            }

            /***/
        },

        /***/ 6837: /***/ (__unused_webpack_module, exports, __nccwpck_require__) => {
            "use strict"

            Object.defineProperty(exports, "__esModule", { value: true })
            exports.pipe = exports.pipeable = void 0
            var function_1 = __nccwpck_require__(6985)
            var isFunctor = function (I) {
                return typeof I.map === "function"
            }
            var isContravariant = function (I) {
                return typeof I.contramap === "function"
            }
            var isFunctorWithIndex = function (I) {
                return typeof I.mapWithIndex === "function"
            }
            var isApply = function (I) {
                return typeof I.ap === "function"
            }
            var isChain = function (I) {
                return typeof I.chain === "function"
            }
            var isBifunctor = function (I) {
                return typeof I.bimap === "function"
            }
            var isExtend = function (I) {
                return typeof I.extend === "function"
            }
            var isFoldable = function (I) {
                return typeof I.reduce === "function"
            }
            var isFoldableWithIndex = function (I) {
                return typeof I.reduceWithIndex === "function"
            }
            var isAlt = function (I) {
                return typeof I.alt === "function"
            }
            var isCompactable = function (I) {
                return typeof I.compact === "function"
            }
            var isFilterable = function (I) {
                return typeof I.filter === "function"
            }
            var isFilterableWithIndex = function (I) {
                return typeof I.filterWithIndex === "function"
            }
            var isProfunctor = function (I) {
                return typeof I.promap === "function"
            }
            var isSemigroupoid = function (I) {
                return typeof I.compose === "function"
            }
            var isMonadThrow = function (I) {
                return typeof I.throwError === "function"
            }
            /** @deprecated */
            function pipeable(I) {
                var r = {}
                if (isFunctor(I)) {
                    var map = function (f) {
                        return function (fa) {
                            return I.map(fa, f)
                        }
                    }
                    r.map = map
                }
                if (isContravariant(I)) {
                    var contramap = function (f) {
                        return function (fa) {
                            return I.contramap(fa, f)
                        }
                    }
                    r.contramap = contramap
                }
                if (isFunctorWithIndex(I)) {
                    var mapWithIndex = function (f) {
                        return function (fa) {
                            return I.mapWithIndex(fa, f)
                        }
                    }
                    r.mapWithIndex = mapWithIndex
                }
                if (isApply(I)) {
                    var ap = function (fa) {
                        return function (fab) {
                            return I.ap(fab, fa)
                        }
                    }
                    var apFirst = function (fb) {
                        return function (fa) {
                            return I.ap(
                                I.map(fa, function (a) {
                                    return function () {
                                        return a
                                    }
                                }),
                                fb,
                            )
                        }
                    }
                    r.ap = ap
                    r.apFirst = apFirst
                    r.apSecond = function (fb) {
                        return function (fa) {
                            return I.ap(
                                I.map(fa, function () {
                                    return function (b) {
                                        return b
                                    }
                                }),
                                fb,
                            )
                        }
                    }
                }
                if (isChain(I)) {
                    var chain = function (f) {
                        return function (ma) {
                            return I.chain(ma, f)
                        }
                    }
                    var chainFirst = function (f) {
                        return function (ma) {
                            return I.chain(ma, function (a) {
                                return I.map(f(a), function () {
                                    return a
                                })
                            })
                        }
                    }
                    var flatten = function (mma) {
                        return I.chain(mma, function_1.identity)
                    }
                    r.chain = chain
                    r.chainFirst = chainFirst
                    r.flatten = flatten
                }
                if (isBifunctor(I)) {
                    var bimap = function (f, g) {
                        return function (fa) {
                            return I.bimap(fa, f, g)
                        }
                    }
                    var mapLeft = function (f) {
                        return function (fa) {
                            return I.mapLeft(fa, f)
                        }
                    }
                    r.bimap = bimap
                    r.mapLeft = mapLeft
                }
                if (isExtend(I)) {
                    var extend = function (f) {
                        return function (wa) {
                            return I.extend(wa, f)
                        }
                    }
                    var duplicate = function (wa) {
                        return I.extend(wa, function_1.identity)
                    }
                    r.extend = extend
                    r.duplicate = duplicate
                }
                if (isFoldable(I)) {
                    var reduce = function (b, f) {
                        return function (fa) {
                            return I.reduce(fa, b, f)
                        }
                    }
                    var foldMap = function (M) {
                        var foldMapM = I.foldMap(M)
                        return function (f) {
                            return function (fa) {
                                return foldMapM(fa, f)
                            }
                        }
                    }
                    var reduceRight = function (b, f) {
                        return function (fa) {
                            return I.reduceRight(fa, b, f)
                        }
                    }
                    r.reduce = reduce
                    r.foldMap = foldMap
                    r.reduceRight = reduceRight
                }
                if (isFoldableWithIndex(I)) {
                    var reduceWithIndex = function (b, f) {
                        return function (fa) {
                            return I.reduceWithIndex(fa, b, f)
                        }
                    }
                    var foldMapWithIndex = function (M) {
                        var foldMapM = I.foldMapWithIndex(M)
                        return function (f) {
                            return function (fa) {
                                return foldMapM(fa, f)
                            }
                        }
                    }
                    var reduceRightWithIndex = function (b, f) {
                        return function (fa) {
                            return I.reduceRightWithIndex(fa, b, f)
                        }
                    }
                    r.reduceWithIndex = reduceWithIndex
                    r.foldMapWithIndex = foldMapWithIndex
                    r.reduceRightWithIndex = reduceRightWithIndex
                }
                if (isAlt(I)) {
                    var alt = function (that) {
                        return function (fa) {
                            return I.alt(fa, that)
                        }
                    }
                    r.alt = alt
                }
                if (isCompactable(I)) {
                    r.compact = I.compact
                    r.separate = I.separate
                }
                if (isFilterable(I)) {
                    var filter = function (predicate) {
                        return function (fa) {
                            return I.filter(fa, predicate)
                        }
                    }
                    var filterMap = function (f) {
                        return function (fa) {
                            return I.filterMap(fa, f)
                        }
                    }
                    var partition = function (predicate) {
                        return function (fa) {
                            return I.partition(fa, predicate)
                        }
                    }
                    var partitionMap = function (f) {
                        return function (fa) {
                            return I.partitionMap(fa, f)
                        }
                    }
                    r.filter = filter
                    r.filterMap = filterMap
                    r.partition = partition
                    r.partitionMap = partitionMap
                }
                if (isFilterableWithIndex(I)) {
                    var filterWithIndex = function (predicateWithIndex) {
                        return function (fa) {
                            return I.filterWithIndex(fa, predicateWithIndex)
                        }
                    }
                    var filterMapWithIndex = function (f) {
                        return function (fa) {
                            return I.filterMapWithIndex(fa, f)
                        }
                    }
                    var partitionWithIndex = function (predicateWithIndex) {
                        return function (fa) {
                            return I.partitionWithIndex(fa, predicateWithIndex)
                        }
                    }
                    var partitionMapWithIndex = function (f) {
                        return function (fa) {
                            return I.partitionMapWithIndex(fa, f)
                        }
                    }
                    r.filterWithIndex = filterWithIndex
                    r.filterMapWithIndex = filterMapWithIndex
                    r.partitionWithIndex = partitionWithIndex
                    r.partitionMapWithIndex = partitionMapWithIndex
                }
                if (isProfunctor(I)) {
                    var promap = function (f, g) {
                        return function (fa) {
                            return I.promap(fa, f, g)
                        }
                    }
                    r.promap = promap
                }
                if (isSemigroupoid(I)) {
                    var compose = function (that) {
                        return function (fa) {
                            return I.compose(fa, that)
                        }
                    }
                    r.compose = compose
                }
                if (isMonadThrow(I)) {
                    var fromOption = function (onNone) {
                        return function (ma) {
                            return ma._tag === "None" ? I.throwError(onNone()) : I.of(ma.value)
                        }
                    }
                    var fromEither = function (ma) {
                        return ma._tag === "Left" ? I.throwError(ma.left) : I.of(ma.right)
                    }
                    var fromPredicate = function (predicate, onFalse) {
                        return function (a) {
                            return predicate(a) ? I.of(a) : I.throwError(onFalse(a))
                        }
                    }
                    var filterOrElse = function (predicate, onFalse) {
                        return function (ma) {
                            return I.chain(ma, function (a) {
                                return predicate(a) ? I.of(a) : I.throwError(onFalse(a))
                            })
                        }
                    }
                    r.fromOption = fromOption
                    r.fromEither = fromEither
                    r.fromPredicate = fromPredicate
                    r.filterOrElse = filterOrElse
                }
                return r
            }
            exports.pipeable = pipeable
            /**
             * Use [`pipe`](https://gcanti.github.io/fp-ts/modules/function.ts.html#flow) from `function` module instead.
             *
             * @since 2.0.0
             * @deprecated
             */
            exports.pipe = function_1.pipe

            /***/
        },

        /***/ 5189: /***/ (__unused_webpack_module, exports, __nccwpck_require__) => {
            "use strict"

            Object.defineProperty(exports, "__esModule", { value: true })
            exports.endsWith = exports.startsWith = exports.includes = exports.split = exports.size = exports.isEmpty = exports.empty = exports.slice = exports.trimRight = exports.trimLeft = exports.trim = exports.replace = exports.toLowerCase = exports.toUpperCase = exports.isString = exports.Show = exports.Ord = exports.Monoid = exports.Semigroup = exports.Eq = void 0
            var ReadonlyNonEmptyArray_1 = __nccwpck_require__(8630)
            // -------------------------------------------------------------------------------------
            // instances
            // -------------------------------------------------------------------------------------
            /**
             * @example
             * import * as S from 'fp-ts/string'
             *
             * assert.deepStrictEqual(S.Eq.equals('a', 'a'), true)
             * assert.deepStrictEqual(S.Eq.equals('a', 'b'), false)
             *
             * @category instances
             * @since 2.10.0
             */
            exports.Eq = {
                equals: function (first, second) {
                    return first === second
                },
            }
            /**
             * `string` semigroup under concatenation.
             *
             * @example
             * import * as S from 'fp-ts/string'
             *
             * assert.deepStrictEqual(S.Semigroup.concat('a', 'b'), 'ab')
             *
             * @category instances
             * @since 2.10.0
             */
            exports.Semigroup = {
                concat: function (first, second) {
                    return first + second
                },
            }
            /**
             * `string` monoid under concatenation.
             *
             * The `empty` value is `''`.
             *
             * @example
             * import * as S from 'fp-ts/string'
             *
             * assert.deepStrictEqual(S.Monoid.concat('a', 'b'), 'ab')
             * assert.deepStrictEqual(S.Monoid.concat('a', S.Monoid.empty), 'a')
             *
             * @category instances
             * @since 2.10.0
             */
            exports.Monoid = {
                concat: exports.Semigroup.concat,
                empty: "",
            }
            /**
             * @example
             * import * as S from 'fp-ts/string'
             *
             * assert.deepStrictEqual(S.Ord.compare('a', 'a'), 0)
             * assert.deepStrictEqual(S.Ord.compare('a', 'b'), -1)
             * assert.deepStrictEqual(S.Ord.compare('b', 'a'), 1)
             *
             * @category instances
             * @since 2.10.0
             */
            exports.Ord = {
                equals: exports.Eq.equals,
                compare: function (first, second) {
                    return first < second ? -1 : first > second ? 1 : 0
                },
            }
            /**
             * @example
             * import * as S from 'fp-ts/string'
             *
             * assert.deepStrictEqual(S.Show.show('a'), '"a"')
             *
             * @category instances
             * @since 2.10.0
             */
            exports.Show = {
                show: function (s) {
                    return JSON.stringify(s)
                },
            }
            // -------------------------------------------------------------------------------------
            // refinements
            // -------------------------------------------------------------------------------------
            /**
             * @example
             * import * as S from 'fp-ts/string'
             *
             * assert.deepStrictEqual(S.isString('a'), true)
             * assert.deepStrictEqual(S.isString(1), false)
             *
             * @category refinements
             * @since 2.11.0
             */
            var isString = function (u) {
                return typeof u === "string"
            }
            exports.isString = isString
            // -------------------------------------------------------------------------------------
            // combinators
            // -------------------------------------------------------------------------------------
            /**
             * @example
             * import * as S from 'fp-ts/string'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(pipe('a', S.toUpperCase), 'A')
             *
             * @category combinators
             * @since 2.11.0
             */
            var toUpperCase = function (s) {
                return s.toUpperCase()
            }
            exports.toUpperCase = toUpperCase
            /**
             * @example
             * import * as S from 'fp-ts/string'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(pipe('A', S.toLowerCase), 'a')
             *
             * @category combinators
             * @since 2.11.0
             */
            var toLowerCase = function (s) {
                return s.toLowerCase()
            }
            exports.toLowerCase = toLowerCase
            /**
             * @example
             * import * as S from 'fp-ts/string'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(pipe('abc', S.replace('b', 'd')), 'adc')
             *
             * @category combinators
             * @since 2.11.0
             */
            var replace = function (searchValue, replaceValue) {
                return function (s) {
                    return s.replace(searchValue, replaceValue)
                }
            }
            exports.replace = replace
            /**
             * @example
             * import * as S from 'fp-ts/string'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(pipe(' a ', S.trim), 'a')
             *
             * @category combinators
             * @since 2.11.0
             */
            var trim = function (s) {
                return s.trim()
            }
            exports.trim = trim
            /**
             * @example
             * import * as S from 'fp-ts/string'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(pipe(' a ', S.trimLeft), 'a ')
             *
             * @category combinators
             * @since 2.11.0
             */
            var trimLeft = function (s) {
                return s.trimLeft()
            }
            exports.trimLeft = trimLeft
            /**
             * @example
             * import * as S from 'fp-ts/string'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(pipe(' a ', S.trimRight), ' a')
             *
             * @category combinators
             * @since 2.11.0
             */
            var trimRight = function (s) {
                return s.trimRight()
            }
            exports.trimRight = trimRight
            /**
             * @example
             * import * as S from 'fp-ts/string'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(pipe('abcd', S.slice(1, 3)), 'bc')
             *
             * @category combinators
             * @since 2.11.0
             */
            var slice = function (start, end) {
                return function (s) {
                    return s.slice(start, end)
                }
            }
            exports.slice = slice
            // -------------------------------------------------------------------------------------
            // utils
            // -------------------------------------------------------------------------------------
            /**
             * An empty `string`.
             *
             * @since 2.10.0
             */
            exports.empty = ""
            /**
             * Test whether a `string` is empty.
             *
             * @example
             * import * as S from 'fp-ts/string'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(pipe('', S.isEmpty), true)
             * assert.deepStrictEqual(pipe('a', S.isEmpty), false)
             *
             * @since 2.10.0
             */
            var isEmpty = function (s) {
                return s.length === 0
            }
            exports.isEmpty = isEmpty
            /**
             * Calculate the number of characters in a `string`.
             *
             * @example
             * import * as S from 'fp-ts/string'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(pipe('abc', S.size), 3)
             *
             * @since 2.10.0
             */
            var size = function (s) {
                return s.length
            }
            exports.size = size
            /**
             * @example
             * import * as S from 'fp-ts/string'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(pipe('abc', S.split('')), ['a', 'b', 'c'])
             * assert.deepStrictEqual(pipe('', S.split('')), [''])
             *
             * @since 2.11.0
             */
            var split = function (separator) {
                return function (s) {
                    var out = s.split(separator)
                    return ReadonlyNonEmptyArray_1.isNonEmpty(out) ? out : [s]
                }
            }
            exports.split = split
            /**
             * @example
             * import * as S from 'fp-ts/string'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(pipe('abc', S.includes('b')), true)
             * assert.deepStrictEqual(pipe('abc', S.includes('d')), false)
             *
             * @since 2.11.0
             */
            var includes = function (searchString, position) {
                return function (s) {
                    return s.includes(searchString, position)
                }
            }
            exports.includes = includes
            /**
             * @example
             * import * as S from 'fp-ts/string'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(pipe('abc', S.startsWith('a')), true)
             * assert.deepStrictEqual(pipe('bc', S.startsWith('a')), false)
             *
             * @since 2.11.0
             */
            var startsWith = function (searchString, position) {
                return function (s) {
                    return s.startsWith(searchString, position)
                }
            }
            exports.startsWith = startsWith
            /**
             * @example
             * import * as S from 'fp-ts/string'
             * import { pipe } from 'fp-ts/function'
             *
             * assert.deepStrictEqual(pipe('abc', S.endsWith('c')), true)
             * assert.deepStrictEqual(pipe('ab', S.endsWith('c')), false)
             *
             * @since 2.11.0
             */
            var endsWith = function (searchString, position) {
                return function (s) {
                    return s.endsWith(searchString, position)
                }
            }
            exports.endsWith = endsWith

            /***/
        },

        /***/ 1621: /***/ (module) => {
            "use strict"

            module.exports = (flag, argv) => {
                argv = argv || process.argv
                const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--"
                const pos = argv.indexOf(prefix + flag)
                const terminatorPos = argv.indexOf("--")
                return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos)
            }

            /***/
        },

        /***/ 51: /***/ (__unused_webpack_module, exports, __nccwpck_require__) => {
            "use strict"

            Object.defineProperty(exports, "__esModule", { value: true })
            exports.reporter = exports.formatValidationErrors = exports.formatValidationError = exports.TYPE_MAX_LEN = void 0
            /**
             * An [io-ts Reporter](https://gcanti.github.io/io-ts/modules/Reporter.ts.html#reporter-interface).
             *
             * @example
             *
             * import * as t from 'io-ts';
             * import Reporter from 'io-ts-reporters';
             *
             * const User = t.interface({ name: t.string });
             *
             * assert.deepEqual(
             *   Reporter.report(User.decode({ nam: 'Jane' })),
             *   ['Expecting string at name but instead got: undefined'],
             * )
             * assert.deepEqual( Reporter.report(User.decode({ name: 'Jane' })), [])
             *
             * @since 1.2.0
             */
            var A = __nccwpck_require__(3834)
            var E = __nccwpck_require__(7534)
            var NEA = __nccwpck_require__(240)
            var O = __nccwpck_require__(2569)
            var R = __nccwpck_require__(2653)
            var pipeable_1 = __nccwpck_require__(6837)
            var t = __nccwpck_require__(5428)
            var utils_1 = __nccwpck_require__(6753)
            var isUnionType = function (_a) {
                var type = _a.type
                return type instanceof t.UnionType
            }
            var jsToString = function (value) {
                return value === undefined ? "undefined" : JSON.stringify(value)
            }
            var keyPath = function (ctx) {
                // The context entry with an empty key is the original
                // type ("default context"), not a type error.
                return ctx
                    .map(function (c) {
                        return c.key
                    })
                    .filter(Boolean)
                    .join(".")
            }
            // The actual error is last in context
            var getErrorFromCtx = function (validation) {
                // https://github.com/gcanti/fp-ts/pull/544/files
                return A.last(validation.context)
            }
            var getValidationContext = function (validation) {
                // https://github.com/gcanti/fp-ts/pull/544/files
                return validation.context
            }
            /**
             * @category internals
             * @since 1.2.1
             */
            exports.TYPE_MAX_LEN = 160 // Two lines of 80-col text
            var truncateType = function (type, options) {
                if (options === void 0) {
                    options = {}
                }
                var _a = options.truncateLongTypes,
                    truncateLongTypes = _a === void 0 ? true : _a
                if (truncateLongTypes && type.length > exports.TYPE_MAX_LEN) {
                    return type.slice(0, exports.TYPE_MAX_LEN - 3) + "..."
                }
                return type
            }
            var errorMessageSimple = function (expectedType, path, error, options) {
                // https://github.com/elm-lang/core/blob/18c9e84e975ed22649888bfad15d1efdb0128ab2/src/Native/Json.js#L199
                return [
                    "Expecting " + truncateType(expectedType, options),
                    path === "" ? "" : "at " + path,
                    "but instead got: " + jsToString(error.value),
                    error.message ? "(" + error.message + ")" : "",
                ]
                    .filter(Boolean)
                    .join(" ")
            }
            var errorMessageUnion = function (expectedTypes, path, value, options) {
                // https://github.com/elm-lang/core/blob/18c9e84e975ed22649888bfad15d1efdb0128ab2/src/Native/Json.js#L199
                return [
                    "Expecting one of:\n",
                    expectedTypes
                        .map(function (type) {
                            return "    " + truncateType(type, options)
                        })
                        .join("\n"),
                    path === "" ? "\n" : "\nat " + path + " ",
                    "but instead got: " + jsToString(value),
                ]
                    .filter(Boolean)
                    .join("")
            }
            // Find the union type in the list of ContextEntry
            // The next ContextEntry should be the type of this branch of the union
            var findExpectedType = function (ctx) {
                return pipeable_1.pipe(
                    ctx,
                    A.findIndex(isUnionType),
                    O.chain(function (n) {
                        return A.lookup(n + 1, ctx)
                    }),
                )
            }
            var formatValidationErrorOfUnion = function (path, errors, options) {
                var expectedTypes = pipeable_1.pipe(
                    errors,
                    A.map(getValidationContext),
                    A.map(findExpectedType),
                    A.compact,
                )
                var value = pipeable_1.pipe(
                    expectedTypes,
                    A.head,
                    O.map(function (v) {
                        return v.actual
                    }),
                    O.getOrElse(function () {
                        return undefined
                    }),
                )
                var expected = expectedTypes.map(function (_a) {
                    var type = _a.type
                    return type.name
                })
                return expected.length > 0
                    ? O.some(errorMessageUnion(expected, path, value, options))
                    : O.none
            }
            var formatValidationCommonError = function (path, error, options) {
                return pipeable_1.pipe(
                    error,
                    getErrorFromCtx,
                    O.map(function (errorContext) {
                        return errorMessageSimple(errorContext.type.name, path, error, options)
                    }),
                )
            }
            var groupByKey = NEA.groupBy(function (error) {
                return pipeable_1.pipe(error.context, utils_1.takeUntil(isUnionType), keyPath)
            })
            var format = function (path, errors, options) {
                return NEA.tail(errors).length > 0
                    ? formatValidationErrorOfUnion(path, errors, options)
                    : formatValidationCommonError(path, NEA.head(errors), options)
            }
            /**
             * Format a single validation error.
             *
             * @category formatters
             * @since 1.0.0
             */
            var formatValidationError = function (error, options) {
                return formatValidationCommonError(keyPath(error.context), error, options)
            }
            exports.formatValidationError = formatValidationError
            /**
             * Format validation errors (`t.Errors`).
             *
             * @example
             * import * as E from 'fp-ts/Either'
             * import * as t from 'io-ts'
             * import { formatValidationErrors } from 'io-ts-reporters'
             *
             * const result = t.string.decode(123)
             *
             * assert.deepEqual(
             *   E.mapLeft(formatValidationErrors)(result),
             *   E.left(['Expecting string but instead got: 123'])
             * )
             *
             * @category formatters
             * @since 1.2.0
             */
            var formatValidationErrors = function (errors, options) {
                return pipeable_1.pipe(
                    errors,
                    groupByKey,
                    R.mapWithIndex(function (path, errors) {
                        return format(path, errors, options)
                    }),
                    R.compact,
                    R.toArray,
                    A.map(function (_a) {
                        var _key = _a[0],
                            error = _a[1]
                        return error
                    }),
                )
            }
            exports.formatValidationErrors = formatValidationErrors
            /**
             * Deprecated, use the default export instead.
             *
             * @category deprecated
             * @deprecated
             * @since 1.0.0
             */
            var reporter = function (validation, options) {
                return pipeable_1.pipe(
                    validation,
                    E.mapLeft(function (errors) {
                        return exports.formatValidationErrors(errors, options)
                    }),
                    E.fold(
                        function (errors) {
                            return errors
                        },
                        function () {
                            return []
                        },
                    ),
                )
            }
            exports.reporter = reporter
            var prettyReporter = { report: exports.reporter }
            exports.default = prettyReporter
            //# sourceMappingURL=index.js.map

            /***/
        },

        /***/ 6753: /***/ (__unused_webpack_module, exports) => {
            "use strict"

            Object.defineProperty(exports, "__esModule", { value: true })
            exports.takeUntil = void 0
            /**
             * @since 1.1.0
             */
            /* eslint-disable @typescript-eslint/array-type */
            var takeUntil = function (predicate) {
                return function (as) {
                    var init = []
                    // eslint-disable-next-line unicorn/no-for-loop
                    for (var i = 0; i < as.length; i++) {
                        init[i] = as[i]
                        if (predicate(as[i])) {
                            return init
                        }
                    }
                    return init
                }
            }
            exports.takeUntil = takeUntil
            /* eslint-enable @typescript-eslint/array-type */
            //# sourceMappingURL=utils.js.map

            /***/
        },

        /***/ 5428: /***/ function (__unused_webpack_module, exports, __nccwpck_require__) {
            "use strict"

            var __extends =
                (this && this.__extends) ||
                (function () {
                    var extendStatics = function (d, b) {
                        extendStatics =
                            Object.setPrototypeOf ||
                            ({ __proto__: [] } instanceof Array &&
                                function (d, b) {
                                    d.__proto__ = b
                                }) ||
                            function (d, b) {
                                for (var p in b)
                                    if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]
                            }
                        return extendStatics(d, b)
                    }
                    return function (d, b) {
                        extendStatics(d, b)
                        function __() {
                            this.constructor = d
                        }
                        d.prototype =
                            b === null ? Object.create(b) : ((__.prototype = b.prototype), new __())
                    }
                })()
            var __assign =
                (this && this.__assign) ||
                function () {
                    __assign =
                        Object.assign ||
                        function (t) {
                            for (var s, i = 1, n = arguments.length; i < n; i++) {
                                s = arguments[i]
                                for (var p in s)
                                    if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p]
                            }
                            return t
                        }
                    return __assign.apply(this, arguments)
                }
            var __spreadArrays =
                (this && this.__spreadArrays) ||
                function () {
                    for (var s = 0, i = 0, il = arguments.length; i < il; i++)
                        s += arguments[i].length
                    for (var r = Array(s), k = 0, i = 0; i < il; i++)
                        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                            r[k] = a[j]
                    return r
                }
            Object.defineProperty(exports, "__esModule", { value: true })
            exports.partial = exports.PartialType = exports.type = exports.InterfaceType = exports.array = exports.ArrayType = exports.recursion = exports.RecursiveType = exports.Int = exports.brand = exports.RefinementType = exports.keyof = exports.KeyofType = exports.literal = exports.LiteralType = exports.void = exports.undefined = exports.null = exports.UnknownRecord = exports.AnyDictionaryType = exports.UnknownArray = exports.AnyArrayType = exports.boolean = exports.BooleanType = exports.bigint = exports.BigIntType = exports.number = exports.NumberType = exports.string = exports.StringType = exports.unknown = exports.UnknownType = exports.voidType = exports.VoidType = exports.UndefinedType = exports.nullType = exports.NullType = exports.getIndex = exports.getTags = exports.emptyTags = exports.mergeAll = exports.getDomainKeys = exports.appendContext = exports.getContextEntry = exports.getFunctionName = exports.identity = exports.Type = exports.success = exports.failure = exports.failures = void 0
            exports.alias = exports.clean = exports.StrictType = exports.dictionary = exports.Integer = exports.refinement = exports.object = exports.ObjectType = exports.Dictionary = exports.any = exports.AnyType = exports.never = exports.NeverType = exports.getDefaultContext = exports.getValidationError = exports.interface = exports.Array = exports.taggedUnion = exports.TaggedUnionType = exports.Function = exports.FunctionType = exports.exact = exports.ExactType = exports.strict = exports.readonlyArray = exports.ReadonlyArrayType = exports.readonly = exports.ReadonlyType = exports.tuple = exports.TupleType = exports.intersection = exports.IntersectionType = exports.union = exports.UnionType = exports.record = exports.DictionaryType = void 0
            /**
             * @since 1.0.0
             */
            var Either_1 = __nccwpck_require__(7534)
            /**
             * @category Decode error
             * @since 1.0.0
             */
            exports.failures = Either_1.left
            /**
             * @category Decode error
             * @since 1.0.0
             */
            var failure = function (value, context, message) {
                return exports.failures([{ value: value, context: context, message: message }])
            }
            exports.failure = failure
            /**
             * @category Decode error
             * @since 1.0.0
             */
            exports.success = Either_1.right
            /**
             * @category Codec
             * @since 1.0.0
             */
            var Type = /** @class */ (function () {
                function Type(
                    /** a unique name for this codec */
                    name,
                    /** a custom type guard */
                    is,
                    /** succeeds if a value of type I can be decoded to a value of type A */
                    validate,
                    /** converts a value of type A to a value of type O */
                    encode,
                ) {
                    this.name = name
                    this.is = is
                    this.validate = validate
                    this.encode = encode
                    this.decode = this.decode.bind(this)
                }
                /**
                 * @since 1.0.0
                 */
                Type.prototype.pipe = function (ab, name) {
                    var _this = this
                    if (name === void 0) {
                        name = "pipe(" + this.name + ", " + ab.name + ")"
                    }
                    return new Type(
                        name,
                        ab.is,
                        function (i, c) {
                            var e = _this.validate(i, c)
                            if (Either_1.isLeft(e)) {
                                return e
                            }
                            return ab.validate(e.right, c)
                        },
                        this.encode === exports.identity && ab.encode === exports.identity
                            ? exports.identity
                            : function (b) {
                                  return _this.encode(ab.encode(b))
                              },
                    )
                }
                /**
                 * @since 1.0.0
                 */
                Type.prototype.asDecoder = function () {
                    return this
                }
                /**
                 * @since 1.0.0
                 */
                Type.prototype.asEncoder = function () {
                    return this
                }
                /**
                 * a version of `validate` with a default context
                 * @since 1.0.0
                 */
                Type.prototype.decode = function (i) {
                    return this.validate(i, [{ key: "", type: this, actual: i }])
                }
                return Type
            })()
            exports.Type = Type
            // -------------------------------------------------------------------------------------
            // utils
            // -------------------------------------------------------------------------------------
            /**
             * @since 1.0.0
             */
            var identity = function (a) {
                return a
            }
            exports.identity = identity
            /**
             * @since 1.0.0
             */
            function getFunctionName(f) {
                return f.displayName || f.name || "<function" + f.length + ">"
            }
            exports.getFunctionName = getFunctionName
            /**
             * @since 1.0.0
             */
            function getContextEntry(key, decoder) {
                return { key: key, type: decoder }
            }
            exports.getContextEntry = getContextEntry
            /**
             * @since 1.0.0
             */
            function appendContext(c, key, decoder, actual) {
                var len = c.length
                var r = Array(len + 1)
                for (var i = 0; i < len; i++) {
                    r[i] = c[i]
                }
                r[len] = { key: key, type: decoder, actual: actual }
                return r
            }
            exports.appendContext = appendContext
            function pushAll(xs, ys) {
                var l = ys.length
                for (var i = 0; i < l; i++) {
                    xs.push(ys[i])
                }
            }
            var hasOwnProperty = Object.prototype.hasOwnProperty
            function getNameFromProps(props) {
                return Object.keys(props)
                    .map(function (k) {
                        return k + ": " + props[k].name
                    })
                    .join(", ")
            }
            function useIdentity(codecs) {
                for (var i = 0; i < codecs.length; i++) {
                    if (codecs[i].encode !== exports.identity) {
                        return false
                    }
                }
                return true
            }
            function getInterfaceTypeName(props) {
                return "{ " + getNameFromProps(props) + " }"
            }
            function getPartialTypeName(inner) {
                return "Partial<" + inner + ">"
            }
            function enumerableRecord(keys, domain, codomain, name) {
                if (name === void 0) {
                    name = "{ [K in " + domain.name + "]: " + codomain.name + " }"
                }
                var len = keys.length
                return new DictionaryType(
                    name,
                    function (u) {
                        return (
                            exports.UnknownRecord.is(u) &&
                            keys.every(function (k) {
                                return codomain.is(u[k])
                            })
                        )
                    },
                    function (u, c) {
                        var e = exports.UnknownRecord.validate(u, c)
                        if (Either_1.isLeft(e)) {
                            return e
                        }
                        var o = e.right
                        var a = {}
                        var errors = []
                        var changed = false
                        for (var i = 0; i < len; i++) {
                            var k = keys[i]
                            var ok = o[k]
                            var codomainResult = codomain.validate(
                                ok,
                                appendContext(c, k, codomain, ok),
                            )
                            if (Either_1.isLeft(codomainResult)) {
                                pushAll(errors, codomainResult.left)
                            } else {
                                var vok = codomainResult.right
                                changed = changed || vok !== ok
                                a[k] = vok
                            }
                        }
                        return errors.length > 0
                            ? exports.failures(errors)
                            : exports.success(changed || Object.keys(o).length !== len ? a : o)
                    },
                    codomain.encode === exports.identity
                        ? exports.identity
                        : function (a) {
                              var s = {}
                              for (var i = 0; i < len; i++) {
                                  var k = keys[i]
                                  s[k] = codomain.encode(a[k])
                              }
                              return s
                          },
                    domain,
                    codomain,
                )
            }
            /**
             * @internal
             */
            function getDomainKeys(domain) {
                var _a
                if (isLiteralC(domain)) {
                    var literal_1 = domain.value
                    if (exports.string.is(literal_1)) {
                        return (_a = {}), (_a[literal_1] = null), _a
                    }
                } else if (isKeyofC(domain)) {
                    return domain.keys
                } else if (isUnionC(domain)) {
                    var keys = domain.types.map(function (type) {
                        return getDomainKeys(type)
                    })
                    return keys.some(undefinedType.is)
                        ? undefined
                        : Object.assign.apply(Object, __spreadArrays([{}], keys))
                }
                return undefined
            }
            exports.getDomainKeys = getDomainKeys
            function nonEnumerableRecord(domain, codomain, name) {
                if (name === void 0) {
                    name = "{ [K in " + domain.name + "]: " + codomain.name + " }"
                }
                return new DictionaryType(
                    name,
                    function (u) {
                        if (exports.UnknownRecord.is(u)) {
                            return Object.keys(u).every(function (k) {
                                return domain.is(k) && codomain.is(u[k])
                            })
                        }
                        return isAnyC(codomain) && Array.isArray(u)
                    },
                    function (u, c) {
                        if (exports.UnknownRecord.is(u)) {
                            var a = {}
                            var errors = []
                            var keys = Object.keys(u)
                            var len = keys.length
                            var changed = false
                            for (var i = 0; i < len; i++) {
                                var k = keys[i]
                                var ok = u[k]
                                var domainResult = domain.validate(
                                    k,
                                    appendContext(c, k, domain, k),
                                )
                                if (Either_1.isLeft(domainResult)) {
                                    pushAll(errors, domainResult.left)
                                } else {
                                    var vk = domainResult.right
                                    changed = changed || vk !== k
                                    k = vk
                                    var codomainResult = codomain.validate(
                                        ok,
                                        appendContext(c, k, codomain, ok),
                                    )
                                    if (Either_1.isLeft(codomainResult)) {
                                        pushAll(errors, codomainResult.left)
                                    } else {
                                        var vok = codomainResult.right
                                        changed = changed || vok !== ok
                                        a[k] = vok
                                    }
                                }
                            }
                            return errors.length > 0
                                ? exports.failures(errors)
                                : exports.success(changed ? a : u)
                        }
                        if (isAnyC(codomain) && Array.isArray(u)) {
                            return exports.success(u)
                        }
                        return exports.failure(u, c)
                    },
                    domain.encode === exports.identity && codomain.encode === exports.identity
                        ? exports.identity
                        : function (a) {
                              var s = {}
                              var keys = Object.keys(a)
                              var len = keys.length
                              for (var i = 0; i < len; i++) {
                                  var k = keys[i]
                                  s[String(domain.encode(k))] = codomain.encode(a[k])
                              }
                              return s
                          },
                    domain,
                    codomain,
                )
            }
            function getUnionName(codecs) {
                return (
                    "(" +
                    codecs
                        .map(function (type) {
                            return type.name
                        })
                        .join(" | ") +
                    ")"
                )
            }
            /**
             * @internal
             */
            function mergeAll(base, us) {
                var equal = true
                var primitive = true
                var baseIsNotADictionary = !exports.UnknownRecord.is(base)
                for (var _i = 0, us_1 = us; _i < us_1.length; _i++) {
                    var u = us_1[_i]
                    if (u !== base) {
                        equal = false
                    }
                    if (exports.UnknownRecord.is(u)) {
                        primitive = false
                    }
                }
                if (equal) {
                    return base
                } else if (primitive) {
                    return us[us.length - 1]
                }
                var r = {}
                for (var _a = 0, us_2 = us; _a < us_2.length; _a++) {
                    var u = us_2[_a]
                    for (var k in u) {
                        if (!r.hasOwnProperty(k) || baseIsNotADictionary || u[k] !== base[k]) {
                            r[k] = u[k]
                        }
                    }
                }
                return r
            }
            exports.mergeAll = mergeAll
            function getProps(codec) {
                switch (codec._tag) {
                    case "RefinementType":
                    case "ReadonlyType":
                        return getProps(codec.type)
                    case "InterfaceType":
                    case "StrictType":
                    case "PartialType":
                        return codec.props
                    case "IntersectionType":
                        return codec.types.reduce(function (props, type) {
                            return Object.assign(props, getProps(type))
                        }, {})
                }
            }
            function stripKeys(o, props) {
                var keys = Object.getOwnPropertyNames(o)
                var shouldStrip = false
                var r = {}
                for (var i = 0; i < keys.length; i++) {
                    var key = keys[i]
                    if (!hasOwnProperty.call(props, key)) {
                        shouldStrip = true
                    } else {
                        r[key] = o[key]
                    }
                }
                return shouldStrip ? r : o
            }
            function getExactTypeName(codec) {
                if (isTypeC(codec)) {
                    return "{| " + getNameFromProps(codec.props) + " |}"
                } else if (isPartialC(codec)) {
                    return getPartialTypeName("{| " + getNameFromProps(codec.props) + " |}")
                }
                return "Exact<" + codec.name + ">"
            }
            function isNonEmpty(as) {
                return as.length > 0
            }
            /**
             * @internal
             */
            exports.emptyTags = {}
            function intersect(a, b) {
                var r = []
                for (var _i = 0, a_1 = a; _i < a_1.length; _i++) {
                    var v = a_1[_i]
                    if (b.indexOf(v) !== -1) {
                        r.push(v)
                    }
                }
                return r
            }
            function mergeTags(a, b) {
                if (a === exports.emptyTags) {
                    return b
                }
                if (b === exports.emptyTags) {
                    return a
                }
                var r = Object.assign({}, a)
                for (var k in b) {
                    if (a.hasOwnProperty(k)) {
                        var intersection_1 = intersect(a[k], b[k])
                        if (isNonEmpty(intersection_1)) {
                            r[k] = intersection_1
                        } else {
                            r = exports.emptyTags
                            break
                        }
                    } else {
                        r[k] = b[k]
                    }
                }
                return r
            }
            function intersectTags(a, b) {
                if (a === exports.emptyTags || b === exports.emptyTags) {
                    return exports.emptyTags
                }
                var r = exports.emptyTags
                for (var k in a) {
                    if (b.hasOwnProperty(k)) {
                        var intersection_2 = intersect(a[k], b[k])
                        if (intersection_2.length === 0) {
                            if (r === exports.emptyTags) {
                                r = {}
                            }
                            r[k] = a[k].concat(b[k])
                        }
                    }
                }
                return r
            }
            // tslint:disable-next-line: deprecation
            function isAnyC(codec) {
                return codec._tag === "AnyType"
            }
            function isLiteralC(codec) {
                return codec._tag === "LiteralType"
            }
            function isKeyofC(codec) {
                return codec._tag === "KeyofType"
            }
            function isTypeC(codec) {
                return codec._tag === "InterfaceType"
            }
            function isPartialC(codec) {
                return codec._tag === "PartialType"
            }
            // tslint:disable-next-line: deprecation
            function isStrictC(codec) {
                return codec._tag === "StrictType"
            }
            function isExactC(codec) {
                return codec._tag === "ExactType"
            }
            // tslint:disable-next-line: deprecation
            function isRefinementC(codec) {
                return codec._tag === "RefinementType"
            }
            function isIntersectionC(codec) {
                return codec._tag === "IntersectionType"
            }
            function isUnionC(codec) {
                return codec._tag === "UnionType"
            }
            function isRecursiveC(codec) {
                return codec._tag === "RecursiveType"
            }
            var lazyCodecs = []
            /**
             * @internal
             */
            function getTags(codec) {
                if (lazyCodecs.indexOf(codec) !== -1) {
                    return exports.emptyTags
                }
                if (isTypeC(codec) || isStrictC(codec)) {
                    var index = exports.emptyTags
                    // tslint:disable-next-line: forin
                    for (var k in codec.props) {
                        var prop = codec.props[k]
                        if (isLiteralC(prop)) {
                            if (index === exports.emptyTags) {
                                index = {}
                            }
                            index[k] = [prop.value]
                        }
                    }
                    return index
                } else if (isExactC(codec) || isRefinementC(codec)) {
                    return getTags(codec.type)
                } else if (isIntersectionC(codec)) {
                    return codec.types.reduce(function (tags, codec) {
                        return mergeTags(tags, getTags(codec))
                    }, exports.emptyTags)
                } else if (isUnionC(codec)) {
                    return codec.types.slice(1).reduce(function (tags, codec) {
                        return intersectTags(tags, getTags(codec))
                    }, getTags(codec.types[0]))
                } else if (isRecursiveC(codec)) {
                    lazyCodecs.push(codec)
                    var tags = getTags(codec.type)
                    lazyCodecs.pop()
                    return tags
                }
                return exports.emptyTags
            }
            exports.getTags = getTags
            /**
             * @internal
             */
            function getIndex(codecs) {
                var tags = getTags(codecs[0])
                var keys = Object.keys(tags)
                var len = codecs.length
                var _loop_1 = function (k) {
                    var all = tags[k].slice()
                    var index = [tags[k]]
                    for (var i = 1; i < len; i++) {
                        var codec = codecs[i]
                        var ctags = getTags(codec)
                        var values = ctags[k]
                        // tslint:disable-next-line: strict-type-predicates
                        if (values === undefined) {
                            return "continue-keys"
                        } else {
                            if (
                                values.some(function (v) {
                                    return all.indexOf(v) !== -1
                                })
                            ) {
                                return "continue-keys"
                            } else {
                                all.push.apply(all, values)
                                index.push(values)
                            }
                        }
                    }
                    return { value: [k, index] }
                }
                keys: for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                    var k = keys_1[_i]
                    var state_1 = _loop_1(k)
                    if (typeof state_1 === "object") return state_1.value
                    switch (state_1) {
                        case "continue-keys":
                            continue keys
                    }
                }
                return undefined
            }
            exports.getIndex = getIndex
            // -------------------------------------------------------------------------------------
            // primitives
            // -------------------------------------------------------------------------------------
            /**
             * @since 1.0.0
             */
            var NullType = /** @class */ (function (_super) {
                __extends(NullType, _super)
                function NullType() {
                    var _this =
                        _super.call(
                            this,
                            "null",
                            function (u) {
                                return u === null
                            },
                            function (u, c) {
                                return _this.is(u) ? exports.success(u) : exports.failure(u, c)
                            },
                            exports.identity,
                        ) || this
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "NullType"
                    return _this
                }
                return NullType
            })(Type)
            exports.NullType = NullType
            /**
             * @category primitives
             * @since 1.0.0
             */
            exports.nullType = new NullType()
            exports.null = exports.nullType
            /**
             * @since 1.0.0
             */
            var UndefinedType = /** @class */ (function (_super) {
                __extends(UndefinedType, _super)
                function UndefinedType() {
                    var _this =
                        _super.call(
                            this,
                            "undefined",
                            function (u) {
                                return u === void 0
                            },
                            function (u, c) {
                                return _this.is(u) ? exports.success(u) : exports.failure(u, c)
                            },
                            exports.identity,
                        ) || this
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "UndefinedType"
                    return _this
                }
                return UndefinedType
            })(Type)
            exports.UndefinedType = UndefinedType
            var undefinedType = new UndefinedType()
            exports.undefined = undefinedType
            /**
             * @since 1.2.0
             */
            var VoidType = /** @class */ (function (_super) {
                __extends(VoidType, _super)
                function VoidType() {
                    var _this =
                        _super.call(
                            this,
                            "void",
                            undefinedType.is,
                            undefinedType.validate,
                            exports.identity,
                        ) || this
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "VoidType"
                    return _this
                }
                return VoidType
            })(Type)
            exports.VoidType = VoidType
            /**
             * @category primitives
             * @since 1.2.0
             */
            exports.voidType = new VoidType()
            exports.void = exports.voidType
            /**
             * @since 1.5.0
             */
            var UnknownType = /** @class */ (function (_super) {
                __extends(UnknownType, _super)
                function UnknownType() {
                    var _this =
                        _super.call(
                            this,
                            "unknown",
                            function (_) {
                                return true
                            },
                            exports.success,
                            exports.identity,
                        ) || this
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "UnknownType"
                    return _this
                }
                return UnknownType
            })(Type)
            exports.UnknownType = UnknownType
            /**
             * @category primitives
             * @since 1.5.0
             */
            exports.unknown = new UnknownType()
            /**
             * @since 1.0.0
             */
            var StringType = /** @class */ (function (_super) {
                __extends(StringType, _super)
                function StringType() {
                    var _this =
                        _super.call(
                            this,
                            "string",
                            function (u) {
                                return typeof u === "string"
                            },
                            function (u, c) {
                                return _this.is(u) ? exports.success(u) : exports.failure(u, c)
                            },
                            exports.identity,
                        ) || this
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "StringType"
                    return _this
                }
                return StringType
            })(Type)
            exports.StringType = StringType
            /**
             * @category primitives
             * @since 1.0.0
             */
            exports.string = new StringType()
            /**
             * @since 1.0.0
             */
            var NumberType = /** @class */ (function (_super) {
                __extends(NumberType, _super)
                function NumberType() {
                    var _this =
                        _super.call(
                            this,
                            "number",
                            function (u) {
                                return typeof u === "number"
                            },
                            function (u, c) {
                                return _this.is(u) ? exports.success(u) : exports.failure(u, c)
                            },
                            exports.identity,
                        ) || this
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "NumberType"
                    return _this
                }
                return NumberType
            })(Type)
            exports.NumberType = NumberType
            /**
             * @category primitives
             * @since 1.0.0
             */
            exports.number = new NumberType()
            /**
             * @since 2.1.0
             */
            var BigIntType = /** @class */ (function (_super) {
                __extends(BigIntType, _super)
                function BigIntType() {
                    var _this =
                        _super.call(
                            this,
                            "bigint",
                            // tslint:disable-next-line: valid-typeof
                            function (u) {
                                return typeof u === "bigint"
                            },
                            function (u, c) {
                                return _this.is(u) ? exports.success(u) : exports.failure(u, c)
                            },
                            exports.identity,
                        ) || this
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "BigIntType"
                    return _this
                }
                return BigIntType
            })(Type)
            exports.BigIntType = BigIntType
            /**
             * @category primitives
             * @since 2.1.0
             */
            exports.bigint = new BigIntType()
            /**
             * @since 1.0.0
             */
            var BooleanType = /** @class */ (function (_super) {
                __extends(BooleanType, _super)
                function BooleanType() {
                    var _this =
                        _super.call(
                            this,
                            "boolean",
                            function (u) {
                                return typeof u === "boolean"
                            },
                            function (u, c) {
                                return _this.is(u) ? exports.success(u) : exports.failure(u, c)
                            },
                            exports.identity,
                        ) || this
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "BooleanType"
                    return _this
                }
                return BooleanType
            })(Type)
            exports.BooleanType = BooleanType
            /**
             * @category primitives
             * @since 1.0.0
             */
            exports.boolean = new BooleanType()
            /**
             * @since 1.0.0
             */
            var AnyArrayType = /** @class */ (function (_super) {
                __extends(AnyArrayType, _super)
                function AnyArrayType() {
                    var _this =
                        _super.call(
                            this,
                            "UnknownArray",
                            Array.isArray,
                            function (u, c) {
                                return _this.is(u) ? exports.success(u) : exports.failure(u, c)
                            },
                            exports.identity,
                        ) || this
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "AnyArrayType"
                    return _this
                }
                return AnyArrayType
            })(Type)
            exports.AnyArrayType = AnyArrayType
            /**
             * @category primitives
             * @since 1.7.1
             */
            exports.UnknownArray = new AnyArrayType()
            exports.Array = exports.UnknownArray
            /**
             * @since 1.0.0
             */
            var AnyDictionaryType = /** @class */ (function (_super) {
                __extends(AnyDictionaryType, _super)
                function AnyDictionaryType() {
                    var _this =
                        _super.call(
                            this,
                            "UnknownRecord",
                            function (u) {
                                var s = Object.prototype.toString.call(u)
                                return s === "[object Object]" || s === "[object Window]"
                            },
                            function (u, c) {
                                return _this.is(u) ? exports.success(u) : exports.failure(u, c)
                            },
                            exports.identity,
                        ) || this
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "AnyDictionaryType"
                    return _this
                }
                return AnyDictionaryType
            })(Type)
            exports.AnyDictionaryType = AnyDictionaryType
            /**
             * @category primitives
             * @since 1.7.1
             */
            exports.UnknownRecord = new AnyDictionaryType()
            /**
             * @since 1.0.0
             */
            var LiteralType = /** @class */ (function (_super) {
                __extends(LiteralType, _super)
                function LiteralType(name, is, validate, encode, value) {
                    var _this = _super.call(this, name, is, validate, encode) || this
                    _this.value = value
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "LiteralType"
                    return _this
                }
                return LiteralType
            })(Type)
            exports.LiteralType = LiteralType
            /**
             * @category constructors
             * @since 1.0.0
             */
            function literal(value, name) {
                if (name === void 0) {
                    name = JSON.stringify(value)
                }
                var is = function (u) {
                    return u === value
                }
                return new LiteralType(
                    name,
                    is,
                    function (u, c) {
                        return is(u) ? exports.success(value) : exports.failure(u, c)
                    },
                    exports.identity,
                    value,
                )
            }
            exports.literal = literal
            /**
             * @since 1.0.0
             */
            var KeyofType = /** @class */ (function (_super) {
                __extends(KeyofType, _super)
                function KeyofType(name, is, validate, encode, keys) {
                    var _this = _super.call(this, name, is, validate, encode) || this
                    _this.keys = keys
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "KeyofType"
                    return _this
                }
                return KeyofType
            })(Type)
            exports.KeyofType = KeyofType
            /**
             * @category constructors
             * @since 1.0.0
             */
            function keyof(keys, name) {
                if (name === void 0) {
                    name = Object.keys(keys)
                        .map(function (k) {
                            return JSON.stringify(k)
                        })
                        .join(" | ")
                }
                var is = function (u) {
                    return exports.string.is(u) && hasOwnProperty.call(keys, u)
                }
                return new KeyofType(
                    name,
                    is,
                    function (u, c) {
                        return is(u) ? exports.success(u) : exports.failure(u, c)
                    },
                    exports.identity,
                    keys,
                )
            }
            exports.keyof = keyof
            // -------------------------------------------------------------------------------------
            // combinators
            // -------------------------------------------------------------------------------------
            /**
             * @since 1.0.0
             */
            var RefinementType = /** @class */ (function (_super) {
                __extends(RefinementType, _super)
                function RefinementType(name, is, validate, encode, type, predicate) {
                    var _this = _super.call(this, name, is, validate, encode) || this
                    _this.type = type
                    _this.predicate = predicate
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "RefinementType"
                    return _this
                }
                return RefinementType
            })(Type)
            exports.RefinementType = RefinementType
            /**
             * @category combinators
             * @since 1.8.1
             */
            function brand(codec, predicate, name) {
                // tslint:disable-next-line: deprecation
                return refinement(codec, predicate, name)
            }
            exports.brand = brand
            /**
             * A branded codec representing an integer
             *
             * @category primitives
             * @since 1.8.1
             */
            exports.Int = brand(
                exports.number,
                function (n) {
                    return Number.isInteger(n)
                },
                "Int",
            )
            /**
             * @since 1.0.0
             */
            var RecursiveType = /** @class */ (function (_super) {
                __extends(RecursiveType, _super)
                function RecursiveType(name, is, validate, encode, runDefinition) {
                    var _this = _super.call(this, name, is, validate, encode) || this
                    _this.runDefinition = runDefinition
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "RecursiveType"
                    return _this
                }
                return RecursiveType
            })(Type)
            exports.RecursiveType = RecursiveType
            Object.defineProperty(RecursiveType.prototype, "type", {
                get: function () {
                    return this.runDefinition()
                },
                enumerable: true,
                configurable: true,
            })
            /**
             * @category combinators
             * @since 1.0.0
             */
            function recursion(name, definition) {
                var cache
                var runDefinition = function () {
                    if (!cache) {
                        cache = definition(Self)
                        cache.name = name
                    }
                    return cache
                }
                var Self = new RecursiveType(
                    name,
                    function (u) {
                        return runDefinition().is(u)
                    },
                    function (u, c) {
                        return runDefinition().validate(u, c)
                    },
                    function (a) {
                        return runDefinition().encode(a)
                    },
                    runDefinition,
                )
                return Self
            }
            exports.recursion = recursion
            /**
             * @since 1.0.0
             */
            var ArrayType = /** @class */ (function (_super) {
                __extends(ArrayType, _super)
                function ArrayType(name, is, validate, encode, type) {
                    var _this = _super.call(this, name, is, validate, encode) || this
                    _this.type = type
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "ArrayType"
                    return _this
                }
                return ArrayType
            })(Type)
            exports.ArrayType = ArrayType
            /**
             * @category combinators
             * @since 1.0.0
             */
            function array(item, name) {
                if (name === void 0) {
                    name = "Array<" + item.name + ">"
                }
                return new ArrayType(
                    name,
                    function (u) {
                        return exports.UnknownArray.is(u) && u.every(item.is)
                    },
                    function (u, c) {
                        var e = exports.UnknownArray.validate(u, c)
                        if (Either_1.isLeft(e)) {
                            return e
                        }
                        var us = e.right
                        var len = us.length
                        var as = us
                        var errors = []
                        for (var i = 0; i < len; i++) {
                            var ui = us[i]
                            var result = item.validate(ui, appendContext(c, String(i), item, ui))
                            if (Either_1.isLeft(result)) {
                                pushAll(errors, result.left)
                            } else {
                                var ai = result.right
                                if (ai !== ui) {
                                    if (as === us) {
                                        as = us.slice()
                                    }
                                    as[i] = ai
                                }
                            }
                        }
                        return errors.length > 0 ? exports.failures(errors) : exports.success(as)
                    },
                    item.encode === exports.identity
                        ? exports.identity
                        : function (a) {
                              return a.map(item.encode)
                          },
                    item,
                )
            }
            exports.array = array
            /**
             * @since 1.0.0
             */
            var InterfaceType = /** @class */ (function (_super) {
                __extends(InterfaceType, _super)
                function InterfaceType(name, is, validate, encode, props) {
                    var _this = _super.call(this, name, is, validate, encode) || this
                    _this.props = props
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "InterfaceType"
                    return _this
                }
                return InterfaceType
            })(Type)
            exports.InterfaceType = InterfaceType
            /**
             * @category combinators
             * @since 1.0.0
             */
            function type(props, name) {
                if (name === void 0) {
                    name = getInterfaceTypeName(props)
                }
                var keys = Object.keys(props)
                var types = keys.map(function (key) {
                    return props[key]
                })
                var len = keys.length
                return new InterfaceType(
                    name,
                    function (u) {
                        if (exports.UnknownRecord.is(u)) {
                            for (var i = 0; i < len; i++) {
                                var k = keys[i]
                                var uk = u[k]
                                if (
                                    (uk === undefined && !hasOwnProperty.call(u, k)) ||
                                    !types[i].is(uk)
                                ) {
                                    return false
                                }
                            }
                            return true
                        }
                        return false
                    },
                    function (u, c) {
                        var e = exports.UnknownRecord.validate(u, c)
                        if (Either_1.isLeft(e)) {
                            return e
                        }
                        var o = e.right
                        var a = o
                        var errors = []
                        for (var i = 0; i < len; i++) {
                            var k = keys[i]
                            var ak = a[k]
                            var type_1 = types[i]
                            var result = type_1.validate(ak, appendContext(c, k, type_1, ak))
                            if (Either_1.isLeft(result)) {
                                pushAll(errors, result.left)
                            } else {
                                var vak = result.right
                                if (
                                    vak !== ak ||
                                    (vak === undefined && !hasOwnProperty.call(a, k))
                                ) {
                                    /* istanbul ignore next */
                                    if (a === o) {
                                        a = __assign({}, o)
                                    }
                                    a[k] = vak
                                }
                            }
                        }
                        return errors.length > 0 ? exports.failures(errors) : exports.success(a)
                    },
                    useIdentity(types)
                        ? exports.identity
                        : function (a) {
                              var s = __assign({}, a)
                              for (var i = 0; i < len; i++) {
                                  var k = keys[i]
                                  var encode = types[i].encode
                                  if (encode !== exports.identity) {
                                      s[k] = encode(a[k])
                                  }
                              }
                              return s
                          },
                    props,
                )
            }
            exports.type = type
            exports.interface = type
            /**
             * @since 1.0.0
             */
            var PartialType = /** @class */ (function (_super) {
                __extends(PartialType, _super)
                function PartialType(name, is, validate, encode, props) {
                    var _this = _super.call(this, name, is, validate, encode) || this
                    _this.props = props
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "PartialType"
                    return _this
                }
                return PartialType
            })(Type)
            exports.PartialType = PartialType
            /**
             * @category combinators
             * @since 1.0.0
             */
            function partial(props, name) {
                if (name === void 0) {
                    name = getPartialTypeName(getInterfaceTypeName(props))
                }
                var keys = Object.keys(props)
                var types = keys.map(function (key) {
                    return props[key]
                })
                var len = keys.length
                return new PartialType(
                    name,
                    function (u) {
                        if (exports.UnknownRecord.is(u)) {
                            for (var i = 0; i < len; i++) {
                                var k = keys[i]
                                var uk = u[k]
                                if (uk !== undefined && !props[k].is(uk)) {
                                    return false
                                }
                            }
                            return true
                        }
                        return false
                    },
                    function (u, c) {
                        var e = exports.UnknownRecord.validate(u, c)
                        if (Either_1.isLeft(e)) {
                            return e
                        }
                        var o = e.right
                        var a = o
                        var errors = []
                        for (var i = 0; i < len; i++) {
                            var k = keys[i]
                            var ak = a[k]
                            var type_2 = props[k]
                            var result = type_2.validate(ak, appendContext(c, k, type_2, ak))
                            if (Either_1.isLeft(result)) {
                                if (ak !== undefined) {
                                    pushAll(errors, result.left)
                                }
                            } else {
                                var vak = result.right
                                if (vak !== ak) {
                                    /* istanbul ignore next */
                                    if (a === o) {
                                        a = __assign({}, o)
                                    }
                                    a[k] = vak
                                }
                            }
                        }
                        return errors.length > 0 ? exports.failures(errors) : exports.success(a)
                    },
                    useIdentity(types)
                        ? exports.identity
                        : function (a) {
                              var s = __assign({}, a)
                              for (var i = 0; i < len; i++) {
                                  var k = keys[i]
                                  var ak = a[k]
                                  if (ak !== undefined) {
                                      s[k] = types[i].encode(ak)
                                  }
                              }
                              return s
                          },
                    props,
                )
            }
            exports.partial = partial
            /**
             * @since 1.0.0
             */
            var DictionaryType = /** @class */ (function (_super) {
                __extends(DictionaryType, _super)
                function DictionaryType(name, is, validate, encode, domain, codomain) {
                    var _this = _super.call(this, name, is, validate, encode) || this
                    _this.domain = domain
                    _this.codomain = codomain
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "DictionaryType"
                    return _this
                }
                return DictionaryType
            })(Type)
            exports.DictionaryType = DictionaryType
            /**
             * @category combinators
             * @since 1.7.1
             */
            function record(domain, codomain, name) {
                var keys = getDomainKeys(domain)
                return keys
                    ? enumerableRecord(Object.keys(keys), domain, codomain, name)
                    : nonEnumerableRecord(domain, codomain, name)
            }
            exports.record = record
            /**
             * @since 1.0.0
             */
            var UnionType = /** @class */ (function (_super) {
                __extends(UnionType, _super)
                function UnionType(name, is, validate, encode, types) {
                    var _this = _super.call(this, name, is, validate, encode) || this
                    _this.types = types
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "UnionType"
                    return _this
                }
                return UnionType
            })(Type)
            exports.UnionType = UnionType
            /**
             * @category combinators
             * @since 1.0.0
             */
            function union(codecs, name) {
                if (name === void 0) {
                    name = getUnionName(codecs)
                }
                var index = getIndex(codecs)
                if (index !== undefined && codecs.length > 0) {
                    var tag_1 = index[0],
                        groups_1 = index[1]
                    var len_1 = groups_1.length
                    var find_1 = function (value) {
                        for (var i = 0; i < len_1; i++) {
                            if (groups_1[i].indexOf(value) !== -1) {
                                return i
                            }
                        }
                        return undefined
                    }
                    // tslint:disable-next-line: deprecation
                    return new TaggedUnionType(
                        name,
                        function (u) {
                            if (exports.UnknownRecord.is(u)) {
                                var i = find_1(u[tag_1])
                                return i !== undefined ? codecs[i].is(u) : false
                            }
                            return false
                        },
                        function (u, c) {
                            var e = exports.UnknownRecord.validate(u, c)
                            if (Either_1.isLeft(e)) {
                                return e
                            }
                            var r = e.right
                            var i = find_1(r[tag_1])
                            if (i === undefined) {
                                return exports.failure(u, c)
                            }
                            var codec = codecs[i]
                            return codec.validate(r, appendContext(c, String(i), codec, r))
                        },
                        useIdentity(codecs)
                            ? exports.identity
                            : function (a) {
                                  var i = find_1(a[tag_1])
                                  if (i === undefined) {
                                      // https://github.com/gcanti/io-ts/pull/305
                                      throw new Error(
                                          "no codec found to encode value in union codec " + name,
                                      )
                                  } else {
                                      return codecs[i].encode(a)
                                  }
                              },
                        codecs,
                        tag_1,
                    )
                } else {
                    return new UnionType(
                        name,
                        function (u) {
                            return codecs.some(function (type) {
                                return type.is(u)
                            })
                        },
                        function (u, c) {
                            var errors = []
                            for (var i = 0; i < codecs.length; i++) {
                                var codec = codecs[i]
                                var result = codec.validate(
                                    u,
                                    appendContext(c, String(i), codec, u),
                                )
                                if (Either_1.isLeft(result)) {
                                    pushAll(errors, result.left)
                                } else {
                                    return exports.success(result.right)
                                }
                            }
                            return exports.failures(errors)
                        },
                        useIdentity(codecs)
                            ? exports.identity
                            : function (a) {
                                  for (var _i = 0, codecs_1 = codecs; _i < codecs_1.length; _i++) {
                                      var codec = codecs_1[_i]
                                      if (codec.is(a)) {
                                          return codec.encode(a)
                                      }
                                  }
                                  // https://github.com/gcanti/io-ts/pull/305
                                  throw new Error(
                                      "no codec found to encode value in union type " + name,
                                  )
                              },
                        codecs,
                    )
                }
            }
            exports.union = union
            /**
             * @since 1.0.0
             */
            var IntersectionType = /** @class */ (function (_super) {
                __extends(IntersectionType, _super)
                function IntersectionType(name, is, validate, encode, types) {
                    var _this = _super.call(this, name, is, validate, encode) || this
                    _this.types = types
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "IntersectionType"
                    return _this
                }
                return IntersectionType
            })(Type)
            exports.IntersectionType = IntersectionType
            function intersection(codecs, name) {
                if (name === void 0) {
                    name =
                        "(" +
                        codecs
                            .map(function (type) {
                                return type.name
                            })
                            .join(" & ") +
                        ")"
                }
                var len = codecs.length
                return new IntersectionType(
                    name,
                    function (u) {
                        return codecs.every(function (type) {
                            return type.is(u)
                        })
                    },
                    codecs.length === 0
                        ? exports.success
                        : function (u, c) {
                              var us = []
                              var errors = []
                              for (var i = 0; i < len; i++) {
                                  var codec = codecs[i]
                                  var result = codec.validate(
                                      u,
                                      appendContext(c, String(i), codec, u),
                                  )
                                  if (Either_1.isLeft(result)) {
                                      pushAll(errors, result.left)
                                  } else {
                                      us.push(result.right)
                                  }
                              }
                              return errors.length > 0
                                  ? exports.failures(errors)
                                  : exports.success(mergeAll(u, us))
                          },
                    codecs.length === 0
                        ? exports.identity
                        : function (a) {
                              return mergeAll(
                                  a,
                                  codecs.map(function (codec) {
                                      return codec.encode(a)
                                  }),
                              )
                          },
                    codecs,
                )
            }
            exports.intersection = intersection
            /**
             * @since 1.0.0
             */
            var TupleType = /** @class */ (function (_super) {
                __extends(TupleType, _super)
                function TupleType(name, is, validate, encode, types) {
                    var _this = _super.call(this, name, is, validate, encode) || this
                    _this.types = types
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "TupleType"
                    return _this
                }
                return TupleType
            })(Type)
            exports.TupleType = TupleType
            function tuple(codecs, name) {
                if (name === void 0) {
                    name =
                        "[" +
                        codecs
                            .map(function (type) {
                                return type.name
                            })
                            .join(", ") +
                        "]"
                }
                var len = codecs.length
                return new TupleType(
                    name,
                    function (u) {
                        return (
                            exports.UnknownArray.is(u) &&
                            u.length === len &&
                            codecs.every(function (type, i) {
                                return type.is(u[i])
                            })
                        )
                    },
                    function (u, c) {
                        var e = exports.UnknownArray.validate(u, c)
                        if (Either_1.isLeft(e)) {
                            return e
                        }
                        var us = e.right
                        var as = us.length > len ? us.slice(0, len) : us // strip additional components
                        var errors = []
                        for (var i = 0; i < len; i++) {
                            var a = us[i]
                            var type_3 = codecs[i]
                            var result = type_3.validate(a, appendContext(c, String(i), type_3, a))
                            if (Either_1.isLeft(result)) {
                                pushAll(errors, result.left)
                            } else {
                                var va = result.right
                                if (va !== a) {
                                    /* istanbul ignore next */
                                    if (as === us) {
                                        as = us.slice()
                                    }
                                    as[i] = va
                                }
                            }
                        }
                        return errors.length > 0 ? exports.failures(errors) : exports.success(as)
                    },
                    useIdentity(codecs)
                        ? exports.identity
                        : function (a) {
                              return codecs.map(function (type, i) {
                                  return type.encode(a[i])
                              })
                          },
                    codecs,
                )
            }
            exports.tuple = tuple
            /**
             * @since 1.0.0
             */
            var ReadonlyType = /** @class */ (function (_super) {
                __extends(ReadonlyType, _super)
                function ReadonlyType(name, is, validate, encode, type) {
                    var _this = _super.call(this, name, is, validate, encode) || this
                    _this.type = type
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "ReadonlyType"
                    return _this
                }
                return ReadonlyType
            })(Type)
            exports.ReadonlyType = ReadonlyType
            /**
             * @category combinators
             * @since 1.0.0
             */
            function readonly(codec, name) {
                if (name === void 0) {
                    name = "Readonly<" + codec.name + ">"
                }
                return new ReadonlyType(name, codec.is, codec.validate, codec.encode, codec)
            }
            exports.readonly = readonly
            /**
             * @since 1.0.0
             */
            var ReadonlyArrayType = /** @class */ (function (_super) {
                __extends(ReadonlyArrayType, _super)
                function ReadonlyArrayType(name, is, validate, encode, type) {
                    var _this = _super.call(this, name, is, validate, encode) || this
                    _this.type = type
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "ReadonlyArrayType"
                    return _this
                }
                return ReadonlyArrayType
            })(Type)
            exports.ReadonlyArrayType = ReadonlyArrayType
            /**
             * @category combinators
             * @since 1.0.0
             */
            function readonlyArray(item, name) {
                if (name === void 0) {
                    name = "ReadonlyArray<" + item.name + ">"
                }
                var codec = array(item)
                return new ReadonlyArrayType(name, codec.is, codec.validate, codec.encode, item)
            }
            exports.readonlyArray = readonlyArray
            /**
             * Strips additional properties, equivalent to `exact(type(props))`.
             *
             * @category combinators
             * @since 1.0.0
             */
            var strict = function (props, name) {
                return exact(type(props), name)
            }
            exports.strict = strict
            /**
             * @since 1.1.0
             */
            var ExactType = /** @class */ (function (_super) {
                __extends(ExactType, _super)
                function ExactType(name, is, validate, encode, type) {
                    var _this = _super.call(this, name, is, validate, encode) || this
                    _this.type = type
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "ExactType"
                    return _this
                }
                return ExactType
            })(Type)
            exports.ExactType = ExactType
            /**
             * Strips additional properties.
             *
             * @category combinators
             * @since 1.1.0
             */
            function exact(codec, name) {
                if (name === void 0) {
                    name = getExactTypeName(codec)
                }
                var props = getProps(codec)
                return new ExactType(
                    name,
                    codec.is,
                    function (u, c) {
                        var e = exports.UnknownRecord.validate(u, c)
                        if (Either_1.isLeft(e)) {
                            return e
                        }
                        var ce = codec.validate(u, c)
                        if (Either_1.isLeft(ce)) {
                            return ce
                        }
                        return Either_1.right(stripKeys(ce.right, props))
                    },
                    function (a) {
                        return codec.encode(stripKeys(a, props))
                    },
                    codec,
                )
            }
            exports.exact = exact
            // -------------------------------------------------------------------------------------
            // deprecated
            // -------------------------------------------------------------------------------------
            /**
             * @since 1.0.0
             * @deprecated
             */
            var FunctionType = /** @class */ (function (_super) {
                __extends(FunctionType, _super)
                function FunctionType() {
                    var _this =
                        _super.call(
                            this,
                            "Function",
                            // tslint:disable-next-line:strict-type-predicates
                            function (u) {
                                return typeof u === "function"
                            },
                            function (u, c) {
                                return _this.is(u) ? exports.success(u) : exports.failure(u, c)
                            },
                            exports.identity,
                        ) || this
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "FunctionType"
                    return _this
                }
                return FunctionType
            })(Type)
            exports.FunctionType = FunctionType
            /**
             * @category primitives
             * @since 1.0.0
             * @deprecated
             */
            // tslint:disable-next-line: deprecation
            exports.Function = new FunctionType()
            /**
             * @since 1.3.0
             * @deprecated
             */
            var TaggedUnionType = /** @class */ (function (_super) {
                __extends(TaggedUnionType, _super)
                function TaggedUnionType(
                    name,
                    // tslint:disable-next-line: deprecation
                    is,
                    // tslint:disable-next-line: deprecation
                    validate,
                    // tslint:disable-next-line: deprecation
                    encode,
                    codecs,
                    tag,
                ) {
                    var _this =
                        _super.call(
                            this,
                            name,
                            is,
                            validate,
                            encode,
                            codecs,
                        ) /* istanbul ignore next */ || this // <= workaround for https://github.com/Microsoft/TypeScript/issues/13455
                    _this.tag = tag
                    return _this
                }
                return TaggedUnionType
            })(UnionType)
            exports.TaggedUnionType = TaggedUnionType
            /**
             * Use `union` instead.
             *
             * @category combinators
             * @since 1.3.0
             * @deprecated
             */
            var taggedUnion = function (
                tag,
                codecs,
                name,
                // tslint:disable-next-line: deprecation
            ) {
                if (name === void 0) {
                    name = getUnionName(codecs)
                }
                var U = union(codecs, name)
                // tslint:disable-next-line: deprecation
                if (U instanceof TaggedUnionType) {
                    return U
                } else {
                    console.warn(
                        "[io-ts] Cannot build a tagged union for " +
                            name +
                            ", returning a de-optimized union",
                    )
                    // tslint:disable-next-line: deprecation
                    return new TaggedUnionType(name, U.is, U.validate, U.encode, codecs, tag)
                }
            }
            exports.taggedUnion = taggedUnion
            /**
             * @since 1.0.0
             * @deprecated
             */
            var getValidationError /* istanbul ignore next */ = function (value, context) {
                return {
                    value: value,
                    context: context,
                }
            }
            exports.getValidationError /* istanbul ignore next */ = getValidationError
            /**
             * @since 1.0.0
             * @deprecated
             */
            var getDefaultContext /* istanbul ignore next */ = function (decoder) {
                return [{ key: "", type: decoder }]
            }
            exports.getDefaultContext /* istanbul ignore next */ = getDefaultContext
            /**
             * @since 1.0.0
             * @deprecated
             */
            var NeverType = /** @class */ (function (_super) {
                __extends(NeverType, _super)
                function NeverType() {
                    var _this =
                        _super.call(
                            this,
                            "never",
                            function (_) {
                                return false
                            },
                            function (u, c) {
                                return exports.failure(u, c)
                            },
                            /* istanbul ignore next */
                            function () {
                                throw new Error("cannot encode never")
                            },
                        ) || this
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "NeverType"
                    return _this
                }
                return NeverType
            })(Type)
            exports.NeverType = NeverType
            /**
             * @category primitives
             * @since 1.0.0
             * @deprecated
             */
            // tslint:disable-next-line: deprecation
            exports.never = new NeverType()
            /**
             * @since 1.0.0
             * @deprecated
             */
            var AnyType = /** @class */ (function (_super) {
                __extends(AnyType, _super)
                function AnyType() {
                    var _this =
                        _super.call(
                            this,
                            "any",
                            function (_) {
                                return true
                            },
                            exports.success,
                            exports.identity,
                        ) || this
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "AnyType"
                    return _this
                }
                return AnyType
            })(Type)
            exports.AnyType = AnyType
            /**
             * Use `unknown` instead.
             *
             * @category primitives
             * @since 1.0.0
             * @deprecated
             */
            // tslint:disable-next-line: deprecation
            exports.any = new AnyType()
            /**
             * Use `UnknownRecord` instead.
             *
             * @category primitives
             * @since 1.0.0
             * @deprecated
             */
            exports.Dictionary = exports.UnknownRecord
            /**
             * @since 1.0.0
             * @deprecated
             */
            var ObjectType = /** @class */ (function (_super) {
                __extends(ObjectType, _super)
                function ObjectType() {
                    var _this =
                        _super.call(
                            this,
                            "object",
                            function (u) {
                                return u !== null && typeof u === "object"
                            },
                            function (u, c) {
                                return _this.is(u) ? exports.success(u) : exports.failure(u, c)
                            },
                            exports.identity,
                        ) || this
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "ObjectType"
                    return _this
                }
                return ObjectType
            })(Type)
            exports.ObjectType = ObjectType
            /**
             * Use `UnknownRecord` instead.
             *
             * @category primitives
             * @since 1.0.0
             * @deprecated
             */
            // tslint:disable-next-line: deprecation
            exports.object = new ObjectType()
            /**
             * Use `brand` instead.
             *
             * @category combinators
             * @since 1.0.0
             * @deprecated
             */
            function refinement(codec, predicate, name) {
                if (name === void 0) {
                    name = "(" + codec.name + " | " + getFunctionName(predicate) + ")"
                }
                return new RefinementType(
                    name,
                    function (u) {
                        return codec.is(u) && predicate(u)
                    },
                    function (i, c) {
                        var e = codec.validate(i, c)
                        if (Either_1.isLeft(e)) {
                            return e
                        }
                        var a = e.right
                        return predicate(a) ? exports.success(a) : exports.failure(a, c)
                    },
                    codec.encode,
                    codec,
                    predicate,
                )
            }
            exports.refinement = refinement
            /**
             * Use `Int` instead.
             *
             * @category primitives
             * @since 1.0.0
             * @deprecated
             */
            // tslint:disable-next-line: deprecation
            exports.Integer = refinement(exports.number, Number.isInteger, "Integer")
            /**
             * Use `record` instead.
             *
             * @category combinators
             * @since 1.0.0
             * @deprecated
             */
            exports.dictionary = record
            /**
             * @since 1.0.0
             * @deprecated
             */
            var StrictType = /** @class */ (function (_super) {
                __extends(StrictType, _super)
                function StrictType(
                    name,
                    // tslint:disable-next-line: deprecation
                    is,
                    // tslint:disable-next-line: deprecation
                    validate,
                    // tslint:disable-next-line: deprecation
                    encode,
                    props,
                ) {
                    var _this = _super.call(this, name, is, validate, encode) || this
                    _this.props = props
                    /**
                     * @since 1.0.0
                     */
                    _this._tag = "StrictType"
                    return _this
                }
                return StrictType
            })(Type)
            exports.StrictType = StrictType
            /**
             * Drops the codec "kind".
             *
             * @category combinators
             * @since 1.1.0
             * @deprecated
             */
            function clean(codec) {
                return codec
            }
            exports.clean = clean
            function alias(codec) {
                return function () {
                    return codec
                }
            }
            exports.alias = alias

            /***/
        },

        /***/ 900: /***/ (module) => {
            /**
             * Helpers.
             */

            var s = 1000
            var m = s * 60
            var h = m * 60
            var d = h * 24
            var w = d * 7
            var y = d * 365.25

            /**
             * Parse or format the given `val`.
             *
             * Options:
             *
             *  - `long` verbose formatting [false]
             *
             * @param {String|Number} val
             * @param {Object} [options]
             * @throws {Error} throw an error if val is not a non-empty string or a number
             * @return {String|Number}
             * @api public
             */

            module.exports = function (val, options) {
                options = options || {}
                var type = typeof val
                if (type === "string" && val.length > 0) {
                    return parse(val)
                } else if (type === "number" && isFinite(val)) {
                    return options.long ? fmtLong(val) : fmtShort(val)
                }
                throw new Error(
                    "val is not a non-empty string or a valid number. val=" + JSON.stringify(val),
                )
            }

            /**
             * Parse the given `str` and return milliseconds.
             *
             * @param {String} str
             * @return {Number}
             * @api private
             */

            function parse(str) {
                str = String(str)
                if (str.length > 100) {
                    return
                }
                var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
                    str,
                )
                if (!match) {
                    return
                }
                var n = parseFloat(match[1])
                var type = (match[2] || "ms").toLowerCase()
                switch (type) {
                    case "years":
                    case "year":
                    case "yrs":
                    case "yr":
                    case "y":
                        return n * y
                    case "weeks":
                    case "week":
                    case "w":
                        return n * w
                    case "days":
                    case "day":
                    case "d":
                        return n * d
                    case "hours":
                    case "hour":
                    case "hrs":
                    case "hr":
                    case "h":
                        return n * h
                    case "minutes":
                    case "minute":
                    case "mins":
                    case "min":
                    case "m":
                        return n * m
                    case "seconds":
                    case "second":
                    case "secs":
                    case "sec":
                    case "s":
                        return n * s
                    case "milliseconds":
                    case "millisecond":
                    case "msecs":
                    case "msec":
                    case "ms":
                        return n
                    default:
                        return undefined
                }
            }

            /**
             * Short format for `ms`.
             *
             * @param {Number} ms
             * @return {String}
             * @api private
             */

            function fmtShort(ms) {
                var msAbs = Math.abs(ms)
                if (msAbs >= d) {
                    return Math.round(ms / d) + "d"
                }
                if (msAbs >= h) {
                    return Math.round(ms / h) + "h"
                }
                if (msAbs >= m) {
                    return Math.round(ms / m) + "m"
                }
                if (msAbs >= s) {
                    return Math.round(ms / s) + "s"
                }
                return ms + "ms"
            }

            /**
             * Long format for `ms`.
             *
             * @param {Number} ms
             * @return {String}
             * @api private
             */

            function fmtLong(ms) {
                var msAbs = Math.abs(ms)
                if (msAbs >= d) {
                    return plural(ms, msAbs, d, "day")
                }
                if (msAbs >= h) {
                    return plural(ms, msAbs, h, "hour")
                }
                if (msAbs >= m) {
                    return plural(ms, msAbs, m, "minute")
                }
                if (msAbs >= s) {
                    return plural(ms, msAbs, s, "second")
                }
                return ms + " ms"
            }

            /**
             * Pluralization helper.
             */

            function plural(ms, msAbs, n, name) {
                var isPlural = msAbs >= n * 1.5
                return Math.round(ms / n) + " " + name + (isPlural ? "s" : "")
            }

            /***/
        },

        /***/ 9318: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
            "use strict"

            const os = __nccwpck_require__(2087)
            const hasFlag = __nccwpck_require__(1621)

            const env = process.env

            let forceColor
            if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false")) {
                forceColor = false
            } else if (
                hasFlag("color") ||
                hasFlag("colors") ||
                hasFlag("color=true") ||
                hasFlag("color=always")
            ) {
                forceColor = true
            }
            if ("FORCE_COLOR" in env) {
                forceColor = env.FORCE_COLOR.length === 0 || parseInt(env.FORCE_COLOR, 10) !== 0
            }

            function translateLevel(level) {
                if (level === 0) {
                    return false
                }

                return {
                    level,
                    hasBasic: true,
                    has256: level >= 2,
                    has16m: level >= 3,
                }
            }

            function supportsColor(stream) {
                if (forceColor === false) {
                    return 0
                }

                if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
                    return 3
                }

                if (hasFlag("color=256")) {
                    return 2
                }

                if (stream && !stream.isTTY && forceColor !== true) {
                    return 0
                }

                const min = forceColor ? 1 : 0

                if (process.platform === "win32") {
                    // Node.js 7.5.0 is the first version of Node.js to include a patch to
                    // libuv that enables 256 color output on Windows. Anything earlier and it
                    // won't work. However, here we target Node.js 8 at minimum as it is an LTS
                    // release, and Node.js 7 is not. Windows 10 build 10586 is the first Windows
                    // release that supports 256 colors. Windows 10 build 14931 is the first release
                    // that supports 16m/TrueColor.
                    const osRelease = os.release().split(".")
                    if (
                        Number(process.versions.node.split(".")[0]) >= 8 &&
                        Number(osRelease[0]) >= 10 &&
                        Number(osRelease[2]) >= 10586
                    ) {
                        return Number(osRelease[2]) >= 14931 ? 3 : 2
                    }

                    return 1
                }

                if ("CI" in env) {
                    if (
                        ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI"].some(
                            (sign) => sign in env,
                        ) ||
                        env.CI_NAME === "codeship"
                    ) {
                        return 1
                    }

                    return min
                }

                if ("TEAMCITY_VERSION" in env) {
                    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0
                }

                if (env.COLORTERM === "truecolor") {
                    return 3
                }

                if ("TERM_PROGRAM" in env) {
                    const version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10)

                    switch (env.TERM_PROGRAM) {
                        case "iTerm.app":
                            return version >= 3 ? 3 : 2
                        case "Apple_Terminal":
                            return 2
                        // No default
                    }
                }

                if (/-256(color)?$/i.test(env.TERM)) {
                    return 2
                }

                if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
                    return 1
                }

                if ("COLORTERM" in env) {
                    return 1
                }

                if (env.TERM === "dumb") {
                    return min
                }

                return min
            }

            function getSupportLevel(stream) {
                const level = supportsColor(stream)
                return translateLevel(level)
            }

            module.exports = {
                supportsColor: getSupportLevel,
                stdout: getSupportLevel(process.stdout),
                stderr: getSupportLevel(process.stderr),
            }

            /***/
        },

        /***/ 4970: /***/ (__unused_webpack_module, exports, __nccwpck_require__) => {
            "use strict"

            Object.defineProperty(exports, "__esModule", { value: true })
            exports.createClient = void 0
            const request_1 = __nccwpck_require__(438)
            const createClient = (config) => {
                return {
                    delete: async (request) =>
                        (0, request_1.httpDelete)({
                            ...config,
                            ...request,
                        }),
                    get: async (request) =>
                        (0, request_1.httpGet)({
                            ...config,
                            ...request,
                        }),
                    options: async (request) =>
                        (0, request_1.httpOptions)({
                            ...config,
                            ...request,
                        }),
                    patch: async (request) =>
                        (0, request_1.httpPatch)({
                            ...config,
                            ...request,
                        }),
                    post: async (request) =>
                        (0, request_1.httpPost)({
                            ...config,
                            ...request,
                        }),
                    put: async (request) =>
                        (0, request_1.httpPut)({
                            ...config,
                            ...request,
                        }),
                }
            }
            exports.createClient = createClient

            /***/
        },

        /***/ 7113: /***/ function (__unused_webpack_module, exports, __nccwpck_require__) {
            "use strict"

            var __createBinding =
                (this && this.__createBinding) ||
                (Object.create
                    ? function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          Object.defineProperty(o, k2, {
                              enumerable: true,
                              get: function () {
                                  return m[k]
                              },
                          })
                      }
                    : function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          o[k2] = m[k]
                      })
            var __setModuleDefault =
                (this && this.__setModuleDefault) ||
                (Object.create
                    ? function (o, v) {
                          Object.defineProperty(o, "default", { enumerable: true, value: v })
                      }
                    : function (o, v) {
                          o["default"] = v
                      })
            var __importStar =
                (this && this.__importStar) ||
                function (mod) {
                    if (mod && mod.__esModule) return mod
                    var result = {}
                    if (mod != null)
                        for (var k in mod)
                            if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
                                __createBinding(result, mod, k)
                    __setModuleDefault(result, mod)
                    return result
                }
            var __importDefault =
                (this && this.__importDefault) ||
                function (mod) {
                    return mod && mod.__esModule ? mod : { default: mod }
                }
            Object.defineProperty(exports, "__esModule", { value: true })
            exports.decode = void 0
            const E = __importStar(__nccwpck_require__(7534))
            const io_ts_reporters_1 = __importDefault(__nccwpck_require__(51))
            const decode = (data, url, decoder) => {
                const result = decoder.decode(data)
                if (E.isLeft(result)) {
                    throw {
                        url,
                        errors: io_ts_reporters_1.default.report(result),
                    }
                }
            }
            exports.decode = decode

            /***/
        },

        /***/ 6144: /***/ function (__unused_webpack_module, exports, __nccwpck_require__) {
            "use strict"

            var __createBinding =
                (this && this.__createBinding) ||
                (Object.create
                    ? function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          Object.defineProperty(o, k2, {
                              enumerable: true,
                              get: function () {
                                  return m[k]
                              },
                          })
                      }
                    : function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k
                          o[k2] = m[k]
                      })
            var __exportStar =
                (this && this.__exportStar) ||
                function (m, exports) {
                    for (var p in m)
                        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p))
                            __createBinding(exports, m, p)
                }
            Object.defineProperty(exports, "__esModule", { value: true })
            __exportStar(__nccwpck_require__(4970), exports)
            __exportStar(__nccwpck_require__(438), exports)
            __exportStar(__nccwpck_require__(5077), exports)

            /***/
        },

        /***/ 438: /***/ function (__unused_webpack_module, exports, __nccwpck_require__) {
            "use strict"

            var __importDefault =
                (this && this.__importDefault) ||
                function (mod) {
                    return mod && mod.__esModule ? mod : { default: mod }
                }
            Object.defineProperty(exports, "__esModule", { value: true })
            exports.httpPut = exports.httpPost = exports.httpPatch = exports.httpOptions = exports.httpGet = exports.httpDelete = exports.httpRequest = void 0
            const axios_1 = __importDefault(__nccwpck_require__(6545))
            const decode_1 = __nccwpck_require__(7113)
            const httpRequest = async (config) => {
                return await axios_1.default.request(config).then((response) => {
                    if (config.decoder) {
                        ;(0, decode_1.decode)(response.data, config.url, config.decoder)
                    }
                    return response
                })
            }
            exports.httpRequest = httpRequest
            const httpDelete = async (request) =>
                (0, exports.httpRequest)({
                    ...request,
                    method: "DELETE",
                })
            exports.httpDelete = httpDelete
            const httpGet = async (request) =>
                (0, exports.httpRequest)({
                    ...request,
                    method: "GET",
                })
            exports.httpGet = httpGet
            const httpOptions = async (request) =>
                (0, exports.httpRequest)({
                    ...request,
                    method: "OPTIONS",
                })
            exports.httpOptions = httpOptions
            const httpPatch = async (request) =>
                (0, exports.httpRequest)({
                    ...request,
                    method: "PATCH",
                })
            exports.httpPatch = httpPatch
            const httpPost = async (request) =>
                (0, exports.httpRequest)({
                    ...request,
                    method: "POST",
                })
            exports.httpPost = httpPost
            const httpPut = async (request) =>
                (0, exports.httpRequest)({
                    ...request,
                    method: "PUT",
                })
            exports.httpPut = httpPut

            /***/
        },

        /***/ 5077: /***/ (__unused_webpack_module, exports) => {
            "use strict"

            Object.defineProperty(exports, "__esModule", { value: true })

            /***/
        },

        /***/ 2357: /***/ (module) => {
            "use strict"
            module.exports = require("assert")

            /***/
        },

        /***/ 8605: /***/ (module) => {
            "use strict"
            module.exports = require("http")

            /***/
        },

        /***/ 7211: /***/ (module) => {
            "use strict"
            module.exports = require("https")

            /***/
        },

        /***/ 2087: /***/ (module) => {
            "use strict"
            module.exports = require("os")

            /***/
        },

        /***/ 2413: /***/ (module) => {
            "use strict"
            module.exports = require("stream")

            /***/
        },

        /***/ 3867: /***/ (module) => {
            "use strict"
            module.exports = require("tty")

            /***/
        },

        /***/ 8835: /***/ (module) => {
            "use strict"
            module.exports = require("url")

            /***/
        },

        /***/ 1669: /***/ (module) => {
            "use strict"
            module.exports = require("util")

            /***/
        },

        /***/ 8761: /***/ (module) => {
            "use strict"
            module.exports = require("zlib")

            /***/
        },

        /******/
    } // The module cache
    /************************************************************************/
    /******/ /******/ var __webpack_module_cache__ = {} // The require function
    /******/

    /******/ /******/ function __nccwpck_require__(moduleId) {
        /******/ // Check if module is in cache
        /******/ var cachedModule = __webpack_module_cache__[moduleId]
        /******/ if (cachedModule !== undefined) {
            /******/ return cachedModule.exports
            /******/
        } // Create a new module (and put it into the cache)
        /******/ /******/ var module = (__webpack_module_cache__[moduleId] = {
            /******/ // no module.id needed
            /******/ // no module.loaded needed
            /******/ exports: {},
            /******/
        }) // Execute the module function
        /******/

        /******/ /******/ var threw = true
        /******/ try {
            /******/ __webpack_modules__[moduleId].call(
                module.exports,
                module,
                module.exports,
                __nccwpck_require__,
            )
            /******/ threw = false
            /******/
        } finally {
            /******/ if (threw) delete __webpack_module_cache__[moduleId]
            /******/
        } // Return the exports of the module
        /******/

        /******/ /******/ return module.exports
        /******/
    } /* webpack/runtime/compat */
    /******/

    /************************************************************************/
    /******/ /******/

    /******/ if (typeof __nccwpck_require__ !== "undefined")
        __nccwpck_require__.ab = __dirname + "/" // startup // Load entry module and return exports // This entry module is referenced by other modules so it can't be inlined
    /******/

    /************************************************************************/
    /******/

    /******/ /******/ /******/ /******/ var __webpack_exports__ = __nccwpck_require__(6144)
    /******/ module.exports = __webpack_exports__
    /******/
    /******/
})()
//# sourceMappingURL=index.js.map
