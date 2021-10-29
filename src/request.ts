import axios, { AxiosResponse } from "axios"
import * as t from "io-ts"
import { decode } from "./decode"
import { HTTPRequestConfig } from "./types"

export const httpRequest = async <T extends t.Mixed, D = unknown>(
    config: HTTPRequestConfig<T, D>,
): Promise<AxiosResponse<t.TypeOf<T>, D>> => {
    return await axios.request(config).then((response) => {
        if (config.decoder) {
            decode(response.data, config.url, config.decoder)
        }
        return response as AxiosResponse<t.TypeOf<T>, D>
    })
}

export const httpDelete = async <T extends t.Mixed, D = unknown>(
    config: HTTPRequestConfig<T, D>,
): Promise<AxiosResponse<t.TypeOf<T>, D>> =>
    httpRequest({
        ...config,
        method: "DELETE",
    })

export const httpGet = async <T extends t.Mixed, D = unknown>(
    config: HTTPRequestConfig<T, D>,
): Promise<AxiosResponse<t.TypeOf<T>, D>> =>
    httpRequest({
        ...config,
        method: "GET",
    })

export const httpOptions = async <T extends t.Mixed, D>(
    config: HTTPRequestConfig<T, D>,
): Promise<AxiosResponse<t.TypeOf<T>, D>> =>
    httpRequest({
        ...config,
        method: "OPTIONS",
    })

export const httpPatch = async <T extends t.Mixed, D = unknown>(
    config: HTTPRequestConfig<T, D>,
): Promise<AxiosResponse<t.TypeOf<T>, D>> =>
    httpRequest({
        ...config,
        method: "PATCH",
    })

export const httpPost = async <T extends t.Mixed, D = unknown>(
    config: HTTPRequestConfig<T, D>,
): Promise<AxiosResponse<t.TypeOf<T>, D>> =>
    httpRequest({
        ...config,
        method: "POST",
    })

export const httpPut = async <T extends t.Mixed, D = unknown>(
    config: HTTPRequestConfig<T, D>,
): Promise<AxiosResponse<t.TypeOf<T>, D>> =>
    httpRequest({
        ...config,
        method: "PUT",
    })
