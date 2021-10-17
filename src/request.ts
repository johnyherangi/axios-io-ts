import axios, { AxiosResponse } from "axios"
import { RequestConfig } from "src"
import { decode } from "./decode"

export const httpRequest = async <A>(config: RequestConfig<A>): Promise<AxiosResponse<A>> => {
    return await axios.request(config).then((response) => {
        if (config.decoder) {
            decode(response.data, config.url, config.decoder)
        }
        return response as AxiosResponse<A>
    })
}

export const httpDelete = async <A>(request: RequestConfig<A>) =>
    httpRequest({
        ...request,
        method: "DELETE",
    })

export const httpGet = async <A>(request: RequestConfig<A>) =>
    httpRequest({
        ...request,
        method: "GET",
    })

export const httpOptions = async <A>(request: RequestConfig<A>) =>
    httpRequest({
        ...request,
        method: "OPTIONS",
    })

export const httpPatch = async <A>(request: RequestConfig<A>) =>
    httpRequest({
        ...request,
        method: "PATCH",
    })

export const httpPost = async <A>(request: RequestConfig<A>) =>
    httpRequest({
        ...request,
        method: "POST",
    })

export const httpPut = async <A>(request: RequestConfig<A>) =>
    httpRequest({
        ...request,
        method: "PUT",
    })
