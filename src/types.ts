import { AxiosRequestConfig, AxiosResponse } from "axios"
import * as t from "io-ts"

export interface DecodeError {
    url: string
    errors: string[]
}

export interface RequestConfig<T extends t.Mixed, D> extends AxiosRequestConfig<D> {
    decoder?: T
    url: string
}

export interface Client {
    delete: <T extends t.Mixed, D = unknown>(
        config: RequestConfig<T, D>,
    ) => Promise<AxiosResponse<t.TypeOf<T>, D>>
    get: <T extends t.Mixed, D = unknown>(
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
