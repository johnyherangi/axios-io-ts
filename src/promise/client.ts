import { AxiosRequestConfig } from "axios"
import * as t from "io-ts"
import { httpHead } from "."
import { Client, RequestConfig } from "../types"
import { httpDelete, httpGet, httpOptions, httpPatch, httpPost, httpPut } from "./request"

export const httpClient = (config: AxiosRequestConfig): Client => {
    return {
        delete: async <T extends t.Mixed, D = unknown>(request: RequestConfig<T, D>) =>
            httpDelete({
                ...config,
                ...request,
            }),
        get: async <T extends t.Mixed, D = unknown>(request: RequestConfig<T, D>) =>
            httpGet({
                ...config,
                ...request,
            }),
        head: async <T extends t.Mixed, D = unknown>(request: RequestConfig<T, D>) =>
            httpHead({
                ...config,
                ...request,
            }),
        options: async <T extends t.Mixed, D = unknown>(request: RequestConfig<T, D>) =>
            httpOptions({
                ...config,
                ...request,
            }),
        patch: async <T extends t.Mixed, D = unknown>(request: RequestConfig<T, D>) =>
            httpPatch({
                ...config,
                ...request,
            }),
        post: async <T extends t.Mixed, D = unknown>(request: RequestConfig<T, D>) =>
            httpPost({
                ...config,
                ...request,
            }),
        put: async <T extends t.Mixed, D = unknown>(request: RequestConfig<T, D>) =>
            httpPut({
                ...config,
                ...request,
            }),
    }
}

/**
 * @deprecated Use httpClient()
 */
export const createClient = httpClient
