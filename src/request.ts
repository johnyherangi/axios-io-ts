import axios, { AxiosResponse } from "axios"
import * as t from "io-ts"
import { RequestConfig } from "src"
import { decode } from "./decode"

export const httpRequest = async <T extends t.Mixed, D = unknown>(
    config: RequestConfig<T, D>,
): Promise<AxiosResponse<t.TypeOf<T>, D>> => {
    return await axios.request(config).then((response) => {
        if (config.decoder) {
            decode(response.data, config.url, config.decoder)
        }
        return response as AxiosResponse<t.TypeOf<T>, D>
    })
}

export const httpDelete = async <T extends t.Mixed, D = unknown>(
    config: RequestConfig<T, D>,
): Promise<AxiosResponse<t.TypeOf<T>, D>> =>
    httpRequest({
        ...config,
        method: "DELETE",
    })

httpDelete({ url: "test" }).then()

export const httpGet = async <T extends t.Mixed, D = unknown>(
    config: RequestConfig<T, D>,
): Promise<AxiosResponse<t.TypeOf<T>, D>> =>
    httpRequest({
        ...config,
        method: "GET",
    })

export const httpOptions = async <T extends t.Mixed, D>(
    config: RequestConfig<T, D>,
): Promise<AxiosResponse<t.TypeOf<T>, D>> =>
    httpRequest({
        ...config,
        method: "OPTIONS",
    })

export const httpPatch = async <T extends t.Mixed, D = unknown>(
    config: RequestConfig<T, D>,
): Promise<AxiosResponse<t.TypeOf<T>, D>> =>
    httpRequest({
        ...config,
        method: "PATCH",
    })

export const httpPost = async <T extends t.Mixed, D = unknown>(
    config: RequestConfig<T, D>,
): Promise<AxiosResponse<t.TypeOf<T>, D>> =>
    httpRequest({
        ...config,
        method: "POST",
    })

export const httpPut = async <T extends t.Mixed, D = unknown>(
    config: RequestConfig<T, D>,
): Promise<AxiosResponse<t.TypeOf<T>, D>> =>
    httpRequest({
        ...config,
        method: "PUT",
    })
