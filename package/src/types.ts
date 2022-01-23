import { AxiosRequestConfig, AxiosResponse } from "axios"
import * as t from "io-ts"

export interface DecodeError {
    url: string
    errors: string[]
}

export interface HTTPRequestConfig<T extends t.Mixed, D> extends AxiosRequestConfig<D> {
    decoder?: T
    url: string
}

export interface HTTPClient {
    delete: <T extends t.Mixed, D = unknown>(
        config: HTTPRequestConfig<T, D>,
    ) => Promise<AxiosResponse<t.TypeOf<T>, D>>
    get: <T extends t.Mixed, D = unknown>(
        config: HTTPRequestConfig<T, D>,
    ) => Promise<AxiosResponse<t.TypeOf<T>, D>>
    head: <T extends t.Mixed, D = unknown>(
        config: HTTPRequestConfig<T, D>,
    ) => Promise<AxiosResponse<t.TypeOf<T>, D>>
    options: <T extends t.Mixed, D = unknown>(
        config: HTTPRequestConfig<T, D>,
    ) => Promise<AxiosResponse<t.TypeOf<T>, D>>
    post: <T extends t.Mixed, D = unknown>(
        config: HTTPRequestConfig<T, D>,
    ) => Promise<AxiosResponse<t.TypeOf<T>, D>>
    patch: <T extends t.Mixed, D = unknown>(
        config: HTTPRequestConfig<T, D>,
    ) => Promise<AxiosResponse<t.TypeOf<T>, D>>
    put: <T extends t.Mixed, D = unknown>(
        config: HTTPRequestConfig<T, D>,
    ) => Promise<AxiosResponse<t.TypeOf<T>, D>>
}

/**
 * @deprecated Use HTTPRequestConfig
 */
export type RequestConfig<T extends t.Mixed, D> = HTTPRequestConfig<T, D>

/**
 * @deprecated Use HTTPClient
 */
export type Client = HTTPClient
