import { AxiosRequestConfig } from "axios"
import * as t from "io-ts"
import { httpDelete, httpGet, httpOptions, httpPatch, httpPost, httpPut } from "./request"
import { Client, RequestConfig } from "./types"

export const createClient = (config: AxiosRequestConfig): Client => {
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
