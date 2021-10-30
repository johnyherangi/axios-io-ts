import { httpClient } from "./client"
import {
    httpDelete,
    httpGet,
    httpHead,
    httpOptions,
    httpPatch,
    httpPost,
    httpPut,
    httpRequest,
} from "./request"
import { isDecodeError, onDecodeError } from "./typeGuards"

export * from "./client"
export * from "./request"
export * from "./typeGuards"
export * from "./types"

const axios = {
    create: httpClient,
    delete: httpDelete,
    get: httpGet,
    head: httpHead,
    isDecodeError,
    onDecodeError,
    options: httpOptions,
    patch: httpPatch,
    post: httpPost,
    put: httpPut,
    request: httpRequest,
}

export default axios
