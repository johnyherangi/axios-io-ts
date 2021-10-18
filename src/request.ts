import axios, { AxiosResponse } from "axios"
import { RequestConfig } from "src"
import { decode } from "./decode"

export const httpRequest = async <T, D>(
    config: RequestConfig<T, D>,
): Promise<AxiosResponse<T, D>> => {
    return await axios.request(config).then((response) => {
        if (config.decoder) {
            decode(response.data, config.url, config.decoder)
        }
        return response as AxiosResponse<T, D>
    })
}

export const httpDelete = async <T = unknown, D = unknown>(
    config: RequestConfig<T, D>,
): Promise<AxiosResponse<T, D>> =>
    httpRequest({
        ...config,
        method: "DELETE",
    })

export const httpGet = async <T = unknown, D = unknown>(
    config: RequestConfig<T, D>,
): Promise<AxiosResponse<T, D>> =>
    httpRequest({
        ...config,
        method: "GET",
    })

export const httpOptions = async <T, D>(
    config: RequestConfig<T, D>,
): Promise<AxiosResponse<T, D>> =>
    httpRequest({
        ...config,
        method: "OPTIONS",
    })

export const httpPatch = async <T = unknown, D = unknown>(
    config: RequestConfig<T, D>,
): Promise<AxiosResponse<T, D>> =>
    httpRequest({
        ...config,
        method: "PATCH",
    })

export const httpPost = async <T = unknown, D = unknown>(
    config: RequestConfig<T, D>,
): Promise<AxiosResponse<T, D>> =>
    httpRequest({
        ...config,
        method: "POST",
    })

export const httpPut = async <T = unknown, D = unknown>(
    config: RequestConfig<T, D>,
): Promise<AxiosResponse<T, D>> =>
    httpRequest({
        ...config,
        method: "PUT",
    })
