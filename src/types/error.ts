import { AxiosResponse } from "axios"

export interface DecodeError {
    type: "DecodeError"
    url: string
    errors: string[]
}

export interface ResponseError {
    type: "ResponseError"
    response: AxiosResponse
}

export interface RequestError {
    type: "RequestError"
    request: unknown
}

export interface CancelRequestError {
    type: "CancelRequestError"
}

export interface UnknownError {
    type: "UnknownError"
    error: unknown
}

export type ErrorType =
    | DecodeError
    | ResponseError
    | RequestError
    | CancelRequestError
    | UnknownError
