import { AxiosResponse } from "axios"
import * as t from "io-ts"
import { RequestConfig } from "./request"

export interface Client {
    delete: <T extends t.Mixed, D = unknown>(
        config: RequestConfig<T, D>,
    ) => Promise<AxiosResponse<t.TypeOf<T>, D>>
    get: <T extends t.Mixed, D = unknown>(
        config: RequestConfig<T, D>,
    ) => Promise<AxiosResponse<t.TypeOf<T>, D>>
    head: <T extends t.Mixed, D = unknown>(
        config: RequestConfig<T, D>,
    ) => Promise<AxiosResponse<t.TypeOf<T>, D>>
    options: <T extends t.Mixed, D = unknown>(
        config: RequestConfig<T, D>,
    ) => Promise<AxiosResponse<t.TypeOf<T>, D>>
    post: <T extends t.Mixed, D = unknown>(
        config: RequestConfig<T, D>,
    ) => Promise<AxiosResponse<t.TypeOf<T>, D>>
    patch: <T extends t.Mixed, D = unknown>(
        config: RequestConfig<T, D>,
    ) => Promise<AxiosResponse<t.TypeOf<T>, D>>
    put: <T extends t.Mixed, D = unknown>(
        config: RequestConfig<T, D>,
    ) => Promise<AxiosResponse<t.TypeOf<T>, D>>
}
