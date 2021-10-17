import { AxiosRequestConfig } from "axios"
import { httpDelete, httpGet, httpOptions, httpPatch, httpPost, httpPut } from "./request"
import { Client, RequestConfig } from "./types"

export const createClient = (config: AxiosRequestConfig): Client => {
    return {
        delete: async <A>(request: RequestConfig<A>) =>
            httpDelete({
                ...config,
                ...request,
            }),
        get: async <A>(request: RequestConfig<A>) =>
            httpGet({
                ...config,
                ...request,
            }),
        options: async <A>(request: RequestConfig<A>) =>
            httpOptions({
                ...config,
                ...request,
            }),
        patch: async <A>(request: RequestConfig<A>) =>
            httpPatch({
                ...config,
                ...request,
            }),
        post: async <A>(request: RequestConfig<A>) =>
            httpPost({
                ...config,
                ...request,
            }),
        put: async <A>(request: RequestConfig<A>) =>
            httpPut({
                ...config,
                ...request,
            }),
    }
}
