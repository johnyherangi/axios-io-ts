import { AxiosRequestConfig, AxiosResponse } from "axios"
import * as t from "io-ts"

export interface DecodeError {
    url: string
    errors: string[]
}

export interface RequestConfig<T, D> extends AxiosRequestConfig<D> {
    decoder?: t.Decoder<unknown, T>
    url: string
}

export interface Client {
    delete: <T = unknown, D = unknown>(config: RequestConfig<T, D>) => Promise<AxiosResponse<T, D>>
    get: <T = unknown, D = unknown>(config: RequestConfig<T, D>) => Promise<AxiosResponse<T, D>>
    options: <T = unknown, D = unknown>(config: RequestConfig<T, D>) => Promise<AxiosResponse<T, D>>
    post: <T = unknown, D = unknown>(config: RequestConfig<T, D>) => Promise<AxiosResponse<T, D>>
    patch: <T = unknown, D = unknown>(config: RequestConfig<T, D>) => Promise<AxiosResponse<T, D>>
    put: <T = unknown, D = unknown>(config: RequestConfig<T, D>) => Promise<AxiosResponse<T, D>>
}
