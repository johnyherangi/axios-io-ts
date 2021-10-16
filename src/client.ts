import axios, { AxiosRequestConfig, AxiosResponse } from "axios"
import { decode } from "./decode"
import { Client, RequestConfig } from "./types"

export const createClient = (config: AxiosRequestConfig): Client => {
    const axiosRequest = async <A>(request: RequestConfig<A>): Promise<AxiosResponse<A>> => {
        return await axios
            .request({
                ...config,
                ...request,
            })
            .then((response) => {
                if (request.decoder) {
                    decode(response.data, request.url, request.decoder)
                }
                return response as AxiosResponse<A>
            })
    }

    return {
        delete: async <A>(request: RequestConfig<A>) =>
            axiosRequest({
                ...request,
                method: "DELETE",
            }),
        get: async <A>(request: RequestConfig<A>) =>
            axiosRequest({
                ...request,
                method: "GET",
            }),
        options: async <A>(request: RequestConfig<A>) =>
            axiosRequest({
                ...request,
                method: "OPTIONS",
            }),
        patch: async <A>(request: RequestConfig<A>) =>
            axiosRequest({
                ...request,
                method: "PATCH",
            }),
        post: async <A>(request: RequestConfig<A>) =>
            axiosRequest({
                ...request,
                method: "POST",
            }),
        put: async <A>(request: RequestConfig<A>) =>
            axiosRequest({
                ...request,
                method: "PUT",
            }),
    }
}
