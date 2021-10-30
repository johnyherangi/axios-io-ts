import { AxiosRequestConfig } from "axios"
import * as t from "io-ts"
import { httpHead } from "."
import { httpDelete, httpGet, httpOptions, httpPatch, httpPost, httpPut } from "./request"
import { HTTPClient, HTTPRequestConfig } from "./types"

export const httpClient = (config: AxiosRequestConfig): HTTPClient => {
    return {
        delete: async <T extends t.Mixed, D = unknown>(request: HTTPRequestConfig<T, D>) =>
            httpDelete({
                ...config,
                ...request,
            }),
        get: async <T extends t.Mixed, D = unknown>(request: HTTPRequestConfig<T, D>) =>
            httpGet({
                ...config,
                ...request,
            }),
        head: async <T extends t.Mixed, D = unknown>(request: HTTPRequestConfig<T, D>) =>
            httpHead({
                ...config,
                ...request,
            }),
        options: async <T extends t.Mixed, D = unknown>(request: HTTPRequestConfig<T, D>) =>
            httpOptions({
                ...config,
                ...request,
            }),
        patch: async <T extends t.Mixed, D = unknown>(request: HTTPRequestConfig<T, D>) =>
            httpPatch({
                ...config,
                ...request,
            }),
        post: async <T extends t.Mixed, D = unknown>(request: HTTPRequestConfig<T, D>) =>
            httpPost({
                ...config,
                ...request,
            }),
        put: async <T extends t.Mixed, D = unknown>(request: HTTPRequestConfig<T, D>) =>
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
