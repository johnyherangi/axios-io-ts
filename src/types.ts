import { AxiosRequestConfig, AxiosResponse } from "axios"
import * as t from "io-ts"

export interface DecodeError {
    url: string
    errors: string[]
}

export interface RequestConfig<A> extends AxiosRequestConfig {
    decoder?: t.Decoder<unknown, A>
    url: string
}

export interface Client {
    delete: <A = unknown>(config: RequestConfig<A>) => Promise<AxiosResponse<A>>
    get: <A = unknown>(config: RequestConfig<A>) => Promise<AxiosResponse<A>>
    options: <A = unknown>(config: RequestConfig<A>) => Promise<AxiosResponse<A>>
    post: <A = unknown>(config: RequestConfig<A>) => Promise<AxiosResponse<A>>
    patch: <A = unknown>(config: RequestConfig<A>) => Promise<AxiosResponse<A>>
    put: <A = unknown>(config: RequestConfig<A>) => Promise<AxiosResponse<A>>
}
