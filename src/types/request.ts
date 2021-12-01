import { AxiosRequestConfig } from "axios"
import * as t from "io-ts"

export interface RequestConfig<T extends t.Mixed, D> extends AxiosRequestConfig<D> {
    decoder?: T
    url: string
}
