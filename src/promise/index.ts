import { httpClient } from "./client"
import { isDecodeError, onDecodeError } from "./error"
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

export * from "../types"
export * from "./client"
export * from "./error"
export * from "./request"

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
