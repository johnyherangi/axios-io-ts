import axios, { AxiosResponse } from "axios"
import * as E from "fp-ts/Either"
import { pipe } from "fp-ts/function"
import * as TE from "fp-ts/TaskEither"
import * as t from "io-ts"
import { toErrorType } from "../common/error"
import { ErrorType, RequestConfig } from "../types"
import { decode } from "./decode"

export const httpRequest = <T extends t.Mixed, D = unknown>(
    config: RequestConfig<T, D>,
): TE.TaskEither<ErrorType, AxiosResponse<t.TypeOf<T> | never, D>> => {
    return pipe(
        TE.tryCatch(
            () =>
                axios.request(config).then((response) => {
                    return config.decoder
                        ? decode(response, config.url, config.decoder)
                        : E.right(response as AxiosResponse<never, D>)
                }),
            toErrorType,
        ),
        TE.chain(TE.fromEither),
    )
}

export const httpDelete = <T extends t.Mixed, D = unknown>(
    config: RequestConfig<T, D>,
): TE.TaskEither<ErrorType, AxiosResponse<t.TypeOf<T> | never, D>> =>
    httpRequest({
        ...config,
        method: "DELETE",
    })

export const httpGet = <T extends t.Mixed, D = unknown>(
    config: RequestConfig<T, D>,
): TE.TaskEither<ErrorType, AxiosResponse<t.TypeOf<T> | never, D>> =>
    httpRequest({
        ...config,
        method: "GET",
    })

export const httpHead = <T extends t.Mixed, D = unknown>(
    config: RequestConfig<T, D>,
): TE.TaskEither<ErrorType, AxiosResponse<t.TypeOf<T> | unknown, D>> =>
    httpRequest({
        ...config,
        method: "HEAD",
    })

export const httpOptions = <T extends t.Mixed, D = unknown>(
    config: RequestConfig<T, D>,
): TE.TaskEither<ErrorType, AxiosResponse<t.TypeOf<T> | never, D>> =>
    httpRequest({
        ...config,
        method: "OPTIONS",
    })

export const httpPatch = <T extends t.Mixed, D = unknown>(
    config: RequestConfig<T, D>,
): TE.TaskEither<ErrorType, AxiosResponse<t.TypeOf<T> | never, D>> =>
    httpRequest({
        ...config,
        method: "PATCH",
    })

export const httpPost = <T extends t.Mixed, D = unknown>(
    config: RequestConfig<T, D>,
): TE.TaskEither<ErrorType, AxiosResponse<t.TypeOf<T> | never, D>> =>
    httpRequest({
        ...config,
        method: "POST",
    })

export const httpPut = <T extends t.Mixed, D = unknown>(
    config: RequestConfig<T, D>,
): TE.TaskEither<ErrorType, AxiosResponse<t.TypeOf<T> | never, D>> =>
    httpRequest({
        ...config,
        method: "PUT",
    })

const response = httpGet({ url: "test" })().then((res) => {
    if (E.isRight(res)) {
        res.right.data
    }
})
